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
}

export function AppShell({
  children,
  rightSidebar,
  user: propUser,
  onNewPostClick,
  showRightSidebar = true,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar user={currentUser} />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Left Sidebar */}
        <Sidebar user={currentUser} onNewPostClick={onNewPostClick} />

        {/* Center Main Content Area (Max feed ~680px on desktop) */}
        <main className="flex-1 min-w-0 flex justify-center px-2 sm:px-4 py-4 sm:py-6 pb-20 lg:pb-8">
          <div className="w-full max-w-feed">{children}</div>
        </main>

        {/* Desktop Right Sidebar (Trending companies / widgets) */}
        {showRightSidebar && (
          <aside className="hidden xl:block w-80 shrink-0 p-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            {rightSidebar}
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav user={currentUser} onNewPostClick={onNewPostClick} />
    </div>
  );
}
