import { Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '../utils/validators';
import { AuthRequest } from '../types';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data.email, data.password, data.username, data.gender as any, data.country);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const guestLogin = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.guestLogin();
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUser(req.user!.id);
    res.json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};
