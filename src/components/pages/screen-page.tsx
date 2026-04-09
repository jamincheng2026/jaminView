"use client";

import {startTransition, useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowLeft, Maximize, Minimize} from "lucide-react";

import {EditorV2CanvasStage} from "@/components/editor/editor-v2-canvas-stage";
import {Badge} from "@/components/ui/badge";
import {ScreenHeader} from "@/components/screen/screen-header";
import {ScreenStage} from "@/components/screen/screen-stage";
import {defaultScreenConfig} from "@/lib/mocks/editor";
import {
  applyDataPondToWidget,
  useEditorDataPondRuntime,
} from "@/lib/editor-v2-data-pond";
import {
  defaultEditorV2DataPondSettings,
  readEditorV2PublishedSnapshot,
  type EditorV2PublishedSnapshot,
} from "@/lib/editor-v2-storage";
import {buildEditorV2WorkspaceSummary} from "@/lib/editor-v2-workspace";
import {
  hasEditorV2RuntimeAction,
  isExternalEditorV2Href,
  resolveEditorV2FocusTargets,
  resolveEditorV2RuntimeHref,
} from "@/lib/editor-v2-widget-events";
import {
  readImportedDatasets,
  readPublishedSnapshot,
  type PublishedSnapshot,
  type ScreenConfig,
} from "@/lib/editor-storage";
import {readProjectRecord} from "@/lib/project-store";
import {
  editorDatasetSchemas,
  editorProject,
  type EditorWidget,
} from "@/lib/mocks/editor";
import type {Widget} from "@/packages/types";
import {
  EditorCanvasWidget,
  editorWidgetPlacementWithin,
} from "@/components/editor-legacy/editor-canvas-widgets";
import {
  hasWidgetRuntimeAction,
  isExternalWidgetHref,
  resolveWidgetEventHref,
  resolveWidgetFocusTargets,
  shouldTriggerWidgetEvent,
} from "@/lib/editor-widget-events";

