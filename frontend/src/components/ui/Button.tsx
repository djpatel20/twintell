'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles: 8px radius per DESIGN.md §5, focus visible outline per §10, 120ms transition per §9
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

    // DESIGN.md §7 Button Variants
    const variants = {
      primary:
        'bg-cobalt text-white hover:bg-[#2338b3] active:bg-[#1d2e94]',
      secondary:
        'bg-panel border border-line text-ink hover:bg-panel-sunk hover:border-ink-faint',
      outline:
        'bg-panel border border-line text-ink hover:bg-panel-sunk hover:border-ink-faint',
      ghost:
        'bg-transparent text-ink-muted hover:bg-panel-sunk hover:text-ink',
      danger:
        'text-red bg-transparent hover:bg-red/10 border border-transparent hover:border-red/20',
    };

    // Heights 36 (default/md), 32 (sm), 44 (lg/mobile primary) per DESIGN.md §7
    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-sm gap-2',
      lg: 'h-11 px-4 text-base font-semibold gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{leftIcon}</span>
        )}
        <span className="inline-flex items-center justify-center gap-2">{children}</span>
        {!isLoading && rightIcon && (
          <span className="w-4 h-4 shrink-0 flex items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
