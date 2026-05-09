# 人生模拟叙事重构设计文档

**日期**: 2026-05-06
**作者**: 与 Claude Code 协作设计
**状态**: 待实现

## 0. 背景与目标

当前人生模拟的 AI 生成质量差，无法产出用户期望的"修仙世界 0-86 岁"或"紫禁城 0-45 岁"那种富有叙事张力的人生节点。问题根因（已通过代码审计确认）：

1. **文本过短**: `ai.controller.ts:674` 把每段叙事强制限制在 15-80 字，无法承载情节。
2. **氛围词被禁**: `ai.controller.ts:381,717,1045` 的 avoid-word 黑名单（命运/齿轮/星河/终焉/低语/裂缝/虚空/倒计时）杀掉了所有想象力。
3. **选择无后果**: 玩家做完选择，下一节点直接跳到新场景，没有"你选择 X，结果 Y"的叙事衔接。
4. **历史压缩丢人物**: `ai.controller.ts:520-568` 把每个事件压成一行，重要 NPC（如沈青）被冲刷殆尽，无法回归。
5. **死亡用模板**: `GamePage.tsx:486-498` 用固定字符串拼接死亡场景，没有 AI 介入，缺少"凡尘终章"那种结局张力。
6. **过渡词模板化**: `worldConfig.ts:200-206` 从写死的 `transition.short/long` 数组里随机抽，永远是"白驹过隙、寒来暑往"。

**目标**: 通过 5 段提示词重构 + 4 层上下文重组 + 后果/死亡两个新接口，让 AI 产出对标示例的人生节点。

---

## 1. 架构与 API 设计

### 1.1 现有接口梳理

| 现状接口 | 当前职责 | 重构后职责 |
| --- | --- | --- |
| `POST /api/ai/generate-background` | 生成出生背景（80-120字） | 保留，扩到 80-150 字 |
| `POST /api/ai/generate-narrative` | 生成下一个人生节点（15-80字 + 选择） | **拆**：`needChoices=false` 返回纯叙事 + transition；`needChoices=true` 返回叙事 + choiceContext + choices[] |
| `POST /api/ai/generate-narrative-stream` | SSE 流式版本 | 同上，仅流式版本同步改造 |
| `POST /api/ai/calculate-advance-years` | 决定推进多少年 | 保留，但年龄推进同时返回（避免再调一次接口） |
| `POST /api/ai/generate-choices` | 单独生成选择 | **废弃** → HTTP 410 Gone（已合并进 narrative 接口） |
| `POST /api/ai/generate-world` | 生成世界设定 | 保留 |
| `POST /api/ai/chat-npc` | NPC 对话 | 保留 |
| `POST /api/ai/generate-prophecy` | 预言 | 保留 |

### 1.2 新增接口

```
POST /api/ai/consequence
  请求: { saveId, lastEvent, choiceText, lifeStatus, character }
  响应: {
    consequenceText: string,           // 40-80字 后果叙事
    statusChanges?: Partial<LifeStatus> // 可选状态变化
  }
  调用时机: 玩家点完选择按钮 → 在生成下一节点之前先生成此后果
  目的: 把"你咬牙背起那浑身血污的女修…三日后她不辞而别"这种衔接段落补回来

POST /api/ai/death
  请求: { saveId, character, lifeStatus, recentHistory, deathReason }
  响应: {
    preDeathText?: string,   // 死亡前最后一段（可选，60-100字，用于延寿/诀别等场景）
    deathText: string,       // 死亡正文（120-200字，多段，可含【...】式标题）
    endingTitle: string,     // 4字结局标题（如"凡尘终章"/"剑海归舟"）
    epitaph: string          // 30-60字 墓志铭
  }
  调用时机: gameEngine.checkDeath 返回 isDead=true 时
  目的: 替换 GamePage.tsx 现有的字符串拼接死亡逻辑
```

### 1.3 节奏控制（保留代码侧逻辑）

