"use client";

import {Database, Link2, PencilLine} from "lucide-react";

import {DatasetRowEditor} from "@/components/data/dataset-row-editor";
import {EditorSection} from "@/components/editor/editor-primitives";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

export type DatasetFieldDraft = {
  field: string;
  type: string;
  sample: string;
  icon: string;
};

export type DatasetPanelItem = {
  name: string;
  records: string;
  source: "starter" | "imported";
  fields: DatasetFieldDraft[];
  rows: Record<string, string | number>[];
};

type EditorDataPanelProps = {
  locale: string;
  datasets: DatasetPanelItem[];
  selectedDatasetName: string;
  selectedWidgetDataset: string;
  onSelectDataset: (datasetName: string) => void;
  onBindDataset: (datasetName: string) => void;
  onFieldPatch: (datasetName: string, fieldIndex: number, patch: Partial<DatasetFieldDraft>) => void;
  onRowPatch: (datasetName: string, rowIndex: number, fieldName: string, value: string) => void;
};

const controlClass =
  "h-8 rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] text-[#1a1c19] shadow-none focus:border-[#45664b]";

export function EditorDataPanel({
  locale,
  datasets,
  selectedDatasetName,
  selectedWidgetDataset,
  onSelectDataset,
  onBindDataset,
  onFieldPatch,
  onRowPatch,
}: EditorDataPanelProps) {
  const selectedDataset = datasets.find((dataset) => dataset.name === selectedDatasetName) ?? datasets[0] ?? null;

  return (
    <div className="space-y-5">
      <EditorSection
        title={locale === "zh-CN" ? "可用数据集" : "Available Datasets"}
        subtitle={locale === "zh-CN" ? "点击查看字段，绑定到当前组件" : "Inspect fields and bind them to the selected widget"}
      >
        <div className="space-y-3">
          {datasets.map((dataset) => {
            const isActive = dataset.name === selectedDatasetName;
            const isBound = dataset.name === selectedWidgetDataset;

            return (
              <div
                key={dataset.name}
                className={`rounded-md border p-3 transition-colors ${
                  isActive ? "border-[#23422a]/30 bg-[#eef2ea]" : "border-[#c2c8bf]/30 bg-[#fafaf5]"
                }`}
              >
                <button
                  onClick={() => onSelectDataset(dataset.name)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-semibold text-[#1a1c19]">{dataset.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#727971]">
                        <span>{dataset.records}</span>
                        <span>•</span>
                        <span>{dataset.source === "imported" ? (locale === "zh-CN" ? "导入数据" : "Imported") : (locale === "zh-CN" ? "模板内置" : "Starter")}</span>
                      </div>
                    </div>
                    <span className="rounded bg-[#f4f4ef] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#45664b]">
                      {dataset.fields.length} {locale === "zh-CN" ? "字段" : "fields"}
                    </span>
                  </div>
                </button>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#727971]">
                    <Database className="h-3.5 w-3.5" />
                    <span>{isBound ? (locale === "zh-CN" ? "当前已绑定" : "Bound to widget") : (locale === "zh-CN" ? "可绑定到组件" : "Available to bind")}</span>
                  </div>
                  <button
                    onClick={() => onBindDataset(dataset.name)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      isBound
                        ? "bg-[#dce9dc] text-[#23422a]"
                        : "border border-[#d7d8d1] bg-[#fafaf5] text-[#23422a] hover:bg-[#eef2ea]"
                    }`}
                  >
                    {isBound ? (locale === "zh-CN" ? "已绑定" : "Bound") : (locale === "zh-CN" ? "绑定到组件" : "Bind to widget")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </EditorSection>

      {selectedDataset ? (
        <>
          <EditorSection
            title={locale === "zh-CN" ? "字段编辑器" : "Field Editor"}
            subtitle={locale === "zh-CN" ? "在这里整理字段名称、类型和样例值" : "Adjust field names, types, and sample values here"}
          >
            <div className="mb-3 flex items-center justify-between rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-[#1a1c19]">{selectedDataset.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#727971]">
                  {selectedDataset.source === "imported"
                    ? locale === "zh-CN"
                      ? "导入后字段可继续整理"
                      : "Imported fields can continue to be refined"
                    : locale === "zh-CN"
                      ? "模板内置字段，当前会话内可调整"
                      : "Starter schema editable for this session"}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#eef2ea] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#23422a]">
                <PencilLine className="h-3.5 w-3.5" />
                <span>{locale === "zh-CN" ? "可编辑" : "Editable"}</span>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDataset.fields.map((field, index) => (
                <div key={`${selectedDataset.name}-${field.field}-${index}`} className="rounded-md border border-[#e7e8e1] bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#727971]">
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{locale === "zh-CN" ? `字段 ${index + 1}` : `Field ${index + 1}`}</span>
                    </div>
                    <span className="rounded bg-[#f4f4ef] px-2 py-1 text-[10px] text-[#424842]">{field.icon}</span>
                  </div>

                  <div className="grid gap-2.5">
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                        {locale === "zh-CN" ? "字段名称" : "Field Name"}
                      </span>
                      <Input
                        className={controlClass}
                        value={field.field}
                        onChange={(event) => onFieldPatch(selectedDataset.name, index, {field: event.target.value})}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                          {locale === "zh-CN" ? "数据类型" : "Data Type"}
                        </span>
                        <Select
                          className={controlClass}
                          value={field.type}
                          onChange={(event) => onFieldPatch(selectedDataset.name, index, {type: event.target.value})}
                          options={[
                            {label: "Numeric", value: "Numeric"},
                            {label: "Category", value: "Category"},
                            {label: "Date / Time", value: "Date / Time"},
                            {label: "Text", value: "Text"},
                          ]}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                          {locale === "zh-CN" ? "样例值" : "Sample"}
                        </span>
                        <Input
                          className={controlClass}
                          value={field.sample}
                          onChange={(event) => onFieldPatch(selectedDataset.name, index, {sample: event.target.value})}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection
            title={locale === "zh-CN" ? "样例行编辑器" : "Row Editor"}
            subtitle={locale === "zh-CN" ? "修改前几行数据，立即反馈到图表和表格" : "Adjust a few rows and see widgets respond immediately"}
          >
            <DatasetRowEditor
              locale={locale}
              fields={selectedDataset.fields}
              rows={selectedDataset.rows}
              onCellPatch={(rowIndex, fieldName, value) => onRowPatch(selectedDataset.name, rowIndex, fieldName, value)}
            />
          </EditorSection>
        </>
      ) : null}
    </div>
  );
}
