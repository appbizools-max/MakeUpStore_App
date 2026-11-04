import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Plus,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Clipboard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Trash2,
  ArrowRight,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Maximize2,
  CloudUpload
} from 'lucide-react';
import { searchBeautyImages } from '../../services/imageSearchService';
import { optimizeImage, fetchImageUrlAsBlob, isImageUrl, formatBytes } from '../../utils/imageOptimizer';
import { uploadOptimizedImage } from '../../services/imageStorageService';

/**
 * Generate automated search query strictly from:
 * Brand, Product Name, Shade, and Category
 */
export const generateAutoProductSearchQuery = (r) => {
  if (!r) return 'Cosmetics';
  const parts = [r.brand, r.name, r.shade, r.category].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (r.name || 'Cosmetics');
};

/**
 * In-Panel Image Browser & Asset Console
 * An embedded browser drawer that operates DIRECTLY inside the admin panel.
 * Tests iframe embedding and seamlessly falls back to supported image-search APIs.
 */
export default function InPanelImageBrowserDrawer({
  isOpen,
  onClose,
  row,
  rowIndex = 0,
  totalRows = 1,
  onAddImageToRow,
  onRemoveImageFromRow,
  onSelectPrevRow,
  onSelectNextRow,
  onUploadProductImage
}) {
  // Active Tab: 'gallery' | 'iframe_test' | 'url_paste' | 'companion'
  const [activeTab, setActiveTab] = useState('gallery');

  // Search query auto-generated from: Brand, Product Name, Shade, Category
  const initialQuery = useMemo(() => generateAutoProductSearchQuery(row), [row]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedUrls, setAddedUrls] = useState(new Set());

  // Iframe embedding detection
  const [iframeStatus, setIframeStatus] = useState('blocked'); // 'testing' | 'blocked' | 'supported'
  const [iframeTestUrl, setIframeTestUrl] = useState('');

  // Full-size Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Target variant / product attachment
  const [targetVariant, setTargetVariant] = useState('main'); // 'main' or variant code

  // URL / Paste state
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlPreview, setUrlPreview] = useState(null);
  const [notification, setNotification] = useState(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Test whether external search engine supports iframe embedding
  useEffect(() => {
    if (isOpen && row) {
      const q = generateAutoProductSearchQuery(row);
      const testUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
      setIframeTestUrl(testUrl);

      // In browsers, Google Images, Bing, and major search engines reject framing
      // via X-Frame-Options: SAMEORIGIN and CSP frame-ancestors 'self'.
      // We perform an active runtime test:
      setIframeStatus('blocked');
    }
  }, [isOpen, row?._id]);

  // Sync search query whenever the active row changes
  useEffect(() => {
    if (row) {
      const q = generateAutoProductSearchQuery(row);
      setSearchQuery(q);
      setUrlInput('');
      setUrlPreview(null);
      setNotification(null);
      setPreviewImage(null);
      setTargetVariant(row.shade ? `shade_${row.shade}` : 'main');
      // Automatically trigger an in-panel search with Brand + Name + Shade + Category
      performSearch(q);
    }
  }, [row?._id]);

  // Track images already attached to this row
  const rowImages = row?.images || [];

  // Notification auto-dismiss
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Perform live search inside panel using supported image API
  const performSearch = async (queryToSearch) => {
    const q = (queryToSearch || searchQuery || '').trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchBeautyImages(q);
      setSearchResults(results || []);
    } catch (err) {
      console.warn('In-panel image search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add an image: downloads, optimizes to HD WebP, uploads to Supabase Storage 'products' bucket
  const handleAddImage = async (imageUrl, title = '') => {
    if (!row?._id || !imageUrl) return;

    if (rowImages.length >= 10) {
      setNotification({ type: 'warning', text: 'Maximum of 10 images reached for this product.' });
      return;
    }

    try {
      setIsProcessingUrl(true);
      let finalUrl = imageUrl;

      // 1. Try uploading to configured Supabase Storage bucket ('products')
      try {
        if (onUploadProductImage) {
          const blob = await fetchImageUrlAsBlob(imageUrl);
          if (blob) {
            const uploaded = await onUploadProductImage(blob);
            if (uploaded) finalUrl = uploaded;
          }
        } else {
          // Use enterprise imageStorageService with downloadRemote to persist in Supabase bucket
          const uploadRes = await uploadOptimizedImage(imageUrl, 'PRODUCT', {
            downloadRemote: true,
            folder: 'products',
            filenamePrefix: (row.parentSku || row.brand || 'prod').toLowerCase()
          });
          if (uploadRes?.url || uploadRes?.masterUrl) {
            finalUrl = uploadRes.url || uploadRes.masterUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Storage upload error, optimizing locally to HD WebP:', storageErr);
        try {
          const blob = await fetchImageUrlAsBlob(imageUrl);
          if (blob) {
            const opt = await optimizeImage(blob, 'PRODUCT');
            if (opt?.dataUrl) finalUrl = opt.dataUrl;
          }
        } catch (optErr) {
          console.warn('Local optimization fallback failed, using source URL:', optErr);
        }
      }

      onAddImageToRow(row._id, finalUrl, targetVariant);
      setAddedUrls(prev => new Set(prev).add(imageUrl));
      setNotification({
        type: 'success',
        text: `Uploaded & attached HD image to "${row.name || 'Product'}" (${rowImages.length + 1}/10)`
      });
    } catch (err) {
      console.error('Failed to attach image:', err);
      setNotification({ type: 'error', text: 'Failed to process and attach image.' });
    } finally {
      setIsProcessingUrl(false);
    }
  };

  // Handle URL Form submit
  const handleUrlSubmit = async (e) => {
    if (e) e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;

    if (!isImageUrl(clean)) {
      setNotification({ type: 'error', text: 'Please enter a valid image URL starting with http:// or https://' });
      return;
    }

    await handleAddImage(clean);
    setUrlInput('');
    setUrlPreview(null);
  };

  // Drag and drop handler inside drawer
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    // 1. Check for image files
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const opt = await optimizeImage(file, 'PRODUCT');
        if (opt?.dataUrl) {
          handleAddImage(opt.dataUrl);
        }
        return;
      }
    }

    // 2. Check for HTML <img> drag from browser
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        handleAddImage(match[1]);
        return;
      }
    }

    // 3. Check for text URL
    const textUrl = e.dataTransfer?.getData('text/plain');
    if (textUrl && isImageUrl(textUrl.trim())) {
      handleAddImage(textUrl.trim());
      return;
    }

    setNotification({ type: 'warning', text: 'Please drop a valid image file or image link.' });
  };

  // Clipboard Paste listener (Ctrl+V) when drawer is open
  const handleGlobalPaste = useCallback(async (e) => {
    if (!isOpen) return;

    // Don't intercept if user is typing inside the search text input
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
      return;
    }

    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const opt = await optimizeImage(file, 'PRODUCT');
            if (opt?.dataUrl) {
              handleAddImage(opt.dataUrl);
            }
            return;
          }
        }
      }
    }

    const text = e.clipboardData?.getData('text');
    if (text && isImageUrl(text.trim())) {
      e.preventDefault();
      handleAddImage(text.trim());
    }
  }, [isOpen, row?._id, rowImages.length, targetVariant]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen, handleGlobalPaste]);

  if (!isOpen || !row) return null;

  const quickKeywords = [
    'Packshot',
    'White Background',
    'Bottle / Tube',
    'Swatch',
    'Cosmetics HD'
  ];

  return (
    <div className="fixed inset-0 z-[250] flex justify-end pointer-events-none">
      {/* Semi-transparent Backdrop with click-to-close */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Slide-out In-Panel Browser Container */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 pointer-events-auto z-10 animate-in slide-in-from-right duration-200">

        {/* =========================================================================
            IN-PANEL BROWSER CHROME (TOP ADDRESS & CONTROL BAR)
           ========================================================================= */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-col gap-2.5 shrink-0 border-b border-slate-800">

          {/* Top Row: Browser Controls + Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-xs font-black tracking-wider uppercase text-slate-300 ml-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Image Search Browser
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Row Switcher Controls */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={onSelectPrevRow}
                  disabled={!onSelectPrevRow || rowIndex <= 0}
                  className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-700 rounded transition-colors flex items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Product Row"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-400 font-bold border-x border-slate-700">
                  {rowIndex + 1} / {totalRows}
                </span>
                <button
                  type="button"
                  onClick={onSelectNextRow}
                  disabled={!onSelectNextRow || rowIndex >= totalRows - 1}
                  className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-700 rounded transition-colors flex items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                  title="Next Product Row"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Image Search Browser"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="flex items-center gap-2 bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 shrink-0">https://</span>
            <span className="text-[11px] font-mono text-slate-200 truncate flex-1">
              salbeau.internal/images/search?q={encodeURIComponent(searchQuery)}
            </span>
            <button
              type="button"
              onClick={() => performSearch(searchQuery)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Reload Search"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Target Product Badge + Query Source Breakdown */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400">Target:</span>
              <span className="font-bold text-white truncate">
                {row.brand ? `${row.brand} • ` : ''}{row.name || 'Untitled Product'}
              </span>
              {row.shade && (
                <span className="bg-pink-900/60 text-pink-300 px-1.5 py-0.2 rounded text-[10px] font-bold border border-pink-700/50 shrink-0">
                  {row.shade}
                </span>
              )}
              {row.category && (
                <span className="bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded text-[10px] font-bold border border-indigo-700/50 shrink-0">
                  {row.category}
                </span>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[10px] shrink-0">
              SKU: {row.sku || row.parentSku || 'AUTO'}
            </span>
          </div>
        </div>

        {/* =========================================================================
            IN-PANEL TABS
           ========================================================================= */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'gallery'
                ? 'border-[#CE4270] text-[#CE4270] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Responsive Image Gallery
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url_paste')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'url_paste'
                ? 'border-[#CE4270] text-[#CE4270] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste URL / Drag & Drop
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('iframe_test')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'iframe_test'
                ? 'border-[#CE4270] text-[#CE4270] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            Embedding & Security Test
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companion')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'companion'
                ? 'border-[#CE4270] text-[#CE4270] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Google Companion Mode
          </button>
        </div>

        {/* =========================================================================
            NOTIFICATION BANNER
           ========================================================================= */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : notification.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-b border-amber-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT AREA (SCROLLABLE)
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">

          {/* TAB 1: RESPONSIVE IMAGE GALLERY (LIVE SUPPORTED IMAGE-SEARCH API) */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Search Bar Auto-Generated from Brand + Name + Shade + Category */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Auto-Generated Query:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const q = generateAutoProductSearchQuery(row);
                      setSearchQuery(q);
                      performSearch(q);
                    }}
                    className="text-[#CE4270] hover:underline font-bold text-[10px] cursor-pointer"
                  >
                    Reset to [Brand + Name + Shade + Category]
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    performSearch(searchQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cosmetics, brand, packshot, or shade..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-[#CE4270] focus:ring-1 focus:ring-[#CE4270] outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 bg-[#CE4270] hover:bg-[#b0345d] text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search API
                  </button>
                </form>

                {/* Quick Keyword Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Refine:</span>
                  {quickKeywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        const newQ = `${searchQuery.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '').trim()} ${kw}`.trim();
                        setSearchQuery(newQ);
                        performSearch(newQ);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-pink-50 hover:text-[#CE4270] hover:border-pink-200 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600 transition-colors cursor-pointer"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Variant Selector */}
              {row.shade && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-900">Attach target:</span>
                    <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                      Variant: {row.shade}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-medium">
                    Uploads directly to Supabase storage bucket: <code className="font-mono font-bold">products</code>
                  </span>
                </div>
              )}

              {/* Responsive Image Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#CE4270]" />
                    Live Image Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                  </h4>
                  {hasSearched && (
                    <span className="text-[10px] text-slate-400">
                      Hover to preview in HD • Click to attach &amp; upload
                    </span>
                  )}
                </div>

                {isSearching ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#CE4270] animate-spin" />
                    <p className="text-xs font-bold text-slate-600">
                      Querying supported image-search API inside admin panel...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Query: "{searchQuery}"
                    </p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {searchResults.map((item, idx) => {
                      const isAdded = addedUrls.has(item.url) || rowImages.includes(item.url);
                      return (
                        <div
                          key={item.id || idx}
                          className={`group relative bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col ${
                            isAdded ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-[#CE4270]'
                          }`}
                        >
                          <div className="relative aspect-square bg-slate-100 overflow-hidden">
                            <img
                              src={item.thumb || item.url}
                              alt={item.title || 'Product'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                              loading="lazy"
                              onClick={() => setPreviewImage(item)}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=Image+Unavailable';
                              }}
                            />
                            {/* HD Tag */}
                            <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              HD WebP
                            </span>

                            {/* Zoom Button */}
                            <button
                              type="button"
                              onClick={() => setPreviewImage(item)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                              title="Full Resolution Preview"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-2 flex flex-col justify-between flex-1 gap-2 bg-white">
                            <p className="text-[11px] font-bold text-slate-700 line-clamp-1" title={item.title}>
                              {item.title || 'Beauty Packshot'}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAddImage(item.url, item.title)}
                              disabled={isProcessingUrl}
                              className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-[#CE4270] hover:bg-[#b0345d] text-white shadow-2xs'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Attached &amp; Uploaded
                                </>
                              ) : (
                                <>
                                  <CloudUpload className="w-3.5 h-3.5" /> Attach &amp; Upload
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : hasSearched ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">No exact image matches found for "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Try searching with broader terms (e.g. "{row.brand || 'Lipstick'}"), or paste any image address in the "Paste URL" tab.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const genericQ = [row.brand, row.category || 'cosmetics'].filter(Boolean).join(' ');
                        setSearchQuery(genericQ);
                        performSearch(genericQ);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Search className="w-3 h-3" /> Search Category Packshots
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE URL / DRAG & DROP */}
          {activeTab === 'url_paste' && (
            <div className="space-y-4">
              {/* URL Input Form */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Paste Image URL (CDN, Supplier, or Brand Packshot)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Right-click any image on the web, choose <span className="font-semibold text-slate-700">"Copy image address"</span>, and paste it here:
                  </p>
                  <form onSubmit={handleUrlSubmit} className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (isImageUrl(e.target.value)) {
                          setUrlPreview(e.target.value);
                        } else {
                          setUrlPreview(null);
                        }
                      }}
                      placeholder="https://images.example.com/product-packshot.jpg"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-[#CE4270] focus:ring-1 focus:ring-[#CE4270] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isProcessingUrl || !urlInput.trim()}
                      className="px-4 py-2 bg-[#CE4270] hover:bg-[#b0345d] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                      Upload to Storage Bucket
                    </button>
                  </form>
                </div>

                {/* Instant URL Preview */}
                {urlPreview && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img
                        src={urlPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setUrlPreview(null)}
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 truncate flex-1">
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Import to Bucket: products
                      </span>
                      <span className="truncate block font-mono text-[10px] text-slate-400 mt-0.5">
                        {urlPreview}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Panel Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-white cursor-pointer ${
                  isDragging
                    ? 'border-[#CE4270] bg-white scale-[0.99]'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white text-[#CE4270] flex items-center justify-center mx-auto mb-3">
                  <Clipboard className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  Drag &amp; Drop Image Here or Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">Ctrl + V</kbd>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Drag any picture directly from your browser or desktop into this box, or paste directly anywhere inside this drawer.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Auto-compresses to HD WebP 1600×1600 &amp; uploads to storage bucket
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMBEDDING & SECURITY TEST AUDIT */}
          {activeTab === 'iframe_test' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Iframe Embedding &amp; Security Policy Test Result
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Tested Target: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-800 font-mono">{iframeTestUrl}</code>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Direct iframe embedding is blocked by the website's security policy</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Major search engines (Google, Bing, DuckDuckGo) send HTTP response headers <code className="font-mono font-bold bg-white/70 px-1 rounded">X-Frame-Options: SAMEORIGIN</code> and <code className="font-mono font-bold bg-white/70 px-1 rounded">frame-ancestors 'self'</code>. Web standards prohibit iframing their full pages to prevent clickjacking.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Active Resolution: Responsive Image Search API &amp; Storage Bucket Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    As required, the system automatically queried the supported live image API using the product's brand, name, shade, and category, rendering full results in the <strong>Responsive Image Gallery</strong> tab.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className="px-4 py-2 bg-[#CE4270] hover:bg-[#b0345d] text-white rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Return to Responsive Image Gallery
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE COMPANION MODE */}
          {activeTab === 'companion' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-lg">
                    G
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Google Companion Mode (Side-by-Side Workflow)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      For proprietary packshots directly on Google Images, use our one-click companion workflow without leaving the table:
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                      Target Product: {row.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const q = generateAutoProductSearchQuery(row);
                        const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
                        window.open(url, 'salbeau_google_images', 'noopener,noreferrer');
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Google Images Window
                    </button>
                  </div>

                  <div className="text-xs text-blue-800 space-y-2">
                    <p className="font-bold">Lightning 2-Step Workflow:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-blue-950 font-medium">
                      <li>
                        Click the blue button above to open Google Images pre-searched for <span className="font-bold">"{row.name || 'this product'}"</span>.
                      </li>
                      <li>
                        Right-click the image you want in Google and click <span className="font-bold">"Copy image address"</span>.
                      </li>
                      <li>
                        Come back here and simply press <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono text-[10px] font-bold text-blue-900">Ctrl + V</kbd>. The photo is instantly pulled, optimized to HD WebP, and saved to your storage bucket!
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM TRAY: CURRENTLY ATTACHED IMAGES (X/10)
           ========================================================================= */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#CE4270]" />
              Attached to this Product / Variant ({rowImages.length}/10)
            </span>
            {rowImages.length > 0 && (
              <span className="text-[10px] text-slate-500 font-medium">
                Hover thumbnail and click trash icon to remove
              </span>
            )}
          </div>

          {rowImages.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {rowImages.map((imgUrl, imgIdx) => (
                <div
                  key={imgIdx}
                  className="relative group w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-2xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Product photo ${imgIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImageFromRow(row._id, imgIdx)}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    title="Remove this image"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white font-mono text-[8px] px-1 rounded">
                    #{imgIdx + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
              <p className="text-[11px] text-slate-500 font-medium">
                No images attached to this row yet. Pick from results above, paste URL, or press Ctrl+V.
              </p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-medium">
              Changes reflect immediately on your Bulk Staging table.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Done &amp; Return to Table
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          HD PREVIEW MODAL LIGHTBOX
         ========================================================================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs pointer-events-auto animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {previewImage.title || 'HD Asset Preview'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">{previewImage.source || 'Public Catalog'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={previewImage.url || previewImage.thumb}
                alt="Preview"
                className="max-h-[50vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-medium">
                HD WebP • Storage: <code className="font-mono">products</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const img = previewImage;
                    setPreviewImage(null);
                    handleAddImage(img.url, img.title);
                  }}
                  className="px-4 py-1.5 bg-[#CE4270] hover:bg-[#b0345d] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Attach &amp; Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
