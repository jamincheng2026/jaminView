import type { IScatterChartSpec } from "@visactor/react-vchart";

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

import scatterDataJson from "./data.json";

export const SCATTER_WIDGET_KEY = "chart-scatter";
export const SCATTER_DATASET_ID = "chart-scatter-data";

export type ScatterDataRow = Record<string, string | number>;

type ScatterDatasetShape = {
  id?: string;
  values?: unknown;
};

const scatterDefaultData = scatterDataJson as ScatterDataRow[];

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 280,
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
  text: "散点图",
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

export function createDefaultScatterSpec(): IScatterChartSpec {
  return cloneValue({
    type: "scatter",
    padding: {
      top: 18,
      right: 18,
      bottom: 28,
      left: 18,
    },
    data: [
      {
        id: SCATTER_DATASET_ID,
        values: scatterDefaultData,
      },
    ],
    xField: "销售额",
    yField: "利润率",
    sizeField: "气泡",
    seriesField: "大区",
    size: [10, 30],
    color: ["#23422a", "#59725f", "#87a08d", "#b9c7bc"],
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
    point: {
      style: {
        size: 16,
        fillOpacity: 0.82,
        stroke: "#ffffff",
        lineWidth: 1.5,
      },
    },
  } satisfies IScatterChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultScatterWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: SCATTER_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultScatterSpec(),
  };
}

export function cloneScatterSpec(spec: IScatterChartSpec): IScatterChartSpec {
  return cloneValue(spec);
}

export function getScatterDataRows(spec: IScatterChartSpec): ScatterDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as ScatterDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (item): item is ScatterDataRow => typeof item === "object" && item !== null,
  );
}
