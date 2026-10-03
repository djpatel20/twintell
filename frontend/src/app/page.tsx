'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
  TrendingUp,
  Building2,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'trending'>('for-you');
  const [selectedTopic, setSelectedTopic] = useState('ALL');

  const feedTabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'trending', label: 'Trending' },
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

  // Fetch Trending Companies for the Right Sidebar
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending-companies'],
    queryFn: () => api.get<{ data: Company[] }>('/api/companies/trending?limit=5'),
    staleTime: 60000,
  });

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  // Right sidebar content: Dynamic Trending Companies & Quick Directory Highlights
  const trendingSidebar = (
    <div className="space-y-6">
      {/* Trending Companies Card */}
      <div className="bg-white rounded-card p-4 border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slate-800">Trending Companies</h3>
          </div>
          <Link href="/directory" className="text-xs font-semibold text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>

        {isTrendingLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="w-24 h-3 bg-slate-200 rounded" />
                    <div className="w-16 h-2 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {trendingData?.data && trendingData.data.length > 0 ? (
              trendingData.data.map((company) => (
                <div key={company.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/companies/${company.slug}`}
                    className="flex items-center gap-2.5 min-w-0 group"
                  >
                    <Avatar
                      name={company.name}
                      src={company.logoUrl || undefined}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
                          {company.name}
                        </p>
                        {company.verified && <VerifiedBadge showLabel={false} />}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {company.businessType} • {company.city}
                      </p>
                    </div>
                  </Link>
                  <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5 shrink-0">
                    Follow
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-2">No companies found</p>
            )}
          </div>
        )}
      </div>

      {/* Directory Quick Banner */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-card p-5 text-white shadow-soft">
        <Building2 className="w-6 h-6 text-white/90 mb-2" />
        <h4 className="text-sm font-bold">Verified Business Directory</h4>
        <p className="text-xs text-white/80 mt-1">
          Explore thousands of verified Indian manufacturers and B2B suppliers.
        </p>
        <Link href="/directory" className="inline-block mt-3">
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-primary-600 hover:bg-slate-100 border-none font-bold"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Explore Directory
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <AppShell rightSidebar={trendingSidebar}>
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
            <div className="hidden sm:block">
              <Link href="/login">
                <Button size="md" className="shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Create Post Section (for COMPANY role) */}
        <CreatePostBox />

        {/* Feed Header Tabs: For You / Following / Trending */}
        <div className="bg-white rounded-card p-3 border border-slate-200 shadow-soft flex items-center justify-between gap-2">
          <Tabs
            tabs={feedTabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            variant="pill"
          />
          <button
            onClick={() => refetch()}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
