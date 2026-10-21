'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { toast } from '../../../context/ToastContext';
import { SponsoredAd } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Calendar,
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react';
import { clsx } from 'clsx';
import { uploadFileToStorage } from '../../../lib/upload';

export default function AdminAdsPage() {
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [ctaUrl, setCtaUrl] = useState('');
  const [category, setCategory] = useState('');
  const [durationDays, setDurationDays] = useState(30);

  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setFormError(null);
    try {
      const url = await uploadFileToStorage(file);
      setImageUrl(url);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to upload banner creative image.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch all ads
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => api.get<{ data: SponsoredAd[] }>('/api/admin/ads'),
  });

  const ads = data?.data || [];

  // Mutation: Create Ad
  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/api/admin/ads', {
        title,
        description,
        imageUrl,
        ctaText,
        ctaUrl,
        category: category || undefined,
        durationDays,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Campaign Created', 'Sponsored ad campaign has been published.');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create sponsored ad';
      setFormError(msg);
      toast.error('Campaign Creation Failed', msg);
    },
  });

  // Mutation: Toggle Status (Pause / Resume)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ adId, newStatus }: { adId: string; newStatus: 'ACTIVE' | 'PAUSED' }) =>
      api.patch(`/api/admin/ads/${adId}`, { status: newStatus }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      toast.info(`Campaign ${vars.newStatus === 'ACTIVE' ? 'Resumed' : 'Paused'}`);
    },
    onError: (err: any) => {
      toast.error('Update Failed', err?.message);
    },
  });

  // Mutation: Delete Ad
  const deleteMutation = useMutation({
    mutationFn: (adId: string) => api.delete(`/api/admin/ads/${adId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Campaign Deleted', 'Sponsored ad has been removed.');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.message);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCtaText('Learn More');
    setCtaUrl('');
    setCategory('');
    setDurationDays(30);
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imageUrl || !ctaUrl) {
      setFormError('Please fill in all required fields.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Monetization & Advertising</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            In-Feed Sponsored Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish, schedule, and track sponsored promotional cards appearing seamlessly between feed posts.
          </p>
        </div>

        <Button
          size="sm"
          className="font-bold text-xs"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          New Sponsored Ad
        </Button>
      </div>

      {/* Ads List */}
      {isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading sponsored campaigns...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center text-xs text-rose-300">
          Failed to load sponsored campaigns.
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200">No sponsored ads active</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first promotional campaign to begin generating advertising revenue and promoting partner businesses.
            </p>
          </div>
          <Button
            size="sm"
            className="text-xs font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create First Ad
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              {/* Image Banner Header */}
              <div className="relative h-44 bg-slate-950 overflow-hidden">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={clsx(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm',
                      ad.status === 'ACTIVE'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : ad.status === 'PAUSED'
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-700 text-slate-200'
                    )}
                  >
                    {ad.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-slate-200 text-[10px] font-semibold border border-white/10">
                    Sponsored
                  </span>
                </div>

                {ad.category && (
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-slate-300 text-[10px]">
                      {ad.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white line-clamp-1">{ad.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ad.description}</p>
                </div>

                {/* Metrics & Dates */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Impressions</span>
                      <span className="font-bold text-white">{ad.impressions.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Clicks</span>
                      <span className="font-bold text-white">{ad.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <a
                    href={ad.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    <span>{ad.ctaText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    {ad.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate({ adId: ad.id, newStatus: 'PAUSED' })}
                        disabled={toggleStatusMutation.isPending}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1 text-xs font-semibold"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate({ adId: ad.id, newStatus: 'ACTIVE' })}
                        disabled={toggleStatusMutation.isPending}
                        className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg flex items-center gap-1 text-xs font-semibold"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this sponsored ad campaign?')) {
                          deleteMutation.mutate(ad.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create New Sponsored Ad */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create Sponsored Ad Campaign</h3>
                <p className="text-xs text-slate-400">Promote a business, brand, or service in the feed.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Campaign Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ISO-Certified Industrial Packaging Supplier"
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Ad Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Bulk orders with pan-India delivery. Get instant quotes for custom corrugated boxes."
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Banner Creative Image *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-20 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200">Creative Uploaded</p>
                      <p className="text-[10px] text-slate-400 truncate">{imageUrl}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                      >
                        Change
                      </Button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full py-4 px-4 border-2 border-dashed border-slate-800 hover:border-primary-500 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-primary-400 transition-colors bg-slate-950/60"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                        <span>Uploading banner creative...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-primary-400" />
                        <span>Upload Banner Creative Image (PNG, JPG, WebP)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Button CTA Label</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Learn More / Contact Supplier"
                    className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Campaign Duration (Days)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 30)}
                    min={1}
                    max={365}
                    className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Destination URL *</label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://yourwebsite.com or https://twintell.com/companies/slug"
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Target Industry (Optional)</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Packaging, Printing & Paper"
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full text-xs font-bold"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Publishing...' : 'Launch Sponsored Ad'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
