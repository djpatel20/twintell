'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, session, role, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (session) {
      if (role === null) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    }
  }, [session, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name');
          setIsSubmitting(false);
          return;
        }

        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setErrorMsg(res.error.message);
        } else if (res.session) {
          setSuccessMsg('Account created successfully! Redirecting to setup...');
          router.push('/onboarding');
        } else {
          setSuccessMsg(
            res.message || 'Account created! Please check your email to verify your account, then sign in.'
          );
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          router.push(role === null ? '/onboarding' : '/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    const res = await signInWithOAuth('google');
    if (res.error) {
      setErrorMsg(res.error.message);
    }
  };

  const handleLinkedInLogin = async () => {
    setErrorMsg(null);
    const res = await signInWithOAuth('linkedin_oidc');
    if (res.error) {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-black tracking-tight text-primary-500">twintell</span>
        </Link>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Join twintell B2B Network'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          {mode === 'signin'
            ? 'Connect with verified manufacturers, suppliers, and buyers.'
            : 'Grow your business network and showcase your industrial products.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-5 sm:px-8 rounded-card border border-slate-200 shadow-soft space-y-6">
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social OAuth Buttons */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full font-semibold border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.99 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLinkedInLogin}
              className="w-full font-semibold border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 text-slate-700"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.5 1.5 0 0 0 1.5-1.5c0-.82-.67-1.5-1.5-1.5a1.5 1.5 0 0 0-1.5 1.5c0 .83.67 1.5 1.5 1.5m1.39 9.74v-8.37H5.07v8.37h2.78z" />
              </svg>
              <span>Continue with LinkedIn</span>
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="e.g. Rahul Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Work or Personal Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              className="w-full font-bold shadow-md shadow-primary-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {mode === 'signin' ? 'Sign In' : 'Create Free Account'}
            </Button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            By proceeding, you agree to twintell&apos;s{' '}
            <span className="text-slate-600 underline cursor-pointer">Terms of Service</span> and{' '}
            <span className="text-slate-600 underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 text-primary-500 animate-spin">
            <Loader2 className="w-8 h-8" />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
