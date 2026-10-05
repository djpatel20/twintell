'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Building2, User as UserIcon } from 'lucide-react';
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Home */}
        <Link
          href="/"
          className={clsx(
            'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
            pathname === '/' ? 'text-primary-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {/* Discover */}
        <Link
          href="/discover"
          className={clsx(
            'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
            pathname === '/discover' ? 'text-primary-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </Link>

        {/* Center "+" - Show ONLY for COMPANY users as requested */}
        {isCompany && (
          <button
            type="button"
            onClick={onNewPostClick}
            className="-mt-5 w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
            aria-label="Create Post"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Business Directory */}
        <Link
          href="/directory"
          className={clsx(
            'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
            pathname === '/directory' ? 'text-primary-500 font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Building2 className="w-5 h-5" />
          <span>Directory</span>
        </Link>

        {/* Profile */}
        <Link
          href={user ? '/profile' : '/login'}
          className={clsx(
            'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
            pathname === '/profile' || pathname === '/login'
              ? 'text-primary-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
