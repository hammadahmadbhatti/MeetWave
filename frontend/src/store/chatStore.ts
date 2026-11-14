import { create } from 'zustand';
import { Message, PeerInfo } from '@/types';

interface ChatStoreState {
  isSearching: boolean;
  isConnected: boolean;
  partner: PeerInfo | null;
  roomId: string | null;
  chatSessionId: string | null;
  messages: Message[];
  chatDuration: number;
  isChatOpen: boolean;

  setSearching: (v: boolean) => void;
  setConnected: (v: boolean, partner?: PeerInfo, roomId?: string, chatSessionId?: string) => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setChatDuration: (d: number) => void;
  toggleChat: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  isSearching: false,
  isConnected: false,
  partner: null,
  roomId: null,
  chatSessionId: null,
  messages: [],
  chatDuration: 0,
  isChatOpen: false,

  setSearching: (isSearching) => set({ isSearching }),
  setConnected: (isConnected, partner, roomId, chatSessionId) =>
    set({
      isConnected,
      partner: partner || null,
      roomId: roomId || null,
      chatSessionId: chatSessionId || null,
      messages: isConnected ? [{ senderId: 'system', content: 'Connected to a new partner!', timestamp: new Date().toISOString(), type: 'SYSTEM' }] : [],
      chatDuration: 0,
    }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  setChatDuration: (chatDuration) => set({ chatDuration }),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  reset: () => set({
    isSearching: false, isConnected: false, partner: null,
    roomId: null, chatSessionId: null, messages: [], chatDuration: 0,
  }),
}));
