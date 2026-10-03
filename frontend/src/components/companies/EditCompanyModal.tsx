'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../../types';

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
  const [description, setDescription] = useState(initialData.description || '');
  const [tagsInput, setTagsInput] = useState((initialData.tags || []).join(', '));
  const [yearFounded, setYearFounded] = useState<string>(
    initialData.yearFounded ? String(initialData.yearFounded) : ''
  );
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState(initialData.coverUrl || '');

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
        logoUrl: logoUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
      });

      await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update company profile.');
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

          <Input
            label="Company Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />

          <Input
            label="Cover Banner URL"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
          />

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
