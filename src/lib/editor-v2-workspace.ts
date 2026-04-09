"use client";

import {
  normalizeEditorV2CanvasFilters,
  type EditorV2CanvasFilters,
} from "@/lib/editor-v2-canvas-filters";
import { defaultEditorV2DataPondSettings, type EditorV2CanvasState } from "@/lib/editor-v2-storage";
import type { EditorDataPond, EditorDataPondSettings, Widget } from "@/packages/types";

type WorkspaceLike = {
  canvas: EditorV2CanvasState;
  dataPonds: EditorDataPond[];
  dataPondSettings: EditorDataPondSettings;
  projectId?: string;
  projectTitle: string;
  widgets: Widget[];
};

export type EditorV2WorkspaceDocument = WorkspaceLike & {
  exportedAt: string;
  kind: "jaminview-editor-v2-workspace";
  sourceProjectId?: string;
  version: "v2";
};

export type EditorV2WorkspaceSummary = {
  activeDataPondCount: number;
  canvasLabel: string;
  dataBoundWidgetCount: number;
  dataPondCount: number;
  hiddenWidgetCount: number;
  widgetCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCanvasState(canvas: unknown): EditorV2CanvasState {
  const record = isRecord(canvas) ? canvas : {};
  const filters = normalizeEditorV2CanvasFilters(record.filters as EditorV2CanvasFilters | undefined);
  const width = typeof record.width === "number" ? record.width : 1920;
  const height = typeof record.height === "number" ? record.height : 1080;
  const zoom = typeof record.zoom === "number" ? record.zoom : 35;
  const showGrid = typeof record.showGrid === "boolean" ? record.showGrid : true;
  const showSafeArea = typeof record.showSafeArea === "boolean" ? record.showSafeArea : true;
  const snapToGrid = typeof record.snapToGrid === "boolean" ? record.snapToGrid : true;

  return {
    filters,
    height,
    showGrid,
    showSafeArea,
    snapToGrid,
    width,
    zoom,
  };
}

function normalizeDataPondSettings(settings: unknown): EditorDataPondSettings {
  const record = isRecord(settings) ? settings : {};
  return {
    pollingInterval:
      typeof record.pollingInterval === "number"
        ? record.pollingInterval
        : defaultEditorV2DataPondSettings.pollingInterval,
  };
}

function sanitizeWorkspaceDocument(raw: unknown): EditorV2WorkspaceDocument {
  if (!isRecord(raw) || raw.version !== "v2" || !Array.isArray(raw.widgets) || !("canvas" in raw)) {
    throw new Error("工作区 JSON 结构无效，缺少必要的 V2 字段。");
  }

  return {
    canvas: normalizeCanvasState(raw.canvas),
    dataPondSettings: normalizeDataPondSettings(raw.dataPondSettings),
    dataPonds: Array.isArray(raw.dataPonds) ? (raw.dataPonds as EditorDataPond[]) : [],
    exportedAt:
      typeof raw.exportedAt === "string"
        ? raw.exportedAt
        : typeof raw.updatedAt === "string"
          ? raw.updatedAt
          : new Date().toISOString(),
    kind: "jaminview-editor-v2-workspace",
    projectId: typeof raw.projectId === "string" ? raw.projectId : undefined,
    projectTitle: typeof raw.projectTitle === "string" ? raw.projectTitle : "",
    sourceProjectId:
      typeof raw.sourceProjectId === "string"
        ? raw.sourceProjectId
        : typeof raw.projectId === "string"
          ? raw.projectId
          : undefined,
    version: "v2",
    widgets: raw.widgets as Widget[],
  };
}

export function createEditorV2WorkspaceDocument(source: WorkspaceLike): EditorV2WorkspaceDocument {
  return {
    canvas: normalizeCanvasState(source.canvas),
    dataPondSettings: normalizeDataPondSettings(source.dataPondSettings),
    dataPonds: source.dataPonds,
    exportedAt: new Date().toISOString(),
    kind: "jaminview-editor-v2-workspace",
    projectId: source.projectId,
    projectTitle: source.projectTitle,
    sourceProjectId: source.projectId,
    version: "v2",
    widgets: source.widgets,
  };
}

export function parseEditorV2WorkspaceDocument(rawText: string) {
  try {
    const parsed = JSON.parse(rawText) as unknown;
    return sanitizeWorkspaceDocument(parsed);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("工作区 JSON 解析失败。");
  }
}

export function buildEditorV2WorkspaceSummary(source: WorkspaceLike): EditorV2WorkspaceSummary {
  const widgetCount = source.widgets.length;
  const hiddenWidgetCount = source.widgets.filter((widget) => widget.status.hidden).length;
  const dataBoundWidgetCount = source.widgets.filter(
    (widget) => widget.dataSource.mode === "request" && Boolean(widget.dataSource.dataPondId),
  ).length;
  const dataPondCount = source.dataPonds.length;
  const activeDataPondCount = source.dataPonds.filter((item) => item.enabled).length;

  return {
    activeDataPondCount,
    canvasLabel: `${source.canvas.width} × ${source.canvas.height}`,
    dataBoundWidgetCount,
    dataPondCount,
    hiddenWidgetCount,
    widgetCount,
  };
}

export function buildEditorV2WorkspaceFilename(projectTitle: string) {
  const safeTitle = projectTitle.trim().replace(/[\\/:*?"<>|]+/g, "-") || "jaminview-workspace";
  return `${safeTitle}.jaminview.json`;
}

export function downloadEditorV2WorkspaceDocument(
  document: EditorV2WorkspaceDocument,
  fileName = buildEditorV2WorkspaceFilename(document.projectTitle),
) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([JSON.stringify(document, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  window.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
