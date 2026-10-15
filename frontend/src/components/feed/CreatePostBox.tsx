'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { CompanyLogo } from '../ui/CompanyLogo';
import { Button } from '../ui/Button';
import { SegmentedControl } from '../ui/SegmentedControl';
import {
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
  Link as LinkIcon,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import { STATIC_CATEGORIES } from '../../constants/categories';

type PostType = 'update' | 'product' | 'news';

const POST_TYPES = [
  { id: 'update' as PostType, label: 'Update' },
  { id: 'product' as PostType, label: 'Product' },
  { id: 'news' as PostType, label: 'News' },
];

export function CreatePostBox() {
  const { user, role, company } = useAuth();
  const queryClient = useQueryClient();

  const [postType, setPostType] = useState<PostType>('update');
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>(
    company?.category?.slug || STATIC_CATEGORIES[0].slug
  );
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If user is not a company, don't show the create post form (or show prompt for unauth)
  if (role !== 'COMPANY' || !company) {
    if (!user) {
      return (
        <div className="card-base p-4 bg-panel border-line flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-ink">Are you a manufacturer or supplier?</h3>
            <p className="text-xs text-ink-muted">Sign in to publish updates and showcase your products.</p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      );
    }
    // Standard USER cannot create posts (strict RBAC rule)
    return null;
  }

  const handlePostTypeChange = (type: PostType) => {
    setPostType(type);
  };

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

        const signRes = await api.post<{ uploadUrl: string; publicUrl: string }>('/api/uploads/sign', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

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
      setErrorMsg(err?.message || 'Failed to upload image. Please try again.');
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
        categorySlug,
        images,
      });

      setContent('');
      setImages([]);
      setIsExpanded(false);

      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-base p-4 sm:p-5 bg-panel border-line transition-colors duration-120 space-y-3">
      {/* "Posting as [logo] Company Name ▾" Header per DESIGN.md §7 */}
      <div className="flex items-center justify-between pb-1 border-b border-line">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink hover:text-cobalt transition-colors group"
        >
          <span className="text-ink-muted">Posting as</span>
          <CompanyLogo
            name={company.name}
            src={company.logoUrl || undefined}
            size="sm"
          />
          <span className="font-semibold text-ink group-hover:text-cobalt">{company.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
        </Link>

        {isExpanded && (
          <Link
            href="/posts/new"
            className="text-xs text-ink-muted hover:text-cobalt inline-flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Full editor</span>
          </Link>
        )}
      </div>

      {/* Post Type Tabs (When expanded) per DESIGN.md §7 */}
      {isExpanded && (
        <div className="pt-1">
          <SegmentedControl
            options={POST_TYPES}
            value={postType}
            onChange={handlePostTypeChange}
            size="sm"
          />
        </div>
      )}

      {/* Input Text Area */}
      <div>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Share a product launch, stock update, or requirement…"
          rows={isExpanded ? 3 : 2}
          maxLength={3000}
          className="w-full bg-panel-sunk border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-line focus:ring-[3px] focus:ring-cobalt-soft focus:bg-panel transition-all resize-none"
        />
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Category Select Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Industry Category</span>
            <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto no-scrollbar py-0.5">
              {STATIC_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                    categorySlug === c.slug
                      ? 'bg-cobalt-soft text-cobalt font-semibold'
                      : 'bg-panel-sunk text-ink-muted hover:text-ink hover:bg-line'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-line bg-panel-sunk group">
                  <img src={img} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black text-white"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* URL Input Form */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/product-image.jpg"
                className="flex-1 h-8 rounded-lg bg-panel-sunk px-3 text-xs text-ink placeholder:text-ink-faint border border-line outline-none focus:ring-2 focus:ring-cobalt-soft"
              />
              <Button size="sm" variant="secondary" onClick={handleAddImageUrl}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || images.length >= 4}
                leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              >
                {isUploading ? 'Uploading…' : 'Attach image'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlInput(!showUrlInput)}
                disabled={images.length >= 4}
                leftIcon={<LinkIcon className="w-4 h-4" />}
              >
                URL
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                  setImages([]);
                  setErrorMsg(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!content.trim()}
              >
                {postType === 'product'
                  ? 'List product'
                  : 'Post update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
