# 编辑器实现记录 V1

## 记录范围

这份文档用于记录本轮编辑器实现推进的实际落地结果。整个过程遵循以下阅读和实施顺序：

- `README.md`
- `docs/editor-goview-study-notes-v1.md`
- `docs/editor-master-spec-v1.md`
- `docs/editor-panel-wireframe-v1.md`
- `docs/editor-module-design-plan-v1.md`

本轮工作的目标不是零散补功能，而是按模块顺序逐步落地，并在模块完成后继续做一轮结构收口、交互补齐和视觉精修。

## 已完成内容

### 右侧面板结构与页面态/组件态边界

- 右侧面板已经能稳定区分页面态和组件态。
- 页面态按页面、背景、头部、展示等结构重新整理。
- 组件态稳定为 `内容 / 数据 / 样式 / 高级` 四个一级页签。

### 通用组件基础能力

- 通用布局字段进一步收口，包含明确的 `zIndex` 支持。
- `Advanced` 被正式作为一级页签预留，不再把后续能力继续塞进内容或样式区。
- 颜色、边框、透明度、阴影、间距等通用控件语言进一步统一。

### 图表、地图、表格、文本、图片模块

- 图表面板结构按主规格重新整理，分组更接近线框和目标产品形态。
- 地图面板拆成更清晰的内容、样式和高级结构。
- 表格的数据层与样式层边界更明确，列配置也更集中。
- 文本和图片组件对齐了同一套面板结构，图片补上了上传入口和更清晰的样式分组。

### 数据系统与数据处理

- `dataSourceMode` 统一到 `static / request / manual`，同时保留旧数据集模式的兼容能力。
- 手动 JSON 已经不是占位，而是图表、指标类、事件、表格、地图都能使用的真实数据源。
- 数据预览链路和实际渲染链路进一步对齐，避免面板预览和画布展示不一致。
- 数据处理被独立为数据层能力，支持格式化、过滤、排序、Top N、聚合、截断。

### 请求源与高级事件

- 组件模型和右侧数据页已经支持请求源配置，包含：
  - 请求地址
  - 请求方法
  - 刷新间隔
  - 参数
  - 返回映射
- 高级点击事件已经支持：
  - 打开链接
  - 跳转预览页
  - 跳转展示页
  - 聚焦目标组件
- 条件事件和多目标联动已经接入预览页与展示页的运行时行为。

### 装饰组件与数字翻牌

- 新增了 `numberFlip` 和 `decoration` 两类组件。
- 左侧组件池新增了 `Decor & Display` 分组。
- 装饰组件支持以下预设：
  - `frame`
  - `badge`
  - `divider`
  - `glow`
- 默认样例中加入了数字翻牌、边框装饰和分割线装饰，大屏语言不再只是图表、地图、文本的组合。

### 视觉精修

- `divider` 和 `glow` 不再只是样式面板里的预设，而是可以直接从组件池创建。
- 数字翻牌、分割线信号点、发光装饰补上了克制的轻量动效。
- 同时保留了 `prefers-reduced-motion` 的兼容处理。
- 对左侧栏标题、组件类型名、新装饰提示文案等高频中文标签做了稳定化处理，避免最新模块继续出现乱码文案。

### 清理项

- 清掉了一部分没有行为风险的未使用变量 warning。
- 当前剩余 warning 主要是旧结构遗留的 Hook 依赖提醒，以及一个图片优化提醒，已刻意留到单独清理轮次处理。

## 校验方式

本轮实现过程中多次使用以下方式做校验：

- 对触达文件执行 `npm run lint`
- 执行 `npm run build`
- 执行 `git diff --check`

截至本轮记录时，状态如下：

- `npm run build` 通过
- 定向 `lint` 无 error
- 仍有少量旧 warning
- `git diff --check` 仅提示行尾格式差异

## 主要变更文件

- `README.md`
- `src/app/globals.css`
- `src/components/editor/editor-canvas-widgets.tsx`
- `src/components/editor/editor-map-widget.tsx`
- `src/components/editor/editor-workbench.tsx`
- `src/components/pages/preview-page.tsx`
- `src/components/pages/screen-page.tsx`
- `src/lib/editor-widget-data.ts`
- `src/lib/editor-widget-events.ts`
- `src/lib/mocks/editor.ts`

## 下一步建议

- 把剩余的普通 `img` 使用进一步收口到更合适的图片方案。
- 单独处理 `editor-workbench.tsx` 里现存的 `useEffect` 依赖 warning。
- 继续修复老区域里尚未完全清理的中文乱码文案。
