/**
 * Cart Key and Cart Quantity Synchronization Utilities (Purplle-style)
 * 
 * Generates uniform, collision-free cart item identifiers across:
 * - Parent products
 * - Specific shade / variant selections
 */

export const getCartKey = (productId, shade) => {
  if (!productId) return '';
  if (shade) {
    const shadeKey = shade.name || shade.title || shade.id || shade.sku;
    if (shadeKey) {
      return `${productId}_${shadeKey}`;
    }
  }
  return String(productId);
};

export const getCartQuantityMap = (cart = []) => {
  const map = new Map();
  if (Array.isArray(cart)) {
    for (const item of cart) {
      if (!item) continue;
      const pid = item.product?.id || item.productId;
      const key = item.id || getCartKey(pid, item.shade);
      if (key) {
        map.set(key, (map.get(key) || 0) + (item.quantity || 0));
      }
    }
  }
  return map;
};

export const getSafeProductShadesList = (product) => {
  if (!product) return [];
  let raw = product.shades || product.variants;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter(s => s && s.active !== false && !s.isDeleted);
};

