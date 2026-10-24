import React, { useState } from 'react';
import { Sparkles, Check, X, AlertTriangle, ExternalLink, RefreshCw, Image, ShieldCheck } from 'lucide-react';

export const BarcodeLookupReviewModal = ({
  isOpen,
  onClose,
  lookupResult,
  onAccept,
  categories = [],
  brands = []
}) => {
  if (!isOpen || !lookupResult) return null;

  const initialData = lookupResult.data || {};
  const [formData, setFormData] = useState({
    productName: initialData.productName || '',
    brand: initialData.brand || '',
    category: initialData.category || '',
    subcategory: initialData.subcategory || '',
    productType: initialData.productType || '',
    image: initialData.image || '',
    description: initialData.description || '',
    netQuantity: initialData.netQuantity || '',
    countryOfOrigin: initialData.countryOfOrigin || '',
    ingredients: initialData.ingredients || ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const confidenceBadgeColor = {
    High: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-rose-50 text-rose-700 border-rose-200'
  }[lookupResult.confidence || 'Medium'];

  const handleAcceptAll = () => {
    onAccept(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Product Information Detected</h2>
              <p className="text-xs text-slate-300">
                Barcode: <span className="font-mono text-purple-200 font-semibold">{lookupResult.barcode}</span> ({lookupResult.barcodeType || 'EAN-13'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source & Confidence Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Source: <strong className="text-slate-800 font-semibold">{lookupResult.source || 'Barcode Catalog'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Confidence:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${confidenceBadgeColor}`}>
              {lookupResult.confidence || 'Medium'} Confidence
            </span>
          </div>
        </div>

        {/* Body Form / Review */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Hero detected product summary card */}
          <div className="flex gap-4 p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
            {formData.image ? (
              <img
                src={formData.image}
                alt="Product Preview"
                className="w-20 h-20 rounded-lg object-contain bg-white border border-purple-200 p-1 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                <Image className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px]">No image</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-purple-700">
                {formData.brand || 'Unspecified Brand'}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm truncate">
                {formData.productName || 'Unnamed Detected Product'}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {formData.description || formData.category || 'No extended description available from catalog source.'}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Product Name <span className="text-purple-600">[Detected]</span>
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900"
                placeholder="Product Title"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Brand <span className="text-purple-600">[Detected]</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900"
                placeholder="Brand Name"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Category <span className="text-amber-600">[Suggested]</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900"
                placeholder="e.g. Makeup or Skincare"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Sub Category <span className="text-amber-600">[Suggested]</span>
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900"
                placeholder="e.g. Lip Makeup"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Image URL <span className="text-purple-600">[Found]</span>
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900 font-mono text-[11px]"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Ingredients / Formulation <span className="text-slate-500">[Optional]</span>
              </label>
              <textarea
                rows={2}
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900"
                placeholder="Aqua, Dimethicone, Pigments..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Reject
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-semibold transition-colors"
            >
              {isEditing ? 'Done Editing' : 'Review & Edit'}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Accept All & Pre-Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
