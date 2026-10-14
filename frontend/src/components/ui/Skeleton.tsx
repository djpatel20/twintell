import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded-md bg-panel-sunk', className)
      )}
      {...props}
    />
  );
}

// Skeletons that match the final layout (identity block, 3 text lines, footer) per DESIGN.md §7
export function PostCardSkeleton() {
  return (
    <div className="card-base p-5 space-y-4 border-l-[3px] border-l-line bg-panel">
      {/* Identity block */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-[8px] shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-32 h-4 rounded" />
              <Skeleton className="w-14 h-4 rounded-full" />
            </div>
            <Skeleton className="w-44 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>

      {/* 3 Text lines */}
      <div className="space-y-2 pt-1">
        <Skeleton className="w-full h-4 rounded" />
        <Skeleton className="w-11/12 h-4 rounded" />
        <Skeleton className="w-3/4 h-4 rounded" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-line">
        <div className="flex items-center gap-5">
          <Skeleton className="w-12 h-6 rounded-md" />
          <Skeleton className="w-12 h-6 rounded-md" />
          <Skeleton className="w-12 h-6 rounded-md" />
        </div>
        <Skeleton className="w-8 h-6 rounded-md" />
      </div>
    </div>
  );
}
