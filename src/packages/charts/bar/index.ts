import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import barThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/bar_x.png";
import { createDefaultBarWidget } from "./config";
import { BarChartPanel } from "./panel";
import { BarChartRender } from "./render";

export const barWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-bar",
    title: "Bar Chart",
    titleZh: "柱状图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "▇",
    note: "Basic comparative bar chart",
    noteZh: "基础业务对比柱状图",
    thumbnail: barThumbnail,
    defaultWidth: 760,
    defaultHeight: 420,
  },
  createDefault: createDefaultBarWidget,
  RenderComponent: BarChartRender,
  PanelComponent: BarChartPanel,
};

export default barWidgetPackage;
