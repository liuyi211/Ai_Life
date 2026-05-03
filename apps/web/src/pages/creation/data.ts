export interface WorldConfig {
  id: string;
  mark: string;
  tag: string;
  tagEn: string;
  code: string;
  name: string;
  desc: string;
  chips: string[];
  detailDesc: string;
  configOptions: string[];
}

export const WORLDS: WorldConfig[] = [
  {
    id: 'earth',
    mark: 'Ⅰ',
    tag: 'Realistic Low Fantasy',
    tagEn: '推荐 / 长线',
    code: '地球 Online',
    name: '地球 Online',
    desc: '现代社会低魔环境。家庭、职业、阶层与偶然事件构成人生主变量。',
    chips: ['现实成长', '家庭羁绊', '阶层跃迁', '都市异闻', '未来邮件'],
    detailDesc: '基础设定：现实成长、家庭压力、职业路线与少量异常事件。',
    configOptions: ['现代', '古代', '远古'],
  },
  {
    id: 'cultivation',
    mark: 'Ⅱ',
    tag: 'Cultivation Fate',
    tagEn: '高随机 / 高寿命',
    code: '修仙世界',
    name: '修仙世界',
    desc: '灵根、宗门、秘境与天劫共同塑造一生。凡骨亦可逆天。',
    chips: ['灵根', '宗门', '秘境', '因果债', '飞升'],
    detailDesc: '基础设定：灵根、宗门、秘境、功法与天劫。',
    configOptions: ['宗门', '散修', '魔道'],
  },
  {
    id: 'martial',
    mark: 'Ⅲ',
    tag: 'Martial Jianghu',
    tagEn: '战斗 / 声望',
    code: '真武世界',
    name: '真武世界',
    desc: '血气成炉，拳意入骨。武馆、边军、江湖声望决定成长轨迹。',
    chips: ['武馆', '江湖', '边军', '名声', '拳意'],
    detailDesc: '基础设定：武馆、江湖、边军、声望与武学突破。',
    configOptions: ['武馆', '军伍', '江湖'],
  },
  {
    id: 'cyber',
    mark: 'Ⅳ',
    tag: 'Custom Saved',
    tagEn: '自定义 / 已保存',
    code: '赛博灵朝',
    name: '赛博灵朝',
    desc: '义体科技与香火神权并存。功德、债务与寿命都可交易。',
    chips: ['义体', '神龛网络', '功德债', '数字香火'],
    detailDesc: '基础设定：义体、神龛网络、功德债务与数字香火。',
    configOptions: ['义体', '香火', '反神权'],
  },
  {
    id: 'doomsday',
    mark: 'Ⅴ',
    tag: 'Doomsday City',
    tagEn: '生存 / 高压',
    code: '末日方舟城',
    name: '末日方舟城',
    desc: '资源衰竭后的高墙城市。配给、感染与迁徙许可决定生路。',
    chips: ['配给', '感染', '高墙', '黑市', '迁徙许可'],
    detailDesc: '基础设定：配给、感染、高墙、黑市与迁徙许可。',
    configOptions: ['拾荒', '墙卫', '医生'],
  },
  {
    id: 'myth',
    mark: 'Ⅵ',
    tag: 'Myth Awakening',
    tagEn: '神秘 / 现代',
    code: '神话复苏',
    name: '神话复苏',
    desc: '现代神话实体逐步苏醒。神裔、调查员与旧神代理人开始出现。',
    chips: ['神裔', '调查局', '旧神', '献祭', '理智'],
    detailDesc: '基础设定：神裔、调查局、旧神、秘仪与理智污染。',
    configOptions: ['调查员', '神裔', '信徒'],
  },
];

export interface Talent {
  rarity: string;
  name: string;
  desc: string;
}

export const TALENT_POOLS: Talent[][] = [
  [
    { rarity: 'Rare / 稀有', name: '早慧之眼', desc: '学习、推理与理解速度提升。少年期更易触发知识节点，也更容易看见选择背后的长期代价。' },
    { rarity: 'Epic / 史诗', name: '命硬如石', desc: '遭遇重大危机时，获得一次额外转机判定。你不会轻易被一次失败击倒，但命运会记住这次偏移。' },
    { rarity: 'Rare / 稀有', name: '人群回声', desc: '更容易与他人形成长期羁绊。贵人、朋友与敌人都会更早出现，也更容易卷入他人的因果。' },
  ],
  [
    { rarity: 'Epic / 史诗', name: '迟来的天命', desc: '前期平凡甚至受挫，但中后期更容易出现翻盘节点。越晚觉醒，回响越猛烈。' },
    { rarity: 'Rare / 稀有', name: '不合时宜的善良', desc: '你做出的善举更容易获得长期回报，但短期往往要付出更高代价，甚至改变原本安全的路线。' },
    { rarity: 'Legend / 传说', name: '因果旁观者', desc: '更容易察觉隐藏因果与关键伏笔。干预越多，命运反噬越强，但也可能改写原定终局。' },
  ],
  [
    { rarity: 'Rare / 稀有', name: '败者心', desc: '失败后成长速度提升。连续失败不会只带来惩罚，也可能触发新的执念、复仇线或特殊转折。' },
    { rarity: 'Epic / 史诗', name: '贵人不绝', desc: '低谷时更容易遇到愿意伸手的人。但每一次帮助都会形成关系债务，未来可能要求偿还。' },
    { rarity: 'Rare / 稀有', name: '边缘天赋', desc: '在非常规路线中更容易发现隐藏路径。不走寻常路时，命运偶尔会额外给你一扇门。' },
  ],
];

