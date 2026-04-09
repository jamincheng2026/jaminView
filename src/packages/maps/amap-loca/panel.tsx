"use client";

import * as React from "react";

import {
  CollapseSection,
  NumberStepper,
  ToggleSwitch,
} from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneAmapLocaMapConfig,
  createDefaultAmapLocaMapConfig,
  type AmapLocaFeature,
  type AmapLocaLang,
  type AmapLocaMapConfig,
  type AmapLocaTheme,
  type AmapLocaViewMode,
} from "./config";

type AmapLocaMapPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const themeOptions: SelectOption[] = [
  { label: "幻影黑", value: "dark" },
  { label: "标准", value: "normal" },
  { label: "草色青", value: "fresh" },
  { label: "月光银", value: "light" },
  { label: "深海蓝", value: "blue" },
];

const languageOptions: SelectOption[] = [
  { label: "中文", value: "zh_cn" },
  { label: "中英对照", value: "zh_en" },
  { label: "英文", value: "en" },
];

const viewModeOptions: SelectOption[] = [
  { label: "2D", value: "2D" },
  { label: "3D", value: "3D" },
];

const drillLevelOptions: SelectOption[] = [
  { label: "省级停止", value: "province" },
  { label: "城市级停止", value: "city" },
];

const featureLabels: Array<{
  description: string;
  feature: AmapLocaFeature;
  label: string;
}> = [
  { feature: "bg", label: "显示底图", description: "决定是否显示高德底图底色。" },
  { feature: "road", label: "显示道路", description: "保留业务地图最常用的道路层。" },
  { feature: "point", label: "显示标注", description: "显示底图上的 POI 标识。" },
  { feature: "building", label: "显示建筑", description: "在 3D 模式下保留建筑体块。" },
];

function getAmapLocaMapConfig(widget: Widget): AmapLocaMapConfig {
  if (widget.chartFrame !== ChartFrame.CUSTOM) {
    return createDefaultAmapLocaMapConfig();
  }

  return widget.config as AmapLocaMapConfig;
}

function InputField({
  description,
  label,
  onValueChange,
  placeholder,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3">
      <div className="mb-2">
        <div className="text-sm font-semibold text-[#1a1c19]">{label}</div>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p>
        ) : null}
      </div>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </div>
  );
}

function SelectField({
  description,
  label,
  onValueChange,
  options,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3">
      <div className="mb-2">
        <div className="text-sm font-semibold text-[#1a1c19]">{label}</div>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p>
        ) : null}
      </div>
      <Select
        value={value}
        options={options}
        onChange={(event) => onValueChange(event.target.value)}
        className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </div>
  );
}

