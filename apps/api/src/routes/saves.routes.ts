import { Router } from 'express';
import { savesController } from '../controllers/saves.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, savesController.list);
router.get('/active', authMiddleware, savesController.getActive);
router.get('/:id', authMiddleware, savesController.getById);
router.post('/', authMiddleware, savesController.create);
router.put('/:id', authMiddleware, savesController.update);
router.delete('/:id', authMiddleware, savesController.delete);

export default router;
