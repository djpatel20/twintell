'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '../../types';
import { Badge, VerifiedBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Package, ArrowRight, Mail } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onInquireClick?: () => void;
}

export function ProductCard({ product, onInquireClick }: ProductCardProps) {
  const company = product.company;

  return (
    <div className="card-base overflow-hidden p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all duration-200 group">
      <div className="space-y-3">
        {/* Product Image */}
        <Link href={`/products/${product.id}`} className="block relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
              <Package className="w-8 h-8 stroke-[1.5]" />
              <span className="text-xs">No image</span>
            </div>
          )}

          {product.category && (
            <div className="absolute top-2 left-2">
              <Badge variant="primary" size="sm" className="bg-white/90 backdrop-blur-xs text-primary-700 shadow-xs text-[10px]">
                {product.category.name}
              </Badge>
            </div>
          )}
        </Link>

        {/* Title & Pricing */}
        <div className="space-y-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
              {product.title}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 pt-0.5">
            {product.price ? (
              <span className="text-sm font-black text-primary-600">
                ₹{product.price}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {product.priceUnit || 'unit'}
                </span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-600">Price on Inquiry</span>
            )}
          </div>

          {product.moq && (
            <p className="text-[11px] text-slate-500">
              Min. Order: <strong className="text-slate-700 font-semibold">{product.moq} {product.priceUnit ? `${product.priceUnit}s` : 'units'}</strong>
            </p>
          )}
        </div>

        {/* Company Info */}
        {company && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <Link
              href={`/companies/${company.slug}`}
              className="flex items-center gap-2 min-w-0 group/comp"
            >
              <Avatar
                name={company.name}
                src={company.logoUrl || undefined}
                size="xs"
              />
              <span className="text-xs font-semibold text-slate-700 group-hover/comp:text-primary-600 transition-colors truncate">
                {company.name}
              </span>
              {company.verified && <VerifiedBadge showLabel={false} />}
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <Link href={`/products/${product.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
            View Details
          </Button>
        </Link>

        {onInquireClick && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onInquireClick}
            className="text-xs px-2.5 shrink-0"
            title="Contact Supplier"
          >
            <Mail className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
