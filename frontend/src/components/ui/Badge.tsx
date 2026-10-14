import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check, Star } from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'verified' | 'gold' | 'new' | 'count' | 'neutral' | 'primary' | 'secondary' | 'gray';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className,
}: BadgeProps) {
  // Radius: 999px per DESIGN.md §5, text-xs font-medium per §4
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variants = {
    verified: 'border border-green text-green bg-green/5 font-medium',
    gold: 'bg-amber-soft text-amber border border-amber/20 font-medium',
    new: 'bg-cobalt-soft text-cobalt font-medium',
    count: 'bg-red text-white min-h-[18px] min-w-[18px] px-1.5 text-[11px] font-semibold tabular-nums justify-center leading-none',
    neutral: 'bg-panel-sunk text-ink-muted border border-line',
    primary: 'bg-cobalt-soft text-cobalt',
    secondary: 'bg-panel-sunk text-ink-muted',
    gray: 'bg-panel-sunk text-ink-muted border border-line',
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}>
      {icon}
      {children}
    </span>
  );
}

// Company identity block verification badge per DESIGN.md §7
export function VerifiedBadge({
  tier = 'verified',
  showLabel = true,
  className,
}: {
  tier?: 'verified' | 'gold';
  showLabel?: boolean;
  className?: string;
}) {
  if (tier === 'gold') {
    return (
      <span
        className={twMerge(
          clsx(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-soft text-amber border border-amber/20',
            className
          )
        )}
      >
        <Star className="w-3 h-3 fill-amber text-amber shrink-0" />
        {showLabel && <span>Gold</span>}
      </span>
    );
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border border-green text-green bg-green/5',
          className
        )
      )}
    >
      <Check className="w-3 h-3 stroke-[2.5] text-green shrink-0" />
      {showLabel && <span>Verified</span>}
    </span>
  );
}
