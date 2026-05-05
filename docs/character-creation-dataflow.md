# 角色创建数据流分析报告

> **项目**: 人生回响 (Life Echo) - AI人生模拟器游戏
> **分析日期**: 2026-05-04
> **分析范围**: 角色创建（捏人）→ 数据存储 → 游戏加载 → AI叙事生成 的完整数据链路

---

## 1. 数据流总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            角色创建数据流全景图                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   用户操作                                                                    │
│      │                                                                       │
│      ▼                                                                       │
│   ┌──────────────────────────────────────────┐                              │
│   │  CreationPage.tsx (5步表单)               │                              │
│   │  - StepWorld: 世界选择                     │                              │
│   │  - StepIdentity: 身份/属性                 │                              │
│   │  - StepTalent: 天赋抽取                    │                              │
│   │  - StepLegacy: 遗产继承                    │                              │
│   │  - StepConfirm: 确认命线                   │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      表单数据     │  CreationForm 类型                                         │
│      (内存)       │  { world, name, gender, age, personality, desire,         │
│                  │    attributes, talents, legacy }                           │
│                  │                                                           │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  useCreation.ts / handleCreate()          │                              │
│   │  组装 characterData 对象                   │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      HTTP POST   │  /api/saves                                                │
│                  │  { character, history[], achievements[], playTime, gen }   │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  saves.controller.ts / create()           │                              │
│   │  Prisma SaveData.create()                 │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      持久化      │  PostgreSQL (JSON 格式)                                     │
│                  │  SaveData 表: character(Json), history(Json[]), ...        │
│                  │                                                           │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  跳转 /game?saveId=xxx                    │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      HTTP GET    │  /api/saves/:id 或 /api/saves/active                      │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  GamePage.tsx / loadSave()                │                              │
│   │  createGameStateFromSave(saveData)        │                              │
│   │  后端 JSON → 前端 GameState 对象           │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      AI 请求     │  /api/ai/background 或 /api/ai/narrative                  │
│                  │  { character, lifeStatus, history, stage }                │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  ai.controller.ts                         │                              │
│   │  构建 Prompt → AI Service → LLM API       │                              │
│   │  返回结构化 JSON 节点                      │                              │
│   └──────────────┬───────────────────────────┘                              │
│                  │                                                           │
│      叙事数据     │  { text, yearsPassed, newAge, statusChanges,             │
│      (JSON)       │    shouldTriggerChoice, isDeath }                         │
│                  │                                                           │
│                  ▼                                                           │
│   ┌──────────────────────────────────────────┐                              │
│   │  GamePage.tsx 展示                         │                              │
│   │  - 打字机效果显示叙事文本                   │                              │
│   │  - 更新角色属性/状态                       │                              │
│   │  - 触发选择事件                            │                              │
│   │  - 保存到后端+本地                         │                              │
│   └──────────────────────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型与类型定义

### 2.1 前端创建表单类型

**文件**: `apps/web/src/pages/creation/data.ts`

```typescript
interface CreationForm {
  world: string;           // 世界ID: 'earth' | 'cultivation' | 'martial' | 'cyber' | 'doomsday' | 'myth'
  worldConfig: string;     // 世界配置: '现代' | '宗门' | '武馆' 等
  name: string;            // 角色姓名
  gender: string;          // 性别: '男' | '女' | '未知'
  age: string;             // 开局年龄阶段: '幼年' | '少年' | '成年'
  personality: string;     // 性格: '冷静克制' | '野心强烈' | ...
  desire: string;          // 欲望: '改变命运' | '守护家人' | ...
  customNote: string;      // 自定义备注（用户自由输入）
  attributes: Record<string, number>;  // 4维属性: { body, mind, charm, fate }，范围 1-10
  talents: Talent[];       // 天赋数组（最多3个）
  legacy: LegacyItem[];    // 遗产数组（最多3个）
}
```

### 2.2 后端数据库存储模型

**文件**: `apps/api/prisma/schema.prisma`

```prisma
model SaveData {
  id           String   @id @default(cuid())    // 存档唯一ID
  userId       String                              // 关联用户ID
  character    Json                                // ⭐ 角色完整信息（JSON格式）
  history      Json[]                              // 历史事件数组（JSON数组）
  achievements String[]                            // 已解锁成就ID列表
  playTime     Int      @default(0)               // 游戏时长（秒）
  generation   Int      @default(1)               // 轮回世代数
  saveDate     DateTime @default(now())            // 存档创建时间
  syncStatus   String   @default("synced")         // 同步状态
  createdAt    DateTime @default(now())            // 记录创建时间
  updatedAt    DateTime @updatedAt                 // 最后更新时间
}
```

