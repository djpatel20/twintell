'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api-client';
import { User } from '@/types';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleOAuthCallback = async () => {
      try {
        // 1. If PKCE code exists in search query, exchange it for session
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // 2. Retrieve verified session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          // If no session detected yet, wait briefly for auth listener
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession && isMounted) {
              authListener.subscription.unsubscribe();
              await resolveRedirect();
            }
          });
          return;
        }

        if (isMounted) {
          await resolveRedirect();
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('OAuth callback error:', err);
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => {
          if (isMounted) router.replace('/login');
        }, 3000);
      }
    };

    const resolveRedirect = async () => {
      try {
        // Query backend /api/me (which also triggers JIT user provisioning in Prisma)
        const res = await api.get<{ data: User }>('/api/me');
        if (res?.data && res.data.role === null) {
          router.replace('/onboarding');
        } else {
          router.replace('/');
        }
      } catch {
        // If /api/me fails or is temporarily unreachable, default to home
        router.replace('/');
      }
    };

    handleOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {errorMsg ? (
        <div className="max-w-md w-full bg-white p-6 rounded-card border border-rose-200 text-center shadow-soft">
          <p className="text-sm font-semibold text-rose-600 mb-1">Sign In Failed</p>
          <p className="text-xs text-slate-500 mb-3">{errorMsg}</p>
          <p className="text-xs text-slate-400">Redirecting to login page...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Completing sign in...</p>
        </div>
      )}
    </div>
  );
}
