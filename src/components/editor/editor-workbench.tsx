"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  Redo2,
  RotateCcw,
  Save,
  SendHorizontal,
  Upload,
} from "lucide-react";

import {
  CollapseSection,
  MonacoJsonEditor,
  NumberStepper,
  ToggleSwitch,
} from "@/components/editor-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDataPondToWidget,
  useEditorDataPondRuntime,
  type DataPondRuntimeRecord,
} from "@/lib/editor-v2-data-pond";
import {
  defaultEditorV2CanvasFilters,
  editorV2CanvasFilterPresets,
  resolveEditorV2CanvasFilterStyle,
  type EditorV2CanvasFilters,
} from "@/lib/editor-v2-canvas-filters";
import {
  defaultEditorV2DataPondSettings,
  readEditorV2Draft,
  saveEditorV2Draft,
  saveEditorV2PublishedSnapshot,
  type EditorV2CanvasState,
  type EditorV2Draft,
} from "@/lib/editor-v2-storage";
import {
  createEditorV2WorkspaceDocument,
  buildEditorV2WorkspaceFilename,
  buildEditorV2WorkspaceSummary,
  downloadEditorV2WorkspaceDocument,
  parseEditorV2WorkspaceDocument,
  type EditorV2WorkspaceSummary,
} from "@/lib/editor-v2-workspace";
import { readProjectRecord, upsertProjectRecord } from "@/lib/project-store";
import { registry } from "@/packages/registry";
import {
  ChartFrame,
  WidgetCategory,
  type DataSourceMode,
  type EditorDataPond,
  type GroupType,
  type RequestContentMode,
  type RequestMethod,
  type WidgetRequestConfig,
  type VChartWidget,
  type Widget,
  type WidgetAnimationPreset,
  type WidgetPackage,
  type WidgetPatch,
} from "@/packages/types";
import { useEditorStore } from "@/store/editor-store";

type PanelTab = "customize" | "animation" | "data" | "events";

type CanvasPreviewState = {
  filters: EditorV2CanvasFilters;
  width: number;
  height: number;
  zoom: number;
  showGrid: boolean;
  showSafeArea: boolean;
  snapToGrid: boolean;
};

type DropIndicator = {
  height: number;
  title: string;
  width: number;
  x: number;
  y: number;
};

type WidgetPosition = {
  x: number;
  y: number;
};

type ActiveWidgetDrag = {
  anchorId: string;
  maxBottom: number;
  maxRight: number;
  minLeft: number;
  minTop: number;
  originPositions: Record<string, WidgetPosition>;
  startClientX: number;
  startClientY: number;
  widgetIds: string[];
};

type SelectOption = {
  label: string;
  value: string;
};

type WidgetDataSummary = {
  fields: string[];
  rowCount: number;
};

type WidgetDatasetState = {
  datasetIndex: number;
  fields: string[];
  rowCount: number;
  rows: Array<Record<string, unknown>>;
  values: unknown;
};

type FieldMappingOptions = {
  allFields: SelectOption[];
  categoryFields: SelectOption[];
  numericFields: SelectOption[];
};

type JsonEditorState = {
  error: string | null;
  isArrayValue: boolean;
  value: string;
};

type SaveState = "idle" | "dirty" | "saved" | "published";

type WorkspaceTransferState = {
  at: string;
  detail: string;
  kind: "import" | "export";
  message: string;
  status: "error" | "success";
  summary: EditorV2WorkspaceSummary | null;
};

const WIDGET_DRAG_MIME = "application/x-jaminview-widget";
const DEFAULT_CANVAS_PREVIEW: CanvasPreviewState = {
  filters: defaultEditorV2CanvasFilters,
  width: 1920,
  height: 1080,
  zoom: 35,
  showGrid: true,
  showSafeArea: true,
  snapToGrid: true,
};

const panelTabs: Array<{ key: PanelTab; label: string }> = [
  { key: "customize", label: "定制" },
  { key: "animation", label: "动画" },
  { key: "data", label: "数据" },
  { key: "events", label: "事件" },
];

const categoryLabels: Record<WidgetCategory, string> = {
  [WidgetCategory.CHARTS]: "图表组件",
  [WidgetCategory.MAPS]: "地图组件",
  [WidgetCategory.TABLES]: "表格组件",
  [WidgetCategory.MEDIA]: "媒体组件",
  [WidgetCategory.DECORATES]: "装饰组件",
  [WidgetCategory.INFO]: "信息组件",
};

const animationOptions: Array<{
  description: string;
  label: string;
  value: WidgetAnimationPreset;
}> = [
  { label: "淡入", value: "fadeIn", description: "适合大多数图表的柔和入场效果。" },
  { label: "上浮", value: "riseIn", description: "从底部轻推进入，适合卡片式组件。" },
  { label: "缩放", value: "zoomIn", description: "聚焦型入场，适合指标和重点组件。" },
  { label: "脉冲", value: "pulse", description: "轻微强调循环，用于重点组件常驻提示。" },
  { label: "漂浮", value: "float", description: "缓慢上下浮动，适合悬浮信息块。" },
  { label: "呼吸", value: "breathe", description: "更克制的循环强调，适合常驻图表。" },
];

const dataModeOptions: SelectOption[] = [
  { label: "静态数据", value: "static" },
  { label: "动态请求", value: "request" },
];

const requestMethodOptions: SelectOption[] = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
];

const requestContentModeOptions: SelectOption[] = [
  { label: "普通请求", value: "default" },
  { label: "SQL 请求", value: "sql" },
];

const eventActionOptions: SelectOption[] = [
  { label: "无动作", value: "none" },
  { label: "打开链接", value: "openLink" },
  { label: "跳转预览页", value: "openPreview" },
  { label: "聚焦组件", value: "focusWidget" },
];

const openModeOptions: SelectOption[] = [
  { label: "当前窗口", value: "self" },
  { label: "新窗口", value: "blank" },
];

const defaultRequestConfig: WidgetRequestConfig = {
  url: "",
  contentMode: "default",
  method: "GET",
  refreshInterval: 0,
  params: "",
  sql: "",
  responseMap: "",
  transformer: "",
};

function createDataPondId() {
  return `pond-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultDataPond(): EditorDataPond {
  const id = createDataPondId();
  return {
    id,
    name: `公共接口 ${id.slice(-4).toUpperCase()}`,
    enabled: true,
    request: cloneValue(defaultRequestConfig),
  };
}

function getDataPondStatusLabel(record: DataPondRuntimeRecord | undefined) {
  if (!record) {
    return "未启动";
  }

  if (record.status === "ready") {
    return "已拉取";
  }

  if (record.status === "loading") {
    return "拉取中";
  }

  if (record.status === "error") {
    return "请求异常";
  }

  return "未启动";
}

function resolveRequestContentMode(request: WidgetRequestConfig) {
  return request.contentMode ?? "default";
}

function getRequestContentModeLabel(request: WidgetRequestConfig) {
  return resolveRequestContentMode(request) === "sql" ? "SQL 请求" : "普通请求";
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return "[]";
  }
}

function getSingleFieldValue(field: unknown) {
  if (Array.isArray(field)) {
    return typeof field[0] === "string" ? field[0] : "";
  }

  return typeof field === "string" ? field : "";
}

function getWidgetDatasetState(widget: Widget): WidgetDatasetState | null {
  if (widget.chartFrame !== ChartFrame.VCHART || !Array.isArray(widget.spec.data)) {
    return null;
  }

  for (let index = 0; index < widget.spec.data.length; index += 1) {
    const dataset = widget.spec.data[index];
    if (!isRecord(dataset) || !("values" in dataset)) {
      continue;
    }

    const values = dataset.values;
    if (!Array.isArray(values)) {
      return {
        datasetIndex: index,
        fields: [],
        rowCount: 0,
        rows: [],
        values,
      };
    }

    const rows = values.filter(isRecord);
    return {
      datasetIndex: index,
      fields: Object.keys(rows[0] ?? {}),
      rowCount: rows.length,
      rows,
      values,
    };
  }

  return null;
}

function getFieldMappingOptions(datasetState: WidgetDatasetState | null): FieldMappingOptions {
  const fields = datasetState?.fields ?? [];
  const rows = datasetState?.rows ?? [];
  const allFields = fields.map((field) => ({ label: field, value: field }));
  const numericFields = fields
    .filter((field) =>
      rows.some((row) => typeof row[field] === "number" && Number.isFinite(row[field] as number)),
    )
    .map((field) => ({ label: field, value: field }));
  const categoryFields = allFields.filter(
    (field) => !numericFields.some((numericField) => numericField.value === field.value),
  );

  return {
    allFields,
    categoryFields: categoryFields.length > 0 ? categoryFields : allFields,
    numericFields: numericFields.length > 0 ? numericFields : allFields,
  };
}

function getSpecFieldValue(
  spec: VChartWidget["spec"],
  key: "seriesField" | "xField" | "yField",
) {
  if (!isRecord(spec)) {
    return "";
  }

  return getSingleFieldValue(spec[key]);
}

function getWidgetDataSummary(widget: Widget): WidgetDataSummary {
  const datasetState = getWidgetDatasetState(widget);
  if (!datasetState) {
    return { fields: [], rowCount: 0 };
  }

  return {
    fields: datasetState.fields,
    rowCount: datasetState.rowCount,
  };
}

function getAnimationLabel(animation: WidgetAnimationPreset | null) {
  return animationOptions.find((option) => option.value === animation)?.label ?? "未设置";
}

function getAnimationDescription(animation: WidgetAnimationPreset | null) {
  return (
    animationOptions.find((option) => option.value === animation)?.description ??
    "当前组件不会附加入场或循环动效。"
  );
}

function resolveWidgetAnimation(animations: WidgetAnimationPreset[]) {
  const preset = animations[0];
  switch (preset) {
    case "fadeIn":
      return "jv-widget-fade-in 720ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "riseIn":
      return "jv-widget-rise-in 780ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "zoomIn":
      return "jv-widget-zoom-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both";
    case "pulse":
      return "jv-widget-pulse 2.8s ease-in-out infinite";
    case "float":
      return "jv-widget-float 3.6s ease-in-out infinite";
    case "breathe":
      return "jv-widget-breathe 4.2s ease-in-out infinite";
    default:
      return undefined;
  }
}

function clampPosition(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function snapToGrid(value: number, size: number) {
  return Math.round(value / size) * size;
}

function getDisplayPosition(
  widget: Widget,
  previewPositions: Record<string, WidgetPosition> | null,
): WidgetPosition {
  const nextPosition = previewPositions?.[widget.id];

  return {
    x: nextPosition?.x ?? widget.attr.x,
    y: nextPosition?.y ?? widget.attr.y,
  };
}

function getSelectionBounds(
  widgets: Widget[],
  previewPositions: Record<string, WidgetPosition> | null = null,
) {
  if (widgets.length === 0) {
    return null;
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  widgets.forEach((widget) => {
    const position = getDisplayPosition(widget, previewPositions);
    left = Math.min(left, position.x);
    top = Math.min(top, position.y);
    right = Math.max(right, position.x + widget.attr.w);
    bottom = Math.max(bottom, position.y + widget.attr.h);
  });

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}

function haveSameIds(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => right[index] === id);
}

function PanelField({
  children,
  description,
  label,
}: {
  children: React.ReactNode;
  description?: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3">
      <div className="mb-2">
        <div className="text-sm font-semibold text-[#1a1c19]">{label}</div>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function PanelInputField({
  description,
  label,
  onValueChange,
  placeholder,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <PanelField label={label} description={description}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </PanelField>
  );
}

function PanelTextareaField({
  description,
  label,
  onValueChange,
  placeholder,
  rows = 6,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <PanelField label={label} description={description}>
      <Textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-h-0 border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </PanelField>
  );
}

function PanelSelectField({
  description,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}) {
  return (
    <PanelField label={label} description={description}>
      <Select
        value={value}
        options={options}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="border-[#d7d8d1] bg-white text-[#1a1c19] focus:border-[#23422a]"
      />
    </PanelField>
  );
}

function EmptyPanelState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-[280px] rounded-[24px] border border-[#d7d8d1] bg-white/78 px-6 py-8 text-center shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
          {title}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#727971]">{description}</p>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  disabled = false,
  onClick,
  variant = "secondary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
        variant === "primary"
          ? "border-[#23422a] bg-[#23422a] text-white hover:bg-[#31583b]"
          : "border-[#d7d8d1] bg-white text-[#23422a] hover:bg-[#f7f8f2]"
      } ${disabled ? "cursor-not-allowed opacity-45 hover:bg-white" : ""}`}
    >
      {children}
    </button>
  );
}

