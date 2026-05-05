import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 遗产上限
const MAX_LEGACY = 10;

export const legacyController = {
  // 获取用户遗产池
  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { legacy: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({
        success: true,
        legacy: user.legacy || [],
        max: MAX_LEGACY,
        count: (user.legacy || []).length,
      });
    } catch (error) {
      console.error('List legacy error:', error);
      res.status(500).json({ success: false, message: '获取遗产失败' });
    }
  },

  // 添加遗产（结算时调用）
  async add(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: '遗产数据不能为空' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { legacy: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const currentLegacy = (user.legacy || []) as any[];
      
      // 过滤出未重复的遗产（按name去重）
      const existingNames = new Set(currentLegacy.map((l: any) => l.name));
      const newItems = items.filter((item: any) => item.name && !existingNames.has(item.name));
      
      // 检查上限
      if (currentLegacy.length + newItems.length > MAX_LEGACY) {
        const allowedCount = MAX_LEGACY - currentLegacy.length;
        const trimmedItems = newItems.slice(0, allowedCount);
        const finalLegacy = [...currentLegacy, ...trimmedItems];
        
        await prisma.user.update({
          where: { id: userId },
          data: { legacy: finalLegacy },
        });

        return res.json({
          success: true,
          message: `已保存 ${trimmedItems.length} 项遗产（达到上限 ${MAX_LEGACY}）`,
          added: trimmedItems.length,
          skipped: newItems.length - trimmedItems.length,
          legacy: finalLegacy,
        });
      }

      const finalLegacy = [...currentLegacy, ...newItems];
      
      await prisma.user.update({
        where: { id: userId },
        data: { legacy: finalLegacy },
      });

      res.json({
        success: true,
        message: `已保存 ${newItems.length} 项遗产`,
        added: newItems.length,
        legacy: finalLegacy,
      });
    } catch (error) {
      console.error('Add legacy error:', error);
      res.status(500).json({ success: false, message: '保存遗产失败' });
    }
  },

  // 删除遗产
  async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: '遗产名称不能为空' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { legacy: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const currentLegacy = (user.legacy || []) as any[];
      const filteredLegacy = currentLegacy.filter((l: any) => l.name !== name);

      if (filteredLegacy.length === currentLegacy.length) {
        return res.status(404).json({ success: false, message: '遗产不存在' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { legacy: filteredLegacy },
      });

      res.json({
        success: true,
        message: '遗产已删除',
        legacy: filteredLegacy,
      });
    } catch (error) {
      console.error('Remove legacy error:', error);
      res.status(500).json({ success: false, message: '删除遗产失败' });
    }
  },
};
