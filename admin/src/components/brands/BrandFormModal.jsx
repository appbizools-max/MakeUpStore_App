import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Tag,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  FileText,
  AlertCircle,
  BadgePlus,
  Edit,
  Hash,
  ChevronDown,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Check
} from 'lucide-react';
import {
  generateNextBrandNumber,
  validateBrandName,
  normalizeBrandName
} from '../../utils/brandUtils';
import {
  validateImageFile,
  formatBytes
} from '../../utils/imageOptimizer';
import { uploadOptimizedImage } from '../../services/imageStorageService';

/**
 * Simplified Brand Master Form Modal (Right-Side Slide-In Drawer)
 * 
 * Strict Specification Compliance:
 * 1. Only 5 essential fields:
 *    - Brand Logo (Upload, Drag-and-Drop, Paste, Preview, Remove, Google Search)
 *    - Brand Name (Required, uniqueness validated)
  *    - Categories (Searchable multi-select with removable tags)
 *    - Brand Visibility Status (Active / Inactive)
 * 2. Completely removes Parent Brand, Brand Description, and Internal Notes.
 * 3. Position Google Image Search immediately below the logo preview with brand name displayed beside it.
 * 4. All uploads permanently stored in Supabase Storage.
 */
export default function BrandFormModal({
  isOpen,
  onClose,
  isEdit = false,
  editingBrand = null,
  existingBrands = [],
  masterCategories = [],
  onSaveBrand
}) {
  const [formData, setFormData] = useState({
    id: '',
    brandNumber: '',
    name: '',
    logo: '',
    categories: [],
    enabled: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  // Category Multi-Select Dropdown State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawerRef = useRef(null);

  // Dynamic Google Image Search Query: "{Brand Name} official brand logo PNG"
  const googleSearchQuery = useMemo(() => {
    const cleanName = (formData.name || '').trim();
    if (cleanName) {
      return `${cleanName} official brand logo PNG`;
    }
    return 'official brand logo PNG';
  }, [formData.name]);

  // Open Google Images in a new browser tab
  const handleOpenGoogleSearch = () => {
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(googleSearchQuery)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Close category dropdown on outside click
  useEffect(() => {
    if (isCategoryDropdownOpen) {
      const handleOutsideClick = (e) => {
        if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target)) {
          setIsCategoryDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isCategoryDropdownOpen]);

  // Initialize or reset form state when opened
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && editingBrand) {
      const cats = Array.isArray(editingBrand.categories)
        ? editingBrand.categories
        : (editingBrand.category ? [editingBrand.category] : []);

      setFormData({
        id: editingBrand.id || '',
        brandNumber: editingBrand.brandNumber || editingBrand.brand_number || '',
        name: editingBrand.name || '',
        logo: editingBrand.logo || '',
        categories: cats,
        enabled: editingBrand.enabled !== false
      });
      setErrors({});
      setUploadStats(null);
    } else {
      // Add Brand Mode: Auto-generate permanent Brand Number
      const nextBrandNum = generateNextBrandNumber(existingBrands);
      setFormData({
        id: '',
        brandNumber: nextBrandNum,
        name: '',
        logo: '',
        categories: [],
        enabled: true
      });
      setErrors({});
      setUploadStats(null);
    }
  }, [isOpen, isEdit, editingBrand, existingBrands]);

  // Dynamic category options from master category database
  const availableCategoryNames = useMemo(() => {
    const list = (masterCategories || []).map(c => {
      if (typeof c === 'string') return c;
      return c.name || '';
    }).filter(Boolean);

    if (list.length === 0) {
      return [
        'Skincare',
        'Makeup',
        'Hair Care',
        'Hair Styling',
        'Fragrance',
        'Bath & Body',
        "Men's Grooming",
        'Nail Care',
        'Beauty Tools',
        'Personal Care',
        'Wellness',
        'Gift Sets'
      ];
    }
    return Array.from(new Set(list));
  }, [masterCategories]);

  // Filtered categories for multi-select dropdown
  const filteredCategoryOptions = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return availableCategoryNames;
    return availableCategoryNames.filter(c => c.toLowerCase().includes(q));
  }, [availableCategoryNames, categorySearchQuery]);

  // Handle Brand Name Change
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => ({ ...prev, name: newName }));

    if (errors.name) {
      setErrors(prev => ({ ...prev, name: null }));
    }
  };

  // Process & Upload Logo to Supabase Storage
  const handleProcessLogoUpload = async (fileOrBlob) => {
    if (!fileOrBlob) return;

    // Validate file type & size (PNG, JPG, JPEG, WebP, max 10MB)
    const validation = validateImageFile(fileOrBlob, {
      maxSizeBytes: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    });

    if (!validation.valid) {
      setErrors(prev => ({ ...prev, logo: validation.error }));
      return;
    }

    setIsUploadingLogo(true);
    setErrors(prev => ({ ...prev, logo: null }));

    try {
      const result = await uploadOptimizedImage(fileOrBlob, 'BRAND_LOGO', {
        folder: 'brand-logos',
        filenamePrefix: (formData.brandNumber || formData.name || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '_')
      });

      if (result?.url) {
        setFormData(prev => ({ ...prev, logo: result.url }));
        setUploadStats({
          savings: result.stats?.savingsPercent || 0,
          size: result.stats?.optimizedSize ? formatBytes(result.stats.optimizedSize) : null
        });
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrors(prev => ({ ...prev, logo: 'Failed to upload logo: ' + (err.message || String(err)) }));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Clipboard Paste Support (Ctrl+V)
  const handlePaste = useCallback(async (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          await handleProcessLogoUpload(blob);
          return;
        }
      }
    }
  }, [formData.brandNumber, formData.name]);

  // Remove Logo Handler
  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    setUploadStats(null);
  };

  // Category Toggle Handler for Multi-Select
  const toggleCategory = (catName) => {
    setFormData(prev => {
      const exists = prev.categories.includes(catName);
      const nextCats = exists
        ? prev.categories.filter(c => c !== catName)
        : [...prev.categories, catName];
      return { ...prev, categories: nextCats };
    });
  };

  const removeCategoryBadge = (catName) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== catName)
    }));
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const newErrors = {};

    // 1. Validate Brand Name
    const nameValidation = validateBrandName(formData.name, isEdit ? formData.id : null, existingBrands);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: formData.id,
        brandNumber: formData.brandNumber,
        brand_number: formData.brandNumber,
        name: normalizeBrandName(formData.name),
        logo: formData.logo || '',
        categories: formData.categories,
        category: (formData.categories && formData.categories.length > 0) ? formData.categories[0] : '',
        enabled: formData.enabled
      };

      await onSaveBrand(payload, isEdit);
      onClose();
    } catch (err) {
      console.error('Error in brand form submit:', err);
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to save brand.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isUploadingLogo) onClose();
      }}
      onPaste={handlePaste}
    >
      <div
        ref={drawerRef}
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-pink-100 animate-slide-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 px-6 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
              {isEdit ? <Edit size={20} /> : <BadgePlus size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-gray-900 tracking-wide">
                  {isEdit ? 'Edit Brand Master' : 'Add New Brand'}
                </h3>
                {formData.brandNumber && (
                  <span className="text-[10.5px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#C2477A] border border-pink-200">
                    {formData.brandNumber}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                {isEdit ? `Updating attributes for ${formData.name || 'Brand'}` : 'Assign logo, unique code, categories, and active status'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploadingLogo}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200 hover:border-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 text-xs custom-scrollbar">
          {errors.general && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* FIELD 2: BRAND NAME                                             */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag size={13} className="text-[#C2477A]" />
                <span>Brand Name <span className="text-rose-500">*</span></span>
              </span>
              {errors.name && <span className="text-rose-500 text-[11px] font-semibold">{errors.name}</span>}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGARO, AIR WICK, LAKME, MAYBELLINE"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-4 py-2.5 rounded-xl border bg-white font-bold text-gray-900 shadow-2xs text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#C2477A]/20 ${
                errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-pink-100 focus:border-[#C2477A]'
              }`}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* FIELD 3: CATEGORIES MULTI-SELECT DROPDOWN                        */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div ref={categoryContainerRef} className="relative space-y-1.5">
            <label className="text-gray-900 font-extrabold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#C2477A]" />
                <span>Categories</span>
              </span>
              <span className="text-[10px] font-bold text-[#C2477A] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                {formData.categories.length} Selected
              </span>
            </label>

            {/* Selected Categories Removable Tag Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 rounded-xl bg-gray-50/70 border border-pink-100/70">
              {formData.categories.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic py-0.5">No categories selected yet. Click below to add.</span>
              ) : (
                formData.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-[#C2477A] border border-pink-200 shadow-2xs animate-fade-in"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => removeCategoryBadge(cat)}
                      className="text-pink-400 hover:text-rose-600 cursor-pointer ml-0.5"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-100 bg-white font-bold text-gray-700 shadow-2xs flex items-center justify-between cursor-pointer hover:border-pink-300 transition-colors"
            >
              <span className="text-xs text-gray-600">
                {formData.categories.length > 0
                  ? `Modify Categories (${formData.categories.length} selected)...`
                  : 'Select Categories from Master Catalog...'}
              </span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-[#C2477A]' : ''}`} />
            </button>

            {/* Searchable Multi-Select Floating Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-pink-100 shadow-2xl w-full p-3 space-y-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Search master categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-100 bg-gray-50/70 text-xs font-semibold outline-none focus:border-[#C2477A]"
                />
                <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
                  {filteredCategoryOptions.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-gray-400">
                      No matching categories found
                    </div>
                  ) : (
                    filteredCategoryOptions.map((cat) => {
                      const isSelected = formData.categories.includes(cat);
                      return (
                        <div
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-pink-50 text-[#C2477A]'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span>{cat}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 accent-[#C2477A] rounded cursor-pointer pointer-events-none"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            <p className="text-[10.5px] text-gray-400 font-medium">
              Mapped strictly to the Categories List page. No default category is automatically assigned.
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* FIELD 5: BRAND VISIBILITY (ACTIVE / INACTIVE)                    */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl bg-[#FFF8FA] border border-pink-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Eye size={14} className="text-[#C2477A]" />
                <span>Brand Visibility Status</span>
              </label>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                  formData.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {formData.enabled ? '● Active' : '○ Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enabled: true }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  formData.enabled
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 ${formData.enabled ? 'text-emerald-800' : 'text-gray-600'}`}>
                    <CheckCircle size={14} className={formData.enabled ? 'text-emerald-600' : 'text-gray-400'} />
                    Active
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${formData.enabled ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                    {formData.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-snug">
                  Available in product creation and visible in customer catalog.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enabled: false }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  !formData.enabled
                    ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 ${!formData.enabled ? 'text-rose-800' : 'text-gray-600'}`}>
                    <EyeOff size={14} className={!formData.enabled ? 'text-rose-600' : 'text-gray-400'} />
                    Inactive
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!formData.enabled ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                    {!formData.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-snug">
                  Hidden from product assignment. Existing catalog items preserved.
                </p>
              </button>
            </div>
          </div>

          {/* Action Bar Directly Below Inputs (Zero Empty Space) */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-pink-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingLogo}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingLogo}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEdit ? 'Submit & Update Brand' : 'Submit & Save Brand'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
