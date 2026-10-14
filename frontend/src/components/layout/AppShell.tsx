'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  user?: User | null;
  onNewPostClick?: () => void;
  showRightSidebar?: boolean;
  contentMaxWidth?: 'feed' | 'wide' | 'full';
}

export function AppShell({
  children,
  rightSidebar,
  user: propUser,
  onNewPostClick,
  showRightSidebar = true,
  contentMaxWidth = 'feed',
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, isLoading } = useAuth();

  const currentUser = propUser !== undefined ? propUser : authUser;

  // Auto-redirect to /onboarding if logged in but role is null
  useEffect(() => {
    if (!isLoading && authUser && authUser.role === null && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [isLoading, authUser, pathname, router]);

  const handleNewPost = onNewPostClick || (() => router.push('/posts/new'));

  const maxWidthClass =
    contentMaxWidth === 'wide'
      ? 'w-full max-w-5xl'
      : contentMaxWidth === 'full'
      ? 'w-full'
      : 'w-full max-w-[640px]';

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar user={currentUser} isLoading={isLoading} />

      {/* Main 3-Column Shell per DESIGN.md §6 */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 flex gap-6">
        {/* Sticky Left Nav: 240px wide, hidden < 1024px */}
        <Sidebar user={currentUser} isLoading={isLoading} onNewPostClick={handleNewPost} />

        {/* Center Feed Column: max 640px */}
        <main className="flex-1 min-w-0 py-6 pb-24 lg:pb-12 flex justify-start">
          <div className={maxWidthClass}>{children}</div>
        </main>

        {/* Sticky Right Rail: 320px wide, visible only ≥ 1280px */}
        {showRightSidebar && rightSidebar && (
          <aside className="hidden xl:block w-[320px] shrink-0 sticky top-[72px] h-[calc(100vh-4.5rem)] py-6 overflow-y-auto">
            {rightSidebar}
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation: hidden ≥ 1024px */}
      <BottomNav user={currentUser} isLoading={isLoading} onNewPostClick={handleNewPost} />
    </div>
  );
}
