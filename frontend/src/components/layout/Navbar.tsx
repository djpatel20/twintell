'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, MessageSquare, PlusCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface NavbarProps {
  user?: User | null;
  isLoading?: boolean;
}

export function Navbar({ user, isLoading }: NavbarProps) {
  const router = useRouter();
  const { unreadCount, unreadMessagesCount } = useNotifications();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut listener per DESIGN.md §7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = (
      e.currentTarget.elements.namedItem('search') as HTMLInputElement
    )?.value?.trim();
    if (term) {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    } else {
      router.push('/search');
    }
  };

  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

  return (
    <header className="sticky top-0 z-40 w-full bg-panel/95 backdrop-blur border-b border-line">
      <div className="max-w-[1280px] mx-auto px-2.5 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo - 240px alignment on desktop */}
        <div className="flex items-center gap-2 lg:w-[240px] shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display font-bold text-lg sm:text-2xl text-cobalt tracking-tight">
              Twintell
            </span>
          </Link>
        </div>

        {/* Global Search Bar (Wide, centered on desktop) */}
        <div className="flex-1 min-w-0 max-w-lg mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <div className="absolute left-2.5 sm:left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              name="search"
              placeholder="Search companies, products, posts..."
              className="w-full h-8 sm:h-9 rounded-lg bg-slate-100 hover:bg-slate-100/90 border border-slate-200/80 pl-8 sm:pl-9 pr-2.5 sm:pr-14 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:truncate transition-all duration-120 outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15 focus:bg-white"
              aria-label="Search companies, products, posts"
            />
            <div className="absolute right-2.5 pointer-events-none hidden sm:flex items-center">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-white border border-slate-200 shadow-xs">
                {shortcutHint}
              </kbd>
            </div>
          </form>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Link href="/directory" className="hidden sm:inline-flex">
            <Button
              variant="secondary"
              size="sm"
            >
              Directory
            </Button>
          </Link>

          {/* Messages / Direct Chats */}
          <Link
            href={user ? '/messages' : '/login'}
            title="Messages"
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-panel-sunk rounded-lg transition-colors relative"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
              </span>
            )}
          </Link>

          {/* Notifications Bell */}
          <Link
            href={user ? '/notifications' : '/login'}
            title="Notifications"
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-panel-sunk rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1">
                <Badge variant="count">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </span>
            )}
          </Link>

          {/* Profile Menu / Avatar */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-panel-sunk animate-pulse" />
          ) : user ? (
            <Link href="/profile" className="flex items-center shrink-0" aria-label="My profile">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                alt={user.name}
                size="sm"
              />
            </Link>
          ) : (
            <Link href="/login" className="shrink-0">
              <Button size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
