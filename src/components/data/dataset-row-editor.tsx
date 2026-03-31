"use client";

import {Input} from "@/components/ui/input";

type DatasetFieldLike = {
  field: string;
};

type DatasetRowEditorProps = {
  locale: string;
  fields: DatasetFieldLike[];
  rows: Record<string, string | number>[];
  maxColumns?: number;
  maxRows?: number;
  onCellPatch: (rowIndex: number, fieldName: string, value: string) => void;
};

export function DatasetRowEditor({
  locale,
  fields,
  rows,
  maxColumns = 5,
  maxRows = 5,
  onCellPatch,
}: DatasetRowEditorProps) {
  const visibleColumns = fields.slice(0, maxColumns);
  const visibleRows = rows.slice(0, maxRows);

  if (!visibleColumns.length) {
    return (
      <div className="rounded-md border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-4 text-[12px] text-[#727971]">
        {locale === "zh-CN" ? "当前数据集还没有可编辑的行数据。" : "This dataset does not have editable rows yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#c2c8bf]/10">
      <table className="w-full border-collapse bg-white text-left">
        <thead>
          <tr className="bg-[#e8e8e3]">
            {visibleColumns.map((column) => (
              <th key={column.field} className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                {column.field}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {visibleRows.map((row, rowIndex) => (
            <tr key={`dataset-row-${rowIndex}`} className={rowIndex === visibleRows.length - 1 ? "" : "border-b border-[#f4f4ef]"}>
              {visibleColumns.map((column) => (
                <td key={`${rowIndex}-${column.field}`} className="px-3 py-2">
                  <Input
                    className="h-9 rounded-md border-none bg-[#f4f4ef] text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#23422a]"
                    value={String(row[column.field] ?? "")}
                    onChange={(event) => onCellPatch(rowIndex, column.field, event.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
