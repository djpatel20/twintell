'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SegmentedControl, SegmentOption } from './SegmentedControl';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className,
}: TabsProps) {
  if (variant === 'pill') {
    return (
      <SegmentedControl
        options={tabs as SegmentOption[]}
        value={activeTab}
        onChange={onChange}
        className={className}
      />
    );
  }

  // Underline variant adhering to DESIGN.md tokens
  return (
    <div className={twMerge(clsx('flex border-b border-line overflow-x-auto no-scrollbar', className))}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-cobalt',
              isActive
                ? 'border-cobalt text-cobalt font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                  isActive ? 'bg-cobalt-soft text-cobalt font-semibold' : 'bg-panel-sunk text-ink-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
