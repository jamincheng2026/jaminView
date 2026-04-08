import type {ScreenCanvasPreset, ScreenConfig} from "@/lib/editor-storage";

type ToolItem = {
  name: string;
  icon: string;
  note?: string;
};

type ToolGroup = {
  title: string;
  items: ToolItem[];
};

export type EditorDatasetField = {
  field: string;
  type: string;
  sample: string;
  icon: string;
};

export type EditorDatasetSchema = {
  name: string;
  records: string;
  fields: EditorDatasetField[];
  rows: Record<string, string | number>[];
};

export type WidgetShadow = "none" | "soft" | "medium" | "strong";
export type WidgetTitleAlign = "left" | "center" | "right";
export type ImageFitMode = "cover" | "contain" | "fill";
export type TableHeaderTone = "muted" | "emerald" | "charcoal";
export type TableDensity = "compact" | "comfortable";
export type ImageOverlayDirection = "bottom" | "center" | "full";
export type ChartPaddingMode = "compact" | "balanced" | "showcase";
export type ChartGridStyle = "dashed" | "solid" | "dot";
export type ChartLegendTone = "muted" | "balanced" | "strong";
export type TableAlign = "left" | "center" | "right";
export type ChartStylePreset = "executive" | "signal" | "comparison" | "minimal";
export type TableNumberFormat = "raw" | "compact" | "currency" | "percent";
export type ImageFilterPreset = "natural" | "cinematic" | "cool" | "mono";
export type TableSurfacePreset = "soft" | "panel" | "contrast";
export type TableDividerTone = "soft" | "strong" | "none";
export type ImagePresentationPreset = "card" | "immersive" | "editorial";
export type ImageCaptionTone = "soft" | "strong";
export type DecorationPreset = "frame" | "badge" | "divider" | "glow";
export type WidgetDataFilterOperator = "contains" | "equals" | "gt" | "gte" | "lt" | "lte";
export type WidgetDataSortDirection = "asc" | "desc";
export type WidgetDataAggregateMode = "none" | "sum" | "avg" | "min" | "max" | "count";
export type WidgetRequestMethod = "GET" | "POST";
export type WidgetEventAction = "none" | "openLink" | "openPreview" | "openPublished" | "focusWidget";
export type WidgetEventOpenMode = "self" | "blank";

export type EditorWidgetType =
  | "metric"
  | "line"
  | "area"
  | "pie"
  | "map"
  | "bar"
  | "events"
  | "table"
  | "rank"
  | "text"
  | "image"
  | "numberFlip"
  | "decoration";

