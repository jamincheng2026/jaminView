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

import amapLocaDataJson from "./data.json";

export const AMAP_LOCA_WIDGET_KEY = "map-amap-loca";

export type AmapLocaTheme = "dark" | "normal" | "fresh" | "light" | "blue";
export type AmapLocaLang = "zh_cn" | "zh_en" | "en";
export type AmapLocaViewMode = "2D" | "3D";
export type AmapLocaFeature = "bg" | "road" | "point" | "building";
export type AmapLocaRegionLevel = "country" | "province" | "city";
export type AmapLocaRegionCode = string;
export type AmapLocaLngLat = [number, number];

export interface AmapLocaRegion {
  adcode: AmapLocaRegionCode;
  name: string;
  level: AmapLocaRegionLevel;
  parentAdcode: AmapLocaRegionCode | null;
  center: AmapLocaLngLat;
  zoom: number;
}

export interface AmapLocaBusinessPoint {
  id: string;
  name: string;
  province: string;
  city: string;
  provinceAdcode: AmapLocaRegionCode;
  cityAdcode: AmapLocaRegionCode;
  position: AmapLocaLngLat;
  heat: number;
  value: number;
  category: string;
}

export interface AmapLocaDataset {
  regions: AmapLocaRegion[];
  businessPoints: AmapLocaBusinessPoint[];
}

export interface AmapLocaMapConfig extends Record<string, unknown> {
  dataset: AmapLocaDataset;
  map: {
    amapKey: string;
    securityJsCode: string;
    theme: AmapLocaTheme;
    customStyleId: string;
    lang: AmapLocaLang;
    viewMode: AmapLocaViewMode;
    center: AmapLocaLngLat;
    zoom: number;
    pitch: number;
    features: AmapLocaFeature[];
  };
  drill: {
    enabled: boolean;
    rootAdcode: AmapLocaRegionCode;
    maxLevel: Exclude<AmapLocaRegionLevel, "country">;
    showBreadcrumb: boolean;
    fillOpacity: number;
    strokeWidth: number;
  };
  heatmap: {
    visible: boolean;
    radius: number;
    opacity: number;
    intensity: number;
    blur: number;
  };
  pointLayer: {
    visible: boolean;
    radius: number;
    opacity: number;
    fillColor: string;
    strokeColor: string;
  };
}

const amapLocaDefaultData = amapLocaDataJson as AmapLocaDataset;
const defaultAmapKey = process.env.NEXT_PUBLIC_AMAP_KEY ?? "";
const defaultAmapSecurityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE ?? "";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 200,
  y: 120,
  w: 1120,
  h: 760,
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
  text: "高德 Loca 业务地图",
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

export function createDefaultAmapLocaMapConfig(): AmapLocaMapConfig {
  return cloneValue({
    dataset: amapLocaDefaultData,
    map: {
      amapKey: defaultAmapKey,
      securityJsCode: defaultAmapSecurityJsCode,
      theme: "dark",
      customStyleId: "",
      lang: "zh_cn",
      viewMode: "3D",
      center: [104.114129, 37.550339],
      zoom: 4.6,
      pitch: 52,
      features: ["bg", "road", "point", "building"],
    },
    drill: {
      enabled: true,
      rootAdcode: "100000",
      maxLevel: "city",
      showBreadcrumb: true,
      fillOpacity: 76,
      strokeWidth: 1.4,
    },
    heatmap: {
      visible: true,
      radius: 96,
      opacity: 78,
      intensity: 88,
      blur: 72,
    },
    pointLayer: {
      visible: true,
      radius: 9,
      opacity: 84,
      fillColor: "#70d48a",
      strokeColor: "#f5fff7",
    },
  } satisfies AmapLocaMapConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultAmapLocaMapWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: AMAP_LOCA_WIDGET_KEY,
    chartFrame: ChartFrame.CUSTOM,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultAmapLocaMapConfig(),
  };
}

export function cloneAmapLocaMapConfig(config: AmapLocaMapConfig): AmapLocaMapConfig {
  return cloneValue(config);
}
