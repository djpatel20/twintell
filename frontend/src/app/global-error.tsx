'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Fatal root application error caught by global-error.tsx:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          {/* Logo / Brand */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1A5CFF] text-white flex items-center justify-center font-bold text-base shadow-sm">
              T
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">twintell</span>
          </div>

          {/* Warning badge */}
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
              Fatal System Error
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              We couldn't load the application
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              A critical error occurred while initializing the platform. Please refresh the page or try again in a few moments.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A5CFF] hover:bg-[#0043F0] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Reload platform
            </button>
          </div>

          {/* Subtle error digest */}
          {error?.digest && (
            <p className="text-[10px] text-slate-400 font-mono">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
