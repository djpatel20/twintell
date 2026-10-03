'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Users, Package, ArrowRight, UserPlus, UserCheck } from 'lucide-react';

export interface DirectoryCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string;
  city: string;
  state: string;
  description: string | null;
  tags: string[];
  verified: boolean;
  followerCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  _count?: {
    products: number;
    posts: number;
    followers: number;
  };
  isFollowing?: boolean;
}

interface CompanyCardProps {
  company: DirectoryCompany;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const router = useRouter();
  const { user, company: currentCompany } = useAuth();

  const [isFollowing, setIsFollowing] = useState(company.isFollowing || false);
  const [followerCount, setFollowerCount] = useState(company.followerCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwnCompany = currentCompany?.id === company.id;

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    if (isOwnCompany) return;

    const previousFollowing = isFollowing;
    const previousCount = followerCount;

    // Optimistic UI update
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }

    setIsSubmitting(true);
    try {
      if (previousFollowing) {
        await api.delete(`/api/companies/${company.id}/follow`);
      } else {
        await api.post(`/api/companies/${company.id}/follow`);
      }
    } catch {
      // Revert upon error
      setIsFollowing(previousFollowing);
      setFollowerCount(previousCount);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-base p-5 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header: Logo, Name, Location */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Link href={`/companies/${company.slug}`} className="shrink-0">
              <Avatar
                name={company.name}
                src={company.logoUrl || undefined}
                size="lg"
                className="hover:ring-2 hover:ring-primary-400 transition-all shadow-sm"
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/companies/${company.slug}`}
                  className="text-base font-bold text-slate-900 hover:text-primary-600 transition-colors truncate"
                >
                  {company.name}
                </Link>
                {company.verified && <VerifiedBadge showLabel={false} />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                <span className="font-semibold text-slate-700">{company.businessType}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {company.city}, {company.state}
                </span>
              </div>
            </div>
          </div>

          {/* Follow Button (if not own company) */}
          {!isOwnCompany && (
            <Button
              size="sm"
              variant={isFollowing ? 'outline' : 'secondary'}
              onClick={handleFollowToggle}
              disabled={isSubmitting}
              leftIcon={
                isFollowing ? (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )
              }
              className={`shrink-0 text-xs font-semibold h-8 px-3 ${
                isFollowing ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        {/* Category Pill */}
        {company.category && (
          <div className="pt-0.5">
            <Badge variant="primary" size="sm" className="font-medium text-[11px]">
              {company.category.name}
            </Badge>
          </div>
        )}

        {/* Short Description */}
        {company.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {company.description}
          </p>
        )}

        {/* Tags */}
        {company.tags && company.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {company.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full"
              >
                #{tag}
              </span>
            ))}
            {company.tags.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{company.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Profile Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1" title="Followers">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-700 font-semibold">{followerCount}</strong>
          </span>
          {company._count && (
            <span className="flex items-center gap-1" title="Catalog Products">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-700 font-semibold">{company._count.products}</strong>
              <span className="hidden sm:inline">products</span>
            </span>
          )}
        </div>

        <Link
          href={`/companies/${company.slug}`}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
