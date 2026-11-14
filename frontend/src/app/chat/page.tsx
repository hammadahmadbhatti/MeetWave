'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import ControlBar from '@/components/ControlBar';
import ChatSidebar from '@/components/ChatSidebar';
import MatchingOverlay from '@/components/MatchingOverlay';
import ReportModal from '@/components/ReportModal';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const router = useRouter();
  const { user, token } = useUserStore();
  const { isChatOpen, toggleChat } = useChatStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    startLocalStream,
    joinQueue,
    leaveQueue,
    nextPartner,
    stopChat,
    sendMessage,
    reportUser,
    isSearching,
    isPartnerConnected,
    partner,
    messages,
    chatDuration,
    onlineCount,
  } = useMatchmaking();

  // Mark mounted so we can gate the auth redirect to after SSR
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.push('/');
      return;
    }

    startLocalStream()
      .then(() => joinQueue())
      .catch(() => {
        toast.error('Camera / mic access is required for video chat');
      });

    return () => { stopChat(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token]);

  const handleNext = useCallback(() => nextPartner(), [nextPartner]);

  const handleStop = useCallback(() => {
    stopChat();
    router.push('/');
  }, [stopChat, router]);

  const handleReport = useCallback(
    (reason: string, description?: string) => {
      reportUser(reason, description);
      toast.success('Report submitted — thank you');
    },
    [reportUser],
  );

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Show a blank dark screen while we wait for the client to mount
  if (!mounted) {
    return <div className="h-full w-full bg-surface-950" />;
  }

  return (
    <div className="h-full w-full flex flex-col relative">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleStop}
            className="glass px-3 py-1.5 rounded-lg text-sm text-surface-300 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="glass px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            <span className="text-surface-300">{onlineCount.toLocaleString()} online</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPartnerConnected && (
            <>
              {partner?.country && (
                <div className="glass px-3 py-1.5 rounded-lg text-sm text-surface-300 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/16x12/${partner.country.toLowerCase()}.png`}
                    alt={partner.country}
                    className="w-4 h-3"
                  />
                  {partner.country}
                </div>
              )}
              <div className="glass px-3 py-1.5 rounded-lg text-sm text-surface-300">
                {formatDuration(chatDuration)}
              </div>
              <div className="glass px-3 py-1.5 rounded-lg text-xs text-brand-400 font-medium">
                Connected
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Video area ──────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Remote (full-screen) */}
        <VideoPlayer stream={remoteStream} className="w-full h-full" />

        {/* Local (picture-in-picture, bottom-right) */}
        <div className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-10">
          <VideoPlayer
            stream={localStream}
            muted
            mirror
            isLocal
            className="w-full h-full"
          />
        </div>

        {/* Searching overlay */}
        {isSearching && <MatchingOverlay onCancel={leaveQueue} />}
      </div>

      {/* ── Control bar (centred at bottom) ─────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <ControlBar
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isConnected={isPartnerConnected}
          isChatOpen={isChatOpen}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onNext={handleNext}
          onStop={handleStop}
          onReport={() => setReportOpen(true)}
          onToggleChat={toggleChat}
          onToggleFullscreen={handleFullscreen}
        />
      </div>

      {/* ── Chat sidebar ────────────────────────────────────── */}
      <ChatSidebar
        messages={messages}
        isOpen={isChatOpen}
        currentUserId={user?.id ?? ''}
        onSendMessage={sendMessage}
        onClose={toggleChat}
      />

      {/* ── Report modal ────────────────────────────────────── */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </div>
  );
}
