import React from 'react';
import {
  Sparkles,
  Building2,
  Palette,
  Scissors,
  Users,
  Percent,
  IndianRupee,
  ArrowRight,
  Info
} from 'lucide-react';

export const PRICING_ROLES = [
  {
    key: 'general',
    priceKey: 'generalPrice',
    name: 'General User',
    tag: 'Retail Consumer',
    icon: Users,
    placeholderPct: 'e.g. 10',
    colorText: 'text-teal-700',
    accentColor: '#0D9488',
    ringColor: 'focus:border-teal-600 focus:ring-2 focus:ring-teal-200',
    badgeBg: 'bg-teal-50 text-teal-700 border border-teal-200',
    rowBg: 'hover:bg-teal-50/20'
  },
  {
    key: 'salon',
    priceKey: 'salonPrice',
    name: 'Salon Owner',
    tag: 'B2B Wholesale',
    icon: Building2,
    placeholderPct: 'e.g. 30',
    colorText: 'text-[#C2477A]',
    accentColor: '#C2477A',
    ringColor: 'focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20',
    badgeBg: 'bg-[#FFF2F5] text-[#C2477A] border border-pink-200',
    rowBg: 'hover:bg-rose-50/20'
  },
  {
    key: 'artist',
    priceKey: 'artistPrice',
    name: 'Makeup Artist',
    tag: 'Pro Artist',
    icon: Palette,
    placeholderPct: 'e.g. 35',
    colorText: 'text-black',
    accentColor: '#7C3AED',
    ringColor: 'focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20',
    badgeBg: 'bg-[#FFF5F8] text-black border border-[#FCE4EC]',
    rowBg: 'hover:bg-[#FFF5F8]/20'
  },
  {
    key: 'beautician',
    priceKey: 'beauticianPrice',
    name: 'Beautician',
    tag: 'Partner Pro',
    icon: Scissors,
    placeholderPct: 'e.g. 32',
    colorText: 'text-rose-700',
    accentColor: '#E11D48',
    ringColor: 'focus:border-rose-600 focus:ring-2 focus:ring-rose-200',
    badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
    rowBg: 'hover:bg-rose-50/20'
  }
];

/**
 * RolePricingMatrix Component - 4 Roles Fully Configurable
 * 
 * Columns:
 * 1. User Type (General User, Salon Owner, Makeup Artist, Beautician)
 * 2. Base MRP (₹) (The product's base price)
 * 3. Discount % (Configurable discount % for ALL 4 roles)
 * 4. Calculated Price (₹) (Automatically calculated: MRP - Role Discount %)
 * 
 * Rules:
 * - All role prices start from MRP, never ₹0!
 * - General User discount % is fully supported and configurable.
 * - Changing Discount % recalculates Calculated Price immediately.
 * - Changing Calculated Price recalculates Discount % (two-way sync).
 */
