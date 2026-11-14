import { Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';
import { AuthRequest } from '../types';

export const getActiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await chatService.getActiveSessionForUser(req.user!.id);
    res.json({ status: 'success', data: { session } });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const messages = await chatService.getChatHistory(sessionId, limit, offset);
    res.json({ status: 'success', data: { messages } });
  } catch (error) {
    next(error);
  }
};
