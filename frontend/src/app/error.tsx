'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="text-center glass rounded-2xl p-10 max-w-md mx-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-surface-400 text-sm mb-6">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-xl transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
