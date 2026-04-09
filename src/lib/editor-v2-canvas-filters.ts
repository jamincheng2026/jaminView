import type { CSSProperties } from "react";

export type EditorV2CanvasFilters = {
  brightness: number;
  contrast: number;
  enabled: boolean;
  hueRotate: number;
  opacity: number;
  saturate: number;
};

export type EditorV2CanvasFilterPreset = {
  description: string;
  filters: EditorV2CanvasFilters;
  key: string;
  label: string;
};

export const defaultEditorV2CanvasFilters: EditorV2CanvasFilters = {
  brightness: 100,
  contrast: 100,
  enabled: false,
  hueRotate: 0,
  opacity: 100,
  saturate: 100,
};

export const editorV2CanvasFilterPresets: EditorV2CanvasFilterPreset[] = [
  {
    key: "origin",
    label: "原片",
    description: "关闭滤镜，回到原始画布。",
    filters: {
      ...defaultEditorV2CanvasFilters,
      enabled: false,
    },
  },
  {
    key: "cyber-green",
    label: "赛博青绿",
    description: "偏冷的科技屏氛围，适合驾驶舱和监控场景。",
    filters: {
      enabled: true,
      hueRotate: 148,
      saturate: 138,
      contrast: 116,
      brightness: 94,
      opacity: 100,
    },
  },
  {
    key: "amber-night",
    label: "琥珀夜视",
    description: "更沉稳的暖色夜视感，适合值班与安防大屏。",
    filters: {
      enabled: true,
      hueRotate: 28,
      saturate: 122,
      contrast: 112,
      brightness: 96,
      opacity: 98,
    },
  },
  {
    key: "silver-cold",
    label: "冷银分析",
    description: "降低饱和度，强化对比，适合数据分析类看板。",
    filters: {
      enabled: true,
      hueRotate: 188,
      saturate: 82,
      contrast: 109,
      brightness: 108,
      opacity: 100,
    },
  },
];

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

export function normalizeEditorV2CanvasFilters(
  filters?: Partial<EditorV2CanvasFilters> | null,
): EditorV2CanvasFilters {
  return {
    enabled: Boolean(filters?.enabled),
    hueRotate: clamp(Math.round(filters?.hueRotate ?? defaultEditorV2CanvasFilters.hueRotate), 0, 360),
    saturate: clamp(Math.round(filters?.saturate ?? defaultEditorV2CanvasFilters.saturate), 0, 300),
    contrast: clamp(Math.round(filters?.contrast ?? defaultEditorV2CanvasFilters.contrast), 0, 300),
    brightness: clamp(
      Math.round(filters?.brightness ?? defaultEditorV2CanvasFilters.brightness),
      0,
      300,
    ),
    opacity: clamp(Math.round(filters?.opacity ?? defaultEditorV2CanvasFilters.opacity), 0, 100),
  };
}

export function resolveEditorV2CanvasFilterStyle(
  filters?: EditorV2CanvasFilters | null,
): CSSProperties {
  const normalized = normalizeEditorV2CanvasFilters(filters);

  if (!normalized.enabled) {
    return {};
  }

  return {
    filter: `saturate(${normalized.saturate}%) contrast(${normalized.contrast}%) hue-rotate(${normalized.hueRotate}deg) brightness(${normalized.brightness}%)`,
    opacity: normalized.opacity / 100,
    transition: "filter 180ms ease, opacity 180ms ease",
  };
}
