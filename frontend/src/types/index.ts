export interface User {
  id: string;
  email?: string | null;
  username: string;
  gender?: string;
  country?: string;
  isGuest?: boolean;
}

export interface Message {
  id?: string;
  senderId: string;
  content: string;
  timestamp: string;
  type?: 'TEXT' | 'SYSTEM';
}

export interface MatchPreferences {
  gender?: string;
  country?: string;
}

export interface PeerInfo {
  id: string;
  country?: string;
}

export interface MatchData {
  roomId: string;
  chatSessionId: string;
  peer: PeerInfo;
  initiator: boolean;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface ChatState {
  isSearching: boolean;
  isConnected: boolean;
  partner: PeerInfo | null;
  roomId: string | null;
  chatSessionId: string | null;
  messages: Message[];
  chatDuration: number;
}
