import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import scatterThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/scatter-multi.png";
import { createDefaultScatterWidget } from "./config";
import { ScatterChartPanel } from "./panel";
import { ScatterChartRender } from "./render";

export const scatterWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-scatter",
    title: "Scatter Chart",
    titleZh: "散点图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "◌",
    note: "Distribution and correlation scatter plot",
    noteZh: "适合分析分布、相关性和经营象限",
    thumbnail: scatterThumbnail,
    defaultWidth: 760,
    defaultHeight: 420,
  },
  createDefault: createDefaultScatterWidget,
  RenderComponent: ScatterChartRender,
  PanelComponent: ScatterChartPanel,
};

export default scatterWidgetPackage;
