'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api-client';
import { AppShell } from '../../../components/layout/AppShell';
import { Avatar } from '../../../components/ui/Avatar';
import { VerifiedBadge, Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { PostCard } from '../../../components/feed/PostCard';
import { EditCompanyModal } from '../../../components/companies/EditCompanyModal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InquiryModal } from '../../../components/products/InquiryModal';
import { AddEditProductModal } from '../../../components/products/AddEditProductModal';
import { ProductCard } from '../../../components/products/ProductCard';
import {
  MapPin,
  Calendar,
  Users,
  Package,
  FileText,
  Mail,
  Edit3,
  UserPlus,
  UserCheck,
  Building2,
  AlertCircle,
  ExternalLink,
  Tag,
  Plus,
} from 'lucide-react';
import { Post, Product } from '../../../types';

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, company: currentCompany } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'posts' | 'products' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // 1. Fetch Company Profile
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['company', slug],
    queryFn: () => api.get<{ data: any }>(`/api/companies/${slug}`),
    enabled: !!slug,
  });

  const company = profileData?.data;
  const isOwner = currentCompany?.id === company?.id;

  // 2. Fetch Company Posts
  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['company-posts', slug],
    queryFn: () => api.get<{ data: Post[] }>(`/api/companies/${slug}/posts`),
    enabled: !!slug && activeTab === 'posts',
  });

  // 3. Fetch Company Products
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['company-products', slug],
    queryFn: () => api.get<{ data: Product[] }>(`/api/companies/${slug}/products`),
    enabled: !!slug && activeTab === 'products',
  });

  const posts = postsData?.data || [];
  const products = productsData?.data || [];

  const handleFollowToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!company) return;

    setIsFollowLoading(true);
    try {
      if (company.isFollowing) {
        await api.delete(`/api/companies/${company.id}/follow`);
      } else {
        await api.post(`/api/companies/${company.id}/follow`);
      }
      queryClient.invalidateQueries({ queryKey: ['company', slug] });
    } catch (err: any) {
      alert(err?.message || 'Failed to update follow status.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const tabs = [
    { id: 'posts', label: `Updates (${company?._count?.posts ?? 0})` },
    { id: 'products', label: `Products (${company?._count?.products ?? 0})` },
    { id: 'about', label: 'About & Overview' },
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        {isProfileLoading ? (
          <div className="card-base p-6 space-y-4 animate-pulse">
            <div className="h-36 bg-slate-200 rounded-xl" />
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-slate-300 rounded-2xl -mt-10" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        ) : isProfileError || !company ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Company Not Found</h3>
            <p className="text-xs text-rose-600">
              {(profileError as Error)?.message || 'This company profile does not exist or has been removed.'}
            </p>
            <Link href="/directory">
              <Button size="sm" variant="secondary">
                Explore Directory
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Company Hero Profile Header */}
            <div className="card-base overflow-hidden border border-slate-200">
              {/* Cover Banner */}
              <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 relative">
                {company.coverUrl && (
                  <img
                    src={company.coverUrl}
                    alt={`${company.name} cover`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Details Bar */}
              <div className="p-5 sm:p-6 pt-0 relative space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
                  <div className="flex items-end gap-3.5">
                    <Avatar
                      name={company.name}
                      src={company.logoUrl || undefined}
                      size="xl"
                      className="ring-4 ring-white shadow-md rounded-2xl shrink-0"
                    />
                    <div className="space-y-1 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {company.name}
                        </h1>
                        {company.verified && <VerifiedBadge />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">{company.businessType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {company.city}, {company.state}
                        </span>
                        {company.yearFounded && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Est. {company.yearFounded}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Owner vs Visitor) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner ? (
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => setIsEditModalOpen(true)}
                        leftIcon={<Edit3 className="w-4 h-4" />}
                        className="font-bold"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="md"
                          variant={company.isFollowing ? 'outline' : 'primary'}
                          onClick={handleFollowToggle}
                          isLoading={isFollowLoading}
                          leftIcon={
                            company.isFollowing ? (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )
                          }
                          className={
                            company.isFollowing
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold'
                              : 'font-bold'
                          }
                        >
                          {company.isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button
                          size="md"
                          variant="secondary"
                          onClick={() => {
                            if (!user) {
                              router.push('/login');
                            } else {
                              setSelectedProductForInquiry(null);
                              setIsInquiryModalOpen(true);
                            }
                          }}
                          leftIcon={<Mail className="w-4 h-4" />}
                          className="font-semibold"
                        >
                          Contact
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats & Tags Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-5 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <strong className="text-slate-900 font-bold">{company.followerCount}</strong> followers
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-400" />
                      <strong className="text-slate-900 font-bold">{company._count?.products ?? 0}</strong> products
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <strong className="text-slate-900 font-bold">{company._count?.posts ?? 0}</strong> updates
                    </span>
                  </div>

                  {company.category && (
                    <Badge variant="primary" size="sm" className="font-semibold self-start sm:self-auto">
                      {company.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="bg-white rounded-card p-2.5 border border-slate-200 shadow-soft">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as any)}
                variant="pill"
              />
            </div>

            {/* Tab 1: Updates (Posts) */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {isPostsLoading ? (
                  <div className="card-base p-6 text-center text-xs text-slate-400">Loading updates...</div>
                ) : posts.length === 0 ? (
                  <EmptyState
                    title="No business updates yet"
                    description={`${company.name} hasn't shared any company updates or announcements yet.`}
                  />
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostDeleted={() => refetchProfile()}
                    />
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Products Catalog Grid */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                {isOwner && (
                  <div className="flex items-center justify-between bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Company Catalog Management</h4>
                      <p className="text-[11px] text-slate-500">List and showcase your wholesale supplies to procurement buyers.</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAddProductModalOpen(true)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="font-bold shadow-xs"
                    >
                      Add Product
                    </Button>
                  </div>
                )}

                {isProductsLoading ? (
                  <div className="card-base p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 animate-spin text-primary-500" />
                    <span>Loading catalogue products...</span>
                  </div>
                ) : products.length === 0 ? (
                  <EmptyState
                    title="No products listed"
                    description={`${company.name} has not listed any catalog products yet.`}
                    actionLabel={isOwner ? 'Add First Product' : undefined}
                    onAction={isOwner ? () => setIsAddProductModalOpen(true) : undefined}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={{ ...product, company }}
                        onInquireClick={
                          !isOwner
                            ? () => {
                                setSelectedProductForInquiry(product);
                                setIsInquiryModalOpen(true);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: About Overview */}
            {activeTab === 'about' && (
              <div className="card-base p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">About {company.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {company.description || 'No description provided yet by this company.'}
                  </p>
                </div>

                {company.tags && company.tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary-500" />
                      <span>Business Specialties & Tags</span>
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {company.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Location</span>
                    <span className="font-semibold text-slate-800">
                      {company.city}, {company.state}, India
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Business Classification</span>
                    <span className="font-semibold text-slate-800">{company.businessType}</span>
                  </div>
                  {company.yearFounded && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Established Year</span>
                      <span className="font-semibold text-slate-800">{company.yearFounded}</span>
                    </div>
                  )}
                  {company.category && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Industry Segment</span>
                      <span className="font-semibold text-slate-800">{company.category.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Company Modal (only for Owner) */}
            {isOwner && (
              <EditCompanyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => refetchProfile()}
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

            {/* Inquiry Modal */}
            <InquiryModal
              isOpen={isInquiryModalOpen}
              onClose={() => {
                setIsInquiryModalOpen(false);
                setSelectedProductForInquiry(null);
              }}
              companyId={company.id}
              companyName={company.name}
              companyLogo={company.logoUrl}
              companyVerified={company.verified}
              productId={selectedProductForInquiry?.id}
              productTitle={selectedProductForInquiry?.title}
              productPrice={selectedProductForInquiry?.price}
              productPriceUnit={selectedProductForInquiry?.priceUnit}
              productMoq={selectedProductForInquiry?.moq}
            />

            {/* Add Product Modal (Owner) */}
            {isOwner && (
              <AddEditProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                companyId={company.id}
                onSuccess={() => {
                  refetchProfile();
                  queryClient.invalidateQueries({ queryKey: ['company-products', slug] });
                }}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
