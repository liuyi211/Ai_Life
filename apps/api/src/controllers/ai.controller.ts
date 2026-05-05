import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AIService, encryptApiKey, decryptApiKey, AIProvider } from '../services/ai.service';
import { aiResultCache, generateCacheKey } from '../services/cache.service';

// 世界观描述映射
const WORLD_DESCRIPTIONS: Record<string, string> = {
  '地球 Online': '现代地球社会。没有修仙、没有超能力。人生围绕家庭、学业、职业、经济、人际关系、健康、意外事件展开。科技水平与现实世界相同。',
  '修仙世界': '修真世界，有灵根、宗门、功法、秘境、妖兽、丹药、法器、境界划分（练气、筑基、金丹等）。凡人可以通过修炼获得超凡力量，追求长生。',
  '真武世界': '武侠世界，有内力、武学门派、江湖恩怨、武馆、镖局。以武为尊，拳脚掌指皆可成道，追求武道巅峰。',
  '赛博灵朝': '近未来赛博朋克与东方神秘主义融合的世界。义体改造、数字神龛、功德债务、虚拟香火、高科技与古老信仰并存。',
  '末日方舟城': '末日废土世界，资源枯竭，高墙城市，配给制，变异感染，拾荒求生。人类文明在崩溃边缘挣扎。',
  '神话复苏': '现代世界，但古老神话中的神祇、怪物、秘仪正在逐步苏醒。调查局、神裔血脉、旧神代理人、理智污染。',
};

function getWorldDescription(world: string): string {
  return WORLD_DESCRIPTIONS[world] || `以"${world}"为背景的世界。请根据这个世界观生成符合其设定的人生事件。`;
}

/** 根据属性值生成描述 */
function getAttributeDescription(body: number, mind: number, charm: number, fate: number): string {
  const descs: string[] = [];
  
  // 体魄
  if (body >= 9) descs.push(`体魄${body}（卓越）：身体极其强健，恢复力惊人，能承受常人无法承受的伤害或训练`);
  else if (body >= 7) descs.push(`体魄${body}（优势）：身体素质优秀，比同龄人更强壮、更有耐力`);
  else if (body >= 5) descs.push(`体魄${body}（均衡）：身体状态正常，没有特别突出也没有明显缺陷`);
  else if (body >= 3) descs.push(`体魄${body}（劣势）：身体较弱，容易疲劳或生病，需要更多照顾`);
  else descs.push(`体魄${body}（极低）：身体虚弱，可能天生体质差或有隐疾`);
  
  // 悟性
  if (mind >= 9) descs.push(`悟性${mind}（卓越）：极其聪慧，学习速度远超常人，能洞察他人看不到的规律和因果`);
  else if (mind >= 7) descs.push(`悟性${mind}（优势）：聪明机敏，学习能力强，善于分析和理解`);
  else if (mind >= 5) descs.push(`悟性${mind}（均衡）：智力正常，能正常学习和理解事物`);
  else if (mind >= 3) descs.push(`悟性${mind}（劣势）：理解力较差，学习速度慢，容易被欺骗或误导`);
  else descs.push(`悟性${mind}（极低）：天资愚钝，理解力极差，难以掌握复杂知识`);
  
  // 羁绊
  if (charm >= 9) descs.push(`羁绊${charm}（卓越）：极具亲和力，天生领袖气质，能轻易赢得他人信任和追随`);
  else if (charm >= 7) descs.push(`羁绊${charm}（优势）：人际关系良好，善于交际，容易获得贵人相助`);
  else if (charm >= 5) descs.push(`羁绊${charm}（均衡）：社交能力正常，有一般的朋友圈和关系网`);
  else if (charm >= 3) descs.push(`羁绊${charm}（劣势）：不善交际，容易得罪人或被孤立，贵人难遇`);
  else descs.push(`羁绊${charm}（极低）：性格孤僻或令人不适，难以建立正常人际关系`);
  
  // 气运
  if (fate >= 9) descs.push(`气运${fate}（卓越）：天命眷顾，逢凶化吉，总能在关键时刻遇到转机或奇遇`);
  else if (fate >= 7) descs.push(`气运${fate}（优势）：运气较好，生活中常有意外之喜，关键时刻往往能化险为夷`);
  else if (fate >= 5) descs.push(`气运${fate}（均衡）：运气平平，人生起伏正常，没有特别的幸运或不幸`);
  else if (fate >= 3) descs.push(`气运${fate}（劣势）：运气较差，容易遇到意外和挫折，好事多磨`);
  else descs.push(`气运${fate}（极低）：命途多舛，处处碰壁，容易遭遇不幸和灾祸`);
  
  return descs.join('；\n');
}

/** 性格描述 */
function getPersonalityDescription(personality: string): string {
  const map: Record<string, string> = {
    '冷静克制': '遇事冷静，不易冲动，善于理性分析，但可能显得冷漠或疏离',
    '野心强烈': '目标明确，不择手段，渴望权力和地位，愿意承担风险',
    '温柔敏感': '体贴入微，善解人意，但容易受伤，对批评和冲突敏感',
    '叛逆孤勇': '不服从权威，独来独往，有自己的原则，但容易与周围人产生矛盾',
    '功利现实': '注重实际利益，理性计算得失，不会被感情左右决策',
    '理想主义': '追求理想和正义，不愿妥协，即使付出巨大代价也要坚持信念',
  };
  return map[personality] || '性格普通，没有特别突出的特点';
}

/** 欲望描述 */
function getDesireDescription(desire: string): string {
  const map: Record<string, string> = {
    '改变命运': '不甘心现状，想要打破出身的限制，追求更高的社会地位或力量',
    '守护家人': '家人是最重要的，一切努力都是为了保护所爱之人，愿意为此牺牲自己',
    '获得力量': '渴望变强，无论是武力、智力还是权力，力量是安全感的来源',
    '追求真相': '对世界充满好奇，不满足于表面现象，想要挖掘隐藏的真相和秘密',
    '积累财富': '认为财富是自由和选择的基础，追求物质安全和财务自由',
    '摆脱控制': '厌恶被操控和约束，追求自由和独立，不愿受任何人摆布',
  };
  return map[desire] || '没有特别强烈的欲望，随波逐流';
}

/** 
 * 格式化历史段落为摘要文本
 * 将多个事件合并为一段连贯的摘要
 */
function formatHistorySegment(segment: { startAge: number; endAge: number; events: string[] }): string {
  const ageRange = segment.startAge === segment.endAge 
    ? `${segment.startAge}岁` 
    : `${segment.startAge}-${segment.endAge}岁`;
  
  // 最多保留3个关键事件，避免过长
  const keyEvents = segment.events.slice(0, 3);
  
  if (keyEvents.length === 1) {
    return `${ageRange}：${keyEvents[0]}`;
  }
  
  // 多个事件用顿号连接
  return `${ageRange}：${keyEvents.join('，')}`;
}

