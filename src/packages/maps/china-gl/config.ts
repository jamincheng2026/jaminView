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

import chinaGlDataJson from "./data.json";

export const CHINA_GL_MAP_WIDGET_KEY = "map-china-gl";

export type ChinaGlTheme = "emerald" | "cobalt" | "amber";
export type ChinaGlLngLat = [number, number];

export interface ChinaGlProvinceDatum {
  name: string;
  value: number;
}

export interface ChinaGlCityDatum {
  name: string;
  coord: ChinaGlLngLat;
  value: number;
}

export interface ChinaGlFlightDatum {
  fromName: string;
  toName: string;
  coords: [ChinaGlLngLat, ChinaGlLngLat];
  value: number;
}

export interface ChinaGlMapDataset {
  provinceData: ChinaGlProvinceDatum[];
  barData: ChinaGlCityDatum[];
  scatterData: ChinaGlCityDatum[];
  flightData: ChinaGlFlightDatum[];
}

export interface ChinaGlMapConfig extends Record<string, unknown> {
  theme: ChinaGlTheme;
  dataset: ChinaGlMapDataset;
  map: {
    showLabels: boolean;
    regionHeight: number;
    landOpacity: number;
    borderWidth: number;
  };
  view: {
    alpha: number;
    beta: number;
    distance: number;
  };
  glow: {
    enabled: boolean;
    intensity: number;
  };
  flight: {
    visible: boolean;
    width: number;
    trailWidth: number;
    trailLength: number;
    speed: number;
    opacity: number;
  };
  bar: {
    visible: boolean;
    size: number;
    bevelSize: number;
    opacity: number;
  };
  scatterLayer: {
    visible: boolean;
    symbolSize: number;
    showLabel: boolean;
  };
}

const chinaGlDefaultData = chinaGlDataJson as ChinaGlMapDataset;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 240,
  y: 140,
  w: 980,
  h: 720,
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
  text: "中国 3D 科技地图",
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

export function createDefaultChinaGlMapConfig(): ChinaGlMapConfig {
  return cloneValue({
    theme: "emerald",
    dataset: chinaGlDefaultData,
    map: {
      showLabels: true,
      regionHeight: 3,
      landOpacity: 88,
      borderWidth: 1.2,
    },
    view: {
      alpha: 42,
      beta: -8,
      distance: 112,
    },
    glow: {
      enabled: true,
      intensity: 72,
    },
    flight: {
      visible: true,
      width: 2,
      trailWidth: 3,
      trailLength: 0.24,
      speed: 18,
      opacity: 78,
    },
    bar: {
      visible: true,
      size: 1.25,
      bevelSize: 0.25,
      opacity: 92,
    },
    scatterLayer: {
      visible: true,
      symbolSize: 10,
      showLabel: true,
    },
  } satisfies ChinaGlMapConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultChinaGlMapWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: CHINA_GL_MAP_WIDGET_KEY,
    chartFrame: ChartFrame.CUSTOM,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultChinaGlMapConfig(),
  };
}

export function cloneChinaGlMapConfig(config: ChinaGlMapConfig): ChinaGlMapConfig {
  return cloneValue(config);
}
