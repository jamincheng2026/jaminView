import type {DataField, DatasetRow, DatasetRowValue} from "@/lib/editor-storage";
import type {EditorWidget} from "@/lib/mocks/editor";

type FieldAliasMap = Record<string, string>;

export type WidgetDataset = {
  fields: DataField[];
  rows: DatasetRow[];
};

export type MapPointSnapshot = {
  id: string;
  label: string;
  lon: number;
  lat: number;
  value: number;
  intensity: number;
};

export type MapRouteSnapshot = {
  id: string;
  from: MapPointSnapshot;
  to: MapPointSnapshot;
  intensity: number;
  dashed: boolean;
};

export type ManualSeriesDatum = {
  label: string;
  value: number;
};

export type ManualMetricDatum = {
  value: string;
  hint?: string;
};

export type ManualWidgetDataParseResult =
  | {valid: false; error: string}
  | {
      valid: true;
      metric?: ManualMetricDatum;
      series?: ManualSeriesDatum[];
      rows?: DatasetRow[];
    };

export function parseFieldMap(fieldMap?: string): FieldAliasMap {
  if (!fieldMap?.trim()) return {};

  return Object.fromEntries(
    fieldMap
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [left, right] = line.split("->").map((part) => part.trim());
        return right ? [right, left] : [left, left];
      }),
  );
}

export function resolveFieldName(dataset: WidgetDataset | undefined, fieldMap: string | undefined, alias: string) {
  if (!dataset) return undefined;
  const aliases = parseFieldMap(fieldMap);
  const mapped = aliases[alias];
  if (mapped && hasField(dataset, mapped)) return mapped;

  if (hasField(dataset, alias)) return alias;

  return undefined;
}

export function firstFieldByType(dataset: WidgetDataset | undefined, type: string) {
  return dataset?.fields.find((field) => field.type === type)?.field;
}

export function firstNumericField(dataset: WidgetDataset | undefined) {
  return dataset?.fields.find((field) => field.type === "Numeric")?.field;
}

export function firstCategoryField(dataset: WidgetDataset | undefined) {
  return dataset?.fields.find((field) => field.type === "Category")?.field;
}

export function firstDateField(dataset: WidgetDataset | undefined) {
  return dataset?.fields.find((field) => field.type === "Date / Time")?.field;
}

export function firstTextField(dataset: WidgetDataset | undefined) {
  return dataset?.fields.find((field) => field.type === "Text")?.field;
}

export function metricSnapshot(dataset: WidgetDataset | undefined, fieldMap?: string) {
  if (!dataset?.rows.length) return {value: "0", hint: "--"};

  const valueField =
    resolveFieldName(dataset, fieldMap, "value") ??
    resolveFieldName(dataset, fieldMap, "metric") ??
    firstNumericField(dataset);
  const secondaryField =
    resolveFieldName(dataset, fieldMap, "status") ??
    resolveFieldName(dataset, fieldMap, "label") ??
    firstTextField(dataset) ??
    firstCategoryField(dataset);

  if (!valueField) return {value: "0", hint: "--"};

  const numericValues = dataset.rows.map((row) => toNumber(row[valueField])).filter((value): value is number => value !== null);
  const value = numericValues.length ? formatMetricValue(numericValues[numericValues.length - 1]) : String(dataset.rows[0]?.[valueField] ?? "0");
  const hintValue = secondaryField ? String(dataset.rows[0]?.[secondaryField] ?? "--") : `${dataset.rows.length} rows`;

  return {value, hint: hintValue};
}

export function lineSeries(dataset: WidgetDataset | undefined, fieldMap?: string) {
  if (!dataset?.rows.length) return [];

  const xField =
    resolveFieldName(dataset, fieldMap, "month") ??
    resolveFieldName(dataset, fieldMap, "timestamp") ??
    firstDateField(dataset) ??
    firstCategoryField(dataset);
  const yField =
    resolveFieldName(dataset, fieldMap, "value") ??
    resolveFieldName(dataset, fieldMap, "metric") ??
    firstNumericField(dataset);

  if (!xField || !yField) return [];

  return dataset.rows.slice(0, 7).map((row, index) => ({
    label: compactLabel(String(row[xField] ?? `Item ${index + 1}`)),
    value: toNumber(row[yField]) ?? index + 1,
  }));
}

