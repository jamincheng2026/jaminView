"use client";

import * as React from "react";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultImageFrameConfig, type ImageFrameConfig } from "./config";

type ImageFrameRenderProps = {
  widget: Widget;
  width: number;
  height: number;
};

function getConfig(widget: Widget): ImageFrameConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultImageFrameConfig();
  }

  return widget.config as ImageFrameConfig;
}

function getBackgroundSize(fit: ImageFrameConfig["fit"]) {
  if (fit === "fill") {
    return "100% 100%";
  }

  return fit;
}

export function ImageFrameRender({ widget, width, height }: ImageFrameRenderProps) {
  const config = getConfig(widget);
  const overlayOpacity = Math.min(Math.max(config.overlayOpacity / 100, 0), 1);
  const captionMaxWidth = Math.max(Math.round(width * 0.72), 180);
  const captionTopPadding = Math.max(Math.round(height * 0.18), 48);
  const frameShadow =
    config.frameStyle === "glow"
      ? `0 0 0 1px ${config.frameColor}, 0 0 38px ${config.accentColor}55`
      : config.frameStyle === "soft"
        ? "0 18px 38px rgba(26,28,25,0.12)"
        : `0 0 0 1px ${config.frameColor}, inset 0 0 0 1px ${config.accentColor}55`;

  return (
    <div className="h-full w-full p-3">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: `${config.borderRadius}px`,
          border: `1px solid ${config.frameColor}`,
          boxShadow: frameShadow,
          backgroundColor: "#f4f6f0",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: config.imageUrl ? `url("${config.imageUrl}")` : undefined,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: getBackgroundSize(config.fit),
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(26,28,25,${overlayOpacity * 0.15}) 0%, rgba(26,28,25,${overlayOpacity}) 100%)`,
          }}
        />

        {config.frameStyle === "technical" ? (
          <>
            <div className="pointer-events-none absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            <div className="pointer-events-none absolute inset-x-6 bottom-5 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="jv-image-frame-scan pointer-events-none absolute inset-x-10 top-[18%] h-px bg-gradient-to-r from-transparent via-white/75 to-transparent" />
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2" style={{ borderColor: config.accentColor }} />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2" style={{ borderColor: config.accentColor }} />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2" style={{ borderColor: config.accentColor }} />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2" style={{ borderColor: config.accentColor }} />
          </>
        ) : null}

        <div className="absolute right-5 top-5 rounded-full border border-white/30 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
          {config.meta}
        </div>

        {config.captionVisible ? (
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/28 to-transparent px-6 pb-5 text-white"
            style={{ paddingTop: `${captionTopPadding}px` }}
          >
            <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#d8f0df" }}>
              Image Frame
            </div>
            <div className="mt-2 text-lg font-bold leading-tight">{config.caption}</div>
            <div className="mt-2 text-xs leading-6 text-white/82" style={{ maxWidth: `${captionMaxWidth}px` }}>
              静态图片框适合承载品牌陈列图、运营播报画面和示意海报。
            </div>
          </div>
        ) : null}

        {!config.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-medium text-[#727971]">
            当前没有设置图片地址，请在右侧面板输入素材链接或内联图片地址。
          </div>
        ) : null}
      </div>
    </div>
  );
}
