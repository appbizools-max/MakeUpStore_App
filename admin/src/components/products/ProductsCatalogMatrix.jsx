import React, { useState } from 'react';
import {
  Package,
  PlusCircle,
  Plus,
  Search,
  X,
  ScanBarcode,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  Barcode,
  BadgePercent,
  Palette,
  Edit,
  Save,
  Trash2,
  Sparkles,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Tag,
  FileSpreadsheet,
  Table,
  Download,
  Eye,
  Copy,
  Check,
  Info,
  Sliders,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  FileText,
  Boxes,
  Maximize2,
  DollarSign
} from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import RoleQuantityTiersManager from './RoleQuantityTiersManager';
import GeneratedDataPanel from './GeneratedDataPanel';
import { getBeautyShadeName } from '../common/HexColorPicker';
import { getDefaultQuantityTiers } from '../../utils/quantityTiersUtils';
import { getSafeActiveVariants } from '../../utils/productSearchEngine';
import { generateAndDownloadTemplate } from '../../utils/excelTemplateGenerator';
import { useAdmin } from '../../context/AdminContext';
import { ExcelImportModal } from './ExcelImportModal';
import * as XLSX from 'xlsx';

/**
 * ProductsCatalogMatrix - Premium Beauty-Commerce Admin Catalog Table
 * Features:
 * - Comprehensive visibility of all product details (Category, Subcategory, Variant Type, Size, Net Qty, GST %, Stock, Description, Attributes, Ingredients, How to Use, Images, Tiers)
 * - 4-role multi-tier pricing hierarchy (Original MRP -> General User -> Salon Owner -> Makeup Artist -> Beautician) with % discount badges
 * - Instant inline expandable details panel & modal inspector
 * - Dynamic view mode (Product Families vs All Sellable Variants)
 * - Universal Barcode Scanner & Search
 * - Expandable Child Variants, Shade Manager, Quantity Tiers Manager, and Rich Discovery panels
 */
