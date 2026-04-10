import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import scrollBoardThumbnail from "@/assets/widget-thumbnails/tables/scroll-board.png";
import { createDefaultScrollBoardWidget } from "./config";
import { ScrollBoardPanel } from "./panel";
import { ScrollBoardRender } from "./render";

export const scrollBoardWidgetPackage: WidgetPackage = {
  registration: {
    key: "table-scroll-board",
    title: "Scroll Board",
    titleZh: "滚动列表表格",
    category: WidgetCategory.TABLES,
    chartFrame: ChartFrame.CUSTOM,
    icon: "􀙨",
    note: "Auto-scrolling data board",
    noteZh: "对照 GoView 轮播列表补齐的滚动业务表格。",
    thumbnail: scrollBoardThumbnail,
    defaultWidth: 760,
    defaultHeight: 420,
  },
  createDefault: createDefaultScrollBoardWidget,
  RenderComponent: ScrollBoardRender,
  PanelComponent: ScrollBoardPanel,
};

export default scrollBoardWidgetPackage;
