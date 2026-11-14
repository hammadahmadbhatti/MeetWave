'use client';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  className?: string;
  label?: string;
  isLocal?: boolean;
}

export default function VideoPlayer({ stream, muted = false, mirror = false, className, label, isLocal = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={clsx('relative overflow-hidden bg-surface-900', className)}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={clsx('w-full h-full object-cover', mirror && 'scale-x-[-1]')}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <svg className="w-10 h-10 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-surface-500 text-sm">{isLocal ? 'Camera off' : 'Waiting for partner...'}</p>
          </div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-3 left-3 glass px-3 py-1 rounded-lg text-xs text-surface-300">
          {label}
        </div>
      )}
    </div>
  );
}
