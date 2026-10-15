'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { AdminCompany } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Badge, VerifiedBadge } from '../../../components/ui/Badge';
import {
  Building2,
  Search,
  Filter,
  Zap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Calendar,
  Package,
  FileText,
  Loader2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Modal State for Subscription Override
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [overridePlanCode, setOverridePlanCode] = useState<string>('PRO');
  const [overrideStatus, setOverrideStatus] = useState<string>('ACTIVE');
  const [overrideDays, setOverrideDays] = useState<number>(365);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch Companies with Subscriptions
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-companies', page, search, selectedPlanCode],
    queryFn: () => {
      const params: Record<string, any> = { page, limit: 15 };
      if (search) params.search = search;
      if (selectedPlanCode !== 'ALL') params.planCode = selectedPlanCode;
      return api.get<{ data: AdminCompany[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        '/api/admin/companies',
        params
      );
    },
  });

  const companies = data?.data || [];
  const pagination = data?.pagination;

  // Mutation: Override Plan
  const overrideMutation = useMutation({
    mutationFn: (companyId: string) =>
      api.post(`/api/admin/companies/${companyId}/subscription`, {
        planCode: overridePlanCode,
        status: overrideStatus,
        periodEndDays: overrideDays,
      }),
    onSuccess: (res: any) => {
      setActionSuccess(res?.data?.message || 'Subscription successfully updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setTimeout(() => {
        setEditingCompany(null);
        setActionSuccess(null);
      }, 1500);
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Failed to update subscription.');
    },
  });

  // Mutation: Toggle Verification
  const verifyMutation = useMutation({
    mutationFn: (companyId: string) => api.post(`/api/admin/companies/${companyId}/verify`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openOverrideModal = (company: AdminCompany) => {
    setEditingCompany(company);
    setOverridePlanCode(company.subscription?.plan?.code || 'PRO');
    setOverrideStatus(company.subscription?.status || 'ACTIVE');
    setOverrideDays(365);
    setActionSuccess(null);
    setActionError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Membership & Billing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Company Subscriptions & Limits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit registered companies, manage active plans, override limits, and grant verified supplier badges.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search company, city, or owner email..."
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-primary-500 placeholder-slate-500"
          />
        </form>

        {/* Plan Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {['ALL', 'FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setSelectedPlanCode(code);
                setPage(1);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-bold transition-all shrink-0',
                selectedPlanCode === code
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              )}
            >
              {code === 'ALL'
                ? 'All Plans'
                : code === 'FREE'
                ? 'Starter (₹0)'
                : code === 'PRO'
                ? 'Business Pro'
                : code === 'ADVERTISING'
                ? 'Advertising'
                : 'Lead Gen'}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      {isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading company memberships...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center text-xs text-rose-300">
          Failed to load company records.
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No companies found</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or plan filter.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Company</th>
                  <th className="p-4">Owner / Contact</th>
                  <th className="p-4">Active Plan</th>
                  <th className="p-4">Monthly Post Usage</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Verified</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {companies.map((comp) => {
                  const plan = comp.subscription?.plan;
                  const postsUsed = comp.stats.postsThisMonth;
                  const postsLimit = plan?.postsPerMonth;
                  const isLimitReached = postsLimit !== null && postsLimit !== undefined && postsUsed >= postsLimit;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Company Name & Location */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={comp.logoUrl || undefined}
                            name={comp.name}
                            size="sm"
                            className="rounded-lg shrink-0 border border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs truncate">{comp.name}</span>
                              {comp.verified && <VerifiedBadge />}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {comp.city}, {comp.state}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="p-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200">{comp.owner.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{comp.owner.email}</p>
                        </div>
                      </td>

                      {/* Plan Badge & Expiry */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                              plan?.code === 'PRO'
                                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                                : plan?.code === 'ADVERTISING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : plan?.code === 'LEAD_GEN'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            )}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            {plan?.name || 'Starter'}
                          </span>
                          {comp.subscription?.currentPeriodEnd && (
                            <p className="text-[10px] text-slate-500">
                              Expires: {new Date(comp.subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Post Usage Meter */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={clsx('font-bold', isLimitReached ? 'text-rose-400' : 'text-slate-300')}>
                              {postsUsed} / {postsLimit ?? '∞'} posts
                            </span>
                          </div>
                          {postsLimit ? (
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={clsx(
                                  'h-1.5 rounded-full',
                                  isLimitReached ? 'bg-rose-500' : 'bg-primary-500'
                                )}
                                style={{ width: `${Math.min(100, Math.round((postsUsed / postsLimit) * 100))}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unlimited</span>
                          )}
                        </div>
                      </td>

                      {/* Products */}
                      <td className="p-4">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          {comp.stats.totalProducts} listed
                        </span>
                      </td>

                      {/* Verified Badge Toggle */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => verifyMutation.mutate(comp.id)}
                          disabled={verifyMutation.isPending}
                          className={clsx(
                            'px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all',
                            comp.verified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                          )}
                          title="Click to toggle Verified Supplier badge"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{comp.verified ? 'Verified' : 'Unverified'}</span>
                        </button>
                      </td>

                      {/* Action Menu */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 py-1"
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={() => openOverrideModal(comp)}
                          >
                            Edit Plan
                          </Button>
                          <Link href={`/companies/${comp.slug}`} target="_blank">
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Public Company Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total companies)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs border-slate-800 text-slate-300"
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs border-slate-800 text-slate-300"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Override Plan */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Override Subscription</h3>
                <p className="text-xs text-slate-400">{editingCompany.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Select Plan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Assign Subscription Plan</label>
                <select
                  value={overridePlanCode}
                  onChange={(e) => setOverridePlanCode(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="FREE">01 · Starter (Free / ₹0 - 3 Posts)</option>
                  <option value="PRO">02 · Business Pro (₹1,999/yr - 10 Posts + Inquiries)</option>
                  <option value="ADVERTISING">03 · Advertising (₹1,999/yr - 12 Sponsored Placements)</option>
                  <option value="LEAD_GEN">04 · Lead Generation (Pilot / Inquiries)</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Subscription Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="ACTIVE">ACTIVE (Granted)</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                </select>
              </div>

              {/* Duration in Days */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Plan Validity (Days from Today)</label>
                <input
                  type="number"
                  value={overrideDays}
                  onChange={(e) => setOverrideDays(parseInt(e.target.value, 10) || 30)}
                  min={1}
                  max={3650}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                />
                <span className="text-[11px] text-slate-500">
                  Example: 365 days = 1 full year of active membership.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
                onClick={() => setEditingCompany(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="w-full text-xs font-bold"
                disabled={overrideMutation.isPending}
                onClick={() => overrideMutation.mutate(editingCompany.id)}
              >
                {overrideMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