export type EditorWidget = {
  id: string;
  type: EditorWidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataset: string;
  dataSourceMode?: "static" | "dataset" | "manual" | "request";
  manualData?: string;
  fill: string;
  visible: boolean;
  opacity?: number;
  stroke?: string;
  accent?: string;
  value?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  hint?: string;
  fieldMap?: string;
  radius?: number;
  padding?: number;
  shadow?: WidgetShadow;
  titleVisible?: boolean;
  titleAlign?: WidgetTitleAlign;
  titleColor?: string;
  titleSize?: number;
  titleTracking?: number;
  titleUppercase?: boolean;
  zIndex?: number;
  locked?: boolean;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  fontWeight?: "regular" | "medium" | "semibold" | "bold";
  lineHeight?: number;
  letterSpacing?: number;
  imageFit?: ImageFitMode;
  imageOverlayColor?: string;
  imageOverlayOpacity?: number;
  chartTone?: "soft" | "contrast" | "night";
  chartPalette?: "forest" | "ocean" | "sunset" | "mono";
  chartPaletteColors?: string[];
  chartPanelStyle?: "flat" | "elevated" | "glow";
  chartStylePreset?: ChartStylePreset;
  chartTitlePreset?: "minimal" | "divider" | "capsule" | "signal";
  chartPaddingMode?: ChartPaddingMode;
  chartGridStyle?: ChartGridStyle;
  chartGridOpacity?: number;
  chartAxisOpacity?: number;
  chartAxisColor?: string;
  chartGridColor?: string;
  chartSurfaceAccentColor?: string;
  chartBorderColor?: string;
  chartBorderWidth?: number;
  chartShadowColor?: string;
  chartShadowOpacity?: number;
  chartGlowColor?: string;
  chartGlowOpacity?: number;
  chartTitleAccentColor?: string;
  chartTitleBackgroundColor?: string;
  chartTitleBorderColor?: string;
  chartTitleSurfaceOpacity?: number;
  chartTitleBorderWidth?: number;
  chartTitleRadius?: number;
  chartTitleDividerWidth?: number;
  chartTitleSignalSize?: number;
  chartTitlePaddingX?: number;
  chartTitlePaddingY?: number;
  chartTitleDividerStartColor?: string;
  chartTitleDividerEndColor?: string;
  chartTitleSignalHaloColor?: string;
  chartLegendTone?: ChartLegendTone;
  chartLabelTone?: ChartLegendTone;
  chartBadgeLayout?: "split" | "stacked" | "footer";
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
  showHighlightBadges?: boolean;
  showXAxisLabels?: boolean;
  showYAxisLabels?: boolean;
  showXAxisLine?: boolean;
  showYAxisLine?: boolean;
  showSeriesPoints?: boolean;
  lineSmooth?: boolean;
  lineStyle?: "solid" | "dashed";
  lineWeight?: number;
  pointSize?: number;
  axisLabelSize?: number;
  axisLabelRotate?: number;
  areaOpacity?: number;
  barRadius?: number;
  pieInnerRadius?: number;
  legendPosition?: "right" | "bottom";
  chartLabelFormat?: "raw" | "compact" | "percent";
  chartDecimals?: number;
  tableColumns?: string[];
  tableColumnLabels?: Record<string, string>;
  tableColumnWidths?: Record<string, number>;
  tableHeaderTone?: TableHeaderTone;
  tableDensity?: TableDensity;
  tableSurfacePreset?: TableSurfacePreset;
  tableDividerTone?: TableDividerTone;
  tableZebra?: boolean;
  tableHighlightFirstColumn?: boolean;
  tableHighlightNumbers?: boolean;
  tableCellAlign?: TableAlign;
  tableHeaderAlign?: TableAlign;
  tableNumberFormat?: TableNumberFormat;
  dataFilterField?: string;
  dataFilterOperator?: WidgetDataFilterOperator;
  dataFilterValue?: string;
  dataSortField?: string;
  dataSortDirection?: WidgetDataSortDirection;
  dataLimit?: number;
  dataAggregateMode?: WidgetDataAggregateMode;
  dataTruncateLength?: number;
  requestUrl?: string;
  requestMethod?: WidgetRequestMethod;
  requestRefreshInterval?: number;
  requestParams?: string;
  requestResponseMap?: string;
  eventAction?: WidgetEventAction;
  eventOpenMode?: WidgetEventOpenMode;
  eventUrl?: string;
  eventTargetWidgetId?: string;
  eventTargetWidgetIds?: string[];
  eventConditionField?: string;
  eventConditionOperator?: WidgetDataFilterOperator;
  eventConditionValue?: string;
  tableHeaderBgColor?: string;
  tableHeaderTextColor?: string;
  tableHeaderMetaColor?: string;
  tableHeaderTracking?: number;
  tableHeaderSize?: number;
  tableHeaderDividerColor?: string;
  tableHeaderDividerWidth?: number;
  tableBodyColor?: string;
  tableRowHoverColor?: string;
  tableBorderColor?: string;
  tableBorderWidth?: number;
  tableDividerColor?: string;
  tableStripeColor?: string;
  tableKeyColor?: string;
  tableNumberColor?: string;
  tableMetaColor?: string;
  tableCellSize?: number;
  tableStatusPositiveColor?: string;
  tableStatusWarningColor?: string;
  tableStatusCriticalColor?: string;
  tableStatusNeutralColor?: string;
  tableStatusBackgroundOpacity?: number;
  tableShadowColor?: string;
  tableShadowOpacity?: number;
  imageOverlayDirection?: ImageOverlayDirection;
  imagePresentationPreset?: ImagePresentationPreset;
  imageCaptionTone?: ImageCaptionTone;
  imageZoom?: number;
  imageGrayscale?: boolean;
  imageBorderStyle?: "none" | "soft" | "frame";
  imageFilterPreset?: ImageFilterPreset;
  imageBrightness?: number;
  imageContrast?: number;
  imageSaturation?: number;
  imageBorderColor?: string;
  imageBorderWidth?: number;
  imageShadowColor?: string;
  imageShadowOpacity?: number;
  imageCaptionTextColor?: string;
  imageCaptionBackgroundColor?: string;
  imageCaptionBorderColor?: string;
  imageCaptionBorderWidth?: number;
  imageCaptionOpacity?: number;
  imageCaptionBlur?: number;
  imageCaptionPadding?: number;
  imageCaptionRadius?: number;
  imageCaptionShadowColor?: string;
  imageCaptionShadowOpacity?: number;
  imageOverlayBlur?: number;
  numberFlipDigitSize?: number;
  numberFlipGap?: number;
  numberFlipSurfaceColor?: string;
  numberFlipGlowOpacity?: number;
  decorationPreset?: DecorationPreset;
  decorationSecondaryColor?: string;
  decorationLineWidth?: number;
  decorationGlowOpacity?: number;
};

