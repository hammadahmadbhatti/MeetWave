import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { getUserRoomMap, getActiveRooms } from './matchHandler';
import { chatService } from '../../services/chatService';
import { reportService } from '../../services/reportService';
import { logger } from '../../config/logger';

export function setupChatHandler(io: Server, socket: AuthenticatedSocket) {
  socket.on('chat-message', async (data: { content: string }) => {
    try {
      const userId = socket.userId!;
      const roomId = getUserRoomMap().get(userId);
      if (!roomId) return;

      const room = getActiveRooms().get(roomId);
      if (!room) return;

      const content = data.content.trim().slice(0, 1000); // Limit message length
      if (!content) return;

      // Save to DB
      await chatService.saveMessage(room.chatSessionId, userId, content);

      // Relay to peer
      const peerSocketId = room.user1.id === userId ? room.user2.socketId : room.user1.socketId;
      io.to(peerSocketId).emit('chat-message', {
        senderId: userId,
        content,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling chat message:', error);
    }
  });

  socket.on('typing', () => {
    const userId = socket.userId!;
    const roomId = getUserRoomMap().get(userId);
    if (!roomId) return;

    const room = getActiveRooms().get(roomId);
    if (!room) return;

    const peerSocketId = room.user1.id === userId ? room.user2.socketId : room.user1.socketId;
    io.to(peerSocketId).emit('typing', { userId });
  });

  socket.on('stop-typing', () => {
    const userId = socket.userId!;
    const roomId = getUserRoomMap().get(userId);
    if (!roomId) return;

    const room = getActiveRooms().get(roomId);
    if (!room) return;

    const peerSocketId = room.user1.id === userId ? room.user2.socketId : room.user1.socketId;
    io.to(peerSocketId).emit('stop-typing', { userId });
  });

  socket.on('report-user', async (data: { reason: string; description?: string }) => {
    try {
      const userId = socket.userId!;
      const roomId = getUserRoomMap().get(userId);
      if (!roomId) return;

      const room = getActiveRooms().get(roomId);
      if (!room) return;

      const reportedId = room.user1.id === userId ? room.user2.id : room.user1.id;
      await reportService.createReport(userId, reportedId, data.reason as any, room.chatSessionId, data.description);
      socket.emit('report-submitted');
      logger.info(`User ${userId} reported ${reportedId} for ${data.reason}`);
    } catch (error) {
      logger.error('Error handling report:', error);
      socket.emit('error', { message: 'Failed to submit report' });
    }
  });
}