**关键设计决策**: `character` 和 `history` 使用 PostgreSQL 的 `Json`/`Json[]` 类型存储，而非关系型表结构。这使得游戏数据结构灵活可变，无需频繁修改数据库 Schema。

### 2.3 游戏引擎类型

**文件**: `apps/web/src/engine/gameEngine.ts`

```typescript
// 游戏角色（引擎内部使用）
interface GameCharacter {
  name: string;
  world: string;           // 世界名称（如"地球 Online"）
  gender: string;
  age: number;             // 当前年龄（数字）
  lifeStage: LifeStage;    // 'infant' | 'child' | 'youth' | 'adult' | 'elder'
  personality: string;
  desire: string;
  attributes: {            // 4维基础属性
    body: number;          // 体魄
    mind: number;          // 悟性
    charm: number;         // 羁绊（原"魅力"）
    fate: number;          // 气运
  };
  talents: string[];       // 天赋名称数组
  legacy: string[];        // 遗产名称数组
  isAlive: boolean;
}

// 人生状态（动态变化）
interface LifeStatus {
  identity: string;        // 当前身份（散修、猎户弟子等）
  location: string;        // 当前地点
  ability: string;         // 当前能力/境界/职业等级
  items: string[];         // 拥有的物品、功法、资源
  relationships: string[]; // 重要关系
  injuries: string[];      // 伤病、暗伤
  reputation: string;      // 名声
  goals: string[];         // 当前目标
  tags: string[];          // 关键标签
  pending: string[];       // 未解决伏笔
}

// 游戏状态（全局）
interface GameState {
  character: GameCharacter;
  lifeStatus: LifeStatus;   // 当前人生状态
  history: GameHistory[];   // 历史节点数组
  currentEvent: GameEvent | null;  // 当前待选事件
  gameStatus: 'playing' | 'paused' | 'dead' | 'ascended';
  generation: number;       // 轮回世代
  playTime: number;
}
```

---

## 3. 创建流程详细分析

### 3.1 用户填写阶段

**文件**: `apps/web/src/pages/creation/CreationPage.tsx` + `useCreation.ts`

用户通过5个步骤完成角色创建：

| 步骤 | 组件 | 收集内容 | 数据校验 |
|------|------|----------|----------|
| Ⅰ | StepWorld | 世界选择（6选1） | 必填 |
| Ⅱ | StepIdentity | 姓名、性别、年龄阶段、性格、欲望、4维属性分配 | 属性总和限制 |
| Ⅲ | StepTalent | 随机抽取3个天赋 | 自动抽取，不可手动选择 |
| Ⅳ | StepLegacy | 选择最多3项遗产 | 最多3项限制 |
| Ⅴ | StepConfirm | 确认所有信息 | 无（仅展示） |

**属性系统**: 4维属性（体魄/悟性/魅力/气运），每项范围 1-10，通过 StepIdentity 中的 +/- 按钮调整。

**天赋抽取**: 从3个预设天赋池中随机选择一个池子，再随机抽取3个天赋（带动画效果）。

```typescript
// useCreation.ts / drawTalents()
const poolIndex = Math.floor(Math.random() * TALENT_POOLS.length);
const pool = TALENT_POOLS[poolIndex];
const shuffled = [...pool].sort(() => Math.random() - 0.5);
updateForm({ talents: shuffled.slice(0, 3) });
```

### 3.2 提交保存阶段

**文件**: `apps/web/src/pages/creation/useCreation.ts` / `handleCreate()`

当用户在第5步点击"铭刻命线"按钮时，触发 `handleCreate()` 方法：

