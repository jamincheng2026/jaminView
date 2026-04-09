"use client";

import dynamic from "next/dynamic";
import type { IPieChartSpec } from "@visactor/react-vchart";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultPieSpec } from "./config";

const VChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.VChart), {
  ssr: false,
});

function getPieSpec(widget: Widget): IPieChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultPieSpec();
  }

  return widget.spec as IPieChartSpec;
}

export function PieChartRender({
  widget,
  width,
  height,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const spec = getPieSpec(widget);

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
