"use client";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneChinaGlMapConfig,
  createDefaultChinaGlMapConfig,
  type ChinaGlMapConfig,
  type ChinaGlTheme,
} from "./config";

type ChinaGlMapPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

function getChinaGlMapConfig(widget: Widget): ChinaGlMapConfig {
  if (widget.chartFrame !== ChartFrame.CUSTOM) {
    return createDefaultChinaGlMapConfig();
  }

  return widget.config as unknown as ChinaGlMapConfig;
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onValueChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3">
      <div className="mb-2 text-sm font-semibold text-[#1a1c19]">{label}</div>
      <Select
        value={value}
        options={options}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </div>
  );
}

export function ChinaGlMapPanel({ widget, onUpdate }: ChinaGlMapPanelProps) {
  const config = getChinaGlMapConfig(widget);

  const updateConfig = (mutator: (nextConfig: ChinaGlMapConfig) => void) => {
    const nextConfig = cloneChinaGlMapConfig(config);
    mutator(nextConfig);
    onUpdate({ config: nextConfig });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
          中国 3D 地图
        </div>
        <div className="mt-3 text-lg font-bold text-[#1a1c19]">ECharts GL 科技底图</div>
        <p className="mt-2 text-xs leading-5 text-[#727971]">
          这一版先把科技中国地图的主骨架接通，重点是飞行线、3D 柱、散点和发光层。
        </p>
      </div>

      <CollapseSection
        title="视角与底图"
        description="统一控制主题、透视角度和底图表现。"
        badge="View"
        contentClassName="space-y-3"
      >
        <SelectField
          label="地图主题"
          value={config.theme}
          options={[
            { label: "墨绿科技", value: "emerald" },
            { label: "深海蓝光", value: "cobalt" },
            { label: "琥珀告警", value: "amber" },
          ]}
          onValueChange={(value) =>
            updateConfig((nextConfig) => {
              nextConfig.theme = value as ChinaGlTheme;
            })
          }
        />
        <ToggleSwitch
          label="显示省份标签"
          description="控制省份名称标签的显隐。"
          checked={config.map.showLabels}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.map.showLabels = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="俯仰角"
            description="决定地图抬升后的倾斜程度。"
            value={config.view.alpha}
            min={15}
            max={75}
            step={1}
            unit="°"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.view.alpha = value;
              })
            }
          />
          <NumberStepper
            label="旋转角"
            description="控制视角左右偏转。"
            value={config.view.beta}
            min={-45}
            max={45}
            step={1}
            unit="°"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.view.beta = value;
              })
            }
          />
          <NumberStepper
            label="镜头距离"
            description="数值越大，镜头越远。"
            value={config.view.distance}
            min={60}
            max={220}
            step={2}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.view.distance = value;
              })
            }
          />
          <NumberStepper
            label="陆地区域透明度"
            description="控制省域面颜色的整体透明度。"
            value={config.map.landOpacity}
            min={30}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.landOpacity = value;
              })
            }
          />
        </div>
      </CollapseSection>

      <CollapseSection
        title="飞行线"
        description="重点控制连线强度和流光速度。"
        badge="Lines"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="启用飞行线"
          description="关闭后会只保留底图、柱状和散点层。"
          checked={config.flight.visible}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.flight.visible = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="线宽"
            value={config.flight.width}
            min={1}
            max={8}
            step={1}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.flight.width = value;
              })
            }
          />
          <NumberStepper
            label="拖尾宽度"
            value={config.flight.trailWidth}
            min={1}
            max={12}
            step={1}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.flight.trailWidth = value;
              })
            }
          />
          <NumberStepper
            label="拖尾长度"
            value={config.flight.trailLength}
            min={0.05}
            max={0.9}
            step={0.05}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.flight.trailLength = value;
              })
            }
          />
          <NumberStepper
            label="流光速度"
            value={config.flight.speed}
            min={4}
            max={60}
            step={2}
            unit="px/s"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.flight.speed = value;
              })
            }
          />
        </div>
      </CollapseSection>

      <CollapseSection
        title="柱状与散点"
        description="控制城市能级柱和地面节点散点。"
        badge="Layer"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="启用 3D 柱"
          description="展示重点城市的能级高低。"
          checked={config.bar.visible}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.bar.visible = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="柱体尺寸"
            value={config.bar.size}
            min={0.5}
            max={4}
            step={0.1}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.bar.size = value;
              })
            }
          />
          <NumberStepper
            label="柱体透明度"
            value={config.bar.opacity}
            min={20}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.bar.opacity = value;
              })
            }
          />
        </div>

        <ToggleSwitch
          label="启用散点节点"
          description="控制节点层与地面标签显隐。"
          checked={config.scatterLayer.visible}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.scatterLayer.visible = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="散点尺寸"
            value={config.scatterLayer.symbolSize}
            min={4}
            max={24}
            step={1}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.scatterLayer.symbolSize = value;
              })
            }
          />
          <ToggleSwitch
            label="显示节点标签"
            description="控制散点的城市名标签显隐。"
            checked={config.scatterLayer.showLabel}
            onCheckedChange={(checked) =>
              updateConfig((nextConfig) => {
                nextConfig.scatterLayer.showLabel = checked;
              })
            }
          />
        </div>
      </CollapseSection>

      <CollapseSection
        title="发光层"
        description="控制后处理 Bloom 发光强度。"
        badge="Glow"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="启用发光层"
          description="关闭后地图会回到更克制的平面光照效果。"
          checked={config.glow.enabled}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.glow.enabled = checked;
            })
          }
        />
        <NumberStepper
          label="发光强度"
          description="数值越高，Bloom 越明显。"
          value={config.glow.intensity}
          min={0}
          max={100}
          step={1}
          unit="%"
          onValueChange={(value) =>
            updateConfig((nextConfig) => {
              nextConfig.glow.intensity = value;
            })
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#d7d8d1] bg-[#fafaf5] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#23422a]">
              飞行线
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1a1c19]">
              {config.dataset.flightData.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[#d7d8d1] bg-[#fafaf5] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#23422a]">
              柱状点
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1a1c19]">
              {config.dataset.barData.length}
            </div>
          </div>
        </div>
      </CollapseSection>
    </div>
  );
}