export default function ProductsCatalogMatrix({
  filteredProducts = [],
  catalogViewMode = 'all',
  setCatalogViewMode,
  handleOpenAddProduct,
  handleOpenBulkAdd,
  productSearch = '',
  setProductSearch,
  productCurrentPage = 1,
  setProductCurrentPage,
  setIsCatalogScannerOpen,
  availableProductBrands = [],
  productBrandFilter = 'all',
  setProductBrandFilter,
  availableProductCategories = [],
  productCategoryFilter = 'all',
  setProductCategoryFilter,
  paginatedProducts = [],
  isBarcodeQuery,
  handleAddProductWithBarcode,
  products = [],
  editingProductId = null,
  expandedProductIds = new Set(),
  toggleExpandProduct,
  editingTiersProductId = null,
  setEditingTiersProductId,
  editingShadeProductId = null,
  setEditingShadeProductId,
  editingRichDataProductId = null,
  setEditingRichDataProductId,
  getTotalQuantityTiersCount,
  handleToggleProductTiersPanel,
  handleToggleProductShadesPanel,
  editPrices = {},
  setEditPrices,
  handleSavePrices,
  handleOpenEditProduct,
  handleStartEditProduct,
  handleOpenDeleteProduct,
  productTiersLocal = {},
  setProductTiersLocal,
  isSavingTiers = false,
  handleSaveProductTiers,
  tiersSaveSuccess = false,
  productShadesLocal = [],
  setProductShadesLocal,
  handleSaveProductShades,
  isSavingShades = false,
  shadesSaveSuccess = false,
  handleOpenShadePricing,
  shadeFormDraft = { name: '', hexColor: '#C2477A', priceOverride: '', active: true },
  setShadeFormDraft,
  updateProduct,
  productRecordsPerPage = 15,
  setProductRecordsPerPage,
  productStartIndex = 0,
  totalProductPages = 1,
  effectiveProductPage = 1,
  brands = []
}) {
  const isFiltered = Boolean(productSearch || productBrandFilter !== 'all' || productCategoryFilter !== 'all');

  // State for expanded detail view & modal
  const [expandedDetailsProductIds, setExpandedDetailsProductIds] = useState(new Set());
  const [selectedDetailModalProduct, setSelectedDetailModalProduct] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'pricing' | 'specs' | 'content' | 'variants' | 'tiers'
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeImagePreview, setActiveImagePreview] = useState(null);
  const adminCtx = useAdmin();
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const toggleProductDetails = (productId) => {
    setExpandedDetailsProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const expandAllDetails = () => {
    if (expandedDetailsProductIds.size === paginatedProducts.length) {
      setExpandedDetailsProductIds(new Set());
    } else {
      setExpandedDetailsProductIds(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const calculateDiscount = (mrp, price) => {
    const m = Number(mrp || 0);
    const p = Number(price || 0);
    if (m > 0 && p > 0 && p < m) {
      return Math.round(((m - p) / m) * 100);
    }
    return 0;
  };

  const handleExportCatalogExcel = () => {
    try {
      const sourceList = filteredProducts && filteredProducts.length > 0 ? filteredProducts : products;
      if (!sourceList || sourceList.length === 0) {
        alert('No saved products in the database to export.');
        return;
      }

      const exportRows = sourceList.map((p, index) => {
        const brandObj = brands?.find(b => b.id === p.brandId);
        const brandName = p.brandName || brandObj?.name || p.brand || '';
        const shadesCount = Array.isArray(p.shades) ? p.shades.length : 0;
        const shadesNames = Array.isArray(p.shades) ? p.shades.map(s => s.name || s.shade).filter(Boolean).join(', ') : '';
        const attrStr = p.attributes && typeof p.attributes === 'object' ? Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join('; ') : '';

        return {
          '#': index + 1,
          'Product ID': p.id,
          'Barcode': p.barcode || '',
          'Product Name': p.name || '',
          'Brand': brandName,
          'Category': p.category || '',
          'Subcategory': p.subcategory || p.additionalInfo?.subcategory || '',
          'Variant Type': p.variantType || p.productType || 'Shade',
          'Variants / Shades': shadesNames || (shadesCount > 0 ? `${shadesCount} Variants` : '—'),
          'MRP (₹)': Number(p.mrp || 0),
          'General Price (₹)': Number(p.generalPrice !== undefined ? p.generalPrice : p.mrp || 0),
          'Salon Price (₹)': Number(p.salonPrice || 0),
          'Artist Price (₹)': Number(p.artistPrice || 0),
          'Beautician Price (₹)': Number(p.beauticianPrice || 0),
          'Active Status': p.enabled !== false ? 'Active' : 'Inactive',
          'Size': p.size || p.additionalInfo?.size || '',
          'Net Quantity': p.netQty || p.net_qty || p.additionalInfo?.net_qty || '',
          'GST %': Number(p.gstPercent ?? p.gst ?? p.additionalInfo?.gst_percent ?? 18),
          'Description': p.description || p.howToUse || '',
          'Attributes': attrStr,
          'Image URL': p.image || (Array.isArray(p.images) && p.images[0] ? p.images[0] : ''),
          'Status': (p.status || 'published').toUpperCase(),
          'Created At': p.createdAt || p.created_at || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalog Products');
      XLSX.writeFile(workbook, `salbeau_products_catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Failed to export Excel: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#F3D7DF] shadow-xs space-y-5">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-pink-100/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#C2477A] flex items-center justify-center shadow-2xs shrink-0">
              <Package size={18} />
            </div>
            <h3 className="font-black text-base sm:text-lg text-gray-900 tracking-tight">
              Products Catalog Matrix
            </h3>
            <span className="text-[10px] font-extrabold text-[#C2477A] bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              {filteredProducts.length} {catalogViewMode === 'variants' ? 'Items & Variants' : 'Product Families'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            Complete beauty-commerce catalog matrix showing all product details, 4-role multi-tier pricing, category attributes, variants & catalog status.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center bg-[#FFF5F8] p-1 rounded-xl border border-pink-100/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setCatalogViewMode('all');
                setProductCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                catalogViewMode === 'all'
                  ? 'bg-white text-[#C2477A] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="View parent product families and standalone items"
            >
              Product Families
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogViewMode('variants');
                setProductCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                catalogViewMode === 'variants'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="View all individual sellable child variants + families without DB record duplication"
            >
              <Layers size={13} />
              <span>All Sellable Variants</span>
            </button>
          </div>

          {/* Action Buttons: Add Product, Bulk Add, Import Excel, Download Template */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={expandAllDetails}
              className="bg-pink-50 hover:bg-pink-100 border border-pink-200 text-[#C2477A] font-extrabold text-xs px-3 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              title="Expand/collapse full details for all products on current page"
            >
              <Eye size={14} />
              <span>{expandedDetailsProductIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? 'Collapse Details' : 'Expand All Details'}</span>
            </button>

            <button
              onClick={handleOpenAddProduct}
              className="bg-gradient-to-r from-[#C2477A] to-[#9E2D5B] hover:from-[#9E2D5B] hover:to-[#cc0052] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              <PlusCircle size={15} />
              <span>+ Add Product</span>
            </button>

            <button
              onClick={() => {
                if (handleOpenBulkAdd) handleOpenBulkAdd();
                else if (typeof window !== 'undefined') window.location.assign('/admin/products/bulk');
              }}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              title="Open high-speed bulk product entry console"
            >
              <Table size={14} className="text-purple-600" />
              <span>Bulk Add</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelImportModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              title="Import products from Excel/CSV file with Parent-Child variant grouping"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCatalogExcel}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              title="Export actual database products to Excel (.xlsx)"
            >
              <Download size={14} className="text-indigo-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => generateAndDownloadTemplate()}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              title="Download official Excel import template with 22 canonical columns + Instructions sheet"
            >
              <FileText size={14} className="text-gray-500" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="p-3 bg-[#FFF9FB] rounded-2xl border border-pink-100/90 flex flex-wrap items-center gap-2.5">
        {/* Search Bar */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-pink-100 shadow-2xs flex-1 min-w-[220px] focus-within:border-[#C2477A] transition-colors">
          <Search size={15} className="text-[#C2477A] shrink-0" />
          <input
            type="text"
            placeholder="Search by product name, brand, barcode, category or attributes..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setProductCurrentPage(1);
            }}
            className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
          />
          {productSearch && (
            <button
              type="button"
              onClick={() => {
                setProductSearch('');
                setProductCurrentPage(1);
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded-full hover:bg-gray-100"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Scan Barcode Button */}
        <button
          type="button"
          onClick={() => setIsCatalogScannerOpen(true)}
          className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#C2477A] to-[#9E2D5B] hover:from-[#9E2D5B] text-white shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
          title="Scan physical product barcode with camera"
        >
          <ScanBarcode size={15} />
          <span>Scan Barcode</span>
        </button>

        {/* Brand Filter */}
        <div className="min-w-[160px] flex-1 sm:flex-initial">
          <SearchableSelect
            options={['All Brands', ...availableProductBrands.filter(b => b && b !== 'all')]}
            value={productBrandFilter === 'all' ? 'All Brands' : productBrandFilter}
            onChange={(val) => {
              setProductBrandFilter(val === 'All Brands' ? 'all' : val);
              setProductCurrentPage(1);
            }}
            placeholder="All Brands"
            searchPlaceholder="Search brand..."
            emptyMessage="No brands found"
            compact={true}
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[160px] flex-1 sm:flex-initial">
          <SearchableSelect
            options={['All Categories', ...availableProductCategories.filter(c => c && c !== 'all')]}
            value={productCategoryFilter === 'all' ? 'All Categories' : productCategoryFilter}
            onChange={(val) => {
              setProductCategoryFilter(val === 'All Categories' ? 'all' : val);
              setProductCurrentPage(1);
            }}
            placeholder="All Categories"
            searchPlaceholder="Search category..."
            emptyMessage="No categories found"
            compact={true}
          />
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setProductSearch('');
              setProductBrandFilter('all');
              setProductCategoryFilter('all');
              setProductCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl text-gray-500 hover:text-[#C2477A] hover:bg-pink-50 border border-transparent hover:border-pink-200 text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1"
            title="Clear search and filters"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Mobile Responsive Cards Layout (< 768px) */}
      <div className="block md:hidden space-y-3.5">
        {paginatedProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-pink-100">
            <Package size={32} className="text-pink-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-gray-700">No products found</p>
          </div>
        ) : (
          paginatedProducts.map((p, pIdx) => {
            const pImage = p.imageUrl || p.image;
            const variantsList = getSafeActiveVariants(p);
            return (
              <div key={`m_${p.id || p._id || p.barcode || pIdx}`} className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm space-y-3">
                <div className="flex gap-3">
                  <div
                    onClick={() => pImage && setActiveImagePreview(pImage)}
                    className="w-16 h-16 rounded-xl bg-pink-50 border border-pink-100 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
                  >
                    {pImage ? (
                      <img src={pImage} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-pink-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#C2477A] text-[9.5px] font-extrabold uppercase">
                        {p.brandName || 'Brand'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9.5px] font-semibold">
                        {p.category || 'Beauty'}
                      </span>
                      {variantsList.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9.5px] font-bold">
                          {variantsList.length} shades
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 mt-1 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    {p.barcode && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
                        <Barcode size={10} />
                        <span>{p.barcode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4-Tier Role Pricing Grid */}
                <div className="grid grid-cols-2 gap-2 bg-[#FFF9FB] p-2.5 rounded-xl border border-pink-100/60 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block">MRP</span>
                    <span className="font-bold text-gray-800">₹{p.mrp || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">General User</span>
                    <span className="font-bold text-gray-900">₹{p.generalPrice ?? p.mrp ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C2477A] font-semibold block">Salon Owner (30%)</span>
                    <span className="font-extrabold text-[#C2477A]">₹{p.salonPrice ?? p.mrp ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-700 font-semibold block">Makeup Artist (35%)</span>
                    <span className="font-extrabold text-purple-700">₹{p.artistPrice ?? p.mrp ?? 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailModalProduct(p)}
                    className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof handleOpenEditProduct === 'function') {
                        handleOpenEditProduct(p);
                      } else if (typeof handleStartEditProduct === 'function') {
                        handleStartEditProduct(p);
                      }
                    }}
                    className="flex-1 py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-[#C2477A] font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 border border-pink-200 cursor-pointer"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof handleOpenShadePricing === 'function') {
                        handleOpenShadePricing(p);
                      } else if (typeof handleStartEditProduct === 'function') {
                        handleStartEditProduct(p);
                      }
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#C2477A] hover:bg-[#9E2D5B] text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <DollarSign size={12} /> Prices
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Catalog Matrix Table (Desktop & Tablet >= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-pink-100 shadow-2xs custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FFF5F8]/95 backdrop-blur-md text-gray-700 uppercase font-black text-[10.5px] tracking-wider border-b border-pink-200/80 sticky top-0 z-10 shadow-2xs">
              <th className="py-3.5 px-3 text-center w-14">IMAGE</th>
              <th className="py-3.5 px-4 text-left min-w-[280px]">PRODUCT & DETAILS</th>
              <th className="py-3.5 px-3 text-left whitespace-nowrap">BARCODE</th>
              <th className="py-3.5 px-3 text-left whitespace-nowrap">BRAND</th>
              <th className="py-3.5 px-3 text-right whitespace-nowrap">ORIGINAL MRP (₹)</th>
              <th className="py-3.5 px-3 text-right whitespace-nowrap">GENERAL USER (₹)</th>
              <th className="py-3.5 px-3 text-right whitespace-nowrap text-[#C2477A]">SALON OWNER (₹)</th>
              <th className="py-3.5 px-3 text-right whitespace-nowrap text-purple-700">ARTIST PRICE (₹)</th>
              <th className="py-3.5 px-3 text-right whitespace-nowrap text-indigo-700">BEAUTICIAN (₹)</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 px-6 text-center">
                  {isBarcodeQuery && isBarcodeQuery(productSearch) ? (
                    <div className="max-w-md mx-auto p-6 bg-[#FFF8FA] border border-pink-200 rounded-3xl shadow-xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#C2477A] flex items-center justify-center mx-auto shadow-2xs">
                        <ScanBarcode size={24} />
                      </div>
                      <h4 className="font-black text-base text-gray-900">Product Not Found</h4>
                      <p className="text-xs text-gray-600 font-medium">
                        No product matches this barcode. Would you like to create a new product with this barcode?
                      </p>
                      <div className="font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-pink-200 inline-block text-xs">
                        {productSearch}
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddProductWithBarcode(productSearch)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#9E2D5B] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <PlusCircle size={15} />
                          <span>Add New Product</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                        <Package size={26} />
                      </div>
                      <p className="font-black text-sm text-gray-700">No Products Found</p>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        {products.length === 0
                          ? 'No products added to catalog yet. Click "Add New Product" to create one.'
                          : 'Try adjusting your search query, brand, or category filters.'}
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductBrandFilter('all');
                            setProductCategoryFilter('all');
                            setProductCurrentPage(1);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-[#C2477A] border border-pink-200 font-bold text-xs hover:bg-pink-100 transition-all cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p, index) => {
                const isEditing = editingProductId === p.id;
                const variantsList = getSafeActiveVariants(p);
                const hasChildVariants = !p.isVariantChild && variantsList.length > 0;
                const isExpandedVariants = expandedProductIds.has(p.id);
                const isExpandedDetails = expandedDetailsProductIds.has(p.id);
                const pImage = p.imageUrl || p.image;
                const allImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (pImage ? [pImage] : []);

                // Calculate discount percentages
                const genDisc = calculateDiscount(p.mrp, p.generalPrice);
                const salonDisc = calculateDiscount(p.mrp, p.salonPrice);
                const artistDisc = calculateDiscount(p.mrp, p.artistPrice);
                const beauticianDisc = calculateDiscount(p.mrp, p.beauticianPrice);

                // Attributes list
                const attrEntries = p.attributes && typeof p.attributes === 'object'
                  ? Object.entries(p.attributes).filter(([k, v]) => k && v && typeof v !== 'object')
                  : [];

                return (
                  <React.Fragment key={p.id || p._id || p.barcode || index}>
                    <tr
                      className={`transition-colors border-b border-pink-100/50 ${
                        isExpandedDetails
                          ? 'bg-pink-50/30'
                          : editingTiersProductId === p.id
                          ? 'bg-amber-50/40'
                          : index % 2 === 1
                          ? 'bg-[#FFF9FB]/50 hover:bg-[#FFF2F5]'
                          : 'bg-white hover:bg-[#FFF2F5]/60'
                      }`}
                    >
                      {/* 1. Thumbnail Image & Gallery Indicator */}
                      <td className="py-3 px-3 text-center">
                        <div
                          onClick={() => {
                            if (pImage) setActiveImagePreview(pImage);
                          }}
                          className="relative w-12 h-12 rounded-xl overflow-hidden bg-pink-50/70 border border-pink-100 flex items-center justify-center mx-auto shadow-2xs group cursor-pointer"
                          title="Click to view full image"
                        >
                          {pImage ? (
                            <img
                              src={pImage}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package size={20} className="text-pink-300" />
                          )}
                          {allImages.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8.5px] font-black px-1 rounded-tl shadow-xs">
                              +{allImages.length - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Product Title & All Metadata Badges */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {/* Title & Detail Toggle */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => toggleProductDetails(p.id)}
                                className="hover:text-[#C2477A] transition-colors cursor-pointer"
                                title="Click to expand full product details"
                              >
                                {p.name}
                              </span>

                              {/* Standalone vs Variant vs Product Family badge */}
                              {p.isVariantChild ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-[#C2477A] border border-pink-200 text-[10px] font-bold">
                                  {p.hexColor && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                      style={{ backgroundColor: p.hexColor }}
                                    />
                                  )}
                                  <span>Variant</span>
                                </span>
                              ) : hasChildVariants ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandProduct(p.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    isExpandedVariants
                                      ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-2xs'
                                      : 'bg-pink-50 text-[#C2477A] border-pink-200 hover:bg-pink-100'
                                  }`}
                                  title={isExpandedVariants ? 'Collapse variants' : 'Expand all child variants'}
                                >
                                  <ChevronDown
                                    size={11}
                                    className={`transform transition-transform duration-200 ${
                                      isExpandedVariants ? 'rotate-180' : ''
                                    }`}
                                  />
                                  <span>
                                    {variantsList.length} {variantsList.length === 1 ? 'Variant' : 'Variants'}
                                  </span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-medium text-gray-500 bg-gray-100">
                                  Standalone
                                </span>
                              )}
                            </div>

                            {/* Quick Details Trigger */}
                            <button
                              type="button"
                              onClick={() => toggleProductDetails(p.id)}
                              className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                isExpandedDetails
                                  ? 'bg-[#C2477A] text-white shadow-2xs'
                                  : 'text-gray-400 hover:text-[#C2477A] hover:bg-pink-50'
                              }`}
                              title={isExpandedDetails ? 'Hide details' : 'Show all details'}
                            >
                              {isExpandedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>

                          {/* Family indicator for child variants */}
                          {p.isVariantChild && p.parentName && (
                            <div className="text-[10px] text-gray-600 font-semibold">
                              ↳ Family: <span className="font-bold text-gray-900">{p.parentName}</span>
                            </div>
                          )}

                          {/* Primary Metadata Badges (Category, Subcategory, Variant Type, Size, Net Qty, GST) */}
                          <div className="text-[10px] text-gray-600 font-medium flex items-center gap-1.5 flex-wrap">
                            {/* Interactive Catalog Status Toggle */}
                            {(() => {
                              const isProdActive = p.enabled !== false && (p.status || 'published').toLowerCase() === 'published';
                              return (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (updateProduct) {
                                      const nextActive = !isProdActive;
                                      await updateProduct(p.id, {
                                        enabled: nextActive,
                                        status: nextActive ? 'published' : 'hidden'
                                      });
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[9px] uppercase border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                                    isProdActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : p.status === 'draft'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title={`Click to ${isProdActive ? 'Deactivate (Hide from customer catalog)' : 'Activate (Publish in customer catalog)'}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isProdActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                  <span>{isProdActive ? 'ACTIVE' : (p.status || 'INACTIVE').toUpperCase()}</span>
                                </button>
                              );
                            })()}

                            {/* Category */}
                            {p.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pink-50 text-[#C2477A] font-bold text-[9.5px] border border-pink-100">
                                {p.category.trim()}
                              </span>
                            )}

                            {/* Subcategory */}
                            {p.subcategory && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[9.5px] border border-slate-200">
                                {p.subcategory.trim()}
                              </span>
                            )}

                            {/* Variant Type */}
                            {p.variantType && p.variantType !== 'Standard' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[9.5px] border border-purple-200">
                                {p.variantType.trim()}
                              </span>
                            )}

                            {/* Size / Net Qty */}
                            {(p.size || p.netQty) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[9.5px] border border-blue-200">
                                {p.size || p.netQty}
                              </span>
                            )}

                            {/* GST % */}
                            {p.gstPercent !== undefined && p.gstPercent !== null && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[9px] border border-amber-200">
                                GST: {p.gstPercent}%
                              </span>
                            )}

                            {/* Shades Trigger */}
                            {(() => {
                              const shadesCount = p.shades && Array.isArray(p.shades) ? p.shades.length : 0;
                              if (shadesCount === 0 && editingShadeProductId !== p.id) return null;

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductShadesPanel(p)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all border cursor-pointer ${
                                    editingShadeProductId === p.id
                                      ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-2xs'
                                      : 'bg-pink-50 text-[#C2477A] border-pink-200 hover:bg-pink-100'
                                  }`}
                                  title="Manage shade variants and role prices"
                                >
                                  <Palette
                                    size={10}
                                    className={editingShadeProductId === p.id ? 'text-white' : 'text-[#C2477A]'}
                                  />
                                  <span>
                                    {shadesCount} {shadesCount === 1 ? 'Shade' : 'Shades'}
                                  </span>
                                  <ChevronDown
                                    size={10}
                                    className={`transform transition-transform ${
                                      editingShadeProductId === p.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              );
                            })()}

                            {/* Quantity Discount Tiers Trigger */}
                            {(() => {
                              const tiersCount = getTotalQuantityTiersCount
                                ? getTotalQuantityTiersCount(p.quantityTiers)
                                : 0;
                              if (tiersCount === 0 && editingTiersProductId !== p.id) return null;

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductTiersPanel(p)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all border cursor-pointer ${
                                    editingTiersProductId === p.id
                                      ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-2xs'
                                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                  }`}
                                  title="Configure per-product quantity discount tiers"
                                >
                                  <BadgePercent
                                    size={10}
                                    className={editingTiersProductId === p.id ? 'text-white' : 'text-amber-600'}
                                  />
                                  <span>
                                    {tiersCount} {tiersCount === 1 ? 'Qty Tier' : 'Qty Tiers'}
                                  </span>
                                  <ChevronDown
                                    size={10}
                                    className={`transform transition-transform ${
                                      editingTiersProductId === p.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              );
                            })()}
                          </div>

                          {/* Dynamic Attribute Chips (if any exist) */}
                          {attrEntries.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {attrEntries.slice(0, 3).map(([k, val]) => (
                                <span
                                  key={k}
                                  className="text-[9px] font-medium text-gray-600 bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200"
                                >
                                  <span className="text-gray-400">{k}:</span> <span className="font-semibold text-gray-800">{String(val)}</span>
                                </span>
                              ))}
                              {attrEntries.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => toggleProductDetails(p.id)}
                                  className="text-[9px] font-bold text-[#C2477A] hover:underline cursor-pointer"
                                >
                                  +{attrEntries.length - 3} more specs
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Barcode */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Barcode..."
                            value={editPrices.barcode !== undefined ? editPrices.barcode : p.barcode || ''}
                            onChange={(e) => setEditPrices({ ...editPrices, barcode: e.target.value })}
                            className="w-32 p-1.5 border border-[#C2477A] rounded-lg font-mono text-xs font-semibold text-gray-900 outline-none"
                          />
                        ) : p.barcode ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-800 font-mono text-[11px] font-bold border border-gray-200 shadow-2xs group">
                            <Barcode size={13} className="text-[#C2477A]" />
                            <span>{p.barcode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.barcode, `barcode_${p.id}`)}
                              className="text-gray-400 hover:text-gray-700 ml-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy Barcode"
                            >
                              {copiedKey === `barcode_${p.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* 4. Brand */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-xs text-gray-800 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                          {p.brandName || brands?.find(b => b.id === p.brandId)?.name || '—'}
                        </span>
                      </td>

                      {/* 6. Original MRP */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPrices.mrp}
                            onChange={(e) =>
                              setEditPrices({ ...editPrices, mrp: Math.max(0, Number(e.target.value)) })
                            }
                            className="w-20 p-1.5 border border-[#C2477A] rounded-lg font-bold text-gray-900 outline-none text-right"
                          />
                        ) : (
                          <span className="font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 inline-block min-w-[65px] text-right shadow-2xs">
                            ₹{p.mrp ?? 0}
                          </span>
                        )}
                      </td>

                      {/* 7. General User MRP */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPrices.generalPrice}
                            onChange={(e) =>
                              setEditPrices({
                                ...editPrices,
                                generalPrice: Math.max(0, Number(e.target.value))
                              })
                            }
                            className="w-20 p-1.5 border border-[#C2477A] rounded-lg font-bold text-gray-900 outline-none text-right"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-200 inline-block min-w-[65px] text-right shadow-2xs">
                              ₹
                              {p.generalPrice !== undefined && p.generalPrice !== null && p.generalPrice !== ''
                                ? p.generalPrice
                                : p.mrp ?? 0}
                            </span>
                            {genDisc > 0 && (
                              <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                {genDisc}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 8. Salon Owner Price */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPrices.salonPrice}
                            onChange={(e) =>
                              setEditPrices({
                                ...editPrices,
                                salonPrice: Math.max(0, Number(e.target.value))
                              })
                            }
                            className="w-20 p-1.5 border border-[#C2477A] rounded-lg font-bold text-[#C2477A] outline-none text-right"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-extrabold text-[#C2477A] bg-[#FFF5F8] px-2 py-1 rounded-lg border border-pink-200/80 inline-block min-w-[65px] text-right shadow-2xs">
                              ₹
                              {p.salonPrice !== undefined && p.salonPrice !== null && p.salonPrice !== ''
                                ? p.salonPrice
                                : p.mrp ?? 0}
                            </span>
                            {salonDisc > 0 && (
                              <span className="text-[9.5px] font-extrabold text-[#C2477A] bg-pink-50 px-1 py-0.5 rounded border border-pink-200">
                                {salonDisc}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 9. Makeup Artist Price */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPrices.artistPrice}
                            onChange={(e) =>
                              setEditPrices({
                                ...editPrices,
                                artistPrice: Math.max(0, Number(e.target.value))
                              })
                            }
                            className="w-20 p-1.5 border border-purple-500 rounded-lg font-bold text-purple-700 outline-none text-right"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-extrabold text-purple-700 bg-purple-50/70 px-2 py-1 rounded-lg border border-purple-200 inline-block min-w-[65px] text-right shadow-2xs">
                              ₹
                              {p.artistPrice !== undefined && p.artistPrice !== null && p.artistPrice !== ''
                                ? p.artistPrice
                                : p.mrp ?? 0}
                            </span>
                            {artistDisc > 0 && (
                              <span className="text-[9.5px] font-extrabold text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                                {artistDisc}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 10. Beautician Price */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPrices.beauticianPrice}
                            onChange={(e) =>
                              setEditPrices({
                                ...editPrices,
                                beauticianPrice: Math.max(0, Number(e.target.value))
                              })
                            }
                            className="w-20 p-1.5 border border-indigo-500 rounded-lg font-bold text-indigo-700 outline-none text-right"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-extrabold text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded-lg border border-indigo-200 inline-block min-w-[65px] text-right shadow-2xs">
                              ₹
                              {p.beauticianPrice !== undefined &&
                              p.beauticianPrice !== null &&
                              p.beauticianPrice !== ''
                                ? p.beauticianPrice
                                : p.mrp ?? 0}
                            </span>
                            {beauticianDisc > 0 && (
                              <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">
                                {beauticianDisc}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <button
                            onClick={() => handleSavePrices(p.id)}
                            className="bg-[#C2477A] hover:bg-[#9E2D5B] text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs text-[11px] ml-auto cursor-pointer transition-all active:scale-95"
                          >
                            <Save size={13} />
                            <span>Save</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Full Details Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedDetailModalProduct(p)}
                              className="bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-purple-200 transition-all text-[11px] cursor-pointer shadow-2xs"
                              title="Open comprehensive product details modal"
                            >
                              <Eye size={12} />
                              <span>Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="bg-pink-50 hover:bg-[#C2477A] text-[#C2477A] hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-pink-200 transition-all text-[11px] cursor-pointer shadow-2xs"
                              title="Edit product details & barcode"
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(p)}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1.5 rounded-xl font-semibold flex items-center gap-1 border border-gray-200 transition-all text-[10.5px] cursor-pointer"
                              title="Quick edit prices inline"
                            >
                              Prices
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingRichDataProductId((prev) => (prev === p.id ? null : p.id))
                              }
                              className={`px-2 py-1.5 rounded-xl font-bold flex items-center gap-1 border transition-all text-[10.5px] cursor-pointer shadow-2xs ${
                                editingRichDataProductId === p.id
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              }`}
                              title="View & edit auto-generated discovery data (keywords, benefits, highlights, SEO)"
                            >
                              <Sparkles size={11} />
                              <span>Discovery</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDeleteProduct(p)}
                              className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-2 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-rose-200 transition-all text-[10.5px] cursor-pointer shadow-2xs"
                              title="Delete this product"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* INLINE EXPANDABLE FULL PRODUCT DETAILS PANEL */}
                    {isExpandedDetails && (
                      <tr key={p.id + '_full_details_panel'} className="bg-pink-50/20 border-y-2 border-pink-200/80">
                        <td colSpan={11} className="p-4 sm:p-6">
                          <div className="bg-white rounded-3xl border border-pink-200 shadow-sm p-5 sm:p-6 space-y-6">
                            {/* Card Header with Key Identifiers */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-pink-100">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-pink-50 border border-pink-200 shrink-0 shadow-xs">
                                  {pImage ? (
                                    <img src={pImage} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={24} className="text-pink-300 m-auto mt-4" />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-black text-base text-gray-900">{p.name}</h4>
                                    <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#C2477A] text-[10px] font-extrabold uppercase">
                                      {p.category || 'Product'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium flex items-center gap-3 flex-wrap">
                                    <span>Brand: <strong className="text-gray-800">{p.brandName || brands?.find(b => b.id === p.brandId)?.name || '—'}</strong></span>
                                    <span>Subcategory: <strong className="text-gray-800">{p.subcategory || '—'}</strong></span>
                                    <span>Variant Type: <strong className="text-gray-800">{p.variantType || 'Standard'}</strong></span>
                                    <span>ID: <code className="text-xs font-mono text-gray-600">{p.id}</code></span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailModalProduct(p)}
                                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Maximize2 size={13} />
                                  <span>Full Modal Inspector</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-[#C2477A] hover:text-white border border-pink-200 text-[#C2477A] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Edit size={13} />
                                  <span>Edit Product</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleProductDetails(p.id)}
                                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </div>

                            {/* Section Grid: 4-Role Pricing & Discounts, Specifications, Description, Media */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* 1. Multi-Role Pricing Matrix */}
                              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-pink-100/90 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <Tag size={14} className="text-[#C2477A]" />
                                  <span>4-Role Pricing Matrix</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-500 font-medium">Original MRP:</span>
                                    <span className="font-bold text-gray-900">₹{p.mrp ?? 0}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-700 font-semibold">General User:</span>
                                    <span className="font-extrabold text-gray-900">₹{p.generalPrice ?? p.mrp ?? 0} {genDisc > 0 && <span className="text-emerald-600 text-[10px]">({genDisc}% off)</span>}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100 bg-pink-50/60 px-2 rounded-lg">
                                    <span className="text-[#C2477A] font-bold">Salon Owner:</span>
                                    <span className="font-black text-[#C2477A]">₹{p.salonPrice ?? p.mrp ?? 0} {salonDisc > 0 && <span className="text-[#C2477A] text-[10px]">({salonDisc}% off)</span>}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-purple-100 bg-purple-50/60 px-2 rounded-lg">
                                    <span className="text-purple-800 font-bold">Makeup Artist:</span>
                                    <span className="font-black text-purple-800">₹{p.artistPrice ?? p.mrp ?? 0} {artistDisc > 0 && <span className="text-purple-700 text-[10px]">({artistDisc}% off)</span>}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 bg-indigo-50/60 px-2 rounded-lg">
                                    <span className="text-indigo-800 font-bold">Beautician:</span>
                                    <span className="font-black text-indigo-800">₹{p.beauticianPrice ?? p.mrp ?? 0} {beauticianDisc > 0 && <span className="text-indigo-700 text-[10px]">({beauticianDisc}% off)</span>}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Core Specifications */}
                              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-pink-100/90 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <Sliders size={14} className="text-blue-600" />
                                  <span>Catalog Specs & Details</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-500 font-medium">Barcode:</span>
                                    <span className="font-mono font-bold text-gray-900 flex items-center gap-1">
                                      {p.barcode || '—'}
                                      {p.barcode && (
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(p.barcode, `det_bc_${p.id}`)}
                                          className="text-gray-400 hover:text-gray-700"
                                        >
                                          {copiedKey === `det_bc_${p.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-500 font-medium">Catalog Status:</span>
                                    <span className={`font-bold ${p.enabled !== false ? 'text-emerald-700' : 'text-gray-500'}`}>{p.enabled !== false ? 'Active' : 'Inactive'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-500 font-medium">Size / Net Qty:</span>
                                    <span className="font-bold text-blue-700">{p.size || p.netQty || '—'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-pink-100">
                                    <span className="text-gray-500 font-medium">GST Applicable:</span>
                                    <span className="font-bold text-amber-800">{p.gstPercent ?? 18}%</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-500 font-medium">Shades Count:</span>
                                    <span className="font-bold text-pink-700">{p.shades && Array.isArray(p.shades) ? p.shades.length : 0} shades</span>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Category Attributes */}
                              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-pink-100/90 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <Layers size={14} className="text-purple-600" />
                                  <span>Category Attributes</span>
                                </div>
                                {attrEntries.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic py-2">No custom category attributes specified.</p>
                                ) : (
                                  <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {attrEntries.map(([k, val]) => (
                                      <div key={k} className="flex justify-between items-center py-1 border-b border-pink-100">
                                        <span className="text-gray-500 font-medium capitalize">{k.replace(/_/g, ' ')}:</span>
                                        <span className="font-bold text-gray-900 text-right">{String(val)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 4. Multi-Image Gallery */}
                              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-pink-100/90 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <ImageIcon size={14} className="text-emerald-600" />
                                  <span>Media Gallery ({allImages.length})</span>
                                </div>
                                {allImages.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic py-2">No product images uploaded.</p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                    {allImages.map((imgUrl, iIdx) => (
                                      <div
                                        key={iIdx}
                                        onClick={() => setActiveImagePreview(imgUrl)}
                                        className="h-16 rounded-xl overflow-hidden border border-pink-200 bg-white hover:border-[#C2477A] transition-all cursor-pointer group shadow-2xs"
                                        title="Click to zoom image"
                                      >
                                        <img src={imgUrl} alt={`${p.name} ${iIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Section: Description, Highlights, How to Use, Ingredients */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                              {/* Description & How To Use */}
                              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <FileText size={14} className="text-[#C2477A]" />
                                  <span>Description & How To Use</span>
                                </div>
                                <div className="space-y-2 text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                  {p.description ? (
                                    <p className="whitespace-pre-line">{p.description}</p>
                                  ) : (
                                    <p className="text-gray-400 italic">No description provided.</p>
                                  )}

                                  {p.howToUse && (
                                    <div className="pt-2 border-t border-gray-200">
                                      <strong className="text-gray-900 block mb-1">How To Use:</strong>
                                      <p className="whitespace-pre-line text-gray-600">{p.howToUse}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Highlights & Ingredients */}
                              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                                  <Sparkles size={14} className="text-purple-600" />
                                  <span>Highlights & Ingredients</span>
                                </div>
                                <div className="space-y-2 text-xs text-gray-700 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                  {p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1">
                                      {p.highlights.map((hl, hIdx) => (
                                        <li key={hIdx} className="text-gray-700 font-medium">{hl}</li>
                                      ))}
                                    </ul>
                                  ) : p.highlights && typeof p.highlights === 'string' ? (
                                    <p className="whitespace-pre-line">{p.highlights}</p>
                                  ) : (
                                    <p className="text-gray-400 italic">No highlights recorded.</p>
                                  )}

                                  {p.ingredients && (
                                    <div className="pt-2 border-t border-gray-200">
                                      <strong className="text-gray-900 block mb-1">Ingredients:</strong>
                                      <p className="text-gray-600 text-[11px]">{typeof p.ingredients === 'object' ? (p.ingredients.fullList || JSON.stringify(p.ingredients)) : String(p.ingredients)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* EXPANDABLE CHILD VARIANTS ROW */}
                    {hasChildVariants &&
                      isExpandedVariants &&
                      variantsList.map((v, vIdx) => {
                        const vImg = v.imageUrl || v.image || p.imageUrl || p.image;
                        const vName = v.title || v.name || (v.attributes ? Object.entries(v.attributes).map(([_, val]) => val).join(' / ') : `Variant ${vIdx + 1}`);
                        const vMrp =
                          v.mrp !== undefined && v.mrp !== null && v.mrp !== ''
                            ? Number(v.mrp)
                            : p.mrp ?? 0;
                        const vOriginalMrp =
                          v.originalMrp !== undefined && v.originalMrp !== null && v.originalMrp !== ''
                            ? Number(v.originalMrp)
                            : p.originalMrp ?? vMrp;
                        const vGen =
                          v.generalPrice !== undefined && v.generalPrice !== null && v.generalPrice !== ''
                            ? Number(v.generalPrice)
                            : (v.general_price ?? p.generalPrice ?? vMrp);
                        const vSalon =
                          v.salonPrice !== undefined && v.salonPrice !== null && v.salonPrice !== ''
                            ? Number(v.salonPrice)
                            : (v.salon_price ?? p.salonPrice ?? vGen);
                        const vArtist =
                          v.artistPrice !== undefined && v.artistPrice !== null && v.artistPrice !== ''
                            ? Number(v.artistPrice)
                            : (v.artist_price ?? p.artistPrice ?? vSalon);
                        const vBeautician =
                          v.beauticianPrice !== undefined &&
                          v.beauticianPrice !== null &&
                          v.beauticianPrice !== ''
                            ? Number(v.beauticianPrice)
                            : (v.beautician_price ?? p.beauticianPrice ?? vSalon);

                        const attrEntries = v.attributes ? Object.entries(v.attributes) : [];

                        return (
                          <tr
                            key={v.id || `${p.id}_var_${vIdx}`}
                            className="bg-[#FFF9FB]/70 hover:bg-[#FFF2F5] border-b border-pink-100/60 transition-colors"
                          >
                            {/* 1. Child Variant Thumbnail */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-pink-200 flex items-center justify-center mx-auto shadow-2xs">
                                {vImg ? (
                                  <img src={vImg} alt={vName} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-pink-300" />
                                )}
                              </div>
                            </td>

                            {/* 2. Child Variant Name, Swatches, Attributes */}
                            <td className="py-2.5 px-4">
                              <div className="pl-3 flex flex-col gap-0.5 border-l-2 border-pink-300/80 ml-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[#C2477A] font-bold text-xs">↳</span>
                                  {v.hexColor && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-gray-300 shrink-0 shadow-2xs"
                                      style={{ backgroundColor: v.hexColor }}
                                      title={v.hexColor}
                                    />
                                  )}
                                  <span className="font-extrabold text-xs text-gray-900">{vName}</span>
                                  {v.code && (
                                    <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                      {v.code}
                                    </span>
                                  )}
                                  {attrEntries.map(([k, valStr]) => (
                                    <span
                                      key={k}
                                      className="text-[9.5px] font-bold text-gray-700 bg-white px-1.5 py-0.2 rounded border border-pink-100 shadow-2xs"
                                    >
                                      {k}: <span className="text-[#C2477A]">{valStr}</span>
                                    </span>
                                  ))}
                                  <span className="text-[9px] font-bold text-[#C2477A] bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200">
                                    Variant
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                                  {v.sku && (
                                    <span className="font-mono bg-white px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">
                                      SKU: <span className="font-bold text-gray-800">{v.sku}</span>
                                    </span>
                                  )}
                                  {v.barcode && (
                                    <span className="font-mono bg-white px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 flex items-center gap-1">
                                      <Barcode size={10} className="text-[#C2477A]" />
                                      <span className="font-bold text-gray-800">{v.barcode}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 3. Barcode */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {v.barcode ? (
                                <span className="font-mono bg-white px-2 py-0.5 rounded text-gray-700 border border-gray-200 text-[10.5px] font-bold inline-flex items-center gap-1 shadow-2xs">
                                  <Barcode size={10} className="text-[#C2477A]" />
                                  <span>{v.barcode}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10.5px] italic">—</span>
                              )}
                            </td>

                            {/* 4. Brand */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-xs font-semibold text-gray-500">
                              {p.brandName || brands?.find(b => b.id === p.brandId)?.name || '—'}
                            </td>

                            {/* 6. Original MRP */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <span className="font-semibold text-gray-400 line-through bg-white px-2 py-0.5 rounded border border-gray-200 text-xs inline-block min-w-[60px] text-right shadow-2xs">
                                ₹{vOriginalMrp}
                              </span>
                            </td>

                            {/* 7. General MRP */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <span className="font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs inline-block min-w-[60px] text-right shadow-2xs">
                                ₹{vGen}
                              </span>
                            </td>

                            {/* 8. Salon Price */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <span className="font-extrabold text-[#C2477A] bg-[#FFF5F8] px-2 py-0.5 rounded border border-pink-200 text-xs inline-block min-w-[60px] text-right shadow-2xs">
                                ₹{vSalon}
                              </span>
                            </td>

                            {/* 9. Artist Price */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <span className="font-extrabold text-purple-700 bg-purple-50/70 px-2 py-0.5 rounded border border-purple-200 text-xs inline-block min-w-[60px] text-right shadow-2xs">
                                ₹{vArtist}
                              </span>
                            </td>

                            {/* 10. Beautician Price */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <span className="font-extrabold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 text-xs inline-block min-w-[60px] text-right shadow-2xs">
                                ₹{vBeautician}
                              </span>
                            </td>

                            {/* 11. Actions */}
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductShadesPanel(p)}
                                  className="text-[10.5px] font-bold text-[#C2477A] hover:text-[#b83760] bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-xl border border-pink-200 transition-all cursor-pointer shadow-2xs"
                                >
                                  Edit Variant
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteProduct(p, v)}
                                  className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-2 py-1 rounded-xl font-bold flex items-center gap-1 border border-rose-200 transition-all text-[10.5px] cursor-pointer shadow-2xs"
                                  title="Delete this variant"
                                  aria-label={`Delete variant ${v?.name || ''}`}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {/* EXPANDABLE QUANTITY DISCOUNT TIERS PANEL */}
                    {editingTiersProductId === p.id && (
                      <tr key={p.id + '_tiers_panel'} className="bg-amber-50/40 border-y-2 border-pink-200">
                        <td colSpan={11} className="p-4 sm:p-5">
                          <RoleQuantityTiersManager
                            tiers={productTiersLocal}
                            onChange={setProductTiersLocal}
                            product={p}
                            isSaving={isSavingTiers}
                            onSave={() => handleSaveProductTiers(p.id)}
                            saveSuccess={tiersSaveSuccess}
                            showSaveButton={true}
                            allowClose={true}
                            onClose={() => setEditingTiersProductId(null)}
                            title={`Quantity Discount Tiers: ${p.name}`}
                            subtitle="General User, Salon Owner, Makeup Artist, and Beautician have completely independent quantity tiers, discount percentages, and final prices."
                          />
                        </td>
                      </tr>
                    )}

                    {/* EXPANDABLE SHADE / COLOR VARIANT MANAGER PANEL */}
                    {editingShadeProductId === p.id && (
                      <tr key={p.id + '_shades_panel'} className="bg-[#FFF5F8]/40 border-y-2 border-[#FCE4EC]">
                        <td colSpan={11} className="p-4 sm:p-5">
                          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-sm p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FCE4EC]">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#C2477A] flex items-center justify-center font-bold">
                                    <Layers size={16} />
                                  </span>
                                  <h4 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                                    Product Variants & Pricing: {p.name}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                  Every variant is an independent purchasable item with its own MRP, role prices, and multi-tier quantity discounts.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveProductShades(p.id)}
                                  disabled={isSavingShades}
                                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                                    shadesSaveSuccess
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#C2477A] hover:bg-[#9E2D5B] text-white cursor-pointer active:scale-95'
                                  }`}
                                >
                                  {shadesSaveSuccess ? (
                                    <>
                                      <CheckCircle2 size={13} />
                                      <span>Saved!</span>
                                    </>
                                  ) : isSavingShades ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" />
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save size={13} />
                                      <span>Save Variants</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingShadeProductId(null)}
                                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </div>

                            {/* Variants Table */}
                            <div className="overflow-x-auto rounded-2xl border border-[#FCE4EC]">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#FFF5F8] text-gray-800 uppercase font-black text-[10px] tracking-wider border-b border-[#FCE4EC]">
                                  <tr>
                                    <th className="py-2.5 px-3">Variant / Attributes</th>
                                    <th className="py-2.5 px-3">MRP (General)</th>
                                    <th className="py-2.5 px-3">Salon Price</th>
                                    <th className="py-2.5 px-3">Artist Price</th>
                                    <th className="py-2.5 px-3">Beautician Price</th>
                                    <th className="py-2.5 px-3 text-center">Qty Tiers</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {productShadesLocal.length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="py-6 text-center text-gray-400 font-medium text-xs">
                                        No variants configured for this product yet. Add a variant below.
                                      </td>
                                    </tr>
                                  ) : (
                                    productShadesLocal.map((shade, sIdx) => {
                                      const shadeMrp =
                                        shade.mrp !== undefined && shade.mrp !== ''
                                          ? shade.mrp
                                          : shade.priceOverride || p.mrp || 0;
                                      const shadeSalon =
                                        shade.salonPrice !== undefined && shade.salonPrice !== ''
                                          ? shade.salonPrice
                                          : p.salonPrice;
                                      const shadeArtist =
                                        shade.artistPrice !== undefined && shade.artistPrice !== ''
                                          ? shade.artistPrice
                                          : p.artistPrice;
                                      const shadeBeautician =
                                        shade.beauticianPrice !== undefined && shade.beauticianPrice !== ''
                                          ? shade.beauticianPrice
                                          : p.beauticianPrice;
                                      const tiersCount = getTotalQuantityTiersCount
                                        ? getTotalQuantityTiersCount(shade.quantityTiers)
                                        : 0;

                                      const isColor = Boolean(
                                        shade.hexColor &&
                                        ((shade.attributes && Object.keys(shade.attributes).some(k => /shade|color|colour/i.test(k))) ||
                                         /makeup|lipstick|lip|nail|foundation/i.test(p.category || ''))
                                      );

                                      return (
                                        <tr key={shade.id || sIdx} className="hover:bg-[#FFF5F8]/40 transition-colors">
                                          <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                              {isColor ? (
                                                <span
                                                  className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                                                  style={{ background: shade.hexColor || '#C2477A' }}
                                                />
                                              ) : shade.image ? (
                                                <img src={shade.image} alt={shade.name} className="w-5 h-5 rounded-md object-cover border border-pink-100 shrink-0" />
                                              ) : (
                                                <span className="w-5 h-5 rounded-md bg-pink-100 text-[#C2477A] flex items-center justify-center text-[10px] font-bold shrink-0">
                                                  #{sIdx + 1}
                                                </span>
                                              )}
                                              <div>
                                                <span className="font-extrabold text-gray-900">{shade.name}</span>
                                                {shade.attributes && Object.keys(shade.attributes).length > 0 && (
                                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {Object.entries(shade.attributes).map(([ak, av]) => (
                                                      <span key={ak} className="px-1.5 py-0.2 rounded bg-pink-50 text-[#C2477A] text-[9.5px] font-semibold border border-pink-100">
                                                        {ak}: {av}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-3 font-semibold text-gray-800">₹{shadeMrp}</td>
                                          <td className="py-3 px-3 font-extrabold text-[#C2477A]">₹{shadeSalon}</td>
                                          <td className="py-3 px-3 font-extrabold text-purple-700">₹{shadeArtist}</td>
                                          <td className="py-3 px-3 font-extrabold text-indigo-700">₹{shadeBeautician}</td>
                                          <td className="py-3 px-3 text-center">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                tiersCount > 0
                                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                  : 'bg-gray-100 text-gray-500'
                                              }`}
                                            >
                                              <BadgePercent size={10} />
                                              <span>{tiersCount} Tiers</span>
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenShadePricing(shade, p, 'catalog')}
                                                className="px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-[#C2477A] text-[#C2477A] hover:text-white font-bold text-[11px] border border-pink-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                              >
                                                <BadgePercent size={11} />
                                                <span>Pricing & Tiers</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (confirm(`Remove variant "${shade.name}"?`)) {
                                                    setProductShadesLocal((prev) => prev.filter((_, i) => i !== sIdx));
                                                  }
                                                }}
                                                className="w-7 h-7 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer"
                                                title="Delete variant"
                                                aria-label="Delete variant"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Quick Add Variant Row */}
                            <div className="p-3 bg-[#FFF5F8]/50 rounded-2xl border border-[#FCE4EC] flex flex-wrap items-center gap-2.5">
                              <span className="text-xs font-black text-gray-800 shrink-0">Add Variant:</span>
                              <input
                                type="text"
                                placeholder="Variant Name (e.g. 50ml, Velvet Rose)"
                                value={shadeFormDraft.name}
                                onChange={(e) => setShadeFormDraft((prev) => ({ ...prev, name: e.target.value }))}
                                className="flex-1 min-w-[140px] p-2 rounded-xl border border-pink-200 bg-white text-xs font-semibold outline-none focus:border-[#C2477A]"
                              />
                              {Boolean(
                                /makeup|lipstick|lip|nail|eyeshadow|blush|foundation/i.test(p.category || '') ||
                                productShadesLocal.some(s => s.attributes && Object.keys(s.attributes).some(k => /shade|color|colour/i.test(k)))
                              ) && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={shadeFormDraft.hexColor}
                                    onChange={(e) => {
                                      const hex = e.target.value;
                                      const autoName = getBeautyShadeName ? getBeautyShadeName(hex) : '';
                                      setShadeFormDraft((prev) => ({
                                        ...prev,
                                        hexColor: hex,
                                        name: autoName || prev.name
                                      }));
                                    }}
                                    className="w-8 h-8 rounded-xl border border-pink-200 cursor-pointer p-0.5"
                                  />
                                  <input
                                    type="text"
                                    placeholder="#HEX"
                                    value={shadeFormDraft.hexColor}
                                    onChange={(e) => setShadeFormDraft((prev) => ({ ...prev, hexColor: e.target.value }))}
                                    className="w-20 p-2 rounded-xl border border-pink-200 bg-white font-mono text-[10px] font-bold text-gray-700 outline-none"
                                  />
                                </div>
                              )}
                              <input
                                type="number"
                                placeholder="MRP (₹)"
                                value={shadeFormDraft.priceOverride}
                                onChange={(e) =>
                                  setShadeFormDraft((prev) => ({ ...prev, priceOverride: e.target.value }))
                                }
                                className="w-20 p-2 rounded-xl border border-pink-200 bg-white text-xs font-bold outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!shadeFormDraft.name.trim()) return;
                                  const newShade = {
                                    id: 'shade_' + Date.now(),
                                    name: shadeFormDraft.name.trim(),
                                    hexColor: shadeFormDraft.hexColor || '#C2477A',
                                    mrp: shadeFormDraft.priceOverride
                                      ? Number(shadeFormDraft.priceOverride)
                                      : Number(p.mrp || 0),
                                    generalPrice: shadeFormDraft.priceOverride
                                      ? Number(shadeFormDraft.priceOverride)
                                      : Number(p.mrp || 0),
                                    salonPrice: Number(p.salonPrice || 0),
                                    artistPrice: Number(p.artistPrice || 0),
                                    beauticianPrice: Number(p.beauticianPrice || 0),
                                    priceOverride: shadeFormDraft.priceOverride
                                      ? Number(shadeFormDraft.priceOverride)
                                      : null,
                                    active: true,
                                    quantityTiers: getDefaultQuantityTiers ? getDefaultQuantityTiers() : {}
                                  };
                                  setProductShadesLocal((prev) => [...prev, newShade]);
                                  setShadeFormDraft({
                                    name: '',
                                    hexColor: '#C2477A',
                                    priceOverride: '',
                                    active: true
                                  });
                                }}
                                className="px-4 py-2 bg-[#C2477A] hover:bg-[#9E2D5B] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
                              >
                                <Plus size={14} />
                                <span>Add Variant</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* EXPANDABLE GENERATED DISCOVERY PANEL */}
                    {editingRichDataProductId === p.id && (
                      <tr key={p.id + '_rich_panel'} className="bg-indigo-50/30 border-y-2 border-indigo-100">
                        <td colSpan={11} className="p-0">
                          <GeneratedDataPanel
                            product={p}
                            onSave={async (patch) => {
                              if (updateProduct) await updateProduct(p.id, patch);
                            }}
                            onClose={() => setEditingRichDataProductId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Bar */}
      <div className="bg-[#FFF9FB] px-5 py-3.5 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Rows per page:</span>
            <select
              value={productRecordsPerPage}
              onChange={(e) => {
                setProductRecordsPerPage(Number(e.target.value));
                setProductCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-pink-200 bg-white text-gray-800 font-bold outline-none cursor-pointer focus:border-[#C2477A] shadow-2xs"
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span className="text-gray-300">|</span>

          <span>
            Showing{' '}
            <strong className="text-gray-900 font-bold">
              {filteredProducts.length === 0 ? 0 : productStartIndex + 1}
            </strong>
            {' - '}
            <strong className="text-gray-900 font-bold">
              {Math.min(productStartIndex + productRecordsPerPage, filteredProducts.length)}
            </strong>
            {' of '}
            <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> items
          </span>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setProductCurrentPage((p) => Math.max(1, p - 1))}
            disabled={productCurrentPage <= 1}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              productCurrentPage <= 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
            }`}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={15} />
          </button>

          {Array.from({ length: totalProductPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalProductPages <= 5) return true;
              return (
                page === 1 ||
                page === totalProductPages ||
                Math.abs(page - effectiveProductPage) <= 1
              );
            })
            .map((page, idx, arr) => {
              const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                  <button
                    onClick={() => setProductCurrentPage(page)}
                    className={`min-w-[32px] h-8 px-2 rounded-xl font-bold text-xs transition-all ${
                      effectiveProductPage === page
                        ? 'bg-[#C2477A] text-white shadow-xs'
                        : 'bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 cursor-pointer shadow-2xs'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setProductCurrentPage((p) => Math.min(totalProductPages, p + 1))}
            disabled={productCurrentPage >= totalProductPages}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              productCurrentPage >= totalProductPages
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
            }`}
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* 5. COMPREHENSIVE PRODUCT DETAILS MODAL (FULL INSPECTOR) */}
      {selectedDetailModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-pink-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-pink-50 via-white to-pink-50/40 border-b border-pink-100 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C2477A] to-[#9E2D5B] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight">
                    {selectedDetailModalProduct.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Product Master Inspector · ID: <span className="font-mono font-bold text-gray-700">{selectedDetailModalProduct.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedDetailModalProduct;
                    setSelectedDetailModalProduct(null);
                    handleOpenEditProduct(p);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#C2477A] hover:bg-[#9E2D5B] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailModalProduct(null)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex items-center gap-1 px-6 pt-3 bg-white border-b border-gray-100 overflow-x-auto shrink-0">
              {[
                { id: 'overview', label: 'Overview & Pricing', icon: Tag },
                { id: 'specs', label: 'Attributes & Specs', icon: Sliders },
                { id: 'content', label: 'Description & Guide', icon: FileText },
                { id: 'variants', label: `Variants (${selectedDetailModalProduct.shades?.length || 0})`, icon: Palette },
                { id: 'gallery', label: `Gallery (${(selectedDetailModalProduct.images?.length || 1)})`, icon: ImageIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-[#C2477A] text-[#C2477A] bg-pink-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 custom-scrollbar">
              {/* TAB 1: OVERVIEW & PRICING */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Highlight Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-pink-100">
                      <span className="text-[10.5px] font-bold text-gray-500 block">Category</span>
                      <span className="font-extrabold text-sm text-[#C2477A]">{selectedDetailModalProduct.category || '—'}</span>
                    </div>
                    <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-pink-100">
                      <span className="text-[10.5px] font-bold text-gray-500 block">Subcategory</span>
                      <span className="font-extrabold text-sm text-gray-900">{selectedDetailModalProduct.subcategory || '—'}</span>
                    </div>
                    <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-pink-100">
                      <span className="text-[10.5px] font-bold text-gray-500 block">Brand</span>
                      <span className="font-extrabold text-sm text-gray-900">{selectedDetailModalProduct.brandName || brands?.find(b => b.id === selectedDetailModalProduct.brandId)?.name || '—'}</span>
                    </div>
                    <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-pink-100">
                      <span className="text-[10.5px] font-bold text-gray-500 block">Catalog Status</span>
                      <span className={`font-extrabold text-sm ${selectedDetailModalProduct.enabled !== false ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {selectedDetailModalProduct.enabled !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* 4-Role Pricing Master Table */}
                  <div className="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-2xs">
                    <div className="bg-[#FFF5F8] p-3 border-b border-pink-200 flex items-center justify-between">
                      <span className="font-black text-gray-900 uppercase text-[11px] tracking-wide">Multi-Role Pricing & Discount Architecture</span>
                      <span className="text-[10px] font-bold text-gray-500">GST: {selectedDetailModalProduct.gstPercent ?? 18}%</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-4">User Role</th>
                            <th className="py-2.5 px-4 text-right">Original MRP</th>
                            <th className="py-2.5 px-4 text-right">Final Price</th>
                            <th className="py-2.5 px-4 text-right">Discount (₹)</th>
                            <th className="py-2.5 px-4 text-right">Discount (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { role: 'General Customer', price: selectedDetailModalProduct.generalPrice ?? selectedDetailModalProduct.mrp, color: 'text-gray-900', bg: 'bg-white' },
                            { role: 'Salon Owner', price: selectedDetailModalProduct.salonPrice ?? selectedDetailModalProduct.mrp, color: 'text-[#C2477A]', bg: 'bg-pink-50/40' },
                            { role: 'Makeup Artist', price: selectedDetailModalProduct.artistPrice ?? selectedDetailModalProduct.mrp, color: 'text-purple-700', bg: 'bg-purple-50/40' },
                            { role: 'Beautician', price: selectedDetailModalProduct.beauticianPrice ?? selectedDetailModalProduct.mrp, color: 'text-indigo-700', bg: 'bg-indigo-50/40' }
                          ].map((row, rIdx) => {
                            const mrp = Number(selectedDetailModalProduct.mrp || 0);
                            const pr = Number(row.price || 0);
                            const discAmt = mrp > pr ? mrp - pr : 0;
                            const discPct = mrp > 0 && pr < mrp ? Math.round(((mrp - pr) / mrp) * 100) : 0;
                            return (
                              <tr key={rIdx} className={row.bg}>
                                <td className={`py-3 px-4 font-bold ${row.color}`}>{row.role}</td>
                                <td className="py-3 px-4 text-right font-semibold text-gray-500">₹{mrp}</td>
                                <td className={`py-3 px-4 text-right font-black ${row.color}`}>₹{pr}</td>
                                <td className="py-3 px-4 text-right font-semibold text-emerald-700">₹{discAmt}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-700">{discPct}% OFF</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTRIBUTES & SPECS */}
              {activeDetailTab === 'specs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-500 font-medium block">Barcode:</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">{selectedDetailModalProduct.barcode || '—'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-500 font-medium block">Variant Type:</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedDetailModalProduct.variantType || 'Standard'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-500 font-medium block">Size / Net Weight:</span>
                      <span className="font-bold text-blue-700 text-sm">{selectedDetailModalProduct.size || selectedDetailModalProduct.netQty || '—'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-500 font-medium block">GST Rate:</span>
                      <span className="font-bold text-amber-800 text-sm">{selectedDetailModalProduct.gstPercent ?? 18}%</span>
                    </div>
                  </div>

                  <h5 className="font-black text-gray-900 text-xs uppercase pt-2">Custom Category Attributes:</h5>
                  {selectedDetailModalProduct.attributes && typeof selectedDetailModalProduct.attributes === 'object' && Object.keys(selectedDetailModalProduct.attributes).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selectedDetailModalProduct.attributes).map(([ak, av]) => (
                        <div key={ak} className="p-2.5 bg-pink-50/40 rounded-xl border border-pink-100 flex justify-between items-center">
                          <span className="text-gray-600 font-semibold capitalize">{ak.replace(/_/g, ' ')}:</span>
                          <span className="font-bold text-gray-900">{String(av)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No custom category attributes specified.</p>
                  )}
                </div>
              )}

              {/* TAB 3: CONTENT & GUIDE */}
              {activeDetailTab === 'content' && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                    <strong className="text-gray-900 font-black uppercase block text-[11px]">Product Description:</strong>
                    <p className="text-gray-700 whitespace-pre-line">{selectedDetailModalProduct.description || 'No description entered.'}</p>
                  </div>

                  {selectedDetailModalProduct.howToUse && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                      <strong className="text-gray-900 font-black uppercase block text-[11px]">How To Use / Application:</strong>
                      <p className="text-gray-700 whitespace-pre-line">{selectedDetailModalProduct.howToUse}</p>
                    </div>
                  )}

                  {selectedDetailModalProduct.highlights && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                      <strong className="text-gray-900 font-black uppercase block text-[11px]">Product Highlights:</strong>
                      {Array.isArray(selectedDetailModalProduct.highlights) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedDetailModalProduct.highlights.map((h, i) => (
                            <li key={i} className="text-gray-700">{h}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-line">{selectedDetailModalProduct.highlights}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: VARIANTS */}
              {activeDetailTab === 'variants' && (
                <div className="space-y-4">
                  {selectedDetailModalProduct.shades && Array.isArray(selectedDetailModalProduct.shades) && selectedDetailModalProduct.shades.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-pink-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FFF5F8] text-gray-800 font-bold border-b border-pink-200">
                          <tr>
                            <th className="py-2.5 px-3">Variant</th>
                            <th className="py-2.5 px-3">Barcode</th>
                            <th className="py-2.5 px-3">MRP</th>
                            <th className="py-2.5 px-3">Salon</th>
                            <th className="py-2.5 px-3">Artist</th>
                            <th className="py-2.5 px-3">Beautician</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedDetailModalProduct.shades.map((sh, sIdx) => (
                            <tr key={sIdx} className="hover:bg-pink-50/30">
                              <td className="py-2.5 px-3 flex items-center gap-2">
                                {sh.hexColor && (
                                  <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: sh.hexColor }} />
                                )}
                                <span className="font-extrabold text-gray-900">{sh.name}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">{sh.barcode || '—'}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-800">₹{sh.mrp || sh.priceOverride || selectedDetailModalProduct.mrp}</td>
                              <td className="py-2.5 px-3 font-bold text-[#C2477A]">₹{sh.salonPrice || selectedDetailModalProduct.salonPrice}</td>
                              <td className="py-2.5 px-3 font-bold text-purple-700">₹{sh.artistPrice || selectedDetailModalProduct.artistPrice}</td>
                              <td className="py-2.5 px-3 font-bold text-indigo-700">₹{sh.beauticianPrice || selectedDetailModalProduct.beauticianPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-center py-6">No variant shades recorded for this product.</p>
                  )}
                </div>
              )}

              {/* TAB 5: GALLERY */}
              {activeDetailTab === 'gallery' && (
                <div className="space-y-4">
                  {selectedDetailModalProduct.images && Array.isArray(selectedDetailModalProduct.images) && selectedDetailModalProduct.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedDetailModalProduct.images.map((imgUrl, gIdx) => (
                        <div
                          key={gIdx}
                          onClick={() => setActiveImagePreview(imgUrl)}
                          className="h-44 rounded-2xl overflow-hidden border border-pink-200 bg-white hover:border-[#C2477A] transition-all cursor-pointer group shadow-2xs"
                        >
                          <img src={imgUrl} alt={`Gallery ${gIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-center py-6">No product gallery images uploaded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. LIGHTBOX IMAGE PREVIEW MODAL */}
      {activeImagePreview && (
        <div
          onClick={() => setActiveImagePreview(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <img src={activeImagePreview} alt="Full Preview" className="w-full h-auto max-h-[75vh] object-contain rounded-2xl" />
            <button
              type="button"
              onClick={() => setActiveImagePreview(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
              title="Close image preview"
              aria-label="Close image preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 7. EXCEL BULK PRODUCT IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        categories={adminCtx.categories || []}
        brands={adminCtx.brands || brands || []}
        existingProducts={adminCtx.products || products || []}
        onImportProducts={async (validGroups, onProgress, options) => {
          if (adminCtx.saveBulkProducts) {
            return await adminCtx.saveBulkProducts(validGroups, onProgress, options);
          }
          return { success: true };
        }}
        onExportCatalog={handleExportCatalogExcel}
      />
    </div>
  );
}