export function ScreenPage({projectId}: {projectId: string}) {
  const t = useTranslations("Screen");
  const locale = useLocale();
  const router = useRouter();

  const [v2Snapshot, setV2Snapshot] = useState<EditorV2PublishedSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<PublishedSnapshot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [projectTitle, setProjectTitle] = useState(editorProject.name);
  const [widgets, setWidgets] = useState<EditorWidget[]>([]);
  const [screenConfig, setScreenConfig] = useState<ScreenConfig>(defaultScreenConfig);
  const [importedDatasets, setImportedDatasets] = useState(() => readImportedDatasets(projectId));
  const [datasetDrafts, setDatasetDrafts] = useState<Record<string, {fields: {field: string; type: string; sample: string; icon: string}[]; rows: Record<string, string | number>[];}>>({});
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const dataPondRuntimeMap = useEditorDataPondRuntime(
    v2Snapshot?.dataPonds ?? [],
    v2Snapshot?.dataPondSettings ?? defaultEditorV2DataPondSettings,
  );
  const hydratedV2Widgets = useMemo(
    () =>
      v2Snapshot?.widgets.map((widget) => applyDataPondToWidget(widget, dataPondRuntimeMap)) ?? [],
    [dataPondRuntimeMap, v2Snapshot],
  );
  const v2Summary = useMemo(
    () =>
      v2Snapshot
        ? buildEditorV2WorkspaceSummary({
            canvas: v2Snapshot.canvas,
            dataPondSettings: v2Snapshot.dataPondSettings,
            dataPonds: v2Snapshot.dataPonds,
            projectId: v2Snapshot.projectId,
            projectTitle: v2Snapshot.projectTitle,
            widgets: v2Snapshot.widgets,
          })
        : null,
    [v2Snapshot],
  );

  useEffect(() => {
    const nextV2Snapshot = readEditorV2PublishedSnapshot(projectId);
    const nextSnapshot = readPublishedSnapshot(projectId);
    const projectRecord = readProjectRecord(projectId);
    const nextImportedDatasets = readImportedDatasets(projectId);

    startTransition(() => {
      setV2Snapshot(nextV2Snapshot);
      setSnapshot(nextSnapshot);
      setImportedDatasets(nextImportedDatasets);

      if (projectRecord?.name) {
        setProjectTitle(projectRecord.name);
      }

      if (nextV2Snapshot) {
        setProjectTitle(nextV2Snapshot.projectTitle.trim() || projectRecord?.name || editorProject.name);
        return;
      }

      if (!nextSnapshot) return;

      if (nextSnapshot.draft.projectTitle?.trim()) {
        setProjectTitle(nextSnapshot.draft.projectTitle.trim());
      }
      setWidgets(nextSnapshot.draft.widgets);
      setScreenConfig(nextSnapshot.draft.screenConfig ?? defaultScreenConfig);
      setDatasetDrafts(nextSnapshot.draft.datasetDrafts ?? {});
    });
  }, [projectId]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleV2WidgetActivate = (widget: Widget) => {
    const focusTargets = resolveEditorV2FocusTargets(widget);
    if (focusTargets.length) {
      setActiveWidgetIds(focusTargets);
      return;
    }

    const href = resolveEditorV2RuntimeHref(widget, locale, projectId);
    if (!href) return;

    if (widget.events.openMode === "blank") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (isExternalEditorV2Href(href)) {
      window.location.assign(href);
      return;
    }

    router.push(href);
  };

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

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);
  const canvasBackgroundStyle = useMemo(() => buildCanvasBackgroundStyle(screenConfig), [screenConfig]);
  const immersiveMode = screenConfig.presentationMode === "immersive";
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

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;

    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  if (v2Snapshot) {
    return (
      <main className="flex min-h-screen flex-col bg-[#111714] text-white">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${locale}/projects`)}
              className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="text-sm font-semibold">{t("title")}</div>
              <div className="text-xs text-white/55">{v2Snapshot.projectTitle}</div>
              {v2Summary ? (
                <div className="mt-1 text-[11px] text-white/45">
                  组件 {v2Summary.widgetCount} / 数据池 {v2Summary.dataPondCount} / 画布 {v2Summary.canvasLabel}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span>{isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}</span>
            </button>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{t("published")}</div>
              <div className="mt-1 text-xs text-white/70">
                {new Date(v2Snapshot.publishedAt).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-US")}
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(36,66,42,0.35),transparent_28%),linear-gradient(180deg,#111714_0%,#0b100e_100%)] p-10">
          <div className="w-[1280px] overflow-hidden rounded-[24px] border border-white/10 bg-[#fafaf5] shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
            <div className="border-b border-[#c2c8bf]/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                    {`${v2Snapshot.canvas.width} × ${v2Snapshot.canvas.height}`}
                  </Badge>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                    {t("readOnly")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                    {t("published")}
                  </div>
                  {v2Summary ? (
                    <div className="mt-1 text-[11px] text-[#727971]">
                      隐藏 {v2Summary.hiddenWidgetCount} / 动态绑定 {v2Summary.dataBoundWidgetCount}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-[#fafaf5] p-5">
              <div className="relative flex min-h-[720px] items-center justify-center overflow-auto rounded-[28px] border border-[#c2c8bf]/50 bg-[radial-gradient(circle_at_top,rgba(36,66,42,0.08),transparent_28%),linear-gradient(180deg,#f7f8f2_0%,#eef2ea_100%)] p-8">
                <EditorV2CanvasStage
                  widgets={hydratedV2Widgets}
                  canvas={{
                    filters: v2Snapshot.canvas.filters,
                    width: v2Snapshot.canvas.width,
                    height: v2Snapshot.canvas.height,
                    showSafeArea: v2Snapshot.canvas.showSafeArea,
                  }}
                  activeWidgetIds={activeWidgetIds}
                  onWidgetActivate={(widget) => {
                    if (!hasEditorV2RuntimeAction(widget)) return;
                    handleV2WidgetActivate(widget);
                  }}
                  emptyTitle="展示画布为空"
                  emptyDescription="当前项目还没有发布任何组件，请先返回编辑器完成发布。"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#111714] text-white">
      {!immersiveMode ? (
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${locale}/projects`)}
              className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="text-sm font-semibold">{t("title")}</div>
              <div className="text-xs text-white/55">{projectTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span>{isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}</span>
            </button>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{t("published")}</div>
              <div className="mt-1 text-xs text-white/70">
                {snapshot?.publishedAt
                  ? new Date(snapshot.publishedAt).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-US")
                  : t("missingSnapshot")}
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <section className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(36,66,42,0.35),transparent_28%),linear-gradient(180deg,#111714_0%,#0b100e_100%)] p-10">
        <div
          className={`w-[1280px] overflow-hidden bg-[#fafaf5] shadow-[0_40px_90px_rgba(0,0,0,0.45)] ${
            immersiveMode ? "relative rounded-[10px] border border-white/8" : "rounded-[24px] border border-white/10"
          }`}
        >
          {immersiveMode ? (
            <button
              onClick={toggleFullscreen}
              className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#c2c8bf]/50 bg-[#fafaf5]/88 px-3 py-2 text-[11px] font-semibold text-[#23422a] shadow-[0_10px_30px_rgba(26,28,25,0.08)] backdrop-blur"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span>{isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}</span>
            </button>
          ) : (
            <div className="border-b border-[#c2c8bf]/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                    {currentCanvasLabel}
                  </Badge>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                    {t("readOnly")}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                  {t("published")}
                </span>
              </div>
            </div>
          )}

          <div className={`bg-[#fafaf5] ${immersiveMode ? "p-3" : "p-5"}`}>
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
                      fallbackMetaLabel={t("published")}
                    />
                  ) : null}

                  <div
                    className="relative flex-1"
                    style={{width: `${currentCanvasWidth}px`, height: `${currentCanvasHeight}px`}}
                  >
                    {visibleWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="absolute"
                        style={editorWidgetPlacementWithin(widget, currentCanvasWidth, currentCanvasHeight)}
                      >
                        <EditorCanvasWidget
                          widget={widget}
                          mapLabels={snapshot?.draft.mapLabels ?? true}
                          map3dAxis={snapshot?.draft.map3dAxis ?? true}
                          mapZoom={snapshot?.draft.mapZoom ?? "2.4x"}
                          mapTheme={snapshot?.draft.mapTheme ?? "emerald"}
                          mapRouteDensity={snapshot?.draft.mapRouteDensity ?? "balanced"}
                          mapMarkers={snapshot?.draft.mapMarkers ?? true}
                        mapGlow={snapshot?.draft.mapGlow ?? 72}
                        mapRouteStyle={snapshot?.draft.mapRouteStyle ?? "pulse"}
                        mapLabelStyle={snapshot?.draft.mapLabelStyle ?? "pill"}
                        mapSurfaceTone={snapshot?.draft.mapSurfaceTone ?? "soft"}
                        mapPointScale={snapshot?.draft.mapPointScale ?? 100}
                        mapRouteWidth={snapshot?.draft.mapRouteWidth ?? 100}
                        mapLandOpacity={snapshot?.draft.mapLandOpacity ?? 96}
                        mapLabelOpacity={snapshot?.draft.mapLabelOpacity ?? 92}
                          dataset={datasetLookup[widget.dataset]}
                          selected={activeWidgetIds.includes(widget.id)}
                          onActivate={
                            hasWidgetRuntimeAction(widget, locale, projectId)
                              ? () => handleWidgetActivate(widget)
                              : undefined
                          }
                        />
                      </div>
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
