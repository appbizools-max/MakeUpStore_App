import React, { useState } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, Trash2, Plus, Sparkles, ExternalLink } from 'lucide-react';
import ImageManagerModal from './ImageManagerModal';

export default function ImageField({
  label = 'Image',
  sublabel = '',
  value = '',
  onChange,
  folder = 'products',
  filenamePrefix = 'asset',
  entityName = '',
  aspectRatio = 'square', // 'square' | 'banner' | 'circle'
  compact = false,
  disabled = false,
  className = '',
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        />
      </div>
    );
  }

  // Full form field mode
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label}
          </label>
          {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
        </div>
      )}

      {value ? (
        /* Image Exists: Show current preview, Replace, and Remove */
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden p-1 shadow-inner ${
                aspectRatio === 'circle'
                  ? 'w-16 h-16 rounded-full'
                  : aspectRatio === 'banner'
                  ? 'w-28 h-16 rounded-lg'
                  : 'w-16 h-16 rounded-xl'
              }`}
            >
              <img
                src={value}
                alt="Current asset preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/100x100?text=No+Img';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {entityName || 'Managed Image Asset'}
              </div>
              <div className="text-[11px] text-gray-500 truncate max-w-[200px] sm:max-w-xs font-mono">
                {value}
              </div>
              <div className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span>Active in User App</span>
              </div>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* No Image: Show Add Image CTA */
        <div
          onClick={() => !disabled && setIsModalOpen(true)}
          className={`border-2 border-dashed border-gray-300 hover:border-pink-500 bg-gray-50/60 hover:bg-pink-50/30 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-pink-700 flex items-center justify-center shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 hover:text-pink-700">
              + Add {label}
            </span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Upload, Drag & Drop, Paste (Ctrl+V), Browse Google, or enter URL
            </p>
          </div>
        </div>
      )}

      {/* Centralized Modal */}
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
      />
    </div>
  );
}
