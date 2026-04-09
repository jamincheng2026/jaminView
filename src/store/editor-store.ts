import { create } from "zustand";

import {
  ChartFrame,
  type GroupType,
  type EditorDataPond,
  type EditorDataPondSettings,
  type Widget,
  type WidgetPatch,
} from "@/packages/types";

type WorkspaceSnapshot = {
  dataPonds: EditorDataPond[];
  dataPondSettings: EditorDataPondSettings;
  widgets: Widget[];
};

type WorkspaceHistory = {
  future: WorkspaceSnapshot[];
  past: WorkspaceSnapshot[];
};

interface EditorState extends WorkspaceSnapshot {
  selectedIds: string[];
  history: WorkspaceHistory;
  canUndo: boolean;
  canRedo: boolean;
  loadWorkspace: (workspace: Partial<WorkspaceSnapshot>) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, patch: WidgetPatch) => void;
  updateWidgets: (patches: Array<{ id: string; patch: WidgetPatch }>) => void;
  upsertDataPond: (dataPond: EditorDataPond) => void;
  removeDataPond: (id: string) => void;
  updateDataPondSettings: (patch: Partial<EditorDataPondSettings>) => void;
  undo: () => void;
  redo: () => void;
  selectWidget: (id: string, multi?: boolean) => void;
  selectWidgets: (ids: string[], multi?: boolean) => void;
  clearSelection: () => void;
  groupSelectedWidgets: () => void;
  ungroupSelectedWidgets: () => void;
}

const defaultWorkspace: WorkspaceSnapshot = {
  widgets: [],
  dataPonds: [],
  dataPondSettings: {
    pollingInterval: 30,
  },
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return cloneValue(snapshot);
}

function toWorkspaceSnapshot(state: Pick<EditorState, "widgets" | "dataPonds" | "dataPondSettings">) {
  return cloneWorkspaceSnapshot({
    widgets: state.widgets,
    dataPonds: state.dataPonds,
    dataPondSettings: state.dataPondSettings,
  });
}

function mergeWidgetPatch(widget: Widget, patch: WidgetPatch): Widget {
  const { spec, config, group, ...sharedPatch } = patch;
  const normalizedSharedPatch = {
    ...sharedPatch,
    ...(group === undefined ? {} : { group: group ?? undefined }),
  };

  if (widget.chartFrame === ChartFrame.VCHART) {
    return {
      ...widget,
      ...normalizedSharedPatch,
      chartFrame: ChartFrame.VCHART,
      spec: spec ?? widget.spec,
    };
  }

  return {
    ...widget,
    ...normalizedSharedPatch,
    chartFrame: widget.chartFrame,
    config: config ?? widget.config,
  };
}

