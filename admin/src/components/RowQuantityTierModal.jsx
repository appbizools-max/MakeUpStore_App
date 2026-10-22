import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Calculator,
  User,
  Crown,
  Sparkles,
  Percent
} from 'lucide-react';
import { calculateTierFinalPrice } from '../utils/quantityTiersUtils';

export const RowQuantityTierModal = ({
  isOpen,
  onClose,
  row,
  onSaveTiers,
  defaultPricingRules
}) => {
  if (!isOpen || !row) return null;

  const mrpNum = Number(row.mrp) || 0;
  const genBase = Number(row.generalPrice) || mrpNum;
  const salonBase = Number(row.salonPrice) || genBase;
  const artistBase = Number(row.artistPrice) || salonBase;
  const beauticianBase = Number(row.beauticianPrice) || salonBase;

  // Active role tab for preview
  const [activeTab, setActiveTab] = useState('salon'); // general, salon, artist, beautician
  const [previewQty, setPreviewQty] = useState(5);

  const [tiers, setTiers] = useState(() => {
    if (Array.isArray(row.quantityTiers) && row.quantityTiers.length > 0) {
      return row.quantityTiers;
    }
    return [
      { minQty: 1, maxQty: 2, generalDiscount: 0, salonDiscount: 0, artistDiscount: 0, beauticianDiscount: 0 },
      { minQty: 3, maxQty: 4, generalDiscount: 0, salonDiscount: 5, artistDiscount: 5, beauticianDiscount: 5 },
      { minQty: 5, maxQty: 9, generalDiscount: 0, salonDiscount: 10, artistDiscount: 10, beauticianDiscount: 10 },
      { minQty: 10, maxQty: 999, generalDiscount: 0, salonDiscount: 15, artistDiscount: 15, beauticianDiscount: 15 }
    ];
  });

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier ? (Number(lastTier.maxQty) || 10) + 1 : 1;
    setTiers(prev => [
      ...prev,
      {
        minQty: nextMin,
        maxQty: nextMin + 5,
        generalDiscount: 0,
        salonDiscount: 12,
        artistDiscount: 15,
        beauticianDiscount: 15
      }
    ]);
  };

  const handleRemoveTier = (idx) => {
    if (tiers.length <= 1) return;
    setTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, val) => {
    setTiers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Find tier for preview quantity
  const matchedTier = tiers.find(t => previewQty >= Number(t.minQty) && previewQty <= Number(t.maxQty)) || tiers[tiers.length - 1];

  const getRoleBasePrice = (role) => {
    if (role === 'general') return genBase;
    if (role === 'salon') return salonBase;
    if (role === 'artist') return artistBase;
    if (role === 'beautician') return beauticianBase;
    return genBase;
  };

  const getTierDiscountForRole = (tier, role) => {
    if (!tier) return 0;
    if (role === 'general') return Number(tier.generalDiscount || 0);
    if (role === 'salon') return Number(tier.salonDiscount || 0);
    if (role === 'artist') return Number(tier.artistDiscount || 0);
    if (role === 'beautician') return Number(tier.beauticianDiscount || 0);
    return 0;
  };

  const currentBasePrice = getRoleBasePrice(activeTab);
  const currentBaseDiscountAmount = mrpNum - currentBasePrice;
  const currentBaseDiscountPct = mrpNum > 0 ? Math.round((currentBaseDiscountAmount / mrpNum) * 100) : 0;

  const currentTierDiscountPct = getTierDiscountForRole(matchedTier, activeTab);
  const finalUnitPrice = calculateTierFinalPrice(currentBasePrice, currentTierDiscountPct);
  const currentTierDiscountAmount = currentBasePrice - finalUnitPrice;
  const totalSavingsPerUnit = mrpNum - finalUnitPrice;
  const totalOrderValue = finalUnitPrice * previewQty;

  const handleSave = () => {
    onSaveTiers(tiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Quantity Discount &amp; Role Price Simulation</h2>
              <p className="text-xs text-slate-400">
                Product: <strong className="text-purple-200">{row.name || 'Current Item'}</strong> • MRP: ₹{mrpNum}
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

        {/* 2-Column Content: Config on left, Live Price Preview on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Tiers Editor */}
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Volume Break Tiers</h3>
                <p className="text-[11px] text-slate-500">Configure additional discount % applied per role threshold</p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Range
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold">Units Range</th>
                    <th className="px-2 py-2 text-center font-bold">General %</th>
                    <th className="px-2 py-2 text-center font-bold">Salon %</th>
                    <th className="px-2 py-2 text-center font-bold">Artist %</th>
                    <th className="px-2 py-2 text-center font-bold">Beauty %</th>
                    <th className="px-2 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1 font-mono text-slate-900">
                          <input
                            type="number"
                            value={tier.minQty}
                            onChange={(e) => handleTierChange(idx, 'minQty', e.target.value)}
                            className="w-12 px-1.5 py-1 border border-slate-300 rounded text-center"
                          />
                          <span>–</span>
                          <input
                            type="number"
                            value={tier.maxQty}
                            onChange={(e) => handleTierChange(idx, 'maxQty', e.target.value)}
                            className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          value={tier.generalDiscount || 0}
                          onChange={(e) => handleTierChange(idx, 'generalDiscount', e.target.value)}
                          className="w-12 px-1.5 py-1 border border-slate-300 rounded text-center font-mono"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          value={tier.salonDiscount || 0}
                          onChange={(e) => handleTierChange(idx, 'salonDiscount', e.target.value)}
                          className="w-12 px-1.5 py-1 border border-purple-300 bg-purple-50/30 rounded text-center font-mono text-purple-900 font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          value={tier.artistDiscount || 0}
                          onChange={(e) => handleTierChange(idx, 'artistDiscount', e.target.value)}
                          className="w-12 px-1.5 py-1 border border-purple-300 bg-purple-50/30 rounded text-center font-mono text-purple-900 font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          value={tier.beauticianDiscount || 0}
                          onChange={(e) => handleTierChange(idx, 'beauticianDiscount', e.target.value)}
                          className="w-12 px-1.5 py-1 border border-purple-300 bg-purple-50/30 rounded text-center font-mono text-purple-900 font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Interactive Role Price Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-50/60 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Live Price Preview</h3>
              <p className="text-[11px] text-slate-500">Simulate customer tier savings across all 4 roles</p>
            </div>

            {/* Role Tabs */}
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'general' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('salon')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'salon' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Salon
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('artist')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'artist' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Artist
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('beautician')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'beautician' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Beauty
              </button>
            </div>

            {/* Quantity Slider / Selector */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-semibold">Simulated Order Quantity:</span>
                <span className="font-bold text-slate-900 font-mono">{previewQty} Units</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={previewQty}
                onChange={(e) => setPreviewQty(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Price Breakdown Card */}
            <div className="p-4 bg-white border border-purple-200 rounded-2xl space-y-2.5 shadow-xs text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Retail MRP</span>
                <span className="font-mono font-semibold text-slate-700">₹{mrpNum}</span>
              </div>

              <div className="flex justify-between items-center text-purple-700">
                <span>Base Role Discount ({currentBaseDiscountPct}%)</span>
                <span className="font-mono font-semibold">- ₹{currentBaseDiscountAmount}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-600">Base Role Price</span>
                <span className="font-mono font-semibold text-slate-900">₹{currentBasePrice}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-700">
                <span>Quantity Tier Discount ({currentTierDiscountPct}%)</span>
                <span className="font-mono font-semibold">- ₹{currentTierDiscountAmount}</span>
              </div>

              <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Final Unit Price</span>
                <span className="text-purple-600 text-base font-mono">₹{finalUnitPrice}</span>
              </div>

              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] font-semibold text-center">
                Total for {previewQty} units: ₹{totalOrderValue} (Total savings ₹{totalSavingsPerUnit * previewQty})
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20"
          >
            Apply Tiers
          </button>
        </div>
      </div>
    </div>
  );
};
