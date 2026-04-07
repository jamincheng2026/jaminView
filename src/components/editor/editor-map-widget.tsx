"use client";

import {useMemo} from "react";
import {geoMercator, geoPath} from "d3-geo";
import {feature} from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";

import {mapSnapshot, type WidgetDataset} from "@/lib/editor-widget-data";
import type {EditorWidget} from "@/lib/mocks/editor";

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 720;

type MapThemeName = "emerald" | "midnight" | "amber";
type MapRouteDensity = "low" | "balanced" | "high";

type EditorMapWidgetProps = {
  widget: EditorWidget;
  dataset?: WidgetDataset;
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme: MapThemeName;
  mapRouteDensity: MapRouteDensity;
  mapMarkers: boolean;
  mapGlow: number;
  mapRouteStyle: "solid" | "dashed" | "pulse";
  mapLabelStyle: "pill" | "minimal";
  mapSurfaceTone: "soft" | "contrast";
  mapPointScale: number;
  mapRouteWidth: number;
  mapLandOpacity: number;
  mapLabelOpacity: number;
  mapOceanColor: string;
  mapLandStartColor: string;
  mapLandEndColor: string;
  mapBorderColor: string;
  mapAxisColor: string;
  mapAxisSecondaryColor: string;
  mapRouteColor: string;
  mapRouteGlowColor: string;
  mapMarkerColor: string;
  mapMarkerHaloColor: string;
  mapMarkerGlowColor: string;
  mapLabelColor: string;
  mapPanelTextColor: string;
  mapHeatLowColor: string;
  mapHeatHighColor: string;
};

type WorldAtlasTopology = {
  objects: {
    countries: unknown;
  };
};

const worldTopology = countries110m as unknown as WorldAtlasTopology;
const countryFeatures = feature(worldTopology as never, worldTopology.objects.countries as never) as unknown as {
  features: Array<{id?: string | number; geometry: unknown}>;
};

