import { PrismaClient, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface TokenPayload {
  id: string;
  email: string | null;
  username: string;
  isGuest: boolean;
}

export class AuthService {
  async register(
    email: string,
    password: string,
    username: string,
    gender?: Gender,
    country?: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      throw new AppError(
        existing.email === email ? 'Email already registered' : 'Username already taken',
        409
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, username, gender, country },
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: false,
    });

    return {
      user: { id: user.id, email: user.email, username: user.username, gender: user.gender, country: user.country },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      if (!user.banExpiresAt || user.banExpiresAt > new Date()) {
        throw new AppError(`Account banned${user.banReason ? `: ${user.banReason}` : ''}`, 403);
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { isBanned: false, banReason: null, banExpiresAt: null },
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: false,
    });

    return {
      user: { id: user.id, email: user.email, username: user.username, gender: user.gender, country: user.country },
      token,
    };
  }

  async guestLogin() {
    const guestId = uuidv4().slice(0, 8);
    const user = await prisma.user.create({
      data: {
        username: `Guest_${guestId}`,
        isGuest: true,
      },
    });

    const token = this.generateToken({
      id: user.id,
      email: null,
      username: user.username,
      isGuest: true,
    });

    return {
      user: { id: user.id, username: user.username, isGuest: true },
      token,
    };
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, gender: true, country: true, isGuest: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const authService = new AuthService();
