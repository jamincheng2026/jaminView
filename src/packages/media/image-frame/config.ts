import {
  ChartFrame,
  type CustomWidget,
  type WidgetAttr,
  type WidgetDataSource,
  type WidgetEvents,
  type WidgetStatus,
  type WidgetStyles,
  type WidgetTitle,
} from "@/packages/types";

import imageFrameDataJson from "./data.json";

export const IMAGE_FRAME_WIDGET_KEY = "media-image-frame";

export type ImageFrameFit = "cover" | "contain" | "fill";
export type ImageFrameStyle = "technical" | "soft" | "glow";

type ImageFrameDataShape = {
  caption: string;
  imageUrl: string;
  meta: string;
};

export interface ImageFrameConfig extends Record<string, unknown> {
  imageUrl: string;
  fit: ImageFrameFit;
  borderRadius: number;
  frameStyle: ImageFrameStyle;
  caption: string;
  meta: string;
  captionVisible: boolean;
  frameColor: string;
  accentColor: string;
  overlayOpacity: number;
}

const imageFrameDefaultData = imageFrameDataJson as ImageFrameDataShape;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 280,
  y: 180,
  w: 520,
  h: 320,
  zIndex: 1,
};

const defaultStyles: WidgetStyles = {
  opacity: 1,
  fill: "#fafaf5",
  stroke: "#d7d8d1",
  radius: 24,
  padding: 16,
  shadow: "soft",
  animations: [],
};

const defaultTitle: WidgetTitle = {
  text: "静态图片框",
  visible: false,
  align: "left",
  color: "#1a1c19",
  size: 20,
  weight: "700",
};

const defaultStatus: WidgetStatus = {
  locked: false,
  hidden: false,
};

const defaultDataSource: WidgetDataSource = {
  mode: "static",
};

const defaultEvents: WidgetEvents = {
  action: "none",
};

export function createDefaultImageFrameConfig(): ImageFrameConfig {
  return cloneValue({
    imageUrl: imageFrameDefaultData.imageUrl,
    fit: "cover",
    borderRadius: 24,
    frameStyle: "technical",
    caption: imageFrameDefaultData.caption,
    meta: imageFrameDefaultData.meta,
    captionVisible: true,
    frameColor: "#23422a",
    accentColor: "#6f8f75",
    overlayOpacity: 18,
  } satisfies ImageFrameConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultImageFrameWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: IMAGE_FRAME_WIDGET_KEY,
    chartFrame: ChartFrame.STATIC,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultImageFrameConfig(),
  };
}

export function cloneImageFrameConfig(config: ImageFrameConfig): ImageFrameConfig {
  return cloneValue(config);
}
