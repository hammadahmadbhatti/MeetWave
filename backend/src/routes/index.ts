import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import reportRoutes from './report.routes';
import turnRoutes from './turn.routes';
import { matchingService } from '../services/matchingService';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/reports', reportRoutes);
router.use('/turn', turnRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/stats', async (_req, res) => {
  const onlineCount = await matchingService.getOnlineCount();
  const queueSize = await matchingService.getQueueSize();
  res.json({ status: 'success', data: { onlineCount, queueSize } });
});

export default router;
