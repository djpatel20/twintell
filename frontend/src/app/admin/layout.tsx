'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Megaphone,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Users,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  // Restrict access if not logged in or not ADMIN
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white">Restricted Access</h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The Twintell Administrative Console is restricted to authenticated system administrators.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            {user ? (
              <span>
                Logged in as <strong className="text-slate-200">{user.email}</strong> (Role:{' '}
                <span className="text-amber-400 font-semibold">{user.role || 'Unassigned'}</span>)
              </span>
            ) : (
              <span>You are not currently logged in.</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full text-xs border-slate-700 text-slate-200 hover:bg-slate-800">
                Return to Twintell
              </Button>
            </Link>
            {!user && (
              <Link href="/login" className="w-full">
                <Button variant="primary" className="w-full text-xs font-bold">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Subscriptions & Companies', href: '/admin/subscriptions', icon: Building2 },
    { label: 'In-Feed Ads', href: '/admin/ads', icon: Megaphone },
    { label: 'Content Moderation', href: '/admin/moderation', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between p-4 sm:p-5">
        <div className="space-y-6">
          {/* Admin Brand */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white block">Twintell</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-primary-400 block -mt-1">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Return to Main App */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">System Admin</p>
            </div>
          </div>

          <Link href="/" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-slate-700 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Main App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 min-w-0 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
