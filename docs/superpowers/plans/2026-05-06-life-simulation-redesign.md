# 人生模拟叙事重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 AI 叙事管线（5 段提示词 + 4 层上下文 + 2 个新接口），让人生节点产出对标"修仙 0-86"和"紫禁城 0-45"两个示例的质量。

**Architecture:** 后端新增 `contextBuilder.service.ts` 做 4 层上下文，重写 5 段提示词，新增 `/api/ai/consequence` 与 `/api/ai/death`，废弃 `/api/ai/choices`。前端扩展 `GameHistory` 与 `storyEntries` 类型，`GamePage` 在 `handleChoice` 后增加 consequence 调用，死亡分支接入 `generateDeath`。

**Tech Stack:** Express 4 + TypeScript + Prisma (API)、React 19 + Vite + Zustand (Web)、Vitest（新增，用于 contextBuilder 单元测试）

**Spec:** [`docs/superpowers/specs/2026-05-06-life-simulation-redesign-design.md`](../specs/2026-05-06-life-simulation-redesign-design.md)

---

## Phase 1：测试框架就位

### Task 1：在 API 端安装并配置 vitest

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/services/__tests__/.gitkeep`

- [ ] **Step 1：安装 vitest**

```bash
pnpm --filter life-echo-api add -D vitest @vitest/ui
```

- [ ] **Step 2：在 `apps/api/package.json` 的 `scripts` 中追加 test 命令**

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

- [ ] **Step 3：创建 `apps/api/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4：创建空目录占位**

```bash
mkdir -p apps/api/src/services/__tests__
touch apps/api/src/services/__tests__/.gitkeep
```

- [ ] **Step 5：跑一次空测试，确认 vitest 能启动**

Run: `pnpm --filter life-echo-api test`
Expected: `No test files found, exiting with code 0` 或类似提示，0 fail。

- [ ] **Step 6：提交**

```bash
git add apps/api/package.json apps/api/vitest.config.ts apps/api/src/services/__tests__/.gitkeep
git commit -m "chore(api): 引入 vitest 单元测试框架"
```

---

## Phase 2：contextBuilder 服务

### Task 2：创建 contextBuilder skeleton 与公共类型

**Files:**
- Create: `apps/api/src/services/contextBuilder.service.ts`

- [ ] **Step 1：创建文件骨架**

```typescript
// apps/api/src/services/contextBuilder.service.ts

export interface MinimalLifeStatus {
  identity: string;
  location: string;
  ability: string;
  items: string[];
  relationships: string[];
  injuries: string[];
  reputation: string;
  goals: string[];
  tags: string[];
  pending: string[];
}

export interface MinimalHistoryEntry {
  year: number;
  narrative: string;
  choice: string;
  yearsPassed?: number;
  eventType?: string;
  consequences?: string[];
  consequenceText?: string;
  transition?: string;
  choiceContext?: string;
  statusChanges?: Partial<MinimalLifeStatus>;
}

export interface BuildContextOptions {
  /** 最近原文保留多少条，默认 4 */
  recentCount?: number;
  /** 单阶段超过多少条触发压缩，默认 12 */
  compressionThreshold?: number;
  /** 提供 AI 总结函数（用于压缩历史）。未提供时跳过压缩，回退为简短拼接。 */
  summarize?: (text: string) => Promise<string>;
}

export async function buildHistoryContext(
  history: MinimalHistoryEntry[],
  lifeStatus: MinimalLifeStatus,
  options: BuildContextOptions = {}
): Promise<string> {
  // 实现见后续任务
  return '';
}
```

- [ ] **Step 2：编译确认无类型错误**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

- [ ] **Step 3：提交**

```bash
git add apps/api/src/services/contextBuilder.service.ts
git commit -m "feat(api): 新增 contextBuilder 服务骨架"
```

---

### Task 3：实现 NPC 提取（第 1 层）

**Files:**
- Modify: `apps/api/src/services/contextBuilder.service.ts`
- Create: `apps/api/src/services/__tests__/contextBuilder.test.ts`

- [ ] **Step 1：先写失败的测试**

```typescript
// apps/api/src/services/__tests__/contextBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { extractNPCs } from '../contextBuilder.service';

describe('extractNPCs', () => {
  it('从 narrative 中提取常见称谓的 NPC', () => {
    const history = [
      { year: 12, narrative: '你遇到沈青道友，她递来一柄剑。', choice: '' },
      { year: 18, narrative: '师叔王启传你内功心法。', choice: '' },
    ];
    const lifeStatus = {
      identity: '', location: '', ability: '', items: [],
      relationships: [], injuries: [], reputation: '',
      goals: [], tags: [], pending: [],
    };
    const npcs = extractNPCs(history, lifeStatus);
    expect(npcs).toContain('沈青');
    expect(npcs).toContain('王启');
  });

  it('优先使用 lifeStatus.relationships 中的名字', () => {
    const history: any[] = [];
    const lifeStatus = {
      identity: '', location: '', ability: '', items: [],
      relationships: ['沈青：筑基修士'], injuries: [], reputation: '',
      goals: [], tags: [], pending: [],
    };
    const npcs = extractNPCs(history, lifeStatus);
    expect(npcs).toContain('沈青');
  });

  it('无任何来源时返回空数组', () => {
    const history: any[] = [];
    const lifeStatus = {
      identity: '', location: '', ability: '', items: [],
      relationships: [], injuries: [], reputation: '',
      goals: [], tags: [], pending: [],
    };
    const npcs = extractNPCs(history, lifeStatus);
    expect(npcs).toEqual([]);
  });
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `pnpm --filter life-echo-api test`
Expected: 3 个 fail，错误为 `extractNPCs is not a function` 或类似。

- [ ] **Step 3：实现 extractNPCs**

在 `apps/api/src/services/contextBuilder.service.ts` 末尾追加：

```typescript
const NPC_TITLE_PATTERN = /([一-龥]{2,4})(师叔|师兄|师姐|师妹|师父|道友|公子|姑娘|大人|前辈|长老|掌门|前辈|道长|真人)/g;
const NPC_RELATIONSHIP_NAME = /^([一-龥]{2,4})[:：]/;

