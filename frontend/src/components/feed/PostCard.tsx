'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Heart, MessageSquare, Share2, Check, Trash2, MoreHorizontal } from 'lucide-react';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInSeconds / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
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
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = company?.id === post.companyId;

  const handleLikeToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic UI update
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
      // Revert upon failure
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);

    try {
      await api.delete(`/api/posts/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (onPostDeleted) onPostDeleted();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post.');
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Convert topic string to human friendly label
  const topicLabel = post.topic.replace(/_/g, ' ').toLowerCase();

  return (
    <article className="card-base p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-all duration-200 relative">
      {/* Header: Company Info + Topic + Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/companies/${post.company.slug}`} className="shrink-0">
            <Avatar
              name={post.company.name}
              src={post.company.logoUrl || undefined}
              size="md"
              className="hover:ring-2 hover:ring-primary-400 transition-all"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/companies/${post.company.slug}`}
                className="text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors truncate"
              >
                {post.company.name}
              </Link>
              {post.company.verified && <VerifiedBadge showLabel={false} />}
              <span className="text-xs text-slate-400">• {formatRelativeTime(post.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {post.company.businessType} • {post.company.city}
              {post.company.state ? `, ${post.company.state}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="gray" size="sm" className="capitalize text-[11px] font-semibold hidden sm:inline-flex">
            {topicLabel}
          </Badge>

          {isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          {post.images.length === 1 ? (
            <div className="relative aspect-[16/9] max-h-80 w-full overflow-hidden">
              <img
                src={post.images[0]}
                alt="Post attachment"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 p-1">
              {post.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500 text-xs">
        <div className="flex items-center gap-6">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 transition-colors group ${
              liked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform group-active:scale-125 ${
                liked ? 'fill-rose-500 text-rose-500' : 'group-hover:fill-rose-100'
              }`}
            />
            <span>{likeCount}</span>
          </button>

          {/* Comment Button */}
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-semibold">{post.commentCount}</span>
          </Link>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-primary-600 transition-colors text-slate-500"
          title="Copy link to post"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
