'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '../lib/query-client';

import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ToastProvider } from '../context/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>{children}</ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
