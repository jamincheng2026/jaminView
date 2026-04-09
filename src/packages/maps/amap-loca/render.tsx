"use client";

import * as React from "react";
import type {} from "@amap/amap-jsapi-types";

import { ChartFrame, type Widget } from "@/packages/types";

import {
  createDefaultAmapLocaMapConfig,
  type AmapLocaBusinessPoint,
  type AmapLocaDataset,
  type AmapLocaMapConfig,
  type AmapLocaRegion,
  type AmapLocaRegionLevel,
  type AmapLocaTheme,
} from "./config";

type AMapLoaderModule = typeof import("@amap/amap-jsapi-loader");
type AMapModuleType = typeof AMap;

type LocaPointFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: AmapLocaBusinessPoint;
};

type LocaFeatureCollection = {
  type: "FeatureCollection";
  features: LocaPointFeature[];
};

type LocaGeoJsonSourceLike = object;

interface LocaLayerLike {
  destroy?: () => void;
  hide: (duration?: number) => void;
  setSource: (
    source: LocaGeoJsonSourceLike,
    options?: Record<string, unknown>,
  ) => void;
  setStyle: (style: Record<string, unknown>) => void;
  show: (duration?: number) => void;
}

interface LocaContainerLike {
  add: (layer: LocaLayerLike) => void;
  animate?: {
    clear?: () => void;
    start: () => void;
    stop?: () => void;
  };
  destroy: () => void;
  remove: (layer: LocaLayerLike) => void;
}

interface LocaModuleLike {
  Container: new (options: { map: AMap.Map }) => LocaContainerLike;
  GeoJSONSource: new (options: { data: LocaFeatureCollection }) => LocaGeoJsonSourceLike;
  HeatMapLayer: new (options?: Record<string, unknown>) => LocaLayerLike;
}

interface AMapRuntimeWindow extends Window {
  Loca?: LocaModuleLike;
  _AMapSecurityConfig?: {
    securityJsCode?: string;
  };
}

type MapLoadState = "loading" | "missing-key" | "ready" | "error";
type HeatLayerRuntimeState = "disabled" | "loca" | "fallback";

const REGION_LEVEL_RANK: Record<AmapLocaRegionLevel, number> = {
  country: 0,
  province: 1,
  city: 2,
};

const REGION_LEVEL_LABELS: Record<AmapLocaRegionLevel, string> = {
  country: "全国",
  province: "省级",
  city: "城市",
};

const THEME_STYLE_MAP: Record<AmapLocaTheme, string> = {
  dark: "amap://styles/dark",
  normal: "amap://styles/normal",
  fresh: "amap://styles/fresh",
  light: "amap://styles/whitesmoke",
  blue: "amap://styles/blue",
};

function getAmapLocaMapConfig(widget: Widget): AmapLocaMapConfig {
  if (widget.chartFrame !== ChartFrame.CUSTOM) {
    return createDefaultAmapLocaMapConfig();
  }

  return widget.config as AmapLocaMapConfig;
}

function resolveMapStyle(config: AmapLocaMapConfig) {
  const customStyleId = config.map.customStyleId.trim();

  if (customStyleId.length === 0) {
    return THEME_STYLE_MAP[config.map.theme];
  }

  return customStyleId.startsWith("amap://styles/")
    ? customStyleId
    : `amap://styles/${customStyleId}`;
}

function getRegionByAdcode(dataset: AmapLocaDataset, adcode: string) {
  return dataset.regions.find((region) => region.adcode === adcode) ?? null;
}

function isRegionWithinBranch(
  dataset: AmapLocaDataset,
  candidateAdcode: string,
  ancestorAdcode: string,
) {
  let cursor = getRegionByAdcode(dataset, candidateAdcode);

  while (cursor) {
    if (cursor.adcode === ancestorAdcode) {
      return true;
    }

    cursor = cursor.parentAdcode ? getRegionByAdcode(dataset, cursor.parentAdcode) : null;
  }

  return false;
}

