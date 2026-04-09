import type { IPieChartSpec } from "@visactor/react-vchart";

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

import pieDataJson from "./data.json";

export const PIE_WIDGET_KEY = "chart-pie";
export const PIE_DATASET_ID = "chart-pie-data";

export type PieDataRow = Record<string, string | number>;

type PieDatasetShape = {
  id?: string;
  values?: unknown;
};

const pieDefaultData = pieDataJson as PieDataRow[];

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 240,
  y: 180,
  w: 520,
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
  text: "饼图",
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

export function createDefaultPieSpec(): IPieChartSpec {
  return cloneValue({
    type: "pie",
    padding: {
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
    },
    data: [
      {
        id: PIE_DATASET_ID,
        values: pieDefaultData,
      },
    ],
    categoryField: "渠道",
    valueField: "销售额",
    innerRadius: 0.42,
    outerRadius: 0.78,
    cornerRadius: 8,
    padAngle: 1,
    color: ["#23422a", "#59725f", "#819987", "#aab9ae", "#d8ddd6"],
    tooltip: {
      visible: true,
    },
    legends: [
      {
        visible: true,
        orient: "right",
        position: "middle",
        item: {
          label: {
            style: {
              fill: "#1a1c19",
              fontSize: 12,
            },
          },
        },
      },
    ],
    label: {
      visible: true,
      position: "outside",
      style: {
        fill: "#1a1c19",
        fontSize: 11,
        fontWeight: 600,
      },
      line: {
        visible: true,
        style: {
          stroke: "#d7d8d1",
          lineWidth: 1,
        },
      },
    },
    pie: {
      style: {
        stroke: "#fafaf5",
        lineWidth: 2,
      },
    },
  } satisfies IPieChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPieWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: PIE_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultPieSpec(),
  };
}

export function clonePieSpec(spec: IPieChartSpec): IPieChartSpec {
  return cloneValue(spec);
}

export function getPieDataRows(spec: IPieChartSpec): PieDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as PieDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is PieDataRow => typeof item === "object" && item !== null);
}
