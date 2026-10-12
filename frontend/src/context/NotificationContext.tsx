'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { api } from '../lib/api-client';
import { getSocket, disconnectSocket } from '../lib/socket';
import { Notification } from '../types';
import Link from 'next/link';
import { Bell, Heart, UserPlus, X } from 'lucide-react';

interface NotificationContextType {
  unreadCount: number;
  latestNotification: Notification | null;
  refreshUnreadCount: () => void;
  clearLatestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  latestNotification: null,
  refreshUnreadCount: () => {},
  clearLatestNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  // Fetch unread count for authenticated user
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ unreadCount: number }>('/api/notifications/unread-count'),
    enabled: !!user,
    staleTime: 30000,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  const clearLatestNotification = useCallback(() => {
    setToastNotification(null);
  }, []);

  // Socket connection for real-time notification events
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    let isMounted = true;

    async function setupSocket() {
      const socket = await getSocket();
      if (!isMounted) return;

      socket.connect();

      const handleNewNotification = (notification: Notification) => {
        // Increment unread count in React Query cache
        queryClient.setQueryData<{ unreadCount: number }>(
          ['notifications', 'unread-count'],
          (old) => ({ unreadCount: (old?.unreadCount ?? 0) + 1 })
        );

        // Invalidate notifications list query
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Show real-time toast alert
        setToastNotification(notification);

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setToastNotification((current) => (current?.id === notification.id ? null : current));
        }, 5000);
      };

      socket.on('notification:new', handleNewNotification);

      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }

    setupSocket();

    return () => {
      isMounted = false;
    };
  }, [user, queryClient]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        latestNotification: toastNotification,
        refreshUnreadCount: () => refetchUnreadCount(),
        clearLatestNotification,
      }}
    >
      {children}

      {/* Real-time Toast Alert */}
      {toastNotification && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 p-4 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 shrink-0 mt-0.5">
              {toastNotification.type === 'LIKE' ? (
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              ) : (
                <UserPlus className="w-5 h-5 text-primary-600" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <Link
                href="/notifications"
                onClick={clearLatestNotification}
                className="block hover:opacity-90 transition-opacity"
              >
                <p className="text-xs font-bold text-slate-800">
                  {toastNotification.type === 'LIKE'
                    ? 'New Post Like'
                    : 'New Company Follower'}
                </p>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  <span className="font-semibold text-slate-900">
                    {toastNotification.actor.company?.name || toastNotification.actor.name}
                  </span>{' '}
                  {toastNotification.type === 'LIKE'
                    ? 'liked your post.'
                    : 'started following your company.'}
                </p>
              </Link>
            </div>

            <button
              onClick={clearLatestNotification}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