- 选择频率：**无选择节点 1 次 / 有选择节点 2 次**（用户已确认）。
- 实现位置：`GamePage.tsx` 维护 `nodesSinceLastChoice` 计数器，命中阈值时下一次 `generateNarrative` 调用 `needChoices: true`。
- AI 不再自己决定何时给选择 → 杜绝过度选择。

### 1.4 文本长度限制（场景化，用户已确认）

| 场景 | 长度区间 | 备注 |
| --- | --- | --- |
| 出生背景（generateBackground） | 80-150 字 | |
| 普通节点（generateNarrative，无选择） | 60-150 字 | 含 transition 时再加 8-20 字 |
| 选择节点叙事 | 60-150 字 | 不含 choiceContext |
| choiceContext（选择前的处境描述） | 30-80 字 | 接在叙事末尾 |
| 单条 choice.text | 12-30 字 | 取消现在的 10-20 字硬限 |
| 后果叙事（consequence） | 40-80 字 | |
| 死亡 deathText | 120-200 字 | 可分段 |
| 死亡 epitaph | 30-60 字 | |
| 4字标题（endingTitle） | 严格 4 字 | 服务器侧校验 |

**实现**: 通过 prompt 的"字数：X-Y 字"指令 + 解析阶段轻校验（不超过 +30% 即放过）。

---

## 2. 五段提示词设计

公共原则：

- 删除现有 avoid-word 黑名单。
- 系统提示统一指令"**禁止使用占位符（如『...』『XX』），必须给出具体名字、地点、动作**"。
- 所有节点叙事鼓励引入或回归 NPC，姓名要明确（沈青、师叔王启、小妹云娘）。

### 2.1 generateBackground（出生）

```
你是世界 {{world}} 的叙事 AI。请为以下角色撰写出生段落。

角色:
- 姓名: {{name}}, 性别: {{gender}}
- 性格: {{personality}}, 渴望: {{desire}}
- 天赋: {{talents.map(t => `${t.name}（${t.desc}）`).join('、')}}
- 遗产: {{legacy.map(l => `${l.name}（${l.desc}）`).join('、') || '无'}}

世界设定:
{{worldDescription}}
{{worldConfig 描述（如"宗门弟子"/"散修"）}}

要求:
1. 80-150 字，第二人称"你"。
2. 给出出生地点、家庭背景、关键 NPC（父母/师长/族人，至少 1 人有名字）。
3. 暗示天赋如何显现，但不要直接喊出天赋名。
4. 语气符合世界基调（修仙就修仙腔，赛博就赛博腔）。

只输出叙事正文，无标题、无解释。
```

### 2.2 generateNarrative — 普通节点（needChoices=false）

```
你是世界 {{world}} 的叙事 AI。请为角色生成下一个人生节点。

角色当前:
- 年龄: {{age}}（{{lifeStage 中文}}）
- 距上次: {{yearsPassed}} 年
- 身份: {{lifeStatus.identity}}
- 地点: {{lifeStatus.location}}
- 能力: {{lifeStatus.ability}}
- 名声: {{lifeStatus.reputation}}
- 物品: {{lifeStatus.items.slice(-5).join('、') || '无'}}
- 关系: {{lifeStatus.relationships.slice(-8).join('、') || '无'}}
- 当前目标: {{lifeStatus.goals.join('、') || '无'}}
- 未解伏笔: {{lifeStatus.pending.join('、') || '无'}}

近期经历:
{{compressedHistory}}      // 见 §4 上下文构建

最近 4 节点（原文）:
{{recentRawHistory}}

要求:
1. 整段 60-150 字，第二人称。
2. 如果 yearsPassed > 2，开头插入 8-20 字过渡句（"岁月如刀，七年弹指过"），结合身份/地点/伤病自然写。
3. 必须呼应至少一个：未解伏笔 / 关系名单 / 当前目标 / 物品。
4. 严格符合 {{lifeStage}} 阶段（幼年别让你掌门，成年别让你尿床）。
5. 可以引入新 NPC，但出场必须给名字和身份。

输出 JSON:
{
  "transition": "...",          // 可选，无过渡时为 ""
  "narrative": "...",           // 主体叙事
  "yearsPassed": <数字>,        // 该节点跨度
  "eventType": "milestone|random|crisis",
  "consequences": ["..."],      // 1-3 条本节点的客观结果
  "statusChanges": {            // 仅写需要变化的字段
    "identity": "...",          // 仅当身份变化
    "location": "...",          // 仅当地点变化
    "ability": "...",
    "items": ["..."],           // 完整新数组
    "relationships": ["..."],
    "injuries": ["..."],
    "reputation": "...",
    "goals": ["..."],
    "tags": ["..."],
    "pending": ["..."]
  }
}
```

