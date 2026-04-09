"use client";

import dynamic from "next/dynamic";
import type { IRadarChartSpec } from "@visactor/react-vchart";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultRadarSpec } from "./config";

const VChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.VChart), {
  ssr: false,
});

function getRadarSpec(widget: Widget): IRadarChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultRadarSpec();
  }

  return widget.spec as IRadarChartSpec;
}

export function RadarChartRender({
  widget,
  width,
  height,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const spec = getRadarSpec(widget);

  return (
    <div className="h-full w-full overflow-hidden rounded-[24px] bg-[#fafaf5]">
      <VChart
        spec={spec}
        options={{ mode: "desktop-browser" }}
        className="h-full w-full"
        style={{ width, height }}
      />
    </div>
  );
}
