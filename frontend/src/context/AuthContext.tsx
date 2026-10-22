'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api-client';
import { User, Role, Company } from '../types';
import { Session } from '@supabase/supabase-js';

interface SignUpResult {
  error: Error | null;
  session?: Session | null;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role | null;
  company: Company | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<SignUpResult>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null; message?: string }>;
  signInWithOAuth: (provider: 'google' | 'linkedin_oidc') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get<{ data: User }>('/api/me');
      if (res?.data) {
        setUser(res.data);
        return res.data;
      } else {
        setUser(null);
        return null;
      }
    } catch (err: any) {
      // If 401 Unauthorized or 404 Not Found, token in local storage is stale,
      // invalid, or belongs to a missing user. Clear session so the app doesn't get trapped in a zombie state.
      if (err?.status === 401 || err?.status === 404) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
      }
      setUser(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUserProfile();
    setIsLoading(false);
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (initialSession) {
          setSession(initialSession);
          await fetchUserProfile();
        } else {
          setSession(null);
          setUser(null);
        }
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      // Prevent INITIAL_SESSION from unsetting loading prematurely
      // since checkSession() handles the initial load correctly.
      if (event === 'INITIAL_SESSION') {
        return;
      }

      setSession(currentSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          await fetchUserProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: Error | null; user?: User | null }> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let profile: User | null = null;
    if (!error && data.session) {
      setSession(data.session);
      profile = await fetchUserProfile();
    }
    setIsLoading(false);
    return { error: error ? new Error(error.message) : null, user: profile };
  };

  const signUpWithEmail = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    setIsLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://twintellb2b.com';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setIsLoading(false);
        return { error: new Error(error.message) };
      }

      // Supabase returns an empty identities array if user is already registered and confirmed
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setIsLoading(false);
        return {
          error: new Error('An account with this email already exists. Please sign in or reset your password.'),
        };
      }

      // If email confirmation is disabled or user was already confirmed
      if (data.session) {
        setSession(data.session);
        await fetchUserProfile();
        setIsLoading(false);
        return { error: null, session: data.session };
      }

      // Email confirmation required: Supabase dispatched confirmation email via custom SMTP
      setIsLoading(false);
      return {
        error: null,
        session: null,
        message: 'Account created! We have sent a verification link to your email. Please verify before signing in.',
      };
    } catch (err: any) {
      setIsLoading(false);
      return { error: new Error(err.message || 'Signup failed') };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error: Error | null; message?: string }> => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://twintellb2b.com';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null, message: 'Verification email resent! Please check your inbox and spam folder.' };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to resend verification email.') };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'linkedin_oidc') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    session,
    role: user?.role || null,
    company: user?.company || null,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    signInWithOAuth,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
