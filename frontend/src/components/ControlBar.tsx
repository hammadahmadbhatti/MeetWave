'use client';
import clsx from 'clsx';

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isConnected: boolean;
  isChatOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onNext: () => void;
  onStop: () => void;
  onReport: () => void;
  onToggleChat: () => void;
  onToggleFullscreen: () => void;
}

export default function ControlBar({
  isAudioEnabled, isVideoEnabled, isConnected, isChatOpen,
  onToggleAudio, onToggleVideo, onNext, onStop, onReport, onToggleChat, onToggleFullscreen,
}: ControlBarProps) {
  return (
    <div className="glass-dark rounded-2xl px-4 py-3 flex items-center justify-center gap-3">
      {/* Mic */}
      <ControlButton
        active={isAudioEnabled}
        onClick={onToggleAudio}
        title={isAudioEnabled ? 'Mute' : 'Unmute'}
        icon={isAudioEnabled ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        )}
      />

      {/* Camera */}
      <ControlButton
        active={isVideoEnabled}
        onClick={onToggleVideo}
        title={isVideoEnabled ? 'Camera Off' : 'Camera On'}
        icon={isVideoEnabled ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
        )}
      />

      {/* Next - prominent */}
      <button
        onClick={onNext}
        className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2 text-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        Next
      </button>

      {/* Stop */}
      <button
        onClick={onStop}
        className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 active:scale-95"
        title="Stop"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>

      <div className="w-px h-8 bg-white/10" />

      {/* Chat toggle */}
      <ControlButton
        active={isChatOpen}
        onClick={onToggleChat}
        title="Toggle Chat"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
      />

      {/* Report */}
      {isConnected && (
        <ControlButton
          active={false}
          onClick={onReport}
          title="Report User"
          danger
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
        />
      )}

      {/* Fullscreen */}
      <ControlButton
        active={false}
        onClick={onToggleFullscreen}
        title="Fullscreen"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />}
      />
    </div>
  );
}

function ControlButton({ active, onClick, title, icon, danger = false }: {
  active: boolean; onClick: () => void; title: string; icon: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'p-3 rounded-xl transition-all duration-200 active:scale-95',
        danger
          ? 'text-red-400 hover:bg-red-500/20'
          : active
            ? 'bg-white/10 text-white'
            : 'text-surface-400 hover:bg-white/10 hover:text-white'
      )}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
    </button>
  );
}
