"use client";

import {MiniAreaChart, MiniBarChart, MiniLineChart, MiniPieChart} from "@/components/editor/editor-chart-widgets";
import {EditorMapWidget} from "@/components/editor/editor-map-widget";
import {
  categoricalSeries,
  eventSnapshot,
  lineSeries,
  metricSnapshot,
  tableSnapshot,
  type WidgetDataset,
} from "@/lib/editor-widget-data";
import {EDITOR_CANVAS_HEIGHT, EDITOR_CANVAS_WIDTH, type EditorWidget} from "@/lib/mocks/editor";

type EditorCanvasWidgetProps = {
  widget: EditorWidget;
  selected?: boolean;
  mapLabels?: boolean;
  map3dAxis?: boolean;
  mapZoom?: string;
  mapTheme?: "emerald" | "midnight" | "amber";
  mapRouteDensity?: "low" | "balanced" | "high";
  mapMarkers?: boolean;
  mapGlow?: number;
  mapRouteStyle?: "solid" | "dashed" | "pulse";
  mapLabelStyle?: "pill" | "minimal";
  mapSurfaceTone?: "soft" | "contrast";
  dataset?: WidgetDataset;
  onSelect?: () => void;
};

export function editorWidgetPlacement(widget: EditorWidget) {
  return {
    left: `${clampDimension(widget.x, 0, EDITOR_CANVAS_WIDTH)}px`,
    top: `${clampDimension(widget.y, 0, EDITOR_CANVAS_HEIGHT)}px`,
    width: `${clampDimension(widget.width, 1, EDITOR_CANVAS_WIDTH)}px`,
    height: `${clampDimension(widget.height, 1, EDITOR_CANVAS_HEIGHT)}px`,
    zIndex: widget.zIndex ?? 1,
  };
}

export function EditorCanvasWidget({
  widget,
  selected = false,
  mapLabels = true,
  map3dAxis = true,
  mapZoom = "2.4x",
  mapTheme = "emerald",
  mapRouteDensity = "balanced",
  mapMarkers = true,
  mapGlow = 72,
  mapRouteStyle = "pulse",
  mapLabelStyle = "pill",
  mapSurfaceTone = "soft",
  dataset,
  onSelect,
}: EditorCanvasWidgetProps) {
  const content = (
    <div
      className={`h-full ${selected ? "ring-2 ring-[#23422a] ring-offset-1" : ""}`}
      style={{
        opacity: widget.opacity ?? 1,
        outline: widgetOutline(widget.stroke, widget.accent),
        outlineOffset: 0,
      }}
    >
      {widget.type === "metric" ? <MetricWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "line" ? <LineWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "area" ? <AreaWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "pie" ? <PieWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "map" ? (
        <EditorMapWidget
          widget={widget}
          dataset={dataset}
          mapLabels={mapLabels}
          map3dAxis={map3dAxis}
          mapZoom={mapZoom}
          mapTheme={mapTheme}
          mapRouteDensity={mapRouteDensity}
          mapMarkers={mapMarkers}
          mapGlow={mapGlow}
          mapRouteStyle={mapRouteStyle}
          mapLabelStyle={mapLabelStyle}
          mapSurfaceTone={mapSurfaceTone}
        />
      ) : null}
      {widget.type === "bar" ? <BarWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "events" ? <EventsWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "table" ? <TableWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "rank" ? <RankWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "text" ? <TextWidget widget={widget} /> : null}
      {widget.type === "image" ? <ImageWidget widget={widget} /> : null}
    </div>
  );

  if (!onSelect) return content;

  return (
    <button onClick={onSelect} className="block h-full w-full text-left">
      {content}
    </button>
  );
}

function MetricWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const alert = widget.accent === "#ba1a1a";
  const accent = widget.accent ?? "#23422a";
  const data = metricSnapshot(dataset, widget.fieldMap);
  const value = widget.value ?? data.value ?? "128";
  const hint = widget.hint ?? data.hint;
  return (
    <div
      className={`border ${
        alert
          ? "border-[#f4b6af] border-l-[3px] border-l-[#ba1a1a] bg-[#ffdad6]/40"
          : "border-[#c2c8bf]/40 border-l-[3px] border-l-[#23422a] bg-[#fafaf5]"
      }`}
      style={widgetCardStyle(widget)}
    >
      <WidgetTitle widget={widget} />
      <div className="mt-3 flex items-end gap-2">
        <div className={`font-headline text-3xl font-extrabold ${alert ? "text-[#ba1a1a]" : ""}`} style={!alert ? {color: accent} : undefined}>
          {value}
        </div>
        {hint ? (
          <div className={`pb-1 text-[10px] font-bold ${alert ? "text-[#ba1a1a]" : ""}`} style={!alert ? {color: accent} : undefined}>
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LineWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#215637";
  const data = lineSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3">
        <MiniLineChart accent={accent} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function AreaWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#2f6d48";
  const data = lineSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3">
        <MiniAreaChart accent={accent} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function PieWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#23422a";
  const data = categoricalSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3">
        <MiniPieChart accent={accent} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function BarWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const data = categoricalSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3">
        <MiniBarChart accent={widget.accent ?? "#406840"} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function EventsWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const rows = eventSnapshot(dataset, widget.fieldMap);
  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      {widget.hint ? <div className="mt-2 text-[8px] uppercase tracking-[0.16em] text-[#727971]">{widget.hint}</div> : null}
      <div className="mt-3 space-y-2 text-[9px]">
        {(rows.length ? rows : defaultEvents).map((row, index) => (
          <div key={`${row.title}-${index}`} className={index < 2 ? "border-b border-[#c2c8bf]/40 pb-2" : ""}>
            <span className={`font-bold ${index === 1 ? "text-[#ba1a1a]" : "text-[#23422a]"}`}>#{4200 + index}</span> {row.title}
            {row.meta ? <span className="ml-2 text-[#727971]">{row.meta}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const snapshot = tableSnapshot(dataset);
  const columns = snapshot.columns.length ? snapshot.columns : ["ID", "Destination", "Cargo Type", "ETA", "Status"];
  const rows = snapshot.rows.length ? snapshot.rows : defaultTableRows;

  return (
    <div className="h-full overflow-hidden border border-[#c2c8bf]/40" style={widgetCardStyle(widget, {padding: 0})}>
      {widget.titleVisible !== false ? (
        <div className="border-b border-[#c2c8bf]/30 px-4 py-3">
          <WidgetTitle widget={widget} className="mb-0" />
          {widget.hint ? <div className="mt-2 text-[8px] uppercase tracking-[0.16em] text-[#727971]">{widget.hint}</div> : null}
        </div>
      ) : widget.hint ? (
        <div className="border-b border-[#c2c8bf]/30 px-4 py-2 text-[8px] uppercase tracking-[0.16em] text-[#727971]">{widget.hint}</div>
      ) : null}
      <table className="w-full text-left text-[10px]">
        <thead className="bg-[#e8e8e3] text-[#727971]">
          <tr className="uppercase tracking-[0.16em]">
            {columns.map((column) => (
              <th key={column} className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c2c8bf]/30 bg-white/60">
          {rows.map((row, rowIndex) => (
            <DynamicTableRow key={rowIndex} row={row} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const items = categoricalSeries(dataset, widget.fieldMap).slice(0, 5);
  const rows = items.length
    ? items
    : [
        {label: "Singapore", value: 94},
        {label: "Hamburg", value: 82},
        {label: "Rotterdam", value: 79},
        {label: "Shanghai", value: 74},
        {label: "Dubai", value: 68},
      ];

  return (
    <div className="h-full border border-[#c2c8bf]/40" style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3 space-y-3">
        {rows.map((item, index) => (
          <div key={`${item.label}-${index}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eff4ec] text-[10px] font-bold text-[#23422a]">
                  {index + 1}
                </span>
                <span className="truncate font-medium text-[#1a1c19]">{item.label}</span>
              </div>
              <span className="font-mono text-[#45664b]">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#edf0e8]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#23422a_0%,#6d9572_100%)]"
                style={{width: `${Math.max(12, Math.min(100, item.value))}%`}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DynamicTableRow({row, columns}: {row: Record<string, string | number>; columns: string[]}) {
  return (
    <tr>
      {columns.map((column, columnIndex) => {
        const value = row[column];
        const content =
          columnIndex === 0 ? <span className="font-mono">{String(value ?? "—")}</span> : <span>{String(value ?? "—")}</span>;

        return (
          <td key={column} className="px-4 py-2">
            {content}
          </td>
        );
      })}
    </tr>
  );
}

const defaultEvents = [
  {title: "docked at Long Beach.", meta: "14:22"},
  {title: "rerouted due to weather.", meta: "15:08"},
  {title: "departed Hamburg.", meta: "16:41"},
];

const defaultTableRows = [
  {ID: "VSL-8201", Destination: "Tokyo, JP", "Cargo Type": "Electronics", ETA: "Oct 28", Status: "On Time"},
  {ID: "VSL-2941", Destination: "Mumbai, IN", "Cargo Type": "Textiles", ETA: "Nov 02", Status: "In Transit"},
  {ID: "VSL-1103", Destination: "Hamburg, DE", "Cargo Type": "Machinery", ETA: "Nov 06", Status: "Review"},
];

function TextWidget({widget}: {widget: EditorWidget}) {
  const textColor = widget.textColor ?? "#1a1c19";
  const fontSize = widget.fontSize ?? 22;
  const fontWeight = textWeight(widget.fontWeight);
  const lineHeight = widget.lineHeight ?? 1.4;
  return (
    <div
      className="flex h-full flex-col justify-center border border-[#c2c8bf]/40"
      style={widgetCardStyle(widget)}
    >
      <WidgetTitle widget={widget} />
      <div className="mt-2 leading-tight" style={{fontSize: `${fontSize}px`, color: textColor, fontWeight, lineHeight}}>
        {widget.value ?? "Executive summary"}
      </div>
      {widget.hint ? (
        <div className="mt-2 text-[11px] leading-5" style={{color: textColor, opacity: 0.72}}>
          {widget.hint}
        </div>
      ) : null}
    </div>
  );
}

function ImageWidget({widget}: {widget: EditorWidget}) {
  const imageUrl =
    widget.value ??
    "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative h-full overflow-hidden border border-[#c2c8bf]/40" style={widgetCardStyle(widget, {padding: 0})}>
      <img
        src={imageUrl}
        alt={widget.title}
        className={`h-full w-full ${imageFitClass(widget.imageFit)}`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(17,23,20,0.68)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        {widget.titleVisible !== false ? (
          <div className={`text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 ${titleAlignClass(widget.titleAlign)}`}>{widget.title}</div>
        ) : null}
        {widget.hint ? <div className="mt-1 text-[11px] leading-5 text-white/90">{widget.hint}</div> : null}
      </div>
    </div>
  );
}

function WidgetTitle({
  widget,
  className = "",
}: {
  widget: EditorWidget;
  className?: string;
}) {
  if (widget.titleVisible === false) return null;

  return (
    <div className={`text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971] ${titleAlignClass(widget.titleAlign)} ${className}`}>
      {widget.title}
    </div>
  );
}

function widgetCardStyle(widget: EditorWidget, overrides?: {padding?: number}) {
  return {
    background: widget.fill,
    borderRadius: `${widget.radius ?? 8}px`,
    padding: `${overrides?.padding ?? widget.padding ?? 16}px`,
    boxShadow: widgetShadow(widget.shadow),
  };
}

function widgetShadow(shadow: EditorWidget["shadow"]) {
  if (shadow === "none") return "none";
  if (shadow === "medium") return "0 18px 36px rgba(26,28,25,0.14)";
  if (shadow === "strong") return "0 24px 48px rgba(26,28,25,0.2)";
  return "0 8px 20px rgba(26,28,25,0.08)";
}

function titleAlignClass(align: EditorWidget["titleAlign"]) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function textWeight(weight: EditorWidget["fontWeight"]) {
  if (weight === "regular") return 400;
  if (weight === "medium") return 500;
  if (weight === "bold") return 700;
  return 600;
}

function imageFitClass(fit: EditorWidget["imageFit"]) {
  if (fit === "contain") return "object-contain";
  if (fit === "fill") return "object-fill";
  return "object-cover";
}

function widgetOutline(stroke: string | undefined, accent = "#23422a") {
  if (!stroke || stroke === "none") return "none";
  if (stroke.includes("solid")) return stroke.replace("solid", `solid ${accent}`);
  if (stroke.includes("dotted")) return stroke.replace("dotted", `dotted ${accent}`);
  return stroke;
}

function clampDimension(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
