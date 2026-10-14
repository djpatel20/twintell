'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '../../types';
import { Button } from '../ui/Button';
import { PlusCircle, PackagePlus, Search, ArrowRight } from 'lucide-react';

interface PersonalWelcomeStripProps {
  user: User | null;
  isLoading?: boolean;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function PersonalWelcomeStrip({ user, isLoading }: PersonalWelcomeStripProps) {
  if (isLoading) {
    return (
      <div className="card-base p-4 bg-panel border-line animate-pulse">
        <div className="h-5 bg-panel-sunk rounded w-48 mb-2" />
        <div className="h-3.5 bg-panel-sunk rounded w-72 mb-4" />
        <div className="flex gap-2">
          <div className="h-8 bg-panel-sunk rounded w-24" />
          <div className="h-8 bg-panel-sunk rounded w-28" />
        </div>
      </div>
    );
  }

  const greeting = getTimeOfDayGreeting();
  const firstName = user?.name ? user.name.split(' ')[0] : null;
  const isCompany = user?.role === 'COMPANY';

  return (
    <div className="card-base p-4 sm:p-5 bg-panel border-line space-y-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="font-display font-semibold text-lg sm:text-xl text-ink tracking-tight">
            {firstName ? `${greeting}, ${firstName}` : 'Welcome to Twintell'}
          </h2>
          <p className="text-xs sm:text-[13px] text-ink-muted">
            {user ? (
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                <Link
                  href="/profile?tab=inquiries"
                  className="hover:text-cobalt font-medium underline underline-offset-2 decoration-line"
                >
                  Direct enquiries
                </Link>
                <span className="text-line">|</span>
                <Link
                  href="/directory"
                  className="hover:text-cobalt font-medium underline underline-offset-2 decoration-line"
                >
                  Verified business directory
                </Link>
              </span>
            ) : (
              'The trade floor for verified Indian manufacturers, wholesalers, and buyers.'
            )}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 pt-1 sm:pt-0 flex-wrap">
          <Link href="/directory">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Search className="w-3.5 h-3.5 text-cobalt" />}
            >
              Find suppliers
            </Button>
          </Link>

          {isCompany && (
            <Link href="/products">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PackagePlus className="w-3.5 h-3.5 text-cobalt" />}
              >
                List product
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
