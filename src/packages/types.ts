/**
 * JaminView Widget Package Type System
 *
 * Inspired by GoView's component architecture:
 * - Every widget type is a self-contained "package" with registration, config, panel, render, and data.
 * - Public attributes (position, filters, status) are separated from widget-specific config (VChart spec, map config, etc.)
 * - VChart widgets store their spec as the single source of truth for rendering.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Widget category — used for left sidebar grouping and registry lookup. */
export enum WidgetCategory {
  CHARTS = "charts",
  MAPS = "maps",
  TABLES = "tables",
  MEDIA = "media",
  DECORATES = "decorates",
  INFO = "info",
}

/** Chart rendering framework identifier. */
export enum ChartFrame {
  /** Rendered via VChart `<VChart spec={...} />` */
  VCHART = "vchart",
  /** Custom render (map, table, decoration, etc.) */
  CUSTOM = "custom",
  /** Static element — no data binding (text, image, decoration) */
  STATIC = "static",
}

/** Shadow presets */
export type WidgetShadow = "none" | "soft" | "medium" | "strong";

/** Data source mode */
export type DataSourceMode = "static" | "dataset" | "manual" | "request";

/** Request method */
export type RequestMethod = "GET" | "POST";

// ---------------------------------------------------------------------------
// Widget Registration (GoView: index.ts → ConfigType)
// ---------------------------------------------------------------------------

/** Static metadata that describes a widget type for the component pool and registry. */
export interface WidgetRegistration {
  /** Unique key for this widget type, e.g. "bar", "line", "pie", "globe-map" */
  key: string;
  /** English display title */
  title: string;
  /** Chinese display title */
  titleZh: string;
  /** Category for sidebar grouping */
  category: WidgetCategory;
  /** Rendering framework */
  chartFrame: ChartFrame;
  /** Icon character for the component pool */
  icon: string;
  /** Optional note shown in component pool */
  note?: string;
  noteZh?: string;
  /** Default dimensions when dragged onto canvas */
  defaultWidth: number;
  defaultHeight: number;
}

// ---------------------------------------------------------------------------
// Widget Base (GoView: PublicConfigClass)
// ---------------------------------------------------------------------------

/** Position and size attributes — shared by all widgets. */
export interface WidgetAttr {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

/** Visual styles — shared by all widgets. */
export interface WidgetStyles {
  opacity: number;
  fill: string;
  stroke: string;
  radius: number;
  padding: number;
  shadow: WidgetShadow;
}

/** Lock / hide status. */
export interface WidgetStatus {
  locked: boolean;
  hidden: boolean;
}

/** Title configuration. */
export interface WidgetTitle {
  text: string;
  visible: boolean;
  align: "left" | "center" | "right";
  color?: string;
  size?: number;
  weight?: string;
  tracking?: number;
  uppercase?: boolean;
}

/** Data source configuration. */
export interface WidgetDataSource {
  mode: DataSourceMode;
  /** Name of the bound dataset (when mode = "dataset") */
  datasetName?: string;
  /** Raw JSON string (when mode = "manual") */
  manualJson?: string;
  /** Request configuration (when mode = "request") */
  request?: {
    url: string;
    method: RequestMethod;
    refreshInterval?: number;
    params?: string;
    responseMap?: string;
  };
}

/** Event / interaction configuration — placeholder for future expansion. */
export interface WidgetEvents {
  action?: "none" | "openLink" | "openPreview" | "focusWidget";
  openMode?: "self" | "blank";
  url?: string;
  targetWidgetId?: string;
}

/**
 * Base type for ALL widgets on the canvas.
 * Contains only public/shared properties.
 * Widget-specific configuration lives in the `config` field of each concrete widget type.
 */
export interface WidgetBase {
  /** Unique instance ID */
  id: string;
  /** Registration key — used to look up the widget package from registry */
  registrationKey: string;
  /** Position & size */
  attr: WidgetAttr;
  /** Visual styles */
  styles: WidgetStyles;
  /** Title */
  title: WidgetTitle;
  /** Status */
  status: WidgetStatus;
  /** Data source */
  dataSource: WidgetDataSource;
  /** Events */
  events: WidgetEvents;
}

// ---------------------------------------------------------------------------
// VChart Widget (GoView: CreateComponentType with chartFrame = ECHARTS)
// ---------------------------------------------------------------------------

/**
 * A widget that renders via VChart.
 * The `spec` field is the VChart spec object — the single source of truth.
 * Right-side panel edits modify spec fields directly.
 */
export interface VChartWidget extends WidgetBase {
  chartFrame: ChartFrame.VCHART;
  /**
   * VChart spec object.
   * This is the **exact** spec passed to `<VChart spec={...} />`.
   * Panel fields map 1:1 to spec paths (e.g. `spec.bar.style.cornerRadius`).
   */
  spec: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Custom Widget (maps, tables, decorations, etc.)
// ---------------------------------------------------------------------------

/**
 * A widget with custom rendering logic (not VChart).
 * The `config` field holds widget-specific configuration.
 */
export interface CustomWidget extends WidgetBase {
  chartFrame: ChartFrame.CUSTOM | ChartFrame.STATIC;
  /** Widget-specific configuration — structure varies per widget type. */
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Union Type
// ---------------------------------------------------------------------------

/** Any widget that can appear on the canvas. */
export type Widget = VChartWidget | CustomWidget;

// ---------------------------------------------------------------------------
// Registry Entry (GoView: dynamic component resolution)
// ---------------------------------------------------------------------------

/**
 * A registered widget package.
 * Created by each widget's index.ts and added to the global registry.
 */
export interface WidgetPackage {
  /** Static registration metadata */
  registration: WidgetRegistration;
  /** Factory function to create a default widget instance */
  createDefault: () => Widget;
  /**
   * React component for rendering on the canvas.
   * Props: { widget: Widget; width: number; height: number }
   */
  RenderComponent: React.ComponentType<{ widget: Widget; width: number; height: number }>;
  /**
   * React component for the right-side configuration panel.
   * Props: { widget: Widget; onUpdate: (patch: Partial<Widget>) => void }
   */
  PanelComponent: React.ComponentType<{ widget: Widget; onUpdate: (patch: Record<string, unknown>) => void }>;
}
