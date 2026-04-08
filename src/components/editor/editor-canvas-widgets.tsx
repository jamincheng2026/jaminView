"use client";

import type {CSSProperties} from "react";

import {MiniAreaChart, MiniBarChart, MiniLineChart, MiniPieChart} from "@/components/editor/editor-chart-widgets";
import {EditorMapWidget} from "@/components/editor/editor-map-widget";
import {
  categoricalSeries,
  eventSnapshot,
  eventSnapshotFromRows,
  lineSeries,
  metricSnapshot,
  parseManualWidgetData,
  processEventSnapshotRows,
  processSeriesSnapshot,
  processTableSnapshotData,
  tableSnapshot,
  tableSnapshotFromRows,
  type WidgetDataset,
} from "@/lib/editor-widget-data";
import {EDITOR_CANVAS_HEIGHT, EDITOR_CANVAS_WIDTH, type EditorWidget} from "@/lib/mocks/editor";

type EditorCanvasWidgetProps = {
  widget: EditorWidget;
  selected?: boolean;
  onActivate?: () => void;
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
  mapPointScale?: number;
  mapRouteWidth?: number;
  mapLandOpacity?: number;
  mapLabelOpacity?: number;
  mapOceanColor?: string;
  mapLandStartColor?: string;
  mapLandEndColor?: string;
  mapBorderColor?: string;
  mapAxisColor?: string;
  mapAxisSecondaryColor?: string;
  mapRouteColor?: string;
  mapRouteGlowColor?: string;
  mapMarkerColor?: string;
  mapMarkerHaloColor?: string;
  mapMarkerGlowColor?: string;
  mapLabelColor?: string;
  mapPanelTextColor?: string;
  mapHeatLowColor?: string;
  mapHeatHighColor?: string;
  dataset?: WidgetDataset;
  onSelect?: () => void;
};

export function editorWidgetPlacement(widget: EditorWidget) {
  return editorWidgetPlacementWithin(widget, EDITOR_CANVAS_WIDTH, EDITOR_CANVAS_HEIGHT);
}

export function editorWidgetPlacementWithin(
  widget: EditorWidget,
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    left: `${clampDimension(widget.x, 0, canvasWidth)}px`,
    top: `${clampDimension(widget.y, 0, canvasHeight)}px`,
    width: `${clampDimension(widget.width, 1, canvasWidth)}px`,
    height: `${clampDimension(widget.height, 1, canvasHeight)}px`,
    zIndex: widget.zIndex ?? 1,
  };
}

export function EditorCanvasWidget({
  widget,
  selected = false,
  onActivate,
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
  mapPointScale = 100,
  mapRouteWidth = 100,
  mapLandOpacity = 96,
  mapLabelOpacity = 92,
  mapOceanColor = "#0f1915",
  mapLandStartColor = "#23422a",
  mapLandEndColor = "#1b3423",
  mapBorderColor = "#4e7459",
  mapAxisColor = "#6f8575",
  mapAxisSecondaryColor = "#486050",
  mapRouteColor = "#bde7c7",
  mapRouteGlowColor = "#8ef0ae",
  mapMarkerColor = "#dfffe7",
  mapMarkerHaloColor = "#9ae9ae",
  mapMarkerGlowColor = "#8ef0ae",
  mapLabelColor = "#f5fff7",
  mapPanelTextColor = "#243129",
  mapHeatLowColor = "#4d8f67",
  mapHeatHighColor = "#bde7c7",
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
      {widget.type === "numberFlip" ? <NumberFlipWidget widget={widget} dataset={dataset} /> : null}
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
          mapPointScale={mapPointScale}
          mapRouteWidth={mapRouteWidth}
          mapLandOpacity={mapLandOpacity}
          mapLabelOpacity={mapLabelOpacity}
          mapOceanColor={mapOceanColor}
          mapLandStartColor={mapLandStartColor}
          mapLandEndColor={mapLandEndColor}
          mapBorderColor={mapBorderColor}
          mapAxisColor={mapAxisColor}
          mapAxisSecondaryColor={mapAxisSecondaryColor}
          mapRouteColor={mapRouteColor}
          mapRouteGlowColor={mapRouteGlowColor}
          mapMarkerColor={mapMarkerColor}
          mapMarkerHaloColor={mapMarkerHaloColor}
          mapMarkerGlowColor={mapMarkerGlowColor}
          mapLabelColor={mapLabelColor}
          mapPanelTextColor={mapPanelTextColor}
          mapHeatLowColor={mapHeatLowColor}
          mapHeatHighColor={mapHeatHighColor}
        />
      ) : null}
      {widget.type === "bar" ? <BarWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "events" ? <EventsWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "table" ? <TableWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "rank" ? <RankWidget widget={widget} dataset={dataset} /> : null}
      {widget.type === "text" ? <TextWidget widget={widget} /> : null}
      {widget.type === "image" ? <ImageWidget widget={widget} /> : null}
      {widget.type === "decoration" ? <DecorationWidget widget={widget} /> : null}
    </div>
  );

  if (!onSelect && !onActivate) return content;

  return (
    <button onClick={onSelect ?? onActivate} className="block h-full w-full text-left">
      {content}
    </button>
  );
}

function activeManualData(widget: EditorWidget) {
  return widget.dataSourceMode === "manual" ? parseManualWidgetData(widget) : null;
}

function MetricWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const alert = widget.accent === "#ba1a1a";
  const accent = widget.accent ?? "#23422a";
  const manualData = activeManualData(widget);
  const data = manualData?.valid && manualData.metric ? manualData.metric : metricSnapshot(dataset, widget.fieldMap);
  const rawValue =
    manualData?.valid && manualData.metric
      ? data.value
      : widget.value ?? data.value ?? "128";
  const value = `${widget.valuePrefix ?? ""}${rawValue}${widget.valueSuffix ?? ""}`;
  const hint =
    manualData?.valid && manualData.metric
      ? data.hint
      : widget.hint ?? data.hint;
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

function NumberFlipWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#8fe1a7";
  const manualData = activeManualData(widget);
  const data = manualData?.valid && manualData.metric ? manualData.metric : metricSnapshot(dataset, widget.fieldMap);
  const rawValue =
    manualData?.valid && manualData.metric
      ? data.value
      : widget.value ?? data.value ?? "2048";
  const hint =
    manualData?.valid && manualData.metric
      ? data.hint
      : widget.hint ?? data.hint;
  const characters = `${rawValue}`.split("");
  const gap = widget.numberFlipGap ?? 10;
  const digitSize = widget.numberFlipDigitSize ?? 42;
  const digitSurface = widget.numberFlipSurfaceColor ?? "#21342d";
  const digitText = widget.textColor ?? "#f5fff7";
  const glowOpacity = (widget.numberFlipGlowOpacity ?? 20) / 100;

  return (
    <div
      className="jv-number-flip-shell flex h-full flex-col border border-[#2c4338]"
      style={{
        ...widgetCardStyle(widget),
        background:
          widget.fill === "transparent"
            ? `linear-gradient(180deg, ${hexToRgba("#0f1814", 0.92)} 0%, ${hexToRgba("#15231d", 0.98)} 100%)`
            : widget.fill,
        boxShadow: [
          widget.shadow === "none" ? null : widgetShadow(widget.shadow),
          glowOpacity > 0 ? `0 0 28px ${hexToRgba(accent, glowOpacity)}` : null,
          `inset 0 1px 0 ${hexToRgba("#ffffff", 0.05)}`,
        ]
          .filter(Boolean)
          .join(", "),
      }}
    >
      <WidgetTitle widget={widget} />
      <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-end gap-2">
          {widget.valuePrefix ? (
            <span
              className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color: accent,
                borderColor: hexToRgba(accent, 0.28),
                background: hexToRgba(accent, 0.08),
              }}
            >
              {widget.valuePrefix}
            </span>
          ) : null}
          <div className="flex flex-wrap items-center" style={{gap: `${gap}px`}}>
            {characters.map((character, index) =>
              /\d/.test(character) ? (
                <div
                  key={`${character}-${index}`}
                  className="jv-number-flip-card relative flex items-center justify-center overflow-hidden rounded-xl border font-headline font-black"
                  style={{
                    minWidth: `${Math.max(32, Math.round(digitSize * 0.8))}px`,
                    height: `${Math.max(48, Math.round(digitSize * 1.45))}px`,
                    padding: `0 ${Math.max(10, Math.round(gap * 0.7))}px`,
                    fontSize: `${digitSize}px`,
                    color: digitText,
                    borderColor: hexToRgba(accent, 0.24),
                    background: `linear-gradient(180deg, ${hexToRgba(digitSurface, 0.96)} 0%, ${hexToRgba(
                      accent,
                      0.16,
                    )} 100%)`,
                    boxShadow: `inset 0 1px 0 ${hexToRgba("#ffffff", 0.08)}, 0 14px 28px ${hexToRgba(accent, glowOpacity * 0.65)}`,
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <span
                    className="jv-number-flip-sheen pointer-events-none absolute inset-x-0 top-0 h-[44%]"
                    style={{background: `linear-gradient(180deg, ${hexToRgba("#ffffff", 0.12)} 0%, transparent 100%)`}}
                  />
                  {character}
                </div>
              ) : (
                <span
                  key={`${character}-${index}`}
                  className="self-end font-mono text-[26px] font-bold"
                  style={{color: hexToRgba(digitText, 0.78)}}
                >
                  {character}
                </span>
              ),
            )}
          </div>
          {widget.valueSuffix ? (
            <span
              className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color: accent,
                borderColor: hexToRgba(accent, 0.28),
                background: hexToRgba(accent, 0.08),
              }}
            >
              {widget.valueSuffix}
            </span>
          ) : null}
        </div>
        {hint ? (
          <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em]" style={{color: hexToRgba(digitText, 0.82)}}>
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DecorationWidget({widget}: {widget: EditorWidget}) {
  const preset = widget.decorationPreset ?? "badge";
  const accent = widget.accent ?? "#8fe1a7";
  const secondary = widget.decorationSecondaryColor ?? "#315a41";
  const lineWidth = widget.decorationLineWidth ?? 2;
  const glowOpacity = (widget.decorationGlowOpacity ?? 18) / 100;
  const label = widget.value?.trim() || widget.title;
  const note = widget.hint?.trim();
  const borderRadius = widget.radius ?? 18;

  if (preset === "frame") {
    return (
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          ...widgetCardStyle(widget, {padding: 0}),
          background: widget.fill === "transparent" ? "transparent" : widget.fill,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius: `${borderRadius}px`,
            border: `${lineWidth}px solid ${hexToRgba(secondary, 0.58)}`,
            boxShadow: glowOpacity > 0 ? `0 0 36px ${hexToRgba(accent, glowOpacity)}` : undefined,
          }}
        />
        <div
          className="absolute inset-[10px]"
          style={{
            borderRadius: `${Math.max(8, borderRadius - 8)}px`,
            border: `1px solid ${hexToRgba(accent, 0.22)}`,
          }}
        />
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((position) => (
          <span
            key={position}
            className={`absolute h-16 w-16 ${position}`}
            style={{
              borderColor: accent,
              borderWidth: `${Math.max(2, lineWidth + 1)}px`,
              boxShadow: glowOpacity > 0 ? `0 0 22px ${hexToRgba(accent, glowOpacity * 0.72)}` : undefined,
            }}
          />
        ))}
        {label ? (
          <div className="absolute left-6 top-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{
            color: widget.textColor ?? "#ecfff1",
            background: `linear-gradient(90deg, ${hexToRgba(accent, 0.24)} 0%, ${hexToRgba(secondary, 0.18)} 100%)`,
            border: `1px solid ${hexToRgba(accent, 0.35)}`,
          }}>
            <span className="h-2 w-2 rounded-full" style={{background: accent, boxShadow: `0 0 14px ${hexToRgba(accent, 0.72)}`}} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</span>
          </div>
        ) : null}
        {note ? (
          <div className="absolute bottom-5 right-6 text-[10px] uppercase tracking-[0.16em]" style={{color: widget.textColor ?? accent}}>
            {note}
          </div>
        ) : null}
      </div>
    );
  }

  if (preset === "divider") {
    return (
      <div className="flex h-full items-center" style={widgetCardStyle(widget)}>
        <div className="w-full">
          {label ? (
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{color: widget.textColor ?? accent}}>
              {label}
            </div>
          ) : null}
          <div
            className="relative h-px w-full"
            style={{background: `linear-gradient(90deg, ${accent} 0%, ${hexToRgba(secondary, 0.3)} 60%, transparent 100%)`}}
          >
            <span
              className="jv-divider-signal absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
              style={{background: accent, boxShadow: `0 0 16px ${hexToRgba(accent, Math.max(0.3, glowOpacity))}`}}
            />
          </div>
          {note ? <div className="mt-3 text-[11px]" style={{color: hexToRgba(widget.textColor ?? accent, 0.74)}}>{note}</div> : null}
        </div>
      </div>
    );
  }

  if (preset === "glow") {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden" style={widgetCardStyle(widget)}>
        <div className="relative flex w-full items-center justify-center px-6 py-5">
          <span
            className="jv-glow-breath absolute inset-x-10 top-1/2 h-10 -translate-y-1/2 rounded-full blur-2xl"
            style={{background: hexToRgba(accent, Math.max(0.18, glowOpacity))}}
          />
          <span
            className="jv-glow-scan absolute inset-x-12 top-1/2 h-px -translate-y-1/2"
            style={{background: `linear-gradient(90deg, transparent 0%, ${accent} 18%, ${secondary} 82%, transparent 100%)`}}
          />
          <div className="relative text-center">
            {label ? <div className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{color: widget.textColor ?? "#f5fff7"}}>{label}</div> : null}
            {note ? <div className="mt-2 text-[11px]" style={{color: hexToRgba(widget.textColor ?? accent, 0.76)}}>{note}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center" style={widgetCardStyle(widget)}>
      <div
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-full border px-4 py-3"
        style={{
          color: widget.textColor ?? "#f5fff7",
          borderColor: hexToRgba(accent, 0.34),
          background: `linear-gradient(90deg, ${hexToRgba(accent, 0.18)} 0%, ${hexToRgba(secondary, 0.14)} 100%)`,
          boxShadow: glowOpacity > 0 ? `0 0 28px ${hexToRgba(accent, glowOpacity)}` : undefined,
        }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{background: accent, boxShadow: `0 0 14px ${hexToRgba(accent, 0.78)}`}} />
        <div className="min-w-0">
          {label ? <div className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</div> : null}
          {note ? <div className="mt-1 truncate text-[11px]" style={{color: hexToRgba(widget.textColor ?? accent, 0.76)}}>{note}</div> : null}
        </div>
        <span
          className="ml-auto h-px flex-1"
          style={{background: `linear-gradient(90deg, ${hexToRgba(accent, 0.72)} 0%, transparent 100%)`}}
        />
      </div>
    </div>
  );
}

function LineWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#215637";
  const manualData = activeManualData(widget);
  const rawData = manualData?.valid && manualData.series ? manualData.series : lineSeries(dataset, widget.fieldMap);
  const data = processSeriesSnapshot(rawData, widget);
  return (
    <div className={`flex h-full flex-col ${widgetShellClass(widget)}`} style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3 min-h-0 flex-1">
        <MiniLineChart
          accent={accent}
          data={data.length ? data : undefined}
          tone={widget.chartTone ?? "soft"}
          palette={widget.chartPalette ?? "forest"}
          paletteColors={widget.chartPaletteColors}
          paddingMode={widget.chartPaddingMode ?? "balanced"}
          gridStyle={widget.chartGridStyle ?? "dashed"}
          gridOpacity={widget.chartGridOpacity ?? 42}
          axisOpacity={widget.chartAxisOpacity ?? 56}
          axisColor={widget.chartAxisColor}
          gridColor={widget.chartGridColor}
          surfaceColor={widget.fill}
          surfaceAccentColor={widget.chartSurfaceAccentColor}
          labelTone={widget.chartLabelTone ?? "balanced"}
          axisLabelSize={widget.axisLabelSize ?? 8}
          axisLabelRotate={widget.axisLabelRotate ?? 0}
          showGrid={widget.showGrid ?? false}
          showXAxisLabels={widget.showXAxisLabels ?? false}
          showYAxisLabels={widget.showYAxisLabels ?? false}
          showXAxisLine={widget.showXAxisLine ?? false}
          showYAxisLine={widget.showYAxisLine ?? false}
          showDataLabels={widget.showDataLabels ?? false}
          showHighlightBadges={widget.showHighlightBadges !== false}
          showSeriesPoints={widget.showSeriesPoints ?? data.length <= 4}
          smooth={widget.lineSmooth !== false}
          lineWeight={widget.lineWeight ?? 3}
          lineStyle={widget.lineStyle ?? "solid"}
          pointSize={widget.pointSize ?? 8}
          labelFormat={widget.chartLabelFormat ?? "raw"}
          decimals={widget.chartDecimals ?? 0}
          valuePrefix={widget.valuePrefix}
          valueSuffix={widget.valueSuffix}
        />
      </div>
    </div>
  );
}

function AreaWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#2f6d48";
  const manualData = activeManualData(widget);
  const rawData = manualData?.valid && manualData.series ? manualData.series : lineSeries(dataset, widget.fieldMap);
  const data = processSeriesSnapshot(rawData, widget);
  return (
    <div className={`flex h-full flex-col ${widgetShellClass(widget)}`} style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3 min-h-0 flex-1">
        <MiniAreaChart
          accent={accent}
          data={data.length ? data : undefined}
          tone={widget.chartTone ?? "soft"}
          palette={widget.chartPalette ?? "forest"}
          paletteColors={widget.chartPaletteColors}
          paddingMode={widget.chartPaddingMode ?? "balanced"}
          gridStyle={widget.chartGridStyle ?? "dashed"}
          gridOpacity={widget.chartGridOpacity ?? 42}
          axisOpacity={widget.chartAxisOpacity ?? 56}
          axisColor={widget.chartAxisColor}
          gridColor={widget.chartGridColor}
          surfaceColor={widget.fill}
          surfaceAccentColor={widget.chartSurfaceAccentColor}
          labelTone={widget.chartLabelTone ?? "balanced"}
          axisLabelSize={widget.axisLabelSize ?? 8}
          axisLabelRotate={widget.axisLabelRotate ?? 0}
          showGrid={widget.showGrid ?? false}
          showXAxisLabels={widget.showXAxisLabels ?? false}
          showYAxisLabels={widget.showYAxisLabels ?? false}
          showXAxisLine={widget.showXAxisLine ?? false}
          showYAxisLine={widget.showYAxisLine ?? false}
          showDataLabels={widget.showDataLabels ?? false}
          showHighlightBadges={widget.showHighlightBadges !== false}
          smooth={widget.lineSmooth !== false}
          areaOpacity={(widget.areaOpacity ?? 22) / 100}
          lineStyle={widget.lineStyle ?? "solid"}
          labelFormat={widget.chartLabelFormat ?? "raw"}
          decimals={widget.chartDecimals ?? 0}
          valuePrefix={widget.valuePrefix}
          valueSuffix={widget.valueSuffix}
        />
      </div>
    </div>
  );
}

function PieWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const accent = widget.accent ?? "#23422a";
  const manualData = activeManualData(widget);
  const rawData = manualData?.valid && manualData.series ? manualData.series : categoricalSeries(dataset, widget.fieldMap);
  const data = processSeriesSnapshot(rawData, widget);
  return (
    <div className={`flex h-full flex-col ${widgetShellClass(widget)}`} style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3 min-h-0 flex-1">
        <MiniPieChart
          accent={accent}
          data={data.length ? data : undefined}
          tone={widget.chartTone ?? "soft"}
          palette={widget.chartPalette ?? "forest"}
          paletteColors={widget.chartPaletteColors}
          paddingMode={widget.chartPaddingMode ?? "balanced"}
          legendTone={widget.chartLegendTone ?? "balanced"}
          labelTone={widget.chartLabelTone ?? "balanced"}
          axisColor={widget.chartAxisColor}
          surfaceColor={widget.fill}
          surfaceAccentColor={widget.chartSurfaceAccentColor}
          showLegend={widget.showLegend !== false}
          showDataLabels={widget.showDataLabels ?? false}
          showHighlightBadges={widget.showHighlightBadges !== false}
          innerRadius={(widget.pieInnerRadius ?? 58) / 100}
          legendPosition={widget.legendPosition ?? "right"}
          labelFormat={widget.chartLabelFormat ?? "percent"}
          decimals={widget.chartDecimals ?? 0}
          valuePrefix={widget.valuePrefix}
          valueSuffix={widget.valueSuffix}
        />
      </div>
    </div>
  );
}

function BarWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const manualData = activeManualData(widget);
  const rawData = manualData?.valid && manualData.series ? manualData.series : categoricalSeries(dataset, widget.fieldMap);
  const data = processSeriesSnapshot(rawData, widget);
  return (
    <div className={`flex h-full flex-col ${widgetShellClass(widget)}`} style={widgetCardStyle(widget)}>
      <WidgetTitle widget={widget} />
      <div className="mt-3 min-h-0 flex-1">
        <MiniBarChart
          accent={widget.accent ?? "#406840"}
          data={data.length ? data : undefined}
          tone={widget.chartTone ?? "soft"}
          palette={widget.chartPalette ?? "forest"}
          paletteColors={widget.chartPaletteColors}
          paddingMode={widget.chartPaddingMode ?? "balanced"}
          gridStyle={widget.chartGridStyle ?? "dashed"}
          gridOpacity={widget.chartGridOpacity ?? 42}
          axisOpacity={widget.chartAxisOpacity ?? 56}
          axisColor={widget.chartAxisColor}
          gridColor={widget.chartGridColor}
          surfaceColor={widget.fill}
          surfaceAccentColor={widget.chartSurfaceAccentColor}
          labelTone={widget.chartLabelTone ?? "balanced"}
          axisLabelSize={widget.axisLabelSize ?? 8}
          axisLabelRotate={widget.axisLabelRotate ?? 0}
          showGrid={widget.showGrid ?? false}
          showXAxisLabels={widget.showXAxisLabels !== false}
          showYAxisLabels={widget.showYAxisLabels ?? false}
          showXAxisLine={widget.showXAxisLine !== false}
          showYAxisLine={widget.showYAxisLine ?? false}
          showDataLabels={widget.showDataLabels ?? false}
          showHighlightBadges={widget.showHighlightBadges !== false}
          barRadius={widget.barRadius ?? 4}
          labelFormat={widget.chartLabelFormat ?? "raw"}
          decimals={widget.chartDecimals ?? 0}
          valuePrefix={widget.valuePrefix}
          valueSuffix={widget.valueSuffix}
        />
      </div>
    </div>
  );
}

function EventsWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const manualData = activeManualData(widget);
  const rawRows =
    manualData?.valid && manualData.rows ? eventSnapshotFromRows(manualData.rows, widget.fieldMap) : eventSnapshot(dataset, widget.fieldMap);
  const rows = processEventSnapshotRows(rawRows, widget);
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
  const manualData = activeManualData(widget);
  const rawSnapshot = manualData?.valid && manualData.rows
    ? tableSnapshotFromRows(manualData.rows, {
        columns: widget.tableColumns,
        labels: widget.tableColumnLabels,
        widths: widget.tableColumnWidths,
      })
    : tableSnapshot(dataset, {
        columns: widget.tableColumns,
        labels: widget.tableColumnLabels,
        widths: widget.tableColumnWidths,
      });
  const snapshot = processTableSnapshotData(rawSnapshot, widget);
  const columns = snapshot.columns.length
    ? snapshot.columns
    : [
        {key: "ID", label: "ID"},
        {key: "Destination", label: "Destination"},
        {key: "Cargo Type", label: "Cargo Type"},
        {key: "ETA", label: "ETA"},
        {key: "Status", label: "Status"},
      ];
  const rows = snapshot.rows.length ? snapshot.rows : defaultTableRows;
  const compact = (widget.tableDensity ?? "comfortable") === "compact";
  const zebra = widget.tableZebra !== false;
  const highlightFirstColumn = widget.tableHighlightFirstColumn !== false;
  const highlightNumbers = widget.tableHighlightNumbers !== false;
  const tableCellAlign = widget.tableCellAlign ?? "left";
  const tableHeaderAlign = widget.tableHeaderAlign ?? "left";
  const tableBorderColor = widget.tableBorderColor ?? "#c2c8bf";
  const tableBorderWidth = widget.tableBorderWidth ?? 1;
  const tableDividerColor = widget.tableDividerColor ?? "#c2c8bf";
  const tableBodyColor = widget.tableBodyColor ?? "#fafaf5";
  const tableHeaderBgColor = widget.tableHeaderBgColor ?? "#e8e8e3";
  const tableHeaderTextColor = widget.tableHeaderTextColor ?? "#727971";
  const tableHeaderTracking = widget.tableHeaderTracking ?? 1.8;
  const tableHeaderSize = widget.tableHeaderSize ?? 10;
  const tableHeaderDividerColor = widget.tableHeaderDividerColor ?? tableDividerColor;
  const tableHeaderDividerWidth = widget.tableHeaderDividerWidth ?? 1;
  const tableStripeColor = widget.tableStripeColor ?? "#fafaf5";
  const tableKeyColor = widget.tableKeyColor ?? "#23422a";
  const tableNumberColor = widget.tableNumberColor ?? "#31503a";
  const tableMetaColor = widget.tableMetaColor ?? "#727971";
  const tableCellSize = widget.tableCellSize ?? 10;
  const tableRowHoverColor = widget.tableRowHoverColor ?? "#f3f5ef";
  const tableStatusPositiveColor = widget.tableStatusPositiveColor ?? "#2f6d48";
  const tableStatusWarningColor = widget.tableStatusWarningColor ?? "#c96b32";
  const tableStatusCriticalColor = widget.tableStatusCriticalColor ?? "#ba1a1a";
  const tableStatusNeutralColor = widget.tableStatusNeutralColor ?? "#5e7866";
  const tableStatusBackgroundOpacity = (widget.tableStatusBackgroundOpacity ?? 12) / 100;
  const tableShadowColor = widget.tableShadowColor;
  const tableShadowOpacity = (widget.tableShadowOpacity ?? 14) / 100;
  const tableShellStyle = {
    ...widgetCardStyle(widget, {padding: 0}),
    border: `${tableBorderWidth}px solid ${tableBorderColor}`,
    boxShadow: tableShadowColor ? `0 18px 36px ${hexToRgba(tableShadowColor, tableShadowOpacity)}` : widgetCardStyle(widget, {padding: 0}).boxShadow,
  };

  return (
    <div className="h-full overflow-hidden" style={tableShellStyle}>
      {widget.titleVisible !== false ? (
        <div className="border-b px-4 py-3" style={{borderColor: tableDividerColor}}>
          <WidgetTitle widget={widget} className="mb-0" />
          {widget.hint ? <div className="mt-2 text-[8px] uppercase tracking-[0.16em]" style={{color: tableMetaColor}}>{widget.hint}</div> : null}
        </div>
      ) : widget.hint ? (
        <div className="border-b px-4 py-2 text-[8px] uppercase tracking-[0.16em]" style={{borderColor: tableDividerColor, color: tableMetaColor}}>{widget.hint}</div>
      ) : null}
      <table className="w-full text-[10px]" style={{background: tableBodyColor}}>
        <thead style={{background: tableHeaderBgColor, color: tableHeaderTextColor, borderBottom: `${tableHeaderDividerWidth}px solid ${tableHeaderDividerColor}`}}>
          <tr className="uppercase" style={{letterSpacing: `${tableHeaderTracking}px`}}>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${compact ? "px-3 py-2" : "px-4 py-2.5"} ${tableAlignClass(tableHeaderAlign)}`}
                style={
                  column.width
                    ? {width: `${column.width}px`, minWidth: `${column.width}px`, color: tableHeaderTextColor, fontSize: `${tableHeaderSize}px`}
                    : {color: tableHeaderTextColor, fontSize: `${tableHeaderSize}px`}
                }
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{background: tableBodyColor}}>
          {rows.map((row, rowIndex) => (
            <DynamicTableRow
              key={rowIndex}
              row={row}
              columns={columns}
              compact={compact}
              zebra={zebra}
              rowIndex={rowIndex}
              highlightFirstColumn={highlightFirstColumn}
              highlightNumbers={highlightNumbers}
              cellAlign={tableCellAlign}
              numberFormat={widget.tableNumberFormat ?? "raw"}
              dividerColor={tableDividerColor}
              stripeColor={tableStripeColor}
              rowHoverColor={tableRowHoverColor}
              keyColor={tableKeyColor}
              numberColor={tableNumberColor}
              metaColor={tableMetaColor}
              cellSize={tableCellSize}
              statusPositiveColor={tableStatusPositiveColor}
              statusWarningColor={tableStatusWarningColor}
              statusCriticalColor={tableStatusCriticalColor}
              statusNeutralColor={tableStatusNeutralColor}
              statusBackgroundOpacity={tableStatusBackgroundOpacity}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankWidget({widget, dataset}: {widget: EditorWidget; dataset?: WidgetDataset}) {
  const manualData = activeManualData(widget);
  const items = processSeriesSnapshot(
    manualData?.valid && manualData.series ? manualData.series : categoricalSeries(dataset, widget.fieldMap),
    widget,
  ).slice(0, 5);
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
              <span className="font-mono text-[#45664b]">{formatSeriesDisplayValue(widget, item.value)}</span>
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

function DynamicTableRow({
  row,
  columns,
  compact,
  zebra,
  rowIndex,
  highlightFirstColumn,
  highlightNumbers,
  cellAlign,
  numberFormat,
  dividerColor,
  stripeColor,
  rowHoverColor,
  keyColor,
  numberColor,
  metaColor,
  cellSize,
  statusPositiveColor,
  statusWarningColor,
  statusCriticalColor,
  statusNeutralColor,
  statusBackgroundOpacity,
}: {
  row: Record<string, string | number>;
  columns: Array<{key: string; label: string}>;
  compact: boolean;
  zebra: boolean;
  rowIndex: number;
  highlightFirstColumn: boolean;
  highlightNumbers: boolean;
  cellAlign: "left" | "center" | "right";
  numberFormat: "raw" | "compact" | "currency" | "percent";
  dividerColor: string;
  stripeColor: string;
  rowHoverColor: string;
  keyColor: string;
  numberColor: string;
  metaColor: string;
  cellSize: number;
  statusPositiveColor: string;
  statusWarningColor: string;
  statusCriticalColor: string;
  statusNeutralColor: string;
  statusBackgroundOpacity: number;
}) {
  return (
    <tr
      className={!dividerColor || dividerColor === "transparent" ? "" : "border-b"}
      style={{borderColor: dividerColor, background: zebra && rowIndex % 2 === 1 ? stripeColor : undefined}}
    >
      {columns.map((column, columnIndex) => {
        const value = row[column.key];
        const renderedValue = formatTableCellValue(value, numberFormat);
        const isNumeric = typeof value === "number";
        const statusTone = resolveStatusTone(column.key, value);
        const isMetaCell =
          !statusTone &&
          typeof value === "string" &&
          (column.key.toLowerCase().includes("eta") ||
            column.key.toLowerCase().includes("time") ||
            column.key.toLowerCase().includes("date") ||
            column.key.toLowerCase().includes("meta"));
        const content =
          statusTone ? (
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em]"
              style={statusBadgeStyle(statusTone, {
                positive: statusPositiveColor,
                warning: statusWarningColor,
                critical: statusCriticalColor,
                neutral: statusNeutralColor,
              }, statusBackgroundOpacity)}
            >
              {renderedValue}
            </span>
          ) : columnIndex === 0 ? (
            <span className={highlightFirstColumn ? "font-semibold" : "font-mono"} style={highlightFirstColumn ? {color: keyColor} : undefined}>{renderedValue}</span>
          ) : highlightNumbers && isNumeric ? (
            <span className="font-mono font-semibold" style={{color: numberColor}}>{renderedValue}</span>
          ) : isMetaCell ? (
            <span style={{color: metaColor}}>{renderedValue}</span>
          ) : (
            <span>{renderedValue}</span>
          );

        return (
          <td
            key={column.key}
            className={`${compact ? "px-3 py-2" : "px-4 py-2.5"} ${tableAlignClass(cellAlign)} transition-colors hover:bg-[var(--row-hover-color)]`}
            style={{fontSize: `${cellSize}px`, ["--row-hover-color" as string]: rowHoverColor}}
          >
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
  const textAlign = widget.textAlign ?? "left";
  const letterSpacing = widget.letterSpacing ?? 0;
  return (
    <div
      className="flex h-full flex-col justify-center border border-[#c2c8bf]/40"
      style={widgetCardStyle(widget)}
    >
      <WidgetTitle widget={widget} />
      <div
        className="mt-2 leading-tight"
        style={{fontSize: `${fontSize}px`, color: textColor, fontWeight, lineHeight, letterSpacing: `${letterSpacing}px`, textAlign}}
      >
        {widget.value ?? "Executive summary"}
      </div>
      {widget.hint ? (
        <div className="mt-2 text-[11px] leading-5" style={{color: textColor, opacity: 0.72, textAlign}}>
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
  const overlayColor = widget.imageOverlayColor ?? "#111714";
  const overlayOpacity = widget.imageOverlayOpacity ?? 68;
  const overlayDirection = widget.imageOverlayDirection ?? "bottom";
  const grayscale = widget.imageGrayscale ?? false;
  const borderStyle = widget.imageBorderStyle ?? "soft";
  const zoom = (widget.imageZoom ?? 100) / 100;
  const filterStyle = buildImageFilter(widget);
  const captionPadding = widget.imageCaptionPadding ?? 12;
  const captionOpacity = (widget.imageCaptionOpacity ?? 82) / 100;
  const captionBlur = widget.imageCaptionBlur ?? 0;
  const captionRadius = widget.imageCaptionRadius ?? 18;
  const captionShadowColor = widget.imageCaptionShadowColor ?? "#111714";
  const captionShadowOpacity = (widget.imageCaptionShadowOpacity ?? 0) / 100;
  const overlayBlur = widget.imageOverlayBlur ?? 0;
  const imageShellStyle = {
    ...widgetCardStyle(widget, {padding: 0}),
    border: `${widget.imageBorderWidth ?? (borderStyle === "frame" ? 2 : borderStyle === "none" ? 0 : 1)}px solid ${widget.imageBorderColor ?? (borderStyle === "frame" ? "#d8dccf" : borderStyle === "none" ? "transparent" : "#c2c8bf")}`,
    boxShadow: widget.imageShadowColor
      ? `0 18px 40px ${hexToRgba(widget.imageShadowColor, (widget.imageShadowOpacity ?? 18) / 100)}`
      : undefined,
  } as CSSProperties;

  return (
    <div className={`${imageShellClass(borderStyle)} relative h-full overflow-hidden`} style={imageShellStyle}>
      <img
        src={imageUrl}
        alt={widget.title}
        className={`h-full w-full ${imageFitClass(widget.imageFit)} ${grayscale ? "grayscale" : ""}`}
        style={{filter: filterStyle, transform: `scale(${zoom})`}}
      />
      <div
        className="absolute inset-0"
        style={{
          background: imageOverlayGradient(
            overlayDirection,
            overlayColor,
            Math.max(0, Math.min(100, overlayOpacity)) / 100,
          ),
          backdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
        }}
      />
      <div className="absolute inset-x-3 bottom-3" style={{
        color: widget.imageCaptionTextColor ?? "#ffffff",
        background: widget.imageCaptionBackgroundColor ? hexToRgba(widget.imageCaptionBackgroundColor, captionOpacity) : undefined,
        padding: `${captionPadding}px`,
        border: `${widget.imageCaptionBorderWidth ?? 0}px solid ${widget.imageCaptionBorderColor ?? "transparent"}`,
        borderRadius: `${captionRadius}px`,
        backdropFilter: captionBlur > 0 ? `blur(${captionBlur}px)` : undefined,
        boxShadow: captionShadowOpacity > 0 ? `0 12px 28px ${hexToRgba(captionShadowColor, captionShadowOpacity)}` : undefined,
      }}>
        {widget.titleVisible !== false ? (
          <div className={`text-[10px] font-bold uppercase tracking-[0.18em] opacity-80 ${titleAlignClass(widget.titleAlign)}`}>{widget.title}</div>
        ) : null}
        {widget.hint ? <div className="mt-1 text-[11px] leading-5 ">{widget.hint}</div> : null}
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

  const isChartWidget = widget.type === "line" || widget.type === "area" || widget.type === "bar" || widget.type === "pie" || widget.type === "rank";
  const accent = widget.accent ?? "#23422a";

  const titleRadius = widget.chartTitleRadius ?? 999;
  const titleBorderWidth = widget.chartTitleBorderWidth ?? 1;
  const titleSurfaceOpacity = (widget.chartTitleSurfaceOpacity ?? 12) / 100;
  const titleSignalSize = widget.chartTitleSignalSize ?? 10;
  const titleDividerWidth = widget.chartTitleDividerWidth ?? 0;
  const titlePaddingX = widget.chartTitlePaddingX ?? 10;
  const titlePaddingY = widget.chartTitlePaddingY ?? 4;
  const titleBackground =
    widget.chartTitleBackgroundColor ??
    (titleSurfaceOpacity > 0 ? hexToRgba(widget.chartTitleAccentColor ?? accent, titleSurfaceOpacity) : "transparent");
  const titleBorderColor = widget.chartTitleBorderColor ?? hexToRgba(widget.chartTitleAccentColor ?? accent, 0.18);
  const dividerStartColor =
    widget.chartTitleDividerStartColor ?? widget.chartTitleBorderColor ?? hexToRgba(widget.chartTitleAccentColor ?? accent, 0.42);
  const dividerEndColor = widget.chartTitleDividerEndColor ?? "transparent";
  const signalHaloColor = widget.chartTitleSignalHaloColor ?? "#ffffff";
  const titleTextColor = widget.titleColor ?? (isChartWidget ? accent : "#727971");
  const titleLetterSpacing = `${widget.titleTracking ?? 1.8}px`;
  const showSignal = isChartWidget && titleSignalSize > 0;
  const showDivider = isChartWidget && titleDividerWidth > 0;
  const showTitleSurface = isChartWidget && (titleSurfaceOpacity > 0 || titleBorderWidth > 0 || titlePaddingX > 0 || titlePaddingY > 0);

  return (
    <div className={className}>
      <div className={titleAlignClass(widget.titleAlign)}>
        <span
          className={`${widget.titleUppercase === false ? "" : "uppercase"} inline-flex items-center gap-2 font-bold`}
          style={{
            fontSize: `${widget.titleSize ?? 10}px`,
            letterSpacing: titleLetterSpacing,
            color: titleTextColor,
            padding: showTitleSurface ? `${titlePaddingY}px ${titlePaddingX}px` : undefined,
            borderRadius: showTitleSurface ? `${titleRadius}px` : undefined,
            border: showTitleSurface ? `${titleBorderWidth}px solid ${titleBorderColor}` : undefined,
            background: showTitleSurface ? titleBackground : undefined,
          }}
        >
          {showSignal ? (
            <span
              className="inline-flex rounded-full"
              style={{
                background: widget.chartTitleAccentColor ?? accent,
                height: `${titleSignalSize}px`,
                width: `${titleSignalSize}px`,
                boxShadow: `0 0 0 3px ${hexToRgba(signalHaloColor, 0.65)}`,
              }}
            />
          ) : null}
          {widget.title}
        </span>
      </div>
      {showDivider ? (
        <div
          className="mt-2 w-full"
          style={{
            height: `${titleDividerWidth}px`,
            background: `linear-gradient(90deg, ${dividerStartColor} 0%, ${dividerEndColor} 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}

function widgetCardStyle(widget: EditorWidget, overrides?: {padding?: number}) {
  const chartAccent = widget.accent ?? "#23422a";
  const baseStyle: CSSProperties = {
    background: widget.fill,
    borderRadius: `${widget.radius ?? 8}px`,
    padding: `${overrides?.padding ?? widget.padding ?? 16}px`,
    boxShadow: widgetShadow(widget.shadow),
  };

  if (widget.type === "line" || widget.type === "area" || widget.type === "bar" || widget.type === "pie" || widget.type === "rank") {
    const borderColor = widget.chartBorderColor ?? hexToRgba(chartAccent, 0.16);
    const borderWidth = widget.chartBorderWidth ?? 1;
    const shadowColor = widget.chartShadowColor ?? "#1a1c19";
    const shadowOpacity = (widget.chartShadowOpacity ?? 12) / 100;
    const glowColor = widget.chartGlowColor ?? chartAccent;
    const glowOpacity = (widget.chartGlowOpacity ?? 0) / 100;
    return {
      ...baseStyle,
      border: `${borderWidth}px solid ${borderColor}`,
      backgroundImage: `linear-gradient(180deg, ${hexToRgba("#ffffff", 0.18)} 0%, transparent 24%)`,
      boxShadow: [
        shadowOpacity > 0 ? `0 16px 32px ${hexToRgba(shadowColor, shadowOpacity)}` : null,
        glowOpacity > 0 ? `0 0 28px ${hexToRgba(glowColor, glowOpacity)}` : null,
        `inset 0 1px 0 ${hexToRgba(widget.chartTitleAccentColor ?? chartAccent, 0.08)}`,
      ].filter(Boolean).join(", "),
    };
  }

  return {
    ...baseStyle,
  };
}

function widgetShellClass(widget: EditorWidget) {
  const base = "h-full border";

  if (widget.type === "line" || widget.type === "area" || widget.type === "bar" || widget.type === "pie") {
    // Chart cards need a second style layer beyond generic widget fill/radius,
    // otherwise every chart ends up looking like the same neutral container.
    return `${base} border-transparent`;
  }

  return `${base} border-[#c2c8bf]/40`;
}

function imageShellClass(style: EditorWidget["imageBorderStyle"]) {
  if (style === "frame") return "border-2 border-[#d8dccf] shadow-[0_12px_28px_rgba(26,28,25,0.12)]";
  if (style === "none") return "border border-transparent shadow-none";
  return "border border-[#c2c8bf]/40";
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

function tableAlignClass(align: EditorWidget["tableCellAlign"] | EditorWidget["tableHeaderAlign"]) {
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

function imageOverlayGradient(direction: EditorWidget["imageOverlayDirection"], color: string, alpha: number) {
  if (direction === "center") {
    return `radial-gradient(circle at center, ${hexToRgba(color, alpha * 0.72)} 0%, ${hexToRgba(color, alpha * 0.4)} 34%, transparent 72%)`;
  }

  if (direction === "full") {
    return `linear-gradient(180deg, ${hexToRgba(color, alpha * 0.85)} 0%, ${hexToRgba(color, alpha * 0.65)} 100%)`;
  }

  return `linear-gradient(180deg, transparent 42%, ${hexToRgba(color, alpha)} 100%)`;
}

function buildImageFilter(widget: EditorWidget) {
  const preset = widget.imageFilterPreset ?? "natural";
  const brightness = widget.imageBrightness ?? (preset === "cinematic" ? 88 : preset === "cool" ? 96 : preset === "mono" ? 92 : 100);
  const contrast = widget.imageContrast ?? (preset === "cinematic" ? 116 : preset === "cool" ? 108 : preset === "mono" ? 102 : 100);
  const saturation = widget.imageSaturation ?? (preset === "cinematic" ? 88 : preset === "cool" ? 118 : preset === "mono" ? 0 : 100);
  const hueRotate = preset === "cool" ? " hue-rotate(8deg)" : "";

  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${hueRotate}`;
}

function resolveSeriesLabelFormat(widget: Pick<EditorWidget, "type" | "chartLabelFormat">) {
  return widget.chartLabelFormat ?? (widget.type === "pie" ? "percent" : "raw");
}

function formatSeriesDisplayValue(
  widget: Pick<EditorWidget, "type" | "chartLabelFormat" | "chartDecimals" | "valuePrefix" | "valueSuffix">,
  value: number,
) {
  const format = resolveSeriesLabelFormat(widget);
  const decimals = widget.chartDecimals ?? 0;
  let rendered = "";

  if (format === "percent") {
    rendered = `${value.toFixed(decimals)}%`;
  } else if (format === "compact") {
    rendered = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals > 0 ? Math.min(decimals, 1) : 0,
    }).format(value);
  } else {
    rendered = new Intl.NumberFormat("en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return `${widget.valuePrefix ?? ""}${rendered}${widget.valueSuffix ?? ""}`;
}

function formatTableCellValue(value: string | number | undefined, format: EditorWidget["tableNumberFormat"]) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value !== "number") return String(value);

  if (format === "currency") {
    return new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY", maximumFractionDigits: 0}).format(value);
  }

  if (format === "percent") {
    const percentValue = Math.abs(value) <= 1 ? value * 100 : value;
    return `${percentValue.toFixed(percentValue % 1 === 0 ? 0 : 1)}%`;
  }

  if (format === "compact") {
    return new Intl.NumberFormat("en", {notation: "compact", maximumFractionDigits: 1}).format(value);
  }

  return new Intl.NumberFormat("en", {maximumFractionDigits: 2}).format(value);
}

function resolveStatusTone(columnKey: string, value: string | number | undefined) {
  if (typeof value !== "string") return null;
  const key = columnKey.toLowerCase();
  const normalized = value.toLowerCase().trim();
  if (!/(status|state|health|level)/.test(key)) return null;
  if (["critical", "error", "failed", "offline", "delayed", "风险", "异常", "严重", "告警"].some((token) => normalized.includes(token))) return "critical" as const;
  if (["warning", "review", "pending", "degraded", "预警", "待处理", "审核"].some((token) => normalized.includes(token))) return "warning" as const;
  if (["normal", "success", "healthy", "live", "正常", "在线", "完成", "on time"].some((token) => normalized.includes(token))) return "positive" as const;
  return "neutral" as const;
}

function statusBadgeStyle(
  tone: "positive" | "warning" | "critical" | "neutral",
  colors: {positive: string; warning: string; critical: string; neutral: string},
  backgroundOpacity: number,
): CSSProperties {
  const color = tone === "positive" ? colors.positive : tone === "warning" ? colors.warning : tone === "critical" ? colors.critical : colors.neutral;
  return {
    color,
    borderColor: hexToRgba(color, Math.max(0.22, backgroundOpacity + 0.1)),
    background: hexToRgba(color, backgroundOpacity),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((token) => `${token}${token}`)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(safeHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
