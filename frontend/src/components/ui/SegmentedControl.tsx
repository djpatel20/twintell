'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={twMerge(
        clsx(
          'inline-flex items-center p-1 bg-panel-sunk rounded-full border border-line select-none',
          size === 'sm' ? 'h-8' : 'h-9',
          className
        )
      )}
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-120 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-1',
              size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-xs',
              isActive
                ? 'bg-panel text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink hover:bg-panel/50'
            )}
          >
            {option.icon && (
              <span className={clsx('w-3.5 h-3.5', isActive ? 'text-ink' : 'text-ink-muted')}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={clsx(
                  'text-[10px] tabular-nums px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-panel-sunk text-ink' : 'bg-line text-ink-muted'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
