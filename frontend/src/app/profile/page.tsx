'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { AppShell } from '../../components/layout/AppShell';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, VerifiedBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EditCompanyModal } from '../../components/companies/EditCompanyModal';
import { AddEditProductModal } from '../../components/products/AddEditProductModal';
import { InquiryModal } from '../../components/products/InquiryModal';
import { Inquiry, SubscriptionDetailsResponse } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  User as UserIcon,
  Building2,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  ExternalLink,
  LogOut,
  Package,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Send,
  Plus,
  Zap,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { clsx } from 'clsx';
import { uploadFileToStorage } from '../../lib/upload';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'inquiries' ? 'inquiries' : tabParam === 'subscription' ? 'subscription' : 'profile';
  const { user, company, role, isLoading: authLoading, signOut, refreshUser } = useAuth();

  // Tab state for Company users
  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries' | 'subscription'>(initialTab);

  const isCompany = role === 'COMPANY' && !!company;

  // Fetch subscription details & usage for company
  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.get<{ data: SubscriptionDetailsResponse }>('/api/subscriptions/me'),
    enabled: isCompany,
  });
  const subDetails = subData?.data;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inquiries') {
      setActiveTab('inquiries');
    } else if (tabParam === 'subscription') {
      setActiveTab('subscription');
    }
  }, [searchParams]);

  // Edit User Profile Modal state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedInquiryForChat, setSelectedInquiryForChat] = useState<Inquiry | null>(null);

  // User Edit Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userUpdateError, setUserUpdateError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setUserUpdateError(null);
    try {
      const url = await uploadFileToStorage(file);
      setAvatarUrl(url);
    } catch (err: any) {
      setUserUpdateError(err?.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Sync state when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setHeadline(user.headline || '');
      setBio(user.bio || '');
      setCity(user.city || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Auth redirect guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch Inquiries for user (both company received and buyer sent)
  const {
    data: inquiriesData,
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = useQuery({
    queryKey: ['user-inquiries'],
    queryFn: () => api.get<{ data: Inquiry[]; nextCursor: string | null }>('/api/inquiries'),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const inquiries = inquiriesData?.data || [];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUser(true);
    setUserUpdateError(null);

    try {
      await api.patch('/api/me', {
        name: name.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });

      await refreshUser();
      setIsEditUserOpen(false);
    } catch (err: any) {
      setUserUpdateError(err?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <AppShell contentMaxWidth="wide">
        <div className="card-base p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentMaxWidth="wide">
      <div className="space-y-6">
        {/* User Profile Header Card */}
        <div className="card-base p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                alt={user.name}
                size="lg"
                className="w-16 h-16 sm:w-20 sm:h-20 text-xl border-2 border-primary-100 shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
                  <Badge variant={isCompany ? 'primary' : 'secondary'} size="sm">
                    {user.role}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-600">
                  {user.headline || (isCompany ? 'Company Representative' : 'Buyer / Standard User')}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                  {user.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-xs"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setIsEditUserOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Company Quick-Manage Card (if role is COMPANY) */}
        {isCompany && company && (
          <div className="card-base p-5 border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/40 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={company.logoUrl}
                  name={company.name}
                  alt={company.name}
                  size="md"
                  className="rounded-xl border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
                    {company.verified && <VerifiedBadge />}
                    {subDetails?.plan && (
                      <Link href="/pricing">
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all",
                          subDetails.plan.code === 'PRO'
                            ? "bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100"
                            : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                        )}>
                          <Zap className="w-2.5 h-2.5 text-primary-600" />
                          {subDetails.plan.name}
                        </span>
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {company.businessType} • {company.city}, {company.state}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                <Link href={`/companies/${company.slug}`} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Public
                  </Button>
                </Link>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant={subDetails?.plan?.code === 'PRO' ? 'outline' : 'primary'}
                    className="w-full text-xs font-bold shadow-xs"
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                  >
                    {subDetails?.plan?.code === 'PRO' ? 'Active Pro' : 'Upgrade Plan'}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs font-semibold"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddProductOpen(true)}
                >
                  Post Product
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs font-semibold"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setIsEditCompanyOpen(true)}
                >
                  Manage Company
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs for Company / User Content */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5',
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <UserIcon className="w-4 h-4" />
            Account Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5',
              activeTab === 'inquiries'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Messages & Chats
            {inquiries.length > 0 && (
              <span className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {inquiries.length}
              </span>
            )}
          </button>
          {isCompany && (
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className={clsx(
                'px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5',
                activeTab === 'subscription'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Zap className="w-4 h-4 text-primary-500" />
              Plans & Billing
              {subDetails?.plan && (
                <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {subDetails.plan.name}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab 1: Account Overview / Standard User Info */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {!isCompany && (
              <div className="card-base p-6 space-y-3 bg-gradient-to-br from-slate-50 to-white">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buyer Account Privileges</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    You are browsing twintell as a verified standard user. You have full access to explore the feed, search thousands of verified manufacturers, follow company updates, and send direct quotations or inquiries via "Contact Supplier".
                  </p>
                </div>
              </div>
            )}

            {isCompany && company && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-base p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Current Membership</span>
                    <Link
                      href="/pricing"
                      className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                    >
                      Change Plan <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-slate-900">
                        {subDetails?.plan.name || 'Starter Plan'}
                      </p>
                      {subDetails?.plan.badge && (
                        <span className="bg-primary-50 text-primary-700 border border-primary-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {subDetails.plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {subDetails?.plan.tagline || 'Free Business Listing'} • ₹{subDetails?.plan.priceYearly ?? 0}/year
                    </p>
                  </div>

                  {/* Post usage progress bar */}
                  {subDetails?.usage && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Posts Published</span>
                        <span className="font-bold text-slate-900">
                          {subDetails.usage.postsUsed} / {subDetails.usage.postsLimit ?? '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={clsx(
                            'h-2 rounded-full transition-all duration-300',
                            subDetails.usage.postsLimit && subDetails.usage.postsUsed >= subDetails.usage.postsLimit
                              ? 'bg-amber-500'
                              : 'bg-primary-600'
                          )}
                          style={{
                            width: subDetails.usage.postsLimit
                              ? `${Math.min(100, Math.round((subDetails.usage.postsUsed / subDetails.usage.postsLimit) * 100))}%`
                              : '15%',
                          }}
                        />
                      </div>
                      {subDetails.usage.postsLimit && subDetails.usage.postsUsed >= subDetails.usage.postsLimit && (
                        <p className="text-[11px] text-amber-600 font-medium">
                          Post limit reached for this period. Upgrade to Pro Plan to publish up to 10 posts every month!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-base p-5 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Audience & Reach</span>
                  <p className="text-base font-bold text-slate-900">
                    {company.followerCount} <span className="text-xs font-normal text-slate-500">Followers</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Buyers following your updates will see new posts in their priority feed.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Messages & Chats (Unified Single Container) */}
        {activeTab === 'inquiries' && (
          <div className="card-base overflow-hidden border border-slate-200 shadow-soft">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                  <span>Messages & RFQ Conversations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isCompany
                    ? 'All received supplier inquiries and live conversations from buyers'
                    : 'All inquiries you have sent to suppliers with direct chat history'}
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                {inquiries.length} {inquiries.length === 1 ? 'Conversation' : 'Conversations'}
              </span>
            </div>

            {/* Free Plan Lock Banner */}
            {isCompany && subDetails?.plan?.code === 'FREE' && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Buyer Enquiries are Locked on Free Plan</h4>
                    <p className="text-[11px] text-amber-700">
                      Companies on the Free Plan cannot receive new direct buyer enquiries or RFQs. Upgrade to Pro Plan (₹1,999/yr) to unlock direct buyer messaging.
                    </p>
                  </div>
                </div>
                <Link href="/pricing" className="shrink-0 w-full sm:w-auto">
                  <Button size="sm" className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
                    Upgrade to Pro Plan
                  </Button>
                </Link>
              </div>
            )}

            {/* Content List */}
            {inquiriesLoading ? (
              <div className="p-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading messages & conversations...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title={isCompany ? 'No messages received yet' : 'No messages sent yet'}
                  description={
                    isCompany
                      ? "When buyers view your products and click 'Contact Supplier', conversations will appear in this unified chat inbox."
                      : "You haven't contacted any suppliers yet. Explore products in the directory and click 'Contact Supplier' to start a chat!"
                  }
                  icon={<MessageSquare className="w-6 h-6" />}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inquiries.map((inq) => {
                  const isSentByMe = inq.userId === user?.id;
                  const counterpartyName = isSentByMe
                    ? inq.company?.name || 'Supplier'
                    : inq.user?.name || 'Buyer';
                  const counterpartyAvatar = isSentByMe
                    ? inq.company?.logoUrl
                    : inq.user?.avatarUrl;

                  return (
                    <div
                      key={inq.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <Avatar
                          src={counterpartyAvatar || undefined}
                          name={counterpartyName}
                          alt={counterpartyName}
                          size="md"
                          className="shrink-0 mt-0.5 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {counterpartyName}
                            </h4>
                            {isSentByMe ? (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                Supplier
                              </span>
                            ) : (
                              <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
                                Prospective Buyer
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              • {new Date(inq.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Attached Product summary tag */}
                          {inq.product && (
                            <div className="inline-flex items-center gap-2 bg-primary-50/60 border border-primary-100 px-2.5 py-1 rounded-lg text-xs max-w-full">
                              <Package className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {inq.product.title}
                              </span>
                              {inq.product.price && (
                                <span className="text-slate-500 font-medium shrink-0">
                                  (₹{inq.product.price}/{inq.product.priceUnit || 'unit'})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Latest / original message snippet */}
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80">
                            {inq.messages && inq.messages.length > 0
                              ? inq.messages[inq.messages.length - 1].content
                              : inq.message}
                          </p>
                        </div>
                      </div>

                      {/* Right action button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          className="text-xs font-bold shadow-xs px-3.5"
                          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedInquiryForChat(inq)}
                        >
                          Open Chat
                        </Button>
                        {inq.user?.email && isCompany && (
                          <a
                            href={`mailto:${inq.user.email}?subject=Re: Inquiry regarding ${inq.product?.title || company?.name}`}
                            className="hidden sm:inline-block"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              leftIcon={<Send className="w-3.5 h-3.5" />}
                            >
                              Email
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Plans & Billing (for COMPANY role) */}
        {activeTab === 'subscription' && isCompany && (
          <div className="card-base p-6 sm:p-8 space-y-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-600" />
                  <span>Company Membership & Entitlements</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your subscription tier, publishing allowances, and premium business tools.
                </p>
              </div>

              <Link href="/pricing">
                <Button size="sm" className="font-bold shadow-xs" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                  {subDetails?.plan?.code === 'ADVERTISING' ? 'View All Plans' : 'Upgrade Plan'}
                </Button>
              </Link>
            </div>

            {/* Current Active Plan Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/60 via-white to-primary-50/30 border border-primary-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {subDetails?.plan.name || 'Starter'}
                    </span>
                    {subDetails?.plan.badge && (
                      <span className="bg-primary-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {subDetails.plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{subDetails?.plan.tagline}</p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-black text-slate-900">
                    ₹{subDetails?.plan.priceYearly ?? 0}
                    <span className="text-xs text-slate-500 font-normal"> / year</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 sm:justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Status: Active
                  </span>
                </div>
              </div>

              {/* Usage breakdown */}
              {subDetails?.usage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-primary-100 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-primary-100/80 space-y-2">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Monthly Posts Allowance</span>
                      <span className="text-primary-700 font-bold">
                        {subDetails.usage.postsUsed} / {subDetails.usage.postsLimit ?? 'Unlimited'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: subDetails.usage.postsLimit
                            ? `${Math.min(100, Math.round((subDetails.usage.postsUsed / subDetails.usage.postsLimit) * 100))}%`
                            : '20%',
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-primary-100/80 space-y-1">
                    <span className="font-semibold text-slate-700">Product Catalogue Listings</span>
                    <p className="text-lg font-bold text-slate-900">
                      {subDetails.usage.productsUsed}{' '}
                      <span className="text-xs font-normal text-slate-500">Products currently listed</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Inclusions list */}
            {subDetails?.plan?.features && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Features & Capabilities:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {subDetails.plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit User Profile */}
        {isEditUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Edit Profile</h3>
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userUpdateError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userUpdateError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />

                <Input
                  label="Professional Headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Head of Procurement / Chemical Sourcing Specialist"
                  maxLength={120}
                />

                <Input
                  label="Location (City)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  maxLength={100}
                />

                {/* Profile Photo File Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {avatarUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <Avatar
                        name={name || 'User'}
                        src={avatarUrl}
                        size="md"
                        className="shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Photo Uploaded</p>
                        <p className="text-[10px] text-slate-500 truncate">{avatarUrl}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="text-xs"
                        >
                          Change
                        </Button>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-primary-500 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors bg-slate-50/50"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                          <span>Uploading photo to storage...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-primary-500" />
                          <span>Upload Profile Photo (PNG, JPG, WebP)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bio / About
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other businesses about your experience, sourcing needs, or background..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none resize-none"
                    maxLength={500}
                  />
                  <span className="text-[11px] text-slate-400 text-right block mt-1">
                    {bio.length}/500
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditUserOpen(false)}
                    disabled={isUpdatingUser}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={isUpdatingUser}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Company Profile */}
        {isCompany && company && (
          <EditCompanyModal
            isOpen={isEditCompanyOpen}
            onClose={() => setIsEditCompanyOpen(false)}
            onSuccess={() => {
              setIsEditCompanyOpen(false);
              refreshUser();
            }}
            initialData={{
              name: company.name,
              businessType: company.businessType,
              categoryId: company.categoryId,
              city: company.city,
              state: company.state,
              description: company.description,
              tags: company.tags,
              yearFounded: company.yearFounded,
              logoUrl: company.logoUrl,
              coverUrl: company.coverUrl,
            }}
          />
        )}

        {/* Modal: Post Product */}
        {isCompany && company && (
          <AddEditProductModal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            companyId={company.id}
            onSuccess={() => {
              setIsAddProductOpen(false);
              refreshUser();
            }}
          />
        )}

        {/* Modal: Live Inquiry Chat */}
        {selectedInquiryForChat && (
          <InquiryModal
            isOpen={!!selectedInquiryForChat}
            onClose={() => setSelectedInquiryForChat(null)}
            initialInquiryId={selectedInquiryForChat.id}
            companyId={selectedInquiryForChat.companyId}
            companyName={
              selectedInquiryForChat.userId === user?.id
                ? selectedInquiryForChat.company?.name || 'Company'
                : selectedInquiryForChat.user?.name || 'Prospective Buyer'
            }
            companyLogo={
              selectedInquiryForChat.userId === user?.id
                ? selectedInquiryForChat.company?.logoUrl
                : selectedInquiryForChat.user?.avatarUrl
            }
            companyVerified={
              selectedInquiryForChat.userId === user?.id
                ? selectedInquiryForChat.company?.verified
                : false
            }
            productId={selectedInquiryForChat.productId}
            productTitle={selectedInquiryForChat.product?.title}
            productPrice={selectedInquiryForChat.product?.price}
            productPriceUnit={selectedInquiryForChat.product?.priceUnit}
            productMoq={selectedInquiryForChat.product?.moq}
            productImage={selectedInquiryForChat.product?.images?.[0]}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <AppShell contentMaxWidth="wide">
          <div className="card-base p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-xs text-slate-500">Loading profile...</p>
          </div>
        </AppShell>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
