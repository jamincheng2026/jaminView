"use client";

import {useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter, useSearchParams} from "next/navigation";
import {
  Archive,
  Bell,
  Folder,
  HelpCircle,
  Layers3,
  Search,
  Settings,
  SlidersHorizontal,
  UploadCloud,
  X,
} from "lucide-react";

import {LocaleSwitch} from "@/components/ui/locale-switch";
import {DatasetRowEditor} from "@/components/data/dataset-row-editor";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {parseDatasetFile} from "@/lib/dataset-parser";
import {
  importFileMeta,
  importPreviewRows,
  importWorkspaceOptions,
} from "@/lib/mocks/data-import";
import {
  readImportedDatasets,
  writeImportedDatasets,
  type ImportedDataset,
} from "@/lib/editor-storage";
import {decodeRouteSegment} from "@/lib/project-utils";

const profileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByefq0eg7fdBDomc8F-GMr3SfGkY_9YldcjoNcp0cZt6cVjyT-dKjOCWtzIsDSXvV11s6AR-vkurfntdQzsZ-5NhqGry-4lgy0-rxJgn32YCy-gfqCJQhmgF7L_zX12VIni9wTbLziXKdpSmx0uy2obOubVSsb854dhciDUphORDNuqWK--BekywqGPehJaq3Rp2NkpjzAE3bFJNhFhweSvRi8jSyFX3y4hxAfDK4QIrfMe71tWbTG33zJNy7pPjO3AgEuNFdZG2sr";

type EditablePreviewRow = {
  field: string;
  type: string;
  sample: string;
  icon: string;
};

