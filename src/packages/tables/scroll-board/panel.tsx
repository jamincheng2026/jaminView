"use client";

import * as React from "react";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import {
  cloneScrollBoardConfig,
  createDefaultScrollBoardConfig,
  type ScrollBoardAlign,
  type ScrollBoardCarousel,
  type ScrollBoardCell,
  type ScrollBoardConfig,
} from "./config";

type ScrollBoardPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const carouselOptions: SelectOption[] = [
  { label: "逐行轮播", value: "single" },
  { label: "整页轮播", value: "page" },
];

const alignOptions: SelectOption[] = [
  { label: "左对齐", value: "left" },
  { label: "居中", value: "center" },
  { label: "右对齐", value: "right" },
];

function getConfig(widget: Widget): ScrollBoardConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultScrollBoardConfig();
  }

  return cloneScrollBoardConfig(widget.config as ScrollBoardConfig);
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

function isCellArray(value: unknown): value is ScrollBoardCell[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" || typeof item === "number");
}

function isRowsShape(value: unknown): value is ScrollBoardCell[][] {
  return Array.isArray(value) && value.every((row) => isCellArray(row));
}

export function ScrollBoardPanel({ widget, onUpdate }: ScrollBoardPanelProps) {
  const config = getConfig(widget);
  const [rowsDraft, setRowsDraft] = React.useState(() =>
    JSON.stringify(config.dataset.rows, null, 2),
  );
  const [rowsError, setRowsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRowsDraft(JSON.stringify(config.dataset.rows, null, 2));
    setRowsError(null);
  }, [config.dataset.rows]);

  const updateConfig = <K extends keyof ScrollBoardConfig>(key: K, value: ScrollBoardConfig[K]) => {
    const nextConfig = cloneScrollBoardConfig(config);
    nextConfig[key] = value;
    onUpdate({ config: nextConfig });
  };

  const updateDataset = (mutator: (dataset: ScrollBoardConfig["dataset"]) => void) => {
    const nextConfig = cloneScrollBoardConfig(config);
    mutator(nextConfig.dataset);
    onUpdate({ config: nextConfig });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="滚动设置"
        description="对照 GoView 轮播列表，把行数、轮播节奏和翻页方式先打通。"
        badge="Scroll"
        contentClassName="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper
            label="展示行数"
            value={config.rowNum}
            min={1}
            max={10}
            step={1}
            unit="行"
            onValueChange={(value) => updateConfig("rowNum", value)}
          />
          <NumberStepper
            label="轮播间隔"
            value={config.waitTime}
            min={1}
            max={20}
            step={1}
            unit="秒"
            onValueChange={(value) => updateConfig("waitTime", value)}
          />
          <NumberStepper
            label="表头高度"
            value={config.headerHeight}
            min={24}
            max={64}
            step={1}
            unit="px"
            onValueChange={(value) => updateConfig("headerHeight", value)}
          />
        </div>
        <FieldShell label="轮播模式">
          <Select
            value={config.carousel}
            options={carouselOptions}
            onChange={(event) => updateConfig("carousel", event.target.value as ScrollBoardCarousel)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>

      <CollapseSection
        title="表头与序号"
        description="支持序号列、标题列以及全局对齐方式，先满足大屏运营榜单的通用样式。"
        badge="Header"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示序号"
          checked={config.index}
          onCheckedChange={(checked) => updateConfig("index", checked)}
        />
        <FieldShell label="序号表头">
          <Input
            value={config.indexHeader}
            onChange={(event) => updateConfig("indexHeader", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="表头字段" description="使用逗号分隔，例如：区域，当日工单，完成率。">
          <Input
            value={config.dataset.header.join("，")}
            onChange={(event) =>
              updateDataset((dataset) => {
                dataset.header = event.target.value
                  .split(/[,，]/)
                  .map((item) => item.trim())
                  .filter(Boolean);
              })
            }
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="全局对齐">
          <Select
            value={config.align[1] ?? config.align[0] ?? "left"}
            options={alignOptions}
            onChange={(event) =>
              updateConfig(
                "align",
                new Array(Math.max(config.dataset.header.length + (config.index ? 1 : 0), 1)).fill(
                  event.target.value as ScrollBoardAlign,
                ),
              )
            }
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
      </CollapseSection>

      <CollapseSection
        title="数据行"
        description="保持 JSON 阵列结构，和 GoView 的数据组织方式一致。"
        badge="Rows"
        contentClassName="space-y-3"
      >
        <FieldShell label="行数据 JSON">
          <Textarea
            rows={8}
            value={rowsDraft}
            onChange={(event) => {
              const nextValue = event.target.value;
              setRowsDraft(nextValue);

              try {
                const parsed = JSON.parse(nextValue) as unknown;
                if (!isRowsShape(parsed)) {
                  setRowsError("需要传入二维数组，例如 [[\"浦东\", 128, \"96%\"]]。");
                  return;
                }

                setRowsError(null);
                updateDataset((dataset) => {
                  dataset.rows = parsed;
                });
              } catch (error) {
                setRowsError(error instanceof Error ? error.message : "JSON 解析失败");
              }
            }}
            className="min-h-0 border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        {rowsError ? (
          <div className="rounded-2xl border border-[#ead1cf] bg-[#fff7f5] px-3.5 py-3 text-sm text-[#a3473b]">
            JSON 校验未通过：{rowsError}
          </div>
        ) : null}
      </CollapseSection>

      <CollapseSection
        title="配色样式"
        description="保持品牌浅底深绿方向，同时允许奇偶行形成阅读节奏。"
        badge="Tone"
        contentClassName="space-y-3"
      >
        <FieldShell label="表头底色">
          <Input
            value={config.headerBgColor}
            onChange={(event) => updateConfig("headerBgColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="表头文字">
          <Input
            value={config.headerTextColor}
            onChange={(event) => updateConfig("headerTextColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="奇数行底色">
          <Input
            value={config.oddRowBgColor}
            onChange={(event) => updateConfig("oddRowBgColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="偶数行底色">
          <Input
            value={config.evenRowBgColor}
            onChange={(event) => updateConfig("evenRowBgColor", event.target.value)}
            className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
          />
        </FieldShell>
        <FieldShell label="正文颜色">
          <Input
            value={config.textColor}
            onChange={(event) => updateConfig("textColor", event.target.value)}
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
