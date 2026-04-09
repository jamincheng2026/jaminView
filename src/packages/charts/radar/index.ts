import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import radarThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/radar.png";
import { createDefaultRadarWidget } from "./config";
import { RadarChartPanel } from "./panel";
import { RadarChartRender } from "./render";

export const radarWidgetPackage: WidgetPackage = {
  registration: {
    key: "chart-radar",
    title: "Radar Chart",
    titleZh: "雷达图",
    category: WidgetCategory.CHARTS,
    chartFrame: ChartFrame.VCHART,
    icon: "◎",
    note: "Radar capability comparison chart",
    noteZh: "适合做能力评分、维度对比和画像展示",
    thumbnail: radarThumbnail,
    defaultWidth: 640,
    defaultHeight: 480,
  },
  createDefault: createDefaultRadarWidget,
  RenderComponent: RadarChartRender,
  PanelComponent: RadarChartPanel,
};

export default radarWidgetPackage;
