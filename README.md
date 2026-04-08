# JaminView

JaminView 是一个面向业务交付场景的模板化数据大屏平台原型。

当前产品主线闭环：

`模板 -> 项目 -> 导入数据 -> 编辑页面 -> 预览 -> 发布 -> 展示`

## 文档地图

正式文档入口在 [docs/README.md](docs/README.md)。

建议按这个顺序阅读：

1. [docs/README.md](docs/README.md)
2. [docs/editor-goview-study-notes-v1.md](docs/editor-goview-study-notes-v1.md)
3. [docs/editor-master-spec-v1.md](docs/editor-master-spec-v1.md)
4. [docs/editor-panel-wireframe-v1.md](docs/editor-panel-wireframe-v1.md)
5. [docs/editor-module-design-plan-v1.md](docs/editor-module-design-plan-v1.md)

## 当前定位

- 首页与产品内页按最终设计稿复现
- 模板化创建项目
- CSV / XLSX / JSON 导入
- 固定画布编辑
- 预览、发布与展示页闭环

当前编辑器的正式参考基线：

- `DataV` 负责结构
- `GoView` 负责组件池

## 开发说明

这是一个 Next.js 前端项目。

常用命令：

```bash
pnpm dev
pnpm build
pnpm lint
```

当前实现和后续开发以这两份文档为准：

- [docs/editor-master-spec-v1.md](docs/editor-master-spec-v1.md)
- [docs/editor-module-design-plan-v1.md](docs/editor-module-design-plan-v1.md)
