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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
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

  return (
    <div className="bg-[#FFF9FB] p-3 rounded-2xl border border-pink-100/90 space-y-2.5 shadow-2xs">
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
          <ImageIcon size={13} className="text-[#C2477A]" />
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
            className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-[#C2477A] border border-pink-200 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
                placeholder="Or paste direct image link..."
                className="w-full px-3 py-2 rounded-xl border border-pink-100 focus:border-[#C2477A] text-xs font-medium outline-none bg-white text-gray-800 transition-colors"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
