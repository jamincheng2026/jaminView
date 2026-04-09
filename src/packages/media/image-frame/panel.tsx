"use client";

import * as React from "react";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneImageFrameConfig,
  createDefaultImageFrameConfig,
  type ImageFrameConfig,
  type ImageFrameFit,
  type ImageFrameStyle,
} from "./config";

type ImageFramePanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const fitOptions: SelectOption[] = [
  { label: "裁切铺满", value: "cover" },
  { label: "完整显示", value: "contain" },
  { label: "拉伸填充", value: "fill" },
];

const frameStyleOptions: SelectOption[] = [
  { label: "科技边框", value: "technical" },
  { label: "柔和相框", value: "soft" },
  { label: "发光边框", value: "glow" },
];

function getConfig(widget: Widget): ImageFrameConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultImageFrameConfig();
  }

  return cloneImageFrameConfig(widget.config as ImageFrameConfig);
}

function FieldShell({
  children,
  description,
  label,
}: {
  children: React.ReactNode;
  description?: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d7d8d1] bg-white/80 px-3.5 py-3">
      <div className="mb-2">
        <div className="text-sm font-semibold text-[#1a1c19]">{label}</div>
        {description ? <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function ImageFramePanel({ widget, onUpdate }: ImageFramePanelProps) {
  const config = getConfig(widget);

  const updateConfig = <K extends keyof ImageFrameConfig>(key: K, value: ImageFrameConfig[K]) => {
    const nextConfig = cloneImageFrameConfig(config);
    nextConfig[key] = value;
    onUpdate({ config: nextConfig });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="图片内容"
        description="对照 GoView 图片组件，先把图片地址、标题说明和素材标签开放出来。"
        badge="Media"
        contentClassName="space-y-3"
      >
        <FieldShell label="图片地址" description="支持在线地址或 data:image 内联图片。">
          <Input
            value={config.imageUrl}
            onChange={(event) => updateConfig("imageUrl", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="说明文案">
          <Input
            value={config.caption}
            onChange={(event) => updateConfig("caption", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="角标标签">
          <Input
            value={config.meta}
            onChange={(event) => updateConfig("meta", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <ToggleSwitch
          label="显示底部文案"
          checked={config.captionVisible}
          onCheckedChange={(checked) => updateConfig("captionVisible", checked)}
        />
      </CollapseSection>

      <CollapseSection
        title="框体表现"
        description="把适配方式、圆角和边框风格独立出来，适合做品牌陈列位和说明图卡。"
        badge="Frame"
        contentClassName="space-y-3"
      >
        <FieldShell label="图片适配">
          <Select
            value={config.fit}
            options={fitOptions}
            onChange={(event) => updateConfig("fit", event.target.value as ImageFrameFit)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="边框风格">
          <Select
            value={config.frameStyle}
            options={frameStyleOptions}
            onChange={(event) => updateConfig("frameStyle", event.target.value as ImageFrameStyle)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <NumberStepper
          label="圆角半径"
          value={config.borderRadius}
          min={0}
          max={36}
          step={1}
          unit="px"
          onValueChange={(value) => updateConfig("borderRadius", value)}
        />
        <NumberStepper
          label="遮罩强度"
          value={config.overlayOpacity}
          min={0}
          max={90}
          step={1}
          unit="%"
          onValueChange={(value) => updateConfig("overlayOpacity", value)}
        />
      </CollapseSection>

      <CollapseSection
        title="配色样式"
        description="统一受品牌色约束，但允许相框边缘和发光颜色做差异化。"
        badge="Tone"
        contentClassName="space-y-3"
      >
        <FieldShell label="主框颜色">
          <Input
            value={config.frameColor}
            onChange={(event) => updateConfig("frameColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="强调色">
          <Input
            value={config.accentColor}
            onChange={(event) => updateConfig("accentColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>
    </div>
  );
}
