import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Sliders,
  Sparkles,
  Palette,
  Tag,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Percent,
  Layers,
  Edit2,
  Barcode,
  ScanBarcode
} from 'lucide-react';
import {
  DISCOUNT_ROLES,
  normalizeQuantityTiers,
  getDefaultQuantityTiers,
  validateRoleTiers,
  calculateTierFinalPrice
} from '../utils/quantityTiersUtils';
import HexColorPicker, { MAKEUP_SWATCH_PRESETS, getBeautyShadeName } from './HexColorPicker';
import ImageField from './ImageField';

/**
 * InlineShadeCard Component
 * 
 * Renders an inline, expandable card for a product variant/shade.
 * Zero modals, zero popups. All basic details, MRP, 4-role discount matrix,
 * and 4-role quantity discount tiers are configured inline directly inside this card.
 */
export default function InlineShadeCard({
  shade,
  index,
  parentProduct,
  onChange,
  onRemove,
  onOpenScanner,
  defaultExpanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeRoleTab, setActiveRoleTab] = useState('general');

  // Inline Add Tier form state for active role
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [newTierForm, setNewTierForm] = useState({ minQty: '', additionalDiscount: '' });
  const [tierFormError, setTierFormError] = useState(null);

  // Inline Edit Tier state
  const [editingTierIndex, setEditingTierIndex] = useState(null);
  const [editTierForm, setEditTierForm] = useState({ minQty: '', additionalDiscount: '' });

  // Fallback defaults from parent
  const parentMrp = Number(parentProduct?.mrp || 0);

  // Ensure normalized quantity tiers on the shade
  const currentQuantityTiers = useMemo(() => {
    return normalizeQuantityTiers(shade.quantityTiers);
  }, [shade.quantityTiers]);

  // Current shade MRP (starts from shade.mrp or fallback to parent product MRP)
  const shadeMrp = shade.mrp !== undefined && shade.mrp !== '' ? Number(shade.mrp) : parentMrp;

  // Role discounts for this shade
  const shadeDiscounts = useMemo(() => {
    if (shade.discountPercentages && typeof shade.discountPercentages === 'object') {
      return {
        general: shade.discountPercentages.general !== undefined ? String(shade.discountPercentages.general) : '',
        salon: shade.discountPercentages.salon !== undefined ? String(shade.discountPercentages.salon) : '',
        artist: shade.discountPercentages.artist !== undefined ? String(shade.discountPercentages.artist) : '',
        beautician: shade.discountPercentages.beautician !== undefined ? String(shade.discountPercentages.beautician) : ''
      };
    }
    // Fallback to parent product discount percentages
    if (parentProduct?.discountPercentages) {
      return {
        general: String(parentProduct.discountPercentages.general || ''),
        salon: String(parentProduct.discountPercentages.salon || ''),
        artist: String(parentProduct.discountPercentages.artist || ''),
        beautician: String(parentProduct.discountPercentages.beautician || '')
      };
    }
    return { general: '', salon: '', artist: '', beautician: '' };
  }, [shade.discountPercentages, parentProduct?.discountPercentages]);

  // Compute calculated role prices for this shade
  const getRolePrice = (roleKey) => {
    const disc = shadeDiscounts[roleKey];
    if (shadeMrp > 0 && disc !== '' && !isNaN(Number(disc))) {
      return Math.max(0, Math.round(shadeMrp * (1 - Number(disc) / 100)));
    }
    // If explicit role price is set on shade
    const explicitKey = `${roleKey}Price`;
    if (shade[explicitKey] !== undefined && shade[explicitKey] !== '' && !isNaN(Number(shade[explicitKey]))) {
      return Number(shade[explicitKey]);
    }
    return shadeMrp;
  };

  const rolePrices = useMemo(() => {
    return {
      general: getRolePrice('general'),
      salon: getRolePrice('salon'),
      artist: getRolePrice('artist'),
      beautician: getRolePrice('beautician')
    };
  }, [shadeMrp, shadeDiscounts, shade.generalPrice, shade.salonPrice, shade.artistPrice, shade.beauticianPrice]);

  // Active role config
  const activeRoleConfig = DISCOUNT_ROLES.find(r => r.id === activeRoleTab) || DISCOUNT_ROLES[0];
  const activeRoleBasePrice = rolePrices[activeRoleTab] || shadeMrp;
  const activeRoleDiscount = shadeDiscounts[activeRoleTab] !== '' ? Number(shadeDiscounts[activeRoleTab]) : 0;
  const activeRoleTiers = currentQuantityTiers[activeRoleTab] || [];

  // Update a field on the shade
  const updateShadeField = (field, value) => {
    onChange({
      ...shade,
      [field]: value
    });
  };

  // Handle shade MRP change (updates MRP and recalculates role prices)
  const handleShadeMrpChange = (newVal) => {
    const num = Number(newVal);
    const updated = {
      ...shade,
      mrp: newVal,
      priceOverride: newVal ? Number(newVal) : null
    };

    if (!isNaN(num) && num > 0) {
      updated.generalPrice = shadeDiscounts.general !== '' ? Math.max(0, Math.round(num * (1 - Number(shadeDiscounts.general) / 100))) : num;
      updated.salonPrice = shadeDiscounts.salon !== '' ? Math.max(0, Math.round(num * (1 - Number(shadeDiscounts.salon) / 100))) : num;
      updated.artistPrice = shadeDiscounts.artist !== '' ? Math.max(0, Math.round(num * (1 - Number(shadeDiscounts.artist) / 100))) : num;
      updated.beauticianPrice = shadeDiscounts.beautician !== '' ? Math.max(0, Math.round(num * (1 - Number(shadeDiscounts.beautician) / 100))) : num;
    }

    onChange(updated);
  };

  // Handle role discount % change
  const handleDiscountChange = (roleKey, newPct) => {
    const updatedDiscounts = {
      ...shadeDiscounts,
      [roleKey]: newPct
    };

    let updatedPrice = shadeMrp;
    if (shadeMrp > 0 && newPct !== '' && !isNaN(Number(newPct))) {
      updatedPrice = Math.max(0, Math.round(shadeMrp * (1 - Number(newPct) / 100)));
    }

    onChange({
      ...shade,
      [`${roleKey}Price`]: updatedPrice,
      discountPercentages: updatedDiscounts,
      quantityTiers: {
        ...currentQuantityTiers,
        roleDiscounts: updatedDiscounts
      }
    });
  };

  // Handle role calculated price change (syncs discount %)
  const handlePriceChange = (roleKey, newPrice) => {
    let updatedPct = '';
    const numPrice = Number(newPrice);
    if (shadeMrp > 0 && newPrice !== '' && !isNaN(numPrice) && numPrice <= shadeMrp) {
      updatedPct = String(Math.round((1 - numPrice / shadeMrp) * 100));
    }

    const updatedDiscounts = {
      ...shadeDiscounts,
      [roleKey]: updatedPct
    };

    onChange({
      ...shade,
      [`${roleKey}Price`]: newPrice,
      discountPercentages: updatedDiscounts,
      quantityTiers: {
        ...currentQuantityTiers,
        roleDiscounts: updatedDiscounts
      }
    });
  };

  // Add new tier inline
  const handleAddTierSubmit = () => {
    setTierFormError(null);
    const minQtyNum = Number(newTierForm.minQty);
    const discNum = Number(newTierForm.additionalDiscount);

    if (!newTierForm.minQty || isNaN(minQtyNum) || minQtyNum <= 0 || !Number.isInteger(minQtyNum)) {
      setTierFormError('Minimum quantity must be a positive whole integer (e.g. 5, 10, 25).');
      return;
    }

    if (newTierForm.additionalDiscount === '' || isNaN(discNum) || discNum < 0 || discNum > 100) {
      setTierFormError('Discount percentage must be between 0% and 100%.');
      return;
    }

    if (activeRoleTiers.some(t => Number(t.minQty) === minQtyNum)) {
      setTierFormError(`A tier for minimum quantity ${minQtyNum} already exists in ${activeRoleConfig.name}.`);
      return;
    }

    const newTier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      minQty: minQtyNum,
      additionalDiscount: discNum
    };

    const updatedRoleTiers = [...activeRoleTiers, newTier].sort((a, b) => Number(a.minQty) - Number(b.minQty));

    const updatedAllTiers = {
      ...currentQuantityTiers,
      [activeRoleTab]: updatedRoleTiers,
      roleDiscounts: shadeDiscounts
    };

    onChange({
      ...shade,
      quantityTiers: updatedAllTiers
    });

    setNewTierForm({ minQty: '', additionalDiscount: '' });
    setIsAddingTier(false);
  };

  // Delete tier
  const handleDeleteTier = (tierIndex) => {
    const updatedRoleTiers = activeRoleTiers.filter((_, i) => i !== tierIndex);
    const updatedAllTiers = {
      ...currentQuantityTiers,
      [activeRoleTab]: updatedRoleTiers,
      roleDiscounts: shadeDiscounts
    };

    onChange({
      ...shade,
      quantityTiers: updatedAllTiers
    });
  };

  // Save edited tier inline
  const handleSaveEditTier = (tierIndex) => {
    const minQtyNum = Number(editTierForm.minQty);
    const discNum = Number(editTierForm.additionalDiscount);

    if (!editTierForm.minQty || isNaN(minQtyNum) || minQtyNum <= 0 || !Number.isInteger(minQtyNum)) {
      alert('Minimum quantity must be a positive whole integer.');
      return;
    }

    if (editTierForm.additionalDiscount === '' || isNaN(discNum) || discNum < 0 || discNum > 100) {
      alert('Discount percentage must be between 0% and 100%.');
      return;
    }

    if (activeRoleTiers.some((t, i) => i !== tierIndex && Number(t.minQty) === minQtyNum)) {
      alert(`A tier for minimum quantity ${minQtyNum} already exists.`);
      return;
    }

    const updatedRoleTiers = activeRoleTiers.map((t, i) => {
      if (i === tierIndex) {
        return {
          ...t,
          minQty: minQtyNum,
          additionalDiscount: discNum
        };
      }
      return t;
    }).sort((a, b) => Number(a.minQty) - Number(b.minQty));

    onChange({
      ...shade,
      quantityTiers: {
        ...currentQuantityTiers,
        [activeRoleTab]: updatedRoleTiers
      }
    });

    setEditingTierIndex(null);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-2xs overflow-hidden transition-all duration-200 hover:border-pink-200">
      {/* =====================================================================
          SHADE CARD HEADER (COLLAPSIBLE / EXPANDABLE)
          ===================================================================== */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF8FA] via-white to-white cursor-pointer select-none border-b border-gray-100"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Swatch or Image */}
          <div
            className="w-10 h-10 rounded-2xl border-2 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden relative bg-white"
            style={{ backgroundColor: shade.image ? 'white' : (shade.hexColor || '#C2477A') }}
          >
            {shade.image ? (
              <img src={shade.image} alt={shade.name} className="w-full h-full object-cover" />
            ) : (
              <Palette size={16} className="text-white drop-shadow" />
            )}
          </div>

          {/* Title & Metadata Badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs text-[#C2477A] uppercase tracking-wider">
                Shade #{index + 1}
              </span>
              <h3 className="font-black text-sm text-gray-900 truncate">
                {shade.name ? shade.name : 'Unnamed Shade'}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1 flex-wrap">
              {shade.barcode && (
                <>
                  <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                    <Barcode size={12} className="text-emerald-600" />
                    <span>{shade.barcode}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                </>
              )}
              <span>
                MRP: <strong className="text-gray-900 font-bold">₹{shadeMrp.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-gray-300">•</span>
              <span>
                General: <strong className="text-[#C2477A] font-bold">₹{rolePrices.general.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-gray-300">•</span>
              <span>
                Salon: <strong className="text-black font-bold">₹{rolePrices.salon.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-black font-semibold">
                {(currentQuantityTiers.general.length + currentQuantityTiers.salon.length + currentQuantityTiers.artist.length + currentQuantityTiers.beautician.length)} Quantity Tiers
              </span>
            </div>
          </div>
        </div>

        {/* Actions on Header */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isExpanded
                ? 'bg-[#FFF2F5] text-[#C2477A] border border-pink-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Sliders size={13} />
            <span>{isExpanded ? 'Hide Pricing & Tiers' : 'Configure Pricing & Tiers'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            title="Delete shade variant"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          EXPANDABLE INLINE CONFIGURATION BODY (NO MODAL / NO POPUP)
          ===================================================================== */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 bg-white animate-fade-in border-t border-gray-100">
          
          {/* SECTION 1: SHADE IDENTITY FIELDS */}
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/80">
              <Palette size={15} className="text-[#C2477A]" />
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wide">
                Shade Details & Identification
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block text-gray-700 font-bold text-xs mb-1">
                  Shade Name <span className="text-[#C2477A] font-black">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ruby Red / 01 Nude"
                  value={shade.name || ''}
                  onChange={(e) => updateShadeField('name', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-bold text-xs text-gray-900 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-gray-700 font-bold text-xs mb-1">
                  Color Swatch (HEX)
                </label>
                <HexColorPicker
                  value={shade.hexColor || '#C2477A'}
                  onChange={(hex, autoName) => {
                    onChange({
                      ...shade,
                      hexColor: hex,
                      ...(autoName ? { name: autoName } : {})
                    });
                  }}
                />
              </div>
            </div>

            {/* Quick Cosmetic Swatch Presets */}
            <div className="pt-2 border-t border-gray-200/60 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gray-500 mr-1 flex items-center gap-1">
                <Palette size={11} className="text-[#C2477A]" />
                <span>Quick Swatches:</span>
              </span>
              {MAKEUP_SWATCH_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...shade,
                      hexColor: preset.hex,
                      name: preset.name
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-gray-200 bg-white hover:border-[#C2477A] hover:bg-pink-50/50 text-[10px] font-bold text-gray-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title={`Select ${preset.name} (${preset.hex})`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Shade Swatch Photograph & Image Manager */}
            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-700 block">Shade Photograph (Optional):</span>
                <span className="text-[9px] text-gray-400">Lipstick swatch or packaging photo</span>
              </div>
              <ImageField
                compact={true}
                value={shade.image || ''}
                onChange={(newUrl) => updateShadeField('image', newUrl)}
                folder="shades"
                filenamePrefix="shade"
                entityName={shade.name || 'Shade'}
                label="Shade Photo"
              />
            </div>

            {/* Shade Barcode Field with Device Camera Scan Button & Hardware Scanner Support */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-700 font-bold text-xs flex items-center gap-1.5">
                  <Barcode size={13} className="text-[#C2477A]" />
                  <span>Shade Barcode (Any 1D / 2D Barcode)</span>
                </label>
                {shade.barcode && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                    ✓ Assigned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id={`shade-barcode-${index}`}
                    data-shade-barcode-idx={index}
                    placeholder="Enter or scan barcode (device camera or handheld scanner gun)..."
                    value={shade.barcode || ''}
                    onChange={(e) => updateShadeField('barcode', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-mono font-bold text-xs text-gray-900 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20"
                  />
                  {shade.barcode && (
                    <button
                      type="button"
                      onClick={() => updateShadeField('barcode', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                      title="Clear barcode"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => onOpenScanner(index)}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
                    title="Scan barcode with camera"
                  >
                    <ScanBarcode size={14} />
                    <span>Scan</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Scan with device camera, or scan directly using any connected USB or Bluetooth barcode scanner device.
              </p>
            </div>

            {/* Optional Description */}
            <div className="pt-1">
              <label className="block text-gray-700 font-bold text-xs mb-1">
                Shade Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Warm undertone with satin matte finish"
                value={shade.description || ''}
                onChange={(e) => updateShadeField('description', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:border-[#C2477A]"
              />
            </div>
          </div>

          {/* SECTION 2: SHADE PRICING & ROLE DISCOUNTS (MRP PRIMARY) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-pink-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-[#C2477A]" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-gray-900 tracking-wide">
                    Shade Pricing & Role Discounts
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    MRP is the primary price. Role discounts apply directly to this shade.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-extrabold text-gray-700">Shade Base MRP:</label>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={String(parentMrp || 1000)}
                    value={shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : parentMrp}
                    onChange={(e) => handleShadeMrpChange(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-pink-300 bg-white font-mono font-black text-sm text-gray-900 outline-none focus:border-[#C2477A]"
                  />
                </div>
              </div>
            </div>

            {/* 4-Role Discount Table */}
            <div className="overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-pink-50/50 text-gray-700 uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                    <th className="py-2.5 px-3">User Type</th>
                    <th className="py-2.5 px-3">Base MRP</th>
                    <th className="py-2.5 px-3">Discount %</th>
                    <th className="py-2.5 px-3">Price After Discount</th>
                    <th className="py-2.5 px-3 text-right">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {DISCOUNT_ROLES.map((role) => {
                    const price = rolePrices[role.id];
                    const disc = shadeDiscounts[role.id];
                    const savings = Math.max(0, shadeMrp - price);

                    return (
                      <tr key={role.id} className="hover:bg-[#FFF8FA]/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${role.badgeClass}`}>
                            {role.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-700">
                          ₹{shadeMrp.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={disc}
                              onChange={(e) => handleDiscountChange(role.id, e.target.value)}
                              className="w-16 px-2 py-1 rounded-lg border border-gray-200 font-mono font-bold text-xs text-center outline-none focus:border-[#C2477A]"
                            />
                            <span className="text-gray-400 font-bold">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              max={shadeMrp}
                              value={price}
                              onChange={(e) => handlePriceChange(role.id, e.target.value)}
                              className="w-24 px-2 py-1 rounded-lg border border-gray-200 font-mono font-black text-xs text-gray-900 outline-none focus:border-[#C2477A]"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {savings > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Save ₹{savings.toLocaleString('en-IN')} ({disc}%)
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Full Price</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: SHADE QUANTITY DISCOUNT TIERS (INLINE ONLY - ZERO MODALS) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-black" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-gray-900 tracking-wide">
                    Shade Quantity Discount Tiers
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Configure volume discount tiers for each user type specifically for {shade.name || 'this shade'}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTier(!isAddingTier);
                  setTierFormError(null);
                }}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#FFF5F8] hover:bg-[#FDF2F8] text-black border border-[#FCE4EC] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={13} />
                <span>{isAddingTier ? 'Cancel Tier' : `+ Add ${activeRoleConfig.name} Tier`}</span>
              </button>
            </div>

            {/* 4 Role Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
              {DISCOUNT_ROLES.map((role) => {
                const count = (currentQuantityTiers[role.id] || []).length;
                const isActive = activeRoleTab === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setActiveRoleTab(role.id);
                      setIsAddingTier(false);
                      setTierFormError(null);
                      setEditingTierIndex(null);
                    }}
                    className={`px-3 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#C2477A] text-white shadow-xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>{role.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count} {count === 1 ? 'Tier' : 'Tiers'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Role Summary Banner */}
            <div className="p-3 rounded-xl bg-[#FFF5F8]/50 border border-[#FCE4EC] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-violet-950 uppercase text-[11px]">
                  {activeRoleConfig.name} Pricing:
                </span>
                <span className="text-gray-500">Base MRP:</span>
                <strong className="text-gray-900 font-bold font-mono">₹{shadeMrp}</strong>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">Role Discount:</span>
                <strong className="text-[#C2477A] font-bold">{activeRoleDiscount}%</strong>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">Price After Role Discount:</span>
                <strong className="text-emerald-700 font-black font-mono">₹{activeRoleBasePrice}</strong>
              </div>
              <span className="text-[10.5px] text-gray-500 font-medium">
                Tiers apply additionally to ₹{activeRoleBasePrice}
              </span>
            </div>

            {/* INLINE ADD TIER FORM (SHOWN DIRECTLY ON PAGE, NO MODAL) */}
            {isAddingTier && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-900 uppercase tracking-wide">
                    New Quantity Tier for {activeRoleConfig.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTier(false);
                      setTierFormError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-gray-800 font-bold text-[11px] mb-1">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={newTierForm.minQty}
                      onChange={(e) => setNewTierForm({ ...newTierForm, minQty: e.target.value })}
                      className="w-full p-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-xs text-gray-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-gray-800 font-bold text-[11px] mb-1">
                      Additional Discount (%) *
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 5"
                        value={newTierForm.additionalDiscount}
                        onChange={(e) => setNewTierForm({ ...newTierForm, additionalDiscount: e.target.value })}
                        className="w-full p-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-xs text-gray-900 outline-none focus:border-amber-600"
                      />
                      <span className="font-bold text-gray-500 text-xs">%</span>
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTier(false);
                        setTierFormError(null);
                      }}
                      className="w-1/2 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTierSubmit}
                      className="w-1/2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer active:scale-95"
                    >
                      Add Tier
                    </button>
                  </div>
                </div>

                {/* Final price preview calculation */}
                {newTierForm.additionalDiscount !== '' && !isNaN(Number(newTierForm.additionalDiscount)) && (
                  <div className="text-[11px] text-amber-900 font-semibold pt-1">
                    Calculated Final Unit Price:{' '}
                    <strong className="font-mono text-emerald-800 font-bold">
                      ₹{calculateTierFinalPrice(activeRoleBasePrice, Number(newTierForm.additionalDiscount)).toLocaleString('en-IN')}
                    </strong>{' '}
                    / unit (Role Price ₹{activeRoleBasePrice} − {newTierForm.additionalDiscount}%)
                  </div>
                )}

                {tierFormError && (
                  <p className="text-xs text-rose-700 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle size={13} /> {tierFormError}
                  </p>
                )}
              </div>
            )}

            {/* ACTIVE ROLE TIERS TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
                    <th className="py-2.5 px-3 w-16">Tier</th>
                    <th className="py-2.5 px-3">Minimum Quantity</th>
                    <th className="py-2.5 px-3">Additional Discount</th>
                    <th className="py-2.5 px-3">Final Price / Unit</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRoleTiers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                        No quantity tiers configured for {activeRoleConfig.name}. Base price (₹{activeRoleBasePrice}) applies at all quantities.
                      </td>
                    </tr>
                  ) : (
                    activeRoleTiers.map((tier, idx) => {
                      const isEditing = editingTierIndex === idx;
                      const tierFinalPrice = calculateTierFinalPrice(activeRoleBasePrice, Number(tier.additionalDiscount) || 0);

                      if (isEditing) {
                        return (
                          <tr key={tier.id || idx} className="bg-amber-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-700">#{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="1"
                                value={editTierForm.minQty}
                                onChange={(e) => setEditTierForm({ ...editTierForm, minQty: e.target.value })}
                                className="w-20 px-2 py-1 rounded-lg border border-amber-300 font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editTierForm.additionalDiscount}
                                  onChange={(e) => setEditTierForm({ ...editTierForm, additionalDiscount: e.target.value })}
                                  className="w-16 px-2 py-1 rounded-lg border border-amber-300 font-mono font-bold text-xs"
                                />
                                <span className="text-gray-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                              ₹{calculateTierFinalPrice(activeRoleBasePrice, Number(editTierForm.additionalDiscount) || 0)}
                            </td>
                            <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSaveEditTier(idx)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTierIndex(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg font-bold text-[10px]"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={tier.id || idx} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-gray-500">#{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-extrabold text-gray-900">
                            {tier.minQty} units
                          </td>
                          <td className="py-3 px-3 font-bold text-black">
                            +{tier.additionalDiscount}%
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-gray-900 text-sm">
                            ₹{tierFinalPrice.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-gray-400 font-normal">/ unit</span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTierIndex(idx);
                                setEditTierForm({
                                  minQty: String(tier.minQty),
                                  additionalDiscount: String(tier.additionalDiscount)
                                });
                              }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
                              title="Edit tier"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(idx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete tier"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
