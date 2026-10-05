'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { PostTopic } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Image as ImageIcon,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  Send,
  Plus,
  Building2,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';

const TOPICS: { id: PostTopic; label: string }[] = [
  { id: 'MANUFACTURING', label: 'Manufacturing' },
  { id: 'BUSINESS_NEWS', label: 'Business News' },
  { id: 'PRODUCTS', label: 'Products' },
  { id: 'WHOLESALE', label: 'Wholesale' },
  { id: 'D2C_BRANDS', label: 'D2C / Brands' },
  { id: 'TECHNOLOGY', label: 'Technology' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'AGRICULTURE', label: 'Agriculture' },
  { id: 'JOBS', label: 'Jobs' },
  { id: 'MEMES', label: 'Memes' },
];

export function CreatePostBox() {
  const { user, role, company } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [topic, setTopic] = useState<PostTopic>('BUSINESS_NEWS');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If user is not a company, don't show the create post form (or show registration banner)
  if (role !== 'COMPANY' || !company) {
    if (!user) {
      return (
        <div className="bg-white rounded-card p-4 sm:p-5 border border-slate-200 shadow-soft flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Are you a manufacturer or supplier?</h3>
              <p className="text-xs text-slate-500">Sign in to publish updates and showcase your products.</p>
            </div>
          </div>
          <Link href="/login" className="shrink-0">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      );
    }
    // Standard USER cannot create posts (strict RBAC rule)
    return null;
  }

  // Handle local file selection and direct Supabase signed upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setErrorMsg('You can upload a maximum of 4 images per post.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a supported image.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB size limit.`);
        }

        // 1. Request signed URL from backend
        const signRes = await api.post<{ uploadUrl: string; publicUrl: string }>('/api/uploads/sign', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // 2. Direct upload to Supabase Storage
        const uploadRes = await fetch(signRes.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name} to storage.`);
        }

        return signRes.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload image. Please try again or provide an image link.');
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
      setErrorMsg('Please write something before publishing.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.post('/api/posts', {
        content: content.trim(),
        topic,
        images,
      });

      // Clear form state
      setContent('');
      setImages([]);
      setIsExpanded(false);

      // Invalidate feed query to instantly show the new post
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-card p-4 sm:p-5 border border-slate-200 shadow-soft transition-all duration-200 space-y-4">
      {/* Top Header: Company Avatar & Input Trigger */}
      <div className="flex items-start gap-3">
        <Avatar
          name={company.name}
          src={company.logoUrl || undefined}
          size="md"
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder={`Share business updates, product launches, or supply announcements for ${company.name}...`}
            rows={isExpanded ? 3 : 2}
            maxLength={3000}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* Expanded Controls: Topic selection, images preview, upload options */}
      {isExpanded && (
        <div className="space-y-4 pt-1 border-t border-slate-100">
          {/* Topic Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                <span>Select Category Topic</span>
              </label>
              <Link
                href="/posts/new"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full Page Editor</span>
              </Link>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    topic === t.id
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Image via URL input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste direct image URL (https://...)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-500"
              />
              <Button size="sm" type="button" onClick={handleAddImageUrl}>
                Add
              </Button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
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
                disabled={isUploading || images.length >= 4}
                leftIcon={isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                {isUploading ? 'Uploading...' : `Upload Photo (${images.length}/4)`}
              </Button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs font-semibold text-slate-500 hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Link URL</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {content.length}/3000
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!content.trim() || isUploading}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="font-bold shadow-sm"
              >
                Post Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
