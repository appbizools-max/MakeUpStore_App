import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Tag,
  Store,
  Upload,
  Globe,
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
  Layers,
  ChevronDown,
  Trash2
} from 'lucide-react';
import BrandLogoSearchModal from './BrandLogoSearchModal';
import {
  generateNextBrandNumber,
  generateProposedBrandCode,
  validateBrandCode,
  validateBrandName,
  normalizeBrandName
} from '../../utils/brandUtils';
import {
  optimizeImage,
  validateImageFile,
  formatBytes
} from '../../utils/imageOptimizer';

/**
 * BrandFormModal Component
 * 
 * Implements the approved Add / Edit Brand Form with exact 8-field layout:
 * - Field 1: Brand Number (Auto-generated, Read-Only, e.g. BR001)
 * - Field 2: Brand Logo (Local device, drag-drop, online search, URL paste, preview, remove)
 * - Field 3: Brand Name (Required, trimmed, case-insensitive uniqueness validation)
 * - Field 4: Brand Code (Proposed auto-code e.g. AGA-001, editable, uniqueness validated)
 * - Field 5: Categories (Searchable multi-select, badges display, removable)
 * - Field 6: Brand Description (Optional)
 * - Field 7: Visibility (Active / Inactive)
 * - Field 8: Internal Notes (Optional)
 * - Action Buttons: Save Brand, Save and Add Another, Cancel
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
    brandCode: '',
    logo: '',
    categories: [],
    description: '',
    enabled: true,
    internalNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [isOnlineSearchOpen, setIsOnlineSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoInputTab, setLogoInputTab] = useState('upload'); // 'upload' | 'url'
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false);
  const [logoOptimizationStats, setLogoOptimizationStats] = useState(null);
  const fileInputRef = useRef(null);
  const categoryContainerRef = useRef(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
        brandCode: editingBrand.brandCode || editingBrand.brand_code || '',
        logo: editingBrand.logo || '',
        categories: cats,
        description: editingBrand.description || '',
        enabled: editingBrand.enabled !== false,
        internalNotes: editingBrand.internalNotes || editingBrand.internal_notes || ''
      });
      setErrors({});
    } else {
      // Add Brand Mode: Auto-generate permanent Brand Number
      const nextBrandNum = generateNextBrandNumber(existingBrands);
      setFormData({
        id: '',
        brandNumber: nextBrandNum,
        name: '',
        brandCode: '',
        logo: '',
        categories: [],
        description: '',
        enabled: true,
        internalNotes: ''
      });
      setErrors({});
    }
  }, [isOpen, isEdit, editingBrand, existingBrands]);

  // Dynamic category options from master category database
  const availableCategoryNames = useMemo(() => {
    const list = (masterCategories || []).map(c => {
      if (typeof c === 'string') return c;
      return c.name || '';
    }).filter(Boolean);

    // If master categories are completely empty, supply baseline cosmetic category master
    if (list.length === 0) {
      return [
        'Beauty Tools & Devices',
        'Home & Personal Hygiene',
        'Beauty Accessories',
        'Fragrances',
        'Makeup',
        'Skin Care',
        'Hair Care',
        'Lips & Eyes',
        'Nails',
        'Premium'
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

  // Handle Brand Name Change & Auto-propose Brand Code (Only for new brands or empty code)
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name: newName };

      // In Add mode, auto-derive proposed code dynamically if user hasn't typed a custom code
      if (!isEdit && (!prev.brandCode || prev.brandCode === generateProposedBrandCode(prev.name, existingBrands, prev.brandNumber))) {
        updated.brandCode = generateProposedBrandCode(newName, existingBrands, prev.brandNumber);
      }
      return updated;
    });

    if (errors.name) {
      setErrors(prev => ({ ...prev, name: null }));
    }
  };

  // Centralized logo optimization handler (Preserves alpha transparency, resizes to 512x512, converts to WebP)
  const processAndSetLogo = async (source) => {
    if (!source) return;
    setIsOptimizingLogo(true);
    setErrors(prev => ({ ...prev, logo: null }));
    try {
      const opt = await optimizeImage(source, 'BRAND_LOGO', {
        filename: `${formData.brandCode || 'brand'}_logo.webp`
      });

      setFormData(prev => ({ ...prev, logo: opt.dataUrl }));
      setLogoOptimizationStats({
        originalFormatted: formatBytes(opt.originalSize),
        optimizedFormatted: formatBytes(opt.optimizedSize),
        savingsPercent: opt.savedPercent,
        hasTransparency: opt.hasTransparency,
        width: opt.width,
        height: opt.height
      });
    } catch (err) {
      console.warn('Image optimization notice:', err);
      if (typeof source === 'string') {
        setFormData(prev => ({ ...prev, logo: source }));
      }
    } finally {
      setIsOptimizingLogo(false);
    }
  };

  // Local file upload handler
  const handleLogoFile = async (file) => {
    if (!file) return;

    const validation = validateImageFile(file, { maxSizeBytes: 10 * 1024 * 1024 });
    if (!validation.valid) {
      setErrors(prev => ({
        ...prev,
        logo: validation.error
      }));
      return;
    }

    await processAndSetLogo(file);
  };

  // Category toggle for multi-select
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

  // Form submission and validation
  const handleSubmit = async (e, addAnother = false) => {
    if (e) e.preventDefault();

    const newErrors = {};

    // 1. Validate Brand Name
    const nameValidation = validateBrandName(formData.name, isEdit ? formData.id : null, existingBrands);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    // 2. Validate Brand Code
    const codeValidation = validateBrandCode(formData.brandCode, isEdit ? formData.id : null, existingBrands);
    if (!codeValidation.valid) {
      newErrors.brandCode = codeValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      name: normalizeBrandName(formData.name),
      brandCode: formData.brandCode.trim().toUpperCase(),
      categories: formData.categories
    };

    await onSaveBrand(payload, isEdit);

    if (addAnother && !isEdit) {
      // Clear form and advance Brand Number for next brand
      const nextNum = generateNextBrandNumber([...existingBrands, payload]);
      setFormData({
        id: '',
        brandNumber: nextNum,
        name: '',
        brandCode: '',
        logo: '',
        categories: [],
        description: '',
        enabled: true,
        internalNotes: ''
      });
      setErrors({});
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
              {isEdit ? <Edit size={20} /> : <BadgePlus size={22} />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                {isEdit ? 'Edit Brand Master Record' : 'Add New Partner Brand'}
              </h3>
              <span className="text-[11px] text-gray-400 font-medium block">
                {isEdit ? `Modifying Brand ${formData.brandNumber}` : 'Assign permanent brand identifier and attributes'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          {/* FIELD 1: Brand Number (Read-only permanent identifier) */}
          <div>
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash size={13} className="text-[#C2477A]" />
                <span>Brand Number</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Permanent Identifier · Read-Only
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={formData.brandNumber}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-100 bg-pink-50/40 text-[#C2477A] font-extrabold tracking-wider text-xs shadow-2xs cursor-not-allowed outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Assigned automatically by the system. Immutable and never reused.
            </p>
          </div>

          {/* FIELD 2: Brand Logo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-800 font-bold flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#C2477A]" />
                <span>Brand Logo</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOnlineSearchOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#C2477A] text-[10px] font-bold border border-pink-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Globe size={11} />
                  <span>Search Online</span>
                </button>
              </div>
            </div>

            {/* Logo Preview & Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingLogo(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLogoFile(e.dataTransfer.files[0]);
                }
              }}
              className={`p-3.5 rounded-2xl border-2 border-dashed transition-all flex items-center gap-4 ${
                isDraggingLogo
                  ? 'border-[#C2477A] bg-pink-50/70'
                  : 'border-pink-100 bg-[#FFFDFE]'
              }`}
            >
              {/* Thumbnail Display */}
              <div className="w-16 h-16 rounded-xl bg-white border border-pink-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs p-1">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Brand Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100x100?text=No+Logo';
                    }}
                  />
                ) : (
                  <Store size={24} className="text-gray-300" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-pink-200 hover:border-[#C2477A] text-gray-700 hover:text-[#C2477A] font-bold text-[11px] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={12} />
                    <span>{formData.logo ? 'Replace Logo' : 'Upload File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogoInputTab(logoInputTab === 'url' ? 'upload' : 'url')}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    {logoInputTab === 'url' ? 'Hide URL' : 'Paste URL'}
                  </button>

                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition-colors cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {logoInputTab === 'url' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logo}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value.trim() }))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-pink-100 bg-white text-xs outline-none focus:border-[#C2477A]"
                    />
                    <button
                      type="button"
                      onClick={() => processAndSetLogo(formData.logo)}
                      disabled={isOptimizingLogo || !formData.logo}
                      className="px-2.5 py-1.5 rounded-lg bg-[#C2477A] text-white font-bold text-[11px] hover:bg-[#b83760] transition-colors cursor-pointer shrink-0"
                    >
                      Optimize
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-gray-400">
                  PNG, JPG, JPEG, WebP. Automatically optimized to 512×512 HD WebP with transparency preserved.
                </p>
              </div>
            </div>

            {/* Real-time Image Optimization Status Badge */}
            {isOptimizingLogo && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-pink-50 border border-pink-200 text-[#C2477A] text-[11px] font-semibold flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#C2477A] border-t-transparent rounded-full animate-spin" />
                <span>Automatically optimizing logo & preserving transparency...</span>
              </div>
            )}

            {logoOptimizationStats && !isOptimizingLogo && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center justify-between gap-2 shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-600 shrink-0" />
                  <span>
                    HD WebP Optimized: <strong>{logoOptimizationStats.originalFormatted}</strong> → <strong>{logoOptimizationStats.optimizedFormatted}</strong> ({logoOptimizationStats.savingsPercent}% saved)
                  </span>
                </span>
                {logoOptimizationStats.hasTransparency && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase shrink-0">
                    Alpha Transparency Active
                  </span>
                )}
              </div>
            )}
            {errors.logo && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.logo}</span>
              </p>
            )}
          </div>

          {/* FIELD 3: Brand Name */}
          <div>
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
              <Tag size={13} className="text-[#C2477A]" />
              <span>Brand Name</span>
              <span className="text-[#C2477A] font-extrabold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGARO, AIR WICK, LAKME"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-semibold text-gray-900 shadow-2xs text-xs outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#C2477A]/20 ${
                errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-pink-100 focus:border-[#C2477A]'
              }`}
            />
            {errors.name && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* FIELD 4: Brand Code */}
          <div>
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={13} className="text-[#C2477A]" />
                <span>Brand Code</span>
                <span className="text-[#C2477A] font-extrabold">*</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">
                Format: 3-Letter Mnemonic + Hyphen + 3-Digit Seq (e.g. AGA-001)
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGA-001"
              value={formData.brandCode}
              onChange={(e) => {
                setFormData({ ...formData, brandCode: e.target.value.toUpperCase() });
                if (errors.brandCode) setErrors({ ...errors, brandCode: null });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono font-bold text-gray-900 shadow-2xs text-xs outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#C2477A]/20 ${
                errors.brandCode ? 'border-rose-300 focus:border-rose-500' : 'border-pink-100 focus:border-[#C2477A]'
              }`}
            />
            {errors.brandCode && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.brandCode}</span>
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
              Preserved across name edits. Sourced directly from approved Brand Master.
            </p>
          </div>

          {/* FIELD 5: Categories (Searchable Multi-Select Badges) */}
          <div ref={categoryContainerRef} className="relative">
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#C2477A]" />
                <span>Categories</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">
                Multiple Categories Allowed
              </span>
            </label>

            {/* Selected Categories Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.categories.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic">No categories assigned yet</span>
              ) : (
                formData.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF0F4] text-[#C2477A] border border-pink-200 shadow-2xs animate-fade-in"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => removeCategoryBadge(cat)}
                      className="text-pink-400 hover:text-[#C2477A] cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-100 bg-white font-semibold text-gray-700 shadow-2xs flex items-center justify-between cursor-pointer hover:border-pink-300 transition-colors"
            >
              <span className="text-xs text-gray-600">
                {formData.categories.length > 0
                  ? `${formData.categories.length} category selected (Click to add/modify)`
                  : 'Select categories from master...'}
              </span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-[#C2477A]' : ''}`} />
            </button>

            {/* Multi-Select Floating Dropdown */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-pink-100 shadow-xl w-full p-2.5 space-y-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Filter category master..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-pink-100 bg-gray-50/60 text-xs font-medium outline-none focus:border-[#C2477A]"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
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
                          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-pink-50 text-[#C2477A] font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span>{cat}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-3.5 h-3.5 accent-[#C2477A] rounded cursor-pointer pointer-events-none"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FIELD 6: Brand Description */}
          <div>
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-[#C2477A]" />
              <span>Brand Description</span>
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the brand's heritage, specialty, or cosmetic line..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl border border-pink-100 bg-white font-medium text-gray-900 shadow-2xs text-xs outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* FIELD 7: Visibility (Active / Inactive) */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8FA] border border-pink-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5">
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

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enabled: true }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  formData.enabled
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 ${formData.enabled ? 'text-emerald-800' : 'text-gray-600'}`}>
                    <CheckCircle size={13} className={formData.enabled ? 'text-emerald-600' : 'text-gray-400'} />
                    Active
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${formData.enabled ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                    {formData.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                  Active in product creation and visible in catalog.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enabled: false }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  !formData.enabled
                    ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 ${!formData.enabled ? 'text-rose-800' : 'text-gray-600'}`}>
                    <EyeOff size={13} className={!formData.enabled ? 'text-rose-600' : 'text-gray-400'} />
                    Inactive
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!formData.enabled ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                    {!formData.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                  Excluded from new product creation. Existing products preserved.
                </p>
              </button>
            </div>
          </div>

          {/* FIELD 8: Internal Notes */}
          <div>
            <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-[#C2477A]" />
              <span>Internal Notes</span>
              <span className="text-gray-400 font-normal">(Authorized Admins Only)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Official distributor contact, contract ref, minimum order requirements..."
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-100 bg-white font-medium text-gray-900 shadow-2xs text-xs outline-none focus:border-[#C2477A]"
            />
          </div>
        </form>

        {/* Modal Footer Buttons */}
        <div className="p-4 border-t border-pink-100 bg-gray-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#C2477A] text-[#C2477A] hover:bg-pink-50 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                Save & Add Another
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle size={15} />
              <span>{isEdit ? 'Update Brand' : 'Save Brand'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Online Image Search Sub-Modal */}
      {isOnlineSearchOpen && (
        <BrandLogoSearchModal
          isOpen={isOnlineSearchOpen}
          initialQuery={formData.name}
          onClose={() => setIsOnlineSearchOpen(false)}
          onSelectLogo={async (logoUrl) => {
            await processAndSetLogo(logoUrl);
          }}
        />
      )}
    </div>
  );
}
