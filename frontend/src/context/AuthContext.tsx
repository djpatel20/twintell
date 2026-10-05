'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api-client';
import { User, Role, Company } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role | null;
  company: Company | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
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

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setIsLoading(true);
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

    if (!error && data.session) {
      setSession(data.session);
      await fetchUserProfile();
    }
    setIsLoading(false);
    return { error: error ? new Error(error.message) : null };
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
