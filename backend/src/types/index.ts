import { Request } from 'express';
import { Socket } from 'socket.io';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    username: string;
    isGuest: boolean;
  };
}

export interface SocketUser {
  id: string;
  username: string;
  socketId: string;
  isGuest: boolean;
  gender?: string;
  country?: string;
}

export interface MatchPreferences {
  gender?: string;
  country?: string;
}

export interface QueueEntry {
  userId: string;
  socketId: string;
  preferences: MatchPreferences;
  gender?: string;
  country?: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  user1: SocketUser;
  user2: SocketUser;
  chatSessionId: string;
  createdAt: number;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  to: string;
}

export interface RTCIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  ttl: number;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  isGuest?: boolean;
}

export enum ChatSessionStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  REPORTED = 'REPORTED',
}

export enum ReportReason {
  INAPPROPRIATE = 'INAPPROPRIATE',
  HARASSMENT = 'HARASSMENT',
  SPAM = 'SPAM',
  UNDERAGE = 'UNDERAGE',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
}
