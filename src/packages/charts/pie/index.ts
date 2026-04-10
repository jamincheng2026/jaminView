import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import pieThumbnail from "@/assets/widget-thumbnails/charts/pie.png";
import { createDefaultPieWidget } from "./config";
import { PieChartPanel } from "./panel";
import { PieChartRender } from "./render";

export const pieWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-pie",
    title: "Pie Chart",
    titleZh: "饼图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "◔",
    note: "Circular proportion chart",
    noteZh: "适合做占比、结构和份额展示",
    thumbnail: pieThumbnail,
    defaultWidth: 520,
    defaultHeight: 420,
  },
  createDefault: createDefaultPieWidget,
  RenderComponent: PieChartRender,
  PanelComponent: PieChartPanel,
};

export default pieWidgetPackage;