export function EditorMapWidget({
  widget,
  dataset,
  mapLabels,
  map3dAxis,
  mapZoom,
  mapTheme,
  mapRouteDensity,
  mapMarkers,
  mapGlow,
  mapRouteStyle,
  mapLabelStyle,
  mapSurfaceTone,
  mapPointScale,
  mapRouteWidth,
  mapLandOpacity,
  mapLabelOpacity,
  mapOceanColor,
  mapLandStartColor,
  mapLandEndColor,
  mapBorderColor,
  mapAxisColor,
  mapAxisSecondaryColor,
  mapRouteColor,
  mapRouteGlowColor,
  mapMarkerColor,
  mapMarkerHaloColor,
  mapMarkerGlowColor,
  mapLabelColor,
  mapPanelTextColor,
  mapHeatLowColor,
  mapHeatHighColor,
}: EditorMapWidgetProps) {
  const theme = mapThemes[mapTheme];
  const surfaceStart = mapLandStartColor || theme.surfaceStart;
  const surfaceEnd = mapLandEndColor || theme.surfaceEnd;
  const ocean = mapOceanColor || theme.ocean;
  const border = mapBorderColor || theme.border;
  const axis = mapAxisColor || theme.axis;
  const axisSecondary = mapAxisSecondaryColor || theme.axisSecondary;
  const routeColor = mapRouteColor || theme.route;
  const routeGlowColor = mapRouteGlowColor || theme.routeGlow;
  const marker = mapMarkerColor || theme.marker;
  const markerHalo = mapMarkerHaloColor || theme.markerHalo;
  const markerGlow = mapMarkerGlowColor || theme.markerGlow;
  const labelColor = mapLabelColor || "#f5fff7";
  const panelTextColor = mapPanelTextColor || "#243129";
  const heatLow = mapHeatLowColor || theme.heatLow;
  const heatHigh = mapHeatHighColor || theme.heatHigh;
  const zoomFactor = clampNumber(Number.parseFloat(mapZoom.replace("x", "")), 1, 3);
  // Keep the map data derived from the currently bound dataset so map theme
  // controls and dataset bindings are working against the same source of truth.
  const mapData = useMemo(() => mapSnapshot(dataset, widget.fieldMap), [dataset, widget.fieldMap]);

  const projection = useMemo(() => {
    const projectionInstance = geoMercator();
    const padding = 42 - (zoomFactor - 1) * 12;

    // Fit the world once into a stable design-time viewBox so the map remains
    // predictable while the editor canvas itself scales.
    projectionInstance.fitExtent(
      [
        [padding, padding + 8],
        [MAP_WIDTH - padding, MAP_HEIGHT - padding - 12],
      ],
      {
        type: "FeatureCollection",
        features: countryFeatures.features,
      } as never,
    );

    return projectionInstance;
  }, [zoomFactor]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);
  const visibleRoutes = useMemo(() => {
    if (mapRouteDensity === "low") return mapData.routes.slice(0, 2);
    if (mapRouteDensity === "balanced") return mapData.routes.slice(0, 4);
    return mapData.routes;
  }, [mapData.routes, mapRouteDensity]);
  const glowOpacity = clampNumber(mapGlow / 100, 0, 1);
  const markerScale = clampNumber(mapPointScale / 100, 0.45, 2.4);
  const routeScale = clampNumber(mapRouteWidth / 100, 0.45, 2.2);
  const landOpacity = clampNumber(mapLandOpacity / 100, 0.24, 1);
  const labelOpacity = clampNumber(mapLabelOpacity / 100, 0.18, 1);

  return (
    <div className="relative h-full overflow-hidden border border-[#c2c8bf]/40" style={{background: theme.base}}>
      <div
        className="absolute inset-0"
        style={{
          background: theme.backdrop,
        }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`jaminview-map-surface-${mapTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={surfaceStart} />
            <stop offset="100%" stopColor={surfaceEnd} />
          </linearGradient>
          <filter id={`jaminview-map-glow-${mapTheme}`}>
            <feGaussianBlur stdDeviation="10" result="blurred" />
          </filter>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={ocean} />

        {countryFeatures.features.map((shape, index) => (
          <path
            key={String(shape.id ?? index)}
            d={pathGenerator(shape as never) ?? ""}
            fill={`url(#jaminview-map-surface-${mapTheme})`}
            stroke={border}
            strokeWidth={mapSurfaceTone === "contrast" ? 1.45 : 1.15}
            opacity={(mapSurfaceTone === "contrast" ? 1 : 0.96) * landOpacity}
          />
        ))}

        {map3dAxis ? (
          <>
            <path
              d={`M120 ${MAP_HEIGHT - 118} C 360 ${MAP_HEIGHT - 158}, 700 ${MAP_HEIGHT - 166}, 1140 ${MAP_HEIGHT - 120}`}
              fill="none"
              stroke={axis}
              strokeWidth="2"
              opacity="0.75"
            />
            <path
              d={`M180 ${MAP_HEIGHT - 76} C 460 ${MAP_HEIGHT - 102}, 830 ${MAP_HEIGHT - 100}, 1090 ${MAP_HEIGHT - 74}`}
              fill="none"
              stroke={axisSecondary}
              strokeWidth="1.25"
              opacity="0.52"
              strokeDasharray="8 12"
            />
          </>
        ) : null}

        {visibleRoutes.map((route) => {
          const source = projection([route.from.lon, route.from.lat]);
          const target = projection([route.to.lon, route.to.lat]);
          if (!source || !target) return null;

          const controlX = (source[0] + target[0]) / 2;
          const controlY = Math.min(source[1], target[1]) - 42 - route.intensity * 18;

          return (
            <g key={route.id}>
              <path
                d={`M ${source[0]} ${source[1]} Q ${controlX} ${controlY} ${target[0]} ${target[1]}`}
                fill="none"
                stroke={routeGlowColor}
                strokeWidth={(3.4 + route.intensity * 2) * routeScale}
                opacity={mapRouteStyle === "solid" ? 0.1 + glowOpacity * 0.14 : 0.18 + glowOpacity * 0.25}
                filter={`url(#jaminview-map-glow-${mapTheme})`}
              />
              <path
                d={`M ${source[0]} ${source[1]} Q ${controlX} ${controlY} ${target[0]} ${target[1]}`}
                fill="none"
                stroke={routeColor}
                strokeWidth={(mapRouteStyle === "pulse" ? 1.5 + route.intensity * 1.2 : 1.15 + route.intensity) * routeScale}
                opacity={mapSurfaceTone === "contrast" ? 0.95 : 0.7 + route.intensity * 0.18}
                strokeDasharray={mapRouteStyle === "dashed" || route.dashed ? "8 8" : undefined}
              />
            </g>
          );
        })}

        {mapMarkers
          ? mapData.points.map((point) => {
              const projected = projection([point.lon, point.lat]);
              if (!projected) return null;

              const radius = (8 + point.intensity * 4) * markerScale;

              return (
                <g key={point.id}>
                  <circle
                    cx={projected[0]}
                    cy={projected[1]}
                    r={radius * 1.6}
                    fill={markerGlow}
                    opacity={0.12 + glowOpacity * 0.3}
                    filter={`url(#jaminview-map-glow-${mapTheme})`}
                  />
                  <circle cx={projected[0]} cy={projected[1]} r={radius} fill={markerHalo} opacity={0.24 + point.intensity * 0.22} />
                  <circle cx={projected[0]} cy={projected[1]} r={3.4 + point.intensity * 2} fill={marker} />
                </g>
              );
            })
          : null}
      </svg>

      <div className="absolute left-4 top-4 rounded-full border border-white/18 bg-white/88 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#23422a] backdrop-blur-sm">
        Live Monitoring
      </div>

      {mapLabels ? (
        <>
          {mapData.points.slice(0, 4).map((point) => {
            const projected = projection([point.lon, point.lat]);
            if (!projected) return null;

            return (
              <span
                key={`${point.id}-label`}
                className={
                  mapLabelStyle === "minimal"
                    ? "absolute text-[8px] font-semibold text-white/88"
                    : "absolute rounded bg-white/82 px-2 py-1 text-[8px] font-semibold text-[#20302a] shadow-sm"
                }
                style={{
                  left: `${(projected[0] / MAP_WIDTH) * 100}%`,
                  top: `${(projected[1] / MAP_HEIGHT) * 100}%`,
                  transform: mapLabelStyle === "minimal" ? "translate(8px, -12px)" : "translate(8px, -18px)",
                  opacity: labelOpacity,
                  color: labelColor,
                  textShadow: mapLabelStyle === "minimal" ? "0 1px 4px rgba(0,0,0,0.45)" : undefined,
                }}
              >
                {point.label}
              </span>
            );
          })}
        </>
      ) : null}

      <div className="absolute bottom-3 right-3 w-44 rounded-[4px] border border-white/20 bg-white/88 p-3 text-[9px] shadow-sm backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <span>Region Heat</span>
          <span className="font-bold">{mapZoom}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{background: `linear-gradient(90deg, ${heatLow}, ${heatHigh})`}} />
        <div className="mt-2 flex items-center justify-between text-[8px] uppercase tracking-[0.16em]" style={{color: panelTextColor}}>
          <span>{mapData.points.length} points</span>
          <span>{visibleRoutes.length} routes</span>
        </div>
      </div>

      {widget.hint ? (
        <div className="absolute bottom-3 left-3 max-w-52 rounded-[4px] border border-white/15 bg-black/28 px-3 py-2 text-[8px] text-white/90 backdrop-blur-sm">
          {widget.hint}
        </div>
      ) : null}
    </div>
  );
}

