'use client';
import Link from 'next/link';

interface HeaderProps {
  onlineCount?: number;
  showAuth?: boolean;
}

export default function Header({ onlineCount = 0, showAuth = true }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
            MeetWave
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {onlineCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-surface-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
              </span>
              <span>{onlineCount.toLocaleString()} online</span>
            </div>
          )}
          {showAuth && (
            <Link href="/chat" className="btn-primary text-sm py-2">
              Start Chatting
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
