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
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: 'google' | 'linkedin_oidc') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get<{ data: User }>('/api/me');
      if (res?.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      setSession(initialSession);
      if (initialSession) {
        await fetchUserProfile();
      } else {
        setUser(null);
      }
      
      if (mounted) setIsLoading(false);
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

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      await fetchUserProfile();
    }
    setIsLoading(false);
    return { error: error ? new Error(error.message) : null };
  };

  const signUpWithEmail = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    setIsLoading(true);
    try {
      // 1. First attempt registration via backend API.
      // This uses supabaseAdmin to create the user with email_confirm: true,
      // completely avoiding Supabase email send rate limits (over_email_send_rate_limit).
      try {
        await api.post('/api/register', { email, password, name });

        // User created & auto-confirmed! Sign in immediately to establish active session & JWT token.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setIsLoading(false);
          return { error: new Error(signInError.message) };
        }

        if (signInData.session) {
          setSession(signInData.session);
          await fetchUserProfile();
        }

        setIsLoading(false);
        return { error: null, session: signInData.session };
      } catch (backendErr: any) {
        // If user already exists, return immediate error
        if (backendErr?.code === 'USER_EXISTS' || (backendErr?.message && backendErr.message.includes('already exists'))) {
          setIsLoading(false);
          return { error: new Error(backendErr.message || 'An account with this email already exists. Please sign in.') };
        }

        // If backend route is temporarily unreachable (e.g. during deployment spin-up), fallback to direct Supabase client signUp
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          let userMsg = error.message;
          if (error.message.includes('rate limit') || (error as any).code === 'over_email_send_rate_limit') {
            userMsg = 'Email rate limit reached. Please disable "Confirm email" in Supabase Auth settings or try again shortly.';
          }
          return { error: new Error(userMsg) };
        }

        if (data.session) {
          setSession(data.session);
          await fetchUserProfile();
          setIsLoading(false);
          return { error: null, session: data.session };
        } else {
          setIsLoading(false);
          return {
            error: null,
            session: null,
            message: 'Account created! Please check your email to verify your account before logging in.',
          };
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      return { error: new Error(err.message || 'Signup failed') };
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
