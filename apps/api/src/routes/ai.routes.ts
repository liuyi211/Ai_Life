import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// AI 配置管理
router.get('/config', authMiddleware, aiController.getConfig);
router.put('/config', authMiddleware, aiController.updateConfig);
router.delete('/config', authMiddleware, aiController.clearConfig);
router.post('/test', authMiddleware, aiController.testConnection);

// AI 生成服务
router.post('/background', authMiddleware, aiController.generateBackground);
router.post('/narrative', authMiddleware, aiController.generateNarrative);
router.post('/choices', authMiddleware, aiController.generateChoices);
router.post('/chat', authMiddleware, aiController.chatWithNPC);

export default router;
