/**
 * SALBEAU DYNAMIC DELIVERY CHARGE ENGINE
 * 
 * Supports 5 configurable delivery pricing models:
 * 1. Free Delivery for all orders (isFreeDeliveryAll / model === 'always_free')
 * 2. Per-Kilometre Charges (₹X / km with optional base distance & base charge)
 * 3. Free Delivery Above Order Value (threshold e.g. orders above ₹500)
 * 4. Fixed Delivery Charges (standard flat rate fee)
 * 5. Default Free Delivery (default option set by admin)
 */

export const DELIVERY_MODELS = {
  DEFAULT_FREE: 'default_free',
  ALWAYS_FREE: 'always_free',
  PER_KM: 'per_km',
  ORDER_VALUE: 'order_value',
  FIXED: 'fixed'
};

export const DEFAULT_DELIVERY_CONFIG = {
  pricingModel: 'default_free', // 'default_free' | 'always_free' | 'per_km' | 'order_value' | 'fixed'
  isDefaultFree: true,
  isFreeDeliveryAll: false,
  fixedDeliveryFee: 49,
  standardFee: 49,
  standardDeliveryFee: 49,
  perKmRate: 3, // ₹3 per km
  baseDistanceKm: 2, // First 2 km
  baseDeliveryCharge: 20, // ₹20 for first baseDistanceKm
  maxDeliveryDistanceKm: 50,
  freeDeliveryThreshold: 500, // Free above ₹500
  enableFreeDeliveryThreshold: true,
  minOrderAmount: 0,
  maxItemsPerOrder: 50,
  estimatedTimeText: 'Same Day / 24-48 Hours'
};

/**
 * Calculates delivery fee dynamically based on admin configuration, order value, and distance.
 * 
 * @param {Object} params
 * @param {number} params.orderAmount - Subtotal value of bag/order
 * @param {number} params.distanceKm - Distance in kilometres from store/branch to destination
 * @param {Object} params.config - Delivery configuration object from storeSettings
 * @returns {Object} { fee, isFree, reason, detailText, distanceKm, shortfallForFreeDelivery }
 */
export function calculateDeliveryCharge({
  orderAmount = 0,
  distanceKm = 5,
  config = {}
} = {}) {
  const delivery = config?.delivery || config || DEFAULT_DELIVERY_CONFIG;
  const model = delivery.pricingModel || (delivery.isDefaultFree ? 'default_free' : 'order_value');
  const amount = Math.max(0, Number(orderAmount || 0));
  const distance = Math.max(0.5, Number(distanceKm || 5));

  // Option 1 & 5: Free Delivery for all orders OR Default Free Delivery active
  if (
    delivery.isFreeDeliveryAll ||
    delivery.isDefaultFree ||
    model === 'always_free' ||
    model === 'default_free'
  ) {
    return {
      fee: 0,
      isFree: true,
      reason: 'Free Delivery',
      detailText: 'Complimentary Free Delivery applied!',
      distanceKm: distance,
      shortfallForFreeDelivery: 0
    };
  }

  // Option 3: Free delivery above order threshold (overrides per-km and fixed fee)
  const freeThreshold = Number(delivery.freeDeliveryThreshold ?? 500);
  const enableThreshold = delivery.enableFreeDeliveryThreshold !== false;
  if (enableThreshold && freeThreshold > 0 && amount >= freeThreshold) {
    return {
      fee: 0,
      isFree: true,
      reason: `FREE Delivery (Orders above ₹${freeThreshold})`,
      detailText: `Qualified for Free Delivery on orders above ₹${freeThreshold}!`,
      distanceKm: distance,
      shortfallForFreeDelivery: 0
    };
  }

  const shortfall = freeThreshold > amount ? Math.round(freeThreshold - amount) : 0;

  // Option 2: Per-Kilometre Charges
  if (model === 'per_km') {
    const rate = Number(delivery.perKmRate ?? 3);
    const baseKm = Number(delivery.baseDistanceKm ?? 0);
    const baseFee = Number(delivery.baseDeliveryCharge ?? 0);
    const billableKm = Math.max(0, distance - baseKm);
    const calculated = Math.round(baseFee + (billableKm * rate));
    const finalFee = Math.max(0, calculated);

    return {
      fee: finalFee,
      isFree: finalFee === 0,
      reason: `₹${rate}/km (${distance.toFixed(1)} km)`,
      detailText: `${distance.toFixed(1)} km delivery distance @ ₹${rate}/km`,
      distanceKm: distance,
      shortfallForFreeDelivery: shortfall
    };
  }

  // Option 4: Fixed Delivery Charges
  const fixed = Number(
    delivery.fixedDeliveryFee ??
    delivery.standardFee ??
    delivery.standardDeliveryFee ??
    49
  );

  return {
    fee: fixed,
    isFree: fixed === 0,
    reason: fixed === 0 ? 'FREE' : `Fixed Delivery Fee`,
    detailText: `Standard flat delivery fee of ₹${fixed}`,
    distanceKm: distance,
    shortfallForFreeDelivery: shortfall
  };
}

