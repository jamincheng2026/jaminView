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

import scrollBoardDataJson from "./data.json";

export const SCROLL_BOARD_WIDGET_KEY = "table-scroll-board";

export type ScrollBoardAlign = "left" | "center" | "right";
export type ScrollBoardCarousel = "single" | "page";
export type ScrollBoardCell = string | number;

export interface ScrollBoardDataset {
  header: string[];
  rows: ScrollBoardCell[][];
}

export interface ScrollBoardConfig extends Record<string, unknown> {
  dataset: ScrollBoardDataset;
  index: boolean;
  indexHeader: string;
  columnWidth: number[];
  align: ScrollBoardAlign[];
  rowNum: number;
  waitTime: number;
  headerHeight: number;
  carousel: ScrollBoardCarousel;
  headerBgColor: string;
  headerTextColor: string;
  oddRowBgColor: string;
  evenRowBgColor: string;
  textColor: string;
  accentColor: string;
}

const scrollBoardDefaultData = scrollBoardDataJson as ScrollBoardDataset;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultAttr: WidgetAttr = {
  x: 260,
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
  text: "滚动列表表格",
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

export function createDefaultScrollBoardConfig(): ScrollBoardConfig {
  return cloneValue({
    dataset: scrollBoardDefaultData,
    index: true,
    indexHeader: "#",
    columnWidth: [72, 180, 140, 120],
    align: ["center", "left", "right", "right"],
    rowNum: 5,
    waitTime: 2,
    headerHeight: 38,
    carousel: "single",
    headerBgColor: "#23422a",
    headerTextColor: "#f5fff7",
    oddRowBgColor: "#f7f8f2",
    evenRowBgColor: "#eef2ea",
    textColor: "#1a1c19",
    accentColor: "#6f8f75",
  } satisfies ScrollBoardConfig);
}

function createWidgetId() {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultScrollBoardWidget(): CustomWidget {
  return {
    id: createWidgetId(),
    registrationKey: SCROLL_BOARD_WIDGET_KEY,
    chartFrame: ChartFrame.CUSTOM,
    attr: cloneValue(defaultAttr),
    styles: cloneValue(defaultStyles),
    title: cloneValue(defaultTitle),
    status: cloneValue(defaultStatus),
    dataSource: cloneValue(defaultDataSource),
    events: cloneValue(defaultEvents),
    config: createDefaultScrollBoardConfig(),
  };
}

export function cloneScrollBoardConfig(config: ScrollBoardConfig): ScrollBoardConfig {
  return cloneValue(config);
}
