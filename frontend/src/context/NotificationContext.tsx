'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { api } from '../lib/api-client';
import { getSocket, disconnectSocket } from '../lib/socket';
import { Notification, InquiryMessage } from '../types';
import Link from 'next/link';
import { Bell, Heart, UserPlus, X, MessageSquare } from 'lucide-react';

interface NotificationContextType {
  unreadCount: number;
  unreadMessagesCount: number;
  latestNotification: Notification | null;
  refreshUnreadCount: () => void;
  refreshUnreadMessagesCount: () => void;
  clearLatestNotification: () => void;
  clearChatMessageToast: () => void;
  markInquiryRead: (inquiryId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  unreadMessagesCount: 0,
  latestNotification: null,
  refreshUnreadCount: () => {},
  refreshUnreadMessagesCount: () => {},
  clearLatestNotification: () => {},
  clearChatMessageToast: () => {},
  markInquiryRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [chatMessageToast, setChatMessageToast] = useState<{
    inquiryId: string;
    senderName: string;
    content: string;
  } | null>(null);

  // 1. Fetch unread notification count
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ unreadCount: number }>('/api/notifications/unread-count'),
    enabled: !!user,
    staleTime: 30000,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  // 2. Fetch unread messages count for company / user
  const { data: unreadInquiriesData, refetch: refetchUnreadMessages } = useQuery({
    queryKey: ['inquiries', 'unread-count'],
    queryFn: () => api.get<{ unreadCount: number }>('/api/inquiries/unread-count'),
    enabled: !!user,
    staleTime: 15000,
    refetchInterval: 15000, // Periodic background sync
  });

  const unreadMessagesCount = unreadInquiriesData?.unreadCount ?? 0;

  const clearLatestNotification = useCallback(() => {
    setToastNotification(null);
  }, []);

  const clearChatMessageToast = useCallback(() => {
    setChatMessageToast(null);
  }, []);

  const markInquiryRead = useCallback(async (inquiryId: string) => {
    try {
      await api.patch(`/api/inquiries/${inquiryId}/read`);
      queryClient.setQueryData<{ unreadCount: number }>(
        ['inquiries', 'unread-count'],
        (old) => ({ unreadCount: Math.max(0, (old?.unreadCount ?? 1) - 1) })
      );
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['inquiries-list'] });
    } catch {
      // Ignore network failures
    }
  }, [queryClient]);

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

      // Handle real-time chat messages sent by any buyer/user to the company
      const handleNewInquiryMessage = (data: { inquiryId: string; message: any; inquiry?: any }) => {
        // If current user is the sender of this message, ignore it
        if (data.message?.senderId === user?.id) {
          return;
        }

        // Check if the user is currently viewing this exact thread in the messages screen
        const isViewingThread =
          typeof window !== 'undefined' &&
          window.location.pathname === '/messages' &&
          (new URLSearchParams(window.location.search).get('inquiryId') === data.inquiryId ||
            window.location.href.includes(data.inquiryId));

        if (isViewingThread) {
          // Auto mark as read on backend since user is actively in the chat
          api.patch(`/api/inquiries/${data.inquiryId}/read`).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ['inquiry-thread', data.inquiryId] });
          queryClient.invalidateQueries({ queryKey: ['inquiries-list'] });
          return;
        }

        // Otherwise (user is on another screen or viewing another inquiry):
        queryClient.setQueryData<{ unreadCount: number }>(
          ['inquiries', 'unread-count'],
          (old) => ({ unreadCount: (old?.unreadCount ?? 0) + 1 })
        );

        // Invalidate inquiries cache so open lists stay fresh
        queryClient.invalidateQueries({ queryKey: ['inquiries-list'] });
        queryClient.invalidateQueries({ queryKey: ['inquiry-thread', data.inquiryId] });

        // Show instant chat toast alert on whatever screen the user/company is on
        const senderName = data.message?.sender?.name || 'Prospective Buyer';
        setChatMessageToast({
          inquiryId: data.inquiryId,
          senderName,
          content: data.message?.content || 'Sent you an inquiry message',
        });

        setTimeout(() => {
          setChatMessageToast((current) => (current?.inquiryId === data.inquiryId ? null : current));
        }, 6000);
      };

      socket.on('inquiry:message', handleNewInquiryMessage);

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('inquiry:message', handleNewInquiryMessage);
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
        unreadMessagesCount,
        latestNotification: toastNotification,
        refreshUnreadCount: () => refetchUnreadCount(),
        refreshUnreadMessagesCount: () => refetchUnreadMessages(),
        clearLatestNotification,
        clearChatMessageToast,
        markInquiryRead,
      }}
    >
      {children}

      {/* Real-time Chat Message Toast Alert */}
      {chatMessageToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-xl border border-primary-200 p-4 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-indigo-600" />
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-primary-600" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <Link
                href={`/messages?inquiryId=${chatMessageToast.inquiryId}`}
                onClick={() => {
                  clearChatMessageToast();
                  queryClient.setQueryData<{ unreadCount: number }>(
                    ['inquiries', 'unread-count'],
                    (old) => ({ unreadCount: Math.max(0, (old?.unreadCount ?? 1) - 1) })
                  );
                }}
                className="block hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                    New Message
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {chatMessageToast.senderName}
                </p>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {chatMessageToast.content}
                </p>
              </Link>
            </div>

            <button
              onClick={clearChatMessageToast}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Dismiss chat alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
