'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { TopicChip } from '../components/ui/TopicChip';
import { Button } from '../components/ui/Button';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PostCard } from '../components/feed/PostCard';
import { CreatePostBox } from '../components/feed/CreatePostBox';
import { PersonalWelcomeStrip } from '../components/feed/PersonalWelcomeStrip';
import { NewPostsPill } from '../components/feed/NewPostsPill';
import { RightRail } from '../components/feed/RightRail';
import { SponsoredAdCard } from '../components/feed/SponsoredAdCard';
import { api } from '../lib/api-client';
import { Post, SponsoredAd } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { STATIC_CATEGORIES } from '../constants/categories';

const FILTER_CATEGORIES = [
  { id: 'ALL', label: 'All Industries' },
  ...STATIC_CATEGORIES.map((c) => ({ id: c.slug, label: c.name })),
];

const FEED_TABS = [
  { id: 'for-you', label: 'For You' },
  { id: 'following', label: 'Following' },
];

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [showNewPill, setShowNewPill] = useState(false);

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
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['feed', activeTab, selectedTopic],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = {
        tab: activeTab,
      };
      if (selectedTopic !== 'ALL') {
        params.category = selectedTopic;
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

  // Fetch active sponsored ads
  const { data: adsData } = useQuery({
    queryKey: ['active-in-feed-ads'],
    queryFn: () => api.get<{ data: SponsoredAd[] }>('/api/feed/ads'),
    staleTime: 60000,
  });

  const activeAds = adsData?.data || [];
  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  const handleRefreshFeed = async () => {
    setShowNewPill(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await refetch();
  };

  const selectedCategoryObj = FILTER_CATEGORIES.find((t) => t.id === selectedTopic);

  return (
    <AppShell showRightSidebar={true} rightSidebar={<RightRail />}>
      <div className="space-y-3">
        {/* New posts pill sliding down when active per DESIGN.md §7 & §9 */}
        <NewPostsPill
          visible={showNewPill}
          onClick={handleRefreshFeed}
        />

        {/* 1. Compact Personal Welcome Strip per DESIGN.md §6 */}
        <PersonalWelcomeStrip user={user} isLoading={authLoading} />

        {/* 2. Composer (for COMPANY users) */}
        <CreatePostBox />

        {/* 3. Feed Control Bar: Segmented Tabs & Refresh */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <SegmentedControl
            options={FEED_TABS}
            value={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            size="md"
          />

          <button
            type="button"
            onClick={handleRefreshFeed}
            disabled={isRefetching}
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-panel-sunk rounded-lg transition-colors border border-line"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-cobalt' : ''}`} />
          </button>
        </div>

        {/* 4. Category Filter Chips with Edge Fade Masks & Hidden Scrollbars per DESIGN.md §7 */}
        <div className="relative w-full">
          {/* Left edge fade mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface to-transparent z-10" />

          {/* Chips container */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
            {FILTER_CATEGORIES.map((cat) => (
              <TopicChip
                key={cat.id}
                topicId={cat.id}
                label={cat.label}
                isSelected={selectedTopic === cat.id}
                onClick={() => setSelectedTopic(cat.id)}
              />
            ))}
          </div>

          {/* Right edge fade mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface to-transparent z-10" />
        </div>

        {/* 5. Feed Content Area */}
        {isLoading ? (
          <div className="space-y-3 pt-1">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : isError ? (
          <div className="card-base p-6 bg-panel border-line text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red mx-auto" />
            <h3 className="text-sm font-semibold text-ink">Couldn&apos;t load the feed</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Check your connection and retry. If the problem persists, our trade floor servers may be updating.
            </p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : allPosts.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'following'
                ? 'No updates from companies you follow yet'
                : `No posts in ${selectedCategoryObj?.label || 'this category'} yet`
            }
            description={
              activeTab === 'following'
                ? 'Follow verified manufacturers and suppliers in the directory to see their product updates and announcements here.'
                : 'Follow verified companies in the directory to fill this feed, or be the first to post an update.'
            }
            actionLabel={selectedTopic !== 'ALL' ? 'Show all categories' : 'Explore directory'}
            onAction={() => {
              if (selectedTopic !== 'ALL') {
                setSelectedTopic('ALL');
              } else {
                window.location.href = '/directory';
              }
            }}
          />
        ) : (
          <div className="space-y-3 pt-1">
            {allPosts.map((post, idx) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} />
                {idx === 2 && activeAds.length > 0 && (
                  <SponsoredAdCard ad={activeAds[0]} />
                )}
                {idx === 6 && activeAds.length > 1 && (
                  <SponsoredAdCard ad={activeAds[1]} />
                )}
              </React.Fragment>
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchNextPage()}
                  isLoading={isFetchingNextPage}
                  className="w-full sm:w-auto px-6"
                >
                  Load more updates
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
