import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AIService, decryptApiKey, AIProvider } from '../services/ai.service';

export const settlementController = {
  // 结算存档
  async settle(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const { score, achievements, generation } = req.body;

      const existing = await prisma.saveData.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: '存档不存在' });
      }

      // 更新存档为已结算状态
      const save = await prisma.saveData.update({
        where: { id },
        data: {
          syncStatus: 'settled',
          achievements: achievements || [],
          generation: generation || existing.generation,
        },
      });

      // 更新用户数据
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPlayTime: {
            increment: req.body.playTime || 0,
          },
          generationCount: {
            increment: 1,
          },
          fateFragments: {
            increment: Math.floor(score / 10) || 0,
          },
        },
      });

      res.json({
        success: true,
        message: '结算完成',
        save,
      });
    } catch (error) {
      console.error('Settlement error:', error);
      res.status(500).json({ success: false, message: '结算失败' });
    }
  },

  // 生成人生总结（非流式，含标题和评价）
  async generateSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, history, score, achievements } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
          aiBaseUrl: true,
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
        baseUrl: user.aiBaseUrl || undefined,
      });

      const historySummary = history
        ? history.slice(-15).map((h: any) => {
            const age = h.year !== undefined ? `${h.year}岁` : '';
            return `${age} ${h.event || h.narrative || ''}`;
          }).join('\n')
        : '';

      // 1. 生成总结
      const summarySystemPrompt = `你是一位人生传记作者。请为已逝的角色撰写一段人生总结，要求：
1. 100-250字，必须在此范围内
2. 以角色出生为起点，回顾一生中的重要转折、成就与遗憾
3. 语言凝练庄重，有文学美感
4. 提到最关键的2-3个人生节点，不要流水账
5. 结尾要有"回响"感——角色留下的痕迹或未竟的遗憾
6. 不要出现"命运"、"齿轮"、"星河"等词汇`;

      const summaryUserPrompt = `角色：${character?.name || '无名者'}
世界：${character?.world || '未知'}
享年：${character?.age || 0}岁
性格：${character?.personality || '普通'}
欲望：${character?.desire || '无'}
评分：${score || 0}

人生重要时刻：
${historySummary}

请撰写人生总结（100-250字），只输出正文，不要前缀后缀。`;

      const summaryResponse = await aiService.chat([
        { role: 'system', content: summarySystemPrompt },
        { role: 'user', content: summaryUserPrompt },
      ]);

      const summary = summaryResponse.content.trim();

      // 2. 生成标题和评价
      let title = '';
      let gradeDesc = '';
      try {
        const titleResponse = await aiService.chat([
          { role: 'system', content: '根据人生总结和评分，生成JSON：{"title":"10字以内标题","gradeDesc":"20字以内评价语"}。只输出JSON。' },
          { role: 'user', content: `总结：${summary}\n评分：${score}` },
        ]);
        const parsed = JSON.parse(titleResponse.content.trim().replace(/```json\s*/g, '').replace(/```\s*$/g, ''));
        title = parsed.title || '';
        gradeDesc = parsed.gradeDesc || '';
      } catch { /* ignore */ }

      res.json({ success: true, summary, title, gradeDesc });
    } catch (error: any) {
      console.error('Generate summary error:', error);
      res.status(500).json({
        success: false,
        message: '生成总结失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },

  // 导出存档
  async export(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const save = await prisma.saveData.findFirst({
        where: { id, userId },
      });

      if (!save) {
        return res.status(404).json({ success: false, message: '存档不存在' });
      }

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        character: save.character,
        history: save.history,
        achievements: save.achievements,
        playTime: save.playTime,
        generation: save.generation,
      };

      res.json({
        success: true,
        data: exportData,
        json: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      console.error('Export save error:', error);
      res.status(500).json({ success: false, message: '导出失败' });
    }
  },

  // 导入存档
  async import(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { data } = req.body;

      if (!data || !data.character) {
        return res.status(400).json({ success: false, message: '无效的存档数据' });
      }

      const save = await prisma.saveData.create({
        data: {
          userId,
          character: data.character,
          history: data.history || [],
          achievements: data.achievements || [],
          playTime: data.playTime || 0,
          generation: data.generation || 1,
          syncStatus: 'synced',
        },
      });

      res.status(201).json({
        success: true,
        message: '导入成功',
        save,
      });
    } catch (error) {
      console.error('Import save error:', error);
      res.status(500).json({ success: false, message: '导入失败' });
    }
  },

  // 流式生成人生总结（SSE）
  async generateSummaryStream(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const userId = (req as any).userId;
      const { character, history, score, achievements } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
          aiBaseUrl: true,
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
        baseUrl: user.aiBaseUrl || undefined,
      });

      const historySummary = history
        ? history.slice(-15).map((h: any) => {
            const age = h.year !== undefined ? `${h.year}岁` : '';
            const text = (h.narrative || h.event || '').replace(/^\d+岁\s*[—-]\s*/, '').trim();
            return `${age} ${text}`;
          }).join('\n')
        : '';

      const systemPrompt = `你是一位人生传记作者，擅长用凝练庄重的文字为人撰写墓志铭式的人生总结。

【写作要求】
1. 200-300字，必须在此范围内
2. 以角色出生为起点，回顾一生中的重要转折、成就与遗憾
3. 语言凝练庄重，有文学美感，但避免矫揉造作
4. 必须包含角色最突出的性格特征和核心追求
5. 提到最关键的2-3个人生节点，不要流水账
6. 结尾要有"回响"感——角色留下的痕迹或未竟的遗憾

【禁止词汇】命运、齿轮、星河、终焉、低语、裂缝、虚空、倒计时、时间尽头`;

      const userPrompt = `【角色信息】
姓名：${character?.name || '无名者'}
世界：${character?.world || '未知'}
享年：${character?.age || 0}岁
性格：${character?.personality || '普通'}
欲望：${character?.desire || '无'}
评分：${score || 0}
成就：${achievements?.join('、') || '无'}

【人生重要时刻】
${historySummary}

请按照要求撰写200-300字的人生总结。只输出总结正文，不要任何前缀后缀。`;

      sendEvent('start', { message: '开始生成总结' });

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

      // 生成标题和评价（快速同步调用）
      let title = '';
      let gradeDesc = '';
      try {
        const titlePrompt = `你是一位人生鉴定师。根据以下人生总结和评分，生成：
1. "title"：10字以内的人生标题（如"商海沉浮录"、"红尘剑客"、"求道者之殇"、"平凡的史诗"）
2. "gradeDesc"：20字以内的评价语（如"一生逐利，终得所愿"、"半生蹉跎，初心不改"、"凡人之躯，比肩神明"）

直接输出纯JSON：{"title":"...","gradeDesc":"..."}`;

        const titleResponse = await aiService.chat([
          { role: 'system', content: titlePrompt },
          { role: 'user', content: `人生总结：${fullContent.trim()}\n评分等级：${score || 0}分` },
        ]);
        const parsed = JSON.parse(titleResponse.content.trim().replace(/```json\s*/, '').replace(/```\s*$/, ''));
        title = parsed.title || '';
        gradeDesc = parsed.gradeDesc || '';
      } catch { /* 忽略 */ }

      sendEvent('complete', { success: true, summary: fullContent.trim(), title, gradeDesc });
      res.end();
    } catch (error: any) {
      console.error('Stream summary error:', error);
      sendEvent('error', {
        message: '生成总结失败: ' + (error.response?.data?.error?.message || error.message),
      });
      res.end();
    }
  },

  // AI 根据人生模拟生成遗产
  async generateLegacies(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, history } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiProvider: true,
          aiApiKeyEncrypted: true,
          aiModel: true,
          aiBaseUrl: true,
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
        baseUrl: user.aiBaseUrl || undefined,
      });

      // 提取关键节点作为上下文
      const keyEvents = (history || [])
        .slice(-20)
        .map((h: any) => {
          const age = h.year !== undefined ? `${h.year}岁` : '';
          const text = (h.narrative || h.event || '').replace(/^\d+岁\s*[—-]\s*/, '').trim();
          return `${age} ${text}`;
        })
        .join('\n');

      const world = character?.world || '地球 Online';

      const systemPrompt = `你是一位遗产鉴定师。根据角色的人生经历，提炼出3-5项可继承的"遗产"。

【什么是遗产】
遗产是角色人生中凝结的成果——可以是一项技能、一件物品、一段心法、一卷秘籍、一种体悟。它们将在下一世轮回中被继承。

【遗产类型参考（根据世界观调整）】
- 地球/现代：职业技能、专业知识、经商心得、人脉资源、研究成果、祖传物品
- 修仙/真武：功法、秘籍、丹方、法器、心得体悟、天赋异禀
- 赛博：义体组件、数据核心、黑客工具、企业权限、赛博格心得
- 末日：生存技能、避难所地图、武器改造、变异抗性、拾荒经验
- 神话：神裔血脉、秘仪知识、旧神印记、调查局权限、灵视能力

【输出格式】
必须返回纯 JSON 数组，不要任何 markdown 或解释文字：
[
  {
    "name": "遗产名称（2-8字）",
    "desc": "遗产描述（15-40字），说明这是什么、为什么珍贵",
    "rarity": "稀有度（common/uncommon/rare/epic）",
    "source": "来源标记（如：金丹大成/商界巨擘/末日后裔），10字以内"
  }
]

【要求】
1. 遗产必须紧密关联角色的人生经历，不是凭空捏造
2. 遗产类型必须符合"${world}"的世界观
3. name简洁有力，desc有画面感
4. rarity根据成就大小合理分配
5. source标记这项遗产从何而来`;

      const userPrompt = `【角色信息】
姓名：${character?.name || '无名者'}
世界：${world}
享年：${character?.age || 0}岁
性格：${character?.personality || '普通'}
欲望：${character?.desire || '无'}
天赋：${(character?.talents || []).map((t: any) => t.name || t).join('、')}

【人生经历关键节点】
${keyEvents}

请根据以上人生经历，生成3-5项可继承的遗产。直接输出JSON数组。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      let legacies: any[] = [];
      try {
        const content = response.content.trim();
        const jsonStr = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        legacies = JSON.parse(jsonStr);
        if (!Array.isArray(legacies)) legacies = [];
      } catch (e) {
        console.error('Parse legacies error:', e, 'Raw:', response.content);
        legacies = [];
      }

      res.json({
        success: true,
        legacies,
      });
    } catch (error: any) {
      console.error('Generate legacies error:', error);
      res.status(500).json({
        success: false,
        message: '生成遗产失败: ' + (error.response?.data?.error?.message || error.message),
      });
    }
  },
};
