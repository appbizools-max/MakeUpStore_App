/**
 * Excel Processor & Master Product Ingestion Service
 * 
 * Comprehensive workbook analysis, dynamic column auto-mapping,
 * parent-child variant grouping, relational validation, duplicate detection,
 * non-blank cell merge handling, and sanitized error export.
 */

import * as XLSX from 'xlsx';
import { validateBarcodeChecksum, detectBarcodeFormat } from './barcodeLookupService.js';
import { matchBeautyShade } from './aiColorService.js';
import { APPROVED_BRAND_MASTER } from '../utils/brandMasterApprovedData.js';
import { deriveBrandMnemonic } from '../utils/brandUtils.js';

// Comprehensive Column Mapping Dictionary with Canonical and Legacy Synonyms
export const COLUMN_SYNONYMS = {
  barcode: ['barcode', 'bar code', 'ean', 'upc', 'ean-13', 'upc-a', 'gtin', 'primary barcode', 'barcode_number'],
  parentSku: ['parent_sku', 'parent sku', 'parentsku', 'parent code', 'style code', 'product sku', 'master sku', 'style #'],
  productName: ['product_name', 'product name', 'product', 'title', 'item name', 'item description', 'product title', 'item', 'name'],
  productType: ['product_type', 'product type', 'type', 'select category', 'leaf category', 'item type', 'sub-type'],
  category: ['category', 'main category', 'main_category', 'department', 'dept'],
  subcategory: ['subcategory', 'sub category', 'sub_category', 'sub-category', 'category 2'],
  brand: ['brand', 'brand name', 'brand_name', 'manufacturer', 'make'],
  productDescription: ['product_description', 'product description', 'description', 'about', 'details', 'summary'],
  highlights: ['highlights', 'highlite', 'highlight', 'product highlights', 'product_highlights', 'features', 'key points', 'benefits', 'points'],

  variantSku: ['variant_sku', 'variant sku', 'variantsku', 'sku', 'item code', 'article no', 'article number', 'product code'],
  variantName: ['variant_name', 'variant name', 'variant', 'variant title', 'option name'],
  shadeName: ['shade_name', 'shade name', 'shade', 'color', 'color name', 'colour', 'color_name', 'tone'],
  shadeCode: ['shade_code', 'shade code', 'shade no', 'shade number', 'color code', 'code'],
  sizeOrWeight: ['size_or_weight', 'size or weight', 'size', 'volume', 'weight', 'net quantity', 'net qty', 'net weight', 'pack size'],
  variantBarcode: ['variant_barcode', 'variant barcode', 'child barcode', 'shade barcode', 'variant upc', 'variant ean'],

  mrp: ['mrp', 'm.r.p.', 'maximum retail price', 'retail price', 'list price', 'mrp (inr)'],
  generalPrice: ['general_user_price', 'general user price', 'general price', 'general_price', 'selling price', 'sale price', 'customer price', 'b2c price', 'price'],
  salonPrice: ['salon_price', 'salon price', 'salon wholesale', 'trade price', 'b2b salon', 'salon rate'],
  artistPrice: ['makeup_artist_price', 'makeup artist price', 'artist price', 'artist_price', 'pro price', 'artist rate'],
  beauticianPrice: ['beautician_price', 'beautician price', 'beautician rate', 'spa price'],

  finish: ['finish', 'texture', 'look', 'effect'],
  skinType: ['skin_type', 'skin type', 'target skin', 'skin suitability'],
  coverage: ['coverage', 'opacity'],
  ingredients: ['ingredients', 'ingredients list', 'key ingredients', 'composition', 'formulation'],
  howToUse: ['how_to_use', 'how to use', 'directions', 'usage instructions', 'application'],
  countryOfOrigin: ['country_of_origin', 'country of origin', 'origin', 'made in', 'country'],

  productImageUrl: ['product_image_url', 'product image url', 'product image', 'image', 'primary image', 'main image', 'image url', 'image_url'],
  variantImageUrl: ['variant_image_url', 'variant image url', 'variant image', 'shade image', 'shade image url', 'variant photo'],

  productActive: ['product_active', 'product active', 'status', 'publishing status', 'publish status', 'enabled'],
  variantActive: ['variant_active', 'variant active', 'variant status', 'is_active', 'in_stock']
};

