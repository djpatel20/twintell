'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log unexpected runtime client error
    console.error('Unhandled app error captured by error.tsx boundary:', error);
  }, [error]);

  const handleCopy = async () => {
    try {
      const errorPayload = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
      await navigator.clipboard.writeText(errorPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  return (
    <AppShell showRightSidebar={false}>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-lg mx-auto">
        {/* Warning Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-6 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-rose-100 text-rose-700 mb-3">
          Application Error
        </span>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink mb-3 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          An unexpected error occurred while processing this page. You can try reloading or returning to the home feed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-6">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto font-medium"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Try again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto font-medium"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Home Feed
            </Button>
          </Link>
        </div>

        {/* Collapsible Technical Details */}
        <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-slate-700 font-medium hover:bg-slate-100/70 transition-colors"
          >
            <span>Technical error details</span>
            {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showDetails && (
            <div className="p-4 pt-2 border-t border-slate-200 space-y-2 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-b-xl relative">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-slate-400">Error trace</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-rose-400 break-words">{error.message || 'Unknown runtime error'}</p>
              {error.digest && (
                <p className="text-slate-400 text-[10px]">
                  Digest code: <span className="text-slate-300">{error.digest}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
