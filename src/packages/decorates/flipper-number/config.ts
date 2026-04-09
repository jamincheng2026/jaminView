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

import flipperNumberDataJson from "./data.json";

export const FLIPPER_NUMBER_WIDGET_KEY = "decorate-flipper-number";

export type FlipperDirection = "down" | "up";

type FlipperNumberDataShape = {
  value: number | string;
};

export interface FlipperNumberConfig extends Record<string, unknown> {
  dataset: number | string;
  flipperLength: number;
  flipperBgColor: string;
  flipperTextColor: string;
  flipperWidth: number;
  flipperHeight: number;
  flipperRadius: number;
  flipperGap: number;
  flipperType: FlipperDirection;
  flipperSpeed: number;
  flipperBorderWidth: number;
  label: string;
  labelVisible: boolean;
}

const flipperNumberDefaultData = flipperNumberDataJson as FlipperNumberDataShape;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 260,
  y: 180,
  w: 420,
  h: 180,
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
  text: "数字翻牌器",
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

export function createDefaultFlipperNumberConfig(): FlipperNumberConfig {
  return cloneValue({
    dataset: flipperNumberDefaultData.value,
    flipperLength: 6,
    flipperBgColor: "#1d3126",
    flipperTextColor: "#f5fff7",
    flipperWidth: 48,
    flipperHeight: 78,
    flipperRadius: 16,
    flipperGap: 10,
    flipperType: "down",
    flipperSpeed: 450,
    flipperBorderWidth: 1,
    label: "今日总工单",
    labelVisible: true,
  } satisfies FlipperNumberConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultFlipperNumberWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: FLIPPER_NUMBER_WIDGET_KEY,
    chartFrame: ChartFrame.CUSTOM,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultFlipperNumberConfig(),
  };
}

export function cloneFlipperNumberConfig(config: FlipperNumberConfig): FlipperNumberConfig {
  return cloneValue(config);
}
