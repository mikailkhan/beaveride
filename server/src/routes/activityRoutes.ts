import { Router } from 'express';
import { ActivityController } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new ActivityController();

router.get('/:roomId/activity', requireAuth, controller.getActivityEvents);
router.get('/:roomId/activity/export', requireAuth, controller.exportActivityEvents);
router.get('/:roomId/files/:fileId/activity', requireAuth, controller.getFileActivityEvents);
router.get('/:roomId/activity/correlation/:correlationId', requireAuth, controller.getCorrelationActivityEvents);

export const activityRoutes = router;
