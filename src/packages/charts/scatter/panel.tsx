"use client";

import type { IScatterChartSpec } from "@visactor/react-vchart";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import { cloneScatterSpec, createDefaultScatterSpec, getScatterDataRows } from "./config";

type ScatterChartPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type FieldOption = {
  label: string;
  value: string;
};

function getScatterSpec(widget: Widget): IScatterChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultScatterSpec();
  }

  return widget.spec as IScatterChartSpec;
}

function getSingleField(field: string | string[] | undefined, fallback = "") {
  if (Array.isArray(field)) {
    return field[0] ?? fallback;
  }

  return field ?? fallback;
}

function getAxisIndex(spec: IScatterChartSpec, orient: "left" | "bottom") {
  return spec.axes?.findIndex((axis) => axis.orient === orient) ?? -1;
}

function getFieldOptions(spec: IScatterChartSpec) {
  const rows = getScatterDataRows(spec);
  const firstRow = rows[0];
  if (!firstRow) {
    return {
      allFields: [] as FieldOption[],
      numericFields: [] as FieldOption[],
      categoryFields: [] as FieldOption[],
      rowCount: 0,
    };
  }

  const keys = Object.keys(firstRow);
  const allFields = keys.map((key) => ({ label: key, value: key }));
  const numericFields = keys
    .filter((key) =>
      rows.some((row) => {
        const value = row[key];
        return typeof value === "number" && Number.isFinite(value);
      }),
    )
    .map((key) => ({ label: key, value: key }));
  const categoryFields = allFields.filter(
    (option) => !numericFields.some((numericField) => numericField.value === option.value),
  );

  return {
    allFields,
    numericFields,
    categoryFields: categoryFields.length > 0 ? categoryFields : allFields,
    rowCount: rows.length,
  };
}

function isSingleLabelSpec(
  label: IScatterChartSpec["label"],
): label is Exclude<IScatterChartSpec["label"], undefined | unknown[]> {
  return !Array.isArray(label);
}

function getPointSize(spec: IScatterChartSpec) {
  const value = spec.point?.style?.size;
  return typeof value === "number" ? value : 16;
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
  options: FieldOption[];
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

export function ScatterChartPanel({ widget, onUpdate }: ScatterChartPanelProps) {
  const spec = getScatterSpec(widget);
  const xAxisIndex = getAxisIndex(spec, "bottom");
  const yAxisIndex = getAxisIndex(spec, "left");
  const xAxisVisible = xAxisIndex >= 0 ? spec.axes?.[xAxisIndex]?.visible !== false : true;
  const yAxisVisible = yAxisIndex >= 0 ? spec.axes?.[yAxisIndex]?.visible !== false : true;
  const labelVisible = isSingleLabelSpec(spec.label) && spec.label?.visible === true;
  const pointSize = getPointSize(spec);
  const xField = getSingleField(spec.xField);
  const yField = getSingleField(spec.yField);
  const sizeField = spec.sizeField ?? "";
  const seriesField = getSingleField(spec.seriesField);
  const { categoryFields, numericFields, rowCount } = getFieldOptions(spec);

  const updateSpec = (mutator: (nextSpec: IScatterChartSpec) => void) => {
    const nextSpec = cloneScatterSpec(spec);
    mutator(nextSpec);
    onUpdate({ spec: nextSpec });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="坐标轴显示"
        description="散点图先保留双线性坐标轴，方便做经营分布分析。"
        badge="Axis"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示 X 轴"
          description="控制底部线性轴显示。"
          checked={xAxisVisible}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              const axis = nextSpec.axes?.[xAxisIndex];
              if (axis) {
                axis.visible = checked;
              }
            })
          }
        />
        <ToggleSwitch
          label="显示 Y 轴"
          description="控制左侧线性轴和网格显示。"
          checked={yAxisVisible}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              const axis = nextSpec.axes?.[yAxisIndex];
              if (axis) {
                axis.visible = checked;
              }
            })
          }
        />
      </CollapseSection>

      <CollapseSection
        title="点位样式"
        description="保持 GoView 的基础气泡图体验，先开放默认点大小和标签显隐。"
        badge="Point"
        contentClassName="space-y-3"
      >
        <NumberStepper
          label="默认点大小"
          description="作为未绑定气泡字段时的回退尺寸。"
          value={pointSize}
          min={4}
          max={40}
          step={1}
          unit="px"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.point = {
                ...nextSpec.point,
                style: {
                  ...nextSpec.point?.style,
                  size: value,
                },
              };
            })
          }
        />
        <ToggleSwitch
          label="显示标签"
          description="控制散点顶部标签显示。"
          checked={labelVisible}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              if (Array.isArray(nextSpec.label)) {
                nextSpec.label = nextSpec.label.map((labelItem) => ({
                  ...labelItem,
                  visible: checked,
                }));
                return;
              }

              nextSpec.label = {
                ...nextSpec.label,
                visible: checked,
              };
            })
          }
        />
      </CollapseSection>

      <CollapseSection
        title="字段映射"
        description={`当前数据共 ${rowCount} 行，支持 X / Y / 气泡 / 系列 四类映射。`}
        badge="Data"
        contentClassName="space-y-3"
      >
        <SelectField
          label="X 字段"
          value={xField}
          options={numericFields}
          placeholder="选择 X 字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.xField = value;
            })
          }
        />
        <SelectField
          label="Y 字段"
          value={yField}
          options={numericFields}
          placeholder="选择 Y 字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.yField = value;
            })
          }
        />
        <SelectField
          label="气泡字段"
          value={sizeField}
          options={[{ label: "使用默认点大小", value: "" }, ...numericFields]}
          placeholder="选择气泡字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.sizeField = value || undefined;
              nextSpec.size = value ? [10, 30] : pointSize;
            })
          }
        />
        <SelectField
          label="系列字段"
          value={seriesField}
          options={[{ label: "不拆分系列", value: "" }, ...categoryFields]}
          placeholder="选择系列字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.seriesField = value || undefined;
            })
          }
        />
      </CollapseSection>
    </div>
  );
}
