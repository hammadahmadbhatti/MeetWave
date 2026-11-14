import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { getUserRoomMap, getActiveRooms } from './matchHandler';
import { logger } from '../../config/logger';

export function setupSignalingHandler(io: Server, socket: AuthenticatedSocket) {
  socket.on('webrtc-offer', (data: { sdp: string; roomId: string }) => {
    const peerSocketId = getPeerSocketId(socket);
    if (peerSocketId) {
      io.to(peerSocketId).emit('webrtc-offer', { sdp: data.sdp, from: socket.userId });
    }
  });

  socket.on('webrtc-answer', (data: { sdp: string; roomId: string }) => {
    const peerSocketId = getPeerSocketId(socket);
    if (peerSocketId) {
      io.to(peerSocketId).emit('webrtc-answer', { sdp: data.sdp, from: socket.userId });
    }
  });

  socket.on('webrtc-ice-candidate', (data: { candidate: any; roomId: string }) => {
    const peerSocketId = getPeerSocketId(socket);
    if (peerSocketId) {
      io.to(peerSocketId).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.userId });
    }
  });
}

function getPeerSocketId(socket: AuthenticatedSocket): string | null {
  const userId = socket.userId;
  if (!userId) return null;

  const roomId = getUserRoomMap().get(userId);
  if (!roomId) return null;

  const room = getActiveRooms().get(roomId);
  if (!room) return null;

  return room.user1.id === userId ? room.user2.socketId : room.user1.socketId;
}
