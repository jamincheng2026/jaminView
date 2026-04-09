"use client";

import * as React from "react";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultFlipperNumberConfig, type FlipperNumberConfig } from "./config";

type FlipperNumberRenderProps = {
  widget: Widget;
  width: number;
  height: number;
};

function getConfig(widget: Widget): FlipperNumberConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultFlipperNumberConfig();
  }

  return widget.config as FlipperNumberConfig;
}

function getDigits(config: FlipperNumberConfig) {
  const value = String(config.dataset ?? "");
  return value.padStart(config.flipperLength, "0").slice(-config.flipperLength).split("");
}

export function FlipperNumberRender({ widget, width, height }: FlipperNumberRenderProps) {
  const config = getConfig(widget);
  const digits = React.useMemo(() => getDigits(config), [config]);
  const digitFontSize = Math.max(18, Math.round(config.flipperHeight * 0.56));
  const shellPaddingX = Math.max(18, Math.round(width * 0.05));
  const shellPaddingY = Math.max(18, Math.round(height * 0.12));

  return (
    <div
      className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px]"
      style={{
        padding: `${shellPaddingY}px ${shellPaddingX}px`,
        background:
          "radial-gradient(circle at top, rgba(35,66,42,0.18), transparent 42%), linear-gradient(180deg, #f7f8f2 0%, #eef2ea 100%)",
      }}
    >
      {config.labelVisible ? (
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#23422a]">
            {config.label}
          </div>
          <div className="rounded-full border border-[#d7d8d1] bg-white/92 px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#727971]">
            Flipper
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-1 items-center justify-center"
        style={{ gap: `${config.flipperGap}px` }}
      >
        {digits.map((digit, index) => (
          <div
            key={`${index}-${digit}`}
            className="relative flex shrink-0 items-center justify-center overflow-hidden border font-black text-white shadow-[0_14px_28px_rgba(26,28,25,0.18)]"
            style={{
              width: `${config.flipperWidth}px`,
              height: `${config.flipperHeight}px`,
              borderRadius: `${config.flipperRadius}px`,
              borderWidth: `${config.flipperBorderWidth}px`,
              borderColor: "rgba(245,255,247,0.12)",
              color: config.flipperTextColor,
              background: `linear-gradient(180deg, ${config.flipperBgColor} 0%, rgba(26,28,25,0.96) 100%)`,
              animation: `${config.flipperType === "up" ? "jv-flipper-up" : "jv-flipper-down"} ${config.flipperSpeed}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/12" />
            <div className="pointer-events-none absolute inset-x-4 bottom-3 h-3 rounded-full bg-[#8ce4a4]/20 blur-md" />
            <span
              className="relative"
              style={{
                fontSize: `${digitFontSize}px`,
                lineHeight: 1,
                textShadow: "0 0 18px rgba(140,228,164,0.22)",
              }}
            >
              {digit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
