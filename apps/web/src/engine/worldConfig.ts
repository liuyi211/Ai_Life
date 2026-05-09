// ==================== 世界差异配置 ====================
// 不同世界有不同寿命上限、意外死亡概率、年龄过渡描述

// ---- 死亡配置 ----
export interface WorldDeathConfig {
  /** 基础寿命 */
  baseLifespan: number;
  /** 体魄对寿命的乘数 */
  bodyMult: number;
  /** 气运对寿命的乘数 */
  fateMult: number;
  /** 悟性对寿命的乘数 */
  mindMult: number;
  /** 每次推进节点意外死亡概率（0-1），0 表示无意外 */ 
  accidentChance: number;
  /** 该世界可能的意外死因 */
  accidents: string[];
}

// ---- 过渡短语 ----
export interface WorldTransition {
  /** 普通过渡（短时间） */
  short: string[];
  /** 长时间过渡（＞5年） */
  long: string[];
}

// ---- 完整世界配置 ----
export interface WorldConfig {
  death: WorldDeathConfig;
  transition: WorldTransition;
  /** 用于 AI 提示词的世界特定死亡说明 */
  deathNote: string;
}

// ==================== 六界配置 ====================

const WORLD_CONFIGS: Record<string, WorldConfig> = {
  '地球 Online': {
    death: {
      baseLifespan: 60,
      bodyMult: 2,
      fateMult: 2,
      mindMult: 1,
      accidentChance: 0.03,
      accidents: [
        '交通事故', '突发疾病', '意外坠亡', '溺水',
        '火灾', '食物中毒', '被卷入犯罪事件', '自然灾害',
      ],
    },
    transition: {
      short: ['寒来暑往，', '四季更替，', '日子一天天过去，', '白驹过隙，'],
      long: ['岁月无声流淌，', '春去秋来数载，', '几年的光阴悄然逝去，', '时间如车轮碾过，'],
    },
    deathNote: '地球世界人类寿命约60-90岁。意外死亡包括车祸、疾病、事故等现代社会的风险。寿终正寝通常在70-90岁之间。',
  },

  '修仙世界': {
    death: {
      baseLifespan: 100,
      bodyMult: 5,
      fateMult: 8,
      mindMult: 3,
      accidentChance: 0.06,
      accidents: [
        '被妖兽袭击', '修炼走火入魔', '遭仇家暗算', '秘境中陨落',
        '天劫降临', '丹药反噬', '宗门大战中阵亡', '被魔道修士炼魂',
        '闯入禁地殒命', '法宝失控反噬',
      ],
    },
    transition: {
      short: ['闭关数载，', '潜心修炼，', '山中无甲子，', '修炼之余，'],
      long: ['一入定便是经年，', '洞府中不问世事，', '修行路上岁月如梭，', '十年磨一剑，'],
    },
    deathNote: '修仙世界修士寿命可长达200-300岁（练气100，筑基200，金丹400）。意外死亡风险高：妖兽、仇杀、秘境、天劫、丹药反噬等。寿元耗尽前会有天人五衰之兆。',
  },

  '真武世界': {
    death: {
      baseLifespan: 70,
      bodyMult: 5,
      fateMult: 3,
      mindMult: 2,
      accidentChance: 0.05,
      accidents: [
        '比武中重伤不治', '被仇家暗杀', '走火入魔经络尽断',
        '中毒身亡', '替人挡箭', '保护弱小而被围攻致死',
        '练功岔气暴毙', '江湖恩怨波及',
      ],
    },
    transition: {
      short: ['寒暑交替，', '苦练不辍，', '习武之余，', '江湖路上，'],
      long: ['数年苦修如一瞬，', '武功日益精进，', '刀光剑影中数年已过，', '拳掌之间岁月流逝，'],
    },
    deathNote: '真武世界武者寿命约70-150岁，内力深厚者可达120以上。意外死亡常见：比武、仇杀、走火入魔、中毒。江湖人刀口舔血，死亡率高于常人。',
  },

  '赛博灵朝': {
    death: {
      baseLifespan: 50,
      bodyMult: 4,
      fateMult: 2,
      mindMult: 2,
      accidentChance: 0.07,
      accidents: [
        '义体过热自燃', '遭到清理者清除', '赛博精神病发作',
        '数据灵魂被抹除', '神经病毒入侵', '被企业安全部队歼灭',
        '香火服务器宕机导致灵体消散', '功德负债被强制执行终结',
      ],
    },
    transition: {
      short: ['霓虹闪烁中，', '数据流转间，', '街头巷尾，', '又一个付费周期，'],
      long: ['义体升级换代间数年已逝，', '香火余额的数字默默跳动，', '企业的轮回报表又翻过一页，', '数据洪流中岁月无痕，'],
    },
    deathNote: '赛博灵朝底层人寿命约50-80岁，义体改造者可能更短或更长。意外死亡：义体故障、企业清除、赛博精神病、数据抹除。理论上可通过数据备份和义体替换延长寿命，但需要巨额功德。',
  },

  '末日方舟城': {
    death: {
      baseLifespan: 40,
      bodyMult: 3,
      fateMult: 1,
      mindMult: 2,
      accidentChance: 0.10,
      accidents: [
        '被变异生物撕碎', '辐射病发作', '配给被抢饿死',
        '高墙外失踪', '拾荒中被废弃机械绞杀', '感染瘟疫',
        '被流放荒野', '水源污染中毒',
      ],
    },
    transition: {
      short: ['又熬过一个供给周期，', '在高墙的阴影下，', '配给卡又被打了一次孔，', '废墟间，'],
      long: ['在废土上挣扎多年，', '高墙内的日子一天天重复，', '辐射云雾下的岁月，', '末日中活着就是胜利，'],
    },
    deathNote: '末日方舟城人均寿命约40-60岁，极少超过70。意外死亡概率高：变异生物、辐射、饥荒、暴力、瘟疫。活到老死本身就是一种成就。',
  },

  '神话复苏': {
    death: {
      baseLifespan: 80,
      bodyMult: 4,
      fateMult: 6,
      mindMult: 3,
      accidentChance: 0.05,
      accidents: [
        '被旧神信徒献祭', '理智归零彻底疯狂', '直视神祇真容',
        '神裔血脉觉醒失败', '被卷入神话事件', '上古诅咒发作',
        '调查局任务中殉职', '旧神苏醒带来的毁灭',
      ],
    },
    transition: {
      short: ['神谕低语中，', '调查局的又一个任务，', '正常与异常的交界处，', '理智尚存的日子里，'],
      long: ['在神话与现实的夹缝中度过数年，', '调查局档案堆得越来越高，', '旧神的苏醒倒计时从未停下，', '血脉在缓慢觉醒中流淌着岁月，'],
    },
    deathNote: '神话复苏世界普通人类寿命约80-100岁，神裔血脉者可达150以上。意外死亡：被献祭、理智归零、直视神祇、神话灾难。调查局探员平均寿命不足40岁。',
  },
};

