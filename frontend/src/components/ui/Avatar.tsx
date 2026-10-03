'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const imageAlt = alt || name || 'Avatar';

  const getInitials = (text?: string) => {
    if (!text) return 'U';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const pixelDimensions = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const initials = getInitials(name || alt);

  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-slate-100 border border-slate-200 text-slate-700 font-medium select-none',
          sizes[size],
          className
        )
      )}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={imageAlt}
          width={pixelDimensions[size]}
          height={pixelDimensions[size]}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith('data:')}
        />
      ) : (
        <span className="leading-none">{initials}</span>
      )}
    </div>
  );
}
