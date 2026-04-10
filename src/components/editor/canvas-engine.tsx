"use client";

import * as React from "react";

import { Rnd } from "react-rnd";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import {
  resolveEditorV2CanvasFilterStyle,
  type EditorV2CanvasFilters,
} from "@/lib/editor-v2-canvas-filters";
import { registry } from "@/packages/registry";
import {
  type Widget,
  type WidgetAnimationPreset,
  type WidgetPatch,
  type WidgetPackage,
} from "@/packages/types";

export const CANVAS_GRID_SIZE = 24;
export const MIN_CANVAS_ZOOM = 20;
export const MAX_CANVAS_ZOOM = 300;

const MIN_CANVAS_SCALE = MIN_CANVAS_ZOOM / 100;
const MAX_CANVAS_SCALE = MAX_CANVAS_ZOOM / 100;
const MIN_WIDGET_WIDTH = 96;
const MIN_WIDGET_HEIGHT = 72;

type CanvasEngineCanvasState = {
  filters: EditorV2CanvasFilters;
  width: number;
  height: number;
  zoom: number;
  showGrid: boolean;
  showSafeArea: boolean;
  snapToGrid: boolean;
};

type CanvasPoint = {
  x: number;
  y: number;
};

type DropIndicator = {
  height: number;
  title: string;
  width: number;
  x: number;
  y: number;
};

type WidgetLayout = {
  h: number;
  w: number;
  x: number;
  y: number;
};

type ActiveWidgetDrag = {
  anchorId: string;
  maxBottom: number;
  maxRight: number;
  minLeft: number;
  minTop: number;
  originLayouts: Record<string, WidgetLayout>;
  widgetIds: string[];
};

type SelectionMouseEvent = {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  stopPropagation: () => void;
};

type CanvasEngineProps = {
  canvas: CanvasEngineCanvasState;
  widgets: Widget[];
  selectedIds: string[];
  draggingRegistrationKey?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  expandSelectionIds: (ids: string[]) => string[];
  getSelectionIdsForWidget: (widgetId: string) => string[];
  onClearSelection: () => void;
  onPackageDrop: (registrationKey: string, position: CanvasPoint) => void;
  onSelectWidgets: (ids: string[], multi?: boolean) => void;
  onUpdateWidget: (id: string, patch: WidgetPatch) => void;
  onUpdateWidgets: (patches: Array<{ id: string; patch: WidgetPatch }>) => void;
  onZoomChange?: (zoom: number) => void;
};

