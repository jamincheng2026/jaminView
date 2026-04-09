"use client";

import * as React from "react";

import { CollapseSection, ToggleSwitch } from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneClockSystemConfig,
  createDefaultClockSystemConfig,
  type ClockSystemConfig,
} from "./config";

type ClockSystemPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

function getConfig(widget: Widget): ClockSystemConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultClockSystemConfig();
  }

  return cloneClockSystemConfig(widget.config as ClockSystemConfig);
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

export function ClockSystemPanel({ widget, onUpdate }: ClockSystemPanelProps) {
  const config = getConfig(widget);

  const updateConfig = <K extends keyof ClockSystemConfig>(key: K, value: ClockSystemConfig[K]) => {
    const nextConfig = cloneClockSystemConfig(config);
    nextConfig[key] = value;
    onUpdate({ config: nextConfig });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="显示结构"
        description="把指针钟面和数字时间合在同一块物料里，适配大屏头部时间区。"
        badge="Layout"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示模拟钟面"
          description="左侧保留 GoView Clock 的指针式表达。"
          checked={config.showAnalog}
          onCheckedChange={(checked) => updateConfig("showAnalog", checked)}
        />
        <ToggleSwitch
          label="显示数字时间"
          description="右侧显示时分秒和日期说明，便于远距离识别。"
          checked={config.showDigital}
          onCheckedChange={(checked) => updateConfig("showDigital", checked)}
        />
        <ToggleSwitch
          label="显示日期"
          checked={config.showDate}
          onCheckedChange={(checked) => updateConfig("showDate", checked)}
        />
        <ToggleSwitch
          label="显示秒钟"
          checked={config.showSeconds}
          onCheckedChange={(checked) => updateConfig("showSeconds", checked)}
        />
      </CollapseSection>

      <CollapseSection
        title="时区与文案"
        description="支持按业务区服展示指定时区，默认使用上海时区。"
        badge="Time"
        contentClassName="space-y-3"
      >
        <FieldShell label="时区标签">
          <Input
            value={config.label}
            onChange={(event) => updateConfig("label", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="IANA 时区">
          <Input
            value={config.timeZone}
            onChange={(event) => updateConfig("timeZone", event.target.value)}
            placeholder="Asia/Shanghai"
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>

      <CollapseSection
        title="配色系统"
        description="用品牌深绿做主色，钟面、指针和数字区都可以分开调色。"
        badge="Tone"
        contentClassName="space-y-3"
      >
        <FieldShell label="钟面底色">
          <Input
            value={config.faceColor}
            onChange={(event) => updateConfig("faceColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="钟面边框">
          <Input
            value={config.faceBorderColor}
            onChange={(event) => updateConfig("faceBorderColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="指针主色">
          <Input
            value={config.handColor}
            onChange={(event) => updateConfig("handColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="秒针颜色">
          <Input
            value={config.secondHandColor}
            onChange={(event) => updateConfig("secondHandColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="刻度颜色">
          <Input
            value={config.tickColor}
            onChange={(event) => updateConfig("tickColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="数字区文字">
          <Input
            value={config.textColor}
            onChange={(event) => updateConfig("textColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="数字区底色">
          <Input
            value={config.panelColor}
            onChange={(event) => updateConfig("panelColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="数字区边框">
          <Input
            value={config.panelBorderColor}
            onChange={(event) => updateConfig("panelBorderColor", event.target.value)}
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
