"use client";

import * as React from "react";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneFlipperNumberConfig,
  createDefaultFlipperNumberConfig,
  type FlipperDirection,
  type FlipperNumberConfig,
} from "./config";

type FlipperNumberPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const directionOptions: SelectOption[] = [
  { label: "向下翻动", value: "down" },
  { label: "向上翻动", value: "up" },
];

function getConfig(widget: Widget): FlipperNumberConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultFlipperNumberConfig();
  }

  return cloneFlipperNumberConfig(widget.config as FlipperNumberConfig);
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

export function FlipperNumberPanel({ widget, onUpdate }: FlipperNumberPanelProps) {
  const config = getConfig(widget);

  const updateConfig = <K extends keyof FlipperNumberConfig>(
    key: K,
    value: FlipperNumberConfig[K],
  ) => {
    const nextConfig = cloneFlipperNumberConfig(config);
    nextConfig[key] = value;
    onUpdate({ config: nextConfig });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="基础数据"
        description="按照 GoView 翻牌器思路，先把核心数值、位数和说明文案直接挂到组件配置。"
        badge="Data"
        contentClassName="space-y-3"
      >
        <FieldShell label="当前数值" description="支持数字或短文本，渲染时会自动补齐位数。">
          <Input
            value={String(config.dataset)}
            onChange={(event) => updateConfig("dataset", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <NumberStepper
          label="展示位数"
          description="位数不足时会自动在左侧补零。"
          value={config.flipperLength}
          min={1}
          max={12}
          step={1}
          unit="位"
          onValueChange={(value) => updateConfig("flipperLength", value)}
        />
        <FieldShell label="顶部标签" description="用于标注这组翻牌数字代表的业务含义。">
          <Input
            value={config.label}
            onChange={(event) => updateConfig("label", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <ToggleSwitch
          label="显示顶部标签"
          description="适合大屏 KPI 区，快速说明这组翻牌器的主题。"
          checked={config.labelVisible}
          onCheckedChange={(checked) => updateConfig("labelVisible", checked)}
        />
      </CollapseSection>

      <CollapseSection
        title="翻牌样式"
        description="直接控制单个卡片的尺寸、间距、圆角和翻牌节奏。"
        badge="Style"
        contentClassName="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper
            label="单卡宽度"
            value={config.flipperWidth}
            min={28}
            max={96}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("flipperWidth", value)}
          />
          <NumberStepper
            label="单卡高度"
            value={config.flipperHeight}
            min={40}
            max={140}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("flipperHeight", value)}
          />
          <NumberStepper
            label="卡片间距"
            value={config.flipperGap}
            min={0}
            max={24}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("flipperGap", value)}
          />
          <NumberStepper
            label="圆角半径"
            value={config.flipperRadius}
            min={0}
            max={32}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("flipperRadius", value)}
          />
          <NumberStepper
            label="翻动时长"
            value={config.flipperSpeed}
            min={120}
            max={1200}
            step={10}
            unit="ms"
            onValueChange={(value) => updateConfig("flipperSpeed", value)}
          />
          <NumberStepper
            label="边框宽度"
            value={config.flipperBorderWidth}
            min={0}
            max={6}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("flipperBorderWidth", value)}
          />
        </div>
        <FieldShell label="翻动方向" description="延续 GoView 的上下翻动设定。">
          <Select
            value={config.flipperType}
            options={directionOptions}
            onChange={(event) => updateConfig("flipperType", event.target.value as FlipperDirection)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>

      <CollapseSection
        title="颜色系统"
        description="统一保持浅底深绿品牌基调，同时允许单卡表面做高亮强化。"
        badge="Tone"
        contentClassName="space-y-3"
      >
        <FieldShell label="卡片底色">
          <Input
            value={config.flipperBgColor}
            onChange={(event) => updateConfig("flipperBgColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="数字颜色">
          <Input
            value={config.flipperTextColor}
            onChange={(event) => updateConfig("flipperTextColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>
    </div>
  );
}