export function categoricalSeries(dataset: WidgetDataset | undefined, fieldMap?: string) {
  if (!dataset?.rows.length) return [];

  const categoryField =
    resolveFieldName(dataset, fieldMap, "label") ??
    resolveFieldName(dataset, fieldMap, "category") ??
    firstCategoryField(dataset) ??
    firstTextField(dataset);
  const valueField =
    resolveFieldName(dataset, fieldMap, "value") ??
    resolveFieldName(dataset, fieldMap, "metric") ??
    firstNumericField(dataset);

  if (!categoryField || !valueField) return [];

  return dataset.rows.slice(0, 6).map((row, index) => ({
    label: compactLabel(String(row[categoryField] ?? `Item ${index + 1}`)),
    value: toNumber(row[valueField]) ?? index + 1,
  }));
}

export function tableSnapshot(
  dataset: WidgetDataset | undefined,
  options?: {
    columns?: string[];
    labels?: Record<string, string>;
    widths?: Record<string, number>;
  },
) {
  if (!dataset) return {columns: [] as Array<{key: string; label: string; width?: number}>, rows: [] as DatasetRow[]};
  const requestedColumns = options?.columns?.filter((column) =>
    dataset.fields.some((field) => field.field === column) || dataset.rows.some((row) => column in row),
  );
  const columnKeys = requestedColumns?.length
    ? requestedColumns
    : dataset.fields.slice(0, 5).map((field) => field.field);

  return {
    columns: columnKeys.map((field) => ({
      key: field,
      label: options?.labels?.[field]?.trim() || field,
      width: options?.widths?.[field],
    })),
    rows: dataset.rows.slice(0, 4),
  };
}

export function eventSnapshot(dataset: WidgetDataset | undefined, fieldMap?: string) {
  if (!dataset?.rows.length) return [];

  const titleField =
    resolveFieldName(dataset, fieldMap, "title") ??
    resolveFieldName(dataset, fieldMap, "label") ??
    firstTextField(dataset) ??
    firstCategoryField(dataset) ??
    dataset.fields[0]?.field;
  const metaField =
    resolveFieldName(dataset, fieldMap, "meta") ??
    resolveFieldName(dataset, fieldMap, "timestamp") ??
    firstDateField(dataset) ??
    firstCategoryField(dataset) ??
    dataset.fields[1]?.field;

  if (!titleField) return [];

  return dataset.rows.slice(0, 3).map((row, index) => ({
    title: String(row[titleField] ?? `Event ${index + 1}`),
    meta: metaField ? String(row[metaField] ?? "") : "",
  }));
}

export function inferFieldsFromRows(rows: DatasetRow[]): DataField[] {
  const firstRow = rows[0];
  if (!firstRow) return [];

  return Object.keys(firstRow).map((field) => {
    const sampleValue = rows.find((row) => row[field] !== undefined)?.[field];
    const type = inferValueType(sampleValue);
    return {
      field,
      type,
      sample: String(sampleValue ?? ""),
      icon: fieldIconForType(type),
    };
  });
}

export function tableSnapshotFromRows(
  rows: DatasetRow[],
  options?: {
    columns?: string[];
    labels?: Record<string, string>;
    widths?: Record<string, number>;
  },
) {
  return tableSnapshot(
    {
      fields: inferFieldsFromRows(rows),
      rows,
    },
    options,
  );
}

export function eventSnapshotFromRows(rows: DatasetRow[], fieldMap?: string) {
  return eventSnapshot(
    {
      fields: inferFieldsFromRows(rows),
      rows,
    },
    fieldMap,
  );
}