### 2.3 generateNarrative — 选择节点（needChoices=true）

```
（前缀同 §2.2，附加要求：）

本节点末尾必须给玩家 2-4 个抉择。要求:
1. 在叙事末尾追加 30-80 字的处境段（choiceContext），让玩家明白选择背景。
2. choices[i].text 12-30 字，必须是动作或决断，禁止"思考一下"这种废操作。
3. 选项之间应该有真实代价差（一个稳但寡，一个险但富）。

输出 JSON:
{
  "transition": "...",
  "narrative": "...",
  "choiceContext": "...",
  "yearsPassed": <数字>,
  "eventType": "choice",
  "consequences": ["..."],
  "statusChanges": { ... },
  "choices": [
    { "text": "...", "effects": { "body": -1, "mind": +1, "charm": 0, "fate": 0 } },
    ...
  ]
}
```

### 2.4 generateConsequence（玩家点完选择后）

```
你是世界 {{world}} 的叙事 AI。玩家在上一节点做了选择，请生成 40-80 字的后果衔接段。

上一节点:
- 处境: {{lastEvent.choiceContext}}
- 玩家选择: {{choiceText}}

角色当前状态:
- 身份/地点/能力/关系/物品（同 §2.2）

要求:
1. 40-80 字，第二人称。
2. 描述这次选择的直接后果（动作完成、对方反应、即时影响），不要跳到下一段人生。
3. 时间不应推进（年龄不变），只是把选择落地。
4. 可以让 NPC 说一句话或离开，但不要展开新事件。

输出 JSON:
{
  "consequenceText": "...",
  "statusChanges": {
    "items": [...],            // 仅当物品立即变化
    "relationships": [...],    // 仅当关系立即变化
    "injuries": [...],
    "pending": [...]
  }
}
```

### 2.5 generateDeath（死亡场景）

```
你是世界 {{world}} 的叙事 AI。角色即将死亡，请生成结局段。

角色:
- 姓名: {{name}}, 享年: {{age}}
- 死因: {{deathReason}}     // 寿元耗尽/体魄衰竭/衰老/意外死因
- 身份: {{lifeStatus.identity}}, 地点: {{lifeStatus.location}}
- 名声: {{lifeStatus.reputation}}
- 关系: {{lifeStatus.relationships.join('、')}}
- 物品: {{lifeStatus.items.join('、')}}
- 未解伏笔: {{lifeStatus.pending.join('、')}}

最近 6 节点:
{{recentRawHistory}}

要求:
1. 如果是寿终或慢病死亡，先写 60-100 字 preDeathText（弥留/告别/最后的抉择）。意外/暴毙可省略 preDeathText。
2. deathText 120-200 字，可分 2-3 段。要呼应未解伏笔（哪怕是"那道伏笔再无人提起"），要点名 1-2 个关系人物。
3. endingTitle 严格 4 个汉字，凝练人生主题（如"凡尘终章"、"剑海归舟"、"红尘一梦"）。
4. epitaph 30-60 字，墓志铭风格，凝练但不复述生平。

输出 JSON:
{
  "preDeathText": "...",
  "deathText": "...",
  "endingTitle": "凡尘终章",
  "epitaph": "..."
}
```

---

## 3. 数据模型变更

### 3.1 `apps/web/src/engine/gameEngine.ts`

#### 3.1.1 GameHistory 扩展

