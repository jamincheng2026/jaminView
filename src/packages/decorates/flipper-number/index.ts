import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import flipperNumberThumbnail from "@/assets/widget-thumbnails/decorates/flipper-number.png";
import { createDefaultFlipperNumberWidget } from "./config";
import { FlipperNumberPanel } from "./panel";
import { FlipperNumberRender } from "./render";

export const flipperNumberWidgetPackage: WidgetPackage = {
  registration: {
    key: "decorate-flipper-number",
    title: "Flipper Number",
    titleZh: "数字翻牌器",
    category: WidgetCategory.DECORATES,
    chartFrame: ChartFrame.CUSTOM,
    icon: "􀊫",
    note: "Animated split-flap metric display",
    noteZh: "对照 GoView 翻牌器补齐的大屏数字翻牌组件。",
    thumbnail: flipperNumberThumbnail,
    defaultWidth: 420,
    defaultHeight: 180,
  },
  createDefault: createDefaultFlipperNumberWidget,
  RenderComponent: FlipperNumberRender,
  PanelComponent: FlipperNumberPanel,
};

export default flipperNumberWidgetPackage;
