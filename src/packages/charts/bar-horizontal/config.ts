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

import horizontalBarDataJson from "./data.json";

export const HORIZONTAL_BAR_WIDGET_KEY = "chart-bar-horizontal";
export const HORIZONTAL_BAR_DATASET_ID = "chart-bar-horizontal-data";

export type HorizontalBarDataRow = Record<string, string | number>;

type HorizontalBarDatasetShape = {
  id?: string;
  values?: unknown;
};

const horizontalBarDefaultData = horizontalBarDataJson as HorizontalBarDataRow[];

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 260,
  y: 220,
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
  text: "横向柱状图",
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

export function createDefaultHorizontalBarSpec(): IBarChartSpec {
  return cloneValue({
    type: "bar",
    direction: "horizontal",
    padding: {
      top: 18,
      right: 18,
      bottom: 28,
      left: 18,
    },
    data: [
      {
        id: HORIZONTAL_BAR_DATASET_ID,
        values: horizontalBarDefaultData,
      },
    ],
    xField: "数值",
    yField: "地区",
    seriesField: "系列",
    barWidth: 20,
    color: ["#23422a", "#809885"],
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
        orient: "bottom",
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
        orient: "left",
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
      position: "right",
      style: {
        fill: "#1a1c19",
        fontSize: 11,
        fontWeight: 600,
      },
    },
    bar: {
      style: {
        cornerRadius: [0, 8, 8, 0],
      },
    },
  } satisfies IBarChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultHorizontalBarWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: HORIZONTAL_BAR_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultHorizontalBarSpec(),
  };
}

export function cloneHorizontalBarSpec(spec: IBarChartSpec): IBarChartSpec {
  return cloneValue(spec);
}

export function getHorizontalBarDataRows(spec: IBarChartSpec): HorizontalBarDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as HorizontalBarDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (item): item is HorizontalBarDataRow => typeof item === "object" && item !== null,
  );
}
