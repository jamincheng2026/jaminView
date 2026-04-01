import type {ScreenConfig} from "@/lib/editor-storage";

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
  | "image";

export type EditorWidget = {
  id: string;
  type: EditorWidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataset: string;
  fill: string;
  visible: boolean;
  opacity?: number;
  stroke?: string;
  accent?: string;
  value?: string;
  hint?: string;
  fieldMap?: string;
  radius?: number;
  padding?: number;
  shadow?: WidgetShadow;
  titleVisible?: boolean;
  titleAlign?: WidgetTitleAlign;
  zIndex?: number;
  locked?: boolean;
  textColor?: string;
  fontSize?: number;
  fontWeight?: "regular" | "medium" | "semibold" | "bold";
  lineHeight?: number;
  imageFit?: ImageFitMode;
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
};

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
    id: "delayed-shipments",
    type: "metric",
    title: "Delayed Shipments",
    x: 1480,
    y: 0,
    width: 440,
    height: 164,
    dataset: editorDatasets[0]?.name ?? "logistics_dump_v2_final.csv",
    fill: "#ffdad6",
    visible: true,
    opacity: 1,
    stroke: "none",
    accent: "#ba1a1a",
    value: "42",
    hint: "Suez route congestion",
    radius: 8,
    padding: 16,
    shadow: "soft",
    titleVisible: true,
    titleAlign: "left",
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
];

export const editorTemplates = [
  {id: "ops-center", name: "Operations Command Center", note: "Live KPI layout"},
  {id: "sales-atlas", name: "Sales Atlas Board", note: "Regional conversion focus"},
  {id: "city-monitor", name: "City Monitor Screen", note: "3D geo scene preset"},
];
