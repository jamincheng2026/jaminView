"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowLeft, ExternalLink} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {defaultScreenConfig} from "@/lib/mocks/editor";
import {readEditorDraft, readImportedDatasets, type ScreenConfig} from "@/lib/editor-storage";
import {readProjectRecord} from "@/lib/project-store";
import {
  EDITOR_CANVAS_HEIGHT,
  EDITOR_CANVAS_WIDTH,
  editorDatasetSchemas,
  editorProject,
  editorWidgets,
  type EditorWidget,
} from "@/lib/mocks/editor";
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
  const [mapRouteStyle, setMapRouteStyle] = useState<"solid" | "dashed" | "pulse">("pulse");
  const [mapLabelStyle, setMapLabelStyle] = useState<"pill" | "minimal">("pill");
  const [mapSurfaceTone, setMapSurfaceTone] = useState<"soft" | "contrast">("soft");
  const [projectTitle, setProjectTitle] = useState(editorProject.name);
  const [screenConfig, setScreenConfig] = useState<ScreenConfig>(defaultScreenConfig);
  const [datasetDrafts, setDatasetDrafts] = useState<Record<string, {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]}>>({});
  const [importedDatasets, setImportedDatasets] = useState(() => readImportedDatasets(projectId));

  useEffect(() => {
    // Preview intentionally reads from the same local draft snapshot as the editor.
    const draft = readEditorDraft(projectId);
    if (draft) {
      if (draft.projectTitle?.trim()) {
        setProjectTitle(draft.projectTitle.trim());
      }
      setWidgets(draft.widgets);
      setScreenConfig(draft.screenConfig ?? defaultScreenConfig);
      setMapLabels(draft.mapLabels);
      setMap3dAxis(draft.map3dAxis);
      setMapZoom(draft.mapZoom);
      setMapTheme(draft.mapTheme ?? "emerald");
      setMapRouteDensity(draft.mapRouteDensity ?? "balanced");
      setMapMarkers(draft.mapMarkers ?? true);
      setMapGlow(draft.mapGlow ?? 72);
      setMapRouteStyle(draft.mapRouteStyle ?? "pulse");
      setMapLabelStyle(draft.mapLabelStyle ?? "pill");
      setMapSurfaceTone(draft.mapSurfaceTone ?? "soft");
      setDatasetDrafts(draft.datasetDrafts ?? {});
    }
    const projectRecord = readProjectRecord(projectId);
    if (!draft?.projectTitle && projectRecord?.name) {
      setProjectTitle(projectRecord.name);
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
  const canvasBackgroundStyle = useMemo(() => buildCanvasBackgroundStyle(screenConfig), [screenConfig]);

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
            <div className="text-xs text-white/55">{projectTitle}</div>
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
            <div className="dot-grid relative min-h-[720px] overflow-hidden border border-[#c2c8bf]/50" style={canvasBackgroundStyle}>
              {screenConfig.backgroundMode === "image" && screenConfig.backgroundImage ? (
                <div
                  className="pointer-events-none absolute inset-0 bg-[#07110d]"
                  style={{opacity: Math.max(0, Math.min(100, screenConfig.backgroundOverlay)) / 100}}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col p-5">
                {screenConfig.showHeader ? (
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        {screenConfig.showStatusBadge ? (
                          <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                            {screenConfig.statusBadgeLabel || editorProject.canvasLabel}
                          </Badge>
                        ) : null}
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                          {screenConfig.statusMetaLabel || t("live")}
                        </span>
                      </div>
                      <h1 className="mt-3 font-headline text-[28px] font-extrabold leading-tight tracking-tight text-[#23422a]">
                        {screenConfig.title}
                      </h1>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#727971]">
                        {screenConfig.subtitle}
                      </p>
                    </div>
                    {screenConfig.showTimestamp ? (
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <div className="text-[11px] font-bold font-mono text-[#1a1c19]">{screenConfig.timeText}</div>
                          <div className="text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.dateText}</div>
                        </div>
                        <div className="border-l border-[#c2c8bf]/40 pl-4">
                          <div className="text-[11px] font-bold text-[#1a1c19]">{screenConfig.rightMetaPrimary}</div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.rightMetaSecondary}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className="relative flex-1"
                  style={{width: `${EDITOR_CANVAS_WIDTH}px`, height: `${EDITOR_CANVAS_HEIGHT}px`}}
                >
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
                      mapRouteStyle={mapRouteStyle}
                      mapLabelStyle={mapLabelStyle}
                      mapSurfaceTone={mapSurfaceTone}
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

function buildCanvasBackgroundStyle(screenConfig: ScreenConfig) {
  if (screenConfig.backgroundMode === "image" && screenConfig.backgroundImage) {
    return {
      backgroundColor: screenConfig.backgroundColor,
      backgroundImage: `url(${screenConfig.backgroundImage})`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize:
        screenConfig.backgroundFit === "contain"
          ? "contain"
          : screenConfig.backgroundFit === "center"
            ? "auto"
            : "cover",
    } as const;
  }

  if (screenConfig.backgroundMode === "gradient") {
    return {
      backgroundColor: screenConfig.backgroundColor,
      backgroundImage: screenConfig.backgroundGradient,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    } as const;
  }

  return {
    backgroundColor: screenConfig.backgroundColor,
  } as const;
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
  mapRouteStyle,
  mapLabelStyle,
  mapSurfaceTone,
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
  mapRouteStyle: "solid" | "dashed" | "pulse";
  mapLabelStyle: "pill" | "minimal";
  mapSurfaceTone: "soft" | "contrast";
  dataset?: {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]};
}) {
  return (
    <div className="absolute text-left" style={editorWidgetPlacement(widget)}>
      <EditorCanvasWidget
        widget={widget}
        mapLabels={mapLabels}
        map3dAxis={map3dAxis}
        mapZoom={mapZoom}
        mapTheme={mapTheme}
        mapRouteDensity={mapRouteDensity}
        mapMarkers={mapMarkers}
        mapGlow={mapGlow}
        mapRouteStyle={mapRouteStyle}
        mapLabelStyle={mapLabelStyle}
        mapSurfaceTone={mapSurfaceTone}
        dataset={dataset}
      />
    </div>
  );
}
