"use client";

import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.LineChart), {ssr: false});
const AreaChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.AreaChart), {ssr: false});
const BarChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.BarChart), {ssr: false});
const PieChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.PieChart), {ssr: false});

type ChartDatum = {
  label: string;
  value: number;
};

type ChartTone = "soft" | "contrast" | "night";
type ChartPalette = "forest" | "ocean" | "sunset" | "mono";
type ChartLabelFormat = "raw" | "compact" | "percent";
type ChartPaddingMode = "compact" | "balanced" | "showcase";
type ChartGridStyle = "dashed" | "solid" | "dot";
type ChartLegendTone = "muted" | "balanced" | "strong";
type ChartBadgeTone = ChartLegendTone;
type ChartPaletteColors = [string, string, string, string, string];

// Keep label formatting centralized so the editor, preview and published
// screen all speak the same numeric language when users tweak chart styles.
function formatChartValue(value: number, format: ChartLabelFormat, decimals: number) {
  if (format === "percent") {
    return `${value.toFixed(decimals)}%`;
  }

  if (format === "compact") {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals > 0 ? Math.min(decimals, 1) : 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function decorateChartValue(value: string, prefix?: string, suffix?: string) {
  return `${prefix ?? ""}${value}${suffix ?? ""}`;
}

function resolveChartPadding(mode: ChartPaddingMode) {
  if (mode === "compact") return {top: 8, right: 6, bottom: 10, left: 6};
  if (mode === "showcase") return {top: 14, right: 14, bottom: 16, left: 14};
  return {top: 10, right: 8, bottom: 12, left: 8};
}

function resolveChartGridLineDash(style: ChartGridStyle) {
  if (style === "solid") return undefined;
  if (style === "dot") return [2, 4];
  return [4, 4];
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#")) {
    const normalized = color.replace("#", "");
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

  return color;
}

function legendToneClass(tone: ChartLegendTone) {
  if (tone === "strong") return "text-[10px] font-semibold";
  if (tone === "muted") return "text-[8px] font-medium opacity-75";
  return "text-[9px] font-bold";
}

function badgeToneClasses(tone: ChartBadgeTone) {
  if (tone === "strong") {
    return {
      text: "text-[9px] font-semibold",
      surface: "border-white/40 bg-[#fdfdf8]/88 shadow-[0_8px_18px_rgba(26,28,25,0.12)]",
    };
  }

  if (tone === "muted") {
    return {
      text: "text-[8px] font-medium opacity-80",
      surface: "border-white/30 bg-[#fdfdf8]/72 shadow-none",
    };
  }

  return {
    text: "text-[9px] font-semibold",
    surface: "border-white/35 bg-[#fdfdf8]/80 shadow-[0_4px_12px_rgba(26,28,25,0.08)]",
  };
}

function resolvePalette(accent: string, palette: ChartPalette, customColors?: string[]) {
  const normalized = (customColors ?? []).filter(Boolean);
  if (normalized.length >= 5) {
    return normalized.slice(0, 5) as ChartPaletteColors;
  }

  if (palette === "ocean") return [accent || "#2b6cb0", "#4c8eda", "#90cdf4", "#d7efff", "#1f4c7a"];
  if (palette === "sunset") return [accent || "#c96b32", "#e59b5a", "#f7c289", "#f3dfc4", "#8c4a1d"];
  if (palette === "mono") return [accent || "#34503b", "#5e7866", "#8da190", "#c7d0c9", "#e7ece8"];
  return [accent || "#215637", "#406840", "#7da785", "#c7dfcb", "#23422a"];
}

function chartSurfaceClasses(tone: ChartTone, textOverride?: string, gridOverride?: string) {
  if (tone === "contrast") {
    return {
      base: "#eef0e8",
      accent: "#f8fbf4",
      text: textOverride ?? "#31503a",
      grid: gridOverride ?? "#adc0af",
    };
  }

  if (tone === "night") {
    return {
      base: "#1b251d",
      accent: "#213026",
      text: textOverride ?? "#d3ead6",
      grid: gridOverride ?? "#3f5c47",
    };
  }

  return {
    base: "#f6f3e8",
    accent: "#f3e6c7",
    text: textOverride ?? "#727971",
    grid: gridOverride ?? "#d9d0b7",
  };
}

function buildChartShellStyle(base: string, accent: string) {
  return {
    height: "100%",
    backgroundImage: `radial-gradient(circle at top right, ${withAlpha(accent, 0.18)} 0%, transparent 38%), linear-gradient(180deg, ${base} 0%, ${withAlpha(base, 0.98)} 100%)`,
  } as const;
}

const fallbackLineData: ChartDatum[] = [
  {label: "Jan", value: 38},
  {label: "Feb", value: 42},
  {label: "Mar", value: 40},
  {label: "Apr", value: 54},
  {label: "May", value: 51},
  {label: "Jun", value: 68},
  {label: "Jul", value: 76},
];

const fallbackBarData: ChartDatum[] = [
  {label: "Rotterdam", value: 82},
  {label: "Singapore", value: 94},
  {label: "Shanghai", value: 61},
];

const fallbackPieData: ChartDatum[] = [
  {label: "Maersk", value: 42},
  {label: "MSC", value: 28},
  {label: "CMA", value: 30},
];

export function MiniLineChart({
  accent = "#215637",
  data = fallbackLineData,
  tone = "soft",
  palette = "forest",
  showGrid = false,
  showXAxisLabels = false,
  showYAxisLabels = false,
  showXAxisLine = false,
  showYAxisLine = false,
  showDataLabels = false,
  showHighlightBadges = true,
  showSeriesPoints = true,
  smooth = true,
  lineWeight = 3,
  lineStyle = "solid",
  pointSize = 8,
  axisLabelSize = 8,
  axisLabelRotate = 0,
  paddingMode = "balanced",
  gridStyle = "dashed",
  gridOpacity = 42,
  axisOpacity = 56,
  labelTone = "balanced",
  badgeLayout = "split",
  labelFormat = "raw",
  decimals = 0,
  valuePrefix,
  valueSuffix,
  paletteColors,
  axisColor,
  gridColor,
  surfaceColor,
  surfaceAccentColor,
}: {
  accent?: string;
  data?: ChartDatum[];
  tone?: ChartTone;
  palette?: ChartPalette;
  showGrid?: boolean;
  showXAxisLabels?: boolean;
  showYAxisLabels?: boolean;
  showXAxisLine?: boolean;
  showYAxisLine?: boolean;
  showDataLabels?: boolean;
  showHighlightBadges?: boolean;
  showSeriesPoints?: boolean;
  smooth?: boolean;
  lineWeight?: number;
  lineStyle?: "solid" | "dashed";
  pointSize?: number;
  axisLabelSize?: number;
  axisLabelRotate?: number;
  paddingMode?: ChartPaddingMode;
  gridStyle?: ChartGridStyle;
  gridOpacity?: number;
  axisOpacity?: number;
  labelTone?: ChartBadgeTone;
  badgeLayout?: "split" | "stacked" | "footer";
  labelFormat?: ChartLabelFormat;
  decimals?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  paletteColors?: string[];
  axisColor?: string;
  gridColor?: string;
  surfaceColor?: string;
  surfaceAccentColor?: string;
}) {
  const source = [{id: "line-source", values: data.map((item) => ({month: item.label, value: item.value}))}];
  const surface = chartSurfaceClasses(tone, axisColor, gridColor);
  const resolvedPalette = resolvePalette(accent, palette, paletteColors);
  const chartPadding = resolveChartPadding(paddingMode);
  const gridLineDash = resolveChartGridLineDash(gridStyle);
  const shellStyle = buildChartShellStyle(surfaceColor ?? surface.base, surfaceAccentColor ?? surface.accent);

  return (
    <div className="relative rounded-[4px] p-2" style={shellStyle}>
      <LineChart
        key={`line-${accent}`}
        data={source}
        xField="month"
        yField="value"
        height={Math.max(120, data.length > 4 ? 160 : 132)}
        color={[resolvedPalette[0]]}
        padding={chartPadding}
        axes={[
          {
            orient: "left",
            visible: showGrid || showYAxisLabels,
            label: {visible: showYAxisLabels, style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100)}},
            tick: {visible: false},
            domainLine: {visible: showYAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
            grid: {visible: showGrid, style: {stroke: withAlpha(surface.grid, gridOpacity / 100), lineDash: gridLineDash}},
          },
          {
            orient: "bottom",
            visible: showGrid || showXAxisLabels,
            label: {
              visible: showXAxisLabels,
              style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100), angle: axisLabelRotate},
            },
            tick: {visible: false},
            domainLine: {visible: showXAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
            grid: {visible: false},
          },
        ]}
        crosshair={{xField: {visible: false}, yField: {visible: false}}}
        legends={[]}
        point={{
          visible: showSeriesPoints || data.length <= 4,
          style: {fill: resolvedPalette[0], stroke: "#fafaf5", lineWidth: 1.5, size: pointSize},
        }}
        line={{
          style: {
            lineWidth: lineWeight,
            lineCap: "round",
            curveType: smooth ? "monotoneX" : "linear",
            lineDash: lineStyle === "dashed" ? [6, 4] : undefined,
          },
        }}
        tooltip={{visible: false}}
      />
      {showDataLabels || showHighlightBadges
        ? renderLineLikeLabelsWithAffix(
            data,
            surface.text,
            labelFormat,
            decimals,
            valuePrefix,
            valueSuffix,
            labelTone,
            showHighlightBadges,
            badgeLayout,
          )
        : null}
    </div>
  );
}

