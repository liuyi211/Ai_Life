# Stage 06 进度报告 - 游戏引擎核心

> **项目**: 人生回响 (Life Echo)
> **阶段**: 阶段06 - 游戏引擎核心
> **完成日期**: 2026-05-02
> **状态**: ✅ 已完成

---

## 完成内容概述

实现了完整的游戏引擎核心，包括年龄推进系统、事件触发系统、事件选择处理、属性计算引擎和游戏状态管理。

---

## 详细完成项

### 1. 游戏引擎核心 (`apps/web/src/engine/gameEngine.ts`)

#### 1.1 年龄和阶段管理 ✅

| 功能 | 说明 |
|------|------|
| `getLifeStage(age)` | 根据年龄返回人生阶段 |
| `getLifeStageName(stage)` | 返回阶段中文名 |
| `getNextStageAge(stage)` | 返回下一阶段的起始年龄 |

**人生阶段划分**：
- 幼年 (infant): 0-6岁
- 少年 (child): 7-12岁
- 青年 (youth): 13-18岁
- 成年 (adult): 19-60岁
- 终焉 (elder): 61岁+

#### 1.2 属性计算引擎 ✅

**基础属性**（4维）：
- 体魄 (body): 影响健康、寿命、力量
- 悟性 (mind): 影响财富、声望、智慧
- 魅力 (charm): 影响声望、幸福、人际关系
- 气运 (fate): 影响寿命、财富、幸福、力量

**衍生属性**（6维）：
- 健康 (health): `body * 8 + fate * 2 + 40`
- 寿命 (lifespan): `60 + body * 3 + fate * 4 + mind * 1`
- 声望 (reputation): `charm * 5 + mind * 3 + fate * 2`
- 心境 (happiness): `50 + charm * 3 + fate * 2 - abs(10 - body) * 2`
- 财富 (wealth): `mind * 3 + charm * 2 + fate * 4 + 20`
- 力量 (power): `body * 4 + mind * 3 + fate * 3`

#### 1.3 事件生成器 ✅

**事件模板系统**：

| 阶段 | 模板数量 | 示例 |
|------|----------|------|
| 幼年 | 3 | 学步、幼儿园、玩具争夺 |
| 少年 | 4 | 课堂提问、放学探险、故事影响、考试成绩 |
| 青年 | 4 | 青春期、高考、匿名信、人生选择 |
| 成年 | 4 | 职场挑战、陌生对话、财富反思、故乡来信 |
| 终焉 | 4 | 退休、医院、访客、遗物整理 |

**选择项模板**：
- 每个阶段 3-4 个预设选择
- 每个选择影响不同属性（+1 或 +2）
- 随机打乱顺序，每次游戏不同

#### 1.4 事件效果应用 ✅

```typescript
function applyChoiceEffects(character, effects): GameCharacter
```

- 支持体魄/悟性/魅力/气运四种属性变化
- 属性值限制在 1-20 范围
- 返回新的角色对象（不可变更新）

#### 1.5 游戏状态管理 ✅

```typescript
interface GameState {
  character: GameCharacter;    // 角色数据
  history: GameHistory[];      // 历史记录
  currentEvent: GameEvent | null;  // 当前事件
  gameStatus: 'playing' | 'paused' | 'dead' | 'ascended';
  generation: number;          // 轮回次数
  playTime: number;           // 游戏时长
}
```

**状态转换**：
```
playing → (推进时间) → 生成事件 → 等待选择
playing → (选择选项) → 应用效果 → 检查死亡
playing → (年龄 >= 寿命) → dead
```

#### 1.6 存档序列化 ✅

```typescript
function createGameStateFromSave(saveData): GameState
function serializeGameState(state): any
```

- 从数据库存档创建游戏状态
- 年龄字符串映射到数值（幼年=0, 少年=7, 成年=19）
- 游戏结束时序列化回存档格式

---

### 2. 游戏页面 (`apps/web/src/pages/GamePage.tsx`)

#### 2.1 完整游戏循环 ✅

```
加载存档 → 显示角色信息 → 点击"推进时间"
  → 年龄+1 → 生成事件 → 显示叙事+选择
  → 玩家选择 → 应用效果 → 更新存档
  → 检查死亡 → 循环继续
```

#### 2.2 角色信息面板 ✅

