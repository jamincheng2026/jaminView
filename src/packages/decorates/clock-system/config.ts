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

import clockSystemDataJson from "./data.json";

export const CLOCK_SYSTEM_WIDGET_KEY = "decorate-clock-system";

type ClockSystemDataShape = {
  label: string;
  timeZone: string;
};

export interface ClockSystemConfig extends Record<string, unknown> {
  label: string;
  timeZone: string;
  showAnalog: boolean;
  showDigital: boolean;
  showDate: boolean;
  showSeconds: boolean;
  faceColor: string;
  faceBorderColor: string;
  handColor: string;
  secondHandColor: string;
  tickColor: string;
  textColor: string;
  panelColor: string;
  panelBorderColor: string;
  accentColor: string;
}

const clockSystemDefaultData = clockSystemDataJson as ClockSystemDataShape;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 320,
  y: 220,
  w: 520,
  h: 220,
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
  text: "时钟系统",
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

export function createDefaultClockSystemConfig(): ClockSystemConfig {
  return cloneValue({
    label: clockSystemDefaultData.label,
    timeZone: clockSystemDefaultData.timeZone,
    showAnalog: true,
    showDigital: true,
    showDate: true,
    showSeconds: true,
    faceColor: "#f3f6ef",
    faceBorderColor: "#23422a",
    handColor: "#23422a",
    secondHandColor: "#6f8f75",
    tickColor: "#23422a",
    textColor: "#1a1c19",
    panelColor: "#ffffff",
    panelBorderColor: "#d7d8d1",
    accentColor: "#23422a",
  } satisfies ClockSystemConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultClockSystemWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: CLOCK_SYSTEM_WIDGET_KEY,
    chartFrame: ChartFrame.CUSTOM,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultClockSystemConfig(),
  };
}

export function cloneClockSystemConfig(config: ClockSystemConfig): ClockSystemConfig {
  return cloneValue(config);
}
