'use client';

import React from 'react';
import { Chip, ChipProps } from './Chip';

export const CATEGORY_COLORS: Record<string, string> = {
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
