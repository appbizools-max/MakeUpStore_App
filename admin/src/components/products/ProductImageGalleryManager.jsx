import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Star,
  ArrowLeft,
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Link as LinkIcon,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Palette
} from 'lucide-react';
import { uploadOptimizedImage } from '../../services/imageStorageService';

/**
 * Supported MIME types & max upload size (10MB)
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * ProductImageGalleryManager
 * 
 * Professional Enterprise Image Management System for Salbeau Admin:
 * 1. Dedicated Product Images Section with medium 1:1 square dropzone and image previews
 * 2. Multi-image support (Primary packshot + secondary gallery views)
 * 3. Drag-and-drop & local device file browsing
 * 4. Image reordering (Move Left / Right), replacement in-place, and deletion
 * 5. Star/badge primary image selector
 * 6. Separate optional Variant / Shade Images section with individual 1:1 image boxes per variant
 * 7. Integrated with Supabase Storage ('products' bucket) and WebP optimization
 * 8. Zero fake/default image injection - clean empty states
 */
export default function ProductImageGalleryManager({
  images = [],
  primaryImage = '',
  onChangeImages,
  variants = [],
  onChangeVariants,
  productName = '',
  brandName = '',
  category = '',
  subcategory = '',
  sku = 'prod',
  disabled = false,
  showVariantSection = true
}) {
  // General product gallery state
  const [isDraggingGeneral, setIsDraggingGeneral] = useState(false);
  const [uploadingGeneral, setUploadingGeneral] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generalError, setGeneralError] = useState(null);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');

  // Variant section state
  const [uploadingVariantId, setUploadingVariantId] = useState(null);
  const [variantDragTarget, setVariantDragTarget] = useState(null);
  const [variantError, setVariantError] = useState(null);
  const [expandedVariantId, setExpandedVariantId] = useState(null);

  // Hidden file input refs
  const generalFileInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const replaceFileInputRef = useRef(null);
  const variantFileInputRefs = useRef({});
  const replaceVariantRef = useRef({ variantId: null, imageIndex: null });
  const replaceVariantFileInputRef = useRef(null);

  // Ensure normalized list of images
  const normalizedImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : (primaryImage ? [primaryImage] : []);

  const activePrimary = primaryImage || normalizedImages[0] || '';

  // ---------------------------------------------------------------------------
  // FILE VALIDATION HELPER
  // ---------------------------------------------------------------------------
  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isAllowedExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');

    if (!ALLOWED_MIME_TYPES.includes(type) && !isAllowedExt) {
      return {
        valid: false,
        error: `Unsupported format (${file.type || 'unknown'}). Please upload JPG, PNG, or WebP images.`
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`
      };
    }
    return { valid: true };
  };

  // ---------------------------------------------------------------------------
  // GENERAL PRODUCT IMAGES: UPLOAD HANDLER
  // ---------------------------------------------------------------------------
  const handleUploadGeneralFiles = async (files) => {
    if (!files || files.length === 0 || disabled) return;
    setGeneralError(null);
    setUploadingGeneral(true);
    setUploadProgress(10);

    const fileList = Array.from(files);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const validation = validateFile(file);
        if (!validation.valid) {
          setGeneralError(validation.error);
          continue;
        }

        const safePrefix = (sku || productName || 'prod').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
        const res = await uploadOptimizedImage(file, 'PRODUCT', {
          folder: 'products',
          filenamePrefix: `${safePrefix}_img`,
          generateVariants: false
        });

        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
        setUploadProgress(Math.round(((i + 1) / fileList.length) * 100));
      }

      if (uploadedUrls.length > 0) {
        const combined = [...normalizedImages];
        uploadedUrls.forEach(url => {
          if (!combined.includes(url)) combined.push(url);
        });

        const newPrimary = combined[0] || '';
        if (typeof onChangeImages === 'function') {
          onChangeImages(combined, newPrimary);
        }
      }
    } catch (err) {
      console.error('Failed to upload product packshot:', err);
      setGeneralError('Failed to upload image. Please check your network and try again.');
    } finally {
      setUploadingGeneral(false);
      setUploadProgress(0);
      if (generalFileInputRef.current) generalFileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // GENERAL PRODUCT IMAGES: ACTIONS (PRIMARY, MOVE, REPLACE, DELETE)
  // ---------------------------------------------------------------------------
  const handleSetPrimary = (index) => {
    if (index === 0 || index >= normalizedImages.length) return;
    const target = normalizedImages[index];
    const reordered = [target, ...normalizedImages.filter((_, i) => i !== index)];
    if (typeof onChangeImages === 'function') {
      onChangeImages(reordered, target);
    }
  };

  const handleMoveImage = (index, direction) => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= normalizedImages.length) return;
    const updated = [...normalizedImages];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    const newPrimary = updated[0] || '';
    if (typeof onChangeImages === 'function') {
      onChangeImages(updated, newPrimary);
    }
  };

  const handleTriggerReplace = (index) => {
    replaceIndexRef.current = index;
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleExecuteReplace = async (file) => {
    const targetIdx = replaceIndexRef.current;
    if (targetIdx === null || !file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setGeneralError(validation.error);
      return;
    }

    setUploadingGeneral(true);
    try {
      const safePrefix = (sku || 'prod').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
      const res = await uploadOptimizedImage(file, 'PRODUCT', {
        folder: 'products',
        filenamePrefix: `${safePrefix}_repl_${targetIdx}`,
        generateVariants: false
      });

      if (res && res.url) {
        const updated = [...normalizedImages];
        updated[targetIdx] = res.url;
        const newPrimary = updated[0] || '';
        if (typeof onChangeImages === 'function') {
          onChangeImages(updated, newPrimary);
        }
      }
    } catch (err) {
      console.error('Failed to replace image:', err);
      setGeneralError('Failed to replace image. Please try again.');
    } finally {
      setUploadingGeneral(false);
      replaceIndexRef.current = null;
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = (index) => {
    const updated = normalizedImages.filter((_, i) => i !== index);
    const newPrimary = updated[0] || '';
    if (typeof onChangeImages === 'function') {
      onChangeImages(updated, newPrimary);
    }
  };

  const handleAddFromUrl = () => {
    const trimmed = (pastedUrl || '').trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setGeneralError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    const combined = [...normalizedImages];
    if (!combined.includes(trimmed)) combined.push(trimmed);
    const newPrimary = combined[0] || '';
    if (typeof onChangeImages === 'function') {
      onChangeImages(combined, newPrimary);
    }
    setPastedUrl('');
    setUrlModalOpen(false);
  };

  const handleGoogleImagesSearch = () => {
    const query = [productName, brandName, category, subcategory].filter(Boolean).join(' ');
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query || 'cosmetics product packshot')}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // ---------------------------------------------------------------------------
  // VARIANT IMAGES HANDLERS
  // ---------------------------------------------------------------------------
  const handleUploadVariantFiles = async (variantId, files) => {
    if (!files || files.length === 0 || !variantId || disabled) return;
    setVariantError(null);
    setUploadingVariantId(variantId);

    const fileList = Array.from(files);
    const uploadedUrls = [];

    try {
      for (const file of fileList) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setVariantError(validation.error);
          continue;
        }

        const safePrefix = `var_${variantId}`.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
        const res = await uploadOptimizedImage(file, 'PRODUCT', {
          folder: 'products/variants',
          filenamePrefix: `${safePrefix}`,
          generateVariants: false
        });

        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0 && typeof onChangeVariants === 'function') {
        const updatedVariants = variants.map(v => {
          if (v.id !== variantId) return v;
          const currentList = Array.isArray(v.images) && v.images.length > 0
            ? [...v.images]
            : (v.image ? [v.image] : []);
          
          uploadedUrls.forEach(url => {
            if (!currentList.includes(url)) currentList.push(url);
          });

          return {
            ...v,
            image: currentList[0] || '',
            images: currentList
          };
        });

        onChangeVariants(updatedVariants);
      }
    } catch (err) {
      console.error('Failed to upload variant images:', err);
      setVariantError('Failed to upload variant image. Please try again.');
    } finally {
      setUploadingVariantId(null);
      if (variantFileInputRefs.current[variantId]) {
        variantFileInputRefs.current[variantId].value = '';
      }
    }
  };

  const handleSetPrimaryVariantImage = (variantId, imageIndex) => {
    if (imageIndex === 0 || typeof onChangeVariants !== 'function') return;
    const updatedVariants = variants.map(v => {
      if (v.id !== variantId) return v;
      const currentList = Array.isArray(v.images) ? [...v.images] : (v.image ? [v.image] : []);
      if (!currentList[imageIndex]) return v;
      const target = currentList[imageIndex];
      const reordered = [target, ...currentList.filter((_, i) => i !== imageIndex)];
      return {
        ...v,
        image: target,
        images: reordered
      };
    });
    onChangeVariants(updatedVariants);
  };

  const handleDeleteVariantImage = (variantId, imageIndex) => {
    if (typeof onChangeVariants !== 'function') return;
    const updatedVariants = variants.map(v => {
      if (v.id !== variantId) return v;
      const currentList = Array.isArray(v.images) ? [...v.images] : (v.image ? [v.image] : []);
      const updated = currentList.filter((_, i) => i !== imageIndex);
      return {
        ...v,
        image: updated[0] || '',
        images: updated
      };
    });
    onChangeVariants(updatedVariants);
  };

  const handleResetVariantToMain = (variantId) => {
    if (typeof onChangeVariants !== 'function') return;
    const updatedVariants = variants.map(v => {
      if (v.id !== variantId) return v;
      return {
        ...v,
        image: '',
        images: []
      };
    });
    onChangeVariants(updatedVariants);
  };

  const handleVariantGoogleSearch = (variant) => {
    const varName = variant.name || variant.color_name || variant.shadeName || '';
    const query = [productName, brandName, varName, 'swatch packshot'].filter(Boolean).join(' ');
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={generalFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => handleUploadGeneralFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleExecuteReplace(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* =====================================================================
          SECTION 1: DEDICATED GENERAL PRODUCT IMAGES (1:1 RATIO SQUARE BOXES)
          ===================================================================== */}
      <div className="bg-white rounded-2xl border border-[#F3D7DF] p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100/70">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#C2477A] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ImageIcon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                  Product Images (Packshots & Gallery)
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-pink-50 text-[#C2477A] px-2 py-0.5 rounded-full border border-pink-200">
                  {normalizedImages.length} {normalizedImages.length === 1 ? 'Image' : 'Images'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Primary packshot displays on catalog cards and search; additional images form the PDP carousel (1:1 Square, PNG, JPG, WebP)
              </p>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setUrlModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Add image via direct URL"
            >
              <LinkIcon size={12} />
              <span>Paste URL</span>
            </button>
            <button
              type="button"
              onClick={handleGoogleImagesSearch}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Search packshots on Google Images in a new tab"
            >
              <Globe size={12} className="text-amber-600" />
              <span>Google Images ↗</span>
            </button>
          </div>
        </div>

        {/* URL Paste Drawer / Modal */}
        {urlModalOpen && (
          <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200/80 flex items-center gap-2 animate-in fade-in duration-150">
            <LinkIcon size={14} className="text-[#C2477A] shrink-0" />
            <input
              type="url"
              placeholder="https://example.com/packshot-1200.webp"
              value={pastedUrl}
              onChange={(e) => setPastedUrl(e.target.value)}
              className="flex-1 py-1.5 px-3 rounded-lg border border-pink-200 bg-white font-mono text-xs text-gray-900 outline-none focus:border-[#C2477A]"
            />
            <button
              type="button"
              onClick={handleAddFromUrl}
              className="px-3 py-1.5 rounded-lg bg-[#C2477A] text-white text-xs font-bold shadow-2xs cursor-pointer hover:bg-[#a83664]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setUrlModalOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Upload Error Banner */}
        {generalError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeneralError(null)}
              className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploadingGeneral && (
          <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 space-y-1.5 shadow-2xs animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-[#C2477A]">
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                Optimizing & uploading to Supabase Storage...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-pink-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C2477A] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress || 25}%` }}
              />
            </div>
          </div>
        )}

        {/* ===================================================================
            1:1 ASPECT RATIO MEDIUM SQUARE IMAGE GRID & DROPZONE
            =================================================================== */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 custom-scrollbar">
          {/* Active Uploaded Images (1:1 Ratio Medium Squares: 120px x 120px) */}
          {normalizedImages.map((imgUrl, index) => {
            const isPrimary = index === 0;
            return (
              <div
                key={`${imgUrl}-${index}`}
                className={`group relative w-32 h-32 aspect-square rounded-2xl border-2 overflow-hidden bg-white shrink-0 shadow-2xs transition-all ${
                  isPrimary
                    ? 'border-[#C2477A] ring-2 ring-pink-200'
                    : 'border-pink-100 hover:border-pink-300'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Product Packshot ${index + 1}`}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Primary Tag or Make Primary Button */}
                {isPrimary ? (
                  <span className="absolute top-1.5 left-1.5 bg-[#C2477A] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5 z-10">
                    <Star size={9} className="fill-white" /> Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-[#C2477A] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title="Promote to Primary Packshot"
                  >
                    Set Primary
                  </button>
                )}

                {/* Sequence Index Indicator */}
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs z-10">
                  #{index + 1}
                </span>

                {/* Top-Right Delete Action */}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 hover:bg-rose-600 text-gray-600 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer opacity-90 group-hover:opacity-100 z-10"
                  title="Delete image"
                >
                  <Trash2 size={11} className="stroke-[2.2]" />
                </button>

                {/* Hover Reordering & Replace Controls Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-5 pointer-events-none group-hover:pointer-events-auto">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, 'left')}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-pink-100 text-[#C2477A] flex items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95"
                      title="Move Left"
                    >
                      <ArrowLeft size={12} className="stroke-[2.5]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleTriggerReplace(index)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-pink-100 text-[#C2477A] flex items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95"
                    title="Replace with new file"
                  >
                    <RefreshCw size={11} className="stroke-[2.5]" />
                  </button>

                  {index < normalizedImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, 'right')}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-pink-100 text-[#C2477A] flex items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95"
                      title="Move Right"
                    >
                      <ArrowRight size={12} className="stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Medium 1:1 Aspect Ratio Square Upload Box (120px x 120px) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) setIsDraggingGeneral(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingGeneral(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingGeneral(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUploadGeneralFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              if (!disabled && generalFileInputRef.current) {
                generalFileInputRef.current.click();
              }
            }}
            className={`w-32 h-32 aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 p-2 text-center transition-all cursor-pointer shrink-0 ${
              isDraggingGeneral
                ? 'border-[#C2477A] bg-pink-100/70 scale-[1.02]'
                : 'border-pink-200/90 hover:border-[#C2477A] bg-pink-50/40 hover:bg-pink-50/80 text-[#C2477A]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Drop packshots here or click to browse device"
          >
            {uploadingGeneral ? (
              <Loader2 size={22} className="animate-spin text-[#C2477A]" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white border border-pink-200 text-[#C2477A] flex items-center justify-center shadow-2xs">
                <Plus size={16} className="stroke-[2.5]" />
              </div>
            )}
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-gray-800">
                {uploadingGeneral ? 'Uploading...' : '+ Add Packshot'}
              </span>
              <span className="text-[9.5px] text-gray-400 font-medium block mt-0.5">
                Drag & drop or browse
              </span>
            </div>
          </div>
        </div>

        {/* Empty State Banner if no images uploaded */}
        {normalizedImages.length === 0 && (
          <div className="py-2 px-3 rounded-xl bg-gray-50 border border-gray-200/60 text-gray-500 text-xs flex items-center justify-between">
            <span className="text-[11px]">
              No images uploaded yet. Product will display a clean neutral packshot container in catalog until images are added.
            </span>
            <button
              type="button"
              onClick={() => generalFileInputRef.current?.click()}
              className="text-[#C2477A] font-bold text-[11px] hover:underline cursor-pointer shrink-0"
            >
              Browse Device Files →
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 2: SEPARATE VARIANT / SHADE IMAGES SECTION (OPTIONAL)
          ===================================================================== */}
      {showVariantSection && (
        <div className="bg-white rounded-2xl border border-[#F3D7DF] p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100/70">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Palette size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                    Variant & Shade Images (Optional Tailored Swatches)
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Associate custom packshots with individual shades. When selected on the mobile app, these images immediately take precedence.
                </p>
              </div>
            </div>
          </div>

          {/* Variant Error Banner */}
          {variantError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{variantError}</span>
              </div>
              <button
                type="button"
                onClick={() => setVariantError(null)}
                className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Empty / Standalone Product State */}
          {variants.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 text-center space-y-1.5">
              <Layers size={24} className="mx-auto text-gray-400" />
              <h4 className="text-xs font-bold text-gray-700">No Variants Configured</h4>
              <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                This product is currently configured as a single standalone item. Enable variants in the Variant Builder below to upload shade-specific images.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v, vIndex) => {
                const varImages = Array.isArray(v.images) && v.images.length > 0
                  ? v.images.filter(Boolean)
                  : (v.image ? [v.image] : []);
                const hasCustomImages = varImages.length > 0;
                const isUploadingThis = uploadingVariantId === v.id;
                const isDragOverThis = variantDragTarget === v.id;
                const isExpanded = expandedVariantId === v.id || variants.length <= 3;
                const hexColor = v.hexColor || v.hex || '';
                const variantTitle = v.name || v.color_name || v.shadeName || `Variant #${vIndex + 1}`;

                return (
                  <div
                    key={v.id || vIndex}
                    className="rounded-2xl border border-pink-100/90 bg-white p-4 space-y-3 shadow-2xs hover:border-pink-200 transition-colors"
                  >
                    {/* Hidden Variant File Input */}
                    <input
                      ref={(el) => (variantFileInputRefs.current[v.id] = el)}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleUploadVariantFiles(v.id, e.target.files)}
                      className="hidden"
                    />

                    {/* Variant Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Swatch Circle or Generic Icon */}
                        {hexColor ? (
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: hexColor }}
                            title={`Hex: ${hexColor}`}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black shrink-0">
                            {vIndex + 1}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {variantTitle}
                            </span>
                            {v.sku && (
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.2 rounded">
                                {v.sku}
                              </span>
                            )}
                            {/* Custom vs Inheriting Badge */}
                            {hasCustomImages ? (
                              <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                                ✓ Custom Packshot ({varImages.length})
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                                ↺ Inheriting Main Packshot
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variant Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleVariantGoogleSearch(v)}
                          className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Search swatch images on Google"
                        >
                          <Globe size={11} />
                          <span>Google ↗</span>
                        </button>

                        {hasCustomImages && (
                          <button
                            type="button"
                            onClick={() => handleResetVariantToMain(v.id)}
                            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer"
                            title="Reset to main product packshot"
                          >
                            Reset to Main
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedVariantId(isExpanded ? null : v.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer sm:hidden"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Variant Image 1:1 Square Thumbnails & Upload Box */}
                    {isExpanded && (
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                        {/* Uploaded Variant Images (1:1 Ratio Medium Squares: 96px x 96px) */}
                        {varImages.map((vImg, vImgIdx) => {
                          const isVarPrimary = vImgIdx === 0;
                          return (
                            <div
                              key={`${vImg}-${vImgIdx}`}
                              className={`group relative w-24 h-24 aspect-square rounded-xl border-2 overflow-hidden bg-white shrink-0 shadow-2xs transition-all ${
                                isVarPrimary
                                  ? 'border-purple-500 ring-2 ring-purple-100'
                                  : 'border-pink-100 hover:border-pink-300'
                              }`}
                            >
                              <img
                                src={vImg}
                                alt={`${variantTitle} Packshot ${vImgIdx + 1}`}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />

                              {isVarPrimary ? (
                                <span className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs z-10">
                                  Primary
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryVariantImage(v.id, vImgIdx)}
                                  className="absolute top-1 left-1 bg-black/70 hover:bg-purple-600 text-white text-[7.5px] font-bold px-1 py-0.2 rounded backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                >
                                  Make Primary
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteVariantImage(v.id, vImgIdx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/95 hover:bg-rose-600 text-gray-600 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer opacity-90 group-hover:opacity-100 z-10"
                                title="Delete variant image"
                              >
                                <Trash2 size={10} className="stroke-[2.2]" />
                              </button>
                            </div>
                          );
                        })}

                        {/* 1:1 Aspect Ratio Square Upload Box for this Variant (96px x 96px) */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!disabled) setVariantDragTarget(v.id);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setVariantDragTarget(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setVariantDragTarget(null);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleUploadVariantFiles(v.id, e.dataTransfer.files);
                            }
                          }}
                          onClick={() => {
                            if (!disabled && variantFileInputRefs.current[v.id]) {
                              variantFileInputRefs.current[v.id].click();
                            }
                          }}
                          className={`w-24 h-24 aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 p-2 text-center transition-all cursor-pointer shrink-0 ${
                            isDragOverThis
                              ? 'border-purple-500 bg-purple-100/70 scale-[1.02]'
                              : 'border-pink-200 hover:border-purple-500 bg-pink-50/30 hover:bg-purple-50/50 text-purple-600'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`Upload packshot for ${variantTitle}`}
                        >
                          {isUploadingThis ? (
                            <Loader2 size={18} className="animate-spin text-purple-600" />
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-white border border-pink-200 text-purple-600 flex items-center justify-center shadow-2xs">
                              <Plus size={13} className="stroke-[2.5]" />
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-gray-700 block leading-tight">
                            {isUploadingThis ? 'Uploading...' : '+ Variant Pic'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