export default function RolePricingMatrix({
  basePrice,
  onBasePriceChange,
  rolePrices = {},
  onRolePriceChange,
  discountPercentages = {},
  onDiscountPercentageChange,
  showBasePriceInput = false,
  title = "Role-Based Discount Pricing Matrix"
}) {
  const numericBasePrice = Number(basePrice) || 0;

  // Handle Base MRP change
  const handleBaseChange = (e) => {
    const val = e.target.value;
    if (onBasePriceChange) {
      onBasePriceChange(val);
    }

    const newBase = Number(val);
    if (!isNaN(newBase) && newBase > 0) {
      PRICING_ROLES.forEach(({ key, priceKey }) => {
        const pctStr = discountPercentages[key];
        if (pctStr !== '' && pctStr !== undefined && pctStr !== null) {
          const numPct = parseFloat(pctStr);
          if (!isNaN(numPct)) {
            const calculatedPrice = Math.max(0, Math.round(newBase * (1 - numPct / 100)));
            if (onRolePriceChange) {
              onRolePriceChange(priceKey, calculatedPrice);
            }
            return;
          }
        }
        // If no discount configured, role price defaults to MRP (never 0!)
        if (onRolePriceChange) {
          onRolePriceChange(priceKey, newBase);
        }
      });
    }
  };

  // Handle Percentage change for any role (including General User)
  const handlePercentageChange = (roleKey, priceKey, rawVal) => {
    let val = rawVal;
    if (val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        val = String(Math.min(100, Math.max(0, num)));
      }
    }

    if (onDiscountPercentageChange) {
      onDiscountPercentageChange(roleKey, val);
    }

    if (val === '' || val === null || val === undefined) {
      // If discount is cleared, role price resets to full MRP (never 0!)
      if (onRolePriceChange) {
        onRolePriceChange(priceKey, numericBasePrice > 0 ? numericBasePrice : '');
      }
      return;
    }

    const numPct = parseFloat(val);
    if (!isNaN(numPct) && numericBasePrice > 0) {
      const calculatedPrice = Math.max(0, Math.round(numericBasePrice * (1 - numPct / 100)));
      if (onRolePriceChange) {
        onRolePriceChange(priceKey, calculatedPrice);
      }
    }
  };

  // Handle Direct Price change for any role (two-way sync)
  const handlePriceChange = (roleKey, priceKey, val) => {
    if (onRolePriceChange) {
      onRolePriceChange(priceKey, val);
    }

    if (val !== '' && numericBasePrice > 0) {
      const numPrice = parseFloat(val);
      if (!isNaN(numPrice) && numPrice >= 0 && numPrice <= numericBasePrice) {
        const derivedPct = Math.round((1 - numPrice / numericBasePrice) * 100);
        if (onDiscountPercentageChange) {
          onDiscountPercentageChange(roleKey, String(derivedPct));
        }
      } else if (!isNaN(numPrice) && numPrice > numericBasePrice) {
        // Price exceeds MRP -> 0% discount
        if (onDiscountPercentageChange) {
          onDiscountPercentageChange(roleKey, '0');
        }
      }
    } else if (val === '' && onDiscountPercentageChange) {
      onDiscountPercentageChange(roleKey, '');
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-pink-100/90 bg-white shadow-xs overflow-hidden transition-all">
      {/* Table Header / Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-[#FFF5F7] via-white to-[#FFF5F8] border-b border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#FFF2F5] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Sparkles size={15} />
          </span>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-wide uppercase">
              {title}
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              MRP is the primary base price • Configure independent discount % for all 4 roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100/80 text-[#C2477A] border border-pink-200">
            All 4 Roles Supported
          </span>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Calculation
          </span>
        </div>
      </div>

      {/* Optional Top Base MRP Input if standalone */}
      {showBasePriceInput && (
        <div className="p-4 bg-[#FFF9FA] border-b border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-[#C2477A]" />
            <label className="font-black text-xs text-gray-900 uppercase">
              Product Primary Base MRP (₹) *
            </label>
          </div>
          <div className="relative w-44">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              min="0"
              required
              placeholder="e.g. 1000"
              value={basePrice !== undefined && basePrice !== null ? basePrice : ''}
              onChange={handleBaseChange}
              className="w-full pl-7 pr-3 py-2 rounded-xl border border-pink-300 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-black text-gray-900 text-xs shadow-2xs text-center"
            />
          </div>
        </div>
      )}

      {/* Modern Responsive 4-Role Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FFF5F8]/70 border-b border-pink-100/90 text-gray-700">
              <th className="py-3 px-4 sm:px-5 font-extrabold text-[11px] uppercase tracking-wider text-[#C2477A] w-2/5">
                User Type
              </th>
              <th className="py-3 px-4 font-extrabold text-[11px] uppercase tracking-wider text-gray-700 text-center w-1/5">
                Base MRP (₹)
              </th>
              <th className="py-3 px-4 font-extrabold text-[11px] uppercase tracking-wider text-gray-700 text-center w-1/5">
                Discount %
              </th>
              <th className="py-3 px-4 sm:px-5 font-extrabold text-[11px] uppercase tracking-wider text-[#C2477A] text-right w-1/5">
                Calculated Price (₹)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRICING_ROLES.map((role) => {
              const Icon = role.icon;
              const currentPct = discountPercentages[role.key] !== undefined && discountPercentages[role.key] !== null
                ? discountPercentages[role.key]
                : '';
              
              // Role price: if configured, use rolePrices[role.priceKey]; otherwise default to numericBasePrice (never 0!)
              let rawPrice = rolePrices[role.priceKey];
              let effectivePrice = rawPrice !== undefined && rawPrice !== '' && rawPrice !== null
                ? Number(rawPrice)
                : (numericBasePrice > 0 ? numericBasePrice : 0);

              const hasPct = currentPct !== '' && !isNaN(Number(currentPct)) && Number(currentPct) > 0;
              const hasBase = numericBasePrice > 0;
              const savings = hasBase && hasPct ? Math.max(0, numericBasePrice - effectivePrice) : 0;

              return (
                <tr key={role.key} className={`${role.rowBg} transition-colors`}>
                  {/* 1. User Type Column */}
                  <td className="py-3.5 px-4 sm:px-5 align-middle">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${role.badgeBg} flex items-center justify-center font-bold shadow-2xs shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-extrabold text-xs sm:text-[13px] ${role.colorText}`}>
                          {role.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold hidden md:inline">
                          ({role.tag})
                        </span>
                        {hasPct && (
                          <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-white text-gray-700 border border-gray-200 shadow-2xs">
                            {currentPct}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Base MRP Column (Starts from product MRP) */}
                  <td className="py-3.5 px-4 align-middle text-center">
                    <span className="font-bold text-xs text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200/80 inline-block font-mono">
                      ₹{numericBasePrice ? numericBasePrice.toLocaleString('en-IN') : '0'}
                    </span>
                  </td>

                  {/* 3. Discount % Column (Editable for ALL 4 Roles) */}
                  <td className="py-3.5 px-4 align-middle text-center">
                    <div className="relative inline-block w-28 mx-auto">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder={role.placeholderPct}
                        value={currentPct}
                        onChange={(e) => handlePercentageChange(role.key, role.priceKey, e.target.value)}
                        className={`w-full pr-7 pl-3 py-2 rounded-xl border border-gray-200 outline-none ${role.ringColor} bg-white font-extrabold text-gray-900 text-xs shadow-2xs text-center transition-all`}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs pointer-events-none">
                        %
                      </div>
                    </div>
                  </td>

                  {/* 4. Calculated Price Column (Role Price = MRP − Role Discount %) */}
                  <td className="py-3.5 px-4 sm:px-5 align-middle text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="relative inline-block w-32">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs pointer-events-none">
                          ₹
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder={numericBasePrice ? `₹${numericBasePrice}` : '₹0'}
                          value={rawPrice !== undefined && rawPrice !== '' && rawPrice !== null ? rawPrice : (numericBasePrice > 0 ? numericBasePrice : '')}
                          onChange={(e) => handlePriceChange(role.key, role.priceKey, e.target.value)}
                          className={`w-full pl-6 pr-2.5 py-2 rounded-xl border border-gray-200 outline-none ${role.ringColor} bg-white font-black ${role.colorText} text-xs shadow-2xs text-right transition-all`}
                        />
                      </div>

                      {/* Savings Breakdown Pill */}
                      {hasPct && hasBase && savings > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 shadow-2xs">
                          Save ₹{savings.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {numericBasePrice > 0 ? 'Full MRP' : 'Enter MRP'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Formula Banner */}
      <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Info size={13} className="text-[#C2477A] shrink-0" />
          <span>
            <strong>Formula:</strong> Role Price = Base MRP × (1 − Role Discount / 100). All role prices start from MRP, never ₹0.
          </span>
        </div>
        <div className="font-mono text-[10px] text-gray-400">
          Order: MRP → Role Discount → Role Price → Quantity Discount
        </div>
      </div>
    </div>
  );
}
