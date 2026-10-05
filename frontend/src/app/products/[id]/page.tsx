'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import { AppShell } from '../../../components/layout/AppShell';
import { Avatar } from '../../../components/ui/Avatar';
import { VerifiedBadge, Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { InquiryModal } from '../../../components/products/InquiryModal';
import { AddEditProductModal } from '../../../components/products/AddEditProductModal';
import { Product } from '../../../types';
import {
  ArrowLeft,
  Package,
  Mail,
  Edit3,
  Trash2,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Truck,
  Sparkles,
  Users,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, company: currentCompany } = useAuth();
  const queryClient = useQueryClient();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Product Details
  const {
    data: productData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<{ data: Product }>(`/api/products/${id}`),
    enabled: !!id,
  });

  const product = productData?.data;
  const isOwner = currentCompany?.id === product?.companyId;
  const company = product?.company;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setIsDeleting(true);

    try {
      await api.delete(`/api/products/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['company-products'] });
      router.push(company ? `/companies/${company.slug}` : '/directory');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product.');
      setIsDeleting(false);
    }
  };

  return (
    <AppShell showRightSidebar={false}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Back Link Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Product
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-card p-12 border border-slate-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-xs text-slate-500">Loading product catalogue details...</p>
          </div>
        ) : isError || !product ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Product not found</h3>
            <p className="text-xs text-rose-600">
              {(error as Error)?.message || 'This product listing may have been removed.'}
            </p>
            <Link href="/directory">
              <Button size="sm" variant="secondary">
                Explore Directory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Product Overview Card */}
            <div className="bg-white rounded-card p-5 sm:p-7 border border-slate-200 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[activeImageIdx] || product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Package className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-xs font-semibold">No Image Provided</span>
                    </div>
                  )}

                  {product.category && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary" size="sm" className="bg-white/95 backdrop-blur shadow-sm text-primary-700">
                        {product.category.name}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Thumbnails row */}
                {product.images && product.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activeImageIdx === idx
                            ? 'border-primary-500 ring-2 ring-primary-500/20'
                            : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Pricing, Specs & Inquiry CTA */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                      {product.title}
                    </h1>
                    {company && (
                      <Link
                        href={`/companies/${company.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-bold hover:underline mt-1"
                      >
                        <span>{company.name}</span>
                        {company.verified && <VerifiedBadge showLabel={false} />}
                      </Link>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="p-4 bg-gradient-to-r from-primary-50/60 to-white rounded-xl border border-primary-100/80 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                      Wholesale Price
                    </span>
                    <div className="flex items-baseline gap-2">
                      {product.price ? (
                        <p className="text-2xl font-black text-slate-900">
                          ₹{product.price}{' '}
                          <span className="text-sm font-normal text-slate-500">
                            / {product.priceUnit || 'unit'}
                          </span>
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-slate-800">Price on Inquiry</p>
                      )}
                    </div>
                    {product.moq && (
                      <p className="text-xs text-slate-600 font-medium pt-1">
                        Minimum Order Quantity (MOQ):{' '}
                        <strong className="text-slate-900">{product.moq} {product.priceUnit ? `${product.priceUnit}s` : 'units'}</strong>
                      </p>
                    )}
                  </div>

                  {/* Highlights Bar */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary-500 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">Direct Supply</p>
                        <p className="text-[11px] text-slate-500">Factory direct dispatch</p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">Verified Quality</p>
                        <p className="text-[11px] text-slate-500">B2B procurement grade</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA: Contact Supplier */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Button
                    size="lg"
                    onClick={() => setIsInquiryOpen(true)}
                    className="w-full font-bold shadow-md shadow-primary-500/20"
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    Contact Supplier / Request Quote
                  </Button>
                  <p className="text-center text-[11px] text-slate-400">
                    Direct inquiry sent to supplier's procurement desk with instant notification.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Two-Column Specs & Supplier Profile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Product Specifications & Details (2 Cols) */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-card p-5 sm:p-6 border border-slate-200 shadow-soft space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-500" />
                    <span>Product Specifications</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {product.material && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Material Composition</span>
                        <p className="font-semibold text-slate-800">{product.material}</p>
                      </div>
                    )}
                    {product.sizes && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Dimensions / Available Sizes</span>
                        <p className="font-semibold text-slate-800">{product.sizes}</p>
                      </div>
                    )}
                    {product.usage && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Recommended Usage</span>
                        <p className="font-semibold text-slate-800">{product.usage}</p>
                      </div>
                    )}
                    {product.category && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Industry Category</span>
                        <p className="font-semibold text-slate-800">{product.category.name}</p>
                      </div>
                    )}
                  </div>

                  {product.description && (
                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">Detailed Description</span>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">Tags</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.tags.map((tag, idx) => (
                          <Badge key={idx} variant="gray" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Profile Card (1 Col) */}
              {company && (
                <div className="space-y-4">
                  <div className="bg-white rounded-card p-5 border border-slate-200 shadow-soft space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={company.name}
                        src={company.logoUrl || undefined}
                        size="md"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/companies/${company.slug}`}
                          className="text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors truncate block"
                        >
                          {company.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {company.businessType} • {company.city}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location</span>
                        <span className="font-semibold text-slate-800">
                          {company.city}, {company.state}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Verification</span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Supplier</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Followers</span>
                        <span className="font-semibold text-slate-800">
                          {company.followerCount}
                        </span>
                      </div>
                    </div>

                    <Link href={`/companies/${company.slug}`} className="block pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        View Company Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inquiry Modal */}
        {company && (
          <InquiryModal
            isOpen={isInquiryOpen}
            onClose={() => setIsInquiryOpen(false)}
            companyId={company.id}
            companyName={company.name}
            companyLogo={company.logoUrl}
            companyVerified={company.verified}
            productId={product?.id}
            productTitle={product?.title}
            productPrice={product?.price}
            productPriceUnit={product?.priceUnit}
            productMoq={product?.moq}
          />
        )}

        {/* Edit Product Modal for Owner */}
        {isOwner && product && (
          <AddEditProductModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            product={product}
            companyId={product.companyId}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </AppShell>
  );
}
