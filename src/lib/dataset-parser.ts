import * as XLSX from "xlsx";

import type {DataField, DatasetRow} from "@/lib/editor-storage";

export type ParsedDataset = {
  name: string;
  source: "csv" | "xlsx" | "json";
  fields: DataField[];
  rows: DatasetRow[];
  records: string;
  columns: string;
};

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "json") {
    const text = await file.text();
    return parseJsonDataset(file.name, text);
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    return parseWorkbookDataset(file.name, buffer, "xlsx");
  }

  if (extension === "csv") {
    const text = await file.text();
    return parseCsvDataset(file.name, text);
  }

  throw new Error(`Unsupported file type: ${extension ?? "unknown"}`);
}

function parseJsonDataset(fileName: string, text: string): ParsedDataset {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
  if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== "object") {
    throw new Error("JSON file must contain an array of records.");
  }

  return buildDataset(fileName, "json", normalizeRows(rows));
}

function parseWorkbookDataset(fileName: string, buffer: ArrayBuffer, source: "xlsx"): ParsedDataset {
  const workbook = XLSX.read(buffer, {type: "array"});
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {defval: ""});
  return buildDataset(fileName, source, normalizeRows(rows));
}

function parseCsvDataset(fileName: string, text: string): ParsedDataset {
  const workbook = XLSX.read(text, {type: "string"});
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {defval: ""});
  return buildDataset(fileName, "csv", normalizeRows(rows));
}

function buildDataset(fileName: string, source: ParsedDataset["source"], rows: DatasetRow[]): ParsedDataset {
  if (!rows.length) {
    throw new Error("The file did not contain any rows.");
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
  };
}

function normalizeRows(rows: Record<string, unknown>[]): DatasetRow[] {
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
      ),
    );
}

function normalizeValue(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (value == null) return "";
  return String(value);
}

function inferFieldType(rows: DatasetRow[], field: string): DataField["type"] {
  const samples = rows
    .map((row) => row[field])
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .slice(0, 8);

  if (!samples.length) return "Text";

  const allNumeric = samples.every((value) =>
    typeof value === "number" || Number.isFinite(Number(String(value).replace(/[^\d.-]/g, ""))),
  );
  if (allNumeric) return "Numeric";

  const allDateLike = samples.every((value) => !Number.isNaN(Date.parse(String(value))));
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