export interface LegacyItem {
  mark: string;
  rarity: string;
  name: string;
  desc: string;
  source: string;
}

export const LEGACY_DATA: Record<string, LegacyItem[]> = {
  skill: [
    { mark: '技', rarity: 'Skill / From 周砚', name: '竞赛直觉', desc: '遇到学习、推理、考试、技术路线时，获得更高的关键判断概率。', source: '来源：地球 Online · 暴雨夜线' },
    { mark: '技', rarity: 'Skill / From 沈问刀', name: '败后调息', desc: '失败或受伤后，下一次成长判定略微提升。', source: '来源：真武世界 · 一败之后' },
    { mark: '技', rarity: 'Skill / From 许知微', name: '谈判余温', desc: '商业、交易、求助、协商类事件中更容易保留退路。', source: '来源：地球 Online · 风停之后' },
  ],
  artifact: [
    { mark: '宝', rarity: 'Artifact / From 林照夜', name: '裂纹命灯', desc: '濒临重大失败时，提供一次微弱预警。不可直接逆天改命。', source: '来源：修仙世界 · 外门残灯' },
    { mark: '宝', rarity: 'Artifact / From 赛博灵朝', name: '旧式香火芯片', desc: '可记录一次重要承诺，并在未来关系事件中触发回响。', source: '来源：赛博灵朝 · 神龛债务' },
  ],
  scroll: [
    { mark: '卷', rarity: 'Scroll / Incomplete', name: '《半页观心诀》', desc: '面对诱惑、恐惧、愤怒时，获得一次低强度自省判定。', source: '来源：修仙世界 · 旧藏残卷' },
    { mark: '卷', rarity: 'Scroll / Fragment', name: '方舟城配给手册', desc: '资源紧缺事件中，更容易找到替代方案或隐藏渠道。', source: '来源：末日方舟城 · 墙内档案' },
  ],
  mark: [
    { mark: '印', rarity: 'Mark / Special', name: '未寄出的信', desc: '新人生中更容易触发"迟来的消息""错过的人""旧日真相"。', source: '来源：地球 Online · 未来邮件' },
    { mark: '印', rarity: 'Mark / Special', name: '败者心痕', desc: '第一次重大失败不会只造成损失，也会开启隐藏成长线。', source: '来源：真武世界 · 断刀之日' },
  ],
};

export const PERSONALITIES = ['冷静克制', '野心强烈', '温柔敏感', '叛逆孤勇', '功利现实', '理想主义'];
export const DESIRES = ['改变命运', '守护家人', '获得力量', '追求真相', '积累财富', '摆脱控制'];
export const AGES = ['幼年', '少年', '成年'];
export const GENDERS = ['男', '女', '未知'];

export const ATTR_CONFIG = [
  { key: 'body', name: '体魄', en: 'BODY', base: 7 },
  { key: 'mind', name: '悟性', en: 'MIND', base: 9 },
  { key: 'charm', name: '魅力', en: 'CHARM', base: 6 },
  { key: 'fate', name: '气运', en: 'FATE', base: 8 },
];

export const ATTR_TAGS: Record<number, string> = {
  1: '极低', 2: '劣势', 3: '劣势', 4: '普通', 5: '普通',
  6: '普通', 7: '均衡', 8: '均衡', 9: '优势', 10: '卓越',
};

export const STEP_META = [
  { symbol: 'Ⅰ', label: '世界' },
  { symbol: 'Ⅱ', label: '身份' },
  { symbol: 'Ⅲ', label: '天赋' },
  { symbol: 'Ⅳ', label: '继承' },
  { symbol: 'Ⅴ', label: '确认' },
];

export interface CreationForm {
  world: string;
  worldConfig: string;
  name: string;
  gender: string;
  age: string;
  personality: string;
  desire: string;
  customNote: string;
  attributes: Record<string, number>;
  talents: Talent[];
  legacy: LegacyItem[];
}

export const DEFAULT_FORM: CreationForm = {
  world: 'earth',
  worldConfig: '现代',
  name: '',
  gender: '男',
  age: '少年',
  personality: '冷静克制',
  desire: '改变命运',
  customNote: '',
  attributes: { body: 7, mind: 9, charm: 6, fate: 8 },
  talents: [],
  legacy: [],
};
