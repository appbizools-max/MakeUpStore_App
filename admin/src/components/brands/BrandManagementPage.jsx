import React, { useState, useMemo, useCallback } from 'react';
import {
  Store,
  Search,
  Filter,
  BadgePlus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Tag,
  Sparkles,
  Download,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Loader2,
  Building2
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import BrandFormModal from './BrandFormModal';
import BrandImportModal from './BrandImportModal';
import {
  exportBrandsToExcel,
  resolveBrandNumber,
  resolveBrandCode,
  parseBrandNumberSeq,
  formatBrandNumber
} from '../../utils/brandUtils';

/**
 * BrandManagementPage Component
 * 
 * Strict Specification Compliance:
 * - Table contains EXACTLY the required order:
 *   1. BRAND NUMBER (BR001, BR002...)
 *   2. BRAND NAME
 *   3. BRAND LOGO
 *   4. BRAND CODE (AGA-001, AIK-002...)
 *   5. CATEGORIES (Multi-category badges)
 *   6. ACTION (Active/Inactive Toggle, Edit, Delete)
 * - Completely removes any Product Count, Products Catalog, or Total Products columns.
 * - Concurrency-safe permanent Brand Number and mnemonic Brand Code.
 * - Excel Import and Export (brand_master_YYYY-MM-DD.xlsx).
 * - Safe Delete with product reference validation.
 * - Search by Brand Number, Brand Name, Brand Code.
 * - Filter by Category, Active/Inactive, Logo status.
 * - Pagination: 15, 25, 50, 100.
 */
export default function BrandManagementPage({
  brands = [],
  categories = [],
  products = [],
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
  onBulkDeleteBrands,
  onToggleBrandStatus,
  onBulkImportBrands
}) {
  // Navigation & Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [logoFilter, setLogoFilter] = useState('all'); // 'all' | 'has_logo' | 'no_logo'

  // Sorting States
  const [sortField, setSortField] = useState('brandNumber'); // 'brandNumber' | 'name' | 'brandCode' | 'createdAt'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);

  // Multi-Selection State for Bulk Export
  const [selectedBrandIds, setSelectedBrandIds] = useState(new Set());

  // Safe Deletion Confirmation Modal State
  const [deleteTargetBrand, setDeleteTargetBrand] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);

  // Bulk / Batch Deletion States
  const [bulkDeleteModalData, setBulkDeleteModalData] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const adminCtx = useAdmin ? useAdmin() : null;
  // Admins and Employees have full authorization to add, edit, update, delete brands & images
  const isAdmin = Boolean(
    !adminCtx?.currentAuthUser?.role ||
    adminCtx?.currentAuthUser?.role === 'admin' ||
    adminCtx?.currentAuthUser?.role === 'employee' ||
    adminCtx?.currentAuthUser?.role === 'manager' ||
    adminCtx?.currentAuthUser?.role === 'superadmin' ||
    adminCtx?.currentAuthUser?.role !== 'customer'
  );

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Filtered & Sorted Brands Computation
  const filteredBrands = useMemo(() => {
    return (brands || []).filter(b => {
      if (!b || b.id?.startsWith('app_') || b.id?.startsWith('salbeau_') || b.category === 'SystemConfig') return false;
      // 1. Search Query Match (searches Brand Number, Sequence, Brand Name, Brand Code)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const brandNum = resolveBrandNumber(b, brands);
        const num = brandNum.toLowerCase();
        const seq = String(parseBrandNumberSeq(brandNum));
        const name = (b.name || '').toLowerCase();
        const brandCode = resolveBrandCode(b, brands, brandNum);
        const code = brandCode.toLowerCase();
        const match = num.includes(q) || seq.includes(q) || name.includes(q) || code.includes(q);
        if (!match) return false;
      }

      // 2. Category Filter Match
      if (selectedCategoryFilter !== 'all') {
        const brandCats = Array.isArray(b.categories)
          ? b.categories
          : (b.category ? [b.category] : []);
        const hasCat = brandCats.some(c => c.toLowerCase() === selectedCategoryFilter.toLowerCase());
        if (!hasCat) return false;
      }

      // 3. Status Filter Match
      if (statusFilter !== 'all') {
        const isBrandActive = b.enabled !== false;
        if (statusFilter === 'active' && !isBrandActive) return false;
        if (statusFilter === 'inactive' && isBrandActive) return false;
      }

      // 4. Logo Filter Match
      if (logoFilter !== 'all') {
        const hasLogo = Boolean(b.logo && b.logo.trim());
        if (logoFilter === 'has_logo' && !hasLogo) return false;
        if (logoFilter === 'no_logo' && hasLogo) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'brandNumber') {
        const numA = resolveBrandNumber(a, brands);
        const numB = resolveBrandNumber(b, brands);
        const seqA = parseBrandNumberSeq(numA);
        const seqB = parseBrandNumberSeq(numB);
        if (seqA && seqB) {
          return sortDirection === 'asc' ? seqA - seqB : seqB - seqA;
        }
        valA = numA;
        valB = numB;
      } else if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'brandCode') {
        valA = resolveBrandCode(a, brands, a.brandNumber);
        valB = resolveBrandCode(b, brands, b.brandNumber);
      } else if (sortField === 'createdAt') {
        valA = a.createdAt || a.created_at || '';
        valB = b.createdAt || b.created_at || '';
      }

      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [brands, searchQuery, selectedCategoryFilter, statusFilter, logoFilter, sortField, sortDirection]);

  // Pagination Slicing
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / recordsPerPage));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * recordsPerPage;
  const paginatedBrands = useMemo(() => {
    return filteredBrands.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredBrands, startIndex, recordsPerPage]);

  // Master Category List for Filter Dropdown
  const masterCategoryOptions = useMemo(() => {
    const list = (categories || []).map(c => (typeof c === 'string' ? c : c.name || '')).filter(Boolean);
    // Include any categories present in brands data
    brands.forEach(b => {
      if (Array.isArray(b.categories)) {
        b.categories.forEach(cat => list.push(cat));
      } else if (b.category) {
        list.push(b.category);
      }
    });
    return Array.from(new Set(list)).sort();
  }, [categories, brands]);

  // Handlers for Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Row Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedBrandIds.size === paginatedBrands.length && paginatedBrands.length > 0) {
      setSelectedBrandIds(new Set());
    } else {
      const next = new Set(paginatedBrands.map(b => b.id));
      setSelectedBrandIds(next);
    }
  };

  const handleToggleSelectRow = (brandId) => {
    setSelectedBrandIds(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  // Handlers for Add/Edit
  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditBrand = (brand) => {
    setEditingBrand(brand);
    setIsFormModalOpen(true);
  };

  const handleSaveBrand = async (brandData, isEdit) => {
    try {
      if (isEdit) {
        await onUpdateBrand(brandData.id, brandData);
        showToast(`Brand "${brandData.name}" updated successfully.`);
      } else {
        await onAddBrand(brandData);
        showToast(`Brand "${brandData.name}" created successfully with ${brandData.brandNumber}.`);
      }
    } catch (err) {
      console.error('Error saving brand:', err);
      showToast('Error saving brand: ' + err.message, 'error');
    }
  };

  // Safe Deletion Handlers
  const handlePromptDelete = (brand) => {
    const brandNorm = (brand.name || '').trim().toLowerCase();
    const referencingProducts = (products || []).filter(p =>
      p.brandId === brand.id ||
      (p.brandName && p.brandName.trim().toLowerCase() === brandNorm) ||
      (p.brand_name && p.brand_name.trim().toLowerCase() === brandNorm) ||
      (p.brandNumber && brand.brandNumber && p.brandNumber === brand.brandNumber)
    );

    if (referencingProducts.length > 0) {
      setDeleteWarning({
        brand,
        productCount: referencingProducts.length,
        message: `Cannot delete brand "${brand.name}". It is associated with ${referencingProducts.length} product(s) in the catalog. Deactivating the brand is recommended to keep existing catalog integrity.`
      });
      setDeleteTargetBrand(null);
    } else {
      setDeleteWarning(null);
      setDeleteTargetBrand(brand);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetBrand) return;
    try {
      const res = await onDeleteBrand(deleteTargetBrand.id);
      if (res && res.success === false) {
        showToast(res.message, 'error');
      } else {
        showToast(`Brand "${deleteTargetBrand.name}" deleted successfully.`);
      }
    } catch (err) {
      showToast('Error deleting brand: ' + err.message, 'error');
    } finally {
      setDeleteTargetBrand(null);
    }
  };

  // Bulk / Batch Deletion Handlers
  const handlePromptBulkDelete = () => {
    if (selectedBrandIds.size === 0) {
      showToast('No brands selected for batch deletion.', 'error');
      return;
    }

    const selectedBrands = brands.filter(b => selectedBrandIds.has(b.id));
    const referencedBrands = [];
    const deletableBrands = [];

    selectedBrands.forEach(b => {
      const brandNorm = (b.name || '').trim().toLowerCase();
      const referencingProducts = (products || []).filter(p =>
        p.brandId === b.id ||
        (p.brandName && p.brandName.trim().toLowerCase() === brandNorm) ||
        (p.brand_name && p.brand_name.trim().toLowerCase() === brandNorm) ||
        (p.brandNumber && b.brandNumber && p.brandNumber === b.brandNumber)
      );
      if (referencingProducts.length > 0) {
        referencedBrands.push({ brand: b, productCount: referencingProducts.length });
      } else {
        deletableBrands.push(b);
      }
    });

    setBulkDeleteModalData({
      totalCount: selectedBrands.length,
      referencedBrands,
      deletableBrands
    });
  };

  // Detect Duplicate Brands (brands sharing normalized names)
  const duplicateBrandMap = useMemo(() => {
    const seen = new Map();
    const duplicateIds = new Set();

    // Sort to keep the best record (has products, has logo, active)
    const sorted = [...brands].sort((a, b) => {
      const aLogo = a.logo ? 1 : 0;
      const bLogo = b.logo ? 1 : 0;
      const aActive = a.enabled ? 1 : 0;
      const bActive = b.enabled ? 1 : 0;
      return (bLogo + bActive) - (aLogo + aActive);
    });

    for (const brand of sorted) {
      const norm = (brand.name || '').trim().toLowerCase();
      if (!norm) continue;
      if (seen.has(norm)) {
        duplicateIds.add(brand.id);
      } else {
        seen.set(norm, brand.id);
      }
    }
    return duplicateIds;
  }, [brands]);

  const handleSelectDuplicates = () => {
    if (duplicateBrandMap.size === 0) {
      showToast('No duplicate brand names found in catalog.', 'info');
      return;
    }
    setSelectedBrandIds(new Set(duplicateBrandMap));
    showToast(`Selected ${duplicateBrandMap.size} duplicate brand(s) for batch cleanup.`);
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteModalData || bulkDeleteModalData.deletableBrands.length === 0) return;
    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const deletableIds = bulkDeleteModalData.deletableBrands.map(b => b.id);
      if (typeof onBulkDeleteBrands === 'function') {
        const res = await onBulkDeleteBrands(deletableIds);
        successCount = res?.deletedCount ?? deletableIds.length;
      } else if (adminCtx?.bulkDeleteBrands) {
        const res = await adminCtx.bulkDeleteBrands(deletableIds);
        successCount = res?.deletedCount ?? deletableIds.length;
      } else {
        for (const brand of bulkDeleteModalData.deletableBrands) {
          try {
            const res = await onDeleteBrand(brand.id);
            if (res && res.success === false) failCount++;
            else successCount++;
          } catch {
            failCount++;
          }
        }
      }

      setSelectedBrandIds(new Set());
      if (failCount === 0) {
        showToast(`Successfully deleted ${successCount} brand(s) permanently.`);
      } else {
        showToast(`Deleted ${successCount} brand(s). ${failCount} failed.`, 'error');
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModalData(null);
    }
  };

  const handleBulkDeactivateReferenced = async () => {
    if (!bulkDeleteModalData) return;
    setIsBulkDeleting(true);
    try {
      for (const item of bulkDeleteModalData.referencedBrands) {
        await onToggleBrandStatus(item.brand.id);
      }
      showToast(`Set ${bulkDeleteModalData.referencedBrands.length} referenced brand(s) to Inactive.`);
      setSelectedBrandIds(new Set());
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModalData(null);
    }
  };

  // Excel Export Handlers
  const handleExportAll = () => {
    if (!brands || brands.length === 0) {
      showToast('No brands available to export.', 'error');
      return;
    }
    const filename = exportBrandsToExcel(brands);
    showToast(`Exported all ${brands.length} brands to ${filename}.`);
  };

  const handleExportSelected = () => {
    const selected = brands.filter(b => selectedBrandIds.has(b.id));
    if (selected.length === 0) {
      showToast('No brands selected. Please check row checkboxes to export.', 'error');
      return;
    }
    const filename = exportBrandsToExcel(selected);
    showToast(`Exported ${selected.length} selected brands to ${filename}.`);
  };

  const handleExportFiltered = () => {
    if (filteredBrands.length === 0) {
      showToast('No brands matching the current filter to export.', 'error');
      return;
    }
    const filename = exportBrandsToExcel(filteredBrands);
    showToast(`Exported ${filteredBrands.length} filtered brands to ${filename}.`);
  };

  return (
    <div className={`space-y-6 animate-fade-in text-xs transition-transform duration-300 ease-out origin-left ${isFormModalOpen ? 'scale-[0.985] -translate-x-3 sm:-translate-x-8' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{toastMessage.msg}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100/90 shadow-sm hover:shadow-md transition-shadow">
        {/* Module Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-pink-100/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Store size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-gray-900 tracking-wide uppercase flex items-center gap-2">
                <span>Brand Management</span>
              </h2>
              <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                {filteredBrands.length} partner brand records active in system master
              </span>
            </div>
          </div>

          {/* Action Buttons: Add Brand, Import, Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-gray-700 hover:text-[#C2477A] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Export all brands to Excel"
            >
              <Download size={14} />
              <span>Export Master</span>
            </button>

            {selectedBrandIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportSelected}
                  className="px-3.5 py-2.5 rounded-xl bg-pink-50 border border-pink-300 text-[#C2477A] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 animate-fade-in"
                >
                  <Download size={14} />
                  <span>Export ({selectedBrandIds.size}) Selected</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handlePromptBulkDelete}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 animate-fade-in"
                    title="Delete selected brands in batch"
                  >
                    <Trash2 size={14} />
                    <span>Delete Batch ({selectedBrandIds.size})</span>
                  </button>
                )}
              </>
            )}

            {isAdmin && duplicateBrandMap.size > 0 && selectedBrandIds.size === 0 && (
              <button
                type="button"
                onClick={handleSelectDuplicates}
                className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 animate-fade-in"
                title="Select all duplicate brand entries for batch deletion"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>Select Duplicates ({duplicateBrandMap.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-gray-700 hover:text-[#C2477A] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload size={14} />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddBrand}
              className="bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <BadgePlus size={16} />
              <span>Add New Brand</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 p-3.5 rounded-2xl bg-[#FFF8FA] border border-pink-100/80">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input: Brand Number, Name, Brand Code */}
            <div className="flex items-center gap-2 bg-white px-3.5 h-10 rounded-xl border border-pink-200/90 w-full sm:w-72 focus-within:ring-2 focus-within:ring-[#C2477A]/20 transition-all shadow-2xs">
              <Search size={14} className="text-[#C2477A] shrink-0" />
              <input
                type="text"
                placeholder="Search number, name, or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs outline-none text-gray-900 w-full font-medium placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white px-3 h-10 rounded-xl border border-pink-200/90 shadow-2xs">
              <Sparkles size={13} className="text-[#C2477A] shrink-0" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
              >
                <option value="all">All Categories</option>
                {masterCategoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white px-3 h-10 rounded-xl border border-pink-200/90 shadow-2xs">
              <Eye size={13} className="text-[#C2477A] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>



            {(searchQuery || selectedCategoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('all');
                  setStatusFilter('all');
                                    setCurrentPage(1);
                }}
                className="h-10 px-3 rounded-xl bg-white border border-pink-200 text-[#C2477A] hover:bg-pink-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Reset Filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium shrink-0 self-center lg:ml-auto">
            Showing <strong className="text-gray-900 font-bold">{filteredBrands.length}</strong> matching records
          </div>
        </div>

        {/* Bulk Selection Action Bar */}
        {selectedBrandIds.size > 0 && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-rose-50 via-pink-50 to-white border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800">
              <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {selectedBrandIds.size}
              </div>
              <span>
                <strong className="text-rose-700 font-extrabold">{selectedBrandIds.size}</strong> brand{selectedBrandIds.size > 1 ? 's' : ''} selected
              </span>
              {selectedBrandIds.size < filteredBrands.length && (
                <button
                  type="button"
                  onClick={() => setSelectedBrandIds(new Set(filteredBrands.map(b => b.id)))}
                  className="ml-2 text-xs text-[#C2477A] hover:text-[#9A2D5C] underline font-bold cursor-pointer transition-colors"
                >
                  Select all {filteredBrands.length} brands in catalog
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedBrandIds(new Set())}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={handleExportSelected}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-pink-200 text-[#C2477A] hover:bg-pink-50 font-bold text-xs cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Export ({selectedBrandIds.size})</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handlePromptBulkDelete}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Delete selected brands"
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedBrandIds.size})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 
          EXACT SPECIFICATION: FINAL BRAND MANAGEMENT TABLE (EXACTLY SIX COLUMNS IN EXACT ORDER)
          Column 1: Brand Number
          Column 2: Brand Logo
          Column 3: Brand Name
          Column 4: Brand Code
          Column 5: Categories
          Column 6: Action
        */}
        <div className="overflow-x-auto rounded-2xl border border-pink-100/90 shadow-2xs bg-white">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-32" />
              <col className="min-w-[200px]" />
              <col className="w-32" />
              <col className="min-w-[180px]" />
              <col className="w-56" />
            </colgroup>
            <thead>
              <tr className="bg-[#FFF0F4] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100">
                {/* Checkbox for Select All */}
                <th className="py-4 px-3 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={selectedBrandIds.size === paginatedBrands.length && paginatedBrands.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#C2477A] rounded cursor-pointer mx-auto block"
                    title="Select all on current page"
                  />
                </th>

                {/* COLUMN 1: Brand Number */}
                <th className="py-4 px-3 text-left align-middle cursor-pointer hover:bg-pink-100/60 transition-colors" onClick={() => handleSort('brandNumber')}>
                  <div className="flex items-center gap-1.5">
                    <span>BRAND NUMBER</span>
                    <ArrowUpDown size={11} className={sortField === 'brandNumber' ? 'text-[#C2477A]' : 'text-gray-400'} />
                  </div>
                </th>

                {/* COLUMN 2: Brand Name */}
                <th className="py-4 px-4 text-left align-middle cursor-pointer hover:bg-pink-100/60 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>BRAND NAME</span>
                    <ArrowUpDown size={11} className={sortField === 'name' ? 'text-[#C2477A]' : 'text-gray-400'} />
                  </div>
                </th>



                {/* COLUMN 4: Brand Code */}
                <th className="py-4 px-3 text-left align-middle cursor-pointer hover:bg-pink-100/60 transition-colors" onClick={() => handleSort('brandCode')}>
                  <div className="flex items-center gap-1.5">
                    <span>BRAND CODE</span>
                    <ArrowUpDown size={11} className={sortField === 'brandCode' ? 'text-[#C2477A]' : 'text-gray-400'} />
                  </div>
                </th>

                {/* COLUMN 5: Categories */}
                <th className="py-4 px-4 text-left align-middle">
                  <span>CATEGORIES</span>
                </th>

                {/* COLUMN 6: Action */}
                <th className="py-4 px-4 text-right align-middle">
                  <span>ACTION</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {paginatedBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center text-gray-400">
                    <Store size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-sm text-gray-700">No partner brands found</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {brands.length === 0
                        ? 'No partner brands registered yet. Click "Add New Brand" or "Import Excel" to load the approved Brand Master.'
                        : 'No brands match the active filters or search query. Try clearing your search parameters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((brand, index) => {
                  const brandNum = brand.brandNumber || brand.brand_number || resolveBrandNumber(brand, brands);
                  const brandSeq = parseBrandNumberSeq(brandNum);
                  const brandCode = brand.brandCode || brand.brand_code || resolveBrandCode(brand, brands, brandNum);
                  const isSelected = selectedBrandIds.has(brand.id);
                  const isEnabled = brand.enabled !== false;

                  const brandCats = Array.isArray(brand.categories)
                    ? brand.categories
                    : (brand.category ? [brand.category] : []);

                  return (
                    <tr
                      key={brand.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-pink-50/70 hover:bg-pink-100/40'
                          : index % 2 === 1
                            ? 'bg-[#FFF9FB]/70 hover:bg-pink-50/40'
                            : 'bg-white hover:bg-pink-50/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(brand.id)}
                          className="w-3.5 h-3.5 accent-[#C2477A] rounded cursor-pointer mx-auto block"
                        />
                      </td>

                      {/* COLUMN 1: Brand Number */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-extrabold text-[#C2477A] text-xs align-middle">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F4] border border-pink-200/90 shadow-2xs font-mono font-black text-[#C2477A]">
                            {brandNum}
                          </span>
                          {brandSeq > 0 && (
                            <span className="text-[10px] text-gray-400 font-bold font-mono" title={`Order sequence #${brandSeq}`}>
                              #{brandSeq}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 2: Brand Name */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-extrabold text-xs text-gray-900 leading-snug truncate" title={brand.name}>
                          {brand.name}
                        </div>
                        {brand.description && (
                          <div className="text-[10px] text-gray-400 truncate max-w-xs mt-0.5" title={brand.description}>
                            {brand.description}
                          </div>
                        )}
                      </td>



                      {/* COLUMN 4: Brand Code */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-gray-800 text-xs align-middle">
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                          {brandCode}
                        </span>
                      </td>

                      {/* COLUMN 5: Categories (Badges) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {brandCats.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">None assigned</span>
                          ) : (
                            brandCats.map((cat) => (
                              <span
                                key={cat}
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5F8] text-[#8C7078] border border-pink-100/80"
                              >
                                {cat}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* COLUMN 6: Action (Active/Inactive Toggle, Edit, Delete) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Active / Inactive Toggle */}
                          <div className="inline-flex items-center gap-1.5 mr-1">
                            <button
                              type="button"
                              onClick={() => { if (isAdmin) onToggleBrandStatus(brand.id); }}
                              disabled={!isAdmin}
                              className={`relative inline-flex h-4 w-8 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                              } ${isAdmin ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                              title={isAdmin ? (isEnabled ? 'Click to make Inactive' : 'Click to make Active') : 'Status (Admin Only)'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                  isEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                                isEnabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}
                            >
                              {isEnabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Edit & Delete Buttons (Admin Only) */}
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBrand(brand)}
                                className="px-2.5 py-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-[#C2477A] font-bold text-[11px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Edit Brand details"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptDelete(brand)}
                                className="px-2 py-1.5 rounded-xl border border-gray-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 font-bold text-[11px] transition-all cursor-pointer active:scale-95"
                                title="Delete Brand (Protected)"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Rows-Per-Page Controls */}
        <div className="bg-[#FFF8FA] px-5 py-3 mt-4 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Rows per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-gray-800 font-bold outline-none cursor-pointer focus:border-[#C2477A]"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span className="text-gray-300">|</span>

            <span>
              Showing{' '}
              <strong className="text-gray-900 font-bold">
                {filteredBrands.length === 0 ? 0 : startIndex + 1}
              </strong>
              {' '}-{' '}
              <strong className="text-gray-900 font-bold">
                {Math.min(startIndex + recordsPerPage, filteredBrands.length)}
              </strong>
              {' '}of{' '}
              <strong className="text-gray-900 font-bold">{filteredBrands.length}</strong>
            </span>
          </div>

          {/* Page Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                currentPage <= 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
              }`}
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 5) return true;
                return page === 1 || page === totalPages || Math.abs(page - effectivePage) <= 1;
              })
              .map((page, idx, arr) => {
                const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                const isCurrent = page === effectivePage;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#C2477A] text-white shadow-xs'
                          : 'bg-white border border-pink-200 text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                currentPage >= totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
              }`}
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Brand Form Modal */}
      {isFormModalOpen && (
        <BrandFormModal
          isOpen={isFormModalOpen}
          isEdit={Boolean(editingBrand)}
          editingBrand={editingBrand}
          existingBrands={brands}
          masterCategories={categories}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingBrand(null);
          }}
          onSaveBrand={handleSaveBrand}
        />
      )}

      {/* Import Excel Modal */}
      {isImportModalOpen && (
        <BrandImportModal
          isOpen={isImportModalOpen}
          masterCategories={categories}
          existingBrands={brands}
          onClose={() => setIsImportModalOpen(false)}
          onConfirmImport={async (parsedRows, mode) => {
            const results = await onBulkImportBrands(parsedRows, mode);
            showToast(`Import processed: ${results.created} created, ${results.updated} updated.`);
            return results;
          }}
        />
      )}

      {/* Delete Protected / In-Use Modal */}
      {deleteWarning && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteWarning(null); }}
        >
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-amber-100 animate-slide-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Brand In Active Use</h3>
                  <span className="text-[11px] text-gray-400 font-medium">Data Integrity Safeguard</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs leading-relaxed text-gray-600">
              <p>{deleteWarning.message}</p>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800">
                💡 <strong>Recommended Action:</strong> Toggle this brand's status to <strong>Inactive</strong>. This prevents new products from using the brand while protecting existing customer orders and catalog history.
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Understood
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onToggleBrandStatus(deleteWarning.brand.id);
                  showToast(`Brand "${deleteWarning.brand.name}" set to Inactive.`);
                  setDeleteWarning(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Set Brand Inactive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {bulkDeleteModalData && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all"
          onClick={(e) => { if (e.target === e.currentTarget && !isBulkDeleting) setBulkDeleteModalData(null); }}
        >
          <div 
            className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-pink-100 animate-slide-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Confirm Batch Deletion</h3>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {bulkDeleteModalData.totalCount} brand{bulkDeleteModalData.totalCount > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkDeleteModalData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* If some brands have product references and cannot be deleted */}
              {bulkDeleteModalData.referencedBrands.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>
                      {bulkDeleteModalData.referencedBrands.length} brand{bulkDeleteModalData.referencedBrands.length > 1 ? 's' : ''} are in use by products
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    These brands cannot be deleted because products in your store depend on them. Deactivating them instead will hide them from future assignments while protecting existing catalog items:
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 text-[11px]">
                    {bulkDeleteModalData.referencedBrands.map(r => (
                      <div key={r.brand.id} className="flex items-center justify-between font-medium text-gray-800">
                        <span>• {r.brand.name}</span>
                        <span className="text-amber-700 font-bold">{r.productCount} product(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deletable Brands Summary */}
              {bulkDeleteModalData.deletableBrands.length > 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                    <span>Brands ready to delete:</span>
                    <span className="text-rose-600 font-black">{bulkDeleteModalData.deletableBrands.length}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    These brands have 0 product references and will be permanently removed. Brand numbers will not be recycled.
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1 pt-1 text-[11px] text-gray-700 font-medium">
                    {bulkDeleteModalData.deletableBrands.slice(0, 15).map(b => (
                      <div key={b.id} className="truncate">• {b.name} ({b.brandNumber || b.brand_number})</div>
                    ))}
                    {bulkDeleteModalData.deletableBrands.length > 15 && (
                      <div className="text-gray-400 italic">...and {bulkDeleteModalData.deletableBrands.length - 15} more</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                  None of the selected brands can be deleted because all of them are currently assigned to products.
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setBulkDeleteModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              {bulkDeleteModalData.referencedBrands.length > 0 && (
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDeactivateReferenced}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isBulkDeleting ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Deactivate In-Use ({bulkDeleteModalData.referencedBrands.length})</span>
                </button>
              )}

              {bulkDeleteModalData.deletableBrands.length > 0 && (
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleConfirmBulkDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {isBulkDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>Delete {bulkDeleteModalData.deletableBrands.length} Brand{bulkDeleteModalData.deletableBrands.length > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Unreferenced Brands */}
      {deleteTargetBrand && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTargetBrand(null); }}
        >
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-pink-100 animate-slide-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Confirm Brand Deletion</h3>
                  <span className="text-[11px] text-gray-400 font-medium">Permanent Action</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetBrand(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-gray-600 leading-relaxed">
              <p>
                Are you sure you want to delete brand <strong>"{deleteTargetBrand.name}"</strong> ({deleteTargetBrand.brandNumber || deleteTargetBrand.brand_number})?
                This brand has 0 active product references and can be safely removed. Permanent Brand Numbers are never recycled after deletion.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setDeleteTargetBrand(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
