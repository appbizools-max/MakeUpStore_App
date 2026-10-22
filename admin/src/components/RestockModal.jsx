import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Plus,
  Minus,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Layers,
  Palette,
  Barcode,
  Sparkles,
  FileText,
  RotateCcw,
  Boxes,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function RestockModal({
  isOpen,
  onClose,
  product,
  initialVariantId = null,
  onSuccess
}) {
  const { updateProductStock, adjustProductStock } = useAdmin();

  const [mode, setMode] = useState('add'); // 'add' | 'set'
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId || 'all');
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('Vendor Shipment / Restock');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVariantId(initialVariantId || (product?.shades?.length > 0 ? 'all' : null));
      setQuantity('10');
      setMode('add');
      setReason('Vendor Shipment / Restock');
      setCustomNote('');
      setErrorMsg(null);
    }
  }, [isOpen, product, initialVariantId]);

  if (!isOpen || !product) return null;

  const hasVariants = product.shades && Array.isArray(product.shades) && product.shades.length > 0;
  const currentTotalStock = Number(product.stock || 0);

  // If a specific variant is selected
  const activeVariant = hasVariants && selectedVariantId !== 'all'
    ? product.shades.find(s => (s.id || s.code || s.name) === selectedVariantId)
    : null;

  const currentActiveStock = activeVariant
    ? Number(activeVariant.stock !== undefined ? activeVariant.stock : 0)
    : currentTotalStock;

  const parsedQty = parseInt(quantity, 10) || 0;

  // Compute preview resulting stock
  let newResultingStock = currentActiveStock;
  if (mode === 'add') {
    newResultingStock = Math.max(0, currentActiveStock + parsedQty);
  } else {
    newResultingStock = Math.max(0, parsedQty);
  }

  const quickAdds = [5, 10, 25, 50, 100, 250];

  const handleQuickAdd = (num) => {
    if (mode === 'add') {
      setQuantity(String((parseInt(quantity, 10) || 0) + num));
    } else {
      setQuantity(String(num));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedQty <= 0 && mode === 'add') {
      setErrorMsg('Please enter a quantity greater than 0.');
      return;
    }
    if (parsedQty < 0 && mode === 'set') {
      setErrorMsg('Stock quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const fullReason = customNote.trim()
      ? `${reason} (${customNote.trim()})`
      : reason;

    try {
      if (hasVariants && selectedVariantId === 'all') {
        // Apply to all variants
        if (mode === 'add') {
          for (const shade of product.shades) {
            const sKey = shade.id || shade.code || shade.name;
            await adjustProductStock(product.id, parsedQty, sKey, fullReason);
          }
        } else {
          for (const shade of product.shades) {
            const sKey = shade.id || shade.code || shade.name;
            await updateProductStock(product.id, parsedQty, sKey, fullReason);
          }
        }
      } else if (hasVariants && activeVariant) {
        const sKey = activeVariant.id || activeVariant.code || activeVariant.name;
        if (mode === 'add') {
          await adjustProductStock(product.id, parsedQty, sKey, fullReason);
        } else {
          await updateProductStock(product.id, parsedQty, sKey, fullReason);
        }
      } else {
        // Standalone product
        if (mode === 'add') {
          await adjustProductStock(product.id, parsedQty, null, fullReason);
        } else {
          await updateProductStock(product.id, parsedQty, null, fullReason);
        }
      }

      if (onSuccess) {
        onSuccess({
          productId: product.id,
          productName: product.name,
          mode,
          quantity: parsedQty,
          variantName: activeVariant?.name || (selectedVariantId === 'all' ? 'All Variants' : null)
        });
      }
      onClose();
    } catch (err) {
      console.error('Restock error:', err);
      setErrorMsg(err.message || 'Failed to update stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col relative overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#FFF2F5] via-white to-pink-50/70 border-b border-pink-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C2477A] to-[#E25586] text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
              <Boxes size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight truncate">
                  Add Stock / Restock Product
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-100 text-[#C2477A] shrink-0 border border-pink-200">
                  Inventory Intake
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                Update available store units with real-time sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Identity Summary Card */}
          <div className="p-3.5 bg-[#FFF8FA] rounded-2xl border border-pink-100/90 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white border border-pink-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={22} className="text-gray-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-black text-xs text-gray-900 truncate">{product.name}</div>
              <div className="flex items-center gap-2 text-[10.5px] text-gray-500 font-semibold mt-0.5 flex-wrap">
                {product.brandName && (
                  <span className="text-[#C2477A] font-bold">{product.brandName}</span>
                )}
                {product.category && <span>• {product.category}</span>}
                {product.barcode && (
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-pink-200 text-gray-700 flex items-center gap-1">
                    <Barcode size={10} className="text-[#C2477A]" />
                    {product.barcode}
                  </span>
                )}
              </div>
            </div>

            {/* Current Stock Indicator */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Current Stock</span>
              <span
                className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-lg border mt-0.5 ${
                  currentTotalStock > 10
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentTotalStock > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {currentTotalStock} units
              </span>
            </div>
          </div>

          {/* Variant Selector (if multi-variant product) */}
          {hasVariants && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">
                Target Variant / Shade:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariantId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedVariantId === 'all'
                      ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-pink-200 hover:bg-pink-50/50'
                  }`}
                >
                  <Layers size={13} />
                  <span>All Variants ({product.shades.length})</span>
                </button>

                {product.shades.map((shade, idx) => {
                  const sKey = shade.id || shade.code || shade.name || `sh_${idx}`;
                  const isSel = selectedVariantId === sKey;
                  const sStock = Number(shade.stock !== undefined ? shade.stock : 0);

                  return (
                    <button
                      key={sKey}
                      type="button"
                      onClick={() => setSelectedVariantId(sKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                        isSel
                          ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#FCE4EC] hover:bg-[#FFF5F8]/40'
                      }`}
                    >
                      {shade.hexColor && (
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0"
                          style={{ backgroundColor: shade.hexColor }}
                        />
                      )}
                      <span className="font-bold">{shade.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSel
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sStock} in stock
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operation Mode Selector: "Add to Current (+)" vs "Set Exact (=)" */}
          <div className="grid grid-cols-2 gap-2 bg-[#FFF5F8] p-1.5 rounded-2xl border border-pink-100">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'add'
                  ? 'bg-white text-[#C2477A] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Plus size={14} className="text-[#C2477A]" />
              <span>Add to Stock (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'set'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <RotateCcw size={13} className="text-[#C2477A]" />
              <span>Set Total Count (=)</span>
            </button>
          </div>

          {/* Main Quantity Stepper & Input */}
          <div className="p-4 bg-white rounded-2xl border border-pink-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                {mode === 'add'
                  ? selectedVariantId === 'all'
                    ? 'Quantity to Add to EACH Variant:'
                    : 'Quantity to Add (+):'
                  : 'New Exact Total Stock Level:'}
              </label>
              <span className="text-[11px] text-gray-400 font-medium">Units</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(String(Math.max(1, (parseInt(quantity, 10) || 0) - 1)))}
                className="w-11 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Minus size={18} />
              </button>

              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 py-2 px-4 text-center font-black text-2xl text-gray-900 bg-pink-50/30 rounded-2xl border-2 border-pink-200 outline-none focus:border-[#C2477A] focus:bg-white transition-all shadow-inner"
              />

              <button
                type="button"
                onClick={() => setQuantity(String((parseInt(quantity, 10) || 0) + 1))}
                className="w-11 h-11 rounded-2xl bg-[#FFF2F5] hover:bg-[#C2477A] text-[#C2477A] hover:text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-pink-200"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Quick Add Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10.5px] font-bold text-gray-400 mr-1">Quick:</span>
              {quickAdds.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleQuickAdd(n)}
                  className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#C2477A] font-bold text-xs border border-pink-200/70 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  +{n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantity('0')}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-all cursor-pointer ml-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Real-time Resulting Stock Calculation Preview */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">Stock Summary After Save</span>
                <span className="text-xs text-emerald-700 font-medium">
                  {currentActiveStock} {mode === 'add' ? `+ ${parsedQty}` : `→ set to ${parsedQty}`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">New Level</span>
              <span className="text-base font-black text-emerald-950 font-mono">
                {newResultingStock} units
              </span>
            </div>
          </div>

          {/* Inward Reason & PO / Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Restock Reason / Source
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-medium text-xs text-gray-800 outline-none focus:border-[#C2477A]"
              >
                <option value="Vendor Shipment / Restock">Vendor Shipment / Restock</option>
                <option value="Physical Cycle Count">Physical Cycle Count</option>
                <option value="Customer Return">Customer Return</option>
                <option value="Store Transfer">Store Transfer</option>
                <option value="Correction / Write-in">Correction / Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                PO / Reference Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PO-8924 / Lakmé Batch 12"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-medium text-xs text-gray-800 outline-none focus:border-[#C2477A]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-pink-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#C2477A] hover:bg-[#b83760] text-white shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating Stock...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Save Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
