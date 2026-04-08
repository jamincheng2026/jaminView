"use client";

import {
  categoricalSeries,
  eventSnapshot,
  eventSnapshotFromRows,
  inferFieldsFromRows,
  lineSeries,
  mapSnapshot,
  metricSnapshot,
  parseManualWidgetData,
  processEventSnapshotRows,
  processMapSnapshotData,
  processSeriesSnapshot,
  processTableSnapshotData,
  tableSnapshot,
  tableSnapshotFromRows,
  type WidgetDataset,
} from "@/lib/editor-widget-data";
import type {EditorWidget} from "@/lib/mocks/editor";

type EventConditionAwareWidget = Pick<
  EditorWidget,
  | "type"
  | "id"
  | "fieldMap"
  | "dataSourceMode"
  | "manualData"
  | "tableColumns"
  | "tableColumnLabels"
  | "tableColumnWidths"
  | "dataFilterField"
  | "dataFilterOperator"
  | "dataFilterValue"
  | "dataSortField"
  | "dataSortDirection"
  | "dataLimit"
  | "dataAggregateMode"
  | "dataTruncateLength"
  | "eventAction"
  | "eventUrl"
  | "eventTargetWidgetId"
  | "eventTargetWidgetIds"
  | "eventConditionField"
  | "eventConditionOperator"
  | "eventConditionValue"
>;

export function resolveWidgetEventHref(widget: EditorWidget, locale: string, projectId: string) {
  if (widget.eventAction === "openPreview") return `/${locale}/preview/${projectId}`;
  if (widget.eventAction === "openPublished") return `/${locale}/screen/${projectId}`;
  if (widget.eventAction === "openLink") return widget.eventUrl?.trim() || null;
  return null;
}

export function resolveWidgetFocusTargets(widget: EventConditionAwareWidget) {
  if (widget.eventAction !== "focusWidget") return [];
  const targets = widget.eventTargetWidgetIds?.filter(Boolean) ?? [];
  if (targets.length) return Array.from(new Set(targets));
  return [widget.eventTargetWidgetId || widget.id].filter(Boolean);
}

export function hasWidgetRuntimeAction(widget: EditorWidget, locale: string, projectId: string) {
  return Boolean(resolveWidgetFocusTargets(widget).length || resolveWidgetEventHref(widget, locale, projectId));
}

export function shouldTriggerWidgetEvent(widget: EventConditionAwareWidget, dataset?: WidgetDataset) {
  const field = widget.eventConditionField?.trim();
  const expected = widget.eventConditionValue?.trim();
  if (!field || !expected) return true;

  const actual = resolveWidgetEventConditionValue(widget, dataset);
  const operator = widget.eventConditionOperator ?? "contains";

  if (operator === "contains") {
    return String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
  }

  const actualNumber = parseNumericValue(actual);
  const expectedNumber = parseNumericValue(expected);

  if (operator === "equals") {
    if (actualNumber !== null && expectedNumber !== null) return actualNumber === expectedNumber;
    return String(actual ?? "").trim().toLowerCase() === expected.toLowerCase();
  }

  if (actualNumber === null || expectedNumber === null) return false;
  if (operator === "gt") return actualNumber > expectedNumber;
  if (operator === "gte") return actualNumber >= expectedNumber;
  if (operator === "lt") return actualNumber < expectedNumber;
  return actualNumber <= expectedNumber;
}

export function isExternalWidgetHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function resolveWidgetEventConditionValue(widget: EventConditionAwareWidget, dataset?: WidgetDataset) {
  const field = widget.eventConditionField?.trim();
  if (!field) return undefined;

  if (widget.type === "metric" || widget.type === "numberFlip") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const data = manualData?.valid && manualData.metric ? manualData.metric : metricSnapshot(dataset, widget.fieldMap);
    if (field === "hint") return data.hint;
    return data.value;
  }

  if (widget.type === "line" || widget.type === "area") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const series = processSeriesSnapshot(
      manualData?.valid && manualData.series ? manualData.series : lineSeries(dataset, widget.fieldMap),
      widget,
    );
    return resolveSeriesConditionValue(series, field);
  }

  if (widget.type === "bar" || widget.type === "pie" || widget.type === "rank") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const series = processSeriesSnapshot(
      manualData?.valid && manualData.series ? manualData.series : categoricalSeries(dataset, widget.fieldMap),
      widget,
    );
    return resolveSeriesConditionValue(series, field);
  }

  if (widget.type === "events") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const rows = processEventSnapshotRows(
      manualData?.valid && manualData.rows ? eventSnapshotFromRows(manualData.rows, widget.fieldMap) : eventSnapshot(dataset, widget.fieldMap),
      widget,
    );
    if (field === "count") return rows.length;
    if (field === "meta") return rows[0]?.meta;
    return rows[0]?.title;
  }

  if (widget.type === "table") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const snapshot = processTableSnapshotData(
      manualData?.valid && manualData.rows
        ? tableSnapshotFromRows(manualData.rows, {
            columns: widget.tableColumns,
            labels: widget.tableColumnLabels,
            widths: widget.tableColumnWidths,
          })
        : tableSnapshot(dataset, {
            columns: widget.tableColumns,
            labels: widget.tableColumnLabels,
            widths: widget.tableColumnWidths,
          }),
      widget,
    );
    if (field === "rowCount") return snapshot.rows.length;
    return snapshot.rows[0]?.[field];
  }

  if (widget.type === "map") {
    const manualData = widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
    const snapshot = processMapSnapshotData(
      mapSnapshot(
        manualData?.valid && manualData.rows
          ? {
              fields: inferFieldsFromRows(manualData.rows),
              rows: manualData.rows,
            }
          : dataset,
        widget.fieldMap,
      ),
      widget,
    );
    if (field === "count") return snapshot.points.length;
    if (field === "value") return snapshot.points[0]?.value;
    return snapshot.points[0]?.label;
  }

  return undefined;
}

function resolveSeriesConditionValue(series: Array<{label: string; value: number}>, field: string) {
  if (field === "count") return series.length;
  if (field === "value") return series[0]?.value;
  return series[0]?.label;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
