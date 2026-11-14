import { Router } from 'express';
import { getActiveSession, getChatHistory } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/active', authenticate, getActiveSession);
router.get('/:sessionId/messages', authenticate, getChatHistory);

export default router;
