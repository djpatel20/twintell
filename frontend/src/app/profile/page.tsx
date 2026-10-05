'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Inquiry } from '../../types';
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
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ProfilePage() {
  const router = useRouter();
  const { user, company, role, isLoading: authLoading, signOut, refreshUser } = useAuth();

  // Tab state for Company users
  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries'>('profile');

  // Edit User Profile Modal state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);

  // User Edit Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userUpdateError, setUserUpdateError] = useState<string | null>(null);

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

  // Fetch Received Inquiries if Company
  const {
    data: inquiriesData,
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = useQuery({
    queryKey: ['company-inquiries'],
    queryFn: () => api.get<{ data: Inquiry[]; nextCursor: string | null }>('/api/inquiries'),
    enabled: !!user && role === 'COMPANY',
    staleTime: 60 * 1000,
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
      <AppShell>
        <div className="card-base p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
        </div>
      </AppShell>
    );
  }

  const isCompany = role === 'COMPANY';

  return (
    <AppShell>
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
                    {company.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-slate-500">
                    {company.businessType} • {company.city}, {company.state}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link href={`/companies/${company.slug}`} className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Public Page
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none text-xs"
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
        {isCompany && (
          <div className="flex items-center gap-2 border-b border-slate-200">
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
              Received Inquiries
              {inquiries.length > 0 && (
                <span className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                  {inquiries.length}
                </span>
              )}
            </button>
          </div>
        )}

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
                <div className="card-base p-5 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Subscription Status</span>
                  <p className="text-base font-bold text-slate-900">
                    Free Tier (Phase 1 POC)
                  </p>
                  <p className="text-xs text-slate-500">
                    Unlimited directory listing, 20 monthly posts, and up to 10 product catalogue listings.
                  </p>
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

        {/* Tab 2: Received Inquiries (Company Only) */}
        {isCompany && activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiriesLoading ? (
              <div className="card-base p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading received inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <EmptyState
                title="No inquiries received yet"
                description="When buyers view your company products or profile and click 'Contact Supplier', their requests will appear here."
                icon={<MessageSquare className="w-6 h-6" />}
              />
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="card-base p-5 space-y-4 hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={inq.user?.avatarUrl}
                        name={inq.user?.name || 'Buyer'}
                        alt={inq.user?.name || 'Buyer'}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{inq.user?.name || 'Prospective Buyer'}</h4>
                          {inq.user?.city && (
                            <span className="text-xs text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {inq.user.city}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{inq.user?.email}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      {new Date(inq.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Attached Product preview if any */}
                  {inq.product && (
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                      <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200">
                        {inq.product.images && inq.product.images.length > 0 ? (
                          <img
                            src={inq.product.images[0]}
                            alt={inq.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-5 h-5 stroke-[1.5]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wide">
                          Inquiry for Product
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 truncate">{inq.product.title}</h5>
                        {inq.product.price && (
                          <p className="text-xs text-slate-500">
                            ₹{inq.product.price} / {inq.product.priceUnit || 'unit'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inquiry Message Content */}
                  <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {inq.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <a
                      href={`mailto:${inq.user?.email}?subject=Re: Inquiry regarding ${inq.product?.title || company?.name}`}
                      className="inline-block"
                    >
                      <Button size="sm" className="text-xs" leftIcon={<Send className="w-3.5 h-3.5" />}>
                        Reply via Email
                      </Button>
                    </a>
                  </div>
                </div>
              ))
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

                <Input
                  label="Avatar Image URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />

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
      </div>
    </AppShell>
  );
}