export function mapSnapshot(dataset: WidgetDataset | undefined, fieldMap?: string) {
  const fallbackPoints = defaultMapPoints;

  if (!dataset?.rows.length) {
    return {
      points: fallbackPoints,
      routes: buildMapRoutes(fallbackPoints),
    };
  }

  const labelField =
    resolveFieldName(dataset, fieldMap, "label") ??
    resolveFieldName(dataset, fieldMap, "region") ??
    firstTextField(dataset) ??
    firstCategoryField(dataset);
  const regionField =
    resolveFieldName(dataset, fieldMap, "region") ??
    resolveFieldName(dataset, fieldMap, "category") ??
    firstCategoryField(dataset) ??
    firstTextField(dataset);
  const valueField =
    resolveFieldName(dataset, fieldMap, "value") ??
    resolveFieldName(dataset, fieldMap, "metric") ??
    firstNumericField(dataset);
  const latitudeField = resolveFieldName(dataset, fieldMap, "latitude");
  const longitudeField = resolveFieldName(dataset, fieldMap, "longitude");

  const rawPoints = dataset.rows
    .slice(0, 6)
    .map((row, index) => {
      // Prefer explicit latitude/longitude bindings when available. Otherwise
      // fall back to region keyword matching so imported business datasets can
      // still drive the map without requiring geo coordinates in V1.
      const label = String(row[labelField ?? regionField ?? dataset.fields[0]?.field ?? ""] ?? `Node ${index + 1}`);
      const metric = valueField ? toNumber(row[valueField]) ?? index + 1 : index + 1;
      const lat = latitudeField ? toNumber(row[latitudeField]) : null;
      const lon = longitudeField ? toNumber(row[longitudeField]) : null;

      if (lat !== null && lon !== null) {
        return {
          id: `${label}-${index}`,
          label: compactLabel(label),
          lon,
          lat,
          value: metric,
        };
      }

      const mappedRegion = geoLookupFromText(String(row[regionField ?? labelField ?? ""] ?? label));
      if (!mappedRegion) return null;

      return {
        id: `${mappedRegion.id}-${index}`,
        label: mappedRegion.label,
        lon: mappedRegion.lon,
        lat: mappedRegion.lat,
        value: metric,
      };
    })
    .filter((point): point is {id: string; label: string; lon: number; lat: number; value: number} => Boolean(point));

  const points = (rawPoints.length ? rawPoints : fallbackPoints).map((point) => ({
    ...point,
    intensity: normalizeIntensity(point.value, rawPoints.length ? rawPoints : fallbackPoints),
  }));

  return {
    points,
    routes: buildMapRoutes(points),
  };
}

export function parseManualWidgetData(
  widget: Pick<EditorWidget, "type" | "dataSourceMode" | "manualData">,
): ManualWidgetDataParseResult | null {
  if (widget.dataSourceMode !== "manual") return null;

  const source = widget.manualData?.trim();
  if (!source) {
    return {
      valid: false,
      error: "请填写合法 JSON 数据",
    };
  }

  try {
    const parsed = JSON.parse(source) as unknown;

    if (widget.type === "metric") {
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        return {
          valid: false,
          error: "指标卡需要对象格式，例如 {\"value\":1280,\"hint\":\"较上周 +12%\"}",
        };
      }

      const value = (parsed as Record<string, unknown>).value;
      if (typeof value !== "string" && typeof value !== "number") {
        return {
          valid: false,
          error: "指标卡 JSON 需要 value 字段，且值必须是数字或文本",
        };
      }

      const hint = (parsed as Record<string, unknown>).hint;
      return {
        valid: true,
        metric: {
          value: String(value),
          hint: typeof hint === "string" ? hint : undefined,
        },
      };
    }

    if (widget.type === "line" || widget.type === "area" || widget.type === "bar" || widget.type === "pie" || widget.type === "rank") {
      if (!Array.isArray(parsed)) {
        return {
          valid: false,
          error: "图表 JSON 需要数组格式，例如 [{\"label\":\"Jan\",\"value\":120}]",
        };
      }

      const series = parsed.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          throw new Error(`第 ${index + 1} 项必须是对象`);
        }

        const label = (entry as Record<string, unknown>).label;
        const value = (entry as Record<string, unknown>).value;
        const numericValue =
          typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number(value)
              : NaN;

        if (typeof label !== "string" || !Number.isFinite(numericValue)) {
          throw new Error(`第 ${index + 1} 项需要包含 label(string) 和 value(number)`);
        }

        return {
          label,
          value: numericValue,
        };
      });

      if (!series.length) {
        return {
          valid: false,
          error: "图表数组不能为空",
        };
      }

      return {
        valid: true,
        series,
      };
    }

    if (widget.type === "table" || widget.type === "events") {
      if (!Array.isArray(parsed) || parsed.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
        return {
          valid: false,
          error: "表格或事件列表 JSON 需要对象数组格式",
        };
      }

      return {
        valid: true,
        rows: parsed as DatasetRow[],
      };
    }

    return {
      valid: false,
      error: "当前组件暂不支持手动 JSON 数据",
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "JSON 解析失败",
    };
  }
}

