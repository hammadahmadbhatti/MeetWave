import { PrismaClient, MessageType, ChatStatus } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class ChatService {
  async createChatSession(user1Id: string, user2Id: string) {
    const session = await prisma.chatSession.create({
      data: { user1Id, user2Id, status: ChatStatus.ACTIVE },
    });
    logger.info(`Chat session created: ${session.id} between ${user1Id} and ${user2Id}`);
    return session;
  }

  async endChatSession(sessionId: string) {
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== ChatStatus.ACTIVE) return null;

    const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: ChatStatus.ENDED, endedAt: new Date(), duration },
    });
    logger.info(`Chat session ended: ${sessionId}, duration: ${duration}s`);
    return updated;
  }

  async saveMessage(chatSessionId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT) {
    return prisma.message.create({
      data: { chatSessionId, senderId, content, type },
    });
  }

  async getChatHistory(chatSessionId: string, limit = 50, offset = 0) {
    return prisma.message.findMany({
      where: { chatSessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        content: true,
        type: true,
        createdAt: true,
        sender: { select: { id: true, username: true } },
      },
    });
  }

  async getActiveSessionForUser(userId: string) {
    return prisma.chatSession.findFirst({
      where: {
        status: ChatStatus.ACTIVE,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, username: true, country: true } },
        user2: { select: { id: true, username: true, country: true } },
      },
    });
  }
}

export const chatService = new ChatService();
