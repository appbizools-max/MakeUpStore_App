import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Globe,
  Check,
  X,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
  Layers,
  Palette,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { lookupBarcodeData, detectBarcodeFormat } from '../services/barcodeLookupService';
import { searchBeautyImages } from '../services/imageSearchService';
import { matchBeautyShade } from '../services/aiColorService';

export const BrowseConsoleModal = ({
  isOpen,
  onClose,
  initialQuery = '',
  initialBarcode = '',
  categories = [],
  brands = [],
  onApplyProduct
}) => {
  if (!isOpen) return null;

  const [barcodeInput, setBarcodeInput] = useState(initialBarcode || '');
  const [productQuery, setProductQuery] = useState(initialQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [onlineImages, setOnlineImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');

  const [extractedData, setExtractedData] = useState({
    name: '',
    brand: '',
    category: 'Makeup',
    subcategory: '',
    productType: '',
    productGroup: '',
    barcode: initialBarcode || '',
    barcodeType: detectBarcodeFormat(initialBarcode),
    sku: '',
    description: '',
    mrp: '',
    shade: '',
    colorName: '',
    hexColor: '',
    colorFamily: '',
    netQuantity: '',
    unit: 'ml',
    ingredients: '',
    sourceUrl: '',
    confidence: 'Medium',
    source: 'None'
  });

  const handleExecuteSearch = async () => {
    const cleanBarcode = barcodeInput.trim();
    const cleanQuery = productQuery.trim();

    if (!cleanBarcode && !cleanQuery) {
      alert('Please enter a barcode or product search term.');
      return;
    }

    setIsSearching(true);
    setSearchDone(false);

    try {
      let detectedResult = null;

      // 1. First priority: Barcode lookup
      if (cleanBarcode) {
        detectedResult = await lookupBarcodeData(cleanBarcode);
      }

      // 2. Fetch related images using product name / brand / barcode
      const imgSearchQuery = [
        detectedResult?.data?.brand || '',
        detectedResult?.data?.productName || cleanQuery,
        cleanBarcode
      ].filter(Boolean).join(' ');

      let foundImages = [];
      try {
        const imgRes = await searchBeautyImages(imgSearchQuery || 'cosmetics beauty product');
        if (Array.isArray(imgRes)) {
          foundImages = imgRes.map(r => r.url || r.thumb).filter(Boolean);
        }
      } catch (imgErr) {
        console.warn('Image search fallback error:', imgErr);
      }

      if (detectedResult && detectedResult.found && detectedResult.data) {
        const d = detectedResult.data;
        const autoImages = [d.image, ...(d.images || []), ...foundImages].filter(Boolean);
        setOnlineImages(autoImages);
        setSelectedImage(autoImages[0] || '');

        setExtractedData({
          name: d.productName || cleanQuery,
          brand: d.brand || '',
          category: d.category || 'Makeup',
          subcategory: d.subcategory || '',
          productType: d.productType || '',
          productGroup: d.productName || cleanQuery,
          barcode: cleanBarcode || d.barcode,
          barcodeType: detectBarcodeFormat(cleanBarcode || d.barcode),
          sku: cleanBarcode ? `SKU-${cleanBarcode.slice(-6)}` : `SKU-${Date.now().toString().slice(-6)}`,
          description: d.description || '',
          mrp: '',
          shade: '',
          colorName: '',
          hexColor: '',
          colorFamily: '',
          netQuantity: d.netQuantity || '',
          unit: d.unit || 'ml',
          ingredients: d.ingredients || '',
          sourceUrl: d.productUrl || 'https://world.openbeautyfacts.org',
          confidence: detectedResult.confidence || 'High',
          source: detectedResult.source || 'Open Beauty Facts'
        });
      } else {
        // Fallback info from query
        const autoImages = foundImages;
        setOnlineImages(autoImages);
        setSelectedImage(autoImages[0] || '');

        setExtractedData(prev => ({
          ...prev,
          name: cleanQuery,
          barcode: cleanBarcode,
          barcodeType: detectBarcodeFormat(cleanBarcode),
          sku: cleanBarcode ? `SKU-${cleanBarcode.slice(-6)}` : `SKU-${Date.now().toString().slice(-6)}`,
          productGroup: cleanQuery,
          source: 'Web & Visual Search',
          confidence: 'Medium'
        }));
      }

      setSearchDone(true);
    } catch (err) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyToGrid = () => {
    onApplyProduct({
      ...extractedData,
      image: selectedImage || extractedData.image
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Browse Console &amp; Online Product Detection</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  AI Enrichment
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Search barcode catalogs and public cosmetic databases for instant extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scan / Enter Barcode
              </label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
                placeholder="e.g. 8901234567890"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Title / Brand
              </label>
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
                placeholder="e.g. Maybelline SuperStay Matte Ink"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Queries Open Beauty Facts &amp; GS1 GTIN databases with complete field review
            </span>
            <button
              onClick={handleExecuteSearch}
              disabled={isSearching}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" /> Research Product
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body: Extracted Values and Image Picker */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {searchDone ? (
            <div className="space-y-5">
              {/* Status and Source Strip */}
              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-purple-200 text-purple-900">
                    Auto Extracted
                  </span>
                  <span className="text-slate-700">
                    Source: <strong>{extractedData.source}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Confidence:</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {extractedData.confidence}
                  </span>
                </div>
              </div>

              {/* Online Image Selector */}
              {onlineImages.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Select Primary Product Image ({onlineImages.length} found)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {onlineImages.slice(0, 12).map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`relative aspect-square rounded-xl border-2 p-1 bg-white cursor-pointer transition-all overflow-hidden flex items-center justify-center ${
                          selectedImage === imgUrl
                            ? 'border-purple-600 ring-2 ring-purple-600/30'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <img src={imgUrl} alt="Product" className="w-full h-full object-contain" />
                        {selectedImage === imgUrl && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Product Title</label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Brand</label>
                  <input
                    type="text"
                    value={extractedData.brand}
                    onChange={(e) => setExtractedData({ ...extractedData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Barcode / GTIN</label>
                  <input
                    type="text"
                    value={extractedData.barcode}
                    onChange={(e) => setExtractedData({ ...extractedData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category</label>
                  <input
                    type="text"
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={extractedData.subcategory}
                    onChange={(e) => setExtractedData({ ...extractedData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Net Quantity / Volume</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={extractedData.netQuantity}
                      onChange={(e) => setExtractedData({ ...extractedData, netQuantity: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                    <select
                      value={extractedData.unit}
                      onChange={(e) => setExtractedData({ ...extractedData, unit: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    >
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Estimated MRP (₹)</label>
                  <input
                    type="number"
                    value={extractedData.mrp}
                    onChange={(e) => setExtractedData({ ...extractedData, mrp: e.target.value })}
                    placeholder="e.g. 699"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Description / Key Points</label>
                  <textarea
                    rows={2}
                    value={extractedData.description}
                    onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Ready to Discover Product Information
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enter an EAN-13, UPC barcode, or product name above and click "Research Product" to retrieve verified specifications and imagery.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyToGrid}
            disabled={!searchDone || !extractedData.name}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            Add to Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );
};
