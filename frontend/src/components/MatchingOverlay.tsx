'use client';

interface MatchingOverlayProps {
  onCancel: () => void;
}

export default function MatchingOverlay({ onCancel }: MatchingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center z-30">
      <div className="text-center">
        {/* Animated rings */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-ping" />
          <div className="absolute inset-3 rounded-full border-2 border-brand-500/40 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-6 rounded-full border-2 border-brand-500/50 animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">Looking for someone to chat with</h3>
        <div className="flex items-center justify-center gap-1 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-dot-bounce" />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-dot-bounce" style={{ animationDelay: '0.16s' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-dot-bounce" style={{ animationDelay: '0.32s' }} />
        </div>

        <button
          onClick={onCancel}
          className="px-6 py-2 text-surface-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
