'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { AdminStats } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  Building2,
  Users,
  Zap,
  IndianRupee,
  Megaphone,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<{ data: AdminStats }>('/api/admin/stats'),
    staleTime: 30000,
  });

  const stats = data?.data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Twintell Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time platform metrics, subscription distributions, and advertising controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href="/admin/ads">
            <Button size="sm" className="text-xs font-bold" leftIcon={<Megaphone className="w-3.5 h-3.5" />}>
              Create Sponsored Ad
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-xs text-slate-400">Aggregating platform intelligence...</p>
        </div>
      ) : isError || !stats ? (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-6 text-center space-y-3">
          <p className="text-xs sm:text-sm text-rose-300">
            Failed to retrieve administrative statistics from server.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Registered Companies */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Companies
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-white">{stats.totalCompanies.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">Verified B2B suppliers</p>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Registered Users
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-white">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">Buyers & business profiles</p>
              </div>
            </div>

            {/* Paid Subscriptions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paid Subscriptions
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">
                  {stats.activePaidSubscriptions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Business Pro & Ads tiers</p>
              </div>
            </div>

            {/* Annual Subscription Run-Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Run-Rate Revenue
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-white">
                  ₹{stats.estimatedAnnualRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Estimated yearly subscriptions</p>
              </div>
            </div>
          </div>

          {/* Secondary Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Total Business Posts</span>
                <span className="text-xl font-black text-white">{stats.totalPosts.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Active In-Feed Ads</span>
                <span className="text-xl font-black text-white">{stats.activeAds.toLocaleString()} live</span>
              </div>
            </div>
          </div>

          {/* Subscription Tier Distribution Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-400" />
                  <span>Subscription Plan Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribution of companies across Starter and Premium business tiers.
                </p>
              </div>

              <Link href="/admin/subscriptions">
                <Button size="sm" variant="outline" className="text-xs border-slate-700 text-slate-300 hover:text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Manage Subscriptions
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Starter Free */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">01 · Starter (Free)</span>
                  <span className="text-slate-500">₹0/yr</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {stats.planBreakdown.FREE.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">3 Posts allowance</p>
              </div>

              {/* Business Pro */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-primary-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary-400">02 · Business Pro</span>
                  <span className="text-primary-400/80 font-semibold">₹1,999/yr</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {stats.planBreakdown.PRO.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">10 Posts allowance + Inquiries</p>
              </div>

              {/* Advertising */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">03 · Advertising</span>
                  <span className="text-amber-400/80 font-semibold">₹1,999/yr</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {stats.planBreakdown.ADVERTISING.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">12 Sponsored placements</p>
              </div>

              {/* Lead Gen */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">04 · Lead Gen</span>
                  <span className="text-indigo-400/80 font-semibold">Pilot / Inquiry</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {stats.planBreakdown.LEAD_GEN.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">Matched buyer enquiries</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
