'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api-client';
import { Post, Comment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { PostCard } from '../../../components/feed/PostCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { PostCardSkeleton } from '../../../components/ui/Skeleton';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';

function formatCommentDate(dateString: string): string {
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  // 1. Fetch Post Details
  const {
    data: postData,
    isLoading: isPostLoading,
    isError: isPostError,
    error: postError,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get<{ data: Post }>(`/api/posts/${postId}`),
    enabled: !!postId,
  });

  // 2. Fetch Comments
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => api.get<{ data: Comment[] }>(`/api/posts/${postId}/comments`),
    enabled: !!postId,
  });

  // 3. Post Comment Mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      setCommentText('');
      setCommentError(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: any) => {
      setCommentError(err?.message || 'Failed to submit comment.');
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const post = postData?.data;
  const comments = commentsData?.data || [];

  return (
    <AppShell>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Back navigation header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </button>
        </div>

        {/* Post Container */}
        {isPostLoading ? (
          <PostCardSkeleton />
        ) : isPostError || !post ? (
          <div className="bg-rose-50 border border-rose-200 rounded-card p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Post not found</h3>
            <p className="text-xs text-rose-600">
              {(postError as Error)?.message || 'This post may have been removed or does not exist.'}
            </p>
            <Link href="/">
              <Button size="sm" variant="secondary">
                Return to Feed
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <PostCard
              post={post}
              onPostDeleted={() => {
                router.push('/');
              }}
            />

            {/* Comments Thread Section */}
            <div className="bg-white rounded-card p-4 sm:p-5 border border-slate-200 shadow-soft space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Comments & Discussions ({comments.length})
                </h3>
              </div>

              {/* Comment Input Form */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={user.name} src={user.avatarUrl || undefined} size="sm" className="mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a professional comment or business inquiry..."
                        rows={2}
                        maxLength={1000}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {commentError && (
                    <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{commentError}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={commentMutation.isPending}
                      disabled={!commentText.trim()}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Comment
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600">Sign in to participate in the discussion and connect with suppliers.</p>
                  <Link href="/login">
                    <Button size="sm" variant="outline">
                      Sign In to Comment
                    </Button>
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 pt-2">
                {isCommentsLoading ? (
                  <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span>Loading comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 text-xs sm:text-sm border-b border-slate-50 pb-3 last:border-b-0">
                      <Avatar
                        name={comment.user.name}
                        src={comment.user.avatarUrl || undefined}
                        size="sm"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{comment.user.name}</span>
                          {comment.user.role === 'COMPANY' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700">
                              COMPANY
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">• {formatCommentDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
