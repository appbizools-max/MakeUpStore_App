import React, { useState } from 'react';
import {
  BadgePercent,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Sparkles,
  Info,
  X,
  Layers,
  Calculator,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import {
  DISCOUNT_ROLES,
  normalizeQuantityTiers,
  validateRoleTiers,
  getProductBasePriceForRole,
  getProductRoleDiscount,
  calculateRolePrice,
  calculateTierFinalPrice,
  getApplicableTierForRole
} from '../utils/quantityTiersUtils';

/**
 * RoleQuantityTiersManager
 * 4 completely independent tabs:
 * 1. General User
 * 2. Salon Owner
 * 3. Makeup Artist
 * 4. Beautician
 *
 * Order of calculation:
 * MRP -> Role Discount -> Role Base Price -> Quantity Discount -> Final Unit Price
 */
export default function RoleQuantityTiersManager({
  tiers,
  onChange,
  product = {},
  isSaving = false,
  onSave = null,
  saveSuccess = false,
  showSaveButton = true,
  allowClose = false,
  onClose = null,
  title = null,
  subtitle = null
}) {
  const [activeRoleTab, setActiveRoleTab] = useState('general'); // 'general' | 'salon' | 'artist' | 'beautician'

  // Guaranteed role-keyed structure: { general: [...], salon: [...], artist: [...], beautician: [...] }
  const currentTiers = normalizeQuantityTiers(tiers);

  // Active role definition and its tiers
  const activeRoleConfig = DISCOUNT_ROLES.find(r => r.id === activeRoleTab) || DISCOUNT_ROLES[0];
  const rawRoleTiers = currentTiers[activeRoleTab] || [];

  // Sort tiers by minimum quantity ascending for display and evaluation
  const activeRoleTiers = [...rawRoleTiers];

  // Base MRP of product
  const mrp = Number(product?.mrp || 0);

  // Active role base price (Starts from MRP, never ₹0!)
  const activeRoleBasePrice = getProductBasePriceForRole(product, activeRoleTab);

  // Role discount %
  const activeRoleDiscount = getProductRoleDiscount(product, activeRoleTab);

  // Validate active role tiers for duplicate quantities and valid ranges
  const validation = validateRoleTiers(activeRoleTiers, activeRoleConfig.name);

  // Helper to update tiers for only the selected role
  const updateRoleTiers = (newRoleTiers) => {
    const updatedAll = {
      ...currentTiers,
      [activeRoleTab]: newRoleTiers
    };
    onChange(updatedAll);
  };

  // Add tier row to active role only (pure manual input)
  const handleAddTier = () => {
    const newTier = {
      id: `${activeRoleTab}_t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      role: activeRoleTab,
      minQty: '',
      additionalDiscount: ''
    };

    updateRoleTiers([...activeRoleTiers, newTier]);
  };

  // Delete tier row from active role only
  const handleDeleteTier = (indexToDelete) => {
    const updated = activeRoleTiers.filter((_, idx) => idx !== indexToDelete);
    updateRoleTiers(updated);
  };

  // Update specific field in a tier row for active role only
  const handleUpdateTierField = (index, field, rawValue) => {
    const updated = activeRoleTiers.map((t, idx) => {
      if (idx !== index) return t;
      let val = rawValue;
      if (rawValue !== '') {
        const num = Number(rawValue);
        if (!isNaN(num)) {
          if (field === 'minQty') {
            val = Math.max(1, Math.round(num));
          } else if (field === 'additionalDiscount') {
            val = Math.min(100, Math.max(0, num));
          }
        }
      }
      return {
        ...t,
        role: activeRoleTab,
        [field]: val
      };
    });
    updateRoleTiers(updated);
  };

  // Check if any role has validation errors
  const isAnyRoleInvalid = DISCOUNT_ROLES.some(r => {
    const rTiers = currentTiers[r.id] || [];
    return !validateRoleTiers(rTiers, r.name).isValid;
  });


  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 shadow-xs overflow-hidden space-y-4">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-pink-100/80 bg-gradient-to-r from-[#FFF2F5] via-pink-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#CE4270] text-white flex items-center justify-center shadow-2xs shrink-0">
              <BadgePercent size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                <span>{title || 'Per-Product Quantity Discount Tiers'}</span>
                {product?.name && (
                  <span className="text-[#CE4270] font-bold text-xs truncate max-w-[200px]">
                    ({product.name})
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                {subtitle || 'Independent volume discount tiers for General User, Salon Owner, Makeup Artist, & Beautician.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {showSaveButton && onSave && (
            <button
              type="button"
              disabled={isSaving || isAnyRoleInvalid}
              onClick={() => onSave(currentTiers)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer ${
                isSaving || isAnyRoleInvalid
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#CE4270] hover:bg-[#b83760] text-white active:scale-95'
              }`}
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{isSaving ? 'Saving...' : 'Save Tiers'}</span>
            </button>
          )}

          {allowClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              title="Close panel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="mx-4 sm:mx-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>Quantity tiers saved successfully to product catalog & database!</span>
        </div>
      )}

      {/* 4 INDEPENDENT ROLE TABS */}
      <div className="px-4 sm:px-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200">
          {DISCOUNT_ROLES.map((role) => {
            const isActive = activeRoleTab === role.id;
            const roleTiersCount = (currentTiers[role.id] || []).length;
            const roleBase = getProductBasePriceForRole(product, role.id);
            const roleValidation = validateRoleTiers(currentTiers[role.id] || [], role.name);

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRoleTab(role.id)}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer text-center relative ${
                  isActive
                    ? `${role.tabActive} shadow-xs`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold">{role.name}</span>
                  {!roleValidation.isValid && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Configuration error in this role" />
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {roleTiersCount} {roleTiersCount === 1 ? 'Tier' : 'Tiers'}
                  </span>
                  <span className={`text-[10px] hidden md:inline font-medium ${
                    isActive ? 'text-white/90' : 'text-gray-400'
                  }`}>
                    (Base: ₹{roleBase})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE ROLE CONFIGURATION PANEL */}
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        {/* Active Role Meta Banner: Explains Base MRP -> Role Discount -> Role Price */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${activeRoleConfig.badgeBg} ${activeRoleConfig.badgeBorder}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeRoleConfig.color }} />
              <span className={`font-extrabold text-xs uppercase tracking-wider ${activeRoleConfig.badgeText}`}>
                {activeRoleConfig.name.toUpperCase()} QUANTITY DISCOUNT CONFIGURATION
              </span>
            </div>
            
            {/* Step-by-step role base price breakdown */}
            <div className="text-xs text-gray-700 flex items-center gap-2 flex-wrap font-medium">
              <span>Product MRP: <strong className="font-bold text-gray-900">₹{mrp || 0}</strong></span>
              <span>→</span>
              <span>Role Discount: <strong className="font-bold text-gray-900">{activeRoleDiscount}%</strong></span>
              <span>→</span>
              <span className="bg-white/90 px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                Role Base Price: <strong className="font-extrabold text-gray-900">₹{activeRoleBasePrice}</strong>
              </span>
              <span className="text-[10.5px] text-gray-500">
                (Quantity discounts apply on top of this ₹{activeRoleBasePrice})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-white text-gray-800 border border-gray-300 hover:border-gray-400 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={13} className="text-[#CE4270]" />
              <span>+ Add Tier to {activeRoleConfig.name}</span>
            </button>
          </div>
        </div>

        {/* Validation Error Banner for active role */}
        {!validation.isValid && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-rose-900">Configuration Error: </span>
              <span>{validation.error}</span>
            </div>
          </div>
        )}

        {/* ACTIVE ROLE TIERS TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-700 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
                <th className="py-3 px-3.5 w-24">TIER #</th>
                <th className="py-3 px-3.5">MINIMUM QUANTITY</th>
                <th className="py-3 px-3.5">ADDITIONAL DISCOUNT (%)</th>
                <th className="py-3 px-3.5">
                  <span className="flex items-center gap-1">
                    <span>FINAL PRICE / UNIT</span>
                    <span className="text-[9px] font-normal text-gray-400 lowercase">(calculated)</span>
                  </span>
                </th>
                <th className="py-3 px-3.5 text-right w-20">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeRoleTiers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <BadgePercent size={28} className="text-gray-300" />
                      <span className="text-xs font-bold text-gray-600">
                        No quantity tiers configured for {activeRoleConfig.name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Click "+ Add Tier to {activeRoleConfig.name}" to add volume discount tiers.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                activeRoleTiers.map((tier, idx) => {
                  const tierDisc = tier.additionalDiscount !== '' && !isNaN(Number(tier.additionalDiscount))
                    ? Number(tier.additionalDiscount)
                    : 0;

                  // Order: Role Base Price -> Quantity Discount -> Final Unit Price
                  const finalUnitPrice = calculateTierFinalPrice(activeRoleBasePrice, tierDisc);
                  const savingsPerUnit = Math.max(0, activeRoleBasePrice - finalUnitPrice);

                  // Check for duplicate minQty within current role
                  const isDuplicateQty = tier.minQty !== '' && activeRoleTiers.filter(t => t.minQty !== '' && Number(t.minQty) === Number(tier.minQty)).length > 1;

                  return (
                    <tr
                      key={tier.id || `${activeRoleTab}_${idx}`}
                      className={`transition-colors ${
                        isDuplicateQty ? 'bg-rose-50/70 hover:bg-rose-100/50' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-3.5 font-extrabold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: activeRoleConfig.color }}
                          >
                            {idx + 1}
                          </span>
                          <span>Tier {idx + 1}</span>
                        </div>
                      </td>

                      {/* Minimum Quantity Input */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="e.g. 5"
                            value={tier.minQty}
                            onChange={(e) => handleUpdateTierField(idx, 'minQty', e.target.value)}
                            className={`w-28 p-2 rounded-xl border font-mono font-bold text-gray-900 text-xs text-center outline-none transition-all ${
                              isDuplicateQty
                                ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                                : 'border-gray-300 bg-white focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20'
                            }`}
                          />
                          <span className="font-bold text-gray-400 text-xs">units+</span>
                        </div>
                        {isDuplicateQty && (
                          <div className="text-[10px] text-rose-600 font-bold mt-1">
                            Duplicate quantity!
                          </div>
                        )}
                      </td>

                      {/* Additional Discount % Input */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            required
                            placeholder="e.g. 5"
                            value={tier.additionalDiscount}
                            onChange={(e) => handleUpdateTierField(idx, 'additionalDiscount', e.target.value)}
                            className="w-28 p-2 rounded-xl border border-gray-300 bg-white font-mono font-bold text-[#CE4270] text-xs text-center outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 transition-all"
                          />
                          <span className="font-bold text-gray-500 text-xs">% OFF</span>
                        </div>
                      </td>

                      {/* Final Price for THIS ROLE ONLY - Calculated Automatically */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
                          <span className="font-black text-sm text-gray-900 font-mono">
                            ₹{finalUnitPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-gray-400 text-[10px]">/ unit</span>
                          {tierDisc > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Save ₹{savingsPerUnit} ({tierDisc}% off)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-400">
                              Base Rate
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                          title="Delete tier row"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


        {/* Footer info tip */}
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] text-gray-500 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-[#CE4270] shrink-0" />
            <span>
              Orders for <strong>{activeRoleConfig.name}</strong> automatically evaluate tiers where <code>quantity ≥ minimum_quantity</code> and apply the highest matching discount.
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-400 shrink-0">
            Role ID: {activeRoleTab}
          </span>
        </div>
      </div>
    </div>
  );
}
