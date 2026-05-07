// ==================== 游戏引擎核心 ====================
// 阶段06 - 游戏引擎核心
// 负责：年龄推进、阶段切换、属性计算、事件触发

import { calcWorldLifespan } from './worldConfig';

export type LifeStage = 'infant' | 'child' | 'youth' | 'adult' | 'elder';

// ==================== 天赋信息 ====================
export interface TalentInfo {
  name: string;
  desc: string;
  rarity?: string;
}

// ==================== 遗产信息 ====================
export interface LegacyInfo {
  name: string;
  desc: string;
  rarity?: string;
  source?: string;
}

export interface GameCharacter {
  name: string;
  world: string;
  worldConfig?: string;     // 世界配置（如"宗门"/"散修"/"魔道"）
  gender: string;
  age: number;
  lifeStage: LifeStage;
  personality: string;
  desire: string;
  attributes: {
    body: number;
    mind: number;
    charm: number;
    fate: number;
  };
  talents: TalentInfo[];    // 完整天赋信息（含描述）
  legacy: LegacyInfo[];     // 完整遗产信息（含描述）
  isAlive: boolean;
}

// ==================== 人生状态（新增）====================

export interface LifeStatus {
  identity: string;        // 当前身份（散修、猎户弟子、杂货伙计等）
  location: string;        // 当前地点
  ability: string;         // 当前能力/境界/职业等级
  items: string[];         // 拥有的物品、功法、资源
  relationships: string[]; // 重要关系
  injuries: string[];      // 伤病、暗伤、负面状态
  reputation: string;      // 名声
  goals: string[];         // 当前目标
  tags: string[];          // 关键标签
  pending: string[];       // 未解决伏笔
}

/** 创建默认人生状态 */
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

// ==================== 人生节点（扩展）====================

export interface GameEvent {
  id: string;
  year: number;
  stage: LifeStage;
  title: string;
  narrative: string;
  choices: EventChoice[];
  type: 'milestone' | 'random' | 'crisis' | 'choice';
  /** 从AI节点携带的元数据，用于创建历史记录 */
  yearsPassed?: number;
  eventType?: string;
  consequences?: string[];
  statusChanges?: Partial<LifeStatus>;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: AttributeEffects;
  followUp?: string;
}

export interface AttributeEffects {
  body?: number;
  mind?: number;
  charm?: number;
  fate?: number;
}

// 扩展的历史记录，现在代表一个人生节点
export interface GameHistory {
  year: number;
  narrative: string;       // 展示文本（人生节点格式，含年龄前缀）
  choice: string;          // 玩家做出的选择文本
  effects: AttributeEffects;
  yearsPassed?: number;    // 距离上一次的年龄跨度
  eventType?: string;      // 事件类型
  consequences?: string[]; // 事件后果
  statusChanges?: Partial<LifeStatus>; // 状态变化
  isDeath?: boolean;       // 是否是死亡节点
  deathText?: string;      // 死亡结局文本
}

export interface GameState {
  character: GameCharacter;
  lifeStatus: LifeStatus;  // 新增：当前人生状态
  history: GameHistory[];
  currentEvent: GameEvent | null;
  gameStatus: 'playing' | 'paused' | 'dead' | 'ascended';
  generation: number;
  playTime: number;
}

// ==================== 年龄和阶段管理 ====================

// 年龄阶段范围
// infant: 0-6, child: 7-12, youth: 13-18, adult: 19-60, elder: 61+

const STAGE_NAMES: Record<LifeStage, string> = {
  infant: '幼年',
  child: '少年',
  youth: '青年',
  adult: '成年',
  elder: '终焉',
};

export function getLifeStage(age: number): LifeStage {
  if (age <= 6) return 'infant';
  if (age <= 12) return 'child';
  if (age <= 18) return 'youth';
  if (age <= 60) return 'adult';
  return 'elder';
}

export function getLifeStageName(stage: LifeStage): string {
  return STAGE_NAMES[stage];
}

export function getNextStageAge(stage: LifeStage): number {
  switch (stage) {
    case 'infant': return 7;
    case 'child': return 13;
    case 'youth': return 19;
    case 'adult': return 61;
    case 'elder': return -1; // 终焉无下一阶段
  }
}