function resolveCurrentRegion(config: AmapLocaMapConfig, currentAdcode: string) {
  const rootRegion =
    getRegionByAdcode(config.dataset, config.drill.rootAdcode) ??
    config.dataset.regions[0] ??
    null;

  if (!rootRegion) {
    return null;
  }

  const currentRegion = getRegionByAdcode(config.dataset, currentAdcode);

  if (!currentRegion) {
    return rootRegion;
  }

  if (!isRegionWithinBranch(config.dataset, currentRegion.adcode, rootRegion.adcode)) {
    return rootRegion;
  }

  return currentRegion;
}

function buildRegionTrail(dataset: AmapLocaDataset, region: AmapLocaRegion | null) {
  const trail: AmapLocaRegion[] = [];
  let cursor = region;

  while (cursor) {
    trail.unshift(cursor);
    cursor = cursor.parentAdcode ? getRegionByAdcode(dataset, cursor.parentAdcode) : null;
  }

  return trail;
}

function getChildRegions(config: AmapLocaMapConfig, currentRegion: AmapLocaRegion | null) {
  if (!config.drill.enabled || !currentRegion) {
    return [] as AmapLocaRegion[];
  }

  if (REGION_LEVEL_RANK[currentRegion.level] >= REGION_LEVEL_RANK[config.drill.maxLevel]) {
    return [] as AmapLocaRegion[];
  }

  return config.dataset.regions.filter((region) => region.parentAdcode === currentRegion.adcode);
}

function filterBusinessPoints(
  config: AmapLocaMapConfig,
  currentRegion: AmapLocaRegion | null,
) {
  if (!currentRegion) {
    return [] as AmapLocaBusinessPoint[];
  }

  if (currentRegion.level === "country") {
    return config.dataset.businessPoints;
  }

  if (currentRegion.level === "province") {
    return config.dataset.businessPoints.filter(
      (point) => point.provinceAdcode === currentRegion.adcode,
    );
  }

  return config.dataset.businessPoints.filter(
    (point) => point.cityAdcode === currentRegion.adcode,
  );
}

function toFeatureCollection(points: AmapLocaBusinessPoint[]): LocaFeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point.position,
      },
      properties: point,
    })),
  };
}

function getViewForRegion(config: AmapLocaMapConfig, region: AmapLocaRegion | null) {
  if (!region) {
    return {
      center: config.map.center,
      zoom: config.map.zoom,
    };
  }

  if (region.adcode === config.drill.rootAdcode) {
    return {
      center: config.map.center,
      zoom: config.map.zoom,
    };
  }

  return {
    center: region.center,
    zoom: region.zoom,
  };
}

function clearPointMarkers(markersRef: React.MutableRefObject<AMap.CircleMarker[]>) {
  markersRef.current.forEach((marker) => marker.setMap(null));
  markersRef.current = [];
}

function syncPointMarkers(
  amapModule: AMapModuleType,
  map: AMap.Map,
  config: AmapLocaMapConfig,
  points: AmapLocaBusinessPoint[],
  markersRef: React.MutableRefObject<AMap.CircleMarker[]>,
) {
  clearPointMarkers(markersRef);

  if (!config.pointLayer.visible) {
    return;
  }

  markersRef.current = points.map((point) => {
    const marker = new amapModule.CircleMarker({
      center: point.position,
      radius: Math.max(4, config.pointLayer.radius * (0.6 + point.heat / 140)),
      fillColor: config.pointLayer.fillColor,
      fillOpacity: config.pointLayer.opacity / 100,
      strokeColor: config.pointLayer.strokeColor,
      strokeOpacity: 0.92,
      strokeWeight: 1.6,
      bubble: false,
      cursor: "pointer",
      zIndex: 126,
    });

    marker.setMap(map);
    return marker;
  });
}

function clearDistrictLayer(
  map: AMap.Map | null,
  districtLayerRef: React.MutableRefObject<AMap.DistrictLayer | null>,
) {
  if (map && districtLayerRef.current) {
    map.remove(districtLayerRef.current);
  }

  districtLayerRef.current = null;
}

