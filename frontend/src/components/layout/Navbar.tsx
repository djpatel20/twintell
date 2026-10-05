'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Building2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { User } from '../../types';

interface NavbarProps {
  user?: User | null;
  isLoading?: boolean;
  onSearchClick?: () => void;
}

export function Navbar({ user, isLoading, onSearchClick }: NavbarProps) {
  const handleNotificationsClick = () => {
    alert('Notifications are coming soon in Phase 2!');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Mobile brand logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-primary-500">twintell</span>
          </Link>
        </div>

        {/* Global Search Bar (Mobile & Desktop) */}
        <div className="flex-1 max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const term = (e.currentTarget.elements.namedItem('search') as HTMLInputElement)?.value?.trim();
              if (term) {
                window.location.href = `/search?q=${encodeURIComponent(term)}`;
              } else {
                window.location.href = '/search';
              }
            }}
            className="relative flex items-center w-full"
          >
            <input
              type="text"
              name="search"
              placeholder="Search companies, products, posts..."
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-all border border-slate-200 outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 p-0 text-slate-400 hover:text-primary-600 transition-colors"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
            </button>
          </form>
        </div>

        {/* Right action items */}
        <div className="flex items-center gap-3">
          {/* Notifications icon (Phase 1 coming soon) */}
          <button
            type="button"
            onClick={handleNotificationsClick}
            title="Notifications (Coming Soon)"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
          </button>

          {/* Profile / Auth trigger */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          ) : user ? (
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                alt={user.name}
                size="sm"
              />
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