export const editorProject = {
  id: "q4-analytics",
  name: "Q4 Analytics",
  status: "All changes saved",
  zoom: "85%",
  canvasLabel: "1920 x 1080",
};

export const EDITOR_CANVAS_WIDTH = 1920;
export const EDITOR_CANVAS_HEIGHT = 1080;

export const defaultScreenConfig: ScreenConfig = {
  title: "全球物流与供应链实时中心",
  subtitle: "实时情报流 · Q4 监控阶段",
  canvasPreset: "1920x1080",
  canvasWidth: 1920,
  canvasHeight: 1080,
  headerVariant: "classic",
  showHeader: true,
  showTimestamp: true,
  showStatusBadge: true,
  statusBadgeLabel: "1920 × 1080",
  statusMetaLabel: "实时监控",
  timeText: "14:22:05 UTC",
  dateText: "Oct 24, 2023",
  rightMetaPrimary: "18°C",
  rightMetaSecondary: "Shanghai",
  backgroundMode: "gradient",
  backgroundColor: "#fafaf5",
  backgroundGradient: "linear-gradient(180deg, #f7f5ef 0%, #eef4ea 36%, #eef2ea 100%)",
  backgroundImage: "",
  backgroundFit: "cover",
  backgroundOverlay: 18,
  displayMode: "contain",
  displayAlign: "center",
  presentationMode: "standard",
};

export const canvasPresets: Array<{
  id: ScreenCanvasPreset;
  label: string;
  width: number;
  height: number;
}> = [
  {id: "1920x1080", label: "1920 × 1080", width: 1920, height: 1080},
  {id: "2560x1080", label: "2560 × 1080", width: 2560, height: 1080},
  {id: "3840x1080", label: "3840 × 1080", width: 3840, height: 1080},
  {id: "custom", label: "Custom", width: 1920, height: 1080},
];

export const editorToolGroups: ToolGroup[] = [
  {
    title: "Charts & Data",
    items: [
      {name: "Line Chart", icon: "╱╲"},
      {name: "Area Chart", icon: "▁▃▆"},
      {name: "Bar Chart", icon: "▇▅"},
      {name: "Pie Chart", icon: "◔"},
      {name: "Data Table", icon: "▤"},
      {name: "Rank List", icon: "≣"},
    ],
  },
  {
    title: "Geospatial",
    items: [{name: "Interactive World Map", icon: "◎", note: "3D GL layers enabled"}],
  },
  {
    title: "Media & UI",
    items: [
      {name: "Image", icon: "▣"},
      {name: "Text Block", icon: "T"},
    ],
  },
  {
    title: "Decor & Display",
    items: [
      {name: "Border Decoration", icon: "□"},
      {name: "Accent Decoration", icon: "◇"},
      {name: "Divider Decoration", icon: "─"},
      {name: "Glow Decoration", icon: "✦"},
      {name: "Number Flip", icon: "09"},
    ],
  },
];