```typescript
export interface GameHistory {
  year: number;
  narrative: string;
  choice: string;
  effects: AttributeEffects;
  yearsPassed?: number;
  eventType?: string;
  consequences?: string[];
  statusChanges?: Partial<LifeStatus>;
  isDeath?: boolean;
  deathText?: string;

  // —— 新增字段 ——
  /** AI 生成的过渡句（10-20字），如"岁月如刀，七年弹指过" */
  transition?: string;
  /** 选择节点专有：处境段，叙事和选择按钮之间 */
  choiceContext?: string;
  /** 玩家做完选择后的后果衔接（40-80字） */
  consequenceText?: string;
  /** 后果引发的状态变化（合并进 lifeStatus） */
  consequenceStatusChanges?: Partial<LifeStatus>;
  /** 死亡节点的完整结局信息 */
  death?: {
    preDeathText?: string;
    deathText: string;
    endingTitle: string;     // 4字
    epitaph: string;
  };
}
```

#### 3.1.2 LifeStatus（保持不变）

`relationships` 字段沿用，**不**新增 NPC 永久记忆字段。NPC 信息既存在于 relationships，也在 compressed history 的"重要人物"段（见 §4），保证不丢失。这是 Q2 的用户决定。

#### 3.1.3 GameState（保持不变）

```typescript
export interface GameState {
  character: GameCharacter;
  lifeStatus: LifeStatus;
  history: GameHistory[];
  currentEvent: GameEvent | null;
  gameStatus: 'playing' | 'paused' | 'dead' | 'ascended';
  generation: number;
  playTime: number;
}
```

### 3.2 序列化

`serializeGameState` 把 history 直接序列化即可，新字段是 history 内部的 optional 字段，向前兼容。读旧存档时缺字段为 undefined，UI 层做 fallback。

### 3.3 GamePage.tsx storyEntries 类型扩展

现有 storyEntries 仅有 `'narrative' | 'choice' | 'choices' | 'narration'` 等。新增渲染类型：

```typescript
type StoryEntry =
  | { type: 'transition'; text: string }       // 过渡句，灰字斜体
  | { type: 'narrative'; text: string; year?: number }
  | { type: 'choiceContext'; text: string }    // 处境段
  | { type: 'choices'; choices: Choice[] }
  | { type: 'consequence'; text: string }      // 后果衔接段
  | { type: 'preDeath'; text: string }
  | { type: 'death'; text: string }
  | { type: 'endingTitle'; text: string }      // 大字标题
  | { type: 'epitaph'; text: string };
```

UI 渲染时 endingTitle 用居中大号标题、epitaph 用引文样式。

### 3.4 数据库 schema

无需迁移。`apps/api/prisma/schema.prisma` 的 `Save.snapshot` 字段是 JSON，现有 history 数组直接存进去，新字段透明通过。

---

## 4. 上下文构建（4 层模型）

新建文件 `apps/api/src/services/contextBuilder.service.ts`，导出 `buildHistoryContext(history, lifeStatus)`，返回字符串拼装好的 prompt 段，替换现有 `formatHistorySegment`。

### 4.1 四层结构

```
[第1层] 重要 NPC 记忆           ← 永不压缩
[第2层] Tags / Items / Pending / Goals  ← 永不压缩，从 lifeStatus 直读
[第3层] 压缩后的早期历史        ← 按人生阶段分组，超 12 行做段落小结
[第4层] 最近 4 个节点           ← 完整原文
```

### 4.2 第 1 层：NPC 记忆

```typescript
function extractNPCs(history: GameHistory[], lifeStatus: LifeStatus): string {
  // 1. 来源 A: lifeStatus.relationships 的所有名字
  // 2. 来源 B: 扫描 history.narrative + consequenceText, 用正则
  //    /([一-龥]{2,4})(师叔|师兄|师姐|师妹|道友|公子|姑娘|大人|前辈)/g
  //    或 statusChanges.relationships 的增量
  // 3. 合并去重，按"出现次数 + 最近一次出现年份"排序，留 top 8
  // 4. 每个 NPC 一行: "沈青（筑基修士，曾共历秘境，去年再遇）"
  return rendered;
}
```

