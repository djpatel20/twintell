'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Building2,
  Bell,
  MessageSquare,
  User as UserIcon,
  Plus,
  LogIn,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Avatar } from '../ui/Avatar';
import { CompanyLogo } from '../ui/CompanyLogo';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  user?: User | null;
  isLoading?: boolean;
  onNewPostClick?: () => void;
}

export function Sidebar({ user, isLoading, onNewPostClick }: SidebarProps) {
  const pathname = usePathname();
  const [isMessagesActive, setIsMessagesActive] = useState(false);
  const isCompany = user?.role === 'COMPANY';
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMessagesActive(pathname === '/profile' && window.location.search.includes('tab=inquiries'));
    }
  }, [pathname]);

  const navItems = [
    { label: 'Home', href: '/', icon: Home, isActive: pathname === '/' },
    { label: 'Discover', href: '/discover', icon: Compass, isActive: pathname === '/discover' },
    { label: 'Directory', href: '/directory', icon: Building2, isActive: pathname === '/directory' },
    {
      label: 'Messages',
      href: user ? '/profile?tab=inquiries' : '/login',
      icon: MessageSquare,
      isActive: isMessagesActive,
    },
    {
      label: 'Notifications',
      href: user ? '/notifications' : '/login',
      icon: Bell,
      isActive: pathname === '/notifications',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined,
    },
    {
      label: 'Plans & Pricing',
      href: '/pricing',
      icon: Zap,
      isActive: pathname === '/pricing',
    },
    {
      label: 'Profile',
      href: user ? '/profile' : '/login',
      icon: UserIcon,
      isActive: pathname === '/profile' && !isMessagesActive,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-[72px] h-[calc(100vh-4.5rem)] bg-panel border-r border-line p-3 justify-between select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-120',
                  isActive
                    ? 'bg-cobalt-soft text-cobalt font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-panel-sunk'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-cobalt' : 'text-ink-muted'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="count">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Company New Post CTA (Primary button per DESIGN.md §6) */}
        {isCompany && (
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full font-medium"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onNewPostClick}
            >
              New post
            </Button>
          </div>
        )}
      </div>

      {/* Company Switcher / Profile Section at bottom per DESIGN.md §6 */}
      <div className="pt-3 border-t border-line">
        {isLoading ? (
          <div className="flex items-center gap-2.5 p-2">
            <div className="w-9 h-9 rounded-lg bg-panel-sunk animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-panel-sunk rounded w-3/4 animate-pulse" />
              <div className="h-2.5 bg-panel-sunk rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ) : user ? (
          isCompany && user.company ? (
            <Link
              href="/profile"
              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-panel-sunk transition-colors group"
              title="Switch or view company"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <CompanyLogo
                  src={user.company.logoUrl}
                  name={user.company.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate group-hover:text-cobalt">
                    {user.company.name}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {user.name}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-ink-faint group-hover:text-ink shrink-0" />
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-panel-sunk transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar
                  src={user.avatarUrl}
                  name={user.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate group-hover:text-cobalt">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {user.headline || 'Standard User'}
                  </p>
                </div>
              </div>
            </Link>
          )
        ) : (
          <Link href="/login" className="block">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Sign in / Register
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}
