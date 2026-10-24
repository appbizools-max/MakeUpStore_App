import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Clipboard,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { optimizeImage, fetchImageUrlAsBlob, formatBytes, isImageUrl } from '../../utils/imageOptimizer';

export default function ImageManagerModal({
  isOpen,
  onClose,
  currentImageUrl = '',
  onSave,
  onRemove,
  title = 'Manage Image',
  entityName = '',
  folder = 'products',
  filenamePrefix = 'img',
  defaultSearchQuery = '',
}) {
  const { uploadImage } = useAdmin();

  // Active Tab: 'upload' | 'paste' | 'google' | 'url'
  const [activeTab, setActiveTab] = useState('upload');
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery || entityName || '');
  const [urlInput, setUrlInput] = useState('');

  // Drop / Upload / Processing state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Staged optimized image data
  const [stagedImage, setStagedImage] = useState(null);
  // stagedImage format: { file, blob, dataUrl, width, height, originalSize, optimizedSize, savedPercent, mimeType, filename }

  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  // Sync default search query whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(defaultSearchQuery || entityName || '');
      setErrorMessage(null);
      setSuccessMessage(null);
      setStagedImage(null);
      setUrlInput('');
      setActiveTab('upload');
    }
  }, [isOpen, defaultSearchQuery, entityName]);

  // Handle Escape key to close modal cleanly without saving
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isUploading && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, isProcessing, onClose]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle client-side optimization on raw image source
  const processRawSource = useCallback(async (source, customFilename = '') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const name = customFilename || `${filenamePrefix}_${Date.now()}`;
      const optimized = await optimizeImage(source, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        preferredFormat: 'image/webp',
        filename: name,
      });

      setStagedImage(optimized);
    } catch (err) {
      console.error('Image optimization failed:', err);
      setErrorMessage(err.message || 'Failed to process and optimize image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  }, [filenamePrefix]);

  // Handle file input selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Unsupported file format. Please upload JPG, PNG, WEBP, or SVG.');
      return;
    }

    await processRawSource(file, file.name);
    // Reset file input value so re-selecting same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
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

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await processRawSource(file, file.name);
        return;
      }
    }

    // Check if an image URL or HTML was dropped
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        await handleUrlSubmit(match[1]);
        return;
      }
    }

    const textUrl = e.dataTransfer?.getData('text/plain');
    if (textUrl && isImageUrl(textUrl)) {
      await handleUrlSubmit(textUrl);
      return;
    }

    setErrorMessage('Please drop an image file or direct image URL.');
  };

  // Clipboard Paste handler (active globally when modal is open)
  const handleClipboardPaste = useCallback(async (e) => {
    if (!isOpen || stagedImage) return;

    // Check clipboard for items (files / blobs)
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await processRawSource(blob, `pasted_${Date.now()}`);
            return;
          }
        }
      }
    }

    // Check clipboard for text URL
    const pastedText = e.clipboardData?.getData('text');
    if (pastedText && isImageUrl(pastedText.trim())) {
      e.preventDefault();
      await handleUrlSubmit(pastedText.trim());
    }
  }, [isOpen, stagedImage, processRawSource]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('paste', handleClipboardPaste);
    return () => {
      window.removeEventListener('paste', handleClipboardPaste);
    };
  }, [isOpen, handleClipboardPaste]);

  // Browse Google search handler
  const handleOpenGoogleSearch = () => {
    const q = searchQuery.trim() || entityName || 'cosmetics beauty product';
    const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
    window.open(googleImagesUrl, '_blank', 'noopener,noreferrer');
  };

  // URL submit handler
  const handleUrlSubmit = async (urlToFetch) => {
    const targetUrl = (urlToFetch || urlInput || '').trim();
    if (!targetUrl) {
      setErrorMessage('Please enter a valid image URL');
      return;
    }

    if (!isImageUrl(targetUrl)) {
      setErrorMessage('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const blob = await fetchImageUrlAsBlob(targetUrl);
      if (blob) {
        await processRawSource(blob, `url_${Date.now()}`);
      } else {
        // Fallback directly to image loader if fetch was CORS blocked
        await processRawSource(targetUrl, `url_${Date.now()}`);
      }
    } catch (err) {
      console.error('URL processing error:', err);
      setErrorMessage('Could not load image from this URL. Please save the image and upload or paste directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save / Upload to Supabase Storage and commit
  const handleConfirmSave = async () => {
    if (!stagedImage) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploadedUrl = await uploadImage(stagedImage.file, folder, filenamePrefix);
      if (!uploadedUrl) {
        throw new Error('Upload completed without returning a valid public image URL');
      }

      setSuccessMessage('Image updated successfully!');
      if (onSave) {
        onSave(uploadedUrl);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Save image failed:', err);
      setErrorMessage(err.message || 'Unable to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove current image
  const handleConfirmRemove = () => {
    if (window.confirm('Are you sure you want to remove this image? This will update the User App immediately.')) {
      if (onRemove) {
        onRemove();
      } else if (onSave) {
        onSave('');
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-scale-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky with prominent Close (✕) button */}
        <div className="p-4 sm:p-5 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shadow-xs shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">{title}</h2>
              <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                {entityName ? `Customizing image for: ${entityName}` : 'Centralized image management & storage sync'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || isProcessing}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200/90 hover:border-rose-300 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ml-3 group focus:outline-none focus:ring-2 focus:ring-rose-200"
            title="Close (✕)"
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <div className="flex-1">{errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* If an image is staged for preview */}
          {stagedImage ? (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {currentImageUrl ? 'Image Replacement Preview' : 'New Image Preview'}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Current Image (if any) */}
                  {currentImageUrl && (
                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-xs font-semibold text-gray-500 mb-2">CURRENT IMAGE</span>
                      <div className="w-44 h-44 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 p-2">
                        <img
                          src={currentImageUrl}
                          alt="Current"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 mt-2 truncate max-w-full">Existing asset</span>
                    </div>
                  )}

                  {/* New Staged & Optimized Image */}
                  <div className={`flex flex-col items-center p-3 bg-white rounded-lg border-2 border-pink-500 shadow-md ${!currentImageUrl ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center gap-1 text-xs font-bold text-pink-700 mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>OPTIMIZED NEW IMAGE</span>
                    </div>
                    <div className="w-44 h-44 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 p-2">
                      <img
                        src={stagedImage.dataUrl}
                        alt="Optimized Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-mono">
                        {stagedImage.width} × {stagedImage.height} px
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-md">
                        {formatBytes(stagedImage.optimizedSize)}
                      </span>
                      {stagedImage.savedPercent > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded-md">
                          {stagedImage.savedPercent}% smaller
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 uppercase font-bold text-[10px] rounded-md">
                        {stagedImage.mimeType.split('/')[1]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row when previewing */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStagedImage(null)}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Choose Different Image
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to Storage...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{currentImageUrl ? 'Confirm Replace Image' : 'Save Image'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Image Source Selection Mode */
            <div className="space-y-6">
              {/* Existing Image Bar if exists */}
              {currentImageUrl && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden p-1">
                      <img src={currentImageUrl} alt="Current thumbnail" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-700">Currently Active Image</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[280px] sm:max-w-md">{currentImageUrl}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmRemove}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}

              {/* Source Option Tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Choose Image Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                      activeTab === 'upload'
                        ? 'border-pink-600 bg-pink-50/60 text-pink-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Upload / Drop</span>
                    <span className="text-[10px] text-gray-500">File picker & drop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                      activeTab === 'paste'
                        ? 'border-pink-600 bg-pink-50/60 text-pink-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Clipboard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Paste (Ctrl+V)</span>
                    <span className="text-[10px] text-gray-500">From clipboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('google')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                      activeTab === 'google'
                        ? 'border-pink-600 bg-pink-50/60 text-pink-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Browse Google</span>
                    <span className="text-[10px] text-gray-500">Search images</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                      activeTab === 'url'
                        ? 'border-pink-600 bg-pink-50/60 text-pink-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Image URL</span>
                    <span className="text-[10px] text-gray-500">Direct web link</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Upload / Drag & Drop */}
              {activeTab === 'upload' && (
                <div
                  ref={dropzoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[220px] ${
                    isDragging
                      ? 'border-pink-500 bg-pink-50 scale-[1.01]'
                      : 'border-gray-300 hover:border-pink-400 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
                      <span className="text-sm font-semibold text-gray-700">Optimizing image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-pink-600 mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="text-base font-bold text-gray-800 mb-1">
                        Drag & Drop Image Here
                      </div>
                      <p className="text-xs text-gray-500 mb-4 max-w-sm">
                        or click to browse from device. High-res JPG, PNG, WEBP automatically optimized and centered.
                      </p>
                      <button
                        type="button"
                        className="px-5 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-xs font-semibold text-gray-700 shadow-sm"
                      >
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Paste (Ctrl+V) */}
              {activeTab === 'paste' && (
                <div
                  onPaste={handleClipboardPaste}
                  tabIndex={0}
                  className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl p-8 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[220px] flex flex-col items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-sm font-semibold text-gray-700">Reading and optimizing clipboard image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600 mb-3">
                        <Clipboard className="w-7 h-7" />
                      </div>
                      <div className="text-base font-bold text-gray-800 mb-1">
                        Press Ctrl + V to Paste
                      </div>
                      <p className="text-xs text-gray-600 max-w-md mb-3 leading-relaxed">
                        Copy an image from your browser, Google Images, or screenshot tool, then click anywhere in this box and press <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono font-bold text-gray-800">Ctrl + V</kbd>.
                      </p>
                      <div className="text-[11px] text-indigo-700 bg-indigo-100/60 px-3 py-1 rounded-full font-medium">
                        ✓ Direct clipboard payload supported without saving to disk first
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Browse Google */}
              {activeTab === 'google' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                      <Search className="w-4 h-4 text-amber-600" />
                      <span>Search & Select from Google Images</span>
                    </div>

                    <p className="text-xs text-amber-800 leading-relaxed mb-4">
                      Click below to open Google Images in a new tab with your product keyword. Right-click the best product image and choose <strong>"Copy Image"</strong> (or Copy Image Address), then return here and press <strong>Ctrl + V</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search term (e.g. Maybelline Matte Lipstick 102)"
                        className="flex-1 w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleOpenGoogleSearch}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                      >
                        <span>Search Google Images</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-amber-700 flex items-center gap-1.5 italic">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Notice: Make sure you have permission to use images you upload.</span>
                    </div>
                  </div>

                  {/* Drop / Paste catcher box right under Google tab */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handleClipboardPaste}
                    tabIndex={0}
                    className="border-2 border-dashed border-gray-300 hover:border-amber-400 bg-gray-50 rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Optimizing image from Google...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">
                        <strong>Ready:</strong> Click here and press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono text-gray-800">Ctrl + V</kbd> to paste your copied Google image, or drag & drop it directly.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Image URL */}
              {activeTab === 'url' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 mb-2">
                      <LinkIcon className="w-4 h-4 text-emerald-600" />
                      <span>Import from Direct Image URL</span>
                    </div>
                    <p className="text-xs text-emerald-800 mb-3">
                      Paste a direct image link. We will download it directly into your own Supabase Storage to ensure permanent reliability and fast loading in the User App.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/images/product.jpg"
                        className="flex-1 w-full px-3.5 py-2.5 border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUrlSubmit();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUrlSubmit()}
                        disabled={isProcessing || !urlInput.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <span>Preview & Import</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!stagedImage && (
          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>Supabase Storage: <code className="font-mono text-gray-700">gc-home-assets/{folder}/</code></span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 rounded-lg text-gray-700 font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
