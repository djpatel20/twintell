'use client';

import React from 'react';
import { Chip, ChipProps } from './Chip';

export const CATEGORY_COLORS: Record<string, string> = {
  // 13 Unified Business Categories
  'industrial-plants-machinery': 'var(--cat-mfg)',
  'industrial-equipment-supplies': 'var(--cobalt)',
  'electrical-electronics': 'var(--cat-tech)',
  'construction-building-materials': 'var(--cat-wholesale)',
  'textiles-apparel-fashion': '#8b5cf6',
  'food-beverages-agriculture': '#10b981',
  'chemicals': '#f43f5e',
  'plastics-rubber': '#06b6d4',
  'metals-steel-minerals': '#64748b',
  'packaging-printing-paper': '#f59e0b',
  'beauty-personal-care-wellness': '#ec4899',
  'automotive-spare-parts': '#ef4444',
  'it-software-digital-services': '#6366f1',

  // Legacy topics
  MANUFACTURING: 'var(--cat-mfg)',
  BUSINESS_NEWS: 'var(--cat-news)',
  PRODUCTS: 'var(--cat-products)',
  WHOLESALE: 'var(--cat-wholesale)',
  D2C_BRANDS: 'var(--cat-d2c)',
  TECHNOLOGY: 'var(--cat-tech)',
  AGRICULTURE: 'var(--cat-products)',
  FINANCE: 'var(--cat-mfg)',
  JOBS: 'var(--cat-news)',
  MEMES: 'var(--cat-d2c)',
};

export interface TopicChipProps extends Omit<ChipProps, 'dotColor'> {
  topicId?: string;
  dotColor?: string;
}

export function TopicChip({ topicId, dotColor, ...props }: TopicChipProps) {
  const resolvedDot = dotColor || (topicId ? CATEGORY_COLORS[topicId] : undefined);
  return <Chip dotColor={resolvedDot} {...props} />;
}
