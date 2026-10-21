'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
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
  CreditCard,
  Lock,
} from 'lucide-react';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const { user, company, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
      toast.warning(
        'Company Account Required',
        'Only registered company accounts can subscribe to business plans. Please create or switch to a company profile.'
      );
      return;
    }

    if (currentPlan?.code === plan.code) {
      return; // Already active
    }

    setSelectedPlanCode(plan.code);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanCode) return;

    const plan = plans.find((p) => p.code === selectedPlanCode);
    if (!plan) return;

    setIsProcessingPayment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Free plan: direct switch
    if (plan.code === 'FREE' || Number(plan.priceYearly) === 0) {
      upgradeMutation.mutate(selectedPlanCode);
      setIsProcessingPayment(false);
      return;
    }

    try {
      // 1. Create Order via Backend
      const orderRes = await api.post<{
        data: {
          orderId: string;
          amount: number;
          currency: string;
          keyId: string;
          planName: string;
          planCode: string;
        };
      }>('/api/subscriptions/create-order', {
        planCode: plan.code,
        billingCycle: 'YEARLY',
      });

      const orderData = orderRes.data;

      // 2. Check if running in simulated sandbox mode (keys not configured in backend)
      const isSimulated =
        orderData.orderId.startsWith('order_test_') ||
        orderData.keyId.includes('placeholder');

      // Load Razorpay Checkout Script if not simulated
      const isScriptLoaded = !isSimulated ? await loadRazorpayScript() : false;

      if (isSimulated || !isScriptLoaded || !(window as any).Razorpay) {
        // Fallback for development sandbox simulation or if real keys are not configured in backend
        const confirmSandbox = confirm(
          isSimulated
            ? `Sandbox Mode: Razorpay API keys are not yet configured in backend/.env.\n\nSimulate successful payment for ${orderData.planName} (Amount: ₹${(orderData.amount / 100).toLocaleString()}) to test the upgrade flow?`
            : `Razorpay payment gateway initialized for ${orderData.planName} (Amount: ₹${(orderData.amount / 100).toLocaleString()}). Complete payment now?`
        );
        if (confirmSandbox) {
          const verifyRes = await api.post<{ data: { message: string } }>('/api/subscriptions/verify-payment', {
            orderId: orderData.orderId,
            paymentId: `pay_test_${Date.now()}`,
            signature: `sig_test_${Date.now()}`,
            planCode: plan.code,
            billingCycle: 'YEARLY',
          });

          setSuccessMessage(verifyRes.data?.message || 'Payment successful! Subscription upgraded.');
          toast.success('Subscription Upgraded', verifyRes.data?.message || 'Plan upgraded successfully!');
          setSelectedPlanCode(null);
          queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
          refreshUser();
        }
        setIsProcessingPayment(false);
        return;
      }

      // 3. Open Razorpay Standard Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'twintell B2B Platform',
        description: `${orderData.planName} (1 Year Active Membership)`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || company?.name || 'Company Owner',
          email: user?.email || '',
        },
        theme: {
          color: '#1A5CFF',
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await api.post<{ data: { message: string } }>('/api/subscriptions/verify-payment', {
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planCode: plan.code,
              billingCycle: 'YEARLY',
            });

            const msg = verifyRes.data?.message || 'Payment successful! Subscription upgraded.';
            setSuccessMessage(msg);
            toast.success('Subscription Upgraded', msg);
            setSelectedPlanCode(null);
            queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            refreshUser();
          } catch (err: any) {
            const errText = err?.message || 'Payment received but verification failed. Please contact support.';
            setErrorMessage(errText);
            toast.error('Payment Verification Failed', errText);
          } finally {
            setIsProcessingPayment(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        const failText = response.error?.description || 'Payment was declined or failed.';
        setErrorMessage(failText);
        toast.error('Payment Failed', failText);
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      const initErr = err?.message || 'Failed to initiate payment. Please try again.';
      setErrorMessage(initErr);
      toast.error('Payment Initialization Failed', initErr);
      setIsProcessingPayment(false);
    }
  };

  const planIcons: Record<string, any> = {
    FREE: Building2,
    PRO: Zap,
    ADVERTISING: Megaphone,
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
            Keep your business presence active with the Free Plan, or upgrade to Pro Plan and Ad Plan for direct buyer enquiries and targeted feed campaigns.
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

        {/* Pricing Cards Grid (3-Plan Structure) */}
        {isPlansLoading ? (
          <div className="card-base p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-xs text-slate-500">Loading business plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = planIcons[plan.code] || Building2;
              const isCurrent = currentPlan?.code === plan.code;
              const isRecommended = plan.isPopular || plan.code === 'PRO';

              return (
                <div
                  key={plan.id}
                  className={`card-base p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative h-full ${
                    isRecommended
                      ? 'border-2 border-primary-500 shadow-lg ring-4 ring-primary-500/10'
                      : isCurrent
                      ? 'border-2 border-emerald-500 shadow-sm'
                      : 'border border-slate-200 hover:border-slate-300 shadow-xs'
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
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 min-h-[32px] line-clamp-2">{plan.tagline}</p>
                    </div>

                    {/* Price Header (Aligned vertical baseline across all cards) */}
                    <div className="py-3 border-y border-slate-100 min-h-[76px] flex flex-col justify-center">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900">
                            ₹{Number(plan.priceYearly).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ year</span>
                        </div>
                        {Number(plan.priceYearly) > 0 && (
                          <p className="text-[11px] text-slate-400">
                            (Approx. ₹{Math.round(Number(plan.priceMonthly)).toLocaleString('en-IN')}/month billed annually)
                          </p>
                        )}
                        {Number(plan.priceYearly) === 0 && (
                          <p className="text-[11px] text-emerald-600 font-semibold">
                            100% Free Forever
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-2 flex-1">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        What's Included:
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-600">
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
                      >
                        {plan.code === 'FREE'
                          ? 'Switch to Free Plan'
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
        <div className="card-base p-6 sm:p-8 space-y-6 border border-slate-200 max-w-5xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <span>Frequently Asked Questions & Plan Details</span>
            </h2>
            <p className="text-xs text-slate-500">
              Everything you need to know about Twintell business plans, post allowances, and in-feed advertising.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                How does the Free Plan work?
              </h4>
              <p className="leading-relaxed">
                The Free Plan lets you create a company profile, list all your products, list your business in relevant categories, and publish up to 3 business updates per year with zero cost.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                What does the Pro Plan (₹1,999/yr) include?
              </h4>
              <p className="leading-relaxed">
                The Pro Plan includes everything in Free, plus up to 10 business posts every month and the ability to receive direct buyer enquiries through our integrated messaging desk.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                How does the Ad Plan (₹10,999/yr) work?
              </h4>
              <p className="leading-relaxed">
                The Ad Plan lets you run up to 12 targeted promotional campaigns per year featuring your company logo, products, and details. Your ads appear between regular posts in the feed and within your selected business category, complete with "Visit Company" and "Enquire Now" action buttons.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                Can I switch or upgrade my plan at any time?
              </h4>
              <p className="leading-relaxed">
                Yes! You can upgrade your plan anytime from this page or directly within your profile. Upgrades take effect immediately with instant activation.
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
                  isLoading={isProcessingPayment || upgradeMutation.isPending}
                  className="font-bold shadow-sm"
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  {plans.find((p) => p.code === selectedPlanCode)?.code === 'FREE'
                    ? 'Confirm & Activate Plan'
                    : 'Proceed to Payment (Razorpay)'}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>256-bit SSL encrypted · Verified by Razorpay</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
