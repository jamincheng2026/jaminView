import { create } from 'zustand';
import type { Widget } from '@/packages/types';

interface EditorState {
  /** 画布组件列表 */
  widgets: Widget[];
  /** 当前选中的组件 ID 集合 */
  selectedIds: string[];
  
  /** 添加组件 */
  addWidget: (widget: Widget) => void;
  /** 移除组件 */
  removeWidget: (id: string) => void;
  /** 更新组件 (支持局部更新配置) */
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  /** 选中组件 */
  selectWidget: (id: string, multi?: boolean) => void;
  /** 清空选中 */
  clearSelection: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  widgets: [],
  selectedIds: [],

  addWidget: (widget) => set((state) => ({ 
    widgets: [...state.widgets, widget] 
  })),

  removeWidget: (id) => set((state) => ({ 
    widgets: state.widgets.filter((w) => w.id !== id),
    selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id)
  })),

  updateWidget: (id, patch) => set((state) => ({
    widgets: state.widgets.map((w) => {
      if (w.id === id) {
        // 深层属性建议在传参前通过 lodash.merge 等工具合并好，此处保证顶层响应性
        return { ...w, ...patch };
      }
      return w;
    })
  })),

  selectWidget: (id, multi = false) => set((state) => {
    if (multi) {
      return {
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id]
      };
    }
    return { selectedIds: [id] };
  }),

  clearSelection: () => set({ selectedIds: [] }),
}));
