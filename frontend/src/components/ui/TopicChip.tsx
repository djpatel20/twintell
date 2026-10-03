'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TopicChipProps {
  label: string;
  icon?: React.ReactNode;
  count?: string | number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TopicChip({
  label,
  icon,
  count,
  isSelected = false,
  onClick,
  className,
}: TopicChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border select-none',
          isSelected
            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
          className
        )
      )}
    >
      {icon && <span className={isSelected ? 'text-white' : 'text-slate-500'}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'text-[10px] ml-0.5',
            isSelected ? 'text-white/80' : 'text-slate-400'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
