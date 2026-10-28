/**
 * Per-Product Quantity Discount Utilities
 * Completely separates quantity discount configurations for:
 * 1. General User (Retail MRP)
 * 2. Salon Owner
 * 3. Makeup Artist
 * 4. Beautician
 *
 * Fully manual admin-controlled configuration with NO auto-derivation or cross-role sharing.
 */

export const DISCOUNT_ROLES = [
  {
    id: 'general',
    name: 'General User',
    shortName: 'General',
    basePriceLabel: 'Retail MRP Base Price',
    color: '#0D9488',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    tabActive: 'bg-teal-700 text-white shadow-xs',
    accentBorder: 'border-teal-600',
    tag: 'Retail'
  },
  {
    id: 'salon',
    name: 'Salon Owner',
    shortName: 'Salon',
    basePriceLabel: 'Salon Base Price',
    color: '#CE4270',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-[#CE4270]',
    badgeBorder: 'border-pink-200',
    tabActive: 'bg-[#CE4270] text-white shadow-xs',
    accentBorder: 'border-[#CE4270]',
    tag: 'B2B'
  },
  {
    id: 'artist',
    name: 'Makeup Artist',
    shortName: 'Artist',
    basePriceLabel: 'Artist Base Price',
    color: '#7C3AED',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    tabActive: 'bg-purple-700 text-white shadow-xs',
    accentBorder: 'border-purple-600',
    tag: 'Pro'
  },
  {
    id: 'beautician',
    name: 'Beautician',
    shortName: 'Beautician',
    basePriceLabel: 'Beautician Base Price',
    color: '#E11D48',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    tabActive: 'bg-rose-600 text-white shadow-xs',
    accentBorder: 'border-rose-600',
    tag: 'Partner'
  }
];

export const ALL_ROLE_KEYS = ['general', 'salon', 'artist', 'beautician'];

export const getDefaultRoleTiers = () => [];

export const getDefaultQuantityTiers = () => ({
  general: [],
  salon: [],
  artist: [],
  beautician: []
});

/**
 * Normalizes any quantity tiers format (role-separated, legacy flat array, or JSON string)
 * into a guaranteed independent role-keyed structure for all 4 roles:
 * {
 *   general: [{ id, role: 'general', minQty, additionalDiscount }],
 *   salon: [{ id, role: 'salon', minQty, additionalDiscount }],
 *   artist: [{ id, role: 'artist', minQty, additionalDiscount }],
 *   beautician: [{ id, role: 'beautician', minQty, additionalDiscount }]
 * }
 */
export const normalizeQuantityTiers = (raw) => {
  if (!raw) {
    return getDefaultQuantityTiers();
  }

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return getDefaultQuantityTiers();
    }
  }

  // Role-keyed object or legacy wrapper with nested quantityTiers
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const sharedTiers = Array.isArray(parsed.quantityTiers) ? parsed.quantityTiers : (Array.isArray(parsed.quantity_tiers) ? parsed.quantity_tiers : null);
    const result = {};

    for (const r of ALL_ROLE_KEYS) {
      const roleTiers = Array.isArray(parsed[r]) ? parsed[r] : (sharedTiers || []);
      result[r] = roleTiers.map((t, idx) => ({
        id: t.id || `${r}_${Date.now()}_${idx}`,
        role: r,
        minQty: t.minQty === '' || t.minQty === null || t.minQty === undefined ? '' : Number(t.minQty),
        maxQty: t.maxQty === '' || t.maxQty === null || t.maxQty === undefined ? '' : Number(t.maxQty),
        additionalDiscount: t.additionalDiscount !== undefined && t.additionalDiscount !== null && t.additionalDiscount !== ''
          ? Number(t.additionalDiscount)
          : (t.discount !== undefined && t.discount !== null && t.discount !== '' ? Number(t.discount) : '')
      }));
    }
    return result;
  }

  // Legacy flat array migration
  if (Array.isArray(parsed)) {
    const hasRoleProps = parsed.some(t => t && t.role && ALL_ROLE_KEYS.includes(t.role));
    if (hasRoleProps) {
      const result = {};
      for (const r of ALL_ROLE_KEYS) {
        const matching = parsed
          .filter(t => t && t.role === r)
          .map((t, idx) => ({
            id: t.id || `${r}_${Date.now()}_${idx}`,
            role: r,
            minQty: t.minQty === '' || t.minQty === null || t.minQty === undefined ? '' : Number(t.minQty),
            maxQty: t.maxQty === '' || t.maxQty === null || t.maxQty === undefined ? '' : Number(t.maxQty),
            additionalDiscount: t.additionalDiscount !== undefined && t.additionalDiscount !== null && t.additionalDiscount !== ''
              ? Number(t.additionalDiscount)
              : (t.discount !== undefined && t.discount !== null && t.discount !== '' ? Number(t.discount) : '')
          }));

        result[r] = matching;
      }
      return result;
    }

    return getDefaultQuantityTiers();
  }

  return getDefaultQuantityTiers();
};