export const aiController = {
  // 获取用户 AI 配置
  async getConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      // 返回配置，但不返回完整的 API Key
      const config = {
        provider: user.aiProvider || 'deepseek',
        model: user.aiModel || '',
        hasApiKey: !!user.aiApiKeyEncrypted,
      };

      res.json({ success: true, config });
    } catch (error) {
      console.error('Get AI config error:', error);
      res.status(500).json({ success: false, message: '获取 AI 配置失败' });
    }
  },

  // 更新用户 AI 配置
  async updateConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { provider, apiKey, model } = req.body;

      if (!provider) {
        return res.status(400).json({ success: false, message: '请选择 AI 提供商' });
      }

      const updateData: any = {
        aiProvider: provider,
        aiModel: model || '',
      };

      // 如果提供了新的 API Key，则加密存储
      if (apiKey && apiKey.trim()) {
        updateData.aiApiKeyEncrypted = encryptApiKey(apiKey.trim());
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      res.json({ success: true, message: 'AI 配置已更新' });
    } catch (error) {
      console.error('Update AI config error:', error);
      res.status(500).json({ success: false, message: '更新 AI 配置失败' });
    }
  },

  // 清除 AI 配置（删除 API Key）
  async clearConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      await prisma.user.update({
        where: { id: userId },
        data: {
          aiApiKeyEncrypted: null,
          aiModel: '',
        },
      });

      res.json({ success: true, message: 'API Key 已清除' });
    } catch (error) {
      console.error('Clear AI config error:', error);
      res.status(500).json({ success: false, message: '清除配置失败' });
    }
  },

  // 测试 AI 连接
  async testConnection(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { provider, apiKey, model } = req.body;

      let testProvider: AIProvider;
      let testApiKey: string;
      let testModel: string | undefined;

      // 如果传入了参数，使用传入的参数测试
      if (provider && apiKey) {
        testProvider = provider as AIProvider;
        testApiKey = apiKey;
        testModel = model || undefined;
      } else {
        // 否则从数据库读取
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            aiProvider: true,
            aiApiKeyEncrypted: true,
            aiModel: true,
          },
        });

        if (!user || !user.aiApiKeyEncrypted) {
          return res.status(400).json({ success: false, message: '请先配置 API Key' });
        }

        testApiKey = decryptApiKey(user.aiApiKeyEncrypted);
        testProvider = (user.aiProvider || 'deepseek') as AIProvider;
        testModel = user.aiModel || undefined;
      }

      const aiService = new AIService({
        provider: testProvider,
        apiKey: testApiKey,
        model: testModel,
      });

      // 发送一个简单的测试消息
      const response = await aiService.chat([
        { role: 'user', content: '你好，请回复"连接成功"' },
      ]);

      res.json({
        success: true,
        message: '连接成功',
        response: response.content,
      });
    } catch (error: any) {
      console.error('Test AI connection error:', error);
      res.status(500).json({
        success: false,
        message: '连接失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 生成初始人生节点（出生/初始）
  async generateBackground(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      const worldDesc = getWorldDescription(character?.world || '地球 Online');
      const worldName = character?.world || '地球 Online';
      const worldConfig = character?.worldConfig || '';
      
      // 解析天赋完整信息
      const talentsList = (character?.talents || []);
      const talentsText = talentsList.length > 0 
        ? talentsList.map((t: any) => {
            const name = t.name || t;
            const desc = t.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      // 解析遗产完整信息
      const legacyList = (character?.legacy || []);
      const legacyText = legacyList.length > 0
        ? legacyList.map((l: any) => {
            const name = l.name || l;
            const desc = l.desc || '';
            const source = l.source || '';
            return desc ? `【${name}】${desc}${source ? `（${source}）` : ''}` : name;
          }).join('\n')
        : '无';
      
      const gender = character?.gender || '未知';
      const customNote = character?.customNote || '';
      
      // 解析属性含义
      const attrBody = character?.attributes?.body || 5;
      const attrMind = character?.attributes?.mind || 5;
      const attrCharm = character?.attributes?.charm || 5;
      const attrFate = character?.attributes?.fate || 5;
      const attrDesc = getAttributeDescription(attrBody, attrMind, attrCharm, attrFate);

      const systemPrompt = `你是一位人生编年史作者。为人生模拟器生成第一条人生节点（出生/初始状态）。

【世界观设定】
当前世界：${worldName}
${worldDesc}
${worldConfig ? `【世界配置】\n角色开局选择：${worldConfig}。这个设定决定了角色在这个世界中的初始立场、出身背景和社会位置。请在生成初始状态时充分体现这个配置的影响。` : ''}

【角色设定影响规则 — 必须严格遵守】
1. **天赋必须影响出生**：角色的天赋能力必须在出生/初始状态中体现。有天赋的角色出生时就应该与普通角色不同。
2. **遗产必须体现**：角色携带的遗产必须在初始状态中有所体现（家庭背景、初始物品、特殊关系等）。
3. **性格决定行为模式**：角色的性格决定了面对事件时的默认反应。例如"野心强烈"的人出生在贫困家庭会更早展现出改变命运的迹象；"温柔敏感"的人更容易获得他人的保护和关爱。
4. **欲望是驱动力**：角色的欲望决定了他们天生的追求方向。"守护家人"的人出生时家庭关系更紧密；"追求真相"的人从小就更敏感、更善于观察。
5. **属性值代表先天条件**：属性值不是抽象数字，而是角色在这个世界中的真实能力基础。

【属性值含义】
${attrDesc}

【绝对规则】
1. **你必须严格遵守上述世界观设定**。所有事件、身份、物品、能力都必须符合这个世界的规则。
2. **严禁跨世界观混搭**。如果世界是"地球 Online"，绝不能出现修仙、内力、灵根、宗门、妖兽等内容。
3. **输出格式**：必须返回纯 JSON，不要任何 markdown 代码块标记，不要任何解释文字。

4. **节点格式**：
{
  "yearsPassed": 0,
  "newAge": 0,
  "text": "0岁 — 具体事件描述",
  "eventType": "birth",
  "summary": "出生事件",
  "consequences": ["建立了初始家庭关系", "获得了初始身份"],
  "statusChanges": {
    "identity": "初始身份",
    "location": "出生地",
    "ability": "尚未成长",
    "items": [],
    "relationships": ["父亲：职业", "母亲：职业"],
    "injuries": [],
    "reputation": "默默无闻",
    "goals": [],
    "tags": ["出生地", "家庭背景"],
    "pending": []
  },
  "shouldTriggerChoice": false,
  "isDeath": false
}

5. **text 字段要求**：
   - 格式必须是："X岁 — 具体事件描述"
   - 必须包含具体事件（出生、家庭、名字由来等）
   - 40-90字，有信息密度
   - 使用第二人称"你"
   - 建立出生地、家庭、身份、名字由来等初始状态
   - **必须符合世界观设定**：地球 Online 写现代家庭/医院出生；修仙世界写凡人家庭/仙家血脉等

6. **statusChanges 要求**：
   - 设置角色的初始 identity、location、relationships、tags
   - 必须符合世界观（地球 Online 用现代身份，修仙世界用修真身份）

7. **避免词汇**：命运、齿轮、星河、终焉、低语、裂缝、虚空、倒计时、时间尽头（除非题材明确需要）`;

      const userPrompt = `【角色基础信息】
姓名：${character?.name || '无名者'}
性别：${gender}
世界：${worldName}
${worldConfig ? `开局配置：${worldConfig}` : ''}

【核心性格】
性格：${character?.personality || '普通'}
→ 这意味着角色面对事件时的默认行为倾向是：${getPersonalityDescription(character?.personality || '普通')}

欲望：${character?.desire || '无'}
→ 这决定了角色一生的核心驱动力：${getDesireDescription(character?.desire || '无')}

【天赋能力】
${talentsText}
→ 这些天赋必须在出生时就有所体现（特殊体质、天赋异禀、家族传承等）。

【遗产继承】
${legacyText}
→ 这些遗产必须在初始状态中有所体现（家族背景、初始物品、特殊关系等）。

【先天属性】
体魄${attrBody} / 悟性${attrMind} / 羁绊${attrCharm} / 气运${attrFate}
→ ${attrDesc}

${customNote ? `【自定义备注】\n${customNote}\n` : ''}

【任务】
请生成第一条人生节点（出生/初始状态）。这是整个人生故事的起点，必须严格根据上述角色设定生成：

1. **出生场景**必须与天赋能力相符。例如有"早慧之眼"的孩子，出生时应该有某种智力上的不同寻常；有"命硬如石"的人，出生时可能有某种劫后余生的经历。
2. **家庭背景**必须与遗产继承相关。例如有"竞赛直觉"遗产的人，家庭可能有学术/竞技传统；有"裂纹命灯"的人，出生时可能有某种命悬一线的经历。
3. **初始身份**必须符合开局配置。例如修仙世界选择"宗门"配置，应该是某宗门长老之子；选择"散修"配置，应该是普通凡人家庭。
4. **所有设定**必须符合"${worldName}"的世界观规则。

直接输出 JSON，不要任何其他内容。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // 解析JSON
      let node: any;
      try {
        const content = response.content.trim();
        // 去除可能的 markdown 代码块
        const jsonStr = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        node = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Parse initial node error:', e, 'Raw:', response.content);
        // 返回一个默认的初始节点
        node = {
          yearsPassed: 0,
          newAge: 0,
          text: `0岁 — 你出生在${character?.world || '这个世界'}，名为${character?.name || '无名者'}。`,
          eventType: 'birth',
          summary: '出生',
          consequences: [],
          statusChanges: {
            identity: '初生婴儿',
            location: character?.world || '未知之地',
            ability: '尚未成长',
            items: [],
            relationships: [],
            injuries: [],
            reputation: '默默无闻',
            goals: [],
            tags: [],
            pending: [],
          },
          shouldTriggerChoice: false,
          isDeath: false,
        };
      }

      res.json({
        success: true,
        node,
      });
    } catch (error: any) {
      console.error('Generate background error:', error);
      res.status(500).json({
        success: false,
        message: '生成初始节点失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 生成人生节点（核心方法）
  async generateNarrative(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, lifeStatus, history, stage } = req.body;

      // 1. 检查缓存
      const cacheKey = generateCacheKey({ userId, character, lifeStatus, history, stage });
      const cached = aiResultCache.get(cacheKey);
      if (cached) {
        console.log(`[Cache] 命中缓存: ${cacheKey}`);
        return res.json({
          success: true,
          node: cached,
          cached: true,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      // 构建历史上下文（压缩策略：摘要 + 最近2条详细记录）
      const historyList = history || [];
      let historyContext = '';
      
      if (historyList.length > 0) {
        // 压缩策略：
        // - 历史 > 3条：将较早的记录压缩为摘要，只保留最近2条详细记录
        // - 历史 <= 3条：全部保留详细记录
        if (historyList.length > 3) {
          // 较早的记录（除了最近2条）压缩为摘要
          const olderHistory = historyList.slice(0, -2);
          const recentHistory = historyList.slice(-2);
          
          // 生成摘要：按年龄段分组，每段保留关键事件
          const summaryParts: string[] = [];
          let currentSegment: { startAge: number; endAge: number; events: string[] } | null = null;
          
          for (const h of olderHistory) {
            const age = h.year || 0;
            const narrative = h.narrative || h.event || '';
            if (!narrative) continue;
            
            // 简化叙事：只保留核心事件描述（去除年龄前缀）
            const simpleNarrative = narrative.replace(/^\d+岁\s*[—-]\s*/, '').trim();
            
            if (!currentSegment || age - currentSegment.endAge > 10) {
              // 新段落（年龄跨度超过10年）
              if (currentSegment) {
                summaryParts.push(formatHistorySegment(currentSegment));
              }
              currentSegment = { startAge: age, endAge: age, events: [simpleNarrative] };
            } else {
              currentSegment.endAge = age;
              currentSegment.events.push(simpleNarrative);
            }
          }
          
          if (currentSegment) {
            summaryParts.push(formatHistorySegment(currentSegment));
          }
          
          historyContext = '【此前人生概要】\n' + summaryParts.join('\n') + '\n\n';
          
          // 最近2条详细记录
          historyContext += '【最近人生节点】\n' + recentHistory.map((h: any) => {
            const ageStr = h.year !== undefined ? `${h.year}岁` : '';
            const narrative = h.narrative || h.event || '';
            return `  ${ageStr} — ${narrative}${h.choice ? `（选择了：${h.choice}）` : ''}`;
          }).join('\n') + '\n\n';
        } else {
          // 历史较少，全部保留详细记录
          historyContext = '此前人生节点：\n' + historyList.map((h: any) => {
            const ageStr = h.year !== undefined ? `${h.year}岁` : '';
            const narrative = h.narrative || h.event || '';
            return `  ${ageStr} — ${narrative}${h.choice ? `（选择了：${h.choice}）` : ''}`;
          }).join('\n') + '\n\n';
        }
      }

      // 构建当前状态描述
      const statusContext = `当前人生状态：
身份：${lifeStatus?.identity || '未知'}
地点：${lifeStatus?.location || '未知'}
能力：${lifeStatus?.ability || '未知'}
物品：${(lifeStatus?.items || []).join('、') || '无'}
关系：${(lifeStatus?.relationships || []).join('、') || '无'}
伤病：${(lifeStatus?.injuries || []).join('、') || '无'}
名声：${lifeStatus?.reputation || '默默无闻'}
目标：${(lifeStatus?.goals || []).join('、') || '无'}
标签：${(lifeStatus?.tags || []).join('、') || '无'}
伏笔：${(lifeStatus?.pending || []).join('、') || '无'}

`;

      const currentAge = character?.age || 0;
      const currentStage = stage || 'adult';
      const worldName = character?.world || '地球 Online';
      const worldDesc = getWorldDescription(worldName);
      const talents = (character?.talents || []).join('、') || '无';
      const legacy = (character?.legacy || []).join('、') || '无';
      const gender = character?.gender || '未知';

      // 解析天赋完整信息
      const narrativeTalentsList = (character?.talents || []);
      const narrativeTalentsText = narrativeTalentsList.length > 0
        ? narrativeTalentsList.map((t: any) => {
            const name = t.name || t;
            const desc = t.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      // 解析遗产完整信息
      const narrativeLegacyList = (character?.legacy || []);
      const narrativeLegacyText = narrativeLegacyList.length > 0
        ? narrativeLegacyList.map((l: any) => {
            const name = l.name || l;
            const desc = l.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      const narrativeWorldConfig = character?.worldConfig || '';
      const narrativeAttrBody = character?.attributes?.body || 5;
      const narrativeAttrMind = character?.attributes?.mind || 5;
      const narrativeAttrCharm = character?.attributes?.charm || 5;
      const narrativeAttrFate = character?.attributes?.fate || 5;
      const narrativeAttrDesc = getAttributeDescription(narrativeAttrBody, narrativeAttrMind, narrativeAttrCharm, narrativeAttrFate);
      const narrativePersonality = character?.personality || '普通';
      const narrativeDesire = character?.desire || '无';

      const systemPrompt = `你是一位人生编年史作者。为人生模拟器生成下一条人生节点。

【世界观设定】
当前世界：${worldName}
${worldDesc}
${narrativeWorldConfig ? `【世界配置】\n角色开局选择：${narrativeWorldConfig}。这个设定决定了角色在这个世界中的初始立场、出身背景和社会位置。请在生成事件时始终考虑这个配置的影响。` : ''}

【角色设定影响规则 — 必须严格遵守】
1. **天赋必须持续影响**：角色的天赋能力必须持续影响人生事件的走向。有天赋的角色在关键时刻会展现出与众不同的能力。
2. **遗产必须持续体现**：角色携带的遗产必须持续体现在事件中（家族背景影响社交、初始物品在关键时刻发挥作用等）。
3. **性格决定行为模式**：角色的性格决定了面对事件时的默认反应和选择倾向。
4. **欲望是事件驱动力**：角色的欲望必须持续驱动事件发展方向。
5. **属性值影响事件结果**：属性值不是抽象数字，而是角色在这个世界中的真实能力基础，直接影响事件的成功与否。

【属性值含义】
${narrativeAttrDesc}

【绝对规则】
1. **你必须严格遵守上述世界观设定**。所有事件、身份、物品、能力、人际关系都必须符合这个世界的规则。
2. **严禁跨世界观混搭**。如果世界是"地球 Online"，绝不能出现修仙、内力、灵根、宗门、妖兽、筑基、金丹等内容。如果世界是"修仙世界"，不要出现现代公司、互联网、汽车、手机等现代元素。
3. **输出格式**：必须返回纯 JSON，不要任何 markdown 代码块标记，不要任何解释文字。

4. **节点 JSON 格式**：
{
  "yearsPassed": 5,
  "newAge": 28,
  "text": "28岁 — 具体事件描述，符合世界观",
  "eventType": "具体类型",
  "summary": "事件摘要",
  "consequences": ["后果1", "后果2"],
  "statusChanges": {
    "identity": "新身份",
    "location": "新地点",
    "ability": "新能力",
    "items": ["物品1"],
    "relationships": ["关系1"],
    "injuries": ["伤病1"],
    "reputation": "名声变化",
    "goals": ["新目标"],
    "tags": ["标签1"],
    "pending": ["伏笔1"]
  },
  "shouldTriggerChoice": false,
  "isDeath": false
}

5. **text 字段要求**：
   - 格式必须是："X岁 — 具体事件描述"
   - 必须包含一个具体事件（拜师、学艺、谋生、得到物品、失去亲人、受伤、背叛、突破、失败、迁徙、结识、离别、衰老、死亡等）
   - 10-60字，信息密度高
   - **必须承接"此前人生节点"的故事**，不能突兀跳转
   - 体现角色的身份、地点、能力、物品、关系等当前状态
   - **必须符合世界观设定**：地球 Online 写现代社会的学习、工作、家庭、经济、人际关系；修仙世界写修炼、宗门、秘境、丹药等

6. **yearsPassed 要求**：
   - 根据人生阶段决定时间跨度：
     - 幼年(infant)：3-7年
     - 少年(child)：3-6年
     - 青年(youth)：2-5年
     - 成年(adult)：4-10年
     - 终焉(elder)：5-12年
   - 如果当前有重大突破、危机、生死关头，可以缩短到1-3年
   - newAge = 当前年龄 + yearsPassed

7. **eventType 可选值**：birth, loss, training, breakthrough, failure, migration, meeting, betrayal, injury, gain, death, work, revenge, aging, family, other

8. **statusChanges 要求**：
   - 根据事件合理更新角色状态
   - identity：事件后的新身份（必须符合世界观）
   - location：事件后的新地点
   - ability：能力/境界/职业等级的变化
   - items：获得或失去的物品
   - relationships：建立或断裂的关系
   - injuries：新增的伤病
   - reputation：名声变化
   - goals：新的目标
   - tags：新的标签
   - pending：新的伏笔或待解决事项

9. **shouldTriggerChoice**：
   - 适合出现选择时设为 true（拜师、迁徙、遇到机缘、遭遇背叛、重大突破、生死危机、是否复仇、是否冒险等）
   - 日常事件设为 false
   - 不要过于频繁，大概每3-5条节点触发一次选择

10. **isDeath**：
    - 如果角色死亡设为 true
    - 死亡时必须提供 deathText 字段
    - deathText 要符合世界观（地球 Online 写现代葬礼/遗产，修仙世界写坐化/兵解等）

11. **避免词汇**：命运、齿轮、星河、终焉、低语、裂缝、规则、虚空、倒计时、时间尽头（除非题材明确需要）

12. **必须承接**：后续节点必须承接之前的 identity、location、ability、items、relationships、injuries、pending 等状态。`;

      const userPrompt = `${historyContext}${statusContext}【角色信息】
姓名：${character?.name || '无名者'}，性别：${gender}，${currentAge}岁，阶段：${currentStage}
世界：${worldName}
${narrativeWorldConfig ? `开局配置：${narrativeWorldConfig}` : ''}

【核心性格与驱动力】
性格：${narrativePersonality}
→ ${getPersonalityDescription(narrativePersonality)}

欲望：${narrativeDesire}
→ ${getDesireDescription(narrativeDesire)}

【天赋能力】
${narrativeTalentsText}
→ 这些天赋必须持续影响人生事件。例如"早慧之眼"的人更容易发现知识类机缘；"命硬如石"的人在危机中更容易获得转机。

【遗产继承】
${narrativeLegacyText}
→ 这些遗产必须持续体现在事件中。例如"竞赛直觉"的人在学习和工作中更容易获得优势；"裂纹命灯"的人在危机前会有微弱预警。

【先天属性】
体魄${narrativeAttrBody} / 悟性${narrativeAttrMind} / 羁绊${narrativeAttrCharm} / 气运${narrativeAttrFate}
→ ${narrativeAttrDesc}

【生成规则】
请基于此前人生节点和当前状态，生成下一条人生节点。

1. **必须承接之前的故事**，不能突兀跳转世界观或场景。
2. **必须体现天赋影响**：事件走向必须与角色的天赋能力相符。例如有"早慧之眼"的角色在求学/修炼时会比同龄人更快领悟。
3. **必须体现遗产影响**：事件必须与角色携带的遗产相关。例如有"旧式香火芯片"的角色在关键时刻会触发某种承诺的回响。
4. **必须符合性格倾向**：${narrativePersonality}的角色面对事件时会${getPersonalityDescription(narrativePersonality)}。
5. **必须符合欲望驱动**：角色的一切行为都应该围绕"${narrativeDesire}"这个核心欲望展开。
6. **必须符合属性值**：属性值高的领域角色应该表现得更优秀，属性值低的领域角色应该遇到困难或挫折。
7. **必须严格遵守"${worldName}"的世界观设定**。

直接输出 JSON，不要任何其他内容。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // 解析JSON
      let node: any;
      try {
        const content = response.content.trim();
        // 去除可能的 markdown 代码块
        const jsonStr = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        node = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Parse narrative node error:', e, 'Raw:', response.content);
        // 返回一个默认节点
        const { newAge, yearsAdvanced } = this.calculateAdvanceYears(currentAge, currentStage);
        node = {
          yearsPassed: yearsAdvanced,
          newAge,
          text: `${newAge}岁 — 你继续生活，平淡无奇地度过了一段时光。`,
          eventType: 'other',
          summary: '平淡度日',
          consequences: [],
          statusChanges: {},
          shouldTriggerChoice: false,
          isDeath: false,
        };
      }

      // 写入缓存
      aiResultCache.set(cacheKey, node);
      console.log(`[Cache] 写入缓存: ${cacheKey}`);

      res.json({
        success: true,
        node,
      });
    } catch (error: any) {
      console.error('Generate narrative error:', error);
      res.status(500).json({
        success: false,
        message: '生成人生节点失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 流式生成人生节点（SSE）
  async generateNarrativeStream(req: Request, res: Response) {
    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // 强制刷新缓冲区
      if ('flush' in res) {
        (res as any).flush();
      }
    };

    try {
      const userId = (req as any).userId;
      const { character, lifeStatus, history, stage } = req.body;

      // 1. 检查缓存
      const cacheKey = generateCacheKey({ userId, character, lifeStatus, history, stage });
      const cached = aiResultCache.get(cacheKey);
      if (cached) {
        console.log(`[Cache] 流式命中缓存: ${cacheKey}`);
        sendEvent('start', { message: 'AI开始生成' });
        // 模拟流式输出缓存内容
        const text = cached.text || '';
        const chunkSize = 10;
        for (let i = 0; i < text.length; i += chunkSize) {
          sendEvent('chunk', { text: text.slice(i, i + chunkSize) });
        }
        sendEvent('complete', { success: true, node: cached, cached: true });
        res.end();
        return;
      }

      // 获取用户AI配置
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        sendEvent('error', { message: '请先配置 API Key' });
        res.end();
        return;
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      // 构建prompt（与generateNarrative相同，使用压缩历史）
      const historyList = history || [];
      let historyContext = '';
      
      if (historyList.length > 0) {
        if (historyList.length > 3) {
          const olderHistory = historyList.slice(0, -2);
          const recentHistory = historyList.slice(-2);
          
          const summaryParts: string[] = [];
          let currentSegment: { startAge: number; endAge: number; events: string[] } | null = null;
          
          for (const h of olderHistory) {
            const age = h.year || 0;
            const narrative = h.narrative || h.event || '';
            if (!narrative) continue;
            
            const simpleNarrative = narrative.replace(/^\d+岁\s*[—-]\s*/, '').trim();
            
            if (!currentSegment || age - currentSegment.endAge > 10) {
              if (currentSegment) {
                summaryParts.push(formatHistorySegment(currentSegment));
              }
              currentSegment = { startAge: age, endAge: age, events: [simpleNarrative] };
            } else {
              currentSegment.endAge = age;
              currentSegment.events.push(simpleNarrative);
            }
          }
          
          if (currentSegment) {
            summaryParts.push(formatHistorySegment(currentSegment));
          }
          
          historyContext = '【此前人生概要】\n' + summaryParts.join('\n') + '\n\n';
          historyContext += '【最近人生节点】\n' + recentHistory.map((h: any) => {
            const ageStr = h.year !== undefined ? `${h.year}岁` : '';
            const narrative = h.narrative || h.event || '';
            return `  ${ageStr} — ${narrative}${h.choice ? `（选择了：${h.choice}）` : ''}`;
          }).join('\n') + '\n\n';
        } else {
          historyContext = '此前人生节点：\n' + historyList.map((h: any) => {
            const ageStr = h.year !== undefined ? `${h.year}岁` : '';
            const narrative = h.narrative || h.event || '';
            return `  ${ageStr} — ${narrative}${h.choice ? `（选择了：${h.choice}）` : ''}`;
          }).join('\n') + '\n\n';
        }
      }

      const statusContext = `当前人生状态：\n身份：${lifeStatus?.identity || '未知'}\n地点：${lifeStatus?.location || '未知'}\n能力：${lifeStatus?.ability || '未知'}\n物品：${(lifeStatus?.items || []).join('、') || '无'}\n关系：${(lifeStatus?.relationships || []).join('、') || '无'}\n伤病：${(lifeStatus?.injuries || []).join('、') || '无'}\n名声：${lifeStatus?.reputation || '默默无闻'}\n目标：${(lifeStatus?.goals || []).join('、') || '无'}\n标签：${(lifeStatus?.tags || []).join('、') || '无'}\n伏笔：${(lifeStatus?.pending || []).join('、') || '无'}\n\n`;

      const currentAge = character?.age || 0;
      const currentStage = stage || 'adult';
      const worldName = character?.world || '地球 Online';
      const worldDesc = getWorldDescription(worldName);
      const gender = character?.gender || '未知';

      const narrativeTalentsList = (character?.talents || []);
      const narrativeTalentsText = narrativeTalentsList.length > 0
        ? narrativeTalentsList.map((t: any) => {
            const name = t.name || t;
            const desc = t.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      const narrativeLegacyList = (character?.legacy || []);
      const narrativeLegacyText = narrativeLegacyList.length > 0
        ? narrativeLegacyList.map((l: any) => {
            const name = l.name || l;
            const desc = l.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      const narrativeWorldConfig = character?.worldConfig || '';
      const narrativeAttrBody = character?.attributes?.body || 5;
      const narrativeAttrMind = character?.attributes?.mind || 5;
      const narrativeAttrCharm = character?.attributes?.charm || 5;
      const narrativeAttrFate = character?.attributes?.fate || 5;
      const narrativeAttrDesc = getAttributeDescription(narrativeAttrBody, narrativeAttrMind, narrativeAttrCharm, narrativeAttrFate);
      const narrativePersonality = character?.personality || '普通';
      const narrativeDesire = character?.desire || '无';

      const systemPrompt = `你是一位人生编年史作者。为人生模拟器生成下一条人生节点。

【世界观设定】
当前世界：${worldName}
${worldDesc}
${narrativeWorldConfig ? `【世界配置】\n角色开局选择：${narrativeWorldConfig}。这个设定决定了角色在这个世界中的初始立场、出身背景和社会位置。请在生成事件时始终考虑这个配置的影响。` : ''}

【角色设定影响规则 — 必须严格遵守】
1. **天赋必须持续影响**：角色的天赋能力必须持续影响人生事件的走向。有天赋的角色在关键时刻会展现出与众不同的能力。
2. **遗产必须持续体现**：角色携带的遗产必须持续体现在事件中（家族背景影响社交、初始物品在关键时刻发挥作用等）。
3. **性格决定行为模式**：角色的性格决定了面对事件时的默认反应和选择倾向。
4. **欲望是事件驱动力**：角色的欲望必须持续驱动事件发展方向。
5. **属性值影响事件结果**：属性值不是抽象数字，而是角色在这个世界中的真实能力基础，直接影响事件的成功与否。

【属性值含义】
${narrativeAttrDesc}

【绝对规则】
1. **你必须严格遵守上述世界观设定**。所有事件、身份、物品、能力、人际关系都必须符合这个世界的规则。
2. **严禁跨世界观混搭**。如果世界是"地球 Online"，绝不能出现修仙、内力、灵根、宗门、妖兽、筑基、金丹等内容。如果世界是"修仙世界"，不要出现现代公司、互联网、汽车、手机等现代元素。
3. **输出格式**：必须返回纯 JSON，不要任何 markdown 代码块标记，不要任何解释文字。

4. **节点 JSON 格式**：
{
  "yearsPassed": 5,
  "newAge": 28,
  "text": "28岁 — 具体事件描述，符合世界观",
  "eventType": "具体类型",
  "summary": "事件摘要",
  "consequences": ["后果1", "后果2"],
  "statusChanges": {
    "identity": "新身份",
    "location": "新地点",
    "ability": "新能力",
    "items": ["物品1"],
    "relationships": ["关系1"],
    "injuries": ["伤病1"],
    "reputation": "名声变化",
    "goals": ["新目标"],
    "tags": ["标签1"],
    "pending": ["伏笔1"]
  },
  "shouldTriggerChoice": false,
  "isDeath": false
}

5. **text 字段要求**：
   - 格式必须是："X岁 — 具体事件描述"
   - 必须包含一个具体事件（拜师、学艺、谋生、得到物品、失去亲人、受伤、背叛、突破、失败、迁徙、结识、离别、衰老、死亡等）
   - 10-60字，信息密度高
   - **必须承接"此前人生节点"的故事**，不能突兀跳转
   - 体现角色的身份、地点、能力、物品、关系等当前状态
   - **必须符合世界观设定**：地球 Online 写现代社会的学习、工作、家庭、经济、人际关系；修仙世界写修炼、宗门、秘境、丹药等

6. **yearsPassed 要求**：
   - 根据人生阶段决定时间跨度：
     - 幼年(infant)：3-7年
     - 少年(child)：3-6年
     - 青年(youth)：2-5年
     - 成年(adult)：4-10年
     - 终焉(elder)：5-12年
   - 如果当前有重大突破、危机、生死关头，可以缩短到1-3年
   - newAge = 当前年龄 + yearsPassed

7. **eventType 可选值**：birth, loss, training, breakthrough, failure, migration, meeting, betrayal, injury, gain, death, work, revenge, aging, family, other

8. **statusChanges 要求**：
   - 根据事件合理更新角色状态
   - identity：事件后的新身份（必须符合世界观）
   - location：事件后的新地点
   - ability：能力/境界/职业等级的变化
   - items：获得或失去的物品
   - relationships：建立或断裂的关系
   - injuries：新增的伤病
   - reputation：名声变化
   - goals：新的目标
   - tags：新的标签
   - pending：新的伏笔或待解决事项

9. **shouldTriggerChoice**：
   - 适合出现选择时设为 true（拜师、迁徙、遇到机缘、遭遇背叛、重大突破、生死危机、是否复仇、是否冒险等）
   - 日常事件设为 false
   - 不要过于频繁，大概每3-5条节点触发一次选择

10. **isDeath**：
    - 如果角色死亡设为 true
    - 死亡时必须提供 deathText 字段
    - deathText 要符合世界观（地球 Online 写现代葬礼/遗产，修仙世界写坐化/兵解等）

11. **避免词汇**：命运、齿轮、星河、终焉、低语、裂缝、规则、虚空、倒计时、时间尽头（除非题材明确需要）

12. **必须承接**：后续节点必须承接之前的 identity、location、ability、items、relationships、injuries、pending 等状态。`;

      const userPrompt = `${historyContext}${statusContext}【角色信息】
姓名：${character?.name || '无名者'}，性别：${gender}，${currentAge}岁，阶段：${currentStage}
世界：${worldName}
${narrativeWorldConfig ? `开局配置：${narrativeWorldConfig}` : ''}

【核心性格与驱动力】
性格：${narrativePersonality}
→ ${getPersonalityDescription(narrativePersonality)}

欲望：${narrativeDesire}
→ ${getDesireDescription(narrativeDesire)}

【天赋能力】
${narrativeTalentsText}
→ 这些天赋必须持续影响人生事件。例如"早慧之眼"的人更容易发现知识类机缘；"命硬如石"的人在危机中更容易获得转机。

【遗产继承】
${narrativeLegacyText}
→ 这些遗产必须持续体现在事件中。例如"竞赛直觉"的人在学习和工作中更容易获得优势；"裂纹命灯"的人在危机前会有微弱预警。

【先天属性】
体魄${narrativeAttrBody} / 悟性${narrativeAttrMind} / 羁绊${narrativeAttrCharm} / 气运${narrativeAttrFate}
→ ${narrativeAttrDesc}

【生成规则】
请基于此前人生节点和当前状态，生成下一条人生节点。

1. **必须承接之前的故事**，不能突兀跳转世界观或场景。
2. **必须体现天赋影响**：事件走向必须与角色的天赋能力相符。例如有"早慧之眼"的角色在求学/修炼时会比同龄人更快领悟。
3. **必须体现遗产影响**：事件必须与角色携带的遗产相关。例如有"旧式香火芯片"的角色在关键时刻会触发某种承诺的回响。
4. **必须符合性格倾向**：${narrativePersonality}的角色面对事件时会${getPersonalityDescription(narrativePersonality)}。
5. **必须符合欲望驱动**：角色的一切行为都应该围绕"${narrativeDesire}"这个核心欲望展开。
6. **必须符合属性值**：属性值高的领域角色应该表现得更优秀，属性值低的领域角色应该遇到困难或挫折。
7. **必须严格遵守"${worldName}"的世界观设定**。

直接输出 JSON，不要任何其他内容。`;

      // 发送开始事件
      sendEvent('start', { message: 'AI开始生成' });

      // 流式调用
      const generator = aiService.streamChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      let fullContent = '';
      for await (const chunk of generator) {
        fullContent += chunk.text;
        if (chunk.text) {
          sendEvent('chunk', { text: chunk.text });
        }
      }

      // 解析JSON
      let node: any;
      try {
        const content = fullContent.trim();
        const jsonStr = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        node = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Parse narrative node error:', e, 'Raw:', fullContent);
        // fallback
        const { newAge, yearsAdvanced } = this.calculateAdvanceYears(currentAge, currentStage);
        node = {
          yearsPassed: yearsAdvanced,
          newAge,
          text: `${newAge}岁 — 你继续生活，平淡无奇地度过了一段时光。`,
          eventType: 'other',
          summary: '平淡度日',
          consequences: [],
          statusChanges: {},
          shouldTriggerChoice: false,
          isDeath: false,
        };
      }

      // 写入缓存
      aiResultCache.set(cacheKey, node);
      console.log(`[Cache] 流式写入缓存: ${cacheKey}`);

      // 发送完成事件
      sendEvent('complete', { success: true, node });
      res.end();
    } catch (error: any) {
      console.error('Generate narrative stream error:', error);
      sendEvent('error', {
        message: '生成人生节点失败: ' + (error.response?.data?.error?.message || error.message),
      });
      res.end();
    }
  },

  // 辅助方法：计算年龄推进
  calculateAdvanceYears(currentAge: number, stage: string): { newAge: number; yearsAdvanced: number } {
    let yearsToAdvance: number;
    switch (stage) {
      case 'infant': yearsToAdvance = Math.floor(Math.random() * 5) + 3; break;
      case 'child': yearsToAdvance = Math.floor(Math.random() * 4) + 3; break;
      case 'youth': yearsToAdvance = Math.floor(Math.random() * 4) + 2; break;
      case 'adult': yearsToAdvance = Math.floor(Math.random() * 7) + 4; break;
      case 'elder': yearsToAdvance = Math.floor(Math.random() * 8) + 5; break;
      default: yearsToAdvance = Math.floor(Math.random() * 5) + 2;
    }
    return { newAge: currentAge + yearsToAdvance, yearsAdvanced: yearsToAdvance };
  },

  // 生成选择项（适配新结构）
  async generateChoices(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, lifeStatus, node, count = 3 } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      // 解析选择时的角色信息
      const choiceTalentsList = (character?.talents || []);
      const choiceTalentsText = choiceTalentsList.length > 0
        ? choiceTalentsList.map((t: any) => {
            const name = t.name || t;
            const desc = t.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      const choiceLegacyList = (character?.legacy || []);
      const choiceLegacyText = choiceLegacyList.length > 0
        ? choiceLegacyList.map((l: any) => {
            const name = l.name || l;
            const desc = l.desc || '';
            return desc ? `【${name}】${desc}` : name;
          }).join('\n')
        : '无';
      
      const choicePersonality = character?.personality || '普通';
      const choiceDesire = character?.desire || '无';

      const systemPrompt = `你是一位命运编织者。根据当前人生节点和角色状态生成${count}个选择项。

【角色设定影响规则 — 必须严格遵守】
1. **选择必须符合角色性格**：${choicePersonality}的角色面对抉择时会${getPersonalityDescription(choicePersonality)}。
2. **选择必须体现欲望驱动**：角色的核心欲望是"${choiceDesire}"，选择应该围绕这个欲望展开。
3. **天赋影响选择倾向**：有天赋的角色在相关领域会有更独特的选择。
4. **遗产影响选择后果**：选择后的结果应该与角色携带的遗产相关。

【选择规则】
1. 每个选择项10-20字，简洁有力
2. 每个选择对应一个属性：体魄/悟性/羁绊/气运
3. 属性变化+1或+2（可正可负）
4. 使用JSON格式输出
5. 只输出JSON，不要其他内容

输出格式：
[
  {"text": "选择描述", "effect": "属性名", "value": 1},
  ...
]

属性映射：体魄->body, 悟性->mind, 羁绊->charm, 气运->fate`;

      const userPrompt = `【当前人生节点】
${node?.text || '命运的抉择'}

【当前状态】
身份：${lifeStatus?.identity || '未知'}
地点：${lifeStatus?.location || '未知'}
能力：${lifeStatus?.ability || '未知'}
物品：${(lifeStatus?.items || []).join('、') || '无'}

【角色信息】
性格：${choicePersonality} → ${getPersonalityDescription(choicePersonality)}
欲望：${choiceDesire} → ${getDesireDescription(choiceDesire)}

【天赋能力】
${choiceTalentsText}

【遗产继承】
${choiceLegacyText}

【角色属性】
体魄${character?.attributes?.body || 5}/悟性${character?.attributes?.mind || 5}/羁绊${character?.attributes?.charm || 5}/气运${character?.attributes?.fate || 5}

【生成要求】
请生成${count}个选择项。每个选择项必须：
1. 符合"${choicePersonality}"的性格倾向
2. 围绕"${choiceDesire}"这个核心欲望
3. 体现天赋能力的影响（如果有）
4. 体现遗产继承的影响（如果有）
5. 与当前人生节点的情境紧密相关`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // 解析JSON
      let choices: Array<{ text: string; effect: string; value: number }> = [];
      try {
        const content = response.content.trim();
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          choices = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Parse choices error:', e);
      }

      res.json({
        success: true,
        choices,
      });
    } catch (error: any) {
      console.error('Generate choices error:', error);
      res.status(500).json({
        success: false,
        message: '生成选择失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 生成世界设定
  async generateWorld(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name, type, races, era, conflict, powerSystem, factions } = req.body;

      if (!name || !type) {
        return res.status(400).json({ success: false, message: '世界名称和类型不能为空' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      const systemPrompt = `你是一位世界构建大师。请根据用户提供的世界设定，生成一段详细的世界介绍和专属天赋池。

要求：
1. 世界介绍 120-200 字，有画面感和叙事性
2. 生成 4-6 个标签
3. 生成 5 个核心关键词（chips）
4. 生成 3 个世界配置选项（角色开局可选的出身/立场）
5. 生成 6 个专属天赋，每个天赋包含：
   - rarity: 稀有度，可选 "Rare / 稀有"、"Epic / 史诗"、"Legend / 传说"
   - name: 天赋名称（2-6 字）
   - desc: 天赋描述（30-80 字），说明效果与代价，必须贴合世界观
6. 必须返回纯 JSON，不要任何 markdown 代码块标记

输出格式：
{
  "description": "世界详细介绍...",
  "tags": ["标签1", "标签2", "标签3", "标签4"],
  "chips": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "configOptions": ["选项1", "选项2", "选项3"],
  "talents": [
    {"rarity": "Rare / 稀有", "name": "天赋名", "desc": "效果描述..."},
    ...
  ]
}`;

      const userPrompt = `【世界设定】
世界名称：${name}
世界类型：${type}
主要种族：${races || '未知'}
时代背景：${era || '未知'}
核心冲突：${conflict || '未知'}
力量体系：${powerSystem || '未知'}
主要阵营：${factions || '未知'}

请根据以上设定生成世界介绍、标签、关键词和配置选项。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      let result: any;
      try {
        const content = response.content.trim();
        const jsonStr = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        result = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Parse world generation error:', e, 'Raw:', response.content);
        // 返回默认结果
        result = {
          description: `${name}是一个${type}风格的世界。${era || ''}时期，${races || '各族'}在这片土地上争夺生存空间。${conflict || '冲突与纷争'}构成了这个世界的核心主题。力量体系基于${powerSystem || '未知力量'}，而${factions || '各方势力'}则代表着这个世界的主要势力格局。`,
          tags: [type, ...(races ? races.split(/[,\/、]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 1) : []), era ? era.split(/[,\/、]/)[0]?.trim() : '', '自定义'].filter(Boolean).slice(0, 5),
          chips: ['自定义', type, ...(races ? races.split(/[,\/、]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 2) : []), powerSystem || '未知力量'].filter(Boolean).slice(0, 5),
          configOptions: ['平民出身', '贵族血脉', '流浪者'],
          talents: [],
        };
      }

      // 确保天赋格式正确
      const talents = (result.talents || []).map((t: any) => ({
        rarity: t.rarity || 'Rare / 稀有',
        name: t.name || '未知天赋',
        desc: t.desc || '效果未知',
      }));

      res.json({
        success: true,
        description: result.description,
        tags: result.tags || [],
        chips: result.chips || [],
        configOptions: result.configOptions || ['平民出身', '贵族血脉', '流浪者'],
        talents: talents.length > 0 ? talents : [],
      });
    } catch (error: any) {
      console.error('Generate world error:', error);
      res.status(500).json({
        success: false,
        message: '生成世界设定失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // NPC 对话
  async chatWithNPC(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, npc, message, history } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      const systemPrompt = `你是一位 NPC 角色扮演 AI。你正在扮演以下角色：
角色名：${npc?.name || '神秘人物'}
性格：${npc?.personality || '神秘'}
背景：${npc?.background || '未知'}

规则：
1. 保持角色性格和背景设定的一致性
2. 使用中文回答
3. 回答要符合角色身份和情境
4. 回答长度控制在 100-300 字`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(history || []).map((h: any) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const response = await aiService.chat(messages);

      res.json({
        success: true,
        reply: response.content,
      });
    } catch (error: any) {
      console.error('NPC chat error:', error);
      res.status(500).json({
        success: false,
        message: '对话失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 生成每日谶语
  async generateProphecy(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
        },
      });

      if (!user || !user.aiApiKeyEncrypted) {
        return res.status(400).json({ success: false, message: '请先配置 API Key' });
      }

      const apiKey = decryptApiKey(user.aiApiKeyEncrypted);
      const provider = (user.aiProvider || 'deepseek') as AIProvider;

      const aiService = new AIService({
        provider,
        apiKey,
        model: user.aiModel || undefined,
      });

      const systemPrompt = `你是一位命运先知。请生成一条今日谶语。

要求：
1. 30-60 字，富有哲理和画面感
2. 风格：东方神秘主义 + 现代文学感，略带宿命感但不消极
3. 主题可涉及：命运、选择、时间、因果、轮回、机缘等
4. 不要直白说教，用意象和隐喻表达
5. 直接输出谶语文本，不要任何解释、标题或 markdown`;

      const userPrompt = `请生成一条今日谶语。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const prophecy = response.content.trim();

      res.json({
        success: true,
        prophecy,
      });
    } catch (error: any) {
      console.error('Generate prophecy error:', error);
      res.status(500).json({
        success: false,
        message: '生成谶语失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },
};
