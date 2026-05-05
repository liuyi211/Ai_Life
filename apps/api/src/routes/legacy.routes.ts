import { Router } from 'express';
import { legacyController } from '../controllers/legacy.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, legacyController.list);
router.post('/', authMiddleware, legacyController.add);
router.delete('/', authMiddleware, legacyController.remove);

export default router;
