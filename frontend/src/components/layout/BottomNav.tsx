'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, MessageSquare, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { User } from '../../types';

interface BottomNavProps {
  user?: User | null;
  isLoading?: boolean;
  onNewPostClick?: () => void;
}

export function BottomNav({ user, isLoading, onNewPostClick }: BottomNavProps) {
  const pathname = usePathname();
  const isCompany = user?.role === 'COMPANY';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-panel/95 backdrop-blur border-t border-line px-3 py-1.5 select-none">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Home */}
        <Link
          href="/"
          className={clsx(
            'min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors',
            pathname === '/' ? 'text-cobalt font-semibold' : 'text-ink-muted hover:text-ink'
          )}
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {/* Discover */}
        <Link
          href="/discover"
          className={clsx(
            'min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors',
            pathname === '/discover' ? 'text-cobalt font-semibold' : 'text-ink-muted hover:text-ink'
          )}
          aria-label="Discover"
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </Link>

        {/* Center "+" - Show ONLY for COMPANY users per AGENTS.md & DESIGN.md */}
        {isCompany && (
          <button
            type="button"
            onClick={onNewPostClick}
            className="-mt-5 w-11 h-11 rounded-full bg-cobalt text-white flex items-center justify-center shadow-md active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2"
            aria-label="New post"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Messages */}
        <Link
          href={user ? '/profile?tab=inquiries' : '/login'}
          className={clsx(
            'min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors',
            pathname === '/profile' && typeof window !== 'undefined' && window.location.search.includes('tab=inquiries')
              ? 'text-cobalt font-semibold'
              : 'text-ink-muted hover:text-ink'
          )}
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Messages</span>
        </Link>

        {/* Profile */}
        <Link
          href={user ? '/profile' : '/login'}
          className={clsx(
            'min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors',
            (pathname === '/profile' && (typeof window === 'undefined' || !window.location.search.includes('tab=inquiries'))) || pathname === '/login'
              ? 'text-cobalt font-semibold'
              : 'text-ink-muted hover:text-ink'
          )}
          aria-label="Profile"
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
