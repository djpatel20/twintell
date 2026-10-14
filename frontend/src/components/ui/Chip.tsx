'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ChipProps {
  label: string;
  dotColor?: string; // CSS color string or class
  count?: string | number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function Chip({
  label,
  dotColor,
  count,
  isSelected = false,
  onClick,
  className,
  icon,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={twMerge(
        clsx(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-120 border select-none focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2',
          isSelected
            ? 'bg-cobalt-soft text-cobalt border-cobalt/20 font-semibold'
            : 'bg-panel text-ink border-line hover:bg-panel-sunk hover:border-ink-faint',
          className
        )
      )}
    >
      {dotColor && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      {icon && <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'text-[11px] tabular-nums',
            isSelected ? 'text-cobalt/80 font-bold' : 'text-ink-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