export const editorLayers = [
  "Dashboard Header",
  "KPI Stack",
  "Revenue Forecast",
  "World Map",
  "Shipment Volume",
  "Recent Events",
  "Fleet Table",
];

export const editorDatasetSchemas: EditorDatasetSchema[] = [
  {
    name: "logistics_dump_v2_final.csv",
    records: "248k rows",
    fields: [
      {field: "order_id", type: "Numeric", sample: "8412093", icon: "#"},
      {field: "region", type: "Category", sample: "South-East", icon: "◫"},
      {field: "delivery_time", type: "Date / Time", sample: "2023-11-24 14:02", icon: "◷"},
      {field: "status", type: "Text", sample: "In Transit", icon: "Aa"},
    ],
    rows: [
      {order_id: 8412093, region: "South-East", delivery_time: "2023-11-24 14:02", status: "In Transit"},
      {order_id: 8412094, region: "North", delivery_time: "2023-11-24 15:40", status: "Delayed"},
      {order_id: 8412095, region: "West", delivery_time: "2023-11-25 09:18", status: "Delivered"},
      {order_id: 8412096, region: "South-East", delivery_time: "2023-11-25 13:55", status: "In Transit"},
      {order_id: 8412097, region: "East", delivery_time: "2023-11-26 08:12", status: "Pending Review"},
      {order_id: 8412098, region: "North", delivery_time: "2023-11-26 19:20", status: "Delivered"},
    ],
  },
  {
    name: "carrier_health_summary.json",
    records: "28 metrics",
    fields: [
      {field: "carrier_name", type: "Category", sample: "Maersk", icon: "◫"},
      {field: "region_heat", type: "Numeric", sample: "42", icon: "#"},
      {field: "delay_risk", type: "Numeric", sample: "0.28", icon: "#"},
      {field: "updated_at", type: "Date / Time", sample: "2023-10-24 14:22", icon: "◷"},
    ],
    rows: [
      {carrier_name: "Maersk", region_heat: 42, delay_risk: 0.28, updated_at: "2023-10-24 14:22"},
      {carrier_name: "MSC", region_heat: 36, delay_risk: 0.18, updated_at: "2023-10-24 14:22"},
      {carrier_name: "CMA CGM", region_heat: 31, delay_risk: 0.22, updated_at: "2023-10-24 14:22"},
      {carrier_name: "COSCO", region_heat: 29, delay_risk: 0.14, updated_at: "2023-10-24 14:22"},
      {carrier_name: "Evergreen", region_heat: 24, delay_risk: 0.11, updated_at: "2023-10-24 14:22"},
    ],
  },
];

export const editorDatasets = editorDatasetSchemas.map(({name, records}) => ({name, records}));

export const editorProperties = {
  layout: {
    width: "768",
    height: "480",
    x: "120",
    y: "240",
  },
  appearance: {
    fill: "#e3eee2",
    opacity: "100%",
    stroke: "2px dotted",
  },
  map: {
    showLabels: true,
    show3DAxis: true,
    zoom: "2.4x",
  },
};

