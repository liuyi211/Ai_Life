# Dashboard (主厅/命运神殿) 实现计划

> **项目**: 人生回响 (Life Echo)
> **目标**: 将 `主厅优化版.html` 高保真还原为 React 组件
> **最后更新**: 2026-05-02

---

## 1. 需求分析

### 1.1 页面功能

基于 `主厅优化版.html`，主页面（Dashboard）包含以下功能：

#### 导航结构
- **4个 Tab**：主厅、档案、图鉴、我的
- **底部导航栏**：4个按钮切换 Tab
- **顶部栏**：标记文字 + 灵魂按钮（跳转至"我的"Tab）
- **标题区**：动态标题和副标题随 Tab 切换

#### Tab 1: 主厅（Home）
- **Oracle Card**：
  - 状态标记（主线回响中）
  - 章节信息（EARTH ONLINE / VII）
  - 角色名称
  - 角色描述文本
  - 命运线进度（5个节点，罗马数字 I-V）
  - 4个指标：进度、因果、命格、年龄
- **操作按钮行**：继续此生（主按钮）、新建人生（次按钮）
- **今日谶语**：英文标签 + 中文标签 + 预言文本

#### Tab 2: 档案（Archive）
- **存档列表**：4列布局（序号、名称/世界/描述、状态）
- 状态类型：主线、进行中、中断、完结
- 点击展开 Sheet 弹窗

#### Tab 3: 图鉴（Codex）
- **世界卡片网格**：2x2 布局
  - 地球 Online、修仙世界、真武世界、自定义图鉴
  - 每个卡片有标记（罗马数字）、标签、标题、描述
- **自定义保存列表**：同档案列表样式

#### Tab 4: 我的（Profile）
- **用户信息卡片**：
  - 状态（灵魂印记已载入）
  - 用户名称
  - Soul ID
  - 迷你印章
  - 3个统计：回响、主线、档案
- **功能列表**：
  - 继承遗产
  - 模型接入（AI配置）
  - 退出登录

#### 全局交互
- **Sheet 弹窗**：底部滑出，显示标题、描述、操作按钮
- **Toast 提示**：底部淡入淡出
- **Sigil 装饰**：呼吸动画的同心圆
- **Card 装饰**：四角暗红标记 + 内边框 + 水印文字

### 1.2 后端需求

- **GET /api/saves** - 获取当前用户的存档列表
- **世界配置数据** - 静态配置（可在前端定义）
- **用户信息** - 已有 /api/auth/me

---

## 2. 任务分解

### 阶段 A: 基础组件搭建

#### [TASK-D001] 创建页面骨架和路由
- 创建 `DashboardPage.tsx` 页面组件
- 配置 App.tsx 路由（替换现有占位符）
- 实现 Tab 状态管理和底部导航
- 实现标题动态切换
- **验收**: 4个 Tab 可切换，标题变化正确

#### [TASK-D002] 全局样式和装饰组件
- 迁移全局背景（径向渐变 + 网格纹理）到 CSS
- 创建 `Sigil` 装饰组件（呼吸动画）
- 创建 `CardCorners` 四角装饰组件
- 创建 `Watermark` 水印组件
- **验收**: 视觉风格与登录页统一，Sigil 动画正常

#### [TASK-D003] 通用交互组件
- 创建 `Toast` 组件（替代现有 DOM 操作）
- 创建 `Sheet` 底部弹窗组件
- 创建 `NavButton` 导航按钮组件
- **验收**: Toast 和 Sheet 动画流畅

### 阶段 B: Tab 内容实现

#### [TASK-D004] 主厅 Tab（HomeTab）
- Oracle Card 组件（状态、章节、角色名、描述）
- FateThread 命运线进度组件
- Metrics 指标展示组件
- ActionRow 操作按钮行
- Prophecy 今日谶语组件
- **验收**: 所有元素与 HTML 版一致

#### [TASK-D005] 档案 Tab（ArchiveTab）
- SectionHead 标题组件
- ArchiveList 存档列表组件
- ArchiveItem 存档项组件
- **验收**: 列表展示正确，点击触发 Sheet

#### [TASK-D006] 图鉴 Tab（CodexTab）
- WorldGrid 世界卡片网格
- SmallCard 小卡片组件（data-mark 属性）
- SavedCodexList 自定义保存列表
- **验收**: 网格布局正确，卡片交互正常

#### [TASK-D007] 我的 Tab（ProfileTab）
- ProfileHero 用户信息卡片
- ProfileStats 统计展示
- ProfileList 功能列表
- 退出登录功能
- **验收**: 用户信息正确显示，退出功能正常

### 阶段 C: 后端支持

#### [TASK-D008] 存档列表 API
- 创建 `saves.routes.ts`
- 创建 `saves.controller.ts`
- GET /api/saves - 返回当前用户的存档列表
- **验收**: API 返回正确的存档数据

#### [TASK-D009] 前端 API 封装
- 在 `api.ts` 中添加 saveApi
- 定义 SaveData TypeScript 类型
- **验收**: 前端能正确获取存档列表

### 阶段 D: 集成与优化

#### [TASK-D010] 数据集成
- 连接后端 API 获取真实数据
- 处理加载状态
- 处理空状态（无存档时）
- **验收**: 数据流正确

