import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Save,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import RolePricingMatrix from './RolePricingMatrix';
import RoleQuantityTiersManager from './RoleQuantityTiersManager';
import {
  normalizeQuantityTiers,
  getDefaultQuantityTiers,
  validateRoleTiers,
  DISCOUNT_ROLES
} from '../../utils/quantityTiersUtils';

/**
 * ShadePricingModal Component
 * 
 * Allows Admin to configure independent:
 * 1. Base MRP & Role Prices (General User, Salon Owner, Makeup Artist, Beautician)
 * 2. Role Discount Percentages (30%, 35%, 32%, etc.)
 * 3. Quantity Discount Tiers (Min Qty, Additional Discount %, Final Price)
 * 
 * Each shade is treated as a fully independent purchasable variant.
 */
export default function ShadePricingModal({
  isOpen,
  onClose,
  shade,
  parentProduct,
  onSave
}) {
  if (!isOpen || !shade) return null;

  // Local working copy of the shade being edited
  const [shadeData, setShadeData] = useState({
    id: shade.id || 'shade_' + Date.now(),
    name: shade.name || '',
    hexColor: shade.hexColor || '#C2477A',
    active: shade.active !== false,
    mrp: shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : (shade.priceOverride || parentProduct?.mrp || ''),
    generalPrice: shade.generalPrice !== undefined && shade.generalPrice !== '' ? shade.generalPrice : (shade.priceOverride || parentProduct?.generalPrice || parentProduct?.mrp || ''),
    salonPrice: shade.salonPrice !== undefined && shade.salonPrice !== '' ? shade.salonPrice : (shade.priceOverride || parentProduct?.salonPrice || ''),
    artistPrice: shade.artistPrice !== undefined && shade.artistPrice !== '' ? shade.artistPrice : (shade.priceOverride || parentProduct?.artistPrice || ''),
    beauticianPrice: shade.beauticianPrice !== undefined && shade.beauticianPrice !== '' ? shade.beauticianPrice : (shade.priceOverride || parentProduct?.beauticianPrice || ''),
    quantityTiers: normalizeQuantityTiers(shade.quantityTiers)
  });

  // Role discount percentages for this shade (all 4 roles)
  const [shadeDiscounts, setShadeDiscounts] = useState(() => {
    if (shade.discountPercentages && typeof shade.discountPercentages === 'object') {
      return {
        general: shade.discountPercentages.general || '',
        salon: shade.discountPercentages.salon || '',
        artist: shade.discountPercentages.artist || '',
        beautician: shade.discountPercentages.beautician || ''
      };
    }
    // Calculate initial percentages if base mrp and role prices exist
    const base = Number(shade.mrp || shade.generalPrice || parentProduct?.mrp || 0);
    const getPct = (price) => {
      if (!base || !price || Number(price) <= 0 || Number(price) >= base) return '';
      const pct = Math.round((1 - Number(price) / base) * 100);
      return pct > 0 && pct < 100 ? String(pct) : '';
    };
    return {
      general: getPct(shade.generalPrice),
      salon: getPct(shade.salonPrice),
      artist: getPct(shade.artistPrice),
      beautician: getPct(shade.beauticianPrice)
    };
  });

  // Re-sync when shade prop changes
  useEffect(() => {
    if (shade) {
      const base = Number(shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : (shade.priceOverride || parentProduct?.mrp || 0));
      const getPct = (price) => {
        if (!base || !price || Number(price) <= 0 || Number(price) >= base) return '';
        const pct = Math.round((1 - Number(price) / base) * 100);
        return pct > 0 && pct < 100 ? String(pct) : '';
      };

      setShadeData({
        id: shade.id || 'shade_' + Date.now(),
        name: shade.name || '',
        hexColor: shade.hexColor || '#C2477A',
        active: shade.active !== false,
        mrp: shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : (shade.priceOverride || parentProduct?.mrp || ''),
        generalPrice: shade.generalPrice !== undefined && shade.generalPrice !== '' ? shade.generalPrice : (shade.priceOverride || parentProduct?.generalPrice || parentProduct?.mrp || ''),
        salonPrice: shade.salonPrice !== undefined && shade.salonPrice !== '' ? shade.salonPrice : (shade.priceOverride || parentProduct?.salonPrice || ''),
        artistPrice: shade.artistPrice !== undefined && shade.artistPrice !== '' ? shade.artistPrice : (shade.priceOverride || parentProduct?.artistPrice || ''),
        beauticianPrice: shade.beauticianPrice !== undefined && shade.beauticianPrice !== '' ? shade.beauticianPrice : (shade.priceOverride || parentProduct?.beauticianPrice || ''),
        quantityTiers: normalizeQuantityTiers(shade.quantityTiers)
      });

      setShadeDiscounts(
        shade.discountPercentages && typeof shade.discountPercentages === 'object'
          ? {
              general: shade.discountPercentages.general || '',
              salon: shade.discountPercentages.salon || '',
              artist: shade.discountPercentages.artist || '',
              beautician: shade.discountPercentages.beautician || ''
            }
          : {
              general: getPct(shade.generalPrice),
              salon: getPct(shade.salonPrice),
              artist: getPct(shade.artistPrice),
              beautician: getPct(shade.beauticianPrice)
            }
      );
    }
  }, [shade?.id]);

  // Recalculates role prices when shade MRP changes (starts from MRP, never 0!)
  const handleShadeMrpChange = (val) => {
    setShadeData(prev => {
      const base = Number(val);
      const updated = {
        ...prev,
        mrp: val,
        priceOverride: val ? Number(val) : null
      };
      if (!isNaN(base) && base > 0) {
        const getPrice = (pct) => {
          if (pct !== '' && pct !== null && pct !== undefined && !isNaN(Number(pct))) {
            return Math.max(0, Math.round(base * (1 - Number(pct) / 100)));
          }
          return base;
        };
        updated.generalPrice = getPrice(shadeDiscounts.general);
        updated.salonPrice = getPrice(shadeDiscounts.salon);
        updated.artistPrice = getPrice(shadeDiscounts.artist);
        updated.beauticianPrice = getPrice(shadeDiscounts.beautician);
      }
      return updated;
    });
  };

  const handleSave = () => {
    if (!shadeData.name.trim()) {
      alert('Please provide a name for this shade variant.');
      return;
    }

    // Validate shade-level quantity tiers
    const normalizedTiers = normalizeQuantityTiers(shadeData.quantityTiers);
    for (const roleDef of DISCOUNT_ROLES) {
      const val = validateRoleTiers(normalizedTiers[roleDef.id] || [], `${roleDef.name} (Shade: ${shadeData.name})`);
      if (!val.isValid) {
        alert(val.error);
        return;
      }
    }

    const shadeMrpNum = Number(shadeData.mrp || 0);
    const finalShade = {
      ...shadeData,
      name: shadeData.name.trim(),
      mrp: shadeMrpNum,
      generalPrice: Number(shadeData.generalPrice || shadeMrpNum),
      salonPrice: Number(shadeData.salonPrice || shadeMrpNum),
      artistPrice: Number(shadeData.artistPrice || shadeMrpNum),
      beauticianPrice: Number(shadeData.beauticianPrice || shadeMrpNum),
      priceOverride: shadeMrpNum ? shadeMrpNum : null,
      discountPercentages: { ...shadeDiscounts },
      quantityTiers: {
        ...normalizedTiers,
        roleDiscounts: { ...shadeDiscounts }
      }
    };

    if (onSave) {
      onSave(finalShade);
    }
    onClose();
  };

  const isColorVariant = Boolean(
    (shadeData.attributes && Object.keys(shadeData.attributes).some(k => /shade|color|colour/i.test(k))) ||
    (/makeup|lipstick|lip|nail|eyeshadow|blush|foundation/i.test(parentProduct?.category || '')) ||
    (shadeData.hexColor && shadeData.hexColor !== '#C2477A' && shadeData.hexColor !== '')
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col relative overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-pink-100/80 bg-gradient-to-r from-violet-50/80 via-white to-pink-50/60 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3">
            {/* Dynamic Icon: Palette for color shade, Package/Layers for other attributes */}
            {isColorVariant ? (
              <div
                className="w-10 h-10 rounded-2xl border-2 border-white shadow-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: shadeData.hexColor || '#C2477A' }}
              >
                <Palette size={18} className="text-white drop-shadow" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] text-[#C2477A] border border-pink-200 shadow-xs flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                  {shadeData.name || 'Unnamed Variant'} — Pricing & Tiers
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FDF2F8] text-black border border-[#FCE4EC]">
                  Independent Variant
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                Product: <strong className="text-gray-800 font-bold">{parentProduct?.name || 'Catalog Product'}</strong> • Unique Role Pricing & Quantity Tiers
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 space-y-4 text-xs">
          {/* 1. Variant Details / Identity Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#FCE4EC] shadow-2xs space-y-2.5">
            {/* Configured Attributes Badges (if any) */}
            {shadeData.attributes && Object.keys(shadeData.attributes).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-pink-100/60">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Configured Attributes:</span>
                {Object.entries(shadeData.attributes).map(([attrK, attrV]) => (
                  <span key={attrK} className="px-2 py-0.5 rounded-lg bg-[#FFF5F8] border border-[#FCE4EC] text-[#C2477A] text-[10.5px] font-bold">
                    {attrK}: <strong className="text-gray-900">{attrV}</strong>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className={isColorVariant ? "sm:col-span-6" : "sm:col-span-12"}>
                <label className="block text-gray-800 font-bold text-[11px] mb-1">Variant Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50ml Gel / Velvet Rose"
                  value={shadeData.name}
                  onChange={(e) => setShadeData({ ...shadeData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#FCE4EC] outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-bold text-gray-900 text-xs shadow-2xs"
                />
              </div>

              {/* Swatch Color picker ONLY when variant represents a genuine shade/color */}
              {isColorVariant && (
                <div className="sm:col-span-6">
                  <label className="block text-gray-800 font-bold text-[11px] mb-1">Swatch Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={shadeData.hexColor}
                      onChange={(e) => setShadeData({ ...shadeData, hexColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-[#FCE4EC] cursor-pointer shrink-0 p-0.5"
                    />
                    <input
                      type="text"
                      placeholder="#C2477A"
                      value={shadeData.hexColor}
                      onChange={(e) => setShadeData({ ...shadeData, hexColor: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#FCE4EC] outline-none focus:border-[#C2477A] bg-white font-mono text-xs font-bold text-gray-700 shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Independent Role-Based Pricing Matrix for THIS Shade */}
          <div className="space-y-1">
            <RolePricingMatrix
              basePrice={shadeData.mrp}
              onBasePriceChange={handleShadeMrpChange}
              rolePrices={{
                generalPrice: shadeData.generalPrice,
                salonPrice: shadeData.salonPrice,
                artistPrice: shadeData.artistPrice,
                beauticianPrice: shadeData.beauticianPrice
              }}
              onRolePriceChange={(rolePriceKey, priceVal) => {
                setShadeData(prev => ({
                  ...prev,
                  [rolePriceKey]: priceVal
                }));
              }}
              discountPercentages={shadeDiscounts}
              onDiscountPercentageChange={(roleKey, pctVal) => {
                setShadeDiscounts(prev => ({
                  ...prev,
                  [roleKey]: pctVal
                }));
              }}
              showBasePriceInput={true}
              title={`Shade Pricing Matrix (${shadeData.name || 'This Shade'})`}
            />
          </div>

          {/* 3. Independent Per-Shade Quantity Discount Tiers Manager */}
          <div className="space-y-1">
            <RoleQuantityTiersManager
              tiers={shadeData.quantityTiers}
              onChange={(updatedTiers) => setShadeData(prev => ({ ...prev, quantityTiers: updatedTiers }))}
              product={{
                ...shadeData,
                discountPercentages: shadeDiscounts
              }}
              showSaveButton={false}
              allowClose={false}
              title={`Quantity Discount Tiers (${shadeData.name || 'This Shade'})`}
              subtitle={`Each role has its own independent quantity tiers and discount percentages specifically for shade ${shadeData.name || 'this variant'}.`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-pink-100/80 bg-gray-50/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white shadow-xs cursor-pointer active:scale-[0.98] transition-all"
          >
            <CheckCircle2 size={15} />
            <span>Save Shade Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
