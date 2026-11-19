import React, { useState } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import ImageManagerModal from './ImageManagerModal';
import { uploadOptimizedImage } from '../../services/imageStorageService';

/**
 * ImageDropzoneUploader
 * Universal Dropzone & Image Management Entry point.
 * Backed by centralized ImageManagerModal with full Upload, Drag & Drop,
 * Paste (Ctrl+V), Google Images search, URL import, and automatic WebP optimization.
 */
export default function ImageDropzoneUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label = 'Upload Image',
  sublabel = 'Drag & drop image file or browse from device (PNG, JPG, WEBP)',
  prefix = 'cat',
  disabled = false,
  className = '',
  entityName = '',
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const folder = prefix.startsWith('sub')
    ? 'subcategories'
    : prefix.startsWith('brand')
    ? 'brands'
    : prefix.startsWith('banner')
    ? 'banners'
    : prefix.startsWith('prod')
    ? 'products'
    : 'categories';

  const profileType = folder.includes('cat')
    ? 'CATEGORY'
    : folder.includes('brand')
    ? 'BRAND_LOGO'
    : 'PRODUCT';

  const processDirectUpload = async (source) => {
    if (!source || disabled) return;
    setIsUploading(true);
    try {
      const res = await uploadOptimizedImage(source, profileType, {
        folder,
        filenamePrefix: `${prefix}_drop`,
        generateVariants: false
      });
      if (res && res.url) {
        if (typeof onImageUploaded === 'function') onImageUploaded(res.url);
      } else if (typeof source === 'string') {
        if (typeof onImageUploaded === 'function') onImageUploaded(source);
      }
    } catch (err) {
      console.error('Direct upload failed:', err);
      if (typeof source === 'string') {
        if (typeof onImageUploaded === 'function') onImageUploaded(source);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    // 1. Dropped files from computer
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await processDirectUpload(files[0]);
      return;
    }

    // 2. Dropped image from another webpage or Google search
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        await processDirectUpload(match[1]);
        return;
      }
    }

    const textUrl = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
    if (textUrl && (textUrl.startsWith('http') || textUrl.startsWith('data:image'))) {
      await processDirectUpload(textUrl.trim());
      return;
    }

    setIsModalOpen(true);
  };

  const handlePaste = async (e) => {
    if (disabled) return;
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await processDirectUpload(blob);
            return;
          }
        }
      }
    }

    const text = clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image'))) {
      e.preventDefault();
      await processDirectUpload(text.trim());
    }
  };

  const handleRemove = (e) => {
    e?.stopPropagation?.();
    if (disabled) return;
    if (window.confirm('Are you sure you want to remove this image? It will update the mobile app immediately.')) {
      if (typeof onImageRemoved === 'function') {
        onImageRemoved();
      }
    }
  };

  const handleSaveFromModal = (newUrl) => {
    if (typeof onImageUploaded === 'function') {
      onImageUploaded(newUrl);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Current Image Active */}
      {currentImageUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`relative rounded-2xl border transition-all p-3.5 flex items-center justify-between gap-3.5 shadow-2xs group overflow-hidden outline-hidden ${
            isDragging
              ? 'border-[#D81B60] ring-2 ring-pink-400 bg-pink-50/40'
              : 'border-pink-200/80 bg-white hover:border-pink-300'
          }`}
        >
          {isUploading && (
            <div className="absolute inset-0 bg-white/85 z-10 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-[#D81B60]" />
              <span className="text-xs font-bold text-gray-800">Optimizing & Uploading...</span>
            </div>
          )}

          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => !disabled && setIsModalOpen(true)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-pink-100 shrink-0 relative shadow-xs flex items-center justify-center p-1 cursor-pointer hover:border-pink-500 transition-colors"
              title="Click or drop/paste to replace image"
            >
              <img
                src={currentImageUrl}
                alt="Asset preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 truncate">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="truncate">Active Asset Synced</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">
                {currentImageUrl.split('/').pop() || 'image.webp'}
              </p>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-2">
                <span>● Live in User App</span>
                <span className="text-gray-400 font-normal">| Drop or Paste (Ctrl+V) to replace</span>
              </div>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#D81B60] bg-white border border-pink-200 rounded-xl hover:bg-pink-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="Remove image"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State -> Opens ImageManagerModal, accepts Drop & Paste */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          onClick={() => !disabled && setIsModalOpen(true)}
          className={`relative rounded-2xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center cursor-pointer select-none outline-hidden ${
            isDragging
              ? 'border-[#D81B60] bg-pink-50/50 scale-[1.01] ring-2 ring-pink-400'
              : 'border-pink-200/90 bg-[#FAF9F6]/60 hover:bg-[#FFF2F5]/50 hover:border-[#D81B60]'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {isUploading && (
            <div className="absolute inset-0 bg-white/90 rounded-2xl z-10 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-[#D81B60]" />
              <span className="text-xs font-bold text-gray-800">Optimizing & Uploading...</span>
            </div>
          )}

          <div className="w-12 h-12 rounded-2xl bg-white text-[#D81B60] flex items-center justify-center mb-2.5 shadow-2xs border border-pink-100 group-hover:scale-105 transition-transform">
            <Upload size={20} />
          </div>
          <div className="text-xs font-bold text-gray-800">
            <span>{label}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
            {sublabel}
          </p>
          <div className="mt-2 text-[10px] text-pink-600 font-medium">
            Drag & drop file, copy-paste screenshot (Ctrl+V), or drag from Google Images
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#D81B60] bg-white border border-pink-200/90 rounded-xl shadow-2xs hover:bg-pink-50">
              <Sparkles size={13} />
              <span>Browse / Search Library</span>
            </span>
          </div>
        </div>
      )}

      {/* Centralized Image Manager Modal */}
      <ImageManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImageUrl={currentImageUrl}
        onSave={handleSaveFromModal}
        onRemove={onImageRemoved}
        title={`Manage ${label}`}
        entityName={entityName || label}
        folder={folder}
        filenamePrefix={prefix}
        defaultSearchQuery={entityName}
      />
    </div>
  );
}
