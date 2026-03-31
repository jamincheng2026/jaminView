"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Database,
  Globe2,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Layers3,
  LineChart,
  PieChart,
  PlusCircle,
  Redo2,
  Settings,
  Table2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {EditorDataPanel, type DatasetPanelItem} from "@/components/editor/editor-data-panel";
import {EditorField, EditorSection} from "@/components/editor/editor-primitives";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Tabs} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {
  EditorCanvasWidget,
  editorWidgetPlacement,
} from "@/components/editor/editor-canvas-widgets";
import {
  editorDatasetSchemas,
  editorDatasets as baseEditorDatasets,
  editorProject,
  editorTemplates,
  editorToolGroups,
  editorWidgets,
  type EditorWidget,
} from "@/lib/mocks/editor";
import {
  type DatasetRow,
  readEditorDraft,
  readImportedDatasets,
  saveEditorDraft,
  savePublishedSnapshot,
  writeImportedDatasets,
  type EditorDraft,
  type ImportedDataset,
} from "@/lib/editor-storage";

const editorControlClass =
  "h-8 rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] text-[#1a1c19] shadow-none focus:border-[#45664b]";

type StarterDatasetDraft = {
  fields: DatasetPanelItem["fields"];
  rows: DatasetRow[];
};

type RailTab = "components" | "layers" | "data" | "templates";
type CanvasView = "grid" | "safe";
type EditorSnapshot = {
  widgets: EditorWidget[];
  selectedWidgetId: string;
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme: "emerald" | "midnight" | "amber";
  mapRouteDensity: "low" | "balanced" | "high";
  mapMarkers: boolean;
  mapGlow: number;
  canvasView: CanvasView;
};

type DragState = {
  widgetId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  snapshot: EditorSnapshot;
};

