"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowLeft, ExternalLink} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {readEditorDraft, readImportedDatasets} from "@/lib/editor-storage";
import {editorDatasetSchemas, editorProject, editorWidgets, type EditorWidget} from "@/lib/mocks/editor";
import {
  EditorCanvasWidget,
  editorWidgetPlacement,
} from "@/components/editor/editor-canvas-widgets";

export function PreviewPage({projectId}: {projectId: string}) {
  const t = useTranslations("Preview");
  const locale = useLocale();
  const router = useRouter();
  const [widgets, setWidgets] = useState<EditorWidget[]>(editorWidgets);
  const [mapLabels, setMapLabels] = useState(true);
  const [map3dAxis, setMap3dAxis] = useState(true);
  const [mapZoom, setMapZoom] = useState("2.4x");
  const [mapTheme, setMapTheme] = useState<"emerald" | "midnight" | "amber">("emerald");
  const [mapRouteDensity, setMapRouteDensity] = useState<"low" | "balanced" | "high">("balanced");
  const [mapMarkers, setMapMarkers] = useState(true);
  const [mapGlow, setMapGlow] = useState(72);
  const [datasetDrafts, setDatasetDrafts] = useState<Record<string, {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]}>>({});
  const [importedDatasets, setImportedDatasets] = useState(() => readImportedDatasets(projectId));

  useEffect(() => {
    // Preview intentionally reads from the same local draft snapshot as the editor.
    const draft = readEditorDraft(projectId);
    if (draft) {
      setWidgets(draft.widgets);
      setMapLabels(draft.mapLabels);
      setMap3dAxis(draft.map3dAxis);
      setMapZoom(draft.mapZoom);
      setMapTheme(draft.mapTheme ?? "emerald");
      setMapRouteDensity(draft.mapRouteDensity ?? "balanced");
      setMapMarkers(draft.mapMarkers ?? true);
      setMapGlow(draft.mapGlow ?? 72);
      setDatasetDrafts(draft.datasetDrafts ?? {});
    }
    setImportedDatasets(readImportedDatasets(projectId));
  }, [projectId]);

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);
  const datasetLookup = useMemo(
    () =>
      Object.fromEntries([
        ...editorDatasetSchemas.map((dataset) => [
          dataset.name,
          {
            fields: datasetDrafts[dataset.name]?.fields ?? dataset.fields,
            rows: datasetDrafts[dataset.name]?.rows ?? dataset.rows,
          },
        ]),
        ...importedDatasets.map((dataset) => [dataset.name, {fields: dataset.fields, rows: dataset.rows}]),
      ]),
    [datasetDrafts, importedDatasets],
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#111714] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/editor/${projectId}`)}
            className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-sm font-semibold">{t("title")}</div>
            <div className="text-xs text-white/55">{editorProject.name}</div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/publish-success/${projectId}`)}
          className="inline-flex items-center gap-2 rounded-md bg-[#23422a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#31583b]"
        >
          <span>{t("publish")}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </header>

      <section className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(36,66,42,0.35),transparent_28%),linear-gradient(180deg,#111714_0%,#0b100e_100%)] p-10">
        <div className="w-[1280px] overflow-hidden rounded-[24px] border border-white/10 bg-[#fafaf5] shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-[#c2c8bf]/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                  {editorProject.canvasLabel}
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                  {t("live")}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                {t("readOnly")}
              </span>
            </div>
          </div>

          <div className="bg-[#fafaf5] p-5">
            <div className="dot-grid relative min-h-[720px] overflow-hidden border border-[#c2c8bf]/50 bg-[#fafaf5]">
              <div className="absolute inset-0 flex flex-col p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="font-headline text-[28px] font-extrabold leading-tight tracking-tight text-[#23422a]">
                      {locale === "zh-CN" ? "全球物流与供应链实时中心" : "Global Logistics & Supply Chain Real-time Center"}
                    </h1>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#727971]">
                      {locale === "zh-CN" ? "实时情报流 · Q4 监控阶段" : "Live Intelligence Feed · Q4 Monitoring Phase"}
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 auto-rows-[84px] grid-cols-12 gap-3">
                  {visibleWidgets.map((widget) => (
                    <PreviewWidget
                      key={widget.id}
                      widget={widget}
                      mapLabels={mapLabels}
                      map3dAxis={map3dAxis}
                      mapZoom={mapZoom}
                      mapTheme={mapTheme}
                      mapRouteDensity={mapRouteDensity}
                      mapMarkers={mapMarkers}
                      mapGlow={mapGlow}
                      dataset={datasetLookup[widget.dataset]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewWidget({
  widget,
  mapLabels,
  map3dAxis,
  mapZoom,
  mapTheme,
  mapRouteDensity,
  mapMarkers,
  mapGlow,
  dataset,
}: {
  widget: EditorWidget;
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme: "emerald" | "midnight" | "amber";
  mapRouteDensity: "low" | "balanced" | "high";
  mapMarkers: boolean;
  mapGlow: number;
  dataset?: {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]};
}) {
  return (
    <div className="text-left" style={editorWidgetPlacement(widget)}>
      <EditorCanvasWidget
        widget={widget}
        mapLabels={mapLabels}
        map3dAxis={map3dAxis}
        mapZoom={mapZoom}
        mapTheme={mapTheme}
        mapRouteDensity={mapRouteDensity}
        mapMarkers={mapMarkers}
        mapGlow={mapGlow}
        dataset={dataset}
      />
    </div>
  );
}
