import { Response, NextFunction } from 'express';
import { turnService } from '../services/turnService';
import { AuthRequest } from '../types';

export const getCredentials = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const credentials = turnService.getCredentials();
    res.json({ status: 'success', data: { iceServers: [credentials] } });
  } catch (error) {
    next(error);
  }
};
