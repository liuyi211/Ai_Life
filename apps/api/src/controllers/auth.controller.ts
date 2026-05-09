import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { encryptApiKey } from '../services/ai.service';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ success: false, message: '用户名长度应为3-20个字符' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少为6个字符' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return res.status(409).json({ success: false, message: '用户名已存在' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
        },
      });

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          fateFragments: user.fateFragments,
          totalPlayTime: user.totalPlayTime,
          generationCount: user.generationCount,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          fateFragments: user.fateFragments,
          totalPlayTime: user.totalPlayTime,
          generationCount: user.generationCount,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          avatar: true,
          fateFragments: true,
          totalPlayTime: true,
          generationCount: true,
          aiProvider: true,
          aiModel: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
  },

  // 访客登录（每次创建独立账号，使用默认 API 配置）
  async guestLogin(req: Request, res: Response) {
    try {
      const guestApiKey = process.env.GUEST_API_KEY;
      const guestModel = process.env.GUEST_API_MODEL || 'deepseek-chat';
      const guestProvider = process.env.GUEST_API_PROVIDER || 'deepseek';

      if (!guestApiKey) {
        return res.status(400).json({
          success: false,
          message: '未配置访客 API Key。请在 .env 中设置 GUEST_API_KEY',
        });
      }

      // 每次访客登录创建独立账号，隔离数据
      const guestId = crypto.randomBytes(4).toString('hex');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const user = await prisma.user.create({
        data: {
          username: `guest_${guestId}`,
          passwordHash: await bcrypt.hash(randomPassword, 10),
          aiProvider: guestProvider,
          aiApiKeyEncrypted: encryptApiKey(guestApiKey),
          aiModel: guestModel,
        },
      });

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          fateFragments: user.fateFragments,
          totalPlayTime: user.totalPlayTime,
          generationCount: user.generationCount,
        },
      });
    } catch (error) {
      console.error('Guest login error:', error);
      res.status(500).json({ success: false, message: '访客登录失败' });
    }
  },
};
