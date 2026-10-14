'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

interface NewPostsPillProps {
  count?: number;
  onClick: () => void;
  visible: boolean;
}

export function NewPostsPill({ count = 1, onClick, visible }: NewPostsPillProps) {
  if (!visible) return null;

  return (
    <div className="sticky top-16 z-30 flex justify-center w-full pointer-events-none mb-2">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cobalt text-white text-xs font-medium shadow-floating hover:bg-[#2338b3] transition-all duration-200 animate-in slide-in-from-top-3 focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2"
        aria-label="Load new posts"
      >
        <ArrowUp className="w-3.5 h-3.5" />
        <span>{count > 1 ? `${count} new updates available` : 'New updates available'}</span>
      </button>
    </div>
  );
}