function hasField(dataset: WidgetDataset, fieldName: string) {
  return dataset.fields.some((field) => field.field === fieldName) || dataset.rows.some((row) => fieldName in row);
}

function inferValueType(value: DatasetRowValue | undefined) {
  if (typeof value === "number") return "Numeric";
  if (typeof value === "string") {
    const asNumber = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(asNumber) && value.trim() !== "") return "Numeric";
    if (!Number.isNaN(Date.parse(value))) return "Date / Time";
    return "Text";
  }
  return "Text";
}

function fieldIconForType(type: string) {
  if (type === "Numeric") return "#";
  if (type === "Date / Time") return "◴";
  if (type === "Category") return "▣";
  return "Aa";
}

function toNumber(value: DatasetRowValue | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function compactLabel(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 10)}…`;
}

function formatMetricValue(value: number) {
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function buildMapRoutes(points: MapPointSnapshot[]): MapRouteSnapshot[] {
  if (points.length <= 1) return [];

  const hub = points[0];
  const remaining = points.slice(1);

  return remaining.map((point, index) => ({
    id: `${hub.id}-${point.id}`,
    from: hub,
    to: point,
    intensity: clamp((hub.intensity + point.intensity) / 2, 0.24, 1),
    dashed: index % 2 === 1,
  }));
}

function geoLookupFromText(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const match = geoAliasTable.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  return match
    ? {
        id: match.id,
        label: match.label,
        lon: match.lon,
        lat: match.lat,
      }
    : null;
}

function normalizeIntensity(value: number, collection: Array<{value: number}>) {
  const values = collection.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return 0.66;
  return clamp((value - min) / (max - min), 0.22, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const geoAliasTable = [
  {id: "vancouver", label: "Vancouver", lon: -123.1207, lat: 49.2827, keywords: ["vancouver", "pacific", "west", "west coast"]},
  {id: "long-beach", label: "Long Beach", lon: -118.1937, lat: 33.7701, keywords: ["long beach", "los angeles", "west us"]},
  {id: "rotterdam", label: "Rotterdam", lon: 4.47917, lat: 51.9225, keywords: ["rotterdam", "europe", "eu", "north sea"]},
  {id: "hamburg", label: "Hamburg", lon: 9.9937, lat: 53.5511, keywords: ["hamburg", "north", "northern", "europe north"]},
  {id: "dubai", label: "Dubai", lon: 55.2708, lat: 25.2048, keywords: ["dubai", "middle east", "gcc"]},
  {id: "mumbai", label: "Mumbai", lon: 72.8777, lat: 19.076, keywords: ["mumbai", "india", "south asia"]},
  {id: "singapore", label: "Singapore", lon: 103.8198, lat: 1.3521, keywords: ["singapore", "south-east", "southeast", "sea"]},
  {id: "shanghai", label: "Shanghai", lon: 121.4737, lat: 31.2304, keywords: ["shanghai", "east", "china", "asia east"]},
  {id: "tokyo", label: "Tokyo", lon: 139.6917, lat: 35.6895, keywords: ["tokyo", "japan", "far east"]},
];

const defaultMapPoints: MapPointSnapshot[] = [
  {id: "hamburg", label: "Hamburg", lon: 9.9937, lat: 53.5511, value: 84, intensity: 0.92},
  {id: "rotterdam", label: "Rotterdam", lon: 4.47917, lat: 51.9225, value: 73, intensity: 0.8},
  {id: "singapore", label: "Singapore", lon: 103.8198, lat: 1.3521, value: 91, intensity: 1},
  {id: "shanghai", label: "Shanghai", lon: 121.4737, lat: 31.2304, value: 67, intensity: 0.74},
  {id: "long-beach", label: "Long Beach", lon: -118.1937, lat: 33.7701, value: 59, intensity: 0.6},
];