// ==================== 属性计算引擎 ====================

export interface DerivedStats {
  health: number;
  lifespan: number;
  reputation: number;
  happiness: number;
  wealth: number;
  power: number;
}

export function calculateDerivedStats(character: GameCharacter): DerivedStats {
  const { body, mind, charm, fate } = character.attributes;
  const world = character.world || '地球 Online';

  // 使用世界特定寿命公式
  const lifespan = calcWorldLifespan(world, body, mind, fate);

  // 其他衍生属性保持不变（跨世界通用）
  const health = Math.round(body * 8 + fate * 2 + 40);
  const reputation = Math.round(charm * 5 + mind * 3 + fate * 2);
  const happiness = Math.round(50 + charm * 3 + fate * 2 - Math.abs(10 - body) * 2);
  const wealth = Math.round(mind * 3 + charm * 2 + fate * 4 + 20);
  const power = Math.round(body * 4 + mind * 3 + fate * 3);

  return {
    health: Math.min(100, Math.max(1, health)),
    lifespan: lifespan,
    reputation: Math.min(100, Math.max(1, reputation)),
    happiness: Math.min(100, Math.max(1, happiness)),
    wealth: Math.min(100, Math.max(1, wealth)),
    power: Math.min(100, Math.max(1, power)),
  };
}

// ==================== 事件效果应用 ====================

export function applyChoiceEffects(
  character: GameCharacter,
  effects: AttributeEffects
): GameCharacter {
  const newAttributes = { ...character.attributes };

  if (effects.body) newAttributes.body = clampAttribute(newAttributes.body + effects.body);
  if (effects.mind) newAttributes.mind = clampAttribute(newAttributes.mind + effects.mind);
  if (effects.charm) newAttributes.charm = clampAttribute(newAttributes.charm + effects.charm);
  if (effects.fate) newAttributes.fate = clampAttribute(newAttributes.fate + effects.fate);

  return {
    ...character,
    attributes: newAttributes,
  };
}

/** 兼容处理：将旧存档的字符串数组或混合数组转换为 TalentInfo[] */
function normalizeTalents(talents: any[]): TalentInfo[] {
  if (!Array.isArray(talents)) return [];
  return talents.map((t: any) => {
    if (typeof t === 'string') {
      return { name: t, desc: '', rarity: '' };
    }
    return {
      name: t.name || '未知天赋',
      desc: t.desc || '',
      rarity: t.rarity || '',
    };
  });
}

/** 兼容处理：将旧存档的字符串数组或混合数组转换为 LegacyInfo[] */
function normalizeLegacy(legacy: any[]): LegacyInfo[] {
  if (!Array.isArray(legacy)) return [];
  return legacy.map((l: any) => {
    if (typeof l === 'string') {
      return { name: l, desc: '', rarity: '', source: '' };
    }
    return {
      name: l.name || '未知遗产',
      desc: l.desc || '',
      rarity: l.rarity || '',
      source: l.source || '',
    };
  });
}

function clampAttribute(value: number): number {
  return Math.max(1, Math.min(20, value));
}

// ==================== 人生状态更新（新增）====================

/** 应用人生状态变化 */
export function applyLifeStatusChanges(
  current: LifeStatus,
  changes: Partial<LifeStatus> | undefined
): LifeStatus {
  if (!changes) return current;
  return {
    identity: changes.identity || current.identity,
    location: changes.location || current.location,
    ability: changes.ability || current.ability,
    items: changes.items || current.items,
    relationships: changes.relationships || current.relationships,
    injuries: changes.injuries || current.injuries,
    reputation: changes.reputation || current.reputation,
    goals: changes.goals || current.goals,
    tags: changes.tags || current.tags,
    pending: changes.pending || current.pending,
  };
}

// ==================== 年龄推进（改造）====================

/** 
 * 根据人生阶段和剧情重要性推进年龄
 * 返回 { newAge, yearsAdvanced }
 */
