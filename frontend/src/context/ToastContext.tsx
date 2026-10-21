'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, description?: string, duration?: number) => string;
    error: (message: string, description?: string, duration?: number) => string;
    warning: (message: string, description?: string, duration?: number) => string;
    info: (message: string, description?: string, duration?: number) => string;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

// Standalone event-driven bus allowing `toast.*` calls outside of React component trees
type ToastSubscriber = (toast: ToastItem) => void;
type DismissSubscriber = (id: string) => void;

let toastSubscribers: ToastSubscriber[] = [];
let dismissSubscribers: DismissSubscriber[] = [];

export const toast = {
  success: (message: string, description?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toastSubscribers.forEach((fn) => fn({ id, type: 'success', message, description, duration }));
    return id;
  },
  error: (message: string, description?: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toastSubscribers.forEach((fn) => fn({ id, type: 'error', message, description, duration }));
    return id;
  },
  warning: (message: string, description?: string, duration = 4500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toastSubscribers.forEach((fn) => fn({ id, type: 'warning', message, description, duration }));
    return id;
  },
  info: (message: string, description?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toastSubscribers.forEach((fn) => fn({ id, type: 'info', message, description, duration }));
    return id;
  },
  dismiss: (id: string) => {
    dismissSubscribers.forEach((fn) => fn(id));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, message, description, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, message, description, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 concurrent toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  useEffect(() => {
    const handleAdd: ToastSubscriber = (newToast) => {
      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    const handleDismiss: DismissSubscriber = (id) => {
      removeToast(id);
    };

    toastSubscribers.push(handleAdd);
    dismissSubscribers.push(handleDismiss);

    return () => {
      toastSubscribers = toastSubscribers.filter((fn) => fn !== handleAdd);
      dismissSubscribers = dismissSubscribers.filter((fn) => fn !== handleDismiss);
    };
  }, [removeToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        toast,
      }}
    >
      {children}

      {/* Toast Notification Container */}
      <div
        className="fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[10000] flex flex-col gap-2.5 max-w-sm sm:w-96 pointer-events-none"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={clsx(
              'pointer-events-auto bg-white rounded-xl shadow-xl border p-3.5 flex items-start gap-3 transition-all duration-200 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-2',
              item.type === 'success' && 'border-emerald-200 shadow-emerald-500/5',
              item.type === 'error' && 'border-rose-200 shadow-rose-500/5',
              item.type === 'warning' && 'border-amber-200 shadow-amber-500/5',
              item.type === 'info' && 'border-blue-200 shadow-blue-500/5'
            )}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-cobalt" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-semibold text-ink leading-tight">{item.message}</h4>
              {item.description && (
                <p className="text-[11px] text-ink-muted mt-0.5 leading-normal break-words">
                  {item.description}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-ink-muted hover:text-ink p-1 rounded-md hover:bg-panel-sunk transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback to standalone toast object if used outside provider
    return {
      toasts: [],
      addToast: () => '',
      removeToast: () => {},
      toast,
    };
  }
  return context;
}
