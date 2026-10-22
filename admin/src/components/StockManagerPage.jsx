import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Package,
  ScanBarcode,
  Search,
  Filter,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  History,
  ArrowUpDown,
  Layers,
  Palette,
  Barcode,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  Check,
  Edit2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import SearchableSelect from './SearchableSelect';
import RestockModal from './RestockModal';
import BarcodeScannerModal from './BarcodeScannerModal';

export default function StockManagerPage({ onNavigateToNewProduct }) {
  const {
    products,
    brands,
    categories,
    updateProductStock,
    adjustProductStock,
    stockAuditLogs,
    clearStockLogs,
    refreshData
  } = useAdmin();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'out' | 'low' | 'healthy'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals & Panels
  const [restockModalProduct, setRestockModalProduct] = useState(null);
  const [restockModalVariantId, setRestockModalVariantId] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());

  // Inline Quick Edit Stock State: { [productId]: { value, isSubmitting } }
  const [inlineStockEdit, setInlineStockEdit] = useState({});

  // Fast Inward Dock State
  const [dockBarcode, setDockBarcode] = useState('');
  const [dockMatchedProduct, setDockMatchedProduct] = useState(null);
  const [dockSelectedVariantId, setDockSelectedVariantId] = useState('all');
  const [dockInwardQty, setDockInwardQty] = useState('25');
  const [dockPoRef, setDockPoRef] = useState('');
  const [dockSuccessMsg, setDockSuccessMsg] = useState(null);
  const [dockIsSubmitting, setDockIsSubmitting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute Inventory KPIs
  const kpis = useMemo(() => {
    let totalUnits = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      const stock = Number(p.stock || 0);
      const price = Number(p.generalPrice || p.mrp || 0);
      totalUnits += stock;
      totalValuation += stock * price;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= 10) {
        lowStockCount++;
      } else {
        healthyCount++;
      }
    });

    return {
      totalUnits,
      outOfStockCount,
      lowStockCount,
      healthyCount,
      totalValuation,
      totalCatalogItems: products.length
    };
  }, [products]);

  // Handle Barcode Lookup in Dock
  const handleDockLookup = (code) => {
    const clean = (code || '').trim().toLowerCase();
    if (!clean) {
      setDockMatchedProduct(null);
      return;
    }

    // Search by product barcode, variant barcode, SKU, or ID
    const found = products.find((p) => {
      if ((p.barcode || '').toLowerCase() === clean) return true;
      if ((p.sku || '').toLowerCase() === clean) return true;
      if (String(p.id).toLowerCase() === clean) return true;
      if (p.shades && Array.isArray(p.shades)) {
        return p.shades.some(
          (s) =>
            (s.barcode || '').toLowerCase() === clean ||
            (s.sku || '').toLowerCase() === clean ||
            (s.code || '').toLowerCase() === clean
        );
      }
      return false;
    });

    if (found) {
      setDockMatchedProduct(found);
      // Auto-select shade if matching variant barcode
      if (found.shades && Array.isArray(found.shades)) {
        const matchingShade = found.shades.find(
          (s) =>
            (s.barcode || '').toLowerCase() === clean ||
            (s.sku || '').toLowerCase() === clean ||
            (s.code || '').toLowerCase() === clean
        );
        if (matchingShade) {
          setDockSelectedVariantId(matchingShade.id || matchingShade.code || matchingShade.name);
        } else {
          setDockSelectedVariantId('all');
        }
      } else {
        setDockSelectedVariantId(null);
      }
    } else {
      setDockMatchedProduct(null);
    }
  };

  // Submit Fast Inward from Dock
  const handleDockInwardSubmit = async (e) => {
    e.preventDefault();
    if (!dockMatchedProduct) return;
    const qty = parseInt(dockInwardQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid inward quantity greater than 0.');
      return;
    }

    setDockIsSubmitting(true);
    const reason = dockPoRef.trim()
      ? `Dock Inward: ${dockPoRef.trim()}`
      : 'Dock Barcode Inward';

    try {
      if (dockMatchedProduct.shades?.length > 0 && dockSelectedVariantId === 'all') {
        for (const shade of dockMatchedProduct.shades) {
          const sKey = shade.id || shade.code || shade.name;
          await adjustProductStock(dockMatchedProduct.id, qty, sKey, reason);
        }
      } else if (dockMatchedProduct.shades?.length > 0 && dockSelectedVariantId) {
        await adjustProductStock(dockMatchedProduct.id, qty, dockSelectedVariantId, reason);
      } else {
        await adjustProductStock(dockMatchedProduct.id, qty, null, reason);
      }

      setDockSuccessMsg(`Added +${qty} units to ${dockMatchedProduct.name}!`);
      showToast(`Successfully added +${qty} units to ${dockMatchedProduct.name}`);
      setDockBarcode('');
      setDockMatchedProduct(null);
      setDockPoRef('');
      setTimeout(() => setDockSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      showToast('Failed to inward stock: ' + err.message);
    } finally {
      setDockIsSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Stock Status Filter
      const stock = Number(p.stock || 0);
      if (stockStatusFilter === 'out' && stock !== 0) return false;
      if (stockStatusFilter === 'low' && (stock === 0 || stock > 10)) return false;
      if (stockStatusFilter === 'healthy' && stock <= 10) return false;

      // Brand Filter
      if (selectedBrand !== 'all') {
        const bName = p.brandName || brands.find((b) => b.id === p.brandId)?.name || '';
        if (bName.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        if ((p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Text Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchBrand = (p.brandName || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const matchShade = (p.shades || []).some(
          (s) =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.barcode || '').toLowerCase().includes(q) ||
            (s.sku || '').toLowerCase().includes(q)
        );
        return matchName || matchBrand || matchCat || matchBarcode || matchSku || matchShade;
      }

      return true;
    });
  }, [products, brands, stockStatusFilter, selectedBrand, selectedCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const toggleExpand = (id) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Quick 1-click Increment Handler
  const handleQuickIncrement = async (productId, deltaQty, variantId = null) => {
    try {
      await adjustProductStock(productId, deltaQty, variantId, `Quick +${deltaQty} Inward`);
      showToast(`Added +${deltaQty} units to stock!`);
    } catch (e) {
      showToast('Error updating stock: ' + e.message);
    }
  };

  // Inline Stock Edit Save
  const handleSaveInlineStock = async (productId) => {
    const entry = inlineStockEdit[productId];
    if (!entry || entry.value === undefined || entry.value === '') return;
    const num = Math.max(0, parseInt(entry.value, 10) || 0);

    setInlineStockEdit((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], isSubmitting: true }
    }));

    try {
      await updateProductStock(productId, num, null, 'Inline Stock Override');
      setInlineStockEdit((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      showToast(`Stock updated to ${num} units!`);
    } catch (e) {
      showToast('Error saving stock: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in border border-gray-800">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C2477A] to-[#E25586] text-white flex items-center justify-center font-bold shadow-xs">
              <Boxes size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-gray-900 tracking-tight flex items-center gap-2">
                <span>Stock & Inventory Manager</span>
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-pink-100 text-[#C2477A] border border-pink-200">
                  Live Operations
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Real-time stock levels, barcode inward scanning, low-stock alerts & batch restocking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <History size={15} className="text-gray-500" />
            <span>Audit History ({stockAuditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ScanBarcode size={15} />
            <span>Camera Barcode Scan</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Catalog Units */}
        <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Units In Stock
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {kpis.totalUnits.toLocaleString()}
            </span>
            <span className="text-[10.5px] text-gray-500 font-medium">
              across {kpis.totalCatalogItems} products
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
            <Package size={22} />
          </div>
        </div>

        {/* 2. Healthy Stock Items */}
        <div
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === 'healthy' ? 'all' : 'healthy');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            stockStatusFilter === 'healthy'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Healthy Stock (&gt;10)
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {kpis.healthyCount}
            </span>
            <span className="text-[10.5px] text-emerald-700 font-medium">
              {Math.round((kpis.healthyCount / (kpis.totalCatalogItems || 1)) * 100)}% of catalog
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* 3. Low Stock Alerts */}
        <div
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            stockStatusFilter === 'low'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-amber-100 hover:border-amber-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Low Stock Alert (1-10)
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {kpis.lowStockCount}
            </span>
            <span className="text-[10.5px] text-amber-700 font-medium">
              Reorder suggested
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* 4. Out of Stock Alert */}
        <div
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            stockStatusFilter === 'out'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-rose-100 hover:border-rose-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Out of Stock (0)
            </span>
            <span className="text-2xl font-black text-rose-950 mt-1 block">
              {kpis.outOfStockCount}
            </span>
            <span className="text-[10.5px] text-rose-700 font-medium">
              Immediate restock needed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-2xs">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* FAST PHYSICAL INWARD DOCK / RECEIVING TERMINAL */}
      <div className="bg-gradient-to-r from-[#FFF5F8] via-white to-pink-50/50 p-6 rounded-3xl border border-pink-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
              <ScanBarcode size={17} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">
                Receiving Dock / Fast Inward Terminal
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Scan or type product barcode or SKU for instant restock intake
              </p>
            </div>
          </div>
          {dockSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              {dockSuccessMsg}
            </span>
          )}
        </div>

        <form onSubmit={dockMatchedProduct ? handleDockInwardSubmit : (e) => { e.preventDefault(); handleDockLookup(dockBarcode); }} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* 1. Barcode / SKU input */}
            <div className="md:col-span-4 relative">
              <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-2xl border-2 border-pink-200 focus-within:border-[#C2477A] shadow-2xs transition-all">
                <Barcode size={18} className="text-[#C2477A] shrink-0" />
                <input
                  type="text"
                  placeholder="Scan or enter Barcode / SKU..."
                  value={dockBarcode}
                  onChange={(e) => {
                    setDockBarcode(e.target.value);
                    handleDockLookup(e.target.value);
                  }}
                  className="w-full bg-transparent text-xs font-mono font-bold text-gray-900 outline-none placeholder:text-gray-400"
                />
                {dockBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      setDockBarcode('');
                      setDockMatchedProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Inward Quantity Input */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-2xl border border-pink-200 shadow-2xs">
                <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Inward Qty (+):</span>
                <input
                  type="number"
                  min="1"
                  value={dockInwardQty}
                  onChange={(e) => setDockInwardQty(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-gray-900 text-center outline-none"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {[10, 25, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDockInwardQty(String(n))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-[#C2477A] hover:bg-pink-100 border border-pink-200"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. PO / Reference Note */}
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="PO / Vendor Ref (optional)"
                value={dockPoRef}
                onChange={(e) => setDockPoRef(e.target.value)}
                className="w-full bg-white px-3 py-2.5 rounded-2xl border border-pink-200 text-xs font-medium text-gray-800 outline-none focus:border-[#C2477A] shadow-2xs"
              />
            </div>

            {/* 4. Action Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={dockIsSubmitting || (!dockMatchedProduct && !dockBarcode)}
                className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs bg-[#C2477A] hover:bg-[#b83760] text-white shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {dockIsSubmitting ? (
                  <span>Saving...</span>
                ) : dockMatchedProduct ? (
                  <>
                    <Plus size={15} />
                    <span>Inward Stock</span>
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    <span>Lookup</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matched Product Preview Banner */}
          {dockMatchedProduct && (
            <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 overflow-hidden flex items-center justify-center shrink-0">
                  {dockMatchedProduct.image ? (
                    <img src={dockMatchedProduct.image} alt={dockMatchedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={16} className="text-gray-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-xs text-gray-900 truncate flex items-center gap-2">
                    <span>{dockMatchedProduct.name}</span>
                    <span className="text-[10px] text-[#C2477A] font-bold">({dockMatchedProduct.brandName || 'Brand'})</span>
                  </div>
                  <div className="text-[10.5px] text-gray-500 font-medium">
                    Current Stock: <strong className="text-gray-900">{dockMatchedProduct.stock || 0} units</strong>
                    {dockMatchedProduct.shades?.length > 0 && ` • ${dockMatchedProduct.shades.length} variants available`}
                  </div>
                </div>
              </div>

              {/* Variant Selector inside Dock if multi-variant */}
              {dockMatchedProduct.shades?.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-gray-600">Variant:</span>
                  <select
                    value={dockSelectedVariantId}
                    onChange={(e) => setDockSelectedVariantId(e.target.value)}
                    className="p-1.5 rounded-xl border border-pink-200 bg-white font-bold text-xs text-gray-800 outline-none"
                  >
                    <option value="all">All Variants (+{dockInwardQty} each)</option>
                    {dockMatchedProduct.shades.map((s, idx) => (
                      <option key={s.id || idx} value={s.id || s.code || s.name}>
                        {s.name} (Now: {s.stock || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* INVENTORY DIRECTORY TABLE CONTAINER */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100/90 shadow-sm space-y-4">
        {/* Search & Filter Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-pink-100">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#FFF5F8] p-1 rounded-2xl border border-pink-100/80 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Items', count: kpis.totalCatalogItems },
              { id: 'out', label: 'Out of Stock', count: kpis.outOfStockCount, badgeColor: 'bg-rose-500 text-white' },
              { id: 'low', label: 'Low Stock', count: kpis.lowStockCount, badgeColor: 'bg-amber-500 text-white' },
              { id: 'healthy', label: 'Healthy', count: kpis.healthyCount, badgeColor: 'bg-emerald-600 text-white' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStockStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  stockStatusFilter === tab.id
                    ? 'bg-white text-[#C2477A] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    tab.badgeColor || (stockStatusFilter === tab.id ? 'bg-pink-100 text-[#C2477A]' : 'bg-gray-200 text-gray-600')
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:max-w-xl">
            <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2 rounded-xl border border-pink-100 flex-1 min-w-[200px]">
              <Search size={14} className="text-[#C2477A] shrink-0" />
              <input
                type="text"
                placeholder="Search product, barcode, SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs outline-none text-gray-900 font-medium w-full placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="min-w-[130px]">
              <SearchableSelect
                options={['All Brands', ...brands.map((b) => b.name).filter(Boolean)]}
                value={selectedBrand === 'all' ? 'All Brands' : selectedBrand}
                onChange={(val) => {
                  setSelectedBrand(val === 'All Brands' ? 'all' : val);
                  setCurrentPage(1);
                }}
                placeholder="All Brands"
                compact={true}
              />
            </div>

            <div className="min-w-[130px]">
              <SearchableSelect
                options={['All Categories', ...categories.map((c) => c.name).filter(Boolean)]}
                value={selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val === 'All Categories' ? 'all' : val);
                  setCurrentPage(1);
                }}
                placeholder="All Categories"
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* INVENTORY TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-pink-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/90">
                <th className="py-3.5 px-3 text-center w-12">IMAGE</th>
                <th className="py-3.5 px-4 text-left">PRODUCT & BARCODE</th>
                <th className="py-3.5 px-4 text-left">BRAND</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">STOCK STATUS</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">AVAILABLE UNITS</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">QUICK INWARD</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center text-gray-500">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-sm text-gray-700">No inventory products found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Adjust your filters, search term, or add new products.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const stock = Number(p.stock || 0);
                  const hasVariants = p.shades && Array.isArray(p.shades) && p.shades.length > 0;
                  const isExpanded = expandedProductIds.has(p.id);
                  const isInlineEditing = inlineStockEdit[p.id] !== undefined;

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} /> In Stock
                    </span>
                  );
                  if (stock === 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <AlertCircle size={11} /> Out of Stock
                      </span>
                    );
                  } else if (stock <= 10) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle size={11} /> Low Stock
                      </span>
                    );
                  }

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={`transition-colors ${
                          idx % 2 === 1 ? 'bg-[#FFF2F5]/40 hover:bg-[#FFF5F8]' : 'bg-white hover:bg-[#FFF2F5]/20'
                        }`}
                      >
                        {/* 1. Image */}
                        <td className="py-3 px-3 text-center">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto shadow-2xs">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={16} className="text-gray-300" />
                            )}
                          </div>
                        </td>

                        {/* 2. Product Name, Barcode & Variants Tag */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5 flex-wrap">
                              <span>{p.name}</span>
                              {hasVariants && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(p.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                                    isExpanded
                                      ? 'bg-[#C2477A] text-white border-[#C2477A]'
                                      : 'bg-pink-50 text-[#C2477A] border-pink-200 hover:bg-pink-100'
                                  }`}
                                >
                                  <ChevronDown size={11} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  <span>{p.shades.length} Shades</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 flex-wrap">
                              {p.barcode && (
                                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                                  <Barcode size={10} className="text-[#C2477A]" />
                                  <span>{p.barcode}</span>
                                </span>
                              )}
                              {p.category && (
                                <span className="bg-pink-50 text-[#C2477A] px-1.5 py-0.5 rounded font-semibold border border-pink-100">
                                  {p.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Brand */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-gray-700">
                          {p.brandName || brands.find((b) => b.id === p.brandId)?.name || '—'}
                        </td>

                        {/* 4. Stock Status Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {statusBadge}
                        </td>

                        {/* 5. Units & Inline Editor */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isInlineEditing ? (
                            <div className="inline-flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-[#C2477A] shadow-xs">
                              <input
                                type="number"
                                min="0"
                                value={inlineStockEdit[p.id]?.value ?? stock}
                                onChange={(e) =>
                                  setInlineStockEdit((prev) => ({
                                    ...prev,
                                    [p.id]: { value: e.target.value }
                                  }))
                                }
                                className="w-16 text-center text-xs font-black text-gray-900 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineStock(p.id)}
                                disabled={inlineStockEdit[p.id]?.isSubmitting}
                                className="w-6 h-6 rounded-lg bg-[#C2477A] text-white flex items-center justify-center hover:bg-[#b83760] transition-colors cursor-pointer"
                                title="Save Stock"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineStockEdit((prev) => {
                                    const next = { ...prev };
                                    delete next[p.id];
                                    return next;
                                  });
                                }}
                                className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 group">
                              <span className="font-mono font-black text-sm text-gray-900 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                                {stock} units
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setInlineStockEdit((prev) => ({
                                    ...prev,
                                    [p.id]: { value: String(stock) }
                                  }))
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-[#C2477A] cursor-pointer"
                                title="Click to edit stock level directly"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 6. Quick Inward Buttons */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {[5, 10, 25, 50].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => handleQuickIncrement(p.id, n)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FFF2F5] hover:bg-[#C2477A] text-[#C2477A] hover:text-white border border-pink-200/80 transition-all active:scale-90 cursor-pointer shadow-2xs"
                                title={`Add +${n} to available stock`}
                              >
                                +{n}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setRestockModalProduct(p);
                              setRestockModalVariantId(null);
                            }}
                            className="bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 ml-auto transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Add Stock</span>
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE VARIANT ROWS */}
                      {hasVariants && isExpanded && (
                        p.shades.map((v, vIdx) => {
                          const vStock = Number(v.stock !== undefined ? v.stock : 0);
                          const vKey = v.id || v.code || v.name || `${p.id}_var_${vIdx}`;

                          return (
                            <tr
                              key={vKey}
                              className="bg-[#FFF5F8]/20 hover:bg-[#FFF5F8]/40 border-b border-[#FCE4EC]/60 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center">
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-[#FCE4EC] flex items-center justify-center mx-auto shadow-2xs">
                                  {v.image || p.image ? (
                                    <img src={v.image || p.image} alt={v.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Palette size={13} className="text-[#C2477A]" />
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-4">
                                <div className="pl-3 border-l-2 border-[#F8B4CB] ml-1 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[#C2477A] font-bold text-xs">↳</span>
                                    {v.hexColor && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                                        style={{ backgroundColor: v.hexColor }}
                                      />
                                    )}
                                    <span className="font-bold text-xs text-gray-900">{v.name}</span>
                                    {v.code && (
                                      <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-1 rounded">
                                        {v.code}
                                      </span>
                                    )}
                                  </div>

                                  {v.barcode && (
                                    <span className="font-mono text-[9.5px] text-gray-500 flex items-center gap-1">
                                      <Barcode size={9} className="text-[#C2477A]" />
                                      {v.barcode}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-4 text-xs font-semibold text-gray-400">
                                Variant
                              </td>

                              <td className="py-2.5 px-4 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                                    vStock > 10
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : vStock > 0
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {vStock > 0 ? `${vStock} in stock` : 'Out of stock'}
                                </span>
                              </td>

                              <td className="py-2.5 px-4 text-center font-mono font-bold text-xs text-gray-800">
                                {vStock} units
                              </td>

                              <td className="py-2.5 px-4 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  {[5, 10, 25].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => handleQuickIncrement(p.id, n, vKey)}
                                      className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-white hover:bg-[#C2477A] text-black hover:text-white border border-[#FCE4EC] shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    >
                                      +{n}
                                    </button>
                                  ))}
                                </div>
                              </td>

                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRestockModalProduct(p);
                                    setRestockModalVariantId(vKey);
                                  }}
                                  className="text-[10px] font-bold bg-[#FFF5F8] hover:bg-[#C2477A] text-black hover:text-white px-2.5 py-1 rounded-xl border border-[#FCE4EC] transition-all cursor-pointer shadow-2xs"
                                >
                                  Restock Variant
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-pink-100 text-xs">
            <span className="text-gray-500 font-medium">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-bold text-gray-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESTOCK MODAL */}
      {restockModalProduct && (
        <RestockModal
          isOpen={Boolean(restockModalProduct)}
          onClose={() => {
            setRestockModalProduct(null);
            setRestockModalVariantId(null);
          }}
          product={restockModalProduct}
          initialVariantId={restockModalVariantId}
          onSuccess={({ productName, quantity, mode }) => {
            showToast(
              mode === 'add'
                ? `Added +${quantity} units to ${productName}`
                : `Set stock for ${productName} to ${quantity} units`
            );
          }}
        />
      )}

      {/* CAMERA BARCODE SCANNER MODAL */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          mode="search"
          onSelectBarcode={(code) => {
            setIsScannerOpen(false);
            setDockBarcode(code);
            handleDockLookup(code);
            showToast(`Scanned barcode: ${code}`);
          }}
          onScanSuccess={(code) => {
            setIsScannerOpen(false);
            setDockBarcode(code);
            handleDockLookup(code);
            showToast(`Scanned barcode: ${code}`);
          }}
          title="Scan Physical Inventory Barcode"
        />
      )}

      {/* STOCK AUDIT HISTORY DRAWER / MODAL */}
      {isHistoryOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHistoryOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
        >
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col relative overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-gray-50 via-white to-pink-50/50 border-b border-pink-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold shadow-xs">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Stock Adjustment Audit History
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Complete timestamped log of inventory inwards, manual overrides & sales deductions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {stockAuditLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all stock audit history logs?')) {
                        clearStockLogs();
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {stockAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <History size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-gray-600">No stock adjustments logged yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Any stock additions, restocks, or deductions will be tracked here.
                  </p>
                </div>
              ) : (
                stockAuditLogs.map((log) => {
                  const isPositive = (log.changeQty || 0) >= 0;

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-gray-50/70 hover:bg-pink-50/30 rounded-2xl border border-gray-200/70 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-gray-900 truncate flex items-center gap-2">
                          <span>{log.productName || 'Catalog Product'}</span>
                          {log.variantName && (
                            <span className="text-[10px] text-black bg-[#FFF5F8] px-2 py-0.2 rounded-full font-bold border border-[#FCE4EC]">
                              {log.variantName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{log.reason || 'Restock'}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black font-mono text-sm px-2 py-0.5 rounded-lg ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPositive ? `+${log.changeQty}` : log.changeQty} units
                        </span>
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {log.prevStock} → <strong className="text-gray-800">{log.newStock}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
