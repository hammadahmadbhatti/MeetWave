import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';
import { AuthenticatedSocket } from '../types';
import { setupMatchHandler, handleDisconnect } from './handlers/matchHandler';
import { setupSignalingHandler } from './handlers/signalingHandler';
import { setupChatHandler } from './handlers/chatHandler';
import { matchingService } from '../services/matchingService';

export function initializeSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwt.secret) as {
        id: string;
        username: string;
        isGuest: boolean;
      };

      socket.userId = decoded.id;
      socket.username = decoded.username;
      socket.isGuest = decoded.isGuest;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} (${socket.id})`);
    await matchingService.incrementOnlineCount();

    // Emit current online count to all
    const onlineCount = await matchingService.getOnlineCount();
    io.emit('online-count', { count: onlineCount });

    // Setup handlers
    setupMatchHandler(io, socket);
    setupSignalingHandler(io, socket);
    setupChatHandler(io, socket);

    socket.on('disconnect', async (reason) => {
      logger.info(`User disconnected: ${socket.userId} (${reason})`);
      await handleDisconnect(io, socket);

      const count = await matchingService.getOnlineCount();
      io.emit('online-count', { count });
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userId}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}
