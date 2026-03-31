"use client";

import {MiniBarChart, MiniLineChart, MiniPieChart} from "@/components/editor/editor-chart-widgets";
import {
  categoricalSeries,
  eventSnapshot,
  lineSeries,
  metricSnapshot,
  tableSnapshot,
  type WidgetDataset,
} from "@/lib/editor-widget-data";
import type {EditorWidget} from "@/lib/mocks/editor";

const worldMapImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBom0YVtg1jXR9KbQ-l5UsJjKJlaxD5JTDSz5g20XzmcjZwsdgkkEaVwxvSqtkEyRq2N-ZfGcNUErLzu-YavuBef6z3SgLFAUbCoafjW-tv7fCs8j4OtQMei5qcyL11gwpM3Sqtdheff8fmNwzrtAhZh4k0s4BFZL2Rmd4DK1iky6lnOeIY6LsHbbQot7z5IDJP_6J-gN7NUO1Wzw6LDnBaf-Pi2fDoh5UIVrxUKc3UqYw8kxtZK8trsxBO0iEVOMzQNlabZ64wKdxt";

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
  dataset?: WidgetDataset;
  onSelect?: () => void;
};

export function editorWidgetGridSpan(span: number) {
  if (span >= 12) return "col-span-12";
  if (span >= 9) return "col-span-9";
  if (span >= 8) return "col-span-8";
  if (span >= 7) return "col-span-7";
  if (span >= 6) return "col-span-6";
  if (span >= 5) return "col-span-5";
  if (span >= 4) return "col-span-4";
  if (span >= 3) return "col-span-3";
  if (span >= 2) return "col-span-2";
  return "col-span-1";
}

export function editorWidgetRowSpan(span: number) {
  if (span >= 6) return "row-span-6";
  if (span >= 5) return "row-span-5";
  if (span >= 4) return "row-span-4";
  if (span >= 3) return "row-span-3";
  if (span >= 2) return "row-span-2";
  return "row-span-1";
}

