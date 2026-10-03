'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
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
  if (variant === 'underline') {
    return (
      <div className={twMerge(clsx('flex border-b border-slate-200 overflow-x-auto no-scrollbar', className))}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
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

  // Pill segmented variant
  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex p-1 bg-slate-100/90 rounded-full border border-slate-200/60 overflow-x-auto no-scrollbar',
          className
        )
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 whitespace-nowrap flex items-center gap-1.5',
              isActive
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
