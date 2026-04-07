"use client";

import type {ReactNode} from "react";
import type {ScreenConfig} from "@/lib/editor-storage";

type ScreenStageProps = {
  screenConfig: ScreenConfig;
  viewportWidth: number;
  viewportHeight: number;
  children: ReactNode;
};

export function ScreenStage({screenConfig, viewportWidth, viewportHeight, children}: ScreenStageProps) {
  const canvasWidth = screenConfig.canvasWidth || 1920;
  const canvasHeight = screenConfig.canvasHeight || 1080;
  const mode = screenConfig.displayMode ?? "contain";
  const align = screenConfig.displayAlign ?? "center";

  const widthScale = viewportWidth / canvasWidth;
  const heightScale = viewportHeight / canvasHeight;
  const scale =
    mode === "fit-width" ? Math.min(1, widthScale) : mode === "actual" ? 1 : Math.min(1, widthScale, heightScale);
  const stageWidth = Math.round(canvasWidth * scale);
  const stageHeight = Math.round(canvasHeight * scale);

  return (
    <div
      className={`absolute inset-0 overflow-auto px-5 ${align === "top" ? "flex items-start justify-center pt-5" : "flex items-center justify-center"}`}
    >
      <div
        className="relative shrink-0"
        style={{
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
        }}
      >
        {/* Keep the outer box at the scaled size so centering/scrolling follow the
            actual visible stage instead of the original 1920px canvas bounds. */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
