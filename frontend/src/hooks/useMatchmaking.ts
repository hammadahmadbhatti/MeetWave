'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useWebRTC } from './useWebRTC';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { api } from '@/lib/api';
import { MatchData, IceServer } from '@/types';

export function useMatchmaking() {
  const { token, preferences } = useUserStore();
  const { emit, on, off, isConnected: socketConnected, onlineCount } = useSocket(token);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceServersRef = useRef<IceServer[]>([]);
  const roomIdRef = useRef<string | null>(null);

  const onIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      emit('webrtc-ice-candidate', { candidate: candidate.toJSON(), roomId: roomIdRef.current });
    },
    [emit],
  );

  const webrtc = useWebRTC(iceServersRef.current, onIceCandidate);

  // Fetch TURN credentials on mount
  useEffect(() => {
    if (!token) return;
    api
      .getTurnCredentials()
      .then((data) => {
        iceServersRef.current = data.iceServers;
      })
      .catch(console.error);
  }, [token]);

  // Handle socket events
  useEffect(() => {
    if (!socketConnected) return;

    const handleMatchFound = async (data: MatchData) => {
      useChatStore.getState().setSearching(false);
      useChatStore
        .getState()
        .setConnected(true, data.peer, data.roomId, data.chatSessionId);
      roomIdRef.current = data.roomId;

      if (data.initiator) {
        const offer = await webrtc.createOffer();
        if (offer) emit('webrtc-offer', { sdp: offer, roomId: data.roomId });
      }

      // Fix: use getState() inside interval so duration is always current
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        useChatStore
          .getState()
          .setChatDuration(useChatStore.getState().chatDuration + 1);
      }, 1000);
    };

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit }) => {
      const answer = await webrtc.handleOffer(data.sdp);
      if (answer)
        emit('webrtc-answer', { sdp: answer, roomId: roomIdRef.current });
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit }) => {
      await webrtc.handleAnswer(data.sdp);
    };

    const handleIce = async (data: { candidate: RTCIceCandidateInit }) => {
      await webrtc.handleIceCandidate(data.candidate);
    };

    const handleMessage = (data: {
      senderId: string;
      content: string;
      timestamp: string;
    }) => {
      useChatStore
        .getState()
        .addMessage({
          senderId: data.senderId,
          content: data.content,
          timestamp: data.timestamp,
        });
    };

    const handlePartnerDisconnected = () => {
      webrtc.cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
      useChatStore.getState().addMessage({
        senderId: 'system',
        content: 'Partner disconnected',
        timestamp: new Date().toISOString(),
        type: 'SYSTEM',
      });
      useChatStore.getState().setConnected(false);
      roomIdRef.current = null;
    };

    const handleSearching = () => useChatStore.getState().setSearching(true);

    on('match-found', handleMatchFound);
    on('webrtc-offer', handleOffer);
    on('webrtc-answer', handleAnswer);
    on('webrtc-ice-candidate', handleIce);
    on('chat-message', handleMessage);
    on('partner-disconnected', handlePartnerDisconnected);
    on('searching', handleSearching);

    return () => {
      off('match-found', handleMatchFound);
      off('webrtc-offer', handleOffer);
      off('webrtc-answer', handleAnswer);
      off('webrtc-ice-candidate', handleIce);
      off('chat-message', handleMessage);
      off('partner-disconnected', handlePartnerDisconnected);
      off('searching', handleSearching);
    };
  }, [socketConnected, on, off, emit, webrtc]);

  const joinQueue = useCallback(() => {
    useChatStore.getState().setSearching(true);
    emit('join-queue', preferences);
  }, [emit, preferences]);

  const leaveQueue = useCallback(() => {
    useChatStore.getState().setSearching(false);
    emit('leave-queue');
  }, [emit]);

  const nextPartner = useCallback(() => {
    webrtc.cleanup();
    if (timerRef.current) clearInterval(timerRef.current);
    roomIdRef.current = null;
    useChatStore.getState().setConnected(false);
    useChatStore.getState().setSearching(true);
    emit('next-partner', preferences);
  }, [emit, preferences, webrtc]);

  const stopChat = useCallback(() => {
    webrtc.cleanup();
    if (timerRef.current) clearInterval(timerRef.current);
    roomIdRef.current = null;
    emit('leave-queue');
    useChatStore.getState().reset();
  }, [emit, webrtc]);

  const sendMessage = useCallback(
    (content: string) => {
      emit('chat-message', { content });
      useChatStore.getState().addMessage({
        senderId: useUserStore.getState().user?.id || '',
        content,
        timestamp: new Date().toISOString(),
      });
    },
    [emit],
  );

  const reportUser = useCallback(
    (reason: string, description?: string) => {
      emit('report-user', { reason, description });
    },
    [emit],
  );

  // Derived state from store (reactive)
  const store = useChatStore();

  return {
    ...webrtc,
    joinQueue,
    leaveQueue,
    nextPartner,
    stopChat,
    sendMessage,
    reportUser,
    isSearching: store.isSearching,
    isPartnerConnected: store.isConnected,
    partner: store.partner,
    messages: store.messages,
    chatDuration: store.chatDuration,
    onlineCount,
    socketConnected,
  };
}
