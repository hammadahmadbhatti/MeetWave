import { Router } from 'express';
import { createReport, getReports, reviewReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { reportLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', authenticate, reportLimiter, createReport);
router.get('/', authenticate, getReports);
router.patch('/:reportId/review', authenticate, reviewReport);

export default router;
