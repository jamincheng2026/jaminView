"use client";

import {startTransition, useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowLeft, ExternalLink} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {ScreenHeader} from "@/components/screen/screen-header";
import {ScreenStage} from "@/components/screen/screen-stage";
import {defaultScreenConfig} from "@/lib/mocks/editor";
import {readEditorDraft, readImportedDatasets, type ScreenConfig} from "@/lib/editor-storage";
import {readProjectRecord} from "@/lib/project-store";
import {
  editorDatasetSchemas,
  editorProject,
  editorWidgets,
  type EditorWidget,
} from "@/lib/mocks/editor";
import {
  EditorCanvasWidget,
  editorWidgetPlacementWithin,
} from "@/components/editor/editor-canvas-widgets";
import {
  hasWidgetRuntimeAction,
  isExternalWidgetHref,
  resolveWidgetEventHref,
  resolveWidgetFocusTargets,
  shouldTriggerWidgetEvent,
} from "@/lib/editor-widget-events";

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
  const [mapPointScale, setMapPointScale] = useState(100);
  const [mapRouteWidth, setMapRouteWidth] = useState(100);
  const [mapLandOpacity, setMapLandOpacity] = useState(96);
  const [mapLabelOpacity, setMapLabelOpacity] = useState(92);
  const [projectTitle, setProjectTitle] = useState(editorProject.name);
  const [screenConfig, setScreenConfig] = useState<ScreenConfig>(defaultScreenConfig);
  const [datasetDrafts, setDatasetDrafts] = useState<Record<string, {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]}>>({});
  const [importedDatasets, setImportedDatasets] = useState(() => readImportedDatasets(projectId));
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);

  useEffect(() => {
    // Preview intentionally reads from the same local draft snapshot as the editor.
    const draft = readEditorDraft(projectId);
    const projectRecord = readProjectRecord(projectId);
    const nextImportedDatasets = readImportedDatasets(projectId);

    startTransition(() => {
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
        setMapPointScale(draft.mapPointScale ?? 100);
        setMapRouteWidth(draft.mapRouteWidth ?? 100);
        setMapLandOpacity(draft.mapLandOpacity ?? 96);
        setMapLabelOpacity(draft.mapLabelOpacity ?? 92);
        setDatasetDrafts(draft.datasetDrafts ?? {});
      }
      if (!draft?.projectTitle && projectRecord?.name) {
        setProjectTitle(projectRecord.name);
      }
      setImportedDatasets(nextImportedDatasets);
    });
  }, [projectId]);

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);
  const currentCanvasWidth = screenConfig.canvasWidth || 1920;
  const currentCanvasHeight = screenConfig.canvasHeight || 1080;
  const currentCanvasLabel = `${currentCanvasWidth} × ${currentCanvasHeight}`;
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
  const handleWidgetActivate = (widget: EditorWidget) => {
    if (!shouldTriggerWidgetEvent(widget, datasetLookup[widget.dataset])) return;

    const focusTargets = resolveWidgetFocusTargets(widget);
    if (focusTargets.length) {
      setActiveWidgetIds(focusTargets);
      return;
    }

    const href = resolveWidgetEventHref(widget, locale, projectId);
    if (!href) return;

    if (widget.eventOpenMode === "blank") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (isExternalWidgetHref(href)) {
      window.location.assign(href);
      return;
    }

    router.push(href);
  };

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
                  {currentCanvasLabel}
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
              <ScreenStage screenConfig={screenConfig} viewportWidth={1160} viewportHeight={720}>
                <div className="absolute inset-0 flex flex-col">
                  {screenConfig.showHeader ? (
                    <ScreenHeader
                      screenConfig={screenConfig}
                      canvasLabel={currentCanvasLabel}
                      fallbackMetaLabel={t("live")}
                    />
                  ) : null}

                  <div
                    className="relative flex-1"
                    style={{width: `${currentCanvasWidth}px`, height: `${currentCanvasHeight}px`}}
                  >
                    {visibleWidgets.map((widget) => (
                      <PreviewWidget
                        key={widget.id}
                        widget={widget}
                        canvasWidth={currentCanvasWidth}
                        canvasHeight={currentCanvasHeight}
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
                        mapPointScale={mapPointScale}
                        mapRouteWidth={mapRouteWidth}
                        mapLandOpacity={mapLandOpacity}
                        mapLabelOpacity={mapLabelOpacity}
                        dataset={datasetLookup[widget.dataset]}
                        selected={activeWidgetIds.includes(widget.id)}
                        onActivate={
                          hasWidgetRuntimeAction(widget, locale, projectId)
                            ? () => handleWidgetActivate(widget)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </ScreenStage>
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
  canvasWidth,
  canvasHeight,
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
  mapPointScale,
  mapRouteWidth,
  mapLandOpacity,
  mapLabelOpacity,
  dataset,
  selected,
  onActivate,
}: {
  widget: EditorWidget;
  canvasWidth: number;
  canvasHeight: number;
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
  mapPointScale: number;
  mapRouteWidth: number;
  mapLandOpacity: number;
  mapLabelOpacity: number;
  dataset?: {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[]};
  selected?: boolean;
  onActivate?: () => void;
}) {
  return (
    <div className="absolute text-left" style={editorWidgetPlacementWithin(widget, canvasWidth, canvasHeight)}>
      <EditorCanvasWidget
        widget={widget}
        selected={selected}
        onActivate={onActivate}
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
        mapPointScale={mapPointScale}
        mapRouteWidth={mapRouteWidth}
        mapLandOpacity={mapLandOpacity}
        mapLabelOpacity={mapLabelOpacity}
        dataset={dataset}
      />
    </div>
  );
}
