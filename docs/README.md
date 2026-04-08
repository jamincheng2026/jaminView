# JaminView Documentation Pack

本目录当前只保留后续继续推进项目所需要的**唯一有效基线**。

从现在开始，**GoView 接管 + DataV 结构约束** 是唯一继续推进编辑器的主路线。

适合的使用对象：

- 产品负责人
- 前端开发
- 后端开发
- 设计同学
- 后续接手项目的团队成员

## 当前有效基线

推荐阅读顺序：

1. [final-design-baseline.md](/Users/admin/Documents/jaminview/docs/final-design-baseline.md)
2. [editor-goview-study-notes-v1.md](/Users/admin/Documents/jaminview/docs/editor-goview-study-notes-v1.md)
3. [editor-goview-benchmark-v1.md](/Users/admin/Documents/jaminview/docs/editor-goview-benchmark-v1.md)
4. [editor-goview-migration-plan-v1.md](/Users/admin/Documents/jaminview/docs/editor-goview-migration-plan-v1.md)
5. [editor-master-spec-v1.md](/Users/admin/Documents/jaminview/docs/editor-master-spec-v1.md)
6. [editor-panel-wireframe-v1.md](/Users/admin/Documents/jaminview/docs/editor-panel-wireframe-v1.md)
7. [editor-module-design-plan-v1.md](/Users/admin/Documents/jaminview/docs/editor-module-design-plan-v1.md)
8. [editor-feature-matrix-v1.md](/Users/admin/Documents/jaminview/docs/editor-feature-matrix-v1.md)
9. [design-system-spec.md](/Users/admin/Documents/jaminview/docs/design-system-spec.md)
10. [tech-stack-v1.md](/Users/admin/Documents/jaminview/docs/tech-stack-v1.md)

这些文档是后续继续做的唯一主入口：

- `final-design-baseline.md`
  - 当前最终设计稿名单
  - Stitch 项目与页面清单
  - 哪些页面作为本期开发基线
- `editor-goview-study-notes-v1.md`
  - GoView / DataV 公开资料研究笔记，区分哪些是证据、哪些是产品推断，避免继续凭印象规划
- `editor-goview-benchmark-v1.md`
  - 对标 GoView 的能力对照文档，明确 JaminView 必须纳入的能力层与组件池
- `editor-goview-migration-plan-v1.md`
  - 基于 GoView 接管编辑器的迁移方案，明确为什么不该继续在当前 React 编辑器上修补，以及后续应该采用的接管路线、阶段和风险
- `editor-master-spec-v1.md`
  - 当前编辑器需求主文档，统一 GoView/DataV 参考结论、页面/组件/数据分层，以及图表/地图/表格/图片/文本的面板模型
- `editor-panel-wireframe-v1.md`
  - 编辑器结构和右侧属性面板的低保真线框，帮助产品、设计和开发对齐真正要做的结构
- `editor-module-design-plan-v1.md`
  - 把编辑器按模块拆成可实施、可验收的设计规划表，后续应按模块顺序逐个落地
- `editor-feature-matrix-v1.md`
  - 把编辑器按功能矩阵拆成必做项、依赖项和完成标准，用于实施与验收
- `design-system-spec.md`
  - 绿色主色 + 燕麦色背景的品牌与界面规范
- `tech-stack-v1.md`
  - 图表、地图、表单、交互和工程栈的正式技术选型

## 当前拍板结论

当前关于编辑器的主判断已经明确：

1. 不再继续把当前 React 编辑器补成 GoView 替代品
2. GoView 作为编辑器能力底座
3. DataV 作为右侧面板和配置分层的结构参考
4. JaminView 保留自己的品牌、首页、项目流、模板流和发布流

## 当前项目统一定位

`JaminView` 当前第一版是一个面向业务交付场景的模板化数据大屏平台。

## 当前开发重点

- 首页与产品内页按最终设计稿复现
- 模板化创建项目
- JSON / CSV / Excel 导入
- GoView 接管编辑器能力
- 预览、发布与展示页闭环

## 当前不作为 V1 承诺的能力

- AI 一句话生成大屏
- NL2SQL
- 自动数据建模
- 多智能体编排
- 企业级权限与审批流

## 设计源

- 当前视觉基线以 Stitch 项目为准
- 后续代码开发以“GoView 接管方案 + 编辑器主规格 + 模块规划 + 功能矩阵 + Stitch 最终页面”为依据
