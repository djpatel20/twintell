'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { X, Send, Building2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyVerified?: boolean;
  productId?: string | null;
  productTitle?: string | null;
  productPrice?: number | null;
  productPriceUnit?: string | null;
  productMoq?: number | null;
}

export function InquiryModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  companyLogo,
  companyVerified,
  productId,
  productTitle,
  productPrice,
  productPriceUnit,
  productMoq,
}: InquiryModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [message, setMessage] = useState(
    productTitle
      ? `Hi ${companyName},\n\nWe are interested in your product "${productTitle}". Please share pricing for bulk quantities, lead time, and specifications.`
      : `Hi ${companyName},\n\nWe would like to connect regarding your manufacturing and wholesale supply capabilities.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    if (message.trim().length < 10) {
      setErrorMsg('Please write a detailed inquiry message (at least 10 characters).');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.post('/api/inquiries', {
        companyId,
        productId: productId || null,
        message: message.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contact Supplier</h3>
              <p className="text-xs text-slate-500">Direct business inquiry to verified company</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Supplier Info Snippet */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={companyName} src={companyLogo || undefined} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">{companyName}</span>
                  {companyVerified && <VerifiedBadge showLabel={false} />}
                </div>
                <p className="text-[11px] text-slate-500">Verified Supplier</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">
              Response rate: 98%
            </span>
          </div>

          {/* Product Snippet if product is attached */}
          {productTitle && (
            <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="w-4 h-4 text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{productTitle}</p>
                  <p className="text-[11px] text-slate-500">
                    {productPrice ? `₹${productPrice} / ${productPriceUnit || 'unit'}` : 'Custom Quotation'}
                    {productMoq ? ` • Min Order: ${productMoq} units` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  {companyName} has received your inquiry and will reach out via your registered contact details.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Inquiry Message / RFQ Details
                  </label>
                  <span className="text-[11px] text-slate-400">{message.length}/2000</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  rows={5}
                  maxLength={2000}
                  placeholder="Detail your procurement requirements, volume, specifications, and delivery location..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                />
              </div>

              {/* User Identity Note */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
                <span>Sending as: <strong>{user?.name || 'Your Account'}</strong> ({user?.email || 'Login required'})</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={message.trim().length < 10}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="font-bold shadow-sm"
                >
                  Send Inquiry
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
