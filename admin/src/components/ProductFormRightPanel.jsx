import React, { useState, useMemo } from 'react';
import {
  Eye,
  Calculator,
  Layers,
  ImageIcon,
  Tag,
  Barcode,
  Building2,
  CheckCircle2,
  Percent,
  Sparkles,
  Info,
  Package,
  Palette,
  Search,
  List,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Boxes,
  Hash
} from 'lucide-react';
import {
  DISCOUNT_ROLES,
  getProductBasePriceForRole,
  getProductRoleDiscount,
  calculateTierFinalPrice,
  getApplicableTierForRole
} from '../utils/quantityTiersUtils';

/**
 * ProductFormRightPanel Component
 * 
 * Live read-only summary and pricing preview of the current left-side form state.
 * Contains:
 * 1. Product Summary (Every detail visible: Identifiers, Inventory, 4-Role Pricing, Variants, Specs, Discovery, Rich Highlights)
 * 2. Price Preview (4 role tabs with step-by-step unit price simulator)
 * 3. Quantity Discount Breakdown (Dynamically generated tier ranges)
 */
export default function ProductFormRightPanel({
  formData,
  roleDiscounts,
  className = ''
}) {
  // Selected role for preview (default: General User)
  const [selectedRole, setSelectedRole] = useState('general');
  // Order quantity simulator input for unit preview (default: 10 units)
  const [previewQtyInput, setPreviewQtyInput] = useState('10');
  // Active sub-tab inside Product Summary
  const [summaryTab, setSummaryTab] = useState('overview');

  // Role configuration
  const activeRoleConfig = DISCOUNT_ROLES.find(r => r.id === selectedRole) || DISCOUNT_ROLES[0];

  // Primary Base MRP
  const numericMrp = Number(formData.mrp) || 0;

  // Role discount % for selected role
  const roleDiscountPct = useMemo(() => {
    if (roleDiscounts && roleDiscounts[selectedRole] !== '' && !isNaN(Number(roleDiscounts[selectedRole]))) {
      return Number(roleDiscounts[selectedRole]);
    }
    return getProductRoleDiscount(formData, selectedRole);
  }, [roleDiscounts, formData, selectedRole]);

  // Role base price (MRP - Role Discount %)
  const roleBasePrice = useMemo(() => {
    return getProductBasePriceForRole(
      {
        ...formData,
        discountPercentages: roleDiscounts
      },
      selectedRole
    );
  }, [formData, roleDiscounts, selectedRole]);

  // Role discount monetary savings
  const roleDiscountSavings = numericMrp > 0 && roleDiscountPct > 0
    ? Math.round(numericMrp * (roleDiscountPct / 100))
    : 0;

  // Simulated order quantity
  const simQty = Math.max(1, Number(previewQtyInput) || 1);

  // Applicable tier for selected role and order quantity
  const applicableTier = useMemo(() => {
    return getApplicableTierForRole(
      {
        ...formData,
        discountPercentages: roleDiscounts,
        quantityTiers: formData.quantityTiers
      },
      selectedRole,
      simQty
    );
  }, [formData, roleDiscounts, selectedRole, simQty]);

  // Applicable quantity discount %
  const qtyDiscountPct = applicableTier && Number(applicableTier.additionalDiscount) > 0
    ? Number(applicableTier.additionalDiscount)
    : 0;

  // Final Price per unit
  const finalUnitPrice = useMemo(() => {
    return calculateTierFinalPrice(roleBasePrice, qtyDiscountPct);
  }, [roleBasePrice, qtyDiscountPct]);

  // Quantity discount monetary savings per unit
  const qtyDiscountSavings = roleBasePrice > 0 && qtyDiscountPct > 0
    ? Math.round(roleBasePrice * (qtyDiscountPct / 100))
    : 0;

  // Total order calculations
  const totalOrderValue = finalUnitPrice * simQty;
  const totalMrpValue = numericMrp * simQty;
  const totalSavings = Math.max(0, totalMrpValue - totalOrderValue);

  // All 4 role prices comparison
  const allRolePrices = useMemo(() => {
    return DISCOUNT_ROLES.map(role => {
      const discount = (roleDiscounts && roleDiscounts[role.id] !== '' && !isNaN(Number(roleDiscounts[role.id])))
        ? Number(roleDiscounts[role.id])
        : getProductRoleDiscount(formData, role.id);

      const price = getProductBasePriceForRole(
        {
          ...formData,
          discountPercentages: roleDiscounts
        },
        role.id
      );

      return {
        ...role,
        discountPct: discount,
        price,
        savings: numericMrp > 0 ? Math.max(0, numericMrp - price) : 0
      };
    });
  }, [formData, roleDiscounts, numericMrp]);

  // Normalized specifications list
  const specificationsList = useMemo(() => {
    const specs = formData.specifications || {};
    const entries = [];
    Object.entries(specs).forEach(([k, v]) => {
      if (v && typeof v === 'string' && v.trim()) {
        entries.push({ key: k, value: v.trim() });
      }
    });
    return entries;
  }, [formData.specifications]);

  // Variants list
  const shadesList = useMemo(() => {
    return Array.isArray(formData.shades) ? formData.shades : [];
  }, [formData.shades]);

  // Rich data lists
  const searchKeywords = useMemo(() => Array.isArray(formData.searchKeywords) ? formData.searchKeywords : [], [formData.searchKeywords]);
  const searchAliases = useMemo(() => Array.isArray(formData.searchAliases) ? formData.searchAliases : [], [formData.searchAliases]);
  const keyPoints = useMemo(() => Array.isArray(formData.keyPoints) ? formData.keyPoints : [], [formData.keyPoints]);
  const benefits = useMemo(() => Array.isArray(formData.benefits) ? formData.benefits : [], [formData.benefits]);
  const highlights = useMemo(() => Array.isArray(formData.highlights) ? formData.highlights : [], [formData.highlights]);

  // Dynamically generated quantity tier ranges for active role
  const dynamicTierRanges = useMemo(() => {
    const rawTiers = (formData.quantityTiers && formData.quantityTiers[selectedRole]) || [];
    const validSorted = [...rawTiers]
      .filter(t => t && t.minQty !== '' && Number(t.minQty) > 0)
      .sort((a, b) => Number(a.minQty) - Number(b.minQty));

    if (validSorted.length === 0) return [];

    const ranges = [];
    const firstMin = Number(validSorted[0].minQty);

    // Range below the first tier (if first tier starts above 1)
    if (firstMin > 1) {
      ranges.push({
        rangeLabel: `1–${firstMin - 1} units`,
        discountPct: 0,
        finalPrice: roleBasePrice,
        isBase: true
      });
    }

    // Explicit configured tiers
    validSorted.forEach((tier, idx) => {
      const currentMin = Number(tier.minQty);
      const nextTier = validSorted[idx + 1];
      const nextMin = nextTier ? Number(nextTier.minQty) : null;

      const rangeLabel = nextMin && nextMin > currentMin + 1
        ? `${currentMin}–${nextMin - 1} units`
        : nextMin === currentMin + 1
        ? `${currentMin} units`
        : `${currentMin}+ units`;

      const disc = Number(tier.additionalDiscount) || 0;
      const tierFinalPrice = calculateTierFinalPrice(roleBasePrice, disc);

      ranges.push({
        rangeLabel,
        discountPct: disc,
        finalPrice: tierFinalPrice,
        isBase: false
      });
    });

    return ranges;
  }, [formData.quantityTiers, selectedRole, roleBasePrice]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* =====================================================================
          1. PRODUCT SUMMARY (EVERY DETAIL VISIBLE FOR CLEAR CLARIFICATION)
          ===================================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 p-5 shadow-2xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFF2F5] text-[#C2477A] flex items-center justify-center font-bold">
              <Eye size={15} />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
              Product Summary
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            formData.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {formData.status === 'active' ? '● Active' : 'Draft'}
          </span>
        </div>

        {/* Product Visual Card with category breadcrumb & badges */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFF9FA] border border-pink-100/80">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-pink-200 shadow-2xs shrink-0 flex items-center justify-center">
            {formData.image ? (
              <img
                src={formData.image}
                alt="Product thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80';
                }}
              />
            ) : (
              <ImageIcon size={22} className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-black text-xs text-gray-900 leading-snug line-clamp-2">
              {formData.name?.trim() || 'Untitled Product'}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              <span className="font-bold text-[#C2477A] bg-pink-50 px-1.5 py-0.5 rounded">
                {formData.brandName || 'Brand Partner'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 font-medium">
                {formData.category || 'Makeup'}
              </span>
              {formData.subcategory && (
                <>
                  <span className="text-gray-400">›</span>
                  <span className="text-gray-700 font-semibold">
                    {formData.subcategory}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Tabs for Clear Clarification without clutter */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'pricing', label: '4-Role Prices' },
            { id: 'variants', label: `Variants (${shadesList.length})` },
            { id: 'specs', label: 'Specs & Discovery' },
            { id: 'all', label: 'All Details' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSummaryTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                summaryTab === tab.id
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview (Identifiers, Inventory, Base Pricing) */}
        {(summaryTab === 'overview' || summaryTab === 'all') && (
          <div className="space-y-2.5 text-xs">
            {summaryTab === 'all' && (
              <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <Tag size={12} className="text-[#C2477A]" />
                <span>Identifiers & Details</span>
              </div>
            )}
            <div className="divide-y divide-gray-100 rounded-xl bg-gray-50/70 p-3 border border-gray-100">
              <div className="py-1.5 flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1">
                  <Hash size={12} className="text-gray-400" /> SKU:
                </span>
                <span className="font-mono font-bold text-gray-900 text-[11px]">
                  {formData.sku?.trim() || <span className="text-gray-400 font-normal">Auto-assigned upon save</span>}
                </span>
              </div>

              <div className="py-1.5 flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1">
                  <Barcode size={12} className="text-gray-400" /> Barcode:
                </span>
                <span className="font-mono text-[11px] font-bold text-gray-900">
                  {formData.barcode ? (
                    <span>
                      {formData.barcode}
                      <span className="text-[9.5px] text-gray-500 font-medium ml-1">
                        ({formData.barcode_format || 'EAN-13'})
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending Scan</span>
                  )}
                </span>
              </div>

              <div className="py-1.5 flex justify-between items-center">
                <span className="text-gray-500">Base MRP:</span>
                <span className="font-mono font-black text-gray-900">
                  ₹{numericMrp ? numericMrp.toLocaleString('en-IN') : '0'}
                </span>
              </div>

              <div className="py-1.5 flex justify-between items-center">
                <span className="text-gray-500">General Selling Price:</span>
                <span className="font-mono font-black text-[#C2477A]">
                  ₹{formData.generalPrice
                    ? Number(formData.generalPrice).toLocaleString('en-IN')
                    : (numericMrp ? numericMrp.toLocaleString('en-IN') : '0')}
                </span>
              </div>

              <div className="py-1.5 flex justify-between items-center">
                <span className="text-gray-500">Variants Configured:</span>
                <span className="font-bold text-black bg-[#FFF5F8] px-2 py-0.5 rounded-full text-[10.5px]">
                  {shadesList.length} {shadesList.length === 1 ? 'variant' : 'variants'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 4-Role Pricing Breakdown */}
        {(summaryTab === 'pricing' || summaryTab === 'all') && (
          <div className="space-y-2 text-xs">
            <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pt-1">
              <Calculator size={12} className="text-[#C2477A]" />
              <span>Role Pricing Matrix</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allRolePrices.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-800">{r.shortName}</span>
                    <span className="text-[10px] font-bold text-[#C2477A] bg-pink-50 px-1 rounded">
                      {r.discountPct}% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="font-black text-xs text-gray-900">
                      ₹{r.price.toLocaleString('en-IN')}
                    </span>
                    {r.savings > 0 && (
                      <span className="text-[9.5px] text-emerald-600 font-semibold">
                        save ₹{r.savings}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Variants Detail */}
        {(summaryTab === 'variants' || summaryTab === 'all') && (
          <div className="space-y-2 text-xs">
            <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center justify-between pt-1">
              <span className="flex items-center gap-1.5">
                <Palette size={12} className="text-[#C2477A]" />
                <span>Variants & Shades</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold">
                {shadesList.length} total
              </span>
            </div>

            {shadesList.length === 0 ? (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center text-gray-400 text-xs">
                No child variants configured (Single Product).
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
                {shadesList.map((shade, idx) => (
                  <div
                    key={shade.id || idx}
                    className="p-2 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between gap-2 text-xs hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: shade.hexColor || '#C2477A' }}
                        title={shade.hexColor}
                      />
                      <div className="truncate">
                        <span className="font-bold text-gray-900 block truncate">
                          {shade.name || `Variant ${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {shade.code ? `Code: ${shade.code}` : ''} {shade.sku ? `• SKU: ${shade.sku}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-gray-900 text-[11px]">
                        ₹{(shade.generalPrice || shade.mrp || numericMrp).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Specs & Discovery Details */}
        {(summaryTab === 'specs' || summaryTab === 'all') && (
          <div className="space-y-3 text-xs">
            {/* Specifications */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <List size={12} className="text-teal-600" />
                <span>Specifications</span>
              </div>
              {specificationsList.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 text-xs italic">
                  No specifications defined yet.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                  {specificationsList.map((spec, i) => (
                    <div key={i} className="truncate">
                      <span className="text-gray-500 capitalize">{spec.key}: </span>
                      <span className="font-bold text-gray-800">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Points & Benefits */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Key Points & Benefits</span>
              </div>
              {keyPoints.length === 0 && benefits.length === 0 ? (
                <div className="p-2 rounded-xl bg-gray-50 text-gray-400 text-xs italic">
                  No key points or benefits generated yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {keyPoints.map((kp, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10.5px] font-bold border border-emerald-200">
                      ✓ {kp}
                    </span>
                  ))}
                  {benefits.map((b, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#FFF5F8] text-black text-[10.5px] font-bold border border-[#FCE4EC]">
                      ✓ {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#C2477A]" />
                  <span>Highlights ({highlights.length})</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1 text-[11px] text-gray-700">
                  {highlights.map((hl, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C2477A] font-bold">•</span>
                      <span className="leading-tight">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Keywords & Aliases */}
            {(searchKeywords.length > 0 || searchAliases.length > 0) && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Search size={12} className="text-[#C2477A]" />
                  <span>Search Discovery ({searchKeywords.length + searchAliases.length})</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {searchKeywords.map((kw, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#FFF5F8] text-black text-[10px] font-medium border border-[#FCE4EC]/60 font-mono">
                      {kw}
                    </span>
                  ))}
                  {searchAliases.map((al, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#FFF5F8] text-black text-[10px] font-medium border border-[#FCE4EC]/60 font-mono">
                      ~{al}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          2. LIVE PRICE PREVIEW (ROLE TABS + STEP-BY-STEP CALCULATION)
          ===================================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-pink-100/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFF5F8] text-black flex items-center justify-center font-bold">
              <Calculator size={15} />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
              Price Preview
            </h3>
          </div>
          <span className="text-[10px] font-bold text-black bg-[#FFF5F8] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
            Live Calculation
          </span>
        </div>

        {/* 4 Role Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
          {DISCOUNT_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer text-center ${
                selectedRole === role.id
                  ? `${role.tabActive} shadow-2xs`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {role.shortName}
            </button>
          ))}
        </div>

        {/* Sample Order Quantity Input (for applicable tier & unit price preview) */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <span className="font-bold text-gray-600">Sample Order Quantity:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={previewQtyInput}
              onChange={(e) => setPreviewQtyInput(e.target.value)}
              className="w-16 p-1 rounded-lg border border-gray-300 font-mono font-bold text-center bg-white text-gray-900 text-xs outline-none focus:border-[#C2477A]"
            />
            <span className="font-medium text-gray-500 text-[11px]">units</span>
          </div>
        </div>

        {/* Step-by-Step Pricing Breakdown */}
        <div className="space-y-1.5 text-xs">
          {/* Base MRP */}
          <div className="flex justify-between items-center text-gray-600">
            <span>Base MRP:</span>
            <span className="font-mono font-bold text-gray-900">
              ₹{numericMrp ? numericMrp.toLocaleString('en-IN') : '0'}
            </span>
          </div>

          {/* Role Discount */}
          <div className="flex justify-between items-center text-gray-600">
            <span className="flex items-center gap-1">
              <span>Role Discount</span>
              <span className="text-[10px] text-[#C2477A] font-bold">({roleDiscountPct}%):</span>
            </span>
            <span className="font-mono font-bold text-[#C2477A]">
              {roleDiscountSavings > 0 ? `-₹${roleDiscountSavings.toLocaleString('en-IN')}` : '₹0'}
            </span>
          </div>

          {/* Price After Role Discount */}
          <div className="flex justify-between items-center text-gray-800 font-semibold border-t border-dashed border-gray-200 pt-1.5">
            <span>Price After Role Discount:</span>
            <span className="font-mono font-bold">
              ₹{roleBasePrice.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Applicable Quantity Discount */}
          <div className="flex justify-between items-center text-gray-600">
            <span className="flex items-center gap-1">
              <span>Quantity Discount</span>
              <span className="text-[10px] text-black font-bold">
                {qtyDiscountPct > 0 ? `(${qtyDiscountPct}%):` : '(0%):'}
              </span>
            </span>
            <span className="font-mono font-bold text-black">
              {qtyDiscountSavings > 0 ? `-₹${qtyDiscountSavings.toLocaleString('en-IN')}` : '₹0'}
            </span>
          </div>

          {applicableTier && (
            <div className="text-[10.5px] text-black bg-[#FFF5F8] p-1.5 rounded-lg border border-[#FCE4EC]/80 font-medium">
              Applied tier: ≥ {applicableTier.minQty} units (+{applicableTier.additionalDiscount}% discount)
            </div>
          )}

          {/* Final Unit Price */}
          <div className="border-t-2 border-[#C2477A]/20 pt-2 flex justify-between items-center">
            <div>
              <span className="font-black text-xs uppercase text-gray-900 block">
                FINAL PRICE / UNIT
              </span>
              <span className="text-[10px] text-gray-400">
                Total for {simQty} units: ₹{totalOrderValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="font-black text-base sm:text-lg text-emerald-700 font-mono">
                ₹{finalUnitPrice.toLocaleString('en-IN')}
              </span>
              {totalSavings > 0 && (
                <span className="block text-[10px] font-bold text-emerald-600">
                  Total Saved ₹{totalSavings.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. QUANTITY DISCOUNT BREAKDOWN (READ-ONLY LIVE RANGES)
          ===================================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-pink-100/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Layers size={15} />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
              Quantity Discount Breakdown
            </h3>
          </div>
          <span className="text-[10.5px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            {activeRoleConfig.name}
          </span>
        </div>

        {dynamicTierRanges.length === 0 ? (
          <div className="py-4 text-center text-gray-400 text-xs space-y-1">
            <p className="font-medium text-gray-500">No volume tiers configured for {activeRoleConfig.name}.</p>
            <p className="text-[10.5px]">Base role price applies at all order quantities.</p>
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            {dynamicTierRanges.map((range, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between transition-colors hover:bg-pink-50/40"
              >
                <div>
                  <span className="font-extrabold text-gray-900 block">{range.rangeLabel}</span>
                  <span className={`text-[10.5px] font-bold ${range.isBase ? 'text-gray-400' : 'text-[#C2477A]'}`}>
                    {range.isBase ? 'No additional discount' : `${range.discountPct}% additional discount`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-gray-900 font-mono">
                    ₹{range.finalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-400 block">/ unit</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-1 text-[10.5px] text-gray-400 font-medium flex items-center gap-1 border-t border-gray-100">
          <Info size={12} className="text-[#C2477A] shrink-0" />
          <span>Configured via the Quantity Tiers section on the left.</span>
        </div>
      </div>
    </div>
  );
}
