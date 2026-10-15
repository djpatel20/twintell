'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Company, TopSector } from '../../types';
import { CompanyLogo } from '../ui/CompanyLogo';
import { VerifiedBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Check,
  TrendingUp,
} from 'lucide-react';

export function RightRail() {
  const router = useRouter();
  const { user, company, role } = useAuth();
  const queryClient = useQueryClient();
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  const isCompany = role === 'COMPANY' && company;

  // Fetch REAL trending companies from the backend
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending-companies'],
    queryFn: () => api.get<{ data: Company[] }>('/api/companies/trending?limit=6'),
    staleTime: 60000,
  });

  const realCompanies = (trendingData?.data || [])
    .filter((c) => c.id !== company?.id)
    .slice(0, 4);

  const handleFollowToggle = async (targetCompany: Company) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const currentlyFollowing =
      followState[targetCompany.id] !== undefined
        ? followState[targetCompany.id]
        : Boolean(targetCompany.isFollowing);

    // Optimistic UI update
    setFollowState((prev) => ({
      ...prev,
      [targetCompany.id]: !currentlyFollowing,
    }));

    try {
      if (currentlyFollowing) {
        await api.delete(`/api/companies/${targetCompany.id}/follow`);
      } else {
        await api.post(`/api/companies/${targetCompany.id}/follow`);
      }
      queryClient.invalidateQueries({ queryKey: ['trending-companies'] });
    } catch {
      // Revert on error
      setFollowState((prev) => ({
        ...prev,
        [targetCompany.id]: currentlyFollowing,
      }));
    }
  };

  // Fetch REAL active trade sectors from database
  const { data: sectorsData, isLoading: isSectorsLoading } = useQuery({
    queryKey: ['top-sectors'],
    queryFn: () => api.get<{ data: TopSector[] }>('/api/categories/top-sectors?limit=5'),
    staleTime: 60000,
  });

  const topSectors = sectorsData?.data || [];

  return (
    <div className="w-[320px] space-y-4 text-ink select-none">
      {/* 1. Your Company Card */}
      {isCompany ? (
        <div className="card-base p-4 bg-panel border-line space-y-3">
          <div className="flex items-center gap-3">
            <CompanyLogo
              name={company.name}
              src={company.logoUrl || undefined}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/companies/${company.slug}`}
                  className="text-sm font-semibold text-ink hover:text-cobalt transition-colors truncate"
                >
                  {company.name}
                </Link>
                {company.verified ? (
                  <VerifiedBadge />
                ) : (
                  <span className="text-[11px] text-amber font-medium">Pending verification</span>
                )}
              </div>
              <p className="text-xs text-ink-muted truncate">
                {company.businessType} • {company.city}
              </p>
            </div>
          </div>

          {/* Profile Completeness Bar */}
          <div className="space-y-1.5 pt-1 border-t border-line">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Profile completeness</span>
              <span className="font-semibold text-ink tabular-nums">
                {company.gstin && company.verified ? '100%' : '75%'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-panel-sunk rounded-full overflow-hidden">
              <div
                className="h-full bg-cobalt rounded-full transition-all duration-300"
                style={{ width: company.gstin && company.verified ? '100%' : '75%' }}
              />
            </div>
            {company.gstin && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GSTIN Verified: {company.gstin}</span>
              </p>
            )}
          </div>

          <div className="pt-1">
            <Link href="/profile">
              <Button variant="secondary" size="sm" className="w-full">
                Edit profile & GSTIN
              </Button>
            </Link>
          </div>
        </div>
      ) : user ? (
        /* Standard User Prompt */
        <div className="card-base p-4 bg-panel border-line space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cobalt" />
            <h3 className="text-sm font-semibold text-ink">List your business</h3>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Register your manufacturing or wholesale business with your GSTIN to get automatically verified and connect with verified buyers.
          </p>
          <Link href="/onboarding">
            <Button variant="secondary" size="sm" className="w-full">
              Register company
            </Button>
          </Link>
        </div>
      ) : (
        /* Unauthenticated Prompt */
        <div className="card-base p-4 bg-panel border-line space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green" />
            <h3 className="text-sm font-semibold text-ink">Verified trade floor</h3>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Join verified Indian manufacturers, suppliers, and procurement teams.
          </p>
          <Link href="/signup">
            <Button variant="primary" size="sm" className="w-full">
              Join Twintell
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Suppliers to Follow (REAL COMPANIES from Database) */}
      <div className="card-base p-4 bg-panel border-line space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Suppliers to follow</h3>
          <Link
            href="/directory"
            className="text-xs text-ink-muted hover:text-cobalt font-medium inline-flex items-center gap-0.5"
          >
            <span>Directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isTrendingLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2 animate-pulse">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-[6px] bg-panel-sunk" />
                  <div className="space-y-1 flex-1">
                    <div className="w-24 h-3 bg-panel-sunk rounded" />
                    <div className="w-16 h-2.5 bg-panel-sunk rounded" />
                  </div>
                </div>
                <div className="w-14 h-7 bg-panel-sunk rounded-lg" />
              </div>
            ))}
          </div>
        ) : realCompanies.length === 0 ? (
          <p className="text-xs text-ink-muted py-2">
            Explore the directory to discover and follow verified manufacturers.
          </p>
        ) : (
          <div className="space-y-3">
            {realCompanies.map((sup) => {
              const isFollowing =
                followState[sup.id] !== undefined
                  ? followState[sup.id]
                  : Boolean(sup.isFollowing);

              return (
                <div key={sup.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Link href={`/companies/${sup.slug}`} className="shrink-0">
                      <CompanyLogo
                        name={sup.name}
                        src={sup.logoUrl}
                        size="sm"
                      />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/companies/${sup.slug}`}
                          className="text-xs font-semibold text-ink hover:text-cobalt truncate"
                        >
                          {sup.name}
                        </Link>
                        {sup.verified && <VerifiedBadge showLabel={false} />}
                      </div>
                      <p className="text-[11px] text-ink-muted truncate">
                        {sup.businessType} • {sup.city}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className={
                      isFollowing
                        ? 'text-xs h-7 px-2 bg-cobalt-soft text-cobalt border-cobalt/20'
                        : 'text-xs h-7 px-2.5'
                    }
                    onClick={() => handleFollowToggle(sup)}
                  >
                    {isFollowing ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Following
                      </span>
                    ) : (
                      'Follow'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Active Trade Sectors (100% Real Database Metrics) */}
      <div className="card-base p-4 bg-panel border-line space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-ink">
            <TrendingUp className="w-4 h-4 text-cobalt" />
            <h3 className="text-sm font-semibold">Active trade sectors</h3>
          </div>
          <Link
            href="/directory"
            className="text-xs text-ink-muted hover:text-cobalt font-medium inline-flex items-center gap-0.5"
          >
            <span>All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isSectorsLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-1 animate-pulse">
                <div className="w-32 h-3.5 bg-panel-sunk rounded" />
                <div className="w-16 h-3 bg-panel-sunk rounded" />
              </div>
            ))}
          </div>
        ) : topSectors.length === 0 ? (
          <p className="text-xs text-ink-muted py-1">
            Browse the directory to explore industrial sectors.
          </p>
        ) : (
          <div className="space-y-1.5">
            {topSectors.map((sector) => (
              <Link
                key={sector.id}
                href={`/directory?category=${encodeURIComponent(sector.slug)}`}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-panel-sunk transition-colors group"
                title={`Browse ${sector.name} in Directory`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-2 h-2 rounded-full bg-cobalt shrink-0" />
                  <span className="text-ink group-hover:text-cobalt font-medium truncate">
                    {sector.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-ink-muted tabular-nums text-[11px] font-medium">
                    {sector.companyCount} {sector.companyCount === 1 ? 'supplier' : 'suppliers'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Copyright */}
      <div className="px-2 pt-2 text-[11px] text-ink-faint space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/directory" className="hover:text-ink-muted">Directory</Link>
          <span>•</span>
          <Link href="/pricing" className="hover:text-ink-muted">Plans</Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-ink-muted">Account</Link>
        </div>
        <p>© 2026 Twintell India Technologies</p>
      </div>
    </div>
  );
}