/**
 * Validates a list of tiers for a specific role.
 * - Prevents duplicate minimum quantities within the same role.
 * - Checks range 0-100% and minQty >= 1.
 * - Allows 0 tiers (no bulk discount configured for this role).
 */
export const validateRoleTiers = (tiers, roleName = 'Role') => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { isValid: true, error: null };
  }

  const seenQuantities = new Set();

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (tier.minQty === '' || tier.minQty === null || tier.minQty === undefined) {
      return {
        isValid: false,
        error: `Tier ${i + 1} in ${roleName} is missing a Minimum Quantity. Please enter a quantity.`
      };
    }
    const qty = Number(tier.minQty);
    if (isNaN(qty) || qty < 1) {
      return {
        isValid: false,
        error: `Tier ${i + 1} in ${roleName} must have a Minimum Quantity of at least 1 unit.`
      };
    }

    if (seenQuantities.has(qty)) {
      return {
        isValid: false,
        error: `Duplicate tier found! ${roleName} already has a tier for Minimum Quantity ${qty} units. Each tier within ${roleName} must have a unique quantity.`
      };
    }
    seenQuantities.add(qty);

    if (tier.additionalDiscount === '' || tier.additionalDiscount === null || tier.additionalDiscount === undefined) {
      return {
        isValid: false,
        error: `Tier ${i + 1} in ${roleName} is missing a Discount %. Please enter a discount percentage.`
      };
    }
    const disc = Number(tier.additionalDiscount);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      return {
        isValid: false,
        error: `Tier ${i + 1} (${qty} units) in ${roleName} has invalid discount percentage. Must be between 0% and 100%.`
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Retrieves the manually configured base price for a given role.
 * Does NOT auto-derive or suggest from MRP.
 */
/**
 * Retrieves the manually configured base price for a given role.
 * If shade is provided, retrieves the shade's specific role price.
 * Does NOT auto-derive or suggest from MRP.
 */
export const getProductBasePriceForRole = (product, role, shade = null) => {
  if (!product && !shade) return 0;
  
  // If shade is provided, prioritize shade's own pricing configuration
  if (shade) {
    const shadeMrp = Number(shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : (shade.priceOverride !== undefined && shade.priceOverride !== '' ? shade.priceOverride : (product?.mrp || 0)));
    switch (role) {
      case 'salon':
        return Number(shade.salonPrice !== undefined && shade.salonPrice !== '' && Number(shade.salonPrice) > 0 ? shade.salonPrice : (product?.salonPrice !== undefined && product?.salonPrice !== '' && Number(product.salonPrice) > 0 ? product.salonPrice : shadeMrp));
      case 'artist':
        return Number(shade.artistPrice !== undefined && shade.artistPrice !== '' && Number(shade.artistPrice) > 0 ? shade.artistPrice : (product?.artistPrice !== undefined && product?.artistPrice !== '' && Number(product.artistPrice) > 0 ? product.artistPrice : shadeMrp));
      case 'beautician':
        return Number(shade.beauticianPrice !== undefined && shade.beauticianPrice !== '' && Number(shade.beauticianPrice) > 0 ? shade.beauticianPrice : (product?.beauticianPrice !== undefined && product?.beauticianPrice !== '' && Number(product.beauticianPrice) > 0 ? product.beauticianPrice : shadeMrp));
      case 'general':
      default:
        return Number(shade.generalPrice !== undefined && shade.generalPrice !== '' && Number(shade.generalPrice) > 0 ? shade.generalPrice : shadeMrp);
    }
  }

  const mrp = Number(product?.mrp || 0);
  switch (role) {
    case 'salon':
      return Number(product.salonPrice !== undefined && product.salonPrice !== '' && Number(product.salonPrice) > 0 ? product.salonPrice : mrp);
    case 'artist':
      return Number(product.artistPrice !== undefined && product.artistPrice !== '' && Number(product.artistPrice) > 0 ? product.artistPrice : mrp);
    case 'beautician':
      return Number(product.beauticianPrice !== undefined && product.beauticianPrice !== '' && Number(product.beauticianPrice) > 0 ? product.beauticianPrice : mrp);
    case 'general':
    default:
      return Number(product.generalPrice !== undefined && product.generalPrice !== '' && Number(product.generalPrice) > 0 ? product.generalPrice : mrp);
  }
};

/**
 * Calculates role price from base MRP and role discount %:
 * Role Price = MRP * (1 - Role Discount / 100)
 */
export const calculateRolePrice = (mrp, roleDiscount) => {
  const base = Number(mrp) || 0;
  const disc = Math.min(100, Math.max(0, Number(roleDiscount) || 0));
  return Math.max(0, Math.round(base * (1 - disc / 100)));
};

/**
 * Calculates final unit price from role base price and quantity tier discount %:
 * Final Price = Role Price * (1 - Quantity Discount / 100)
 */
export const calculateTierFinalPrice = (basePrice, additionalDiscount) => {
  const base = Number(basePrice) || 0;
  const disc = Math.min(100, Math.max(0, Number(additionalDiscount) || 0));
  return Math.max(0, Math.round(base * (1 - disc / 100)));
};

/**
 * Complete step-by-step formula:
 * MRP -> Role Discount -> Role Price -> Quantity Discount -> Final Unit Price
 */
export const calculateTierUnitPrice = (mrp, roleDiscount, quantityDiscount) => {
  const rolePrice = calculateRolePrice(mrp, roleDiscount);
  return calculateTierFinalPrice(rolePrice, quantityDiscount);
};

/**
 * Extracts or derives the configured role discount % for a given role on a product/shade
 */
export const getProductRoleDiscount = (product, role, shade = null) => {
  if (shade && shade.discountPercentages && shade.discountPercentages[role] !== undefined && shade.discountPercentages[role] !== '') {
    return Number(shade.discountPercentages[role]) || 0;
  }
  if (product?.discountPercentages && product.discountPercentages[role] !== undefined && product.discountPercentages[role] !== '') {
    return Number(product.discountPercentages[role]) || 0;
  }
  if (product?.quantityTiers?.roleDiscounts && product.quantityTiers.roleDiscounts[role] !== undefined && product.quantityTiers.roleDiscounts[role] !== '') {
    return Number(product.quantityTiers.roleDiscounts[role]) || 0;
  }
  const mrp = Number(shade?.mrp || shade?.priceOverride || product?.mrp || 0);
  const rolePrice = getProductBasePriceForRole(product, role, shade);
  if (mrp > 0 && rolePrice > 0 && rolePrice < mrp) {
    return Math.round((1 - rolePrice / mrp) * 100);
  }
  return 0;
};

/**
 * Total count of configured tiers across all 4 roles for badge display
 */
export const getTotalQuantityTiersCount = (rawTiers) => {
  const normalized = normalizeQuantityTiers(rawTiers);
  const countValid = (arr) => (arr || []).filter(t => t && t.minQty !== '' && !isNaN(Number(t.minQty)) && Number(t.minQty) > 0).length;
  return (
    countValid(normalized.general) +
    countValid(normalized.salon) +
    countValid(normalized.artist) +
    countValid(normalized.beautician)
  );
};

/**
 * Returns strictly the tiers for a given role from shade (if configured) or product.
 */
export const getProductTiersForRole = (product, role = 'general', shade = null) => {
  if (!role || !ALL_ROLE_KEYS.includes(role)) {
    return [];
  }

  // If shade has its own quantity tiers configured, use them
  if (shade && (shade.quantityTiers || shade.quantity_tiers)) {
    const normalizedShadeTiers = normalizeQuantityTiers(shade.quantityTiers || shade.quantity_tiers);
    const roleTiers = normalizedShadeTiers[role] || [];
    if (roleTiers.length > 0) {
      return [...roleTiers]
        .filter(t => t && Number(t.minQty) > 0)
        .sort((a, b) => Number(a.minQty) - Number(b.minQty));
    }
  }

  if (!product) return [];
  const normalized = normalizeQuantityTiers(product.quantityTiers || product.quantity_tiers);
  const roleTiers = normalized[role] || [];
  return [...roleTiers]
    .filter(t => t && Number(t.minQty) > 0)
    .sort((a, b) => Number(a.minQty) - Number(b.minQty));
};

/**
 * Returns the highest applicable tier for a role, order quantity, and optional shade.
 */
export const getApplicableTierForRole = (product, role = 'general', quantity = 1, shade = null) => {
  const tiers = getProductTiersForRole(product, role, shade);
  if (tiers.length === 0) return null;

  const effQty = Number(quantity) || 1;
  let applicable = null;
  for (const tier of tiers) {
    if (effQty >= Number(tier.minQty)) {
      applicable = tier;
    }
  }
  return applicable;
};

/**
 * Complete dynamic price calculator for product / shade / role / quantity
 */
export const calculateDynamicPrice = (product, role = 'general', shade = null, quantity = 1) => {
  const basePrice = getProductBasePriceForRole(product, role, shade);
  const applicableTier = getApplicableTierForRole(product, role, quantity, shade);
  if (applicableTier && Number(applicableTier.additionalDiscount) > 0) {
    const disc = Math.min(100, Math.max(0, Number(applicableTier.additionalDiscount)));
    return Math.max(0, Math.round(basePrice * (1 - disc / 100)));
  }
  return basePrice;
};