#### [TASK-D011] 交互完善
- 所有按钮点击反馈
- Sheet 弹窗内容动态填充
- Toast 提示全局可用
- **验收**: 交互流畅

#### [TASK-D012] 响应式适配
- 桌面端居中显示（430px 宽度）
- 移动端全屏适配
- **验收**: 两端显示正常

---

## 3. 组件结构

```
DashboardPage/
├── DashboardPage.tsx          # 主页面，Tab 管理
├── components/
│   ├── Sigil.tsx              # 呼吸动画装饰
│   ├── CardCorners.tsx        # 四角暗红装饰
│   ├── Watermark.tsx          # 水印文字
│   ├── Toast.tsx              # Toast 提示（全局）
│   ├── Sheet.tsx              # 底部弹窗
│   ├── BottomNav.tsx          # 底部导航栏
│   ├── TopBar.tsx             # 顶部栏
│   ├── HeroSection.tsx        # 标题区
│   ├── OracleCard.tsx         # Oracle 卡片
│   ├── FateThread.tsx         # 命运线进度
│   ├── Metrics.tsx            # 指标展示
│   ├── ActionRow.tsx          # 操作按钮行
│   ├── Prophecy.tsx           # 今日谶语
│   ├── ArchiveList.tsx        # 存档列表
│   ├── ArchiveItem.tsx        # 存档项
│   ├── WorldGrid.tsx          # 世界卡片网格
│   ├── SmallCard.tsx          # 小卡片
│   ├── ProfileHero.tsx        # 用户信息卡片
│   ├── ProfileStats.tsx       # 统计展示
│   └── SectionHead.tsx        # 区块标题
└── hooks/
    ├── useToast.ts            # Toast hook
    └── useSheet.ts            # Sheet hook
```

---

## 4. 样式策略

### CSS 变量（与登录页统一）
```css
:root {
  --bg: #eee9df;
  --ink: #221d18;
  --ink-soft: #5a5047;
  --muted: #948879;
  --line: rgba(34, 29, 24, 0.13);
  --line-strong: rgba(34, 29, 24, 0.28);
  --crimson: #7a2020;
  --gold: #9f7c3e;
  --ivory: #f8f4ec;
  --font-serif: 'Cormorant Garamond', 'Noto Serif SC', serif;
  --font-cn: 'Noto Serif SC', serif;
}
```

### 关键样式
- **背景**：多层径向渐变 + 网格纹理（与登录页一致）
- **卡片**：边框 + 内边框 + 四角暗红 + 水印
- **按钮**：主按钮（黑色填充）、次按钮（边框）
- **动画**：Sigil 呼吸、Tab 切换淡入、Sheet 滑入、Toast 淡入

---

## 5. 依赖关系

```
DashboardPage
├── TopBar
├── HeroSection
├── ScrollArea（4个Tab页面）
│   ├── HomeTab
│   │   ├── OracleCard
│   │   │   ├── CardCorners
│   │   │   ├── Watermark
│   │   │   ├── FateThread
│   │   │   └── Metrics
│   │   ├── ActionRow
│   │   └── Prophecy
│   ├── ArchiveTab
│   │   ├── SectionHead
│   │   └── ArchiveList
│   │       └── ArchiveItem
│   ├── CodexTab
│   │   ├── SectionHead
│   │   ├── WorldGrid
│   │   │   └── SmallCard
│   │   └── SavedCodexList
│   └── ProfileTab
│       ├── ProfileHero
│       │   ├── CardCorners
│       │   └── ProfileStats
│       └── ProfileList
├── BottomNav
├── Sheet（全局）
└── Toast（全局）
```

---

## 6. 验收标准

### 视觉验收
- [ ] 与 `主厅优化版.html` 视觉一致度 >= 95%
- [ ] 暗金色调风格统一
- [ ] Sigil 呼吸动画正常
- [ ] 卡片四角装饰和水印正常
- [ ] 字体（Cormorant Garamond + Noto Serif SC）正确加载

### 功能验收
- [ ] 4个 Tab 可正常切换
- [ ] 底部导航栏高亮正确
- [ ] 顶部灵魂按钮可跳转至"我的"Tab
- [ ] Sheet 弹窗可正常打开/关闭
- [ ] Toast 提示正常显示
- [ ] 退出登录功能正常

### 数据验收
- [ ] 存档列表从后端 API 获取
- [ ] 用户信息显示正确
- [ ] 世界数据静态配置正确

### 性能验收
- [ ] 首屏加载 < 3s
- [ ] Tab 切换流畅
- [ ] 动画不掉帧

---

## 7. 风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| HTML 转 React 样式差异 | 中 | 中 | 使用精确像素值，逐行比对 |
| 组件过多导致性能问题 | 低 | 中 | 使用 React.memo 优化 |
| 存档 API 延迟 | 中 | 低 | 添加 Loading 状态和骨架屏 |

---

## 8. 当前状态

**计划创建时间**: 2026-05-02
**预计完成时间**: 2-3 天
**当前阶段**: 阶段03（核心类型与游戏数据层）
**前置依赖**: 阶段02完成（认证系统 + 数据库联调）

**下一步**: 开始 TASK-D001，创建页面骨架和路由
