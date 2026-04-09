import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import mapThumbnail from "../../../../reference/go-view/src/assets/images/chart/charts/map.png";
import { createDefaultChinaGlMapWidget } from "./config";
import { ChinaGlMapPanel } from "./panel";
import { ChinaGlMapRender } from "./render";

export const chinaGlMapWidgetPackage: WidgetPackage = {
  registration: {
    key: "map-china-gl",
    title: "China GL Map",
    titleZh: "中国 3D 科技地图",
    category: WidgetCategory.MAPS,
    chartFrame: ChartFrame.CUSTOM,
    icon: "◫",
    note: "China 3D map powered by ECharts GL",
    noteZh: "支持飞行线、3D 柱状、散点节点和发光层",
    thumbnail: mapThumbnail,
    defaultWidth: 980,
    defaultHeight: 720,
  },
  createDefault: createDefaultChinaGlMapWidget,
  RenderComponent: ChinaGlMapRender,
  PanelComponent: ChinaGlMapPanel,
};

export default chinaGlMapWidgetPackage;