输出形如:

```
重要人物：
- 沈青：筑基修士，曾共历秘境，去年再遇
- 师叔王启：宗门长老，传你内功心法
- 小妹云娘：散修，结义姐妹
```

### 4.3 第 2 层：状态摘要

直接读 `lifeStatus`：

```
当前状态：
身份：散修剑客 / 地点：青羊镇 / 能力：筑基中期
近期物品：龙血玉、青锋剑、《无极功》
当前目标：寻找师门遗失的玉简
未解伏笔：那名陌生道人留下的预言
```

### 4.4 第 3 层：压缩历史

```typescript
function compressOldHistory(oldEntries: GameHistory[]): string {
  // 按 lifeStage 分组：infant / child / youth / adult / elder
  // 每组超过 12 条 → 调一次小型 AI 总结调用，把整段压成 80-120 字
  //   缓存键：hash(stage + entries.map(e => e.year + e.choice).join())
  //   缓存表：内存 LRU 上限 200 条（per-process）
  // 否则直接拼接每条的 narrative 第一句 + choice
}
```

输出形如:

```
早期经历（幼年-少年，0-12岁）：
出生于青羊镇贫户，父母早亡，由王猎户抚养。八岁随他入山，遇白发道人传授吐纳。十岁时家中失火，唯余青锋剑一柄。

少年-青年（13-19岁）：
拜入清虚宗外门，与沈青同入秘境，三日后她不辞而别。十六岁筑基，引来同门嫉妒。
```

**段落小结的 AI 调用是异步缓存友好的**：
- 命中缓存 → 0 token，瞬时返回；
- 未命中 → 调用与主叙事相同的用户配置 AI 提供商，约 300 token 输入 / 150 token 输出。

### 4.5 第 4 层：最近原文

```typescript
const recent = history.slice(-4);
recent.forEach(h => {
  // 完整输出: transition + narrative + choiceContext + choice + consequenceText + consequences
});
```

### 4.6 拼装顺序

```
{NPC段}\n\n{状态摘要}\n\n{压缩历史}\n\n最近经历：\n{最近4节点原文}
```

整体 prompt token 上限控制：估计 1500-2500 token，留足模型输出空间。

---

## 5. 错误处理与降级

### 5.1 AI 调用失败的分级

| 失败场景 | 行为 | 用户感知 |
| --- | --- | --- |
| `generateNarrative` 网络超时 | 重试 1 次（指数退避 2s）→ 仍失败则返回兜底节点：`{ narrative: "你度过了平淡的一年。", yearsPassed: 1 }` | 看到一条平淡叙事，可继续 |
| `generateNarrative` JSON 解析失败 | 用正则尝试抽取 narrative 段；抽不到则同上 | 同上 |
| `generateConsequence` 失败 | 跳过后果段，直接进入下一节点（前端不渲染 consequence） | 没看到后果衔接，但游戏继续 |
| `generateDeath` 失败 | 用兜底模板：`deathText = "你在 ${age} 岁时${cause}，享年 ${age}。"`, `endingTitle = "尘埃落定"`, `epitaph = "曾经鲜活，归于尘土"` | 死亡过场略显单薄但完整 |
| `compressOldHistory` 总结失败 | 跳过压缩，直接拼接前 8 节点的 narrative 首句（截断版） | 上下文略短，可能后续节点连贯性下降 |

### 5.2 字段校验

`controller` 收到 AI 输出后：
1. 必填字段缺失（`narrative` 为空）→ 触发 5.1 兜底。
2. `endingTitle` 不是 4 字 → 用正则截/补到 4 字（取前 4 字，不足拼"终焉"等）；记 warn 日志。
3. 长度超 +30% 上限 → 截断 + 加省略号；记 warn 日志。
4. `effects` 字段非数字 → 设为 0。

### 5.3 流式 SSE 错误

`generateNarrativeStream` 中途断开：前端已经显示部分文本，把已收到部分作为 narrative 入库（记 `eventType: 'partial'`），并提示玩家"剧情中断，已自动保存"。

