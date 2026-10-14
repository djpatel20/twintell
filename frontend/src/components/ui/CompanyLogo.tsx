'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CompanyLogoProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  categoryColor?: string;
  className?: string;
}

export function CompanyLogo({
  src,
  name,
  size = 'md',
  categoryColor,
  className,
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (text: string) => {
    if (!text) return 'CO';
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  // Dimensions: 8px radius square per DESIGN.md §5
  const sizes = {
    sm: 'w-8 h-8 rounded-[6px] text-xs',
    md: 'w-10 h-10 rounded-[8px] text-sm', // 40px sq default per §7
    lg: 'w-12 h-12 rounded-[8px] text-base',
    xl: 'w-16 h-16 rounded-[10px] text-lg font-bold',
  };

  const pixelDimensions = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const initials = getInitials(name);

  return (
    <div
      className={twMerge(
        clsx(
          'relative flex items-center justify-center overflow-hidden shrink-0 border border-line select-none font-semibold',
          sizes[size],
          className
        )
      )}
      style={{
        backgroundColor: !src || imageError ? (categoryColor ? `${categoryColor}15` : 'var(--cobalt-soft)') : undefined,
        color: !src || imageError ? (categoryColor || 'var(--cobalt)') : undefined,
      }}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={`${name} logo`}
          width={pixelDimensions[size]}
          height={pixelDimensions[size]}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith('data:') || src.startsWith('blob:')}
        />
      ) : (
        <span className="leading-none tracking-tight">{initials}</span>
      )}
    </div>
  );
}
