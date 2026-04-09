"use client";

import dynamic from "next/dynamic";
import type { ILineChartSpec } from "@visactor/react-vchart";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultLineSpec } from "./config";

const VChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.VChart), {
  ssr: false,
});

function getLineSpec(widget: Widget): ILineChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultLineSpec();
  }

  return widget.spec as ILineChartSpec;
}

export function LineChartRender({
  widget,
  width,
  height,
}: {
  widget: Widget;
  width: number;
  height: number;
}) {
  const spec = getLineSpec(widget);

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