/**
 * Normalizes header string for fuzzy matching
 */
export const cleanHeader = (header) => {
  if (!header || typeof header !== 'string') return '';
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ');
};

/**
 * Suggests standard field name for raw Excel column header
 */
export const matchColumnHeader = (rawHeader) => {
  const clean = cleanHeader(rawHeader);
  if (!clean) return null;

  // Step 1: Check for exact match against any synonym
  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    if (synonyms.some(syn => clean === cleanHeader(syn))) {
      return field;
    }
  }

  // Step 2: Fallback to partial match, checking longer synonyms first
  const sortedEntries = Object.entries(COLUMN_SYNONYMS).sort((a, b) => {
    const maxLenA = Math.max(...a[1].map(s => cleanHeader(s).length));
    const maxLenB = Math.max(...b[1].map(s => cleanHeader(s).length));
    return maxLenB - maxLenA;
  });

  for (const [field, synonyms] of sortedEntries) {
    if (synonyms.some(syn => {
      const synClean = cleanHeader(syn);
      if (['code', 'price', 'type', 'name'].includes(synClean)) {
        return clean === synClean;
      }
      return clean.includes(synClean);
    })) {
      return field;
    }
  }
  return null;
};

/**
 * Reads workbook file (.xlsx, .xls, .csv) and returns metadata and sheets
 */