function createGroupMeta(): GroupType {
  const id = `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    id,
    name: `组合 ${id.slice(-4).toUpperCase()}`,
  };
}

function cleanupOrphanGroups(widgets: Widget[]) {
  const groupCounts = new Map<string, number>();

  widgets.forEach((widget) => {
    const groupId = widget.group?.id;
    if (!groupId) {
      return;
    }

    groupCounts.set(groupId, (groupCounts.get(groupId) ?? 0) + 1);
  });

  return widgets.map((widget) => {
    const groupId = widget.group?.id;
    if (!groupId) {
      return widget;
    }

    if ((groupCounts.get(groupId) ?? 0) > 1) {
      return widget;
    }

    return {
      ...widget,
      group: undefined,
    };
  });
}

function dedupeIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function withHistory(
  state: Pick<
    EditorState,
    "widgets" | "dataPonds" | "dataPondSettings" | "selectedIds" | "history"
  >,
  nextSnapshot: WorkspaceSnapshot,
  nextSelectedIds = state.selectedIds,
) {
  const safeSnapshot = cloneWorkspaceSnapshot(nextSnapshot);

  return {
    widgets: safeSnapshot.widgets,
    dataPonds: safeSnapshot.dataPonds,
    dataPondSettings: safeSnapshot.dataPondSettings,
    selectedIds: nextSelectedIds.filter((selectedId) =>
      safeSnapshot.widgets.some((widget) => widget.id === selectedId),
    ),
    history: {
      past: [...state.history.past, toWorkspaceSnapshot(state)],
      future: [],
    },
    canUndo: true,
    canRedo: false,
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  ...defaultWorkspace,
  selectedIds: [],
  history: {
    past: [],
    future: [],
  },
  canUndo: false,
  canRedo: false,

  loadWorkspace: (workspace) =>
    set({
      widgets: cloneValue(workspace.widgets ?? defaultWorkspace.widgets),
      dataPonds: cloneValue(workspace.dataPonds ?? defaultWorkspace.dataPonds),
      dataPondSettings: cloneValue(
        workspace.dataPondSettings ?? defaultWorkspace.dataPondSettings,
      ),
      selectedIds: [],
      history: {
        past: [],
        future: [],
      },
      canUndo: false,
      canRedo: false,
    }),

  addWidget: (widget) =>
    set((state) =>
      withHistory(state, {
        widgets: [...state.widgets, widget],
        dataPonds: state.dataPonds,
        dataPondSettings: state.dataPondSettings,
      }),
    ),

  removeWidget: (id) =>
    set((state) => {
      const nextWidgets = cleanupOrphanGroups(
        state.widgets.filter((widget) => widget.id !== id),
      );

      return withHistory(
        state,
        {
          widgets: nextWidgets,
          dataPonds: state.dataPonds,
          dataPondSettings: state.dataPondSettings,
        },
        state.selectedIds.filter((selectedId) => selectedId !== id),
      );
    }),

  updateWidget: (id, patch) =>
    set((state) =>
      withHistory(state, {
        widgets: state.widgets.map((widget) =>
          widget.id === id ? mergeWidgetPatch(widget, patch) : widget,
        ),
        dataPonds: state.dataPonds,
        dataPondSettings: state.dataPondSettings,
      }),
    ),

  updateWidgets: (patches) =>
    set((state) => {
      if (patches.length === 0) {
        return state;
      }

      const patchMap = new Map(patches.map((entry) => [entry.id, entry.patch]));
      const nextWidgets = state.widgets.map((widget) => {
        const patch = patchMap.get(widget.id);
        return patch ? mergeWidgetPatch(widget, patch) : widget;
      });

      return withHistory(state, {
        widgets: cleanupOrphanGroups(nextWidgets),
        dataPonds: state.dataPonds,
        dataPondSettings: state.dataPondSettings,
      });
    }),

  upsertDataPond: (dataPond) =>
    set((state) => {
      const targetIndex = state.dataPonds.findIndex((item) => item.id === dataPond.id);
      const nextDataPonds =
        targetIndex >= 0
          ? state.dataPonds.map((item, index) => (index === targetIndex ? dataPond : item))
          : [dataPond, ...state.dataPonds];

      return withHistory(state, {
        widgets: state.widgets,
        dataPonds: nextDataPonds,
        dataPondSettings: state.dataPondSettings,
      });
    }),

  removeDataPond: (id) =>
    set((state) =>
      withHistory(state, {
        widgets: state.widgets.map((widget) => {
          if (widget.dataSource.dataPondId !== id) {
            return widget;
          }

          return {
            ...widget,
            dataSource: {
              ...widget.dataSource,
              dataPondId: undefined,
            },
          };
        }),
        dataPonds: state.dataPonds.filter((item) => item.id !== id),
        dataPondSettings: state.dataPondSettings,
      }),
    ),

  updateDataPondSettings: (patch) =>
    set((state) =>
      withHistory(state, {
        widgets: state.widgets,
        dataPonds: state.dataPonds,
        dataPondSettings: {
          ...state.dataPondSettings,
          ...patch,
        },
      }),
    ),

  undo: () =>
    set((state) => {
      const previous = state.history.past.at(-1);
      if (!previous) {
        return state;
      }

      const nextFuture = [toWorkspaceSnapshot(state), ...state.history.future];
      const nextSnapshot = cloneWorkspaceSnapshot(previous);

      return {
        widgets: nextSnapshot.widgets,
        dataPonds: nextSnapshot.dataPonds,
        dataPondSettings: nextSnapshot.dataPondSettings,
        selectedIds: state.selectedIds.filter((selectedId) =>
          nextSnapshot.widgets.some((widget) => widget.id === selectedId),
        ),
        history: {
          past: state.history.past.slice(0, -1),
          future: nextFuture,
        },
        canUndo: state.history.past.length > 1,
        canRedo: nextFuture.length > 0,
      };
    }),

  redo: () =>
    set((state) => {
      const [next, ...restFuture] = state.history.future;
      if (!next) {
        return state;
      }

      const nextSnapshot = cloneWorkspaceSnapshot(next);
      const nextPast = [...state.history.past, toWorkspaceSnapshot(state)];

      return {
        widgets: nextSnapshot.widgets,
        dataPonds: nextSnapshot.dataPonds,
        dataPondSettings: nextSnapshot.dataPondSettings,
        selectedIds: state.selectedIds.filter((selectedId) =>
          nextSnapshot.widgets.some((widget) => widget.id === selectedId),
        ),
        history: {
          past: nextPast,
          future: restFuture,
        },
        canUndo: nextPast.length > 0,
        canRedo: restFuture.length > 0,
      };
    }),

  selectWidget: (id, multi = false) =>
    set((state) => {
      if (multi) {
        return {
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id],
        };
      }

      return { selectedIds: [id] };
    }),

  selectWidgets: (ids, multi = false) =>
    set((state) => {
      const nextIds = dedupeIds(ids).filter((id) =>
        state.widgets.some((widget) => widget.id === id),
      );

      if (nextIds.length === 0) {
        return { selectedIds: [] };
      }

      if (multi) {
        const allSelected = nextIds.every((id) => state.selectedIds.includes(id));

        return {
          selectedIds: allSelected
            ? state.selectedIds.filter((selectedId) => !nextIds.includes(selectedId))
            : dedupeIds([...state.selectedIds, ...nextIds]),
        };
      }

      return { selectedIds: nextIds };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  groupSelectedWidgets: () =>
    set((state) => {
      const nextSelectedIds = dedupeIds(state.selectedIds);
      if (nextSelectedIds.length < 2) {
        return state;
      }

      const selectedWidgets = state.widgets.filter((widget) => nextSelectedIds.includes(widget.id));
      if (selectedWidgets.length < 2 || selectedWidgets.some((widget) => widget.group)) {
        return state;
      }

      const nextGroup = createGroupMeta();

      return withHistory(
        state,
        {
          widgets: state.widgets.map((widget) =>
            nextSelectedIds.includes(widget.id)
              ? {
                  ...widget,
                  group: nextGroup,
                }
              : widget,
          ),
          dataPonds: state.dataPonds,
          dataPondSettings: state.dataPondSettings,
        },
        nextSelectedIds,
      );
    }),

  ungroupSelectedWidgets: () =>
    set((state) => {
      const groupIds = dedupeIds(
        state.widgets
          .filter((widget) => state.selectedIds.includes(widget.id))
          .map((widget) => widget.group?.id)
          .filter((groupId): groupId is string => Boolean(groupId)),
      );

      if (groupIds.length !== 1) {
        return state;
      }

      const targetGroupId = groupIds[0];
      const nextSelectedIds = state.widgets
        .filter((widget) => widget.group?.id === targetGroupId)
        .map((widget) => widget.id);

      return withHistory(
        state,
        {
          widgets: state.widgets.map((widget) =>
            widget.group?.id === targetGroupId
              ? {
                  ...widget,
                  group: undefined,
                }
              : widget,
          ),
          dataPonds: state.dataPonds,
          dataPondSettings: state.dataPondSettings,
        },
        nextSelectedIds,
      );
    }),
}));