### 5.4 配额/限流

- 一次"做选择→后果→下一节点→选择"链路最多 3 次 AI 调用，前端做 in-flight 锁，禁止重复点击。
- API 层对单 user 做 60 次/分钟节流，超限返回 429。

### 5.5 死亡兜底完整结构

兜底 death 必须返回完整 4 字段，避免前端渲染崩溃：

```typescript
function fallbackDeath(age, cause) {
  return {
    deathText: `你在${age}岁时因${cause}离世。这一生有起有伏，终归尘土。`,
    endingTitle: "尘埃落定",
    epitaph: `${age}岁的旅人，走过山河，也走过自己。`,
  };
}
```

---

## 6. 测试与迁移

### 6.1 单元测试（pure functions）

新建 `apps/api/src/services/__tests__/contextBuilder.test.ts`：

```typescript
describe('buildHistoryContext', () => {
  it('extracts NPC names from narratives', () => {
    const history = [{ narrative: '你遇到沈青道友，她递来一柄剑。', ... }];
    const ctx = buildHistoryContext(history, lifeStatus);
    expect(ctx).toContain('沈青');
  });
  it('compresses old entries beyond 12 per stage', async () => { ... });
  it('keeps last 4 entries in full', () => { ... });
  it('returns empty NPC section when no relationships', () => { ... });
});

describe('parseNarrativeResponse', () => {
  it('parses well-formed JSON', () => { ... });
  it('falls back to regex when JSON malformed', () => { ... });
  it('clamps endingTitle to 4 chars', () => { ... });
  it('coerces non-number effects to 0', () => { ... });
});

describe('applyLifeStatusChanges', () => {
  it('overrides only specified fields', () => { ... });
  it('keeps original arrays if changes undefined', () => { ... });
});

describe('validateTextLength', () => {
  it('passes within +30% tolerance', () => { ... });
  it('truncates beyond +30% with ellipsis', () => { ... });
});
```

### 6.2 手动 E2E 清单

新建 `docs/superpowers/specs/2026-05-06-life-simulation-redesign-e2e-checklist.md`，覆盖：

- [ ] 修仙世界从出生到死亡跑通一次（≥ 30 节点），人工对照示例 1 评分。
- [ ] 紫禁城（地球 Online 古代变体）跑通，对照示例 2。
- [ ] 沈青在第 5 节点出现，第 18 节点回归（验证 NPC 记忆）。
- [ ] 在第 10 节点选了"背起女修"，第 11 节点必须有 consequence 段。
- [ ] 寿终正寝触发完整 preDeathText + deathText + endingTitle + epitaph。
- [ ] 意外死亡（跌落悬崖）只有 deathText + 标题 + 墓志铭，无 preDeathText。
- [ ] 旧存档（v1，没有 transition/consequenceText）能正常加载，UI 不崩。
- [ ] AI 接口超时模拟：断网 30s，节点显示兜底文案，恢复后能继续。
- [ ] 25 节点之后压缩生效，prompt token 不超过 3000。

### 6.3 黄金样本

在 `docs/superpowers/specs/golden-samples/` 保存 3 个完整 JSON 存档，作为后续回归基线：

- `cultivation-86.json` — 修仙世界 0-86 岁完整人生
- `imperial-45.json` — 紫禁城 0-45 岁
- `cyberpunk-32.json` — 赛博灵朝 0-32 岁（验证现代世界基调）

每个样本附带一份评分表（叙事质量、NPC 连贯性、节奏感、死亡张力，每项 1-5 分）。

### 6.4 迁移阶段（4 阶段，约 5 天）

#### Phase 1（Day 1-2）：API 后端

1. 创建 `contextBuilder.service.ts`，迁移 NPC 提取/压缩逻辑。
2. 重写 `generateBackground` 为 80-150 字版（删 avoid-word）。
3. 重写 `generateNarrative`/`generateNarrativeStream` 支持 needChoices 双模式。
4. 新建 `consequence` / `death` controller 方法和路由。
5. 删除 `generateChoices` 接口，返回 410。
6. 删除 ai.controller.ts 里和 worldConfig.ts 重复的 WORLD_DESCRIPTIONS / WORLD_DEATH_NOTES。
7. 跑 `pnpm --filter api test`。

