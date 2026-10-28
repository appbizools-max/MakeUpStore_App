/**
 * UNIFIED PRODUCT DATA MODEL & IMPORT ENGINE
 * 
 * Single authoritative source of truth for:
 * 1. Product data normalization
 * 2. Validation & Duplicate detection
 * 3. Supabase database payload mapping
 * 4. High-performance chunked batch processing (100,000+ records)
 * 5. Reference data caching & fuzzy matching (brands, categories, subcategories)
 * 6. Intelligent Excel header mapping
 */

import { supabase } from '../config/supabase.js';
import { validateBarcodeChecksum, detectBarcodeFormat } from './barcodeLookupService.js';
import { matchBeautyShade } from './aiColorService.js';

// ==============================================================================
// 1. CANONICAL PRODUCT SCHEMA DEFINITION
// ==============================================================================

/**
 * Standard Normalized Product Structure
 * @typedef {Object} NormalizedProduct
 * @property {string} id - Unique identifier (row_id or UUID)
 * @property {string} barcode - Barcode (EAN-13, UPC-A, etc.)
 * @property {string} barcodeType - Format (EAN-13, UPC-A, CODE-128)
 * @property {string} name - Product Name
 * @property {string} brand - Brand Name
 * @property {string} [brandId] - Brand ID in Supabase
 * @property {string} category - Category Name
 * @property {string} [categoryId] - Category ID in Supabase
 * @property {string} subcategory - Subcategory Name
 * @property {string} [subcategoryId] - Subcategory ID in Supabase
 * @property {string} variantType - e.g. 'Shade', 'Variant', 'Size'
 * @property {string} shade - Shade Name e.g. 'Ruby Red'
 * @property {string} hexColor - #RRGGBB format
 * @property {string} rgb - rgb(r, g, b) format
 * @property {string} description - Product description
 * @property {string[]} highlights - Highlights / features
 * @property {string} image - Primary product image URL
 * @property {string[]} images - All image URLs
 * @property {number} mrp - Maximum Retail Price (INR)
 * @property {number} generalDiscount - General User discount %
 * @property {number} salonDiscount - Salon Owner discount %
 * @property {number} artistDiscount - Makeup Artist discount %
 * @property {number} beauticianDiscount - Beautician discount %
 * @property {number} generalPrice - Calculated price for General
 * @property {number} salonPrice - Calculated price for Salon
 * @property {number} artistPrice - Calculated price for Artist
 * @property {number} beauticianPrice - Calculated price for Beautician
 * @property {Object} quantityTiers - Role-based quantity discount tiers
 * @property {Object} attributes - Custom attributes (e.g. Finish: Matte)
 * @property {boolean} hasMultipleShades - Multiple shades flag
 * @property {boolean} isParent - Parent group product
 * @property {string|null} parentId - Parent product ID
 * @property {string} status - 'active' | 'draft' | 'error' | 'review'
 */

// Helper to check if shade fields are applicable based on Category and Subcategory
export const isShadeApplicable = (category = '', subcategory = '') => {
  const normCat = normalizeText(category);
  const normSub = normalizeText(subcategory);
  
  if (['skincare', 'skin care', 'haircare', 'hair care', 'hair', 'fragrance', 'perfumes', 'scents', 'bath & body', 'tools & accessories', 'wellness'].some(c => normCat.includes(c))) {
    if (normSub.includes('color') || normSub.includes('dye')) return true;
    return false;
  }
  
  if (normCat.includes('makeup') || normCat.includes('lips') || normCat.includes('eyes') || normCat.includes('nails') || normCat.includes('face')) {
    if (normSub.includes('brush') || normSub.includes('tool') || normSub.includes('sponge') || normSub.includes('remover') || normSub.includes('sharpener')) {
      return false;
    }
    return true;
  }
  
  const shadeKeywords = ['lipstick', 'lip', 'shade', 'foundation', 'concealer', 'blush', 'eyeshadow', 'liner', 'kajal', 'compact', 'powder', 'contour', 'highlighter', 'bronzer', 'tint', 'crayon', 'lacquer', 'enamel', 'polish'];
  return shadeKeywords.some(kw => normSub.includes(kw));
};

// ==============================================================================
// CATEGORY -> SUBCATEGORY -> VARIANT TYPE -> ATTRIBUTE HIERARCHY MASTER
// ==============================================================================

