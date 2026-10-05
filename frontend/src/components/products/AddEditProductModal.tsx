'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Category, Product } from '../../types';
import {
  X,
  Package,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Plus,
  UploadCloud,
} from 'lucide-react';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // null for Create, populated for Edit
  companyId: string;
  onSuccess?: () => void;
}

export function AddEditProductModal({
  isOpen,
  onClose,
  product,
  companyId,
  onSuccess,
}: AddEditProductModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const [title, setTitle] = useState(product?.title || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [priceUnit, setPriceUnit] = useState(product?.priceUnit || 'piece');
  const [moq, setMoq] = useState(product?.moq ? String(product.moq) : '');
  const [description, setDescription] = useState(product?.description || '');
  const [material, setMaterial] = useState(product?.material || '');
  const [sizes, setSizes] = useState(product?.sizes || '');
  const [usage, setUsage] = useState(product?.usage || '');
  const [tagsInput, setTagsInput] = useState((product?.tags || []).join(', '));
  const [images, setImages] = useState<string[]>(product?.images || []);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories'),
  });

  const categories = categoriesData?.data || [];

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 6) {
      setErrorMsg('You can upload a maximum of 6 images per product.');
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
          throw new Error(`Failed to upload "${file.name}" to storage.`);
        }

        return signRes.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 6) {
      setErrorMsg('A maximum of 6 images can be attached per product.');
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
    if (!title.trim()) {
      setErrorMsg('Product title is required.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: title.trim(),
        categoryId: categoryId || null,
        price: price.trim() ? parseFloat(price.trim()) : null,
        priceUnit: priceUnit.trim() || null,
        moq: moq.trim() ? parseInt(moq.trim(), 10) : null,
        description: description.trim() || null,
        material: material.trim() || null,
        sizes: sizes.trim() || null,
        usage: usage.trim() || null,
        tags: parsedTags,
        images,
      };

      if (isEditing && product) {
        await api.patch(`/api/products/${product.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['company-products'] });
      if (product?.id) {
        await queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save product. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Catalog Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                Showcase your manufacturing and wholesale supplies to buyers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5-Ply Corrugated Mailer Boxes"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & MOQ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Unit Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12.50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Price Unit</label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="piece">Per Piece</option>
                <option value="kg">Per Kg</option>
                <option value="meter">Per Meter</option>
                <option value="ton">Per Ton</option>
                <option value="box">Per Box</option>
                <option value="set">Per Set</option>
                <option value="pack">Per Pack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Min. Order Qty (MOQ)
              </label>
              <Input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          {/* Specifications: Material, Sizes, Usage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Material</label>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Kraft Paper + PLA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Dimensions / Sizes</label>
              <Input
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="e.g. Custom, 250g, 500g"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Primary Usage</label>
              <Input
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
                placeholder="e.g. E-Commerce, Food, Cosmetics"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Product Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Highlight technical specifications, customization options, certifications, and delivery timelines..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Search Tags (comma-separated)
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Eco Friendly, Custom Printing, Bulk Supply"
            />
          </div>

          {/* Photos Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary-500" />
                <span>Product Photos ({images.length} / 6)</span>
              </label>
              <span className="text-[11px] text-slate-400">Max 5MB each • JPEG, PNG, WEBP</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs"
                  >
                    <img src={img} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 6 && (
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
                  disabled={isUploading}
                  leftIcon={
                    isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Upload Photos'}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-slate-500 hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Link URL</span>
                </button>
              </div>
            )}

            {showUrlInput && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste direct image link: https://..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500"
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
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              className="font-bold shadow-sm px-5"
            >
              {isEditing ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
