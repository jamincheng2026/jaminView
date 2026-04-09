"use client";

import * as React from "react";

import { resolveEditorV2CanvasFilterStyle } from "@/lib/editor-v2-canvas-filters";
import { registry } from "@/packages/registry";
import { type Widget, type WidgetAnimationPreset } from "@/packages/types";
import { type EditorV2CanvasFilters } from "@/lib/editor-v2-canvas-filters";

type EditorV2CanvasStageProps = {
  widgets: Widget[];
  canvas: {
    filters?: EditorV2CanvasFilters;
    width: number;
    height: number;
    showSafeArea?: boolean;
  };
  activeWidgetIds?: string[];
  onWidgetActivate?: (widget: Widget) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function resolveWidgetAnimation(animations: WidgetAnimationPreset[]) {
  const preset = animations[0];

  switch (preset) {
    case "fadeIn":
      return "jv-widget-fade-in 720ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "riseIn":
      return "jv-widget-rise-in 780ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "zoomIn":
      return "jv-widget-zoom-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "pulse":
      return "jv-widget-pulse 2.8s ease-in-out infinite";
    case "float":
      return "jv-widget-float 3.6s ease-in-out infinite";
    case "breathe":
      return "jv-widget-breathe 4.2s ease-in-out infinite";
    default:
      return undefined;
  }
}

export function EditorV2CanvasStage({
  widgets,
  canvas,
  activeWidgetIds = [],
  onWidgetActivate,
  emptyTitle = "暂无组件",
  emptyDescription = "当前画布还没有组件，请先返回编辑器完成配置。",
}: EditorV2CanvasStageProps) {
  const orderedWidgets = React.useMemo(
    () => [...widgets].sort((left, right) => left.attr.zIndex - right.attr.zIndex),
    [widgets],
  );
  const canvasFilterStyle = React.useMemo(
    () => resolveEditorV2CanvasFilterStyle(canvas.filters),
    [canvas.filters],
  );
  const visibleWidgets = React.useMemo(
    () => orderedWidgets.filter((widget) => !widget.status.hidden),
    [orderedWidgets],
  );

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border border-[#d7d8d1] bg-white shadow-[0_28px_70px_rgba(26,28,25,0.12)]"
      style={{ width: canvas.width, height: canvas.height, ...canvasFilterStyle }}
    >
      {canvas.showSafeArea ? (
        <div className="pointer-events-none absolute inset-[88px] rounded-[28px] border border-dashed border-[#23422a]/25" />
      ) : null}

      <div className="absolute left-8 top-8 rounded-full border border-[#d7d8d1] bg-[#fafaf5] px-3 py-1.5 text-[12px] font-semibold text-[#23422a] shadow-sm">
        {canvas.width} x {canvas.height}
      </div>

      {visibleWidgets.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center px-8">
          <div className="max-w-[560px] rounded-[34px] border border-[#d7d8d1] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,249,243,0.92))] px-10 py-12 text-center shadow-[0_18px_40px_rgba(26,28,25,0.06)]">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#23422a]">
              JaminView V2
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#1a1c19]">
              {emptyTitle}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#727971]">{emptyDescription}</p>
          </div>
        </div>
      ) : null}

      {visibleWidgets.map((widget) => {
        const pkg = registry.getPackage(widget.registrationKey);
        if (!pkg) {
          return null;
        }

        const active = activeWidgetIds.includes(widget.id);
        const clickable = Boolean(onWidgetActivate && widget.events.action && widget.events.action !== "none");

        return (
          <button
            key={widget.id}
            type="button"
            className={`absolute overflow-hidden rounded-[24px] border bg-white text-left shadow-[0_12px_30px_rgba(26,28,25,0.08)] transition-shadow ${
              active
                ? "border-[#23422a] ring-2 ring-[#23422a]/25"
                : "border-transparent"
            } ${clickable ? "cursor-pointer hover:shadow-[0_16px_34px_rgba(26,28,25,0.12)]" : "cursor-default"}`}
            style={{
              left: widget.attr.x,
              top: widget.attr.y,
              width: widget.attr.w,
              height: widget.attr.h,
              zIndex: widget.attr.zIndex,
              opacity: widget.styles.opacity,
              animation: resolveWidgetAnimation(widget.styles.animations),
            }}
            onClick={() => onWidgetActivate?.(widget)}
          >
            <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-[#d7d8d1] bg-white/92 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#23422a] shadow-sm">
              {pkg.registration.titleZh}
            </div>
            <pkg.RenderComponent widget={widget} width={widget.attr.w} height={widget.attr.h} />
          </button>
        );
      })}
    </div>
  );
}