function syncDistrictLayer(
  amapModule: AMapModuleType,
  map: AMap.Map,
  config: AmapLocaMapConfig,
  currentRegion: AmapLocaRegion | null,
  districtLayerRef: React.MutableRefObject<AMap.DistrictLayer | null>,
) {
  clearDistrictLayer(map, districtLayerRef);

  if (!currentRegion) {
    return;
  }

  const depth =
    currentRegion.level === "country"
      ? 1
      : currentRegion.level === "province"
        ? config.drill.maxLevel === "city"
          ? 2
          : 1
        : 2;

  const districtLayer = new amapModule.DistrictLayer.Province({
    zIndex: 38,
    opacity: 1,
    depth,
    adcode: [Number(currentRegion.adcode)],
    styles: {
      "stroke-width": config.drill.strokeWidth,
      "nation-stroke": "#9de9b3",
      "province-stroke": "#8ecfa0",
      "city-stroke": "#b8dec0",
      "county-stroke": "#dce8df",
      fill: `rgba(35,66,42,${config.drill.fillOpacity / 100})`,
    },
  });

  districtLayerRef.current = districtLayer;
  map.add(districtLayer);
  districtLayer.setFitViewByAdcode(currentRegion.adcode, true, [84, 84, 84, 84]);
}

function clearHeatLayer(
  heatLayerRef: React.MutableRefObject<LocaLayerLike | null>,
  locaContainerRef: React.MutableRefObject<LocaContainerLike | null>,
) {
  if (heatLayerRef.current && locaContainerRef.current) {
    locaContainerRef.current.remove(heatLayerRef.current);
    heatLayerRef.current.destroy?.();
  }

  heatLayerRef.current = null;
}

function syncHeatLayer(
  locaModule: LocaModuleLike | undefined,
  map: AMap.Map,
  config: AmapLocaMapConfig,
  points: AmapLocaBusinessPoint[],
  heatLayerRef: React.MutableRefObject<LocaLayerLike | null>,
  locaContainerRef: React.MutableRefObject<LocaContainerLike | null>,
) {
  clearHeatLayer(heatLayerRef, locaContainerRef);

  if (!config.heatmap.visible || points.length === 0 || !locaModule) {
    return locaModule ? "disabled" : "fallback";
  }

  const locaContainer =
    locaContainerRef.current ?? new locaModule.Container({ map });
  const source = new locaModule.GeoJSONSource({
    data: toFeatureCollection(points),
  });
  const heatLayer = new locaModule.HeatMapLayer({
    zIndex: 110,
    opacity: config.heatmap.opacity / 100,
    visible: true,
    zooms: [3, 22],
  });

  heatLayer.setSource(source, {
    value: "heat",
  });
  heatLayer.setStyle({
    radius: config.heatmap.radius,
    unit: "px",
    opacity: config.heatmap.opacity / 100,
    blur: config.heatmap.blur / 100,
    intensity: config.heatmap.intensity / 100,
    gradient: {
      0.16: "rgba(123, 226, 147, 0.16)",
      0.38: "rgba(112, 212, 138, 0.34)",
      0.62: "rgba(35, 66, 42, 0.68)",
      0.82: "rgba(33, 95, 72, 0.82)",
      1: "rgba(246, 193, 89, 0.96)",
    },
  });
  locaContainer.add(heatLayer);
  locaContainer.animate?.start();

  locaContainerRef.current = locaContainer;
  heatLayerRef.current = heatLayer;
  return "loca" as const;
}

function destroyRuntimeLayers(
  mapRef: React.MutableRefObject<AMap.Map | null>,
  districtLayerRef: React.MutableRefObject<AMap.DistrictLayer | null>,
  pointMarkersRef: React.MutableRefObject<AMap.CircleMarker[]>,
  heatLayerRef: React.MutableRefObject<LocaLayerLike | null>,
  locaContainerRef: React.MutableRefObject<LocaContainerLike | null>,
) {
  const map = mapRef.current;

  if (map) {
    clearDistrictLayer(map, districtLayerRef);
  }

  clearPointMarkers(pointMarkersRef);
  clearHeatLayer(heatLayerRef, locaContainerRef);
  locaContainerRef.current?.destroy();
  locaContainerRef.current = null;

  mapRef.current?.destroy();
  mapRef.current = null;
}