const mapThemes = {
  emerald: {
    base: "#20302a",
    ocean: "#15221b",
    surfaceStart: "#244735",
    surfaceEnd: "#1d3127",
    border: "rgba(160, 206, 176, 0.28)",
    backdrop:
      "radial-gradient(circle at 50% 36%, rgba(122,197,145,0.16), transparent 38%), linear-gradient(180deg, rgba(6,15,10,0.08) 0%, rgba(9,22,15,0.16) 100%)",
    route: "#9ad9ab",
    routeGlow: "#84e19b",
    axis: "rgba(255,255,255,0.34)",
    axisSecondary: "rgba(144,191,156,0.28)",
    marker: "#f1fff4",
    markerHalo: "#bfecc6",
    markerGlow: "#7dda91",
    heatLow: "rgba(33,86,55,0.18)",
    heatHigh: "rgba(33,86,55,0.92)",
  },
  midnight: {
    base: "#132033",
    ocean: "#0c1725",
    surfaceStart: "#20344d",
    surfaceEnd: "#162331",
    border: "rgba(161, 194, 234, 0.28)",
    backdrop:
      "radial-gradient(circle at 50% 30%, rgba(86,147,255,0.18), transparent 40%), linear-gradient(180deg, rgba(4,11,20,0.12) 0%, rgba(5,10,20,0.24) 100%)",
    route: "#90c5ff",
    routeGlow: "#5ab0ff",
    axis: "rgba(195,218,255,0.36)",
    axisSecondary: "rgba(129,169,230,0.25)",
    marker: "#f0f7ff",
    markerHalo: "#b9d8ff",
    markerGlow: "#60b3ff",
    heatLow: "rgba(74,119,196,0.18)",
    heatHigh: "rgba(74,119,196,0.92)",
  },
  amber: {
    base: "#3a2415",
    ocean: "#26160c",
    surfaceStart: "#5d3b1f",
    surfaceEnd: "#422813",
    border: "rgba(255, 219, 168, 0.24)",
    backdrop:
      "radial-gradient(circle at 50% 34%, rgba(255,186,82,0.14), transparent 40%), linear-gradient(180deg, rgba(25,14,6,0.08) 0%, rgba(32,18,8,0.18) 100%)",
    route: "#ffd18a",
    routeGlow: "#ffc66b",
    axis: "rgba(255,227,186,0.34)",
    axisSecondary: "rgba(226,180,112,0.22)",
    marker: "#fff7ea",
    markerHalo: "#ffe0b0",
    markerGlow: "#ffc66b",
    heatLow: "rgba(196,124,54,0.18)",
    heatHigh: "rgba(196,124,54,0.92)",
  },
} as const;

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
