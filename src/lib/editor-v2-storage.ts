"use client";

import {
  normalizeEditorV2CanvasFilters,
  type EditorV2CanvasFilters,
} from "@/lib/editor-v2-canvas-filters";
import type {
  EditorDataPond,
  EditorDataPondSettings,
  Widget,
} from "@/packages/types";

export type EditorV2CanvasState = {
  filters: EditorV2CanvasFilters;
  width: number;
  height: number;
  zoom: number;
  showGrid: boolean;
  showSafeArea: boolean;
  snapToGrid: boolean;
};

export type EditorV2Draft = {
  version: "v2";
  projectId: string;
  projectTitle: string;
  widgets: Widget[];
  dataPonds: EditorDataPond[];
  dataPondSettings: EditorDataPondSettings;
  canvas: EditorV2CanvasState;
  updatedAt: string;
};

export type EditorV2PublishedSnapshot = {
  version: "v2";
  projectId: string;
  projectTitle: string;
  widgets: Widget[];
  dataPonds: EditorDataPond[];
  dataPondSettings: EditorDataPondSettings;
  canvas: EditorV2CanvasState;
  updatedAt: string;
  publishedAt: string;
};

export const defaultEditorV2DataPondSettings: EditorDataPondSettings = {
  pollingInterval: 30,
};

export const editorV2DraftStorageKey = (projectId: string) => `jaminview:v2:draft:${projectId}`;
export const editorV2PublishedStorageKey = (projectId: string) =>
  `jaminview:v2:published:${projectId}`;

function removeInvalidStorage(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function saveEditorV2Draft(projectId: string, draft: EditorV2Draft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(editorV2DraftStorageKey(projectId), JSON.stringify(draft));
}

export function readEditorV2Draft(projectId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = editorV2DraftStorageKey(projectId);
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EditorV2Draft>;
    if (parsed?.version !== "v2" || !Array.isArray(parsed.widgets) || !parsed.canvas) {
      removeInvalidStorage(storageKey);
      return null;
    }

    return {
      ...parsed,
      projectId,
      projectTitle: parsed.projectTitle ?? "",
      widgets: parsed.widgets,
      dataPonds: Array.isArray(parsed.dataPonds) ? parsed.dataPonds : [],
      dataPondSettings: parsed.dataPondSettings ?? defaultEditorV2DataPondSettings,
      canvas: {
        ...parsed.canvas,
        filters: normalizeEditorV2CanvasFilters(parsed.canvas.filters),
      },
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      version: "v2",
    } satisfies EditorV2Draft;
  } catch {
    removeInvalidStorage(storageKey);
    return null;
  }
}

export function saveEditorV2PublishedSnapshot(projectId: string, draft: EditorV2Draft) {
  if (typeof window === "undefined") {
    return null;
  }

  const snapshot: EditorV2PublishedSnapshot = {
    ...draft,
    publishedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    editorV2PublishedStorageKey(projectId),
    JSON.stringify(snapshot),
  );

  return snapshot;
}

export function readEditorV2PublishedSnapshot(projectId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = editorV2PublishedStorageKey(projectId);
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EditorV2PublishedSnapshot>;
    if (
      parsed?.version !== "v2" ||
      !Array.isArray(parsed.widgets) ||
      !parsed.canvas ||
      typeof parsed.publishedAt !== "string"
    ) {
      removeInvalidStorage(storageKey);
      return null;
    }

    return {
      ...parsed,
      projectId,
      projectTitle: parsed.projectTitle ?? "",
      widgets: parsed.widgets,
      dataPonds: Array.isArray(parsed.dataPonds) ? parsed.dataPonds : [],
      dataPondSettings: parsed.dataPondSettings ?? defaultEditorV2DataPondSettings,
      canvas: {
        ...parsed.canvas,
        filters: normalizeEditorV2CanvasFilters(parsed.canvas.filters),
      },
      updatedAt: parsed.updatedAt ?? parsed.publishedAt,
      publishedAt: parsed.publishedAt,
      version: "v2",
    } satisfies EditorV2PublishedSnapshot;
  } catch {
    removeInvalidStorage(storageKey);
    return null;
  }
}
