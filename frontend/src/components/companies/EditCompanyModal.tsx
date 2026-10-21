'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Building2, AlertCircle, CheckCircle2, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { Category } from '../../types';
import { uploadFileToStorage } from '../../lib/upload';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData: {
    name: string;
    businessType: string;
    categoryId?: string | null;
    city: string;
    state: string;
    description?: string | null;
    tags?: string[];
    yearFounded?: number | null;
    gstin?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
  };
}

export function EditCompanyModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EditCompanyModalProps) {
  const { refreshUser } = useAuth();

  const [name, setName] = useState(initialData.name || '');
  const [businessType, setBusinessType] = useState(initialData.businessType || 'Manufacturer');
  const [categoryId, setCategoryId] = useState<string>(initialData.categoryId || '');
  const [city, setCity] = useState(initialData.city || '');
  const [state, setState] = useState(initialData.state || '');
  const [gstin, setGstin] = useState(initialData.gstin || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [tagsInput, setTagsInput] = useState((initialData.tags || []).join(', '));
  const [yearFounded, setYearFounded] = useState<string>(
    initialData.yearFounded ? String(initialData.yearFounded) : ''
  );
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState(initialData.coverUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadFileToStorage(file);
      setLogoUrl(url);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadFileToStorage(file);
      setCoverUrl(url);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload cover banner.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories'),
  });

  const categories = categoriesData?.data || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company name is required.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      setErrorMsg('City and state are required.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const parsedYear = yearFounded.trim() ? parseInt(yearFounded.trim(), 10) : null;

      await api.patch('/api/companies/me', {
        name: name.trim(),
        businessType: businessType.trim(),
        categoryId: categoryId || null,
        city: city.trim(),
        state: state.trim(),
        description: description.trim() || null,
        tags: parsedTags,
        yearFounded: parsedYear,
        gstin: gstin.trim() || null,
        logoUrl: logoUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
      });

      await refreshUser();
      toast.success('Company Profile Updated', 'Your changes have been saved.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to update company profile.';
      setErrorMsg(msg);
      toast.error('Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-card shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" />
            <h3 className="text-base font-bold text-slate-900">Edit Company Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Company Legal / Brand Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Supplier">Supplier</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Distributor">Distributor</option>
                <option value="Trader">Trader</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Industry Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ahmedabad"
              required
            />
            <Input
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Gujarat"
              required
            />
          </div>

          <Input
            label="Year Founded"
            type="number"
            value={yearFounded}
            onChange={(e) => setYearFounded(e.target.value)}
            placeholder="e.g. 2012"
          />

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                GSTIN (GST Identification Number)
              </label>
              {gstin.trim().length >= 15 ? (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  ✓ Verified Badge Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">15 characters</span>
              )}
            </div>
            <Input
              placeholder="e.g. 24AAACG1234A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              maxLength={15}
              helperText="Adding a valid 15-digit GSTIN automatically grants the Verified trust mark on your company profile."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company Description / Overview
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Provide a concise description of your business capabilities, product lines, and export experience..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <Input
            label="Business Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. Packaging, Corrugated Boxes, Bulk Order"
          />

          {/* Company Logo File Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Company Logo Image
            </label>
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            {logoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Logo Uploaded</p>
                  <p className="text-[10px] text-slate-500 truncate">{logoUrl}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="text-xs"
                  >
                    Change
                  </Button>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-primary-500 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors bg-slate-50/50"
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span>Uploading logo to storage...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-primary-500" />
                    <span>Upload Company Logo (PNG, JPG, WebP)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Cover Banner File Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Company Cover Banner Image
            </label>
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />
            {coverUrl ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={coverUrl}
                  alt="Company Cover"
                  className="w-20 h-10 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Banner Uploaded</p>
                  <p className="text-[10px] text-slate-500 truncate">{coverUrl}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="text-xs"
                  >
                    Change
                  </Button>
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-primary-500 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors bg-slate-50/50"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span>Uploading banner to storage...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-primary-500" />
                    <span>Upload Cover Banner (PNG, JPG, WebP)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="md" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
