import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const savesController = {
  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const saves = await prisma.saveData.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ success: true, saves });
    } catch (error) {
      console.error('List saves error:', error);
      res.status(500).json({ success: false, message: '获取存档列表失败' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { character, history, achievements, playTime, generation } = req.body;

      // 验证必要字段
      if (!character || !character.name) {
        return res.status(400).json({ success: false, message: '角色信息不完整' });
      }

      const save = await prisma.saveData.create({
        data: {
          userId,
          character: character || {},
          history: history || [],
          achievements: achievements || [],
          playTime: playTime || 0,
          generation: generation || 1,
          syncStatus: 'synced',
        },
      });

      res.status(201).json({ success: true, save });
    } catch (error) {
      console.error('Create save error:', error);
      res.status(500).json({ success: false, message: '创建存档失败' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const save = await prisma.saveData.findFirst({
        where: { id, userId },
      });

      if (!save) {
        return res.status(404).json({ success: false, message: '存档不存在' });
      }

      res.json({ success: true, save });
    } catch (error) {
      console.error('Get save by id error:', error);
      res.status(500).json({ success: false, message: '获取存档失败' });
    }
  },

  async getActive(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const save = await prisma.saveData.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!save) {
        return res.status(404).json({ success: false, message: '无存档' });
      }

      res.json({ success: true, save });
    } catch (error) {
      console.error('Get active save error:', error);
      res.status(500).json({ success: false, message: '获取存档失败' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const { character, history, achievements, playTime, generation, syncStatus } = req.body;

      const existing = await prisma.saveData.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: '存档不存在' });
      }

      const save = await prisma.saveData.update({
        where: { id },
        data: {
          character: character || existing.character,
          history: history || existing.history,
          achievements: achievements || existing.achievements,
          playTime: playTime !== undefined ? playTime : existing.playTime,
          generation: generation !== undefined ? generation : existing.generation,
          syncStatus: syncStatus || existing.syncStatus,
        },
      });

      res.json({ success: true, save });
    } catch (error) {
      console.error('Update save error:', error);
      res.status(500).json({ success: false, message: '更新存档失败' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const existing = await prisma.saveData.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: '存档不存在' });
      }

      await prisma.saveData.delete({ where: { id } });

      res.json({ success: true, message: '存档已删除' });
    } catch (error) {
      console.error('Delete save error:', error);
      res.status(500).json({ success: false, message: '删除存档失败' });
    }
  },
};
