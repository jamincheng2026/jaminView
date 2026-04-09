"use client";

import type { IPieChartSpec } from "@visactor/react-vchart";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import { clonePieSpec, createDefaultPieSpec, getPieDataRows } from "./config";

type PieChartPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type FieldOption = {
  label: string;
  value: string;
};

function getPieSpec(widget: Widget): IPieChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultPieSpec();
  }

  return widget.spec as IPieChartSpec;
}

function getFieldOptions(spec: IPieChartSpec) {
  const rows = getPieDataRows(spec);
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

function isSinglePieLabelSpec(
  label: IPieChartSpec["label"],
): label is Exclude<IPieChartSpec["label"], undefined | unknown[]> {
  return !Array.isArray(label);
}

function getLegendVisible(spec: IPieChartSpec) {
  if (Array.isArray(spec.legends)) {
    return spec.legends[0]?.visible !== false;
  }

  return spec.legends?.visible !== false;
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

export function PieChartPanel({ widget, onUpdate }: PieChartPanelProps) {
  const spec = getPieSpec(widget);
  const legendVisible = getLegendVisible(spec);
  const labelVisible = isSinglePieLabelSpec(spec.label) && spec.label?.visible !== false;
  const innerRadius = typeof spec.innerRadius === "number" ? spec.innerRadius : 0.42;
  const outerRadius = typeof spec.outerRadius === "number" ? spec.outerRadius : 0.78;
  const cornerRadius = typeof spec.cornerRadius === "number" ? spec.cornerRadius : 8;
  const categoryField = spec.categoryField ?? "";
  const valueField = spec.valueField ?? "";
  const { categoryFields, numericFields, rowCount } = getFieldOptions(spec);

  const updateSpec = (mutator: (nextSpec: IPieChartSpec) => void) => {
    const nextSpec = clonePieSpec(spec);
    mutator(nextSpec);
    onUpdate({ spec: nextSpec });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="图例与标签"
        description="先把最常用的图例和标签显隐直接绑到 VChart Spec。"
        badge="Legend"
        contentClassName="space-y-3"
      >
        <ToggleSwitch
          label="显示图例"
          description="控制饼图右侧图例区域是否展示。"
          checked={legendVisible}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              if (Array.isArray(nextSpec.legends)) {
                nextSpec.legends = nextSpec.legends.map((legend, index) =>
                  index === 0 ? { ...legend, visible: checked } : legend,
                );
                return;
              }

              nextSpec.legends = {
                ...nextSpec.legends,
                visible: checked,
              };
            })
          }
        />
        <ToggleSwitch
          label="显示标签"
          description="控制扇区外侧标签和引导线显示。"
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
                line: {
                  ...nextSpec.label?.line,
                  visible: checked,
                },
              };
            })
          }
        />
      </CollapseSection>

      <CollapseSection
        title="圆环与布局"
        description="参考 DataV 与 GoView 的高频操作，先开放内外半径与圆角。"
        badge="Layout"
        contentClassName="space-y-3"
      >
        <NumberStepper
          label="内半径"
          description="0 表示纯饼图，数值越大越接近环图。"
          value={innerRadius}
          min={0}
          max={0.8}
          step={0.05}
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.innerRadius = value;
            })
          }
        />
        <NumberStepper
          label="外半径"
          description="控制整体圆环的铺满程度。"
          value={outerRadius}
          min={0.4}
          max={1}
          step={0.05}
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.outerRadius = value;
            })
          }
        />
        <NumberStepper
          label="圆角"
          description="直写 spec.cornerRadius，增强柔和感。"
          value={cornerRadius}
          min={0}
          max={20}
          step={1}
          unit="px"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.cornerRadius = value;
            })
          }
        />
      </CollapseSection>

      <CollapseSection
        title="字段映射"
        description={`当前数据共 ${rowCount} 行，直接映射 spec.categoryField / spec.valueField。`}
        badge="Data"
        contentClassName="space-y-3"
      >
        <SelectField
          label="分类字段"
          value={categoryField}
          options={categoryFields}
          placeholder="选择分类字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.categoryField = value;
            })
          }
        />
        <SelectField
          label="数值字段"
          value={valueField}
          options={numericFields}
          placeholder="选择数值字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.valueField = value;
            })
          }
        />
      </CollapseSection>
    </div>
  );
}
