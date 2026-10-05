'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { PostTopic } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Badge, VerifiedBadge } from '../../../components/ui/Badge';
import {
  Sparkles,
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  Eye,
  Edit3,
  Plus,
  ShieldAlert,
  Building2,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';

const TOPICS: { id: PostTopic; label: string; desc: string }[] = [
  { id: 'BUSINESS_NEWS', label: 'Business News', desc: 'Company milestones, announcements & press' },
  { id: 'MANUFACTURING', label: 'Manufacturing', desc: 'Factory updates, machinery, production capacity' },
  { id: 'PRODUCTS', label: 'Products', desc: 'New launches, product lines, catalogues' },
  { id: 'WHOLESALE', label: 'Wholesale', desc: 'Bulk supply offers, volume pricing, distributor terms' },
  { id: 'D2C_BRANDS', label: 'D2C / Brands', desc: 'Packaging, consumer goods, white-label' },
  { id: 'TECHNOLOGY', label: 'Technology', desc: 'Automation, industrial software, digital tools' },
  { id: 'FINANCE', label: 'Finance', desc: 'Credit terms, trade finance, business banking' },
  { id: 'AGRICULTURE', label: 'Agriculture', desc: 'Agri commodities, farming equipment, inputs' },
  { id: 'JOBS', label: 'Jobs', desc: 'Hiring engineers, factory managers, sales teams' },
  { id: 'MEMES', label: 'Memes', desc: 'Workplace humor & lighthearted business posts' },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { user, role, company, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [topic, setTopic] = useState<PostTopic>('BUSINESS_NEWS');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/posts/new');
    }
  }, [isLoading, user, router]);

  // Loading state
  if (isLoading) {
    return (
      <AppShell showRightSidebar={false}>
        <div className="bg-white rounded-card p-10 border border-slate-200 shadow-soft text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Checking company credentials...</p>
        </div>
      </AppShell>
    );
  }

  // Strict RBAC Enforcement: Standard USER cannot create posts
  if (user && role !== 'COMPANY') {
    return (
      <AppShell showRightSidebar={false}>
        <div className="bg-white rounded-card p-8 border border-slate-200 shadow-soft text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">Company Account Required</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Under <strong>twintell</strong> platform policies, standard user accounts can browse, like, comment, and send supplier inquiries, but only registered <strong>Company</strong> accounts can publish feed updates and list products.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full">
                Back to Feed
              </Button>
            </Link>
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="md" className="w-full" leftIcon={<Building2 className="w-4 h-4" />}>
                Register Company Profile
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Handle direct Supabase Storage signed upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setErrorMsg('You can attach a maximum of 4 images per post.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`"${file.name}" is not a supported image format.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds the 5MB size limit.`);
        }

        // 1. Request signed upload URL from backend
        const signRes = await api.post<{ uploadUrl: string; publicUrl: string }>('/api/uploads/sign', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // 2. Direct PUT to Supabase Storage
        const uploadRes = await fetch(signRes.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload "${file.name}" to storage.`);
        }

        return signRes.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload photo. Please check your connection or provide an image link.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 4) {
      setErrorMsg('A maximum of 4 images can be attached per post.');
      return;
    }
    try {
      new URL(imageUrlInput.trim());
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
      setShowUrlInput(false);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Please enter a valid image URL (e.g. https://...)');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Please provide post content before publishing.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ data: { id: string } }>('/api/posts', {
        content: content.trim(),
        topic,
        images,
      });

      setSuccessMsg('Your business post was published successfully!');
      await queryClient.invalidateQueries({ queryKey: ['feed'] });

      // Redirect after brief delay
      setTimeout(() => {
        router.push(res?.data?.id ? `/posts/${res.data.id}` : '/');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish post. Please verify your connection.');
      setIsSubmitting(false);
    }
  };

  const selectedTopicMeta = TOPICS.find((t) => t.id === topic);

  return (
    <AppShell showRightSidebar={false}>
      <div className="space-y-4 max-w-2xl mx-auto pb-10">
        {/* Back Link Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </Link>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('edit')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-card p-5 sm:p-6 border border-slate-200 shadow-soft space-y-6">
          {/* Company Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Avatar
                name={company?.name || user?.name || 'Company'}
                src={company?.logoUrl || undefined}
                size="lg"
                className="shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-base font-bold text-slate-900 truncate">
                    {company?.name || 'Your Company'}
                  </h1>
                  {company?.verified && <VerifiedBadge showLabel={false} />}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {company?.businessType || 'Verified Enterprise'} • {company?.city || 'India'}
                </p>
              </div>
            </div>

            <Badge variant="primary" size="sm" className="hidden sm:inline-flex font-bold">
              Company Publisher
            </Badge>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeView === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                    <span>Select Topic Category</span>
                  </label>
                  {selectedTopicMeta && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {selectedTopicMeta.desc}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {TOPICS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
                        topic === t.id
                          ? 'bg-primary-500 text-white shadow-sm ring-2 ring-primary-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Post Message & Business Update
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      content.length > 2800 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {content.length} / 3000
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  rows={6}
                  maxLength={3000}
                  placeholder={`What's happening at ${company?.name || 'your company'}? Share new factory machinery, wholesale inventory, bulk pricing, or business milestones...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-y"
                />
              </div>

              {/* Image Attachments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary-500" />
                    <span>Attached Photos ({images.length} / 4)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Max 5MB each • JPEG, PNG, WEBP</span>
                </div>

                {/* Previews Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs"
                      >
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Trigger Area */}
                {images.length < 4 && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      leftIcon={
                        isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        ) : (
                          <UploadCloud className="w-4 h-4 text-primary-500" />
                        )
                      }
                      className="w-full sm:w-auto font-semibold"
                    >
                      {isUploading ? 'Uploading to Storage...' : 'Upload Photos'}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs font-semibold text-slate-600 hover:text-primary-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach via Image URL</span>
                    </button>
                  </div>
                )}

                {/* Direct Image URL input */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Paste image link: https://example.com/photo.jpg"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                    />
                    <Button size="sm" type="button" onClick={handleAddImageUrl}>
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link href="/">
                  <Button variant="ghost" size="md" type="button">
                    Cancel
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setActiveView('preview')}
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    Preview
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    isLoading={isSubmitting}
                    disabled={!content.trim() || isUploading}
                    leftIcon={<Send className="w-4 h-4" />}
                    className="font-bold shadow-md px-6"
                  >
                    Publish Post
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Live Feed Preview Mode */
            <div className="space-y-5">
              <div className="p-3 bg-primary-50/60 border border-primary-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-primary-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>This is how your post will appear in the twintell live feed:</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveView('edit')}
                  leftIcon={<Edit3 className="w-3 h-3" />}
                  className="bg-white"
                >
                  Back to Editing
                </Button>
              </div>

              {/* Mock Feed Card */}
              <article className="card-base p-5 space-y-4 border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={company?.name || user?.name || 'Company'}
                      src={company?.logoUrl || undefined}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          {company?.name || 'Your Company'}
                        </span>
                        {company?.verified && <VerifiedBadge showLabel={false} />}
                        <span className="text-xs text-slate-400">• Just now</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {company?.businessType || 'Manufacturer'} • {company?.city || 'India'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="gray" size="sm" className="capitalize text-[11px] font-semibold">
                    {topic.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </div>

                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {content.trim() || (
                    <span className="text-slate-400 italic">No content written yet...</span>
                  )}
                </div>

                {images.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    {images.length === 1 ? (
                      <img
                        src={images[0]}
                        alt="Preview"
                        className="w-full max-h-80 object-cover"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 p-1">
                        {images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" size="md" onClick={() => setActiveView('edit')}>
                  Edit Post
                </Button>
                <Button
                  size="md"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!content.trim() || isUploading}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="font-bold shadow-md px-6"
                >
                  Publish Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
