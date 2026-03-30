# vPro Component Inventory

## 1. 文档目标

这份文档用于定义 `vPro V1` 需要的组件清单，方便：

- 设计师或 Stitch 明确要画哪些组件
- 前端明确哪些组件需要先封装
- 产品明确哪些控件属于 P0，哪些可以后置
- 避免页面设计好了，组件体系却没跟上

这份文档和 [editor-prd-v1.md](/Users/admin/Documents/jaminview/docs/editor-prd-v1.md) 配合使用：

- `editor-prd-v1.md` 解决“做什么”
- `component-inventory.md` 解决“由哪些 UI 组件组成”

---

## 2. 组件分层

第一版建议把组件分为 5 层：

1. 基础 UI 组件
2. 产品壳子组件
3. 编辑器工作台组件
4. 大屏内容组件
5. 反馈与空状态组件

---

## 3. 基础 UI 组件

这些组件是整个产品的基础，应优先统一样式。

## 3.1 Button

需要的变体：

- Primary
- Secondary
- Ghost
- Outline
- Danger

需要支持：

- 普通态
- hover
- active
- disabled
- loading

使用场景：

- 首页 CTA
- 登录
- 新建项目
- 发布
- 导入确认

## 3.2 Input

需要支持：

- 默认文本输入
- 带前后缀
- 错误态
- 帮助文案

使用场景：

- 项目名称
- 登录表单
- 数据集名称

## 3.3 Textarea

使用场景：

- 模板说明
- 富文本简述
- 备注文案

## 3.4 Select

使用场景：

- 模板分类
- 图表类型
- 数据集选择
- 字段映射

## 3.5 Tabs

使用场景：

- 编辑器左侧面板切换
- 右侧属性分组
- 模板分类切换

## 3.6 Checkbox / Radio / Switch

使用场景：

- 图例开关
- 坐标轴开关
- 吸附开关
- 网格显示

## 3.7 Dialog / Drawer

需要覆盖：

- 新建项目
- 数据导入
- 删除确认
- 发布确认
- 发布成功反馈

## 3.8 Tooltip / Popover

使用场景：

- 图标操作说明
- 字段映射说明
- 快捷操作提示

---

## 4. 产品壳子组件

这些组件用于构成产品页面骨架。

## 4.1 Navbar

页面：

- 首页
- 模板页
- 登录后工作台

## 4.2 Page Header

页面：

- 项目列表页
- 模板页
- 预览页

包含：

- 标题
- 简述
- 右侧操作按钮

## 4.3 Card

需要至少区分：

- 营销卡片
- 项目卡片
- 模板卡片
- 工具面板卡片

## 4.4 Section Container

页面：

- 首页
- 模板页

用途：

- 统一 section 间距
- 控制留白和最大宽度

## 4.5 Footer

页面：

- 首页
- 模板页

---

## 5. 编辑器工作台组件

这些组件是编辑器第一版的重点。

## 5.1 Editor Top Bar

必须包含：

- 返回
- 项目名称
- 保存状态
- 预览
- 发布

## 5.2 Left Workspace Rail

必须包含入口：

- 组件库
- 图层
- 数据源
- 模板

## 5.3 Canvas Toolbar

必须包含：

- 缩放
- 画布尺寸显示
- 网格开关
- 吸附开关

可后置：

- 对齐分布工具
- 标尺

## 5.4 Properties Panel

建议分成 4 个区块：

- 基础属性
- 样式属性
- 数据绑定
- 图表 / 地图配置

## 5.5 Layer List

必须支持：

- 当前页面组件列表
- 选中状态
- 基础层级顺序

可后置：

- 锁定
- 分组
- 隐藏显示

## 5.6 Dataset Panel

必须支持：

- 数据集列表
- 导入入口
- 数据集基本信息

## 5.7 Template Chooser

必须支持：

- 模板卡片
- 模板分类
- 模板创建项目入口

