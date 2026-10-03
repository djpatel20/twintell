import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'verified' | 'success' | 'outline' | 'gray';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'gray',
  size = 'sm',
  icon,
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const variants = {
    primary: 'bg-primary-50 text-primary-600 border border-primary-100',
    secondary: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    outline: 'border border-slate-200 text-slate-600 bg-white',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200/60',
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}>
      {icon}
      {children}
    </span>
  );
}

export function VerifiedBadge({ size = 'sm', showLabel = true }: { size?: 'sm' | 'md'; showLabel?: boolean }) {
  if (!showLabel) {
    return (
      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0 inline-block align-middle ml-1" />
    );
  }

  return (
    <Badge
      variant="verified"
      size={size}
      icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
    >
      Verified
    </Badge>
  );
}
