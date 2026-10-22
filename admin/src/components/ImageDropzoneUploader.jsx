import React, { useState } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import ImageManagerModal from './ImageManagerModal';

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

  const folder = prefix.startsWith('sub')
    ? 'subcategories'
    : prefix.startsWith('brand')
    ? 'brands'
    : prefix.startsWith('banner')
    ? 'banners'
    : prefix.startsWith('prod')
    ? 'products'
    : 'categories';

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      setIsModalOpen(true);
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
        <div className="relative rounded-2xl border border-pink-200/80 bg-[#FFF5F8] p-3.5 flex items-center justify-between gap-3.5 shadow-2xs group overflow-hidden">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => !disabled && setIsModalOpen(true)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-pink-100 shrink-0 relative shadow-xs flex items-center justify-center p-1 cursor-pointer hover:border-pink-500 transition-colors"
              title="Click to replace image"
            >
              <img
                src={currentImageUrl}
                alt="Asset preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200';
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
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                ● Live in User App
              </div>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#CE4270] bg-white border border-pink-200 rounded-xl hover:bg-pink-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Replace Image</span>
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
        /* Empty State -> Opens ImageManagerModal */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && setIsModalOpen(true)}
          className={`relative rounded-2xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center cursor-pointer select-none ${
            isDragging
              ? 'border-[#CE4270] bg-pink-50/80 scale-[1.01]'
              : 'border-pink-200/90 bg-[#FAF9F6]/60 hover:bg-[#FFF2F5]/50 hover:border-[#CE4270]'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#CE4270] flex items-center justify-center mb-2.5 shadow-2xs border border-pink-100 group-hover:scale-105 transition-transform">
            <Upload size={20} />
          </div>
          <div className="text-xs font-bold text-gray-800">
            <span>{label}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 max-w-[280px] leading-relaxed">
            {sublabel}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#CE4270] bg-white border border-pink-200/90 rounded-xl shadow-2xs hover:bg-pink-50">
              <Sparkles size={13} />
              <span>+ Add Image</span>
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
