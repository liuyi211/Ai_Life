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

  // 生成人生总结
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

      // 构建历史摘要
      const historySummary = history
        ? history.slice(-10).map((h: any) => {
            const age = h.year !== undefined ? `${h.year}岁` : '';
            return `${age} ${h.event || h.narrative || ''}`;
          }).join('\n')
        : '';

      const systemPrompt = `你是一位人生传记作者。请为已逝的角色撰写一段简短的人生总结（讣告/传记），要求：
1. 100-200字
2. 回顾角色一生中的重要时刻
3. 评价角色的性格、成就和遗憾
4. 语言庄重但不失温度
5. 不要出现"命运"、"齿轮"、"星河"等词汇`;

      const userPrompt = `角色：${character?.name || '无名者'}
世界：${character?.world || '未知'}
享年：${character?.age || 0}岁
性格：${character?.personality || '普通'}
欲望：${character?.desire || '无'}
评分：${score || 0}
成就：${achievements?.join('、') || '无'}

人生重要时刻：
${historySummary}

请撰写人生总结。`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      res.json({
        success: true,
        summary: response.content,
      });
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
};