function getSaveStatusLabel(saveState: SaveState, lastSavedAt: string | null) {
  if (saveState === "published") {
    return "已发布";
  }

  if (saveState === "saved" && lastSavedAt) {
    return `已保存 ${new Date(lastSavedAt).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  }

  if (saveState === "dirty") {
    return "有未保存更改";
  }

  return "尚未保存";
}

function createDraftSignature(
  draft: Pick<
    EditorV2Draft,
    "projectTitle" | "widgets" | "dataPonds" | "dataPondSettings" | "canvas"
  >,
) {
  return JSON.stringify({
    projectTitle: draft.projectTitle,
    widgets: draft.widgets,
    dataPonds: draft.dataPonds,
    dataPondSettings: draft.dataPondSettings,
    canvas: draft.canvas,
  });
}

export function EditorWorkbench({
  projectId,
  projectName,
  templateId,
}: {
  projectId?: string;
  projectName?: string;
  templateId?: string;
}) {
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const workspaceImportInputRef = React.useRef<HTMLInputElement | null>(null);
  const locale = useLocale();
  const router = useRouter();
  const widgets = useEditorStore((state) => state.widgets);
  const dataPonds = useEditorStore((state) => state.dataPonds);
  const dataPondSettings = useEditorStore((state) => state.dataPondSettings);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const loadWorkspace = useEditorStore((state) => state.loadWorkspace);
  const addWidget = useEditorStore((state) => state.addWidget);
  const updateWidget = useEditorStore((state) => state.updateWidget);
  const updateWidgets = useEditorStore((state) => state.updateWidgets);
  const upsertDataPond = useEditorStore((state) => state.upsertDataPond);
  const removeDataPond = useEditorStore((state) => state.removeDataPond);
  const updateDataPondSettings = useEditorStore((state) => state.updateDataPondSettings);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const selectWidget = useEditorStore((state) => state.selectWidget);
  const selectWidgets = useEditorStore((state) => state.selectWidgets);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const groupSelectedWidgets = useEditorStore((state) => state.groupSelectedWidgets);
  const ungroupSelectedWidgets = useEditorStore((state) => state.ungroupSelectedWidgets);

  const [activeTab, setActiveTab] = React.useState<PanelTab>("customize");
  const [canvasPreview, setCanvasPreview] =
    React.useState<CanvasPreviewState>(DEFAULT_CANVAS_PREVIEW);
  const [draggingPackageKey, setDraggingPackageKey] = React.useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = React.useState<DropIndicator | null>(null);
  const [dragPreviewPositions, setDragPreviewPositions] = React.useState<
    Record<string, WidgetPosition> | null
  >(null);
  const [projectTitle, setProjectTitle] = React.useState(projectName?.trim() || "未命名项目");
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [selectedDataPondId, setSelectedDataPondId] = React.useState<string | null>(null);
  const [workspaceTransferState, setWorkspaceTransferState] =
    React.useState<WorkspaceTransferState | null>(null);
  const lastSavedSignatureRef = React.useRef<string>("");
  const activeWidgetDragRef = React.useRef<ActiveWidgetDrag | null>(null);
  const dragPreviewPositionsRef = React.useRef<Record<string, WidgetPosition> | null>(null);
  const widgetsRef = React.useRef(widgets);
  const dataPondRuntimeMap = useEditorDataPondRuntime(dataPonds, dataPondSettings);

  const packageGroups = React.useMemo(() => {
    const grouped = registry.getPackagesByCategory();

    return Object.values(WidgetCategory)
      .map((category) => ({
        category,
        title: categoryLabels[category],
        packages: grouped[category],
      }))
      .filter((group) => group.packages.length > 0);
  }, []);

  const selectedWidget = React.useMemo(
    () => widgets.find((widget) => widget.id === selectedIds[0]) ?? null,
    [selectedIds, widgets],
  );
  const hydratedWidgets = React.useMemo(
    () => widgets.map((widget) => applyDataPondToWidget(widget, dataPondRuntimeMap)),
    [dataPondRuntimeMap, widgets],
  );
  const selectedPreviewWidget = React.useMemo(
    () => hydratedWidgets.find((widget) => widget.id === selectedIds[0]) ?? null,
    [hydratedWidgets, selectedIds],
  );
  const selectedPackage = selectedWidget
    ? registry.getPackage(selectedWidget.registrationKey) ?? null
    : null;
  const orderedWidgets = React.useMemo(
    () => [...hydratedWidgets].sort((left, right) => left.attr.zIndex - right.attr.zIndex),
    [hydratedWidgets],
  );
  const selectedWidgets = React.useMemo(
    () => widgets.filter((widget) => selectedIds.includes(widget.id)),
    [selectedIds, widgets],
  );
  const selectedGroupIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          selectedWidgets
            .map((widget) => widget.group?.id)
            .filter((groupId): groupId is string => Boolean(groupId)),
        ),
      ),
    [selectedWidgets],
  );
  const selectedSharedGroup = React.useMemo<GroupType | null>(() => {
    if (selectedGroupIds.length !== 1) {
      return null;
    }

    return selectedWidgets.find((widget) => widget.group?.id === selectedGroupIds[0])?.group ?? null;
  }, [selectedGroupIds, selectedWidgets]);
  const selectedSharedGroupMembers = React.useMemo(
    () =>
      selectedSharedGroup
        ? widgets.filter((widget) => widget.group?.id === selectedSharedGroup.id)
        : [],
    [selectedSharedGroup, widgets],
  );
  const canGroupSelection = React.useMemo(
    () => selectedWidgets.length > 1 && selectedWidgets.every((widget) => !widget.group),
    [selectedWidgets],
  );
  const canUngroupSelection = React.useMemo(
    () => selectedGroupIds.length === 1 && selectedSharedGroupMembers.length > 1,
    [selectedGroupIds, selectedSharedGroupMembers.length],
  );
  const activeGroupFrames = React.useMemo(() => {
    const groups = new Map<string, { group: GroupType; widgets: Widget[] }>();

    orderedWidgets.forEach((widget) => {
      if (!selectedIds.includes(widget.id) || widget.status.hidden || !widget.group) {
        return;
      }

      const bucket = groups.get(widget.group.id);
      if (bucket) {
        bucket.widgets.push(widget);
        return;
      }

      groups.set(widget.group.id, {
        group: widget.group,
        widgets: orderedWidgets.filter(
          (candidate) => !candidate.status.hidden && candidate.group?.id === widget.group?.id,
        ),
      });
    });

    return Array.from(groups.values())
      .map((entry) => {
        const bounds = getSelectionBounds(entry.widgets, dragPreviewPositions);
        if (!bounds || entry.widgets.length < 2) {
          return null;
        }

        return {
          ...bounds,
          id: entry.group.id,
          label: `${entry.group.name} / ${entry.widgets.length} 项`,
        };
      })
      .filter((entry): entry is { height: number; id: string; label: string; width: number; x: number; y: number } => Boolean(entry));
  }, [dragPreviewPositions, orderedWidgets, selectedIds]);
  const canvasScale = canvasPreview.zoom / 100;
  const canvasFilterStyle = React.useMemo(
    () => resolveEditorV2CanvasFilterStyle(canvasPreview.filters),
    [canvasPreview.filters],
  );
  const selectedAnimation = selectedWidget?.styles.animations[0] ?? null;
  const selectedWidgetIsVChart = selectedWidget?.chartFrame === ChartFrame.VCHART;
  const selectedDatasetState = React.useMemo(
    () => (selectedPreviewWidget ? getWidgetDatasetState(selectedPreviewWidget) : null),
    [selectedPreviewWidget],
  );
  const selectedFieldMappingOptions = React.useMemo(
    () => getFieldMappingOptions(selectedDatasetState),
    [selectedDatasetState],
  );
  const currentDataMode = selectedWidget?.dataSource.mode === "request" ? "request" : "static";
  const selectedWidgetDataPond = React.useMemo(
    () =>
      selectedWidget?.dataSource.dataPondId
        ? dataPonds.find((item) => item.id === selectedWidget.dataSource.dataPondId) ?? null
        : null,
    [dataPonds, selectedWidget],
  );
  const selectedWidgetDataPondRuntime = React.useMemo(
    () => (selectedWidgetDataPond ? dataPondRuntimeMap[selectedWidgetDataPond.id] : undefined),
    [dataPondRuntimeMap, selectedWidgetDataPond],
  );
  const staticJsonEditorState = React.useMemo<JsonEditorState | null>(() => {
    if (!selectedWidget) {
      return null;
    }

    const fallbackValue = formatJson(selectedDatasetState?.values ?? []);
    const draft = selectedWidget.dataSource.manualJson;
    const nextValue = draft && draft.trim().length > 0 ? draft : fallbackValue;

    try {
      const parsed = JSON.parse(nextValue) as unknown;
      return {
        error: null,
        isArrayValue: Array.isArray(parsed),
        value: nextValue,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "JSON 解析失败",
        isArrayValue: false,
        value: nextValue,
      };
    }
  }, [selectedDatasetState, selectedWidget]);
  const requestPreviewValue = React.useMemo(
    () => formatJson(selectedWidgetDataPondRuntime?.data ?? selectedDatasetState?.values ?? []),
    [selectedDatasetState, selectedWidgetDataPondRuntime],
  );
  const selectedDataSummary = React.useMemo(
    () => (selectedPreviewWidget ? getWidgetDataSummary(selectedPreviewWidget) : null),
    [selectedPreviewWidget],
  );
  const targetWidgetOptions = React.useMemo<SelectOption[]>(() => {
    if (!selectedWidget) {
      return [];
    }

    return widgets
      .filter((widget) => widget.id !== selectedWidget.id)
      .map((widget) => {
        const pkg = registry.getPackage(widget.registrationKey);
        return {
          label: `${pkg?.registration.titleZh ?? widget.registrationKey} / ${widget.id.slice(-6)}`,
          value: widget.id,
        };
      });
  }, [selectedWidget, widgets]);
  const resolvedProjectId = projectId?.trim() || "v2-workspace";
  const resolvedProjectTitle = projectTitle.trim() || projectName?.trim() || "未命名项目";
  const selectedDataPond = React.useMemo(
    () => dataPonds.find((item) => item.id === selectedDataPondId) ?? null,
    [dataPonds, selectedDataPondId],
  );
  const selectedDataPondRuntime = React.useMemo(
    () => (selectedDataPond ? dataPondRuntimeMap[selectedDataPond.id] : undefined),
    [dataPondRuntimeMap, selectedDataPond],
  );
  const selectedDataPondRequestMode = React.useMemo<RequestContentMode>(
    () => (selectedDataPond ? resolveRequestContentMode(selectedDataPond.request) : "default"),
    [selectedDataPond],
  );
  const selectedDataPondMethodOptions = React.useMemo<SelectOption[]>(
    () =>
      selectedDataPondRequestMode === "sql"
        ? [{ label: "POST", value: "POST" }]
        : requestMethodOptions,
    [selectedDataPondRequestMode],
  );
  const dataPondBindingCounts = React.useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};

    widgets.forEach((widget) => {
      const pondId = widget.dataSource.dataPondId;
      if (!pondId) {
        return;
      }

      counts[pondId] = (counts[pondId] ?? 0) + 1;
    });

    return counts;
  }, [widgets]);
  const workspaceSignature = React.useMemo(
    () =>
      createDraftSignature({
        projectTitle: resolvedProjectTitle,
        widgets,
        dataPonds,
        dataPondSettings,
        canvas: canvasPreview,
      }),
    [canvasPreview, dataPondSettings, dataPonds, resolvedProjectTitle, widgets],
  );
  const workspaceSummary = React.useMemo(
    () =>
      buildEditorV2WorkspaceSummary({
        canvas: canvasPreview,
        dataPondSettings,
        dataPonds,
        projectId: resolvedProjectId,
        projectTitle: resolvedProjectTitle,
        widgets,
      }),
    [
      canvasPreview,
      dataPondSettings,
      dataPonds,
      resolvedProjectId,
      resolvedProjectTitle,
      widgets,
    ],
  );

  React.useEffect(() => {
    if (dataPonds.length === 0) {
      if (selectedDataPondId !== null) {
        setSelectedDataPondId(null);
      }
      return;
    }

    if (!selectedDataPondId || !dataPonds.some((item) => item.id === selectedDataPondId)) {
      setSelectedDataPondId(dataPonds[0]?.id ?? null);
    }
  }, [dataPonds, selectedDataPondId]);

  React.useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  React.useEffect(() => {
    dragPreviewPositionsRef.current = dragPreviewPositions;
  }, [dragPreviewPositions]);

  React.useEffect(() => {
    const draft = readEditorV2Draft(resolvedProjectId);
    const projectRecord = readProjectRecord(resolvedProjectId);

    if (draft) {
      loadWorkspace({
        widgets: draft.widgets,
        dataPonds: draft.dataPonds,
        dataPondSettings: draft.dataPondSettings,
      });
      setCanvasPreview(draft.canvas);
      setProjectTitle(
        draft.projectTitle.trim() || projectRecord?.name || projectName?.trim() || "未命名项目",
      );
      setSelectedDataPondId(draft.dataPonds[0]?.id ?? null);
      lastSavedSignatureRef.current = createDraftSignature(draft);
      setLastSavedAt(draft.updatedAt);
      setSaveState("saved");
      setActiveTab("customize");
      return;
    }

    loadWorkspace({
      widgets: [],
      dataPonds: [],
      dataPondSettings: defaultEditorV2DataPondSettings,
    });
    setCanvasPreview(DEFAULT_CANVAS_PREVIEW);
    const nextTitle = projectRecord?.name || projectName?.trim() || "未命名项目";
    setProjectTitle(nextTitle);
    setSelectedDataPondId(null);
    lastSavedSignatureRef.current = createDraftSignature({
      projectTitle: nextTitle,
      widgets: [],
      dataPonds: [],
      dataPondSettings: defaultEditorV2DataPondSettings,
      canvas: DEFAULT_CANVAS_PREVIEW,
    });
    setLastSavedAt(null);
    setSaveState("idle");
    setActiveTab("customize");
  }, [loadWorkspace, projectName, resolvedProjectId]);

  React.useEffect(() => {
    if (!lastSavedSignatureRef.current) {
      return;
    }

    setSaveState((current) => {
      if (workspaceSignature !== lastSavedSignatureRef.current) {
        return "dirty";
      }

      return current === "published" ? "published" : "saved";
    });
  }, [workspaceSignature]);

  const buildCurrentDraft = React.useCallback((): EditorV2Draft => {
    const nextCanvas: EditorV2CanvasState = {
      filters: canvasPreview.filters,
      width: canvasPreview.width,
      height: canvasPreview.height,
      zoom: canvasPreview.zoom,
      showGrid: canvasPreview.showGrid,
      showSafeArea: canvasPreview.showSafeArea,
      snapToGrid: canvasPreview.snapToGrid,
    };

    return {
      version: "v2",
      projectId: resolvedProjectId,
      projectTitle: resolvedProjectTitle,
      widgets,
      dataPonds,
      dataPondSettings,
      canvas: nextCanvas,
      updatedAt: new Date().toISOString(),
    };
  }, [
    canvasPreview,
    dataPondSettings,
    dataPonds,
    resolvedProjectId,
    resolvedProjectTitle,
    widgets,
  ]);

  const applyImportedWorkspace = React.useCallback(
    (document: ReturnType<typeof parseEditorV2WorkspaceDocument>) => {
      loadWorkspace({
        widgets: document.widgets,
        dataPonds: document.dataPonds,
        dataPondSettings: document.dataPondSettings,
      });
      setCanvasPreview(document.canvas);
      setProjectTitle(document.projectTitle.trim() || resolvedProjectTitle);
      setSelectedDataPondId(document.dataPonds[0]?.id ?? null);
      setActiveTab("customize");
      setSaveState("dirty");
      setLastSavedAt(null);
      setWorkspaceTransferState({
        at: new Date().toISOString(),
        detail: document.sourceProjectId
          ? `来源项目：${document.sourceProjectId}`
          : "来源项目：外部工作区文件",
        kind: "import",
        message: "工作区导入成功，当前变更尚未保存。",
        status: "success",
        summary: buildEditorV2WorkspaceSummary({
          canvas: document.canvas,
          dataPondSettings: document.dataPondSettings,
          dataPonds: document.dataPonds,
          projectId: document.projectId,
          projectTitle: document.projectTitle,
          widgets: document.widgets,
        }),
      });
    },
    [loadWorkspace, resolvedProjectTitle],
  );

  const syncProjectRecord = React.useCallback(
    (status: "DRAFT" | "LIVE") => {
      upsertProjectRecord({
        id: resolvedProjectId,
        name: resolvedProjectTitle,
        status,
        templateId,
      });
    },
    [resolvedProjectId, resolvedProjectTitle, templateId],
  );

  const commitDraftState = React.useCallback((draft: EditorV2Draft, nextState: SaveState) => {
    lastSavedSignatureRef.current = createDraftSignature(draft);
    setLastSavedAt(draft.updatedAt);
    setSaveState(nextState);
  }, []);

  const handleSaveWorkspace = React.useCallback(() => {
    const draft = buildCurrentDraft();
    saveEditorV2Draft(resolvedProjectId, draft);
    syncProjectRecord("DRAFT");
    commitDraftState(draft, "saved");
    return draft;
  }, [buildCurrentDraft, commitDraftState, resolvedProjectId, syncProjectRecord]);

  const handleOpenWorkspaceImport = React.useCallback(() => {
    workspaceImportInputRef.current?.click();
  }, []);

  const handleWorkspaceImport = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const content = await file.text();
        const document = parseEditorV2WorkspaceDocument(content);
        applyImportedWorkspace(document);
      } catch (error) {
        setWorkspaceTransferState({
          at: new Date().toISOString(),
          detail: `文件：${file.name}`,
          kind: "import",
          message:
            error instanceof Error
              ? error.message
              : "工作区导入失败，请检查 JSON 内容。",
          status: "error",
          summary: null,
        });
      } finally {
        event.target.value = "";
      }
    },
    [applyImportedWorkspace],
  );

  const handleWorkspaceExport = React.useCallback(() => {
    const draft = buildCurrentDraft();
    const document = createEditorV2WorkspaceDocument(draft);
    downloadEditorV2WorkspaceDocument(
      document,
      buildEditorV2WorkspaceFilename(resolvedProjectTitle),
    );
    setWorkspaceTransferState({
      at: new Date().toISOString(),
      detail: `导出文件：${buildEditorV2WorkspaceFilename(resolvedProjectTitle)}`,
      kind: "export",
      message: "工作区导出成功，可直接用于备份或迁移。",
      status: "success",
      summary: buildEditorV2WorkspaceSummary({
        canvas: draft.canvas,
        dataPondSettings: draft.dataPondSettings,
        dataPonds: draft.dataPonds,
        projectId: draft.projectId,
        projectTitle: draft.projectTitle,
        widgets: draft.widgets,
      }),
    });
  }, [buildCurrentDraft, resolvedProjectTitle]);

  const handlePreviewWorkspace = React.useCallback(() => {
    handleSaveWorkspace();
    router.push(`/${locale}/preview/${encodeURIComponent(resolvedProjectId)}`);
  }, [handleSaveWorkspace, locale, resolvedProjectId, router]);

  const handlePublishWorkspace = React.useCallback(() => {
    const draft = buildCurrentDraft();
    saveEditorV2Draft(resolvedProjectId, draft);
    saveEditorV2PublishedSnapshot(resolvedProjectId, draft);
    syncProjectRecord("LIVE");
    commitDraftState(draft, "published");
    router.push(`/${locale}/publish-success/${encodeURIComponent(resolvedProjectId)}`);
  }, [
    buildCurrentDraft,
    commitDraftState,
    locale,
    resolvedProjectId,
    router,
    syncProjectRecord,
  ]);

  const updateCanvasPreview = <K extends keyof CanvasPreviewState>(
    key: K,
    value: CanvasPreviewState[K],
  ) => {
    setCanvasPreview((current) => ({ ...current, [key]: value }));
  };

  const updateCanvasFilter = <K extends keyof EditorV2CanvasFilters>(
    key: K,
    value: EditorV2CanvasFilters[K],
  ) => {
    setCanvasPreview((current) => ({
      ...current,
      filters: {
        ...current.filters,
        [key]: value,
      },
    }));
  };

  const applyCanvasFilterPreset = (filters: EditorV2CanvasFilters) => {
    setCanvasPreview((current) => ({
      ...current,
      filters,
    }));
  };

  const createPositionedWidget = (pkg: WidgetPackage, x: number, y: number) => {
    const created = pkg.createDefault();
    const maxX = Math.max(0, canvasPreview.width - created.attr.w);
    const maxY = Math.max(0, canvasPreview.height - created.attr.h);
    const nextX = clampPosition(
      canvasPreview.snapToGrid ? snapToGrid(x, 24) : Math.round(x),
      0,
      maxX,
    );
    const nextY = clampPosition(
      canvasPreview.snapToGrid ? snapToGrid(y, 24) : Math.round(y),
      0,
      maxY,
    );

    return {
      ...created,
      attr: {
        ...created.attr,
        x: nextX,
        y: nextY,
        zIndex: widgets.length + 1,
      },
    };
  };

  const buildDropIndicator = (pkg: WidgetPackage, clientX: number, clientY: number) => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) {
      return null;
    }

    const rect = canvasNode.getBoundingClientRect();
    const localX = (clientX - rect.left) / canvasScale;
    const localY = (clientY - rect.top) / canvasScale;
    const widget = createPositionedWidget(
      pkg,
      localX - pkg.registration.defaultWidth / 2,
      localY - pkg.registration.defaultHeight / 2,
    );

    return {
      x: widget.attr.x,
      y: widget.attr.y,
      width: widget.attr.w,
      height: widget.attr.h,
      title: pkg.registration.titleZh,
    };
  };

  const handleAddWidget = (pkg: WidgetPackage) => {
    const offset = widgets.length * 24;
    const nextWidget = createPositionedWidget(
      pkg,
      Math.round((canvasPreview.width - pkg.registration.defaultWidth) / 2) + offset,
      Math.round((canvasPreview.height - pkg.registration.defaultHeight) / 2) + offset,
    );

    addWidget(nextWidget);
    selectWidget(nextWidget.id);
  };

  const handlePackageDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    pkg: WidgetPackage,
  ) => {
    setDraggingPackageKey(pkg.registration.key);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(WIDGET_DRAG_MIME, pkg.registration.key);
  };

  const handlePackageDragEnd = () => {
    setDraggingPackageKey(null);
    setDropIndicator(null);
  };

  const handleCanvasDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const registrationKey = event.dataTransfer.getData(WIDGET_DRAG_MIME) || draggingPackageKey;
    if (!registrationKey) {
      return;
    }

    const pkg = registry.getPackage(registrationKey);
    if (!pkg) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropIndicator(buildDropIndicator(pkg, event.clientX, event.clientY));
  };

  const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const registrationKey = event.dataTransfer.getData(WIDGET_DRAG_MIME) || draggingPackageKey;
    if (!registrationKey) {
      return;
    }

    const pkg = registry.getPackage(registrationKey);
    if (!pkg) {
      return;
    }

    event.preventDefault();
    const indicator = buildDropIndicator(pkg, event.clientX, event.clientY);
    setDraggingPackageKey(null);
    setDropIndicator(null);

    if (!indicator) {
      return;
    }

    const nextWidget = createPositionedWidget(pkg, indicator.x, indicator.y);
    addWidget(nextWidget);
    selectWidget(nextWidget.id);
  };

  const handleCanvasDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canvasRef.current?.contains(event.relatedTarget as Node | null)) {
      setDropIndicator(null);
    }
  };

  const expandSelectionWithGroups = React.useCallback(
    (ids: string[]) => {
      const expanded = new Set(ids);

      ids.forEach((id) => {
        const groupId = widgets.find((widget) => widget.id === id)?.group?.id;
        if (!groupId) {
          return;
        }

        widgets.forEach((widget) => {
          if (widget.group?.id === groupId) {
            expanded.add(widget.id);
          }
        });
      });

      return widgets
        .map((widget) => widget.id)
        .filter((widgetId) => expanded.has(widgetId));
    },
    [widgets],
  );

  const getSelectionIdsForWidget = React.useCallback(
    (widgetId: string) => expandSelectionWithGroups([widgetId]),
    [expandSelectionWithGroups],
  );

  const handleGroupSelection = React.useCallback(() => {
    if (!canGroupSelection) {
      return;
    }

    groupSelectedWidgets();
  }, [canGroupSelection, groupSelectedWidgets]);

  const handleUngroupSelection = React.useCallback(() => {
    if (!canUngroupSelection) {
      return;
    }

    ungroupSelectedWidgets();
  }, [canUngroupSelection, ungroupSelectedWidgets]);

  const handleWidgetPointerDown = (
    widgetId: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const anchorWidget = widgets.find((widget) => widget.id === widgetId);
    if (!anchorWidget || anchorWidget.status.hidden || anchorWidget.status.locked) {
      return;
    }

    const isMultiToggle = event.shiftKey || event.metaKey || event.ctrlKey;
    const directSelectionIds = getSelectionIdsForWidget(widgetId);

    if (isMultiToggle) {
      event.preventDefault();
      event.stopPropagation();
      selectWidgets(directSelectionIds, true);
      return;
    }

    const nextSelectionIds = expandSelectionWithGroups(
      selectedIds.includes(widgetId) ? selectedIds : directSelectionIds,
    );

    if (!haveSameIds(nextSelectionIds, selectedIds)) {
      selectWidgets(nextSelectionIds);
    }

    const movableWidgets = widgets.filter(
      (widget) => nextSelectionIds.includes(widget.id) && !widget.status.locked,
    );
    if (movableWidgets.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const bounds = getSelectionBounds(movableWidgets);
    if (!bounds) {
      return;
    }

    activeWidgetDragRef.current = {
      anchorId: widgetId,
      maxBottom: bounds.y + bounds.height,
      maxRight: bounds.x + bounds.width,
      minLeft: bounds.x,
      minTop: bounds.y,
      originPositions: Object.fromEntries(
        movableWidgets.map((widget) => [widget.id, { x: widget.attr.x, y: widget.attr.y }]),
      ),
      startClientX: event.clientX,
      startClientY: event.clientY,
      widgetIds: movableWidgets.map((widget) => widget.id),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const activeDrag = activeWidgetDragRef.current;
      if (!activeDrag) {
        return;
      }

      const rawDeltaX = (moveEvent.clientX - activeDrag.startClientX) / canvasScale;
      const rawDeltaY = (moveEvent.clientY - activeDrag.startClientY) / canvasScale;
      const limitedDeltaX = clampPosition(
        Math.round(rawDeltaX),
        -activeDrag.minLeft,
        canvasPreview.width - activeDrag.maxRight,
      );
      const limitedDeltaY = clampPosition(
        Math.round(rawDeltaY),
        -activeDrag.minTop,
        canvasPreview.height - activeDrag.maxBottom,
      );
      const groupWidth = activeDrag.maxRight - activeDrag.minLeft;
      const groupHeight = activeDrag.maxBottom - activeDrag.minTop;
      const snappedLeft = canvasPreview.snapToGrid
        ? clampPosition(snapToGrid(activeDrag.minLeft + limitedDeltaX, 24), 0, canvasPreview.width - groupWidth)
        : activeDrag.minLeft + limitedDeltaX;
      const snappedTop = canvasPreview.snapToGrid
        ? clampPosition(snapToGrid(activeDrag.minTop + limitedDeltaY, 24), 0, canvasPreview.height - groupHeight)
        : activeDrag.minTop + limitedDeltaY;
      const nextDeltaX = snappedLeft - activeDrag.minLeft;
      const nextDeltaY = snappedTop - activeDrag.minTop;

      setDragPreviewPositions(
        Object.fromEntries(
          activeDrag.widgetIds.map((id) => {
            const origin = activeDrag.originPositions[id];
            return [
              id,
              {
                x: origin.x + nextDeltaX,
                y: origin.y + nextDeltaY,
              },
            ];
          }),
        ),
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const activeDrag = activeWidgetDragRef.current;
      activeWidgetDragRef.current = null;

      const previewPositions = dragPreviewPositionsRef.current;
      if (!activeDrag || !previewPositions) {
        setDragPreviewPositions(null);
        return;
      }

      const patches: Array<{ id: string; patch: WidgetPatch }> = [];

      activeDrag.widgetIds.forEach((id) => {
        const widget = widgetsRef.current.find((entry) => entry.id === id);
        const preview = previewPositions[id];
        if (!widget || !preview) {
          return;
        }

        if (widget.attr.x === preview.x && widget.attr.y === preview.y) {
          return;
        }

        patches.push({
          id,
          patch: {
            attr: {
              ...widget.attr,
              x: preview.x,
              y: preview.y,
            },
          },
        });
      });

      if (patches.length > 0) {
        updateWidgets(patches);
      }

      setDragPreviewPositions(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleWidgetPatch = (patch: WidgetPatch) => {
    if (!selectedWidget) {
      return;
    }

    updateWidget(selectedWidget.id, patch);
  };

  const updateSelectedAttr = <K extends keyof Widget["attr"]>(
    key: K,
    value: Widget["attr"][K],
  ) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      attr: {
        ...selectedWidget.attr,
        [key]: value,
      },
    });
  };

  const updateSelectedStyles = <K extends keyof Widget["styles"]>(
    key: K,
    value: Widget["styles"][K],
  ) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      styles: {
        ...selectedWidget.styles,
        [key]: value,
      },
    });
  };

  const updateSelectedDataSource = <K extends keyof Widget["dataSource"]>(
    key: K,
    value: Widget["dataSource"][K],
  ) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        [key]: value,
      },
    });
  };

  const updateSelectedRequestConfig = <K extends keyof WidgetRequestConfig>(
    key: K,
    value: WidgetRequestConfig[K],
  ) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        request: {
          ...(selectedWidget.dataSource.request ?? defaultRequestConfig),
          [key]: value,
        },
      },
    });
  };

  const updateSelectedRequestContentMode = (mode: RequestContentMode) => {
    if (!selectedWidget) {
      return;
    }

    const currentRequest = selectedWidget.dataSource.request ?? defaultRequestConfig;

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        request: {
          ...currentRequest,
          contentMode: mode,
          method: mode === "sql" ? "POST" : currentRequest.method,
          sql: currentRequest.sql ?? "",
        },
      },
    });
  };

  const handleSelectedDataModeChange = (mode: DataSourceMode) => {
    if (!selectedWidget) {
      return;
    }

    const nextDataPondId =
      mode === "request"
        ? selectedWidget.dataSource.dataPondId ?? dataPonds[0]?.id
        : selectedWidget.dataSource.dataPondId;

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        mode,
        dataPondId: nextDataPondId,
      },
    });

    if (nextDataPondId) {
      setSelectedDataPondId(nextDataPondId);
    }
  };

  const updateSelectedDataPond = <K extends keyof EditorDataPond>(
    key: K,
    value: EditorDataPond[K],
  ) => {
    if (!selectedDataPond) {
      return;
    }

    upsertDataPond({
      ...selectedDataPond,
      [key]: value,
    });
  };

  const updateSelectedDataPondRequest = <K extends keyof WidgetRequestConfig>(
    key: K,
    value: WidgetRequestConfig[K],
  ) => {
    if (!selectedDataPond) {
      return;
    }

    upsertDataPond({
      ...selectedDataPond,
      request: {
        ...selectedDataPond.request,
        [key]: value,
      },
    });
  };

  const updateSelectedDataPondRequestContentMode = (mode: RequestContentMode) => {
    if (!selectedDataPond) {
      return;
    }

    upsertDataPond({
      ...selectedDataPond,
      request: {
        ...selectedDataPond.request,
        contentMode: mode,
        method: mode === "sql" ? "POST" : selectedDataPond.request.method,
        sql: selectedDataPond.request.sql ?? "",
      },
    });
  };

  const handleCreateDataPond = () => {
    const nextDataPond = createDefaultDataPond();
    upsertDataPond(nextDataPond);
    setSelectedDataPondId(nextDataPond.id);
  };

  const handleCreateAndBindDataPond = () => {
    const nextDataPond = createDefaultDataPond();
    upsertDataPond(nextDataPond);
    setSelectedDataPondId(nextDataPond.id);

    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        mode: "request",
        dataPondId: nextDataPond.id,
      },
    });
  };

  const handleDeleteSelectedDataPond = () => {
    if (!selectedDataPond) {
      return;
    }

    removeDataPond(selectedDataPond.id);
  };

  const updateSelectedEvents = <K extends keyof Widget["events"]>(
    key: K,
    value: Widget["events"][K],
  ) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      events: {
        ...selectedWidget.events,
        [key]: value,
      },
    });
  };

  const patchSelectedVChartSpec = (mutator: (spec: VChartWidget["spec"]) => void) => {
    if (!selectedWidget || selectedWidget.chartFrame !== ChartFrame.VCHART) {
      return;
    }

    const nextSpec = cloneValue(selectedWidget.spec);
    mutator(nextSpec);
    handleWidgetPatch({ spec: nextSpec });
  };

  const updateSelectedFieldMapping = (
    key: "seriesField" | "xField" | "yField",
    value: string,
  ) => {
    patchSelectedVChartSpec((nextSpec) => {
      if (!isRecord(nextSpec)) {
        return;
      }

      nextSpec[key] = value;
    });
  };

  const updateStaticJsonDraft = (value: string) => {
    if (!selectedWidget) {
      return;
    }

    handleWidgetPatch({
      dataSource: {
        ...selectedWidget.dataSource,
        mode: "static",
        manualJson: value,
      },
    });

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed) || !selectedDatasetState) {
        return;
      }

      patchSelectedVChartSpec((nextSpec) => {
        if (!isRecord(nextSpec) || !Array.isArray(nextSpec.data)) {
          return;
        }

        const nextDataset = nextSpec.data[selectedDatasetState.datasetIndex];
        if (!isRecord(nextDataset)) {
          return;
        }

        nextDataset.values = parsed;
      });
    } catch {
      // 输入过程中允许暂时无效的 JSON，待用户修正后再同步回 spec.data。
    }
  };

  const renderCustomizePanel = () => {
    if (selectedWidgets.length > 1) {
      const selectionBounds = getSelectionBounds(selectedWidgets, dragPreviewPositions);
      const selectionDescription = selectedSharedGroup
        ? "当前选择已经属于同一组合，拖动任意成员都会联动整组，解组后才可以重新编排。"
        : canGroupSelection
          ? "当前选择尚未分组，可以直接打组并开启联合拖拽。"
          : "当前选择里包含已分组组件。若要重新打组，请先把已有组合解开。";

      return (
        <div className="space-y-3">
          <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
              组合联动
            </div>
            <div className="mt-3 text-lg font-bold text-[#1a1c19]">
              {selectedSharedGroup ? selectedSharedGroup.name : `已选 ${selectedWidgets.length} 个组件`}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#727971]">{selectionDescription}</p>
          </div>

          <CollapseSection
            title="组合操作"
            description="分组后的组件会共享拖拽位移。当前版本先采用轻量 groupId 模型，不引入额外父节点。"
            badge="Grouping"
            contentClassName="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGroupSelection}
                disabled={!canGroupSelection}
                className={`rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                  canGroupSelection
                    ? "border-[#23422a] bg-[#23422a] text-white hover:bg-[#31583b]"
                    : "cursor-not-allowed border-[#d7d8d1] bg-white text-[#727971] opacity-55"
                }`}
              >
                打组
              </button>
              <button
                type="button"
                onClick={handleUngroupSelection}
                disabled={!canUngroupSelection}
                className={`rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                  canUngroupSelection
                    ? "border-[#23422a] bg-white text-[#23422a] hover:bg-[#f6f7f1]"
                    : "cursor-not-allowed border-[#d7d8d1] bg-white text-[#727971] opacity-55"
                }`}
              >
                解组
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PanelField label="已选组件">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {selectedWidgets.length} 项
                </div>
              </PanelField>
              <PanelField label="组合状态">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {selectedSharedGroup ? selectedSharedGroup.name : "未打组"}
                </div>
              </PanelField>
            </div>

            {selectionBounds ? (
              <div className="grid grid-cols-2 gap-3">
                <PanelField label="包围宽度">
                  <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                    {Math.round(selectionBounds.width)} px
                  </div>
                </PanelField>
                <PanelField label="包围高度">
                  <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                    {Math.round(selectionBounds.height)} px
                  </div>
                </PanelField>
              </div>
            ) : null}
          </CollapseSection>
        </div>
      );
    }

    if (!selectedWidget || !selectedPackage) {
      return (
        <div className="space-y-3">
          <CollapseSection
            title="画布尺寸"
            description="当前仍由工作台壳层托管，后续会拆到独立的页面级 Store。"
            badge="Canvas"
            contentClassName="space-y-3"
          >
            <NumberStepper
              label="画布宽度"
              value={canvasPreview.width}
              min={320}
              max={3840}
              step={10}
              unit="px"
              onValueChange={(value) => updateCanvasPreview("width", value)}
            />
            <NumberStepper
              label="画布高度"
              value={canvasPreview.height}
              min={240}
              max={2160}
              step={10}
              unit="px"
              onValueChange={(value) => updateCanvasPreview("height", value)}
            />
            <NumberStepper
              label="预览缩放"
              value={canvasPreview.zoom}
              min={10}
              max={100}
              step={5}
              unit="%"
              onValueChange={(value) => updateCanvasPreview("zoom", value)}
            />
          </CollapseSection>

          <CollapseSection
            title="辅助显示"
            description="这些状态只作用于工作台层，帮助联调布局和吸附体验。"
            badge="Shell"
            contentClassName="space-y-3"
          >
            <ToggleSwitch
              label="显示网格"
              checked={canvasPreview.showGrid}
              onCheckedChange={(checked) => updateCanvasPreview("showGrid", checked)}
            />
            <ToggleSwitch
              label="显示安全区"
              checked={canvasPreview.showSafeArea}
              onCheckedChange={(checked) => updateCanvasPreview("showSafeArea", checked)}
            />
            <ToggleSwitch
              label="启用吸附"
              checked={canvasPreview.snapToGrid}
              onCheckedChange={(checked) => updateCanvasPreview("snapToGrid", checked)}
            />
          </CollapseSection>

          <CollapseSection
            title="工作区交付"
            description="导入、导出、保存、预览和发布都围绕同一份 V2 工作区结构运转。这里会展示当前工作区规模，以及最近一次导入导出结果。"
            badge="Workspace"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenWorkspaceImport}
                  className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1 text-[11px] font-semibold text-[#23422a] transition-colors hover:border-[#23422a] hover:bg-[#f7f8f2]"
                >
                  导入
                </button>
                <button
                  type="button"
                  onClick={handleWorkspaceExport}
                  className="rounded-full border border-[#23422a] bg-[#23422a] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#31583b]"
                >
                  导出
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="当前组件数">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {workspaceSummary.widgetCount} 项
                </div>
              </PanelField>
              <PanelField label="公共数据池">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {workspaceSummary.dataPondCount} 个
                </div>
              </PanelField>
              <PanelField label="当前画布">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {workspaceSummary.canvasLabel}
                </div>
              </PanelField>
              <PanelField label="动态绑定组件">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {workspaceSummary.dataBoundWidgetCount} 项
                </div>
              </PanelField>
            </div>

            {workspaceTransferState ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  workspaceTransferState.status === "success"
                    ? "border-[#d7e7d6] bg-[#f4f8f1] text-[#35513a]"
                    : "border-[#ead7c2] bg-[#fff7f3] text-[#8a5a2b]"
                }`}
              >
                <div className="font-semibold">{workspaceTransferState.message}</div>
                <div className="mt-1 text-xs">
                  {workspaceTransferState.detail} / {new Date(workspaceTransferState.at).toLocaleString("zh-CN")}
                </div>
                {workspaceTransferState.summary ? (
                  <div className="mt-2 text-xs">
                    组件 {workspaceTransferState.summary.widgetCount} 项，数据池 {workspaceTransferState.summary.dataPondCount} 个，画布 {workspaceTransferState.summary.canvasLabel}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-4 text-sm leading-6 text-[#727971]">
                当前还没有导入或导出记录。导入后的工作区会直接接入当前编辑器，并沿用现有的保存、预览和发布链路。
              </div>
            )}
          </CollapseSection>

          <CollapseSection
            title="公共数据池"
            description="页面级共享接口池。组件在动态模式下只订阅数据池 ID，真实请求、轮询和返回映射统一在这里维护。"
            badge="Data Pond"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateDataPond}
                  className="rounded-full border border-[#23422a] bg-[#23422a] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#31583b]"
                >
                  新建
                </button>
                {selectedDataPond ? (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedDataPond}
                    className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1 text-[11px] font-semibold text-[#727971] transition-colors hover:border-[#23422a] hover:text-[#23422a]"
                  >
                    删除
                  </button>
                ) : null}
              </div>
            }
            contentClassName="space-y-3"
          >
            <NumberStepper
              label="全局轮询间隔"
              description="当数据池没有单独设置刷新间隔时，统一使用这里的全局频率。0 表示只做首轮拉取。"
              value={dataPondSettings.pollingInterval}
              min={0}
              max={3600}
              step={5}
              unit="s"
              onValueChange={(value) => updateDataPondSettings({ pollingInterval: value })}
            />

            {dataPonds.length > 0 ? (
              <>
                <PanelField
                  label="数据池列表"
                  description="组件绑定数和运行状态都来自当前 Store 与运行时轮询结果。"
                >
                  <div className="space-y-2">
                    {dataPonds.map((dataPond) => {
                      const active = dataPond.id === selectedDataPondId;
                      const runtime = dataPondRuntimeMap[dataPond.id];
                      const bindingCount = dataPondBindingCounts[dataPond.id] ?? 0;

                      return (
                        <button
                          key={dataPond.id}
                          type="button"
                          onClick={() => setSelectedDataPondId(dataPond.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                            active
                              ? "border-[#23422a] bg-[#eef5ec]"
                              : "border-[#d7d8d1] bg-[#fafaf5] hover:border-[#23422a]/35 hover:bg-[#f6f7f1]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[#1a1c19]">
                              {dataPond.name}
                            </div>
                            <div className="mt-1 text-xs text-[#727971]">
                              {getDataPondStatusLabel(runtime)} / 绑定 {bindingCount} 个组件
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                              dataPond.enabled
                                ? "border border-[#23422a]/20 bg-white text-[#23422a]"
                                : "border border-[#d7d8d1] bg-white text-[#727971]"
                            }`}
                          >
                            {dataPond.enabled ? "ON" : "OFF"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PanelField>

                {selectedDataPond ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <PanelField label="当前状态">
                        <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                          {getDataPondStatusLabel(selectedDataPondRuntime)}
                        </div>
                      </PanelField>
                      <PanelField label="最近更新">
                        <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                          {selectedDataPondRuntime?.updatedAt
                            ? new Date(selectedDataPondRuntime.updatedAt).toLocaleTimeString(
                                "zh-CN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )
                            : "暂无"}
                        </div>
                      </PanelField>
                    </div>

                    <PanelInputField
                      label="数据池名称"
                      description="组件面板会直接引用这个名字，建议按“业务 + 用途”的方式命名。"
                      value={selectedDataPond.name}
                      placeholder="例如：大屏主数据源"
                      onValueChange={(value) => updateSelectedDataPond("name", value)}
                    />

                    <PanelField
                      label="启用状态"
                      description="关闭后会停止这个数据池的请求与轮询。"
                    >
                      <ToggleSwitch
                        label="启用当前数据池"
                        checked={selectedDataPond.enabled}
                        onCheckedChange={(checked) => updateSelectedDataPond("enabled", checked)}
                      />
                    </PanelField>

                    <PanelInputField
                      label="请求地址"
                      description="数据池的真实接口地址，当前画布内所有订阅组件都会共享它。"
                      value={selectedDataPond.request.url}
                      placeholder="https://api.example.com/dashboard"
                      onValueChange={(value) => updateSelectedDataPondRequest("url", value)}
                    />

                    <PanelField
                      label="请求模式"
                      description="普通请求会按参数发送；SQL 模式会把 SQL 语句作为 `{ sql: string }` 报文发送给后端拦截器。"
                    >
                      <Tabs
                        value={selectedDataPondRequestMode}
                        options={requestContentModeOptions}
                        onValueChange={(value) =>
                          updateSelectedDataPondRequestContentMode(value as RequestContentMode)
                        }
                        className="w-full rounded-2xl bg-[#eef0e8] p-1"
                      />
                    </PanelField>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      <PanelSelectField
                        label="请求方法"
                        value={selectedDataPond.request.method}
                        options={selectedDataPondMethodOptions}
                        onValueChange={(value) =>
                          updateSelectedDataPondRequest("method", value as RequestMethod)
                        }
                      />
                      <NumberStepper
                        label="专属轮询"
                        description="优先级高于全局轮询。0 表示回落到全局频率。"
                        value={selectedDataPond.request.refreshInterval ?? 0}
                        min={0}
                        max={3600}
                        step={5}
                        unit="s"
                        onValueChange={(value) =>
                          updateSelectedDataPondRequest("refreshInterval", value)
                        }
                      />
                    </div>

                    {selectedDataPondRequestMode === "sql" ? (
                      <PanelField
                        label="SQL 语句"
                        description="SQL 模式固定使用 `sql` 字段，请确保服务端网关或拦截器按这个字段取值。"
                      >
                        <MonacoJsonEditor
                          height={220}
                          language="sql"
                          value={selectedDataPond.request.sql ?? ""}
                          onValueChange={(value) => updateSelectedDataPondRequest("sql", value)}
                        />
                      </PanelField>
                    ) : (
                      <PanelTextareaField
                        label="请求参数"
                        description="当前先保持 JSON 字符串输入，GET 会转 query，POST 会转 body。"
                        rows={6}
                        value={selectedDataPond.request.params ?? ""}
                        placeholder='例如：{"region":"全国","limit":12}'
                        onValueChange={(value) => updateSelectedDataPondRequest("params", value)}
                      />
                    )}

                    <PanelTextareaField
                      label="返回映射"
                      description="用于提取响应里的真正数据块，支持 `data.list` 或 `result[0].rows` 这类路径。"
                      rows={5}
                      value={selectedDataPond.request.responseMap ?? ""}
                      placeholder="例如：data.list"
                      onValueChange={(value) =>
                        updateSelectedDataPondRequest("responseMap", value)
                      }
                    />

                    <PanelField
                      label="JS Transformer"
                      description="映射后的结果会以 `payload` 变量传入。你可以直接修改 `payload`，或显式 `return` 一份新数据。"
                    >
                      <MonacoJsonEditor
                        height={220}
                        language="javascript"
                        value={selectedDataPond.request.transformer ?? ""}
                        onValueChange={(value) =>
                          updateSelectedDataPondRequest("transformer", value)
                        }
                      />
                    </PanelField>

                    {selectedDataPondRuntime?.status === "ready" ? (
                      <PanelField
                        label="运行态结果预览"
                        description="依次展示原始响应、返回映射后的结果，以及经过 JS Transformer 处理后的最终注入数据。"
                      >
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-[#727971]">原始响应</div>
                            <MonacoJsonEditor
                              height={160}
                              readOnly
                              value={formatJson(selectedDataPondRuntime.rawData)}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-[#727971]">映射结果</div>
                            <MonacoJsonEditor
                              height={160}
                              readOnly
                              value={formatJson(selectedDataPondRuntime.mappedData)}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-[#727971]">最终注入</div>
                            <MonacoJsonEditor
                              height={160}
                              readOnly
                              value={formatJson(selectedDataPondRuntime.data)}
                            />
                          </div>
                        </div>
                      </PanelField>
                    ) : null}

                    {selectedDataPondRuntime?.error ? (
                      <div className="rounded-2xl border border-[#d7d8d1] bg-[#fff7f3] px-4 py-3 text-sm leading-6 text-[#8a5a2b]">
                        当前数据池请求失败：{selectedDataPondRuntime.error}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-4 text-sm leading-6 text-[#727971]">
                当前还没有公共数据池。点击上方“新建”，就可以开始统一管理请求地址、轮询频率和返回映射了。
              </div>
            )}
          </CollapseSection>

          <CollapseSection
            title="画布全局滤镜"
            description="按 GoView 的画布级滤镜思路，把色相、饱和度、对比度和亮度统一作用到整个大屏。"
            badge="Filters"
            contentClassName="space-y-3"
          >
            <PanelField
              label="滤镜开关"
              description="关闭后会回到原始画布，不影响组件本身配置。"
            >
              <ToggleSwitch
                label="启用画布全局滤镜"
                checked={canvasPreview.filters.enabled}
                onCheckedChange={(checked) => updateCanvasFilter("enabled", checked)}
              />
            </PanelField>

            <PanelField
              label="一键预设"
              description="快速套用整套氛围参数，适合直接试风格。"
            >
              <div className="grid grid-cols-2 gap-3">
                {editorV2CanvasFilterPresets.map((preset) => {
                  const active =
                    canvasPreview.filters.enabled === preset.filters.enabled &&
                    canvasPreview.filters.hueRotate === preset.filters.hueRotate &&
                    canvasPreview.filters.saturate === preset.filters.saturate &&
                    canvasPreview.filters.contrast === preset.filters.contrast &&
                    canvasPreview.filters.brightness === preset.filters.brightness &&
                    canvasPreview.filters.opacity === preset.filters.opacity;

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyCanvasFilterPreset({ ...preset.filters })}
                      className={`rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                        active
                          ? "border-[#23422a] bg-[#eef5ec]"
                          : "border-[#d7d8d1] bg-white hover:border-[#23422a]/35 hover:bg-[#f6f7f1]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#1a1c19]">{preset.label}</div>
                      <div className="mt-1 text-xs leading-5 text-[#727971]">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </PanelField>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <NumberStepper
                label="色相"
                description="控制整体色偏，适合做赛博色调切换。"
                value={canvasPreview.filters.hueRotate}
                min={0}
                max={360}
                step={5}
                unit="deg"
                onValueChange={(value) => updateCanvasFilter("hueRotate", value)}
              />
              <NumberStepper
                label="饱和度"
                description="控制整体颜色浓度。"
                value={canvasPreview.filters.saturate}
                min={0}
                max={300}
                step={5}
                unit="%"
                onValueChange={(value) => updateCanvasFilter("saturate", value)}
              />
              <NumberStepper
                label="对比度"
                description="提高画面层次感。"
                value={canvasPreview.filters.contrast}
                min={0}
                max={300}
                step={5}
                unit="%"
                onValueChange={(value) => updateCanvasFilter("contrast", value)}
              />
              <NumberStepper
                label="亮度"
                description="控制整体明暗。"
                value={canvasPreview.filters.brightness}
                min={0}
                max={300}
                step={5}
                unit="%"
                onValueChange={(value) => updateCanvasFilter("brightness", value)}
              />
            </div>

            <NumberStepper
              label="画布透明度"
              description="全局透明度，和滤镜一起整体作用在画布。"
              value={canvasPreview.filters.opacity}
              min={0}
              max={100}
              step={5}
              unit="%"
              onValueChange={(value) => updateCanvasFilter("opacity", value)}
            />
          </CollapseSection>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
            当前选中
          </div>
          <div className="mt-3 text-lg font-bold text-[#1a1c19]">
            {selectedPackage.registration.titleZh}
          </div>
          <p className="mt-2 text-xs leading-5 text-[#727971]">
            定制 Tab 负责公共框架与组件专属配置，改动会直接写回全局 Zustand Store。
          </p>
        </div>

        <CollapseSection
          title="组件框架"
          description="位置和尺寸仍然保留在公共层，方便所有五件套组件共享同一套框架控制。"
          badge="Frame"
          contentClassName="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper
              label="X 坐标"
              value={selectedWidget.attr.x}
              min={0}
              max={canvasPreview.width}
              step={10}
              unit="px"
              onValueChange={(value) => updateSelectedAttr("x", value)}
            />
            <NumberStepper
              label="Y 坐标"
              value={selectedWidget.attr.y}
              min={0}
              max={canvasPreview.height}
              step={10}
              unit="px"
              onValueChange={(value) => updateSelectedAttr("y", value)}
            />
            <NumberStepper
              label="组件宽度"
              value={selectedWidget.attr.w}
              min={220}
              max={canvasPreview.width}
              step={10}
              unit="px"
              onValueChange={(value) => updateSelectedAttr("w", value)}
            />
            <NumberStepper
              label="组件高度"
              value={selectedWidget.attr.h}
              min={160}
              max={canvasPreview.height}
              step={10}
              unit="px"
              onValueChange={(value) => updateSelectedAttr("h", value)}
            />
          </div>
        </CollapseSection>

        <CollapseSection
          title="显示状态"
          description="先承接通用显隐与透明度，验证公共样式字段和画布渲染之间的联动。"
          badge="Public"
          contentClassName="space-y-3"
        >
          <NumberStepper
            label="透明度"
            description="直接映射共享样式 `styles.opacity`。"
            value={Math.round(selectedWidget.styles.opacity * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            onValueChange={(value) => updateSelectedStyles("opacity", value / 100)}
          />
          <ToggleSwitch
            label="在画布中隐藏"
            checked={selectedWidget.status.hidden}
            onCheckedChange={(checked) =>
              handleWidgetPatch({
                status: {
                  ...selectedWidget.status,
                  hidden: checked,
                },
              })
            }
          />
        </CollapseSection>

        {selectedWidget.group ? (
          <CollapseSection
            title="组合归属"
            description="当前组件已经在组合中。选中整组后可以一起移动，也可以在这里直接解组。"
            badge="Group"
            contentClassName="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="组合名称">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {selectedWidget.group.name}
                </div>
              </PanelField>
              <PanelField label="成员数量">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {widgets.filter((widget) => widget.group?.id === selectedWidget.group?.id).length} 项
                </div>
              </PanelField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectWidgets(getSelectionIdsForWidget(selectedWidget.id))}
                className="rounded-2xl border border-[#d7d8d1] bg-white px-3.5 py-3 text-sm font-semibold text-[#23422a] transition-colors hover:bg-[#f6f7f1]"
              >
                选中整组
              </button>
              <button
                type="button"
                onClick={handleUngroupSelection}
                className="rounded-2xl border border-[#23422a] bg-[#23422a] px-3.5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#31583b]"
              >
                解组
              </button>
            </div>
          </CollapseSection>
        ) : null}

        <selectedPackage.PanelComponent widget={selectedWidget} onUpdate={handleWidgetPatch} />
      </div>
    );
  };

  const renderAnimationPanel = () => {
    if (!selectedWidget || !selectedPackage) {
      return (
        <EmptyPanelState
          title="动画 Tab 已接通"
          description="请选择一个组件后继续配置。当前阶段先跑通通用入场与循环动效。"
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
            动画联调
          </div>
          <div className="mt-3 text-lg font-bold text-[#1a1c19]">
            {selectedPackage.registration.titleZh}
          </div>
          <p className="mt-2 text-xs leading-5 text-[#727971]">
            当前动画值存放在共享样式 `styles.animations`，画布外层会实时消费它做入场或循环效果。
          </p>
        </div>

        <CollapseSection
          title="动画预设"
          description="沿用 GoView 的单动画模式，一次只保存一个主效果。"
          badge="Motion"
          action={
            selectedAnimation ? (
              <button
                type="button"
                onClick={() => updateSelectedStyles("animations", [])}
                className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1 text-[11px] font-semibold text-[#727971] transition-colors hover:border-[#23422a] hover:text-[#23422a]"
              >
                清空
              </button>
            ) : null
          }
          contentClassName="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            {animationOptions.map((option) => {
              const active = option.value === selectedAnimation;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSelectedStyles("animations", [option.value])}
                  className={`rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? "border-[#23422a] bg-[#eef5ec] text-[#23422a]"
                      : "border-[#d7d8d1] bg-white text-[#1a1c19] hover:border-[#23422a]/35 hover:bg-[#f6f7f1]"
                  }`}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="mt-1 text-xs leading-5 text-[#727971]">
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CollapseSection>

        <CollapseSection
          title="当前状态"
          description="这里用来确认动画面板选择状态与画布表现保持一致。"
          badge="State"
          contentClassName="space-y-3"
        >
          <PanelField
            label="已生效动效"
            description={getAnimationDescription(selectedAnimation)}
          >
            <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
              {getAnimationLabel(selectedAnimation)}
            </div>
          </PanelField>
        </CollapseSection>
      </div>
    );
  };

  const renderDataPanel = () => {
    if (!selectedWidget || !selectedPackage) {
      return (
        <EmptyPanelState
          title="数据 Tab 已接通"
          description="请选择一个组件后继续配置。当前版本统一承接静态 JSON、字段映射与动态接口设定。"
        />
      );
    }

    const requestConfig = selectedWidget.dataSource.request ?? defaultRequestConfig;
    const requestContentMode = resolveRequestContentMode(requestConfig);
    const requestMethodSelectOptions =
      requestContentMode === "sql"
        ? [{ label: "POST", value: "POST" }]
        : requestMethodOptions;
    const xFieldOptions =
      selectedFieldMappingOptions.categoryFields.length > 0
        ? selectedFieldMappingOptions.categoryFields
        : [{ label: "暂无可映射字段", value: "" }];
    const yFieldOptions =
      selectedFieldMappingOptions.numericFields.length > 0
        ? selectedFieldMappingOptions.numericFields
        : [{ label: "暂无数值字段", value: "" }];
    const seriesFieldOptions =
      selectedFieldMappingOptions.allFields.length > 0
        ? [{ label: "不设置系列字段", value: "" }, ...selectedFieldMappingOptions.allFields]
        : [{ label: "暂无可映射字段", value: "" }];
    const xFieldValue =
      selectedWidget.chartFrame === ChartFrame.VCHART
        ? getSpecFieldValue(selectedWidget.spec, "xField")
        : "";
    const yFieldValue =
      selectedWidget.chartFrame === ChartFrame.VCHART
        ? getSpecFieldValue(selectedWidget.spec, "yField")
        : "";
    const seriesFieldValue =
      selectedWidget.chartFrame === ChartFrame.VCHART
        ? getSpecFieldValue(selectedWidget.spec, "seriesField")
        : "";

    return (
      <div className="space-y-3">
        <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
            数据联调
          </div>
          <div className="mt-3 text-lg font-bold text-[#1a1c19]">
            {selectedPackage.registration.titleZh}
          </div>
          <p className="mt-2 text-xs leading-5 text-[#727971]">
            这一版按 GoView 的数据态结构重组为「模式切换 + 数据映射 + 接口设定 +
            JSON 预览」，所有配置都直接写回 `widget.dataSource` 与 `widget.spec`。
          </p>
        </div>

        <CollapseSection
          title="数据源模式"
          description="先统一收口成静态 JSON 与动态请求两种模式，避免旧的多分支表单继续扩散。"
          badge="Source"
          contentClassName="space-y-3"
        >
          <PanelField
            label="模式切换"
            description="静态模式直接编辑当前组件的数据集；动态模式保留接口配置并切到只读预览。"
          >
            <Tabs
              value={currentDataMode}
              options={dataModeOptions}
              onValueChange={(value) => handleSelectedDataModeChange(value as DataSourceMode)}
              className="w-full rounded-2xl bg-[#eef0e8] p-1"
            />
          </PanelField>

          <div className="grid grid-cols-2 gap-3">
            <PanelField label="当前模式">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {currentDataMode === "request" ? "动态请求模式" : "静态 JSON 模式"}
              </div>
            </PanelField>
            <PanelField label="当前数据量">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {selectedDataSummary?.rowCount ?? 0} 行
              </div>
            </PanelField>
          </div>
        </CollapseSection>

        <CollapseSection
          title="数据映射区"
          description="字段映射直接绑定 `spec.xField / spec.yField / spec.seriesField`，不增加任何中间配置层。"
          badge="Mapping"
          contentClassName="space-y-3"
        >
          {selectedWidgetIsVChart ? (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <PanelSelectField
                  label="类目字段 (X)"
                  description="通常绑定类目、日期或名称字段。"
                  value={xFieldValue}
                  options={xFieldOptions}
                  onValueChange={(value) => updateSelectedFieldMapping("xField", value)}
                />
                <PanelSelectField
                  label="数值字段 (Y)"
                  description="通常绑定金额、数量、比率等连续数值。"
                  value={yFieldValue}
                  options={yFieldOptions}
                  onValueChange={(value) => updateSelectedFieldMapping("yField", value)}
                />
              </div>
              <PanelSelectField
                label="系列字段"
                description="用于多系列图表；如暂不需要，可保持“不设置系列字段”。"
                value={seriesFieldValue}
                options={seriesFieldOptions}
                onValueChange={(value) => updateSelectedFieldMapping("seriesField", value)}
              />
              <PanelField
                label="可识别字段"
                description="字段来源于当前 `spec.data` 的首条数据记录，可直接辅助完成字段映射。"
              >
                <div className="flex flex-wrap gap-2">
                  {(selectedDataSummary?.fields ?? []).length > 0 ? (
                    selectedDataSummary?.fields.map((field) => (
                      <span
                        key={field}
                        className="rounded-full border border-[#d7d8d1] bg-[#fafaf5] px-2.5 py-1 text-[11px] font-semibold text-[#727971]"
                      >
                        {field}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#727971]">当前还没有可识别的字段。</span>
                  )}
                </div>
              </PanelField>
            </>
          ) : (
            <PanelField
              label="当前组件类型"
              description="这一轮先优先服务图表类组件，后续地图与表格会复用同一套数据映射外壳。"
            >
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm text-[#727971]">
                当前组件暂不支持字段映射直绑，但仍可沿用下方的 JSON 预览和接口配置结构。
              </div>
            </PanelField>
          )}
        </CollapseSection>

        {currentDataMode === "request" ? (
          <CollapseSection
            title="公共数据池订阅"
            description="动态模式下组件不再自己维护 API 表单，而是通过数据池 ID 订阅全局请求。"
            badge="Pond"
            contentClassName="space-y-3"
          >
            <PanelSelectField
              label="绑定数据池"
              description="选中后会直接把当前组件绑定到对应的数据池。"
              value={selectedWidget.dataSource.dataPondId ?? ""}
              options={
                dataPonds.length > 0
                  ? [
                      { label: "不绑定数据池", value: "" },
                      ...dataPonds.map((dataPond) => ({
                        label: dataPond.name,
                        value: dataPond.id,
                      })),
                    ]
                  : [{ label: "当前还没有可绑定的数据池", value: "" }]
              }
              onValueChange={(value) => {
                updateSelectedDataSource("dataPondId", value || undefined);
                if (value) {
                  setSelectedDataPondId(value);
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <PanelField label="当前状态">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {selectedWidgetDataPond
                    ? getDataPondStatusLabel(selectedWidgetDataPondRuntime)
                    : "未绑定"}
                </div>
              </PanelField>
              <PanelField label="已绑定数据池">
                <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                  {selectedWidgetDataPond?.name ?? "未选择"}
                </div>
              </PanelField>
            </div>

            {selectedWidgetDataPond ? (
              <>
                <PanelField
                  label="订阅详情"
                  description="这里展示的是当前组件正在消费的数据池信息，真正的接口配置请到页面态的“公共数据池”里维护。"
                >
                <div className="space-y-2 rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-3 text-sm leading-6 text-[#727971]">
                  <div>请求地址：{selectedWidgetDataPond.request.url || "未填写"}</div>
                  <div>请求模式：{getRequestContentModeLabel(selectedWidgetDataPond.request)}</div>
                  <div>请求方法：{selectedWidgetDataPond.request.method}</div>
                  {resolveRequestContentMode(selectedWidgetDataPond.request) === "sql" ? (
                    <div>SQL 语句：{selectedWidgetDataPond.request.sql?.trim() || "未填写"}</div>
                  ) : null}
                  <div>
                    JS 转换器：
                    {selectedWidgetDataPond.request.transformer?.trim() ? "已配置" : "未配置"}
                  </div>
                  <div>
                    轮询频率：
                      {(selectedWidgetDataPond.request.refreshInterval ?? 0) > 0
                        ? `${selectedWidgetDataPond.request.refreshInterval} 秒`
                        : `跟随全局 (${dataPondSettings.pollingInterval} 秒)`}
                    </div>
                    <div>
                      最近更新：
                      {selectedWidgetDataPondRuntime?.updatedAt
                        ? new Date(selectedWidgetDataPondRuntime.updatedAt).toLocaleTimeString(
                            "zh-CN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            },
                          )
                        : "暂无"}
                    </div>
                  </div>
                </PanelField>

                {selectedWidgetDataPondRuntime?.error ? (
                  <div className="rounded-2xl border border-[#d7d8d1] bg-[#fff7f3] px-4 py-3 text-sm leading-6 text-[#8a5a2b]">
                    当前订阅的数据池请求失败：{selectedWidgetDataPondRuntime.error}
                  </div>
                ) : null}
              </>
            ) : null}

            {requestConfig.url ? (
              <PanelField
                label="旧版接口配置"
                description="当前组件里仍保留旧的局部请求配置，仅作为兼容信息展示。建议迁移到公共数据池后统一维护。"
              >
                <div className="space-y-2 rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-3 text-sm leading-6 text-[#727971]">
                  <div>请求地址：{requestConfig.url}</div>
                  <div>请求模式：{getRequestContentModeLabel(requestConfig)}</div>
                  <div>请求方法：{requestConfig.method}</div>
                  {requestContentMode === "sql" ? (
                    <div>SQL 语句：{requestConfig.sql?.trim() || "未填写"}</div>
                  ) : null}
                  <div>JS 转换器：{requestConfig.transformer?.trim() ? "已配置" : "未配置"}</div>
                  <div>刷新间隔：{requestConfig.refreshInterval ?? 0} 秒</div>
                </div>
              </PanelField>
            ) : null}

            {dataPonds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-4 text-sm leading-6 text-[#727971]">
                当前还没有公共数据池，先去页面态新建一个，或者直接点击下面这个按钮创建并自动绑定。
                <button
                  type="button"
                  onClick={handleCreateAndBindDataPond}
                  className="mt-3 inline-flex rounded-full border border-[#23422a] bg-[#23422a] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#31583b]"
                >
                  新建并绑定
                </button>
              </div>
            ) : null}
          </CollapseSection>
        ) : null}

        {currentDataMode === "request" &&
        Boolean(requestConfig.url.trim()) &&
        !selectedWidget.dataSource.dataPondId ? (
          <CollapseSection
            title="动态接口设定面板"
            description="接口信息直接挂在 `widget.dataSource.request`，后续接真实执行器时无需再改结构。"
            badge="API"
            contentClassName="space-y-3"
          >
            <PanelInputField
              label="请求地址"
              description="建议填写实际业务接口或网关地址。"
              value={requestConfig.url}
              placeholder="https://api.example.com/chart"
              onValueChange={(value) => updateSelectedRequestConfig("url", value)}
            />
            <PanelField
              label="请求模式"
              description="普通请求保留参数输入；SQL 模式会把 SQL 语句作为 `{ sql: string }` 报文发送。"
            >
              <Tabs
                value={requestContentMode}
                options={requestContentModeOptions}
                onValueChange={(value) => updateSelectedRequestContentMode(value as RequestContentMode)}
                className="w-full rounded-2xl bg-[#eef0e8] p-1"
              />
            </PanelField>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <PanelSelectField
                label="请求方法"
                value={requestConfig.method}
                options={requestMethodSelectOptions}
                onValueChange={(value) =>
                  updateSelectedRequestConfig("method", value as RequestMethod)
                }
              />
              <NumberStepper
                label="刷新间隔"
                description="单位为秒，0 表示仅初始化时使用。"
                value={requestConfig.refreshInterval ?? 0}
                min={0}
                max={3600}
                step={5}
                unit="s"
                onValueChange={(value) => updateSelectedRequestConfig("refreshInterval", value)}
              />
            </div>
            {requestContentMode === "sql" ? (
              <PanelField
                label="SQL 语句"
                description="组件本地兼容配置同样支持 SQL 模式，后续迁移到公共数据池时会保留这段语句。"
              >
                <MonacoJsonEditor
                  height={220}
                  language="sql"
                  value={requestConfig.sql ?? ""}
                  onValueChange={(value) => updateSelectedRequestConfig("sql", value)}
                />
              </PanelField>
            ) : (
              <PanelTextareaField
                label="请求参数"
                description="当前阶段先保留为 JSON 字符串，后面会升级成结构化参数编辑器。"
                rows={6}
                value={requestConfig.params ?? ""}
                placeholder='例如：{"region":"华东","limit":12}'
                onValueChange={(value) => updateSelectedRequestConfig("params", value)}
              />
            )}
            <PanelTextareaField
              label="返回映射"
              description="描述接口响应中哪一段数据应被映射为当前组件的数据集。"
              rows={5}
              value={requestConfig.responseMap ?? ""}
              placeholder="例如：data.list -> spec.data[0].values"
              onValueChange={(value) => updateSelectedRequestConfig("responseMap", value)}
            />
            <PanelField
              label="JS Transformer"
              description="这里先保存兼容请求配置的前端转换逻辑。真正执行仍建议迁移到公共数据池统一维护。"
            >
              <MonacoJsonEditor
                height={220}
                language="javascript"
                value={requestConfig.transformer ?? ""}
                onValueChange={(value) => updateSelectedRequestConfig("transformer", value)}
              />
            </PanelField>
          </CollapseSection>
        ) : null}

        <CollapseSection
          title="JSON 预览区"
          description="静态模式下直接编辑并回写当前图表数据；动态模式下展示当前结构预览，帮助核对接口映射。"
          badge="Preview"
          contentClassName="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <PanelField label="数据行数">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {selectedDataSummary?.rowCount ?? 0} 行
              </div>
            </PanelField>
            <PanelField label="字段数量">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {selectedDataSummary?.fields.length ?? 0} 个
              </div>
            </PanelField>
          </div>

          {currentDataMode === "request" ? (
            <>
              <PanelField
                label="请求结果预览"
                description={
                  selectedWidget.dataSource.dataPondId
                    ? "这里展示当前公共数据池的运行态预览；会依次呈现原始结果、映射结果和最终注入结果。"
                    : "当前组件还没有绑定公共数据池，因此这里只能展示本地兼容配置对应的结果预览。"
                }
              >
                {selectedWidget.dataSource.dataPondId ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#727971]">原始响应</div>
                      <MonacoJsonEditor
                        height={160}
                        readOnly
                        value={formatJson(selectedWidgetDataPondRuntime?.rawData ?? selectedDatasetState?.values ?? [])}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#727971]">映射结果</div>
                      <MonacoJsonEditor
                        height={160}
                        readOnly
                        value={formatJson(selectedWidgetDataPondRuntime?.mappedData ?? selectedDatasetState?.values ?? [])}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#727971]">最终注入</div>
                      <MonacoJsonEditor height={180} readOnly value={requestPreviewValue} />
                    </div>
                  </div>
                ) : (
                  <MonacoJsonEditor height={320} readOnly value={requestPreviewValue} />
                )}
              </PanelField>
              <div className="rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-3 text-sm leading-6 text-[#727971]">
                {selectedWidget.dataSource.dataPondId
                  ? `当前展示的是${selectedWidgetDataPond ? getRequestContentModeLabel(selectedWidgetDataPond.request) : "动态请求"}的实时结果。若配置了 JS Transformer，最终注入结果会以第三段预览为准。`
                  : "当前组件仍在使用本地兼容请求配置，建议迁移到公共数据池后再做真实请求联调。"}
              </div>
            </>
          ) : (
            <>
              <PanelField
                label="静态 JSON 编辑"
                description="直接编辑当前组件的数据集。JSON 合法且顶层为数组时，会同步回写 `spec.data`。"
              >
                <MonacoJsonEditor
                  height={360}
                  value={staticJsonEditorState?.value ?? "[]"}
                  onValueChange={updateStaticJsonDraft}
                />
              </PanelField>

              {staticJsonEditorState?.error ? (
                <div className="rounded-2xl border border-[#d7d8d1] bg-[#fff7f3] px-4 py-3 text-sm leading-6 text-[#8a5a2b]">
                  JSON 校验未通过：{staticJsonEditorState.error}
                </div>
              ) : null}

              {!staticJsonEditorState?.error &&
              staticJsonEditorState &&
              !staticJsonEditorState.isArrayValue ? (
                <div className="rounded-2xl border border-[#d7d8d1] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#8a5a2b]">
                  当前 JSON 语法合法，但顶层需要是数组，才能同步回写到图表数据集。
                </div>
              ) : null}

              {!staticJsonEditorState?.error && staticJsonEditorState?.isArrayValue ? (
                <div className="rounded-2xl border border-[#d7d8d1] bg-[#f6f8f1] px-4 py-3 text-sm leading-6 text-[#4c5a46]">
                  当前静态数据已通过校验，编辑器会把这份 JSON 直接作为组件当前数据集。
                </div>
              ) : null}
            </>
          )}
        </CollapseSection>
      </div>
    );
  };

  const renderEventsPanel = () => {
    if (!selectedWidget || !selectedPackage) {
      return (
        <EmptyPanelState
          title="事件 Tab 已接通"
          description="请选择一个组件后继续配置。当前阶段先跑通常用点击动作。"
        />
      );
    }

    const action = selectedWidget.events.action ?? "none";

    return (
      <div className="space-y-3">
        <div className="rounded-[24px] border border-[#d7d8d1] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(26,28,25,0.04)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
            事件联调
          </div>
          <div className="mt-3 text-lg font-bold text-[#1a1c19]">
            {selectedPackage.registration.titleZh}
          </div>
          <p className="mt-2 text-xs leading-5 text-[#727971]">
            这里先接通最常用的点击动作，为后续预览页和展示页的统一执行器留入口。
          </p>
        </div>

        <CollapseSection
          title="基础动作"
          description="先打通无动作、打开链接、跳转预览页和聚焦组件。"
          badge="Action"
          contentClassName="space-y-3"
        >
          <PanelSelectField
            label="点击动作"
            value={action}
            options={eventActionOptions}
            onValueChange={(value) => updateSelectedEvents("action", value as Widget["events"]["action"])}
          />

          {action === "openLink" ? (
            <>
              <PanelInputField
                label="目标链接"
                value={selectedWidget.events.url ?? ""}
                placeholder="https://example.com/dashboard"
                onValueChange={(value) => updateSelectedEvents("url", value)}
              />
              <PanelSelectField
                label="打开方式"
                value={selectedWidget.events.openMode ?? "self"}
                options={openModeOptions}
                onValueChange={(value) =>
                  updateSelectedEvents("openMode", value as Widget["events"]["openMode"])
                }
              />
            </>
          ) : null}

          {action === "focusWidget" ? (
            <PanelSelectField
              label="目标组件"
              description="当前先支持单目标聚焦，后续会扩展成更完整的联动链。"
              value={selectedWidget.events.targetWidgetId ?? ""}
              options={
                targetWidgetOptions.length > 0
                  ? targetWidgetOptions
                  : [{ label: "当前没有可聚焦的其他组件", value: "" }]
              }
              onValueChange={(value) => updateSelectedEvents("targetWidgetId", value)}
            />
          ) : null}

          {action === "openPreview" ? (
            <PanelField
              label="预览跳转"
              description="当前只保存动作意图，后续运行时会接入真实预览路由。"
            >
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm text-[#727971]">
                已记录为“跳转预览页”，后续运行态将统一读取并执行。
              </div>
            </PanelField>
          ) : null}
        </CollapseSection>

        <CollapseSection
          title="组件标识"
          description="辅助联调事件目标和运行时识别。"
          badge="Meta"
          contentClassName="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <PanelField label="组件 ID">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {selectedWidget.id}
              </div>
            </PanelField>
            <PanelField label="注册键">
              <div className="rounded-xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-3 py-3 text-sm font-semibold text-[#1a1c19]">
                {selectedWidget.registrationKey}
              </div>
            </PanelField>
          </div>
        </CollapseSection>
      </div>
    );
  };

  const panelContent =
    activeTab === "customize"
      ? renderCustomizePanel()
      : activeTab === "animation"
        ? renderAnimationPanel()
        : activeTab === "data"
          ? renderDataPanel()
          : renderEventsPanel();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafaf5] text-[#1a1c19]">
      <input
        ref={workspaceImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleWorkspaceImport}
      />
      <header className="z-20 flex h-16 items-center justify-between border-b border-[#d7d8d1] bg-[#fafaf5] px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/projects`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7d8d1] bg-white text-[#23422a] transition-colors hover:bg-[#f7f8f2]"
            aria-label="返回项目列表"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-black tracking-[0.28em] text-[#23422a]">JAMINVIEW</div>
              <span className="rounded-full border border-[#23422a]/14 bg-[#23422a]/8 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#23422a]">
                V2
              </span>
              <span className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#23422a]">
                {getSaveStatusLabel(saveState, lastSavedAt)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#727971]">
              <span className="font-semibold text-[#1a1c19]">{resolvedProjectTitle}</span>
              <span>组件 {widgets.length}</span>
              <span>已选 {selectedIds.length}</span>
              {workspaceTransferState ? (
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] ${
                    workspaceTransferState.status === "success"
                      ? "border-[#23422a]/18 bg-[#eef5ec] text-[#23422a]"
                      : "border-[#d8b692] bg-[#fff7f3] text-[#8a5a2b]"
                  }`}
                >
                  {workspaceTransferState.kind === "import" ? "最近导入" : "最近导出"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton disabled={!canUndo} onClick={undo}>
            <RotateCcw className="h-4 w-4" />
            <span>撤销</span>
          </ToolbarButton>
          <ToolbarButton disabled={!canRedo} onClick={redo}>
            <Redo2 className="h-4 w-4" />
            <span>重做</span>
          </ToolbarButton>
          <ToolbarButton disabled={!canGroupSelection} onClick={handleGroupSelection}>
            <span>打组</span>
          </ToolbarButton>
          <ToolbarButton disabled={!canUngroupSelection} onClick={handleUngroupSelection}>
            <span>解组</span>
          </ToolbarButton>
          <ToolbarButton onClick={handleOpenWorkspaceImport}>
            <Upload className="h-4 w-4" />
            <span>导入</span>
          </ToolbarButton>
          <ToolbarButton onClick={handleWorkspaceExport}>
            <Download className="h-4 w-4" />
            <span>导出</span>
          </ToolbarButton>
          <ToolbarButton onClick={handleSaveWorkspace}>
            <Save className="h-4 w-4" />
            <span>保存</span>
          </ToolbarButton>
          <ToolbarButton onClick={handlePreviewWorkspace}>
            <Eye className="h-4 w-4" />
            <span>预览</span>
          </ToolbarButton>
          <ToolbarButton variant="primary" onClick={handlePublishWorkspace}>
            <SendHorizontal className="h-4 w-4" />
            <span>发布</span>
          </ToolbarButton>
        </div>
      </header>
      <header className="hidden">
        <div className="flex items-center gap-4">
          <div className="text-sm font-black tracking-[0.28em] text-[#23422a]">JAMINVIEW</div>
          <span className="rounded-full border border-[#23422a]/14 bg-[#23422a]/8 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#23422a]">
            V2
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#727971]">
          <span className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1.5">
            组件 {widgets.length}
          </span>
          <span className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1.5">
            已选 {selectedIds.length}
          </span>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <aside className="z-10 flex w-80 flex-col border-r border-[#d7d8d1] bg-[#fafaf5] shadow-[2px_0_12px_rgba(26,28,25,0.02)]">
          <div className="border-b border-[#d7d8d1]/60 px-5 py-4">
            <h2 className="text-sm font-bold text-[#1a1c19]">组件池</h2>
            <p className="mt-1 text-xs leading-5 text-[#727971]">
              当前组件池已由注册表驱动。点击或拖拽卡片都可以把组件加入画布。
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {packageGroups.map((group) => (
              <CollapseSection
                key={group.category}
                title={group.title}
                description={`当前分组已注册 ${group.packages.length} 个组件包。`}
                badge={`${group.packages.length} 项`}
                contentClassName="space-y-2"
              >
                {group.packages.map((pkg) => (
                  <button
                    key={pkg.registration.key}
                    type="button"
                    onClick={() => handleAddWidget(pkg)}
                    draggable
                    onDragStart={(event) => handlePackageDragStart(event, pkg)}
                    onDragEnd={handlePackageDragEnd}
                    className={`group flex w-full flex-col gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left transition-colors ${
                      draggingPackageKey === pkg.registration.key
                        ? "border-[#23422a] bg-[#f6f7f1]"
                        : "border-[#d7d8d1] hover:border-[#23422a]/35 hover:bg-[#f6f7f1]"
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-[#d7d8d1] bg-[linear-gradient(180deg,#ffffff_0%,#f4f6ef_100%)]">
                      {pkg.registration.thumbnail ? (
                        <Image
                          src={pkg.registration.thumbnail}
                          alt={`${pkg.registration.titleZh} 缩略图`}
                          className="h-28 w-full object-contain px-3 py-3 transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(35,66,42,0.16),transparent_58%),linear-gradient(180deg,#fbfcf8_0%,#eef2ea_100%)]">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#23422a] text-xl text-white">
                            {pkg.registration.icon}
                          </span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
                        <span className="rounded-full border border-[#d7d8d1] bg-white/92 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#23422a] shadow-sm">
                          PNG
                        </span>
                        <span className="rounded-full border border-[#d7d8d1] bg-white/92 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#727971] shadow-sm">
                          拖拽添加
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#23422a] text-lg text-white">
                        {pkg.registration.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#1a1c19]">
                          {pkg.registration.titleZh}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#727971]">
                          {pkg.registration.noteZh ?? "已注册到 V2 编辑器。"}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </CollapseSection>
            ))}
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(67,98,74,0.14),transparent_24%),linear-gradient(180deg,#eef2ea_0%,#e8eee5_100%)]">
          <div className="absolute left-0 right-0 top-0 h-7 border-b border-[#d7d8d1] bg-[#fafaf5]/92 backdrop-blur" />
          <div className="absolute bottom-0 left-0 top-0 w-7 border-r border-[#d7d8d1] bg-[#fafaf5]/92 backdrop-blur" />

          <div className="absolute inset-0 flex items-center justify-center overflow-auto px-8 pb-8 pt-10">
            <div
              ref={canvasRef}
              className="relative rounded-[30px] bg-white shadow-[0_28px_70px_rgba(26,28,25,0.12)] ring-1 ring-[#d7d8d1]"
              style={{
                width: canvasPreview.width,
                height: canvasPreview.height,
                transform: `scale(${canvasScale})`,
                transformOrigin: "center",
                ...canvasFilterStyle,
              }}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              onDragLeave={handleCanvasDragLeave}
              onClick={() => {
                setDragPreviewPositions(null);
                clearSelection();
              }}
            >
              {canvasPreview.showGrid ? (
                <div className="absolute inset-0 bg-[radial-gradient(#cbd1c8_1px,transparent_1px)] [background-size:24px_24px] opacity-45" />
              ) : null}

              {canvasPreview.showSafeArea ? (
                <div className="pointer-events-none absolute inset-[88px] rounded-[28px] border border-dashed border-[#23422a]/40" />
              ) : null}

              {activeGroupFrames.map((frame) => (
                <div
                  key={frame.id}
                  className="pointer-events-none absolute rounded-[28px] border-2 border-dashed border-[#23422a]/55 bg-[#23422a]/6"
                  style={{
                    left: frame.x - 8,
                    top: frame.y - 8,
                    width: frame.width + 16,
                    height: frame.height + 16,
                  }}
                >
                  <div className="absolute left-3 top-3 rounded-full border border-[#23422a]/20 bg-white/96 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#23422a] shadow-sm">
                    {frame.label}
                  </div>
                </div>
              ))}

              {dropIndicator ? (
                <div
                  className="pointer-events-none absolute rounded-[24px] border-2 border-dashed border-[#23422a] bg-[#23422a]/8 shadow-[0_18px_40px_rgba(35,66,42,0.12)]"
                  style={{
                    left: dropIndicator.x,
                    top: dropIndicator.y,
                    width: dropIndicator.width,
                    height: dropIndicator.height,
                  }}
                >
                  <div className="absolute left-3 top-3 rounded-full border border-[#23422a]/20 bg-white/94 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#23422a]">
                    放置 {dropIndicator.title}
                  </div>
                </div>
              ) : null}

              <div className="absolute left-8 top-8 rounded-full border border-[#d7d8d1] bg-[#fafaf5] px-3 py-1.5 text-[12px] font-semibold text-[#23422a] shadow-sm">
                {canvasPreview.width} x {canvasPreview.height}
              </div>

              <div className="absolute right-8 top-8 rounded-full border border-[#d7d8d1] bg-white/92 px-3 py-1.5 text-[12px] font-medium text-[#727971]">
                缩放 {canvasPreview.zoom}%
              </div>

              {orderedWidgets.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="max-w-[560px] rounded-[34px] border border-[#d7d8d1] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,249,243,0.92))] px-10 py-12 text-center shadow-[0_18px_40px_rgba(26,28,25,0.06)]">
                    <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#23422a]">
                      V2 工作台已就绪
                    </div>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#1a1c19]">
                      从左侧选择图表开始搭建画布
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-[#727971]">
                      当前版本已经打通注册表、组件五件套、画布渲染、右侧四大 Tab，以及静态/API
                      两态的数据面板结构。
                    </p>
                  </div>
                </div>
              ) : null}

              {orderedWidgets.map((widget) => {
                const pkg = registry.getPackage(widget.registrationKey);
                if (!pkg || widget.status.hidden) {
                  return null;
                }

                const active = selectedIds.includes(widget.id);
                const position = getDisplayPosition(widget, dragPreviewPositions);

                return (
                  <div
                    key={widget.id}
                    className={`absolute overflow-hidden rounded-[24px] border bg-white shadow-[0_12px_30px_rgba(26,28,25,0.08)] transition-shadow ${
                      active
                        ? "border-[#23422a] ring-2 ring-[#23422a]/25"
                        : "border-[#d7d8d1] hover:shadow-[0_16px_34px_rgba(26,28,25,0.12)]"
                    } ${widget.status.locked ? "cursor-not-allowed" : "cursor-move"}`}
                    style={{
                      left: position.x,
                      top: position.y,
                      width: widget.attr.w,
                      height: widget.attr.h,
                      zIndex: widget.attr.zIndex,
                      opacity: widget.styles.opacity,
                      animation: resolveWidgetAnimation(widget.styles.animations),
                    }}
                    onPointerDown={(event) => handleWidgetPointerDown(widget.id, event)}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectWidgets(
                        getSelectionIdsForWidget(widget.id),
                        event.shiftKey || event.metaKey || event.ctrlKey,
                      );
                    }}
                  >
                    <div className="absolute left-3 top-3 z-10 rounded-full border border-[#d7d8d1] bg-white/92 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#23422a] shadow-sm">
                      {pkg.registration.titleZh}
                    </div>
                    {widget.group ? (
                      <div className="absolute right-3 top-3 z-10 rounded-full border border-[#23422a]/12 bg-[#23422a]/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#23422a] shadow-sm">
                        {widget.group.name}
                      </div>
                    ) : null}
                    <pkg.RenderComponent widget={widget} width={widget.attr.w} height={widget.attr.h} />
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="z-10 flex w-[380px] flex-col border-l border-[#d7d8d1] bg-[#fafaf5] shadow-[-2px_0_12px_rgba(26,28,25,0.02)]">
          <div className="grid h-12 grid-cols-4 border-b border-[#d7d8d1]">
            {panelTabs.map((tab) => {
              const active = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-[#23422a] bg-white/72 text-[#23422a]"
                      : "border-transparent text-[#727971] hover:text-[#1a1c19]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4">{panelContent}</div>
        </aside>
      </div>
    </div>
  );
}
