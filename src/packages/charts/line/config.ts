import type { ILineChartSpec } from "@visactor/react-vchart";

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

import lineDataJson from "./data.json";

export const LINE_WIDGET_KEY = "chart-line";
export const LINE_DATASET_ID = "chart-line-data";

export type LineDataRow = Record<string, string | number>;

type LineDatasetShape = {
  id?: string;
  values?: unknown;
};

const lineDefaultData = lineDataJson as LineDataRow[];

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
  text: "折线图",
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

export function createDefaultLineSpec(): ILineChartSpec {
  return cloneValue({
    type: "line",
    padding: {
      top: 18,
      right: 18,
      bottom: 28,
      left: 18,
    },
    data: [
      {
        id: LINE_DATASET_ID,
        values: lineDefaultData,
      },
    ],
    xField: "月份",
    yField: "数值",
    seriesField: "系列",
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
    line: {
      style: {
        curveType: "linear",
        lineWidth: 3,
      },
    },
    point: {
      visible: true,
      style: {
        size: 7,
        lineWidth: 2,
        stroke: "#ffffff",
      },
    },
  } satisfies ILineChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultLineWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: LINE_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultLineSpec(),
  };
}

export function cloneLineSpec(spec: ILineChartSpec): ILineChartSpec {
  return cloneValue(spec);
}

export function getLineDataRows(spec: ILineChartSpec): LineDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as LineDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is LineDataRow => typeof item === "object" && item !== null);
}
