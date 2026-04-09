"use client";

import * as React from "react";
import type { ECharts } from "echarts";
import type * as EChartsModule from "echarts";

import chinaGeoJson from "../../../../reference/go-view/src/packages/components/Charts/Maps/MapBase/mapGeojson/china.json";
import { ChartFrame, type Widget } from "@/packages/types";

import {
  createDefaultChinaGlMapConfig,
  type ChinaGlMapConfig,
  type ChinaGlTheme,
} from "./config";

type EChartsModuleType = typeof EChartsModule;
type RegisterMapInput = Parameters<EChartsModuleType["registerMap"]>[1];
type SetOptionInput = Parameters<ECharts["setOption"]>[0];

type ThemeTokens = {
  areaColor: string;
  areaHighlight: string;
  areaRamp: [string, string];
  borderColor: string;
  barColor: string;
  scatterColor: string;
  flightColor: string;
  labelColor: string;
  tooltipBorder: string;
};

const CHINA_GL_MAP_NAME = "jaminview-china-gl";

const CHINA_GL_MAP_SOURCE = {
  geoJSON: chinaGeoJson,
  specialAreas: {},
} as unknown as RegisterMapInput;

function getChinaGlMapConfig(widget: Widget): ChinaGlMapConfig {
  if (widget.chartFrame !== ChartFrame.CUSTOM) {
    return createDefaultChinaGlMapConfig();
  }

  return widget.config as unknown as ChinaGlMapConfig;
}

function getThemeTokens(theme: ChinaGlTheme): ThemeTokens {
  switch (theme) {
    case "cobalt":
      return {
        areaColor: "rgba(47, 99, 180, 0.72)",
        areaHighlight: "rgba(85, 170, 255, 0.92)",
        areaRamp: ["#183a68", "#67c6ff"],
        borderColor: "#94dbff",
        barColor: "#7fd4ff",
        scatterColor: "#d7f3ff",
        flightColor: "#7de2ff",
        labelColor: "#f3fbff",
        tooltipBorder: "rgba(125, 226, 255, 0.42)",
      };
    case "amber":
      return {
        areaColor: "rgba(164, 97, 25, 0.72)",
        areaHighlight: "rgba(255, 188, 94, 0.92)",
        areaRamp: ["#583411", "#ffbc5e"],
        borderColor: "#ffd084",
        barColor: "#ffbc5e",
        scatterColor: "#fff1c9",
        flightColor: "#ffd47d",
        labelColor: "#fff8e7",
        tooltipBorder: "rgba(255, 208, 132, 0.42)",
      };
    case "emerald":
    default:
      return {
        areaColor: "rgba(35, 66, 42, 0.76)",
        areaHighlight: "rgba(111, 177, 122, 0.9)",
        areaRamp: ["#17301d", "#79d28a"],
        borderColor: "#98ecaf",
        barColor: "#70d48a",
        scatterColor: "#e8fff0",
        flightColor: "#7ce79b",
        labelColor: "#f5fff7",
        tooltipBorder: "rgba(124, 231, 155, 0.4)",
      };
  }
}

