import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    (req as any).userId = decoded.userId;
    (req as any).username = decoded.username;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '认证令牌无效或已过期' });
  }
};
