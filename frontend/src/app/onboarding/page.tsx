'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Category } from '../../types';
import {
  User as UserIcon,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, session, role, isLoading: authLoading, refreshUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'USER' | 'COMPANY'>('USER');
  const [step, setStep] = useState<1 | 2>(1); // 1 = Role selection, 2 = Company details
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Company Form state
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Fetch categories for company dropdown
  useEffect(() => {
    api
      .get<{ data: Category[] }>('/api/categories')
      .then((res) => {
        if (res.data) {
          setCategories(res.data);
          if (res.data.length > 0) {
            setCategoryId(res.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Redirect if already onboarded or not logged in
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/login');
      } else if (role !== null) {
        // Role already set (immutable)
        router.push('/');
      }
    }
  }, [session, role, authLoading, router]);

  const handleUserOnboard = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/api/onboarding', { role: 'USER' });
      await refreshUser();
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  const handleCompanyOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await api.post('/api/onboarding', {
        role: 'COMPANY',
        company: {
          name: companyName,
          businessType,
          categoryId: categoryId || undefined,
          city,
          state,
          description: description || undefined,
          logoUrl: logoUrl || undefined,
          tags,
        },
      });

      await refreshUser();
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create company profile');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <span className="text-3xl font-black tracking-tight text-primary-500">twintell</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            <span>Welcome, {user?.name || 'Partner'}! Choose Your Role</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {step === 1 ? 'How will you use twintell?' : 'Setup your Company Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {step === 1
              ? 'Select how you want to participate in the B2B network. Note: Role selection is permanent.'
              : 'Provide basic company details to showcase your business to buyers across India.'}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Standard User */}
              <div
                onClick={() => setSelectedRole('USER')}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 bg-white shadow-soft relative flex flex-col justify-between ${
                  selectedRole === 'USER'
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selectedRole === 'USER' && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center mb-4">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Standard User / Buyer</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    For individual professionals, buyers, procurement managers, and scouts.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Browse feed, directory, & products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Follow companies & send inquiries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Like, comment & share posts</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <span>• No company posting capabilities</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Option 2: Company / Supplier */}
              <div
                onClick={() => setSelectedRole('COMPANY')}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 bg-white shadow-soft relative flex flex-col justify-between ${
                  selectedRole === 'COMPANY'
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selectedRole === 'COMPANY' && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Company / Supplier</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    For manufacturers, wholesalers, suppliers, and registered businesses.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Everything in Standard User</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Publish business updates & posts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>List products in business directory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Free Phase 1 plan included</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {selectedRole === 'USER' ? (
                <Button
                  size="md"
                  onClick={handleUserOnboard}
                  isLoading={isSubmitting}
                  className="font-bold shadow-md shadow-primary-500/20 px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as Standard User
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={() => setStep(2)}
                  className="font-bold shadow-md shadow-primary-500/20 px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next: Setup Company Profile
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: COMPANY PROFILE DETAILS FORM */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-card border border-slate-200 shadow-soft">
            <form onSubmit={handleCompanyOnboard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name *"
                  placeholder="e.g. Apex Industrial Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Exporter">Exporter</option>
                    <option value="Trader">Trader</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="w-full flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Industry Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="City *"
                  placeholder="e.g. Ahmedabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />

                <Input
                  label="State *"
                  placeholder="e.g. Gujarat"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>

              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Brief Company Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your manufacturing capabilities, specializations, and products..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <Input
                label="Tags (comma separated)"
                placeholder="e.g. Packaging, Corrugated Boxes, Eco Friendly"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                helperText="Helps buyers find your company via keywords and search filters."
              />

              <Input
                label="Logo Image URL (Optional)"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  size="md"
                  isLoading={isSubmitting}
                  className="font-bold shadow-md shadow-primary-500/20 px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Company Profile
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