function clampNumber(value: number, min: number, max: number) {
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

function sanitizeCanvasScale(scale: number) {
  return clampNumber(scale, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);
}

function sanitizeCanvasZoom(zoom: number) {
  return clampNumber(Math.round(zoom), MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
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

function getWidgetLayout(
  widget: Widget,
  draftLayouts: Record<string, WidgetLayout> | null,
): WidgetLayout {
  const draftLayout = draftLayouts?.[widget.id];

  return {
    x: draftLayout?.x ?? widget.attr.x,
    y: draftLayout?.y ?? widget.attr.y,
    w: draftLayout?.w ?? widget.attr.w,
    h: draftLayout?.h ?? widget.attr.h,
  };
}

function getSelectionBounds(
  widgets: Widget[],
  draftLayouts: Record<string, WidgetLayout> | null,
) {
  if (widgets.length === 0) {
    return null;
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  widgets.forEach((widget) => {
    const layout = getWidgetLayout(widget, draftLayouts);
    left = Math.min(left, layout.x);
    top = Math.min(top, layout.y);
    right = Math.max(right, layout.x + layout.w);
    bottom = Math.max(bottom, layout.y + layout.h);
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

function resolveDroppedPosition(
  pkg: WidgetPackage,
  point: CanvasPoint,
  canvas: CanvasEngineCanvasState,
) {
  const maxX = Math.max(0, canvas.width - pkg.registration.defaultWidth);
  const maxY = Math.max(0, canvas.height - pkg.registration.defaultHeight);
  const rawX = point.x - pkg.registration.defaultWidth / 2;
  const rawY = point.y - pkg.registration.defaultHeight / 2;

  return {
    x: clampNumber(
      canvas.snapToGrid ? snapToGrid(rawX, CANVAS_GRID_SIZE) : Math.round(rawX),
      0,
      maxX,
    ),
    y: clampNumber(
      canvas.snapToGrid ? snapToGrid(rawY, CANVAS_GRID_SIZE) : Math.round(rawY),
      0,
      maxY,
    ),
  };
}

const activeResizeHandleStyles = {
  bottom: {
    bottom: -6,
    cursor: "s-resize",
    height: 12,
    left: "50%",
    marginLeft: -18,
    width: 36,
  },
  bottomLeft: {
    backgroundColor: "#ffffff",
    border: "2px solid #23422a",
    borderRadius: 999,
    bottom: -6,
    cursor: "sw-resize",
    height: 12,
    left: -6,
    width: 12,
  },
  bottomRight: {
    backgroundColor: "#ffffff",
    border: "2px solid #23422a",
    borderRadius: 999,
    bottom: -6,
    cursor: "se-resize",
    height: 12,
    right: -6,
    width: 12,
  },
  left: {
    cursor: "w-resize",
    height: 36,
    left: -6,
    marginTop: -18,
    top: "50%",
    width: 12,
  },
  right: {
    cursor: "e-resize",
    height: 36,
    marginTop: -18,
    right: -6,
    top: "50%",
    width: 12,
  },
  top: {
    cursor: "n-resize",
    height: 12,
    left: "50%",
    marginLeft: -18,
    top: -6,
    width: 36,
  },
  topLeft: {
    backgroundColor: "#ffffff",
    border: "2px solid #23422a",
    borderRadius: 999,
    cursor: "nw-resize",
    height: 12,
    left: -6,
    top: -6,
    width: 12,
  },
  topRight: {
    backgroundColor: "#ffffff",
    border: "2px solid #23422a",
    borderRadius: 999,
    cursor: "ne-resize",
    height: 12,
    right: -6,
    top: -6,
    width: 12,
  },
} satisfies NonNullable<React.ComponentProps<typeof Rnd>["resizeHandleStyles"]>;

export function CanvasEngine({
  canvas,
  widgets,
  selectedIds,
  draggingRegistrationKey = null,
  emptyTitle = "暂无组件",
  emptyDescription = "从左侧拖入组件，或双击卡片把图表添加到画布中央。",
  expandSelectionIds,
  getSelectionIdsForWidget,
  onClearSelection,
  onPackageDrop,
  onSelectWidgets,
  onUpdateWidget,
  onUpdateWidgets,
  onZoomChange,
}: CanvasEngineProps) {
  const transformRef = React.useRef<ReactZoomPanPinchRef | null>(null);
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const activeWidgetDragRef = React.useRef<ActiveWidgetDrag | null>(null);
  const pendingSelectionRef = React.useRef<string[] | null>(null);
  const lastReportedZoomRef = React.useRef<number>(sanitizeCanvasZoom(canvas.zoom));

  const [dropIndicator, setDropIndicator] = React.useState<DropIndicator | null>(null);
  const [draftLayouts, setDraftLayouts] =
    React.useState<Record<string, WidgetLayout> | null>(null);
  const [transformState, setTransformState] = React.useState({
    positionX: 0,
    positionY: 0,
    scale: sanitizeCanvasScale(canvas.zoom / 100),
  });

  const widgetMap = React.useMemo(
    () => new Map(widgets.map((widget) => [widget.id, widget])),
    [widgets],
  );
  const orderedWidgets = React.useMemo(
    () => [...widgets].sort((left, right) => left.attr.zIndex - right.attr.zIndex),
    [widgets],
  );
  const visibleWidgets = React.useMemo(
    () => orderedWidgets.filter((widget) => !widget.status.hidden),
    [orderedWidgets],
  );
  const canvasFilterStyle = React.useMemo(
    () => resolveEditorV2CanvasFilterStyle(canvas.filters),
    [canvas.filters],
  );
  const activeGroupFrames = React.useMemo(() => {
    const groups = new Map<string, Widget[]>();

    orderedWidgets.forEach((widget) => {
      if (!selectedIds.includes(widget.id) || widget.status.hidden || !widget.group) {
        return;
      }

      const currentWidgets = groups.get(widget.group.id);
      if (currentWidgets) {
        currentWidgets.push(widget);
        return;
      }

      groups.set(
        widget.group.id,
        orderedWidgets.filter(
          (candidate) =>
            !candidate.status.hidden && candidate.group?.id === widget.group?.id,
        ),
      );
    });

    return Array.from(groups.entries())
      .map(([groupId, groupWidgets]) => {
        const groupMeta = groupWidgets[0]?.group;
        const bounds = getSelectionBounds(groupWidgets, draftLayouts);
        if (!groupMeta || !bounds || groupWidgets.length < 2) {
          return null;
        }

        return {
          ...bounds,
          id: groupId,
          label: `${groupMeta.name} / ${groupWidgets.length} 项`,
        };
      })
      .filter(
        (
          frame,
        ): frame is {
          height: number;
          id: string;
          label: string;
          width: number;
          x: number;
          y: number;
        } => Boolean(frame),
      );
  }, [draftLayouts, orderedWidgets, selectedIds]);

  React.useEffect(() => {
    if (!draggingRegistrationKey) {
      setDropIndicator(null);
    }
  }, [draggingRegistrationKey]);

  React.useEffect(() => {
    const targetScale = sanitizeCanvasScale(canvas.zoom / 100);
    if (!transformRef.current) {
      return;
    }

    if (Math.abs(transformState.scale - targetScale) < 0.001) {
      return;
    }

    transformRef.current.setTransform(
      transformState.positionX,
      transformState.positionY,
      targetScale,
      120,
      "easeOut",
    );
  }, [canvas.zoom, transformState.positionX, transformState.positionY, transformState.scale]);

  const reportZoomChange = React.useCallback(
    (zoom: number) => {
      const sanitizedZoom = sanitizeCanvasZoom(zoom);
      if (lastReportedZoomRef.current === sanitizedZoom) {
        return;
      }

      lastReportedZoomRef.current = sanitizedZoom;
      onZoomChange?.(sanitizedZoom);
    },
    [onZoomChange],
  );

  const resolveCanvasPoint = React.useCallback(
    (clientX: number, clientY: number) => {
      const canvasNode = canvasRef.current;
      if (!canvasNode) {
        return null;
      }

      const rect = canvasNode.getBoundingClientRect();
      const scale = transformState.scale <= 0 ? 1 : transformState.scale;

      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      };
    },
    [transformState.scale],
  );

  const buildDropIndicator = React.useCallback(
    (registrationKey: string, clientX: number, clientY: number) => {
      const pkg = registry.getPackage(registrationKey);
      const point = resolveCanvasPoint(clientX, clientY);
      if (!pkg || !point) {
        return null;
      }

      const position = resolveDroppedPosition(pkg, point, canvas);

      return {
        height: pkg.registration.defaultHeight,
        title: pkg.registration.titleZh,
        width: pkg.registration.defaultWidth,
        x: position.x,
        y: position.y,
      };
    },
    [canvas, resolveCanvasPoint],
  );

  const handleCanvasDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const registrationKey =
        event.dataTransfer.getData("application/x-jaminview-widget") ||
        draggingRegistrationKey;
      if (!registrationKey) {
        return;
      }

      const indicator = buildDropIndicator(
        registrationKey,
        event.clientX,
        event.clientY,
      );
      if (!indicator) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDropIndicator(indicator);
    },
    [buildDropIndicator, draggingRegistrationKey],
  );

  const handleCanvasDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const registrationKey =
        event.dataTransfer.getData("application/x-jaminview-widget") ||
        draggingRegistrationKey;
      if (!registrationKey) {
        return;
      }

      const indicator = buildDropIndicator(
        registrationKey,
        event.clientX,
        event.clientY,
      );
      setDropIndicator(null);

      if (!indicator) {
        return;
      }

      event.preventDefault();
      onPackageDrop(registrationKey, {
        x: indicator.x,
        y: indicator.y,
      });
    },
    [buildDropIndicator, draggingRegistrationKey, onPackageDrop],
  );

  const handleCanvasDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setDropIndicator(null);
      }
    },
    [],
  );

  const handleCanvasBackgroundClick = React.useCallback(() => {
    pendingSelectionRef.current = null;
    setDraftLayouts(null);
    onClearSelection();
  }, [onClearSelection]);

  const handleWidgetMouseDown = React.useCallback(
    (widgetId: string, event: SelectionMouseEvent) => {
      event.stopPropagation();

      const directSelectionIds = getSelectionIdsForWidget(widgetId);
      const isMultiToggle = event.shiftKey || event.metaKey || event.ctrlKey;

      if (isMultiToggle) {
        pendingSelectionRef.current = null;
        onSelectWidgets(directSelectionIds, true);
        return;
      }

      const nextSelectionIds = expandSelectionIds(
        selectedIds.includes(widgetId) ? selectedIds : directSelectionIds,
      );

      pendingSelectionRef.current = nextSelectionIds;
      if (!haveSameIds(nextSelectionIds, selectedIds)) {
        onSelectWidgets(nextSelectionIds);
      }
    },
    [
      expandSelectionIds,
      getSelectionIdsForWidget,
      onSelectWidgets,
      selectedIds,
    ],
  );

  const handleWidgetDragStart = React.useCallback(
    (widgetId: string) => {
      const anchorWidget = widgetMap.get(widgetId);
      if (!anchorWidget) {
        return false;
      }

      const nextSelectionIds =
        pendingSelectionRef.current ??
        expandSelectionIds(
          selectedIds.includes(widgetId)
            ? selectedIds
            : getSelectionIdsForWidget(widgetId),
        );

      const movableWidgets = widgets.filter(
        (widget) =>
          nextSelectionIds.includes(widget.id) &&
          !widget.status.hidden &&
          !widget.status.locked,
      );
      if (movableWidgets.length === 0) {
        pendingSelectionRef.current = null;
        return false;
      }

      const bounds = getSelectionBounds(movableWidgets, null);
      if (!bounds) {
        pendingSelectionRef.current = null;
        return false;
      }

      activeWidgetDragRef.current = {
        anchorId: widgetId,
        maxBottom: bounds.y + bounds.height,
        maxRight: bounds.x + bounds.width,
        minLeft: bounds.x,
        minTop: bounds.y,
        originLayouts: Object.fromEntries(
          movableWidgets.map((widget) => [
            widget.id,
            {
              h: widget.attr.h,
              w: widget.attr.w,
              x: widget.attr.x,
              y: widget.attr.y,
            },
          ]),
        ),
        widgetIds: movableWidgets.map((widget) => widget.id),
      };

      return undefined;
    },
    [
      expandSelectionIds,
      getSelectionIdsForWidget,
      selectedIds,
      widgetMap,
      widgets,
    ],
  );

  const handleWidgetDrag = React.useCallback(
    (widgetId: string, nextX: number, nextY: number) => {
      const activeDrag = activeWidgetDragRef.current;
      if (!activeDrag) {
        return;
      }

      const anchorLayout = activeDrag.originLayouts[activeDrag.anchorId];
      if (!anchorLayout) {
        return;
      }

      const rawDeltaX = nextX - anchorLayout.x;
      const rawDeltaY = nextY - anchorLayout.y;
      const limitedDeltaX = clampNumber(
        rawDeltaX,
        -activeDrag.minLeft,
        canvas.width - activeDrag.maxRight,
      );
      const limitedDeltaY = clampNumber(
        rawDeltaY,
        -activeDrag.minTop,
        canvas.height - activeDrag.maxBottom,
      );

      const nextDrafts = Object.fromEntries(
        activeDrag.widgetIds.map((id) => {
          const layout = activeDrag.originLayouts[id];
          return [
            id,
            {
              ...layout,
              x: layout.x + limitedDeltaX,
              y: layout.y + limitedDeltaY,
            },
          ];
        }),
      );

      setDraftLayouts(nextDrafts);
    },
    [canvas.height, canvas.width],
  );

  const handleWidgetDragStop = React.useCallback(
    (widgetId: string, fallbackX: number, fallbackY: number) => {
      const activeDrag = activeWidgetDragRef.current;
      const nextDrafts = draftLayouts;

      activeWidgetDragRef.current = null;
      pendingSelectionRef.current = null;

      if (!activeDrag) {
        return;
      }

      const patches: Array<{ id: string; patch: WidgetPatch }> = [];

      activeDrag.widgetIds.forEach((id) => {
        const widget = widgetMap.get(id);
        if (!widget) {
          return;
        }

        const layout =
          nextDrafts?.[id] ??
          (id === widgetId
            ? {
                h: widget.attr.h,
                w: widget.attr.w,
                x: fallbackX,
                y: fallbackY,
              }
            : null);

        if (!layout) {
          return;
        }

        if (widget.attr.x === layout.x && widget.attr.y === layout.y) {
          return;
        }

        patches.push({
          id,
          patch: {
            attr: {
              ...widget.attr,
              x: layout.x,
              y: layout.y,
            },
          },
        });
      });

      setDraftLayouts(null);

      if (patches.length > 0) {
        onUpdateWidgets(patches);
      }
    },
    [draftLayouts, onUpdateWidgets, widgetMap],
  );

  const handleWidgetResize = React.useCallback(
    (widgetId: string, width: number, height: number, position: CanvasPoint) => {
      const widget = widgetMap.get(widgetId);
      if (!widget) {
        return;
      }

      const nextX = clampNumber(position.x, 0, Math.max(0, canvas.width - MIN_WIDGET_WIDTH));
      const nextY = clampNumber(position.y, 0, Math.max(0, canvas.height - MIN_WIDGET_HEIGHT));
      const nextWidth = clampNumber(
        Math.round(width),
        MIN_WIDGET_WIDTH,
        Math.max(MIN_WIDGET_WIDTH, canvas.width - nextX),
      );
      const nextHeight = clampNumber(
        Math.round(height),
        MIN_WIDGET_HEIGHT,
        Math.max(MIN_WIDGET_HEIGHT, canvas.height - nextY),
      );

      setDraftLayouts({
        [widgetId]: {
          h: nextHeight,
          w: nextWidth,
          x: nextX,
          y: nextY,
        },
      });
    },
    [canvas.height, canvas.width, widgetMap],
  );

  const handleWidgetResizeStop = React.useCallback(
    (widgetId: string, fallbackLayout: WidgetLayout) => {
      const widget = widgetMap.get(widgetId);
      const nextLayout = draftLayouts?.[widgetId] ?? fallbackLayout;

      setDraftLayouts(null);
      pendingSelectionRef.current = null;

      if (!widget) {
        return;
      }

      if (
        widget.attr.x === nextLayout.x &&
        widget.attr.y === nextLayout.y &&
        widget.attr.w === nextLayout.w &&
        widget.attr.h === nextLayout.h
      ) {
        return;
      }

      onUpdateWidget(widgetId, {
        attr: {
          ...widget.attr,
          h: nextLayout.h,
          w: nextLayout.w,
          x: nextLayout.x,
          y: nextLayout.y,
        },
      });
    },
    [draftLayouts, onUpdateWidget, widgetMap],
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-8 pb-8 pt-10">
      <TransformWrapper
        ref={transformRef}
        initialScale={sanitizeCanvasScale(canvas.zoom / 100)}
        minScale={MIN_CANVAS_SCALE}
        maxScale={MAX_CANVAS_SCALE}
        centerOnInit
        centerZoomedOut
        limitToBounds
        doubleClick={{ disabled: true }}
        panning={{
          allowLeftClickPan: true,
          excluded: [".jv-rnd-item", ".jv-rnd-handle"],
        }}
        trackPadPanning={{
          disabled: false,
        }}
        wheel={{
          activationKeys: ["Meta", "Control"],
          step: 0.08,
        }}
        onTransform={(_, state) => {
          setTransformState({
            positionX: state.positionX,
            positionY: state.positionY,
            scale: state.scale,
          });
          reportZoomChange(state.scale * 100);
        }}
      >
        <TransformComponent
          wrapperStyle={{ height: "100%", width: "100%" }}
          contentStyle={{
            alignItems: "center",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div
            ref={canvasRef}
            className="relative overflow-hidden rounded-[24px] border border-[#d7d8d1] bg-white shadow-[0_28px_70px_rgba(26,28,25,0.12)]"
            style={{
              ...canvasFilterStyle,
              height: canvas.height,
              width: canvas.width,
            }}
            onClick={handleCanvasBackgroundClick}
            onDragLeave={handleCanvasDragLeave}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {canvas.showGrid ? (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd1c8_1px,transparent_1px)] [background-size:24px_24px] opacity-45" />
            ) : null}

            {canvas.showSafeArea ? (
              <div className="pointer-events-none absolute inset-[88px] rounded-[18px] border border-dashed border-[#23422a]/35" />
            ) : null}

            {activeGroupFrames.map((frame) => (
              <div
                key={frame.id}
                className="pointer-events-none absolute rounded-[18px] border-2 border-dashed border-[#23422a]/55 bg-[#23422a]/6"
                style={{
                  height: frame.height + 16,
                  left: frame.x - 8,
                  top: frame.y - 8,
                  width: frame.width + 16,
                }}
              >
                <div className="absolute left-3 top-3 flex h-7 items-center rounded-md border border-[#23422a]/20 bg-white/95 px-2.5 text-xs font-semibold text-[#23422a] shadow-sm">
                  {frame.label}
                </div>
              </div>
            ))}

            {dropIndicator ? (
              <div
                className="pointer-events-none absolute rounded-[18px] border-2 border-dashed border-[#23422a] bg-[#23422a]/8 shadow-[0_18px_40px_rgba(35,66,42,0.12)]"
                style={{
                  height: dropIndicator.height,
                  left: dropIndicator.x,
                  top: dropIndicator.y,
                  width: dropIndicator.width,
                }}
              >
                <div className="absolute left-3 top-3 flex h-7 items-center rounded-md border border-[#23422a]/20 bg-white/95 px-2.5 text-xs font-semibold text-[#23422a] shadow-sm">
                  放置 {dropIndicator.title}
                </div>
              </div>
            ) : null}

            <div className="pointer-events-none absolute left-8 top-8 flex h-7 items-center rounded-md border border-[#d7d8d1] bg-[#fafaf5] px-2.5 text-xs font-semibold text-[#23422a] shadow-sm">
              {canvas.width} x {canvas.height}
            </div>

            <div className="pointer-events-none absolute right-8 top-8 flex h-7 items-center rounded-md border border-[#d7d8d1] bg-white/95 px-2.5 text-xs font-medium text-[#727971] shadow-sm">
              缩放 {sanitizeCanvasZoom(transformState.scale * 100)}%
            </div>

            {visibleWidgets.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center px-8">
                <div className="max-w-[560px] rounded-[24px] border border-[#d7d8d1] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,249,243,0.92))] px-10 py-12 text-center shadow-[0_18px_40px_rgba(26,28,25,0.06)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#23422a]">
                    JaminView V2
                  </div>
                  <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#1a1c19]">
                    {emptyTitle}
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-[#727971]">
                    {emptyDescription}
                  </p>
                </div>
              </div>
            ) : null}

            {visibleWidgets.map((widget) => {
              const pkg = registry.getPackage(widget.registrationKey);
              if (!pkg) {
                return null;
              }

              const layout = getWidgetLayout(widget, draftLayouts);
              const active = selectedIds.includes(widget.id);
              const isSingleSelection = selectedIds.length === 1;
              const isResizable =
                active && isSingleSelection && !widget.status.locked;

              return (
                <Rnd
                  key={widget.id}
                  bounds="parent"
                  className="jv-rnd-item"
                  disableDragging={widget.status.locked}
                  dragGrid={
                    canvas.snapToGrid ? [CANVAS_GRID_SIZE, CANVAS_GRID_SIZE] : undefined
                  }
                  enableResizing={isResizable}
                  minHeight={MIN_WIDGET_HEIGHT}
                  minWidth={MIN_WIDGET_WIDTH}
                  position={{ x: layout.x, y: layout.y }}
                  resizeGrid={
                    canvas.snapToGrid ? [CANVAS_GRID_SIZE, CANVAS_GRID_SIZE] : undefined
                  }
                  resizeHandleStyles={isResizable ? activeResizeHandleStyles : undefined}
                  scale={transformState.scale}
                  size={{ height: layout.h, width: layout.w }}
                  style={{ zIndex: widget.attr.zIndex }}
                  onDrag={(event, data) => {
                    event.stopPropagation();
                    handleWidgetDrag(widget.id, data.x, data.y);
                  }}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    return handleWidgetDragStart(widget.id);
                  }}
                  onDragStop={(event, data) => {
                    event.stopPropagation();
                    handleWidgetDragStop(widget.id, data.x, data.y);
                  }}
                  onMouseDown={(event) => handleWidgetMouseDown(widget.id, event)}
                  onResize={(event, _direction, elementRef, _delta, position) => {
                    event.stopPropagation();
                    handleWidgetResize(
                      widget.id,
                      elementRef.offsetWidth,
                      elementRef.offsetHeight,
                      position,
                    );
                  }}
                  onResizeStop={(event, _direction, elementRef, _delta, position) => {
                    event.stopPropagation();
                    handleWidgetResizeStop(widget.id, {
                      h: elementRef.offsetHeight,
                      w: elementRef.offsetWidth,
                      x: position.x,
                      y: position.y,
                    });
                  }}
                >
                  <div
                    className={`relative h-full w-full overflow-hidden rounded-[18px] border bg-white shadow-[0_12px_30px_rgba(26,28,25,0.08)] transition-shadow ${
                      active
                        ? "border-[#23422a] ring-2 ring-[#23422a]/25"
                        : "border-[#d7d8d1] hover:shadow-[0_16px_34px_rgba(26,28,25,0.12)]"
                    } ${widget.status.locked ? "cursor-not-allowed" : "cursor-move"}`}
                    style={{
                      animation: resolveWidgetAnimation(widget.styles.animations),
                      height: layout.h,
                      opacity: widget.styles.opacity,
                      width: layout.w,
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="pointer-events-none absolute left-3 top-3 z-10 flex h-7 items-center rounded-md border border-[#d7d8d1] bg-white/92 px-2.5 text-xs font-semibold text-[#23422a] shadow-sm">
                      {pkg.registration.titleZh}
                    </div>
                    {widget.group ? (
                      <div className="pointer-events-none absolute right-3 top-3 z-10 flex h-7 items-center rounded-md border border-[#23422a]/12 bg-[#23422a]/8 px-2.5 text-xs font-semibold text-[#23422a] shadow-sm">
                        {widget.group.name}
                      </div>
                    ) : null}
                    <div className="pointer-events-none h-full w-full">
                      <pkg.RenderComponent
                        widget={widget}
                        width={layout.w}
                        height={layout.h}
                      />
                    </div>
                  </div>
                </Rnd>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export type { CanvasEngineCanvasState };
