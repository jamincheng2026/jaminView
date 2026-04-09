import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import clockThumbnail from "../../../../reference/go-view/src/assets/images/chart/decorates/clock.png";
import { createDefaultClockSystemWidget } from "./config";
import { ClockSystemPanel } from "./panel";
import { ClockSystemRender } from "./render";

export const clockSystemWidgetPackage: WidgetPackage = {
  registration: {
    key: "decorate-clock-system",
    title: "Clock System",
    titleZh: "时钟系统",
    category: WidgetCategory.DECORATES,
    chartFrame: ChartFrame.CUSTOM,
    icon: "􀐫",
    note: "Analog plus digital time panel",
    noteZh: "对照 GoView 时钟与时间组件整合出的大屏时间物料。",
    thumbnail: clockThumbnail,
    defaultWidth: 520,
    defaultHeight: 220,
  },
  createDefault: createDefaultClockSystemWidget,
  RenderComponent: ClockSystemRender,
  PanelComponent: ClockSystemPanel,
};

export default clockSystemWidgetPackage;
