import type { IRadarChartSpec } from "@visactor/react-vchart";

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

import radarDataJson from "./data.json";

export const RADAR_WIDGET_KEY = "chart-radar";
export const RADAR_DATASET_ID = "chart-radar-data";

export type RadarDataRow = Record<string, string | number>;

type RadarDatasetShape = {
  id?: string;
  values?: unknown;
};

const radarDefaultData = radarDataJson as RadarDataRow[];

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 320,
  y: 180,
  w: 640,
  h: 480,
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
  text: "雷达图",
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

export function createDefaultRadarSpec(): IRadarChartSpec {
  return cloneValue({
    type: "radar",
    padding: {
      top: 18,
      right: 18,
      bottom: 18,
      left: 18,
    },
    data: [
      {
        id: RADAR_DATASET_ID,
        values: radarDefaultData,
      },
    ],
    categoryField: "维度",
    valueField: "分数",
    seriesField: "系列",
    outerRadius: 0.76,
    innerRadius: 0.16,
    color: ["#23422a", "#7d9582"],
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
        orient: "radius",
        type: "linear",
        visible: true,
        label: {
          visible: false,
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
        orient: "angle",
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
          visible: true,
          smooth: false,
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
    ],
    label: {
      visible: false,
      style: {
        fill: "#1a1c19",
        fontSize: 11,
        fontWeight: 600,
      },
    },
    seriesMark: "area",
    activePoint: false,
    area: {
      visible: true,
      style: {
        fillOpacity: 0.18,
      },
    },
    line: {
      style: {
        lineWidth: 2.5,
      },
    },
    point: {
      visible: false,
      style: {
        size: 7,
        stroke: "#ffffff",
        lineWidth: 1.5,
      },
    },
  } satisfies IRadarChartSpec);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultRadarWidget(): VChartWidget {
  return {
    id: createWidgetId(),
    registrationKey: RADAR_WIDGET_KEY,
    chartFrame: ChartFrame.VCHART,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    spec: createDefaultRadarSpec(),
  };
}

export function cloneRadarSpec(spec: IRadarChartSpec): IRadarChartSpec {
  return cloneValue(spec);
}

export function getRadarDataRows(spec: IRadarChartSpec): RadarDataRow[] {
  const dataset = Array.isArray(spec.data) ? spec.data[0] : undefined;
  const values =
    typeof dataset === "object" && dataset !== null && "values" in dataset
      ? (dataset as RadarDatasetShape).values
      : undefined;
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is RadarDataRow => typeof item === "object" && item !== null);
}
