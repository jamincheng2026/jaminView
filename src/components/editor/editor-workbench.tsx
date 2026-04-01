"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import {
  ArrowLeft,
  AreaChart,
  BarChart3,
  Database,
  Globe2,
  HelpCircle,
  ImageIcon,
  Lock,
  LayoutGrid,
  Layers3,
  LineChart,
  ListOrdered,
  PieChart,
  PlusCircle,
  Redo2,
  Settings,
  Table2,
  Type,
  Undo2,
  Unlock,
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
import {parseFieldMap} from "@/lib/editor-widget-data";
import {
  editorDatasetSchemas,
  editorDatasets as baseEditorDatasets,
  EDITOR_CANVAS_HEIGHT,
  EDITOR_CANVAS_WIDTH,
  defaultScreenConfig,
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
  type ScreenConfig,
} from "@/lib/editor-storage";
import {decodeRouteSegment} from "@/lib/project-utils";
import {readProjectRecord, upsertProjectRecord} from "@/lib/project-store";

const editorControlClass =
  "h-8 rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] text-[#1a1c19] shadow-none focus:border-[#45664b]";
const EDITOR_STAGE_FRAME_HEIGHT = 1158;

type StarterDatasetDraft = {
  fields: DatasetPanelItem["fields"];
  rows: DatasetRow[];
};

type RailTab = "components" | "layers" | "data" | "templates";
type CanvasView = "free" | "grid" | "safe";
type EditorSnapshot = {
  widgets: EditorWidget[];
  selectedWidgetId: string;
  selectedWidgetIds: string[];
  screenConfig: ScreenConfig;
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
  canvasView: CanvasView;
};

type DragState = {
  widgetId: string;
  widgetIds: string[];
  startClientX: number;
  startClientY: number;
  originPositions: Record<string, {x: number; y: number}>;
  snapshot: EditorSnapshot;
};

type ResizeDirection = "e" | "s" | "se";

type ResizeState = {
  widgetId: string;
  direction: ResizeDirection;
  startClientX: number;
  startClientY: number;
  originWidth: number;
  originHeight: number;
  snapshot: EditorSnapshot;
};

type SnapGuides = {
  vertical?: number;
  horizontal?: number;
};

type AlignmentTarget = "left" | "center" | "right" | "top" | "middle" | "bottom";