export function EditorWorkbench({projectId}: {projectId: string}) {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [railTab, setRailTab] = useState<RailTab>("components");
  const [widgets, setWidgets] = useState<EditorWidget[]>(editorWidgets);
  const [selectedWidgetId, setSelectedWidgetId] = useState(editorWidgets[3]?.id ?? editorWidgets[0].id);
  const [zoom, setZoom] = useState(0.85);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [mapLabels, setMapLabels] = useState(true);
  const [map3dAxis, setMap3dAxis] = useState(true);
  const [mapZoom, setMapZoom] = useState("2.4x");
  const [mapTheme, setMapTheme] = useState<"emerald" | "midnight" | "amber">("emerald");
  const [mapRouteDensity, setMapRouteDensity] = useState<"low" | "balanced" | "high">("balanced");
  const [mapMarkers, setMapMarkers] = useState(true);
  const [mapGlow, setMapGlow] = useState(72);
  const [canvasView, setCanvasView] = useState<CanvasView>("grid");
  const [importedDatasets, setImportedDatasets] = useState<ImportedDataset[]>([]);
  const [starterDatasetDrafts, setStarterDatasetDrafts] = useState<Record<string, StarterDatasetDraft>>(() =>
    Object.fromEntries(
      editorDatasetSchemas.map((dataset) => [
        dataset.name,
        {
          fields: dataset.fields.map((field) => ({...field})),
          rows: dataset.rows.map((row) => ({...row})),
        },
      ]),
    ),
  );
  const [selectedDatasetName, setSelectedDatasetName] = useState(editorDatasetSchemas[0]?.name ?? baseEditorDatasets[0]?.name ?? "");
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [future, setFuture] = useState<EditorSnapshot[]>([]);
  const canvasGridRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const widgetsRef = useRef<EditorWidget[]>(editorWidgets);

  useEffect(() => {
    // Restore the last local draft so the editor behaves like a real working file.
    const draft = readEditorDraft(projectId);
    if (draft) {
      setWidgets(draft.widgets);
      setSelectedWidgetId(draft.selectedWidgetId);
      setZoom(draft.zoom);
      setMapLabels(draft.mapLabels);
      setMap3dAxis(draft.map3dAxis);
      setMapZoom(draft.mapZoom);
      setMapTheme(draft.mapTheme ?? "emerald");
      setMapRouteDensity(draft.mapRouteDensity ?? "balanced");
      setMapMarkers(draft.mapMarkers ?? true);
      setMapGlow(draft.mapGlow ?? 72);
      if (draft.datasetDrafts) {
        setStarterDatasetDrafts(draft.datasetDrafts);
      }
      setSaveState("saved");
    }

    setImportedDatasets(readImportedDatasets(projectId));
  }, [projectId]);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    // Keep dataset lists fresh when the import page writes back into localStorage.
    const onStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.includes(projectId)) return;
      if (event.key === `jaminview:imported-datasets:${projectId}`) {
        setImportedDatasets(readImportedDatasets(projectId));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [projectId]);

  const datasets = useMemo(
    () => [
      ...baseEditorDatasets,
      ...importedDatasets.map((dataset) => ({
        name: dataset.name,
        records: `${dataset.records} rows`,
      })),
    ],
    [importedDatasets],
  );

  const datasetPanelItems = useMemo<DatasetPanelItem[]>(
    () => [
      ...editorDatasetSchemas.map((dataset) => ({
        name: dataset.name,
        records: dataset.records,
        source: "starter" as const,
        fields: starterDatasetDrafts[dataset.name]?.fields ?? dataset.fields,
        rows: starterDatasetDrafts[dataset.name]?.rows ?? dataset.rows,
      })),
      ...importedDatasets.map((dataset) => ({
        name: dataset.name,
        records: `${dataset.records} rows`,
        source: "imported" as const,
        fields: dataset.fields,
        rows: dataset.rows,
      })),
    ],
    [importedDatasets, starterDatasetDrafts],
  );

  const selectedWidget = useMemo(
    () => widgets.find((widget) => widget.id === selectedWidgetId) ?? widgets[0],
    [selectedWidgetId, widgets],
  );

  const selectedDatasetFields = useMemo(
    () => datasetPanelItems.find((dataset) => dataset.name === selectedWidget.dataset)?.fields ?? [],
    [datasetPanelItems, selectedWidget.dataset],
  );

  const datasetLookup = useMemo(
    () =>
      Object.fromEntries(
        datasetPanelItems.map((dataset) => [dataset.name, {fields: dataset.fields, rows: dataset.rows}]),
      ),
    [datasetPanelItems],
  );

  const defaultFieldMap = useMemo(
    () =>
      selectedDatasetFields
        .slice(0, 4)
        .map((field) => `${field.field} -> ${suggestFieldAlias(field.field)}`)
        .join("\n"),
    [selectedDatasetFields],
  );

  const opacityPercent = String(Math.round((selectedWidget.opacity ?? 1) * 100));
  const strokeValue = selectedWidget.stroke ?? "none";

  useEffect(() => {
    if (selectedWidget?.dataset) {
      setSelectedDatasetName(selectedWidget.dataset);
    }
  }, [selectedWidget]);

  const visibleWidgets = widgets.filter((widget) => widget.visible);

  const captureSnapshot = (): EditorSnapshot => ({
    widgets: widgets.map((widget) => ({...widget})),
    selectedWidgetId,
    mapLabels,
    map3dAxis,
    mapZoom,
    mapTheme,
    mapRouteDensity,
    mapMarkers,
    mapGlow,
    canvasView,
  });

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setWidgets(snapshot.widgets.map((widget) => ({...widget})));
    setSelectedWidgetId(snapshot.selectedWidgetId);
    setMapLabels(snapshot.mapLabels);
    setMap3dAxis(snapshot.map3dAxis);
    setMapZoom(snapshot.mapZoom);
    setMapTheme(snapshot.mapTheme);
    setMapRouteDensity(snapshot.mapRouteDensity);
    setMapMarkers(snapshot.mapMarkers);
    setMapGlow(snapshot.mapGlow);
    setCanvasView(snapshot.canvasView);
  };

  const commitSnapshot = (updater: (snapshot: EditorSnapshot) => EditorSnapshot) => {
    const current = captureSnapshot();
    const next = updater(current);
    setHistory((prev) => [...prev, current]);
    setFuture([]);
    restoreSnapshot(next);
    setSaveState("dirty");
  };

  const handleWidgetPatch = (patch: Partial<EditorWidget>) => {
    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: snapshot.widgets.map((widget) =>
        widget.id === snapshot.selectedWidgetId
          ? {
              ...widget,
              ...patch,
            }
          : widget,
      ),
    }));
  };

  // Build a serializable draft snapshot that preview/publish can consume too.
  const buildDraft = (): EditorDraft => ({
    widgets,
    selectedWidgetId,
    zoom,
    mapLabels,
    map3dAxis,
    mapZoom,
    mapTheme,
    mapRouteDensity,
    mapMarkers,
    mapGlow,
    datasetDrafts: starterDatasetDrafts,
    updatedAt: new Date().toISOString(),
  });

  const handleSave = (next?: () => void) => {
    setSaveState("saving");
    const payload = buildDraft();
    saveEditorDraft(projectId, payload);
    window.setTimeout(() => {
      setSaveState("saved");
      next?.();
    }, 240);
  };

  const handlePreview = () => {
    handleSave(() => {
      router.push(`/${locale}/preview/${projectId}`);
    });
  };

  const handlePublish = () => {
    handleSave(() => {
      savePublishedSnapshot(projectId, buildDraft());
      router.push(`/${locale}/publish-success/${projectId}`);
    });
  };

  const openDataImport = () => {
    const returnTo = encodeURIComponent(pathname);
    router.push(`/${locale}/data-import?projectId=${projectId}&returnTo=${returnTo}`);
  };

  const handleZoomDelta = (delta: number) => {
    setZoom((value) => Math.min(1.2, Math.max(0.55, Number((value + delta).toFixed(2)))));
  };

  const addWidgetFromPalette = (name: string) => {
    const type = resolveWidgetType(name);
    const nextId = `${type}-${Date.now()}`;
    const nextWidget: EditorWidget = {
      id: nextId,
      type,
      title: name,
      x: 9,
      y: 4,
      width: type === "table" ? 12 : type === "map" ? 6 : type === "image" ? 4 : type === "text" ? 4 : 3,
      height: type === "table" ? 2 : type === "map" ? 5 : type === "image" ? 3 : type === "text" ? 2 : 1,
      dataset: datasets[0]?.name ?? "logistics_dump_v2_final.csv",
      fill: type === "map" ? "#20302a" : type === "image" ? "#eef0ea" : "#fafaf5",
      visible: true,
      accent: type === "metric" ? "#23422a" : "#406840",
      value: type === "metric" ? "128" : undefined,
      hint:
        type === "metric"
          ? "+1.8%"
          : type === "text"
            ? locale === "zh-CN"
              ? "将运营摘要、说明文案或结论放在这里。"
              : "Place your operational summary or insight here."
            : type === "image"
              ? locale === "zh-CN"
                ? "使用图片组件承接封面或品牌素材"
                : "Use the image block for hero art or branded media"
              : undefined,
      stroke: "none",
      fieldMap: undefined,
    };

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: [...snapshot.widgets, nextWidget],
      selectedWidgetId: nextId,
    }));
    setSaveState("dirty");
    setRailTab("layers");
  };

  const duplicateSelectedWidget = () => {
    const cloned: EditorWidget = {
      ...selectedWidget,
      id: `${selectedWidget.type}-${Date.now()}`,
      title: `${selectedWidget.title} Copy`,
      x: Math.min(selectedWidget.x + 1, 9),
      y: Math.min(selectedWidget.y + 1, 5),
    };

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: [...snapshot.widgets, cloned],
      selectedWidgetId: cloned.id,
    }));
  };

  const deleteSelectedWidget = () => {
    if (widgets.length <= 1) return;
    commitSnapshot((snapshot) => {
      const nextWidgets = snapshot.widgets.filter((widget) => widget.id !== snapshot.selectedWidgetId);
      return {
        ...snapshot,
        widgets: nextWidgets,
        selectedWidgetId: nextWidgets[0]?.id ?? snapshot.selectedWidgetId,
      };
    });
  };

  const handleUndo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    const current = captureSnapshot();
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [current, ...prev]);
    restoreSnapshot(previous);
    setSaveState("dirty");
  };

  const handleRedo = () => {
    if (!future.length) return;
    const next = future[0];
    const current = captureSnapshot();
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, current]);
    restoreSnapshot(next);
    setSaveState("dirty");
  };

  const handleDatasetCardClick = (datasetName: string) => {
    handleWidgetPatch({dataset: datasetName});
  };

  const handleDatasetFieldPatch = (
    datasetName: string,
    fieldIndex: number,
    patch: Partial<ImportedDataset["fields"][number]>,
  ) => {
    const importedMatch = importedDatasets.find((dataset) => dataset.name === datasetName);

    if (importedMatch) {
      const nextImported = importedDatasets.map((dataset) =>
        dataset.name === datasetName ? patchDatasetField(dataset, fieldIndex, patch) : dataset,
      );

      setImportedDatasets(nextImported);
      writeImportedDatasets(projectId, nextImported);
      setSaveState("dirty");
      return;
    }

    setStarterDatasetDrafts((current) => ({
      ...current,
      [datasetName]: patchDatasetField(
        current[datasetName] ?? {fields: [], rows: []},
        fieldIndex,
        patch,
      ),
    }));
    setSaveState("dirty");
  };

  const handleDatasetRowPatch = (datasetName: string, rowIndex: number, fieldName: string, value: string) => {
    const importedMatch = importedDatasets.find((dataset) => dataset.name === datasetName);

    if (importedMatch) {
      const nextImported = importedDatasets.map((dataset) =>
        dataset.name === datasetName
          ? {
              ...dataset,
              rows: dataset.rows.map((row, currentIndex) =>
                currentIndex === rowIndex
                  ? {
                      ...row,
                      [fieldName]: value,
                    }
                  : row,
              ),
            }
          : dataset,
      );

      setImportedDatasets(nextImported);
      writeImportedDatasets(projectId, nextImported);
      setSaveState("dirty");
      return;
    }

    setStarterDatasetDrafts((current) => ({
      ...current,
      [datasetName]: {
        ...(current[datasetName] ?? {fields: [], rows: []}),
        rows: (current[datasetName]?.rows ?? []).map((row, currentIndex) =>
          currentIndex === rowIndex
            ? {
                ...row,
                [fieldName]: value,
              }
            : row,
        ),
      },
    }));
    setSaveState("dirty");
  };

  const stopWidgetDrag = () => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    dragStateRef.current = null;

    const draggedWidget = widgetsRef.current.find((widget) => widget.id === dragState.widgetId);
    if (!draggedWidget) return;

    if (draggedWidget.x === dragState.originX && draggedWidget.y === dragState.originY) return;

    setHistory((prev) => [...prev, dragState.snapshot]);
    setFuture([]);
    setSaveState("dirty");
  };

  const handleWidgetPointerDown = (widgetId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const draggedWidget = widgets.find((widget) => widget.id === widgetId);
    const gridRect = canvasGridRef.current?.getBoundingClientRect();
    if (!draggedWidget || !gridRect) return;

    event.preventDefault();
    setSelectedWidgetId(widgetId);

    dragStateRef.current = {
      widgetId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: draggedWidget.x,
      originY: draggedWidget.y,
      snapshot: captureSnapshot(),
    };

    const gap = 12;
    const rowHeight = 78;
    const colWidth = (gridRect.width - gap * 11) / 12;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const activeDrag = dragStateRef.current;
      if (!activeDrag) return;

      const nextWidget = widgetsRef.current.find((widget) => widget.id === activeDrag.widgetId);
      if (!nextWidget) return;

      const deltaX = (moveEvent.clientX - activeDrag.startClientX) / zoom;
      const deltaY = (moveEvent.clientY - activeDrag.startClientY) / zoom;
      const nextX = clamp(Math.round(activeDrag.originX + deltaX / (colWidth + gap)), 0, Math.max(0, 12 - nextWidget.width));
      const nextY = Math.max(0, Math.round(activeDrag.originY + deltaY / (rowHeight + gap)));

      setWidgets((current) =>
        current.map((widget) =>
          widget.id === activeDrag.widgetId
            ? {
                ...widget,
                x: nextX,
                y: nextY,
              }
            : widget,
        ),
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      stopWidgetDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const applyTemplatePreset = (templateId: string) => {
    commitSnapshot((snapshot) => {
      const nextWidgets = snapshot.widgets.map((widget) => {
        if (templateId === "sales-atlas") {
          if (widget.id === "active-vessels") return {...widget, title: locale === "zh-CN" ? "活跃商机" : "Active Deals", value: "328", hint: "+9.1%", accent: "#23422a"};
          if (widget.id === "world-map") return {...widget, title: locale === "zh-CN" ? "区域销售热力" : "Regional Sales Heat", hint: locale === "zh-CN" ? "按销售区域聚合" : "Aggregated by sales territory"};
          if (widget.id === "fleet-table") return {...widget, title: locale === "zh-CN" ? "客户列表" : "Account Table", hint: locale === "zh-CN" ? "重点客户跟进状态" : "Priority account follow-up"};
        }

        if (templateId === "city-monitor") {
          if (widget.id === "world-map") return {...widget, title: locale === "zh-CN" ? "城市监控地图" : "City Monitoring Map", hint: locale === "zh-CN" ? "事件、路网与告警图层" : "Events, traffic and alert layers"};
          if (widget.id === "delayed-shipments") return {...widget, title: locale === "zh-CN" ? "待处理告警" : "Pending Alerts", value: "19", hint: locale === "zh-CN" ? "桥梁区摄像头离线" : "Bridge camera offline"};
        }

        return widget;
      });

      return {
        ...snapshot,
        widgets: nextWidgets,
      };
    });
  };

  const saveLabel =
    saveState === "saved"
      ? t("topbar.saved")
      : saveState === "saving"
        ? (locale === "zh-CN" ? "正在保存..." : "Saving...")
        : (locale === "zh-CN" ? "有未保存修改" : "Unsaved changes");

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#fafaf5] text-[#1a1c19]">
      <header className="flex h-14 items-center justify-between border-b border-[#e3e3de]/70 bg-[#fafaf5] px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/${locale}/projects`)} className="rounded-md p-2 transition-colors hover:bg-[#e8e8e3]">
            <ArrowLeft className="h-4 w-4 text-[#23422a]" strokeWidth={2.2} />
          </button>
          <div className="flex flex-col">
            <span className="font-headline text-sm font-bold tracking-tight text-[#23422a]">
              {t("topbar.projectPrefix")} {editorProject.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#424842]">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  saveState === "saved" ? "bg-[#23422a]" : saveState === "saving" ? "bg-[#d6a448]" : "bg-[#ba1a1a]"
                }`}
              />
              {saveLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-4 flex items-center rounded bg-[#f4f4ef] p-0.5">
            <ToolIconButton icon={<Undo2 className="h-4 w-4" />} onClick={handleUndo} disabled={!history.length} />
            <ToolIconButton icon={<Redo2 className="h-4 w-4" />} onClick={handleRedo} disabled={!future.length} />
            <div className="mx-1 h-4 w-px bg-[#c2c8bf]/40" />
            <ToolIconButton icon={<ZoomOut className="h-4 w-4" />} onClick={() => handleZoomDelta(-0.05)} />
            <span className="px-2 text-[11px] font-mono">{Math.round(zoom * 100)}%</span>
            <ToolIconButton icon={<ZoomIn className="h-4 w-4" />} onClick={() => handleZoomDelta(0.05)} />
          </div>

          <button
            onClick={handlePreview}
            className="rounded px-4 py-1.5 text-sm font-medium text-[#23422a] transition-colors hover:bg-[#e8e8e3]"
          >
            {t("topbar.preview")}
          </button>
          <button
            onClick={handlePublish}
            className="rounded bg-[#23422a] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a5a40] active:scale-[0.98]"
          >
            {t("topbar.publish")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="flex w-20 shrink-0 flex-col items-center border-r border-[#c2c8bf]/20 bg-[#f4f4ef] py-4">
          <div className="flex w-full flex-col items-center gap-6">
            <RailItem active={railTab === "components"} icon={<LayoutGrid className="h-4 w-4" />} label={t("rail.components")} onClick={() => setRailTab("components")} />
            <RailItem active={railTab === "layers"} icon={<Layers3 className="h-4 w-4" />} label={t("rail.layers")} onClick={() => setRailTab("layers")} />
            <RailItem active={railTab === "data"} icon={<Database className="h-4 w-4" />} label={t("rail.data")} onClick={() => setRailTab("data")} />
            <RailItem active={railTab === "templates"} icon={<LayoutGrid className="h-4 w-4" />} label={t("rail.templates")} onClick={() => setRailTab("templates")} />
          </div>

          <div className="mt-auto flex w-full flex-col items-center gap-6 pb-4">
            <RailItem icon={<Settings className="h-4 w-4" />} label={t("rail.settings")} disabled />
            <RailItem icon={<HelpCircle className="h-4 w-4" />} label={t("rail.help")} disabled />
          </div>
        </nav>

        <aside className="flex w-64 shrink-0 flex-col border-r border-[#c2c8bf]/20 bg-[#f4f4ef]">
          <div className="border-b border-[#c2c8bf]/10 px-4 py-4">
            <h2 className="font-headline text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#727971]">
              {railTitle(railTab, t, locale)}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {railTab === "components" ? (
              <div className="space-y-6">
                {editorToolGroups.map((group) => (
                  <EditorSection key={group.title} title={group.title}>
                    <div className={group.items.length > 1 ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                      {group.items.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => addWidgetFromPalette(item.name)}
                          className={`w-full border border-[#c2c8bf]/40 bg-[#fafaf5] px-3 py-3 text-left transition-colors hover:border-[#23422a] ${
                            group.items.length > 1
                              ? "flex min-h-[78px] flex-col items-center justify-center gap-2 rounded"
                              : "flex items-center gap-3 rounded"
                          }`}
                        >
                          <div
                            className={`flex ${group.items.length > 1 ? "flex-col items-center gap-2" : "items-center gap-3"}`}
                          >
                            <div className="flex h-7 w-7 items-center justify-center text-[#23422a]">
                              <ComponentIcon name={item.name} fallback={item.icon} />
                            </div>
                            <div className={`min-w-0 ${group.items.length > 1 ? "text-center" : ""}`}>
                              <div className="truncate text-[10px] font-medium text-[#1a1c19]">{item.name}</div>
                              {item.note ? <div className="text-[9px] text-[#727971]">{item.note}</div> : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </EditorSection>
                ))}
              </div>
            ) : null}

            {railTab === "layers" ? (
              <div className="space-y-2">
                {widgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => setSelectedWidgetId(widget.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] ${
                      widget.id === selectedWidgetId ? "bg-[#dce9dc] text-[#23422a]" : "bg-[#fafaf5] text-[#1a1c19]"
                    }`}
                  >
                    <span className="truncate">{widget.title}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#727971]">
                      {widget.visible ? (locale === "zh-CN" ? "显示" : "Visible") : (locale === "zh-CN" ? "隐藏" : "Hidden")}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {railTab === "data" ? (
              <EditorDataPanel
                locale={locale}
                datasets={datasetPanelItems}
                selectedDatasetName={selectedDatasetName}
                selectedWidgetDataset={selectedWidget.dataset}
                onSelectDataset={setSelectedDatasetName}
                onBindDataset={handleDatasetCardClick}
                onFieldPatch={handleDatasetFieldPatch}
                onRowPatch={handleDatasetRowPatch}
              />
            ) : null}

            {railTab === "templates" ? (
              <div className="space-y-3">
                {editorTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplatePreset(template.id)}
                    className="w-full rounded-md border border-[#c2c8bf]/30 bg-[#fafaf5] px-3 py-3 text-left transition-colors hover:border-[#23422a]/30 hover:bg-[#eef2ea]"
                  >
                    <div className="text-[11px] font-semibold text-[#1a1c19]">{template.name}</div>
                    <div className="mt-1 text-[10px] text-[#727971]">{template.note}</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#c2c8bf]/20 bg-[#eeeee9] p-4">
            <button
              onClick={openDataImport}
              className="flex h-9 w-full items-center justify-center gap-2 rounded border border-[#23422a]/20 bg-[#23422a]/5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#23422a] transition-colors hover:bg-[#23422a]/10"
            >
              <PlusCircle className="h-4 w-4" />
              {t("leftPanel.addSource")}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-[#dadad5] p-10">
          <div className="mx-auto flex max-w-[1320px] gap-0">
            <section
              onWheel={(event) => {
                if (event.metaKey || event.ctrlKey) {
                  event.preventDefault();
                  handleZoomDelta(event.deltaY > 0 ? -0.04 : 0.04);
                }
              }}
              className="relative flex min-h-[780px] flex-1 items-start justify-center overflow-y-auto overflow-x-hidden px-6 py-5"
            >
              <div
                className="w-[800px] shrink-0 origin-top overflow-hidden border border-[#c2c8bf]/50 bg-[#fafaf5] shadow-[0_28px_60px_rgba(26,28,25,0.16)]"
                style={{transform: `scale(${zoom})`}}
              >
                <div className="border-b border-[#c2c8bf]/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                        {editorProject.canvasLabel}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                        {t("canvas.live")}
                      </span>
                    </div>
                    <Tabs
                      className="rounded bg-[#f4f4ef] p-0.5"
                      value={canvasView}
                      onValueChange={(value) => commitSnapshot((snapshot) => ({...snapshot, canvasView: value as CanvasView}))}
                      options={[
                        {label: t("canvas.grid"), value: "grid"},
                        {label: t("canvas.safeArea"), value: "safe"},
                      ]}
                    />
                  </div>
                </div>

                <div className="bg-[#fafaf5] p-3">
                  <div className={`${canvasView === "grid" ? "dot-grid" : ""} relative h-[500px] overflow-hidden border border-[#c2c8bf]/50 bg-[#fafaf5]`}>
                    {canvasView === "safe" ? (
                      <div className="pointer-events-none absolute inset-5 border border-dashed border-[#23422a]/25" />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col p-4">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h1 className="font-headline text-[24px] font-extrabold leading-tight tracking-tight text-[#23422a]">
                            {t("canvas.dashboardTitle")}
                          </h1>
                          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-[#727971]">
                            {t("canvas.dashboardSubtitle")}
                          </p>
                        </div>
                        <div className="flex items-center gap-5 text-right">
                          <div>
                            <div className="text-[11px] font-bold font-mono text-[#1a1c19]">14:22:05 UTC</div>
                            <div className="text-[9px] uppercase tracking-[0.16em] text-[#727971]">Oct 24, 2023</div>
                          </div>
                          <div className="border-l border-[#c2c8bf]/40 pl-4">
                            <div className="text-[11px] font-bold text-[#1a1c19]">18°C</div>
                          </div>
                        </div>
                      </div>

                      <div ref={canvasGridRef} className="grid flex-1 auto-rows-[78px] grid-cols-12 gap-3">
                        {visibleWidgets.map((widget) => (
                          <WidgetCanvasItem
                            key={widget.id}
                            widget={widget}
                            selected={widget.id === selectedWidgetId}
                            mapLabels={mapLabels}
                            map3dAxis={map3dAxis}
                            mapZoom={mapZoom}
                            mapTheme={mapTheme}
                            mapRouteDensity={mapRouteDensity}
                            mapMarkers={mapMarkers}
                            mapGlow={mapGlow}
                            dataset={datasetLookup[widget.dataset]}
                            onSelect={() => setSelectedWidgetId(widget.id)}
                            onDragStart={handleWidgetPointerDown}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-8 flex items-center gap-2 rounded-full border border-[#c2c8bf]/60 bg-[#fafaf5]/95 px-2 py-2 shadow-[0_18px_40px_rgba(26,28,25,0.08)] backdrop-blur">
                <button
                  onClick={() => setZoom(0.85)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                >
                  Fit
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                >
                  100%
                </button>
                <div className="h-4 w-px bg-[#c2c8bf]/60" />
                <button
                  onClick={() => handleZoomDelta(-0.05)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-[11px] font-mono text-[#424842]">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => handleZoomDelta(0.05)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </section>

            <aside className="w-[308px] shrink-0 border-l border-[#c2c8bf]/20 bg-[#fafaf5]">
              <div className="border-b border-[#c2c8bf]/20 px-5 py-4">
                <h2 className="font-headline text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#727971]">
                  {t("rightPanel.title")}
                </h2>
              </div>

              <div className="flex h-[calc(100vh-7.5rem)] flex-col overflow-y-auto px-5 py-4">
                <div className="space-y-5">
                  <EditorSection title={t("rightPanel.selection.title")} subtitle={selectedWidget.title} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="rounded border-[#23422a]/20 bg-[#dce9dc] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                        {widgetTypeLabel(selectedWidget.type, locale)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={duplicateSelectedWidget}
                          className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                        >
                          {locale === "zh-CN" ? "复制" : "Duplicate"}
                        </button>
                        <button
                          onClick={deleteSelectedWidget}
                          disabled={widgets.length <= 1}
                          className="rounded-md border border-[#efc0ba] bg-[#fff4f2] px-2.5 py-1.5 text-[11px] font-medium text-[#a23b32] transition-colors hover:bg-[#ffeae6] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {locale === "zh-CN" ? "删除" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </EditorSection>

                  <EditorSection title={t("rightPanel.layout.title")}>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label="Width">
                        <Input className={editorControlClass} value={String(selectedWidget.width)} onChange={(event) => handleWidgetPatch({width: numberOr(event.target.value, selectedWidget.width)})} />
                      </EditorField>
                      <EditorField label="Height">
                        <Input className={editorControlClass} value={String(selectedWidget.height)} onChange={(event) => handleWidgetPatch({height: numberOr(event.target.value, selectedWidget.height)})} />
                      </EditorField>
                      <EditorField label="X Axis">
                        <Input className={editorControlClass} value={String(selectedWidget.x)} onChange={(event) => handleWidgetPatch({x: numberOr(event.target.value, selectedWidget.x)})} />
                      </EditorField>
                      <EditorField label="Y Axis">
                        <Input className={editorControlClass} value={String(selectedWidget.y)} onChange={(event) => handleWidgetPatch({y: numberOr(event.target.value, selectedWidget.y)})} />
                      </EditorField>
                    </div>
                  </EditorSection>

                  <EditorSection title={locale === "zh-CN" ? "组件内容" : "Widget Content"}>
                    <EditorField label={locale === "zh-CN" ? "标题" : "Title"}>
                      <Input className={editorControlClass} value={selectedWidget.title} onChange={(event) => handleWidgetPatch({title: event.target.value})} />
                    </EditorField>
                    <EditorField label={locale === "zh-CN" ? "可见状态" : "Visibility"}>
                      <div className="flex items-center justify-between rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-2">
                        <span className="text-[12px] text-[#1a1c19]">
                          {selectedWidget.visible ? (locale === "zh-CN" ? "当前显示" : "Visible on canvas") : (locale === "zh-CN" ? "当前隐藏" : "Hidden on canvas")}
                        </span>
                        <Switch checked={selectedWidget.visible} onCheckedChange={(checked) => handleWidgetPatch({visible: checked})} />
                      </div>
                    </EditorField>
                    {selectedWidget.type === "metric" ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        <EditorField label={locale === "zh-CN" ? "数值" : "Value"}>
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.value ?? ""}
                            onChange={(event) => handleWidgetPatch({value: event.target.value})}
                          />
                        </EditorField>
                        <EditorField label={locale === "zh-CN" ? "趋势" : "Hint"}>
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.hint ?? ""}
                            onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                          />
                        </EditorField>
                      </div>
                    ) : null}
                    {selectedWidget.type === "map" ? (
                      <EditorField label={locale === "zh-CN" ? "地图说明" : "Map Note"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                        />
                      </EditorField>
                    ) : null}
                    {selectedWidget.type === "events" || selectedWidget.type === "table" ? (
                      <EditorField label={locale === "zh-CN" ? "数据说明" : "Data Note"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                        />
                      </EditorField>
                    ) : null}
                    {selectedWidget.type === "text" ? (
                      <>
                        <EditorField label={locale === "zh-CN" ? "主文本" : "Primary Copy"}>
                          <Textarea
                            className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                            value={selectedWidget.value ?? ""}
                            onChange={(event) => handleWidgetPatch({value: event.target.value})}
                          />
                        </EditorField>
                        <EditorField label={locale === "zh-CN" ? "辅助说明" : "Supporting Copy"}>
                          <Textarea
                            className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                            value={selectedWidget.hint ?? ""}
                            onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                          />
                        </EditorField>
                      </>
                    ) : null}
                    {selectedWidget.type === "image" ? (
                      <>
                        <EditorField label={locale === "zh-CN" ? "图片地址" : "Image URL"}>
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.value ?? ""}
                            onChange={(event) => handleWidgetPatch({value: event.target.value})}
                          />
                        </EditorField>
                        <EditorField label={locale === "zh-CN" ? "图片说明" : "Image Caption"}>
                          <Textarea
                            className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                            value={selectedWidget.hint ?? ""}
                            onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                          />
                        </EditorField>
                      </>
                    ) : null}
                  </EditorSection>

                  <EditorSection title={t("rightPanel.appearance.title")}>
                    <EditorField label={t("rightPanel.appearance.fillColor")}>
                      <Input className={editorControlClass} value={selectedWidget.fill} onChange={(event) => handleWidgetPatch({fill: event.target.value})} />
                    </EditorField>
                    <EditorField label={locale === "zh-CN" ? "强调色" : "Accent Color"}>
                      <Input
                        className={editorControlClass}
                        value={selectedWidget.accent ?? ""}
                        onChange={(event) => handleWidgetPatch({accent: event.target.value})}
                      />
                    </EditorField>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={t("rightPanel.appearance.opacity")}>
                        <Input
                          className={editorControlClass}
                          value={`${opacityPercent}%`}
                          onChange={(event) =>
                            handleWidgetPatch({
                              opacity: clamp(numberOr(event.target.value.replace("%", ""), Number(opacityPercent)), 0, 100) / 100,
                            })
                          }
                        />
                      </EditorField>
                      <EditorField label={t("rightPanel.appearance.strokeWidth")}>
                        <Select
                          className={editorControlClass}
                          value={strokeValue}
                          onChange={(event) => handleWidgetPatch({stroke: event.target.value})}
                          options={[
                            {label: "None", value: "none"},
                            {label: "1px solid", value: "1px solid"},
                            {label: "2px dotted", value: "2px dotted"},
                          ]}
                        />
                      </EditorField>
                    </div>
                  </EditorSection>

                  <EditorSection title={t("rightPanel.dataBinding.title")}>
                    <EditorField label={t("rightPanel.dataBinding.dataset")}>
                      <Select
                        className={editorControlClass}
                        value={selectedWidget.dataset}
                        onChange={(event) => handleWidgetPatch({dataset: event.target.value})}
                        options={datasets.map((dataset) => ({
                          label: `${dataset.name} · ${dataset.records}`,
                          value: dataset.name,
                        }))}
                      />
                    </EditorField>
                    <EditorField label={t("rightPanel.dataBinding.fieldMap")}>
                      <Textarea
                        value={selectedWidget.fieldMap ?? defaultFieldMap}
                        onChange={(event) => handleWidgetPatch({fieldMap: event.target.value})}
                        className="min-h-24 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                      />
                    </EditorField>
                  </EditorSection>

                  <EditorSection title={t("rightPanel.map.title")}>
                    <div className="space-y-3">
                      <ToggleRow label={t("rightPanel.map.showLabels")} checked={mapLabels} onCheckedChange={setMapLabels} />
                      <ToggleRow label={t("rightPanel.map.show3DAxis")} checked={map3dAxis} onCheckedChange={setMap3dAxis} />
                      <ToggleRow label={locale === "zh-CN" ? "显示标记点" : "Show Markers"} checked={mapMarkers} onCheckedChange={setMapMarkers} />
                      <EditorField label={locale === "zh-CN" ? "地图主题" : "Map Theme"}>
                        <Select
                          className={editorControlClass}
                          value={mapTheme}
                          onChange={(event) => setMapTheme(event.target.value as "emerald" | "midnight" | "amber")}
                          options={[
                            {label: locale === "zh-CN" ? "翡翠绿" : "Emerald", value: "emerald"},
                            {label: locale === "zh-CN" ? "深夜蓝" : "Midnight", value: "midnight"},
                            {label: locale === "zh-CN" ? "琥珀金" : "Amber", value: "amber"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "路线密度" : "Route Density"}>
                        <Select
                          className={editorControlClass}
                          value={mapRouteDensity}
                          onChange={(event) => setMapRouteDensity(event.target.value as "low" | "balanced" | "high")}
                          options={[
                            {label: locale === "zh-CN" ? "简洁" : "Low", value: "low"},
                            {label: locale === "zh-CN" ? "均衡" : "Balanced", value: "balanced"},
                            {label: locale === "zh-CN" ? "丰富" : "High", value: "high"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "辉光强度" : "Glow Intensity"}>
                        <Input
                          className={editorControlClass}
                          value={`${mapGlow}%`}
                          onChange={(event) => setMapGlow(clamp(numberOr(event.target.value.replace("%", ""), mapGlow), 0, 100))}
                        />
                      </EditorField>
                      <EditorField label={t("rightPanel.map.defaultZoom")}>
                        <Input className={editorControlClass} value={mapZoom} onChange={(event) => setMapZoom(event.target.value)} />
                      </EditorField>
                    </div>
                  </EditorSection>

                  <EditorSection title={t("rightPanel.layers.title")} subtitle={t("rightPanel.layers.subtitle")}>
                    <div className="space-y-2">
                      {widgets.map((widget) => (
                        <button
                          key={widget.id}
                          onClick={() => setSelectedWidgetId(widget.id)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] ${
                            widget.id === selectedWidgetId ? "bg-[#dce9dc] text-[#23422a]" : "bg-[#f4f4ef] text-[#1a1c19]"
                          }`}
                        >
                          <span>{widget.title}</span>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#727971]">
                            {widget.id === selectedWidgetId ? t("rightPanel.layers.active") : t("rightPanel.layers.layer")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </EditorSection>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </main>
  );
}

function ToolIconButton({
  icon,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded p-1.5 transition-colors hover:bg-[#e8e8e3] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      disabled={disabled || !onClick}
    >
      {icon}
    </button>
  );
}

function RailItem({
  icon,
  label,
  active = false,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = `group flex w-full flex-col items-center gap-1 py-3 ${
    active
      ? "border-r-2 border-[#23422a] bg-[#e3e3de] text-[#23422a]"
      : disabled
        ? "cursor-default text-[#8d938d] opacity-60"
        : "text-[#424842] opacity-80 transition-all hover:bg-[#e3e3de] hover:opacity-100"
  }`;

  const content = (
    <>
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="font-headline text-[9px] uppercase tracking-[0.16em]">{label}</span>
    </>
  );

  if (!onClick || disabled) return <div className={className}>{content}</div>;

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function WidgetCanvasItem({
  widget,
  selected,
  mapLabels,
  map3dAxis,
  mapZoom,
  mapTheme,
  mapRouteDensity,
  mapMarkers,
  mapGlow,
  dataset,
  onSelect,
  onDragStart,
}: {
  widget: EditorWidget;
  selected: boolean;
  mapLabels: boolean;
  map3dAxis: boolean;
  mapZoom: string;
  mapTheme: "emerald" | "midnight" | "amber";
  mapRouteDensity: "low" | "balanced" | "high";
  mapMarkers: boolean;
  mapGlow: number;
  dataset?: {fields: DatasetPanelItem["fields"]; rows: DatasetRow[]};
  onSelect: () => void;
  onDragStart: (widgetId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onSelect}
      onPointerDown={(event) => onDragStart(widget.id, event)}
      className="relative block h-full text-left"
      style={editorWidgetPlacement(widget)}
    >
      <EditorCanvasWidget
        widget={widget}
        selected={selected}
        mapLabels={mapLabels}
        map3dAxis={map3dAxis}
        mapZoom={mapZoom}
        mapTheme={mapTheme}
        mapRouteDensity={mapRouteDensity}
        mapMarkers={mapMarkers}
        mapGlow={mapGlow}
        dataset={dataset}
      />
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-2">
      <span className="text-[12px] text-[#1a1c19]">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ComponentIcon({name, fallback}: {name: string; fallback: string}) {
  const className = "h-4.5 w-4.5";

  if (name.includes("Line")) return <LineChart className={className} strokeWidth={2} />;
  if (name.includes("Bar")) return <BarChart3 className={className} strokeWidth={2} />;
  if (name.includes("Pie")) return <PieChart className={className} strokeWidth={2} />;
  if (name.includes("Table")) return <Table2 className={className} strokeWidth={2} />;
  if (name.includes("World Map")) return <Globe2 className={className} strokeWidth={2} />;
  if (name.includes("Image")) return <ImageIcon className={className} strokeWidth={2} />;
  if (name.includes("Text")) return <Type className={className} strokeWidth={2} />;

  return <span className="text-sm font-bold">{fallback}</span>;
}

function resolveWidgetType(name: string): EditorWidget["type"] {
  if (name.includes("Line")) return "line";
  if (name.includes("Bar")) return "bar";
  if (name.includes("Pie")) return "pie";
  if (name.includes("Table")) return "table";
  if (name.includes("Map")) return "map";
  if (name.includes("Image")) return "image";
  if (name.includes("Text")) return "text";
  return "metric";
}

function railTitle(tab: RailTab, t: ReturnType<typeof useTranslations>, locale: string) {
  if (tab === "components") return t("leftPanel.title");
  if (tab === "layers") return t("rightPanel.layers.title");
  if (tab === "data") return locale === "zh-CN" ? "数据源" : "Datasets";
  return locale === "zh-CN" ? "模板预设" : "Template Presets";
}

function widgetTypeLabel(type: EditorWidget["type"], locale: string) {
  const zh = {
    metric: "指标卡",
    line: "折线图",
    pie: "环形图",
    map: "地图组件",
    bar: "柱状图",
    events: "事件列表",
    table: "数据表格",
    text: "文本说明",
    image: "图片组件",
  };
  const en = {
    metric: "Metric",
    line: "Line Chart",
    pie: "Pie Chart",
    map: "Map Widget",
    bar: "Bar Chart",
    events: "Event Feed",
    table: "Data Table",
    text: "Text Block",
    image: "Image",
  };
  return locale === "zh-CN" ? zh[type] : en[type];
}

function numberOr(raw: string, fallback: number) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function suggestFieldAlias(fieldName: string) {
  if (fieldName.includes("region")) return "region";
  if (fieldName.includes("time") || fieldName.includes("date")) return "timestamp";
  if (fieldName.includes("status")) return "status";
  if (fieldName.includes("carrier")) return "carrier";
  if (fieldName.includes("risk")) return "risk";
  if (fieldName.includes("value")) return "value";
  if (fieldName.includes("name")) return "label";
  return fieldName;
}

function patchDatasetField<T extends {fields: {field: string; type: string; sample: string; icon: string}[]; rows: DatasetRow[]}>(
  dataset: T,
  fieldIndex: number,
  patch: Partial<{field: string; type: string; sample: string; icon: string}>,
): T {
  const currentField = dataset.fields[fieldIndex];
  if (!currentField) return dataset;

  const nextFields = dataset.fields.map((field, index) => (index === fieldIndex ? {...field, ...patch} : field));
  const nextRows =
    patch.field && patch.field !== currentField.field
      ? dataset.rows.map((row) => renameRowKey(row, currentField.field, patch.field!))
      : dataset.rows;

  return {
    ...dataset,
    fields: nextFields,
    rows: nextRows,
  };
}

function renameRowKey(row: DatasetRow, currentKey: string, nextKey: string) {
  if (!(currentKey in row) || currentKey === nextKey) return row;
  const {[currentKey]: value, ...rest} = row;
  return {
    ...rest,
    [nextKey]: value,
  };
}
