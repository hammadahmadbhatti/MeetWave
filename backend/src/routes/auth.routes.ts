import { Router } from 'express';
import { register, login, guestLogin, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/guest', authLimiter, guestLogin);
router.get('/me', authenticate, me);

export default router;
