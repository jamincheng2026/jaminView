# JaminView 编辑器 V2 重构主计划 (Master Plan)

> **文档状态**: 最终执行版 (Team Development File)
> **废弃说明**: 原 `docs/archive` 目录下的 `editor-*.md` 已全部废弃。这是团队开发 V2 编辑器的唯一参考总纲。

## 1. 核心战略与架构决策

JaminView V2 编辑器彻底放弃原有的“修补式 React 堆砌”，全面吸收 **GoView 的成熟架构模式（5件套模式 + 配置即视图）**，同时保留 **JaminView 的技术栈与品牌基因**。

| 维度 | V2 决策结论 |
|---|---|
| **技术栈** | `React 19` + `Next.js 16` + `Zustand` 替代原生 useState 满天飞 |
| **图表引擎** | 主力使用 **`@visactor/vchart` (VChart spec)** (放弃二次封装的 MiniChart) |
| **地图引擎** | 业务真实大屏：**高德地图 + Loca 2.0** / 科技特效大屏：**ECharts GL** |
| **视觉体系** | 吸收集 GoView 交互布局，注入 JaminView 品牌：**墨绿 `#23422a` + 燕麦色 `#fafaf5`** |
| **组件开发模式** | 独创从 GoView 演进的 **“React 版 5 件套模式”** |
| **编辑面板交互** | 彻底抛弃原有的杂糅表单，按图表库原生属性（如 VChart Spec）一一映射 |

---

## 2. 团队必读：什么是“五件套模式”？

这绝不是简单的代码拆分，而是**消除 `if-else` 的终极架构**。
不管你是开发“柱状图”、“飞线地图”还是“数字边框”，你只需在一个独立文件夹内提供以下 5 个文件。**主应用自动通过 Registry 挂载，不改主文件一行代码！**

```text
src/packages/charts/bar/
├── index.ts       ← (1) 注册信息：名字、分类、默认宽高、缩略图
├── config.ts      ← (2) 默认配置：标准的 VChart Spec，这是组件的数据源泉
├── panel.tsx      ← (3) 右侧面板：React 组件，表单直绑 Spec，修改即触发渲染
├── render.tsx     ← (4) 渲染引擎：<VChart spec={widget.spec} /> 纯净渲染
└── data.json      ← (5) 默认数据：拖入画布后第一时间展示的默认效果
```