| 显示项 | 说明 |
|--------|------|
| 角色名 | 大标题显示 |
| 世界背景 | 顶部显示 |
| 人生阶段 | 实时更新 |
| 当前年龄 | 数值显示 |
| 4维基础属性 | 体魄/悟性/魅力/气运 |
| 3维衍生属性 | 健康/声望/心境 |
| 寿命上限 | 右上角显示 |

#### 2.3 事件展示 ✅

- **标题**: 阶段名 + 年份
- **叙事文本**: AI生成或模板文本（200-500字）
- **选择项**: 2-4个按钮，悬停效果
- **状态**: "模拟进行中" / "命运已终结"

#### 2.4 历史记录 ✅

- 点击"人生历程"显示/隐藏
- 按时间倒序排列
- 显示年份、事件标题、选择内容

#### 2.5 死亡结算 ✅

- 寿命耗尽或属性归零时触发
- 显示"命运终结"面板
- 显示总年龄和经历事件数
- 提供"开启新轮回"按钮

---

## 技术实现细节

### 状态管理

使用 React `useState` + `useCallback` 管理游戏状态：

```typescript
const [gameState, setGameState] = useState<GameState | null>(null);
```

### AI 集成

推进时间时自动调用 AI 生成叙事：

```typescript
// 1. 生成模板事件
const event = generateEvent(newState);

// 2. 尝试用 AI 生成更丰富的叙事
try {
  const res = await aiApi.generateNarrative({
    character: { ... },
    context: `第 ${age} 年，阶段：${stage}`
  });
  event.narrative = res.data.narrative;
} catch {
  // AI 失败时使用模板叙事
}
```

### 存档自动保存

每次选择后自动保存：

```typescript
const saveGameState = async (state: GameState) => {
  const serialized = serializeGameState(state);
  await saveApi.update(saveId, serialized);
};
```

---

## 文件列表

| 文件 | 功能 | 行数 |
|------|------|------|
| `apps/web/src/engine/gameEngine.ts` | 游戏引擎核心 | ~350 |
| `apps/web/src/pages/GamePage.tsx` | 游戏主页面 | ~400 |

---

## 测试验证

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 前端类型检查 | ✅ | tsc --noEmit 通过 |
| 前端构建 | ✅ | 387KB JS + 6KB CSS |
| 后端类型检查 | ✅ | tsc --noEmit 通过 |
| 后端构建 | ✅ | tsc 通过 |
| 年龄推进 | ✅ | 0→1→2... 阶段自动切换 |
| 事件触发 | ✅ | 每阶段不同模板 |
| 选择效果 | ✅ | 属性正确变化 |
| 存档保存 | ✅ | 选择后自动保存 |
| 死亡判定 | ✅ | 寿命耗尽触发 |
| AI 叙事 | ✅ | 配置了 AI 时调用 |

---

## 游戏流程验证

完整的游戏循环现已打通：

```
Dashboard → 继续此生 → GamePage
  → 显示角色信息（年龄0岁，幼年阶段）
  → 点击"推进时间"
  → 年龄→1岁，生成事件
  → 显示叙事文本 + 选择项
  → 选择选项
  → 属性变化，保存存档
  → ...（循环）
  → 年龄达到寿命
  → 显示死亡结算
  → 点击"开启新轮回"
  → 跳转到 CreationPage
```

---

## 待优化项（阶段10）

| 优化项 | 说明 |
|--------|------|
| 流式输出 | AI 叙事文本逐字显示 |
| 动画效果 | 年龄增长、属性变化动画 |
| 音效 | 事件触发、选择音效 |
| 更多事件 | 每个阶段 10+ 个模板 |
| 事件链 | 连续事件、因果关联 |
| 成就系统 | 特殊事件触发成就 |

---

## 总结

阶段06成功实现了完整的游戏引擎核心：

1. ✅ **年龄推进系统**: 5个人生阶段，自动切换
2. ✅ **属性计算引擎**: 4维基础→6维衍生
3. ✅ **事件触发系统**: 模板+AI双保险
4. ✅ **事件选择处理**: 效果应用+存档更新
5. ✅ **死亡判定**: 寿命/属性双重检查
6. ✅ **完整游戏循环**: 推进→事件→选择→保存

游戏现在可以完整运行：从创建角色到死亡结算的完整生命周期模拟。
