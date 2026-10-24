'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { CompanyLogo } from '../ui/CompanyLogo';
import { VerifiedBadge } from '../ui/Badge';
import { TopicChip, CATEGORY_COLORS } from '../ui/TopicChip';
import { Button } from '../ui/Button';
import { ImageLightbox } from '../ui/ImageLightbox';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
  Trash2,
  MoreHorizontal,
  Send,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Post } from '../../types';

interface ExtendedPost extends Post {
  // Trade & RFQ optional fields per DESIGN.md §7
  trade?: {
    moq?: number;
    priceRange?: string;
    shipping?: string;
  };
  rfq?: {
    requirement?: string;
    budget?: string;
    closingIn?: string;
  };
}

interface PostCardProps {
  post: ExtendedPost;
  onPostDeleted?: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInSeconds / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const router = useRouter();
  const { user, company } = useAuth();
  const queryClient = useQueryClient();

  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const handleImageError = (idx: number) => {
    setFailedImages((prev) => {
      if (prev[idx]) return prev;
      toast.error('Image Unavailable', 'One of the post images could not be loaded.');
      return { ...prev, [idx]: true };
    });
  };

  const isOwner = company?.id === post.companyId;
  const isAdmin = user?.role === 'ADMIN';
  const canDelete = isOwner || isAdmin;

  // 3px category-colored left stripe color prioritizing unified category
  const displayCategorySlug = post.category?.slug || post.company?.category?.slug;
  const displayCategoryName = post.category?.name || post.company?.category?.name || post.topic?.replace(/_/g, ' ').toLowerCase();
  const categoryColor =
    (displayCategorySlug && CATEGORY_COLORS[displayCategorySlug]) ||
    (post.topic && CATEGORY_COLORS[post.topic]) ||
    'var(--cobalt)';

