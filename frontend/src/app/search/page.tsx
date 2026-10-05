'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { AppShell } from '../../components/layout/AppShell';
import { CompanyCard, DirectoryCompany } from '../../components/companies/CompanyCard';
import { ProductCard } from '../../components/products/ProductCard';
import { PostCard } from '../../components/feed/PostCard';
import { InquiryModal } from '../../components/products/InquiryModal';
import { Product, Post } from '../../types';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Search,
  Building2,
  Package,
  FileText,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SearchResponse {
  data: {
    query: string;
    type: 'all' | 'companies' | 'products' | 'posts';
    totalResults: number;
    companies: DirectoryCompany[];
    products: Product[];
    posts: Post[];
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as 'all' | 'companies' | 'products' | 'posts') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'companies' | 'products' | 'posts'>(initialType);

  // Inquiry Modal state
  const [inquiryTarget, setInquiryTarget] = useState<{
    companyId: string;
    companyName: string;
    productId?: string;
    productTitle?: string;
  } | null>(null);

  // Keep local search term synced if URL changes
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    if (activeType !== 'all') params.set('type', activeType);
    router.push(`/search?${params.toString()}`);
  };

  const handleTypeChange = (type: 'all' | 'companies' | 'products' | 'posts') => {
    setActiveType(type);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (type !== 'all') params.set('type', type);
    router.push(`/search?${params.toString()}`);
  };

  // Fetch search results
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['search', initialQuery, activeType],
    queryFn: async () => {
      if (!initialQuery.trim()) {
        return null;
      }
      return api.get<SearchResponse>('/api/search', {
        q: initialQuery.trim(),
        type: activeType,
        limit: 20,
      });
    },
    enabled: initialQuery.trim().length > 0,
    staleTime: 60 * 1000,
  });

  const searchData = data?.data;
  const companies = searchData?.companies || [];
  const products = searchData?.products || [];
  const posts = searchData?.posts || [];
  const totalResults = (companies.length || 0) + (products.length || 0) + (posts.length || 0);

  const suggestedQueries = [
    'Sigma Solve',
    'Packaging',
    'Textiles',
    'Steel',
    'Electronics',
    'Chemicals',
  ];

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="card-base p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies, products, materials, or updates..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="shrink-0 px-5">
            Search
          </Button>
        </form>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleTypeChange('all')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeType === 'all'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            All Results
            {searchData && initialQuery && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">
                {totalResults}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('companies')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeType === 'companies'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Companies
            {searchData && initialQuery && (
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {companies.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('products')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeType === 'products'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Products
            {searchData && initialQuery && (
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {products.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('posts')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeType === 'posts'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Posts
            {searchData && initialQuery && (
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {posts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Suggested Search Terms if no query yet */}
      {!initialQuery && (
        <div className="card-base p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Discover B2B Opportunities</h2>
            <p className="text-xs text-slate-500 mt-1">
              Find verified suppliers, wholesale products, and industry insights in one place.
            </p>
          </div>
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 mb-2">Try searching for:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {suggestedQueries.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchTerm(term);
                    router.push(`/search?q=${encodeURIComponent(term)}`);
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-600 text-slate-600 text-xs font-medium transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Shimmer */}
      {isLoading && initialQuery && (
        <div className="card-base p-12 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Searching twintell network...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="card-base p-8 text-center space-y-3">
          <p className="text-sm font-bold text-red-600">Search error</p>
          <p className="text-xs text-slate-500">{(error as any)?.message || 'Failed to fetch search results.'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Results View */}
      {!isLoading && initialQuery && searchData && (
        <div className="space-y-6">
          {totalResults === 0 ? (
            <EmptyState
              title={`No results found for "${initialQuery}"`}
              description="Try adjusting your keywords, checking for typos, or switching filter categories."
              icon={<Search className="w-6 h-6" />}
              actionLabel="Clear Search"
              onAction={() => {
                setSearchTerm('');
                router.push('/search');
              }}
            />
          ) : (
            <>
              {/* Companies Section */}
              {(activeType === 'all' || activeType === 'companies') && companies.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-500" />
                      Companies ({companies.length})
                    </h2>
                    {activeType === 'all' && companies.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('companies')}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(activeType === 'all' ? companies.slice(0, 3) : companies).map((comp) => (
                      <CompanyCard key={comp.id} company={comp} />
                    ))}
                  </div>
                </section>
              )}

              {/* Products Section */}
              {(activeType === 'all' || activeType === 'products') && products.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary-500" />
                      Products ({products.length})
                    </h2>
                    {activeType === 'all' && products.length > 4 && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('products')}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(activeType === 'all' ? products.slice(0, 4) : products).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onInquireClick={() =>
                          setInquiryTarget({
                            companyId: product.companyId,
                            companyName: product.company?.name || 'Company',
                            productId: product.id,
                            productTitle: product.title,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Posts Section */}
              {(activeType === 'all' || activeType === 'posts') && posts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      Posts & Updates ({posts.length})
                    </h2>
                    {activeType === 'all' && posts.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('posts')}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(activeType === 'all' ? posts.slice(0, 3) : posts).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Inquiry Modal */}
      {inquiryTarget && (
        <InquiryModal
          isOpen={!!inquiryTarget}
          onClose={() => setInquiryTarget(null)}
          companyId={inquiryTarget.companyId}
          companyName={inquiryTarget.companyName}
          productId={inquiryTarget.productId}
          productTitle={inquiryTarget.productTitle}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="card-base p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Loading search...</p>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </AppShell>
  );
}