```typescript
const handleCreate = async () => {
  // 1. 组装角色数据
  const worldConfig = WORLDS.find((w) => w.id === form.world);
  const characterData = {
    name: form.name || '无名者',
    world: worldConfig?.name || '地球 Online',    // 存储世界名称（如"地球 Online"）
    worldConfig: form.worldConfig,                 // 存储配置选项
    gender: form.gender,
    age: form.age,                                 // 存储年龄阶段文本（如"幼年"）
    personality: form.personality,
    desire: form.desire,
    customNote: form.customNote,
    attributes: form.attributes,                   // { body, mind, charm, fate }
    talents: form.talents,                         // Talent[] 数组
    legacy: form.legacy,                           // LegacyItem[] 数组
    lifeStage: '幼年',
    isAlive: true,
  };

  // 2. 调用后端API创建存档
  const res = await saveApi.create({
    character: characterData,
    history: [],           // 初始为空数组
    achievements: [],      // 初始无成就
    playTime: 0,
    generation: 1,         // 第一世
  });

  // 3. 获取存档ID并清理旧本地备份
  const saveId = res.data.save.id;
  clearLocalBackup();      // 清除旧的 localStorage 备份

  // 4. 跳转到游戏页面
  navigate(`/game?saveId=${saveId}`);
};
```

**注意**: `world` 字段存储的是世界的**显示名称**（如"地球 Online"），而非 ID（如"earth"）。这个设计在后续传递给AI时直接使用显示名称。

### 3.3 后端处理阶段

**文件**: `apps/api/src/controllers/saves.controller.ts` / `create()`

```typescript
async create(req: Request, res: Response) {
  const userId = (req as any).userId;  // 从JWT中提取用户ID
  const { character, history, achievements, playTime, generation } = req.body;

  // 简单校验
  if (!character || !character.name) {
    return res.status(400).json({ success: false, message: '角色信息不完整' });
  }

  // 使用Prisma创建记录
  const save = await prisma.saveData.create({
    data: {
      userId,
      character: character || {},        // JSON格式存储
      history: history || [],            // JSON数组格式存储
      achievements: achievements || [],
      playTime: playTime || 0,
      generation: generation || 1,
      syncStatus: 'synced',
    },
  });

  res.status(201).json({ success: true, save });
}
```

**数据库存储格式** (character 字段 JSON 示例):

```json
{
  "name": "张三",
  "world": "地球 Online",
  "worldConfig": "现代",
  "gender": "男",
  "age": "幼年",
  "personality": "冷静克制",
  "desire": "改变命运",
  "customNote": "",
  "attributes": { "body": 7, "mind": 9, "charm": 6, "fate": 8 },
  "talents": [
    { "rarity": "Rare / 稀有", "name": "早慧之眼", "desc": "..." },
    { "rarity": "Epic / 史诗", "name": "命硬如石", "desc": "..." },
    { "rarity": "Rare / 稀有", "name": "人群回声", "desc": "..." }
  ],
  "legacy": [
    { "mark": "技", "rarity": "Skill / From 周砚", "name": "竞赛直觉", "desc": "...", "source": "..." }
  ],
  "lifeStage": "幼年",
  "isAlive": true
}
```

---

## 4. 游戏加载阶段

### 4.1 加载流程

**文件**: `apps/web/src/pages/GamePage.tsx` / `loadSave()`

当用户跳转到 `/game?saveId=xxx` 时，GamePage 执行加载逻辑：

```
1. 从 URL 获取 saveId
2. 调用 saveApi.getById(saveId) 获取后端存档数据
3. 检查本地 localStorage 备份（比较时间戳，使用更新的）
4. 调用 createGameStateFromSave(saveData) 转换为 GameState
5. 检查 AI 配置（是否配置了 API Key）
6. 如果是新游戏（history为空）且有AI配置 → 调用AI生成初始背景
7. 如果是继续游戏（history有内容）→ 恢复历史记录到 storyEntries
```

### 4.2 数据转换

**文件**: `apps/web/src/engine/gameEngine.ts` / `createGameStateFromSave()`

这是连接**后端存储模型**和**前端游戏引擎**的关键转换函数：

