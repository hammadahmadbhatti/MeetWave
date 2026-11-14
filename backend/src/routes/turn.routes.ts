import { Router } from 'express';
import { getCredentials } from '../controllers/turnController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/credentials', authenticate, getCredentials);

export default router;
