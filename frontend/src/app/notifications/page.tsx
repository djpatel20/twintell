'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../lib/api-client';
import { Notification } from '../../types';
import {
  Bell,
  Heart,
  UserPlus,
  CheckCheck,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch paginated notifications
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications', filter],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = {
        limit: 20,
        unreadOnly: filter === 'unread',
      };
      if (pageParam) {
        params.cursor = pageParam;
      }
      return api.get<{ data: Notification[]; nextCursor: string | null }>(
        '/api/notifications',
        params
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!user,
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refreshUnreadCount();
    },
  });

  // Mark single as read mutation
  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refreshUnreadCount();
    },
  });

  const allNotifications = data?.pages.flatMap((page) => page.data) ?? [];
  const unreadCountOnPage = allNotifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markSingleReadMutation.mutate(notification.id);
    }
  };

  if (!isAuthLoading && !user) {
    return (
      <AppShell showRightSidebar={false}>
        <div className="bg-white rounded-card p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Sign in to view notifications</h2>
          <p className="text-xs text-slate-500">
            You must be logged in to see likes on your posts and new followers of your company.
          </p>
          <Link href="/login" className="inline-block">
            <Button size="md">Sign In</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showRightSidebar={false}>
      <div className="space-y-4">
        {/* Header card */}
        <div className="bg-white rounded-card p-5 border border-slate-200 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                  <Bell className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h1>
              </div>
              <p className="text-xs text-slate-500">
                Live updates when other businesses and professionals follow you or like your posts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending || unreadCountOnPage === 0}
                leftIcon={<CheckCheck className="w-4 h-4" />}
                className="text-xs"
              >
                Mark all as read
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setFilter('all')}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                filter === 'all'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
                filter === 'unread'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <span>Unread</span>
              {unreadCountOnPage > 0 && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                    filter === 'unread' ? 'bg-white text-primary-600' : 'bg-rose-500 text-white'
                  )}
                >
                  {unreadCountOnPage}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-card p-4 border border-slate-200 animate-pulse flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-3 bg-slate-200 rounded" />
                  <div className="w-2/3 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-6 text-center space-y-2">
            <p className="text-xs font-semibold text-rose-800">
              Failed to load notifications. Please check backend connection.
            </p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : allNotifications.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? "You are completely caught up! We will notify you instantly when there is any new activity."
                : 'When users follow your company or like your updates, notifications will appear here in real-time.'
            }
            actionLabel={filter === 'unread' ? 'View All Notifications' : 'Explore Feed'}
            onAction={() => {
              if (filter === 'unread') {
                setFilter('all');
              } else {
                window.location.href = '/';
              }
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {allNotifications.map((notification) => {
              const actorName =
                notification.actor.company?.name || notification.actor.name;
              const actorAvatar =
                notification.actor.company?.logoUrl || notification.actor.avatarUrl;
              const actorLink = notification.actor.company?.slug
                ? `/companies/${notification.actor.company.slug}`
                : `/profile`;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={clsx(
                    'rounded-card p-4 border transition-all flex items-start gap-3.5 group cursor-pointer relative',
                    notification.isRead
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-primary-50/40 border-primary-200/70 hover:border-primary-300 shadow-sm'
                  )}
                >
                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary-500 rounded-full ring-4 ring-primary-100" />
                  )}

                  {/* Actor Avatar with Action Icon Badge */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={actorAvatar || undefined}
                      name={actorName}
                      size="md"
                    />
                    <div
                      className={clsx(
                        'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white ring-2 ring-white shadow-sm',
                        notification.type === 'LIKE' ? 'bg-rose-500' : 'bg-primary-500'
                      )}
                    >
                      {notification.type === 'LIKE' ? (
                        <Heart className="w-3 h-3 fill-white" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs sm:text-sm text-slate-800 leading-snug">
                      <Link
                        href={actorLink}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-slate-900 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                      >
                        {actorName}
                      </Link>{' '}
                      {notification.type === 'LIKE' ? (
                        <span>
                          liked your post
                          {notification.post?.content ? (
                            <span className="text-slate-500 italic ml-1">
                              "{notification.post.content.slice(0, 60)}
                              {notification.post.content.length > 60 ? '...' : ''}"
                            </span>
                          ) : (
                            '.'
                          )}
                        </span>
                      ) : (
                        <span>started following your company profile.</span>
                      )}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                      {notification.type === 'FOLLOW' && notification.actor.company?.slug && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/companies/${notification.actor.company.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-600 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <span>View Company</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