export function editorWidgetPlacement(widget: EditorWidget) {
  const colStart = Math.max(1, Math.min(12, widget.x + 1));
  const rowStart = Math.max(1, widget.y + 1);
  const colSpan = Math.max(1, Math.min(widget.width, 13 - colStart));
  const rowSpan = Math.max(1, widget.height);

  return {
    gridColumn: `${colStart} / span ${colSpan}`,
    gridRow: `${rowStart} / span ${rowSpan}`,
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
      {widget.type === "pie" ? <PieWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "map" ? (
        <MapWidget
          widget={widget}
          mapLabels={mapLabels}
          map3dAxis={map3dAxis}
          mapZoom={mapZoom}
          mapTheme={mapTheme}
          mapRouteDensity={mapRouteDensity}
          mapMarkers={mapMarkers}
          mapGlow={mapGlow}
        />
      ) : null}
      {widget.type === "bar" ? <BarWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "events" ? <EventsWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "table" ? <TableWidget widget={widget} dataset={dataset} /> : null}
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
      className={`rounded-[4px] border p-4 shadow-sm ${
        alert
          ? "border-[#f4b6af] border-l-[3px] border-l-[#ba1a1a] bg-[#ffdad6]/40"
          : "border-[#c2c8bf]/40 border-l-[3px] border-l-[#23422a] bg-[#fafaf5]"
      }`}
      style={{background: widget.fill}}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
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
    <div className="h-full rounded-[4px] border border-[#c2c8bf]/40 bg-[#fafaf5] p-4 shadow-sm" style={{background: widget.fill}}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
      <div className="mt-3">
        <MiniLineChart accent={accent} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function PieWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#23422a";
  const data = categoricalSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full rounded-[4px] border border-[#c2c8bf]/40 bg-[#fafaf5] p-4 shadow-sm" style={{background: widget.fill}}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
      <div className="mt-3">
        <MiniPieChart accent={accent} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function MapWidget({
  widget,
  mapLabels,
  map3dAxis,
  mapZoom,
  mapTheme,
  mapRouteDensity,
  mapMarkers,
  mapGlow,
}: {
  widget: EditorWidget;
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme: "emerald" | "midnight" | "amber";
  mapRouteDensity: "low" | "balanced" | "high";
  mapMarkers: boolean;
  mapGlow: number;
}) {
  const zoomFactor = clampNumber(Number.parseFloat(mapZoom.replace("x", "")), 1, 3);
  const worldScale = 0.92 + (zoomFactor - 1) * 0.14;
  const theme = mapThemes[mapTheme];
  const routes = mapRouteDensity === "low" ? mapRoutes.slice(0, 2) : mapRouteDensity === "balanced" ? mapRoutes.slice(0, 4) : mapRoutes;
  const glowOpacity = clampNumber(mapGlow / 100, 0, 1);

  return (
    <div className="relative h-full overflow-hidden border border-[#c2c8bf]/40" style={{background: theme.base}}>
      <div className="absolute inset-0 transition-transform duration-300" style={{transform: `scale(${worldScale})`}}>
        <img
          src={worldMapImage}
          alt="World logistics map"
          className="absolute inset-0 h-full w-full object-cover mix-blend-screen"
          style={{opacity: theme.imageOpacity}}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.glow} ${Math.round(glowOpacity * 100)}%, transparent 48%)`,
            opacity: glowOpacity,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: theme.overlay,
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {routes.map((route) => (
            <path
              key={route.id}
              d={route.path}
              fill="none"
              stroke={theme.route}
              strokeOpacity={route.opacity}
              strokeWidth={route.stroke}
              strokeDasharray={route.dash ? "2.6 2.2" : undefined}
            />
          ))}
          {mapMarkers
            ? mapMarkersData.map((marker) => (
                <g key={marker.id}>
                  <circle cx={marker.cx} cy={marker.cy} r="1.8" fill={theme.markerGlow} opacity={0.28 + glowOpacity * 0.22} />
                  <circle cx={marker.cx} cy={marker.cy} r="0.7" fill={theme.marker} />
                </g>
              ))
            : null}
        </svg>
      </div>
      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#23422a] backdrop-blur-sm">
        Live Monitoring
      </div>
      {mapLabels ? (
        <>
          <span className="absolute left-[18%] top-[34%] rounded bg-white/80 px-2 py-1 text-[8px] font-semibold text-[#20302a]">Vancouver</span>
          <span className="absolute right-[18%] top-[28%] rounded bg-white/80 px-2 py-1 text-[8px] font-semibold text-[#20302a]">Hamburg</span>
          <span className="absolute right-[28%] bottom-[20%] rounded bg-white/80 px-2 py-1 text-[8px] font-semibold text-[#20302a]">Singapore</span>
        </>
      ) : null}
      {map3dAxis ? (
        <div className="absolute inset-x-12 bottom-16 h-px" style={{background: `linear-gradient(90deg,transparent,${theme.axis},transparent)`}} />
      ) : null}
      <div className="absolute bottom-3 right-3 w-40 rounded-[4px] border border-white/20 bg-white/88 p-3 text-[9px] shadow-sm backdrop-blur-sm">
        <div className="mb-2 flex justify-between">
          <span>Region Heat</span>
          <span className="font-bold">{mapZoom}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{background: `linear-gradient(90deg, ${theme.heatLow}, ${theme.heatHigh})`}} />
      </div>
      {widget.hint ? (
        <div className="absolute bottom-3 left-3 max-w-44 rounded-[4px] border border-white/15 bg-black/30 px-3 py-2 text-[8px] text-white/90 backdrop-blur-sm">
          {widget.hint}
        </div>
      ) : null}
    </div>
  );
}

const mapThemes = {
  emerald: {
    base: "#20302a",
    overlay: "linear-gradient(180deg, rgba(5,18,12,0.05) 0%, rgba(11,30,20,0.12) 100%)",
    glow: "rgba(100, 183, 120,",
    route: "#9ad9ab",
    axis: "rgba(255,255,255,0.35)",
    marker: "#d7f2da",
    markerGlow: "#8cdd9d",
    heatLow: "rgba(33,86,55,0.18)",
    heatHigh: "rgba(33,86,55,0.92)",
    imageOpacity: 0.9,
  },
  midnight: {
    base: "#142033",
    overlay: "linear-gradient(180deg, rgba(5,18,32,0.12) 0%, rgba(5,10,20,0.3) 100%)",
    glow: "rgba(87, 166, 255,",
    route: "#86c3ff",
    axis: "rgba(180,210,255,0.42)",
    marker: "#e7f3ff",
    markerGlow: "#60b3ff",
    heatLow: "rgba(74,119,196,0.18)",
    heatHigh: "rgba(74,119,196,0.92)",
    imageOpacity: 0.84,
  },
  amber: {
    base: "#3a2415",
    overlay: "linear-gradient(180deg, rgba(32,18,8,0.06) 0%, rgba(48,22,6,0.22) 100%)",
    glow: "rgba(255, 186, 82,",
    route: "#ffd18a",
    axis: "rgba(255,226,174,0.4)",
    marker: "#fff2d7",
    markerGlow: "#ffc66b",
    heatLow: "rgba(196,124,54,0.18)",
    heatHigh: "rgba(196,124,54,0.92)",
    imageOpacity: 0.86,
  },
} as const;

const mapRoutes = [
  {id: "route-1", path: "M18 38 C30 20, 45 16, 63 24", stroke: 0.9, opacity: 0.9, dash: false},
  {id: "route-2", path: "M63 24 C74 26, 82 34, 86 54", stroke: 1.1, opacity: 0.82, dash: true},
  {id: "route-3", path: "M23 52 C35 58, 45 60, 60 63", stroke: 0.95, opacity: 0.75, dash: false},
  {id: "route-4", path: "M60 63 C69 58, 76 55, 82 66", stroke: 0.8, opacity: 0.7, dash: true},
  {id: "route-5", path: "M41 22 C50 30, 57 38, 64 53", stroke: 0.8, opacity: 0.66, dash: false},
  {id: "route-6", path: "M49 40 C42 48, 38 56, 35 64", stroke: 0.75, opacity: 0.58, dash: true},
];

const mapMarkersData = [
  {id: "vancouver", cx: 23, cy: 38},
  {id: "hamburg", cx: 63, cy: 24},
  {id: "singapore", cx: 82, cy: 66},
  {id: "rotterdam", cx: 58, cy: 28},
  {id: "long-beach", cx: 18, cy: 44},
];

function BarWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const data = categoricalSeries(dataset, widget.fieldMap);
  return (
    <div className="h-full rounded-[4px] border border-[#c2c8bf]/40 bg-[#fafaf5] p-4 shadow-sm" style={{background: widget.fill}}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
      <div className="mt-3">
        <MiniBarChart accent={widget.accent ?? "#406840"} data={data.length ? data : undefined} />
      </div>
    </div>
  );
}

function EventsWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const rows = eventSnapshot(dataset);
  return (
    <div className="h-full rounded-[4px] border border-[#c2c8bf]/40 bg-[#fafaf5] p-4 shadow-sm" style={{background: widget.fill}}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
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
    <div className="overflow-hidden border border-[#c2c8bf]/40 bg-[#f4f4ef]" style={{background: widget.fill}}>
      {widget.hint ? <div className="border-b border-[#c2c8bf]/30 px-4 py-2 text-[8px] uppercase tracking-[0.16em] text-[#727971]">{widget.hint}</div> : null}
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
  return (
    <div
      className="flex h-full flex-col justify-center rounded-[4px] border border-[#c2c8bf]/40 bg-[#fafaf5] px-4 py-3 shadow-sm"
      style={{background: widget.fill}}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{widget.title}</div>
      <div className="mt-2 text-[22px] font-semibold leading-tight text-[#1a1c19]">{widget.value ?? "Executive summary"}</div>
      {widget.hint ? <div className="mt-2 text-[11px] leading-5 text-[#5f665f]">{widget.hint}</div> : null}
    </div>
  );
}

function ImageWidget({widget}: {widget: EditorWidget}) {
  const imageUrl =
    widget.value ??
    "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative h-full overflow-hidden rounded-[4px] border border-[#c2c8bf]/40 bg-[#eef0ea] shadow-sm">
      <img src={imageUrl} alt={widget.title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(17,23,20,0.68)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{widget.title}</div>
        {widget.hint ? <div className="mt-1 text-[11px] leading-5 text-white/90">{widget.hint}</div> : null}
      </div>
    </div>
  );
}

function widgetOutline(stroke: string | undefined, accent = "#23422a") {
  if (!stroke || stroke === "none") return "none";
  if (stroke.includes("solid")) return stroke.replace("solid", `solid ${accent}`);
  if (stroke.includes("dotted")) return stroke.replace("dotted", `dotted ${accent}`);
  return stroke;
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