export function DataImportPage() {
  const t = useTranslations("DataImport");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = decodeRouteSegment(searchParams.get("projectId") ?? "q4-analytics");
  const returnTo =
    decodeRouteSegment(searchParams.get("returnTo") ?? "") || `/${locale}/editor/${projectId}`;

  const [datasetName, setDatasetName] = useState("Q4_Logistics_Operations_2023");
  const [destination, setDestination] = useState(importWorkspaceOptions[0] ?? "");
  const [rows, setRows] = useState<EditablePreviewRow[]>(importPreviewRows);
  const [sampleRows, setSampleRows] = useState(() => buildImportedRows(importPreviewRows));
  const [fileMeta, setFileMeta] = useState(importFileMeta);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importCountLabel = useMemo(() => `${rows.length} ${locale === "zh-CN" ? "个字段可编辑" : "editable fields"}`, [locale, rows.length]);

  const updateRow = (index: number, patch: Partial<EditablePreviewRow>) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? {...row, ...patch} : row)));
    setSampleRows((current) =>
      current.map((rowData) => {
        const currentField = rows[index];
        if (!currentField) return rowData;

        if (patch.field && patch.field !== currentField.field) {
          const {[currentField.field]: previousValue, ...rest} = rowData;
          return {
            ...rest,
            [patch.field]: previousValue ?? "",
          };
        }

        return rowData;
      }),
    );
  };

  const updateSampleCell = (rowIndex: number, fieldName: string, value: string) => {
    setSampleRows((current) =>
      current.map((row, currentIndex) =>
        currentIndex === rowIndex
          ? {
              ...row,
              [fieldName]: value,
            }
          : row,
      ),
    );
  };

  const handleFileSelect = async (file: File) => {
    setParseError(null);
    try {
      const parsed = await parseDatasetFile(file);
      setDatasetName(parsed.name);
      setRows(parsed.fields);
      setSampleRows(parsed.rows);
      setFileMeta({
        name: file.name,
        size: formatBytes(file.size),
        rows: parsed.records,
        columns: parsed.columns,
        status: "READY TO IMPORT",
      });
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to parse the selected file.");
    }
  };

  const handleImport = () => {
    // V1 keeps import editing intentionally lightweight: rename fields, fix types,
    // and persist a dataset record that the editor can immediately bind to.
    setSaveState("saving");

    const nextDataset: ImportedDataset = {
      id: `${projectId}-${Date.now()}`,
      name: datasetName.trim() || fileMeta.name,
      records: fileMeta.rows,
      columns: String(rows.length),
      source: fileMeta.name.endsWith(".json") ? "json" : fileMeta.name.endsWith(".xlsx") || fileMeta.name.endsWith(".xls") ? "xlsx" : "csv",
      fields: rows.map((row) => ({
        field: row.field,
        type: row.type,
        sample: row.sample,
        icon: row.icon,
      })),
      rows: sampleRows,
      importedAt: new Date().toISOString(),
    };

    const current = readImportedDatasets(projectId);
    const merged = [nextDataset, ...current.filter((dataset) => dataset.name !== nextDataset.name)];
    writeImportedDatasets(projectId, merged);

    window.setTimeout(() => {
      router.push(returnTo);
    }, 220);
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#fafaf5] text-[#1a1c19]">
      <header className="flex h-16 items-center justify-between bg-[#fafaf5] px-6 font-headline text-sm tracking-wide">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-[-0.04em] text-[#23422a]">JaminView</span>
          <nav className="hidden items-center gap-6 md:flex">
            <span className="font-medium text-[#424842] transition-colors hover:text-[#23422a]">
              {t("nav.projects")}
            </span>
            <span className="font-medium text-[#424842] transition-colors hover:text-[#23422a]">
              {t("nav.templates")}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727971]" />
            <input
              className="w-64 rounded-md border-none bg-[#f4f4ef] py-1.5 pl-10 pr-4 text-sm outline-none ring-0 focus:ring-2 focus:ring-[#23422a]/20"
              placeholder={t("nav.searchPlaceholder")}
              type="text"
            />
          </div>
          <LocaleSwitch />
          <button className="rounded-full p-2 text-[#424842] transition-colors hover:bg-[#e8e8e3]">
            <Bell className="h-5 w-5" strokeWidth={1.9} />
          </button>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#e3e3de]">
            <img src={profileImage} alt="User Profile" className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-transparent bg-[#f4f4ef] px-3 py-4 md:flex">
          <div className="mb-6 px-3">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3a5a40] text-[#acd0af]">
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2.1} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1a1c19]">{t("sidebar.title")}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#727971]">
                  {t("sidebar.subtitle")}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <SideRailItem active icon="✎">
              {t("sidebar.editor")}
            </SideRailItem>
            <SideRailItem icon={<Layers3 className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.layers")}
            </SideRailItem>
            <SideRailItem icon={<SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.tools")}
            </SideRailItem>
            <SideRailItem icon={<Folder className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.folders")}
            </SideRailItem>
            <SideRailItem icon={<Settings className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.settings")}
            </SideRailItem>
          </nav>

          <div className="space-y-1 border-t border-[#c2c8bf]/20 pt-4">
            <SideRailItem icon={<HelpCircle className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.help")}
            </SideRailItem>
            <SideRailItem icon={<Archive className="h-4 w-4" strokeWidth={1.9} />}>
              {t("sidebar.archive")}
            </SideRailItem>
          </div>
        </aside>

        <section className="relative flex-1 overflow-hidden bg-[#e3e3de] p-8">
          <div className="grid h-full grid-cols-12 gap-6 select-none opacity-40">
            <div className="col-span-8 flex flex-col gap-6 rounded-lg bg-[#fafaf5] p-6">
              <div className="h-8 w-1/3 rounded bg-[#f4f4ef]" />
              <div className="flex-1 rounded-lg border-2 border-dashed border-[#c2c8bf]/30 bg-[#f4f4ef]" />
            </div>
            <div className="col-span-4 flex flex-col gap-6">
              <div className="h-1/2 rounded-lg bg-[#fafaf5] p-6" />
              <div className="flex-1 rounded-lg bg-[#fafaf5] p-6" />
            </div>
          </div>

          <div className="absolute inset-0 z-20 flex items-start justify-center overflow-hidden p-4 md:p-6">
            <div className="absolute inset-0 bg-[#1a1c19]/10 backdrop-blur-[2px]" />

            <div className="relative mt-8 flex h-[calc(100vh-5rem)] w-full max-w-[1120px] flex-col overflow-hidden rounded-xl bg-[#fafaf5] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between border-b border-[#c2c8bf]/10 px-8 py-6">
                <div>
                  <h2 className="font-headline text-2xl font-bold tracking-tight text-[#23422a]">
                    {t("modal.title")}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#424842]">
                    {t("modal.description")}
                  </p>
                </div>
                <button onClick={() => router.push(returnTo)} className="text-[#727971] transition-colors hover:text-[#1a1c19]">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FieldShell label={t("modal.datasetName")}>
                      <Input
                        className="h-12 rounded-md border-none bg-[#f4f4ef] px-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#23422a]"
                        value={datasetName}
                        onChange={(event) => setDatasetName(event.target.value)}
                      />
                    </FieldShell>

                    <FieldShell label={t("modal.storageDestination")}>
                      <Select
                        className="h-12 rounded-md border-none bg-[#f4f4ef] text-sm shadow-none focus:ring-2 focus:ring-[#23422a]"
                        value={destination}
                        onChange={(event) => setDestination(event.target.value)}
                        options={importWorkspaceOptions.map((option) => ({label: option, value: option}))}
                      />
                    </FieldShell>
                  </div>

                  <div className="group relative overflow-hidden rounded-xl">
                    <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-[#23422a]/20 bg-[#23422a]/5 transition-all group-hover:border-[#23422a]/40 group-hover:bg-[#23422a]/10" />
                    <div className="relative flex flex-col items-center justify-center px-8 py-12 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#23422a] text-white shadow-lg">
                        <UploadCloud className="h-7 w-7" strokeWidth={2.2} />
                      </div>
                      <h3 className="mb-2 font-headline text-lg font-bold text-[#1a1c19]">
                        {t("modal.dropTitle")}
                      </h3>
                      <p className="mb-6 max-w-sm text-sm text-[#424842]">
                        {t("modal.dropDescription")}
                      </p>
                      <div className="flex gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleFileSelect(file);
                          }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-md bg-[#23422a] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5"
                        >
                          {t("modal.selectFiles")}
                        </button>
                        <button className="rounded-md bg-[#e8e8e3] px-6 py-2.5 text-sm font-bold text-[#1a1c19] transition-colors hover:bg-[#e3e3de]">
                          {t("modal.googleDrive")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#f4f4ef] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-[#e8e8e3] text-[#406840]">
                        <span className="text-sm">▦</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1a1c19]">{fileMeta.name}</div>
                        <div className="text-[11px] uppercase tracking-tight text-[#727971]">
                          {fileMeta.size} • {fileMeta.rows} Rows • {fileMeta.columns} Columns
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#c7ecca] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#23422a]">
                        {t("modal.ready")}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#c2c8bf]/20 bg-white/80 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-headline text-sm font-bold text-[#1a1c19]">
                          {locale === "zh-CN" ? "字段预处理" : "Field preparation"}
                        </h3>
                        <p className="mt-1 text-xs text-[#727971]">{importCountLabel}</p>
                      </div>
                      <span className="rounded bg-[#eef2ea] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#23422a]">
                        {locale === "zh-CN" ? "轻量编辑" : "Light edit"}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {rows.map((row, index) => (
                        <div key={`${row.field}-${index}`} className="grid grid-cols-[1.4fr_1fr_1.4fr] gap-3 rounded-lg border border-[#ecece6] bg-[#fafaf5] p-3">
                          <Input
                            className="h-10 rounded-md border-none bg-[#f4f4ef] text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#23422a]"
                            value={row.field}
                            onChange={(event) => updateRow(index, {field: event.target.value})}
                          />
                          <Select
                            className="h-10 rounded-md border-none bg-[#f4f4ef] text-sm shadow-none"
                            value={row.type}
                            onChange={(event) => updateRow(index, {type: event.target.value})}
                            options={[
                              {label: "Numeric", value: "Numeric"},
                              {label: "Category", value: "Category"},
                              {label: "Date / Time", value: "Date / Time"},
                              {label: "Text", value: "Text"},
                            ]}
                          />
                          <Input
                            className="h-10 rounded-md border-none bg-[#f4f4ef] text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#23422a]"
                            value={row.sample}
                            onChange={(event) => updateRow(index, {sample: event.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-r-lg border-l-4 border-[#ba1a1a] bg-[#ffdad6]/50 p-4">
                    <span className="text-[#ba1a1a]">!</span>
                    <div>
                      <h4 className="mb-0.5 text-xs font-bold uppercase text-[#93000a]">
                        {t("modal.warningTitle")}
                      </h4>
                      <p className="text-sm text-[#93000a]/80">{parseError ?? t("modal.warningBody")}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-sm font-bold text-[#1a1c19]">
                        {t("modal.previewTitle")}
                      </h3>
                      <button className="text-xs font-bold text-[#23422a] hover:underline">
                        {t("modal.advancedMapping")}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#c2c8bf]/10">
                      <table className="w-full border-collapse bg-white text-left">
                        <thead>
                          <tr className="bg-[#e8e8e3]">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                              {t("modal.fieldLabel")}
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                              {t("modal.dataType")}
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
                              {t("modal.sampleValue")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {rows.map((row, index) => (
                            <tr key={`${row.field}-preview-${index}`} className={index === rows.length - 1 ? "" : "border-b border-[#f4f4ef]"}>
                              <td className="px-4 py-3 font-medium text-[#1a1c19]">{row.field}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex w-fit items-center gap-1.5 rounded bg-[#f4f4ef] px-2 py-1 text-xs text-[#424842]">
                                  <span className="text-[10px]">{row.icon}</span>
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 italic text-[#727971]">{row.sample}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-sm font-bold text-[#1a1c19]">
                        {locale === "zh-CN" ? "样例行编辑器" : "Row Editor"}
                      </h3>
                      <span className="text-xs font-bold text-[#727971]">
                        {locale === "zh-CN" ? "导入前可直接整理前几行数据" : "Refine a few records before import"}
                      </span>
                    </div>

                    <DatasetRowEditor
                      locale={locale}
                      fields={rows}
                      rows={sampleRows}
                      onCellPatch={updateSampleCell}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#c2c8bf]/10 bg-white/80 px-8 py-5">
                <div className="flex items-center gap-2 text-xs text-[#727971]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef2ea] text-[#23422a]">✓</span>
                  <span>{t("modal.privacy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(returnTo)}
                    className="rounded-md bg-[#f4f4ef] px-5 py-2.5 text-sm font-semibold text-[#424842] transition-colors hover:bg-[#ecece6]"
                  >
                    {t("modal.cancel")}
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={saveState === "saving"}
                    className="rounded-md bg-[#23422a] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                  >
                    {saveState === "saving"
                      ? locale === "zh-CN"
                        ? "正在导入..."
                        : "Importing..."
                      : t("modal.import")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildImportedRows(rows: EditablePreviewRow[]) {
  return Array.from({length: 6}, (_, rowIndex) =>
    Object.fromEntries(
      rows.map((row, fieldIndex) => [row.field, generateSampleValue(row, rowIndex, fieldIndex)]),
    ),
  );
}

function generateSampleValue(row: EditablePreviewRow, rowIndex: number, fieldIndex: number) {
  if (row.type === "Numeric") {
    const base = Number(row.sample.replace(/[^\d.-]/g, ""));
    return Number.isFinite(base) ? base + rowIndex * (fieldIndex + 1) : (rowIndex + 1) * 10;
  }

  if (row.type === "Date / Time") {
    const date = new Date(Date.parse(row.sample));
    if (!Number.isNaN(date.getTime())) {
      date.setHours(date.getHours() + rowIndex * 4);
      return date.toISOString().slice(0, 16).replace("T", " ");
    }
  }

  if (row.type === "Category") {
    return rowIndex === 0 ? row.sample : `${row.sample} ${rowIndex + 1}`;
  }

  return rowIndex === 0 ? row.sample : `${row.sample} ${rowIndex + 1}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SideRailItem({
  active = false,
  icon,
  children,
}: {
  active?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
        active ? "bg-[#e3e3de] font-semibold text-[#23422a]" : "text-[#424842] hover:bg-[#e8e8e3]"
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function FieldShell({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
        {label}
      </span>
      {children}
    </label>
  );
}
