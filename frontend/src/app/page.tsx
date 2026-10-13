'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { Tabs } from '../components/ui/Tabs';
import { TopicChip } from '../components/ui/TopicChip';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/Badge';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PostCard } from '../components/feed/PostCard';
import { CreatePostBox } from '../components/feed/CreatePostBox';
import { api } from '../lib/api-client';
import { Post, Company } from '../types';
import {
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [selectedTopic, setSelectedTopic] = useState('ALL');

  const feedTabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
  ];

  const topics = [
    { id: 'ALL', label: 'All' },
    { id: 'MANUFACTURING', label: 'Manufacturing' },
    { id: 'BUSINESS_NEWS', label: 'Business News' },
    { id: 'PRODUCTS', label: 'Products' },
    { id: 'WHOLESALE', label: 'Wholesale' },
    { id: 'D2C_BRANDS', label: 'D2C / Brands' },
    { id: 'TECHNOLOGY', label: 'Technology' },
    { id: 'AGRICULTURE', label: 'Agriculture' },
  ];

  // Fetch Infinite Feed from Backend API
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', activeTab, selectedTopic],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = {
        tab: activeTab,
      };
      if (selectedTopic !== 'ALL') {
        params.topic = selectedTopic;
      }
      if (pageParam) {
        params.cursor = pageParam;
      }
      return api.get<{ data: Post[]; nextCursor: string | null }>('/api/feed', params);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 60000,
  });

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <AppShell showRightSidebar={false}>
      <div className="space-y-4">
        {/* Welcome Banner Card */}
        <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-card p-5 border border-primary-100 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-primary-600 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>twintell Platform • Realtime Feed</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Connect. Discover. Grow.
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                The B2B Social Network + Business Directory for verified companies, suppliers, and procurement teams.
              </p>
            </div>
            {!authLoading && !user ? (
              <div className="hidden sm:block">
                <Link href="/login">
                  <Button size="md" className="shadow-md">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : user ? (
              <div className="hidden sm:block">
                <Link href="/profile?tab=inquiries">
                  <Button
                    size="md"
                    className="shadow-md font-bold"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    Open Chats
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Create Post Section (for COMPANY role) */}
        <CreatePostBox />

        {/* Feed Header Tabs: For You / Following + Messages Quick Trigger */}
        <div className="bg-white rounded-card p-3 border border-slate-200 shadow-soft flex items-center justify-between gap-2">
          <Tabs
            tabs={feedTabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            variant="pill"
          />
          <div className="flex items-center gap-2">
            <Link href={user ? '/profile?tab=inquiries' : '/login'}>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-lg border border-slate-200 transition-colors"
                title="Open Messages & Chats"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
                <span>Messages</span>
              </button>
            </Link>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Topic Filter Chips Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {topics.map((topic) => (
            <TopicChip
              key={topic.id}
              label={topic.label}
              isSelected={selectedTopic === topic.id}
              onClick={() => setSelectedTopic(topic.id)}
            />
          ))}
        </div>

        {/* Feed Content Area */}
        {isLoading ? (
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : isError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Failed to load feed</h3>
            <p className="text-xs text-rose-600">
              {(error as Error)?.message || 'Unable to connect to the backend server. Please make sure the backend is running.'}
            </p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : allPosts.length === 0 ? (
          <EmptyState
            title="No posts found"
            description={
              activeTab === 'following'
                ? "You haven't followed any companies yet. Explore the directory or follow trending companies to see their updates here!"
                : `There are currently no updates in the "${topics.find((t) => t.id === selectedTopic)?.label}" category.`
            }
            actionLabel={selectedTopic !== 'ALL' ? 'Show All Posts' : 'Explore Directory'}
            onAction={() => {
              if (selectedTopic !== 'ALL') {
                setSelectedTopic('ALL');
              } else {
                window.location.href = '/directory';
              }
            }}
          />
        ) : (
          <div className="space-y-4">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full sm:w-auto px-6"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading more updates...
                    </>
                  ) : (
                    'Load More Updates'
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
