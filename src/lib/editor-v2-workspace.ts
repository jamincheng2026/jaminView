"use client";

import {
  normalizeEditorV2CanvasFilters,
  type EditorV2CanvasFilters,
} from "@/lib/editor-v2-canvas-filters";
import { defaultEditorV2DataPondSettings, type EditorV2CanvasState } from "@/lib/editor-v2-storage";
import { workspaceDocumentSchema } from "@/lib/editor-v2-workspace-schema";
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
  /**
   * 导入工作区时，若数据池里携带了 JS Transformer 代码，会被强制清空并把池子 id 记录在此。
   * 调用方应在 UI 上提示用户审查后再手动启用。
   */
  pendingTransformerReviews: string[];
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
  const parsed = workspaceDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") ?? "(root)";
    throw new Error(
      `工作区 JSON 校验失败：${path} ${firstIssue?.message ?? "结构无效"}`,
    );
  }

  const value = parsed.data;
  const pendingTransformerReviews: string[] = [];

  // 数据池里的 transformer 代码视为不可信，强制清空并记录待审查池子
  const sanitizedDataPonds: EditorDataPond[] = value.dataPonds.map((pond) => {
    if (pond.request.transformer && pond.request.transformer.trim().length > 0) {
      pendingTransformerReviews.push(pond.id);
      return {
        ...pond,
        request: {
          ...pond.request,
          transformer: "",
        },
      };
    }
    return pond;
  }) as EditorDataPond[];

  return {
    canvas: normalizeCanvasState(value.canvas),
    dataPondSettings: normalizeDataPondSettings(value.dataPondSettings),
    dataPonds: sanitizedDataPonds,
    exportedAt: value.exportedAt ?? value.updatedAt ?? new Date().toISOString(),
    kind: "jaminview-editor-v2-workspace",
    projectId: value.projectId,
    projectTitle: value.projectTitle ?? "",
    sourceProjectId: value.sourceProjectId ?? value.projectId,
    version: "v2",
    widgets: value.widgets as unknown as Widget[],
    pendingTransformerReviews,
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
    pendingTransformerReviews: [],
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
