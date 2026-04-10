import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import mapThumbnail from "@/assets/widget-thumbnails/maps/amap-loca.png";
import { createDefaultAmapLocaMapWidget } from "./config";
import { AmapLocaMapPanel } from "./panel";
import { AmapLocaMapRender } from "./render";

export const amapLocaMapWidgetPackage: WidgetPackage = {
  registration: {
    key: "map-amap-loca",
    title: "Amap Loca Business Map",
    titleZh: "高德 Loca 业务地图",
    category: WidgetCategory.MAPS,
    chartFrame: ChartFrame.CUSTOM,
    icon: "◎",
    note: "Business map with region drill and Loca heat layer",
    noteZh: "支持省市级下钻、业务热力和高德底图风格控制",
    thumbnail: mapThumbnail,
    defaultWidth: 1120,
    defaultHeight: 760,
  },
  createDefault: createDefaultAmapLocaMapWidget,
  RenderComponent: AmapLocaMapRender,
  PanelComponent: AmapLocaMapPanel,
};

export default amapLocaMapWidgetPackage;
