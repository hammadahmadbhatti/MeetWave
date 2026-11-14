import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold text-surface-700 mb-4">404</h1>
        <p className="text-xl text-surface-400 mb-8">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
