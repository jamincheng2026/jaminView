import type {DataField, DatasetRow} from "@/lib/editor-storage";

/**
 * 数据导入解析器。
 *
 * 安全/性能边界（M0 商用化）：
 * - 文件 ≤ 5MB（拒绝 OOM 上传）
 * - 行数 ≤ 10k（一次性解析至完整数组，超出截断并提示）
 * - xlsx 走 exceljs 动态 import（避开 SheetJS 已知原型污染 CVE，且不进 main chunk）
 * - csv 走纯 JS 状态机解析（不依赖 xlsx）
 * - json 拒绝 prototype 关键键（__proto__/constructor/prototype）
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 10000;
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export type ParsedDataset = {
  name: string;
  source: "csv" | "xlsx" | "json";
  fields: DataField[];
  rows: DatasetRow[];
  records: string;
  columns: string;
  truncated: boolean;
};

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`文件超过 ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB 上限，请先在源端筛选后再导入。`);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "json") {
    const text = await file.text();
    return parseJsonDataset(file.name, text);
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    return parseWorkbookDataset(file.name, buffer);
  }

  if (extension === "csv") {
    const text = await file.text();
    return parseCsvDataset(file.name, text);
  }

  throw new Error(`暂不支持的文件类型：${extension ?? "unknown"}`);
}

function parseJsonDataset(fileName: string, text: string): ParsedDataset {
  const parsed = JSON.parse(text) as unknown;
  const rawRows = Array.isArray(parsed)
    ? parsed
    : isPlainObject(parsed) && Array.isArray((parsed as Record<string, unknown>).data)
      ? ((parsed as Record<string, unknown>).data as unknown[])
      : [];

  if (!Array.isArray(rawRows) || rawRows.length === 0 || !isPlainObject(rawRows[0])) {
    throw new Error("JSON 文件必须是对象数组或包含 data 数组的根对象。");
  }

  return buildDataset(fileName, "json", normalizeRows(rawRows as Record<string, unknown>[]));
}

async function parseWorkbookDataset(fileName: string, buffer: ArrayBuffer): Promise<ParsedDataset> {
  // 动态加载 exceljs：~1.5MB，不进 main chunk
  const {default: ExcelJS} = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("xlsx 文件里没有可读取的工作表。");
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({includeEmpty: true}, (cell, colNumber) => {
    headers[colNumber - 1] = normalizeCellValue(cell.value).toString();
  });

  if (headers.length === 0 || headers.every((header) => !header)) {
    throw new Error("xlsx 第一行必须是表头。");
  }

  const rows: Record<string, unknown>[] = [];
  let truncated = false;

  sheet.eachRow({includeEmpty: false}, (row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rows.length >= MAX_ROWS) {
      truncated = true;
      return;
    }

    const record: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      if (!header || FORBIDDEN_KEYS.has(header)) return;
      const cell = row.getCell(idx + 1);
      record[header] = normalizeCellValue(cell.value);
    });
    rows.push(record);
  });

  if (rows.length === 0) {
    throw new Error("xlsx 文件里没有数据行。");
  }

  const dataset = buildDataset(fileName, "xlsx", normalizeRows(rows));
  dataset.truncated = truncated;
  return dataset;
}

function parseCsvDataset(fileName: string, text: string): ParsedDataset {
  const rows = parseCsvText(text);
  if (rows.length === 0) {
    throw new Error("CSV 文件里没有可解析的数据行。");
  }

  return buildDataset(fileName, "csv", normalizeRows(rows));
}

function parseCsvText(text: string): Record<string, unknown>[] {
  const parsedRows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === "\"") {
        if (text[i + 1] === "\"") {
          field += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === "\"") {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      current.push(field);
      field = "";
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      current.push(field);
      field = "";
      if (current.length > 0 && current.some((cell) => cell !== "")) {
        parsedRows.push(current);
      }
      current = [];
      if (parsedRows.length > MAX_ROWS) {
        break;
      }
      continue;
    }

    field += ch;
  }

  if (field !== "" || current.length > 0) {
    current.push(field);
    if (current.some((cell) => cell !== "")) {
      parsedRows.push(current);
    }
  }

  if (parsedRows.length < 2) {
    return [];
  }

  const headers = parsedRows[0].map((header) => header.trim());
  const dataRows = parsedRows.slice(1, MAX_ROWS + 1);

  return dataRows.map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      if (!header || FORBIDDEN_KEYS.has(header)) return;
      record[header] = cells[idx] ?? "";
    });
    return record;
  });
}

function buildDataset(
  fileName: string,
  source: ParsedDataset["source"],
  rows: DatasetRow[],
): ParsedDataset {
  if (!rows.length) {
    throw new Error("文件解析后没有行数据。");
  }

  const firstRow = rows[0];
  const fields = Object.keys(firstRow).map((field) => {
    const sample = String(firstRow[field] ?? "");
    const type = inferFieldType(rows, field);
    return {
      field,
      type,
      sample,
      icon: fieldIcon(type),
    };
  });

  return {
    name: fileName.replace(/\.[^/.]+$/, ""),
    source,
    fields,
    rows,
    records: String(rows.length),
    columns: String(fields.length),
    truncated: false,
  };
}

function normalizeRows(rows: Record<string, unknown>[]): DatasetRow[] {
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const entries: Array<[string, string | number]> = [];
      for (const [key, value] of Object.entries(row)) {
        if (FORBIDDEN_KEYS.has(key)) continue;
        entries.push([key, normalizeValue(value)]);
      }
      return Object.fromEntries(entries);
    });
}

function normalizeValue(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if (value == null) return "";
  if (typeof value === "string") return value;
  return normalizeCellValue(value as never).toString();
}

/**
 * 把 exceljs 的 CellValue 收敛为 string | number。
 * 富文本取拼接的纯文本；公式取 result；超链接取 text；null 返回空串。
 */
function normalizeCellValue(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if (isPlainObject(value)) {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((segment) => (isPlainObject(segment) ? String((segment as Record<string, unknown>).text ?? "") : ""))
        .join("");
    }
    if ("result" in record) {
      return normalizeCellValue(record.result);
    }
    if ("text" in record) {
      return String(record.text);
    }
    if ("hyperlink" in record) {
      return String(record.hyperlink);
    }
  }
  return String(value);
}

function inferFieldType(rows: DatasetRow[], field: string): DataField["type"] {
  const samples = rows
    .map((row) => row[field])
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .slice(0, 16);

  if (!samples.length) return "Text";

  const allNumeric = samples.every((value) =>
    typeof value === "number"
    || (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())),
  );
  if (allNumeric) return "Numeric";

  const allDateLike = samples.every((value) => {
    if (typeof value === "number") return false;
    const text = String(value).trim();
    if (!/[-:/T]/.test(text)) return false;
    return !Number.isNaN(Date.parse(text));
  });
  if (allDateLike) return "Date / Time";

  const uniqueCount = new Set(samples.map((value) => String(value))).size;
  if (uniqueCount <= Math.max(4, Math.ceil(samples.length * 0.6))) return "Category";

  return "Text";
}

function fieldIcon(type: DataField["type"]) {
  if (type === "Numeric") return "#";
  if (type === "Category") return "◫";
  if (type === "Date / Time") return "◷";
  return "Aa";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
