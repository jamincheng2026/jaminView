"use client";

import type { IRadarChartSpec } from "@visactor/react-vchart";

import { CollapseSection, NumberStepper, ToggleSwitch } from "@/components/editor-ui";
import { Select } from "@/components/ui/select";
import { ChartFrame, type Widget, type WidgetPatch } from "@/packages/types";

import { cloneRadarSpec, createDefaultRadarSpec, getRadarDataRows } from "./config";

type RadarChartPanelProps = {
  widget: Widget;
  onUpdate: (patch: WidgetPatch) => void;
};

type FieldOption = {
  label: string;
  value: string;
};

type RadarSeriesMark = NonNullable<IRadarChartSpec["seriesMark"]>;

function getRadarSpec(widget: Widget): IRadarChartSpec {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return createDefaultRadarSpec();
  }

  return widget.spec as IRadarChartSpec;
}

function getSingleField(field: string | string[] | undefined, fallback = "") {
  if (Array.isArray(field)) {
    return field[0] ?? fallback;
  }

  return field ?? fallback;
}

function getFieldOptions(spec: IRadarChartSpec) {
  const rows = getRadarDataRows(spec);
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
  label: IRadarChartSpec["label"],
): label is Exclude<IRadarChartSpec["label"], undefined | unknown[]> {
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

export function RadarChartPanel({ widget, onUpdate }: RadarChartPanelProps) {
  const spec = getRadarSpec(widget);
  const seriesMark = spec.seriesMark ?? "area";
  const activePoint = spec.activePoint === true;
  const labelVisible = isSingleLabelSpec(spec.label) && spec.label?.visible === true;
  const areaOpacity =
    typeof spec.area?.style?.fillOpacity === "number" ? spec.area.style.fillOpacity : 0.18;
  const outerRadius = typeof spec.outerRadius === "number" ? spec.outerRadius : 0.76;
  const innerRadius = typeof spec.innerRadius === "number" ? spec.innerRadius : 0.16;
  const categoryField = getSingleField(spec.categoryField);
  const valueField = getSingleField(spec.valueField);
  const seriesField = getSingleField(spec.seriesField);
  const { categoryFields, numericFields, rowCount } = getFieldOptions(spec);

  const updateSpec = (mutator: (nextSpec: IRadarChartSpec) => void) => {
    const nextSpec = cloneRadarSpec(spec);
    mutator(nextSpec);
    onUpdate({ spec: nextSpec });
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="雷达形态"
        description="按 GoView 常用操作先开放面积、折线、点阵三种主形态。"
        badge="Series"
        contentClassName="space-y-3"
      >
        <SelectField
          label="主图形"
          value={seriesMark}
          options={[
            { label: "面积雷达", value: "area" },
            { label: "折线雷达", value: "line" },
            { label: "点阵雷达", value: "point" },
          ]}
          placeholder="选择主图形"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.seriesMark = value as RadarSeriesMark;
              nextSpec.area = {
                ...nextSpec.area,
                visible: value === "area",
              };
              nextSpec.point = {
                ...nextSpec.point,
                visible: value === "point",
              };
            })
          }
        />
        <ToggleSwitch
          label="激活顶点高亮"
          description="开启后鼠标经过时更容易感知当前节点。"
          checked={activePoint}
          onCheckedChange={(checked) =>
            updateSpec((nextSpec) => {
              nextSpec.activePoint = checked;
            })
          }
        />
        <ToggleSwitch
          label="显示标签"
          description="控制雷达顶点标签展示。"
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
        title="半径与区域"
        description="控制雷达图占位密度和面积层透明度。"
        badge="Radius"
        contentClassName="space-y-3"
      >
        <NumberStepper
          label="外半径"
          description="控制雷达图铺满程度。"
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
          label="内半径"
          description="提升后可获得环形雷达的留白感。"
          value={innerRadius}
          min={0}
          max={0.5}
          step={0.05}
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.innerRadius = value;
            })
          }
        />
        <NumberStepper
          label="面积透明度"
          description="直写 spec.area.style.fillOpacity。"
          value={areaOpacity}
          min={0}
          max={1}
          step={0.05}
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.area = {
                ...nextSpec.area,
                style: {
                  ...nextSpec.area?.style,
                  fillOpacity: value,
                },
              };
            })
          }
        />
      </CollapseSection>

      <CollapseSection
        title="字段映射"
        description={`当前数据共 ${rowCount} 行，直接映射维度 / 分数 / 系列 三个字段。`}
        badge="Data"
        contentClassName="space-y-3"
      >
        <SelectField
          label="维度字段"
          value={categoryField}
          options={categoryFields}
          placeholder="选择维度字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.categoryField = value;
            })
          }
        />
        <SelectField
          label="分数字段"
          value={valueField}
          options={numericFields}
          placeholder="选择分数字段"
          onValueChange={(value) =>
            updateSpec((nextSpec) => {
              nextSpec.valueField = value;
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