#### Phase 2（Day 3）：前端引擎

1. 扩展 `gameEngine.ts` 的 `GameHistory` 字段。
2. 扩展 `GamePage.tsx` 的 storyEntry types + handleContinueLife / handleChoice：
   - `handleChoice` 触发后先 await `/api/ai/consequence`，把 consequence 渲染为 storyEntry，再 await `/api/ai/narrative`。
   - 死亡分支调 `/api/ai/death`，渲染 preDeath/death/endingTitle/epitaph。
3. 兼容旧存档（serialize 输出新字段，反序列化时缺字段 fallback）。

#### Phase 3（Day 4）：提示词调优

1. 用黄金样本跑 5 次完整人生，人工评分。
2. 根据评分微调 prompt 里的"要求"段。
3. 调试 NPC 提取正则（修仙/真武/赛博/末日各跑一次）。

#### Phase 4（Day 5）：清理

1. 删除 `worldConfig.ts` 的 `getTransitionText` 调用方（改由 AI 生成 transition）。
2. 删除 ai.controller.ts 内 avoid-word 黑名单和写死的字数限制。
3. 更新 README / docs。
4. 提 PR：拆成 backend / frontend / cleanup 三个 commit。

### 6.5 风险与回退

- **风险 A**: deepseek-chat 在长 prompt 下输出不稳定。**缓解**：把 contextBuilder 拼装结果落 log，前 7 天每天人工抽查 5 条。
- **风险 B**: 段落小结缓存命中率太低（每次玩家做选择都不一样）。**缓解**：缓存键只用 stage + 节点年份范围，不含 choice 文本，命中率会高。
- **风险 C**: 旧存档被新代码读崩。**缓解**：`createGameStateFromSave` 加 `_version` 检测，v1 存档进入 legacy 渲染分支（只用 narrative 字段，不渲染 transition/consequence）。
- **回退方案**: feature flag `NEW_NARRATIVE_PIPELINE=false` 走旧 controller 逻辑，保留 1 个版本。

---

## 7. 不在本次范围

- 多周目继承机制（已有的 legacy 系统不动）。
- NPC 单独的 chat 接口（已存在 `chatWithNPC`，本次不重做）。
- 世界配置编辑器 / UGC 世界。
- 多语言（中文唯一）。
- 客户端缓存 / PWA。

---

## 附录 A：用户决策记录

| 编号 | 问题 | 决策 |
| --- | --- | --- |
| Q1 | 选择频率 | 无选择 1 次 / 有选择 2 次 |
| Q2 | NPC 记忆字段 | 沿用 relationships，不新加字段 |
| Q3 | 文本长度 | 分场景限长（见 §1.4 表） |
| Q4 | 死亡场景如何处理 | 死亡专用提示词（generateDeath） |
| 总方案 | A/B/C 选其一 | 方案 A：三阶段提示词重构 |

---

## 附录 B：删除清单

实施时需要删除的代码：

- `ai.controller.ts:381` 第一处 `avoidWords` 数组
- `ai.controller.ts:717` 第二处 `avoidWords`
- `ai.controller.ts:1045` 第三处 `avoidWords`
- `ai.controller.ts:674` 写死的 15-80 字限制
- `ai.controller.ts:1216` 写死的 choice 10-20 字限制
- `ai.controller.ts:520-568` 现有的 `formatHistorySegment` 实现（被 contextBuilder 替换）
- `ai.controller.ts` 里和 worldConfig.ts 重复的 `WORLD_DESCRIPTIONS` / `WORLD_DEATH_NOTES` 常量
- `worldConfig.ts:200-206` 的 `getTransitionText` 函数（调用方改为 AI 生成 transition）
- `GamePage.tsx:486-498` 的死亡字符串拼接逻辑
- `/api/ai/generate-choices` 路由 + controller 方法（改返回 HTTP 410）