```typescript
export function createGameStateFromSave(saveData: any): GameState {
  const character = saveData.character;

  // 将年龄阶段文本转换为数字年龄
  const ageMap: Record<string, number> = {
    '幼年': 0, '少年': 7, '青年': 13, '成年': 19, '终焉': 61
  };
  const initialAge = ageMap[character.age] ?? character.age ?? 0;

  return {
    character: {
      name: character.name || '无名者',
      world: character.world || '地球 Online',
      gender: character.gender || '未知',
      age: initialAge,                        // 数字年龄（用于游戏逻辑）
      lifeStage: getLifeStage(initialAge),    // 根据年龄计算阶段
      personality: character.personality || '普通',
      desire: character.desire || '无',
      attributes: {
        body: character.attributes?.body || 5,
        mind: character.attributes?.mind || 5,
        charm: character.attributes?.charm || 5,
        fate: character.attributes?.fate || 5,
      },
      talents: (character.talents || []).map((t: any) => t.name || t),
      legacy: (character.legacy || []).map((l: any) => l.name || l),
      isAlive: character.isAlive !== undefined ? character.isAlive : true,
    },
    lifeStatus: saveData.lifeStatus || createDefaultLifeStatus(),
    history: saveData.history || [],
    currentEvent: saveData.currentEvent || null,
    gameStatus: saveData.gameStatus || 'playing',
    generation: saveData.generation || 1,
    playTime: saveData.playTime || 0,
  };
}
```

**关键转换点**:

| 后端存储 | 前端引擎 | 转换逻辑 |
|----------|----------|----------|
| `age: "幼年"` (文本) | `age: 0` (数字) | 通过 ageMap 映射 |
| `talents: [{name, desc}]` (对象数组) | `talents: ["早慧之眼"]` (字符串数组) | 提取 name 字段 |
| `legacy: [{name, desc}]` (对象数组) | `legacy: ["竞赛直觉"]` (字符串数组) | 提取 name 字段 |
| `lifeStatus` (可能不存在) | 默认人生状态 | createDefaultLifeStatus() |

---

## 5. AI 传递阶段

### 5.1 AI 调用流程

角色信息通过以下 API 端点传递给 AI：

| API 端点 | 调用时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `POST /api/ai/background` | 新游戏首次加载 | `{ character }` | 生成初始出生背景 |
| `POST /api/ai/narrative` | 点击"拨动命线" | `{ character, lifeStatus, history, stage }` | 生成下一个人生节点 |
| `POST /api/ai/choices` | 触发选择事件 | `{ character, lifeStatus, node }` | 生成选择选项 |
| `POST /api/ai/chat` | NPC对话（未实现UI） | `{ character, npc, message, history }` | NPC自由对话 |

### 5.2 AI Prompt 构建

**文件**: `apps/api/src/controllers/ai.controller.ts`

AI 控制器将角色信息构建成详细的 Prompt，包含以下部分：

#### 5.2.1 世界观设定映射

```typescript
const WORLD_DESCRIPTIONS: Record<string, string> = {
  '地球 Online': '现代地球社会。没有修仙、没有超能力。人生围绕家庭、学业、职业、经济、人际关系、健康、意外事件展开。',
  '修仙世界': '修真世界，有灵根、宗门、功法、秘境、妖兽、丹药、法器、境界划分（练气、筑基、金丹等）。',
  // ... 其他世界
};
```

#### 5.2.2 系统 Prompt 结构（以 generateNarrative 为例）

```
你是一位人生编年史作者。为人生模拟器生成下一条人生节点。

【世界观设定】
当前世界：地球 Online
现代地球社会。没有修仙、没有超能力...

【绝对规则】
1. 你必须严格遵守上述世界观设定
2. 严禁跨世界观混搭
3. 输出格式：必须返回纯 JSON

【节点 JSON 格式】
{
  "yearsPassed": 5,
  "newAge": 28,
  "text": "28岁 — 具体事件描述",
  "eventType": "具体类型",
  "summary": "事件摘要",
  "consequences": ["后果1"],
  "statusChanges": {
    "identity": "新身份",
    "location": "新地点",
    "ability": "新能力",
    "items": ["物品1"],
    "relationships": ["关系1"],
    ...
  },
  "shouldTriggerChoice": false,
  "isDeath": false
}
```

#### 5.2.3 用户 Prompt 结构

```
此前人生节点：
  0岁 — 你出生在...
  5岁 — 你在幼儿园...
  （选择了：勇敢面对）

当前人生状态：
身份：小学生
地点：北京
能力：尚未成长
物品：无
关系：父亲：工程师、母亲：教师
伤病：无
名声：默默无闻
目标：无
标签：北京、普通家庭
伏笔：无

角色：张三，性别：男，10岁，阶段：child
世界：地球 Online
性格：冷静克制，欲望：改变命运
天赋：早慧之眼、命硬如石、人群回声
继承：竞赛直觉
属性：体魄7/悟性9/羁绊6/气运8

请基于此前人生节点和当前状态，生成下一条人生节点。
```

