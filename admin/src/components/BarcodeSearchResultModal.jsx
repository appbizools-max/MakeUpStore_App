import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Package,
  Edit,
  Eye,
  PlusCircle,
  RefreshCw,
  Loader2,
  Layers,
  Palette,
  ChevronDown,
  ScanBarcode
} from 'lucide-react';

/**
 * BarcodeSearchResultModal
 * Shown immediately after Admin scans a barcode from the Products page.
 *
 * States:
 *   isSearching=true  → LOADING spinner
 *   searchError       → ERROR banner
 *   searchResult.exists && product → FOUND card with image, pricing, shades, actions
 *   searchResult && !exists        → NOT FOUND with Add New Product CTA
 */
export default function BarcodeSearchResultModal({
  isOpen,
  onClose,
  barcode = '',
  barcodeFormat = 'Standard Barcode',
  searchResult = null,
  isSearching = false,
  searchError = null,
  onViewProduct,
  onEditProduct,
  onAddProduct,
  onScanAgain,
  brands = []
}) {
  const [showAllShades, setShowAllShades] = useState(false);

  useEffect(() => {
    if (!isOpen) setShowAllShades(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const product = searchResult?.product || searchResult?.parentProduct || null;
  const isVariantMatch = searchResult?.isVariantMatch || false;
  const matchedVariant = searchResult?.matchedVariant || null;
  const isFound = !!(searchResult?.exists && product);

  const shades = Array.isArray(product?.shades) ? product.shades : [];
  const visibleShades = showAllShades ? shades : shades.slice(0, 4);
  const hasMoreShades = shades.length > 4 && !showAllShades;

  const statusIsActive = !product?.status || product.status === 'published' || product.status === 'active';
  const brand = product
    ? (product.brandName || brands?.find(b => b.id === product.brandId)?.name || product.brand_name || '—')
    : '—';

  const mrp = product?.mrp ?? 0;
  const generalPrice = product?.generalPrice ?? product?.general_price ?? mrp;
  const salonPrice = product?.salonPrice ?? product?.salon_price ?? mrp;
  const artistPrice = product?.artistPrice ?? product?.artist_price ?? mrp;
  const beauticianPrice = product?.beauticianPrice ?? product?.beautician_price ?? mrp;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-fade-in my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100 bg-[#FFF2F5]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#CE4270] text-white flex items-center justify-center shadow-xs">
              <ScanBarcode size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Barcode Scan Result</h3>
              <p className="text-[11px] text-gray-500 font-medium">Real-time Supabase catalog lookup</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer border border-pink-100 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Scanned Barcode Badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
            <Barcode size={16} className="text-[#CE4270] shrink-0" />
            <span className="font-mono font-black text-gray-900 text-sm tracking-wider flex-1 break-all">{barcode}</span>
            <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{barcodeFormat}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 pt-3 space-y-4">

          {/* ── LOADING ── */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center">
                <Loader2 size={26} className="animate-spin text-[#CE4270]" />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-sm text-gray-900">Searching Catalog...</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Querying live Supabase database</p>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {!isSearching && searchError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-amber-900 uppercase tracking-wider">Lookup Failed</p>
                  <p className="text-[11px] text-amber-800 font-medium mt-1">{searchError}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1 border-t border-amber-100">
                <button type="button" onClick={onScanAgain}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                  <RefreshCw size={13} /> Scan Again
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-800 font-bold text-xs cursor-pointer transition-all hover:bg-amber-50">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── FOUND ── */}
          {!isSearching && !searchError && isFound && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                  {isVariantMatch ? 'Variant barcode matched — parent product found' : 'Product Found in Catalog'}
                </span>
              </div>

              <div className="rounded-2xl border border-pink-100 overflow-hidden">
                {/* Product header */}
                <div className="flex items-start gap-3 p-4 bg-[#FFF8FA]">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 shadow-xs">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <Package size={24} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{product.name}</h4>
                      {statusIsActive
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9.5px] font-bold shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9.5px] font-bold shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive</span>
                      }
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] text-[#CE4270] font-bold">{brand}</span>
                      {product.category && (
                        <><span className="text-gray-300">&bull;</span><span className="text-[11px] text-gray-500 font-medium">{product.category}</span></>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-mono text-[10px] font-bold">
                        <Barcode size={10} className="text-[#CE4270]" />
                        {product.barcode || barcode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-pink-100" />

                {/* Variant match info */}
                {isVariantMatch && matchedVariant && (
                  <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                    <Layers size={13} className="text-purple-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-purple-900">Variant Match: </span>
                      <span className="text-[11px] text-purple-700 font-medium">{matchedVariant.name}</span>
                      {matchedVariant.hexColor && (
                        <span className="inline-block w-3 h-3 rounded-full border border-white shadow-xs ml-1.5 align-middle"
                          style={{ backgroundColor: matchedVariant.hexColor }} />
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">{matchedVariant.barcode}</span>
                  </div>
                )}

                {/* Pricing */}
                <div className="p-4 space-y-3">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Pricing</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Original MRP</div>
                      <div className="font-black text-base text-gray-900 mt-0.5">&#8377;{mrp}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">General MRP</div>
                      <div className="font-black text-base text-gray-800 mt-0.5">&#8377;{generalPrice}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Salon', value: salonPrice, cls: 'text-[#CE4270] bg-[#FFF5F8] border-pink-100' },
                      { label: 'Artist', value: artistPrice, cls: 'text-purple-700 bg-purple-50 border-purple-100' },
                      { label: 'Beautician', value: beauticianPrice, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={'rounded-xl p-2.5 border ' + cls.split(' ').slice(1).join(' ')}>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</div>
                        <div className={'font-black text-sm mt-0.5 ' + cls.split(' ')[0]}>&#8377;{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shades */}
                {shades.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-pink-100 pt-3 space-y-2">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette size={11} className="text-[#CE4270]" />
                        Shades / Variants ({shades.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {visibleShades.map((shade, idx) => (
                          <div key={shade.id || idx}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10.5px] font-medium text-gray-800">
                            {shade.hexColor && (
                              <span className="w-3 h-3 rounded-full border border-white shadow-xs shrink-0"
                                style={{ backgroundColor: shade.hexColor }} />
                            )}
                            <span>{shade.name}</span>
                          </div>
                        ))}
                        {hasMoreShades && (
                          <button type="button" onClick={() => setShowAllShades(true)}
                            className="px-2.5 py-1 rounded-lg bg-pink-50 text-[#CE4270] text-[10.5px] font-bold border border-pink-200 cursor-pointer hover:bg-pink-100 transition-all flex items-center gap-1">
                            +{shades.length - 4} more <ChevronDown size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button type="button" onClick={() => { onViewProduct && onViewProduct(product); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFF2F5] hover:bg-[#CE4270] text-[#CE4270] hover:text-white border border-pink-200 font-bold text-xs cursor-pointer transition-all active:scale-[0.98]">
                  <Eye size={14} />
                  <span>View in Catalog</span>
                </button>
                <button type="button" onClick={() => { onEditProduct && onEditProduct(product); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#CE4270] hover:bg-[#b83760] text-white font-bold text-xs cursor-pointer transition-all shadow-xs active:scale-[0.98]">
                  <Edit size={14} />
                  <span>Edit Product</span>
                </button>
              </div>
              <button type="button" onClick={onScanAgain}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs cursor-pointer transition-all">
                <RefreshCw size={13} /> Scan Another Barcode
              </button>
            </div>
          )}

          {/* ── NOT FOUND ── */}
          {!isSearching && !searchError && searchResult && !isFound && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">No Product Found</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    This barcode is not registered in the Salbeau catalog.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-xs shrink-0">
                    <Package size={22} className="text-gray-300" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Unregistered Barcode</div>
                    <div className="font-mono font-black text-base text-gray-700 tracking-wider mt-0.5">{barcode}</div>
                    <div className="text-[10.5px] text-gray-500 font-medium">{barcodeFormat}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200/80 text-[11px] text-gray-600 font-medium leading-relaxed">
                  Would you like to create a new product with this barcode? The scanned barcode will be automatically filled in the Add Product form.
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { onAddProduct && onAddProduct(barcode, barcodeFormat); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs cursor-pointer transition-all shadow-xs active:scale-[0.98]">
                  <PlusCircle size={15} />
                  <span>Add New Product</span>
                </button>
                <button type="button" onClick={onScanAgain}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5">
                  <RefreshCw size={13} /> Scan Again
                </button>
              </div>
              <button type="button" onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs cursor-pointer transition-all">
                Close
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        {!isSearching && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 text-[11px] text-gray-400 font-medium flex items-center gap-2">
            <ScanBarcode size={12} className="text-[#CE4270]" />
            <span>Live Supabase lookup — includes product &amp; variant barcodes</span>
          </div>
        )}
      </div>
    </div>
  );
}