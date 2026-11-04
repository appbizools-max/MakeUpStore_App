import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Image as ImageIcon,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Layers,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  X,
  Upload,
  RefreshCw,
  FolderPlus,
  Store,
  Check
} from 'lucide-react';
import {
  BANNER_TYPES,
  fetchAllCentralBanners,
  saveCentralBannersMaster,
  deleteBannerPermanent
} from '../../services/bannerManagementService';
import { supabase } from '../../config/supabase';
import { uploadOptimizedImage } from '../../services/imageStorageService';
import { useAdmin } from '../../context/AdminContext';
import InlineImageSection from '../media/InlineImageSection';

export default function BannerManagementPage({
  categories: propCategories = [],
  subcategories: propSubcategories = [],
  productTypes: propProductTypes = []
}) {
  const [categories, setCategories] = useState(propCategories);
  const [subcategories, setSubcategories] = useState(propSubcategories);
  const [productTypes, setProductTypes] = useState(propProductTypes);

  // Sync prop changes or fetch directly from Supabase
  useEffect(() => {
    if (propCategories.length > 0) setCategories(propCategories);
    if (propSubcategories.length > 0) setSubcategories(propSubcategories);
    if (propProductTypes.length > 0) setProductTypes(propProductTypes);

    if (propCategories.length === 0 || propSubcategories.length === 0) {
      const fetchHierarchy = async () => {
        try {
          const [catRes, subRes, ptRes] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('subcategories').select('*').order('name'),
            supabase.from('product_types').select('*').order('name')
          ]);
          if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
          if (subRes.data && subRes.data.length > 0) setSubcategories(subRes.data);
          if (ptRes.data && ptRes.data.length > 0) setProductTypes(ptRes.data);
        } catch (e) {
          console.warn('Hierarchy fetch note for banners:', e);
        }
      };
      fetchHierarchy();
    }
  }, [propCategories, propSubcategories, propProductTypes]);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null); // null = add new
  const [drawerFormData, setDrawerFormData] = useState({
    title: '',
    subtitle: '',
    bannerType: 'home',
    imageUrl: '',
    mobileImageUrl: '',
    categoryId: '',
    categoryName: '',
    subcategoryId: '',
    subcategoryName: '',
    selectionId: '',
    selectionName: '',
    ctaText: 'Shop Now →',
    ctaLink: '',
    displayOrder: 1,
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = React.useRef(null);
  const adminCtx = useAdmin ? useAdmin() : {};

  // Delete Confirmation Drawer State
  const [deleteTargetBanner, setDeleteTargetBanner] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show Toast helper
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load initial banner records
  const loadBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCentralBanners();
      setBanners(data);
    } catch (err) {
      console.error('Error loading central banners:', err);
      showToast('Failed to load banners from Supabase.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // Filtered Banners
  const filteredBanners = useMemo(() => {
    return banners.filter(b => {
      if (typeFilter !== 'all' && b.bannerType !== typeFilter && b.type !== typeFilter) {
        return false;
      }
      if (statusFilter === 'active' && b.isActive === false) return false;
      if (statusFilter === 'inactive' && b.isActive !== false) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (b.title || '').toLowerCase().includes(q);
        const matchSubtitle = (b.subtitle || '').toLowerCase().includes(q);
        const matchCat = (b.categoryName || '').toLowerCase().includes(q);
        const matchSub = (b.subcategoryName || '').toLowerCase().includes(q);
        const matchSel = (b.selectionName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchCat && !matchSub && !matchSel) return false;
      }

      return true;
    }).sort((a, b) => (Number(a.displayOrder) || 1) - (Number(b.displayOrder) || 1));
  }, [banners, typeFilter, statusFilter, searchQuery]);

  // Open Add Drawer
  const handleOpenAdd = (defaultType = 'home') => {
    const nextOrder = banners.length > 0
      ? Math.max(...banners.map(b => Number(b.displayOrder) || 1)) + 1
      : 1;

    setEditingBanner(null);
    setDrawerFormData({
      title: '',
      subtitle: '',
      bannerType: defaultType,
      imageUrl: '',
      mobileImageUrl: '',
      categoryId: '',
      categoryName: '',
      subcategoryId: '',
      subcategoryName: '',
      selectionId: '',
      selectionName: '',
      ctaText: 'Shop Now →',
      ctaLink: '',
      displayOrder: nextOrder,
      isActive: true
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setDrawerFormData({
      title: banner.title || banner.name || '',
      subtitle: banner.subtitle || '',
      bannerType: banner.bannerType || banner.type || 'home',
      imageUrl: banner.imageUrl || '',
      mobileImageUrl: banner.mobileImageUrl || banner.imageUrl || '',
      categoryId: banner.categoryId || '',
      categoryName: banner.categoryName || '',
      subcategoryId: banner.subcategoryId || '',
      subcategoryName: banner.subcategoryName || '',
      selectionId: banner.selectionId || '',
      selectionName: banner.selectionName || '',
      ctaText: banner.ctaText || 'Shop Now →',
      ctaLink: banner.ctaLink || '',
      displayOrder: Number(banner.displayOrder) || 1,
      isActive: banner.isActive !== false
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Direct Image File Upload to Supabase Storage
  const handleDirectImageUpload = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadOptimizedImage(file, 'CATEGORY', {
        folder: 'home-banners',
        filenamePrefix: 'banner'
      });
      if (res?.url) {
        setDrawerFormData(prev => ({ ...prev, imageUrl: res.url, mobileImageUrl: res.url }));
        if (formErrors.imageUrl) setFormErrors(prev => ({ ...prev, imageUrl: null }));
        showToast('Image uploaded and staged successfully!');
      }
    } catch (err) {
      console.error('Image upload notice:', err);
      // Fallback: create object URL or stage file
      const localUrl = URL.createObjectURL(file);
      setDrawerFormData(prev => ({ ...prev, imageUrl: localUrl, mobileImageUrl: localUrl }));
      showToast('Image staged from local file.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Banner (Add or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    const titleVal = drawerFormData.title.trim() ||
      (drawerFormData.bannerType === 'home'
        ? 'Home Store Banner'
        : (drawerFormData.categoryName ? `${drawerFormData.categoryName} Banner` : 'Promotional Banner'));

    if (!drawerFormData.imageUrl.trim()) {
      errors.imageUrl = 'Banner image is required';
      showToast('Please select, drop, or enter a banner image URL before publishing.', 'error');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const bannerPayload = {
        id: editingBanner?.id || `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: titleVal,
        title: titleVal,
        subtitle: drawerFormData.subtitle.trim(),
        bannerType: drawerFormData.bannerType,
        type: drawerFormData.bannerType,
        imageUrl: drawerFormData.imageUrl.trim(),
        mobileImageUrl: (drawerFormData.mobileImageUrl || drawerFormData.imageUrl).trim(),
        categoryId: drawerFormData.categoryId,
        categoryName: drawerFormData.categoryName,
        subcategoryId: drawerFormData.subcategoryId,
        subcategoryName: drawerFormData.subcategoryName,
        selectionId: drawerFormData.selectionId,
        selectionName: drawerFormData.selectionName,
        ctaText: drawerFormData.ctaText.trim() || 'Shop Now →',
        ctaLink: drawerFormData.ctaLink.trim(),
        displayOrder: Number(drawerFormData.displayOrder) || 1,
        isActive: drawerFormData.isActive,
        updatedAt: new Date().toISOString()
      };

      if (!editingBanner) {
        bannerPayload.createdAt = new Date().toISOString();
      }

      let updatedList;
      if (editingBanner) {
        updatedList = banners.map(b => b.id === editingBanner.id ? { ...b, ...bannerPayload } : b);
      } else {
        updatedList = [...banners, bannerPayload];
      }

      await saveCentralBannersMaster(updatedList);
      setBanners(updatedList);

      if (adminCtx?.setHomeBanners) {
        const homeOnly = updatedList.filter(b => b.bannerType === 'home' || !b.bannerType);
        adminCtx.setHomeBanners(homeOnly);
      }

      setIsDrawerOpen(false);
      showToast(editingBanner ? 'Banner updated successfully in database!' : 'New banner published successfully to Supabase and live in app!');
    } catch (err) {
      console.error('Error saving banner:', err);
      showToast('Failed to save banner to database: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (banner) => {
    const updated = banners.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b);
    setBanners(updated);
    try {
      await saveCentralBannersMaster(updated);
      showToast(`Banner "${banner.title || 'Untitled'}" is now ${!banner.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      console.error('Toggle status error:', err);
      // Revert on error
      setBanners(banners);
      showToast('Failed to update banner status.', 'error');
    }
  };

  // Permanent Delete (Atomic Supabase + Storage + Backup Snapshot)
  const handleConfirmPermanentDelete = async () => {
    if (!deleteTargetBanner) return;
    setIsDeleting(true);
    try {
      const targetId = deleteTargetBanner.id;
      const targetImg = deleteTargetBanner.imageUrl;

      // Call service with existing banners so it removes accurately
      const remaining = await deleteBannerPermanent(targetId, targetImg, banners);
      setBanners(remaining);

      // Sync AdminContext
      if (adminCtx?.setHomeBanners) {
        adminCtx.setHomeBanners(remaining.filter(b => b.bannerType === 'home' || !b.bannerType));
      }

      setDeleteTargetBanner(null);
      showToast(`Banner "${deleteTargetBanner.title || 'Untitled'}" permanently deleted from Supabase database & storage!`);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete banner: ' + (err.message || String(err)), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick reorder up/down
  const handleReorder = async (banner, direction) => {
    const sorted = [...banners].sort((a, b) => (Number(a.displayOrder) || 1) - (Number(b.displayOrder) || 1));
    const idx = sorted.findIndex(b => b.id === banner.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = sorted[idx];
    sorted[idx] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    // Renumber display orders sequentially
    const reordered = sorted.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    setBanners(reordered);
    try {
      await saveCentralBannersMaster(reordered);
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Failed to update display order in database.', 'error');
      setBanners(banners);
    }
  };

  // Subcategories available for selected category
  const availableSubcategories = useMemo(() => {
    if (!drawerFormData.categoryId) return subcategories;
    return subcategories.filter(s => String(s.category_id) === String(drawerFormData.categoryId));
  }, [subcategories, drawerFormData.categoryId]);

  // Select Categories available for selected subcategory
  const availableProductTypes = useMemo(() => {
    if (!drawerFormData.subcategoryId) return productTypes;
    return productTypes.filter(pt => String(pt.subcategory_id) === String(drawerFormData.subcategoryId));
  }, [productTypes, drawerFormData.subcategoryId]);

  return (
    <div className={`space-y-6 pb-20 animate-fade-in text-gray-900 transition-transform duration-300 ease-out origin-left ${isDrawerOpen ? 'scale-[0.985] -translate-x-3 sm:-translate-x-8' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 animate-fade-in px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
          toastMessage.type === 'error'
            ? 'bg-rose-900/95 text-rose-100 border-rose-500/50 backdrop-blur-md'
            : 'bg-gray-900/95 text-white border-pink-500/50 backdrop-blur-md'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-pink-100/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#C2477A] bg-[#FFF5F8] px-2.5 py-0.5 rounded-full border border-pink-100">
              Marketing & Visual Merchandising
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Centralized Banner Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Manage all customer-facing banners from a single command center. Assign banners to Home, Categories, Subcategories, or Leaf Selections with instant real-time app reflection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadBanners}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-white border border-pink-200 text-gray-700 hover:text-[#C2477A] hover:bg-pink-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={`text-[#C2477A] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('home')}
            className="h-10 px-5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>+ Create New Banner</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100/80 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Banner Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-[#C2477A] shadow-2xs border border-pink-100 font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Banners ({banners.length})
            </button>
            {BANNER_TYPES.map(t => {
              const count = banners.filter(b => (b.bannerType || b.type) === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === t.id
                      ? 'bg-white text-[#C2477A] shadow-2xs border border-pink-100 font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{t.label.replace(' Banner', '')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    typeFilter === t.id ? 'bg-[#FFF5F8] text-[#C2477A]' : 'bg-gray-200/70 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active / Inactive filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-pink-100 bg-[#FFF5F8]/40 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2.5 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100">
          <Search size={16} className="text-[#C2477A] shrink-0" />
          <input
            type="text"
            placeholder="Search banners by title, headline, category or subcategory name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs sm:text-sm outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 p-0.5">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Banner Cards Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-pink-100 text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-[#C2477A] mx-auto" />
          <p className="text-xs font-bold text-gray-600">Loading banner records from Supabase...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-pink-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center mx-auto border border-pink-100">
            <ImageIcon size={32} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">No Banners Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No banners match your current search or filter criteria. Try resetting filters.'
                : 'No promotional or hero banners have been uploaded yet. Click "+ Create New Banner" to add your first campaign!'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAdd(typeFilter !== 'all' ? typeFilter : 'home')}
            className="px-5 py-2.5 rounded-xl bg-[#C2477A] text-white font-extrabold text-xs shadow-xs hover:bg-[#b83760] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle size={15} />
            <span>Create First Banner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanners.map((banner, index) => {
            const typeConfig = BANNER_TYPES.find(t => t.id === (banner.bannerType || banner.type)) || BANNER_TYPES[0];
            return (
              <div
                key={banner.id}
                className="bg-white rounded-3xl border border-pink-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Banner Image Preview Container */}
                <div className="relative aspect-[16/7] w-full bg-slate-100 overflow-hidden border-b border-pink-100/70">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  {/* Type Badge & Active Pill Overlays */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/75 text-white backdrop-blur-xs shadow-xs">
                      {typeConfig.label.replace(' Banner', '')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs ${
                      banner.isActive !== false
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-gray-700/90 text-gray-200'
                    }`}>
                      {banner.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Display Order Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-xl shadow-xs border border-white/80">
                    <span className="text-[10px] font-black text-gray-700">#{banner.displayOrder || index + 1}</span>
                    <div className="flex flex-col ml-1">
                      <button
                        type="button"
                        onClick={() => handleReorder(banner, 'up')}
                        title="Move Up"
                        disabled={index === 0}
                        className="text-gray-400 hover:text-[#C2477A] disabled:opacity-30 cursor-pointer p-0.5"
                      >
                        <ArrowUp size={10} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(banner, 'down')}
                        title="Move Down"
                        disabled={index === filteredBanners.length - 1}
                        className="text-gray-400 hover:text-[#C2477A] disabled:opacity-30 cursor-pointer p-0.5"
                      >
                        <ArrowDown size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Banner Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 line-clamp-1">
                      {banner.title || 'Untitled Banner'}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">
                        {banner.subtitle}
                      </p>
                    )}

                    {/* Routing Assignment Badges */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {banner.categoryName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#FFF5F8] text-[#C2477A] border border-pink-100">
                          <FolderPlus size={11} />
                          <span>{banner.categoryName}</span>
                        </span>
                      )}
                      {banner.subcategoryName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          <Layers size={11} />
                          <span>{banner.subcategoryName}</span>
                        </span>
                      )}
                      {banner.selectionName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Tag size={11} />
                          <span>{banner.selectionName}</span>
                        </span>
                      )}
                      {!banner.categoryName && !banner.subcategoryName && !banner.selectionName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                          Global / Storewide
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(banner)}
                      className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        banner.isActive !== false ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {banner.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{banner.isActive !== false ? 'Active' : 'Hidden'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(banner)}
                        className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-[#C2477A] border border-gray-200 hover:border-pink-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Edit Banner"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetBanner(banner)}
                        className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Delete Banner Permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* RIGHT-SIDE SLIDE-IN DRAWER: ADD / EDIT BANNER                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px] transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setIsDrawerOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-pink-200 animate-slide-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Drawer Header */}
            <div className="p-4 px-5 bg-gradient-to-r from-[#FFF5F8] via-[#FFF9FB] to-white border-b border-pink-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                    {editingBanner ? 'Edit Banner Record' : 'Create New Promotional Banner'}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium truncate">
                    Permanent Supabase Database and Storage Integration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                disabled={isSaving}
                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-pink-200 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Compact Form Body (No massive empty gaps) */}
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
                {/* Banner Placement Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Banner Placement Type</span>
                    <span className="text-[10px] text-gray-400 font-semibold">Location in app</span>
                  </label>
                  <select
                    value={drawerFormData.bannerType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setDrawerFormData(prev => ({ ...prev, bannerType: newType }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-gray-800 bg-[#FFF5F8]/50 outline-none cursor-pointer focus:border-[#C2477A]"
                  >
                    {BANNER_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.recommendedSize})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Banner Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Banner Title / Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. Glowing Skin Festival"
                      value={drawerFormData.title}
                      onChange={(e) => {
                        setDrawerFormData(prev => ({ ...prev, title: e.target.value }));
                        if (formErrors.title) setFormErrors(prev => ({ ...prev, title: null }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-gray-800 bg-[#FFF5F8]/40 outline-none focus:border-[#C2477A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Subtitle (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Up to 40% Off"
                      value={drawerFormData.subtitle}
                      onChange={(e) => setDrawerFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-medium text-gray-800 bg-[#FFF5F8]/40 outline-none focus:border-[#C2477A]"
                    />
                  </div>
                </div>

                {/* Category Routing Assignment Fields */}
                {(drawerFormData.bannerType === 'category' ||
                  drawerFormData.bannerType === 'subcategory' ||
                  drawerFormData.bannerType === 'selection') && (
                  <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#C2477A]">
                      <Layers size={13} />
                      <span>Category Routing Assignment</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">Main Category</label>
                      <select
                        value={drawerFormData.categoryId}
                        onChange={(e) => {
                          const catId = e.target.value;
                          const catObj = categories.find(c => String(c.id) === String(catId));
                          setDrawerFormData(prev => ({
                            ...prev,
                            categoryId: catId,
                            categoryName: catObj?.name || '',
                            subcategoryId: '',
                            subcategoryName: '',
                            selectionId: '',
                            selectionName: ''
                          }));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-bold text-gray-800 outline-none"
                      >
                        <option value="">Select Main Category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {(drawerFormData.bannerType === 'subcategory' || drawerFormData.bannerType === 'selection') && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700">Subcategory</label>
                        <select
                          value={drawerFormData.subcategoryId}
                          onChange={(e) => {
                            const subId = e.target.value;
                            const subObj = subcategories.find(s => String(s.id) === String(subId));
                            setDrawerFormData(prev => ({
                              ...prev,
                              subcategoryId: subId,
                              subcategoryName: subObj?.name || '',
                              selectionId: '',
                              selectionName: ''
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-bold text-gray-800 outline-none"
                        >
                          <option value="">Select Subcategory...</option>
                          {availableSubcategories.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact Banner Image Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-[#C2477A]" />
                      <span>Banner Image <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      JPG, PNG, WebP
                    </span>
                  </div>

                  {drawerFormData.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-pink-200 bg-[#FFF5F8] shadow-2xs group">
                      <img
                        src={drawerFormData.imageUrl}
                        alt="Banner preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/1200x510?text=Banner+Image';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDrawerFormData(prev => ({ ...prev, imageUrl: '', mobileImageUrl: '' }))}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-extrabold text-xs shadow-xs hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Remove Image</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Compact Drag, Drop & Browse Box */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const files = e.dataTransfer?.files;
                          if (files && files[0] && files[0].type.startsWith('image/')) {
                            await handleDirectImageUpload(files[0]);
                          } else {
                            const html = e.dataTransfer?.getData('text/html');
                            const match = html && html.match(/src=["'](.*?)["']/);
                            if (match && match[1]) {
                              setDrawerFormData(prev => ({ ...prev, imageUrl: match[1], mobileImageUrl: match[1] }));
                            }
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3.5 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isDragging
                            ? 'border-[#C2477A] bg-pink-100/70 scale-[0.99]'
                            : 'border-pink-200 bg-[#FFF5F8]/40 hover:bg-[#FFF5F8] hover:border-[#C2477A]'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              await handleDirectImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="w-7 h-7 rounded-lg bg-white border border-pink-100 shadow-2xs flex items-center justify-center text-[#C2477A]">
                          {isUploadingImage ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        </div>
                        <span className="font-extrabold text-xs text-gray-800">
                          {isUploadingImage ? 'Uploading to Supabase...' : 'Click to Browse Image or Drag & Drop'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Supports local files or drag from Google Images
                        </span>
                      </div>

                      {/* Direct URL input + Google Images search button */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Or paste direct image URL (https://...)"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customUrlInput.trim()) {
                                setDrawerFormData(prev => ({ ...prev, imageUrl: customUrlInput.trim(), mobileImageUrl: customUrlInput.trim() }));
                                setCustomUrlInput('');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#C2477A] bg-white font-medium"
                        />
                        {customUrlInput.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerFormData(prev => ({ ...prev, imageUrl: customUrlInput.trim(), mobileImageUrl: customUrlInput.trim() }));
                              setCustomUrlInput('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#C2477A] text-white text-xs font-bold hover:bg-[#b83760] transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const query = drawerFormData.title.trim() || drawerFormData.categoryName || 'beauty cosmetics banner';
                            window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query + ' banner')}`, '_blank', 'noopener,noreferrer');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                          title="Search on Google Images in new tab"
                        >
                          <Search size={12} />
                          <span>Google Images ↗</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {formErrors.imageUrl && (
                    <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{formErrors.imageUrl}</span>
                    </p>
                  )}
                </div>

                {/* Button CTA & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Button CTA Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Now →"
                      value={drawerFormData.ctaText}
                      onChange={(e) => setDrawerFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-gray-800 bg-[#FFF5F8]/40 outline-none focus:border-[#C2477A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Display Order</label>
                    <input
                      type="number"
                      min="1"
                      value={drawerFormData.displayOrder}
                      onChange={(e) => setDrawerFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-gray-800 bg-[#FFF5F8]/40 outline-none focus:border-[#C2477A]"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Active in Mobile & Web App</h4>
                    <p className="text-[10px] text-gray-500 font-medium">When disabled, this banner is hidden from customer view.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      drawerFormData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      drawerFormData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                {/* Action Bar Directly Below Inputs (Zero Empty Space) */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{editingBanner ? 'Save Changes' : 'Publish Banner'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* RIGHT-SIDE SLIDE-IN DRAWER: PERMANENT DELETE CONFIRMATION       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {deleteTargetBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs transition-all p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteTargetBanner(null);
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col border border-rose-200 animate-scale-up relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 px-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Delete Banner Permanently</h3>
                  <span className="text-[10px] text-gray-400 font-medium">100% Database & Storage Purge</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetBanner(null)}
                disabled={isDeleting}
                className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center cursor-pointer border border-gray-200"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-800">
                Are you sure you want to permanently delete the banner: <strong className="text-gray-900 font-black">"{deleteTargetBanner.title || 'Untitled'}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <p className="font-bold text-[11px] flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Irreversible Action</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  This banner record will be removed from Supabase database tables and its image asset will be purged from Supabase Storage. It will immediately cease appearing in customer apps.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-semibold flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                <span>Safety backup snapshot will be preserved in Supabase before deletion.</span>
              </div>
            </div>

            <div className="p-3.5 px-5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteTargetBanner(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Confirm Permanent Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}