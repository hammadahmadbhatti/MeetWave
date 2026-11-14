import { Server } from 'socket.io';
import { AuthenticatedSocket, QueueEntry, MatchPreferences, ChatRoom } from '../../types';
import { matchingService } from '../../services/matchingService';
import { chatService } from '../../services/chatService';
import { logger } from '../../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Active rooms: roomId -> ChatRoom
const activeRooms = new Map<string, ChatRoom>();
// User -> room mapping
const userRoomMap = new Map<string, string>();

export function getActiveRooms() { return activeRooms; }
export function getUserRoomMap() { return userRoomMap; }

export function setupMatchHandler(io: Server, socket: AuthenticatedSocket) {
  socket.on('join-queue', async (preferences: MatchPreferences) => {
    try {
      const userId = socket.userId!;
      const entry: QueueEntry = {
        userId,
        socketId: socket.id,
        preferences,
        gender: preferences.gender,
        country: preferences.country,
        timestamp: Date.now(),
      };

      // Check if already in a room
      if (userRoomMap.has(userId)) {
        socket.emit('error', { message: 'Already in a chat session' });
        return;
      }

      // Try to find a match immediately
      const match = await matchingService.findMatch(userId, preferences);

      if (match) {
        await createRoom(io, socket, match);
      } else {
        await matchingService.addToQueue(entry);
        socket.emit('queue-joined', { position: await matchingService.getQueueSize() });
        logger.debug(`User ${userId} joined queue, waiting for match`);
      }
    } catch (error) {
      logger.error('Error joining queue:', error);
      socket.emit('error', { message: 'Failed to join queue' });
    }
  });

  socket.on('leave-queue', async () => {
    try {
      await matchingService.removeFromQueue(socket.userId!);
      socket.emit('queue-left');
    } catch (error) {
      logger.error('Error leaving queue:', error);
    }
  });

  socket.on('next-partner', async (preferences: MatchPreferences) => {
    try {
      const userId = socket.userId!;
      const currentRoomId = userRoomMap.get(userId);

      if (currentRoomId) {
        await endRoom(io, currentRoomId, userId);
      }

      // Re-enter queue
      const entry: QueueEntry = {
        userId,
        socketId: socket.id,
        preferences: preferences || {},
        gender: preferences?.gender,
        country: preferences?.country,
        timestamp: Date.now(),
      };

      const match = await matchingService.findMatch(userId, preferences || {});
      if (match) {
        await createRoom(io, socket, match);
      } else {
        await matchingService.addToQueue(entry);
        socket.emit('searching');
      }
    } catch (error) {
      logger.error('Error switching partner:', error);
      socket.emit('error', { message: 'Failed to find next partner' });
    }
  });
}

async function createRoom(io: Server, socket: AuthenticatedSocket, match: QueueEntry) {
  const roomId = uuidv4();
  const userId = socket.userId!;

  // Create DB chat session
  const chatSession = await chatService.createChatSession(userId, match.userId);

  const room: ChatRoom = {
    id: roomId,
    user1: { id: userId, username: socket.username!, socketId: socket.id, isGuest: socket.isGuest! },
    user2: { id: match.userId, username: '', socketId: match.socketId, isGuest: false },
    chatSessionId: chatSession.id,
    createdAt: Date.now(),
  };

  activeRooms.set(roomId, room);
  userRoomMap.set(userId, roomId);
  userRoomMap.set(match.userId, roomId);

  // Join socket room
  socket.join(roomId);
  const matchSocket = io.sockets.sockets.get(match.socketId);
  if (matchSocket) {
    matchSocket.join(roomId);
  }

  // Notify both users - user1 creates offer
  socket.emit('match-found', {
    roomId,
    chatSessionId: chatSession.id,
    peer: { id: match.userId, country: match.country },
    initiator: true,
  });

  io.to(match.socketId).emit('match-found', {
    roomId,
    chatSessionId: chatSession.id,
    peer: { id: userId, country: socket.handshake.query.country },
    initiator: false,
  });

  logger.info(`Match created: room ${roomId} - ${userId} <-> ${match.userId}`);
}

export async function endRoom(io: Server, roomId: string, initiatorId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  // End DB session
  await chatService.endChatSession(room.chatSessionId);

  // Notify peer
  const peerId = room.user1.id === initiatorId ? room.user2.socketId : room.user1.socketId;
  io.to(peerId).emit('partner-disconnected');

  // Cleanup
  const peerUserId = room.user1.id === initiatorId ? room.user2.id : room.user1.id;
  userRoomMap.delete(room.user1.id);
  userRoomMap.delete(room.user2.id);
  activeRooms.delete(roomId);

  // Remove both from socket room
  io.in(roomId).socketsLeave(roomId);

  logger.info(`Room ${roomId} ended by ${initiatorId}`);
}

export async function handleDisconnect(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId;
  if (!userId) return;

  // Remove from queue
  await matchingService.removeFromQueue(userId);

  // End active room
  const roomId = userRoomMap.get(userId);
  if (roomId) {
    await endRoom(io, roomId, userId);
  }

  await matchingService.decrementOnlineCount();
  logger.debug(`User ${userId} disconnected`);
}