export function MiniAreaChart({
  accent = "#215637",
  data = fallbackLineData,
  tone = "soft",
  palette = "forest",
  showGrid = false,
  showXAxisLabels = false,
  showYAxisLabels = false,
  showXAxisLine = false,
  showYAxisLine = false,
  showDataLabels = false,
  showHighlightBadges = true,
  smooth = true,
  areaOpacity = 0.22,
  lineStyle = "solid",
  axisLabelSize = 8,
  axisLabelRotate = 0,
  paddingMode = "balanced",
  gridStyle = "dashed",
  gridOpacity = 42,
  axisOpacity = 56,
  labelTone = "balanced",
  badgeLayout = "split",
  labelFormat = "raw",
  decimals = 0,
  valuePrefix,
  valueSuffix,
  paletteColors,
  axisColor,
  gridColor,
  surfaceColor,
  surfaceAccentColor,
}: {
  accent?: string;
  data?: ChartDatum[];
  tone?: ChartTone;
  palette?: ChartPalette;
  showGrid?: boolean;
  showXAxisLabels?: boolean;
  showYAxisLabels?: boolean;
  showXAxisLine?: boolean;
  showYAxisLine?: boolean;
  showDataLabels?: boolean;
  showHighlightBadges?: boolean;
  smooth?: boolean;
  areaOpacity?: number;
  lineStyle?: "solid" | "dashed";
  axisLabelSize?: number;
  axisLabelRotate?: number;
  paddingMode?: ChartPaddingMode;
  gridStyle?: ChartGridStyle;
  gridOpacity?: number;
  axisOpacity?: number;
  labelTone?: ChartBadgeTone;
  badgeLayout?: "split" | "stacked" | "footer";
  labelFormat?: ChartLabelFormat;
  decimals?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  paletteColors?: string[];
  axisColor?: string;
  gridColor?: string;
  surfaceColor?: string;
  surfaceAccentColor?: string;
}) {
  const source = [{id: "area-source", values: data.map((item) => ({month: item.label, value: item.value}))}];
  const surface = chartSurfaceClasses(tone, axisColor, gridColor);
  const resolvedPalette = resolvePalette(accent, palette, paletteColors);
  const chartPadding = resolveChartPadding(paddingMode);
  const gridLineDash = resolveChartGridLineDash(gridStyle);
  const shellStyle = buildChartShellStyle(surfaceColor ?? surface.base, surfaceAccentColor ?? surface.accent);

  return (
    <div className="relative rounded-[4px] p-2" style={shellStyle}>
      <AreaChart
        key={`area-${accent}`}
        data={source}
        xField="month"
        yField="value"
        height={Math.max(120, data.length > 4 ? 160 : 132)}
        color={[resolvedPalette[0]]}
        padding={chartPadding}
        axes={[
          {
            orient: "left",
            visible: showGrid || showYAxisLabels,
            label: {visible: showYAxisLabels, style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100)}},
            tick: {visible: false},
            domainLine: {visible: showYAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
            grid: {visible: showGrid, style: {stroke: withAlpha(surface.grid, gridOpacity / 100), lineDash: gridLineDash}},
          },
          {
            orient: "bottom",
            visible: showGrid || showXAxisLabels,
            label: {
              visible: showXAxisLabels,
              style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100), angle: axisLabelRotate},
            },
            tick: {visible: false},
            domainLine: {visible: showXAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
            grid: {visible: false},
          },
        ]}
        crosshair={{xField: {visible: false}, yField: {visible: false}}}
        legends={[]}
        line={{
          style: {
            lineWidth: 2.5,
            lineCap: "round",
            curveType: smooth ? "monotoneX" : "linear",
            lineDash: lineStyle === "dashed" ? [6, 4] : undefined,
          },
        }}
        area={{style: {fillOpacity: areaOpacity}}}
        point={{visible: false}}
        tooltip={{visible: false}}
      />
      {showDataLabels || showHighlightBadges
        ? renderLineLikeLabelsWithAffix(
            data,
            surface.text,
            labelFormat,
            decimals,
            valuePrefix,
            valueSuffix,
            labelTone,
            showHighlightBadges,
            badgeLayout,
          )
        : null}
    </div>
  );
}