---

## 6. 大屏内容组件

这些组件是画布上的实际内容。

## 6.1 Text Title Block

能力：

- 主标题
- 副标题
- 自定义字号和颜色

## 6.2 Metric Card

能力：

- 数值
- 单位
- 环比 / 同比
- 趋势箭头

## 6.3 Image Block

能力：

- 静态图片展示
- 模板内置配图

## 6.4 Decorative Block

能力：

- 边框装饰
- 分割线
- 高亮容器

说明：

- 第一版装饰组件应有限，不要变成素材市场

## 6.5 Chart Container

这是大屏最重要的容器组件之一。

必须包含：

- 标题
- 图表主体
- 容器边界
- 空态 / 错误态

内部图表第一版建议覆盖：

- 折线图
- 柱状图
- 面积图
- 饼图 / 环图
- 表格

## 6.6 Map Container

也是核心容器组件。

必须包含：

- 标题
- 地图主视图
- 容器边界
- 图层说明或状态区

第一版支持：

- 城市级 3D 地图
- 点位
- 飞线
- 基础热力或区域表达

---

## 7. 数据与表单类组件

## 7.1 File Upload

用于：

- JSON / CSV / Excel 导入

必须支持：

- 拖拽上传
- 点击上传
- 文件格式提示
- 解析失败提示

## 7.2 Data Preview Table

用于：

- 导入后字段预览
- 样例数据预览

必须支持：

- 表头
- 行数据预览
- 空数据提示

## 7.3 Field Mapping Form

用于：

- 绑定 x/y 字段
- 指定分类字段
- 指定指标字段

必须具备：

- 简单易懂
- 避免一次性暴露太多项

---

## 8. 反馈与状态组件

## 8.1 Empty State

页面：

- 项目列表空状态
- 数据集空状态
- 模板空状态

## 8.2 Error State

页面 / 模块：

- 导入失败
- 数据映射失败
- 页面加载失败

## 8.3 Loading State

页面 / 模块：

- 登录
- 项目创建
- 导入解析
- 发布

## 8.4 Success Feedback

页面 / 弹层：

- 发布成功
- 导入成功
- 创建项目成功

---

## 9. P0 / P1 优先级

## P0 必须先做

- Button
- Input
- Select
- Dialog
- Card
- Page Header
- Editor Top Bar
- Left Workspace Rail
- Canvas Toolbar
- Properties Panel
- Layer List
- Dataset Panel
- Template Chooser
- Chart Container
- Map Container
- File Upload
- Data Preview Table
- Empty State
- Loading State

## P1 可以后置

- Tooltip / Popover
- Drawer
- 更复杂的 Tabs 变体
- 分组图层控件
- 高级图表配置表单
- 更复杂的反馈动画

---

## 10. 原型图会怎么出

会，而且建议按三层来出。

### 10.1 低保真原型

我会先画：

- 页面结构图
- 区块布局图
- 弹层结构图
- 面板结构图

形式可以是：

- Markdown 线框图
- ASCII 结构图
- Mermaid 流程图

### 10.2 中保真原型

我会继续补：

- 组件关系
- 真实字段
- 表单结构
- 面板分组

这一步最适合拿去喂 Stitch。

### 10.3 高保真原型

这一步不建议我直接凭空画完，而是：

- 先用 Stitch / Figma 出设计稿
- 再回到代码实现

---

## 11. 当前建议的下一步

最推荐的顺序是：

1. 先拿 `stitch-design-prompts.md` 去出 `编辑器 / 项目列表 / 选模板`
2. 我这边继续补页面级原型图
3. 设计稿回来后，再进入正式实现

---

## 12. 当前结论

如果你问：

`后续会不会真的画图？`

答案是：

- 会
- 我会先画产品原型图和结构图
- 高保真部分更适合你拿去 Stitch / Figma 出
- 然后我再负责把它们收回到代码里