export const editorWidgets: EditorWidget[] = [
  {
    id: "active-vessels",
    type: "metric",
    title: "Active Vessels",
    x: 0,
    y: 0,
    width: 440,
    height: 164,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#fafaf5",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#23422a",
    value: "1,284",
    hint: "+4.2%",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    zIndex: 10,
    locked: false,
  },
  {
    id: "revenue-forecast",
    type: "line",
    title: "Revenue Forecast",
    x: 0,
    y: 188,
    width: 440,
    height: 320,
    dataset: editorDatasets[1]?.name ?? "carrier_health_summary.json",
    fill: "#fafaf5",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#215637",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    chartTone: "soft",
    chartPalette: "forest",
    chartPaddingMode: "balanced",
    chartGridStyle: "dashed",
    chartGridOpacity: 42,
    chartAxisOpacity: 56,
    chartLabelTone: "balanced",
    showHighlightBadges: true,
    zIndex: 20,
    locked: false,
  },
  {
    id: "carrier-load",
    type: "pie",
    title: "Carrier Load %",
    x: 0,
    y: 532,
    width: 440,
    height: 320,
    dataset: editorDatasets[1]?.name ?? "carrier_health_summary.json",
    fill: "#fafaf5",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#23422a",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    chartTone: "contrast",
    chartPalette: "sunset",
    chartPaddingMode: "balanced",
    chartLegendTone: "balanced",
    chartLabelTone: "strong",
    showLegend: true,
    showHighlightBadges: true,
    zIndex: 30,
    locked: false,
  },
  {
    id: "world-map",
    type: "map",
    title: "Interactive World Map",
    x: 464,
    y: 0,
    width: 992,
    height: 852,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#20302a",
    visible: true,
    opacity: 1,
    stroke: "1px solid",
    accent: "#23422a",
    radius: 8,
    padding: 12,
    shadow: "medium",
    titleVisible: true,
    titleAlign: "left",
    zIndex: 40,
    locked: false,
  },
  {
    id: "route-divider",
    type: "decoration",
    title: "Route Divider",
    x: 560,
    y: 92,
    width: 800,
    height: 56,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "transparent",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#8fe1a7",
    value: "Mediterranean Sync",
    hint: "Cross-fleet corridor pulse",
    radius: 0,
    padding: 0,
    shadow: "none",
    titleVisible: false,
    titleAlign: "left",
    textColor: "#e9fff0",
    decorationPreset: "divider",
    decorationSecondaryColor: "#315a41",
    decorationLineWidth: 2,
    decorationGlowOpacity: 32,
    zIndex: 45,
    locked: false,
  },
  {
    id: "delayed-shipments",
    type: "numberFlip",
    title: "Delayed Shipments",
    x: 1480,
    y: 0,
    width: 440,
    height: 164,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#13211d",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#ff8f80",
    value: "42",
    hint: "Suez route congestion",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    titleColor: "#e9fff0",
    textColor: "#fff4f2",
    numberFlipDigitSize: 44,
    numberFlipGap: 10,
    numberFlipSurfaceColor: "#21342d",
    numberFlipGlowOpacity: 28,
    zIndex: 50,
    locked: false,
  },
  {
    id: "shipment-volume",
    type: "bar",
    title: "Shipment Volume",
    x: 1480,
    y: 188,
    width: 440,
    height: 320,
    dataset: editorDatasets[1]?.name ?? "carrier_health_summary.json",
    fill: "#fafaf5",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#406840",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    chartTone: "night",
    chartPalette: "ocean",
    chartPaddingMode: "showcase",
    chartGridStyle: "dot",
    chartGridOpacity: 52,
    chartAxisOpacity: 68,
    chartLabelTone: "strong",
    showHighlightBadges: true,
    zIndex: 60,
    locked: false,
  },
  {
    id: "recent-events",
    type: "events",
    title: "Recent Events",
    x: 1480,
    y: 532,
    width: 440,
    height: 320,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#fafaf5",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#23422a",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    zIndex: 70,
    locked: false,
  },
  {
    id: "fleet-table",
    type: "table",
    title: "Fleet Table",
    x: 0,
    y: 876,
    width: 1920,
    height: 204,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#f4f4ef",
    visible: true,
    opacity: 1,
    stroke: "1px solid",
    accent: "#23422a",
    radius: 8,
    padding: 0,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
    zIndex: 80,
    locked: false,
  },
  {
    id: "screen-frame",
    type: "decoration",
    title: "Screen Frame",
    x: 24,
    y: 68,
    width: 1872,
    height: 988,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "transparent",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#8fe1a7",
    value: "Global Mesh",
    hint: "Live routing surface",
    radius: 22,
    padding: 0,
    shadow: "none",
    titleVisible: false,
    titleAlign: "left",
    textColor: "#e9fff0",
    decorationPreset: "frame",
    decorationSecondaryColor: "#315a41",
    decorationLineWidth: 2,
    decorationGlowOpacity: 26,
    zIndex: 5,
    locked: false,
  },
];

export const editorTemplates = [
  {id: "ops-center", name: "Operations Command Center", note: "Live KPI layout"},
  {id: "sales-atlas", name: "Sales Atlas Board", note: "Regional conversion focus"},
  {id: "city-monitor", name: "City Monitor Screen", note: "3D geo scene preset"},
];