### 5.3 AI 返回数据结构

AI 返回的结构化 JSON 节点示例：

```json
{
  "yearsPassed": 5,
  "newAge": 15,
  "text": "15岁 — 中考前的那个冬天，你父亲的公司突然裁员。原本安静的家开始充满争吵，你发现自己必须比同龄人更快成熟。",
  "eventType": "family",
  "summary": "家庭变故",
  "consequences": ["家庭经济状况恶化", "心理早熟"],
  "statusChanges": {
    "identity": "初中学生",
    "location": "北京",
    "ability": "学业中上",
    "items": ["旧书包"],
    "relationships": ["父亲：失业在家", "母亲：焦虑"],
    "injuries": [],
    "reputation": "默默无闻",
    "goals": ["考上好高中"],
    "tags": ["北京", "普通家庭", "经济困难"],
    "pending": ["父亲能否找到新工作"]
  },
  "shouldTriggerChoice": true,
  "isDeath": false
}
```

### 5.4 前端处理 AI 返回

**文件**: `apps/web/src/pages/GamePage.tsx`

```typescript
// 1. 应用状态变化
const newLifeStatus = applyLifeStatusChanges(
  state.lifeStatus || createDefaultLifeStatus(),
  node.statusChanges
);

// 2. 更新角色年龄
const newCharacter = { ...state.character, age: node.newAge || 0 };

// 3. 添加到历史记录
const newState = addHistoryEntry(
  { ...state, character: newCharacter, lifeStatus: newLifeStatus },
  node.summary || '人生节点',
  node.text,
  '',           // 尚未做选择
  {},           // 尚无属性变化
  {
    yearsPassed: node.yearsPassed,
    eventType: node.eventType,
    summary: node.summary,
    consequences: node.consequences,
    statusChanges: node.statusChanges,
    isDeath: node.isDeath,
    deathText: node.deathText,
  }
);

// 4. 检查是否触发选择
if (node.shouldTriggerChoice) {
  // 调用 AI 生成选择选项
  const choiceRes = await aiApi.generateChoices({
    character: newCharacter,
    lifeStatus: newLifeStatus,
    node,
    count: 3,
  });
  // 显示选择按钮...
}

// 5. 保存到后端和本地
await saveGameState(newState, currentSaveId);
```

---

## 6. 数据持久化与同步

### 6.1 双写策略

**文件**: `apps/web/src/pages/GamePage.tsx` / `saveGameState()`

游戏状态同时保存到两个位置：

```typescript
const saveGameState = async (state: GameState, currentSaveId: string) => {
  try {
    const serialized = serializeGameState(state);

    // 1. 保存到后端（PostgreSQL）
    await saveApi.update(currentSaveId, serialized);

    // 2. 保存到本地（localStorage）
    saveLocalBackup(state, currentSaveId);
  } catch (err) {
    // 后端失败时，至少保存到本地
    console.error('Backend save failed, falling back to local:', err);
    saveLocalBackup(state, currentSaveId);
  }
};
```

### 6.2 存档序列化

**文件**: `apps/web/src/engine/gameEngine.ts` / `serializeGameState()`

```typescript
export function serializeGameState(state: GameState): any {
  return {
    character: { /* ... */ },
    lifeStatus: state.lifeStatus,
    history: state.history,
    currentEvent: state.currentEvent,
    gameStatus: state.gameStatus,
    generation: state.generation,
    playTime: state.playTime,
    _version: 1,           // 存档版本号（向后兼容）
    _savedAt: Date.now(),  // 保存时间戳
  };
}
```

### 6.3 本地备份格式

**文件**: `apps/web/src/services/storage.ts`

```typescript
// localStorage 存储结构
{
  saveId: "clv...",        // 关联的存档ID
  timestamp: 1714800000000, // 保存时间戳
  state: { /* GameState 完整数据 */ }
}
```

### 6.4 恢复策略

加载时优先使用**更新的**数据源：

```typescript
// 1. 从后端加载
const backendSave = await saveApi.getById(saveId);

// 2. 检查本地备份
const localBackup = loadLocalBackup();

// 3. 比较时间戳，选择更新的
if (localBackup && localBackup.saveId === saveId) {
  const backendTime = new Date(backendSave.updatedAt).getTime();
  const localTime = localBackup.timestamp;
  if (localTime > backendTime) {
    saveData = localBackup.state;  // 本地更新，使用本地
  }
}
```