function buildChinaGlMapOption(config: ChinaGlMapConfig): SetOptionInput {
  const theme = getThemeTokens(config.theme);
  const provinceMax = Math.max(
    ...config.dataset.provinceData.map((item) => item.value),
    100,
  );

  const series: Array<Record<string, unknown>> = [
    {
      type: "map3D",
      map: CHINA_GL_MAP_NAME,
      coordinateSystem: "geo3D",
      shading: "lambert",
      silent: true,
      data: config.dataset.provinceData,
      label: {
        show: false,
      },
      itemStyle: {
        borderColor: theme.borderColor,
        borderWidth: config.map.borderWidth,
        opacity: config.map.landOpacity / 100,
      },
      emphasis: {
        label: {
          show: config.map.showLabels,
          color: "#fafaf5",
        },
        itemStyle: {
          color: theme.areaHighlight,
          opacity: Math.min(1, config.map.landOpacity / 100 + 0.08),
        },
      },
    },
  ];

  if (config.bar.visible) {
    series.push({
      type: "bar3D",
      coordinateSystem: "geo3D",
      shading: "lambert",
      bevelSize: config.bar.bevelSize,
      barSize: config.bar.size,
      minHeight: 1,
      silent: true,
      data: config.dataset.barData.map((item) => ({
        name: item.name,
        value: [item.coord[0], item.coord[1], item.value],
      })),
      itemStyle: {
        color: theme.barColor,
        opacity: config.bar.opacity / 100,
      },
    });
  }

  if (config.scatterLayer.visible) {
    series.push({
      type: "scatter3D",
      coordinateSystem: "geo3D",
      blendMode: "lighter",
      symbol: "circle",
      symbolSize: config.scatterLayer.symbolSize,
      data: config.dataset.scatterData.map((item) => ({
        name: item.name,
        value: [item.coord[0], item.coord[1], item.value],
      })),
      itemStyle: {
        color: theme.scatterColor,
        opacity: 0.92,
      },
      label: {
        show: config.scatterLayer.showLabel,
        formatter: "{b}",
        distance: 6,
        textStyle: {
          color: theme.labelColor,
          fontSize: 10,
          backgroundColor: "rgba(26,28,25,0.45)",
          borderRadius: 999,
          padding: [4, 8],
        },
      },
    });
  }

  if (config.flight.visible) {
    series.push({
      type: "lines3D",
      coordinateSystem: "geo3D",
      blendMode: "lighter",
      data: config.dataset.flightData.map((item) => ({
        fromName: item.fromName,
        toName: item.toName,
        coords: item.coords,
        value: item.value,
      })),
      effect: {
        show: true,
        trailWidth: config.flight.trailWidth,
        trailLength: config.flight.trailLength,
        trailOpacity: 0.9,
        constantSpeed: config.flight.speed,
      },
      lineStyle: {
        width: config.flight.width,
        color: theme.flightColor,
        opacity: config.flight.opacity / 100,
      },
    });
  }

  return {
    backgroundColor: "transparent",
    tooltip: {
      show: true,
      backgroundColor: "rgba(11, 16, 14, 0.82)",
      borderColor: theme.tooltipBorder,
      textStyle: {
        color: "#fafaf5",
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: provinceMax,
      calculable: false,
      inRange: {
        color: theme.areaRamp,
      },
    },
    geo3D: {
      map: CHINA_GL_MAP_NAME,
      regionHeight: config.map.regionHeight,
      shading: "lambert",
      silent: true,
      roam: false,
      itemStyle: {
        color: theme.areaColor,
        borderColor: theme.borderColor,
        borderWidth: config.map.borderWidth,
        opacity: config.map.landOpacity / 100,
      },
      label: {
        show: config.map.showLabels,
        color: theme.labelColor,
        fontSize: 10,
      },
      emphasis: {
        label: {
          color: "#fafaf5",
        },
        itemStyle: {
          color: theme.areaHighlight,
        },
      },
      light: {
        main: {
          intensity: 1.25,
          shadow: true,
          alpha: 40,
          beta: 10,
        },
        ambient: {
          intensity: 0.45,
        },
      },
      viewControl: {
        projection: "perspective",
        autoRotate: false,
        alpha: config.view.alpha,
        beta: config.view.beta,
        distance: config.view.distance,
        minDistance: 60,
        maxDistance: 220,
        panSensitivity: 0,
        zoomSensitivity: 1,
        rotateSensitivity: 1,
      },
      postEffect: {
        enable: config.glow.enabled,
        bloom: {
          enable: config.glow.enabled,
          bloomIntensity: config.glow.intensity / 100,
        },
      },
      groundPlane: {
        show: false,
      },
      environment: "rgba(0,0,0,0)",
    },
    series,
  } as unknown as SetOptionInput;
}

export function ChinaGlMapRender({
  widget,
  width,
  height,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<ECharts | null>(null);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">("loading");

  const config = React.useMemo(() => getChinaGlMapConfig(widget), [widget]);

  React.useEffect(() => {
    let cancelled = false;

    const mountChart = async () => {
      try {
        const echartsModule = (await import("echarts")) as EChartsModuleType;
        await import("echarts-gl");

        if (cancelled || !hostRef.current) {
          return;
        }

        if (!echartsModule.getMap(CHINA_GL_MAP_NAME)) {
          echartsModule.registerMap(CHINA_GL_MAP_NAME, CHINA_GL_MAP_SOURCE);
        }

        const chart =
          chartRef.current ??
          echartsModule.getInstanceByDom(hostRef.current) ??
          echartsModule.init(hostRef.current, undefined, {
            renderer: "canvas",
          });

        chartRef.current = chart;
        chart.resize({ width, height });
        chart.setOption(buildChinaGlMapOption(config), true);
        setLoadState("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("中国 3D 科技地图加载失败", error);
          setLoadState("error");
        }
      }
    };

    void mountChart();

    return () => {
      cancelled = true;
    };
  }, [config, height, width]);

  React.useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(45,88,56,0.2),transparent_28%),linear-gradient(180deg,#08110d_0%,#0d1511_100%)]">
      <div ref={hostRef} className="h-full w-full" />
      {loadState !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-[rgba(9,16,13,0.82)] px-4 py-3 text-sm text-[#e9f8ed] backdrop-blur">
            {loadState === "error" ? "地图引擎加载失败" : "地图引擎加载中"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
