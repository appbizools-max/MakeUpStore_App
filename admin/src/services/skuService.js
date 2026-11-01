/**
 * Universal Automatic SKU Generation Service
 * 
 * Generates clean, consistent, collision-safe SKUs for main products
 * based on Brand, Category, and Product Name.
 * 
 * Example:
 * Brand: "Lakmé"
 * Category: "Lipstick"
 * Product Name: "Matte Lipstick"
 * Generated SKU: "LAK-LIP-MAT001"
 */

/**
 * Extracts a clean uppercase alphanumeric abbreviation of given length
 */
export function extractCode(str, len = 3) {
  if (!str) return 'GEN'.slice(0, len);
  const clean = String(str).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= len) return clean.slice(0, len);
  return (clean + 'XXX').slice(0, len);
}

/**
 * Generates an automatic, unique, collision-safe SKU for a main product
 * 
 * @param {Object} params
 * @param {string} params.brand - Brand Name (e.g. "Lakmé")
 * @param {string} params.category - Category Name (e.g. "Lipstick" or "Makeup")
 * @param {string} params.name - Product Name (e.g. "Matte Lipstick")
 * @param {string[]} [params.existingSkus] - Array of already existing SKUs in catalog
 * @returns {string} e.g. "LAK-LIP-MAT001"
 */
export function generateProductSku({ brand = '', category = '', name = '', existingSkus = [] } = {}) {
  const brandCode = extractCode(brand, 3);
  const catCode = extractCode(category, 3);

  // For product name: use first word if > 2 chars, or first 3 chars
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const primaryWord = words.find(w => w.replace(/[^a-zA-Z0-9]/g, '').length >= 3) || words[0] || name;
  const nameCode = extractCode(primaryWord, 3);

  const prefix = `${brandCode}-${catCode}-${nameCode}`;

  const existingSet = new Set(
    (existingSkus || [])
      .filter(Boolean)
      .map(s => String(s).trim().toUpperCase())
  );

  let seq = 1;
  let candidate = `${prefix}${String(seq).padStart(3, '0')}`;

  while (existingSet.has(candidate)) {
    seq++;
    candidate = `${prefix}${String(seq).padStart(3, '0')}`;
  }

  return candidate;
}

/**
 * Generates an internal variant SKU for sellable color variants
 * Keeps relationship with main product without cluttering UI
 * 
 * @param {string} mainSku - Parent/Main Product SKU (e.g. "LAK-LIP-MAT001")
 * @param {number} index - 1-based variant index
 * @param {string} [colorName] - Optional Color name
 * @returns {string} e.g. "LAK-LIP-MAT001-V01"
 */
export function generateVariantInternalSku(mainSku, index = 1, colorName = '') {
  const base = (mainSku || 'SKU').trim().toUpperCase();
  const seq = String(index).padStart(2, '0');
  return `${base}-V${seq}`;
}

/**
 * Validates whether a SKU string is non-empty and well-formed
 */
export function isValidSku(sku) {
  if (!sku || typeof sku !== 'string') return false;
  const clean = sku.trim();
  return clean.length >= 4 && /^[A-Z0-9_-]+$/i.test(clean);
}