---

## 7. 数据流时序图

```
用户              前端                 后端              数据库              AI API
 │                 │                    │                  │                  │
 │ 填写表单        │                    │                  │                  │
 │───────────────▶│                    │                  │                  │
 │                 │                    │                  │                  │
 │ 点击"铭刻命线"  │                    │                  │                  │
 │───────────────▶│                    │                  │                  │
 │                 │ handleCreate()     │                  │                  │
 │                 │ 组装 characterData │                  │                  │
 │                 │───────────────────▶│                  │                  │
 │                 │ POST /api/saves    │                  │                  │
 │                 │ {character,...}    │                  │                  │
 │                 │                    │ Prisma.create()  │                  │
 │                 │                    │─────────────────▶│                  │
 │                 │                    │                  │ INSERT SaveData  │
 │                 │                    │                  │ (JSON格式)       │
 │                 │                    │◀─────────────────│                  │
 │                 │                    │                  │                  │
 │                 │◀───────────────────│ return save.id   │                  │
 │                 │                    │                  │                  │
 │                 │ 跳转 /game?saveId=xx                   │                  │
 │◀───────────────│                    │                  │                  │
 │                 │                    │                  │                  │
 │                 │ loadSave()         │                  │                  │
 │                 │ GET /api/saves/:id │                  │                  │
 │                 │───────────────────▶│                  │                  │
 │                 │                    │ Prisma.findFirst()                  │
 │                 │                    │─────────────────▶│                  │
 │                 │                    │◀─────────────────│                  │
 │                 │◀───────────────────│ return save data │                  │
 │                 │                    │                  │                  │
 │                 │ createGameStateFromSave()            │                  │
 │                 │ 转换为 GameState   │                  │                  │
 │                 │                    │                  │                  │
 │                 │ aiApi.generateBackground()           │                  │
 │                 │ POST /api/ai/background              │                  │
 │                 │ {character}        │                  │                  │
 │                 │───────────────────▶│                  │                  │
 │                 │                    │ 构建 Prompt      │                  │
 │                 │                    │─────────────────────────────────────▶│
 │                 │                    │                  │                  │ LLM推理
 │                 │                    │◀─────────────────────────────────────│
 │                 │                    │ return JSON node │                  │
 │                 │◀───────────────────│                  │                  │
 │                 │                    │                  │                  │
 │                 │ 更新 GameState     │                  │                  │
 │                 │ 显示打字机效果     │                  │                  │
 │◀───────────────│                    │                  │                  │
 │                 │                    │                  │                  │
 │                 │ saveGameState()    │                  │                  │
 │                 │ PUT /api/saves/:id │                  │                  │
 │                 │ + localStorage     │                  │                  │
 │                 │───────────────────▶│                  │                  │
 │                 │                    │ Prisma.update()  │                  │
 │                 │                    │─────────────────▶│                  │
 │                 │                    │                  │ UPDATE SaveData  │
 │                 │                    │◀─────────────────│                  │
 │                 │◀───────────────────│ success          │                  │
 │                 │                    │                  │                  │
```

---

## 8. 关键设计决策

### 8.1 为什么使用 JSON 存储角色数据？

**决策**: 使用 PostgreSQL 的 `Json` 类型存储 `character` 和 `history`，而非关系型表结构。

**优点**:
- 灵活性高：游戏数据结构频繁变化，无需修改数据库 Schema
- 开发速度快：无需维护复杂的关联表
- 适合游戏状态：角色属性、历史事件等本身就是半结构化数据

**缺点**:
- 无法对 JSON 内部字段做 SQL 查询和索引
- 数据完整性约束较弱
- 不适合大规模数据分析

**权衡**: 对于独立游戏项目，灵活性和开发速度优先于严格的规范化。

### 8.2 为什么前端做年龄映射？

**决策**: 后端存储年龄阶段文本（"幼年"/"少年"/"成年"），前端转换为数字年龄。

```typescript
const ageMap = { '幼年': 0, '少年': 7, '青年': 13, '成年': 19, '终焉': 61 };
```

**原因**:
- 创建表单使用文本标签更直观
- 游戏引擎需要数字年龄进行计算（阶段判断、寿命检查）
- 创建时无需精确数字，减少用户决策负担