export function EditorWorkbench({
  projectId,
  templateId,
  projectName,
}: {
  projectId: string;
  templateId?: string;
  projectName?: string;
}) {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [railTab, setRailTab] = useState<RailTab>("components");
  const [widgets, setWidgets] = useState<EditorWidget[]>(editorWidgets);
  const [selectedWidgetId, setSelectedWidgetId] = useState(editorWidgets[3]?.id ?? editorWidgets[0].id);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([
    editorWidgets[3]?.id ?? editorWidgets[0].id,
  ]);
  const [zoom, setZoom] = useState(0.85);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
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
  const [canvasView, setCanvasView] = useState<CanvasView>("free");
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
  const [projectTitle, setProjectTitle] = useState(projectName?.trim() || editorProject.name);
  const [screenConfig, setScreenConfig] = useState<ScreenConfig>(defaultScreenConfig);
  const sectionViewportRef = useRef<HTMLElement | null>(null);
  const canvasGridRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const clipboardRef = useRef<EditorWidget[]>([]);
  const widgetsRef = useRef<EditorWidget[]>(editorWidgets);
  const seededTemplateRef = useRef(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({});
  const [fitZoom, setFitZoom] = useState(0.85);
  const hasManualZoomRef = useRef(false);

  useEffect(() => {
    // Restore the last local draft so the editor behaves like a real working file.
    const draft = readEditorDraft(projectId);
    if (draft) {
      if (draft.projectTitle?.trim()) {
        setProjectTitle(draft.projectTitle.trim());
      }
      setWidgets(draft.widgets);
      setSelectedWidgetId(draft.selectedWidgetId);
      setSelectedWidgetIds(
        draft.selectedWidgetIds?.length ? draft.selectedWidgetIds : [draft.selectedWidgetId],
      );
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
      setCanvasView(draft.canvasView ?? "free");
      if (draft.datasetDrafts) {
        setStarterDatasetDrafts(draft.datasetDrafts);
      }
      setSaveState("saved");
      seededTemplateRef.current = true;
    }

    setImportedDatasets(readImportedDatasets(projectId));

    const projectRecord = readProjectRecord(projectId);
    if (!draft?.projectTitle && projectRecord?.name) {
      setProjectTitle(projectRecord.name);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectName?.trim()) {
      setProjectTitle(projectName.trim());
    }
  }, [projectName]);

  useEffect(() => {
    if (seededTemplateRef.current || !templateId) return;
    const presetWidgets = widgetsForTemplate(templateId, editorWidgets, locale);
    if (!presetWidgets) return;

    setWidgets(presetWidgets);
    setSelectedWidgetId(presetWidgets[0]?.id ?? editorWidgets[0].id);
    setSaveState("dirty");
    seededTemplateRef.current = true;
  }, [locale, templateId]);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    const element = sectionViewportRef.current;
    if (!element) return;

    const updateFitZoom = () => {
      const nextFitZoom = clamp(
        Math.min(
          (element.clientWidth - 48) / EDITOR_CANVAS_WIDTH,
          (element.clientHeight - 48) / EDITOR_STAGE_FRAME_HEIGHT,
        ),
        0.42,
        1,
      );

      setFitZoom(nextFitZoom);
      if (!hasManualZoomRef.current) {
        setZoom(nextFitZoom);
      }
    };

    updateFitZoom();
    const observer = new ResizeObserver(updateFitZoom);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      const commandPressed = event.metaKey || event.ctrlKey;
      if (commandPressed && event.key.toLowerCase() === "a") {
        event.preventDefault();
        updateSelection(widgetsRef.current.map((widget) => widget.id), selectedWidgetId);
        return;
      }

      if (commandPressed && event.key.toLowerCase() === "c") {
        event.preventDefault();
        clipboardRef.current = widgetsRef.current
          .filter((widget) => selectedWidgetIds.includes(widget.id))
          .map((widget) => ({...widget}));
        return;
      }

      if (commandPressed && event.key.toLowerCase() === "v") {
        event.preventDefault();
        if (!clipboardRef.current.length) return;
        pasteClipboard();
        return;
      }

      if ((event.key === "Backspace" || event.key === "Delete") && widgetsRef.current.length > 1) {
        event.preventDefault();
        deleteSelectedWidget();
        return;
      }

      const step = event.shiftKey ? 10 : 1;

      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();

      commitSnapshot((snapshot) => ({
        ...snapshot,
        widgets: snapshot.widgets.map((widget) => {
          const activeIds = snapshot.selectedWidgetIds?.length ? snapshot.selectedWidgetIds : [snapshot.selectedWidgetId];
          if (!activeIds.includes(widget.id) || widget.locked) return widget;

          if (event.key === "ArrowLeft") {
            return {...widget, x: clamp(widget.x - step, 0, Math.max(0, EDITOR_CANVAS_WIDTH - widget.width))};
          }

          if (event.key === "ArrowRight") {
            return {...widget, x: clamp(widget.x + step, 0, Math.max(0, EDITOR_CANVAS_WIDTH - widget.width))};
          }

          if (event.key === "ArrowUp") {
            return {...widget, y: clamp(widget.y - step, 0, Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height))};
          }

          return {...widget, y: clamp(widget.y + step, 0, Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height))};
        }),
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWidgetId, selectedWidgetIds]);

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
  const selectedWidgetIdSet = useMemo(
    () => new Set(selectedWidgetIds),
    [selectedWidgetIds],
  );
  const selectedWidgets = useMemo(
    () => widgets.filter((widget) => selectedWidgetIdSet.has(widget.id)),
    [selectedWidgetIdSet, widgets],
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
  const fieldMapValue = selectedWidget.fieldMap ?? defaultFieldMap;
  const parsedFieldMap = useMemo(() => parseFieldMap(fieldMapValue), [fieldMapValue]);
  const fieldMappingOptions = useMemo(
    () => buildFieldMappingOptions(selectedWidget.type, locale),
    [locale, selectedWidget.type],
  );

  const opacityPercent = String(Math.round((selectedWidget.opacity ?? 1) * 100));
  const strokeValue = selectedWidget.stroke ?? "none";
  const scaledCanvasWidth = Math.round(EDITOR_CANVAS_WIDTH * zoom);
  const scaledCanvasFrameHeight = Math.round(EDITOR_STAGE_FRAME_HEIGHT * zoom);
  const stageFitsViewport = zoom <= fitZoom + 0.01;
  const canvasBackgroundStyle = useMemo(
    () => buildCanvasBackgroundStyle(screenConfig),
    [screenConfig],
  );

  useEffect(() => {
    const element = sectionViewportRef.current;
    if (!element) return;

    const frame = window.requestAnimationFrame(() => {
      element.scrollLeft = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [stageFitsViewport, zoom]);

  useEffect(() => {
    if (selectedWidget?.dataset) {
      setSelectedDatasetName(selectedWidget.dataset);
    }
  }, [selectedWidget]);

  const visibleWidgets = widgets.filter((widget) => widget.visible);
  const orderedWidgets = useMemo(
    () => [...widgets].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [widgets],
  );
  const visibleOrderedWidgets = useMemo(
    () => orderedWidgets.filter((widget) => widget.visible),
    [orderedWidgets],
  );

  const captureSnapshot = (): EditorSnapshot => ({
    widgets: widgets.map((widget) => ({...widget})),
    selectedWidgetId,
    selectedWidgetIds: [...selectedWidgetIds],
    screenConfig: {...screenConfig},
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
    canvasView,
  });

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setWidgets(snapshot.widgets.map((widget) => ({...widget})));
    setSelectedWidgetId(snapshot.selectedWidgetId);
    setSelectedWidgetIds(
      snapshot.selectedWidgetIds?.length ? [...snapshot.selectedWidgetIds] : [snapshot.selectedWidgetId],
    );
    setScreenConfig(snapshot.screenConfig);
    setMapLabels(snapshot.mapLabels);
    setMap3dAxis(snapshot.map3dAxis);
    setMapZoom(snapshot.mapZoom);
    setMapTheme(snapshot.mapTheme);
    setMapRouteDensity(snapshot.mapRouteDensity);
    setMapMarkers(snapshot.mapMarkers);
    setMapGlow(snapshot.mapGlow);
    setMapRouteStyle(snapshot.mapRouteStyle);
    setMapLabelStyle(snapshot.mapLabelStyle);
    setMapSurfaceTone(snapshot.mapSurfaceTone);
    setCanvasView(snapshot.canvasView);
  };

  const commitSnapshot = (updater: (snapshot: EditorSnapshot) => EditorSnapshot) => {
    // All editor mutations funnel through the same history pipeline so undo/redo,
    // local draft persistence and preview stay aligned.
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

  const handleScreenConfigPatch = (patch: Partial<ScreenConfig>) => {
    commitSnapshot((snapshot) => ({
      ...snapshot,
      screenConfig: {
        ...snapshot.screenConfig,
        ...patch,
      },
    }));
  };

  // Build a serializable draft snapshot that preview/publish can consume too.
  const buildDraft = (): EditorDraft => ({
    projectTitle,
    widgets,
    selectedWidgetId,
    selectedWidgetIds,
    zoom,
    screenConfig,
    canvasView,
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
    datasetDrafts: starterDatasetDrafts,
    updatedAt: new Date().toISOString(),
  });

  const handleSave = (next?: () => void) => {
    setSaveState("saving");
    const payload = buildDraft();
    saveEditorDraft(projectId, payload);
    upsertProjectRecord({
      id: projectId,
      name: projectTitle,
      status: "DRAFT",
      updatedAt: payload.updatedAt,
    });
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
      const publishedDraft = buildDraft();
      savePublishedSnapshot(projectId, publishedDraft);
      upsertProjectRecord({
        id: projectId,
        name: projectTitle,
        status: "LIVE",
        updatedAt: publishedDraft.updatedAt,
      });
      router.push(`/${locale}/publish-success/${projectId}`);
    });
  };

  const openDataImport = () => {
    const normalizedReturnTo = decodeRouteSegment(pathname);
    const nextSearch = new URLSearchParams({
      projectId,
      returnTo: normalizedReturnTo,
    });
    router.push(`/${locale}/data-import?${nextSearch.toString()}`);
  };

  const handleZoomDelta = (delta: number) => {
    hasManualZoomRef.current = true;
    setZoom((value) => Math.min(1.2, Math.max(0.55, Number((value + delta).toFixed(2)))));
  };

  const updateSelection = (nextIds: string[], primaryId?: string) => {
    const normalized = Array.from(new Set(nextIds)).filter((id) => widgetsRef.current.some((widget) => widget.id === id));
    const fallbackId = primaryId ?? normalized[normalized.length - 1] ?? widgetsRef.current[0]?.id;
    if (!fallbackId) return;
    setSelectedWidgetIds(normalized.length ? normalized : [fallbackId]);
    setSelectedWidgetId(fallbackId);
  };

  const selectWidget = (widgetId: string, additive = false) => {
    if (!additive) {
      updateSelection([widgetId], widgetId);
      return;
    }

    if (selectedWidgetIdSet.has(widgetId)) {
      const nextIds = selectedWidgetIds.filter((id) => id !== widgetId);
      updateSelection(nextIds, nextIds[nextIds.length - 1] ?? selectedWidgetId);
      return;
    }

    updateSelection([...selectedWidgetIds, widgetId], widgetId);
  };

  const addWidgetFromPalette = (name: string) => {
    const type = resolveWidgetType(name);
    const nextId = `${type}-${Date.now()}`;
    const nextWidget: EditorWidget = {
      id: nextId,
      type,
      title: name,
      x: 1360,
      y: 620,
      width: type === "table" ? 920 : type === "map" ? 760 : type === "image" ? 420 : type === "text" ? 420 : 320,
      height:
        type === "table"
          ? 220
          : type === "map"
            ? 430
            : type === "image"
              ? 260
              : type === "text"
                ? 190
                : type === "rank"
                  ? 250
                  : 160,
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
                : type === "rank"
                  ? locale === "zh-CN"
                    ? "展示当前数据的排行结果和对比进度"
                    : "Summarize ordered performance and rank progress"
                : undefined,
      stroke: "none",
      fieldMap: undefined,
      radius: 8,
      padding: type === "map" ? 12 : 16,
      shadow: type === "map" ? "medium" : "soft",
      titleVisible: true,
      titleAlign: "left",
      zIndex: Math.max(...widgets.map((widget) => widget.zIndex ?? 0), 0) + 10,
      locked: false,
      textColor: "#1a1c19",
      fontSize: type === "text" ? 22 : 14,
      fontWeight: type === "text" ? "semibold" : "medium",
      lineHeight: type === "text" ? 1.4 : 1.3,
      imageFit: type === "image" ? "cover" : undefined,
    };

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: [...snapshot.widgets, nextWidget],
      selectedWidgetId: nextId,
      selectedWidgetIds: [nextId],
    }));
    setSaveState("dirty");
    setRailTab("layers");
  };

  const pasteClipboard = () => {
    commitSnapshot((snapshot) => {
      if (!clipboardRef.current.length) return snapshot;

      let nextZIndex = Math.max(...snapshot.widgets.map((widget) => widget.zIndex ?? 0), 0) + 10;
      const clones = clipboardRef.current.map((widget, index) => ({
        ...widget,
        id: `${widget.type}-${Date.now()}-${index}`,
        title: `${widget.title} Copy`,
        x: Math.min(widget.x + 24, Math.max(0, EDITOR_CANVAS_WIDTH - widget.width)),
        y: Math.min(widget.y + 24, Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height)),
        zIndex: nextZIndex + index * 10,
      }));

      return {
        ...snapshot,
        widgets: [...snapshot.widgets, ...clones],
        selectedWidgetId: clones[clones.length - 1]?.id ?? snapshot.selectedWidgetId,
        selectedWidgetIds: clones.map((widget) => widget.id),
      };
    });
  };

  const duplicateSelectedWidget = () => {
    const idsToDuplicate = selectedWidgetIds.length ? selectedWidgetIds : [selectedWidgetId];
    commitSnapshot((snapshot) => {
      let nextZIndex = Math.max(...snapshot.widgets.map((widget) => widget.zIndex ?? 0), 0) + 10;
      const clones = snapshot.widgets
        .filter((widget) => idsToDuplicate.includes(widget.id))
        .map((widget, index) => ({
          ...widget,
          id: `${widget.type}-${Date.now()}-${index}`,
          title: `${widget.title} Copy`,
          x: Math.min(widget.x + 24, Math.max(0, EDITOR_CANVAS_WIDTH - widget.width)),
          y: Math.min(widget.y + 24, Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height)),
          zIndex: nextZIndex + index * 10,
        }));

      return {
        ...snapshot,
        widgets: [...snapshot.widgets, ...clones],
        selectedWidgetId: clones[clones.length - 1]?.id ?? snapshot.selectedWidgetId,
        selectedWidgetIds: clones.map((widget) => widget.id),
      };
    });
  };

  const deleteSelectedWidget = () => {
    const idsToDelete = selectedWidgetIds.length ? selectedWidgetIds : [selectedWidgetId];
    if (widgets.length - idsToDelete.length < 1) return;
    commitSnapshot((snapshot) => {
      const nextWidgets = snapshot.widgets.filter((widget) => !idsToDelete.includes(widget.id));
      const nextSelectedId = nextWidgets[0]?.id ?? snapshot.selectedWidgetId;
      return {
        ...snapshot,
        widgets: nextWidgets,
        selectedWidgetId: nextSelectedId,
        selectedWidgetIds: nextSelectedId ? [nextSelectedId] : [],
      };
    });
  };

  const setSelectedWidgetsLocked = (locked: boolean) => {
    const idsToLock = selectedWidgetIds.length ? selectedWidgetIds : [selectedWidgetId];
    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: snapshot.widgets.map((widget) =>
        idsToLock.includes(widget.id)
          ? {
              ...widget,
              locked,
            }
          : widget,
      ),
    }));
  };

  const toggleSelectedWidgetLock = () => {
    const shouldLock = !selectedWidgets.length || !selectedWidgets.every((widget) => widget.locked);
    setSelectedWidgetsLocked(shouldLock);
  };

  const moveSelectedWidgetLayer = (direction: "forward" | "backward") => {
    const currentIndex = orderedWidgets.findIndex((widget) => widget.id === selectedWidget.id);
    if (currentIndex === -1) return;

    const swapIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
    if (swapIndex < 0 || swapIndex >= orderedWidgets.length) return;

    const currentWidget = orderedWidgets[currentIndex];
    const targetWidget = orderedWidgets[swapIndex];

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: snapshot.widgets.map((widget) => {
        if (widget.id === currentWidget.id) return {...widget, zIndex: targetWidget.zIndex ?? 0};
        if (widget.id === targetWidget.id) return {...widget, zIndex: currentWidget.zIndex ?? 0};
        return widget;
      }),
    }));
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

  const handleFieldAliasChange = (alias: string, fieldName: string) => {
    // Keep the advanced textarea source of truth, but let the UI expose
    // friendly field pickers for the common chart bindings.
    const nextMap = {
      ...parsedFieldMap,
      [alias]: fieldName,
    };

    handleWidgetPatch({fieldMap: stringifyFieldMap(nextMap)});
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

  const alignSelectedWidget = (target: AlignmentTarget) => {
    const idsToAlign = selectedWidgetIds.length ? selectedWidgetIds : [selectedWidgetId];
    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: (() => {
        const activeWidgets = snapshot.widgets.filter((widget) => idsToAlign.includes(widget.id));
        if (!activeWidgets.length) return snapshot.widgets;

        const minX = Math.min(...activeWidgets.map((widget) => widget.x));
        const maxRight = Math.max(...activeWidgets.map((widget) => widget.x + widget.width));
        const minY = Math.min(...activeWidgets.map((widget) => widget.y));
        const maxBottom = Math.max(...activeWidgets.map((widget) => widget.y + widget.height));
        const selectionCenterX = minX + (maxRight - minX) / 2;
        const selectionCenterY = minY + (maxBottom - minY) / 2;

        return snapshot.widgets.map((widget) => {
          if (!idsToAlign.includes(widget.id)) return widget;

          if (activeWidgets.length === 1) {
            if (target === "left") return {...widget, x: 0};
            if (target === "center") return {...widget, x: Math.round((EDITOR_CANVAS_WIDTH - widget.width) / 2)};
            if (target === "right") return {...widget, x: Math.max(0, EDITOR_CANVAS_WIDTH - widget.width)};
            if (target === "top") return {...widget, y: 0};
            if (target === "middle") return {...widget, y: Math.round((EDITOR_CANVAS_HEIGHT - widget.height) / 2)};
            return {...widget, y: Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height)};
          }

          if (target === "left") return {...widget, x: minX};
          if (target === "center") return {...widget, x: Math.round(selectionCenterX - widget.width / 2)};
          if (target === "right") return {...widget, x: Math.round(maxRight - widget.width)};
          if (target === "top") return {...widget, y: minY};
          if (target === "middle") return {...widget, y: Math.round(selectionCenterY - widget.height / 2)};
          return {...widget, y: Math.round(maxBottom - widget.height)};
        });
      })(),
    }));
  };

  const stopWidgetDrag = () => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    dragStateRef.current = null;
    setSnapGuides({});

    const draggedWidget = widgetsRef.current.find((widget) => widget.id === dragState.widgetId);
    if (!draggedWidget) return;

    const moved = dragState.widgetIds.some((widgetId) => {
      const widget = widgetsRef.current.find((item) => item.id === widgetId);
      const origin = dragState.originPositions[widgetId];
      return widget && origin && (widget.x !== origin.x || widget.y !== origin.y);
    });

    if (!moved) return;

    setHistory((prev) => [...prev, dragState.snapshot]);
    setFuture([]);
    setSaveState("dirty");
  };

  const stopWidgetResize = () => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;

    resizeStateRef.current = null;
    setSnapGuides({});

    const resizedWidget = widgetsRef.current.find((widget) => widget.id === resizeState.widgetId);
    if (!resizedWidget) return;

    if (
      resizedWidget.width === resizeState.originWidth &&
      resizedWidget.height === resizeState.originHeight
    ) {
      return;
    }

    setHistory((prev) => [...prev, resizeState.snapshot]);
    setFuture([]);
    setSaveState("dirty");
  };

  const handleWidgetPointerDown = (widgetId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const draggedWidget = widgets.find((widget) => widget.id === widgetId);
    if (!draggedWidget || !canvasGridRef.current) return;
    if (draggedWidget.locked) return;

    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      event.preventDefault();
      selectWidget(widgetId, true);
      return;
    }

    event.preventDefault();
    if (!selectedWidgetIdSet.has(widgetId)) {
      updateSelection([widgetId], widgetId);
    }

    const activeSelection = selectedWidgetIdSet.has(widgetId) ? selectedWidgetIds : [widgetId];
    const movableWidgetIds = activeSelection.filter((id) => !widgets.find((widget) => widget.id === id)?.locked);
    const draggedGroup = widgets.filter((widget) => movableWidgetIds.includes(widget.id));
    const originPositions = Object.fromEntries(
      draggedGroup.map((widget) => [widget.id, {x: widget.x, y: widget.y}]),
    );

    dragStateRef.current = {
      widgetId,
      widgetIds: draggedGroup.map((widget) => widget.id),
      startClientX: event.clientX,
      startClientY: event.clientY,
      originPositions,
      snapshot: captureSnapshot(),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const activeDrag = dragStateRef.current;
      if (!activeDrag) return;

      const nextWidget = widgetsRef.current.find((widget) => widget.id === activeDrag.widgetId);
      if (!nextWidget) return;

      const origin = activeDrag.originPositions[activeDrag.widgetId];
      if (!origin) return;

      const groupOrigins = Object.values(activeDrag.originPositions);
      const groupWidgets = widgetsRef.current.filter((widget) => activeDrag.widgetIds.includes(widget.id));
      const maxRight = Math.max(...groupWidgets.map((widget) => activeDrag.originPositions[widget.id].x + widget.width));
      const maxBottom = Math.max(...groupWidgets.map((widget) => activeDrag.originPositions[widget.id].y + widget.height));
      const minLeft = Math.min(...groupOrigins.map((item) => item.x));
      const minTop = Math.min(...groupOrigins.map((item) => item.y));

      const deltaX = (moveEvent.clientX - activeDrag.startClientX) / zoom;
      const deltaY = (moveEvent.clientY - activeDrag.startClientY) / zoom;
      const clampedDeltaX = clamp(Math.round(deltaX), -minLeft, EDITOR_CANVAS_WIDTH - maxRight);
      const clampedDeltaY = clamp(Math.round(deltaY), -minTop, EDITOR_CANVAS_HEIGHT - maxBottom);
      const proposedX = clamp(Math.round(origin.x + clampedDeltaX), 0, Math.max(0, EDITOR_CANVAS_WIDTH - nextWidget.width));
      const proposedY = clamp(Math.round(origin.y + clampedDeltaY), 0, Math.max(0, EDITOR_CANVAS_HEIGHT - nextWidget.height));
      const snapped = resolveSnapForMove(widgetsRef.current, nextWidget, proposedX, proposedY, canvasView);
      const adjustedDeltaX = snapped.x - origin.x;
      const adjustedDeltaY = snapped.y - origin.y;

      setWidgets((current) =>
        current.map((widget) =>
          activeDrag.widgetIds.includes(widget.id)
            ? {
                ...widget,
                x: clamp(activeDrag.originPositions[widget.id].x + adjustedDeltaX, 0, Math.max(0, EDITOR_CANVAS_WIDTH - widget.width)),
                y: clamp(activeDrag.originPositions[widget.id].y + adjustedDeltaY, 0, Math.max(0, EDITOR_CANVAS_HEIGHT - widget.height)),
              }
            : widget,
        ),
      );
      setSnapGuides(snapped.guides);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      stopWidgetDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  useEffect(() => {
    if (!widgets.length) return;

    const validIds = selectedWidgetIds.filter((id) => widgets.some((widget) => widget.id === id));
    if (!validIds.length) {
      updateSelection([widgets[0].id], widgets[0].id);
      return;
    }

    if (!validIds.includes(selectedWidgetId)) {
      updateSelection(validIds, validIds[validIds.length - 1]);
      return;
    }

    if (validIds.length !== selectedWidgetIds.length) {
      setSelectedWidgetIds(validIds);
    }
  }, [selectedWidgetId, selectedWidgetIds, widgets]);

  const handleWidgetResizeStart = (
    widgetId: string,
    direction: ResizeDirection,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return;

    const resizedWidget = widgets.find((widget) => widget.id === widgetId);
    if (!resizedWidget || !canvasGridRef.current) return;
    if (resizedWidget.locked) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedWidgetId(widgetId);

    resizeStateRef.current = {
      widgetId,
      direction,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originWidth: resizedWidget.width,
      originHeight: resizedWidget.height,
      snapshot: captureSnapshot(),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const activeResize = resizeStateRef.current;
      if (!activeResize) return;

      const nextWidget = widgetsRef.current.find((widget) => widget.id === activeResize.widgetId);
      if (!nextWidget) return;

      const deltaX = (moveEvent.clientX - activeResize.startClientX) / zoom;
      const deltaY = (moveEvent.clientY - activeResize.startClientY) / zoom;
      const widthDelta = Math.round(deltaX);
      const heightDelta = Math.round(deltaY);
      const maxWidth = Math.max(120, EDITOR_CANVAS_WIDTH - nextWidget.x);
      const maxHeight = Math.max(80, EDITOR_CANVAS_HEIGHT - nextWidget.y);

      const nextWidth =
        activeResize.direction === "s"
          ? nextWidget.width
          : clamp(activeResize.originWidth + widthDelta, 120, maxWidth);
      const nextHeight =
        activeResize.direction === "e"
          ? nextWidget.height
          : clamp(activeResize.originHeight + heightDelta, 80, maxHeight);
      const snappedGuides = resolveSnapForResize(
        widgetsRef.current,
        nextWidget,
        nextWidth,
        nextHeight,
        canvasView,
      );

      setWidgets((current) =>
        current.map((widget) =>
          widget.id === activeResize.widgetId
            ? {
                ...widget,
                width: snappedGuides.width,
                height: snappedGuides.height,
              }
            : widget,
        ),
      );
      setSnapGuides(snappedGuides.guides);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      stopWidgetResize();
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
              {t("topbar.projectPrefix")} {projectTitle}
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
                    onClick={(event) => selectWidget(widget.id, event.shiftKey || event.metaKey || event.ctrlKey)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] ${
                      selectedWidgetIdSet.has(widget.id) ? "bg-[#dce9dc] text-[#23422a]" : "bg-[#fafaf5] text-[#1a1c19]"
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

        <main className="min-w-0 flex-1 overflow-hidden bg-[#dadad5]">
          <div className="flex h-full w-full min-w-0">
            <section
              ref={sectionViewportRef}
              onWheel={(event) => {
                if (event.metaKey || event.ctrlKey) {
                  event.preventDefault();
                  handleZoomDelta(event.deltaY > 0 ? -0.04 : 0.04);
                }
              }}
              className={`relative flex min-h-[780px] min-w-0 flex-1 items-start overflow-auto px-6 py-6 ${
                stageFitsViewport ? "justify-center" : "justify-start"
              }`}
            >
              <div
                className="relative shrink-0"
                style={{width: `${scaledCanvasWidth}px`, height: `${scaledCanvasFrameHeight}px`}}
              >
                <div
                  className="absolute left-0 top-0 w-[1920px] origin-top-left overflow-hidden border border-[#c2c8bf]/50 bg-[#fafaf5] shadow-[0_28px_60px_rgba(26,28,25,0.16)]"
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
                        {label: t("canvas.free"), value: "free"},
                        {label: t("canvas.grid"), value: "grid"},
                        {label: t("canvas.safeArea"), value: "safe"},
                      ]}
                    />
                  </div>
                  </div>

                  <div className="bg-[#fafaf5] p-3">
                    <div
                      className={`${canvasView === "grid" ? "dot-grid" : ""} relative h-[1080px] w-[1920px] overflow-hidden border border-[#c2c8bf]/50`}
                      style={canvasBackgroundStyle}
                    >
                      {canvasView === "safe" ? (
                        <div className="pointer-events-none absolute inset-[48px] border border-dashed border-[#23422a]/25" />
                      ) : null}
                      {screenConfig.backgroundMode === "image" && screenConfig.backgroundImage ? (
                        <div
                          className="pointer-events-none absolute inset-0 bg-[#07110d]"
                          style={{opacity: clamp(screenConfig.backgroundOverlay, 0, 100) / 100}}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col p-4">
                      {screenConfig.showHeader ? (
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {screenConfig.showStatusBadge ? (
                                <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                                  {screenConfig.statusBadgeLabel || editorProject.canvasLabel}
                                </Badge>
                              ) : null}
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
                                {screenConfig.statusMetaLabel || t("canvas.live")}
                              </span>
                            </div>
                            <h1 className="mt-3 font-headline text-[24px] font-extrabold leading-tight tracking-tight text-[#23422a]">
                              {screenConfig.title}
                            </h1>
                            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-[#727971]">
                              {screenConfig.subtitle}
                            </p>
                          </div>
                          {screenConfig.showTimestamp ? (
                            <div className="flex items-center gap-5 text-right">
                              <div>
                                <div className="text-[11px] font-bold font-mono text-[#1a1c19]">
                                  {screenConfig.timeText}
                                </div>
                                <div className="text-[9px] uppercase tracking-[0.16em] text-[#727971]">
                                  {screenConfig.dateText}
                                </div>
                              </div>
                              <div className="border-l border-[#c2c8bf]/40 pl-4">
                                <div className="text-[11px] font-bold text-[#1a1c19]">
                                  {screenConfig.rightMetaPrimary}
                                </div>
                                <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#727971]">
                                  {screenConfig.rightMetaSecondary}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div ref={canvasGridRef} className="relative flex-1">
                        {typeof snapGuides.vertical === "number" ? (
                          <div
                            className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#4e7b56]/70"
                            style={{left: `${snapGuides.vertical}px`}}
                          />
                        ) : null}
                        {typeof snapGuides.horizontal === "number" ? (
                          <div
                            className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-[#4e7b56]/70"
                            style={{top: `${snapGuides.horizontal}px`}}
                          />
                        ) : null}
                        {visibleOrderedWidgets.map((widget) => (
                          <WidgetCanvasItem
                            key={widget.id}
                            widget={widget}
                            selected={selectedWidgetIdSet.has(widget.id)}
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
                            onDragStart={handleWidgetPointerDown}
                            onResizeStart={handleWidgetResizeStart}
                          />
                        ))}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-8 flex items-center gap-2 rounded-full border border-[#c2c8bf]/60 bg-[#fafaf5]/95 px-2 py-2 shadow-[0_18px_40px_rgba(26,28,25,0.08)] backdrop-blur">
                <button
                  onClick={() => {
                    hasManualZoomRef.current = false;
                    setZoom(fitZoom);
                  }}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                >
                  Fit
                </button>
                <button
                  onClick={() => {
                    hasManualZoomRef.current = true;
                    setZoom(1);
                  }}
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

            <aside className="h-full w-[308px] shrink-0 border-l border-[#c2c8bf]/20 bg-[#fafaf5]">
              <div className="border-b border-[#c2c8bf]/20 px-5 py-4">
                <h2 className="font-headline text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#727971]">
                  {t("rightPanel.title")}
                </h2>
              </div>

              <div className="flex h-[calc(100vh-7.5rem)] flex-col overflow-y-auto px-5 py-4">
                <div className="space-y-5">
                  <EditorSection
                    title={t("rightPanel.selection.title")}
                    subtitle={
                      selectedWidgetIds.length > 1
                        ? locale === "zh-CN"
                          ? `已选择 ${selectedWidgetIds.length} 个组件`
                          : `${selectedWidgetIds.length} widgets selected`
                        : selectedWidget.title
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="rounded border-[#23422a]/20 bg-[#dce9dc] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                        {selectedWidgetIds.length > 1
                          ? locale === "zh-CN"
                            ? "多选模式"
                            : "Multi Select"
                          : widgetTypeLabel(selectedWidget.type, locale)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSelectedWidgetLayer("backward")}
                          disabled={selectedWidgetIds.length > 1}
                          className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                        >
                          {locale === "zh-CN" ? "下移" : "Backward"}
                        </button>
                        <button
                          onClick={() => moveSelectedWidgetLayer("forward")}
                          disabled={selectedWidgetIds.length > 1}
                          className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                        >
                          {locale === "zh-CN" ? "上移" : "Forward"}
                        </button>
                        <button
                          onClick={toggleSelectedWidgetLock}
                          className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea]"
                        >
                          {selectedWidgets.length && selectedWidgets.every((widget) => widget.locked)
                            ? locale === "zh-CN"
                              ? "解锁"
                              : "Unlock"
                            : locale === "zh-CN"
                              ? "锁定"
                              : "Lock"}
                        </button>
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
                    {selectedWidgetIds.length > 1 ? (
                      <p className="text-[11px] leading-5 text-[#727971]">
                        {locale === "zh-CN"
                          ? "当前右侧内容项仍以主选中的组件为准；批量对齐、复制、删除和锁定会作用到全部选中项。"
                          : "Content fields still follow the primary selection; align, duplicate, delete and lock actions apply to all selected widgets."}
                      </p>
                    ) : null}
                  </EditorSection>

                  <EditorSection title={t("rightPanel.page.title")} subtitle={t("rightPanel.page.subtitle")}>
                    <EditorField label={t("rightPanel.page.screenTitle")}>
                      <Input
                        className={editorControlClass}
                        value={screenConfig.title}
                        onChange={(event) => handleScreenConfigPatch({title: event.target.value})}
                      />
                    </EditorField>
                    <EditorField label={t("rightPanel.page.screenSubtitle")}>
                      <Input
                        className={editorControlClass}
                        value={screenConfig.subtitle}
                        onChange={(event) => handleScreenConfigPatch({subtitle: event.target.value})}
                      />
                    </EditorField>
                    <ToggleRow
                      label={t("rightPanel.page.showHeader")}
                      checked={screenConfig.showHeader}
                      onCheckedChange={(checked) => handleScreenConfigPatch({showHeader: checked})}
                    />
                    <ToggleRow
                      label={t("rightPanel.page.showTimestamp")}
                      checked={screenConfig.showTimestamp}
                      onCheckedChange={(checked) => handleScreenConfigPatch({showTimestamp: checked})}
                    />
                    <ToggleRow
                      label={t("rightPanel.page.showBadge")}
                      checked={screenConfig.showStatusBadge}
                      onCheckedChange={(checked) => handleScreenConfigPatch({showStatusBadge: checked})}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={t("rightPanel.page.badgeLabel")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.statusBadgeLabel}
                          onChange={(event) => handleScreenConfigPatch({statusBadgeLabel: event.target.value})}
                        />
                      </EditorField>
                      <EditorField label={t("rightPanel.page.metaLabel")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.statusMetaLabel}
                          onChange={(event) => handleScreenConfigPatch({statusMetaLabel: event.target.value})}
                        />
                      </EditorField>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={t("rightPanel.page.timeText")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.timeText}
                          onChange={(event) => handleScreenConfigPatch({timeText: event.target.value})}
                        />
                      </EditorField>
                      <EditorField label={t("rightPanel.page.dateText")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.dateText}
                          onChange={(event) => handleScreenConfigPatch({dateText: event.target.value})}
                        />
                      </EditorField>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={t("rightPanel.page.rightPrimary")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.rightMetaPrimary}
                          onChange={(event) => handleScreenConfigPatch({rightMetaPrimary: event.target.value})}
                        />
                      </EditorField>
                      <EditorField label={t("rightPanel.page.rightSecondary")}>
                        <Input
                          className={editorControlClass}
                          value={screenConfig.rightMetaSecondary}
                          onChange={(event) => handleScreenConfigPatch({rightMetaSecondary: event.target.value})}
                        />
                      </EditorField>
                    </div>
                  </EditorSection>

                  <EditorSection title={t("rightPanel.background.title")} subtitle={t("rightPanel.background.subtitle")}>
                    <EditorField label={t("rightPanel.background.mode")}>
                      <Select
                        className={editorControlClass}
                        value={screenConfig.backgroundMode}
                        onChange={(event) =>
                          handleScreenConfigPatch({
                            backgroundMode: event.target.value as ScreenConfig["backgroundMode"],
                          })
                        }
                        options={[
                          {label: t("rightPanel.background.color"), value: "color"},
                          {label: t("rightPanel.background.gradient"), value: "gradient"},
                          {label: t("rightPanel.background.image"), value: "image"},
                        ]}
                      />
                    </EditorField>
                    <EditorField label={t("rightPanel.background.baseColor")}>
                      <Input
                        className={editorControlClass}
                        value={screenConfig.backgroundColor}
                        onChange={(event) => handleScreenConfigPatch({backgroundColor: event.target.value})}
                      />
                    </EditorField>
                    {screenConfig.backgroundMode === "gradient" ? (
                      <EditorField label={t("rightPanel.background.gradientValue")}>
                        <Textarea
                          value={screenConfig.backgroundGradient}
                          onChange={(event) => handleScreenConfigPatch({backgroundGradient: event.target.value})}
                          className="min-h-24 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                        />
                      </EditorField>
                    ) : null}
                    {screenConfig.backgroundMode === "image" ? (
                      <>
                        <EditorField label={t("rightPanel.background.imageUrl")}>
                          <Input
                            className={editorControlClass}
                            value={screenConfig.backgroundImage}
                            onChange={(event) => handleScreenConfigPatch({backgroundImage: event.target.value})}
                          />
                        </EditorField>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={t("rightPanel.background.imageFit")}>
                            <Select
                              className={editorControlClass}
                              value={screenConfig.backgroundFit}
                              onChange={(event) =>
                                handleScreenConfigPatch({
                                  backgroundFit: event.target.value as ScreenConfig["backgroundFit"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "铺满" : "Cover", value: "cover"},
                                {label: locale === "zh-CN" ? "完整显示" : "Contain", value: "contain"},
                                {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={t("rightPanel.background.overlay")}>
                            <Input
                              className={editorControlClass}
                              value={`${screenConfig.backgroundOverlay}%`}
                              onChange={(event) =>
                                handleScreenConfigPatch({
                                  backgroundOverlay: clamp(
                                    numberOr(event.target.value.replace("%", ""), screenConfig.backgroundOverlay),
                                    0,
                                    100,
                                  ),
                                })
                              }
                            />
                          </EditorField>
                        </div>
                      </>
                    ) : null}
                  </EditorSection>

                  <EditorSection title={t("rightPanel.layout.title")}>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={t("rightPanel.layout.width")}>
                        <Input className={editorControlClass} value={String(selectedWidget.width)} onChange={(event) => handleWidgetPatch({width: numberOr(event.target.value, selectedWidget.width)})} />
                      </EditorField>
                      <EditorField label={t("rightPanel.layout.height")}>
                        <Input className={editorControlClass} value={String(selectedWidget.height)} onChange={(event) => handleWidgetPatch({height: numberOr(event.target.value, selectedWidget.height)})} />
                      </EditorField>
                      <EditorField label={t("rightPanel.layout.x")}>
                        <Input className={editorControlClass} value={String(selectedWidget.x)} onChange={(event) => handleWidgetPatch({x: numberOr(event.target.value, selectedWidget.x)})} />
                      </EditorField>
                      <EditorField label={t("rightPanel.layout.y")}>
                        <Input className={editorControlClass} value={String(selectedWidget.y)} onChange={(event) => handleWidgetPatch({y: numberOr(event.target.value, selectedWidget.y)})} />
                      </EditorField>
                    </div>
                    <EditorField label={t("rightPanel.layout.align")} className="mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        <MiniActionButton label={t("rightPanel.layout.alignLeft")} onClick={() => alignSelectedWidget("left")} />
                        <MiniActionButton label={t("rightPanel.layout.alignCenter")} onClick={() => alignSelectedWidget("center")} />
                        <MiniActionButton label={t("rightPanel.layout.alignRight")} onClick={() => alignSelectedWidget("right")} />
                        <MiniActionButton label={t("rightPanel.layout.alignTop")} onClick={() => alignSelectedWidget("top")} />
                        <MiniActionButton label={t("rightPanel.layout.alignMiddle")} onClick={() => alignSelectedWidget("middle")} />
                        <MiniActionButton label={t("rightPanel.layout.alignBottom")} onClick={() => alignSelectedWidget("bottom")} />
                      </div>
                    </EditorField>
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
                    <EditorField label={locale === "zh-CN" ? "锁定状态" : "Lock State"}>
                      <div className="flex items-center justify-between rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-[12px] text-[#1a1c19]">
                          {selectedWidgets.length && selectedWidgets.every((widget) => widget.locked) ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                          {selectedWidgets.length && selectedWidgets.every((widget) => widget.locked)
                            ? locale === "zh-CN"
                              ? "当前已锁定"
                              : "Currently locked"
                            : locale === "zh-CN"
                              ? "当前可编辑"
                              : "Currently editable"}
                        </span>
                        <Switch
                          checked={selectedWidgets.length ? selectedWidgets.every((widget) => widget.locked) : (selectedWidget.locked ?? false)}
                          onCheckedChange={setSelectedWidgetsLocked}
                        />
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
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "文字颜色" : "Text Color"}>
                            <Input
                              className={editorControlClass}
                              value={selectedWidget.textColor ?? "#1a1c19"}
                              onChange={(event) => handleWidgetPatch({textColor: event.target.value})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "字号" : "Font Size"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.fontSize ?? 22)}
                              onChange={(event) => handleWidgetPatch({fontSize: numberOr(event.target.value, selectedWidget.fontSize ?? 22)})}
                            />
                          </EditorField>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "字重" : "Font Weight"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.fontWeight ?? "semibold"}
                              onChange={(event) =>
                                handleWidgetPatch({fontWeight: event.target.value as EditorWidget["fontWeight"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "常规" : "Regular", value: "regular"},
                                {label: locale === "zh-CN" ? "中等" : "Medium", value: "medium"},
                                {label: locale === "zh-CN" ? "半粗" : "Semibold", value: "semibold"},
                                {label: locale === "zh-CN" ? "加粗" : "Bold", value: "bold"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "行高" : "Line Height"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.lineHeight ?? 1.4)}
                              onChange={(event) => handleWidgetPatch({lineHeight: numberOr(event.target.value, selectedWidget.lineHeight ?? 1.4)})}
                            />
                          </EditorField>
                        </div>
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
                        <EditorField label={locale === "zh-CN" ? "填充模式" : "Fit Mode"}>
                          <Select
                            className={editorControlClass}
                            value={selectedWidget.imageFit ?? "cover"}
                            onChange={(event) => handleWidgetPatch({imageFit: event.target.value as EditorWidget["imageFit"]})}
                            options={[
                              {label: locale === "zh-CN" ? "铺满裁切" : "Cover", value: "cover"},
                              {label: locale === "zh-CN" ? "完整显示" : "Contain", value: "contain"},
                              {label: locale === "zh-CN" ? "拉伸填充" : "Fill", value: "fill"},
                            ]}
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
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "圆角" : "Corner Radius"}>
                        <Input
                          className={editorControlClass}
                          value={String(selectedWidget.radius ?? 8)}
                          onChange={(event) => handleWidgetPatch({radius: numberOr(event.target.value, selectedWidget.radius ?? 8)})}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "内边距" : "Padding"}>
                        <Input
                          className={editorControlClass}
                          value={String(selectedWidget.padding ?? 16)}
                          onChange={(event) => handleWidgetPatch({padding: numberOr(event.target.value, selectedWidget.padding ?? 16)})}
                        />
                      </EditorField>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "阴影强度" : "Shadow"}>
                        <Select
                          className={editorControlClass}
                          value={selectedWidget.shadow ?? "soft"}
                          onChange={(event) =>
                            handleWidgetPatch({
                              shadow: event.target.value as EditorWidget["shadow"],
                            })
                          }
                          options={[
                            {label: locale === "zh-CN" ? "无" : "None", value: "none"},
                            {label: locale === "zh-CN" ? "柔和" : "Soft", value: "soft"},
                            {label: locale === "zh-CN" ? "中等" : "Medium", value: "medium"},
                            {label: locale === "zh-CN" ? "强" : "Strong", value: "strong"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "标题对齐" : "Title Align"}>
                        <Select
                          className={editorControlClass}
                          value={selectedWidget.titleAlign ?? "left"}
                          onChange={(event) =>
                            handleWidgetPatch({
                              titleAlign: event.target.value as EditorWidget["titleAlign"],
                            })
                          }
                          options={[
                            {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                            {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                            {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                          ]}
                        />
                      </EditorField>
                    </div>
                    <EditorField label={locale === "zh-CN" ? "标题显示" : "Show Title"}>
                      <div className="flex items-center justify-between rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-2">
                        <span className="text-[12px] text-[#1a1c19]">
                          {selectedWidget.titleVisible === false
                            ? locale === "zh-CN"
                              ? "当前隐藏"
                              : "Currently hidden"
                            : locale === "zh-CN"
                              ? "当前显示"
                              : "Currently visible"}
                        </span>
                        <Switch
                          checked={selectedWidget.titleVisible !== false}
                          onCheckedChange={(checked) => handleWidgetPatch({titleVisible: checked})}
                        />
                      </div>
                    </EditorField>
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
                    {fieldMappingOptions.length ? (
                      <div className="space-y-2.5">
                        {fieldMappingOptions.map((mapping) => (
                          <EditorField key={mapping.alias} label={mapping.label} hint={mapping.hint}>
                            <Select
                              className={editorControlClass}
                              value={
                                parsedFieldMap[mapping.alias] ??
                                selectedDatasetFields.find((field) =>
                                  mapping.preferredTypes.includes(field.type),
                                )?.field ??
                                selectedDatasetFields[0]?.field ??
                                ""
                              }
                              onChange={(event) => handleFieldAliasChange(mapping.alias, event.target.value)}
                              options={
                                selectedDatasetFields.length
                                  ? selectedDatasetFields.map((field) => ({
                                      label: `${field.field} · ${field.type}`,
                                      value: field.field,
                                    }))
                                  : [
                                      {
                                        label: locale === "zh-CN" ? "暂无可选字段" : "No fields available",
                                        value: "",
                                      },
                                    ]
                              }
                            />
                          </EditorField>
                        ))}
                      </div>
                    ) : null}
                    <EditorField label={t("rightPanel.dataBinding.fieldMap")}>
                      <Textarea
                        value={fieldMapValue}
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
                      <EditorField label={locale === "zh-CN" ? "路线样式" : "Route Style"}>
                        <Select
                          className={editorControlClass}
                          value={mapRouteStyle}
                          onChange={(event) => setMapRouteStyle(event.target.value as "solid" | "dashed" | "pulse")}
                          options={[
                            {label: locale === "zh-CN" ? "连续光带" : "Solid", value: "solid"},
                            {label: locale === "zh-CN" ? "虚线路径" : "Dashed", value: "dashed"},
                            {label: locale === "zh-CN" ? "脉冲高亮" : "Pulse", value: "pulse"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "标签风格" : "Label Style"}>
                        <Select
                          className={editorControlClass}
                          value={mapLabelStyle}
                          onChange={(event) => setMapLabelStyle(event.target.value as "pill" | "minimal")}
                          options={[
                            {label: locale === "zh-CN" ? "胶囊标签" : "Pill", value: "pill"},
                            {label: locale === "zh-CN" ? "极简标注" : "Minimal", value: "minimal"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "地表层次" : "Surface Tone"}>
                        <Select
                          className={editorControlClass}
                          value={mapSurfaceTone}
                          onChange={(event) => setMapSurfaceTone(event.target.value as "soft" | "contrast")}
                          options={[
                            {label: locale === "zh-CN" ? "柔和" : "Soft", value: "soft"},
                            {label: locale === "zh-CN" ? "高对比" : "Contrast", value: "contrast"},
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
                      {[...orderedWidgets].reverse().map((widget) => (
                        <button
                          key={widget.id}
                          onClick={(event) => selectWidget(widget.id, event.shiftKey || event.metaKey || event.ctrlKey)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] ${
                            selectedWidgetIdSet.has(widget.id) ? "bg-[#dce9dc] text-[#23422a]" : "bg-[#f4f4ef] text-[#1a1c19]"
                          }`}
                        >
                          <span className="inline-flex min-w-0 items-center gap-2">
                            {(widget.locked ?? false) ? <Lock className="h-3.5 w-3.5 shrink-0 text-[#727971]" /> : null}
                            <span className="truncate">{widget.title}</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#727971]">
                            #{widget.zIndex ?? 0}
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

function MiniActionButton({label, onClick}: {label: string; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea]"
    >
      {label}
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
  mapRouteStyle,
  mapLabelStyle,
  mapSurfaceTone,
  dataset,
  onDragStart,
  onResizeStart,
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
  mapRouteStyle: "solid" | "dashed" | "pulse";
  mapLabelStyle: "pill" | "minimal";
  mapSurfaceTone: "soft" | "contrast";
  dataset?: {fields: DatasetPanelItem["fields"]; rows: DatasetRow[]};
  onDragStart: (widgetId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (
    widgetId: string,
    direction: ResizeDirection,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  return (
    <div className="absolute" style={editorWidgetPlacement(widget)}>
      <button onPointerDown={(event) => onDragStart(widget.id, event)} className="relative block h-full w-full text-left">
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
          mapRouteStyle={mapRouteStyle}
          mapLabelStyle={mapLabelStyle}
          mapSurfaceTone={mapSurfaceTone}
          dataset={dataset}
        />
      </button>
      {selected ? (
        <>
          <ResizeHandle
            className="right-0 top-1/2 -translate-y-1/2 cursor-ew-resize"
            label="Resize width"
            onPointerDown={(event) => onResizeStart(widget.id, "e", event)}
          />
          <ResizeHandle
            className="bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize"
            label="Resize height"
            onPointerDown={(event) => onResizeStart(widget.id, "s", event)}
          />
          <ResizeHandle
            className="bottom-0 right-0 cursor-nwse-resize"
            label="Resize widget"
            onPointerDown={(event) => onResizeStart(widget.id, "se", event)}
          />
        </>
      ) : null}
    </div>
  );
}

function ResizeHandle({
  className,
  label,
  onPointerDown,
}: {
  className: string;
  label: string;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      className={`absolute z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#23422a]/35 bg-[#fafaf5] shadow-[0_4px_10px_rgba(26,28,25,0.12)] transition-transform hover:scale-105 ${className}`}
      style={{marginRight: -7, marginBottom: -7}}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#23422a]" />
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
  if (name.includes("Area")) return <AreaChart className={className} strokeWidth={2} />;
  if (name.includes("Bar")) return <BarChart3 className={className} strokeWidth={2} />;
  if (name.includes("Pie")) return <PieChart className={className} strokeWidth={2} />;
  if (name.includes("Table")) return <Table2 className={className} strokeWidth={2} />;
  if (name.includes("Rank")) return <ListOrdered className={className} strokeWidth={2} />;
  if (name.includes("World Map")) return <Globe2 className={className} strokeWidth={2} />;
  if (name.includes("Image")) return <ImageIcon className={className} strokeWidth={2} />;
  if (name.includes("Text")) return <Type className={className} strokeWidth={2} />;

  return <span className="text-sm font-bold">{fallback}</span>;
}

function resolveWidgetType(name: string): EditorWidget["type"] {
  if (name.includes("Line")) return "line";
  if (name.includes("Area")) return "area";
  if (name.includes("Bar")) return "bar";
  if (name.includes("Pie")) return "pie";
  if (name.includes("Table")) return "table";
  if (name.includes("Rank")) return "rank";
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
    area: "面积图",
    pie: "环形图",
    map: "地图组件",
    bar: "柱状图",
    events: "事件列表",
    table: "数据表格",
    rank: "排行组件",
    text: "文本说明",
    image: "图片组件",
  };
  const en = {
    metric: "Metric",
    line: "Line Chart",
    area: "Area Chart",
    pie: "Pie Chart",
    map: "Map Widget",
    bar: "Bar Chart",
    events: "Event Feed",
    table: "Data Table",
    rank: "Rank List",
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

function resolveSnapForMove(
  widgets: EditorWidget[],
  movingWidget: EditorWidget,
  proposedX: number,
  proposedY: number,
  canvasView: CanvasView,
) {
  const threshold = canvasView === "grid" ? 18 : 10;
  let snappedX = canvasView === "grid" ? snapToGrid(proposedX) : proposedX;
  let snappedY = canvasView === "grid" ? snapToGrid(proposedY) : proposedY;
  let vertical: number | undefined;
  let horizontal: number | undefined;

  const candidates = widgets.filter((widget) => widget.id !== movingWidget.id);
  const left = proposedX;
  const right = proposedX + movingWidget.width;
  const centerX = proposedX + movingWidget.width / 2;
  const top = proposedY;
  const bottom = proposedY + movingWidget.height;
  const centerY = proposedY + movingWidget.height / 2;

  let bestX = threshold;
  let bestY = threshold;

  const baselineXOptions = [
    {delta: Math.abs(left - 0), next: 0, guide: 0},
    {
      delta: Math.abs(right - EDITOR_CANVAS_WIDTH),
      next: EDITOR_CANVAS_WIDTH - movingWidget.width,
      guide: EDITOR_CANVAS_WIDTH,
    },
    {
      delta: Math.abs(centerX - EDITOR_CANVAS_WIDTH / 2),
      next: EDITOR_CANVAS_WIDTH / 2 - movingWidget.width / 2,
      guide: EDITOR_CANVAS_WIDTH / 2,
    },
  ];

  for (const option of baselineXOptions) {
    if (option.delta <= bestX) {
      bestX = option.delta;
      snappedX = clamp(Math.round(option.next), 0, Math.max(0, EDITOR_CANVAS_WIDTH - movingWidget.width));
      vertical = option.guide;
    }
  }

  const baselineYOptions = [
    {delta: Math.abs(top - 0), next: 0, guide: 0},
    {
      delta: Math.abs(bottom - EDITOR_CANVAS_HEIGHT),
      next: EDITOR_CANVAS_HEIGHT - movingWidget.height,
      guide: EDITOR_CANVAS_HEIGHT,
    },
    {
      delta: Math.abs(centerY - EDITOR_CANVAS_HEIGHT / 2),
      next: EDITOR_CANVAS_HEIGHT / 2 - movingWidget.height / 2,
      guide: EDITOR_CANVAS_HEIGHT / 2,
    },
  ];

  for (const option of baselineYOptions) {
    if (option.delta <= bestY) {
      bestY = option.delta;
      snappedY = clamp(Math.round(option.next), 0, Math.max(0, EDITOR_CANVAS_HEIGHT - movingWidget.height));
      horizontal = option.guide;
    }
  }

  for (const candidate of candidates) {
    const candidateLeft = candidate.x;
    const candidateRight = candidate.x + candidate.width;
    const candidateCenterX = candidate.x + candidate.width / 2;
    const candidateTop = candidate.y;
    const candidateBottom = candidate.y + candidate.height;
    const candidateCenterY = candidate.y + candidate.height / 2;

    const xOptions = [
      {delta: Math.abs(left - candidateLeft), next: candidateLeft, guide: candidateLeft},
      {delta: Math.abs(right - candidateRight), next: candidateRight - movingWidget.width, guide: candidateRight},
      {delta: Math.abs(centerX - candidateCenterX), next: candidateCenterX - movingWidget.width / 2, guide: candidateCenterX},
    ];

    for (const option of xOptions) {
      if (option.delta <= bestX) {
        bestX = option.delta;
        snappedX = clamp(Math.round(option.next), 0, Math.max(0, EDITOR_CANVAS_WIDTH - movingWidget.width));
        vertical = option.guide;
      }
    }

    const yOptions = [
      {delta: Math.abs(top - candidateTop), next: candidateTop, guide: candidateTop},
      {delta: Math.abs(bottom - candidateBottom), next: candidateBottom - movingWidget.height, guide: candidateBottom},
      {delta: Math.abs(centerY - candidateCenterY), next: candidateCenterY - movingWidget.height / 2, guide: candidateCenterY},
    ];

    for (const option of yOptions) {
      if (option.delta <= bestY) {
        bestY = option.delta;
        snappedY = Math.max(0, Math.round(option.next));
        horizontal = option.guide;
      }
    }
  }

  return {
    x: clamp(snappedX, 0, Math.max(0, EDITOR_CANVAS_WIDTH - movingWidget.width)),
    y: clamp(snappedY, 0, Math.max(0, EDITOR_CANVAS_HEIGHT - movingWidget.height)),
    guides: {
      vertical: bestX < threshold ? vertical : undefined,
      horizontal: bestY < threshold ? horizontal : undefined,
    },
  };
}

function resolveSnapForResize(
  widgets: EditorWidget[],
  resizingWidget: EditorWidget,
  proposedWidth: number,
  proposedHeight: number,
  canvasView: CanvasView,
) {
  const threshold = canvasView === "grid" ? 18 : 10;
  let snappedWidth = canvasView === "grid" ? snapToGrid(proposedWidth) : proposedWidth;
  let snappedHeight = canvasView === "grid" ? snapToGrid(proposedHeight) : proposedHeight;
  let vertical: number | undefined;
  let horizontal: number | undefined;
  let bestX = threshold;
  let bestY = threshold;
  const proposedRight = resizingWidget.x + proposedWidth;
  const proposedBottom = resizingWidget.y + proposedHeight;

  const baselineWidthOptions = [
    {
      delta: Math.abs(proposedRight - EDITOR_CANVAS_WIDTH),
      next: EDITOR_CANVAS_WIDTH - resizingWidget.x,
      guide: EDITOR_CANVAS_WIDTH,
    },
    {
      delta: Math.abs(proposedRight - EDITOR_CANVAS_WIDTH / 2),
      next: EDITOR_CANVAS_WIDTH / 2 - resizingWidget.x,
      guide: EDITOR_CANVAS_WIDTH / 2,
    },
  ];

  for (const option of baselineWidthOptions) {
    if (option.delta <= bestX) {
      bestX = option.delta;
      snappedWidth = clamp(Math.round(option.next), 120, Math.max(120, EDITOR_CANVAS_WIDTH - resizingWidget.x));
      vertical = option.guide;
    }
  }

  const baselineHeightOptions = [
    {
      delta: Math.abs(proposedBottom - EDITOR_CANVAS_HEIGHT),
      next: EDITOR_CANVAS_HEIGHT - resizingWidget.y,
      guide: EDITOR_CANVAS_HEIGHT,
    },
    {
      delta: Math.abs(proposedBottom - EDITOR_CANVAS_HEIGHT / 2),
      next: EDITOR_CANVAS_HEIGHT / 2 - resizingWidget.y,
      guide: EDITOR_CANVAS_HEIGHT / 2,
    },
  ];

  for (const option of baselineHeightOptions) {
    if (option.delta <= bestY) {
      bestY = option.delta;
      snappedHeight = clamp(Math.round(option.next), 80, Math.max(80, EDITOR_CANVAS_HEIGHT - resizingWidget.y));
      horizontal = option.guide;
    }
  }

  const candidates = widgets.filter((widget) => widget.id !== resizingWidget.id);

  for (const candidate of candidates) {
    const candidateRight = candidate.x + candidate.width;
    const candidateBottom = candidate.y + candidate.height;

    const widthDelta = Math.abs(proposedRight - candidateRight);
    if (widthDelta <= bestX) {
      bestX = widthDelta;
      snappedWidth = clamp(Math.round(candidateRight - resizingWidget.x), 120, Math.max(120, EDITOR_CANVAS_WIDTH - resizingWidget.x));
      vertical = candidateRight;
    }

    const heightDelta = Math.abs(proposedBottom - candidateBottom);
    if (heightDelta <= bestY) {
      bestY = heightDelta;
      snappedHeight = Math.max(80, Math.round(candidateBottom - resizingWidget.y));
      horizontal = candidateBottom;
    }
  }

  return {
    width: clamp(snappedWidth, 120, Math.max(120, EDITOR_CANVAS_WIDTH - resizingWidget.x)),
    height: clamp(snappedHeight, 80, Math.max(80, EDITOR_CANVAS_HEIGHT - resizingWidget.y)),
    guides: {
      vertical: bestX < threshold ? vertical : undefined,
      horizontal: bestY < threshold ? horizontal : undefined,
    },
  };
}

const CANVAS_GRID_SIZE = 24;

function snapToGrid(value: number) {
  return Math.round(value / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
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

type FieldMappingOption = {
  alias: string;
  label: string;
  hint?: string;
  preferredTypes: string[];
};

function buildFieldMappingOptions(type: EditorWidget["type"], locale: string): FieldMappingOption[] {
  const zh = locale === "zh-CN";

  if (type === "metric") {
    return [
      {
        alias: "value",
        label: zh ? "主数值字段" : "Primary Value",
        hint: zh ? "用于指标主值" : "Feeds the main metric",
        preferredTypes: ["Numeric"],
      },
      {
        alias: "status",
        label: zh ? "辅助说明字段" : "Supporting Label",
        hint: zh ? "用于趋势或状态文案" : "Used for hint/status copy",
        preferredTypes: ["Text", "Category"],
      },
    ];
  }

  if (type === "line" || type === "bar" || type === "area") {
    return [
      {
        alias: "timestamp",
        label: zh ? "横轴字段" : "X Axis Field",
        hint: zh ? "时间或分类轴" : "Time or category axis",
        preferredTypes: ["Date / Time", "Category"],
      },
      {
        alias: "value",
        label: zh ? "数值字段" : "Value Field",
        hint: zh ? "用于图表主值" : "Feeds the plotted values",
        preferredTypes: ["Numeric"],
      },
    ];
  }

  if (type === "pie") {
    return [
      {
        alias: "category",
        label: zh ? "分类字段" : "Category Field",
        hint: zh ? "用于扇区分类" : "Used for slice categories",
        preferredTypes: ["Category", "Text"],
      },
      {
        alias: "value",
        label: zh ? "数值字段" : "Value Field",
        hint: zh ? "用于扇区数值" : "Used for slice values",
        preferredTypes: ["Numeric"],
      },
    ];
  }

  if (type === "events") {
    return [
      {
        alias: "title",
        label: zh ? "事件标题字段" : "Event Title",
        hint: zh ? "用于事件主文本" : "Feeds the event title",
        preferredTypes: ["Text", "Category"],
      },
      {
        alias: "meta",
        label: zh ? "事件辅助字段" : "Event Meta",
        hint: zh ? "用于时间或附加信息" : "Used for time or metadata",
        preferredTypes: ["Date / Time", "Category", "Text"],
      },
    ];
  }

  if (type === "rank" || type === "table") {
    return [
      {
        alias: "category",
        label: zh ? "主标签字段" : "Primary Label",
        hint: zh ? "用于列表主文本" : "Feeds the main row label",
        preferredTypes: ["Category", "Text"],
      },
      {
        alias: "value",
        label: zh ? "数值字段" : "Value Field",
        hint: zh ? "用于排行值或进度条" : "Feeds the rank score or bar value",
        preferredTypes: ["Numeric"],
      },
    ];
  }

  if (type === "map") {
    return [
      {
        alias: "region",
        label: zh ? "区域字段" : "Region Field",
        hint: zh ? "用于映射地区或港口名称" : "Maps region or hub labels to coordinates",
        preferredTypes: ["Category", "Text"],
      },
      {
        alias: "value",
        label: zh ? "热度数值字段" : "Intensity Field",
        hint: zh ? "决定点位和路线的热度" : "Controls marker and route intensity",
        preferredTypes: ["Numeric"],
      },
      {
        alias: "latitude",
        label: zh ? "纬度字段" : "Latitude Field",
        hint: zh ? "如果数据自带坐标，可直接指定纬度" : "Use when the dataset already contains coordinates",
        preferredTypes: ["Numeric"],
      },
      {
        alias: "longitude",
        label: zh ? "经度字段" : "Longitude Field",
        hint: zh ? "如果数据自带坐标，可直接指定经度" : "Use when the dataset already contains coordinates",
        preferredTypes: ["Numeric"],
      },
    ];
  }

  return [];
}

function stringifyFieldMap(fieldMap: Record<string, string>) {
  return Object.entries(fieldMap)
    .filter(([, fieldName]) => fieldName)
    .map(([alias, fieldName]) => `${fieldName} -> ${alias}`)
    .join("\n");
}

function widgetsForTemplate(templateId: string, baseWidgets: EditorWidget[], locale: string) {
  const normalizedTemplate = mapTemplateToEditorPreset(templateId);
  if (!normalizedTemplate) return null;

  return baseWidgets.map((widget) => {
    if (normalizedTemplate === "sales-atlas") {
      if (widget.id === "active-vessels") {
        return {
          ...widget,
          title: locale === "zh-CN" ? "活跃商机" : "Active Deals",
          value: "328",
          hint: "+9.1%",
          accent: "#23422a",
        };
      }

      if (widget.id === "world-map") {
        return {
          ...widget,
          title: locale === "zh-CN" ? "区域销售热力" : "Regional Sales Heat",
          hint: locale === "zh-CN" ? "按销售区域聚合" : "Aggregated by sales territory",
        };
      }

      if (widget.id === "fleet-table") {
        return {
          ...widget,
          title: locale === "zh-CN" ? "客户列表" : "Account Table",
          hint: locale === "zh-CN" ? "重点客户跟进状态" : "Priority account follow-up",
        };
      }
    }

    if (normalizedTemplate === "city-monitor") {
      if (widget.id === "world-map") {
        return {
          ...widget,
          title: locale === "zh-CN" ? "城市监控地图" : "City Monitoring Map",
          hint: locale === "zh-CN" ? "事件、路网与告警图层" : "Events, traffic and alert layers",
        };
      }

      if (widget.id === "delayed-shipments") {
        return {
          ...widget,
          title: locale === "zh-CN" ? "待处理告警" : "Pending Alerts",
          value: "19",
          hint: locale === "zh-CN" ? "桥梁区摄像头离线" : "Bridge camera offline",
        };
      }
    }

    return widget;
  });
}

function mapTemplateToEditorPreset(templateId: string) {
  if (templateId === "sales-analysis") return "sales-atlas";
  if (templateId === "urban-control") return "city-monitor";
  if (templateId === "operations-hub") return "ops-center";
  return editorTemplates.some((template) => template.id === templateId) ? templateId : null;
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
