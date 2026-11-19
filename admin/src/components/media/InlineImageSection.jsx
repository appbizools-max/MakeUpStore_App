import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Globe,
  Upload,
  Trash2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

/**
 * InlineImageSection (Ultra-Compact with Local Upload & Google Search)
 * - Ultra compact vertical layout (~90px)
 * - Option 1: Search Google Images (queries [Entity Name + Type])
 * - Option 2: Upload Local File (opens file picker from computer/device)
 * - Option 3: Direct URL paste field
 * - Live thumbnail with remove button and robust broken-image fallback
 */
export default function InlineImageSection({
  imageUrl = '',
  onChange,
  entityName = '',
  entityType = 'Category',
  folder = 'categories',
  filenamePrefix = 'cat'
}) {
  const adminCtx = useAdmin?.() || {};
  const uploadImage = adminCtx.uploadImage;

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);

  const getDefaultQuery = (name, type) => {
    const clean = (name || '').trim();
    if (!clean) return 'beauty products';
    return `${clean} beauty products`;
  };

  const [searchQuery, setSearchQuery] = useState(() => getDefaultQuery(entityName, entityType));
  const [urlInput, setUrlInput] = useState(imageUrl || '');

  useEffect(() => {
    setSearchQuery(getDefaultQuery(entityName, entityType));
    setUrlInput(imageUrl || '');
    setHasImgError(false);
  }, [entityName, entityType, imageUrl]);

  const handleOpenGoogleImages = () => {
    const q = searchQuery.trim() || getDefaultQuery(entityName, entityType);
    const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleApplyUrl = (val) => {
    setUrlInput(val);
    setHasImgError(false);
    if (typeof onChange === 'function') {
      onChange(val.trim());
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setHasImgError(false);
    try {
      if (typeof uploadImage === 'function') {
        const uploadedUrl = await uploadImage(file, { folder, filenamePrefix });
        if (uploadedUrl) {
          handleApplyUrl(uploadedUrl);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => handleApplyUrl(reader.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      const reader = new FileReader();
      reader.onload = () => handleApplyUrl(reader.result);
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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

    // 1. Dropped files from computer
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await processFile(files[0]);
      return;
    }

    // 2. Dropped image from another webpage or Google Images
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        handleApplyUrl(match[1]);
        return;
      }
    }

    const textUrl = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
    if (textUrl && (textUrl.startsWith('http') || textUrl.startsWith('data:image'))) {
      handleApplyUrl(textUrl);
    }
  };

  // Clipboard paste handler (Ctrl + V)
  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Direct image blob in clipboard (e.g. Snipping tool, screenshots, copied image)
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await processFile(blob);
            return;
          }
        }
      }
    }

    // 2. Direct URL text in clipboard
    const text = clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image'))) {
      e.preventDefault();
      handleApplyUrl(text.trim());
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className={`p-3 rounded-2xl border transition-all space-y-2.5 shadow-2xs outline-none ${
        isDragging
          ? 'bg-pink-50/80 border-[#D81B60] ring-2 ring-pink-200'
          : 'bg-white border-pink-100/90 hover:border-pink-300'
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleLocalFileSelect}
        className="hidden"
      />

      {/* Header with Title and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={13} className="text-[#D81B60]" />
          <span>{entityType} Image</span>
        </label>
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenGoogleImages}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title={`Search Google Images for "${entityName || 'Category'}"`}
          >
            <Globe size={11} />
            <span>Search Google Images ↗</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 bg-white hover:bg-pink-100 text-[#D81B60] border border-pink-200 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Upload local image from computer"
          >
            {isUploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            <span>{isUploading ? 'Uploading...' : 'Upload Local Image'}</span>
          </button>
        </div>
      </div>

      {/* Input Row: Thumbnail Preview + Clean Status or URL Input */}
      <div className="flex items-center gap-2.5">
        {imageUrl ? (
          <>
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-pink-200 bg-white shrink-0 shadow-2xs group flex items-center justify-center">
              {!hasImgError ? (
                <img
                  src={imageUrl}
                  alt=""
                  onError={() => setHasImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-500 p-1" title="Image failed to load">
                  <AlertCircle size={16} />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleApplyUrl('')}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Remove Image"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-pink-100">
              <div className="flex items-center gap-2 min-w-0">
                {!hasImgError ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 truncate">Image Attached</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-rose-700 truncate">Invalid Image URL</span>
                    <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Broken Link</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleApplyUrl('')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                title="Remove current image"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl border border-dashed border-pink-200 bg-white/70 flex items-center justify-center shrink-0 text-pink-300">
              <ImageIcon size={14} />
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => handleApplyUrl(e.target.value)}
                placeholder="Drag & drop image, paste (Ctrl+V), or enter link..."
                className="w-full px-3 py-2 rounded-xl border border-pink-100 focus:border-[#D81B60] text-xs font-medium outline-none bg-white text-gray-800 transition-colors"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