  const handleLikeToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;

    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }

    try {
      if (previousLiked) {
        await api.delete(`/api/posts/${post.id}/like`);
      } else {
        await api.post(`/api/posts/${post.id}/like`);
      }
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);

    try {
      await api.delete(`/api/posts/${post.id}`);
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (onPostDeleted) onPostDeleted();
    } catch (err: any) {
      toast.error('Failed to delete post', err?.message);
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.info('Post link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  const topicLabel = post.topic.replace(/_/g, ' ').toLowerCase();
  const isProductTopic = post.topic === 'PRODUCTS';
  const isRFQTopic = post.topic === 'MANUFACTURING' || post.topic === 'WHOLESALE';

  // Check if content exceeds 280 characters to offer collapse
  const isLongContent = post.content.length > 280;

  return (
    <article
      className="card-base p-4 sm:p-5 bg-panel border-line space-y-4 hover:border-ink-faint transition-colors duration-120 relative"
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: categoryColor,
      }}
    >
      {/* Header: Company Identity Block + Category Chip + Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/companies/${post.company.slug}`} className="shrink-0">
            <CompanyLogo
              name={post.company.name}
              src={post.company.logoUrl || undefined}
              size="md"
              categoryColor={categoryColor}
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/companies/${post.company.slug}`}
                className="text-[15px] font-semibold text-ink hover:text-cobalt transition-colors truncate"
              >
                {post.company.name}
              </Link>
              {post.company.verified && <VerifiedBadge />}
            </div>
            {/* Metadata line separated by thin vertical rule or spacing per DESIGN.md §4 */}
            <p className="text-[13px] text-ink-muted truncate">
              {post.company.businessType}
              <span className="mx-1.5 text-line">|</span>
              {post.company.city}
              {post.company.state ? `, ${post.company.state}` : ''}
              <span className="mx-1.5 text-line">|</span>
              <span
                className="tabular-nums"
                title={new Date(post.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              >
                {formatRelativeTime(post.createdAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TopicChip
            topicId={displayCategorySlug || post.topic}
            label={displayCategoryName}
            className="hidden sm:inline-flex"
          />

          {canDelete && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-panel-sunk transition-colors"
                title="Post options"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-panel rounded-lg elevation-floating border border-line py-1 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className="w-full px-3 py-1.5 text-xs text-red hover:bg-red/10 flex items-center gap-2 transition-colors font-medium text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isDeleting
                        ? 'Deleting...'
                        : isAdmin && !isOwner
                        ? 'Delete (Admin)'
                        : 'Delete post'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body: Collapsible Text Content (max 4 lines per DESIGN.md §7) */}
      <div className="text-[15px] leading-6 text-ink max-w-prose">
        <p
          className={`whitespace-pre-line ${
            !isExpanded && isLongContent ? 'line-clamp-4' : ''
          }`}
        >
          {post.content}
        </p>
        {isLongContent && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-cobalt hover:underline mt-1 block"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Post Images (Preserves natural aspect ratio across all orientations & devices) */}
      {post.images && post.images.length > 0 && (
        <>
          <div className="rounded-lg overflow-hidden border border-line bg-panel-sunk/30">
            {post.images.length === 1 ? (
              failedImages[0] ? (
                <div className="w-full py-8 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-1.5 bg-panel-sunk/20">
                  <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                  <span>Image could not be loaded</span>
                </div>
              ) : (
                <div
                  className="w-full flex items-center justify-center cursor-pointer group bg-panel-sunk/20"
                  onClick={() => setLightboxIndex(0)}
                  title="Click to view full image"
                >
                  <img
                    src={post.images[0]}
                    alt="Post attachment"
                    onError={() => handleImageError(0)}
                    className="w-auto max-w-full h-auto max-h-[70vh] sm:max-h-[580px] object-contain mx-auto block group-hover:opacity-95 transition-opacity"
                    loading="lazy"
                  />
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-1.5 p-1.5">
                {post.images.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-md cursor-pointer group bg-panel-sunk"
                    onClick={() => !failedImages[idx] && setLightboxIndex(idx)}
                    title={failedImages[idx] ? 'Image unavailable' : 'Click to view full image'}
                  >
                    {failedImages[idx] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted text-[11px] gap-1 p-2 bg-panel-sunk">
                        <ImageIcon className="w-4 h-4 stroke-[1.5]" />
                        <span>Unavailable</span>
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt={`Attachment ${idx + 1}`}
                        onError={() => handleImageError(idx)}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        loading="lazy"
                      />
                    )}
                    {idx === 3 && post.images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-sm">
                        +{post.images.length - 4} more
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Resolution Image Lightbox */}
          <ImageLightbox
            images={post.images}
            currentIndex={lightboxIndex ?? 0}
            isOpen={lightboxIndex !== null}
            onClose={() => setLightboxIndex(null)}
            onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          />
        </>
      )}

      {/* Product Trade Strip per DESIGN.md §7 (Rendered when trade data exists) */}
      {post.trade && (
        <div className="bg-panel-sunk rounded-lg p-3 text-xs flex items-center justify-between gap-3 border border-line">
          <div className="flex items-center gap-2 text-ink-muted flex-wrap">
            {post.trade.moq && (
              <span>
                <strong className="text-ink">MOQ:</strong> {post.trade.moq} pcs
              </span>
            )}
            {post.trade.priceRange && (
              <>
                <span className="text-line">|</span>
                <span className="tabular-nums font-medium text-ink">
                  {post.trade.priceRange}
                </span>
              </>
            )}
            {post.trade.shipping && (
              <>
                <span className="text-line">|</span>
                <span>{post.trade.shipping}</span>
              </>
            )}
          </div>
          <Link href={`/companies/${post.company.slug}`}>
            <Button size="sm" variant="secondary" leftIcon={<Send className="w-3.5 h-3.5 text-cobalt" />}>
              Send enquiry
            </Button>
          </Link>
        </div>
      )}

      {/* RFQ Requirement Strip per DESIGN.md §7 (Rendered when RFQ data exists) */}
      {post.rfq && (
        <div className="bg-panel-sunk rounded-lg p-3 text-xs flex items-center justify-between gap-3 border border-line">
          <div className="flex items-center gap-2 text-ink-muted flex-wrap">
            <span className="font-semibold text-ink">
              Need: {post.rfq.requirement}
            </span>
            {post.rfq.budget && (
              <>
                <span className="text-line">|</span>
                <span className="tabular-nums">Budget {post.rfq.budget}</span>
              </>
            )}
            {post.rfq.closingIn && (
              <>
                <span className="text-line">|</span>
                <span className="text-amber font-medium">Closes in {post.rfq.closingIn}</span>
              </>
            )}
          </div>
          <Link href={`/companies/${post.company.slug}`}>
            <Button size="sm" variant="primary" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Quote now
            </Button>
          </Link>
        </div>
      )}

      {/* Footer: Like, Comment, Share, Save ghost buttons per DESIGN.md §7 */}
      <div className="flex items-center justify-between pt-3 border-t border-line text-ink-muted text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-panel-sunk transition-colors duration-120 group ${
              liked ? 'text-red font-semibold' : 'text-ink-muted hover:text-red'
            }`}
            aria-label={liked ? 'Unlike post' : 'Like post'}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-150 group-active:scale-125 ${
                liked ? 'fill-red text-red' : ''
              }`}
            />
            <span className="tabular-nums">{likeCount}</span>
          </button>

          {/* Comment Button */}
          <Link
            href={`/posts/${post.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-panel-sunk transition-colors duration-120"
            aria-label="View comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="tabular-nums">{post.commentCount}</span>
          </Link>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-panel-sunk transition-colors duration-120"
            title="Copy link to post"
            aria-label="Share post"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green" />
                <span className="text-green font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Save Bookmark on right per DESIGN.md §7 */}
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className={`p-1.5 rounded-lg hover:bg-panel-sunk transition-colors duration-120 ${
            isSaved ? 'text-cobalt' : 'text-ink-muted hover:text-ink'
          }`}
          title={isSaved ? 'Saved' : 'Save post'}
          aria-label={isSaved ? 'Saved post' : 'Save post'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-cobalt' : ''}`} />
        </button>
      </div>
    </article>
  );
}
