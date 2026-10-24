import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Check,
  Globe,
  Clipboard
} from 'lucide-react';
import { searchBeautyImages } from '../../services/imageSearchService';
import { fetchImageUrlAsBlob, isImageUrl } from '../../utils/imageOptimizer';
import { useAdmin } from '../../context/AdminContext';

/**
 * InlineImageSection
 * Integrated directly inside the Edit Form.
 * Supports:
 * 1. Direct Google Images search button (opens Google with prefilled query).
 * 2. Drag & Drop directly from Google Images, other tabs, or local disk into the dropzone.
 * 3. Clipboard Paste (Ctrl+V) from Google Images.
 * 4. In-form Beauty Image search with 1-click [Use Image] grid.
 * 5. Automatic upload to Supabase Storage so images are permanently hosted.
 */
export default function InlineImageSection({
  imageUrl = '',
  onChange,
  entityName = '',
  entityType = 'Category', // 'Main Category' | 'Sub Category' | 'Product Type'
  folder = 'categories',
  filenamePrefix = 'cat'
}) {
  const adminCtx = useAdmin?.() || {};
  const uploadImage = adminCtx.uploadImage;

  // Build default search term from entity name
  const getDefaultQuery = (name, type) => {
    const clean = (name || '').trim();
    if (!clean) return 'Beauty cosmetics product';
    if (type === 'Product Type' || type === 'Select Category') {
      return `${clean} beauty product`;
    }
    return `${clean} beauty products`;
  };

  const [searchQuery, setSearchQuery] = useState(() => getDefaultQuery(entityName, entityType));

  // Upload & Drag Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  // Update default search query when entity name changes
  useEffect(() => {
    setSearchQuery(getDefaultQuery(entityName, entityType));
    setUploadError(null);
  }, [entityName, entityType]);

  // Open Google Images in new tab with entity keyword
  const handleOpenGoogleImages = () => {
    const q = searchQuery.trim() || getDefaultQuery(entityName, entityType);
    const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  // Remove current image
  const handleRemoveImage = () => {
    if (typeof onChange === 'function') {
      onChange('');
    }
  };

  // Process raw file and upload to Supabase Storage
  const processAndUploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPG, PNG, WEBP) are supported.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadStatusText('Uploading image to Supabase Storage...');

    try {
      if (typeof uploadImage === 'function') {
        const publicUrl = await uploadImage(file, folder, filenamePrefix);
        if (publicUrl) {
          onChange(publicUrl);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          throw new Error('Upload did not return a public URL.');
        }
      } else {
        const localUrl = URL.createObjectURL(file);
        onChange(localUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  // Process URL dropped from Google or web
  const processDroppedImageUrl = async (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const cleanUrl = rawUrl.trim();

    setUploadError(null);
    setIsUploading(true);
    setUploadStatusText('Importing image from Google & uploading to Supabase Storage...');

    try {
      // 1. Try downloading as blob to store in Supabase Storage permanently
      const blob = await fetchImageUrlAsBlob(cleanUrl);
      if (blob && typeof uploadImage === 'function') {
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const file = new File([blob], `${filenamePrefix}_google_${Date.now()}.${ext}`, { type: blob.type });
        const publicUrl = await uploadImage(file, folder, filenamePrefix);
        if (publicUrl) {
          onChange(publicUrl);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
          return;
        }
      }

      // 2. If CORS prevents blob download, directly assign image URL
      onChange(cleanUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.warn('Could not re-upload dropped URL; saving direct URL:', err);
      onChange(cleanUrl);
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  // Handle Drag & Drop
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

    // 1. Check if files were dropped from local machine or file manager
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await processAndUploadFile(files[0]);
      return;
    }

    // 2. Check if an image was dragged from Google Images (text/html contains <img src="...">)
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        await processDroppedImageUrl(match[1]);
        return;
      }
    }

    // 3. Check uri-list or plain text (direct image URLs)
    const uriList = e.dataTransfer?.getData('text/uri-list');
    if (uriList && isImageUrl(uriList)) {
      await processDroppedImageUrl(uriList);
      return;
    }

    const text = e.dataTransfer?.getData('text/plain');
    if (text && isImageUrl(text)) {
      await processDroppedImageUrl(text);
      return;
    }

    setUploadError('Could not read image from drop. Please drag an image directly from Google Images or drop a local file.');
  };

  // Handle Clipboard Paste (Ctrl+V)
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await processAndUploadFile(blob);
            return;
          }
        }
      }
    }

    const pastedText = e.clipboardData?.getData('text');
    if (pastedText && isImageUrl(pastedText.trim())) {
      e.preventDefault();
      await processDroppedImageUrl(pastedText.trim());
    }
  }, [uploadImage, folder, filenamePrefix]);

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={14} className="text-[#C2477A]" />
          <span>{entityType} Image</span>
        </label>
        <span className="text-[11px] text-gray-400 font-medium">Drag from Google or Upload</span>
      </div>

      {/* ── 1. CURRENT IMAGE PREVIEW ────────────────────────────────────── */}
      <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-pink-100/80">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
          Current Image Preview
        </span>

        {imageUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border border-pink-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
              <img
                src={imageUrl}
                alt="Selected preview"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Active Image Assigned & Ready to Save</span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono truncate max-w-sm">
                {imageUrl}
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 size={12} />
                  <span>Remove Image</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 border border-dashed border-pink-200 rounded-xl bg-white/70 text-center">
            <ImageIcon size={32} className="text-pink-300 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-gray-700 block">No image selected</span>
            <span className="text-[11px] text-gray-400">Search Google Images below or drag & drop an image directly.</span>
          </div>
        )}
      </div>

      {/* ── 2. GOOGLE IMAGES SEARCH & DIRECT DRAG-AND-DROP BAR ───────────── */}
      <div className="bg-gradient-to-r from-amber-50/70 via-pink-50/50 to-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shadow-2xs">
              G
            </div>
            <div>
              <span className="text-xs font-extrabold text-gray-900 block leading-tight">
                Search Google Images for "{entityName || 'Category'}"
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Find image in Google → drag & drop directly into the box below!
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenGoogleImages}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Globe size={13} />
            <span>Search in Google Images ↗</span>
          </button>
        </div>

        {/* Search query input for Google Images search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword for Google Images..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#C2477A] text-xs font-medium outline-none bg-white"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenGoogleImages}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Globe size={13} />
            <span>Search in Google Images ↗</span>
          </button>
        </div>
      </div>

      {/* ── 3. GOOGLE DIRECT DRAG & DROP ZONE (WITH SUPABASE STORAGE SYNC) ── */}
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#C2477A] ${
          isDragging
            ? 'border-[#C2477A] bg-pink-100/70 scale-[1.01] shadow-md'
            : 'border-pink-200 hover:border-[#C2477A] bg-gray-50/50 hover:bg-[#FFF9FB]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-2 text-center py-2">
            <Loader2 size={26} className="animate-spin text-[#C2477A] mx-auto" />
            <span className="text-xs font-bold text-gray-800 block">
              {uploadStatusText || 'Uploading to Supabase Storage...'}
            </span>
            <span className="text-[11px] text-gray-500">Optimizing and storing permanently</span>
          </div>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="w-11 h-11 rounded-2xl bg-white border border-pink-100 shadow-2xs flex items-center justify-center text-[#C2477A] mx-auto mb-1.5">
              <Upload size={20} />
            </div>
            <div className="text-sm font-black text-gray-900">
              Drag & Drop Image Directly from Google or Files
            </div>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Drag any image from your Google Images search tab and drop it here. You can also paste (<kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono text-[10px] text-gray-800">Ctrl + V</kbd>) or <span className="text-[#C2477A] font-bold underline">Browse Files</span>.
            </p>
            <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1 mt-1">
              <CheckCircle2 size={11} />
              <span>Automatically uploads to Supabase Storage and saves to database</span>
            </div>
          </div>
        )}
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Image assigned and staged! Click "Save Changes" below to update database.</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
