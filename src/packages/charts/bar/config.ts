import type { IBarChartSpec } from "@visactor/react-vchart";

import {
  ChartFrame,
  type VChartWidget,
  type WidgetAttr,
  type WidgetDataSource,
  type WidgetEvents,
  type WidgetStatus,
  type WidgetStyles,
  type WidgetTitle,
} from "@/packages/types";

import barDataJson from "./data.json";

export const BAR_WIDGET_KEY = "chart-bar";
export const BAR_DATASET_ID = "chart-bar-data";

export type BarDataRow = Record<string, string | number>;

type BarDatasetShape = {
  id?: string;
  values?: unknown;
};

const barDefaultData = barDataJson as BarDataRow[];

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 220,
  y: 180,
  w: 760,
  h: 420,
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
  text: "柱状图",
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

export function createDefaultBarSpec(): IBarChartSpec {
  return cloneValue({
    type: "bar",
    padding: {
      top: 18,
      right: 18,
      bottom: 28,
      left: 18,
    },
    data: [
      {
        id: BAR_DATASET_ID,
        values: barDefaultData,
      },
    ],
    xField: "月份",
    yField: "数值",
    seriesField: "系列",
    barWidth: 22,
    color: ["#23422a", "#6f8f75"],
    tooltip: {
      visible: true,
    },
    legends: [
      {
        visible: true,
        orient: "top",
        position: "start",
      },
    ],
    axes: [
      {
        orient: "left",
        type: "linear",
        visible: true,
        label: {
          visible: true,
          style: {
            fill: "#727971",
            fontSize: 12,
          },
        },
        grid: {
          visible: true,
          style: {
            stroke: "#d7d8d1",
            lineDash: [4, 4],
          },
        },
        domainLine: {
          visible: false,
        },
        tick: {
          visible: false,
        },
        title: {
          visible: false,
        },
      },
      {
        orient: "bottom",
        type: "band",
        visible: true,
        label: {
          visible: true,
          style: {
            fill: "#727971",
            fontSize: 12,
          },
        },
        grid: {
          visible: false,
        },
        domainLine: {
          visible: false,
        },
        tick: {
          visible: false,
        },
        title: {
          visible: false,
        },
      },
    ],
    label: {
      visible: false,
      position: "top",
      style: {
        fill: "#1a1c19",
        fontSize: 11,
        fontWeight: 600,
      },
    },
    bar: {
      style: {
        cornerRadius: [8, 8, 0, 0],
      },
    },
  } satisfies IBarChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultBarWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: BAR_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultBarSpec(),
  };
}

export function cloneBarSpec(spec: IBarChartSpec): IBarChartSpec {
  return cloneValue(spec);
}

export function getBarDataRows(spec: IBarChartSpec): BarDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as BarDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is BarDataRow => typeof item === "object" && item !== null);
}
