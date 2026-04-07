"use client";

import type {EditorWidget} from "@/lib/mocks/editor";

export type DatasetRowValue = string | number;

export type DatasetRow = Record<string, DatasetRowValue>;

export type ImportedDataset = {
  id: string;
  name: string;
  records: string;
  columns: string;
  source: "csv" | "xlsx" | "json";
  fields: DataField[];
  rows: DatasetRow[];
  importedAt: string;
};

export type DataField = {
  field: string;
  type: string;
  sample: string;
  icon: string;
};

export type ScreenBackgroundMode = "color" | "gradient" | "image";
export type ScreenBackgroundFit = "cover" | "contain" | "center";
export type ScreenCanvasPreset = "1920x1080" | "2560x1080" | "3840x1080" | "custom";
export type ScreenHeaderVariant = "classic" | "compact" | "minimal" | "broadcast" | "signal";
export type ScreenDisplayMode = "contain" | "fit-width" | "actual";
export type ScreenDisplayAlign = "center" | "top";
export type ScreenPresentationMode = "standard" | "immersive";

export type ScreenConfig = {
  title: string;
  subtitle: string;
  canvasPreset: ScreenCanvasPreset;
  canvasWidth: number;
  canvasHeight: number;
  headerVariant: ScreenHeaderVariant;
  showHeader: boolean;
  showTimestamp: boolean;
  showStatusBadge: boolean;
  statusBadgeLabel: string;
  statusMetaLabel: string;
  timeText: string;
  dateText: string;
  rightMetaPrimary: string;
  rightMetaSecondary: string;
  backgroundMode: ScreenBackgroundMode;
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  backgroundFit: ScreenBackgroundFit;
  backgroundOverlay: number;
  displayMode: ScreenDisplayMode;
  displayAlign: ScreenDisplayAlign;
  presentationMode: ScreenPresentationMode;
};

export type EditorDraft = {
  projectTitle?: string;
  widgets: EditorWidget[];
  selectedWidgetId: string;
  selectedWidgetIds?: string[];
  zoom: number;
  screenConfig?: ScreenConfig;
  canvasView?: "free" | "grid" | "safe";
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme?: "emerald" | "midnight" | "amber";
  mapRouteDensity?: "low" | "balanced" | "high";
  mapMarkers?: boolean;
  mapGlow?: number;
  mapRouteStyle?: "solid" | "dashed" | "pulse";
  mapLabelStyle?: "pill" | "minimal";
  mapSurfaceTone?: "soft" | "contrast";
  mapPointScale?: number;
  mapRouteWidth?: number;
  mapLandOpacity?: number;
  mapLabelOpacity?: number;
  mapOceanColor?: string;
  mapLandStartColor?: string;
  mapLandEndColor?: string;
  mapBorderColor?: string;
  mapAxisColor?: string;
  mapAxisSecondaryColor?: string;
  mapRouteColor?: string;
  mapRouteGlowColor?: string;
  mapMarkerColor?: string;
  mapMarkerHaloColor?: string;
  mapMarkerGlowColor?: string;
  mapLabelColor?: string;
  mapPanelTextColor?: string;
  mapHeatLowColor?: string;
  mapHeatHighColor?: string;
  datasetDrafts?: Record<string, {fields: DataField[]; rows: DatasetRow[]}>;
  updatedAt: string;
};

export type PublishedSnapshot = {
  projectId: string;
  publishedAt: string;
  draft: EditorDraft;
};

export const editorDraftStorageKey = (projectId: string) => `jaminview:editor-draft:${projectId}`;
export const importedDatasetsStorageKey = (projectId: string) => `jaminview:imported-datasets:${projectId}`;
export const publishedSnapshotStorageKey = (projectId: string) => `jaminview:published:${projectId}`;

export function readImportedDatasets(projectId: string): ImportedDataset[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(importedDatasetsStorageKey(projectId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ImportedDataset[];
    return Array.isArray(parsed)
      ? parsed.map((dataset) => ({
          ...dataset,
          rows: Array.isArray(dataset.rows) ? dataset.rows : buildFallbackRows(dataset.fields ?? []),
        }))
      : [];
  } catch {
    window.localStorage.removeItem(importedDatasetsStorageKey(projectId));
    return [];
  }
}

function buildFallbackRows(fields: DataField[]) {
  if (!fields.length) return [];
  return [
    Object.fromEntries(fields.map((field) => [field.field, field.sample])) as DatasetRow,
  ];
}

export function writeImportedDatasets(projectId: string, datasets: ImportedDataset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(importedDatasetsStorageKey(projectId), JSON.stringify(datasets));
}

export function saveEditorDraft(projectId: string, draft: EditorDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(editorDraftStorageKey(projectId), JSON.stringify(draft));
}

export function readEditorDraft(projectId: string): EditorDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(editorDraftStorageKey(projectId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EditorDraft;
  } catch {
    window.localStorage.removeItem(editorDraftStorageKey(projectId));
    return null;
  }
}

export function savePublishedSnapshot(projectId: string, draft: EditorDraft) {
  if (typeof window === "undefined") return;
  const snapshot: PublishedSnapshot = {
    projectId,
    publishedAt: new Date().toISOString(),
    draft,
  };

  window.localStorage.setItem(publishedSnapshotStorageKey(projectId), JSON.stringify(snapshot));
}

export function readPublishedSnapshot(projectId: string): PublishedSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(publishedSnapshotStorageKey(projectId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PublishedSnapshot;
  } catch {
    window.localStorage.removeItem(publishedSnapshotStorageKey(projectId));
    return null;
  }
}
