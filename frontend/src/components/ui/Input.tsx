'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcutHint?: string; // e.g. "Ctrl K" or "⌘K"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      shortcutHint,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-ink-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                // Height 40, 8px radius, bg-panel-sunk, no border at rest, --line + 3px cobalt-soft ring on focus per DESIGN.md §7
                'w-full h-10 rounded-lg bg-panel-sunk border border-transparent px-3 text-sm text-ink placeholder:text-ink-faint transition-all duration-120 outline-none',
                'focus:border-line focus:ring-[3px] focus:ring-cobalt-soft focus:bg-panel',
                leftIcon ? 'pl-9' : '',
                rightIcon || shortcutHint ? 'pr-14' : '',
                error ? 'border-red focus:border-red focus:ring-red/20' : '',
                className
              )
            )}
            {...props}
          />
          {shortcutHint && !rightIcon && (
            <div className="absolute right-2.5 pointer-events-none flex items-center">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium text-ink-muted bg-panel border border-line shadow-xs">
                {shortcutHint}
              </kbd>
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 text-ink-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
