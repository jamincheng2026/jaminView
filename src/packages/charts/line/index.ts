import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import lineThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/line.png";
import { createDefaultLineWidget } from "./config";
import { LineChartPanel } from "./panel";
import { LineChartRender } from "./render";

export const lineWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-line",
    title: "Line Chart",
    titleZh: "折线图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "∿",
    note: "Basic trend line chart",
    noteZh: "基础趋势折线图",
    thumbnail: lineThumbnail,
    defaultWidth: 760,
    defaultHeight: 420,
  },
  createDefault: createDefaultLineWidget,
  RenderComponent: LineChartRender,
  PanelComponent: LineChartPanel,
};

export default lineWidgetPackage;
