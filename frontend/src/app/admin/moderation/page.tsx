'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import {
  FileText,
  Package,
  Trash2,
  Search,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Heart,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface AdminPost {
  id: string;
  companyId: string;
  content: string;
  images: string[];
  topic: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

interface AdminProduct {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  price: string | number | null;
  priceUnit: string | null;
  moq: number | null;
  images: string[];
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminModerationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // 1. Fetch Posts Query
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['admin-moderation-posts', page, search],
    queryFn: () =>
      api.get<{ data: AdminPost[]; pagination: { total: number; totalPages: number } }>(
        `/api/admin/moderation/posts?page=${page}&limit=12&search=${encodeURIComponent(search)}`
      ),
    enabled: activeTab === 'posts',
  });

  // 2. Fetch Products Query
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['admin-moderation-products', page, search],
    queryFn: () =>
      api.get<{ data: AdminProduct[]; pagination: { total: number; totalPages: number } }>(
        `/api/admin/moderation/products?page=${page}&limit=12&search=${encodeURIComponent(search)}`
      ),
    enabled: activeTab === 'products',
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/api/admin/moderation/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to delete post');
    },
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/api/admin/moderation/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to delete product');
    },
  });

  const handleDeletePost = (id: string, authorName: string) => {
    if (confirm(`ADMIN ACTION: Permanently remove post published by "${authorName}"?`)) {
      deletePostMutation.mutate(id);
    }
  };

  const handleDeleteProduct = (id: string, title: string) => {
    if (confirm(`ADMIN ACTION: Permanently remove product "${title}" from catalog?`)) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Content Moderation & Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Platform Content Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review and delete flagged or non-compliant posts and products across all companies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (activeTab === 'posts' ? refetchPosts() : refetchProducts())}
            className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('posts');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'posts'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Feed Posts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {postsLoading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading published posts...</p>
            </div>
          ) : !postsData?.data || postsData.data.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No posts found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postsData.data.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header company info */}
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/companies/${post.company?.slug || ''}`}
                        target="_blank"
                        className="flex items-center gap-2 min-w-0 hover:text-primary-400 transition-colors"
                      >
                        <Avatar
                          name={post.company?.name || 'Company'}
                          src={post.company?.logoUrl || undefined}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {post.company?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>

                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {post.topic}
                      </span>
                    </div>

                    {/* Content text */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Image thumbnails */}
                    {post.images && post.images.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-hidden rounded-lg">
                        {post.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Post thumbnail"
                            className="w-16 h-16 object-cover rounded-md bg-slate-950 border border-slate-800"
                          />
                        ))}
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        {post.commentCount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/posts/${post.id}`}
                      target="_blank"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePost(post.id, post.company.name)}
                      isLoading={deletePostMutation.isPending}
                      className="text-xs border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete Post
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {productsLoading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading catalog items...</p>
            </div>
          ) : !productsData?.data || productsData.data.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No products found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsData.data.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/companies/${prod.company?.slug || ''}`}
                        target="_blank"
                        className="flex items-center gap-2 min-w-0 hover:text-primary-400 transition-colors"
                      >
                        <Avatar
                          name={prod.company?.name || 'Company'}
                          src={prod.company?.logoUrl || undefined}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {prod.company?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(prod.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>

                      {prod.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-primary-300 truncate max-w-[120px]">
                          {prod.category.name}
                        </span>
                      )}
                    </div>

                    {/* Image & Title */}
                    <div className="flex gap-3">
                      {prod.images && prod.images.length > 0 ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white line-clamp-2">
                          {prod.title}
                        </h4>
                        <p className="text-xs font-black text-primary-400 mt-1">
                          {prod.price ? `₹${prod.price} / ${prod.priceUnit || 'unit'}` : 'Inquiry'}
                        </p>
                        {prod.moq && (
                          <p className="text-[10px] text-slate-400">
                            MOQ: {prod.moq} {prod.priceUnit || 'units'}
                          </p>
                        )}
                      </div>
                    </div>

                    {prod.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/products/${prod.id}`}
                      target="_blank"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProduct(prod.id, prod.title)}
                      isLoading={deleteProductMutation.isPending}
                      className="text-xs border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete Product
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
