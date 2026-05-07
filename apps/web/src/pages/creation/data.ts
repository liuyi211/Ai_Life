export interface Talent {
  rarity: string;
  name: string;
  desc: string;
}

export interface LegacyItem {
  mark: string;
  rarity: string;
  name: string;
  desc: string;
  source: string;
}

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
  name: '王平',
  gender: '男',
  personality: '冷静克制',
  desire: '改变命运',
  customNote: '',
  attributes: { body: 7, mind: 9, charm: 6, fate: 8 },
  talents: [],
  legacy: [],
};
