'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SponsoredAd } from '../../types';
import { ExternalLink, Sparkles, Megaphone, Building2, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { InquiryModal } from '../products/InquiryModal';
import { useAuth } from '../../context/AuthContext';

interface SponsoredAdCardProps {
  ad: SponsoredAd;
}

export function SponsoredAdCard({ ad }: SponsoredAdCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const companySlug = ad.company?.slug;
  const companyUrl = companySlug ? `/companies/${companySlug}` : ad.ctaUrl || '#';

  const handleEnquireNow = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsInquiryOpen(true);
  };

  return (
    <>
      <article className="card-base p-5 border border-primary-200/80 bg-gradient-to-br from-primary-50/20 via-white to-primary-50/10 space-y-4 shadow-sm hover:border-primary-300 transition-all">
        {/* Top Header Badge & Company Logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {ad.company ? (
              <Link href={companyUrl} className="shrink-0">
                <Avatar
                  name={ad.company.name}
                  src={ad.company.logoUrl || undefined}
                  size="md"
                  className="rounded-xl border border-primary-200 shadow-2xs"
                />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ad.company?.slug ? (
                  <Link
                    href={companyUrl}
                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors truncate"
                  >
                    {ad.company.name}
                  </Link>
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {ad.company?.name || 'Twintell Partner'}
                  </span>
                )}
                <span className="text-[10px] bg-primary-50 text-primary-700 font-extrabold px-2 py-0.5 rounded-full border border-primary-200">
                  Promoted
                </span>
              </div>
              {ad.category && (
                <p className="text-[11px] text-slate-500 truncate">{ad.category}</p>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Sponsored
          </span>
        </div>

        {/* Ad Creative Image (Preserves natural aspect ratio across all devices) */}
        {ad.imageUrl && (
          <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-auto max-w-full h-auto max-h-[70vh] sm:max-h-[500px] object-contain mx-auto block hover:scale-[1.01] transition-transform duration-300 rounded-xl"
            />
          </div>
        )}

        {/* Title & Copy */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 leading-snug">{ad.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{ad.description}</p>
        </div>

        {/* Bottom Dual CTA Row: Visit Company & Enquire Now */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Verified Business Promotion
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* 1. Visit Company Button */}
            <Link href={companyUrl} className="flex-1 sm:flex-none">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs font-bold px-3.5 border-slate-200"
                leftIcon={<Building2 className="w-3.5 h-3.5 text-slate-500" />}
              >
                Visit Company
              </Button>
            </Link>

            {/* 2. Enquire Now Button */}
            {ad.company && (
              <Button
                size="sm"
                onClick={handleEnquireNow}
                className="flex-1 sm:flex-none text-xs font-bold shadow-xs px-3.5"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
              >
                Enquire Now
              </Button>
            )}

            {/* Fallback external link if no company linked */}
            {!ad.company && ad.ctaUrl && (
              <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="text-xs font-bold shadow-xs px-4" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  {ad.ctaText || 'Learn More'}
                </Button>
              </a>
            )}
          </div>
        </div>
      </article>

      {/* Inquiry Modal */}
      {isInquiryOpen && ad.company && (
        <InquiryModal
          isOpen={isInquiryOpen}
          onClose={() => setIsInquiryOpen(false)}
          companyId={ad.company.id}
          companyName={ad.company.name}
          companyLogo={ad.company.logoUrl}
        />
      )}
    </>
  );
}