export function AmapLocaMapRender({
  widget,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<AMap.Map | null>(null);
  const districtLayerRef = React.useRef<AMap.DistrictLayer | null>(null);
  const pointMarkersRef = React.useRef<AMap.CircleMarker[]>([]);
  const heatLayerRef = React.useRef<LocaLayerLike | null>(null);
  const locaContainerRef = React.useRef<LocaContainerLike | null>(null);

  const [loadState, setLoadState] = React.useState<MapLoadState>("loading");
  const [heatRuntimeState, setHeatRuntimeState] =
    React.useState<HeatLayerRuntimeState>("disabled");
  const [currentAdcode, setCurrentAdcode] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const config = React.useMemo(() => getAmapLocaMapConfig(widget), [widget]);

  React.useEffect(() => {
    setCurrentAdcode(config.drill.rootAdcode);
  }, [config.drill.rootAdcode]);

  const currentRegion = React.useMemo(
    () => resolveCurrentRegion(config, currentAdcode),
    [config, currentAdcode],
  );
  const drillTrail = React.useMemo(
    () => buildRegionTrail(config.dataset, currentRegion),
    [config.dataset, currentRegion],
  );
  const childRegions = React.useMemo(
    () => getChildRegions(config, currentRegion),
    [config, currentRegion],
  );
  const visiblePoints = React.useMemo(
    () => filterBusinessPoints(config, currentRegion),
    [config, currentRegion],
  );
  const peakHeat = React.useMemo(
    () => Math.max(...visiblePoints.map((point) => point.heat), 0),
    [visiblePoints],
  );

  React.useEffect(() => {
    if (!currentRegion) {
      setCurrentAdcode(config.drill.rootAdcode);
    }
  }, [config.drill.rootAdcode, currentRegion]);

  React.useEffect(() => {
    let cancelled = false;

    const mountMap = async () => {
      const amapKey = config.map.amapKey.trim();
      if (amapKey.length === 0) {
        setLoadState("missing-key");
        setErrorMessage(null);
        setHeatRuntimeState("disabled");
        return;
      }

      try {
        const { load: loadAMapApi } = (await import(
          "@amap/amap-jsapi-loader"
        )) as AMapLoaderModule;
        const runtimeWindow = window as AMapRuntimeWindow;

        if (config.map.securityJsCode.trim().length > 0) {
          runtimeWindow._AMapSecurityConfig = {
            securityJsCode: config.map.securityJsCode.trim(),
          };
        }

        const amapModule = (await loadAMapApi({
          key: amapKey,
          version: "2.0",
          Loca: {
            version: "2.0.0",
          },
        })) as AMapModuleType;

        if (cancelled || !hostRef.current) {
          return;
        }

        const map =
          mapRef.current ??
          new amapModule.Map(hostRef.current, {
            viewMode: config.map.viewMode,
            pitch: config.map.viewMode === "3D" ? config.map.pitch : 0,
            center: config.map.center,
            zoom: config.map.zoom,
            features: [...config.map.features],
            zooms: [3, 22],
            animateEnable: true,
          });

        mapRef.current = map;
        map.setMapStyle(resolveMapStyle(config));
        map.setFeatures([...config.map.features]);
        map.setPitch(config.map.viewMode === "3D" ? config.map.pitch : 0, true);

        const nextView = getViewForRegion(config, currentRegion);
        map.setZoomAndCenter(nextView.zoom, nextView.center, true);

        syncDistrictLayer(amapModule, map, config, currentRegion, districtLayerRef);
        syncPointMarkers(amapModule, map, config, visiblePoints, pointMarkersRef);

        const nextHeatRuntimeState = syncHeatLayer(
          runtimeWindow.Loca,
          map,
          config,
          visiblePoints,
          heatLayerRef,
          locaContainerRef,
        );

        setHeatRuntimeState(nextHeatRuntimeState);
        setLoadState("ready");
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) {
          console.error("高德 Loca 业务地图加载失败", error);
          setLoadState("error");
          setHeatRuntimeState("fallback");
          setErrorMessage(error instanceof Error ? error.message : "未知错误");
        }
      }
    };

    void mountMap();

    return () => {
      cancelled = true;
    };
  }, [config, currentRegion, visiblePoints]);

  React.useEffect(() => {
    return () => {
      destroyRuntimeLayers(
        mapRef,
        districtLayerRef,
        pointMarkersRef,
        heatLayerRef,
        locaContainerRef,
      );
    };
  }, []);

  const handleDrillChange = (adcode: string) => {
    setCurrentAdcode(adcode);
  };

  const handleBack = () => {
    const parentAdcode = currentRegion?.parentAdcode;
    if (parentAdcode) {
      setCurrentAdcode(parentAdcode);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(61,108,76,0.18),transparent_26%),linear-gradient(180deg,#0d1712_0%,#111d17_100%)]">
      <div ref={hostRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-4 top-4 max-w-[320px] rounded-[24px] border border-white/10 bg-[rgba(9,16,13,0.78)] px-4 py-4 text-[#f5fff7] backdrop-blur-md">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fe2a4]">
            高德 Loca
          </div>
          <div className="mt-2 text-lg font-bold">业务分布地图</div>
          <div className="mt-2 text-xs leading-5 text-[#d3e7d8]">
            当前区域：{currentRegion?.name ?? "未定位"} /{" "}
            {currentRegion ? REGION_LEVEL_LABELS[currentRegion.level] : "未配置"}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] tracking-[0.12em] text-[#9bb3a3]">点位</div>
              <div className="mt-1 text-lg font-bold">{visiblePoints.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] tracking-[0.12em] text-[#9bb3a3]">峰值</div>
              <div className="mt-1 text-lg font-bold">{peakHeat}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] tracking-[0.12em] text-[#9bb3a3]">热力</div>
              <div className="mt-1 text-sm font-bold">
                {heatRuntimeState === "loca"
                  ? "Loca"
                  : heatRuntimeState === "fallback"
                    ? "回退"
                    : "关闭"}
              </div>
            </div>
          </div>
        </div>

        {config.drill.showBreadcrumb ? (
          <div className="pointer-events-auto absolute right-4 top-4 flex max-w-[56%] flex-wrap items-center justify-end gap-2">
            {drillTrail.map((region, index) => {
              const active = region.adcode === currentRegion?.adcode;
              return (
                <div
                  key={region.adcode}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDrillChange(region.adcode);
                  }}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-[#8fe2a4] bg-[#23422a] text-[#f5fff7]"
                      : "border-white/12 bg-[rgba(9,16,13,0.78)] text-[#d3e7d8] hover:border-[#8fe2a4]/45"
                  }`}
                >
                  {region.name}
                  {index < drillTrail.length - 1 ? " /" : ""}
                </div>
              );
            })}

            {currentRegion?.parentAdcode ? (
              <div
                onClick={(event) => {
                  event.stopPropagation();
                  handleBack();
                }}
                className="cursor-pointer rounded-full border border-white/12 bg-[rgba(9,16,13,0.78)] px-3 py-1.5 text-xs font-semibold text-[#d3e7d8] transition-colors hover:border-[#8fe2a4]/45"
              >
                返回上级
              </div>
            ) : null}
          </div>
        ) : null}

        {childRegions.length > 0 ? (
          <div className="pointer-events-auto absolute inset-x-4 bottom-4">
            <div className="rounded-[24px] border border-white/10 bg-[rgba(9,16,13,0.74)] px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8fe2a4]">
                区域下钻
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {childRegions.map((region) => (
                  <div
                    key={region.adcode}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDrillChange(region.adcode);
                    }}
                    className="cursor-pointer rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-[#f5fff7] transition-colors hover:border-[#8fe2a4]/45 hover:bg-[#23422a]/68"
                  >
                    {region.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {loadState !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-[360px] rounded-[24px] border border-white/10 bg-[rgba(9,16,13,0.84)] px-5 py-4 text-center text-sm text-[#f5fff7] backdrop-blur">
            {loadState === "missing-key" ? (
              <>
                <div className="font-semibold">未配置高德 Key</div>
                <div className="mt-2 text-xs leading-6 text-[#d3e7d8]">
                  请在右侧定制面板填写高德 Web 端 Key，或配置
                  `NEXT_PUBLIC_AMAP_KEY`。
                </div>
              </>
            ) : loadState === "error" ? (
              <>
                <div className="font-semibold">地图引擎加载失败</div>
                <div className="mt-2 text-xs leading-6 text-[#d3e7d8]">
                  {errorMessage ?? "请检查 Key、安全密钥或网络策略后重试。"}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold">高德地图加载中</div>
                <div className="mt-2 text-xs leading-6 text-[#d3e7d8]">
                  正在初始化底图、行政区层和业务热力层。
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
