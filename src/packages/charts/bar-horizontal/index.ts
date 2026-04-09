import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import horizontalBarThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/bar_y.png";
import { createDefaultHorizontalBarWidget } from "./config";
import { HorizontalBarChartPanel } from "./panel";
import { HorizontalBarChartRender } from "./render";

export const horizontalBarWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-bar-horizontal",
    title: "Horizontal Bar Chart",
    titleZh: "横向柱状图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "▤",
    note: "Horizontal comparative bar chart",
    noteZh: "适合排名、区间对比和榜单展示",
    thumbnail: horizontalBarThumbnail,
    defaultWidth: 760,
    defaultHeight: 420,
  },
  createDefault: createDefaultHorizontalBarWidget,
  RenderComponent: HorizontalBarChartRender,
  PanelComponent: HorizontalBarChartPanel,
};

export default horizontalBarWidgetPackage;
