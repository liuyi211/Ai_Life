import { Router } from 'express';
import { settlementController } from '../controllers/settlement.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 结算存档
router.post('/:id/settle', authMiddleware, settlementController.settle);

// 生成人生总结
router.post('/:id/summary', authMiddleware, settlementController.generateSummary);

// 导出存档
router.get('/:id/export', authMiddleware, settlementController.export);

// 导入存档
router.post('/import', authMiddleware, settlementController.import);

export default router;