### 8.3 为什么使用 localStorage 双写？

**决策**: 同时保存到后端 PostgreSQL 和前端 localStorage。

**原因**:
- 网络不稳定时，localStorage 保证数据不丢失
- 页面刷新后可快速恢复（无需等待后端响应）
- 实现简单，无需引入 IndexedDB/Dexie.js 复杂度

### 8.4 AI Prompt 为什么包含完整历史？

**决策**: 每次 AI 调用都传递最近 8 条历史记录。

**原因**:
- 保证叙事连贯性：AI 知道之前发生了什么
- 避免突兀跳转：新事件必须承接旧故事
- 状态感知：AI 了解当前身份、地点、物品、关系

**代价**:
- Prompt 长度随历史增长
- API 费用增加（按 token 计费）
- 响应时间可能变长

---

## 9. 发现的问题与建议

### 9.1 数据一致性问题

**问题**: 创建表单中的 `attributes` 键名与游戏引擎中的不一致风险。

```typescript
// creation/data.ts 中使用的是前端键名
attributes: { body, mind, charm, fate }

// 但在某些地方可能误用中文键名
// 如 StepIdentity 组件中若使用 '体魄' 而非 'body' 会导致数据丢失
```

**建议**: 统一使用英文键名，在显示层做本地化映射。

### 9.2 世界ID与显示名称的混淆

**问题**: 创建时存储 `world: "地球 Online"`（显示名称），但 `worldConfig: "现代"`（配置选项）。游戏引擎和 AI 都依赖显示名称来识别世界。

**风险**: 若修改世界显示名称，所有历史存档的世界识别都会失效。

**建议**: 同时存储 `worldId`（稳定标识符）和 `worldName`（显示名称）。

### 9.3 天赋/遗产信息丢失

**问题**: 游戏引擎只保留天赋/遗产的 `name`，丢弃了 `desc`（描述）和 `rarity`（稀有度）信息。

```typescript
// 转换时只保留名称
talents: (character.talents || []).map((t: any) => t.name || t),
legacy: (character.legacy || []).map((l: any) => l.name || l),
```

**影响**: AI 无法了解天赋的具体效果描述，影响叙事质量。

**建议**: 保留完整的 talent/legacy 对象，或至少保留 `desc` 字段传递给 AI。

### 9.4 缺少数据验证

**问题**: 后端 `saves.controller.ts` 的 `create()` 方法仅验证了 `character.name`，未验证其他字段。

**风险**: 恶意或错误的请求可能创建不完整或格式错误的存档。

**建议**: 增加更完整的字段验证，或使用 Zod/Yup 等 Schema 验证库。

### 9.5 存档版本管理

**现状**: `serializeGameState()` 已包含 `_version: 1` 字段，但没有版本升级逻辑。

**建议**: 当 GameState 结构变化时，需要实现版本迁移逻辑：

```typescript
function migrateGameState(state: any): GameState {
  if (state._version === 1) {
    // 从 v1 升级到 v2
    return { ...state, _version: 2, newField: defaultValue };
  }
  return state;
}
```

---

## 10. 总结

**角色创建数据流的核心链路**:

1. **收集**: 用户通过5步表单输入角色信息 → 存储在 `CreationForm` 类型中
2. **提交**: `handleCreate()` 组装 `characterData` → 调用 `saveApi.create()` → 后端 Prisma 存入 PostgreSQL
3. **加载**: GamePage 从后端读取存档 → `createGameStateFromSave()` 转换为 `GameState`
4. **传递**: 游戏过程中通过 `aiApi` 将 `character + lifeStatus + history` 传递给后端 AI 服务
5. **返回**: AI 生成结构化 JSON 节点 → 前端更新 `GameState` → 双写到后端和 localStorage

**数据流特点**:
- **JSON 优先**: 大量使用 JSON 存储和传输，灵活但约束较弱
- **双写备份**: 后端 + 本地双保险，保证数据安全
- **AI 驱动**: 角色信息全程参与 AI Prompt 构建，是叙事生成的核心上下文
- **版本预留**: 已预留 `_version` 字段，为后续数据结构升级做准备

**下一阶段建议**:
- 增加 `worldId` 稳定标识符
- 保留天赋/遗产完整信息传递给 AI
- 实现存档版本迁移逻辑
- 加强后端数据验证
