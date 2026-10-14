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
  const { unreadCount } = useNotifications();
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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo - 240px alignment on desktop */}
        <div className="flex items-center gap-2 lg:w-[240px] shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display font-bold text-xl sm:text-2xl text-cobalt tracking-tight">
              Twintell
            </span>
          </Link>
        </div>

        {/* Global Search Bar (Wide, centered on desktop) */}
        <div className="flex-1 max-w-lg mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <div className="absolute left-3 text-ink-muted pointer-events-none flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              name="search"
              placeholder="Search companies, products, posts..."
              className="w-full h-9 rounded-lg bg-panel-sunk border border-transparent pl-9 pr-14 text-xs sm:text-sm text-ink placeholder:text-ink-faint transition-all duration-120 outline-none focus:border-line focus:ring-[3px] focus:ring-cobalt-soft focus:bg-panel"
              aria-label="Search companies, products, posts"
            />
            <div className="absolute right-2.5 pointer-events-none hidden sm:flex items-center">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-ink-faint bg-panel border border-line">
                {shortcutHint}
              </kbd>
            </div>
          </form>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            href={user ? '/profile?tab=inquiries' : '/login'}
            title="Messages"
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-panel-sunk rounded-lg transition-colors relative"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
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