export function AmapLocaMapPanel({ widget, onUpdate }: AmapLocaMapPanelProps) {
  const config = getAmapLocaMapConfig(widget);

  const regionOptions = React.useMemo<SelectOption[]>(
    () =>
      config.dataset.regions.map((region) => ({
        label: `${region.name} / ${
          region.level === "country"
            ? "全国"
            : region.level === "province"
              ? "省级"
              : "城市"
        }`,
        value: region.adcode,
      })),
    [config.dataset.regions],
  );

  const updateConfig = (mutator: (nextConfig: AmapLocaMapConfig) => void) => {
    const nextConfig = cloneAmapLocaMapConfig(config);
    mutator(nextConfig);
    onUpdate({ config: nextConfig });
  };

  const toggleFeature = (feature: AmapLocaFeature, enabled: boolean) => {
    updateConfig((nextConfig) => {
      const nextFeatures = new Set(nextConfig.map.features);

      if (enabled) {
        nextFeatures.add(feature);
      } else {
        nextFeatures.delete(feature);
      }

      nextConfig.map.features = Array.from(nextFeatures) as AmapLocaFeature[];
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
          高德 Loca
        </div>
        <div className="mt-3 text-lg font-bold text-[#1a1c19]">B 端业务地图骨架</div>
        <p className="mt-2 text-xs leading-5 text-[#727971]">
          这一版先把真实业务地图的主链路接通，重点是行政区下钻、业务热力层和底图风格控制。
        </p>
      </div>

      <CollapseSection
        title="基础底图"
        description="沿用 GoView 高德地图的配置骨架，补齐业务地图最常用的底图参数。"
        badge="Base"
        contentClassName="space-y-3"
      >
        <InputField
          label="高德 Key"
          description="优先读取当前组件配置；若为空，可用 NEXT_PUBLIC_AMAP_KEY 作为默认值。"
          value={config.map.amapKey}
          placeholder="请输入高德 Web 端 Key"
          onValueChange={(value) =>
            updateConfig((nextConfig) => {
              nextConfig.map.amapKey = value;
            })
          }
        />
        <InputField
          label="安全密钥"
          description="如项目启用了高德安全校验，可在这里补充 Security JS Code。"
          value={config.map.securityJsCode}
          placeholder="请输入 Security JS Code"
          onValueChange={(value) =>
            updateConfig((nextConfig) => {
              nextConfig.map.securityJsCode = value;
            })
          }
        />
        <InputField
          label="自定义样式 ID"
          description="填入后会覆盖主题选择，优先使用你在高德控制台配置的样式。"
          value={config.map.customStyleId}
          placeholder="例如：amap://styles/your-style-id"
          onValueChange={(value) =>
            updateConfig((nextConfig) => {
              nextConfig.map.customStyleId = value;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <SelectField
            label="底图主题"
            value={config.map.theme}
            options={themeOptions}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.theme = value as AmapLocaTheme;
              })
            }
          />
          <SelectField
            label="地图语言"
            value={config.map.lang}
            options={languageOptions}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.lang = value as AmapLocaLang;
              })
            }
          />
          <SelectField
            label="地图模式"
            value={config.map.viewMode}
            options={viewModeOptions}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.viewMode = value as AmapLocaViewMode;
              })
            }
          />
          <NumberStepper
            label="俯仰角"
            description="仅 3D 模式生效，决定业务地图的空间倾斜程度。"
            value={config.map.pitch}
            min={0}
            max={83}
            step={1}
            unit="°"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.pitch = value;
              })
            }
          />
          <NumberStepper
            label="中心经度"
            value={config.map.center[0]}
            min={70}
            max={140}
            step={0.0001}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.center[0] = value;
              })
            }
          />
          <NumberStepper
            label="中心纬度"
            value={config.map.center[1]}
            min={10}
            max={55}
            step={0.0001}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.center[1] = value;
              })
            }
          />
          <NumberStepper
            label="初始缩放"
            value={config.map.zoom}
            min={3}
            max={18}
            step={0.1}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.map.zoom = value;
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {featureLabels.map((item) => (
            <ToggleSwitch
              key={item.feature}
              label={item.label}
              description={item.description}
              checked={config.map.features.includes(item.feature)}
              onCheckedChange={(checked) => toggleFeature(item.feature, checked)}
            />
          ))}
        </div>
      </CollapseSection>

      <CollapseSection
        title="区域下钻"
        description="控制省市级路径、根区域和行政区高亮样式。"
        badge="Drill"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="启用区域下钻"
          description="开启后，运行时可在全国、省、市三级之间切换区域视角。"
          checked={config.drill.enabled}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.drill.enabled = checked;
            })
          }
        />
        <ToggleSwitch
          label="显示面包屑"
          description="在地图右上角展示当前钻取路径和返回动作。"
          checked={config.drill.showBreadcrumb}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.drill.showBreadcrumb = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <SelectField
            label="根区域"
            value={config.drill.rootAdcode}
            options={regionOptions}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.drill.rootAdcode = value;
              })
            }
          />
          <SelectField
            label="下钻上限"
            value={config.drill.maxLevel}
            options={drillLevelOptions}
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.drill.maxLevel = value as AmapLocaMapConfig["drill"]["maxLevel"];
              })
            }
          />
          <NumberStepper
            label="区域填充透明度"
            value={config.drill.fillOpacity}
            min={0}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.drill.fillOpacity = value;
              })
            }
          />
          <NumberStepper
            label="边界线宽"
            value={config.drill.strokeWidth}
            min={0.6}
            max={4}
            step={0.1}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.drill.strokeWidth = value;
              })
            }
          />
        </div>
      </CollapseSection>

      <CollapseSection
        title="业务热力"
        description="Loca 热力图层负责表达业务分布密度和热点区域。"
        badge="Heat"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="启用热力图"
          description="关闭后只保留行政区层和业务点，不再叠加热力效果。"
          checked={config.heatmap.visible}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.heatmap.visible = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="热力半径"
            value={config.heatmap.radius}
            min={20}
            max={180}
            step={2}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.heatmap.radius = value;
              })
            }
          />
          <NumberStepper
            label="热力强度"
            value={config.heatmap.intensity}
            min={0}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.heatmap.intensity = value;
              })
            }
          />
          <NumberStepper
            label="热力透明度"
            value={config.heatmap.opacity}
            min={0}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.heatmap.opacity = value;
              })
            }
          />
          <NumberStepper
            label="模糊范围"
            value={config.heatmap.blur}
            min={0}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.heatmap.blur = value;
              })
            }
          />
        </div>
      </CollapseSection>

      <CollapseSection
        title="业务点位"
        description="点位层是热力图之外的业务锚点，用来辅助运营人员定位重点城市。"
        badge="Point"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示业务点"
          description="在热力之外保留一层轻量的业务节点，提升地图可读性。"
          checked={config.pointLayer.visible}
          onCheckedChange={(checked) =>
            updateConfig((nextConfig) => {
              nextConfig.pointLayer.visible = checked;
            })
          }
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <NumberStepper
            label="点位半径"
            value={config.pointLayer.radius}
            min={3}
            max={24}
            step={1}
            unit="px"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.pointLayer.radius = value;
              })
            }
          />
          <NumberStepper
            label="点位透明度"
            value={config.pointLayer.opacity}
            min={10}
            max={100}
            step={1}
            unit="%"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.pointLayer.opacity = value;
              })
            }
          />
          <InputField
            label="点位填充色"
            value={config.pointLayer.fillColor}
            placeholder="#70d48a"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.pointLayer.fillColor = value;
              })
            }
          />
          <InputField
            label="点位描边色"
            value={config.pointLayer.strokeColor}
            placeholder="#f5fff7"
            onValueChange={(value) =>
              updateConfig((nextConfig) => {
                nextConfig.pointLayer.strokeColor = value;
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#d7d8d1] bg-[#fafaf5] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#23422a]">
              区域节点
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1a1c19]">
              {config.dataset.regions.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[#d7d8d1] bg-[#fafaf5] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#23422a]">
              业务点位
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1a1c19]">
              {config.dataset.businessPoints.length}
            </div>
          </div>
        </div>
      </CollapseSection>
    </div>
  );
}
