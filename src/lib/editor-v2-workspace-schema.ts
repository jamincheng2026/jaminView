/**
 * 工作区导入 deep schema —— 阻断恶意 JSON：
 * 1. 强制每个字段的类型与枚举范围
 * 2. events.url / dataPonds[*].request.url 走白名单
 * 3. dataPonds[*].request.transformer 单独标记，外层调用方在导入时清空并审查
 *
 * 不依赖 `as` 强转 / `Widget[]`，从而把工作区 JSON 当作纯外部输入对待。
 */

import {z} from "zod";

const SAFE_HREF_PATTERN = /^(https?:\/\/|\/(?!\/))/i;

const groupTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
});

const widgetAttrSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  zIndex: z.number(),
});

const animationPresetSchema = z.enum([
  "fadeIn",
  "riseIn",
  "zoomIn",
  "pulse",
  "float",
  "breathe",
]);

const widgetStylesSchema = z.object({
  opacity: z.number(),
  fill: z.string(),
  stroke: z.string(),
  radius: z.number(),
  padding: z.number(),
  shadow: z.enum(["none", "soft", "medium", "strong"]),
  animations: z.array(animationPresetSchema),
});

const widgetTitleSchema = z.object({
  text: z.string(),
  visible: z.boolean(),
  align: z.enum(["left", "center", "right"]),
  color: z.string().optional(),
  size: z.number().optional(),
  weight: z.string().optional(),
  tracking: z.number().optional(),
  uppercase: z.boolean().optional(),
});

const widgetStatusSchema = z.object({
  locked: z.boolean(),
  hidden: z.boolean(),
});

const widgetRequestConfigSchema = z.object({
  url: z
    .string()
    .refine((value) => value === "" || SAFE_HREF_PATTERN.test(value.trim()), {
      message: "请求 URL 必须为 https?:// 或 /path 形式",
    }),
  method: z.enum(["GET", "POST"]),
  contentMode: z.enum(["default", "sql"]).optional(),
  refreshInterval: z.number().optional(),
  params: z.string().optional(),
  sql: z.string().optional(),
  responseMap: z.string().optional(),
  transformer: z.string().optional(),
});

const widgetDataSourceSchema = z.object({
  mode: z.enum(["static", "dataset", "manual", "request"]),
  datasetName: z.string().optional(),
  dataPondId: z.string().optional(),
  manualJson: z.string().optional(),
  request: widgetRequestConfigSchema.optional(),
});

const widgetEventsSchema = z.object({
  action: z.enum(["none", "openLink", "openPreview", "focusWidget"]).optional(),
  openMode: z.enum(["self", "blank"]).optional(),
  url: z
    .string()
    .optional()
    .transform((value) => {
      const raw = value?.trim() ?? "";
      if (!raw) return "";
      return SAFE_HREF_PATTERN.test(raw) ? raw : "";
    }),
  targetWidgetId: z.string().optional(),
});

const widgetBaseShape = {
  id: z.string().min(1),
  registrationKey: z.string().min(1),
  group: groupTypeSchema.optional(),
  attr: widgetAttrSchema,
  styles: widgetStylesSchema,
  title: widgetTitleSchema,
  status: widgetStatusSchema,
  dataSource: widgetDataSourceSchema,
  events: widgetEventsSchema,
};

const vchartWidgetSchema = z.object({
  ...widgetBaseShape,
  chartFrame: z.literal("vchart"),
  spec: z.record(z.string(), z.unknown()),
});

const customWidgetSchema = z.object({
  ...widgetBaseShape,
  chartFrame: z.union([z.literal("custom"), z.literal("static")]),
  config: z.record(z.string(), z.unknown()),
});

const widgetSchema = z.discriminatedUnion("chartFrame", [
  vchartWidgetSchema,
  customWidgetSchema,
]);

const editorDataPondSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  enabled: z.boolean(),
  request: widgetRequestConfigSchema,
});

const editorDataPondSettingsSchema = z.object({
  pollingInterval: z.number(),
});

const editorV2CanvasFiltersSchema = z.object({
  brightness: z.number(),
  contrast: z.number(),
  enabled: z.boolean(),
  hueRotate: z.number(),
  opacity: z.number(),
  saturate: z.number(),
});

const editorV2CanvasStateSchema = z.object({
  filters: editorV2CanvasFiltersSchema,
  height: z.number(),
  showGrid: z.boolean(),
  showSafeArea: z.boolean(),
  snapToGrid: z.boolean(),
  width: z.number(),
  zoom: z.number(),
});

export const workspaceDocumentSchema = z.object({
  /** 接受 v2 当前版本以及未来的 v2.x */
  version: z.string().regex(/^v2(\.\d+)?$/, {
    message: "工作区 version 字段必须以 v2 开头",
  }),
  kind: z.literal("jaminview-editor-v2-workspace").optional(),
  projectId: z.string().optional(),
  projectTitle: z.string(),
  sourceProjectId: z.string().optional(),
  exportedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  canvas: editorV2CanvasStateSchema,
  dataPonds: z.array(editorDataPondSchema),
  dataPondSettings: editorDataPondSettingsSchema,
  widgets: z.array(widgetSchema),
});

export type WorkspaceDocumentInput = z.input<typeof workspaceDocumentSchema>;
export type WorkspaceDocumentParsed = z.output<typeof workspaceDocumentSchema>;
