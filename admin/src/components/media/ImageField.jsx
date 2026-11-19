import React, { useState } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, Trash2, Plus, Sparkles, ExternalLink, Info, Loader2 } from 'lucide-react';
import ImageManagerModal from './ImageManagerModal';
import { resolveImageSpec } from '../../utils/imageOptimizer';
import { uploadOptimizedImage } from '../../services/imageStorageService';

export default function ImageField({
  label = 'Image',
  sublabel = '',
  value = '',
  onChange,
  folder = 'products',
  filenamePrefix = 'asset',
  entityName = '',
  aspectRatio = 'square', // 'square' | 'banner' | 'circle' | 'home_banner' | 'promo_banner'
  compact = false,
  disabled = false,
  className = '',
  localOnly = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const spec = resolveImageSpec(aspectRatio);

  const handleSave = (newUrl) => {
    if (onChange) {
      onChange(newUrl);
    }
  };

  const handleRemove = () => {
    if (onChange) {
      onChange('');
    }
  };

  // Direct upload for dropped or pasted image files / URLs
  const processDirectUpload = async (source) => {
    if (!source || disabled) return;
    setIsUploading(true);
    try {
      const profileType = folder.includes('cat')
        ? 'CATEGORY'
        : folder.includes('brand')
        ? 'BRAND_LOGO'
        : 'PRODUCT';

      const res = await uploadOptimizedImage(source, profileType, {
        folder,
        filenamePrefix: `${filenamePrefix}_field`,
        generateVariants: false
      });

      if (res && res.url) {
        handleSave(res.url);
      } else if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('data:image'))) {
        handleSave(source);
      }
    } catch (err) {
      console.error('Direct upload failed:', err);
      if (typeof source === 'string') {
        handleSave(source);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
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

    // 1. Dropped files from desktop
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await processDirectUpload(files[0]);
      return;
    }

    // 2. Dropped image from Google Images or another webpage
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
    }
  };

  // Paste handler (Ctrl + V)
  const handlePaste = async (e) => {
    if (disabled) return;
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Direct image blob in clipboard (Snipping tool, screenshot, copied image file)
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

    // 2. Direct URL text in clipboard
    const text = clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image'))) {
      e.preventDefault();
      await processDirectUpload(text.trim());
    }
  };

  // Compact inline mode (for tables or compact variant/shade swatches)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {value ? (
          <div className="relative group flex items-center gap-2">
            <div
              onClick={() => !disabled && setIsModalOpen(true)}
              className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-white p-0.5 flex items-center justify-center cursor-pointer shadow-sm hover:border-pink-500 transition-colors"
              title="Click to replace image"
            >
              <img src={value} alt="Thumbnail" className="max-w-full max-h-full object-contain" />
            </div>
            {!disabled && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded"
                  title="Replace image"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setIsModalOpen(true)}
            disabled={disabled}
            className="h-10 px-3 border border-dashed border-gray-300 hover:border-pink-500 bg-gray-50 hover:bg-pink-50/50 rounded-lg text-xs font-semibold text-gray-600 hover:text-pink-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Image</span>
          </button>
        )}

        <ImageManagerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentImageUrl={value}
          onSave={handleSave}
          onRemove={handleRemove}
          title={`Manage ${label}`}
          entityName={entityName}
          folder={folder}
          filenamePrefix={filenamePrefix}
          defaultSearchQuery={entityName}
          aspectRatioSpec={spec}
          localOnly={localOnly}
        />
      </div>
    );
  }

  // Full form field mode
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {label}
            </label>
            <span className="px-2 py-0.5 bg-white text-pink-700 border border-pink-200/60 rounded text-[10px] font-bold">
              {spec.aspectRatio} • {spec.recommendedDimensions}
            </span>
          </div>
          {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
        </div>
      )}

      {value ? (
        /* Image Exists: Show current preview, Replace, and Remove */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`p-3 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all outline-none ${
            isDragging
              ? 'bg-pink-50 border-2 border-dashed border-[#D81B60] ring-2 ring-pink-200'
              : 'bg-white border border-gray-200 hover:border-pink-300'
          }`}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden p-1 shadow-inner relative ${
                aspectRatio === 'circle' || spec.key === 'brand_logo'
                  ? 'w-16 h-16 rounded-full'
                  : aspectRatio === 'banner' || spec.key === 'home_banner' || spec.key === 'promo_banner'
                  ? 'w-28 h-16 rounded-lg'
                  : 'w-16 h-16 rounded-xl'
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#D81B60]" />
              ) : (
                <img
                  src={value}
                  alt="Current asset preview"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/100x100?text=No+Img';
                  }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {entityName || 'Managed Image Asset'}
              </div>
              <div className="text-[11px] text-gray-500 truncate max-w-[200px] sm:max-w-xs font-mono">
                {value}
              </div>
              <div className="text-[10px] text-green-600 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span>Active in User App</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-400 font-normal">Drag/paste new file to replace</span>
              </div>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 bg-white hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Browse / Search</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* No Image: Show Add Image CTA with specification guidance */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          onClick={() => !disabled && setIsModalOpen(true)}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 outline-none select-none ${
            isDragging
              ? 'border-[#D81B60] bg-pink-100/70 scale-[1.01] ring-2 ring-pink-200'
              : 'border-gray-300 hover:border-pink-500 bg-gray-50/60 hover:bg-pink-50/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#D81B60]" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-pink-700 flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-gray-800 hover:text-pink-700">
              {isUploading ? 'Optimizing & Uploading...' : isDragging ? 'Drop Image Here to Upload' : `+ Add ${label}`}
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-gray-500 font-medium">
              <span className="font-semibold text-pink-600">Drag & Drop</span>
              <span>•</span>
              <span className="font-semibold text-purple-600">Paste (Ctrl+V)</span>
              <span>•</span>
              <span>Click to Browse</span>
            </div>
            <p className="text-[10.5px] text-gray-400 mt-1">
              Supports {spec.supportedFormats}. {spec.recommendedDimensions} container.
            </p>
          </div>
        </div>
      )}

      {/* Centralized Modal with Aspect Ratio Specification */}
      <ImageManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImageUrl={value}
        onSave={handleSave}
        onRemove={handleRemove}
        title={`Manage ${label}`}
        entityName={entityName}
        folder={folder}
        filenamePrefix={filenamePrefix}
        defaultSearchQuery={entityName}
        aspectRatioSpec={spec}
        localOnly={localOnly}
      />
    </div>
  );
}
