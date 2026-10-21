'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Compass, Search, Home, Building2, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <AppShell showRightSidebar={false}>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-lg mx-auto">
        {/* Animated Badge / Icon */}
        <div className="w-16 h-16 rounded-2xl bg-cobalt-soft flex items-center justify-center text-cobalt mb-6 shadow-sm border border-cobalt/15">
          <Compass className="w-8 h-8 animate-[spin_12s_linear_infinite]" />
        </div>

        {/* 404 Badge */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-600 mb-3">
          404 Error
        </span>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          The page, company, or product you are looking for doesn't exist, has been removed, or the link might be broken.
        </p>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearch} className="w-full mb-8 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies, products, or updates..."
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-white border border-line rounded-xl text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10 shadow-sm"
          />
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-cobalt hover:bg-cobalt-dark text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full sm:w-auto font-medium"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Home Feed
            </Button>
          </Link>
          <Link href="/directory" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto font-medium"
              leftIcon={<Building2 className="w-4 h-4" />}
            >
              Browse Directory
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
