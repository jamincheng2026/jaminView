"use client";

import type { ILineChartSpec } from "@visactor/react-vchart";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import { cloneLineSpec, createDefaultLineSpec, getLineDataRows } from "./config";

type LineChartPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type FieldOption = {
  label: string;
  value: string;
};

function getLineSpec(widget: Widget): ILineChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultLineSpec();
  }

  return widget.spec as ILineChartSpec;
}

function getSingleField(field: string | string[] | undefined, fallback = "") {
  if (Array.isArray(field)) {
    return field[0] ?? fallback;
  }

  return field ?? fallback;
}

function getAxisIndex(spec: ILineChartSpec, orient: "left" | "bottom") {
  return spec.axes?.findIndex((axis) => axis.orient === orient) ?? -1;
}

function getFieldOptions(spec: ILineChartSpec) {
  const rows = getLineDataRows(spec);
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
  label: ILineChartSpec["label"],
): label is Exclude<ILineChartSpec["label"], undefined | unknown[]> {
  return !Array.isArray(label);
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

export function LineChartPanel({ widget, onUpdate }: LineChartPanelProps) {
  const spec = getLineSpec(widget);
  const xAxisIndex = getAxisIndex(spec, "bottom");
  const yAxisIndex = getAxisIndex(spec, "left");
  const xAxisVisible = xAxisIndex >= 0 ? spec.axes?.[xAxisIndex]?.visible !== false : true;
  const yAxisVisible = yAxisIndex >= 0 ? spec.axes?.[yAxisIndex]?.visible !== false : true;
  const labelVisible = isSingleLabelSpec(spec.label) && spec.label?.visible === true;
  const lineWidth =
    typeof spec.line?.style?.lineWidth === "number" ? spec.line.style.lineWidth : 3;
  const pointSize =
    typeof spec.point?.style?.size === "number" ? spec.point.style.size : 7;
  const smooth = spec.line?.style?.curveType === "monotone";
  const xField = getSingleField(spec.xField);
  const yField = getSingleField(spec.yField);
  const seriesField = getSingleField(spec.seriesField);
  const { allFields, categoryFields, numericFields, rowCount } = getFieldOptions(spec);

  const updateSpec = (mutator: (nextSpec: ILineChartSpec) => void) => {
    const nextSpec = cloneLineSpec(spec);
    mutator(nextSpec);
    onUpdate({ spec: nextSpec });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="坐标轴显示"
        description="沿用柱状图链路，直接写入 spec.axes[n].visible。"
        badge="Axis"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示 X 轴"
          description="控制底部类目轴的整体显隐。"
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
          description="控制左侧数值轴和网格显示。"
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
        title="折线样式"
        description="这一组补齐 GoView 折线图的关键样式控制，并额外完成 smooth 开关。"
        badge="Line"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="平滑曲线"
          description="直接切换 spec.line.style.curveType，满足 Task 2.2 的核心要求。"
          checked={smooth}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              nextSpec.line = {
                ...nextSpec.line,
                style: {
                  ...nextSpec.line?.style,
                  curveType: checked ? "monotone" : "linear",
                },
              };
            })
          }
        />
        <NumberStepper
          label="线宽"
          description="直接写入 spec.line.style.lineWidth。"
          value={lineWidth}
          min={1}
          max={12}
          step={1}
          unit="px"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.line = {
                ...nextSpec.line,
                style: {
                  ...nextSpec.line?.style,
                  lineWidth: value,
                },
              };
            })
          }
        />
        <NumberStepper
          label="点大小"
          description="对应 GoView 的实心点大小控制。"
          value={pointSize}
          min={2}
          max={24}
          step={1}
          unit="px"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.point = {
                ...nextSpec.point,
                visible: true,
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
          description="控制折线点位顶部标签显示。"
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
        description={`当前数据共 ${rowCount} 行，直接映射 spec.xField / spec.yField / spec.seriesField。`}
        badge="Data"
        contentClassName="space-y-3"
      >
        <SelectField
          label="类目字段"
          value={xField}
          options={categoryFields}
          placeholder="选择类目字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.xField = value;
            })
          }
        />
        <SelectField
          label="数值字段"
          value={yField}
          options={numericFields}
          placeholder="选择数值字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.yField = value;
            })
          }
        />
        <SelectField
          label="系列字段"
          value={seriesField}
          options={[{ label: "不拆分系列", value: "" }, ...allFields]}
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
