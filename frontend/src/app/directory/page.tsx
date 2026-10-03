'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { Category } from '../../types';
import { AppShell } from '../../components/layout/AppShell';
import { CompanyCard, DirectoryCompany } from '../../components/companies/CompanyCard';
import { TopicChip } from '../../components/ui/TopicChip';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Building2,
  Search,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function DirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cityInput, setCityInput] = useState<string>('');
  const [activeCity, setActiveCity] = useState<string>('');

  // 1. Fetch Categories for filter chips
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories'),
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData?.data || [];

  // 2. Fetch Directory Companies with Infinite Scroll
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
    queryKey: ['directory-companies', selectedCategory, activeCity],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (activeCity) {
        params.city = activeCity;
      }
      if (pageParam) {
        params.cursor = pageParam;
      }
      return api.get<{ data: DirectoryCompany[]; nextCursor: string | null }>('/api/companies', params);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 60000,
  });

  const allCompanies = data?.pages.flatMap((page) => page.data) ?? [];

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCity(cityInput.trim());
  };

  const handleClearCity = () => {
    setCityInput('');
    setActiveCity('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-card p-6 sm:p-8 text-white shadow-soft">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary-200" />
              <span>Verified Indian B2B Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Verified Business Directory
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Discover, connect, and collaborate with verified manufacturers, industrial suppliers, wholesalers, and exporters across India.
            </p>
          </div>

          {/* Search Bar for City */}
          <form onSubmit={handleCitySearch} className="mt-6 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Filter by city (e.g. Ahmedabad, Surat, Pune)..."
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              {cityInput && (
                <button
                  type="button"
                  onClick={handleClearCity}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="md"
              className="bg-white text-primary-700 hover:bg-slate-100 border-none font-bold shrink-0"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search
            </Button>
          </form>
        </div>

        {/* Category Filters Carousel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Filter by Industry</span>
            {activeCity && (
              <span className="text-primary-600 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Filtered by: {activeCity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <TopicChip
              label="All Industries"
              isSelected={selectedCategory === 'ALL'}
              onClick={() => setSelectedCategory('ALL')}
            />
            {categories.map((cat) => (
              <TopicChip
                key={cat.id}
                label={cat.name}
                isSelected={selectedCategory === cat.slug || selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
              />
            ))}
          </div>
        </div>

        {/* Directory Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-base p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Failed to load directory</h3>
            <p className="text-xs text-rose-600">
              {(error as Error)?.message || 'Unable to connect to the directory service.'}
            </p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : allCompanies.length === 0 ? (
          <EmptyState
            title="No companies found"
            description="We couldn't find any companies matching your selected filters. Try broadening your category or clearing city search."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory('ALL');
              handleClearCity();
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

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
                      Loading more companies...
                    </>
                  ) : (
                    'Load More Companies'
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