export const CATEGORY_HIERARCHY_CONFIG = {
  'Makeup': {
    name: 'Makeup',
    subcategories: [
      'Lipstick', 'Liquid Lipstick', 'Lip Gloss', 'Lip Liner', 'Lip Crayon', 'Lip Balm',
      'Foundation', 'Concealer', 'Compact Powder', 'Loose Powder', 'BB & CC Cream',
      'Blush', 'Bronzer', 'Highlighter', 'Primer', 'Setting Spray',
      'Eyeshadow', 'Eyeliner', 'Kajal', 'Mascara', 'Eyebrow Pencil',
      'Nail Polish', 'Nail Art'
    ],
    defaultVariantType: 'Shade / Swatch',
    variantTypes: ['Shade / Swatch', 'Size / Volume', 'Finish / Formula', 'Combo / Pack'],
    hasShades: true,
    attributes: [
      { key: 'makeup_type', label: 'Makeup Type', type: 'dropdown', options: ['Face', 'Lips', 'Eyes', 'Cheeks', 'Nails', 'All-over'] },
      { key: 'finish', label: 'Finish', type: 'dropdown', options: ['Matte', 'Glossy', 'Satin', 'Dewy', 'Shimmer', 'Metallic', 'Glitter', 'Natural'] },
      { key: 'coverage', label: 'Coverage', type: 'dropdown', options: ['Sheer', 'Light', 'Medium', 'Full', 'Buildable'] },
      { key: 'undertone', label: 'Undertone', type: 'dropdown', options: ['Warm', 'Cool', 'Neutral', 'Olive', 'Golden', 'Pink / Rosy'] },
      { key: 'formulation', label: 'Formulation', type: 'dropdown', options: ['Liquid', 'Cream', 'Powder', 'Stick', 'Gel', 'Crayon', 'Pencil'] }
    ]
  },
  'Skincare': {
    name: 'Skincare',
    subcategories: [
      'Face Wash', 'Cleanser', 'Face Scrub', 'Toner & Mist',
      'Face Serum', 'Face Oil', 'Moisturizer & Day Cream', 'Night Cream',
      'Sunscreen', 'Eye Cream', 'Face Mask & Sheet Mask', 'Lip Care / Scrub', 'Body Lotion'
    ],
    defaultVariantType: 'Volume / Size',
    variantTypes: ['Volume / Size', 'Skin Type', 'Pack Size'],
    hasShades: false,
    attributes: [
      { key: 'skin_type', label: 'Skin Type', type: 'dropdown', options: ['All Skin Types', 'Normal', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Acne-Prone'] },
      { key: 'skin_concern', label: 'Skin Concern', type: 'dropdown', options: ['Acne & Blemishes', 'Anti-Aging & Fine Lines', 'Dark Spots & Pigmentation', 'Dryness & Dehydration', 'Dullness & Glow', 'Enlarged Pores', 'Redness'] },
      { key: 'product_form', label: 'Product Form', type: 'dropdown', options: ['Serum', 'Cream', 'Gel', 'Lotion', 'Oil', 'Foam', 'Mask', 'Mist / Spray'] },
      { key: 'spf', label: 'SPF Factor', type: 'dropdown', options: ['No SPF', 'SPF 15', 'SPF 20', 'SPF 30', 'SPF 40', 'SPF 50', 'SPF 50+ PA++++'] },
      { key: 'key_ingredients', label: 'Key Active Ingredients', type: 'text', placeholder: 'e.g. 2% Salicylic Acid, Hyaluronic Acid, Niacinamide' }
    ]
  },
  'Hair Care': {
    name: 'Hair Care',
    subcategories: [
      'Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask & Spa',
      'Hair Color', 'Leave-In Conditioner', 'Dry Shampoo', 'Heat Protectant Spray',
      'Hair Styling Gel & Wax'
    ],
    defaultVariantType: 'Volume / Size',
    variantTypes: ['Volume / Size', 'Hair Type', 'Pack Size'],
    hasShades: false,
    attributes: [
      { key: 'hair_type', label: 'Hair Type', type: 'dropdown', options: ['All Hair Types', 'Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick', 'Color-Treated', 'Chemically Treated'] },
      { key: 'hair_concern', label: 'Hair Concern', type: 'dropdown', options: ['Hair Fall & Breakage', 'Dandruff Control', 'Frizz Control & Dryness', 'Damage Repair', 'Volume & Thinning', 'Color Protection'] },
      { key: 'product_form', label: 'Product Form', type: 'dropdown', options: ['Liquid', 'Cream', 'Oil', 'Serum', 'Spray', 'Gel', 'Foam / Mousse'] },
      { key: 'key_ingredients', label: 'Key Ingredients', type: 'text', placeholder: 'e.g. Argan Oil, Keratin, Biotin, Rosemary Extract' }
    ]
  },
  'Fragrance': {
    name: 'Fragrance',
    subcategories: [
      'Eau De Parfum (EDP)', 'Eau De Toilette (EDT)', 'Perfume / Attar',
      'Body Mist & Spray', 'Deodorant Roll-On', 'Pocket Perfume'
    ],
    defaultVariantType: 'Volume / Size',
    variantTypes: ['Volume / Size', 'Fragrance Family', 'Gift Set / Pack'],
    hasShades: false,
    attributes: [
      { key: 'fragrance_type', label: 'Fragrance Type', type: 'dropdown', options: ['Eau De Parfum', 'Eau De Toilette', 'Extrait De Parfum', 'Body Mist / Cologne', 'Attar / Concentrated Oil'] },
      { key: 'scent_family', label: 'Scent Family', type: 'dropdown', options: ['Floral', 'Fruity', 'Woody', 'Oriental / Amber', 'Fresh / Aquatic', 'Spicy', 'Citrus', 'Gourmand'] },
      { key: 'fragrance_notes', label: 'Fragrance Notes', type: 'text', placeholder: 'Top: Bergamot; Heart: Rose; Base: Sandalwood' },
      { key: 'longevity', label: 'Longevity', type: 'dropdown', options: ['4-6 Hours', '6-8 Hours', '8-12 Hours (Long Lasting)', '12+ Hours (Intense)'] },
      { key: 'gender', label: 'Target Gender', type: 'dropdown', options: ['Unisex', 'Women', 'Men'] },
      { key: 'concentration', label: 'Concentration', type: 'dropdown', options: ['Eau De Parfum (15-20%)', 'Eau De Toilette (5-15%)', 'Extrait De Parfum (20-40%)', 'Body Mist (1-3%)'] }
    ]
  },
  'Hair Styling': {
    name: 'Hair Styling',
    subcategories: [
      'Hair Dryer', 'Hair Straightener', 'Curling Iron / Wand', 'Hot Air Brush',
      'Multi-Styler Kit', 'Crimper', 'Hair Styling Tools'
    ],
    defaultVariantType: 'Tool Type',
    variantTypes: ['Tool Type', 'Color', 'Standard'],
    hasShades: false,
    attributes: [
      { key: 'tool_type', label: 'Tool Type', type: 'dropdown', options: ['Straightener', 'Hair Dryer', 'Curler', 'Hot Air Brush', 'Multi-Styler'] },
      { key: 'heat_settings', label: 'Heat Settings', type: 'dropdown', options: ['1-2 Levels', '3-5 Digital Levels', 'Variable 120°C-230°C', 'Auto Temperature Sensor'] },
      { key: 'wattage', label: 'Wattage', type: 'text', placeholder: 'e.g. 1800W, 2200W, 45W' },
      { key: 'attachments', label: 'Attachments', type: 'text', placeholder: 'e.g. Diffuser, Concentrator Nozzle, 3 Barrels' }
    ]
  },
  'Tools': {
    name: 'Tools',
    subcategories: [
      'Makeup Brushes', 'Beauty Blenders & Sponges', 'Eyelash Curlers',
      'Tweezers', 'Mirrors', 'Hair Styling Tools', 'Nail Clippers & Files'
    ],
    defaultVariantType: 'Size / Pack',
    variantTypes: ['Size / Pack', 'Color', 'Standard'],
    hasShades: false,
    attributes: [
      { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Synthetic Bristles, Silicone, Stainless Steel' },
      { key: 'pack_quantity', label: 'Pieces in Pack', type: 'dropdown', options: ['1 pc', '2 pcs', '3 pcs', '5 pcs', '10 pcs', '12 pcs Set'] }
    ]
  }
};

/**
 * Gets subcategories for a category
 */
export const getSubcategoriesForCategory = (category = '') => {
  if (!category || !String(category).trim()) return [];
  const norm = normalizeText(category);
  for (const [key, conf] of Object.entries(CATEGORY_HIERARCHY_CONFIG)) {
    if (normalizeText(key) === norm || norm.includes(normalizeText(key))) {
      return conf.subcategories;
    }
  }
  return [];
};

/**
 * Gets variant types for a category/subcategory
 */
export const getVariantTypesForCategory = (category = '', subcategory = '') => {
  const norm = normalizeText(category);
  for (const [key, conf] of Object.entries(CATEGORY_HIERARCHY_CONFIG)) {
    if (normalizeText(key) === norm || norm.includes(normalizeText(key))) {
      return conf.variantTypes;
    }
  }
  return ['Standard', 'Size / Volume', 'Pack Size'];
};

/**
 * Gets category-specific dynamic attributes
 */
export const getCategoryAttributes = (category = '', subcategory = '') => {
  const norm = normalizeText(category);
  for (const [key, conf] of Object.entries(CATEGORY_HIERARCHY_CONFIG)) {
    if (normalizeText(key) === norm || norm.includes(normalizeText(key))) {
      return conf.attributes || [];
    }
  }
  return [];
};


// Helper to convert HEX to RGB string
export const hexToRgbString = (hex) => {
  if (!hex || typeof hex !== 'string') return '';
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `RGB(${r}, ${g}, ${b})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '';
    return `RGB(${r}, ${g}, ${b})`;
  }
  return '';
};

// Helper to convert RGB string or object to HEX
export const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, Math.round(Number(c) || 0))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// Text normalization for fuzzy lookup (trims, removes extra spaces, lowercase)
export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
};

// Price calculation helper
export const calculateProductPrices = (mrp, genDisc = 0, salonDisc = 10, artistDisc = 15, btyDisc = 20) => {
  const numMrp = Math.max(0, Number(mrp) || 0);
  const calc = (pct) => {
    const validPct = Math.max(0, Math.min(100, Number(pct) || 0));
    return Math.round(numMrp * (1 - validPct / 100));
  };
  return {
    generalPrice: calc(genDisc),
    salonPrice: calc(salonDisc),
    artistPrice: calc(artistDisc),
    beauticianPrice: calc(btyDisc)
  };
};

// Default tier bands for roles (General users do NOT receive quantity-based discounts)
export const getDefaultTierMatrix = () => ({
  general: [], // General Users strictly do not receive volume tiers
  salon: [
    { minQty: 1, maxQty: 2, discount: 0 },
    { minQty: 3, maxQty: 4, discount: 5 },
    { minQty: 5, maxQty: 9, discount: 8 },
    { minQty: 10, maxQty: null, discount: 10 }
  ],
  artist: [
    { minQty: 1, maxQty: 2, discount: 0 },
    { minQty: 3, maxQty: 5, discount: 4 },
    { minQty: 6, maxQty: null, discount: 7 }
  ],
  beautician: [
    { minQty: 1, maxQty: 2, discount: 0 },
    { minQty: 3, maxQty: 5, discount: 3 },
    { minQty: 6, maxQty: null, discount: 6 }
  ]
});

// ==============================================================================
// 2. REFERENCE DATA CACHING & FAST IN-MEMORY MATCHING
// ==============================================================================

/**
 * Builds normalized reference caches for O(1) in-memory resolution of 100,000+ rows
 */
export const buildReferenceCache = (brands = [], categories = [], existingProducts = []) => {
  const brandMap = new Map();
  const categoryMap = new Map();
  const subcategoryMap = new Map();
  const existingBarcodeMap = new Map();
  const existingNameMap = new Map();

  brands.forEach(b => {
    const norm = normalizeText(b.name || b.brand_name);
    if (norm) {
      brandMap.set(norm, { id: b.id, name: b.name || b.brand_name });
    }
  });

  categories.forEach(c => {
    const norm = normalizeText(c.name);
    if (norm) {
      categoryMap.set(norm, { id: c.id, name: c.name, subcategories: c.subcategories || [] });
    }
    if (Array.isArray(c.subcategories)) {
      c.subcategories.forEach(sub => {
        const subName = typeof sub === 'string' ? sub : sub?.name;
        const subNorm = normalizeText(subName);
        if (subNorm) {
          subcategoryMap.set(`${norm}:${subNorm}`, {
            id: typeof sub === 'object' ? sub.id : null,
            name: subName,
            categoryId: c.id
          });
          // Also set bare subcategory key
          if (!subcategoryMap.has(subNorm)) {
            subcategoryMap.set(subNorm, {
              id: typeof sub === 'object' ? sub.id : null,
              name: subName,
              categoryId: c.id
            });
          }
        }
      });
    }
  });

  existingProducts.forEach(p => {
    if (p.barcode) {
      existingBarcodeMap.set(String(p.barcode).trim(), p);
    }
    if (p.name) {
      existingNameMap.set(normalizeText(p.name), p);
    }
    if (Array.isArray(p.shades)) {
      p.shades.forEach(s => {
        if (s.barcode) {
          existingBarcodeMap.set(String(s.barcode).trim(), p);
        }
      });
    }
  });

  return {
    brandMap,
    categoryMap,
    subcategoryMap,
    existingBarcodeMap,
    existingNameMap,
    resolveBrand: (name) => {
      if (!name || !String(name).trim()) return { id: null, name: '' };
      const norm = normalizeText(name);
      return brandMap.get(norm) || { id: null, name: String(name).trim() };
    },
    resolveCategory: (name) => {
      if (!name || !String(name).trim()) return { id: null, name: '' };
      const norm = normalizeText(name);
      return categoryMap.get(norm) || { id: null, name: String(name).trim() };
    },
    resolveSubcategory: (catName, subName) => {
      if (!subName || !String(subName).trim()) return { id: null, name: '' };
      const catNorm = normalizeText(catName);
      const subNorm = normalizeText(subName);
      return subcategoryMap.get(`${catNorm}:${subNorm}`) || subcategoryMap.get(subNorm) || { id: null, name: String(subName).trim() };
    },
    findExistingProduct: (barcode, name) => {
      if (barcode && existingBarcodeMap.has(String(barcode).trim())) {
        return existingBarcodeMap.get(String(barcode).trim());
      }
      if (name && existingNameMap.has(normalizeText(name))) {
        return existingNameMap.get(normalizeText(name));
      }
      return null;
    }
  };
};

// ==============================================================================
// 3. UNIFIED PRODUCT NORMALIZATION & VALIDATION
// ==============================================================================

/**
 * Normalizes any input into standard NormalizedProduct
 */
export const normalizeProduct = (raw, cache = null) => {
  const id = raw.id || raw._id || ('prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const barcode = String(raw.barcode || raw.Barcode || raw.EAN || raw.UPC || '').trim();
  const barcodeType = raw.barcodeType || detectBarcodeFormat(barcode);

  const name = String(raw.name || raw.productName || raw.product_name || raw['Product Name'] || '').trim();
  const rawBrand = String(raw.brand || raw.brandName || raw.brand_name || raw['Brand'] || '').trim();
  const rawCat = String(raw.category || raw.category_name || raw['Category'] || '').trim();
  const rawSubcat = String(raw.subcategory || raw.sub_category || raw['Subcategory'] || '').trim();

  const brandMatch = cache ? cache.resolveBrand(rawBrand) : { id: null, name: rawBrand };
  const catMatch = cache ? cache.resolveCategory(rawCat) : { id: null, name: rawCat };
  const subcatMatch = cache ? cache.resolveSubcategory(rawCat, rawSubcat) : { id: null, name: rawSubcat };

  // Determine if shades apply to this product
  const shadeApplies = isShadeApplicable(catMatch.name, subcatMatch.name);

  const variantType = String(raw.variantType || raw.variant_type || raw['Variant Type'] || '').trim();
  const shade = shadeApplies ? String(raw.shade || raw.shadeName || raw.shade_name || raw['Shade Name'] || '').trim() : '';

  let hexColor = '';
  let rgb = '';

  if (shadeApplies && (raw.hexColor || raw.hex_color || raw.hex || raw.hex_code || raw['HEX Code'])) {
    let rawHex = String(raw.hexColor || raw.hex_color || raw.hex || raw.hex_code || raw['HEX Code']).toUpperCase().trim();
    if (rawHex && !rawHex.startsWith('#')) rawHex = '#' + rawHex;
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawHex)) {
      hexColor = rawHex;
    }
    rgb = raw.rgb || raw['RGB'] || (hexColor ? hexToRgbString(hexColor) : '');
  }

  // Size, GST %, and Net Qty
  const size = String(raw.size || raw.Size || raw['Size'] || raw.specifications?.size || raw.additional_info?.size || '').trim();
  const rawGst = raw.gst ?? raw.gstPercent ?? raw.gst_percent ?? raw['GST %'] ?? raw.GST ?? '';
  const gst = rawGst === '' ? '' : (isNaN(Number(rawGst)) ? '' : Number(rawGst));
  const netQty = String(raw.netQty || raw.net_qty || raw['Net Qty'] || raw['Net Quantity'] || raw.additional_info?.net_qty || '').trim();

  const rawMrp = raw.mrp ?? raw.MRP ?? '';
  const mrp = rawMrp === '' ? '' : (isNaN(Number(rawMrp)) ? '' : Number(rawMrp));
  const rawGenDisc = raw.generalDiscount ?? raw.general_user_discount ?? raw['General User Discount %'] ?? '';
  const generalDiscount = rawGenDisc === '' ? '' : (isNaN(Number(rawGenDisc)) ? '' : Number(rawGenDisc));
  const rawSalonDisc = raw.salonDiscount ?? raw.salon_owner_discount ?? raw['Salon Owner Discount %'] ?? '';
  const salonDiscount = rawSalonDisc === '' ? '' : (isNaN(Number(rawSalonDisc)) ? '' : Number(rawSalonDisc));
  const rawArtistDisc = raw.artistDiscount ?? raw.makeup_artist_discount ?? raw['Makeup Artist Discount %'] ?? '';
  const artistDiscount = rawArtistDisc === '' ? '' : (isNaN(Number(rawArtistDisc)) ? '' : Number(rawArtistDisc));
  const rawBtyDisc = raw.beauticianDiscount ?? raw.beautician_discount ?? raw['Beautician Discount %'] ?? '';
  const beauticianDiscount = rawBtyDisc === '' ? '' : (isNaN(Number(rawBtyDisc)) ? '' : Number(rawBtyDisc));

  const prices = calculateProductPrices(mrp, generalDiscount, salonDiscount, artistDiscount, beauticianDiscount);

  // Images
  let images = [];
  if (Array.isArray(raw.images)) {
    images = raw.images.filter(Boolean);
  } else if (raw.image || raw.product_image || raw['Product Image']) {
    const single = raw.image || raw.product_image || raw['Product Image'];
    if (typeof single === 'string' && single.trim()) images = [single.trim()];
  }

  // Highlights
  let highlights = [];
  if (Array.isArray(raw.highlights)) {
    highlights = raw.highlights.filter(Boolean);
  } else if (typeof raw.highlights === 'string' && raw.highlights.trim()) {
    highlights = raw.highlights.split(/[;,|•\n]/).map(h => h.trim()).filter(Boolean);
  }

  // Quantity tiers (General Users strictly do not receive volume tiers)
  let quantityTiers = raw.quantityTiers || raw.quantity_discount_tiers || raw['Quantity Discount Tiers'];
  if (typeof quantityTiers === 'string') {
    try {
      quantityTiers = JSON.parse(quantityTiers);
    } catch {
      quantityTiers = getDefaultTierMatrix();
    }
  }
  if (!quantityTiers || typeof quantityTiers !== 'object') {
    quantityTiers = getDefaultTierMatrix();
  }
  // Enforce no volume tiers for general users
  if (quantityTiers && typeof quantityTiers === 'object') {
    quantityTiers.general = [];
  }

  return {
    id,
    _id: id,
    barcode,
    barcodeType,
    name,
    productName: name,
    brand: brandMatch.name,
    brandId: brandMatch.id,
    category: catMatch.name,
    categoryId: catMatch.id,
    subcategory: subcatMatch.name,
    subcategoryId: subcatMatch.id,
    variantType,
    shadeApplies,
    shade: shade || null,
    shadeName: shade || null,
    hexColor: hexColor || null,
    rgb: rgb || null,
    size: size || null,
    gst,
    gstPercent: gst,
    netQty: netQty || null,
    description: String(raw.description || raw['Description'] || '').trim(),
    highlights,
    image: images[0] || '',
    images,
    mrp,
    generalDiscount,
    salonDiscount,
    artistDiscount,
    beauticianDiscount,
    generalPrice: prices.generalPrice,
    salonPrice: prices.salonPrice,
    artistPrice: prices.artistPrice,
    beauticianPrice: prices.beauticianPrice,
    quantityTiers,
    attributes: raw.attributes || {},
    hasMultipleShades: Boolean(raw.hasMultipleShades),
    isParent: Boolean(raw.isParent),
    parentId: raw.parentId || null,
    status: raw.status || 'published',
    createdAt: raw.createdAt || raw.created_at || raw['Created At'] || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || raw['Updated At'] || new Date().toISOString()
  };
};

/**
 * Validates a normalized product row with detailed field-level issues (Row Number → Field → Error → Suggested Fix)
 */
export const validateProduct = (p, rowIndex = 1) => {
  const issues = [];

  // 1. Required: Product Name
  if (!p.name || !p.name.trim()) {
    issues.push({
      rowNumber: rowIndex,
      field: 'Product Name',
      error: 'Product Name is required',
      suggestedFix: 'Enter a valid product title (e.g. "SuperStay Matte Ink")',
      severity: 'error'
    });
  }

  // 2. Required: Brand
  if (!p.brand || !p.brand.trim() || p.brand === 'General') {
    issues.push({
      rowNumber: rowIndex,
      field: 'Brand',
      error: 'Brand is required',
      suggestedFix: 'Select or specify a valid brand name',
      severity: 'error'
    });
  }

  // 3. Required: Category
  if (!p.category || !p.category.trim()) {
    issues.push({
      rowNumber: rowIndex,
      field: 'Category',
      error: 'Category is required',
      suggestedFix: 'Assign a category (e.g. Makeup, Skincare, Hair Care)',
      severity: 'error'
    });
  }

  // 4. Required: MRP > 0
  if (p.mrp === undefined || p.mrp === null || isNaN(Number(p.mrp)) || Number(p.mrp) <= 0) {
    issues.push({
      rowNumber: rowIndex,
      field: 'MRP',
      error: 'MRP must be greater than 0',
      suggestedFix: 'Set a positive retail price (e.g. 599)',
      severity: 'error'
    });
  }

  // 5. GST % validation (0 - 28%)
  if (p.gst !== undefined && p.gst !== null && (isNaN(Number(p.gst)) || Number(p.gst) < 0 || Number(p.gst) > 28)) {
    issues.push({
      rowNumber: rowIndex,
      field: 'GST %',
      error: `Invalid GST percentage (${p.gst}%)`,
      suggestedFix: 'Provide a valid GST slab: 0, 5, 12, 18, or 28',
      severity: 'error'
    });
  }

  // 6. Barcode validation
  if (p.barcode) {
    if (!validateBarcodeChecksum(p.barcode)) {
      issues.push({
        rowNumber: rowIndex,
        field: 'Barcode',
        error: `Barcode checksum validation warning (${p.barcodeType || 'Code'})`,
        suggestedFix: 'Check barcode digits from physical packaging',
        severity: 'warning'
      });
    }
  } else {
    issues.push({
      rowNumber: rowIndex,
      field: 'Barcode',
      error: 'Barcode is missing',
      suggestedFix: 'Provide an EAN-13/UPC barcode or leave blank for auto-generation',
      severity: 'warning'
    });
  }

  // 7. Shade fields validation (ONLY if product has shades)
  const shadeApplies = isShadeApplicable(p.category, p.subcategory);
  if (shadeApplies && p.hexColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(p.hexColor)) {
    issues.push({
      rowNumber: rowIndex,
      field: 'HEX Code',
      error: `Invalid HEX code format (${p.hexColor})`,
      suggestedFix: 'Use a standard hex color string (e.g. #C2182B)',
      severity: 'error'
    });
  }

  // 8. Discount percentage range validations
  if (p.generalDiscount < 0 || p.generalDiscount > 90) {
    issues.push({
      rowNumber: rowIndex,
      field: 'General User Discount %',
      error: 'General discount out of normal range (0–90%)',
      suggestedFix: 'Adjust general discount between 0% and 90%',
      severity: 'warning'
    });
  }
  if (p.salonDiscount < 0 || p.salonDiscount > 90) {
    issues.push({
      rowNumber: rowIndex,
      field: 'Salon Owner Discount %',
      error: 'Salon discount out of normal range (0–90%)',
      suggestedFix: 'Adjust salon discount between 0% and 90%',
      severity: 'warning'
    });
  }

  const errors = issues.filter(i => i.severity === 'error').map(i => i.error);
  const warnings = issues.filter(i => i.severity === 'warning').map(i => i.error);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    issues
  };
};

// ==============================================================================
// 4. SUPABASE RECORD PAYLOAD BUILDER
// ==============================================================================

/**
 * Maps normalized product into the actual Supabase database row payload
 */
export const toSupabaseProductPayload = (p) => {
  const shadeApplies = isShadeApplicable(p.category, p.subcategory);

  const shadesJson = (Array.isArray(p.shades) && p.shades.length > 0)
    ? p.shades.map((s, idx) => ({
        id: s.id || `var_${Date.now()}_${idx + 1}`,
        name: s.name || s.shadeName || `Variant ${idx + 1}`,
        code: s.code || s.shadeCode || String(idx + 1).padStart(2, '0'),
        sku: s.sku || s.variantSku || `${p.sku || 'SKU'}-V${idx + 1}`,
        barcode: s.barcode || s.variantBarcode || null,
        hexColor: s.hexColor || s.hex || '#CE4270',
        hex: s.hex || s.hexColor || '#CE4270',
        color_name: s.color_name || s.name || 'Default',
        image: s.image || s.variantImageUrl || p.image || null,
        images: Array.isArray(s.images) && s.images.length > 0 ? s.images : (s.image ? [s.image] : (p.image ? [p.image] : [])),
        mrp: Number(s.mrp || p.mrp || 0),
        generalPrice: Number(s.generalPrice !== undefined ? s.generalPrice : (s.general_price !== undefined ? s.general_price : (p.generalPrice || p.mrp || 0))),
        general_price: Number(s.general_price !== undefined ? s.general_price : (s.generalPrice !== undefined ? s.generalPrice : (p.generalPrice || p.mrp || 0))),
        salonPrice: Number(s.salonPrice !== undefined ? s.salonPrice : (s.salon_price !== undefined ? s.salon_price : (p.salonPrice || p.mrp || 0))),
        salon_price: Number(s.salon_price !== undefined ? s.salon_price : (s.salonPrice !== undefined ? s.salonPrice : (p.salonPrice || p.mrp || 0))),
        artistPrice: Number(s.artistPrice !== undefined ? s.artistPrice : (s.artist_price !== undefined ? s.artist_price : (p.artistPrice || p.mrp || 0))),
        artist_price: Number(s.artist_price !== undefined ? s.artist_price : (s.artistPrice !== undefined ? s.artistPrice : (p.artistPrice || p.mrp || 0))),
        beauticianPrice: Number(s.beauticianPrice !== undefined ? s.beauticianPrice : (s.beautician_price !== undefined ? s.beautician_price : (p.beauticianPrice || p.mrp || 0))),
        beautician_price: Number(s.beautician_price !== undefined ? s.beautician_price : (s.beauticianPrice !== undefined ? s.beauticianPrice : (p.beauticianPrice || p.mrp || 0))),
        active: s.active !== false,
        attributes: s.attributes || {}
      }))
    : (shadeApplies && (p.hasMultipleShades || p.shade) ? [{
        id: p.id + '_shade_1',
        name: p.shade || 'Default Shade',
        code: '01',
        sku: p.sku ? `${p.sku}-V1` : `SKU-${Date.now()}-V1`,
        hexColor: p.hexColor || '#C2182B',
        hex: p.hexColor || '#C2182B',
        color_name: p.shade || 'Default',
        barcode: p.barcode || null,
        image: p.image || null,
        images: p.image ? [p.image] : [],
        mrp: Number(p.mrp || 0),
        generalPrice: Number(p.generalPrice || p.mrp || 0),
        general_price: Number(p.generalPrice || p.mrp || 0),
        salonPrice: Number(p.salonPrice || p.mrp || 0),
        salon_price: Number(p.salonPrice || p.mrp || 0),
        artistPrice: Number(p.artistPrice || p.mrp || 0),
        artist_price: Number(p.artistPrice || p.mrp || 0),
        beauticianPrice: Number(p.beauticianPrice || p.mrp || 0),
        beautician_price: Number(p.beauticianPrice || p.mrp || 0),
        active: true,
        attributes: p.attributes || {}
      }] : []);

  const addInfo = {
    ...(p.additionalInfo || {}),
    sku: p.sku || null,
    parent_sku: p.parentSku || p.sku || null,
    is_parent: (shadesJson.length > 1),
    size: p.size || null,
    gst_percent: p.gst !== undefined ? p.gst : (p.gstPercent || 18),
    net_qty: p.netQty || null,
    subcategory: p.subcategory || null,
    variant_type: p.variantType || (shadeApplies ? 'Shade' : 'Standard'),
    shade_name: shadeApplies ? (p.shade || null) : null,
    hex_color: shadeApplies ? (p.hexColor || null) : null,
    rgb: shadeApplies && p.hexColor ? hexToRgbString(p.hexColor) : null,
    attributes: p.attributes || {},
    description: p.description || null,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
    status: p.status || 'published',
    enabled: true
  };

  const specs = {
    ...(p.specifications || {}),
    size: p.size || null,
    net_quantity: p.netQty || null,
    gst_percent: p.gst !== undefined ? p.gst : 18,
    ...(p.attributes || {})
  };

  return {
    id: p.id,
    name: p.name,
    parent_id: p.parentId || p.parent_id || null,
    brand_id: p.brandId || null,
    brand_name: p.brand || 'General',
    category: p.category || 'General',
    subcategory: p.subcategory || p.sub_category || null,
    variant_type: p.variantType || (shadeApplies ? 'Shade' : 'Standard'),
    barcode: p.barcode || null,
    mrp: Number(p.mrp || 0),
    general_price: Number(p.generalPrice || p.mrp || 0),
    salon_price: Number(p.salonPrice || p.mrp || 0),
    artist_price: Number(p.artistPrice || p.mrp || 0),
    beautician_price: Number(p.beauticianPrice || p.mrp || 0),
    image: p.image || (Array.isArray(p.images) && p.images[0] ? p.images[0] : ''),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
    shades: shadesJson,
    quantity_tiers: {
      ...(typeof p.quantityTiers === 'object' ? p.quantityTiers : {}),
      general: Array.isArray(p.quantityTiers?.general) ? p.quantityTiers.general : [],
      salon: Array.isArray(p.quantityTiers?.salon) ? p.quantityTiers.salon : [],
      artist: Array.isArray(p.quantityTiers?.artist) ? p.quantityTiers.artist : [],
      beautician: Array.isArray(p.quantityTiers?.beautician) ? p.quantityTiers.beautician : [],
      roleDiscounts: {
        general: Number(p.generalDiscount || p.quantityTiers?.roleDiscounts?.general || 0),
        salon: Number(p.salonDiscount || p.quantityTiers?.roleDiscounts?.salon || 0),
        artist: Number(p.artistDiscount || p.quantityTiers?.roleDiscounts?.artist || 0),
        beautician: Number(p.beauticianDiscount || p.quantityTiers?.roleDiscounts?.beautician || 0)
      }
    },
    highlights: p.highlights || [],
    specifications: specs,
    additional_info: addInfo,
    description: p.description || p.howToUse || '',
    how_to_use: p.description || p.howToUse || '',
    product_type: p.variantType || (shadeApplies ? 'Shade' : 'Standard'),
    enabled: true,
    status: p.status || 'published',
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// ==============================================================================
// 5. HIGH-PERFORMANCE CHUNKED BULK SUBMISSION (UP TO 100,000+ PRODUCTS)
// ==============================================================================

export const mergeNonBlankRecord = (newPayload, existingRecord, allowBlankOverwrite = false) => {
  if (allowBlankOverwrite || !existingRecord) return newPayload;

  const merged = { ...newPayload };

  // Always retain existing record primary key id to avoid conflicts
  if (existingRecord.id) {
    merged.id = existingRecord.id;
  }

  // Core fields to guard from blank overwrite
  const protectedFields = [
    'name', 'brand_name', 'category', 'subcategory', 'image', 'mrp', 'general_price',
    'salon_price', 'artist_price', 'beautician_price', 'how_to_use', 'description',
    'product_type', 'highlights', 'specifications', 'quantity_tiers', 'ingredients'
  ];

  for (const field of protectedFields) {
    const newVal = newPayload[field];
    const oldVal = existingRecord[field];
    if ((newVal === null || newVal === undefined || newVal === '' || newVal === 0) && (oldVal !== null && oldVal !== undefined && oldVal !== '' && oldVal !== 0)) {
      merged[field] = oldVal;
    }
  }

  // Guard nested additional_info from blank overwrite
  if (existingRecord.additional_info && typeof existingRecord.additional_info === 'object') {
    merged.additional_info = {
      ...existingRecord.additional_info,
      ...Object.fromEntries(
        Object.entries(merged.additional_info || {}).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      )
    };
  }

  // Intelligently merge child shades/variants:
  // If existing record has shades and new payload has shades, merge by variant SKU/barcode/name
  if (Array.isArray(newPayload.shades) && newPayload.shades.length > 0) {
    if (Array.isArray(existingRecord.shades) && existingRecord.shades.length > 0) {
      const mergedShades = [...existingRecord.shades];

      newPayload.shades.forEach(incomingShade => {
        const matchIdx = mergedShades.findIndex(es =>
          (incomingShade.sku && es.sku && String(es.sku).trim().toLowerCase() === String(incomingShade.sku).trim().toLowerCase()) ||
          (incomingShade.barcode && es.barcode && String(es.barcode).trim() === String(incomingShade.barcode).trim()) ||
          (incomingShade.name && es.name && String(es.name).trim().toLowerCase() === String(incomingShade.name).trim().toLowerCase())
        );

        if (matchIdx >= 0) {
          const es = mergedShades[matchIdx];
          mergedShades[matchIdx] = {
            ...es,
            ...incomingShade,
            id: es.id || incomingShade.id, // keep stable id
            mrp: incomingShade.mrp || es.mrp,
            generalPrice: incomingShade.generalPrice || incomingShade.general_price || es.generalPrice || es.general_price,
            general_price: incomingShade.general_price || incomingShade.generalPrice || es.general_price || es.generalPrice,
            salonPrice: incomingShade.salonPrice || incomingShade.salon_price || es.salonPrice || es.salon_price,
            salon_price: incomingShade.salon_price || incomingShade.salonPrice || es.salon_price || es.salonPrice,
            artistPrice: incomingShade.artistPrice || incomingShade.artist_price || es.artistPrice || es.artist_price,
            artist_price: incomingShade.artist_price || incomingShade.artistPrice || es.artist_price || es.artistPrice,
            beauticianPrice: incomingShade.beauticianPrice || incomingShade.beautician_price || es.beauticianPrice || es.beautician_price,
            beautician_price: incomingShade.beautician_price || incomingShade.beauticianPrice || es.beautician_price || es.beauticianPrice,
            image: incomingShade.image || es.image,
            attributes: { ...(es.attributes || {}), ...(incomingShade.attributes || {}) }
          };
        } else {
          // Append as a new variant
          mergedShades.push(incomingShade);
        }
      });

      merged.shades = mergedShades;
    } else {
      merged.shades = newPayload.shades;
    }
  } else if (Array.isArray(existingRecord.shades) && existingRecord.shades.length > 0) {
    merged.shades = existingRecord.shades;
  }

  return merged;
};

/**
 * Submits validated products to Supabase in robust chunks
 * @param {NormalizedProduct[]} products - List of normalized products
 * @param {Object} options
 * @param {Function} [options.onProgress] - Progress callback: { current, total, text, percent }
 * @param {boolean} [options.updateExisting] - If true, updates existing products on duplicate barcode
 * @param {boolean} [options.allowBlankOverwrite] - If false (default), blank cells never overwrite existing values
 * @param {number} [options.chunkSize] - Batch size (default 500)
 */
export const chunkedBulkSave = async (products, options = {}) => {
  const {
    onProgress = null,
    updateExisting = false,
    allowBlankOverwrite = false,
    chunkSize = 500
  } = options;

  if (!Array.isArray(products) || products.length === 0) {
    return { success: true, total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0, failedRows: [], errors: [] };
  }

  const total = products.length;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failedRows = [];
  const errors = [];

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const chunkNumber = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(total / chunkSize);

    if (onProgress) {
      const processedSoFar = i;
      const pct = Math.round((processedSoFar / total) * 100);
      onProgress({
        current: processedSoFar,
        total,
        percent: pct,
        text: `Processing batch ${chunkNumber} of ${totalChunks} (${processedSoFar.toLocaleString()} / ${total.toLocaleString()})...`
      });
    }

    const payloads = chunk.map(toSupabaseProductPayload);

    try {
      if (updateExisting) {
        const withBarcode = payloads.filter(p => p.barcode);
        const withoutBarcode = payloads.filter(p => !p.barcode);

        if (withBarcode.length > 0) {
          // If allowBlankOverwrite is false, fetch existing data to merge safely
          if (!allowBlankOverwrite) {
            const barcodesInChunk = withBarcode.map(p => p.barcode);
            const { data: existingData } = await supabase
              .from('products')
              .select('id, barcode, name, brand_name, category, mrp, general_price, salon_price, artist_price, beautician_price, image, shades, additional_info')
              .in('barcode', barcodesInChunk);

            const existingByBarcode = new Map();
            (existingData || []).forEach(e => existingByBarcode.set(e.barcode, e));

            for (const item of withBarcode) {
              const existingRecord = existingByBarcode.get(item.barcode);
              const finalPayload = mergeNonBlankRecord(item, existingRecord, false);
              
              const { error: upsertSingleErr } = await supabase
                .from('products')
                .upsert(finalPayload, { onConflict: 'barcode', ignoreDuplicates: false });

              if (upsertSingleErr) {
                failed++;
                failedRows.push({ ...item, _error: upsertSingleErr.message });
                errors.push(`Row "${item.name}": ${upsertSingleErr.message}`);
              } else if (existingRecord) {
                updated++;
              } else {
                inserted++;
              }
            }
          } else {
            const { error: upsertErr } = await supabase
              .from('products')
              .upsert(withBarcode, { onConflict: 'barcode', ignoreDuplicates: false });

            if (upsertErr) {
              console.warn(`Upsert batch ${chunkNumber} warning, falling back to per-row safe upsert:`, upsertErr);
              for (const item of withBarcode) {
                const { error: singleErr } = await supabase.from('products').upsert(item, { onConflict: 'barcode' });
                if (singleErr) {
                  failed++;
                  failedRows.push({ ...item, _error: singleErr.message });
                  errors.push(`Row "${item.name}": ${singleErr.message}`);
                } else {
                  updated++;
                }
              }
            } else {
              updated += withBarcode.length;
            }
          }
        }

        if (withoutBarcode.length > 0) {
          const { error: insErr } = await supabase
            .from('products')
            .insert(withoutBarcode);

          if (insErr) {
            for (const item of withoutBarcode) {
              const { error: singleErr } = await supabase.from('products').insert(item);
              if (singleErr) {
                failed++;
                failedRows.push({ ...item, _error: singleErr.message });
                errors.push(`Row "${item.name}": ${singleErr.message}`);
              } else {
                inserted++;
              }
            }
          } else {
            inserted += withoutBarcode.length;
          }
        }
      } else {
        // Skip existing duplicates on conflict
        const { error: insertErr } = await supabase
          .from('products')
          .insert(payloads);

        if (insertErr) {
          // If batch insert has duplicate key or conflict, handle row by row
          for (const item of payloads) {
            try {
              const { error: singleErr } = await supabase.from('products').insert(item);
              if (singleErr) {
                if (singleErr.code === '23505' || singleErr.message?.includes('duplicate key') || singleErr.message?.includes('unique constraint')) {
                  skipped++;
                } else {
                  failed++;
                  failedRows.push({ ...item, _error: singleErr.message });
                  errors.push(`Row "${item.name}": ${singleErr.message}`);
                }
              } else {
                inserted++;
              }
            } catch (singleEx) {
              failed++;
              failedRows.push({ ...item, _error: singleEx.message });
              errors.push(`Row "${item.name}": ${singleEx.message}`);
            }
          }
        } else {
          inserted += payloads.length;
        }
      }
    } catch (chunkEx) {
      console.error(`Fatal batch ${chunkNumber} exception:`, chunkEx);
      errors.push(`Batch ${chunkNumber}: ${chunkEx.message}`);
    }
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percent: 100,
      text: `Completed: ${inserted.toLocaleString()} created, ${updated.toLocaleString()} updated, ${skipped.toLocaleString()} skipped, ${failed.toLocaleString()} failed.`
    });
  }

  return {
    success: errors.length === 0,
    total,
    inserted,
    updated,
    skipped,
    failed,
    failedRows,
    errors
  };
};

// ==============================================================================
// 6. DATASET CLASSIFICATION ENGINE (NEW, EXISTING, DUPLICATE-IN-FILE, INVALID)
// ==============================================================================

/**
 * Classifies an imported dataset into summary metrics
 */
export const classifyDataset = (normalizedList, cache) => {
  const barcodeCounts = new Map();
  normalizedList.forEach(p => {
    if (p.barcode) {
      barcodeCounts.set(p.barcode, (barcodeCounts.get(p.barcode) || 0) + 1);
    }
  });

  let newCount = 0;
  let existingCount = 0;
  let duplicateInFileCount = 0;
  let invalidCount = 0;

  const classified = normalizedList.map((p, idx) => {
    const val = validateProduct(p, idx + 1);
    let classType = 'NEW';

    if (!val.isValid) {
      classType = 'INVALID';
      invalidCount++;
    } else if (p.barcode && barcodeCounts.get(p.barcode) > 1) {
      classType = 'DUPLICATE-IN-FILE';
      duplicateInFileCount++;
    } else if (cache && p.barcode && cache.existingBarcodeMap.has(p.barcode)) {
      classType = 'EXISTING';
      existingCount++;
    } else {
      newCount++;
    }

    return {
      ...p,
      _rowIndex: idx + 1,
      _classification: classType,
      _isValid: val.isValid,
      _errors: val.errors,
      _warnings: val.warnings,
      _issues: val.issues
    };
  });

  return {
    classified,
    summary: {
      total: normalizedList.length,
      newCount,
      existingCount,
      duplicateInFileCount,
      invalidCount
    }
  };
};

// ==============================================================================
// 7. INTELLIGENT EXCEL COLUMN MAPPING
// ==============================================================================

export const EXCEL_COLUMN_SYNONYMS = {
  barcode: ['barcode', 'bar code', 'ean', 'upc', 'gtin', 'ean-13', 'upc-a'],
  name: ['product name', 'product_name', 'productname', 'title', 'item name', 'name', 'product title'],
  brand: ['brand', 'brand name', 'brand_name', 'manufacturer', 'make'],
  category: ['category', 'category name', 'main category', 'main_category', 'department'],
  subcategory: ['subcategory', 'sub category', 'sub_category', 'sub-category'],
  variantType: ['variant type', 'variant_type', 'type', 'item type'],
  shade: ['shade name', 'shade_name', 'shade', 'color name', 'variant', 'tone'],
  hexColor: ['hex code', 'hex', 'color hex', 'hex_code', '#hex', 'hex color'],
  rgb: ['rgb', 'rgb code', 'rgb value'],
  size: ['size', 'product size', 'volume / size', 'item size', 'bottle size', 'pack size'],
  gst: ['gst %', 'gst', 'gst percent', 'gst rate', 'tax %', 'tax rate'],
  netQty: ['net qty', 'net quantity', 'quantity', 'net weight', 'unit qty', 'pack qty'],
  mrp: ['mrp', 'mrp price', 'original mrp', 'retail price', 'price', 'maximum retail price'],
  generalDiscount: ['general user discount %', 'general discount', 'general discount %', 'general_discount', 'b2c discount'],
  salonDiscount: ['salon owner discount %', 'salon discount', 'salon discount %', 'salon_discount', 'b2b salon discount'],
  artistDiscount: ['makeup artist discount %', 'artist discount', 'artist discount %', 'artist_discount'],
  beauticianDiscount: ['beautician discount %', 'beautician discount', 'beautician_discount'],
  quantityTiers: ['quantity discount tiers', 'quantity tiers', 'quantity_tiers', 'qty pricing'],
  description: ['description', 'product description', 'about', 'details'],
  highlights: ['highlights', 'features', 'benefits', 'key points'],
  image: ['product image', 'image', 'image url', 'picture', 'photo'],
  status: ['status', 'product status', 'publish status']
};

/**
 * Intelligent header mapper
 */
export const mapExcelHeaders = (headers) => {
  const mapping = {};
  if (!Array.isArray(headers)) return mapping;

  headers.forEach(header => {
    if (!header || typeof header !== 'string') return;
    const clean = normalizeText(header);

    for (const [canonicalField, synonyms] of Object.entries(EXCEL_COLUMN_SYNONYMS)) {
      if (synonyms.some(s => clean === s || clean.includes(s))) {
        if (!Object.values(mapping).includes(canonicalField)) {
          mapping[header] = canonicalField;
          break;
        }
      }
    }
  });

  return mapping;
};