/** 获取世界的死亡配置（找不到时返回地球默认） */
export function getWorldDeathConfig(worldName: string): WorldDeathConfig {
  const config = WORLD_CONFIGS[worldName];
  if (config) return config.death;
  // 未知世界：用地球配置 + 泛指意外
  return {
    baseLifespan: 60,
    bodyMult: 2,
    fateMult: 2,
    mindMult: 1,
    accidentChance: 0.03,
    accidents: ['意外身亡'],
  };
}

/** 计算世界特定寿命 */
export function calcWorldLifespan(
  worldName: string,
  body: number,
  mind: number,
  fate: number,
): number {
  const cfg = getWorldDeathConfig(worldName);
  const raw = cfg.baseLifespan + body * cfg.bodyMult + fate * cfg.fateMult + mind * cfg.mindMult;
  return Math.round(raw);
}

/** 获取世界的死亡提示文字（给 AI 用） */
export function getWorldDeathNote(worldName: string): string {
  const config = WORLD_CONFIGS[worldName];
  if (config) return config.deathNote;
  return '该世界普通人类寿命约60-90岁。可能因疾病、意外或衰老死亡。';
}

/** 随机意外死因 */
export function getRandomAccident(worldName: string): string {
  const cfg = getWorldDeathConfig(worldName);
  return cfg.accidents[Math.floor(Math.random() * cfg.accidents.length)] || '意外身亡';
}

/** 获取年龄过渡短语 */
export function getTransitionText(worldName: string, yearsPassed: number): string {
  const config = WORLD_CONFIGS[worldName];
  if (!config) return `${yearsPassed}年后，`;
  const pool = yearsPassed > 5 ? config.transition.long : config.transition.short;
  const prefix = pool[Math.floor(Math.random() * pool.length)];
  return `${prefix}`;
}

// ==================== 纯时间流淌过渡句（世界无关） ====================

const STAGE_TRANSITIONS: Record<string, string[]> = {
  infant: [
    '春去秋来，又一年在无忧无虑中悄然流过。',
    '四季轮转，你在懵懂中又长大了一岁。',
    '日升月落间，稚嫩的时光静静流淌。',
    '寒来暑往，襁褓中的日子渐行渐远。',
    '时光无声，你在家人的呵护下悄然成长。',
  ],
  child: [
    '寒来暑往，身量渐长，岁月在不知不觉间将你推向下一程。',
    '光阴似箭，年少的时光在日复一日间悄然流逝。',
    '四季更迭，少年心事在平凡的日子里慢慢沉淀。',
    '春花秋月轮转，成长的痕迹刻在每一个寻常日子。',
    '日子如水般流过，你在平淡中又走过一段路。',
  ],
  youth: [
    '时光荏苒，几年光阴在日升月落间无声滑过。',
    '岁月如梭，你在日常的琐碎中又走过一段年华。',
    '光阴流转，青春在不经意间悄悄溜走。',
    '斗转星移，日子在忙碌与闲暇中交替前行。',
    '流年似水，昨日的青涩在不知不觉间褪去。',
  ],
  adult: [
    '数载春秋，日子如水般流过，琐碎中藏着不易察觉的变迁。',
    '白驹过隙，多年的积累在不知不觉间沉淀成底色。',
    '时光匆匆，忙碌的日子让人无暇细数流年。',
    '岁月无声，平凡的生活在晨昏交替中缓缓推进。',
    '光阴荏苒，看似重复的日子里藏着细微的改变。',
  ],
  elder: [
    '光阴催人老，又是一段岁月在白发与回忆中缓缓淌过。',
    '时光不居，你比往年更清晰地感受到生命的流逝。',
    '日暮时分更长，岁月在静默中一笔一划刻下痕迹。',
    '余生如秋叶，一片片在风中缓缓飘落。',
    '时光慢了下来，每一天都像是岁月的馈赠。',
  ],
};

/** 获取通用时间过渡句（一次随机取一句，不重复世界观） */
export function getStageTransitionText(stage: string): string {
  const pool = STAGE_TRANSITIONS[stage] || STAGE_TRANSITIONS.adult;
  return pool[Math.floor(Math.random() * pool.length)];
}
