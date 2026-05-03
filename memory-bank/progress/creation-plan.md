# Character Creation (命运捏造) 实现计划

> **项目**: 人生回响 (Life Echo)
> **目标**: 将 `捏人1.html` 高保真还原为 React 组件
> **最后更新**: 2026-05-02

---

## 1. 需求分析

### 页面结构
5步向导式角色创建流程：

#### Step 1: 世界选择 (World)
- 世界卡片列表（6个世界）
- 每个卡片：标记、标签、标题、描述、芯片、详细配置
- 选中态样式

#### Step 2: 身份设定 (Identity)
- 姓名输入框
- 性别选择（分段按钮：男/女/未知）
- 开局年龄（分段按钮：幼年/少年/成年）
- 性格底色（自定义下拉选择）
- 核心欲望（自定义下拉选择）
- 自定义设定（多行文本）
- 初始属性分配（4维：体魄/悟性/魅力/气运）

#### Step 3: 天赋抽取 (Talent)
- 抽取圆印（点击动画）
- 3个天赋槽位
- 天赋卡片展示（稀有度/名称/描述）

#### Step 4: 技能继承 (Legacy)
- 遗产槽位（3个）
- 4个分类标签（技能/法宝/残卷/印记）
- 遗产列表（可选择）

#### Step 5: 确认命线 (Confirmation)
- 汇总卡片（所有选择）
- 开局预言
- 底部操作按钮

### 全局组件
- **顶部栏**：返回按钮 + 标题 + 随机骰子
- **进度条**：5步指示器（罗马数字 I-V）
- **底部操作**：返回/下一步按钮
- **Sheet 弹窗**：确认/提示
- **Toast**：操作反馈
- **Sigil 装饰**：呼吸动画

---

## 2. 任务分解

### 阶段 A: 基础结构
- [ ] 创建 CreationPage 页面骨架
- [ ] 实现步骤管理和进度条
- [ ] 顶部栏和底部操作按钮
- [ ] 路由配置

### 阶段 B: Step 1 - 世界选择
- [ ] WorldCard 组件
- [ ] 世界数据配置
- [ ] 选中/展开交互

### 阶段 C: Step 2 - 身份设定
- [ ] 表单输入组件
- [ ] 分段按钮组件
- [ ] 自定义下拉选择组件
- [ ] 属性分配面板（4维+/-控制）

### 阶段 D: Step 3 - 天赋抽取
- [ ] 抽取圆印组件（动画）
- [ ] 天赋槽位
- [ ] 天赋卡片
- [ ] 随机抽取逻辑

### 阶段 E: Step 4 - 技能继承
- [ ] 遗产头部卡片
- [ ] 分类标签
- [ ] 遗产列表和选择

### 阶段 F: Step 5 - 确认
- [ ] 汇总卡片
- [ ] 开局预言
- [ ] 创建按钮

### 阶段 G: 后端支持
- [ ] 角色创建 API
- [ ] 世界/天赋/遗产配置数据

---

## 3. 状态管理

```typescript
interface CreationState {
  step: number; // 0-4
  world: string;
  name: string;
  gender: string;
  age: string;
  personality: string;
  desire: string;
  customNote: string;
  attributes: {
    body: number;
    mind: number;
    charm: number;
    fate: number;
  };
  talents: Talent[];
  legacy: LegacyItem[];
}
```

---

## 4. 技术要点

### 复杂组件
- **CustomSelect**: 自定义下拉选择（替代原生 select）
- **AttributePanel**: 属性条带 +/- 按钮和进度条
- **DrawOrb**: 抽取圆印（脉冲动画）
- **TalentCard**: 翻转/揭示动画
- **SegmentedControl**: 分段按钮

### 动画
- 步骤切换：fadeUp
- 圆印抽取：drawPulse
- 天赋揭示：cardReveal
- Sheet 滑入
- Toast 淡入

---

## 5. 文件结构

```
CreationPage/
├── CreationPage.tsx          # 主页面
├── components/
│   ├── CreationTopBar.tsx    # 顶部栏
│   ├── StepProgress.tsx      # 进度条
│   ├── BottomActions.tsx     # 底部按钮
│   ├── StepWorld.tsx         # Step 1: 世界
│   ├── StepIdentity.tsx      # Step 2: 身份
│   ├── StepTalent.tsx        # Step 3: 天赋
│   ├── StepLegacy.tsx        # Step 4: 继承
│   ├── StepConfirm.tsx       # Step 5: 确认
│   ├── WorldCard.tsx         # 世界卡片
│   ├── CustomSelect.tsx      # 自定义选择
│   ├── SegmentedControl.tsx  # 分段按钮
│   ├── AttributePanel.tsx    # 属性面板
│   ├── DrawOrb.tsx           # 抽取圆印
│   ├── TalentCard.tsx        # 天赋卡片
│   ├── LegacyTabs.tsx        # 遗产标签
│   └── SummaryCard.tsx       # 汇总卡片
└── hooks/
    └── useCreation.ts        # 创建状态管理
```

---

## 6. 预计工时

| 阶段 | 预计工时 |
|------|---------|
| A: 基础结构 | 1小时 |
| B: 世界选择 | 1.5小时 |
| C: 身份设定 | 2小时 |
| D: 天赋抽取 | 1.5小时 |
| E: 技能继承 | 1.5小时 |
| F: 确认 | 1小时 |
| G: 后端 | 1小时 |
| **总计** | **~10小时** |
