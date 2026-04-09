"use client";

import dynamic from "next/dynamic";
import type { IBarChartSpec } from "@visactor/react-vchart";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultHorizontalBarSpec } from "./config";

const VChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.VChart), {
  ssr: false,
});

function getHorizontalBarSpec(widget: Widget): IBarChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultHorizontalBarSpec();
  }

  return widget.spec as IBarChartSpec;
}

export function HorizontalBarChartRender({
  widget,
  width,
  height,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const spec = getHorizontalBarSpec(widget);

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
