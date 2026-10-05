'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { AppShell } from '../../components/layout/AppShell';
import { CompanyCard, DirectoryCompany } from '../../components/companies/CompanyCard';
import { ProductCard } from '../../components/products/ProductCard';
import { PostCard } from '../../components/feed/PostCard';
import { InquiryModal } from '../../components/products/InquiryModal';
import { Category, Product, Post } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  Compass,
  Search,
  Building2,
  Package,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Factory,
  Layers,
  Cpu,
  Boxes,
  Flame,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Inquiry Modal state
  const [inquiryTarget, setInquiryTarget] = useState<{
    companyId: string;
    companyName: string;
    productId?: string;
    productTitle?: string;
  } | null>(null);

  // 1. Fetch Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories'),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Trending Companies
  const { data: trendingCompaniesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['trending-companies-discover'],
    queryFn: () => api.get<{ data: DirectoryCompany[] }>('/api/companies/trending'),
    staleTime: 2 * 60 * 1000,
  });

  // 3. Fetch Featured Products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products-discover'],
    queryFn: () => api.get<{ data: Product[] }>('/api/products', { limit: 8 }),
    staleTime: 2 * 60 * 1000,
  });

  // 4. Fetch Trending Feed Posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['trending-posts-discover'],
    queryFn: () => api.get<{ data: Post[] }>('/api/feed', { tab: 'trending', limit: 4 }),
    staleTime: 2 * 60 * 1000,
  });

  const categories = categoriesData?.data || [];
  const trendingCompanies = trendingCompaniesData?.data || [];
  const products = productsData?.data || [];
  const posts = postsData?.data || [];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'manufacturing':
        return Factory;
      case 'textiles':
        return Layers;
      case 'packaging':
        return Boxes;
      case 'electronics':
        return Cpu;
      default:
        return Building2;
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Discover Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white p-6 sm:p-8 shadow-md">
          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold tracking-wide text-primary-100">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore B2B Ecosystem</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Source Products & Connect with Verified Manufacturers
            </h1>

            <p className="text-xs sm:text-sm text-primary-100 leading-relaxed">
              Explore thousands of verified suppliers, raw material providers, and direct-from-factory catalogues.
            </p>

            {/* Quick Hero Search Input */}
            <form onSubmit={handleHeroSearch} className="pt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'CNC machining', 'Cotton fabrics', 'Corrugated boxes'..."
                  className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none shadow-sm focus:ring-2 focus:ring-primary-300 transition-all"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="bg-white text-primary-700 hover:bg-primary-50 px-4 shrink-0 font-bold text-xs"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section 1: Browse by Industry Categories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary-600" />
                Industry Sectors
              </h2>
              <p className="text-xs text-slate-500">Explore companies and products by specialized sector</p>
            </div>
            <Link
              href="/directory"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              All Sectors <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoriesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card-base p-4 h-24 animate-pulse bg-slate-100" />
                ))
              : categories.slice(0, 8).map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <Link
                      key={cat.id}
                      href={`/directory?category=${cat.slug}`}
                      className="card-base p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="mt-3">
                        <h3 className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 group-hover:text-slate-500 transition-colors">
                          Browse directory
                        </p>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* Section 2: Trending & Verified Companies */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                Trending & Verified Suppliers
              </h2>
              <p className="text-xs text-slate-500">Top-rated businesses gaining traction on twintell</p>
            </div>
            <Link
              href="/directory"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {companiesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-base p-5 h-32 animate-pulse bg-slate-100" />
              ))
            ) : trendingCompanies.length > 0 ? (
              trendingCompanies.slice(0, 3).map((comp) => (
                <CompanyCard key={comp.id} company={comp} />
              ))
            ) : (
              <div className="card-base p-6 text-center text-xs text-slate-500">
                No trending companies found right now.
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Fresh B2B Products Catalog */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-600" />
                Featured Products & Materials
              </h2>
              <p className="text-xs text-slate-500">Recently listed catalog items ready for quotation</p>
            </div>
            <Link
              href="/search?type=products"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Browse All Products <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-base p-4 h-64 animate-pulse bg-slate-100" />
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
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
              ))
            ) : (
              <div className="col-span-full card-base p-8 text-center text-xs text-slate-500">
                No products listed yet. Check back soon!
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Industry Updates & Posts Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary-600" />
                Industry Updates & Discussions
              </h2>
              <p className="text-xs text-slate-500">Popular posts shared by manufacturing & trade leaders</p>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Full Feed <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {postsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card-base p-5 h-44 animate-pulse bg-slate-100" />
              ))
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="card-base p-6 text-center text-xs text-slate-500">
                No posts available at this moment.
              </div>
            )}
          </div>
        </section>
      </div>

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
    </AppShell>
  );
}
