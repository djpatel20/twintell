'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from '../../context/ToastContext';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const hasMultiple = images.length > 1;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [currentIndex]);

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!onNavigate || !hasMultiple) return;
      onNavigate((currentIndex - 1 + images.length) % images.length);
    },
    [currentIndex, hasMultiple, images.length, onNavigate]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!onNavigate || !hasMultiple) return;
      onNavigate((currentIndex + 1) % images.length);
    },
    [currentIndex, hasMultiple, images.length, onNavigate]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Bar with Counter and Close Button */}
      <div
        className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between text-white z-10 pointer-events-none"
      >
        <div className="bg-black/50 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide">
          {hasMultiple ? `${currentIndex + 1} / ${images.length}` : 'Image Preview'}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-colors pointer-events-auto"
          aria-label="Close image viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Buttons for Multi-image */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Image Container: Preserves 100% Exact Aspect Ratio at any orientation */}
      <div
        className="relative max-w-full max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/85 rounded-xl text-center text-zinc-400 space-y-2 border border-zinc-800 max-w-sm">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <p className="text-sm font-semibold text-white">Image Failed to Load</p>
            <p className="text-xs text-zinc-400">The requested image could not be retrieved or is unavailable.</p>
          </div>
        ) : (
          <img
            src={currentImage}
            alt={`Full view ${currentIndex + 1}`}
            onError={() => {
              setHasError(true);
              toast.error('Image Unavailable', 'Could not load high-resolution image preview.');
            }}
            className="w-auto max-w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
          />
        )}
      </div>
    </div>
  );
}
