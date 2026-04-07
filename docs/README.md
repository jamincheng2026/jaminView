# JaminView Documentation Pack

本目录只保留当前这次重新开工所需要的最终文档基线。

适合的使用对象：

- 产品负责人
- 前端开发
- 后端开发
- 设计同学
- 后续接手项目的团队成员

推荐阅读顺序：

1. [final-design-baseline.md](/Users/admin/Documents/jaminview/docs/final-design-baseline.md)
2. [editor-goview-study-notes-v1.md](/Users/admin/Documents/jaminview/docs/editor-goview-study-notes-v1.md)
3. [editor-goview-benchmark-v1.md](/Users/admin/Documents/jaminview/docs/editor-goview-benchmark-v1.md)
4. [editor-master-spec-v1.md](/Users/admin/Documents/jaminview/docs/editor-master-spec-v1.md)
5. [editor-panel-wireframe-v1.md](/Users/admin/Documents/jaminview/docs/editor-panel-wireframe-v1.md)
6. [editor-module-design-plan-v1.md](/Users/admin/Documents/jaminview/docs/editor-module-design-plan-v1.md)
7. [editor-feature-matrix-v1.md](/Users/admin/Documents/jaminview/docs/editor-feature-matrix-v1.md)
8. [editor-prd-v1.md](/Users/admin/Documents/jaminview/docs/editor-prd-v1.md)
9. [editor-p0-definition.md](/Users/admin/Documents/jaminview/docs/editor-p0-definition.md)
10. [editor-core-refactor-plan.md](/Users/admin/Documents/jaminview/docs/editor-core-refactor-plan.md)
11. [page-settings-spec.md](/Users/admin/Documents/jaminview/docs/page-settings-spec.md)
12. [component-scope-v1.md](/Users/admin/Documents/jaminview/docs/component-scope-v1.md)
13. [component-inventory.md](/Users/admin/Documents/jaminview/docs/component-inventory.md)
14. [product-wireframe-spec.md](/Users/admin/Documents/jaminview/docs/product-wireframe-spec.md)
15. [page-function-guide.md](/Users/admin/Documents/jaminview/docs/page-function-guide.md)
16. [design-system-spec.md](/Users/admin/Documents/jaminview/docs/design-system-spec.md)
17. [tech-stack-v1.md](/Users/admin/Documents/jaminview/docs/tech-stack-v1.md)

文档说明：

- `final-design-baseline.md`
  - 当前最终设计稿名单
  - Stitch 项目与页面清单
  - 哪些页面作为本期开发基线
- `editor-goview-study-notes-v1.md`
  - GoView / DataV 公开资料研究笔记，区分哪些是证据、哪些是产品推断，避免继续凭印象规划
- `editor-goview-benchmark-v1.md`
  - 对标 GoView 的能力对照文档，明确 JaminView 必须纳入的能力层与组件池
- `editor-master-spec-v1.md`
  - 当前编辑器需求的唯一主文档，统一 GoView/DataV 参考结论、页面/组件/数据分层，以及图表/地图/表格/图片/文本的面板模型
- `editor-panel-wireframe-v1.md`
  - 编辑器结构和右侧属性面板的低保真线框，帮助产品、设计和开发对齐真正要做的结构
- `editor-module-design-plan-v1.md`
  - 把编辑器按模块拆成可实施、可验收的设计规划表，后续应按模块顺序逐个落地
- `editor-feature-matrix-v1.md`
  - 把编辑器按功能矩阵拆成必做项、依赖项和完成标准，用于实施与验收
- `editor-prd-v1.md`
  - 编辑器第一版的产品目标、页面结构、组件范围与能力边界
- `editor-p0-definition.md`
  - 编辑页首版必须完成的最小能力边界
- `editor-core-refactor-plan.md`
  - 编辑器核心能力为什么要重构、先改哪里、后改哪里
- `page-settings-spec.md`
  - 页面设置、头部展示规则、背景配置这一层为什么必须补，以及 V1 具体要做到什么
- `component-scope-v1.md`
  - 当前编辑器 V1 必做组件、暂不做组件和 V2 可扩展范围
- `component-inventory.md`
  - 当前开发要落地的核心组件清单
- `product-wireframe-spec.md`
  - 当前项目页面结构和关键流程原型说明
- `page-function-guide.md`
  - 当前页面和功能的人话版说明，帮助团队理解页面到底是干嘛的
- `design-system-spec.md`
  - 绿色主色 + 燕麦色背景的品牌与界面规范
- `tech-stack-v1.md`
  - 图表、地图、表单、交互和工程栈的正式技术选型

当前项目统一定位：

`JaminView` 当前第一版是一个面向业务交付场景的模板化数据大屏平台。

当前开发重点：

- 首页与产品内页按最终设计稿复现
- 模板化创建项目
- JSON / CSV / Excel 导入
- 固定画布编辑
- 预览、发布与展示页闭环

当前不作为 V1 承诺的能力：

- AI 一句话生成大屏
- NL2SQL
- 自动数据建模
- 多智能体编排
- 企业级权限与审批流

设计源：

- 当前视觉基线以 Stitch 项目为准
- 后续代码开发以前述主规格、线框、模块规划、功能矩阵和 Stitch 最终页面为依据