### 👉 工作流铁律 (The Golden Rule)
任何前端拿到一个新的图表组件开发任务（例如：漏斗图）：
1. 建立 `src/packages/charts/funnel`。
2. 配置项**绝对不要自己造轮子**，请去打开 [VChart 配置文档](https://www.visactor.io/vchart/option/funnelChart)！
3. 在 `panel.tsx` 中的 Number 框如果改的是“漏斗宽度系数”，它`onChange`出来的 patch 就是 `{ spec: { funnel: { style: { width: val } } } }`，直接深入 VChart Spec！

---

## 3. 状态管理系统更新 (Zustand)

原有的 80+ `useState` 是性能杀手和维护梦魇。必须按这三个 Store 完全剥离：

1. **`editor-store.ts` (画布主体 Store)**
   * `widgets: Widget[]`: 当前画布上的所有组件（含它们庞大自由的 `spec` / `config`）。
   * `selectedIds: string[]`: 支持多选。
   * 方法：`addWidget`, `updateWidget(id, patch)`, `removeWidget` 等。
2. **`editor-screen.ts` (页面全局 Store)**
   * 管理：大屏分辨率（1920x1080）、背景色/背景图、全局滤镜比例等。
3. **`editor-history.ts` (时光机 Store)**
   * 单独隔离：撤销/重做逻辑。

---

## 4. UI 视觉与交互规范

完全重做左侧组件池和右侧编辑面板。

### 4.1 品牌色应用规范
设计风格不走“暗夜黑科技风”，走**明朗雅致的商务科技风**。
- `backgroundColor` = 燕麦底 `#fafaf5`
- `primaryColor` / 选中控件 / Toggle开启 / Tab下划线 = 墨绿 `#23422a`
- `borderColor` / 分割线 / Toggle关闭 = `#d7d8d1`
- `textColor` = `#1a1c19` (不要使用纯黑)

### 4.2 左侧组件池
- **模式**：包含左侧主Icon导航（图表、地图、媒体等）和右侧弹出的**带有可视化缩略图**的网格面板。
- **添加行为**：所有组件支持 HTML5 Native `Drag & Drop` 或者双击添加到画布中央。

### 4.3 右侧配置面板 (四大金刚)
完全照搬 GoView 被广泛验证的高效 Tab 划分：
- **[ 定制 ]**：最核心 Tab。分为公共样式（折叠面板：尺寸/位置/滤镜/容器外壳）和组件专属（折叠面板：如 X轴/Y轴/图例/柱状系列详细控制）。大部分时间只修改 `widget.spec`。
- **[ 动画 ]**：入场、循环动画控制。
- **[ 数据 ]**：静态 JSON 编辑器，和 API 数据源映射、定时轮询等控制（直接映射给 `widget.dataSource` 的定义）。
- **[ 事件 ]**：给该图表挂载超链接点击或区块联动事件。

---

## 5. 地图组件落地双规

经过深度调研，对于 B 端大屏系统，地图呈现差异极大，只能采用**双引擎并行**：

**应用场景 A：真实数据网、POI、街道社区、精确下钻、实时热力图。**
> **选型**：`高德 AMap JSAPI 2.0` + `Loca 2.0 API`
* 技术特征：需高德 ApiKey。可渲染 3D 棱柱化柱状图(`PrismLayer`)，散点水波纹，支持百万级渲染。
* 特点：偏向严谨的业务网格型大屏。

**应用场景 B：全国数据可视化、脱离写实底图的 3D 地球仪、纯粹科技感大屏。**
> **选型**：`ECharts GL` 的 `geo3D`
* 技术特征：无底图，只依赖 GeoJSON。可配置光照、发光滤镜（Bloom）。
* 特点：视觉张力极强，配置简单。

---

## 6. V2 第一期开发与里程碑 (Milestones)

这里是后续研发团队分工落地的确切里程碑：

### Milestone 1: 基础设施骨架搭建 (Week 1)
- 废弃与清理旧的 8000 行 `editor-workbench.tsx` 混乱设计。
- 开发 `src/packages/types.ts` 和 `registry.ts` 并做基础单元测试。
- 开发全局 Zustand Stores。
- 引入 **Shadcn UI** 作为基础套件进行改造（如 Switch、Accordion 等），并深度注入品牌色，封装成符合我们习惯的基础共用控件：`<NumberStepper>`、`<CollapseSection>`、`<ToggleSwitch>` 等（放在 `src/components/editor-ui/`）。

### Milestone 2: 图表五件套模范版与验证 (Week 1.5)
- **重点战役**：以**柱状图 (Bar)** 和 **折线图 (Line)** 为切入点。
- 将 VChart 引擎完全引入，并验证配置面板中如"隐藏 X坐标轴"的开关能否通过直接修改 `spec.axes[0].visible` 做到**无延迟画布响应**。
- 确认左侧拖拽进画布的功能全通。

### Milestone 3: 面板重组与功能丰富 (Week 2-3)
- 实现右侧 `<PanelTabs>`（数据和动画 Tab 可以先出静态）。
- 将剩余的 饼图、面积图、基础装饰边框 全部完成五件套化。
- 此时的大屏已经可以排版并编辑图表数据了！

### Milestone 4: 地图等复杂组件及项目打通 (Week 4)
- 引入这两种地图模型（高德/EChartsGL）。
- 打通和 JaminView 首页的项目流保存。

---

## 7. 高阶赋能特性吸收 (从 GoView 架构借鉴)
在完成上述四个 Milestone 的基础之上，我们在进入后期维护时，将逐步落地从 GoView 抽离出来的这些极强的高阶能力，以彻底拉开与普通竞品的差距：
1. **全局公共数据池 (Data Pond)**：多图表组件共享统一大接口订阅池，支持全局统一拉取轮询，极大减轻服务端和浏览器请求压力。
2. **图表全局滤镜网 (Canvas Filters)**：支持基于画布层级的全局色相(Hue)、对比度、饱和度等滤镜叠加调节，让用户拥有一键套用“科技感风格”的电影级调色能力。
3. **高阶 API 与 SQL 驱动器**：面板控制台不仅支持普通 API 调用，还具备发送 SQL Payload 获取业务表数据、以及在前端嵌入手写 JavaScript 拦截器加工返回数据的能力。
4. **组件群组编排 (Group)**：支持对画布上的多个图表元件进行框选、打组(`GroupType`)，实现多个底层图表的统一移动与样式联动，带来类似真实制图软件的生产级体验。

---

## 总结：分析与文档审校 （为什么要这么建文档？）

这个实施计划比原来的要好在：
1. **统一了语言和工作流标准**。原来代码随便写。现在任何人入职写新图表，如果他不交“五件套”文件，代码合并（PR）直接会被拒绝（Reject）。
2. **彻底锁定了图表与编辑面板之间的接口标准**。原系统在设计中间件（把"柱状图粗细"翻译给VChart的间接过程），现在抛弃中间件，`Panel` 就是 VChart 原配 API 操作器，没有任何损耗。
3. 避免了后续因为“做真实地图”还是“做科技地图”争吵的技术撕裂，给出了明确的双线指导。