export function MiniBarChart({
  accent = "#406840",
  data = fallbackBarData,
  tone = "soft",
  palette = "forest",
  showGrid = false,
  showXAxisLabels = true,
  showYAxisLabels = false,
  showXAxisLine = true,
  showYAxisLine = false,
  showDataLabels = false,
  showHighlightBadges = true,
  barRadius = 4,
  axisLabelSize = 8,
  axisLabelRotate = 0,
  paddingMode = "balanced",
  gridStyle = "dashed",
  gridOpacity = 42,
  axisOpacity = 56,
  labelTone = "balanced",
  badgeLayout = "split",
  labelFormat = "raw",
  decimals = 0,
  valuePrefix,
  valueSuffix,
  paletteColors,
  axisColor,
  gridColor,
  surfaceColor,
  surfaceAccentColor,
}: {
  accent?: string;
  data?: ChartDatum[];
  tone?: ChartTone;
  palette?: ChartPalette;
  showGrid?: boolean;
  showXAxisLabels?: boolean;
  showYAxisLabels?: boolean;
  showXAxisLine?: boolean;
  showYAxisLine?: boolean;
  showDataLabels?: boolean;
  showHighlightBadges?: boolean;
  barRadius?: number;
  axisLabelSize?: number;
  axisLabelRotate?: number;
  paddingMode?: ChartPaddingMode;
  gridStyle?: ChartGridStyle;
  gridOpacity?: number;
  axisOpacity?: number;
  labelTone?: ChartBadgeTone;
  badgeLayout?: "split" | "stacked" | "footer";
  labelFormat?: ChartLabelFormat;
  decimals?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  paletteColors?: string[];
  axisColor?: string;
  gridColor?: string;
  surfaceColor?: string;
  surfaceAccentColor?: string;
}) {
  const source = [{id: "bar-source", values: data.map((item) => ({port: item.label, value: item.value}))}];
  const surface = chartSurfaceClasses(tone, axisColor, gridColor);
  const resolvedPalette = resolvePalette(accent, palette, paletteColors);
  const gridLineDash = resolveChartGridLineDash(gridStyle);
  const shellStyle = buildChartShellStyle(surfaceColor ?? surface.base, surfaceAccentColor ?? surface.accent);
  const chartPadding = paddingMode === "compact"
    ? {top: 8, right: 4, bottom: 20, left: 12}
    : paddingMode === "showcase"
      ? {top: 14, right: 12, bottom: 28, left: 22}
      : {top: 10, right: 6, bottom: 24, left: 18};

  return (
    <div className="relative rounded-[4px]" style={shellStyle}>
      <BarChart
        key={`bar-${accent}`}
        data={source}
        xField="port"
        yField="value"
        height={Math.max(128, data.length > 4 ? 176 : 144)}
        color={data.map((_, index) => resolvedPalette[index % resolvedPalette.length])}
        padding={chartPadding}
        axes={[
          {
            orient: "left",
            visible: showGrid || showYAxisLabels,
            label: {visible: showYAxisLabels, style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100)}},
            tick: {visible: false},
            domainLine: {visible: showYAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
            grid: {visible: showGrid, style: {stroke: withAlpha(surface.grid, gridOpacity / 100), lineDash: gridLineDash}},
          },
          {
            orient: "bottom",
            visible: showXAxisLabels,
            label: {
              visible: showXAxisLabels,
              style: {fontSize: axisLabelSize, fill: withAlpha(surface.text, axisOpacity / 100), angle: axisLabelRotate},
            },
            tick: {visible: false},
            domainLine: {visible: showXAxisLine, style: {stroke: withAlpha(surface.grid, axisOpacity / 100)}},
          },
        ]}
        bar={{
          state: {hover: {fillOpacity: 0.9}},
          style: {
            cornerRadiusTopLeft: barRadius,
            cornerRadiusTopRight: barRadius,
            cornerRadiusBottomLeft: Math.max(0, barRadius - 2),
            cornerRadiusBottomRight: Math.max(0, barRadius - 2),
          },
        }}
        crosshair={{xField: {visible: false}, yField: {visible: false}}}
        legends={[]}
        tooltip={{visible: false}}
      />
      {showDataLabels || showHighlightBadges
        ? renderBarLabelsWithAffix(
            data,
            surface.text,
            labelFormat,
            decimals,
            valuePrefix,
            valueSuffix,
            labelTone,
            showHighlightBadges,
            badgeLayout,
          )
        : null}
    </div>
  );
}

