import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../config/logger';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
  email: string | null;
  username: string;
  isGuest: boolean;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if user still exists and is not banned
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (user.isBanned) {
      const now = new Date();
      if (!user.banExpiresAt || user.banExpiresAt > now) {
        throw new AppError(
          `Account banned${user.banReason ? `: ${user.banReason}` : ''}`,
          403
        );
      }
      // Ban has expired, unban user
      await prisma.user.update({
        where: { id: user.id },
        data: { isBanned: false, banReason: null, banExpiresAt: null },
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      isGuest: decoded.isGuest,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
      return;
    }
    logger.error('Authentication error:', error);
    next(new AppError('Authentication failed', 401));
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      isGuest: decoded.isGuest,
    };
  } catch {
    // Token invalid - continue without auth
  }
  next();
};
