'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Plan, SubscriptionDetailsResponse } from '../../types';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Badge, VerifiedBadge } from '../../components/ui/Badge';
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  TrendingUp,
  Target,
  Megaphone,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, company, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch all active plans
  const { data: plansData, isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get<{ data: Plan[] }>('/api/subscriptions/plans'),
  });

  const plans = plansData?.data || [];

  // 2. If logged in as company, fetch current subscription & usage
  const isCompany = user?.role === 'COMPANY' && !!company;
  const { data: currentSubData, isLoading: isSubLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.get<{ data: SubscriptionDetailsResponse }>('/api/subscriptions/me'),
    enabled: isCompany,
  });

  const currentPlan = currentSubData?.data?.plan;
  const currentUsage = currentSubData?.data?.usage;

  // 3. Mutation to upgrade plan
  const upgradeMutation = useMutation({
    mutationFn: (planCode: string) =>
      api.post<{ data: { message: string } }>('/api/subscriptions/upgrade', { planCode }),
    onSuccess: (res) => {
      setSuccessMessage(res.data?.message || 'Subscription updated successfully!');
      setSelectedPlanCode(null);
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      refreshUser();
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to update subscription. Please try again.');
    },
  });

  const handleSelectPlan = (plan: Plan) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!user) {
      router.push('/login');
      return;
    }

    if (!isCompany) {
      alert('Only registered company accounts can subscribe to business plans. Please create or switch to a company profile.');
      return;
    }

    if (currentPlan?.code === plan.code) {
      return; // Already active
    }

    if (plan.code === 'LEAD_GEN') {
      window.location.href = `mailto:sales@twintell.com?subject=Inquiry: Twintell Lead Generation Pilot&body=Hello Twintell Team,%0D%0A%0D%0AWe are interested in enrolling ${company?.name || 'our company'} in the verified buyer lead generation pilot program.`;
      return;
    }

    setSelectedPlanCode(plan.code);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlanCode) return;
    upgradeMutation.mutate(selectedPlanCode);
  };

  const planIcons: Record<string, any> = {
    FREE: Building2,
    PRO: Zap,
    ADVERTISING: Megaphone,
    LEAD_GEN: Target,
  };

  return (
    <AppShell contentMaxWidth="wide" showRightSidebar={false}>
      <div className="space-y-10 max-w-6xl mx-auto py-2">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold border border-primary-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Twintell — Business Plans & Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Transparent Pricing for Growing Businesses
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Keep your business presence active for free, or upgrade to Business Pro and Advertising for verified recognition, expanded reach, and direct buyer inquiries.
          </p>

          {/* Logged in Company Status Banner */}
          {isCompany && currentPlan && (
            <div className="p-3.5 bg-gradient-to-r from-primary-50/80 via-white to-primary-50/80 rounded-xl border border-primary-200 text-xs inline-flex items-center gap-2.5 shadow-xs">
              <span className="font-semibold text-slate-700">Your Active Plan:</span>
              <span className="font-bold text-primary-700 bg-white px-2 py-0.5 rounded-md border border-primary-200 shadow-2xs">
                {currentPlan.name}
              </span>
              {currentUsage && (
                <span className="text-slate-500">
                  • {currentUsage.postsUsed} / {currentUsage.postsLimit ?? '∞'} Posts Used
                </span>
              )}
            </div>
          )}

          {/* Success / Error Notification */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        {isPlansLoading ? (
          <div className="card-base p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-xs text-slate-500">Loading business plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const Icon = planIcons[plan.code] || Building2;
              const isCurrent = currentPlan?.code === plan.code;
              const isRecommended = plan.isPopular || plan.code === 'PRO';

              return (
                <div
                  key={plan.id}
                  className={`card-base p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative h-full ${
                    isRecommended
                      ? 'border-2 border-primary-500 shadow-md ring-4 ring-primary-500/10'
                      : isCurrent
                      ? 'border-2 border-emerald-500 shadow-sm'
                      : 'border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {isCurrent && !plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Top Header */}
                    <div className="space-y-1.5 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2">{plan.tagline}</p>
                    </div>

                    {/* Price Header (Aligned vertical baseline across all cards) */}
                    <div className="py-2.5 border-y border-slate-100 min-h-[72px] flex flex-col justify-center">
                      {plan.code === 'LEAD_GEN' ? (
                        <div className="space-y-0.5">
                          <span className="text-lg font-black text-slate-900">Contact Sales</span>
                          <p className="text-[11px] text-slate-400">Pilot pricing on inquiry</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">
                              ₹{plan.priceYearly.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">/ year</span>
                          </div>
                          {plan.priceYearly > 0 && (
                            <p className="text-[11px] text-slate-400">
                              (Approx. ₹{Math.round(plan.priceMonthly)}/month billed annually)
                            </p>
                          )}
                          {plan.priceYearly === 0 && (
                            <p className="text-[11px] text-emerald-600 font-semibold">
                              100% Free Forever
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-1 flex-1">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        What's Included:
                      </p>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-6">
                    {isCurrent ? (
                      <Button
                        size="md"
                        variant="secondary"
                        disabled
                        className="w-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200"
                      >
                        Active Plan
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        variant={isRecommended ? 'primary' : 'outline'}
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full text-xs font-bold ${
                          isRecommended ? 'shadow-md shadow-primary-500/20' : ''
                        }`}
                        leftIcon={plan.code === 'LEAD_GEN' ? <Target className="w-3.5 h-3.5" /> : undefined}
                      >
                        {plan.code === 'FREE'
                          ? 'Switch to Starter'
                          : plan.code === 'LEAD_GEN'
                          ? 'Inquire for Pilot'
                          : `Upgrade to ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Table / FAQ */}
        <div className="card-base p-6 sm:p-8 space-y-6 border border-slate-200">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <span>Frequently Asked Questions & Plan Details</span>
            </h2>
            <p className="text-xs text-slate-500">
              Everything you need to know about Twintell business plans and publishing allowances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                What happens when I publish 3 posts on the Free Plan?
              </h4>
              <p className="leading-relaxed">
                On the Starter (Free) plan, you can publish up to 3 business updates. Once you reach 3 posts, you can upgrade to <strong>Business Pro</strong> to publish up to 10 posts with priority visibility.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                How does the Advertising Plan work?
              </h4>
              <p className="leading-relaxed">
                The Advertising Plan provides 12 scheduled promotional campaigns (1 per month) positioned natively between feed posts to reach thousands of verified buyers and suppliers.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                Can I switch or upgrade my plan at any time?
              </h4>
              <p className="leading-relaxed">
                Yes! You can upgrade your plan anytime from this page or directly within your profile. Upgrades take effect immediately with full access to new post limits and tools.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                What is the Lead Generation Pilot?
              </h4>
              <p className="leading-relaxed">
                Our team matches verified buyer procurement requirements directly with verified manufacturers and suppliers on Twintell, delivering high-intent quotation requests to your inbox.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {selectedPlanCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Subscription Change
                  </h3>
                  <p className="text-xs text-slate-500">
                    Switching your company to the {plans.find((p) => p.code === selectedPlanCode)?.name} plan.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Company:</span>
                  <span className="text-slate-900 font-bold">{company?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Selected Plan:</span>
                  <span className="text-primary-600 font-bold">
                    {plans.find((p) => p.code === selectedPlanCode)?.name} (₹{plans.find((p) => p.code === selectedPlanCode)?.priceYearly}/year)
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Term:</span>
                  <span className="text-slate-900">1 Year Active Membership</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlanCode(null)}
                  disabled={upgradeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmUpgrade}
                  isLoading={upgradeMutation.isPending}
                  className="font-bold shadow-sm"
                >
                  Confirm & Activate Plan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
