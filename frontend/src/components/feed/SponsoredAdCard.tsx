'use client';

import React from 'react';
import { SponsoredAd } from '../../types';
import { ExternalLink, Sparkles, Megaphone } from 'lucide-react';
import { Button } from '../ui/Button';

interface SponsoredAdCardProps {
  ad: SponsoredAd;
}

export function SponsoredAdCard({ ad }: SponsoredAdCardProps) {
  return (
    <article className="card-base p-5 border border-primary-200/80 bg-gradient-to-br from-primary-50/20 via-white to-primary-50/10 space-y-4 shadow-sm hover:border-primary-300 transition-all">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">{ad.company?.name || 'Twintell Partner'}</span>
              <span className="text-[10px] bg-primary-50 text-primary-700 font-extrabold px-2 py-0.5 rounded-full border border-primary-200">
                Promoted
              </span>
            </div>
            {ad.category && (
              <p className="text-[11px] text-slate-500">{ad.category}</p>
            )}
          </div>
        </div>

        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Sponsored
        </span>
      </div>

      {/* Ad Creative Image */}
      {ad.imageUrl && (
        <div className="rounded-xl overflow-hidden max-h-80 bg-slate-100 border border-slate-100">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover hover:scale-101 transition-transform duration-300"
          />
        </div>
      )}

      {/* Title & Copy */}
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 leading-snug">{ad.title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{ad.description}</p>
      </div>

      {/* Bottom CTA Row */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <span className="text-xs text-slate-400">Verified Business Promotion</span>
        <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer">
          <Button
            size="sm"
            className="text-xs font-bold shadow-xs px-4"
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            {ad.ctaText || 'Learn More'}
          </Button>
        </a>
      </div>
    </article>
  );
}