export function advanceLifeYears(
  currentAge: number,
  stage: LifeStage,
  importance: 'normal' | 'major' | 'critical' = 'normal'
): { newAge: number; yearsAdvanced: number } {
  let yearsToAdvance: number;

  // 根据人生阶段决定基础跨度
  switch (stage) {
    case 'infant':
      yearsToAdvance = Math.floor(Math.random() * 5) + 3; // 3-7年
      break;
    case 'child':
      yearsToAdvance = Math.floor(Math.random() * 4) + 3; // 3-6年
      break;
    case 'youth':
      yearsToAdvance = Math.floor(Math.random() * 4) + 2; // 2-5年
      break;
    case 'adult':
      yearsToAdvance = Math.floor(Math.random() * 7) + 4; // 4-10年
      break;
    case 'elder':
      yearsToAdvance = Math.floor(Math.random() * 8) + 5; // 5-12年
      break;
    default:
      yearsToAdvance = Math.floor(Math.random() * 5) + 2;
  }

  // 根据重要性调整
  if (importance === 'major') {
    yearsToAdvance = Math.max(1, Math.min(yearsToAdvance - 2, 3)); // 1-3年
  } else if (importance === 'critical') {
    yearsToAdvance = Math.max(1, Math.min(yearsToAdvance - 3, 2)); // 1-2年
  }

  const newAge = currentAge + yearsToAdvance;
  return { newAge, yearsAdvanced: yearsToAdvance };
}

/** 检查是否死亡（基于年龄和属性） */
export function checkDeath(character: GameCharacter): {
  isDead: boolean;
  cause: string;
} {
  const derived = calculateDerivedStats(character);

  if (character.age >= derived.lifespan) {
    return { isDead: true, cause: '寿元耗尽' };
  }

  if (character.attributes.body <= 0) {
    return { isDead: true, cause: '体魄衰竭' };
  }

  // 终焉阶段有概率死亡（模拟衰老）
  if (character.lifeStage === 'elder' && character.age > 70) {
    const deathChance = (character.age - 70) * 0.05; // 每年增加5%概率
    if (Math.random() < deathChance) {
      return { isDead: true, cause: '衰老' };
    }
  }

  return { isDead: false, cause: '' };
}

// ==================== 历史记录 ====================

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
  }
): GameState {
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
  };

  // 如果有状态变化，应用到 lifeStatus
  let newLifeStatus = state.lifeStatus;
  if (options?.statusChanges) {
    newLifeStatus = applyLifeStatusChanges(state.lifeStatus, options.statusChanges);
  }

  return {
    ...state,
    history: [...state.history, entry],
    lifeStatus: newLifeStatus,
  };
}

// ==================== 初始化游戏状态 ====================

export function createGameStateFromSave(saveData: any): GameState {
  const character = saveData.character;
  const ageMap: Record<string, number> = { '幼年': 0, '少年': 7, '青年': 13, '成年': 19, '终焉': 61 };
  const initialAge = ageMap[character.age] ?? character.age ?? 0;

  return {
    character: {
      name: character.name || '无名者',
      world: character.world || '地球 Online',
      gender: character.gender || '未知',
      age: initialAge,
      lifeStage: getLifeStage(initialAge),
      personality: character.personality || '普通',
      desire: character.desire || '无',
      attributes: {
        body: character.attributes?.body || 5,
        mind: character.attributes?.mind || 5,
        charm: character.attributes?.charm || 5,
        fate: character.attributes?.fate || 5,
      },
      talents: normalizeTalents(character.talents),
      legacy: normalizeLegacy(character.legacy),
      worldConfig: character.worldConfig || '',
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

// ==================== 存档序列化 ====================

export function serializeGameState(state: GameState): any {
  return {
    character: {
      name: state.character.name,
      world: state.character.world,
      worldConfig: state.character.worldConfig,
      gender: state.character.gender,
      age: state.character.age,
      lifeStage: state.character.lifeStage,
      personality: state.character.personality,
      desire: state.character.desire,
      attributes: state.character.attributes,
      talents: state.character.talents.map(t => ({ name: t.name, desc: t.desc, rarity: t.rarity })),
      legacy: state.character.legacy.map(l => ({ name: l.name, desc: l.desc, rarity: l.rarity, source: l.source })),
      isAlive: state.character.isAlive,
    },
    lifeStatus: state.lifeStatus,
    history: state.history,
    currentEvent: state.currentEvent,
    gameStatus: state.gameStatus,
    generation: state.generation,
    playTime: state.playTime,
    _version: 1,
    _savedAt: Date.now(),
  };
}
