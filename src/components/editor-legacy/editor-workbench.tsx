"use client";

import {useEffect, useEffectEvent, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import {
  ArrowLeft,
  AreaChart,
  BarChart3,
  Database,
  Globe2,
  ImageIcon,
  Lock,
  LayoutGrid,
  Layers3,
  LineChart,
  ListOrdered,
  PieChart,
  PlusCircle,
  Redo2,
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
import {ScreenHeader} from "@/components/screen/screen-header";
import {
  EditorCanvasWidget,
  editorWidgetPlacementWithin,
} from "@/components/editor/editor-canvas-widgets";
import {
  categoricalSeries,
  eventSnapshot,
  eventSnapshotFromRows,
  inferFieldsFromRows,
  lineSeries,
  mapSnapshot,
  metricSnapshot,
  parseFieldMap,
  parseManualWidgetData,
  processEventSnapshotRows,
  processMapSnapshotData,
  processSeriesSnapshot,
  processTableSnapshotData,
  tableSnapshot,
  tableSnapshotFromRows,
  type ManualWidgetDataParseResult,
  type WidgetDataset,
} from "@/lib/editor-widget-data";
import {
  canvasPresets,
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
  mapPointScale: number;
  mapRouteWidth: number;
  mapLandOpacity: number;
  mapLabelOpacity: number;
  mapOceanColor: string;
  mapLandStartColor: string;
  mapLandEndColor: string;
  mapBorderColor: string;
  mapAxisColor: string;
  mapAxisSecondaryColor: string;
  mapRouteColor: string;
  mapRouteGlowColor: string;
  mapMarkerColor: string;
  mapMarkerHaloColor: string;
  mapMarkerGlowColor: string;
  mapLabelColor: string;
  mapPanelTextColor: string;
  mapHeatLowColor: string;
  mapHeatHighColor: string;
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

type MarqueeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MarqueeState = {
  startX: number;
  startY: number;
  additive: boolean;
};

type ContextMenuState = {
  widgetId: string;
  x: number;
  y: number;
};

type SnapGuides = {
  vertical?: number;
  horizontal?: number;
};

type AlignmentTarget = "left" | "center" | "right" | "top" | "middle" | "bottom";
type DistributionAxis = "horizontal" | "vertical";
type MatchSizeTarget = "width" | "height";
type RightPanelMode = "component" | "page";
type ComponentPanelTab = "content" | "data" | "style" | "advanced";

const backgroundPresets = [
  {
    id: "soft-grid",
    labelZh: "柔和网格",
    labelEn: "Soft Grid",
    value: "linear-gradient(180deg, #f7f5ef 0%, #eef4ea 36%, #eef2ea 100%)",
  },
  {
    id: "signal-depth",
    labelZh: "信号深场",
    labelEn: "Signal Depth",
    value:
      "radial-gradient(circle at 20% 18%, rgba(74, 128, 88, 0.18), transparent 22%), linear-gradient(180deg, #f6f4ec 0%, #e7efe6 42%, #dfeadf 100%)",
  },
  {
    id: "midnight-radar",
    labelZh: "深夜雷达",
    labelEn: "Midnight Radar",
    value:
      "radial-gradient(circle at 50% 18%, rgba(108, 173, 124, 0.22), transparent 24%), linear-gradient(180deg, #162119 0%, #101811 100%)",
  },
];

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
  const [mapPointScale, setMapPointScale] = useState(100);
  const [mapRouteWidth, setMapRouteWidth] = useState(100);
  const [mapLandOpacity, setMapLandOpacity] = useState(96);
  const [mapLabelOpacity, setMapLabelOpacity] = useState(92);
  const [mapOceanColor, setMapOceanColor] = useState("#0f1915");
  const [mapLandStartColor, setMapLandStartColor] = useState("#23422a");
  const [mapLandEndColor, setMapLandEndColor] = useState("#1b3423");
  const [mapBorderColor, setMapBorderColor] = useState("#4e7459");
  const [mapAxisColor, setMapAxisColor] = useState("#6f8575");
  const [mapAxisSecondaryColor, setMapAxisSecondaryColor] = useState("#486050");
  const [mapRouteColor, setMapRouteColor] = useState("#bde7c7");
  const [mapRouteGlowColor, setMapRouteGlowColor] = useState("#8ef0ae");
  const [mapMarkerColor, setMapMarkerColor] = useState("#dfffe7");
  const [mapMarkerHaloColor, setMapMarkerHaloColor] = useState("#9ae9ae");
  const [mapMarkerGlowColor, setMapMarkerGlowColor] = useState("#8ef0ae");
  const [mapLabelColor, setMapLabelColor] = useState("#f5fff7");
  const [mapPanelTextColor, setMapPanelTextColor] = useState("#243129");
  const [mapHeatLowColor, setMapHeatLowColor] = useState("#4d8f67");
  const [mapHeatHighColor, setMapHeatHighColor] = useState("#bde7c7");
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
  const sectionViewportRef = useRef<HTMLDivElement | null>(null);
  const canvasGridRef = useRef<HTMLDivElement | null>(null);
  const backgroundAssetInputRef = useRef<HTMLInputElement | null>(null);
  const imageAssetInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const marqueeStateRef = useRef<MarqueeState | null>(null);
  const clipboardRef = useRef<EditorWidget[]>([]);
  const widgetsRef = useRef<EditorWidget[]>(editorWidgets);
  const seededTemplateRef = useRef(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({});
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fitZoom, setFitZoom] = useState(0.85);
  const [componentPanelTab, setComponentPanelTab] = useState<ComponentPanelTab>("content");
  const hasManualZoomRef = useRef(false);
  const marqueeRectRef = useRef<MarqueeRect | null>(null);
  const currentCanvasWidth = screenConfig.canvasWidth || EDITOR_CANVAS_WIDTH;
  const currentCanvasHeight = screenConfig.canvasHeight || EDITOR_CANVAS_HEIGHT;
  const currentCanvasLabel = `${currentCanvasWidth} × ${currentCanvasHeight}`;
  const canvasFrameHeight = currentCanvasHeight + 78;

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
        Array.isArray(draft.selectedWidgetIds) ? draft.selectedWidgetIds : [draft.selectedWidgetId],
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
      setMapPointScale(draft.mapPointScale ?? 100);
      setMapRouteWidth(draft.mapRouteWidth ?? 100);
      setMapLandOpacity(draft.mapLandOpacity ?? 96);
      setMapLabelOpacity(draft.mapLabelOpacity ?? 92);
      setMapOceanColor(draft.mapOceanColor ?? "#0f1915");
      setMapLandStartColor(draft.mapLandStartColor ?? "#23422a");
      setMapLandEndColor(draft.mapLandEndColor ?? "#1b3423");
      setMapBorderColor(draft.mapBorderColor ?? "#4e7459");
      setMapAxisColor(draft.mapAxisColor ?? "#6f8575");
      setMapAxisSecondaryColor(draft.mapAxisSecondaryColor ?? "#486050");
      setMapRouteColor(draft.mapRouteColor ?? "#bde7c7");
      setMapRouteGlowColor(draft.mapRouteGlowColor ?? "#8ef0ae");
      setMapMarkerColor(draft.mapMarkerColor ?? "#dfffe7");
      setMapMarkerHaloColor(draft.mapMarkerHaloColor ?? "#9ae9ae");
      setMapMarkerGlowColor(draft.mapMarkerGlowColor ?? "#8ef0ae");
      setMapLabelColor(draft.mapLabelColor ?? "#f5fff7");
      setMapPanelTextColor(draft.mapPanelTextColor ?? "#243129");
      setMapHeatLowColor(draft.mapHeatLowColor ?? "#4d8f67");
      setMapHeatHighColor(draft.mapHeatHighColor ?? "#bde7c7");
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
    marqueeRectRef.current = marqueeRect;
  }, [marqueeRect]);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    const element = sectionViewportRef.current;
    if (!element) return;

    const updateFitZoom = () => {
      // For wide dashboard editors, filling the horizontal workspace first is
      // more intuitive than shrinking until both axes fit. Vertical overflow is
      // acceptable because the workspace already supports scrolling.
      const nextFitZoom = clamp((element.clientWidth - 24) / currentCanvasWidth, 0.38, 1);

      setFitZoom(nextFitZoom);
      if (!hasManualZoomRef.current) {
        setZoom(nextFitZoom);
      }
    };

    updateFitZoom();
    const observer = new ResizeObserver(updateFitZoom);
    observer.observe(element);
    return () => observer.disconnect();
  }, [currentCanvasWidth]);

  const handleCanvasKeyboard = useEffectEvent((event: KeyboardEvent) => {
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
      clipboardRef.current = widgetsRef.current.filter((widget) => selectedWidgetIds.includes(widget.id)).map((widget) => ({...widget}));
      return;
    }

    if (commandPressed && event.key.toLowerCase() === "v") {
      event.preventDefault();
      if (!clipboardRef.current.length) return;
      pasteClipboard();
      return;
    }

    if ((event.key === "Backspace" || event.key === "Delete") && widgetsRef.current.length > 1 && selectedWidgetIds.length) {
      event.preventDefault();
      deleteSelectedWidget();
      return;
    }

    const step = event.shiftKey ? 10 : 1;

    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    if (!selectedWidgetIds.length) return;
    event.preventDefault();

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: snapshot.widgets.map((widget) => {
        const activeIds = snapshot.selectedWidgetIds?.length ? snapshot.selectedWidgetIds : [];
        if (!activeIds.includes(widget.id) || widget.locked) return widget;

        if (event.key === "ArrowLeft") {
          return {...widget, x: clamp(widget.x - step, 0, Math.max(0, currentCanvasWidth - widget.width))};
        }

        if (event.key === "ArrowRight") {
          return {...widget, x: clamp(widget.x + step, 0, Math.max(0, currentCanvasWidth - widget.width))};
        }

        if (event.key === "ArrowUp") {
          return {...widget, y: clamp(widget.y - step, 0, Math.max(0, currentCanvasHeight - widget.height))};
        }

        return {...widget, y: clamp(widget.y + step, 0, Math.max(0, currentCanvasHeight - widget.height))};
      }),
    }));
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleCanvasKeyboard(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
  const bindingSummary = useMemo(
    () =>
      fieldMappingOptions.map((mapping) => {
        const resolvedField =
          parsedFieldMap[mapping.alias] ??
          selectedDatasetFields.find((field) => mapping.preferredTypes.includes(field.type))?.field ??
          "";

        return {
          ...mapping,
          resolvedField,
          resolvedMeta: selectedDatasetFields.find((field) => field.field === resolvedField),
        };
      }),
    [fieldMappingOptions, parsedFieldMap, selectedDatasetFields],
  );
  const missingBindings = useMemo(
    () =>
      bindingSummary.filter((mapping) => {
        if (!mapping.resolvedField) return true;
        return !selectedDatasetFields.some((field) => field.field === mapping.resolvedField);
      }),
    [bindingSummary, selectedDatasetFields],
  );
  const isChartWidget = selectedWidget.type === "line" || selectedWidget.type === "area" || selectedWidget.type === "bar" || selectedWidget.type === "pie";
  const isMetricLikeWidget = selectedWidget.type === "metric" || selectedWidget.type === "numberFlip";
  const isDecorationWidget = selectedWidget.type === "decoration";
  const supportsManualData =
    isMetricLikeWidget ||
    selectedWidget.type === "line" ||
    selectedWidget.type === "area" ||
    selectedWidget.type === "bar" ||
    selectedWidget.type === "pie" ||
    selectedWidget.type === "map" ||
    selectedWidget.type === "rank" ||
    selectedWidget.type === "table" ||
    selectedWidget.type === "events";
  const supportsBasicFormatting =
    isMetricLikeWidget ||
    isChartWidget ||
    selectedWidget.type === "rank" ||
    selectedWidget.type === "table";
  const supportsDataProcessing =
    isChartWidget ||
    selectedWidget.type === "rank" ||
    selectedWidget.type === "table" ||
    selectedWidget.type === "events" ||
    selectedWidget.type === "map";
  const normalizedDataSourceMode = normalizeDataSourceMode(selectedWidget.dataSourceMode);
  const usesDatasetBinding = normalizedDataSourceMode === "static";
  const boundDataset = selectedWidget.dataset ? datasetLookup[selectedWidget.dataset] : undefined;
  const manualDataState = useMemo(
    () => (normalizedDataSourceMode === "manual" ? parseManualWidgetData(selectedWidget) : null),
    [normalizedDataSourceMode, selectedWidget],
  );
  const availableTableFields = useMemo(() => {
    if (selectedWidget.type !== "table") return [];
    if (normalizedDataSourceMode === "manual" && manualDataState?.valid && manualDataState.rows?.length) {
      return inferFieldsFromRows(manualDataState.rows);
    }
    return selectedDatasetFields;
  }, [manualDataState, normalizedDataSourceMode, selectedDatasetFields, selectedWidget.type]);
  const effectiveTableColumns = useMemo(() => {
    const preferred = selectedWidget.tableColumns?.filter((column) =>
      availableTableFields.some((field) => field.field === column),
    );

    return preferred?.length
      ? preferred
      : availableTableFields.slice(0, 5).map((field) => field.field);
  }, [availableTableFields, selectedWidget.tableColumns]);
  const dataProcessingFieldOptions = useMemo(
    () => buildDataProcessingFieldOptions(selectedWidget.type, availableTableFields, locale),
    [availableTableFields, locale, selectedWidget.type],
  );
  const supportsAggregation = isChartWidget || selectedWidget.type === "rank";
  const eventTargetOptions = useMemo(
    () => [
      {
        label: locale === "zh-CN" ? "当前组件" : "Current Widget",
        value: selectedWidget.id,
      },
      ...widgets.filter((widget) => widget.id !== selectedWidget.id).map((widget) => ({
        label: `${widget.title} / ${widget.id}`,
        value: widget.id,
      })),
    ],
    [locale, selectedWidget.id, widgets],
  );

  const eventConditionFieldOptions = useMemo(
    () => buildEventConditionFieldOptions(selectedWidget.type, availableTableFields, locale),
    [availableTableFields, locale, selectedWidget.type],
  );
  const selectedEventTargetIds = useMemo(() => {
    const explicitTargets = selectedWidget.eventTargetWidgetIds?.filter(Boolean);
    if (explicitTargets?.length) return Array.from(new Set(explicitTargets));
    if (selectedWidget.eventTargetWidgetId) return [selectedWidget.eventTargetWidgetId];
    return selectedWidget.eventAction === "focusWidget" ? [selectedWidget.id] : [];
  }, [
    selectedWidget.eventAction,
    selectedWidget.eventTargetWidgetId,
    selectedWidget.eventTargetWidgetIds,
    selectedWidget.id,
  ]);
  const opacityPercent = String(Math.round((selectedWidget.opacity ?? 1) * 100));
  const strokeValue = selectedWidget.stroke ?? "none";
  const scaledCanvasWidth = Math.round(currentCanvasWidth * zoom);
  const scaledCanvasFrameHeight = Math.round(canvasFrameHeight * zoom);
  const stageFitsViewport = zoom <= fitZoom + 0.01;
  const canvasBackgroundStyle = useMemo(
    () => buildCanvasBackgroundStyle(screenConfig),
    [screenConfig],
  );

  useEffect(() => {
    const element = sectionViewportRef.current;
    if (!element) return;

    const frame = window.requestAnimationFrame(() => {
      if (!hasManualZoomRef.current || stageFitsViewport) {
        element.scrollLeft = 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [stageFitsViewport, zoom]);

  useEffect(() => {
    if (selectedWidget?.dataset) {
      setSelectedDatasetName(selectedWidget.dataset);
    }
  }, [selectedWidget]);

  useEffect(() => {
    setComponentPanelTab("content");
  }, [selectedWidget.type]);

  const rightPanelMode: RightPanelMode = selectedWidgetIds.length ? "component" : "page";
  const pagePanelLabels = {
    pageTitle: locale === "zh-CN" ? "页面" : "Page",
    pageSubtitle:
      locale === "zh-CN" ? "管理页面标题、尺寸与基础信息" : "Manage the screen title, size and base metadata",
    headerTitle: locale === "zh-CN" ? "头部" : "Header",
    headerSubtitle:
      locale === "zh-CN"
        ? "控制头部模板、时间与状态信息"
        : "Control header templates, status badges and time metadata",
    displayTitle: locale === "zh-CN" ? "展示" : "Display",
    displaySubtitle:
      locale === "zh-CN"
        ? "控制预览与展示页的适配方式"
        : "Control how preview and published screens fit the viewport",
  };
  if (locale === "zh-CN") {
    pagePanelLabels.pageTitle = "\u9875\u9762";
    pagePanelLabels.pageSubtitle = "\u7ba1\u7406\u9875\u9762\u6807\u9898\u3001\u5c3a\u5bf8\u4e0e\u57fa\u7840\u4fe1\u606f";
    pagePanelLabels.headerTitle = "\u5934\u90e8";
    pagePanelLabels.headerSubtitle = "\u63a7\u5236\u5934\u90e8\u6a21\u677f\u3001\u65f6\u95f4\u4e0e\u72b6\u6001\u4fe1\u606f";
    pagePanelLabels.displayTitle = "\u5c55\u793a";
    pagePanelLabels.displaySubtitle = "\u63a7\u5236\u9884\u89c8\u4e0e\u5c55\u793a\u9875\u7684\u9002\u914d\u65b9\u5f0f";
  }

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
    mapPointScale,
    mapRouteWidth,
    mapLandOpacity,
    mapLabelOpacity,
    mapOceanColor,
    mapLandStartColor,
    mapLandEndColor,
    mapBorderColor,
    mapAxisColor,
    mapAxisSecondaryColor,
    mapRouteColor,
    mapRouteGlowColor,
    mapMarkerColor,
    mapMarkerHaloColor,
    mapMarkerGlowColor,
    mapLabelColor,
    mapPanelTextColor,
    mapHeatLowColor,
    mapHeatHighColor,
    canvasView,
  });

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setWidgets(snapshot.widgets.map((widget) => ({...widget})));
    setSelectedWidgetId(snapshot.selectedWidgetId);
    setSelectedWidgetIds(
      Array.isArray(snapshot.selectedWidgetIds)
        ? [...snapshot.selectedWidgetIds]
        : [snapshot.selectedWidgetId],
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
    setMapPointScale(snapshot.mapPointScale);
    setMapRouteWidth(snapshot.mapRouteWidth);
    setMapLandOpacity(snapshot.mapLandOpacity);
    setMapLabelOpacity(snapshot.mapLabelOpacity);
    setMapOceanColor(snapshot.mapOceanColor);
    setMapLandStartColor(snapshot.mapLandStartColor);
    setMapLandEndColor(snapshot.mapLandEndColor);
    setMapBorderColor(snapshot.mapBorderColor);
    setMapAxisColor(snapshot.mapAxisColor);
    setMapAxisSecondaryColor(snapshot.mapAxisSecondaryColor);
    setMapRouteColor(snapshot.mapRouteColor);
    setMapRouteGlowColor(snapshot.mapRouteGlowColor);
    setMapMarkerColor(snapshot.mapMarkerColor);
    setMapMarkerHaloColor(snapshot.mapMarkerHaloColor);
    setMapMarkerGlowColor(snapshot.mapMarkerGlowColor);
    setMapLabelColor(snapshot.mapLabelColor);
    setMapPanelTextColor(snapshot.mapPanelTextColor);
    setMapHeatLowColor(snapshot.mapHeatLowColor);
    setMapHeatHighColor(snapshot.mapHeatHighColor);
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

  const applyBackgroundPreset = (value: string) => {
    handleScreenConfigPatch({
      backgroundMode: "gradient",
      backgroundGradient: value,
    });
  };

  const handleBackgroundAssetSelected = async (file?: File | null) => {
    if (!file) return;

    const readFile = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read background asset"));
        reader.readAsDataURL(file);
      });

    try {
      const asset = await readFile();
      if (!asset) return;
      handleScreenConfigPatch({
        backgroundMode: "image",
        backgroundImage: asset,
      });
    } catch {
      // Keep the editor resilient for local mock workflows.
    } finally {
      if (backgroundAssetInputRef.current) {
        backgroundAssetInputRef.current.value = "";
      }
    }
  };

  const handleImageAssetSelected = async (file?: File | null) => {
    if (!file || selectedWidget.type !== "image") return;

    const targetWidgetId = selectedWidget.id;
    const readFile = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read image asset"));
        reader.readAsDataURL(file);
      });

    try {
      const asset = await readFile();
      if (!asset) return;

      setWidgets((current) =>
        current.map((widget) =>
          widget.id === targetWidgetId
            ? {
                ...widget,
                value: asset,
              }
            : widget,
        ),
      );
      setSaveState("dirty");
    } catch {
      // Keep the editor resilient for local mock workflows.
    } finally {
      if (imageAssetInputRef.current) {
        imageAssetInputRef.current.value = "";
      }
    }
  };

  const resizeCanvas = (
    nextCanvasWidth: number,
    nextCanvasHeight: number,
    nextPreset: ScreenConfig["canvasPreset"],
  ) => {
    commitSnapshot((snapshot) => {
      const previousCanvasLabel = `${snapshot.screenConfig.canvasWidth} × ${snapshot.screenConfig.canvasHeight}`;
      const nextCanvasLabel = `${nextCanvasWidth} × ${nextCanvasHeight}`;
      const shouldSyncBadge =
        !snapshot.screenConfig.statusBadgeLabel ||
        snapshot.screenConfig.statusBadgeLabel === previousCanvasLabel;

      return {
        ...snapshot,
        widgets: snapshot.widgets.map((widget) => {
          const width = clamp(widget.width, 120, Math.max(120, nextCanvasWidth));
          const height = clamp(widget.height, 80, Math.max(80, nextCanvasHeight));
          return {
            ...widget,
            width,
            height,
            x: clamp(widget.x, 0, Math.max(0, nextCanvasWidth - width)),
            y: clamp(widget.y, 0, Math.max(0, nextCanvasHeight - height)),
          };
        }),
        screenConfig: {
          ...snapshot.screenConfig,
          canvasPreset: nextPreset,
          canvasWidth: nextCanvasWidth,
          canvasHeight: nextCanvasHeight,
          statusBadgeLabel: shouldSyncBadge ? nextCanvasLabel : snapshot.screenConfig.statusBadgeLabel,
        },
      };
    });
  };

  const applyCanvasPreset = (presetId: ScreenConfig["canvasPreset"]) => {
    const preset = canvasPresets.find((item) => item.id === presetId);
    if (!preset) return;
    resizeCanvas(preset.width, preset.height, preset.id);
  };

  const applyCustomCanvasDimension = (axis: "width" | "height", rawValue: string) => {
    const nextValue = clamp(numberOr(rawValue, axis === "width" ? currentCanvasWidth : currentCanvasHeight), axis === "width" ? 1280 : 720, 5120);
    resizeCanvas(
      axis === "width" ? nextValue : currentCanvasWidth,
      axis === "height" ? nextValue : currentCanvasHeight,
      "custom",
    );
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
    mapPointScale,
    mapRouteWidth,
    mapLandOpacity,
    mapLabelOpacity,
    mapOceanColor,
    mapLandStartColor,
    mapLandEndColor,
    mapBorderColor,
    mapAxisColor,
    mapAxisSecondaryColor,
    mapRouteColor,
    mapRouteGlowColor,
    mapMarkerColor,
    mapMarkerHaloColor,
    mapMarkerGlowColor,
    mapLabelColor,
    mapPanelTextColor,
    mapHeatLowColor,
    mapHeatHighColor,
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

  const handleSaveShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }

    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
      return;
    }

    event.preventDefault();
    handleSave();
  });

  useEffect(() => {
    const handleSaveShortcutKeyDown = (event: KeyboardEvent) => {
      handleSaveShortcut(event);
    };

    window.addEventListener("keydown", handleSaveShortcutKeyDown);
    return () => window.removeEventListener("keydown", handleSaveShortcutKeyDown);
  }, []);

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
    if (!normalized.length) {
      setSelectedWidgetIds([]);
      if (primaryId && widgetsRef.current.some((widget) => widget.id === primaryId)) {
        setSelectedWidgetId(primaryId);
      }
      return;
    }

    const fallbackId = primaryId ?? normalized[normalized.length - 1];
    if (!fallbackId) return;
    setSelectedWidgetIds(normalized);
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

  const handleWidgetContextMenu = (
    widgetId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedWidgetIdSet.has(widgetId)) {
      updateSelection([widgetId], widgetId);
    }

    const viewport = sectionViewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();

    setContextMenu({
      widgetId,
      x: event.clientX - rect.left + viewport.scrollLeft,
      y: event.clientY - rect.top + viewport.scrollTop,
    });
  };

  const resolveWidgetsWithinMarquee = (rect: MarqueeRect) => {
    const minX = rect.x;
    const maxX = rect.x + rect.width;
    const minY = rect.y;
    const maxY = rect.y + rect.height;

    return widgetsRef.current
      .filter((widget) => {
        const widgetRight = widget.x + widget.width;
        const widgetBottom = widget.y + widget.height;
        return widgetRight >= minX && widget.x <= maxX && widgetBottom >= minY && widget.y <= maxY;
      })
      .map((widget) => widget.id);
  };

  const handleCanvasMarqueeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target !== event.currentTarget) return;

    const grid = canvasGridRef.current;
    if (!grid) return;

    event.preventDefault();

    const rect = grid.getBoundingClientRect();
    const scaleX = rect.width > 0 ? currentCanvasWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? currentCanvasHeight / rect.height : 1;
    const startX = clamp(Math.round((event.clientX - rect.left) * scaleX), 0, currentCanvasWidth);
    const startY = clamp(Math.round((event.clientY - rect.top) * scaleY), 0, currentCanvasHeight);
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;

    marqueeStateRef.current = {startX, startY, additive};
    setMarqueeRect({x: startX, y: startY, width: 0, height: 0});

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const active = marqueeStateRef.current;
      const nextGrid = canvasGridRef.current;
      if (!active || !nextGrid) return;

      const nextRect = nextGrid.getBoundingClientRect();
      const nextScaleX = nextRect.width > 0 ? currentCanvasWidth / nextRect.width : 1;
      const nextScaleY = nextRect.height > 0 ? currentCanvasHeight / nextRect.height : 1;
      const currentX = clamp(Math.round((moveEvent.clientX - nextRect.left) * nextScaleX), 0, currentCanvasWidth);
      const currentY = clamp(Math.round((moveEvent.clientY - nextRect.top) * nextScaleY), 0, currentCanvasHeight);

      setMarqueeRect({
        x: Math.min(active.startX, currentX),
        y: Math.min(active.startY, currentY),
        width: Math.abs(currentX - active.startX),
        height: Math.abs(currentY - active.startY),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const active = marqueeStateRef.current;
      marqueeStateRef.current = null;

      const currentRect = marqueeRectRef.current;
      setMarqueeRect(null);

      if (!active || !currentRect) return;
      if (currentRect.width < 6 && currentRect.height < 6) {
        if (!active.additive) {
          updateSelection([], selectedWidgetId);
        }
        return;
      }

      const hitIds = resolveWidgetsWithinMarquee(currentRect);
      if (!hitIds.length) {
        if (!active.additive) {
          updateSelection([], selectedWidgetId);
        }
        return;
      }

      if (active.additive) {
        updateSelection([...selectedWidgetIds, ...hitIds], hitIds[hitIds.length - 1]);
        return;
      }

      updateSelection(hitIds, hitIds[hitIds.length - 1]);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const addWidgetFromPalette = (name: string) => {
    const type = resolveWidgetType(name);
    const isBorderDecoration = name.includes("Border");
    const isDividerDecoration = name.includes("Divider");
    const isGlowDecoration = name.includes("Glow");
    const isNumberFlip = type === "numberFlip";
    const isDecoration = type === "decoration";
    const decorationPreset = isDecoration
      ? isBorderDecoration
        ? "frame"
        : isDividerDecoration
          ? "divider"
          : isGlowDecoration
            ? "glow"
            : "badge"
      : undefined;
    const nextId = `${type}-${Date.now()}`;
    const nextWidget: EditorWidget = {
      id: nextId,
      type,
      title: name,
      x: Math.max(
        24,
        currentCanvasWidth -
          (type === "table"
            ? 920
            : type === "map"
              ? 760
              : type === "image" || type === "text"
                ? 420
                : isBorderDecoration
                  ? 720
                  : isDividerDecoration
                    ? 520
                    : isGlowDecoration
                      ? 320
                  : isDecoration
                    ? 420
                    : isNumberFlip
                      ? 360
                      : 320) -
          160,
      ),
      y: Math.max(
        120,
        currentCanvasHeight -
          (type === "table"
            ? 220
            : type === "map"
              ? 430
              : type === "image"
                ? 260
                : type === "text"
                  ? 190
                  : type === "rank"
                    ? 250
                    : isBorderDecoration
                      ? 360
                      : isDividerDecoration
                        ? 72
                        : isGlowDecoration
                          ? 96
                      : isDecoration
                        ? 110
                        : isNumberFlip
                          ? 180
                          : 160) -
          180,
      ),
      width:
        type === "table"
          ? 920
          : type === "map"
            ? 760
            : type === "image" || type === "text"
              ? 420
              : isBorderDecoration
                ? 720
                : isDividerDecoration
                  ? 520
                  : isGlowDecoration
                    ? 320
                : isDecoration
                  ? 420
                  : isNumberFlip
                    ? 360
                    : 320,
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
                  : isBorderDecoration
                    ? 360
                    : isDividerDecoration
                      ? 72
                      : isGlowDecoration
                        ? 96
                    : isDecoration
                      ? 110
                      : isNumberFlip
                        ? 180
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
      chartTone: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "soft" : undefined,
      chartPalette: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "forest" : undefined,
      chartPaletteColors:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank"
          ? defaultChartPaletteColors("forest", "#406840")
          : undefined,
      chartPaddingMode: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "balanced" : undefined,
      chartGridStyle: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "dashed" : undefined,
      chartGridOpacity: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 42 : undefined,
      chartAxisOpacity: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 56 : undefined,
      chartAxisColor:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "#727971" : undefined,
      chartGridColor:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "#d9d0b7" : undefined,
      chartTitleDividerWidth:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 1 : undefined,
      chartTitleDividerStartColor:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "#c7d4c8" : undefined,
      chartTitleDividerEndColor:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "transparent" : undefined,
      chartTitlePaddingX:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 0 : undefined,
      chartTitlePaddingY:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 0 : undefined,
      chartTitleSignalSize:
        type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? 0 : undefined,
      chartLabelTone: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "balanced" : undefined,
      chartBadgeLayout: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? "split" : undefined,
      showHighlightBadges: type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank" ? true : undefined,
      zIndex: Math.max(...widgets.map((widget) => widget.zIndex ?? 0), 0) + 10,
      locked: false,
      textColor: "#1a1c19",
      fontSize: type === "text" ? 22 : 14,
      fontWeight: type === "text" ? "semibold" : "medium",
      lineHeight: type === "text" ? 1.4 : 1.3,
      imageFit: type === "image" ? "cover" : undefined,
      imageCaptionRadius: type === "image" ? 18 : undefined,
      imageCaptionPadding: type === "image" ? 12 : undefined,
      imageCaptionOpacity: type === "image" ? 82 : undefined,
      imageCaptionBlur: type === "image" ? 0 : undefined,
      imageOverlayBlur: type === "image" ? 0 : undefined,
      tableHeaderTracking: type === "table" ? 1.8 : undefined,
      tableHeaderSize: type === "table" ? 10 : undefined,
      tableCellSize: type === "table" ? 10 : undefined,
    };

    if (isNumberFlip) {
      Object.assign(nextWidget, {
        fill: "#13211d",
        accent: "#8fe1a7",
        value: "2048",
        hint: locale === "zh-CN" ? "当前吞吐 / min" : "Current throughput / min",
        textColor: "#f5fff7",
        titleColor: "#e9fff0",
        numberFlipDigitSize: 44,
        numberFlipGap: 10,
        numberFlipSurfaceColor: "#21342d",
        numberFlipGlowOpacity: 24,
      } satisfies Partial<EditorWidget>);
    }

    if (isDecoration) {
      Object.assign(nextWidget, {
        fill: "transparent",
        accent: "#8fe1a7",
        value: isBorderDecoration
          ? "Signal Frame"
          : isDividerDecoration
            ? "Lane Divider"
            : isGlowDecoration
              ? "Focus Glow"
              : "Live Accent",
        hint: isBorderDecoration
          ? locale === "zh-CN"
            ? "用于收口页面边界和高亮主舞台"
            : "Use it to anchor the page edge and spotlight the main stage."
          : locale === "zh-CN"
            ? "用于强调标签、分割线或发光点缀"
            : "Use it for labels, dividers or glow accents.",
        radius: isBorderDecoration ? 22 : isDividerDecoration ? 0 : isGlowDecoration ? 28 : 999,
        padding: 0,
        shadow: "none",
        titleVisible: false,
        textColor: "#e9fff0",
        decorationPreset,
        decorationSecondaryColor: "#315a41",
        decorationLineWidth: 2,
        decorationGlowOpacity: 24,
      } satisfies Partial<EditorWidget>);
      if (isDividerDecoration) {
        nextWidget.hint =
          locale === "zh-CN"
            ? "\u7528\u4e8e\u8fde\u63a5\u6807\u9898\u3001\u8d8b\u52bf\u533a\u548c\u4fe1\u53f7\u5e26"
            : "Use it to link a title block, trend zone, or signal strip.";
      }
      if (isGlowDecoration) {
        nextWidget.hint =
          locale === "zh-CN"
            ? "\u7528\u4e8e\u7ed9\u5173\u952e\u533a\u57df\u52a0\u4e00\u9053\u805a\u7126\u5149\u6655"
            : "Use it to add a focused glow pulse around a key area.";
      }
    }

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

      const nextZIndex = Math.max(...snapshot.widgets.map((widget) => widget.zIndex ?? 0), 0) + 10;
      const clones = clipboardRef.current.map((widget, index) => ({
        ...widget,
        id: `${widget.type}-${Date.now()}-${index}`,
        title: `${widget.title} Copy`,
        x: Math.min(widget.x + 24, Math.max(0, currentCanvasWidth - widget.width)),
        y: Math.min(widget.y + 24, Math.max(0, currentCanvasHeight - widget.height)),
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
    const idsToDuplicate = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (!idsToDuplicate.length) return;
    commitSnapshot((snapshot) => {
      const nextZIndex = Math.max(...snapshot.widgets.map((widget) => widget.zIndex ?? 0), 0) + 10;
      const clones = snapshot.widgets
        .filter((widget) => idsToDuplicate.includes(widget.id))
        .map((widget, index) => ({
          ...widget,
          id: `${widget.type}-${Date.now()}-${index}`,
          title: `${widget.title} Copy`,
        x: Math.min(widget.x + 24, Math.max(0, currentCanvasWidth - widget.width)),
        y: Math.min(widget.y + 24, Math.max(0, currentCanvasHeight - widget.height)),
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
    const idsToDelete = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (!idsToDelete.length) return;
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
    const idsToLock = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (!idsToLock.length) return;
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
    if (!selectedWidgetIds.length) return;
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
    handleWidgetPatch({dataset: datasetName, dataSourceMode: "static"});
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

  const fillManualDataTemplate = () => {
    handleWidgetPatch({
      dataSourceMode: "manual",
      manualData: defaultManualDataTemplate(selectedWidget.type),
    });
  };

  const resetToDatasetBinding = () => {
    handleWidgetPatch({
      dataSourceMode: "static",
    });
  };

  const resetDataProcessing = () => {
    handleWidgetPatch({
      dataFilterField: undefined,
      dataFilterOperator: undefined,
      dataFilterValue: undefined,
      dataSortField: undefined,
      dataSortDirection: undefined,
      dataLimit: undefined,
      dataAggregateMode: undefined,
      dataTruncateLength: undefined,
    });
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

  const handleTableColumnToggle = (fieldName: string) => {
    const nextColumns = effectiveTableColumns.includes(fieldName)
      ? effectiveTableColumns.filter((column) => column !== fieldName)
      : [...effectiveTableColumns, fieldName];

    if (!nextColumns.length) return;

    handleWidgetPatch({
      tableColumns: nextColumns,
    });
  };

  const handleTableColumnLabelChange = (fieldName: string, label: string) => {
    handleWidgetPatch({
      tableColumnLabels: {
        ...(selectedWidget.tableColumnLabels ?? {}),
        [fieldName]: label,
      },
    });
  };

  const handleTableColumnMove = (fieldName: string, direction: "up" | "down") => {
    const currentIndex = effectiveTableColumns.indexOf(fieldName);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= effectiveTableColumns.length) return;

    const nextColumns = [...effectiveTableColumns];
    const [moved] = nextColumns.splice(currentIndex, 1);
    nextColumns.splice(targetIndex, 0, moved);

    handleWidgetPatch({
      tableColumns: nextColumns,
    });
  };

  const handleTableColumnWidthChange = (fieldName: string, rawValue: string) => {
    const nextWidth = clamp(numberOr(rawValue, selectedWidget.tableColumnWidths?.[fieldName] ?? 140), 80, 360);
    handleWidgetPatch({
      tableColumnWidths: {
        ...(selectedWidget.tableColumnWidths ?? {}),
        [fieldName]: nextWidth,
      },
    });
  };

  const alignSelectedWidget = (target: AlignmentTarget) => {
    const idsToAlign = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (!idsToAlign.length) return;
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
            if (target === "center") return {...widget, x: Math.round((currentCanvasWidth - widget.width) / 2)};
            if (target === "right") return {...widget, x: Math.max(0, currentCanvasWidth - widget.width)};
            if (target === "top") return {...widget, y: 0};
            if (target === "middle") return {...widget, y: Math.round((currentCanvasHeight - widget.height) / 2)};
            return {...widget, y: Math.max(0, currentCanvasHeight - widget.height)};
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

  const distributeSelectedWidgets = (axis: DistributionAxis) => {
    const idsToDistribute = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (idsToDistribute.length < 3) return;

    commitSnapshot((snapshot) => {
      const activeWidgets = snapshot.widgets
        .filter((widget) => idsToDistribute.includes(widget.id))
        .sort((a, b) => (axis === "horizontal" ? a.x - b.x : a.y - b.y));

      if (activeWidgets.length < 3) return snapshot;

      const first = activeWidgets[0];
      const last = activeWidgets[activeWidgets.length - 1];
      const innerWidgets = activeWidgets.slice(1, -1);
      const totalInnerSize = innerWidgets.reduce(
        (sum, widget) => sum + (axis === "horizontal" ? widget.width : widget.height),
        0,
      );
      const span =
        axis === "horizontal"
          ? last.x - (first.x + first.width)
          : last.y - (first.y + first.height);
      const gap = innerWidgets.length ? (span - totalInnerSize) / (activeWidgets.length - 1) : 0;

      if (!Number.isFinite(gap)) return snapshot;

      let cursor = axis === "horizontal" ? first.x + first.width + gap : first.y + first.height + gap;
      const nextPositions = new Map<string, {x?: number; y?: number}>();

      for (const widget of innerWidgets) {
        if (axis === "horizontal") {
          nextPositions.set(widget.id, {x: Math.round(cursor)});
          cursor += widget.width + gap;
        } else {
          nextPositions.set(widget.id, {y: Math.round(cursor)});
          cursor += widget.height + gap;
        }
      }

      return {
        ...snapshot,
        widgets: snapshot.widgets.map((widget) => {
          const patch = nextPositions.get(widget.id);
          return patch ? {...widget, ...patch} : widget;
        }),
      };
    });
  };

  const matchSelectedWidgetSize = (target: MatchSizeTarget) => {
    const idsToMatch = selectedWidgetIds.length ? selectedWidgetIds : [];
    if (idsToMatch.length < 2) return;

    const primaryWidget = widgets.find((widget) => widget.id === selectedWidgetId);
    if (!primaryWidget) return;

    commitSnapshot((snapshot) => ({
      ...snapshot,
      widgets: snapshot.widgets.map((widget) => {
        if (!idsToMatch.includes(widget.id) || widget.id === primaryWidget.id) return widget;

        if (target === "width") {
          const width = clamp(primaryWidget.width, 120, Math.max(120, currentCanvasWidth - widget.x));
          return {...widget, width};
        }

        const height = clamp(primaryWidget.height, 80, Math.max(80, currentCanvasHeight - widget.y));
        return {...widget, height};
      }),
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
      const clampedDeltaX = clamp(Math.round(deltaX), -minLeft, currentCanvasWidth - maxRight);
      const clampedDeltaY = clamp(Math.round(deltaY), -minTop, currentCanvasHeight - maxBottom);
      const proposedX = clamp(Math.round(origin.x + clampedDeltaX), 0, Math.max(0, currentCanvasWidth - nextWidget.width));
      const proposedY = clamp(Math.round(origin.y + clampedDeltaY), 0, Math.max(0, currentCanvasHeight - nextWidget.height));
      const snapped = resolveSnapForMove(widgetsRef.current, nextWidget, proposedX, proposedY, canvasView, currentCanvasWidth, currentCanvasHeight);
      const adjustedDeltaX = snapped.x - origin.x;
      const adjustedDeltaY = snapped.y - origin.y;

      setWidgets((current) =>
        current.map((widget) =>
          activeDrag.widgetIds.includes(widget.id)
            ? {
                ...widget,
                x: clamp(activeDrag.originPositions[widget.id].x + adjustedDeltaX, 0, Math.max(0, currentCanvasWidth - widget.width)),
                y: clamp(activeDrag.originPositions[widget.id].y + adjustedDeltaY, 0, Math.max(0, currentCanvasHeight - widget.height)),
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
      setSelectedWidgetIds([]);
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
      const maxWidth = Math.max(120, currentCanvasWidth - nextWidget.x);
      const maxHeight = Math.max(80, currentCanvasHeight - nextWidget.y);

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
        currentCanvasWidth,
        currentCanvasHeight,
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
            onClick={() => handleSave()}
            disabled={saveState === "saving"}
            className="rounded border border-[#c2c8bf]/50 bg-[#fafaf5] px-4 py-1.5 text-sm font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("topbar.save")}
          </button>
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

      <div className="grid flex-1 grid-cols-[5rem_16rem_minmax(0,1fr)_19.25rem] overflow-hidden">
        <nav className="flex w-20 shrink-0 flex-col items-center border-r border-[#c2c8bf]/20 bg-[#f4f4ef] py-4">
          <div className="flex w-full flex-col items-center gap-6">
            <RailItem active={railTab === "components"} icon={<LayoutGrid className="h-4 w-4" />} label={t("rail.components")} onClick={() => setRailTab("components")} />
            <RailItem active={railTab === "layers"} icon={<Layers3 className="h-4 w-4" />} label={t("rail.layers")} onClick={() => setRailTab("layers")} />
            <RailItem active={railTab === "data"} icon={<Database className="h-4 w-4" />} label={t("rail.data")} onClick={() => setRailTab("data")} />
            <RailItem active={railTab === "templates"} icon={<LayoutGrid className="h-4 w-4" />} label={t("rail.templates")} onClick={() => setRailTab("templates")} />
          </div>

          <div className="mt-auto px-3 pb-4 pt-6 text-center">
            <div className="rounded-xl border border-dashed border-[#c2c8bf]/30 bg-[#efefe8] px-3 py-4 text-[10px] leading-5 text-[#727971]">
              {locale === "zh-CN"
                ? "当前聚焦编辑核心能力，设置与帮助入口将在后续版本补齐。"
                : "This build focuses on core editing features. Settings and help will land in a later iteration."}
            </div>
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

        <section className="relative min-w-0 overflow-hidden bg-[#dadad5]">
          <div
            ref={sectionViewportRef}
            onWheel={(event) => {
              if (event.metaKey || event.ctrlKey) {
                event.preventDefault();
                handleZoomDelta(event.deltaY > 0 ? -0.04 : 0.04);
              }
            }}
            className="relative h-full overflow-auto px-3 py-4"
          >
            <div className="flex min-h-full items-start justify-start">
              <div
                className="relative shrink-0"
                style={{width: `${scaledCanvasWidth}px`, height: `${scaledCanvasFrameHeight}px`}}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left overflow-hidden border border-[#c2c8bf]/50 bg-[#fafaf5] shadow-[0_28px_60px_rgba(26,28,25,0.16)]"
                  style={{width: `${currentCanvasWidth}px`, transform: `scale(${zoom})`}}
                >
                  <div className="border-b border-[#c2c8bf]/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                        {currentCanvasLabel}
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
                      className={`${canvasView === "grid" ? "dot-grid" : ""} relative overflow-hidden border border-[#c2c8bf]/50`}
                      style={{...canvasBackgroundStyle, width: `${currentCanvasWidth}px`, height: `${currentCanvasHeight}px`}}
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
                          <ScreenHeader
                            screenConfig={screenConfig}
                            canvasLabel={currentCanvasLabel}
                            fallbackMetaLabel={t("canvas.live")}
                          />
                        ) : null}

                        <div
                          ref={canvasGridRef}
                          onPointerDown={handleCanvasMarqueeStart}
                          className="relative flex-1"
                        >
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
                          {marqueeRect ? (
                            <div
                              className="pointer-events-none absolute z-20 border border-dashed border-[#4e7b56] bg-[#4e7b56]/10"
                              style={{
                                left: `${marqueeRect.x}px`,
                                top: `${marqueeRect.y}px`,
                                width: `${marqueeRect.width}px`,
                                height: `${marqueeRect.height}px`,
                              }}
                            />
                          ) : null}
                          {visibleOrderedWidgets.map((widget) => (
                          <WidgetCanvasItem
                            key={widget.id}
                            widget={widget}
                              canvasWidth={currentCanvasWidth}
                              canvasHeight={currentCanvasHeight}
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
                              mapPointScale={mapPointScale}
                              mapRouteWidth={mapRouteWidth}
                              mapLandOpacity={mapLandOpacity}
                              mapLabelOpacity={mapLabelOpacity}
                              mapOceanColor={mapOceanColor}
                              mapLandStartColor={mapLandStartColor}
                              mapLandEndColor={mapLandEndColor}
                              mapBorderColor={mapBorderColor}
                              mapAxisColor={mapAxisColor}
                              mapAxisSecondaryColor={mapAxisSecondaryColor}
                              mapRouteColor={mapRouteColor}
                              mapRouteGlowColor={mapRouteGlowColor}
                              mapMarkerColor={mapMarkerColor}
                              mapMarkerHaloColor={mapMarkerHaloColor}
                              mapMarkerGlowColor={mapMarkerGlowColor}
                              mapLabelColor={mapLabelColor}
                              mapPanelTextColor={mapPanelTextColor}
                              mapHeatLowColor={mapHeatLowColor}
                              mapHeatHighColor={mapHeatHighColor}
                            dataset={datasetLookup[widget.dataset]}
                            onDragStart={handleWidgetPointerDown}
                            onContextMenu={handleWidgetContextMenu}
                            onResizeStart={handleWidgetResizeStart}
                          />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-5 right-5">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#c2c8bf]/60 bg-[#fafaf5]/95 px-2 py-2 shadow-[0_18px_40px_rgba(26,28,25,0.08)] backdrop-blur">
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
            </div>
            {contextMenu ? (
              <div
                className="absolute z-30 min-w-40 rounded-xl border border-[#c2c8bf]/50 bg-[#fafaf5] p-1.5 shadow-[0_18px_40px_rgba(26,28,25,0.14)]"
                style={{left: `${contextMenu.x}px`, top: `${contextMenu.y}px`}}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <ContextMenuButton
                  label={locale === "zh-CN" ? "复制组件" : "Duplicate"}
                  onClick={() => {
                    duplicateSelectedWidget();
                    setContextMenu(null);
                  }}
                />
                <ContextMenuButton
                  label={locale === "zh-CN" ? "上移一层" : "Bring Forward"}
                  onClick={() => {
                    moveSelectedWidgetLayer("forward");
                    setContextMenu(null);
                  }}
                />
                <ContextMenuButton
                  label={locale === "zh-CN" ? "下移一层" : "Send Backward"}
                  onClick={() => {
                    moveSelectedWidgetLayer("backward");
                    setContextMenu(null);
                  }}
                />
                <ContextMenuButton
                  label={selectedWidgets.length && selectedWidgets.every((widget) => widget.locked)
                    ? locale === "zh-CN" ? "解锁组件" : "Unlock"
                    : locale === "zh-CN" ? "锁定组件" : "Lock"}
                  onClick={() => {
                    toggleSelectedWidgetLock();
                    setContextMenu(null);
                  }}
                />
                <ContextMenuButton
                  danger
                  label={locale === "zh-CN" ? "删除组件" : "Delete"}
                  onClick={() => {
                    deleteSelectedWidget();
                    setContextMenu(null);
                  }}
                />
              </div>
            ) : null}
          </div>
        </section>

        <aside className="h-full overflow-hidden border-l border-[#c2c8bf]/20 bg-[#fafaf5]">
              <div className="space-y-3 border-b border-[#c2c8bf]/20 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-headline text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#727971]">
                    {rightPanelMode === "component"
                      ? locale === "zh-CN"
                        ? "组件编辑"
                        : "Component"
                      : locale === "zh-CN"
                        ? "页面设置"
                        : "Page"}
                  </h2>
                  <Badge className="rounded border-[#d7d8d1] bg-[#f4f4ef] px-2 py-1 text-[10px] tracking-[0.12em] text-[#727971]">
                    {rightPanelMode === "component"
                      ? locale === "zh-CN"
                        ? "聚焦当前选中"
                        : "Focused Selection"
                      : locale === "zh-CN"
                        ? "画布与展示"
                        : "Canvas & Display"}
                  </Badge>
                </div>
                <Tabs
                  value={rightPanelMode}
                  className="pointer-events-none w-full rounded-lg bg-[#f4f4ef] p-1"
                  options={[
                    {label: locale === "zh-CN" ? "组件" : "Component", value: "component"},
                    {label: locale === "zh-CN" ? "页面" : "Page", value: "page"},
                  ]}
                />
                {rightPanelMode === "component" ? (
                  <Tabs
                    value={componentPanelTab}
                    onValueChange={(value) => setComponentPanelTab(value as ComponentPanelTab)}
                    className="w-full rounded-lg bg-[#f7f6f1] p-1"
                    options={[
                      {label: locale === "zh-CN" ? "内容" : "Content", value: "content"},
                      {label: locale === "zh-CN" ? "数据" : "Data", value: "data"},
                      {label: locale === "zh-CN" ? "样式" : "Style", value: "style"},
                      {label: locale === "zh-CN" ? "高级" : "Advanced", value: "advanced"},
                    ]}
                  />
                ) : null}
              </div>

              <div className="flex h-[calc(100vh-7.5rem)] flex-col overflow-y-auto px-5 py-4">
                <div className="space-y-5">
                  {rightPanelMode === "page" ? (
                    <>
                  <EditorSection
                    title={pagePanelLabels.pageTitle}
                    subtitle={pagePanelLabels.pageSubtitle}
                  >
                    <EditorField label={locale === "zh-CN" ? "画布预设" : "Canvas Preset"}>
                      <Select
                        className={editorControlClass}
                        value={screenConfig.canvasPreset}
                        onChange={(event) => applyCanvasPreset(event.target.value as ScreenConfig["canvasPreset"])}
                        options={canvasPresets.map((preset) => ({
                          label: preset.label,
                          value: preset.id,
                        }))}
                      />
                    </EditorField>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "画布宽度" : "Canvas Width"}>
                        <Input
                          className={editorControlClass}
                          value={String(screenConfig.canvasWidth)}
                          onChange={(event) => applyCustomCanvasDimension("width", event.target.value)}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "画布高度" : "Canvas Height"}>
                        <Input
                          className={editorControlClass}
                          value={String(screenConfig.canvasHeight)}
                          onChange={(event) => applyCustomCanvasDimension("height", event.target.value)}
                        />
                      </EditorField>
                    </div>
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
                      <ColorSwatchField
                        value={screenConfig.backgroundColor}
                        onChange={(nextValue) => handleScreenConfigPatch({backgroundColor: nextValue})}
                        swatches={["#fafaf5", "#eef4ea", "#f2efe3", "#ecefe7", "#1f2b24", "#20302a"]}
                      />
                    </EditorField>
                    {screenConfig.backgroundMode === "gradient" ? (
                      <>
                        <EditorField
                          label={locale === "zh-CN" ? "背景预设" : "Background Presets"}
                          hint={locale === "zh-CN" ? "先用预设建立氛围，再做细调" : "Use presets as a fast starting point"}
                        >
                          <div className="grid grid-cols-1 gap-2">
                            {backgroundPresets.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => applyBackgroundPreset(preset.value)}
                                className="overflow-hidden rounded-md border border-[#d7d8d1] bg-[#fafaf5] text-left transition-colors hover:border-[#9cb39d]"
                              >
                                <div
                                  className="h-12 border-b border-[#d7d8d1]/60"
                                  style={{backgroundImage: preset.value}}
                                />
                                <div className="px-3 py-2 text-[11px] font-medium text-[#1a1c19]">
                                  {locale === "zh-CN" ? preset.labelZh : preset.labelEn}
                                </div>
                              </button>
                            ))}
                          </div>
                        </EditorField>
                        <EditorField label={t("rightPanel.background.gradientValue")}>
                          <Textarea
                            value={screenConfig.backgroundGradient}
                            onChange={(event) => handleScreenConfigPatch({backgroundGradient: event.target.value})}
                            className="min-h-24 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          />
                        </EditorField>
                      </>
                    ) : null}
                    {screenConfig.backgroundMode === "image" ? (
                      <>
                        <input
                          ref={backgroundAssetInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          className="hidden"
                          onChange={(event) => handleBackgroundAssetSelected(event.target.files?.[0] ?? null)}
                        />
                        <EditorField
                          label={locale === "zh-CN" ? "背景资源" : "Background Asset"}
                          hint={locale === "zh-CN" ? "支持上传图片，或继续直接填写 URL" : "Upload an asset or keep using a direct URL"}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <MiniActionButton
                              label={locale === "zh-CN" ? "上传图片" : "Upload"}
                              onClick={() => backgroundAssetInputRef.current?.click()}
                            />
                            <MiniActionButton
                              label={locale === "zh-CN" ? "清空图片" : "Clear"}
                              onClick={() => handleScreenConfigPatch({backgroundImage: "", backgroundMode: "color"})}
                              disabled={!screenConfig.backgroundImage}
                            />
                          </div>
                        </EditorField>
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

                  <EditorSection
                    title={pagePanelLabels.headerTitle}
                    subtitle={pagePanelLabels.headerSubtitle}
                  >
                    <ToggleRow
                      label={t("rightPanel.page.showHeader")}
                      checked={screenConfig.showHeader}
                      onCheckedChange={(checked) => handleScreenConfigPatch({showHeader: checked})}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "头部样式" : "Header Style"}>
                        <Select
                          className={editorControlClass}
                          value={screenConfig.headerVariant}
                          onChange={(event) =>
                            handleScreenConfigPatch({
                              headerVariant: event.target.value as ScreenConfig["headerVariant"],
                            })
                          }
                          options={[
                            {label: locale === "zh-CN" ? "经典信息头" : "Classic", value: "classic"},
                            {label: locale === "zh-CN" ? "紧凑信息头" : "Compact", value: "compact"},
                            {label: locale === "zh-CN" ? "极简头部" : "Minimal", value: "minimal"},
                            {label: locale === "zh-CN" ? "播报头部" : "Broadcast", value: "broadcast"},
                            {label: locale === "zh-CN" ? "信号头部" : "Signal", value: "signal"},
                          ]}
                        />
                      </EditorField>
                      <div className="rounded-md border border-[#d7d8d1] bg-[#f7f6f1] px-3 py-2.5 text-[11px] leading-5 text-[#727971]">
                        {locale === "zh-CN"
                          ? "头部样式会同时影响编辑器预览、预览页和发布展示页。"
                          : "Header presets affect the editor preview, preview route and published screen together."}
                      </div>
                    </div>
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

                  <EditorSection
                    title={pagePanelLabels.displayTitle}
                    subtitle={pagePanelLabels.displaySubtitle}
                  >
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "展示适配" : "Display Fit"}>
                        <Select
                          className={editorControlClass}
                          value={screenConfig.displayMode}
                          onChange={(event) =>
                            handleScreenConfigPatch({
                              displayMode: event.target.value as ScreenConfig["displayMode"],
                            })
                          }
                          options={[
                            {label: locale === "zh-CN" ? "完整适配" : "Contain", value: "contain"},
                            {label: locale === "zh-CN" ? "按宽度铺满" : "Fit Width", value: "fit-width"},
                            {label: locale === "zh-CN" ? "原始尺寸" : "Actual Size", value: "actual"},
                          ]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "展示模式" : "Presentation Mode"}>
                        <Select
                          className={editorControlClass}
                          value={screenConfig.presentationMode}
                          onChange={(event) =>
                            handleScreenConfigPatch({
                              presentationMode: event.target.value as ScreenConfig["presentationMode"],
                            })
                          }
                          options={[
                            {label: locale === "zh-CN" ? "标准展示" : "Standard", value: "standard"},
                            {label: locale === "zh-CN" ? "沉浸投屏" : "Immersive", value: "immersive"},
                          ]}
                        />
                      </EditorField>
                    </div>
                    <EditorField label={locale === "zh-CN" ? "展示对齐" : "Display Alignment"}>
                      <Select
                        className={editorControlClass}
                        value={screenConfig.displayAlign}
                        onChange={(event) =>
                          handleScreenConfigPatch({
                            displayAlign: event.target.value as ScreenConfig["displayAlign"],
                          })
                        }
                        options={[
                          {label: locale === "zh-CN" ? "居中" : "Centered", value: "center"},
                          {label: locale === "zh-CN" ? "靠上" : "Top Aligned", value: "top"},
                        ]}
                      />
                    </EditorField>
                  </EditorSection>
                    </>
                  ) : null}

                  {rightPanelMode === "component" ? (
                    <>
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
                          ? "右侧当前聚焦组件编辑；批量对齐、复制、删除和锁定会作用到全部选中项，内容字段仍以主选中组件为准。"
                          : "The panel stays focused on widget editing. Align, duplicate, delete and lock apply to all selected widgets, while content fields still follow the primary selection."}
                      </p>
                    ) : (
                      <p className="text-[11px] leading-5 text-[#727971]">
                        {locale === "zh-CN"
                          ? "当前右侧只显示这个组件的布局、内容、样式和数据配置；页面设置请切到上方“页面”。"
                          : "The panel is focused on this widget only. Switch to “Page” above for canvas and presentation settings."}
                      </p>
                    )}
                  </EditorSection>

                  {componentPanelTab === "content" ? (
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
                      <EditorField label={locale === "zh-CN" ? "图层顺序" : "Layer Order"}>
                        <Input
                          className={editorControlClass}
                          value={String(selectedWidget.zIndex ?? 0)}
                          onChange={(event) =>
                            handleWidgetPatch({
                              zIndex: clamp(numberOr(event.target.value, selectedWidget.zIndex ?? 0), 0, 9999),
                            })
                          }
                        />
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
                    <EditorField
                      label={locale === "zh-CN" ? "批量分布" : "Distribute"}
                      hint={
                        selectedWidgetIds.length < 3
                          ? locale === "zh-CN"
                            ? "至少选择 3 个组件"
                            : "Select at least 3 widgets"
                          : locale === "zh-CN"
                            ? "按当前选区分布组件间距"
                            : "Distribute spacing within the current selection"
                      }
                      className="mt-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <MiniActionButton
                          label={locale === "zh-CN" ? "水平分布" : "Horizontal"}
                          onClick={() => distributeSelectedWidgets("horizontal")}
                          disabled={selectedWidgetIds.length < 3}
                        />
                        <MiniActionButton
                          label={locale === "zh-CN" ? "垂直分布" : "Vertical"}
                          onClick={() => distributeSelectedWidgets("vertical")}
                          disabled={selectedWidgetIds.length < 3}
                        />
                      </div>
                    </EditorField>
                    <EditorField
                      label={locale === "zh-CN" ? "统一尺寸" : "Match Size"}
                      hint={
                        selectedWidgetIds.length < 2
                          ? locale === "zh-CN"
                            ? "至少选择 2 个组件"
                            : "Select at least 2 widgets"
                          : locale === "zh-CN"
                            ? "以主选中组件为尺寸基准"
                            : "Use the primary selection as the size source"
                      }
                      className="mt-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <MiniActionButton
                          label={locale === "zh-CN" ? "同宽" : "Match Width"}
                          onClick={() => matchSelectedWidgetSize("width")}
                          disabled={selectedWidgetIds.length < 2}
                        />
                        <MiniActionButton
                          label={locale === "zh-CN" ? "同高" : "Match Height"}
                          onClick={() => matchSelectedWidgetSize("height")}
                          disabled={selectedWidgetIds.length < 2}
                        />
                      </div>
                    </EditorField>
                  </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" ? (
                  <EditorSection title={locale === "zh-CN" ? "组件基础" : "Widget Basics"}>
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
                  </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && isChartWidget ? (
                    <EditorSection
                      title={locale === "zh-CN" ? "图表内容" : "Chart Content"}
                      subtitle={
                        locale === "zh-CN"
                          ? "标题继续放在上面的组件基础里，这里只收图表说明和数值前后缀。"
                          : "Keep the title in Widget Basics and use this section for chart copy only."
                      }
                    >
                      <EditorField label={locale === "zh-CN" ? "副说明" : "Supporting Copy"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                          placeholder={locale === "zh-CN" ? "补充图表口径、时间范围或一句解释" : "Add scope, timeframe or one line of context"}
                        />
                      </EditorField>
                      <div className="hidden grid-cols-2 gap-2.5">
                        <EditorField label={locale === "zh-CN" ? "前缀" : "Prefix"}>
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.valuePrefix ?? ""}
                            onChange={(event) => handleWidgetPatch({valuePrefix: event.target.value})}
                            placeholder={locale === "zh-CN" ? "如 $" : "e.g. $"}
                          />
                        </EditorField>
                        <EditorField label={locale === "zh-CN" ? "后缀" : "Suffix"}>
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.valueSuffix ?? ""}
                            onChange={(event) => handleWidgetPatch({valueSuffix: event.target.value})}
                            placeholder={locale === "zh-CN" ? "如 % / 件" : "e.g. %"}
                          />
                        </EditorField>
                      </div>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && selectedWidget.type === "map" ? (
                    <EditorSection
                      title={locale === "zh-CN" ? "地图内容" : "Map Content"}
                      subtitle={
                        locale === "zh-CN"
                          ? "标题继续放在上面的组件基础里，这里补地图说明文案。"
                          : "Keep the title in Widget Basics and use this section for map-specific copy."
                      }
                    >
                      <EditorField label={locale === "zh-CN" ? "说明文案" : "Description Copy"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                          placeholder={locale === "zh-CN" ? "补充区域范围、业务口径或地图说明" : "Add scope, region or one line of map context"}
                        />
                      </EditorField>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && isMetricLikeWidget ? (
                    <EditorSection
                      title={
                        selectedWidget.type === "numberFlip"
                          ? locale === "zh-CN"
                            ? "数字翻牌内容"
                            : "Number Flip Content"
                          : locale === "zh-CN"
                            ? "指标内容"
                            : "Metric Content"
                      }
                    >
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
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && isDecorationWidget ? (
                    <EditorSection title={locale === "zh-CN" ? "装饰内容" : "Decoration Content"}>
                      <EditorField
                        label={locale === "zh-CN" ? "主标签" : "Primary Label"}
                        hint={
                          locale === "zh-CN"
                            ? "这里的文案会作为装饰标签、边框标识或发光提示语出现。"
                            : "This copy becomes the label, frame tag or glow caption."
                        }
                      >
                        <Input
                          className={editorControlClass}
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
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && selectedWidget.type === "text" ? (
                    <EditorSection title={locale === "zh-CN" ? "文本内容" : "Text Content"}>
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
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && selectedWidget.type === "text" ? (
                    <EditorSection title={locale === "zh-CN" ? "文本样式" : "Text Style"}>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "排版" : "Typography"}
                          description={
                            locale === "zh-CN"
                              ? "文本组件先把字体层级和节奏调顺，信息表达会更稳。"
                              : "Tune the type hierarchy and rhythm first so the copy reads cleanly."
                          }
                        >
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "文字颜色" : "Text Color"}>
                            <ColorSwatchField
                              value={selectedWidget.textColor ?? "#1a1c19"}
                              onChange={(nextValue) => handleWidgetPatch({textColor: nextValue})}
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
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "文本对齐" : "Text Align"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.textAlign ?? "left"}
                              onChange={(event) =>
                                handleWidgetPatch({textAlign: event.target.value as EditorWidget["textAlign"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                                {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                                {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "字距" : "Letter Spacing"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.letterSpacing ?? 0)}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  letterSpacing: numberOr(event.target.value, selectedWidget.letterSpacing ?? 0),
                                })
                              }
                            />
                          </EditorField>
                        </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "容器" : "Container"}
                          description={
                            locale === "zh-CN"
                              ? "文本的背景、边框和阴影继续沿用上面的通用样式区，避免重复出现两套容器控件。"
                              : "Background, border and shadow stay in the shared appearance section above so the panel does not duplicate container controls."
                          }
                        >
                          <div className="rounded-md border border-[#d7d8d1] bg-[#f7f6f1] px-3 py-3 text-[12px] leading-5 text-[#727971]">
                            {locale === "zh-CN"
                              ? "如果要做文本底色、描边、圆角或阴影，请继续使用前面的通用样式区。这里专注文本排版本身。"
                              : "Use the shared appearance section above for text background, border, radius and shadow. This area stays focused on typography."}
                          </div>
                        </ChartConfigGroup>
                      </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && selectedWidget.type === "image" ? (
                    <EditorSection title={locale === "zh-CN" ? "图片内容" : "Image Content"}>
                      <input
                        ref={imageAssetInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        onChange={(event) => handleImageAssetSelected(event.target.files?.[0] ?? null)}
                      />
                      <EditorField
                        label={locale === "zh-CN" ? "图片资源" : "Image Asset"}
                        hint={locale === "zh-CN" ? "支持上传图片，或继续直接填写 URL" : "Upload an asset or keep using a direct URL"}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <MiniActionButton
                            label={locale === "zh-CN" ? "上传图片" : "Upload"}
                            onClick={() => imageAssetInputRef.current?.click()}
                          />
                          <MiniActionButton
                            label={locale === "zh-CN" ? "清空图片" : "Clear"}
                            onClick={() => handleWidgetPatch({value: ""})}
                            disabled={!selectedWidget.value}
                          />
                        </div>
                      </EditorField>
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
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && selectedWidget.type === "image" ? (
                    <>
                      <EditorSection title={locale === "zh-CN" ? "图片视觉" : "Image Visuals"}>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "素材显示" : "Media Display"}
                          description={
                            locale === "zh-CN"
                              ? "先确定画面怎么铺、怎么裁、怎么取景，再去微调色彩和叠加层。"
                              : "Set how the media fills, crops and frames first before tuning color treatment."
                          }
                        >
                          <div className="hidden grid-cols-2 gap-2.5">
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
                            <EditorField label={locale === "zh-CN" ? "边框风格" : "Border Style"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.imageBorderStyle ?? "soft"}
                                onChange={(event) =>
                                  handleWidgetPatch({imageBorderStyle: event.target.value as EditorWidget["imageBorderStyle"]})
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "柔和边框" : "Soft", value: "soft"},
                                  {label: locale === "zh-CN" ? "画框边框" : "Frame", value: "frame"},
                                  {label: locale === "zh-CN" ? "无边框" : "None", value: "none"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "画面缩放" : "Image Zoom"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageZoom ?? 100}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageZoom: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.imageZoom ?? 100), 80, 140),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "滤镜" : "Filters"}
                          description={
                            locale === "zh-CN"
                              ? "色彩和明暗统一在这里调，方便和图表、地图的视觉节奏保持一致。"
                              : "Keep tone and contrast adjustments together so media treatment matches the rest of the canvas."
                          }
                        >
                          <div className="mb-2.5">
                            <ToggleRow
                              label={locale === "zh-CN" ? "灰度处理" : "Grayscale"}
                              checked={selectedWidget.imageGrayscale ?? false}
                              onCheckedChange={(checked) => handleWidgetPatch({imageGrayscale: checked})}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "亮度" : "Brightness"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageBrightness ?? 100}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageBrightness: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.imageBrightness ?? 100), 40, 160),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "对比" : "Contrast"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageContrast ?? 100}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageContrast: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.imageContrast ?? 100), 40, 180),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "饱和" : "Saturation"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageSaturation ?? 100}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageSaturation: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.imageSaturation ?? 100), 0, 180),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "容器" : "Container"}
                          description={
                            locale === "zh-CN"
                              ? "这一组只处理图片卡片自身的相框和投影，不去重复通用外观区里的基础容器设置。"
                              : "Use this for the image card's frame and shadow treatment without duplicating the shared appearance controls."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "边框颜色" : "Border Color"}>
                              <ColorSwatchField
                                value={selectedWidget.imageBorderColor ?? "#c2c8bf"}
                                onChange={(nextValue) => handleWidgetPatch({imageBorderColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "边框宽度" : "Border Width"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.imageBorderWidth ?? 1)}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageBorderWidth: clamp(numberOr(event.target.value, selectedWidget.imageBorderWidth ?? 1), 0, 10),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "阴影颜色" : "Shadow Color"}>
                              <ColorSwatchField
                                value={selectedWidget.imageShadowColor ?? "#1a1c19"}
                                onChange={(nextValue) => handleWidgetPatch({imageShadowColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "阴影强度" : "Shadow Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageShadowOpacity ?? 18}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageShadowOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.imageShadowOpacity ?? 18), 0, 100),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                      </EditorSection>

                      <EditorSection title={locale === "zh-CN" ? "遮罩与说明" : "Overlay & Caption"}>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "遮罩" : "Overlay"}
                          description={
                            locale === "zh-CN"
                              ? "遮罩用来控制信息可读性和视觉重心，不需要和说明层样式混在一起。"
                              : "Use the overlay to control readability and emphasis without mixing it into the caption styling."
                          }
                        >
                          <EditorField label={locale === "zh-CN" ? "遮罩方向" : "Overlay Direction"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.imageOverlayDirection ?? "bottom"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  imageOverlayDirection: event.target.value as EditorWidget["imageOverlayDirection"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "底部渐隐" : "Bottom", value: "bottom"},
                                {label: locale === "zh-CN" ? "中心聚焦" : "Center", value: "center"},
                                {label: locale === "zh-CN" ? "全幅压暗" : "Full", value: "full"},
                              ]}
                            />
                          </EditorField>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "遮罩颜色" : "Overlay Color"}>
                              <ColorSwatchField
                                value={selectedWidget.imageOverlayColor ?? "#111714"}
                                onChange={(nextValue) => handleWidgetPatch({imageOverlayColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "遮罩强度" : "Overlay Strength"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageOverlayOpacity ?? 68}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageOverlayOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.imageOverlayOpacity ?? 68),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "遮罩模糊" : "Overlay Blur"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageOverlayBlur ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageOverlayBlur: clamp(
                                      numberOr(event.target.value.replace("px", ""), selectedWidget.imageOverlayBlur ?? 0),
                                      0,
                                      32,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "说明层" : "Caption Layer"}
                          description={
                            locale === "zh-CN"
                              ? "把说明文字、底板、边框和阴影集中在一起，后面扩事件或状态样式时会更顺。"
                              : "Keep caption copy, surface, border and shadow together so later state styling stays easy to extend."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "说明文字色" : "Caption Text"}>
                              <ColorSwatchField
                                value={selectedWidget.imageCaptionTextColor ?? "#ffffff"}
                                onChange={(nextValue) => handleWidgetPatch({imageCaptionTextColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明底色" : "Caption Surface"}>
                              <ColorSwatchField
                                value={selectedWidget.imageCaptionBackgroundColor ?? "#111714"}
                                onChange={(nextValue) => handleWidgetPatch({imageCaptionBackgroundColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明边框色" : "Caption Border Color"}>
                              <ColorSwatchField
                                value={selectedWidget.imageCaptionBorderColor ?? "#ffffff"}
                                onChange={(nextValue) => handleWidgetPatch({imageCaptionBorderColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明边框宽度" : "Caption Border Width"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.imageCaptionBorderWidth ?? 0)}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionBorderWidth: clamp(
                                      numberOr(event.target.value, selectedWidget.imageCaptionBorderWidth ?? 0),
                                      0,
                                      10,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明圆角" : "Caption Radius"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageCaptionRadius ?? 18}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionRadius: clamp(
                                      numberOr(event.target.value.replace("px", ""), selectedWidget.imageCaptionRadius ?? 18),
                                      0,
                                      32,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明内边距" : "Caption Padding"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageCaptionPadding ?? 12}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionPadding: clamp(
                                      numberOr(event.target.value.replace("px", ""), selectedWidget.imageCaptionPadding ?? 12),
                                      0,
                                      32,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明底色透明度" : "Caption Surface Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageCaptionOpacity ?? 82}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.imageCaptionOpacity ?? 82),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明模糊" : "Caption Blur"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageCaptionBlur ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionBlur: clamp(
                                      numberOr(event.target.value.replace("px", ""), selectedWidget.imageCaptionBlur ?? 0),
                                      0,
                                      32,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明阴影色" : "Caption Shadow Color"}>
                              <ColorSwatchField
                                value={selectedWidget.imageCaptionShadowColor ?? "#111714"}
                                onChange={(nextValue) => handleWidgetPatch({imageCaptionShadowColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "说明阴影强度" : "Caption Shadow Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.imageCaptionShadowOpacity ?? 0}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    imageCaptionShadowOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.imageCaptionShadowOpacity ?? 0),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                      </EditorSection>
                    </>
                  ) : null}

                  {componentPanelTab === "content" && selectedWidget.type === "table" ? (
                    <EditorSection title={locale === "zh-CN" ? "表格内容" : "Table Content"}>
                      <EditorField label={locale === "zh-CN" ? "数据说明" : "Data Note"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                        />
                      </EditorField>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && selectedWidget.type === "table" ? (
                    <EditorSection title={locale === "zh-CN" ? "表格样式" : "Table Style"}>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "表头" : "Header"}
                          description={
                            locale === "zh-CN"
                              ? "先把表头信息层定住，表格读感会稳定很多。"
                              : "Set the header hierarchy first so the whole table reads more clearly."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "表头底色" : "Header Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableHeaderBgColor ?? "#e8e8e3"}
                                onChange={(nextValue) => handleWidgetPatch({tableHeaderBgColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表头文字色" : "Header Text"}>
                              <ColorSwatchField
                                value={selectedWidget.tableHeaderTextColor ?? "#727971"}
                                onChange={(nextValue) => handleWidgetPatch({tableHeaderTextColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表头辅助文字色" : "Header Meta Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableHeaderMetaColor ?? "#727971"}
                                onChange={(nextValue) => handleWidgetPatch({tableHeaderMetaColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表头对齐" : "Header Align"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.tableHeaderAlign ?? "left"}
                                onChange={(event) =>
                                  handleWidgetPatch({tableHeaderAlign: event.target.value as EditorWidget["tableHeaderAlign"]})
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                                  {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                                  {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表头字号" : "Header Size"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.tableHeaderSize ?? 10}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    tableHeaderSize: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableHeaderSize ?? 10), 8, 18),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表头字距" : "Header Tracking"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.tableHeaderTracking ?? 1.8}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    tableHeaderTracking: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableHeaderTracking ?? 1.8), 0, 8),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "行" : "Rows"}
                          description={
                            locale === "zh-CN"
                              ? "控制行密度、文字层次和 hover/斑马纹这些阅读辅助。"
                              : "Control density, text hierarchy, hover and zebra behavior for row readability."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "行密度" : "Density"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.tableDensity ?? "comfortable"}
                                onChange={(event) =>
                                  handleWidgetPatch({tableDensity: event.target.value as EditorWidget["tableDensity"]})
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "舒适" : "Comfortable", value: "comfortable"},
                                  {label: locale === "zh-CN" ? "紧凑" : "Compact", value: "compact"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "表体底色" : "Body Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableBodyColor ?? "#ffffff"}
                                onChange={(nextValue) => handleWidgetPatch({tableBodyColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "分隔线颜色" : "Divider Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableDividerColor ?? "#c2c8bf"}
                                onChange={(nextValue) => handleWidgetPatch({tableDividerColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "斑马纹颜色" : "Stripe Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableStripeColor ?? "#fafaf5"}
                                onChange={(nextValue) => handleWidgetPatch({tableStripeColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "主字段颜色" : "Key Text"}>
                              <ColorSwatchField
                                value={selectedWidget.tableKeyColor ?? "#23422a"}
                                onChange={(nextValue) => handleWidgetPatch({tableKeyColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "辅助信息色" : "Meta Text Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableMetaColor ?? "#727971"}
                                onChange={(nextValue) => handleWidgetPatch({tableMetaColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "悬停底色" : "Row Hover Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableRowHoverColor ?? "#f3f5ef"}
                                onChange={(nextValue) => handleWidgetPatch({tableRowHoverColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "单元格对齐" : "Cell Align"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.tableCellAlign ?? "left"}
                                onChange={(event) =>
                                  handleWidgetPatch({tableCellAlign: event.target.value as EditorWidget["tableCellAlign"]})
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                                  {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                                  {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "单元格字号" : "Cell Size"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.tableCellSize ?? 10}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    tableCellSize: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableCellSize ?? 10), 8, 18),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <ToggleRow
                              label={locale === "zh-CN" ? "斑马纹行" : "Zebra Rows"}
                              checked={selectedWidget.tableZebra !== false}
                              onCheckedChange={(checked) => handleWidgetPatch({tableZebra: checked})}
                            />
                            <ToggleRow
                              label={locale === "zh-CN" ? "强调首列" : "Highlight First Column"}
                              checked={selectedWidget.tableHighlightFirstColumn !== false}
                              onCheckedChange={(checked) => handleWidgetPatch({tableHighlightFirstColumn: checked})}
                            />
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "数值" : "Numbers"}
                          description={
                            locale === "zh-CN"
                              ? "把数值格式和高亮单独拎出来，避免和行文字样式混在一起。"
                              : "Keep numeric emphasis separate from the general row styling."
                          }
                        >
                          <div className="hidden grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "数值格式" : "Number Format"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.tableNumberFormat ?? "raw"}
                                onChange={(event) =>
                                  handleWidgetPatch({tableNumberFormat: event.target.value as EditorWidget["tableNumberFormat"]})
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "原始值" : "Raw", value: "raw"},
                                  {label: locale === "zh-CN" ? "紧凑格式" : "Compact", value: "compact"},
                                  {label: locale === "zh-CN" ? "人民币" : "Currency", value: "currency"},
                                  {label: locale === "zh-CN" ? "百分比" : "Percent", value: "percent"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "数值颜色" : "Number Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableNumberColor ?? "#31503a"}
                                onChange={(nextValue) => handleWidgetPatch({tableNumberColor: nextValue})}
                              />
                            </EditorField>
                          </div>
                          <EditorField label={locale === "zh-CN" ? "鏁板€奸鑹?" : "Number Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableNumberColor ?? "#31503a"}
                              onChange={(nextValue) => handleWidgetPatch({tableNumberColor: nextValue})}
                            />
                          </EditorField>
                          <ToggleRow
                            label={locale === "zh-CN" ? "高亮数值列" : "Highlight Numeric Values"}
                            checked={selectedWidget.tableHighlightNumbers !== false}
                            onCheckedChange={(checked) => handleWidgetPatch({tableHighlightNumbers: checked})}
                          />
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "状态色" : "Status Colors"}
                          description={
                            locale === "zh-CN"
                              ? "表格里带状态 badge 的列，统一在这里控制语义色。"
                              : "Control semantic badge colors for status-like columns in one place."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "正常色" : "Positive"}>
                              <ColorSwatchField
                                value={selectedWidget.tableStatusPositiveColor ?? "#2f6d48"}
                                onChange={(nextValue) => handleWidgetPatch({tableStatusPositiveColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "预警色" : "Warning"}>
                              <ColorSwatchField
                                value={selectedWidget.tableStatusWarningColor ?? "#c96b32"}
                                onChange={(nextValue) => handleWidgetPatch({tableStatusWarningColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "异常色" : "Critical"}>
                              <ColorSwatchField
                                value={selectedWidget.tableStatusCriticalColor ?? "#ba1a1a"}
                                onChange={(nextValue) => handleWidgetPatch({tableStatusCriticalColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "中性色" : "Neutral"}>
                              <ColorSwatchField
                                value={selectedWidget.tableStatusNeutralColor ?? "#5e7866"}
                                onChange={(nextValue) => handleWidgetPatch({tableStatusNeutralColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "状态底色透明度" : "Status Surface Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.tableStatusBackgroundOpacity ?? 12}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    tableStatusBackgroundOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.tableStatusBackgroundOpacity ?? 12),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "容器" : "Container"}
                          description={
                            locale === "zh-CN"
                              ? "最后调边框和阴影，让表格像大屏组件，而不是普通表格。"
                              : "Finish with border and shadow so the table feels like a dashboard component, not a default grid."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "边框颜色" : "Border Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableBorderColor ?? "#c2c8bf"}
                                onChange={(nextValue) => handleWidgetPatch({tableBorderColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "边框宽度" : "Border Width"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.tableBorderWidth ?? 1)}
                                onChange={(event) => handleWidgetPatch({tableBorderWidth: clamp(numberOr(event.target.value, selectedWidget.tableBorderWidth ?? 1), 0, 8)})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "阴影颜色" : "Shadow Color"}>
                              <ColorSwatchField
                                value={selectedWidget.tableShadowColor ?? "#1a1c19"}
                                onChange={(nextValue) => handleWidgetPatch({tableShadowColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "阴影强度" : "Shadow Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.tableShadowOpacity ?? 14}%`}
                                onChange={(event) => handleWidgetPatch({tableShadowOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.tableShadowOpacity ?? 14), 0, 100)})}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                        <div className="hidden">
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "行密度" : "Density"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.tableDensity ?? "comfortable"}
                              onChange={(event) =>
                                handleWidgetPatch({tableDensity: event.target.value as EditorWidget["tableDensity"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "舒适" : "Comfortable", value: "comfortable"},
                                {label: locale === "zh-CN" ? "紧凑" : "Compact", value: "compact"},
                              ]}
                            />
                          </EditorField>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "边框颜色" : "Border Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableBorderColor ?? "#c2c8bf"}
                              onChange={(nextValue) => handleWidgetPatch({tableBorderColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "边框宽度" : "Border Width"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.tableBorderWidth ?? 1)}
                              onChange={(event) => handleWidgetPatch({tableBorderWidth: clamp(numberOr(event.target.value, selectedWidget.tableBorderWidth ?? 1), 0, 8)})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "阴影颜色" : "Shadow Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableShadowColor ?? "#1a1c19"}
                              onChange={(nextValue) => handleWidgetPatch({tableShadowColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "阴影强度" : "Shadow Opacity"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.tableShadowOpacity ?? 14}%`}
                              onChange={(event) => handleWidgetPatch({tableShadowOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.tableShadowOpacity ?? 14), 0, 100)})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表体底色" : "Body Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableBodyColor ?? "#ffffff"}
                              onChange={(nextValue) => handleWidgetPatch({tableBodyColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头底色" : "Header Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableHeaderBgColor ?? "#e8e8e3"}
                              onChange={(nextValue) => handleWidgetPatch({tableHeaderBgColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头文字色" : "Header Text"}>
                            <ColorSwatchField
                              value={selectedWidget.tableHeaderTextColor ?? "#727971"}
                              onChange={(nextValue) => handleWidgetPatch({tableHeaderTextColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头辅助文字色" : "Header Meta Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableHeaderMetaColor ?? "#727971"}
                              onChange={(nextValue) => handleWidgetPatch({tableHeaderMetaColor: nextValue})}
                            />
                          </EditorField>
                          <ToggleRow
                            label={locale === "zh-CN" ? "高亮数值列" : "Highlight Numeric Values"}
                            checked={selectedWidget.tableHighlightNumbers !== false}
                            onCheckedChange={(checked) => handleWidgetPatch({tableHighlightNumbers: checked})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "分隔线颜色" : "Divider Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableDividerColor ?? "#c2c8bf"}
                              onChange={(nextValue) => handleWidgetPatch({tableDividerColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "斑马纹颜色" : "Stripe Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableStripeColor ?? "#fafaf5"}
                              onChange={(nextValue) => handleWidgetPatch({tableStripeColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "主字段颜色" : "Key Text"}>
                            <ColorSwatchField
                              value={selectedWidget.tableKeyColor ?? "#23422a"}
                              onChange={(nextValue) => handleWidgetPatch({tableKeyColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "数值颜色" : "Number Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableNumberColor ?? "#31503a"}
                              onChange={(nextValue) => handleWidgetPatch({tableNumberColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "辅助信息色" : "Meta Text Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableMetaColor ?? "#727971"}
                              onChange={(nextValue) => handleWidgetPatch({tableMetaColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "悬停底色" : "Row Hover Color"}>
                            <ColorSwatchField
                              value={selectedWidget.tableRowHoverColor ?? "#f3f5ef"}
                              onChange={(nextValue) => handleWidgetPatch({tableRowHoverColor: nextValue})}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头对齐" : "Header Align"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.tableHeaderAlign ?? "left"}
                              onChange={(event) =>
                                handleWidgetPatch({tableHeaderAlign: event.target.value as EditorWidget["tableHeaderAlign"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                                {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                                {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "单元格对齐" : "Cell Align"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.tableCellAlign ?? "left"}
                              onChange={(event) =>
                                handleWidgetPatch({tableCellAlign: event.target.value as EditorWidget["tableCellAlign"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "左对齐" : "Left", value: "left"},
                                {label: locale === "zh-CN" ? "居中" : "Center", value: "center"},
                                {label: locale === "zh-CN" ? "右对齐" : "Right", value: "right"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头字号" : "Header Size"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.tableHeaderSize ?? 10}px`}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  tableHeaderSize: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableHeaderSize ?? 10), 8, 18),
                                })
                              }
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "表头字距" : "Header Tracking"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.tableHeaderTracking ?? 1.8}px`}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  tableHeaderTracking: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableHeaderTracking ?? 1.8), 0, 8),
                                })
                              }
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "单元格字号" : "Cell Size"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.tableCellSize ?? 10}px`}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  tableCellSize: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.tableCellSize ?? 10), 8, 18),
                                })
                              }
                            />
                          </EditorField>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <ToggleRow
                            label={locale === "zh-CN" ? "斑马纹行" : "Zebra Rows"}
                            checked={selectedWidget.tableZebra !== false}
                            onCheckedChange={(checked) => handleWidgetPatch({tableZebra: checked})}
                          />
                          <ToggleRow
                            label={locale === "zh-CN" ? "强调首列" : "Highlight First Column"}
                            checked={selectedWidget.tableHighlightFirstColumn !== false}
                            onCheckedChange={(checked) => handleWidgetPatch({tableHighlightFirstColumn: checked})}
                          />
                        </div>
                        <EditorField label={locale === "zh-CN" ? "数值格式" : "Number Format"}>
                          <Select
                            className={editorControlClass}
                            value={selectedWidget.tableNumberFormat ?? "raw"}
                            onChange={(event) =>
                              handleWidgetPatch({tableNumberFormat: event.target.value as EditorWidget["tableNumberFormat"]})
                            }
                            options={[
                              {label: locale === "zh-CN" ? "原始值" : "Raw", value: "raw"},
                              {label: locale === "zh-CN" ? "紧凑格式" : "Compact", value: "compact"},
                              {label: locale === "zh-CN" ? "人民币" : "Currency", value: "currency"},
                              {label: locale === "zh-CN" ? "百分比" : "Percent", value: "percent"},
                            ]}
                          />
                        </EditorField>
                        </div>
                      </EditorSection>
                  ) : null}

                  {componentPanelTab === "content" && selectedWidget.type === "events" ? (
                    <EditorSection title={locale === "zh-CN" ? "事件列表内容" : "Event List Content"}>
                      <EditorField label={locale === "zh-CN" ? "数据说明" : "Data Note"}>
                        <Textarea
                          className="min-h-20 resize-none rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-[12px] leading-5 focus:border-[#45664b]"
                          value={selectedWidget.hint ?? ""}
                          onChange={(event) => handleWidgetPatch({hint: event.target.value})}
                        />
                      </EditorField>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "advanced" && selectedWidget.type === "map" ? (
                    <EditorSection
                      title={locale === "zh-CN" ? "地图高级" : "Map Advanced"}
                      subtitle={
                        locale === "zh-CN"
                          ? "把视角和运行时开关单独收进高级区，不和普通样式混在一起。"
                          : "Keep viewport and runtime switches separate from the visual styling controls."
                      }
                    >
                      <EditorField label={t("rightPanel.map.defaultZoom")}>
                        <Input className={editorControlClass} value={mapZoom} onChange={(event) => setMapZoom(event.target.value)} />
                      </EditorField>
                      <div className="grid grid-cols-2 gap-2.5">
                        <ToggleRow label={t("rightPanel.map.show3DAxis")} checked={map3dAxis} onCheckedChange={setMap3dAxis} />
                        <ToggleRow label={locale === "zh-CN" ? "显示标记点" : "Show Markers"} checked={mapMarkers} onCheckedChange={setMapMarkers} />
                      </div>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "advanced" ? (
                    <EditorSection
                      title={locale === "zh-CN" ? "高级配置" : "Advanced Settings"}
                      subtitle={
                        selectedWidget.type === "map"
                          ? locale === "zh-CN"
                            ? "把运行时配置和组件事件收进高级区，保持内容 / 数据 / 样式的边界稳定。"
                            : "Keep runtime controls and widget events in the advanced zone."
                          : locale === "zh-CN"
                            ? "高级区只收运行时信息和交互事件，不再和内容 / 数据 / 样式混在一起。"
                            : "Advanced stays focused on runtime metadata and interaction events."
                      }
                    >
                      <div className="space-y-3">
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "运行时元信息" : "Runtime Meta"}
                          description={
                            locale === "zh-CN"
                              ? "保留当前组件在运行时的唯一标识和数据模式，方便排查交互与请求链路。"
                              : "Expose widget identity and runtime data mode for debugging interaction and request flows."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "组件 ID" : "Widget ID"}>
                              <Input className={editorControlClass} value={selectedWidget.id} readOnly />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "数据模式" : "Data Mode"}>
                              <Input
                                className={editorControlClass}
                                value={normalizedDataSourceMode}
                                readOnly
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "点击事件" : "Click Event"}
                          description={
                            locale === "zh-CN"
                              ? "在这里配置外链、页面跳转、条件触发和多目标联动。"
                              : "Configure links, page jumps, conditional triggers and multi-target focus here."
                          }
                        >
                          <EditorField label={locale === "zh-CN" ? "动作类型" : "Action Type"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.eventAction ?? "none"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  eventAction: event.target.value as EditorWidget["eventAction"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "不启用" : "None", value: "none"},
                                {label: locale === "zh-CN" ? "打开链接" : "Open Link", value: "openLink"},
                                {label: locale === "zh-CN" ? "跳转预览页" : "Open Preview", value: "openPreview"},
                                {label: locale === "zh-CN" ? "跳转展示页" : "Open Published Screen", value: "openPublished"},
                                {label: locale === "zh-CN" ? "聚焦组件" : "Focus Widget", value: "focusWidget"},
                              ]}
                            />
                          </EditorField>
                          {selectedWidget.eventAction && selectedWidget.eventAction !== "none" && eventConditionFieldOptions.length ? (
                            <div className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#45664b]">
                                {locale === "zh-CN" ? "触发条件" : "Trigger Condition"}
                              </div>
                              <p className="mt-1 text-[11px] leading-5 text-[#727971]">
                                {locale === "zh-CN"
                                  ? "用组件最终渲染出的值控制点击事件是否生效。字段留空时表示始终触发。"
                                  : "Gate the click action with the widget's rendered output. Leave the field empty to always trigger."}
                              </p>
                              <div className="mt-3 grid grid-cols-2 gap-2.5">
                                <EditorField label={locale === "zh-CN" ? "条件字段" : "Condition Field"}>
                                  <Select
                                    className={editorControlClass}
                                    value={selectedWidget.eventConditionField ?? ""}
                                    onChange={(event) =>
                                      handleWidgetPatch({
                                        eventConditionField: event.target.value || undefined,
                                        eventConditionOperator: event.target.value
                                          ? selectedWidget.eventConditionOperator ?? "contains"
                                          : undefined,
                                        eventConditionValue: event.target.value
                                          ? selectedWidget.eventConditionValue
                                          : undefined,
                                      })
                                    }
                                    options={[
                                      {label: locale === "zh-CN" ? "始终触发" : "Always On", value: ""},
                                      ...eventConditionFieldOptions,
                                    ]}
                                  />
                                </EditorField>
                                <EditorField label={locale === "zh-CN" ? "条件运算" : "Operator"}>
                                  <Select
                                    className={editorControlClass}
                                    value={selectedWidget.eventConditionOperator ?? "contains"}
                                    disabled={!selectedWidget.eventConditionField}
                                    onChange={(event) =>
                                      handleWidgetPatch({
                                        eventConditionOperator: event.target.value as EditorWidget["eventConditionOperator"],
                                      })
                                    }
                                    options={[
                                      {label: locale === "zh-CN" ? "包含" : "Contains", value: "contains"},
                                      {label: locale === "zh-CN" ? "等于" : "Equals", value: "equals"},
                                      {label: ">", value: "gt"},
                                      {label: ">=", value: "gte"},
                                      {label: "<", value: "lt"},
                                      {label: "<=", value: "lte"},
                                    ]}
                                  />
                                </EditorField>
                              </div>
                              <EditorField
                                label={locale === "zh-CN" ? "条件值" : "Condition Value"}
                                hint={
                                  locale === "zh-CN"
                                    ? "数值字段可直接输入数字，文本字段支持包含和等于。"
                                    : "Numeric fields accept raw numbers; text fields support contains and equals."
                                }
                              >
                                <Input
                                  className={editorControlClass}
                                  disabled={!selectedWidget.eventConditionField}
                                  value={selectedWidget.eventConditionValue ?? ""}
                                  onChange={(event) =>
                                    handleWidgetPatch({eventConditionValue: event.target.value || undefined})
                                  }
                                  placeholder={locale === "zh-CN" ? "例如：100 / delayed / East" : "e.g. 100 / delayed / East"}
                                />
                              </EditorField>
                            </div>
                          ) : null}
                          {selectedWidget.eventAction === "openLink" ? (
                            <>
                              <EditorField label={locale === "zh-CN" ? "链接地址" : "URL"}>
                                <Input
                                  className={editorControlClass}
                                  value={selectedWidget.eventUrl ?? ""}
                                  onChange={(event) => handleWidgetPatch({eventUrl: event.target.value || undefined})}
                                  placeholder="https://example.com"
                                />
                              </EditorField>
                              <EditorField label={locale === "zh-CN" ? "打开方式" : "Open Mode"}>
                                <Select
                                  className={editorControlClass}
                                  value={selectedWidget.eventOpenMode ?? "blank"}
                                  onChange={(event) =>
                                    handleWidgetPatch({
                                      eventOpenMode: event.target.value as EditorWidget["eventOpenMode"],
                                    })
                                  }
                                  options={[
                                    {label: locale === "zh-CN" ? "新标签页" : "New Tab", value: "blank"},
                                    {label: locale === "zh-CN" ? "当前页" : "Current Tab", value: "self"},
                                  ]}
                                />
                              </EditorField>
                            </>
                          ) : null}
                          {selectedWidget.eventAction === "openPreview" || selectedWidget.eventAction === "openPublished" ? (
                            <EditorField label={locale === "zh-CN" ? "打开方式" : "Open Mode"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.eventOpenMode ?? "self"}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    eventOpenMode: event.target.value as EditorWidget["eventOpenMode"],
                                  })
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "当前页" : "Current Tab", value: "self"},
                                  {label: locale === "zh-CN" ? "新标签页" : "New Tab", value: "blank"},
                                ]}
                              />
                            </EditorField>
                          ) : null}
                          {selectedWidget.eventAction === "focusWidget" ? (
                            <EditorField
                              label={locale === "zh-CN" ? "联动目标" : "Target Widgets"}
                              hint={
                                locale === "zh-CN"
                                  ? "预览页和展示页点击当前组件后，会同时高亮一个或多个目标组件。"
                                  : "Clicking this widget in preview/published mode will highlight one or more target widgets."
                              }
                            >
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {eventTargetOptions.map((target) => {
                                    const active = selectedEventTargetIds.includes(target.value);

                                    return (
                                      <button
                                        key={target.value}
                                        type="button"
                                        onClick={() => {
                                          const nextTargets = active
                                            ? selectedEventTargetIds.filter((id) => id !== target.value)
                                            : [...selectedEventTargetIds, target.value];
                                          const normalizedTargets = Array.from(
                                            new Set(nextTargets.length ? nextTargets : [selectedWidget.id]),
                                          );

                                          handleWidgetPatch({
                                            eventTargetWidgetIds: normalizedTargets,
                                            eventTargetWidgetId:
                                              normalizedTargets.length === 1 ? normalizedTargets[0] : undefined,
                                          });
                                        }}
                                        className={`rounded-md border px-2.5 py-2 text-left text-[11px] transition-colors ${
                                          active
                                            ? "border-[#45664b] bg-[#eef5ec] text-[#23422a]"
                                            : "border-[#d7d8d1] bg-[#fafaf5] text-[#424842] hover:bg-[#eef2ea]"
                                        }`}
                                      >
                                        <div className="font-medium">{target.label}</div>
                                        <div className="mt-1 text-[10px] text-[#727971]">{target.value}</div>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="rounded-md border border-[#d7d8d1] bg-[#f7f6f1] px-3 py-2 text-[11px] leading-5 text-[#727971]">
                                  {selectedEventTargetIds.length > 1
                                    ? locale === "zh-CN"
                                      ? `当前会同步高亮 ${selectedEventTargetIds.length} 个组件。`
                                      : `${selectedEventTargetIds.length} widgets will highlight together.`
                                    : selectedEventTargetIds[0] === selectedWidget.id
                                      ? locale === "zh-CN"
                                        ? "当前只高亮组件自身，可继续追加其他联动目标。"
                                        : "Only the current widget will highlight right now; add more targets to build linkage."
                                      : locale === "zh-CN"
                                        ? "当前会高亮 1 个外部目标组件。"
                                        : "One external target widget will highlight right now."}
                                </div>
                              </div>
                            </EditorField>
                          ) : null}
                          <div className="rounded-md border border-[#d7d8d1] bg-[#f7f6f1] px-3 py-3 text-[12px] leading-5 text-[#727971]">
                            {selectedWidget.eventAction && selectedWidget.eventAction !== "none"
                              ? locale === "zh-CN"
                                ? "事件配置会跟随草稿和发布快照一起保存；编辑态仍以选中组件为主，不会在画布里直接触发条件和联动。"
                                : "Event config is saved with drafts and published snapshots; the editor canvas still prioritizes selection instead of firing conditions or linkage."
                              : locale === "zh-CN"
                                ? "当前组件还没有启用点击事件。"
                                : "No click event is enabled for this widget yet."}
                          </div>
                        </ChartConfigGroup>
                      </div>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" ? (
                  <EditorSection title={t("rightPanel.appearance.title")}>
                    <EditorField label={t("rightPanel.appearance.fillColor")}>
                      <ColorSwatchField
                        value={selectedWidget.fill}
                        onChange={(nextValue) => handleWidgetPatch({fill: nextValue})}
                        swatches={["#fafaf5", "#f4f4ef", "#eef5ec", "#ffdad6", "#20302a", "#233029"]}
                      />
                    </EditorField>
                    <EditorField label={locale === "zh-CN" ? "强调色" : "Accent Color"}>
                      <ColorSwatchField
                        value={selectedWidget.accent ?? "#23422a"}
                        onChange={(nextValue) => handleWidgetPatch({accent: nextValue})}
                        swatches={["#23422a", "#2f6d48", "#2b6cb0", "#c96b32", "#7a4dd8", "#ba1a1a"]}
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
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "标题颜色" : "Title Color"}>
                        <ColorSwatchField
                          value={selectedWidget.titleColor ?? "#727971"}
                          onChange={(nextValue) => handleWidgetPatch({titleColor: nextValue})}
                          swatches={["#727971", "#1a1c19", "#23422a", "#31503a", "#ffffff", "#ba1a1a"]}
                        />
                      </EditorField>
                      <EditorField label={locale === "zh-CN" ? "标题字号" : "Title Size"}>
                        <Input
                          className={editorControlClass}
                          value={String(selectedWidget.titleSize ?? 10)}
                          onChange={(event) =>
                            handleWidgetPatch({titleSize: clamp(numberOr(event.target.value, selectedWidget.titleSize ?? 10), 8, 18)})
                          }
                        />
                      </EditorField>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <EditorField label={locale === "zh-CN" ? "标题字距" : "Title Tracking"}>
                        <Input
                          className={editorControlClass}
                          value={String(selectedWidget.titleTracking ?? 1.8)}
                          onChange={(event) =>
                            handleWidgetPatch({
                              titleTracking: clamp(numberOr(event.target.value, selectedWidget.titleTracking ?? 1.8), 0, 8),
                            })
                          }
                        />
                      </EditorField>
                      <ToggleRow
                        label={locale === "zh-CN" ? "大写标题" : "Uppercase Title"}
                        checked={selectedWidget.titleUppercase !== false}
                        onCheckedChange={(checked) => handleWidgetPatch({titleUppercase: checked})}
                      />
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
                  ) : null}

                  {componentPanelTab === "style" && selectedWidget.type === "numberFlip" ? (
                    <EditorSection title={locale === "zh-CN" ? "数字翻牌样式" : "Number Flip Style"}>
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "数字卡片" : "Digit Cards"}
                        description={
                          locale === "zh-CN"
                            ? "把翻牌的字重、间距、底板和光感收在一起，避免重新退回普通指标卡。"
                            : "Keep digit spacing, surface and glow together so this stays distinct from a plain KPI card."
                        }
                      >
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "数字字号" : "Digit Size"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.numberFlipDigitSize ?? 44)}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  numberFlipDigitSize: clamp(
                                    numberOr(event.target.value, selectedWidget.numberFlipDigitSize ?? 44),
                                    24,
                                    88,
                                  ),
                                })
                              }
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "数字间距" : "Digit Gap"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.numberFlipGap ?? 10)}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  numberFlipGap: clamp(numberOr(event.target.value, selectedWidget.numberFlipGap ?? 10), 0, 24),
                                })
                              }
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "卡片底色" : "Digit Surface"}>
                            <ColorSwatchField
                              value={selectedWidget.numberFlipSurfaceColor ?? "#21342d"}
                              onChange={(nextValue) => handleWidgetPatch({numberFlipSurfaceColor: nextValue})}
                              swatches={["#21342d", "#244133", "#2f5240", "#3b2a2a", "#1d2235", "#ffffff"]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "数字文字色" : "Digit Text"}>
                            <ColorSwatchField
                              value={selectedWidget.textColor ?? "#f5fff7"}
                              onChange={(nextValue) => handleWidgetPatch({textColor: nextValue})}
                              swatches={["#f5fff7", "#ffffff", "#dfffe7", "#ffe8e2", "#20302a", "#8fe1a7"]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "发光强度" : "Glow Opacity"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.numberFlipGlowOpacity ?? 24}%`}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  numberFlipGlowOpacity: clamp(
                                    numberOr(event.target.value.replace("%", ""), selectedWidget.numberFlipGlowOpacity ?? 24),
                                    0,
                                    100,
                                  ),
                                })
                              }
                            />
                          </EditorField>
                        </div>
                      </ChartConfigGroup>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && isDecorationWidget ? (
                    <EditorSection title={locale === "zh-CN" ? "装饰样式" : "Decoration Style"}>
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "装饰结构" : "Decoration Structure"}
                        description={
                          locale === "zh-CN"
                            ? "先确定装饰是边框、标签、分割线还是发光体，再细调线条和氛围。"
                            : "Choose frame, badge, divider or glow first, then refine the line work and atmosphere."
                        }
                      >
                        <EditorField label={locale === "zh-CN" ? "装饰预设" : "Preset"}>
                          <Select
                            className={editorControlClass}
                            value={selectedWidget.decorationPreset ?? "badge"}
                            onChange={(event) =>
                              handleWidgetPatch({
                                decorationPreset: event.target.value as EditorWidget["decorationPreset"],
                              })
                            }
                            options={[
                              {label: locale === "zh-CN" ? "边框装饰" : "Frame", value: "frame"},
                              {label: locale === "zh-CN" ? "标签装饰" : "Badge", value: "badge"},
                              {label: locale === "zh-CN" ? "分割线" : "Divider", value: "divider"},
                              {label: locale === "zh-CN" ? "发光装饰" : "Glow", value: "glow"},
                            ]}
                          />
                        </EditorField>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "辅助色" : "Secondary Color"}>
                            <ColorSwatchField
                              value={selectedWidget.decorationSecondaryColor ?? "#315a41"}
                              onChange={(nextValue) => handleWidgetPatch({decorationSecondaryColor: nextValue})}
                              swatches={["#315a41", "#486c56", "#274a59", "#5a4031", "#6b6b6b", "#ffffff"]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "线条宽度" : "Line Width"}>
                            <Input
                              className={editorControlClass}
                              value={String(selectedWidget.decorationLineWidth ?? 2)}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  decorationLineWidth: clamp(
                                    numberOr(event.target.value, selectedWidget.decorationLineWidth ?? 2),
                                    1,
                                    8,
                                  ),
                                })
                              }
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "发光强度" : "Glow Opacity"}>
                            <Input
                              className={editorControlClass}
                              value={`${selectedWidget.decorationGlowOpacity ?? 24}%`}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  decorationGlowOpacity: clamp(
                                    numberOr(event.target.value.replace("%", ""), selectedWidget.decorationGlowOpacity ?? 24),
                                    0,
                                    100,
                                  ),
                                })
                              }
                            />
                          </EditorField>
                        </div>
                      </ChartConfigGroup>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "data" ? (
                  <EditorSection title={t("rightPanel.dataBinding.title")}>
                    <div className="space-y-3">
                    {isDecorationWidget ? (
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "装饰层" : "Presentation Layer"}
                        description={
                          locale === "zh-CN"
                            ? "装饰组件只负责补齐大屏视觉语言，不参与数据绑定、字段映射或数据处理。"
                            : "Decoration widgets only shape the visual language of the screen, so they do not use dataset binding, field mapping, or data processing."
                        }
                      >
                        <div className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#424842]">
                          <div className="font-medium text-[#1a1c19]">
                            {locale === "zh-CN" ? "样式驱动组件" : "Style-driven Widget"}
                          </div>
                          <div className="mt-2 text-[11px] leading-5 text-[#727971]">
                            {locale === "zh-CN"
                              ? "这类组件的结构、发光和边框都在内容与样式页里调整；如果需要页面成品感，优先回到样式页继续细化。"
                              : "Tune structure, glow, and framing from the content and style tabs. Go back to styling when you want to strengthen the screen's finished look."}
                          </div>
                        </div>
                      </ChartConfigGroup>
                    ) : (
                      <>
                    {supportsManualData ? (
                      <ChartConfigGroup
                        className="mb-3"
                        title={locale === "zh-CN" ? "来源模式" : "Source Mode"}
                        description={
                          locale === "zh-CN"
                            ? "先明确当前组件是吃共享数据集、请求数据，还是组件内手动 JSON。"
                            : "Set whether the widget reads from a shared dataset, a request source, or widget-local JSON."
                        }
                      >
                        <EditorField label={locale === "zh-CN" ? "数据来源" : "Data Source"}>
                          <Select
                            className={editorControlClass}
                            value={normalizedDataSourceMode}
                            onChange={(event) =>
                              handleWidgetPatch({
                                dataSourceMode: event.target.value as NonNullable<EditorWidget["dataSourceMode"]>,
                              })
                            }
                            options={[
                              {label: locale === "zh-CN" ? "绑定数据集" : "Dataset Binding", value: "static"},
                              {label: locale === "zh-CN" ? "请求数据" : "Request Data", value: "request"},
                              {label: locale === "zh-CN" ? "手动 JSON" : "Manual JSON", value: "manual"},
                            ]}
                          />
                        </EditorField>
                      </ChartConfigGroup>
                    ) : null}

                    {normalizedDataSourceMode === "request" ? (
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "请求型数据源" : "Request Source"}
                        description={
                          locale === "zh-CN"
                            ? "把请求地址、方法、刷新间隔和返回映射固定在数据层，后面接执行链时不用再改面板结构。"
                            : "Keep request URL, method, refresh interval and response mapping in the data layer."
                        }
                      >
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "请求方法" : "Method"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.requestMethod ?? "GET"}
                              onChange={(event) =>
                                handleWidgetPatch({requestMethod: event.target.value as EditorWidget["requestMethod"]})
                              }
                              options={[
                                {label: "GET", value: "GET"},
                                {label: "POST", value: "POST"},
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "刷新间隔" : "Refresh"}>
                            <Input
                              className={editorControlClass}
                              value={selectedWidget.requestRefreshInterval ? `${selectedWidget.requestRefreshInterval}s` : ""}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  requestRefreshInterval: event.target.value
                                    ? clamp(numberOr(event.target.value.replace("s", ""), selectedWidget.requestRefreshInterval ?? 30), 5, 3600)
                                    : undefined,
                                })
                              }
                              placeholder={locale === "zh-CN" ? "如 30s" : "e.g. 30s"}
                            />
                          </EditorField>
                        </div>
                        <EditorField
                          label={locale === "zh-CN" ? "请求地址" : "Request URL"}
                          hint={
                            locale === "zh-CN"
                              ? "当前先保存配置模型；执行层还没接入时，画布仍然沿用已绑定的数据做设计态预览。"
                              : "This stores the request model first; until execution lands, the canvas still falls back to bound design-time data."
                          }
                        >
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.requestUrl ?? ""}
                            onChange={(event) => handleWidgetPatch({requestUrl: event.target.value || undefined})}
                            placeholder="https://api.example.com/dashboard"
                          />
                        </EditorField>
                        <EditorField
                          label={locale === "zh-CN" ? "请求参数" : "Params"}
                          hint={locale === "zh-CN" ? "支持 query/body 的轻量配置，建议先写 JSON。" : "Use lightweight JSON for query/body params."}
                        >
                          <Textarea
                            value={selectedWidget.requestParams ?? ""}
                            onChange={(event) => handleWidgetPatch({requestParams: event.target.value || undefined})}
                            className="min-h-24 resize-y rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 font-mono text-[12px] leading-5 focus:border-[#45664b]"
                            placeholder={locale === "zh-CN" ? '{"region":"华东","limit":10}' : '{"region":"east","limit":10}'}
                          />
                        </EditorField>
                        <EditorField
                          label={locale === "zh-CN" ? "返回映射" : "Response Mapping"}
                          hint={
                            locale === "zh-CN"
                              ? "把接口返回收口成组件能消费的字段，例如 data.list -> rows。"
                              : "Describe how the response should be normalized into widget-ready rows."
                          }
                        >
                          <Textarea
                            value={selectedWidget.requestResponseMap ?? ""}
                            onChange={(event) => handleWidgetPatch({requestResponseMap: event.target.value || undefined})}
                            className="min-h-24 resize-y rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 font-mono text-[12px] leading-5 focus:border-[#45664b]"
                            placeholder={locale === "zh-CN" ? 'data.list -> rows\nvalue -> metric\nname -> label' : "data.items -> rows\nvalue -> metric\nname -> label"}
                          />
                        </EditorField>
                        <div className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#424842]">
                          <div className="font-medium text-[#1a1c19]">
                            {locale === "zh-CN" ? "请求配置摘要" : "Request Summary"}
                          </div>
                          <div className="mt-2 text-[11px] leading-5 text-[#727971]">
                            {selectedWidget.requestUrl?.trim()
                              ? `${selectedWidget.requestMethod ?? "GET"} · ${selectedWidget.requestUrl}`
                              : locale === "zh-CN"
                                ? "还没有填写请求地址，当前仅保留了请求型数据源结构。"
                                : "Request URL is still empty; the request-source structure is ready."}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <MiniActionButton
                            label={locale === "zh-CN" ? "回到数据集" : "Back to Dataset"}
                            onClick={resetToDatasetBinding}
                          />
                          <MiniActionButton
                            label={locale === "zh-CN" ? "改用手动 JSON" : "Use Manual JSON"}
                            onClick={fillManualDataTemplate}
                          />
                        </div>
                      </ChartConfigGroup>
                    ) : supportsManualData && normalizedDataSourceMode === "manual" ? (
                      <>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "手动 JSON" : "Manual JSON"}
                          description={
                            locale === "zh-CN"
                              ? "手动 JSON 适合做局部演示、临时修正或脱离共享数据集的单组件数据。"
                              : "Use manual JSON for local demos, one-off overrides, or widget-specific data detached from the shared dataset."
                          }
                        >
                          <div className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#424842]">
                            <div className="font-medium text-[#1a1c19]">
                              {locale === "zh-CN" ? "组件独立数据" : "Widget-local Data"}
                            </div>
                            <div className="mt-2 text-[11px] leading-5 text-[#727971]">
                              {locale === "zh-CN"
                                ? "这个组件将优先使用手动填写的 JSON 数据，不再依赖全局数据集。适合快速做演示图、单独修正某个图表，或临时口径调整。"
                                : "This widget will prefer the JSON entered below instead of the shared dataset. Use it for quick charts, local overrides or presentation-only data."}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <MiniActionButton
                              label={locale === "zh-CN" ? "填充示例 JSON" : "Fill Sample JSON"}
                              onClick={fillManualDataTemplate}
                            />
                            <MiniActionButton
                              label={locale === "zh-CN" ? "切回数据集绑定" : "Back to Dataset"}
                              onClick={resetToDatasetBinding}
                            />
                          </div>
                          <EditorField
                            label={locale === "zh-CN" ? "手动 JSON 数据" : "Manual JSON Data"}
                            hint={manualDataPlaceholderHint(selectedWidget.type, locale)}
                          >
                            <Textarea
                              value={selectedWidget.manualData ?? defaultManualDataTemplate(selectedWidget.type)}
                              onChange={(event) => handleWidgetPatch({manualData: event.target.value})}
                              className="min-h-32 resize-y rounded-md border-[#d7d8d1] bg-[#fafaf5] px-2.5 font-mono text-[12px] leading-5 focus:border-[#45664b]"
                            />
                          </EditorField>
                          <div
                            className={`rounded-md border px-3 py-3 text-[12px] ${
                              manualDataState && manualDataState.valid
                                ? "border-[#c2d8c4] bg-[#eef5ec] text-[#23422a]"
                                : "border-[#efc0ba] bg-[#fff4f2] text-[#8a2f25]"
                            }`}
                          >
                            <div className="font-semibold">
                              {manualDataState && manualDataState.valid
                                ? locale === "zh-CN"
                                  ? "JSON 校验通过"
                                  : "JSON validated"
                                : locale === "zh-CN"
                                  ? "JSON 校验失败"
                                  : "JSON validation failed"}
                            </div>
                            <p className="mt-1 leading-5">
                              {manualDataState && manualDataState.valid
                                ? manualDataSuccessSummary(selectedWidget.type, manualDataState, locale)
                                : manualDataState?.error ??
                                  (locale === "zh-CN"
                                    ? "请填写合法的 JSON 数据"
                                    : "Enter valid JSON data to drive this widget.")}
                            </p>
                          </div>
                        </ChartConfigGroup>
                        {manualDataState && manualDataState.valid ? (
                          <ChartConfigGroup title={locale === "zh-CN" ? "预览" : "Preview"}>
                            <ManualDataPreviewCard
                              locale={locale}
                              widgetType={selectedWidget.type}
                              state={manualDataState}
                              widget={selectedWidget}
                            />
                          </ChartConfigGroup>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <ChartConfigGroup
                          className="mb-3"
                          title={locale === "zh-CN" ? "数据集绑定" : "Dataset Binding"}
                          description={
                            locale === "zh-CN"
                              ? "这里决定当前组件绑定哪份共享数据集，并确认这份数据的基本规模。"
                              : "Choose the shared dataset for this widget and confirm the dataset footprint here."
                          }
                        >
                          {supportsManualData ? (
                            <div className="grid grid-cols-2 gap-2">
                              <MiniActionButton
                                label={locale === "zh-CN" ? "切到手动 JSON" : "Switch to Manual JSON"}
                                onClick={fillManualDataTemplate}
                              />
                              <MiniActionButton
                                label={locale === "zh-CN" ? "清空字段映射" : "Clear Field Map"}
                                onClick={() => handleWidgetPatch({fieldMap: ""})}
                              />
                            </div>
                          ) : null}
                          <EditorField label={t("rightPanel.dataBinding.dataset")}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataset}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataset: event.target.value,
                                  dataSourceMode: "static",
                                })
                              }
                              options={datasets.map((dataset) => ({
                                label: `${dataset.name} · ${dataset.records}`,
                                value: dataset.name,
                              }))}
                            />
                          </EditorField>
                          <div className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#424842]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-[#1a1c19]">
                                {selectedWidget.dataset || (locale === "zh-CN" ? "未绑定数据集" : "No dataset")}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.14em] text-[#727971]">
                                {selectedDatasetFields.length} {locale === "zh-CN" ? "字段" : "fields"}
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-[#727971]">
                              {locale === "zh-CN"
                                ? "字段映射会直接驱动图表、指标卡和表格内容。"
                                : "Field bindings directly drive charts, KPIs and table content."}
                            </div>
                          </div>
                        </ChartConfigGroup>
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "字段映射" : "Field Mapping"}
                          description={
                            locale === "zh-CN"
                              ? "让组件真正知道当前数据里哪些字段对应值、分类、时间或地域。"
                              : "Tell the widget which fields represent values, labels, time, or regions in the bound dataset."
                          }
                        >
                          <EditorField
                            label={locale === "zh-CN" ? "当前绑定概览" : "Binding Summary"}
                            hint={
                              bindingSummary.length
                                ? locale === "zh-CN"
                                  ? "这里显示当前组件实际会读取到的字段"
                                  : "These fields are currently driving the selected widget"
                                : locale === "zh-CN"
                                  ? "当前组件不依赖额外字段映射"
                                  : "This widget does not require extra field mappings"
                            }
                          >
                            {bindingSummary.length ? (
                              <div className="space-y-2">
                                {bindingSummary.map((binding) => (
                                  <div
                                    key={binding.alias}
                                    className={`rounded-md border px-3 py-2 text-[12px] ${
                                      binding.resolvedField
                                        ? "border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19]"
                                        : "border-[#efc0ba] bg-[#fff4f2] text-[#8a2f25]"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="font-medium">{binding.label}</span>
                                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#727971]">
                                        {binding.resolvedMeta?.type ?? (locale === "zh-CN" ? "未绑定" : "Unmapped")}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[11px]">
                                      {binding.resolvedField || (locale === "zh-CN" ? "请选择一个字段" : "Choose a field")}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-md border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#727971]">
                                {locale === "zh-CN"
                                  ? "当前组件主要依赖文本或样式配置，不需要额外字段映射。"
                                  : "This widget mainly relies on its own content and style, so no extra field mapping is required."}
                              </div>
                            )}
                          </EditorField>
                          {missingBindings.length ? (
                            <div className="rounded-md border border-[#efc0ba] bg-[#fff4f2] px-3 py-3 text-[12px] text-[#8a2f25]">
                              <div className="font-semibold">{locale === "zh-CN" ? "绑定提醒" : "Binding Notice"}</div>
                              <p className="mt-1 leading-5">
                                {locale === "zh-CN"
                                  ? "当前组件还有字段未完成绑定，画布会先回退到示例数据。"
                                  : "Some bindings are still missing, so the canvas temporarily falls back to sample data."}
                              </p>
                            </div>
                          ) : null}
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
                        </ChartConfigGroup>
                      </>
                    )}
                    {supportsBasicFormatting ? (
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "基础格式化" : "Basic Formatting"}
                        description={
                          selectedWidget.type === "table"
                            ? locale === "zh-CN"
                              ? "把表格数值的展示格式独立到数据层，避免继续混在表格视觉样式里。"
                              : "Keep table number formatting in the data layer instead of mixing it into visual styling."
                            : locale === "zh-CN"
                              ? "把数值格式、前后缀放回数据层，确保面板、预览和最终渲染说同一种数字语言。"
                              : "Keep value format and affixes with the data layer so the panel, preview and widget stay in sync."
                        }
                      >
                        {isMetricLikeWidget ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "前缀" : "Prefix"}>
                              <Input
                                className={editorControlClass}
                                value={selectedWidget.valuePrefix ?? ""}
                                onChange={(event) => handleWidgetPatch({valuePrefix: event.target.value})}
                                placeholder={locale === "zh-CN" ? "如 $" : "e.g. $"}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "后缀" : "Suffix"}>
                              <Input
                                className={editorControlClass}
                                value={selectedWidget.valueSuffix ?? ""}
                                onChange={(event) => handleWidgetPatch({valueSuffix: event.target.value})}
                                placeholder={locale === "zh-CN" ? "如 %" : "e.g. %"}
                              />
                            </EditorField>
                          </div>
                        ) : null}
                        {isChartWidget || selectedWidget.type === "rank" ? (
                          <>
                            <div className="grid grid-cols-2 gap-2.5">
                              <EditorField label={locale === "zh-CN" ? "数值格式" : "Value Format"}>
                                <Select
                                  className={editorControlClass}
                                  value={selectedWidget.chartLabelFormat ?? (selectedWidget.type === "pie" ? "percent" : "raw")}
                                  onChange={(event) =>
                                    handleWidgetPatch({
                                      chartLabelFormat: event.target.value as EditorWidget["chartLabelFormat"],
                                    })
                                  }
                                  options={[
                                    {label: locale === "zh-CN" ? "原始值" : "Raw", value: "raw"},
                                    {label: locale === "zh-CN" ? "紧凑格式" : "Compact", value: "compact"},
                                    {label: locale === "zh-CN" ? "百分比" : "Percent", value: "percent"},
                                  ]}
                                />
                              </EditorField>
                              <EditorField label={locale === "zh-CN" ? "小数位" : "Decimals"}>
                                <Input
                                  className={editorControlClass}
                                  value={String(selectedWidget.chartDecimals ?? 0)}
                                  onChange={(event) =>
                                    handleWidgetPatch({
                                      chartDecimals: clamp(numberOr(event.target.value, selectedWidget.chartDecimals ?? 0), 0, 3),
                                    })
                                  }
                                />
                              </EditorField>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <EditorField label={locale === "zh-CN" ? "前缀" : "Prefix"}>
                                <Input
                                  className={editorControlClass}
                                  value={selectedWidget.valuePrefix ?? ""}
                                  onChange={(event) => handleWidgetPatch({valuePrefix: event.target.value})}
                                  placeholder={locale === "zh-CN" ? "如 $" : "e.g. $"}
                                />
                              </EditorField>
                              <EditorField label={locale === "zh-CN" ? "后缀" : "Suffix"}>
                                <Input
                                  className={editorControlClass}
                                  value={selectedWidget.valueSuffix ?? ""}
                                  onChange={(event) => handleWidgetPatch({valueSuffix: event.target.value})}
                                  placeholder={locale === "zh-CN" ? "如 %" : "e.g. %"}
                                />
                              </EditorField>
                            </div>
                          </>
                        ) : null}
                        {selectedWidget.type === "table" ? (
                          <EditorField label={locale === "zh-CN" ? "数值格式" : "Number Format"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.tableNumberFormat ?? "raw"}
                              onChange={(event) =>
                                handleWidgetPatch({tableNumberFormat: event.target.value as EditorWidget["tableNumberFormat"]})
                              }
                              options={[
                                {label: locale === "zh-CN" ? "原始值" : "Raw", value: "raw"},
                                {label: locale === "zh-CN" ? "紧凑格式" : "Compact", value: "compact"},
                                {label: locale === "zh-CN" ? "人民币" : "Currency", value: "currency"},
                                {label: locale === "zh-CN" ? "百分比" : "Percent", value: "percent"},
                              ]}
                            />
                          </EditorField>
                        ) : null}
                      </ChartConfigGroup>
                    ) : null}
                    {supportsDataProcessing ? (
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "数据处理" : "Data Processing"}
                        description={
                          locale === "zh-CN"
                            ? "把过滤、排序、Top N、聚合和截断独立成数据层能力，不再混在字段映射和内容配置里。"
                            : "Keep filtering, sorting, Top N, aggregation and truncation as a dedicated data-layer capability."
                        }
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <MiniActionButton
                            label={locale === "zh-CN" ? "清空规则" : "Clear Rules"}
                            onClick={resetDataProcessing}
                          />
                          <MiniActionButton
                            label={locale === "zh-CN" ? "回到字段映射" : "Back to Mapping"}
                            onClick={() => setComponentPanelTab("data")}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "过滤字段" : "Filter Field"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataFilterField ?? ""}
                              onChange={(event) => handleWidgetPatch({dataFilterField: event.target.value || undefined})}
                              options={[
                                {label: locale === "zh-CN" ? "不启用" : "Off", value: ""},
                                ...dataProcessingFieldOptions,
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "过滤条件" : "Operator"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataFilterOperator ?? "contains"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataFilterOperator: event.target.value as EditorWidget["dataFilterOperator"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "包含" : "Contains", value: "contains"},
                                {label: locale === "zh-CN" ? "等于" : "Equals", value: "equals"},
                                {label: ">", value: "gt"},
                                {label: ">=", value: "gte"},
                                {label: "<", value: "lt"},
                                {label: "<=", value: "lte"},
                              ]}
                            />
                          </EditorField>
                        </div>
                        <EditorField
                          label={locale === "zh-CN" ? "过滤值" : "Filter Value"}
                          hint={
                            locale === "zh-CN"
                              ? "留空时不生效；数值字段可直接输入数字。"
                              : "Leave empty to disable; numeric fields accept raw numbers."
                          }
                        >
                          <Input
                            className={editorControlClass}
                            value={selectedWidget.dataFilterValue ?? ""}
                            onChange={(event) => handleWidgetPatch({dataFilterValue: event.target.value || undefined})}
                            placeholder={locale === "zh-CN" ? "如 华东 / 100 / delayed" : "e.g. East / 100 / delayed"}
                          />
                        </EditorField>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField label={locale === "zh-CN" ? "排序字段" : "Sort Field"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataSortField ?? ""}
                              onChange={(event) => handleWidgetPatch({dataSortField: event.target.value || undefined})}
                              options={[
                                {label: locale === "zh-CN" ? "保持原顺序" : "Original Order", value: ""},
                                ...dataProcessingFieldOptions,
                              ]}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "排序方向" : "Direction"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataSortDirection ?? "desc"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataSortDirection: event.target.value as EditorWidget["dataSortDirection"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "降序" : "Descending", value: "desc"},
                                {label: locale === "zh-CN" ? "升序" : "Ascending", value: "asc"},
                              ]}
                            />
                          </EditorField>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <EditorField
                            label={selectedWidget.type === "table" || selectedWidget.type === "events" ? (locale === "zh-CN" ? "行数限制" : "Row Limit") : locale === "zh-CN" ? "Top N" : "Top N"}
                          >
                            <Input
                              className={editorControlClass}
                              value={selectedWidget.dataLimit ? String(selectedWidget.dataLimit) : ""}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataLimit: event.target.value ? clamp(numberOr(event.target.value, selectedWidget.dataLimit ?? 0), 1, 50) : undefined,
                                })
                              }
                              placeholder={locale === "zh-CN" ? "留空为不限制" : "Empty for no limit"}
                            />
                          </EditorField>
                          <EditorField label={locale === "zh-CN" ? "文本截断" : "Truncate"}>
                            <Input
                              className={editorControlClass}
                              value={selectedWidget.dataTruncateLength ? String(selectedWidget.dataTruncateLength) : ""}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataTruncateLength: event.target.value ? clamp(numberOr(event.target.value, selectedWidget.dataTruncateLength ?? 0), 4, 40) : undefined,
                                })
                              }
                              placeholder={locale === "zh-CN" ? "字符数" : "Characters"}
                            />
                          </EditorField>
                        </div>
                        {supportsAggregation ? (
                          <EditorField
                            label={locale === "zh-CN" ? "聚合方式" : "Aggregation"}
                            hint={
                              locale === "zh-CN"
                                ? "按当前标签维度合并重复项，再对数值做 sum / avg / min / max / count。"
                                : "Group duplicate labels first, then aggregate their numeric values."
                            }
                          >
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.dataAggregateMode ?? "none"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  dataAggregateMode: event.target.value as EditorWidget["dataAggregateMode"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "不聚合" : "None", value: "none"},
                                {label: "SUM", value: "sum"},
                                {label: "AVG", value: "avg"},
                                {label: "MIN", value: "min"},
                                {label: "MAX", value: "max"},
                                {label: "COUNT", value: "count"},
                              ]}
                            />
                          </EditorField>
                        ) : null}
                      </ChartConfigGroup>
                    ) : null}
                    {selectedWidget.type === "table" && availableTableFields.length ? (
                      <ChartConfigGroup
                        title={locale === "zh-CN" ? "列配置" : "Column Config"}
                        description={
                          locale === "zh-CN"
                            ? "表格列的显隐、别名、宽度和顺序先集中在这里收口。"
                            : "Keep table column visibility, labels, widths and order in one place."
                        }
                      >
                      <div className="space-y-3">
                        <EditorField
                          label={locale === "zh-CN" ? "显示列" : "Visible Columns"}
                          hint={locale === "zh-CN" ? "至少保留 1 列；顺序即展示顺序" : "Keep at least one column; order follows the list below"}
                        >
                          <div className="space-y-2">
                            {availableTableFields.map((field) => {
                              const checked = effectiveTableColumns.includes(field.field);
                              return (
                                <button
                                  key={field.field}
                                  type="button"
                                  onClick={() => handleTableColumnToggle(field.field)}
                                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] transition-colors ${
                                    checked
                                      ? "border-[#9db7a0] bg-[#eef5ec] text-[#23422a]"
                                      : "border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19] hover:bg-[#f2f2ec]"
                                  }`}
                                >
                                  <span className="inline-flex min-w-0 items-center gap-2">
                                    <span className="font-medium">{field.field}</span>
                                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#727971]">{field.type}</span>
                                  </span>
                                  <span className="text-[11px] font-semibold">{checked ? (locale === "zh-CN" ? "显示" : "On") : (locale === "zh-CN" ? "隐藏" : "Off")}</span>
                                </button>
                              );
                            })}
                          </div>
                        </EditorField>
                        {effectiveTableColumns.map((column) => (
                          <EditorField
                            key={column}
                            label={locale === "zh-CN" ? `${column} 别名` : `${column} Label`}
                          >
                            <div className="space-y-2">
                              <Input
                                className={editorControlClass}
                                value={selectedWidget.tableColumnLabels?.[column] ?? ""}
                                onChange={(event) => handleTableColumnLabelChange(column, event.target.value)}
                                placeholder={column}
                              />
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.tableColumnWidths?.[column] ?? 140)}
                                onChange={(event) => handleTableColumnWidthChange(column, event.target.value)}
                                placeholder={locale === "zh-CN" ? "列宽 (px)" : "Width (px)"}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <MiniActionButton
                                  label={locale === "zh-CN" ? "上移列" : "Move Up"}
                                  onClick={() => handleTableColumnMove(column, "up")}
                                  disabled={effectiveTableColumns.indexOf(column) === 0}
                                />
                                <MiniActionButton
                                  label={locale === "zh-CN" ? "下移列" : "Move Down"}
                                  onClick={() => handleTableColumnMove(column, "down")}
                                  disabled={effectiveTableColumns.indexOf(column) === effectiveTableColumns.length - 1}
                                />
                              </div>
                            </div>
                          </EditorField>
                        ))}
                      </div>
                      </ChartConfigGroup>
                    ) : null}
                    {usesDatasetBinding ? (
                      <ChartConfigGroup title={locale === "zh-CN" ? "预览" : "Preview"}>
                        <BoundDatasetPreviewCard
                          locale={locale}
                          widget={selectedWidget}
                          dataset={boundDataset}
                        />
                      </ChartConfigGroup>
                    ) : null}
                      </>
                    )}
                    </div>
                  </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && isChartWidget ? (
                    <EditorSection title={locale === "zh-CN" ? "图表配置" : "Chart Settings"}>
                      <div className="flex flex-col gap-3">
                        <ChartConfigGroup
                          className="order-10"
                          title={locale === "zh-CN" ? "标题" : "Title"}
                          description={
                            locale === "zh-CN"
                              ? "先把标题区和信息头部调顺，图表气质会稳定很多。"
                              : "Dial in the title area first so the chart feels cohesive before tuning the plot."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "标题强调色" : "Title Accent"}>
                              <ColorSwatchField
                                value={selectedWidget.chartTitleAccentColor ?? (selectedWidget.accent ?? "#23422a")}
                                onChange={(nextValue) => handleWidgetPatch({chartTitleAccentColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标题底色" : "Title Surface"}>
                              <ColorSwatchField
                                value={selectedWidget.chartTitleBackgroundColor ?? "#eef5ec"}
                                onChange={(nextValue) => handleWidgetPatch({chartTitleBackgroundColor: nextValue})}
                              />
                            </EditorField>
                          </div>
                          <EditorField label={locale === "zh-CN" ? "标题边框色" : "Title Border"}>
                            <ColorSwatchField
                              value={selectedWidget.chartTitleBorderColor ?? "#c7d4c8"}
                              onChange={(nextValue) => handleWidgetPatch({chartTitleBorderColor: nextValue})}
                            />
                          </EditorField>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "标题内边距 X" : "Title Padding X"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitlePaddingX ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitlePaddingX: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitlePaddingX ?? 0), 0, 24),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标题内边距 Y" : "Title Padding Y"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitlePaddingY ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitlePaddingY: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitlePaddingY ?? 0), 0, 16),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标题圆角" : "Title Radius"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitleRadius ?? 999}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitleRadius: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitleRadius ?? 999), 0, 999),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标题底色透明度" : "Title Surface Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitleSurfaceOpacity ?? 12}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitleSurfaceOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.chartTitleSurfaceOpacity ?? 12), 0, 100),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标题边框宽度" : "Title Border Width"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitleBorderWidth ?? 1}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitleBorderWidth: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitleBorderWidth ?? 1), 0, 8),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "信号点尺寸" : "Signal Dot Size"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitleSignalSize ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitleSignalSize: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitleSignalSize ?? 0), 0, 20),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "信号点光圈色" : "Signal Halo"}>
                              <ColorSwatchField
                                value={selectedWidget.chartTitleSignalHaloColor ?? "#ffffff"}
                                onChange={(nextValue) => handleWidgetPatch({chartTitleSignalHaloColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "分割线宽度" : "Divider Width"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartTitleDividerWidth ?? 0}px`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartTitleDividerWidth: clamp(numberOr(event.target.value.replace("px", ""), selectedWidget.chartTitleDividerWidth ?? 0), 0, 6),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "分割线起始色" : "Divider Start"}>
                              <ColorSwatchField
                                value={selectedWidget.chartTitleDividerStartColor ?? "#c7d4c8"}
                                onChange={(nextValue) => handleWidgetPatch({chartTitleDividerStartColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "分割线结束色" : "Divider End"}>
                              <ColorSwatchField
                                value={selectedWidget.chartTitleDividerEndColor ?? "transparent"}
                                onChange={(nextValue) => handleWidgetPatch({chartTitleDividerEndColor: nextValue})}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="order-20"
                          title={locale === "zh-CN" ? "配色与视觉" : "Palette & Visuals"}
                          description={
                            locale === "zh-CN"
                              ? "集中控制图表主色、层次色和读图用的关键颜色。"
                              : "Control the primary palette and the key colors used to read the chart."
                          }
                        >
                          <EditorField label={locale === "zh-CN" ? "主色" : "Primary Accent"}>
                            <ColorSwatchField
                              value={selectedWidget.accent ?? "#23422a"}
                              onChange={(nextAccent) => handleWidgetPatch({accent: nextAccent})}
                            />
                          </EditorField>
                          <EditorField
                            label={locale === "zh-CN" ? "图表调色板" : "Chart Palette"}
                            hint={
                              locale === "zh-CN"
                                ? "直接定义主色、辅助色、浅色和深色，图表会即时跟着更新。"
                                : "Define the primary, support, light and dark colors directly for instant updates."
                            }
                          >
                            <ChartPaletteEditor
                              value={selectedWidget.chartPaletteColors}
                              palette={selectedWidget.chartPalette ?? "forest"}
                              accent={selectedWidget.accent ?? "#23422a"}
                              onChange={(nextColors) => handleWidgetPatch({chartPaletteColors: nextColors})}
                            />
                          </EditorField>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="order-40"
                          title={locale === "zh-CN" ? "标签与图例" : "Labels & Legend"}
                          description={
                            locale === "zh-CN"
                              ? "控制数值、数据标签和图例怎么出现在用户眼前。"
                              : "Control label visibility, tone and legend presentation."
                          }
                        >
                          <div className="hidden grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "数值格式" : "Value Format"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.chartLabelFormat ?? (selectedWidget.type === "pie" ? "percent" : "raw")}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartLabelFormat: event.target.value as EditorWidget["chartLabelFormat"],
                                  })
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "原始值" : "Raw", value: "raw"},
                                  {label: locale === "zh-CN" ? "紧凑格式" : "Compact", value: "compact"},
                                  {label: locale === "zh-CN" ? "百分比" : "Percent", value: "percent"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "小数位" : "Decimals"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.chartDecimals ?? 0)}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartDecimals: clamp(numberOr(event.target.value, selectedWidget.chartDecimals ?? 0), 0, 3),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                          <div className="hidden grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "前缀" : "Prefix"}>
                              <Input
                                className={editorControlClass}
                                value={selectedWidget.valuePrefix ?? ""}
                                onChange={(event) => handleWidgetPatch({valuePrefix: event.target.value})}
                                placeholder={locale === "zh-CN" ? "如 ¥" : "e.g. $"}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "后缀" : "Suffix"}>
                              <Input
                                className={editorControlClass}
                                value={selectedWidget.valueSuffix ?? ""}
                                onChange={(event) => handleWidgetPatch({valueSuffix: event.target.value})}
                                placeholder={locale === "zh-CN" ? "如 件 / %" : "e.g. %"}
                              />
                            </EditorField>
                          </div>
                          <ToggleRow
                            label={locale === "zh-CN" ? "显示数值标签" : "Show Data Labels"}
                            checked={selectedWidget.showDataLabels ?? false}
                            onCheckedChange={(checked) => handleWidgetPatch({showDataLabels: checked})}
                          />
                          <div className="grid grid-cols-2 gap-2.5">
                            <ToggleRow
                              label={locale === "zh-CN" ? "显示信息徽章" : "Show Summary Badges"}
                              checked={selectedWidget.showHighlightBadges !== false}
                              onCheckedChange={(checked) => handleWidgetPatch({showHighlightBadges: checked})}
                            />
                            <EditorField label={locale === "zh-CN" ? "标签强度" : "Label Tone"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.chartLabelTone ?? "balanced"}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartLabelTone: event.target.value as EditorWidget["chartLabelTone"],
                                  })
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "弱化" : "Muted", value: "muted"},
                                  {label: locale === "zh-CN" ? "均衡" : "Balanced", value: "balanced"},
                                  {label: locale === "zh-CN" ? "强调" : "Strong", value: "strong"},
                                ]}
                              />
                            </EditorField>
                          </div>
                          <EditorField label={locale === "zh-CN" ? "徽章布局" : "Badge Layout"}>
                            <Select
                              className={editorControlClass}
                              value={selectedWidget.chartBadgeLayout ?? "split"}
                              onChange={(event) =>
                                handleWidgetPatch({
                                  chartBadgeLayout: event.target.value as EditorWidget["chartBadgeLayout"],
                                })
                              }
                              options={[
                                {label: locale === "zh-CN" ? "两侧分布" : "Split", value: "split"},
                                {label: locale === "zh-CN" ? "纵向堆叠" : "Stacked", value: "stacked"},
                                {label: locale === "zh-CN" ? "底部条带" : "Footer", value: "footer"},
                              ]}
                            />
                          </EditorField>
                          {selectedWidget.type === "pie" ? (
                            <>
                              <ToggleRow
                                label={locale === "zh-CN" ? "显示图例" : "Show Legend"}
                                checked={selectedWidget.showLegend !== false}
                                onCheckedChange={(checked) => handleWidgetPatch({showLegend: checked})}
                              />
                              <div className="grid grid-cols-2 gap-2.5">
                                <EditorField label={locale === "zh-CN" ? "图例强度" : "Legend Tone"}>
                                  <Select
                                    className={editorControlClass}
                                    value={selectedWidget.chartLegendTone ?? "balanced"}
                                    onChange={(event) =>
                                      handleWidgetPatch({
                                        chartLegendTone: event.target.value as EditorWidget["chartLegendTone"],
                                      })
                                    }
                                    options={[
                                      {label: locale === "zh-CN" ? "弱化" : "Muted", value: "muted"},
                                      {label: locale === "zh-CN" ? "均衡" : "Balanced", value: "balanced"},
                                      {label: locale === "zh-CN" ? "强调" : "Strong", value: "strong"},
                                    ]}
                                  />
                                </EditorField>
                                <EditorField label={locale === "zh-CN" ? "图例位置" : "Legend Position"}>
                                  <Select
                                    className={editorControlClass}
                                    value={selectedWidget.legendPosition ?? "right"}
                                    onChange={(event) =>
                                      handleWidgetPatch({
                                        legendPosition: event.target.value as EditorWidget["legendPosition"],
                                      })
                                    }
                                    options={[
                                      {label: locale === "zh-CN" ? "右侧" : "Right", value: "right"},
                                      {label: locale === "zh-CN" ? "底部" : "Bottom", value: "bottom"},
                                    ]}
                                  />
                                </EditorField>
                              </div>
                            </>
                          ) : null}
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="order-30"
                          title={locale === "zh-CN" ? "坐标与网格" : "Axes & Grid"}
                          description={
                            locale === "zh-CN"
                              ? "控制坐标轴、标签和网格密度，让图表信息层次更清楚。"
                              : "Tune axes, labels and grid visibility so the chart reads clearly on a big screen."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "图内留白" : "Inner Padding"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.chartPaddingMode ?? "balanced"}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartPaddingMode: event.target.value as EditorWidget["chartPaddingMode"],
                                  })
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "紧凑" : "Compact", value: "compact"},
                                  {label: locale === "zh-CN" ? "均衡" : "Balanced", value: "balanced"},
                                  {label: locale === "zh-CN" ? "展示型" : "Showcase", value: "showcase"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "网格样式" : "Grid Style"}>
                              <Select
                                className={editorControlClass}
                                value={selectedWidget.chartGridStyle ?? "dashed"}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartGridStyle: event.target.value as EditorWidget["chartGridStyle"],
                                  })
                                }
                                options={[
                                  {label: locale === "zh-CN" ? "虚线" : "Dashed", value: "dashed"},
                                  {label: locale === "zh-CN" ? "实线" : "Solid", value: "solid"},
                                  {label: locale === "zh-CN" ? "点线" : "Dot", value: "dot"},
                                ]}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "轴文字颜色" : "Axis Text Color"}>
                              <ColorSwatchField
                                value={selectedWidget.chartAxisColor ?? "#727971"}
                                onChange={(nextValue) => handleWidgetPatch({chartAxisColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "网格颜色" : "Grid Color"}>
                              <ColorSwatchField
                                value={selectedWidget.chartGridColor ?? "#d9d0b7"}
                                onChange={(nextValue) => handleWidgetPatch({chartGridColor: nextValue})}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "网格透明度" : "Grid Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartGridOpacity ?? 42}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartGridOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.chartGridOpacity ?? 42),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "轴线透明度" : "Axis Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartAxisOpacity ?? 56}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    chartAxisOpacity: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.chartAxisOpacity ?? 56),
                                      0,
                                      100,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                          <ToggleRow
                            label={locale === "zh-CN" ? "显示网格辅助" : "Show Grid"}
                            checked={selectedWidget.showGrid ?? false}
                            onCheckedChange={(checked) => handleWidgetPatch({showGrid: checked})}
                          />
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "轴标签字号" : "Axis Label Size"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.axisLabelSize ?? 8)}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    axisLabelSize: clamp(numberOr(event.target.value, selectedWidget.axisLabelSize ?? 8), 8, 14),
                                  })
                                }
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "X 轴旋转" : "X Label Rotate"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.axisLabelRotate ?? 0}°`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    axisLabelRotate: clamp(
                                      numberOr(event.target.value.replace("°", ""), selectedWidget.axisLabelRotate ?? 0),
                                      0,
                                      90,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <ToggleRow
                              label={locale === "zh-CN" ? "显示 X 轴标签" : "Show X Labels"}
                              checked={selectedWidget.showXAxisLabels ?? (selectedWidget.type === "bar")}
                              onCheckedChange={(checked) => handleWidgetPatch({showXAxisLabels: checked})}
                            />
                            <ToggleRow
                              label={locale === "zh-CN" ? "显示 Y 轴标签" : "Show Y Labels"}
                              checked={selectedWidget.showYAxisLabels ?? false}
                              onCheckedChange={(checked) => handleWidgetPatch({showYAxisLabels: checked})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <ToggleRow
                              label={locale === "zh-CN" ? "显示 X 轴线" : "Show X Axis"}
                              checked={selectedWidget.showXAxisLine ?? (selectedWidget.type === "bar")}
                              onCheckedChange={(checked) => handleWidgetPatch({showXAxisLine: checked})}
                            />
                            <ToggleRow
                              label={locale === "zh-CN" ? "显示 Y 轴线" : "Show Y Axis"}
                              checked={selectedWidget.showYAxisLine ?? false}
                              onCheckedChange={(checked) => handleWidgetPatch({showYAxisLine: checked})}
                            />
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="order-50"
                          title={locale === "zh-CN" ? "图形细节" : "Series Detail"}
                          description={
                            locale === "zh-CN"
                              ? "只显示当前图表真正相关的图形细节，让面板保持聚焦。"
                              : "Only expose the chart-specific drawing details that matter to the current widget."
                          }
                        >
                          {(selectedWidget.type === "line" || selectedWidget.type === "area") ? (
                            <>
                              <ToggleRow
                                label={locale === "zh-CN" ? "平滑曲线" : "Smooth Curve"}
                                checked={selectedWidget.lineSmooth !== false}
                                onCheckedChange={(checked) => handleWidgetPatch({lineSmooth: checked})}
                              />
                              {selectedWidget.type === "line" ? (
                                <ToggleRow
                                  label={locale === "zh-CN" ? "显示折点" : "Show Series Points"}
                                  checked={selectedWidget.showSeriesPoints ?? true}
                                  onCheckedChange={(checked) => handleWidgetPatch({showSeriesPoints: checked})}
                                />
                              ) : null}
                              <EditorField label={locale === "zh-CN" ? "线条样式" : "Line Style"}>
                                <Select
                                  className={editorControlClass}
                                  value={selectedWidget.lineStyle ?? "solid"}
                                  onChange={(event) =>
                                    handleWidgetPatch({
                                      lineStyle: event.target.value as EditorWidget["lineStyle"],
                                    })
                                  }
                                  options={[
                                    {label: locale === "zh-CN" ? "实线" : "Solid", value: "solid"},
                                    {label: locale === "zh-CN" ? "虚线" : "Dashed", value: "dashed"},
                                  ]}
                                />
                              </EditorField>
                              {selectedWidget.type === "line" ? (
                                <div className="grid grid-cols-2 gap-2.5">
                                  <EditorField label={locale === "zh-CN" ? "线宽" : "Line Weight"}>
                                    <Input
                                      className={editorControlClass}
                                      value={String(selectedWidget.lineWeight ?? 3)}
                                      onChange={(event) =>
                                        handleWidgetPatch({
                                          lineWeight: clamp(numberOr(event.target.value, selectedWidget.lineWeight ?? 3), 1, 8),
                                        })
                                      }
                                    />
                                  </EditorField>
                                  <EditorField label={locale === "zh-CN" ? "折点大小" : "Point Size"}>
                                    <Input
                                      className={editorControlClass}
                                      value={String(selectedWidget.pointSize ?? 8)}
                                      onChange={(event) =>
                                        handleWidgetPatch({
                                          pointSize: clamp(numberOr(event.target.value, selectedWidget.pointSize ?? 8), 4, 18),
                                        })
                                      }
                                    />
                                  </EditorField>
                                </div>
                              ) : (
                                <EditorField label={locale === "zh-CN" ? "填充透明度" : "Area Opacity"}>
                                  <Input
                                    className={editorControlClass}
                                    value={`${selectedWidget.areaOpacity ?? 22}%`}
                                    onChange={(event) =>
                                      handleWidgetPatch({
                                        areaOpacity: clamp(
                                          numberOr(event.target.value.replace("%", ""), selectedWidget.areaOpacity ?? 22),
                                          8,
                                          72,
                                        ),
                                      })
                                    }
                                  />
                                </EditorField>
                              )}
                            </>
                          ) : null}
                          {selectedWidget.type === "bar" ? (
                            <EditorField label={locale === "zh-CN" ? "柱形圆角" : "Bar Radius"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.barRadius ?? 4)}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    barRadius: clamp(numberOr(event.target.value, selectedWidget.barRadius ?? 4), 0, 16),
                                  })
                                }
                              />
                            </EditorField>
                          ) : null}
                          {selectedWidget.type === "pie" ? (
                            <EditorField label={locale === "zh-CN" ? "内环比例" : "Inner Radius"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.pieInnerRadius ?? 58}%`}
                                onChange={(event) =>
                                  handleWidgetPatch({
                                    pieInnerRadius: clamp(
                                      numberOr(event.target.value.replace("%", ""), selectedWidget.pieInnerRadius ?? 58),
                                      20,
                                      78,
                                    ),
                                  })
                                }
                              />
                            </EditorField>
                          ) : null}
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          className="order-60"
                          title={locale === "zh-CN" ? "容器" : "Container"}
                          description={
                            locale === "zh-CN"
                              ? "控制图表卡片本身的层次、边框、阴影和发光，不影响数据表达。"
                              : "Control the chart card itself: surface, border, shadow and glow without touching the data."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "图内底色" : "Inner Surface"}>
                              <ColorSwatchField
                                value={selectedWidget.fill ?? "#f6f3e8"}
                                onChange={(nextValue) => handleWidgetPatch({fill: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "点缀高光" : "Accent Tint"}>
                              <ColorSwatchField
                                value={selectedWidget.chartSurfaceAccentColor ?? "#c7dfcb"}
                                onChange={(nextValue) => handleWidgetPatch({chartSurfaceAccentColor: nextValue})}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "边框颜色" : "Border Color"}>
                              <ColorSwatchField
                                value={selectedWidget.chartBorderColor ?? "#c7d4c8"}
                                onChange={(nextValue) => handleWidgetPatch({chartBorderColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "边框宽度" : "Border Width"}>
                              <Input
                                className={editorControlClass}
                                value={String(selectedWidget.chartBorderWidth ?? 1)}
                                onChange={(event) => handleWidgetPatch({chartBorderWidth: clamp(numberOr(event.target.value, selectedWidget.chartBorderWidth ?? 1), 0, 8)})}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "阴影颜色" : "Shadow Color"}>
                              <ColorSwatchField
                                value={selectedWidget.chartShadowColor ?? "#1a1c19"}
                                onChange={(nextValue) => handleWidgetPatch({chartShadowColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "阴影强度" : "Shadow Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartShadowOpacity ?? 12}%`}
                                onChange={(event) => handleWidgetPatch({chartShadowOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.chartShadowOpacity ?? 12), 0, 100)})}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "光晕颜色" : "Glow Color"}>
                              <ColorSwatchField
                                value={selectedWidget.chartGlowColor ?? (selectedWidget.accent ?? "#23422a")}
                                onChange={(nextValue) => handleWidgetPatch({chartGlowColor: nextValue})}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "光晕强度" : "Glow Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${selectedWidget.chartGlowOpacity ?? 0}%`}
                                onChange={(event) => handleWidgetPatch({chartGlowOpacity: clamp(numberOr(event.target.value.replace("%", ""), selectedWidget.chartGlowOpacity ?? 0), 0, 100)})}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                      </div>
                    </EditorSection>
                  ) : null}

                  {componentPanelTab === "style" && selectedWidget.type === "map" ? (
                    <EditorSection title={t("rightPanel.map.title")}>
                      <div className="space-y-3">
                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "底图" : "Base Map"}
                          description={
                            locale === "zh-CN"
                              ? "先定海洋、陆地和边界层，让地图底座稳定下来。"
                              : "Set the ocean, land and border layer first so the map has a stable foundation."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "地图质感" : "Surface Tone"}>
                              <Select
                                className={editorControlClass}
                                value={mapSurfaceTone}
                                onChange={(event) => setMapSurfaceTone(event.target.value as "soft" | "contrast")}
                                options={[
                                  {label: locale === "zh-CN" ? "柔和" : "Soft", value: "soft"},
                                  {label: locale === "zh-CN" ? "对比" : "Contrast", value: "contrast"},
                                ]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "地表透明度" : "Land Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${mapLandOpacity}%`}
                                onChange={(event) => setMapLandOpacity(clamp(numberOr(event.target.value.replace("%", ""), mapLandOpacity), 20, 100))}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "海洋底色" : "Ocean Color"}>
                              <ColorSwatchField
                                value={mapOceanColor}
                                onChange={setMapOceanColor}
                                swatches={["#0f1915", "#10231d", "#0e2430", "#201a14", "#162119", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "边界线颜色" : "Border Color"}>
                              <ColorSwatchField
                                value={mapBorderColor}
                                onChange={setMapBorderColor}
                                swatches={["#4e7459", "#6c8f78", "#7f9d89", "#5d768a", "#c7e0cc", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "地表起始色" : "Land Start"}>
                              <ColorSwatchField
                                value={mapLandStartColor}
                                onChange={setMapLandStartColor}
                                swatches={["#23422a", "#284a32", "#31503a", "#34503b", "#5c845f", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "地表结束色" : "Land End"}>
                              <ColorSwatchField
                                value={mapLandEndColor}
                                onChange={setMapLandEndColor}
                                swatches={["#1b3423", "#20302a", "#243b2c", "#314536", "#5c745d", "#dff3e2"]}
                              />
                            </EditorField>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "主轴颜色" : "Axis Color"}>
                              <ColorSwatchField
                                value={mapAxisColor}
                                onChange={setMapAxisColor}
                                swatches={["#6f8575", "#8ea093", "#bcd0c3", "#6e8897", "#d8e5dc", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "副轴颜色" : "Secondary Axis"}>
                              <ColorSwatchField
                                value={mapAxisSecondaryColor}
                                onChange={setMapAxisSecondaryColor}
                                swatches={["#486050", "#5c745d", "#7e8d80", "#4f6472", "#c7d8cb", "#ffffff"]}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "点位" : "Markers"}
                          description={
                            locale === "zh-CN"
                              ? "控制 marker 的颜色、halo 和尺寸，让热点读起来更清楚。"
                              : "Control marker color, halo and scale so hotspots read clearly."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "标记点颜色" : "Marker Color"}>
                              <ColorSwatchField
                                value={mapMarkerColor}
                                onChange={setMapMarkerColor}
                                swatches={["#dfffe7", "#ffffff", "#ffe9d4", "#d6edff", "#bde7c7", "#8ef0ae"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标记 Halo" : "Marker Halo"}>
                              <ColorSwatchField
                                value={mapMarkerHaloColor}
                                onChange={setMapMarkerHaloColor}
                                swatches={["#9ae9ae", "#dfffe7", "#ffffff", "#bde7c7", "#d6edff", "#ffe9d4"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标记辉光色" : "Marker Glow"}>
                              <ColorSwatchField
                                value={mapMarkerGlowColor}
                                onChange={setMapMarkerGlowColor}
                                swatches={["#8ef0ae", "#bde7c7", "#9ae9ae", "#8ecbff", "#ffd08e", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "点位大小" : "Marker Scale"}>
                              <Input
                                className={editorControlClass}
                                value={`${mapPointScale}%`}
                                onChange={(event) => setMapPointScale(clamp(numberOr(event.target.value.replace("%", ""), mapPointScale), 40, 220))}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "路线" : "Routes"}
                          description={
                            locale === "zh-CN"
                              ? "控制路线的密度、样式和亮度，先保证方向感，再调视觉冲击力。"
                              : "Tune route density, style and emphasis so the flow reads before it dazzles."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
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
                            <EditorField label={locale === "zh-CN" ? "路线颜色" : "Route Color"}>
                              <ColorSwatchField
                                value={mapRouteColor}
                                onChange={setMapRouteColor}
                                swatches={["#bde7c7", "#dfffe7", "#c6e7ff", "#ffd9b3", "#f6f6ef", "#8ef0ae"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "路线辉光色" : "Route Glow"}>
                              <ColorSwatchField
                                value={mapRouteGlowColor}
                                onChange={setMapRouteGlowColor}
                                swatches={["#8ef0ae", "#bde7c7", "#8ecbff", "#ffd08e", "#ffffff", "#5cf1b8"]}
                              />
                            </EditorField>
                          </div>
                          <EditorField label={locale === "zh-CN" ? "路线粗细" : "Route Width"}>
                            <Input
                              className={editorControlClass}
                              value={`${mapRouteWidth}%`}
                              onChange={(event) => setMapRouteWidth(clamp(numberOr(event.target.value.replace("%", ""), mapRouteWidth), 40, 220))}
                            />
                          </EditorField>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "标签" : "Labels"}
                          description={
                            locale === "zh-CN"
                              ? "控制地名和提示标签的显隐与文字风格。"
                              : "Control visibility and text styling for place labels and on-map notes."
                          }
                        >
                          <ToggleRow label={t("rightPanel.map.showLabels")} checked={mapLabels} onCheckedChange={setMapLabels} />
                          <div className="grid grid-cols-2 gap-2.5">
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
                            <EditorField label={locale === "zh-CN" ? "标签透明度" : "Label Opacity"}>
                              <Input
                                className={editorControlClass}
                                value={`${mapLabelOpacity}%`}
                                onChange={(event) => setMapLabelOpacity(clamp(numberOr(event.target.value.replace("%", ""), mapLabelOpacity), 20, 100))}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "标签文字色" : "Label Color"}>
                              <ColorSwatchField
                                value={mapLabelColor}
                                onChange={setMapLabelColor}
                                swatches={["#f5fff7", "#ffffff", "#dfffe7", "#d8f4ff", "#ffe7d2", "#20302a"]}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "热力" : "Heat"}
                          description={
                            locale === "zh-CN"
                              ? "把强弱层次先定出来，热力表达才不会只有一片亮色。"
                              : "Set the low and high ends first so heat intensity reads as a real scale."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "热力低值色" : "Heat Low"}>
                              <ColorSwatchField
                                value={mapHeatLowColor}
                                onChange={setMapHeatLowColor}
                                swatches={["#4d8f67", "#5ca37a", "#5d84a3", "#c99a4b", "#8f8f7a", "#ffffff"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "热力高值色" : "Heat High"}>
                              <ColorSwatchField
                                value={mapHeatHighColor}
                                onChange={setMapHeatHighColor}
                                swatches={["#bde7c7", "#dfffe7", "#bde2ff", "#ffd9a6", "#f6f6ef", "#8ef0ae"]}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>

                        <ChartConfigGroup
                          title={locale === "zh-CN" ? "容器" : "Container"}
                          description={
                            locale === "zh-CN"
                              ? "这里先放当前地图卡片已有的容器级参数，后面再补更完整的边框和阴影。"
                              : "Keep the current card-level controls here, with room for fuller border and shadow options later."
                          }
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <EditorField label={locale === "zh-CN" ? "面板文字色" : "Panel Text"}>
                              <ColorSwatchField
                                value={mapPanelTextColor}
                                onChange={setMapPanelTextColor}
                                swatches={["#243129", "#20302a", "#31503a", "#4c5f56", "#ffffff", "#dfffe7"]}
                              />
                            </EditorField>
                            <EditorField label={locale === "zh-CN" ? "辉光强度" : "Glow Intensity"}>
                              <Input
                                className={editorControlClass}
                                value={`${mapGlow}%`}
                                onChange={(event) => setMapGlow(clamp(numberOr(event.target.value.replace("%", ""), mapGlow), 0, 100))}
                              />
                            </EditorField>
                          </div>
                        </ChartConfigGroup>
                      </div>
                    </EditorSection>
                  ) : null}

                    </>
                  ) : null}
                </div>
              </div>
        </aside>
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

function MiniActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2 py-1.5 text-[11px] font-medium text-[#23422a] transition-colors hover:bg-[#eef2ea] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#fafaf5]"
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

function ContextMenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
        danger
          ? "text-[#ba1a1a] hover:bg-[#fdebea]"
          : "text-[#1a1c19] hover:bg-[#eef2ea]"
      }`}
    >
      {label}
    </button>
  );
}

function WidgetCanvasItem({
  widget,
  canvasWidth,
  canvasHeight,
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
  mapPointScale,
  mapRouteWidth,
  mapLandOpacity,
  mapLabelOpacity,
  mapOceanColor,
  mapLandStartColor,
  mapLandEndColor,
  mapBorderColor,
  mapAxisColor,
  mapAxisSecondaryColor,
  mapRouteColor,
  mapRouteGlowColor,
  mapMarkerColor,
  mapMarkerHaloColor,
  mapMarkerGlowColor,
  mapLabelColor,
  mapPanelTextColor,
  mapHeatLowColor,
  mapHeatHighColor,
  dataset,
  onDragStart,
  onContextMenu,
  onResizeStart,
}: {
  widget: EditorWidget;
  canvasWidth: number;
  canvasHeight: number;
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
  mapPointScale: number;
  mapRouteWidth: number;
  mapLandOpacity: number;
  mapLabelOpacity: number;
  mapOceanColor: string;
  mapLandStartColor: string;
  mapLandEndColor: string;
  mapBorderColor: string;
  mapAxisColor: string;
  mapAxisSecondaryColor: string;
  mapRouteColor: string;
  mapRouteGlowColor: string;
  mapMarkerColor: string;
  mapMarkerHaloColor: string;
  mapMarkerGlowColor: string;
  mapLabelColor: string;
  mapPanelTextColor: string;
  mapHeatLowColor: string;
  mapHeatHighColor: string;
  dataset?: {fields: DatasetPanelItem["fields"]; rows: DatasetRow[]};
  onDragStart: (widgetId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onContextMenu: (widgetId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onResizeStart: (
    widgetId: string,
    direction: ResizeDirection,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  return (
    <div className="absolute" style={editorWidgetPlacementWithin(widget, canvasWidth, canvasHeight)}>
      <button
        onPointerDown={(event) => onDragStart(widget.id, event)}
        onContextMenu={(event) => onContextMenu(widget.id, event)}
        className="relative block h-full w-full text-left"
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
          mapRouteStyle={mapRouteStyle}
          mapLabelStyle={mapLabelStyle}
          mapSurfaceTone={mapSurfaceTone}
          mapPointScale={mapPointScale}
          mapRouteWidth={mapRouteWidth}
          mapLandOpacity={mapLandOpacity}
          mapLabelOpacity={mapLabelOpacity}
          mapOceanColor={mapOceanColor}
          mapLandStartColor={mapLandStartColor}
          mapLandEndColor={mapLandEndColor}
          mapBorderColor={mapBorderColor}
          mapAxisColor={mapAxisColor}
          mapAxisSecondaryColor={mapAxisSecondaryColor}
          mapRouteColor={mapRouteColor}
          mapRouteGlowColor={mapRouteGlowColor}
          mapMarkerColor={mapMarkerColor}
          mapMarkerHaloColor={mapMarkerHaloColor}
          mapMarkerGlowColor={mapMarkerGlowColor}
          mapLabelColor={mapLabelColor}
          mapPanelTextColor={mapPanelTextColor}
          mapHeatLowColor={mapHeatLowColor}
          mapHeatHighColor={mapHeatHighColor}
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
  if (name.includes("Decoration")) return <Layers3 className={className} strokeWidth={2} />;
  if (name.includes("Flip")) return <LayoutGrid className={className} strokeWidth={2} />;
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
  if (name.includes("Decoration")) return "decoration";
  if (name.includes("Flip")) return "numberFlip";
  if (name.includes("Image")) return "image";
  if (name.includes("Text")) return "text";
  return "metric";
}

function railTitle(tab: RailTab, t: ReturnType<typeof useTranslations>, locale: string) {
  if (tab === "components") return t("leftPanel.title");
  if (tab === "layers") return t("rightPanel.layers.title");
  if (tab === "data") return locale === "zh-CN" ? "\u6570\u636e\u6e90" : "Datasets";
  if (locale === "zh-CN") return "\u6a21\u677f\u9884\u8bbe";
  return "Template Presets";
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
  const zhExtended = {
    ...zh,
    numberFlip: "鏁板瓧缈荤墝",
    decoration: "瑁呴グ缁勪欢",
  };
  zhExtended.numberFlip = "\u6570\u5b57\u7ffb\u724c";
  zhExtended.decoration = "\u88c5\u9970\u7ec4\u4ef6";
  const zhNormalized = {
    ...zhExtended,
    metric: "\u6307\u6807\u5361",
    line: "\u6298\u7ebf\u56fe",
    area: "\u9762\u79ef\u56fe",
    pie: "\u73af\u5f62\u56fe",
    map: "\u5730\u56fe\u7ec4\u4ef6",
    bar: "\u67f1\u72b6\u56fe",
    events: "\u4e8b\u4ef6\u5217\u8868",
    table: "\u6570\u636e\u8868\u683c",
    rank: "\u6392\u884c\u7ec4\u4ef6",
    text: "\u6587\u672c\u8bf4\u660e",
    image: "\u56fe\u7247\u7ec4\u4ef6",
    numberFlip: "\u6570\u5b57\u7ffb\u724c",
    decoration: "\u88c5\u9970\u7ec4\u4ef6",
  };
  const enExtended = {
    ...en,
    numberFlip: "Number Flip",
    decoration: "Decoration",
  };
  return locale === "zh-CN" ? zhNormalized[type] : enExtended[type];
}

function defaultManualDataTemplate(type: EditorWidget["type"]) {
  if (type === "metric" || type === "numberFlip") {
    return JSON.stringify(
      {
        value: 1280,
        hint: "较上周 +12%",
      },
      null,
      2,
    );
  }

  if (type === "table") {
    return JSON.stringify(
      [
        {region: "华东", sales: 820, status: "正常", eta: "12:45"},
        {region: "华南", sales: 760, status: "预警", eta: "13:10"},
        {region: "华北", sales: 690, status: "处理中", eta: "13:30"},
      ],
      null,
      2,
    );
  }

  if (type === "events") {
    return JSON.stringify(
      [
        {title: "深圳仓入库延迟", meta: "14:22 · 仓储"},
        {title: "华东线路流量回升", meta: "14:35 · 运输"},
        {title: "北方区域库存补齐", meta: "14:48 · 运营"},
      ],
      null,
      2,
    );
  }

  if (type === "map") {
    return JSON.stringify(
      [
        {region: "Shanghai", value: 92},
        {region: "Singapore", value: 88},
        {region: "Rotterdam", value: 74},
      ],
      null,
      2,
    );
  }

  if (type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank") {
    return JSON.stringify(
      [
        {label: "Jan", value: 120},
        {label: "Feb", value: 138},
        {label: "Mar", value: 156},
      ],
      null,
      2,
    );
  }

  return JSON.stringify([], null, 2);
}

function manualDataPlaceholderHint(type: EditorWidget["type"], locale: string) {
  if (type === "metric" || type === "numberFlip") {
    return locale === "zh-CN"
      ? "对象格式，例如 {\"value\":1280,\"hint\":\"较上周 +12%\"}"
      : "Use an object, for example {\"value\":1280,\"hint\":\"+12% vs last week\"}";
  }

  if (type === "table" || type === "events" || type === "map") {
    return locale === "zh-CN"
      ? "对象数组格式，例如 [{\"region\":\"华东\",\"sales\":820}]"
      : "Use an array of objects, for example [{\"region\":\"East\",\"sales\":820}]";
  }

  return locale === "zh-CN"
    ? "数组格式，例如 [{\"label\":\"Jan\",\"value\":120}]"
    : "Use an array, for example [{\"label\":\"Jan\",\"value\":120}]";
}

function manualDataSuccessSummary(
  type: EditorWidget["type"],
  state: Exclude<ReturnType<typeof parseManualWidgetData>, null>,
  locale: string,
) {
  if (!state.valid) return state.error;

  if ((type === "metric" || type === "numberFlip") && state.metric) {
    return locale === "zh-CN"
      ? `已识别 1 条指标数据，当前值为 ${state.metric.value}`
      : `1 metric record detected. Current value: ${state.metric.value}`;
  }

  if (state.series?.length) {
    return locale === "zh-CN"
      ? `已识别 ${state.series.length} 条图表数据，将直接驱动当前组件渲染`
      : `${state.series.length} chart records detected and ready for rendering.`;
  }

  if (state.rows?.length) {
    return locale === "zh-CN"
      ? `已识别 ${state.rows.length} 行数据`
      : `${state.rows.length} rows detected.`;
  }

  return locale === "zh-CN" ? "JSON 数据可用" : "JSON data is ready.";
}

function ChartConfigGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 rounded-xl border border-[#d7d8d1] bg-[#fcfcf8] px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.55)] ${className ?? ""}`}>
      <div>
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        {description ? <p className="mt-1 text-[11px] leading-5 text-[#727971]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function defaultChartPaletteColors(palette: NonNullable<EditorWidget["chartPalette"]>, accent: string) {
  if (palette === "ocean") return [accent || "#2b6cb0", "#4c8eda", "#90cdf4", "#d7efff", "#1f4c7a"];
  if (palette === "sunset") return [accent || "#c96b32", "#e59b5a", "#f7c289", "#f3dfc4", "#8c4a1d"];
  if (palette === "mono") return [accent || "#34503b", "#5e7866", "#8da190", "#c7d0c9", "#e7ece8"];
  return [accent || "#215637", "#406840", "#7da785", "#c7dfcb", "#23422a"];
}

function normalizeChartPaletteColors(
  colors: string[] | undefined,
  palette: NonNullable<EditorWidget["chartPalette"]>,
  accent: string,
) {
  const fallback = defaultChartPaletteColors(palette, accent);
  const next = [...fallback];

  (colors ?? []).slice(0, 5).forEach((color, index) => {
    if (color) next[index] = color;
  });

  return next;
}

function ColorSwatchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextColor: string) => void;
  swatches?: string[];
}) {
  const parsedColor = parseColorInput(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={parsedColor.hex}
          onChange={(event) => onChange(composeColorValue(event.target.value, parsedColor.alpha))}
          className="h-9 w-11 cursor-pointer rounded-md border border-[#d7d8d1] bg-[#fafaf5] p-1"
        />
        <Input
          className={`${editorControlClass} w-20 shrink-0`}
          value={`${parsedColor.alpha}%`}
          onChange={(event) =>
            onChange(
              composeColorValue(
                parsedColor.hex,
                clamp(numberOr(event.target.value.replace("%", ""), parsedColor.alpha), 0, 100),
              ),
            )
          }
        />
        <Input
          className={editorControlClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function normalizeColorValue(value: string) {
  return parseColorInput(value).hex;
}

function parseColorInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {hex: "#23422a", alpha: 100};
  }

  if (trimmed.toLowerCase() === "transparent") {
    return {hex: "#23422a", alpha: 0};
  }

  const shortHex = /^#([0-9a-fA-F]{3})$/i.exec(trimmed);
  if (shortHex) {
    const expanded = `#${shortHex[1]
      .split("")
      .map((token) => `${token}${token}`)
      .join("")}`;
    return {hex: expanded.toLowerCase(), alpha: 100};
  }

  const hex = /^#([0-9a-fA-F]{6})$/i.exec(trimmed);
  if (hex) {
    return {hex: trimmed.toLowerCase(), alpha: 100};
  }

  const shortHexAlpha = /^#([0-9a-fA-F]{4})$/i.exec(trimmed);
  if (shortHexAlpha) {
    const expanded = shortHexAlpha[1]
      .split("")
      .map((token) => `${token}${token}`)
      .join("");
    return {
      hex: `#${expanded.slice(0, 6).toLowerCase()}`,
      alpha: Math.round((Number.parseInt(expanded.slice(6, 8), 16) / 255) * 100),
    };
  }

  const hexAlpha = /^#([0-9a-fA-F]{8})$/i.exec(trimmed);
  if (hexAlpha) {
    return {
      hex: `#${hexAlpha[1].slice(0, 6).toLowerCase()}`,
      alpha: Math.round((Number.parseInt(hexAlpha[1].slice(6, 8), 16) / 255) * 100),
    };
  }

  const rgba = /^rgba?\((.+)\)$/i.exec(trimmed);
  if (rgba) {
    const parts = rgba[1].split(",").map((part) => part.trim());
    if (parts.length >= 3) {
      const r = clamp(numberOr(parts[0], 35), 0, 255);
      const g = clamp(numberOr(parts[1], 66), 0, 255);
      const b = clamp(numberOr(parts[2], 42), 0, 255);
      const alpha =
        parts.length >= 4 ? clamp(Math.round(numberOr(parts[3], 1) * 100), 0, 100) : 100;
      return {
        hex: rgbToHex(r, g, b),
        alpha,
      };
    }
  }

  return {hex: "#23422a", alpha: 100};
}

function composeColorValue(hex: string, alpha: number) {
  const normalizedHex = normalizeColorValue(hex);
  const nextAlpha = clamp(alpha, 0, 100);
  if (nextAlpha <= 0) return "transparent";
  if (nextAlpha >= 100) return normalizedHex;
  const {r, g, b} = hexToRgb(normalizedHex);
  return `rgba(${r}, ${g}, ${b}, ${Number((nextAlpha / 100).toFixed(2))})`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeColorValue(hex).replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function ChartPaletteEditor({
  value,
  palette,
  accent,
  onChange,
}: {
  value?: string[];
  palette: NonNullable<EditorWidget["chartPalette"]>;
  accent: string;
  onChange: (nextColors: string[]) => void;
}) {
  const colors = normalizeChartPaletteColors(value, palette, accent);
  const labels = ["主色", "辅助 1", "辅助 2", "浅色", "深色"];
  const swatches = ["#23422a", "#2f6d48", "#2b6cb0", "#c96b32", "#7a4dd8", "#ba1a1a", "#f4e7ba", "#20302a"];

  return (
    <div className="space-y-3">
      {colors.map((color, index) => (
        <div key={`${labels[index]}-${index}`} className="space-y-1.5">
          <div className="text-[11px] font-medium text-[#45664b]">{labels[index]}</div>
          <ColorSwatchField
            value={color}
            onChange={(nextColor) => {
              const nextColors = [...colors];
              nextColors[index] = nextColor;
              onChange(nextColors);
            }}
            swatches={swatches}
          />
        </div>
      ))}
    </div>
  );
}

function ManualDataPreviewCard({
  locale,
  widgetType,
  state,
  widget,
}: {
  locale: string;
  widgetType: EditorWidget["type"];
  state: Exclude<ManualWidgetDataParseResult, null>;
  widget: EditorWidget;
}) {
  if (!state.valid) return null;

  const title = locale === "zh-CN" ? "实际渲染预览" : "Rendered Preview";
  const subtitle =
    locale === "zh-CN"
      ? "这里展示这段 JSON 最终会驱动出的内容结构。"
      : "This preview shows what the widget will actually render from the JSON above.";

  if ((widgetType === "metric" || widgetType === "numberFlip") && state.metric) {
    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 rounded-lg border border-[#cfe0cf] bg-[#eef5ec] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[#727971]">{widget.title}</div>
          <div className="mt-2 text-[24px] font-black text-[#23422a]">{`${widget.valuePrefix ?? ""}${state.metric.value}${widget.valueSuffix ?? ""}`}</div>
          {state.metric.hint ? <div className="mt-1 text-[11px] font-medium text-[#45664b]">{state.metric.hint}</div> : null}
        </div>
      </div>
    );
  }

  if (state.series?.length) {
    const series = processSeriesSnapshot(state.series, widget);
    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 space-y-2">
          {series.slice(0, 5).map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
              <span className="truncate text-[12px] font-medium text-[#1a1c19]">{item.label}</span>
              <span className="font-mono text-[12px] text-[#45664b]">{formatPreviewSeriesValue(widget, item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state.rows?.length) {
    const isEventLike = widgetType === "events";
    const isMapLike = widgetType === "map";
    const eventRows = isEventLike
      ? processEventSnapshotRows(eventSnapshotFromRows(state.rows, widget.fieldMap), widget).slice(0, 4)
      : [];
    const mapPreview = isMapLike
      ? processMapSnapshotData(
          mapSnapshot(
            {
              fields: inferFieldsFromRows(state.rows),
              rows: state.rows,
            },
            widget.fieldMap,
          ),
          widget,
        )
      : null;
    const tablePreview = !isEventLike && !isMapLike
      ? processTableSnapshotData(
          tableSnapshotFromRows(state.rows, {
            columns: widget.tableColumns,
            labels: widget.tableColumnLabels,
            widths: widget.tableColumnWidths,
          }),
          widget,
        )
      : null;

    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        {isEventLike ? (
          <div className="mt-3 space-y-2">
            {eventRows.map((row, index) => (
              <div key={`${row.title}-${index}`} className="rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
                <div className="text-[12px] font-medium text-[#1a1c19]">{row.title}</div>
                {row.meta ? <div className="mt-1 text-[11px] text-[#727971]">{row.meta}</div> : null}
              </div>
            ))}
          </div>
        ) : mapPreview ? (
          <div className="mt-3 space-y-2">
            {mapPreview.points.slice(0, 4).map((point) => (
              <div key={point.id} className="flex items-center justify-between rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-[#1a1c19]">{point.label}</div>
                  <div className="mt-1 text-[11px] text-[#727971]">{`${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}`}</div>
                </div>
                <div className="font-mono text-[12px] text-[#45664b]">{point.value}</div>
              </div>
            ))}
          </div>
        ) : tablePreview ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#dde2d7] bg-white/80">
            <div className="grid bg-[#eef0e8] text-[10px] uppercase tracking-[0.14em] text-[#727971]" style={{gridTemplateColumns: `repeat(${Math.max(1, tablePreview.columns.length)}, minmax(0, 1fr))`}}>
              {tablePreview.columns.slice(0, 4).map((column) => (
                <div key={column.key} className="px-3 py-2">{column.label}</div>
              ))}
            </div>
            <div className="divide-y divide-[#ecefe7]">
              {tablePreview.rows.slice(0, 3).map((row, rowIndex) => (
                <div key={rowIndex} className="grid text-[12px] text-[#1a1c19]" style={{gridTemplateColumns: `repeat(${Math.max(1, tablePreview.columns.length)}, minmax(0, 1fr))`}}>
                  {tablePreview.columns.slice(0, 4).map((column) => (
                    <div key={column.key} className="truncate px-3 py-2.5">
                      {formatPreviewTableCellValue(row[column.key], widget.tableNumberFormat ?? "raw")}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function BoundDatasetPreviewCard({
  locale,
  widget,
  dataset,
}: {
  locale: string;
  widget: EditorWidget;
  dataset?: WidgetDataset;
}) {
  const title = locale === "zh-CN" ? "绑定数据预览" : "Bound Data Preview";
  const subtitle =
    locale === "zh-CN"
      ? "这里展示当前数据集绑定最终会驱动出的内容结果。"
      : "This preview shows what the current dataset binding will actually drive.";

  if (!dataset?.rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-[12px] text-[#727971]">
        {locale === "zh-CN" ? "当前数据集还没有可预览的行数据。" : "The current dataset does not have previewable rows yet."}
      </div>
    );
  }

  if (widget.type === "metric" || widget.type === "numberFlip") {
    const data = metricSnapshot(dataset, widget.fieldMap);
    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 rounded-lg border border-[#cfe0cf] bg-[#eef5ec] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[#727971]">{widget.title}</div>
          <div className="mt-2 text-[24px] font-black text-[#23422a]">{`${widget.valuePrefix ?? ""}${data.value}${widget.valueSuffix ?? ""}`}</div>
          {data.hint ? <div className="mt-1 text-[11px] font-medium text-[#45664b]">{data.hint}</div> : null}
        </div>
      </div>
    );
  }

  if (widget.type === "line" || widget.type === "area" || widget.type === "bar" || widget.type === "pie" || widget.type === "rank") {
    const rawSeries =
      widget.type === "line" || widget.type === "area"
        ? lineSeries(dataset, widget.fieldMap)
        : categoricalSeries(dataset, widget.fieldMap);
    const series = processSeriesSnapshot(rawSeries, widget);

    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 space-y-2">
          {series.slice(0, 5).map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
              <span className="truncate text-[12px] font-medium text-[#1a1c19]">{item.label}</span>
              <span className="font-mono text-[12px] text-[#45664b]">{formatPreviewSeriesValue(widget, item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === "events") {
    const rows = processEventSnapshotRows(eventSnapshot(dataset, widget.fieldMap), widget).slice(0, 4);
    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 space-y-2">
          {rows.map((row, index) => (
            <div key={`${row.title}-${index}`} className="rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
              <div className="text-[12px] font-medium text-[#1a1c19]">{row.title}</div>
              {row.meta ? <div className="mt-1 text-[11px] text-[#727971]">{row.meta}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === "table") {
    const snapshot = processTableSnapshotData(
      tableSnapshot(dataset, {
        columns: widget.tableColumns,
        labels: widget.tableColumnLabels,
        widths: widget.tableColumnWidths,
      }),
      widget,
    );

    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-[#dde2d7] bg-white/80">
          <div className="grid bg-[#eef0e8] text-[10px] uppercase tracking-[0.14em] text-[#727971]" style={{gridTemplateColumns: `repeat(${Math.max(1, snapshot.columns.length)}, minmax(0, 1fr))`}}>
            {snapshot.columns.slice(0, 4).map((column) => (
              <div key={column.key} className="px-3 py-2">{column.label}</div>
            ))}
          </div>
          <div className="divide-y divide-[#ecefe7]">
            {snapshot.rows.slice(0, 3).map((row, rowIndex) => (
              <div key={rowIndex} className="grid text-[12px] text-[#1a1c19]" style={{gridTemplateColumns: `repeat(${Math.max(1, snapshot.columns.length)}, minmax(0, 1fr))`}}>
                {snapshot.columns.slice(0, 4).map((column) => (
                  <div key={column.key} className="truncate px-3 py-2.5">
                    {formatPreviewTableCellValue(row[column.key], widget.tableNumberFormat ?? "raw")}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (widget.type === "map") {
    const snapshot = processMapSnapshotData(mapSnapshot(dataset, widget.fieldMap), widget);
    return (
      <div className="rounded-xl border border-[#d7d8d1] bg-[#fafaf5] px-3 py-3">
        <div className="text-[12px] font-semibold text-[#1a1c19]">{title}</div>
        <p className="mt-1 text-[11px] leading-5 text-[#727971]">{subtitle}</p>
        <div className="mt-3 space-y-2">
          {snapshot.points.slice(0, 4).map((point) => (
            <div key={point.id} className="flex items-center justify-between rounded-lg border border-[#dde2d7] bg-white/70 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-[#1a1c19]">{point.label}</div>
                <div className="mt-1 text-[11px] text-[#727971]">{`${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}`}</div>
              </div>
              <div className="font-mono text-[12px] text-[#45664b]">{point.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function resolvePreviewChartLabelFormat(widget: Pick<EditorWidget, "type" | "chartLabelFormat">) {
  return widget.chartLabelFormat ?? (widget.type === "pie" ? "percent" : "raw");
}

function formatPreviewSeriesValue(
  widget: Pick<EditorWidget, "type" | "chartLabelFormat" | "chartDecimals" | "valuePrefix" | "valueSuffix">,
  value: number,
) {
  const format = resolvePreviewChartLabelFormat(widget);
  const decimals = widget.chartDecimals ?? 0;
  let rendered = "";

  if (format === "percent") {
    rendered = `${value.toFixed(decimals)}%`;
  } else if (format === "compact") {
    rendered = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals > 0 ? Math.min(decimals, 1) : 0,
    }).format(value);
  } else {
    rendered = new Intl.NumberFormat("en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return `${widget.valuePrefix ?? ""}${rendered}${widget.valueSuffix ?? ""}`;
}

function formatPreviewTableCellValue(value: string | number | undefined, format: EditorWidget["tableNumberFormat"]) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value !== "number") return String(value);

  if (format === "currency") {
    return new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY", maximumFractionDigits: 0}).format(value);
  }

  if (format === "percent") {
    const percentValue = Math.abs(value) <= 1 ? value * 100 : value;
    return `${percentValue.toFixed(percentValue % 1 === 0 ? 0 : 1)}%`;
  }

  if (format === "compact") {
    return new Intl.NumberFormat("en", {notation: "compact", maximumFractionDigits: 1}).format(value);
  }

  return new Intl.NumberFormat("en", {maximumFractionDigits: 2}).format(value);
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
  canvasWidth: number,
  canvasHeight: number,
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
      delta: Math.abs(right - canvasWidth),
      next: canvasWidth - movingWidget.width,
      guide: canvasWidth,
    },
    {
      delta: Math.abs(centerX - canvasWidth / 2),
      next: canvasWidth / 2 - movingWidget.width / 2,
      guide: canvasWidth / 2,
    },
  ];

  for (const option of baselineXOptions) {
    if (option.delta <= bestX) {
      bestX = option.delta;
      snappedX = clamp(Math.round(option.next), 0, Math.max(0, canvasWidth - movingWidget.width));
      vertical = option.guide;
    }
  }

  const baselineYOptions = [
    {delta: Math.abs(top - 0), next: 0, guide: 0},
    {
      delta: Math.abs(bottom - canvasHeight),
      next: canvasHeight - movingWidget.height,
      guide: canvasHeight,
    },
    {
      delta: Math.abs(centerY - canvasHeight / 2),
      next: canvasHeight / 2 - movingWidget.height / 2,
      guide: canvasHeight / 2,
    },
  ];

  for (const option of baselineYOptions) {
    if (option.delta <= bestY) {
      bestY = option.delta;
      snappedY = clamp(Math.round(option.next), 0, Math.max(0, canvasHeight - movingWidget.height));
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
        snappedX = clamp(Math.round(option.next), 0, Math.max(0, canvasWidth - movingWidget.width));
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
    x: clamp(snappedX, 0, Math.max(0, canvasWidth - movingWidget.width)),
    y: clamp(snappedY, 0, Math.max(0, canvasHeight - movingWidget.height)),
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
  canvasWidth: number,
  canvasHeight: number,
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
      delta: Math.abs(proposedRight - canvasWidth),
      next: canvasWidth - resizingWidget.x,
      guide: canvasWidth,
    },
    {
      delta: Math.abs(proposedRight - canvasWidth / 2),
      next: canvasWidth / 2 - resizingWidget.x,
      guide: canvasWidth / 2,
    },
  ];

  for (const option of baselineWidthOptions) {
    if (option.delta <= bestX) {
      bestX = option.delta;
      snappedWidth = clamp(Math.round(option.next), 120, Math.max(120, canvasWidth - resizingWidget.x));
      vertical = option.guide;
    }
  }

  const baselineHeightOptions = [
    {
      delta: Math.abs(proposedBottom - canvasHeight),
      next: canvasHeight - resizingWidget.y,
      guide: canvasHeight,
    },
    {
      delta: Math.abs(proposedBottom - canvasHeight / 2),
      next: canvasHeight / 2 - resizingWidget.y,
      guide: canvasHeight / 2,
    },
  ];

  for (const option of baselineHeightOptions) {
    if (option.delta <= bestY) {
      bestY = option.delta;
      snappedHeight = clamp(Math.round(option.next), 80, Math.max(80, canvasHeight - resizingWidget.y));
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
      snappedWidth = clamp(Math.round(candidateRight - resizingWidget.x), 120, Math.max(120, canvasWidth - resizingWidget.x));
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
    width: clamp(snappedWidth, 120, Math.max(120, canvasWidth - resizingWidget.x)),
    height: clamp(snappedHeight, 80, Math.max(80, canvasHeight - resizingWidget.y)),
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

  if (type === "metric" || type === "numberFlip") {
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

function buildDataProcessingFieldOptions(
  type: EditorWidget["type"],
  availableTableFields: Array<{field: string; type: string}>,
  locale: string,
) {
  if (type === "table") {
    return availableTableFields.map((field) => ({
      label: `${field.field} · ${field.type}`,
      value: field.field,
    }));
  }

  if (type === "events") {
    return [
      {label: locale === "zh-CN" ? "标题" : "Title", value: "title"},
      {label: locale === "zh-CN" ? "元信息" : "Meta", value: "meta"},
    ];
  }

  if (type === "map") {
    return [
      {label: locale === "zh-CN" ? "标签 / 区域" : "Label / Region", value: "label"},
      {label: locale === "zh-CN" ? "数值" : "Value", value: "value"},
    ];
  }

  if (type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank") {
    return [
      {label: locale === "zh-CN" ? "标签 / 类别" : "Label / Category", value: "label"},
      {label: locale === "zh-CN" ? "数值" : "Value", value: "value"},
    ];
  }

  return [];
}

function buildEventConditionFieldOptions(
  type: EditorWidget["type"],
  availableTableFields: Array<{field: string; type: string}>,
  locale: string,
) {
  if (type === "metric" || type === "numberFlip") {
    return [
      {label: locale === "zh-CN" ? "数值" : "Value", value: "value"},
      {label: locale === "zh-CN" ? "趋势文案" : "Hint", value: "hint"},
    ];
  }

  if (type === "events") {
    return [
      {label: locale === "zh-CN" ? "首条标题" : "First Title", value: "title"},
      {label: locale === "zh-CN" ? "首条副信息" : "First Meta", value: "meta"},
      {label: locale === "zh-CN" ? "事件数量" : "Event Count", value: "count"},
    ];
  }

  if (type === "table") {
    return [
      {label: locale === "zh-CN" ? "行数" : "Row Count", value: "rowCount"},
      ...availableTableFields.map((field) => ({
        label: `${field.field} / ${field.type}`,
        value: field.field,
      })),
    ];
  }

  if (type === "map") {
    return [
      {label: locale === "zh-CN" ? "首个区域" : "First Region", value: "label"},
      {label: locale === "zh-CN" ? "首个数值" : "First Value", value: "value"},
      {label: locale === "zh-CN" ? "点位数量" : "Point Count", value: "count"},
    ];
  }

  if (type === "line" || type === "area" || type === "bar" || type === "pie" || type === "rank") {
    return [
      {label: locale === "zh-CN" ? "首项标签" : "First Label", value: "label"},
      {label: locale === "zh-CN" ? "首项数值" : "First Value", value: "value"},
      {label: locale === "zh-CN" ? "序列数量" : "Series Count", value: "count"},
    ];
  }

  return [];
}

function normalizeDataSourceMode(mode?: EditorWidget["dataSourceMode"]) {
  if (mode === "manual" || mode === "request") return mode;
  return "static";
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
