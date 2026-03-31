import type {DataField, DatasetRow, DatasetRowValue} from "@/lib/editor-storage";

type FieldAliasMap = Record<string, string>;

export type WidgetDataset = {
  fields: DataField[];
  rows: DatasetRow[];
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

export function tableSnapshot(dataset: WidgetDataset | undefined) {
  if (!dataset) return {columns: [], rows: [] as DatasetRow[]};
  return {
    columns: dataset.fields.slice(0, 5).map((field) => field.field),
    rows: dataset.rows.slice(0, 4),
  };
}

export function eventSnapshot(dataset: WidgetDataset | undefined) {
  if (!dataset?.rows.length) return [];

  const titleField = firstTextField(dataset) ?? firstCategoryField(dataset) ?? dataset.fields[0]?.field;
  const metaField = firstDateField(dataset) ?? firstCategoryField(dataset) ?? dataset.fields[1]?.field;

  if (!titleField) return [];

  return dataset.rows.slice(0, 3).map((row, index) => ({
    title: String(row[titleField] ?? `Event ${index + 1}`),
    meta: metaField ? String(row[metaField] ?? "") : "",
  }));
}

function hasField(dataset: WidgetDataset, fieldName: string) {
  return dataset.fields.some((field) => field.field === fieldName) || dataset.rows.some((row) => fieldName in row);
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
