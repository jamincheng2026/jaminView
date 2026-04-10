import { ChartFrame, WidgetCategory, type WidgetPackage } from "@/packages/types";

import imageFrameThumbnail from "@/assets/widget-thumbnails/media/image-frame.png";
import { createDefaultImageFrameWidget } from "./config";
import { ImageFramePanel } from "./panel";
import { ImageFrameRender } from "./render";

export const imageFrameWidgetPackage: WidgetPackage = {
  registration: {
    key: "media-image-frame",
    title: "Image Frame",
    titleZh: "静态图片框",
    category: WidgetCategory.MEDIA,
    chartFrame: ChartFrame.STATIC,
    icon: "􀏅",
    note: "Static framed image widget",
    noteZh: "对照 GoView 图片组件补齐的静态画面框。",
    thumbnail: imageFrameThumbnail,
    defaultWidth: 520,
    defaultHeight: 320,
  },
  createDefault: createDefaultImageFrameWidget,
  RenderComponent: ImageFrameRender,
  PanelComponent: ImageFramePanel,
};

export default imageFrameWidgetPackage;