export const analyzeWorkbook = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames;
        const analysis = {
          fileName: file.name,
          fileSize: file.size,
          sheetsCount: sheetNames.length,
          sheets: []
        };

        sheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

          if (rawRows.length === 0) {
            analysis.sheets.push({
              name: sheetName,
              rowCount: 0,
              columnCount: 0,
              headers: [],
              columnMapping: {},
              sampleRows: []
            });
            return;
          }

          // Locate header row (first row with at least 2 non-empty cells)
          let headerIdx = 0;
          for (let i = 0; i < Math.min(6, rawRows.length); i++) {
            const nonEmpties = (rawRows[i] || []).filter(c => String(c).trim().length > 0);
            if (nonEmpties.length >= 2) {
              headerIdx = i;
              break;
            }
          }

          const rawHeaders = (rawRows[headerIdx] || []).map(h => String(h || '').trim());
          const columnMapping = {};

          rawHeaders.forEach(h => {
            if (h) {
              const matched = matchColumnHeader(h);
              if (matched && !Object.values(columnMapping).includes(matched)) {
                columnMapping[h] = matched;
              }
            }
          });

          // Convert subsequent rows into objects
          const dataRows = [];
          for (let r = headerIdx + 1; r < rawRows.length; r++) {
            const rowArr = rawRows[r];
            if (!rowArr || rowArr.every(cell => String(cell || '').trim() === '')) continue; // skip blank row

            const rowObj = {};
            rawHeaders.forEach((h, colIdx) => {
              rowObj[h] = rowArr[colIdx] !== undefined ? String(rowArr[colIdx]).trim() : '';
            });
            dataRows.push(rowObj);
          }

          analysis.sheets.push({
            name: sheetName,
            headerRowIndex: headerIdx,
            rowCount: dataRows.length,
            columnCount: rawHeaders.length,
            headers: rawHeaders,
            columnMapping,
            dataRows,
            sampleRows: dataRows.slice(0, 5)
          });
        });

        resolve(analysis);
      } catch (err) {
        reject(new Error(`Failed to parse Excel workbook: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsArrayBuffer(file);
  });
};

// ----------------------------------------------------------------------------
// BRAND DICTIONARY & CODE GENERATOR
// ----------------------------------------------------------------------------
export const KNOWN_BRAND_CODES = {
  'lakme': 'LAK',
  'loreal': 'LOR',
  'loreal paris': 'LOR',
  "l'oreal": 'LOR',
  "l'oreal paris": 'LOR',
  'mac': 'MAC',
  'm.a.c': 'MAC',
  'm.a.c.': 'MAC',
  'maybelline': 'MAY',
  'maybelline new york': 'MAY',
  'huda': 'HUD',
  'huda beauty': 'HUD',
  'colorbar': 'COL',
  'sugar': 'SUG',
  'sugar cosmetics': 'SUG',
  'nykaa': 'NYK',
  'salbeau': 'SAL',
  'salbeau paris': 'SAL',
  'salbeau pro': 'SAL',
  'faces canada': 'FAC',
  'swiss beauty': 'SWISS',
  'biotique': 'BIO',
  'mamaearth': 'MAMA',
  'plum': 'PLUM',
  'the body shop': 'TBS',
  'innisfree': 'INN',
  'kay beauty': 'KAY'
};

export const generateBrandCode = (brand) => {
  if (!brand || typeof brand !== 'string') return 'GEN';
  // Strip diacritics/accents (e.g. Lakmé -> lakme, L'Oréal -> l'oreal)
  const normalized = brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const clean = normalized.replace(/[^a-z0-9]/g, '');

  // 1. Check approved Brand Master dictionary
  const masterMatch = APPROVED_BRAND_MASTER.find(b =>
    b.name.toLowerCase() === normalized ||
    b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
    b.brandCode.toLowerCase() === normalized ||
    b.brandNumber.toLowerCase() === normalized
  );
  if (masterMatch && masterMatch.brandCode) {
    return masterMatch.brandCode.split('-')[0];
  }

  if (KNOWN_BRAND_CODES[normalized]) {
    return KNOWN_BRAND_CODES[normalized];
  }
  if (KNOWN_BRAND_CODES[clean]) {
    return KNOWN_BRAND_CODES[clean];
  }
  return deriveBrandMnemonic(brand);
};

// ----------------------------------------------------------------------------
// PRODUCT NAME SLUGIFICATION & SKU GENERATION
// ----------------------------------------------------------------------------
const NOISE_WORDS = new Set([
  'THE', 'OF', 'AND', 'FOR', 'WITH', 'IN', 'BY', 'AN', 'A', 'ALL',
  'DAY', 'HOUR', 'HOURS', 'LONG', 'LASTING', 'WEAR', 'BEST', 'PRO',
  'PLUS', 'NEW', 'EDITION', 'DELUXE', 'PREMIUM', 'ORIGINAL', 'AUTHENTIC'
]);

export const generateProductSlug = (productName) => {
  if (!productName || typeof productName !== 'string') return 'PROD';
  const words = productName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !NOISE_WORDS.has(w));

  if (words.length === 0) return 'PROD';
  if (words.length === 1) return words[0].slice(0, 8);

  if (words.length === 2) {
    return `${words[0].slice(0, 4)}-${words[1].slice(0, 4)}`;
  }
  return `${words[0].slice(0, 3)}-${words[1].slice(0, 3)}-${words[2].slice(0, 3)}`;
};

export const generateParentSku = (brand, productName) => {
  const brandCode = generateBrandCode(brand);
  const prodSlug = generateProductSlug(productName);
  return `${brandCode}-${prodSlug}`;
};

export const generateVariantSku = (parentSku, {
  explicitVariantSku = '',
  shadeCode = '',
  shadeName = '',
  sizeOrWeight = '',
  indexInGroup = 0,
  totalInGroup = 1
} = {}) => {
  if (explicitVariantSku && String(explicitVariantSku).trim()) {
    return String(explicitVariantSku).trim().toUpperCase();
  }

  const base = parentSku || 'PROD';

  // Option 1: Shade Code (e.g. "01", "105", "NC20")
  if (shadeCode && String(shadeCode).trim()) {
    const cleanCode = String(shadeCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode) return `${base}-${cleanCode}`;
  }

  // Option 2: Size / Weight (e.g. "30ml", "50ml", "100g")
  if (sizeOrWeight && String(sizeOrWeight).trim()) {
    const cleanSize = String(sizeOrWeight).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanSize) return `${base}-${cleanSize}`;
  }

  // Option 3: Shade Name (e.g. "01 Red Myth", "Ruby Red")
  if (shadeName && String(shadeName).trim()) {
    const trimmed = String(shadeName).trim();
    const leadingNum = trimmed.match(/^(\d+)/);
    if (leadingNum) {
      return `${base}-${leadingNum[1]}`;
    }
    const cleanShade = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (cleanShade) return `${base}-${cleanShade}`;
  }

  // Option 4: Sequential numbering if multiple variants in group
  if (totalInGroup > 1) {
    const seq = String(indexInGroup + 1).padStart(2, '0');
    return `${base}-${seq}`;
  }

  // Standalone product
  return `${base}-STD`;
};

/**
 * Normalizes individual row fields according to column mappings and validates values
 */
export const normalizeRow = (r, idx, mapping, existingProducts = []) => {
  const effectiveMapping = mapping || Object.keys(r || {}).reduce((acc, col) => {
    const matched = matchColumnHeader(col);
    if (matched) acc[col] = matched;
    return acc;
  }, {});

  const getVal = (field) => {
    const col = Object.keys(effectiveMapping).find(k => effectiveMapping[k] === field);
    return col && r[col] !== undefined ? String(r[col]).trim() : '';
  };

  const getNum = (field, fallback = 0) => {
    const v = getVal(field);
    if (!v) return fallback;
    const clean = v.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return !isNaN(num) ? num : fallback;
  };

  const getBool = (field, fallback = true) => {
    const v = getVal(field).toLowerCase();
    if (!v) return fallback;
    if (['false', '0', 'no', 'draft', 'inactive'].includes(v)) return false;
    return true;
  };

  const barcode = getVal('barcode');
  const parentSku = getVal('parentSku');
  const productName = getVal('productName');
  const productType = getVal('productType');
  const category = getVal('category');
  const subcategory = getVal('subcategory');
  const brand = getVal('brand');
  const productDescription = getVal('productDescription');
  const highlights = getVal('highlights');

  const variantSku = getVal('variantSku');
  const variantName = getVal('variantName');
  const shadeName = getVal('shadeName');
  const shadeCode = getVal('shadeCode');
  const sizeOrWeight = getVal('sizeOrWeight');
  const variantBarcode = getVal('variantBarcode') || barcode;

  const mrp = getNum('mrp', 0);
  const generalPrice = getNum('generalPrice', mrp);
  const salonPrice = getNum('salonPrice', Math.round(generalPrice * 0.8));
  const artistPrice = getNum('artistPrice', Math.round(salonPrice * 0.95));
  const beauticianPrice = getNum('beauticianPrice', Math.round(salonPrice * 0.9));

  const finish = getVal('finish');
  const skinType = getVal('skinType');
  const coverage = getVal('coverage');
  const ingredients = getVal('ingredients');
  const howToUse = getVal('howToUse');
  const countryOfOrigin = getVal('countryOfOrigin');

  const productImageUrl = getVal('productImageUrl');
  const variantImageUrl = getVal('variantImageUrl') || productImageUrl;

  const productActive = getBool('productActive', true);
  const variantActive = getBool('variantActive', true);

  // Auto-generate SKU if omitted
  const rawParentSku = parentSku;
  const rawVariantSku = variantSku;
  const isParentSkuAutoGenerated = !rawParentSku;
  const isVariantSkuAutoGenerated = !rawVariantSku;

  const resolvedParentSku = rawParentSku || (brand && productName ? generateParentSku(brand, productName) : `PARENT-${Date.now().toString(36)}-${idx + 1}`);
  const resolvedVariantSku = rawVariantSku || generateVariantSku(resolvedParentSku, {
    explicitVariantSku: rawVariantSku,
    shadeCode,
    shadeName,
    sizeOrWeight,
    indexInGroup: idx,
    totalInGroup: 1
  });

  // Auto-infer beauty shade swatches if shade name is given
  let hexColor = '#CE4270';
  if (shadeName) {
    const matched = matchBeautyShade(shadeName);
    if (matched && matched.hex) hexColor = matched.hex;
  }

  // Row Validations
  const errors = [];
  const warnings = [];

  if (!productName) errors.push('Product Name is required');
  if (!brand) errors.push('Brand is required');
  if (!category) errors.push('Category is required');
  if (mrp <= 0) errors.push('MRP must be a positive number greater than 0');
  if (generalPrice > mrp) errors.push(`General User Price (₹${generalPrice}) cannot exceed MRP (₹${mrp})`);
  if (salonPrice > mrp) errors.push(`Salon Price (₹${salonPrice}) cannot exceed MRP (₹${mrp})`);
  if (artistPrice > mrp) errors.push(`Makeup Artist Price (₹${artistPrice}) cannot exceed MRP (₹${mrp})`);
  if (beauticianPrice > mrp) errors.push(`Beautician Price (₹${beauticianPrice}) cannot exceed MRP (₹${mrp})`);

  // Barcode format & checksum
  const primaryCode = variantBarcode || barcode;
  if (primaryCode) {
    if (!validateBarcodeChecksum(primaryCode)) {
      warnings.push(`Barcode "${primaryCode}" checksum verification alert`);
    }
  } else {
    warnings.push('No barcode provided (can be added later via scanner or manual entry)');
  }

  return {
    _rowIndex: idx + 2, // 1-based, account for header row
    _valid: errors.length === 0,
    _errors: errors,
    _warnings: warnings,
    _rawParentSku: rawParentSku,
    _rawVariantSku: rawVariantSku,
    isParentSkuAutoGenerated,
    isVariantSkuAutoGenerated,
    barcode,
    parentSku: resolvedParentSku,
    productName,
    productType,
    category,
    subcategory,
    brand,
    productDescription,
    highlights: highlights ? highlights.split(';').map(h => h.trim()).filter(Boolean) : [],
    variantSku: resolvedVariantSku,
    variantName: variantName || shadeName || (sizeOrWeight ? `${sizeOrWeight}` : 'Standard Variant'),
    shadeName,
    shadeCode,
    hexColor,
    sizeOrWeight,
    variantBarcode: primaryCode,
    mrp,
    generalPrice,
    salonPrice,
    artistPrice,
    beauticianPrice,
    finish,
    skinType,
    coverage,
    ingredients,
    howToUse,
    countryOfOrigin,
    productImageUrl,
    variantImageUrl,
    productActive,
    variantActive
  };
};

/**
 * Transforms raw sheet data and groups into relational Parent Products with Child Variants
 */
export const groupSheetRowsIntoProducts = (sheet, mapping, existingProducts = [], relationshipConfig = { mode: 'auto' }) => {
  const rawRows = Array.isArray(sheet) ? sheet : (sheet?.dataRows || []);
  const normalizedRows = [];

  // 1. Build lookup indices of existing database catalog to detect duplicates and updates
  const existingBarcodeMap = new Map();
  const existingSkuMap = new Map();
  const existingNameBrandMap = new Map();

  existingProducts.forEach(p => {
    if (p.barcode) existingBarcodeMap.set(String(p.barcode).trim(), p);
    if (p.sku) existingSkuMap.set(String(p.sku).trim(), p);
    if (p.name && p.brand_name) existingNameBrandMap.set(`${p.brand_name.toLowerCase()}:::${p.name.toLowerCase()}`, p);
    else if (p.name && p.brand) existingNameBrandMap.set(`${p.brand.toLowerCase()}:::${p.name.toLowerCase()}`, p);

    (p.shades || []).forEach(s => {
      if (s.barcode) existingBarcodeMap.set(String(s.barcode).trim(), p);
      if (s.sku) existingSkuMap.set(String(s.sku).trim(), p);
    });
  });

  // Track occurrences within the uploaded workbook to detect intra-sheet duplicates
  const sheetBarcodeCounts = {};
  const explicitVariantSkuCounts = {};

  // First pass: normalize each row
  rawRows.forEach((r, idx) => {
    const norm = normalizeRow(r, idx, mapping, existingProducts);
    normalizedRows.push(norm);

    if (norm.variantBarcode) {
      sheetBarcodeCounts[norm.variantBarcode] = (sheetBarcodeCounts[norm.variantBarcode] || 0) + 1;
    }
    if (norm._rawVariantSku) {
      const vSku = norm._rawVariantSku.toUpperCase();
      explicitVariantSkuCounts[vSku] = (explicitVariantSkuCounts[vSku] || 0) + 1;
    }
  });

  // Second pass: check intra-sheet duplicate SKUs / barcodes
  normalizedRows.forEach(r => {
    if (r.variantBarcode && sheetBarcodeCounts[r.variantBarcode] > 1) {
      r._warnings.push(`Barcode "${r.variantBarcode}" appears multiple times in this Excel file`);
    }
    // Only flag duplicate Variant SKU if user explicitly provided duplicate SKUs in the sheet
    if (r._rawVariantSku && explicitVariantSkuCounts[r._rawVariantSku.toUpperCase()] > 1) {
      r._errors.push(`Duplicate Variant SKU "${r._rawVariantSku}" found across multiple rows in this file`);
      r._valid = false;
    }
  });

  // 2. Relational Grouping:
  // Map Brand + Product Name to any explicitly declared Parent_SKU in the sheet to allow child rows to inherit
  const nameBrandToExplicitParentSku = new Map();
  normalizedRows.forEach(r => {
    if (r._rawParentSku && r.brand && r.productName) {
      const cleanBrand = r.brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const cleanName = r.productName.toLowerCase().trim();
      const nbKey = `${cleanBrand}:::${cleanName}`;
      if (!nameBrandToExplicitParentSku.has(nbKey)) {
        nameBrandToExplicitParentSku.set(nbKey, r._rawParentSku.toUpperCase());
      }
    }
  });

  const productGroups = new Map();

  normalizedRows.forEach(r => {
    let groupKey = '';
    if (relationshipConfig.mode === 'independent') {
      groupKey = `row_${r._rowIndex}`;
    } else {
      const cleanBrand = (r.brand || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const cleanName = (r.productName || '').toLowerCase().trim();
      const nbKey = (cleanBrand && cleanName) ? `${cleanBrand}:::${cleanName}` : '';

      if (r._rawParentSku) {
        groupKey = `sku:::${r._rawParentSku.toUpperCase()}`;
      } else if (nbKey && nameBrandToExplicitParentSku.has(nbKey)) {
        // Inherit parent SKU from another row of the same product family
        groupKey = `sku:::${nameBrandToExplicitParentSku.get(nbKey)}`;
      } else if (nbKey) {
        // Group by brand + product name
        groupKey = `name:::${nbKey}`;
      } else {
        groupKey = `sku:::${r.parentSku.toUpperCase()}`;
      }
    }

    if (!productGroups.has(groupKey)) {
      productGroups.set(groupKey, []);
    }
    productGroups.get(groupKey).push(r);
  });

  // 3. Assemble final Parent Product entities with nested Child Variants
  const groupedProducts = [];
  const usedVariantSkusInBatch = new Set();
  let totalNewParents = 0;
  let totalExistingParents = 0;
  let totalNewVariants = 0;
  let totalExistingVariants = 0;
  let totalAutoGeneratedParents = 0;
  let totalAutoGeneratedVariants = 0;

  productGroups.forEach((rowsInGroup) => {
    const primaryRow = rowsInGroup[0];
    
    // Check if Parent SKU was explicitly supplied in any row of this group
    const explicitParentSkuRow = rowsInGroup.find(r => r._rawParentSku);
    const hasExplicitParentSku = Boolean(explicitParentSkuRow);
    const canonicalParentSku = hasExplicitParentSku
      ? explicitParentSkuRow._rawParentSku.toUpperCase()
      : generateParentSku(primaryRow.brand, primaryRow.productName);

    if (!hasExplicitParentSku) {
      totalAutoGeneratedParents++;
    }

    // Set canonical Parent SKU for all rows in this group
    rowsInGroup.forEach(r => {
      r.parentSku = canonicalParentSku;
      r.isParentSkuAutoGenerated = !hasExplicitParentSku;
    });

    // Check if Parent already exists in database
    let existingParent = null;
    if (canonicalParentSku && existingSkuMap.has(canonicalParentSku)) {
      existingParent = existingSkuMap.get(canonicalParentSku);
    } else if (primaryRow.barcode && existingBarcodeMap.has(primaryRow.barcode)) {
      existingParent = existingBarcodeMap.get(primaryRow.barcode);
    } else if (primaryRow.brand && primaryRow.productName) {
      const cleanBrand = primaryRow.brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const cleanName = primaryRow.productName.toLowerCase().trim();
      const nbKey = `${cleanBrand}:::${cleanName}`;
      if (existingNameBrandMap.has(nbKey)) {
        existingParent = existingNameBrandMap.get(nbKey);
      }
    }

    const isParentExisting = Boolean(existingParent);
    if (isParentExisting) totalExistingParents++;
    else totalNewParents++;

    // Map Child Variants with smart SKU generation & deduplication
    const childVariants = rowsInGroup.map((r, vIdx) => {
      const hasExplicitVariantSku = Boolean(r._rawVariantSku);
      let resolvedVariantSku = '';

      if (hasExplicitVariantSku) {
        resolvedVariantSku = r._rawVariantSku.toUpperCase();
      } else {
        totalAutoGeneratedVariants++;
        // Intelligently generate variant SKU based on shade code, size, shade name, or index
        resolvedVariantSku = generateVariantSku(canonicalParentSku, {
          explicitVariantSku: '',
          shadeCode: r.shadeCode,
          shadeName: r.shadeName,
          sizeOrWeight: r.sizeOrWeight,
          indexInGroup: vIdx,
          totalInGroup: rowsInGroup.length
        });

        // Ensure intra-batch uniqueness for auto-generated variant SKUs
        let disambiguatedSku = resolvedVariantSku;
        let suffixNum = 2;
        while (usedVariantSkusInBatch.has(disambiguatedSku)) {
          disambiguatedSku = `${resolvedVariantSku}-${suffixNum}`;
          suffixNum++;
        }
        resolvedVariantSku = disambiguatedSku;
      }

      usedVariantSkusInBatch.add(resolvedVariantSku);
      r.variantSku = resolvedVariantSku;
      r.isVariantSkuAutoGenerated = !hasExplicitVariantSku;

      // Check if this specific variant exists in database
      const isVariantExisting = (existingParent?.shades || []).some(
        s => (resolvedVariantSku && s.sku === resolvedVariantSku) ||
             (r.variantBarcode && s.barcode === r.variantBarcode) ||
             (r.shadeName && s.name?.toLowerCase() === r.shadeName.toLowerCase())
      );

      if (isVariantExisting) totalExistingVariants++;
      else totalNewVariants++;

      return {
        id: `var_${Date.now()}_${vIdx + 1}_${Math.random().toString(36).substr(2, 4)}`,
        name: r.variantName || r.shadeName || (rowsInGroup.length === 1 ? 'Standard' : `Variant ${vIdx + 1}`),
        code: r.shadeCode || String(vIdx + 1).padStart(2, '0'),
        sku: resolvedVariantSku,
        isSkuAutoGenerated: !hasExplicitVariantSku,
        barcode: r.variantBarcode || r.barcode || '',
        hexColor: r.hexColor || '#CE4270',
        image: r.variantImageUrl || primaryRow.productImageUrl || '',
        images: [r.variantImageUrl || primaryRow.productImageUrl].filter(Boolean),
        mrp: r.mrp,
        generalPrice: r.generalPrice,
        salonPrice: r.salonPrice,
        artistPrice: r.artistPrice,
        beauticianPrice: r.beauticianPrice,
        active: r.variantActive !== false,
        isExisting: isVariantExisting,
        attributes: {
          ...(r.finish ? { 'Finish': r.finish } : {}),
          ...(r.skinType ? { 'Skin Type': r.skinType } : {}),
          ...(r.coverage ? { 'Coverage': r.coverage } : {}),
          ...(r.sizeOrWeight ? { 'Size': r.sizeOrWeight } : {}),
          ...(r.countryOfOrigin ? { 'Country of Origin': r.countryOfOrigin } : {})
        }
      };
    });

    const groupErrors = rowsInGroup.flatMap(r => r._errors);
    const groupWarnings = Array.from(new Set(rowsInGroup.flatMap(r => r._warnings)));
    const isGroupValid = rowsInGroup.every(r => r._valid);

    // Parent Product Entity
    groupedProducts.push({
      _groupKey: canonicalParentSku || primaryRow.productName,
      _rowsCount: rowsInGroup.length,
      _valid: isGroupValid,
      _errors: groupErrors,
      _warnings: groupWarnings,
      _rawRows: rowsInGroup,
      isExistingParent: isParentExisting,
      existingDatabaseId: existingParent?.id || null,

      // Product Master Attributes
      name: primaryRow.productName,
      sku: canonicalParentSku,
      parentSku: canonicalParentSku,
      isSkuAutoGenerated: !hasExplicitParentSku,
      barcode: primaryRow.barcode || childVariants[0]?.barcode || '',
      brandName: primaryRow.brand,
      category: primaryRow.category,
      subcategory: primaryRow.subcategory || '',
      productType: primaryRow.productType || '',
      description: primaryRow.productDescription || '',
      ingredients: primaryRow.ingredients || '',
      howToUse: primaryRow.howToUse || '',
      image: primaryRow.productImageUrl || childVariants[0]?.image || '',
      images: Array.from(new Set([
        primaryRow.productImageUrl,
        ...childVariants.map(v => v.image)
      ].filter(Boolean))),
      mrp: Math.min(...childVariants.map(v => v.mrp)),
      generalPrice: Math.min(...childVariants.map(v => v.generalPrice)),
      salonPrice: Math.min(...childVariants.map(v => v.salonPrice)),
      artistPrice: Math.min(...childVariants.map(v => v.artistPrice)),
      beauticianPrice: Math.min(...childVariants.map(v => v.beauticianPrice)),
      status: primaryRow.productActive ? 'published' : 'draft',
      enabled: primaryRow.productActive !== false,
      isParentProduct: childVariants.length > 1 || Boolean(primaryRow.shadeName),
      shades: childVariants,
      variants: childVariants,
      specifications: {
        ...(primaryRow.finish ? { finish: primaryRow.finish } : {}),
        ...(primaryRow.skinType ? { skinType: primaryRow.skinType } : {}),
        ...(primaryRow.coverage ? { coverage: primaryRow.coverage } : {}),
        ...(primaryRow.countryOfOrigin ? { countryOfOrigin: primaryRow.countryOfOrigin } : {})
      }
    });
  });

  return {
    rawNormalizedRows: normalizedRows,
    groupedProducts,
    metrics: {
      totalRows: normalizedRows.length,
      validRows: normalizedRows.filter(r => r._valid).length,
      invalidRows: normalizedRows.filter(r => !r._valid).length,
      errors: normalizedRows.flatMap(r => r._errors),
      warnings: Array.from(new Set(normalizedRows.flatMap(r => r._warnings))),
      totalProductGroups: groupedProducts.length,
      newParents: totalNewParents,
      existingParents: totalExistingParents,
      newVariants: totalNewVariants,
      existingVariants: totalExistingVariants,
      autoGeneratedParentSkus: totalAutoGeneratedParents,
      autoGeneratedVariantSkus: totalAutoGeneratedVariants
    }
  };
};

/**
 * Sanitizes cell text to protect against CSV/Excel Formula Injection (CWE-1236)
 */
export const sanitizeExcelCell = (val) => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`; // prefix apostrophe to neutralize formula execution
  }
  return str;
};

/**
 * Generates and downloads an Excel workbook containing only failed/errored rows
 */
export const downloadErrorExcel = (failedRows = [], originalFileName = 'import') => {
  if (!failedRows || failedRows.length === 0) return;

  const exportData = failedRows.map(r => ({
    'Row #': r._rowIndex || '-',
    'Errors': sanitizeExcelCell((r._errors || []).join('; ')),
    'Warnings': sanitizeExcelCell((r._warnings || []).join('; ')),
    'Product Name': sanitizeExcelCell(r.productName || r.name),
    'Brand': sanitizeExcelCell(r.brand || r.brandName),
    'Category': sanitizeExcelCell(r.category),
    'Subcategory': sanitizeExcelCell(r.subcategory),
    'Parent_SKU': sanitizeExcelCell(r.parentSku),
    'Variant_SKU': sanitizeExcelCell(r.variantSku || r.sku),
    'Shade': sanitizeExcelCell(r.shadeName || r.shade),
    'Barcode': sanitizeExcelCell(r.variantBarcode || r.barcode),
    'MRP': r.mrp,
    'General User Price': r.generalPrice,
    'Salon Price': r.salonPrice
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');

  const base = (originalFileName || 'products').replace(/\.[^/.]+$/, '');
  const outName = `${base}_failed_rows_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, outName);
};