export function extractNPCs(
  history: MinimalHistoryEntry[],
  lifeStatus: MinimalLifeStatus
): string[] {
  const set = new Set<string>();

  // A. 从 relationships 字符串里抽取 "名字：描述" 的名字
  for (const rel of lifeStatus.relationships) {
    const m = rel.match(NPC_RELATIONSHIP_NAME);
    if (m) set.add(m[1]);
  }

  // B. 扫描 narrative + consequenceText
  for (const h of history) {
    const text = `${h.narrative || ''}${h.consequenceText || ''}`;
    let match;
    NPC_TITLE_PATTERN.lastIndex = 0;
    while ((match = NPC_TITLE_PATTERN.exec(text)) !== null) {
      set.add(match[1]);
    }
  }

  return Array.from(set);
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `pnpm --filter life-echo-api test`
Expected: 3 个 pass。

- [ ] **Step 5：补充排序与上限**

在 extractNPCs 中按 `(出现次数, 最近年份)` 排序，留 top 8。修改函数：

```typescript
export function extractNPCs(
  history: MinimalHistoryEntry[],
  lifeStatus: MinimalLifeStatus
): string[] {
  const stats = new Map<string, { count: number; lastYear: number }>();

  const bump = (name: string, year: number) => {
    const cur = stats.get(name) || { count: 0, lastYear: 0 };
    cur.count += 1;
    if (year > cur.lastYear) cur.lastYear = year;
    stats.set(name, cur);
  };

  for (const rel of lifeStatus.relationships) {
    const m = rel.match(NPC_RELATIONSHIP_NAME);
    if (m) bump(m[1], 0);
  }
  for (const h of history) {
    const text = `${h.narrative || ''}${h.consequenceText || ''}`;
    let match;
    NPC_TITLE_PATTERN.lastIndex = 0;
    while ((match = NPC_TITLE_PATTERN.exec(text)) !== null) {
      bump(match[1], h.year);
    }
  }

  return Array.from(stats.entries())
    .sort((a, b) => b[1].count - a[1].count || b[1].lastYear - a[1].lastYear)
    .slice(0, 8)
    .map(([name]) => name);
}
```

- [ ] **Step 6：增加排序与上限的测试**

```typescript
it('按 (出现次数, 最近年份) 排序，最多返回 8 个', () => {
  const history = [
    { year: 5, narrative: '沈青姑娘来了。', choice: '' },
    { year: 10, narrative: '沈青姑娘又来了。', choice: '' },
    { year: 12, narrative: '王启师叔教你功法。', choice: '' },
  ];
  const lifeStatus = {
    identity: '', location: '', ability: '', items: [],
    relationships: [], injuries: [], reputation: '',
    goals: [], tags: [], pending: [],
  };
  const npcs = extractNPCs(history, lifeStatus);
  expect(npcs[0]).toBe('沈青');
  expect(npcs.length).toBeLessThanOrEqual(8);
});
```

- [ ] **Step 7：跑测试确认全部通过**

Run: `pnpm --filter life-echo-api test`
Expected: 4 个 pass。

- [ ] **Step 8：提交**

```bash
git add apps/api/src/services/contextBuilder.service.ts apps/api/src/services/__tests__/contextBuilder.test.ts
git commit -m "feat(api): contextBuilder 增加 NPC 提取"
```

---

### Task 4：实现状态摘要（第 2 层）

**Files:**
- Modify: `apps/api/src/services/contextBuilder.service.ts`
- Modify: `apps/api/src/services/__tests__/contextBuilder.test.ts`

- [ ] **Step 1：写失败的测试**

```typescript
import { formatLifeStatusSummary } from '../contextBuilder.service';

describe('formatLifeStatusSummary', () => {
  it('包含身份/地点/能力/名声四个核心字段', () => {
    const status = {
      identity: '散修剑客',
      location: '青羊镇',
      ability: '筑基中期',
      reputation: '小有名气',
      items: ['龙血玉', '青锋剑'],
      relationships: ['沈青：筑基修士'],
      injuries: [],
      goals: ['寻师门玉简'],
      tags: [],
      pending: ['陌生道人留下的预言'],
    };
    const out = formatLifeStatusSummary(status);
    expect(out).toContain('散修剑客');
    expect(out).toContain('青羊镇');
    expect(out).toContain('筑基中期');
    expect(out).toContain('小有名气');
    expect(out).toContain('龙血玉');
    expect(out).toContain('寻师门玉简');
    expect(out).toContain('陌生道人留下的预言');
  });

  it('空字段显示为"无"', () => {
    const status = {
      identity: '无名之人',
      location: '出生地',
      ability: '尚未成长',
      reputation: '默默无闻',
      items: [],
      relationships: [],
      injuries: [],
      goals: [],
      tags: [],
      pending: [],
    };
    const out = formatLifeStatusSummary(status);
    expect(out).toContain('物品：无');
    expect(out).toContain('当前目标：无');
    expect(out).toContain('未解伏笔：无');
  });
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `pnpm --filter life-echo-api test`
Expected: 2 个 fail，`formatLifeStatusSummary is not a function`。

- [ ] **Step 3：实现 formatLifeStatusSummary**

在 `contextBuilder.service.ts` 中追加：

```typescript
export function formatLifeStatusSummary(status: MinimalLifeStatus): string {
  const lines: string[] = [];
  lines.push(`当前状态：`);
  lines.push(`身份：${status.identity} / 地点：${status.location} / 能力：${status.ability}`);
  lines.push(`名声：${status.reputation}`);
  lines.push(`物品：${status.items.length ? status.items.slice(-5).join('、') : '无'}`);
  lines.push(`当前目标：${status.goals.length ? status.goals.join('、') : '无'}`);
  lines.push(`未解伏笔：${status.pending.length ? status.pending.join('、') : '无'}`);
  if (status.injuries.length) {
    lines.push(`伤病：${status.injuries.join('、')}`);
  }
  if (status.tags.length) {
    lines.push(`标签：${status.tags.join('、')}`);
  }
  return lines.join('\n');
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `pnpm --filter life-echo-api test`
Expected: 6 个 pass（4+2）。

- [ ] **Step 5：提交**

```bash
git add apps/api/src/services/contextBuilder.service.ts apps/api/src/services/__tests__/contextBuilder.test.ts
git commit -m "feat(api): contextBuilder 增加状态摘要"
```

---

### Task 5：实现压缩历史（第 3 层，无 AI fallback）

**Files:**
- Modify: `apps/api/src/services/contextBuilder.service.ts`
- Modify: `apps/api/src/services/__tests__/contextBuilder.test.ts`

- [ ] **Step 1：写失败的测试**

```typescript
import { compressOldHistory } from '../contextBuilder.service';

describe('compressOldHistory', () => {
  it('未提供 summarize 时按阶段拼接每条 narrative 首句', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      year: i + 1,
      narrative: `${i + 1}岁。第${i}件事发生了。`,
      choice: '',
    }));
    const out = await compressOldHistory(history, {});
    expect(out).toContain('1岁');
    expect(out).toContain('10岁');
  });

  it('超过 compressionThreshold 时调用 summarize', async () => {
    let called = 0;
    const summarize = async (_text: string) => {
      called += 1;
      return '压缩摘要：青年时期波澜壮阔。';
    };
    const history = Array.from({ length: 15 }, (_, i) => ({
      year: i + 1,
      narrative: `${i + 1}岁。第${i}件事。`,
      choice: '',
    }));
    const out = await compressOldHistory(history, {
      compressionThreshold: 12,
      summarize,
    });
    expect(called).toBeGreaterThan(0);
    expect(out).toContain('压缩摘要');
  });

  it('summarize 抛错时回退到简短拼接，不影响主流程', async () => {
    const summarize = async () => { throw new Error('AI down'); };
    const history = Array.from({ length: 15 }, (_, i) => ({
      year: i + 1,
      narrative: `${i + 1}岁。第${i}件事。`,
      choice: '',
    }));
    const out = await compressOldHistory(history, {
      compressionThreshold: 12,
      summarize,
    });
    expect(out.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `pnpm --filter life-echo-api test`
Expected: `compressOldHistory is not a function`。

- [ ] **Step 3：实现 compressOldHistory**

在 `contextBuilder.service.ts` 中追加：

```typescript
function getStage(year: number): string {
  if (year <= 6) return '幼年';
  if (year <= 12) return '少年';
  if (year <= 18) return '青年';
  if (year <= 60) return '成年';
  return '终焉';
}

function fallbackJoin(entries: MinimalHistoryEntry[]): string {
  return entries
    .map((e) => {
      const firstSentence = (e.narrative || '').split(/[。！？]/)[0];
      return `${e.year}岁：${firstSentence}`;
    })
    .join('；');
}

export async function compressOldHistory(
  oldEntries: MinimalHistoryEntry[],
  options: BuildContextOptions
): Promise<string> {
  if (oldEntries.length === 0) return '';

  const threshold = options.compressionThreshold ?? 12;
  const groups = new Map<string, MinimalHistoryEntry[]>();
  for (const e of oldEntries) {
    const stage = getStage(e.year);
    if (!groups.has(stage)) groups.set(stage, []);
    groups.get(stage)!.push(e);
  }

  const segments: string[] = [];
  for (const [stage, entries] of groups) {
    const startYear = entries[0].year;
    const endYear = entries[entries.length - 1].year;
    const header = `${stage}（${startYear}-${endYear}岁）：`;
    if (entries.length > threshold && options.summarize) {
      try {
        const raw = entries.map((e) => `${e.year}岁：${e.narrative}`).join('\n');
        const summary = await options.summarize(raw);
        segments.push(header + summary);
        continue;
      } catch (err) {
        console.warn(`[contextBuilder] 阶段 ${stage} 压缩失败，回退到拼接`, err);
      }
    }
    segments.push(header + fallbackJoin(entries));
  }
  return segments.join('\n\n');
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `pnpm --filter life-echo-api test`
Expected: 9 个 pass（6+3）。

- [ ] **Step 5：提交**

```bash
git add apps/api/src/services/contextBuilder.service.ts apps/api/src/services/__tests__/contextBuilder.test.ts
git commit -m "feat(api): contextBuilder 增加按阶段压缩历史"
```

---

### Task 6：实现 buildHistoryContext 主入口（4 层组合）

**Files:**
- Modify: `apps/api/src/services/contextBuilder.service.ts`
- Modify: `apps/api/src/services/__tests__/contextBuilder.test.ts`

- [ ] **Step 1：写失败的测试**

```typescript
import { buildHistoryContext } from '../contextBuilder.service';

describe('buildHistoryContext', () => {
  it('包含 NPC、状态、压缩历史、最近原文 4 个段', async () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      year: i + 1,
      narrative: `${i + 1}岁。沈青道友又来找你。`,
      choice: '',
    }));
    const status = {
      identity: '散修', location: '青羊镇', ability: '筑基',
      reputation: '小名', items: ['青锋剑'], relationships: [],
      injuries: [], goals: ['修复玉简'], tags: [], pending: [],
    };
    const out = await buildHistoryContext(history, status);
    expect(out).toContain('重要人物');
    expect(out).toContain('沈青');
    expect(out).toContain('当前状态');
    expect(out).toContain('青羊镇');
    expect(out).toContain('最近经历');
    expect(out).toContain('5岁');
    expect(out).toContain('8岁');
  });

  it('history 为空时不抛错，仅返回状态段', async () => {
    const status = {
      identity: '婴', location: '家', ability: '无',
      reputation: '无', items: [], relationships: [],
      injuries: [], goals: [], tags: [], pending: [],
    };
    const out = await buildHistoryContext([], status);
    expect(out).toContain('当前状态');
  });

  it('最近 N 节点保留完整 narrative', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      year: i + 1,
      narrative: `第${i + 1}年发生了一件特别的事，${i + 1}岁的你深有感触。`,
      choice: '',
    }));
    const status = {
      identity: '', location: '', ability: '',
      reputation: '', items: [], relationships: [],
      injuries: [], goals: [], tags: [], pending: [],
    };
    const out = await buildHistoryContext(history, status, { recentCount: 4 });
    expect(out).toContain('第7年发生了');
    expect(out).toContain('第10年发生了');
    expect(out).not.toContain('第6年发生了');
  });
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `pnpm --filter life-echo-api test`
Expected: 3 个 fail，`buildHistoryContext` 返回空字符串。

- [ ] **Step 3：实现 buildHistoryContext**

替换 `contextBuilder.service.ts` 中已有的 `buildHistoryContext` 占位：

```typescript
function formatRecentEntries(entries: MinimalHistoryEntry[]): string {
  return entries
    .map((e) => {
      const parts: string[] = [];
      if (e.transition) parts.push(`〔${e.transition}〕`);
      parts.push(`${e.year}岁：${e.narrative}`);
      if (e.choiceContext) parts.push(`处境：${e.choiceContext}`);
      if (e.choice) parts.push(`选择：${e.choice}`);
      if (e.consequenceText) parts.push(`后果：${e.consequenceText}`);
      return parts.join(' ');
    })
    .join('\n');
}

export async function buildHistoryContext(
  history: MinimalHistoryEntry[],
  lifeStatus: MinimalLifeStatus,
  options: BuildContextOptions = {}
): Promise<string> {
  const recentCount = options.recentCount ?? 4;
  const npcs = extractNPCs(history, lifeStatus);
  const statusSummary = formatLifeStatusSummary(lifeStatus);

  const splitIdx = Math.max(0, history.length - recentCount);
  const oldEntries = history.slice(0, splitIdx);
  const recentEntries = history.slice(splitIdx);

  const compressed = await compressOldHistory(oldEntries, options);

  const parts: string[] = [];
  if (npcs.length > 0) {
    parts.push(`重要人物：\n${npcs.map((n) => `- ${n}`).join('\n')}`);
  }
  parts.push(statusSummary);
  if (compressed) parts.push(compressed);
  if (recentEntries.length > 0) {
    parts.push(`最近经历：\n${formatRecentEntries(recentEntries)}`);
  }
  return parts.join('\n\n');
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `pnpm --filter life-echo-api test`
Expected: 12 个 pass（9+3）。

- [ ] **Step 5：提交**

```bash
git add apps/api/src/services/contextBuilder.service.ts apps/api/src/services/__tests__/contextBuilder.test.ts
git commit -m "feat(api): contextBuilder 提供 buildHistoryContext 主入口"
```

---

## Phase 3：API 提示词重构

### Task 7：删除 ai.controller.ts 内 avoid-words 黑名单与字数硬限

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：定位 3 处 avoid-words**

Run: `grep -n "避免词汇" apps/api/src/controllers/ai.controller.ts`
Expected: 输出 3 行，分别在 ~381、~717、~1045 附近。

- [ ] **Step 2：删除第 1 处（generateBackground 提示中）**

打开 `ai.controller.ts:381` 附近，删除整行 ``7. **避免词汇**：命运、齿轮、星河、终焉、低语、裂缝、虚空、倒计时、时间尽头（除非题材明确需要）``。

- [ ] **Step 3：删除第 2 处（generateNarrative 提示中）**

打开 `ai.controller.ts:717` 附近，删除整行 ``11. **避免词汇**：命运、齿轮、星河、终焉、低语、裂缝、规则、虚空、倒计时、时间尽头（除非题材明确需要）``。

- [ ] **Step 4：删除第 3 处（generateNarrativeStream 提示中）**

同上，删除 `ai.controller.ts:1045` 附近的同名行。

- [ ] **Step 5：删除字数硬限**

定位三处 `15-80字` / `10-20字` 提示：

- `ai.controller.ts:673-674` 在 generateNarrative 中：
  - 把 `**15-80字**，信息密度高，可展开关键转折但避免冗长` 改为 `**60-150字**，一段连续叙事，不需逐年罗列`
  - 把 `**严禁超过80字**，超长文本会导致保存错误` 改为 `**不应超过 200 字，避免冗长**`
- `ai.controller.ts:1001` 在 generateNarrativeStream 中：同上
- `ai.controller.ts:1216` 在 generateChoices 中：
  - 把 `每个选择项10-20字` 改为 `每个选择项12-30字`

- [ ] **Step 6：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

- [ ] **Step 7：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts
git commit -m "feat(api): 移除提示词中的 avoid-words 黑名单与硬性字数限制"
```

---

### Task 8：删除 ai.controller.ts 内 WORLD_DESCRIPTIONS / WORLD_DEATH_NOTES 重复

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`
- Modify: `apps/web/src/engine/worldConfig.ts`（API 与 Web 共用 worldConfig 时需要新建副本，见步骤）

> **Note:** worldConfig.ts 当前住在 `apps/web/`，API 端不能直接 import。先把它复制一份到 API 端，再删除 controller 内的重复常量。

- [ ] **Step 1：复制 worldConfig 到 API 端**

```bash
cp apps/web/src/engine/worldConfig.ts apps/api/src/services/worldConfig.ts
```

- [ ] **Step 2：在 ai.controller.ts 顶部 import**

```typescript
import { getWorldDeathNote, getRandomAccident, calcWorldLifespan } from '../services/worldConfig';
```

- [ ] **Step 3：删除 controller 内 `WORLD_DESCRIPTIONS` 常量与 `getWorldDescription` 函数**

`ai.controller.ts:7-18`，整段删除。把所有调用 `getWorldDescription(world)` 的地方改成读取从 worldConfig 导出的描述。在 `apps/api/src/services/worldConfig.ts` 末尾追加：

```typescript
const WORLD_DESCRIPTIONS: Record<string, string> = {
  '地球 Online': '现代地球社会。没有修仙、没有超能力。人生围绕家庭、学业、职业、经济、人际关系、健康、意外事件展开。科技水平与现实世界相同。',
  '修仙世界': '修真世界，有灵根、宗门、功法、秘境、妖兽、丹药、法器、境界划分（练气、筑基、金丹等）。凡人可以通过修炼获得超凡力量，追求长生。',
  '真武世界': '武侠世界，有内力、武学门派、江湖恩怨、武馆、镖局。以武为尊，拳脚掌指皆可成道，追求武道巅峰。',
  '赛博灵朝': '近未来赛博朋克与东方神秘主义融合的世界。义体改造、数字神龛、功德债务、虚拟香火、高科技与古老信仰并存。',
  '末日方舟城': '末日废土世界，资源枯竭，高墙城市，配给制，变异感染，拾荒求生。人类文明在崩溃边缘挣扎。',
  '神话复苏': '现代世界，但古老神话中的神祇、怪物、秘仪正在逐步苏醒。调查局、神裔血脉、旧神代理人、理智污染。',
};

export function getWorldDescription(worldName: string): string {
  return WORLD_DESCRIPTIONS[worldName] || `以"${worldName}"为背景的世界。请根据这个世界观生成符合其设定的人生事件。`;
}
```

并在 controller 顶部 import 中追加 `getWorldDescription`。

- [ ] **Step 4：删除 controller 内 `WORLD_DEATH_NOTES` 与 `getWorldDeathNote`**

`ai.controller.ts:21-32` 整段删除。所有 `getWorldDeathNote(world)` 调用使用新 import 的同名函数（来自 worldConfig）。

- [ ] **Step 5：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。如有未删干净的旧引用按报错处理。

- [ ] **Step 6：提交**

```bash
git add apps/api/src/services/worldConfig.ts apps/api/src/controllers/ai.controller.ts
git commit -m "refactor(api): 抽 worldConfig 到独立服务，去除 controller 内重复常量"
```

---

### Task 9：重写 generateBackground 提示词（80-150 字）

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：定位 generateBackground 函数**

Run: `grep -n "async generateBackground" apps/api/src/controllers/ai.controller.ts`
Expected: `261:  async generateBackground(req: Request, res: Response) {`

- [ ] **Step 2：用新提示词替换 system + user 拼装段**

找到 generateBackground 函数体里 `const systemPrompt = ...` 与 `const userPrompt = ...`。把 systemPrompt 改为：

```typescript
const systemPrompt = `你是世界 ${worldName} 的叙事 AI。请为以下角色撰写出生段落。

要求：
1. **80-150 字**，第二人称"你"。
2. 给出出生地点、家庭背景、关键 NPC（父母/师长/族人，至少 1 人有名字）。
3. 暗示天赋如何显现，但不要直接喊出天赋名。
4. 语气符合世界基调（修仙就修仙腔，赛博就赛博腔）。
5. 禁止使用占位符（如"…"或"XX"），所有名字、地点、动作必须具体。

只输出叙事正文，无标题、无解释。`;
```

userPrompt 保持原有"角色信息+世界设定"，但删除 avoid-words 那段（已在 Task 7 删除）。

- [ ] **Step 3：放宽返回值长度校验**

如 generateBackground 末尾原本判断 `if (text.length > 120) ...` 之类，统一改为 `if (text.length > 200) text = text.slice(0, 200) + '…';`。

- [ ] **Step 4：手工冒烟**

```bash
pnpm --filter life-echo-api dev
# 另一终端：用 curl 或 Postman 调用 POST /api/ai/background
# 期望：返回 80-150 字的中文出生段，含具体名字
```

- [ ] **Step 5：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts
git commit -m "feat(api): 重写出生段落提示词，扩到 80-150 字"
```

---

### Task 10：重写 generateNarrative — needChoices=false

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：将 buildHistoryContext 接入 generateNarrative**

先在 ai.controller.ts 顶部追加 import：

```typescript
import { createDefaultLifeStatus } from '../services/lifeStatus';
```

再定位 `ai.controller.ts:540` 附近的 `summaryParts.push(formatHistorySegment(currentSegment))` 一段。整段（约 520-568）替换为：

```typescript
const { buildHistoryContext } = await import('../services/contextBuilder.service');
const historyContext = await buildHistoryContext(
  (saveData?.history || []) as any,
  saveData?.lifeStatus || createDefaultLifeStatus(),
  {
    summarize: async (text) => {
      const aiSvc = new AIService(decryptedConfig);
      const r = await aiSvc.chat([
        { role: 'system', content: '你是叙事 AI 助手，请把多年人生经历压缩为 80-120 字段落概述，保留关键人物和事件。' },
        { role: 'user', content: text },
      ]);
      return r.content;
    },
  }
);
```

> **Note:** `createDefaultLifeStatus` 与 `LifeStatus` 类型当前住在 `apps/web/`。在 `apps/api/src/services/` 下新建 `lifeStatus.ts` 复制定义：

```typescript
// apps/api/src/services/lifeStatus.ts
export interface LifeStatus {
  identity: string;
  location: string;
  ability: string;
  items: string[];
  relationships: string[];
  injuries: string[];
  reputation: string;
  goals: string[];
  tags: string[];
  pending: string[];
}

export function createDefaultLifeStatus(): LifeStatus {
  return {
    identity: '无名之人',
    location: '出生地',
    ability: '尚未成长',
    items: [],
    relationships: [],
    injuries: [],
    reputation: '默默无闻',
    goals: [],
    tags: [],
    pending: [],
  };
}
```

- [ ] **Step 2：在 systemPrompt 中加入新格式要求**

把现有 systemPrompt 段（约 ai.controller.ts:600-720）替换为新版本：

```typescript
const systemPrompt = `你是世界 ${worldName} 的叙事 AI。请生成下一个人生节点。

要求：
1. 整段 60-150 字，第二人称。
2. 如果 yearsPassed > 3，开头插入 8-20 字过渡句（写到 transition 字段，例："岁月如刀，七年弹指过"）。结合身份/地点/伤病自然写。
3. 必须呼应至少一个：未解伏笔 / 关系名单 / 当前目标 / 物品。
4. 严格符合 ${currentStage} 阶段（幼年别让你掌门，成年别让你尿床）。
5. 可以引入新 NPC，但出场必须给名字和身份。
6. 禁止使用占位符（如"…"或"XX"），所有名字、地点、动作必须具体。

输出 JSON：
{
  "transition": "...",
  "narrative": "...",
  "yearsPassed": <数字>,
  "eventType": "milestone|random|crisis",
  "consequences": ["..."],
  "statusChanges": {
    "identity": "...", "location": "...", "ability": "...",
    "items": [...], "relationships": [...], "injuries": [...],
    "reputation": "...", "goals": [...], "tags": [...], "pending": [...]
  }
}

只输出 JSON，不要解释、不要 markdown 围栏。`;
```

- [ ] **Step 3：调整 userPrompt**

userPrompt 改为：

```typescript
const userPrompt = `${historyContext}

【角色信息】
姓名：${character?.name || '无名者'}，性别：${gender}，${currentAge}岁，阶段：${currentStage}
世界：${worldName}（${getWorldDescription(worldName)}）
${narrativeWorldConfig ? `开局配置：${narrativeWorldConfig}` : ''}

【性格】${narrativePersonality}（${getPersonalityDescription(narrativePersonality)}）
【欲望】${narrativeDesire}（${getDesireDescription(narrativeDesire)}）
【天赋】${narrativeTalentsText}
【遗产】${narrativeLegacyText}
【先天属性】体魄${narrativeAttrBody} / 悟性${narrativeAttrMind} / 羁绊${narrativeAttrCharm} / 气运${narrativeAttrFate}

请生成下一个节点。`;
```

- [ ] **Step 4：调整解析逻辑（兼容新字段）**

定位 `ai.controller.ts:770` 附近的 `try { node = JSON.parse(...) } catch ...`。修改 fallback 节点：

```typescript
node = {
  yearsPassed: yearsAdvanced,
  newAge,
  transition: '',
  narrative: `你度过了平淡的一年。`,
  text: `${newAge}岁 — 平淡度日。`,  // 旧字段保留以保持向后兼容
  eventType: 'random',
  consequences: [],
  statusChanges: {},
  shouldTriggerChoice: false,
  isDeath: false,
};
```

成功解析时把新字段并入 node：

```typescript
const parsed = JSON.parse(cleaned);
node = {
  yearsPassed: parsed.yearsPassed || yearsAdvanced,
  newAge: currentAge + (parsed.yearsPassed || yearsAdvanced),
  transition: parsed.transition || '',
  narrative: parsed.narrative || '',
  text: `${currentAge + (parsed.yearsPassed || yearsAdvanced)}岁 — ${(parsed.narrative || '').slice(0, 60)}…`,
  eventType: parsed.eventType || 'random',
  consequences: parsed.consequences || [],
  statusChanges: parsed.statusChanges || {},
  shouldTriggerChoice: false,
  isDeath: false,
};
```

- [ ] **Step 5：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

手工调用 POST `/api/ai/narrative`（带一个有效 saveId），期望返回 `node.narrative` 60-150 字，可能含 `transition`。

- [ ] **Step 6：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts apps/api/src/services/lifeStatus.ts
git commit -m "feat(api): generateNarrative 接入 contextBuilder，输出 transition + 60-150 字"
```

---

### Task 11：扩展 generateNarrative 支持 needChoices=true

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：在请求中读取 needChoices**

定位 generateNarrative 函数体顶部 `const { saveId } = req.body;`。改为：

```typescript
const { saveId, needChoices = false } = req.body;
```

- [ ] **Step 2：分叉 systemPrompt**

在已经构造好 systemPrompt 之后追加：

```typescript
let finalSystemPrompt = systemPrompt;
if (needChoices) {
  finalSystemPrompt += `

【本节点为选择节点】额外要求：
A. 在叙事末尾追加 30-80 字的 choiceContext 字段，让玩家明白选择背景。
B. choices 数组 2-4 项，每项 text 12-30 字，必须是动作或决断；effects 给 body/mind/charm/fate 的整数变化（-3 到 +3）。
C. 选项之间应有真实代价差。

选择节点 JSON 增补字段：
{
  ...,
  "choiceContext": "...",
  "choices": [
    { "text": "...", "effects": { "body": -1, "mind": +1, "charm": 0, "fate": 0 } },
    ...
  ]
}`;
}
```

- [ ] **Step 3：把 finalSystemPrompt 喂给 AIService**

替换原本调用 `aiService.chat([{role:'system', content: systemPrompt}, ...])` 中的 systemPrompt → `finalSystemPrompt`。

- [ ] **Step 4：解析 choices 与 choiceContext**

在解析 try 块中：

```typescript
if (needChoices) {
  node.choiceContext = parsed.choiceContext || '';
  node.choices = Array.isArray(parsed.choices)
    ? parsed.choices.slice(0, 4).map((c: any) => ({
        text: String(c.text || '').slice(0, 60),
        effects: {
          body: Number(c.effects?.body) || 0,
          mind: Number(c.effects?.mind) || 0,
          charm: Number(c.effects?.charm) || 0,
          fate: Number(c.effects?.fate) || 0,
        },
      }))
    : [];
  node.shouldTriggerChoice = node.choices.length > 0;
}
```

- [ ] **Step 5：编译**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

- [ ] **Step 6：手工调用验证**

```bash
# 调用 POST /api/ai/narrative {saveId, needChoices: true}
# 期望返回的 node 含 choiceContext 与 choices[]
```

- [ ] **Step 7：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts
git commit -m "feat(api): generateNarrative 支持 needChoices 模式"
```

---

### Task 12：同步 generateNarrativeStream 改造

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：定位 generateNarrativeStream**

Run: `grep -n "async generateNarrativeStream" apps/api/src/controllers/ai.controller.ts`
Expected: `805:  async generateNarrativeStream(req: Request, res: Response) {`

- [ ] **Step 2：把 historyContext 与 systemPrompt 与 Task 10/11 同步**

打开 generateNarrativeStream 函数体：
- 第 867-900 行（旧 formatHistorySegment 路径）替换为同 Task 10 Step 1 的 `buildHistoryContext` 调用。
- systemPrompt 改为同 Task 10 Step 2 的新版本。
- 读取 `needChoices` 并在 systemPrompt 末尾追加 Task 11 Step 2 的选择段。

- [ ] **Step 3：流式返回时同步暴露 transition / choiceContext / choices**

流式接口先全文累积再 sendEvent('node', parsed)。在 sendEvent 之前对 parsed 做与 Task 10 Step 4 / Task 11 Step 4 相同的 `node` 整形。

- [ ] **Step 4：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

手工请求 POST `/api/ai/narrative/stream`，期望前端能收到流式 chunk 并最终拿到 `node` 事件。

- [ ] **Step 5：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts
git commit -m "feat(api): generateNarrativeStream 同步使用 contextBuilder 与新 systemPrompt"
```

---

### Task 13：新增 POST /api/ai/consequence 接口

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`
- Modify: `apps/api/src/routes/ai.routes.ts`

- [ ] **Step 1：在 ai.controller.ts 末尾追加 generateConsequence**

```typescript
async generateConsequence(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { saveId, lastEvent, choiceText, lifeStatus, character } = req.body;
    if (!userId || !saveId) return res.status(400).json({ success: false, message: 'saveId required' });

    const cfg = await prisma.aiConfig.findUnique({ where: { userId } });
    if (!cfg) return res.status(400).json({ success: false, message: '请先配置 AI Key' });

    const ai = new AIService({
      provider: cfg.provider as AIProvider,
      apiKey: decryptApiKey(cfg.apiKey),
      model: cfg.model || undefined,
      baseUrl: cfg.baseUrl || undefined,
    });

    const systemPrompt = `你是世界 ${character?.world || '未知'} 的叙事 AI。玩家在上一节点做了选择，请生成 40-80 字的后果衔接段。

要求：
1. 40-80 字，第二人称。
2. 描述这次选择的直接后果（动作完成、对方反应、即时影响），不要跳到下一段人生。
3. 时间不应推进，年龄不变，只是把选择落地。
4. 可以让 NPC 说一句话或离开，但不要展开新事件。
5. 禁止使用占位符（如"…"或"XX"），所有名字、地点、动作必须具体。

输出 JSON：
{
  "consequenceText": "...",
  "statusChanges": {
    "items": [...], "relationships": [...], "injuries": [...], "pending": [...]
  }
}

只输出 JSON，不要解释、不要 markdown 围栏。`;

    const userPrompt = `上一节点：
- 处境：${lastEvent?.choiceContext || lastEvent?.narrative || ''}
- 玩家选择：${choiceText}

当前状态：
身份：${lifeStatus?.identity} / 地点：${lifeStatus?.location} / 能力：${lifeStatus?.ability}
关系：${(lifeStatus?.relationships || []).join('、') || '无'}
物品：${(lifeStatus?.items || []).join('、') || '无'}`;

    const r = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let parsed: any = {};
    try {
      const cleaned = r.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = { consequenceText: r.content.slice(0, 80), statusChanges: {} };
    }

    res.json({
      success: true,
      consequenceText: String(parsed.consequenceText || '').slice(0, 200),
      statusChanges: parsed.statusChanges || {},
    });
  } catch (err: any) {
    console.error('generateConsequence error:', err);
    res.status(500).json({ success: false, message: '生成后果失败：' + (err.message || 'unknown') });
  }
},
```

- [ ] **Step 2：在 ai.routes.ts 注册路由**

```typescript
router.post('/consequence', authMiddleware, aiController.generateConsequence);
```

- [ ] **Step 3：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

手工 curl `POST /api/ai/consequence` 验证返回结构。

- [ ] **Step 4：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts apps/api/src/routes/ai.routes.ts
git commit -m "feat(api): 新增 /api/ai/consequence 后果衔接接口"
```

---

### Task 14：新增 POST /api/ai/death 接口

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`
- Modify: `apps/api/src/routes/ai.routes.ts`

- [ ] **Step 1：在 ai.controller.ts 末尾追加 generateDeath**

```typescript
async generateDeath(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { saveId, character, lifeStatus, recentHistory, deathReason } = req.body;
    if (!userId || !saveId) return res.status(400).json({ success: false, message: 'saveId required' });

    const cfg = await prisma.aiConfig.findUnique({ where: { userId } });
    if (!cfg) return res.status(400).json({ success: false, message: '请先配置 AI Key' });

    const ai = new AIService({
      provider: cfg.provider as AIProvider,
      apiKey: decryptApiKey(cfg.apiKey),
      model: cfg.model || undefined,
      baseUrl: cfg.baseUrl || undefined,
    });

    const recentText = (recentHistory || [])
      .slice(-6)
      .map((h: any) => `${h.year}岁：${h.narrative}`)
      .join('\n');

    const systemPrompt = `你是世界 ${character?.world || '未知'} 的叙事 AI。角色即将死亡，请生成结局段。

要求：
1. 如果是寿终或慢病死亡，先写 60-100 字 preDeathText（弥留/告别/最后的抉择）。意外/暴毙可省略 preDeathText（设为空字符串）。
2. deathText 120-200 字，可分 2-3 段。要呼应未解伏笔（哪怕"那道伏笔再无人提起"），点名 1-2 个关系人物。
3. endingTitle 严格 4 个汉字，凝练人生主题（如"凡尘终章"、"剑海归舟"、"红尘一梦"）。
4. epitaph 30-60 字，墓志铭风格，凝练但不复述生平。
5. 禁止使用占位符（如"…"或"XX"），所有名字、地点、动作必须具体。

输出 JSON：
{
  "preDeathText": "...",
  "deathText": "...",
  "endingTitle": "凡尘终章",
  "epitaph": "..."
}

只输出 JSON，不要解释、不要 markdown 围栏。`;

    const userPrompt = `角色信息：
姓名：${character?.name}，享年：${character?.age}
死因：${deathReason}
身份：${lifeStatus?.identity}，地点：${lifeStatus?.location}，名声：${lifeStatus?.reputation}
关系：${(lifeStatus?.relationships || []).join('、')}
物品：${(lifeStatus?.items || []).join('、')}
未解伏笔：${(lifeStatus?.pending || []).join('、')}

最近 6 节点：
${recentText}`;

    const r = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let parsed: any = {};
    try {
      const cleaned = r.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {};
    }

    // 校验 / 兜底
    let endingTitle = String(parsed.endingTitle || '尘埃落定');
    if (endingTitle.length !== 4) {
      endingTitle = (endingTitle + '尘埃落定').slice(0, 4);
    }
    const deathText = String(parsed.deathText || '').slice(0, 600)
      || `你在${character?.age}岁时因${deathReason}离世。这一生有起有伏，终归尘土。`;
    const epitaph = String(parsed.epitaph || '').slice(0, 200)
      || `${character?.age}岁的旅人，走过山河，也走过自己。`;
    const preDeathText = String(parsed.preDeathText || '').slice(0, 300);

    res.json({
      success: true,
      preDeathText,
      deathText,
      endingTitle,
      epitaph,
    });
  } catch (err: any) {
    console.error('generateDeath error:', err);
    res.status(500).json({
      success: false,
      message: '生成死亡场景失败：' + (err.message || 'unknown'),
    });
  }
},
```

- [ ] **Step 2：在 ai.routes.ts 注册路由**

```typescript
router.post('/death', authMiddleware, aiController.generateDeath);
```

- [ ] **Step 3：编译并冒烟**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

手工 curl `POST /api/ai/death` 验证返回结构。

- [ ] **Step 4：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts apps/api/src/routes/ai.routes.ts
git commit -m "feat(api): 新增 /api/ai/death 死亡场景接口"
```

---

### Task 15：废弃 /api/ai/choices（HTTP 410 Gone）

**Files:**
- Modify: `apps/api/src/controllers/ai.controller.ts`

- [ ] **Step 1：定位 generateChoices**

Run: `grep -n "async generateChoices" apps/api/src/controllers/ai.controller.ts`
Expected: `1158:  async generateChoices(req: Request, res: Response) {`

- [ ] **Step 2：替换函数体为 410 stub**

```typescript
async generateChoices(req: Request, res: Response) {
  res.status(410).json({
    success: false,
    message: '本接口已废弃，选择已合并进 /api/ai/narrative（needChoices=true）',
  });
},
```

整段（约 1158-1300）替换。

- [ ] **Step 3：编译**

Run: `pnpm --filter life-echo-api build`
Expected: tsc 通过。

- [ ] **Step 4：提交**

```bash
git add apps/api/src/controllers/ai.controller.ts
git commit -m "feat(api): /api/ai/choices 改为 HTTP 410，迁移到 narrative.needChoices"
```

---

## Phase 4：Web 引擎与 UI 接入

### Task 16：扩展 GameHistory 类型

**Files:**
- Modify: `apps/web/src/engine/gameEngine.ts`

- [ ] **Step 1：定位 GameHistory 接口**

Run: `grep -n "interface GameHistory" apps/web/src/engine/gameEngine.ts`
Expected: `107:export interface GameHistory {`

- [ ] **Step 2：扩展 addHistoryEntry 的 options 类型**

```typescript
export function addHistoryEntry(
  state: GameState,
  narrative: string,
  choice: string,
  effects: AttributeEffects,
  options?: {
    yearsPassed?: number;
    eventType?: string;
    consequences?: string[];
    statusChanges?: Partial<LifeStatus>;
    isDeath?: boolean;
    deathText?: string;
    // 新增
    transition?: string;
    choiceContext?: string;
    consequenceText?: string;
    consequenceStatusChanges?: Partial<LifeStatus>;
    death?: GameHistory['death'];
  }
): GameState {
```

并同步把 options 中的新字段写入 `entry`：

```typescript
  const entry: GameHistory = {
    year: state.character.age,
    narrative,
    choice,
    effects,
    yearsPassed: options?.yearsPassed,
    eventType: options?.eventType,
    consequences: options?.consequences,
    statusChanges: options?.statusChanges,
    isDeath: options?.isDeath,
    deathText: options?.deathText,
    // 新增
    transition: options?.transition,
    choiceContext: options?.choiceContext,
    consequenceText: options?.consequenceText,
    consequenceStatusChanges: options?.consequenceStatusChanges,
    death: options?.death,
  };
```

- [ ] **Step 3：扩展 GameHistory 接口**

把 `GameHistory` 改为：

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
  /** 后果引发的状态变化 */
  consequenceStatusChanges?: Partial<LifeStatus>;
  /** 死亡节点的完整结局信息 */
  death?: {
    preDeathText?: string;
    deathText: string;
    endingTitle: string;
    epitaph: string;
  };
}
```

- [ ] **Step 3：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 4：提交**

```bash
git add apps/web/src/engine/gameEngine.ts
git commit -m "feat(web): GameHistory 增加 transition/consequenceText/death 等字段"
```

---

### Task 17：扩展 GamePage storyEntries 类型

**Files:**
- Modify: `apps/web/src/pages/GamePage.tsx`

- [ ] **Step 1：定位 storyEntries 类型**

Run: `grep -n "storyEntries" apps/web/src/pages/GamePage.tsx | head -3`
Expected: `94:  const [storyEntries, setStoryEntries] = useState<...>...`

- [ ] **Step 2：扩展 type 联合类型**

把 line 94 的类型从：
```typescript
Array<{ text: string; type: 'narrative' | 'choice' | 'system' | 'result' | 'error' }>
```
改为：
```typescript
Array<{ text: string; type: 'narrative' | 'choice' | 'system' | 'result' | 'error' | 'transition' | 'choiceContext' | 'consequence' | 'preDeath' | 'death' | 'endingTitle' | 'epitaph' }>
```

同步修改 line 143 的 `appendStoryEntry` 函数签名。

- [ ] **Step 3：在显示 storyEntries 的 JSX 中处理新类型样式**

定位 `storyEntries.map` 的渲染段（GamePage 的渲染 JSX 处），在 className 选择中追加：

```tsx
className={
  entry.type === 'transition' ? 'italic text-gray-400 text-sm' :
  entry.type === 'choiceContext' ? 'text-amber-200 italic' :
  entry.type === 'consequence' ? 'text-cyan-200' :
  entry.type === 'preDeath' ? 'text-rose-300 italic' :
  entry.type === 'death' ? 'text-red-300 leading-relaxed' :
  entry.type === 'endingTitle' ? 'text-3xl font-bold text-amber-300 text-center my-4' :
  entry.type === 'epitaph' ? 'text-amber-100 italic text-center border-l-2 border-amber-300 pl-3' :
  /* 默认与现有逻辑一致 */ baseClass
}
```

> 具体的样式 className 以现有项目 Tailwind 调色板为准，不必照搬此处颜色。

- [ ] **Step 4：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 5：提交**

```bash
git add apps/web/src/pages/GamePage.tsx
git commit -m "feat(web): storyEntries 增加 transition/consequence/ending 等渲染类型"
```

---

### Task 18：handleContinueLife 渲染 transition 段

**Files:**
- Modify: `apps/web/src/pages/GamePage.tsx`

- [ ] **Step 1：定位 handleContinueLife 中调用 narrative 接口后的处理段**

Run: `grep -n "handleContinueLife" apps/web/src/pages/GamePage.tsx`
Expected: `403:  const handleContinueLife = useCallback(async () => {`

- [ ] **Step 2：在调用 aiApi.generateNarrative 时传入 needChoices**

定位 `aiApi.generateNarrative(...)` 的调用处，把 payload 改为：

```typescript
const shouldNeedChoices = choiceCounterRef.current === 0; // 或其他触发逻辑
const resp = await aiApi.generateNarrative({
  character: state.character,
  lifeStatus: state.lifeStatus,
  history: state.history,
  stage: getLifeStage(state.character.age),
  needChoices: shouldNeedChoices,
});
```

> **Note:** 如果原有流式调用 `aiApi.streamGenerateNarrative`，同步在其 data payload 中加入 `needChoices`。

- [ ] **Step 3：在 appendStoryEntry(node.text, 'narrative') 之前先渲染 transition**

定位类似 `appendStoryEntry(node.text, 'narrative')` / `appendStoryEntry(node.narrative, 'narrative')` 的位置，在前面追加：

```typescript
if (node.transition) {
  appendStoryEntry(node.transition, 'transition');
}
appendStoryEntry(node.narrative || node.text, 'narrative');
if (node.choiceContext) {
  appendStoryEntry(node.choiceContext, 'choiceContext');
}
```

- [ ] **Step 3：在 history push 时一并保存 transition / choiceContext**

定位 `gameStore` / 本地 state 的 history append 处，确保把 `transition`、`choiceContext` 也写入 GameHistory。

- [ ] **Step 4：手工冒烟**

启动 dev：

```bash
pnpm --filter life-echo-api dev
# 另一终端
pnpm --filter web dev
```

打开浏览器，开始一局游戏，连按"继续人生"3 次，期望看到部分节点带斜体灰字 transition。

- [ ] **Step 5：提交**

```bash
git add apps/web/src/pages/GamePage.tsx
git commit -m "feat(web): handleContinueLife 渲染 transition 与 choiceContext"
```

---

### Task 18.5：扩展 aiApi 客户端方法（needChoices / consequence / death）

**Files:**
- Modify: `apps/web/src/services/api.ts`

- [ ] **Step 1：修改 aiApi.generateNarrative 签名以支持 needChoices**

```typescript
generateNarrative: (data: { character: any; lifeStatus?: any; history?: any[]; stage?: string; needChoices?: boolean }) =>
  api.post('/ai/narrative', data),
```

- [ ] **Step 2：新增 consequence 与 death 方法**

在 `aiApi` 对象末尾追加：

```typescript
  generateConsequence: (data: { saveId: string; lastEvent: any; choiceText: string; lifeStatus: any; character: any }) =>
    api.post('/ai/consequence', data),
  generateDeath: (data: { saveId: string; character: any; lifeStatus: any; recentHistory: any[]; deathReason: string }) =>
    api.post('/ai/death', data),
```

- [ ] **Step 3：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 4：提交**

```bash
git add apps/web/src/services/api.ts
git commit -m "feat(web): aiApi 增加 needChoices / consequence / death 方法"
```

---

### Task 19：handleChoice 增加 consequence 调用并修正选择计数器

**Files:**
- Modify: `apps/web/src/pages/GamePage.tsx`

- [ ] **Step 1：定位 handleChoice 中现有 addHistoryEntry 调用段**

Run: `grep -n "addHistoryEntry" apps/web/src/pages/GamePage.tsx`
Expected: 约 line 670 附近。

- [ ] **Step 2：在 addHistoryEntry 之前插入 consequence 请求**

找到 `appendStoryEntry('选择了 ...')` 和 `addHistoryEntry(...)` 之间的位置，插入：

```typescript
    // 2a. 请求 consequence 衔接
    let consequenceText: string | undefined;
    let consequenceStatusChanges: Partial<LifeStatus> | undefined;
    try {
      const resp = await aiApi.generateConsequence({
        saveId,
        lastEvent: {
          narrative: event.narrative,
          choiceContext: event.choiceContext,
        },
        choiceText: choice.text,
        lifeStatus: gameState.lifeStatus,
        character: gameState.character,
      });

      if (resp.data?.success && resp.data.consequenceText) {
        consequenceText = resp.data.consequenceText;
        consequenceStatusChanges = resp.data.statusChanges;
        appendStoryEntry(consequenceText, 'consequence');
        // 如有状态变化，应用到本地 lifeStatus
        if (consequenceStatusChanges) {
          setGameState((prev) =
            prev ? { ...prev, lifeStatus: applyLifeStatusChanges(prev.lifeStatus, consequenceStatusChanges!) } : prev
          );
        }
      }
    } catch (err) {
      console.warn('consequence 失败，跳过', err);
    }
```

> **Note:** `saveId` 从组件作用域读取。`aiApi` 已在 GamePage 顶部 import（来自 `../services/api`）。

- [ ] **Step 3：把 consequence 数据传入 addHistoryEntry**

将原来的：

```typescript
    newState = addHistoryEntry(
      newState,
      event.narrative,
      choice.text,
      choice.effects,
      {
        yearsPassed: event.yearsPassed,
        eventType: event.eventType,
        consequences: event.consequences,
        statusChanges: event.statusChanges,
      }
    );
```

改为：

```typescript
    newState = addHistoryEntry(
      newState,
      event.narrative,
      choice.text,
      choice.effects,
      {
        yearsPassed: event.yearsPassed,
        eventType: event.eventType,
        consequences: event.consequences,
        statusChanges: event.statusChanges,
        choiceContext: event.choiceContext,
        consequenceText,
        consequenceStatusChanges,
      }
    );
```

- [ ] **Step 4：修正选择计数器（用户要求 1:2 频率）**

找到 `choiceCounterRef.current = Math.floor(Math.random() * 4) + 5;`，改为：

```typescript
    choiceCounterRef.current = 2; // 选择后间隔 2 个非选择节点
```

同时找到 handleContinueLife 里递减计数器的逻辑。如果原逻辑是 `choiceCounterRef.current--` 并在 `=== 0` 时触发选择，保持即可；如果原逻辑是随机设置，一并修正为非选择节点递减、到 0 触发。

- [ ] **Step 5：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 6：手工冒烟**

打开浏览器，触发一次选择节点，点选项，期望立即看到一段青色 consequence，然后点击"继续人生"看到下一节点。

- [ ] **Step 7：提交**

```bash
git add apps/web/src/pages/GamePage.tsx
git commit -m "feat(web): handleChoice 接入 /api/ai/consequence，修正选择计数器为 1:2"
```

---

### Task 20：死亡分支接入 /api/ai/death

**Files:**
- Modify: `apps/web/src/pages/GamePage.tsx`

- [ ] **Step 1：定位现有死亡处理**

Run: `grep -n "deathText\|isDead\|deathCause" apps/web/src/pages/GamePage.tsx`
Expected: 关键行约 510-526。

- [ ] **Step 2：在 isDead === true 分支调用 generateDeath**

把当前用模板拼接死亡文案的代码（约 line 486-526）替换为：

```typescript
if (newCharacter.age >= maxAge || derived.lifespan <= 0 || /* 触发死亡的其它条件 */) {
  // 计算死因
  const deathCause = computeDeathCause(state); // 现有逻辑

  // 调用 generateDeath
  let deathPayload: {
    preDeathText: string;
    deathText: string;
    endingTitle: string;
    epitaph: string;
  };
  try {
    const resp = await aiApi.generateDeath({
      saveId,
      character: { ...newCharacter },
      lifeStatus: state.lifeStatus,
      recentHistory: state.history.slice(-6),
      deathReason: deathCause,
    });
    if (resp.data?.success) {
      deathPayload = {
        preDeathText: resp.data.preDeathText || '',
        deathText: resp.data.deathText,
        endingTitle: resp.data.endingTitle,
        epitaph: resp.data.epitaph,
      };
    } else {
      throw new Error(resp.data?.message || 'death API failed');
    }
  } catch (err) {
    console.warn('generateDeath 失败，使用兜底文案', err);
    deathPayload = {
      preDeathText: '',
      deathText: `你在${newCharacter.age}岁时因${deathCause}离世。这一生有起有伏，终归尘土。`,
      endingTitle: '尘埃落定',
      epitaph: `${newCharacter.age}岁的旅人，走过山河，也走过自己。`,
    };
  }

  // 渲染
  if (deathPayload.preDeathText) appendStoryEntry(deathPayload.preDeathText, 'preDeath');
  appendStoryEntry(deathPayload.deathText, 'death');
  appendStoryEntry(deathPayload.endingTitle, 'endingTitle');
  appendStoryEntry(deathPayload.epitaph, 'epitaph');

  // 把整段写入 history.death
  appendHistoryEntry({
    year: newCharacter.age,
    narrative: deathPayload.deathText,
    choice: deathCause,
    effects: { body: 0, mind: 0, charm: 0, fate: 0 },
    isDeath: true,
    deathText: deathPayload.deathText,
    death: deathPayload,
  });

  setGameStatus('dead');
  return;
}
```

- [ ] **Step 3：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 4：手工冒烟**

把寿命下调（mock 一个老角色）触发死亡，期望看到 4 段：preDeath（可选）、death（红色多段）、endingTitle（大字）、epitaph（引文）。

- [ ] **Step 5：提交**

```bash
git add apps/web/src/pages/GamePage.tsx
git commit -m "feat(web): 死亡分支接入 /api/ai/death，渲染 4 段结局"
```

---

### Task 21：移除 worldConfig.getTransitionText 调用方

**Files:**
- Modify: `apps/web/src/pages/GamePage.tsx`
- Modify: `apps/web/src/engine/worldConfig.ts`

- [ ] **Step 1：定位现有调用**

Run: `grep -rn "getTransitionText" apps/web/src/`

- [ ] **Step 2：删除 GamePage 中的 getTransitionText 调用**

把 GamePage 里基于 yearsPassed 拼写"白驹过隙、"等过渡的代码删掉（已被 AI 生成的 `node.transition` 替代）。

- [ ] **Step 3：保留 worldConfig.ts 的 getTransitionText 函数但加 deprecation 注释**

```typescript
/**
 * @deprecated 自 2026-05-06 起改由 AI 生成 transition 字段。仅保留供旧存档兼容。
 */
export function getTransitionText(worldName: string, yearsPassed: number): string {
  // ...原实现保持
}
```

- [ ] **Step 4：编译**

Run: `pnpm --filter web build`
Expected: tsc 通过。

- [ ] **Step 5：提交**

```bash
git add apps/web/src/pages/GamePage.tsx apps/web/src/engine/worldConfig.ts
git commit -m "refactor(web): 移除 getTransitionText 调用，过渡句由 AI 生成"
```

---

## Phase 5：验证、文档、黄金样本

### Task 22：写 E2E 检查清单

**Files:**
- Create: `docs/superpowers/specs/2026-05-06-life-simulation-redesign-e2e-checklist.md`

- [ ] **Step 1：写入清单文件**

```markdown
# 人生模拟叙事重构 E2E 验证清单

> 配合 `2026-05-06-life-simulation-redesign-design.md` §6.2 使用。

## 修仙世界

- [ ] 创建角色：选 修仙世界 + "野心强烈"性格 + 任意天赋
- [ ] 出生段 80-150 字，包含父母名字 + 出生地
- [ ] 0-86 岁完整跑通，至少 30 个节点
- [ ] 至少 5 个节点带斜体 transition 句
- [ ] 至少 2 个 NPC 多次回归（如沈青/王启）
- [ ] 选择节点后看到 consequence 段
- [ ] 死亡触发完整 preDeathText + deathText + endingTitle(4字) + epitaph
- [ ] 人工对照示例 1 评分（叙事/NPC 连贯/节奏/死亡张力，每项 1-5 分）

## 紫禁城（地球 Online 古代变体）

- [ ] 创建角色：地球 Online + worldConfig=`紫禁城宫廷` + "温柔敏感"
- [ ] 0-45 岁完整跑通
- [ ] 人工对照示例 2 评分

## 赛博灵朝

- [ ] 跑通 0-32 岁
- [ ] transition 句符合赛博基调（"霓虹闪烁中，三个付费周期过去"）

## 兼容性

- [ ] 加载旧存档（v1，无 transition/consequence 字段），UI 不崩
- [ ] 服务端断网 30s 模拟，节点显示兜底文案"你度过了平淡的一年"，恢复后能继续
- [ ] 25 节点之后压缩生效，Network panel 看到 prompt token < 3000

## 性能

- [ ] 一次"选择 → 后果 → 下一节点"链路 ≤ 8 秒
- [ ] 批量 10 次推进，单次 P95 < 5 秒
```

- [ ] **Step 2：提交**

```bash
git add docs/superpowers/specs/2026-05-06-life-simulation-redesign-e2e-checklist.md
git commit -m "docs: 增加人生模拟重构 E2E 检查清单"
```

---

### Task 23：跑修仙世界完整 E2E + 保存黄金样本

**Files:**
- Create: `docs/superpowers/specs/golden-samples/cultivation-86.json`

- [ ] **Step 1：在浏览器跑完整修仙人生**

按 Task 22 的"修仙世界"段执行。期望叙事质量对标示例 1。

- [ ] **Step 2：导出存档 JSON**

在游戏内点"导出存档"或调用 `GET /api/saves/:id`，把完整 snapshot JSON 复制下来。

- [ ] **Step 3：保存到 docs/superpowers/specs/golden-samples/cultivation-86.json**

```bash
mkdir -p docs/superpowers/specs/golden-samples
# 把 JSON 写入 cultivation-86.json
```

- [ ] **Step 4：在文件顶部加 metadata 注释（用 JSON 不支持注释，单独写 README）**

创建 `docs/superpowers/specs/golden-samples/README.md`：

```markdown
# 黄金样本

| 文件 | 世界 | 年龄区间 | 节点数 | 评分（叙事/NPC/节奏/死亡） |
| --- | --- | --- | --- | --- |
| cultivation-86.json | 修仙世界 | 0-86 | TBD | _填_ / _填_ / _填_ / _填_ |
```

- [ ] **Step 5：提交**

```bash
git add docs/superpowers/specs/golden-samples/
git commit -m "docs: 保存修仙世界 0-86 岁黄金样本"
```

---

### Task 24：跑紫禁城黄金样本

**Files:**
- Create: `docs/superpowers/specs/golden-samples/imperial-45.json`

- [ ] **Step 1：在浏览器跑紫禁城 0-45 岁**

参考 Task 22 的紫禁城段。

- [ ] **Step 2：导出 + 保存到 imperial-45.json**

- [ ] **Step 3：更新 golden-samples/README.md 第 2 行**

- [ ] **Step 4：提交**

```bash
git add docs/superpowers/specs/golden-samples/imperial-45.json docs/superpowers/specs/golden-samples/README.md
git commit -m "docs: 保存紫禁城 0-45 岁黄金样本"
```

---

### Task 25：跑赛博灵朝黄金样本

**Files:**
- Create: `docs/superpowers/specs/golden-samples/cyberpunk-32.json`

- [ ] **Step 1：在浏览器跑赛博灵朝 0-32 岁**

- [ ] **Step 2：导出 + 保存**

- [ ] **Step 3：更新 README.md**

- [ ] **Step 4：提交**

```bash
git add docs/superpowers/specs/golden-samples/cyberpunk-32.json docs/superpowers/specs/golden-samples/README.md
git commit -m "docs: 保存赛博灵朝 0-32 岁黄金样本"
```

---

## 完成标志

所有 25 个任务完成后，应满足：

- ✅ `pnpm --filter life-echo-api test` 全 pass（≥12 个用例）
- ✅ `pnpm --filter life-echo-api build` 与 `pnpm --filter web build` 都通过
- ✅ 在浏览器跑修仙 + 紫禁城 + 赛博 3 局完整人生，对照黄金样本评分 ≥ 4.0/5
- ✅ E2E 清单中所有项目都打勾
- ✅ git log 上有清晰的 25+ 个原子 commit