export function MiniPieChart({
  accent = "#23422a",
  data = fallbackPieData,
  tone = "soft",
  palette = "forest",
  showLegend = true,
  showDataLabels = false,
  showHighlightBadges = true,
  innerRadius = 0.58,
  legendPosition = "right",
  paddingMode = "balanced",
  legendTone = "balanced",
  labelTone = "balanced",
  badgeLayout = "footer",
  labelFormat = "percent",
  decimals = 0,
  valuePrefix,
  valueSuffix,
  paletteColors,
  axisColor,
  surfaceColor,
  surfaceAccentColor,
}: {
  accent?: string;
  data?: ChartDatum[];
  tone?: ChartTone;
  palette?: ChartPalette;
  showLegend?: boolean;
  showDataLabels?: boolean;
  showHighlightBadges?: boolean;
  innerRadius?: number;
  legendPosition?: "right" | "bottom";
  paddingMode?: ChartPaddingMode;
  legendTone?: ChartLegendTone;
  labelTone?: ChartBadgeTone;
  badgeLayout?: "split" | "stacked" | "footer";
  labelFormat?: ChartLabelFormat;
  decimals?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  paletteColors?: string[];
  axisColor?: string;
  surfaceColor?: string;
  surfaceAccentColor?: string;
}) {
  const source = [{id: "pie-source", values: data.map((item) => ({carrier: item.label, value: item.value}))}];
  const legendColors = resolvePalette(accent, palette, paletteColors);
  const surface = chartSurfaceClasses(tone, axisColor);
  const legendClass = legendToneClass(legendTone);
  const shellPaddingClass = paddingMode === "compact" ? "p-1.5" : paddingMode === "showcase" ? "p-3" : "p-2";
  const shellStyle = buildChartShellStyle(surfaceColor ?? surface.base, surfaceAccentColor ?? surface.accent);

  const pieSize = legendPosition === "bottom" ? 116 : 128;

  return (
    <div
      className={`rounded-[4px] ${shellPaddingClass} ${
        legendPosition === "bottom" ? "flex flex-col gap-3" : "flex items-center gap-4"
      }`}
      style={shellStyle}
    >
      <div className="relative shrink-0" style={{height: `${pieSize}px`, width: `${pieSize}px`}}>
        <PieChart
          key={`pie-${accent}`}
          data={source}
          categoryField="carrier"
          valueField="value"
          height={pieSize}
          color={legendColors}
          padding={0}
          outerRadius={0.82}
          innerRadius={innerRadius}
          legends={[]}
          tooltip={{visible: false}}
        />
        {showDataLabels || showHighlightBadges
          ? renderPieLabelsWithAffix(
              data,
              surface.text,
              labelFormat,
              decimals,
              valuePrefix,
              valueSuffix,
              labelTone,
              showHighlightBadges,
              badgeLayout,
            )
          : null}
      </div>

      {showLegend ? (
        <div
          className={`${legendPosition === "bottom" ? "grid grid-cols-2 gap-2" : "space-y-2"} ${legendClass}`}
          style={{color: surface.text}}
        >
          {data.slice(0, 3).map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{background: legendColors[index] ?? accent}} />
              {item.label} {decorateChartValue(formatChartValue(item.value, labelFormat, decimals), valuePrefix, valueSuffix)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderLineLikeLabelsWithAffix(
  data: ChartDatum[],
  textColor: string,
  labelFormat: ChartLabelFormat,
  decimals: number,
  valuePrefix?: string,
  valueSuffix?: string,
  tone: ChartBadgeTone = "balanced",
  showHighlights = true,
  layout: "split" | "stacked" | "footer" = "split",
) {
  const peak = [...data].sort((a, b) => b.value - a.value)[0];
  const latest = data[data.length - 1];
  const badgeTone = badgeToneClasses(tone);

  return (
    <>
      {showHighlights ? (
        <div
          className={`pointer-events-none absolute inset-x-2 top-1 z-[2] ${
            layout === "stacked" ? "flex flex-col items-start gap-1.5" : "flex items-start justify-between"
          } ${badgeTone.text}`}
        >
          <div className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`} style={{color: textColor}}>
            最新 {decorateChartValue(formatChartValue(latest?.value ?? 0, labelFormat, decimals), valuePrefix, valueSuffix)}
          </div>
          <div className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`} style={{color: textColor}}>
            峰值 {decorateChartValue(formatChartValue(peak?.value ?? 0, labelFormat, decimals), valuePrefix, valueSuffix)}
          </div>
        </div>
      ) : null}
      <div
        className={`pointer-events-none absolute inset-x-3 bottom-1 z-[2] ${
          layout === "footer" ? "flex flex-wrap items-center justify-center gap-1.5" : "flex items-center justify-between"
        } ${badgeTone.text}`}
      >
        {data.slice(Math.max(0, data.length - 3)).map((item, index) => (
          <span
            key={`line-inline-${item.label}-${index}`}
            className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`}
            style={{color: textColor}}
          >
            {item.label} {decorateChartValue(formatChartValue(item.value, labelFormat, decimals), valuePrefix, valueSuffix)}
          </span>
        ))}
      </div>
    </>
  );
}

function renderBarLabelsWithAffix(
  data: ChartDatum[],
  textColor: string,
  labelFormat: ChartLabelFormat,
  decimals: number,
  valuePrefix?: string,
  valueSuffix?: string,
  tone: ChartBadgeTone = "balanced",
  showHighlights = true,
  layout: "split" | "stacked" | "footer" = "split",
) {
  const badgeTone = badgeToneClasses(tone);
  return (
    <>
      {showHighlights ? (
        <div
          className={`pointer-events-none absolute inset-x-3 top-2 z-[2] ${
            layout === "stacked" ? "flex flex-col items-start gap-1.5" : "flex items-center justify-between"
          } ${badgeTone.text}`}
        >
          {data.slice(0, 3).map((item, index) => (
            <span
              key={`bar-label-${item.label}-${index}`}
              className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`}
              style={{color: textColor}}
            >
              {decorateChartValue(formatChartValue(item.value, labelFormat, decimals), valuePrefix, valueSuffix)}
            </span>
          ))}
        </div>
      ) : null}
      <div
        className={`pointer-events-none absolute inset-x-3 bottom-1 z-[2] ${
          layout === "footer" ? "flex flex-wrap items-center justify-center gap-1.5" : "flex items-center justify-between"
        } ${badgeTone.text}`}
      >
        {data.slice(0, 3).map((item, index) => (
          <span
            key={`bar-inline-${item.label}-${index}`}
            className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`}
            style={{color: textColor}}
          >
            {item.label}
          </span>
        ))}
      </div>
    </>
  );
}

function renderPieLabelsWithAffix(
  data: ChartDatum[],
  textColor: string,
  labelFormat: ChartLabelFormat,
  decimals: number,
  valuePrefix?: string,
  valueSuffix?: string,
  tone: ChartBadgeTone = "balanced",
  showHighlights = true,
  layout: "split" | "stacked" | "footer" = "footer",
) {
  const badgeTone = badgeToneClasses(tone);
  if (!showHighlights) return null;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-1 z-[2] ${
        layout === "stacked" ? "flex flex-col items-center gap-1.5" : "flex items-center justify-center gap-2"
      } ${badgeTone.text}`}
    >
      {data.slice(0, 2).map((item) => (
        <span
          key={`pie-label-${item.label}`}
          className={`rounded-full border px-2 py-1 backdrop-blur-sm ${badgeTone.surface}`}
          style={{color: textColor}}
        >
          {item.label} {decorateChartValue(formatChartValue(item.value, labelFormat, decimals), valuePrefix, valueSuffix)}
        </span>
      ))}
    </div>
  );
}
