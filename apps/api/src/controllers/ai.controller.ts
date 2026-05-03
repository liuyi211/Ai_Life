import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AIService, encryptApiKey, decryptApiKey, AIProvider } from '../services/ai.service';

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
      const talents = (character?.talents || []).join('、') || '无';
      const legacy = (character?.legacy || []).join('、') || '无';
      const gender = character?.gender || '未知';
      const customNote = character?.customNote || '';

      const systemPrompt = `你是一位人生编年史作者。为人生模拟器生成第一条人生节点。

【世界观设定】
当前世界：${worldName}
${worldDesc}

【绝对规则】
1. **你必须严格遵守上述世界观设定**。所有事件、身份、物品、能力都必须符合这个世界的规则。
2. **严禁跨世界观混搭**。如果世界是"地球 Online"，绝不能出现修仙、内力、灵根、宗门、妖兽等内容。
3. **输出格式**：必须返回纯 JSON，不要任何 markdown 代码块标记，不要任何解释文字。

4. **节点格式**：
{
  "yearsPassed": 0,
  "newAge": 0,
  "text": "0岁 — 你出生在...",
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

      const userPrompt = `角色：${character?.name || '无名者'}，性别：${gender}，世界：${worldName}
性格：${character?.personality || '普通'}，欲望：${character?.desire || '无'}
天赋：${talents}
继承：${legacy}
${customNote ? `自定义备注：${customNote}\n` : ''}属性：体魄${character?.attributes?.body || 5}/悟性${character?.attributes?.mind || 5}/羁绊${character?.attributes?.charm || 5}/气运${character?.attributes?.fate || 5}

请生成第一条人生节点（出生/初始状态）。这是整个人生故事的起点，必须根据character的基础信息生成角色的初始身份、地点、家庭关系等基础信息，这些信息将作为后续故事发展的依据。

**必须严格遵守"${worldName}"的世界观设定，所有内容都必须符合这个世界的规则。**

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

      // 构建历史上下文（最近5-8条）
      const historyList = history || [];
      const recentHistory = historyList.slice(-8);
      let historyContext = '';
      if (recentHistory.length > 0) {
        historyContext = '此前人生节点：\n' + recentHistory.map((h: any) => {
          const ageStr = h.year !== undefined ? `${h.year}岁` : '';
          const narrative = h.narrative || h.event || '';
          return `  ${ageStr} — ${narrative}${h.choice ? `（选择了：${h.choice}）` : ''}`;
        }).join('\n') + '\n\n';
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

      const systemPrompt = `你是一位人生编年史作者。为人生模拟器生成下一条人生节点。

【世界观设定】
当前世界：${worldName}
${worldDesc}

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

      const userPrompt = `${historyContext}${statusContext}角色：${character?.name || '无名者'}，性别：${gender}，${currentAge}岁，阶段：${currentStage}
世界：${worldName}
性格：${character?.personality || '普通'}，欲望：${character?.desire || '无'}
天赋：${talents}
继承：${legacy}
属性：体魄${character?.attributes?.body || 5}/悟性${character?.attributes?.mind || 5}/羁绊${character?.attributes?.charm || 5}/气运${character?.attributes?.fate || 5}

请基于此前人生节点和当前状态，生成下一条人生节点。这条节点必须是之前故事的合理延续，不能突兀跳转世界观或场景。

**必须严格遵守"${worldName}"的世界观设定，所有内容都必须符合这个世界的规则。**

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

      const systemPrompt = `你是一位命运编织者。根据当前人生节点和角色状态生成${count}个选择项。

规则：
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

属性映射：体魄->body, 悟性->mind, 羁绊->charm, 气运->fate

选择必须基于当前人生节点的情境，选择后的结果应该影响后续人生方向。`;

      const userPrompt = `当前人生节点：${node?.text || '命运的抉择'}
当前状态：
身份：${lifeStatus?.identity || '未知'}
地点：${lifeStatus?.location || '未知'}
能力：${lifeStatus?.ability || '未知'}
物品：${(lifeStatus?.items || []).join('、') || '无'}

角色属性：体魄${character?.attributes?.body || 5}/悟性${character?.attributes?.mind || 5}/羁绊${character?.attributes?.charm || 5}/气运${character?.attributes?.fate || 5}

请生成${count}个选择项。`;

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
};
