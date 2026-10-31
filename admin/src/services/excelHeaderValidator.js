/**
 * Strict Excel Header Validator & Row Normalizer for Bulk Product Import
 * 
 * Enforces an exact 18-column schema:
 * BARCODE, IMAGE, PARENT_SKU, PRODUCT_NAME, CATEGORY, SUBCATEGORY, BRAND,
 * VARIANT_SKU, SHADE_NAME, HEX & SWATCH, SIZE_OR_WEIGHT, MRP, GENERAL_USER_PRICE,
 * SALON_PRICE, MAKEUP_ARTIST_PRICE, BEAUTICIAN_PRICE, PRODUCT_ACTIVE, STATUS
 */

import * as XLSX from 'xlsx';
import { matchBeautyShade } from './aiColorService.js';

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

// Default GST Slab for products when not specified in the template
// Confirm correct GST slab with accountant.
export const DEFAULT_GST_SLAB = 18;

// Exactly these 18 headers must be present in the upload template
export const REQUIRED_HEADERS = Object.freeze([
  'BARCODE',
  'IMAGE',
  'PARENT_SKU',
  'PRODUCT_NAME',
  'CATEGORY',
  'SUBCATEGORY',
  'BRAND',
  'VARIANT_SKU',
  'SHADE_NAME',
  'HEX & SWATCH',
  'SIZE_OR_WEIGHT',
  'MRP',
  'GENERAL_USER_PRICE',
  'SALON_PRICE',
  'MAKEUP_ARTIST_PRICE',
  'BEAUTICIAN_PRICE',
  'PRODUCT_ACTIVE',
  'STATUS'
]);

/**
 * Selects the appropriate sheet for import:
 * - Checks for "Bulk Product Upload"
 * - Fallbacks to the first sheet that is not "Field Guide"
 * - Always ignores "Field Guide" (notes only)
 */
export const selectUploadSheet = (workbook) => {
  if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
    return { sheetName: null, worksheet: null, error: 'Empty workbook or no sheets found.' };
  }

  // 1. Look for explicit target sheet "Bulk Product Upload" (case-insensitive)
  const targetSheetName = workbook.SheetNames.find(
    name => name.trim().toLowerCase() === 'bulk product upload'
  );

  if (targetSheetName) {
    return { sheetName: targetSheetName, worksheet: workbook.Sheets[targetSheetName] };
  }

  // 2. Otherwise use the first sheet that is NOT "Field Guide"
  const candidate = workbook.SheetNames.find(
    name => name.trim().toLowerCase() !== 'field guide'
  );

  if (candidate) {
    return { sheetName: candidate, worksheet: workbook.Sheets[candidate] };
  }

  return {
    sheetName: null,
    worksheet: null,
    error: 'Workbook contains only "Field Guide" sheet. No product data sheet found.'
  };
};

/**
 * Normalizes text for typo / rename hint generation
 */
const simplifyForHint = (text) => {
  if (!text) return '';
  return String(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

/**
 * Generates hints for missing headers if an extra header looks like a renamed one
 * e.g. "Product Name" vs "PRODUCT_NAME" -> 'Did you mean PRODUCT_NAME?'
 */
export const findHeaderHints = (missingHeaders, extraHeaders) => {
  const hints = [];
  const matchedMissing = new Set();
  const matchedExtra = new Set();

  missingHeaders.forEach(missing => {
    const simplifiedMissing = simplifyForHint(missing);
    extraHeaders.forEach(extra => {
      if (matchedExtra.has(extra) || matchedMissing.has(missing)) return;
      const simplifiedExtra = simplifyForHint(extra);

      // Check if simplified forms are equal or very close
      if (
        simplifiedExtra === simplifiedMissing ||
        simplifiedExtra.includes(simplifiedMissing) ||
        simplifiedMissing.includes(simplifiedExtra)
      ) {
        hints.push(`For "${extra}": Did you mean "${missing}"?`);
        matchedMissing.add(missing);
        matchedExtra.add(extra);
      }
    });
  });

  return hints;
};

/**
 * Performs strict header validation on an Excel worksheet or raw header array.
 * 
 * Checks:
 * - Empty file / no rows
 * - Header row trimmed exact matching
 * - MISSING columns
 * - EXTRA columns (not in REQUIRED_HEADERS, ignoring completely empty cells)
 * - DUPLICATE columns
 * - Renamed header hints
 * 
 * Column order does NOT matter.
 */
export const validateExcelHeaders = (input, sheetName = '') => {
  let headers = [];
  let rawMatrix = [];
  let worksheet = null;

  if (Array.isArray(input)) {
    // Array of header strings passed directly (useful for tests)
    headers = input;
  } else if (input && typeof input === 'object') {
    worksheet = input;
    rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawMatrix || rawMatrix.length === 0) {
      const res = {
        valid: false,
        isValid: false,
        isEmpty: true,
        sheetName: sheetName || '',
        headersFound: [],
        headersExpected: [...REQUIRED_HEADERS],
        failedCheck: 'EMPTY_FILE',
        errors: ['The selected file is completely empty.'],
        missing: [...REQUIRED_HEADERS],
        extra: [],
        duplicates: [],
        hints: []
      };
      console.log('[Excel Header Validation]', {
        sheetName: res.sheetName,
        headersFound: res.headersFound,
        headersExpected: res.headersExpected,
        missing: res.missing,
        extra: res.extra,
        duplicates: res.duplicates,
        failedCheck: res.failedCheck,
        isValid: false
      });
      return res;
    }

    // Row 1 is the header row
    const firstRow = rawMatrix[0] || [];
    headers = firstRow.map(h => (h !== undefined && h !== null ? String(h) : ''));
  }

  // Trim headers, normalize non-breaking spaces (\u00A0), and track non-empty headers
  const trimmedHeaders = [];
  const headersFound = [];
  const headerOccurrences = {};
  const duplicates = [];

  headers.forEach((h, idx) => {
    // Normalize any non-breaking spaces to standard space and trim
    const trimmed = String(h || '').replace(/\u00A0/g, ' ').trim();
    if (trimmed.length === 0) {
      // Ignore completely empty header cells
      return;
    }

    trimmedHeaders.push(trimmed);
    headersFound.push(trimmed);

    if (headerOccurrences[trimmed]) {
      headerOccurrences[trimmed].count += 1;
      headerOccurrences[trimmed].indices.push(idx);
      if (headerOccurrences[trimmed].count === 2) {
        duplicates.push(trimmed);
      }
    } else {
      headerOccurrences[trimmed] = { count: 1, indices: [idx] };
    }
  });

  if (trimmedHeaders.length === 0) {
    const res = {
      valid: false,
      isValid: false,
      isEmpty: true,
      sheetName: sheetName || '',
      headersFound: [],
      headersExpected: [...REQUIRED_HEADERS],
      failedCheck: 'NO_HEADERS_FOUND',
      errors: ['No header row found in row 1 of the spreadsheet.'],
      missing: [...REQUIRED_HEADERS],
      extra: [],
      duplicates: [],
      hints: []
    };
    console.log('[Excel Header Validation]', {
      sheetName: res.sheetName,
      headersFound: res.headersFound,
      headersExpected: res.headersExpected,
      missing: res.missing,
      extra: res.extra,
      duplicates: res.duplicates,
      failedCheck: res.failedCheck,
      isValid: false
    });
    return res;
  }

  // Check data rows count if a worksheet was provided
  if (worksheet && rawMatrix) {
    const dataRows = rawMatrix.slice(1).filter(row =>
      Array.isArray(row) && row.some(cell => String(cell || '').replace(/\u00A0/g, ' ').trim().length > 0)
    );
    if (dataRows.length === 0) {
      const res = {
        valid: false,
        isValid: false,
        isEmpty: true,
        sheetName: sheetName || '',
        headersFound,
        headersExpected: [...REQUIRED_HEADERS],
        failedCheck: 'NO_DATA_ROWS',
        errors: ['The spreadsheet contains a valid header row but has no product data rows.'],
        missing: [],
        extra: [],
        duplicates: [],
        hints: []
      };
      console.log('[Excel Header Validation]', {
        sheetName: res.sheetName,
        headersFound: res.headersFound,
        headersExpected: res.headersExpected,
        missing: res.missing,
        extra: res.extra,
        duplicates: res.duplicates,
        failedCheck: res.failedCheck,
        isValid: false
      });
      return res;
    }
  }

  // 1. Missing columns: required headers not present in trimmed headers
  const headerSet = new Set(trimmedHeaders);
  const missing = REQUIRED_HEADERS.filter(req => !headerSet.has(req));

  // 2. Extra columns: headers present in file that are not in REQUIRED_HEADERS
  const requiredSet = new Set(REQUIRED_HEADERS);
  const extra = Array.from(new Set(trimmedHeaders.filter(h => !requiredSet.has(h))));

  // 3. Renamed column hints
  const hints = findHeaderHints(missing, extra);

  const errorMessages = [];
  if (missing.length > 0) {
    errorMessages.push(`Missing columns (${missing.length}): ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    errorMessages.push(`Extra columns not allowed (${extra.length}): ${extra.join(', ')}`);
  }
  if (duplicates.length > 0) {
    errorMessages.push(`Duplicate columns (${duplicates.length}): ${duplicates.join(', ')}`);
  }

  const isValid = missing.length === 0 && extra.length === 0 && duplicates.length === 0;

  let failedCheck = null;
  if (!isValid) {
    if (missing.length > 0) failedCheck = 'MISSING_COLUMNS';
    else if (extra.length > 0) failedCheck = 'EXTRA_COLUMNS';
    else if (duplicates.length > 0) failedCheck = 'DUPLICATE_COLUMNS';
    else failedCheck = 'HEADER_MISMATCH';
  }

  // Build header name to column index mapping for row reading
  const headerIndexMap = {};
  trimmedHeaders.forEach((h, idx) => {
    headerIndexMap[h] = idx;
  });

  const res = {
    valid: isValid,
    isValid,
    isEmpty: false,
    sheetName: sheetName || '',
    headersFound,
    headers: trimmedHeaders,
    headersExpected: [...REQUIRED_HEADERS],
    failedCheck,
    errors: errorMessages,
    missing,
    extra,
    duplicates,
    hints,
    headerIndexMap
  };

  console.log('[Excel Header Validation]', {
    sheetName: res.sheetName,
    headersFound: res.headersFound,
    headersExpected: res.headersExpected,
    missing: res.missing,
    extra: res.extra,
    duplicates: res.duplicates,
    failedCheck: res.failedCheck,
    isValid: res.isValid
  });

  return res;
};

/**
 * Normalizes a raw data row using the strict 18-column layout.
 * 
 * Price Handling Rule:
 * - Use the values from the file as they are.
 * - Only auto-calculate a role price if that cell is empty.
 * - Never overwrite a price the client provided.
 */
export const normalizeStrictImportRow = (rawRow, headerIndexMap, rowIndex = 0) => {
  const getCell = (colName) => {
    if (!rawRow) return '';
    // If rawRow is an object with column keys (from sheet_to_json default)
    if (typeof rawRow === 'object' && !Array.isArray(rawRow)) {
      if (rawRow[colName] !== undefined && rawRow[colName] !== null) {
        return String(rawRow[colName]).trim();
      }
      // Check trimmed key matching
      for (const [key, val] of Object.entries(rawRow)) {
        if (key.trim() === colName && val !== undefined && val !== null) {
          return String(val).trim();
        }
      }
      return '';
    }
    // If rawRow is an array of cells
    if (Array.isArray(rawRow) && headerIndexMap && headerIndexMap[colName] !== undefined) {
      const idx = headerIndexMap[colName];
      const val = rawRow[idx];
      return val !== undefined && val !== null ? String(val).trim() : '';
    }
    return '';
  };

  const getNumCell = (colName) => {
    const rawVal = getCell(colName);
    if (!rawVal) return null; // cell is empty
    const clean = rawVal.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return !isNaN(num) ? num : null;
  };

  const getBoolCell = (colName, fallback = true) => {
    const rawVal = getCell(colName).toLowerCase();
    if (!rawVal) return fallback;
    if (['false', '0', 'no', 'inactive', 'draft'].includes(rawVal)) return false;
    return true;
  };

  // 18 exact fields
  const barcode = getCell('BARCODE');
  const image = getCell('IMAGE');
  const parentSku = getCell('PARENT_SKU');
  const productName = getCell('PRODUCT_NAME');
  const category = getCell('CATEGORY');
  const subcategory = getCell('SUBCATEGORY');
  const brand = getCell('BRAND');
  const variantSku = getCell('VARIANT_SKU');
  const shadeName = getCell('SHADE_NAME');
  const hexAndSwatch = getCell('HEX & SWATCH');
  const sizeOrWeight = getCell('SIZE_OR_WEIGHT');

  const rawMrp = getNumCell('MRP');
  const mrp = rawMrp !== null ? rawMrp : 0;

  // Role Prices: Use client values as they are, only calculate if empty
  const rawGenPrice = getNumCell('GENERAL_USER_PRICE');
  const rawSalonPrice = getNumCell('SALON_PRICE');
  const rawArtistPrice = getNumCell('MAKEUP_ARTIST_PRICE');
  const rawBeauticianPrice = getNumCell('BEAUTICIAN_PRICE');

  const generalPrice = rawGenPrice !== null ? rawGenPrice : mrp;
  const salonPrice = rawSalonPrice !== null ? rawSalonPrice : Math.round(generalPrice * 0.7);
  const artistPrice = rawArtistPrice !== null ? rawArtistPrice : Math.round(generalPrice * 0.65);
  const beauticianPrice = rawBeauticianPrice !== null ? rawBeauticianPrice : Math.round(generalPrice * 0.68);

  const productActive = getBoolCell('PRODUCT_ACTIVE', true);
  const statusStr = getCell('STATUS').toLowerCase();
  const status = ['published', 'active', 'ready'].includes(statusStr) ? 'published' : 'draft';

  // Infer color hex if not provided but shade name exists
  let hexColor = hexAndSwatch || '';
  if (!hexColor && shadeName) {
    const matched = matchBeautyShade(shadeName);
    if (matched && matched.hex) hexColor = matched.hex;
  }
  if (!hexColor) hexColor = '#CE4270';

  return {
    _id: 'row_' + Date.now() + '_' + rowIndex + '_' + Math.random().toString(36).substring(2, 6),
    barcode,
    barcodeStatus: barcode ? 'detected' : 'manual',
    parentSku: parentSku || (brand && productName ? `${brand.slice(0, 3).toUpperCase()}-${productName.slice(0, 8).toUpperCase().replace(/\s+/g, '-')}` : ''),
    name: productName,
    productType: subcategory || category || '',
    category,
    subcategory,
    brand,
    description: '',
    highlights: [],
    variantSku: variantSku || '',
    variantName: shadeName || '',
    variantType: shadeName ? 'Shade' : 'Standard',
    shade: shadeName,
    shadeCode: '',
    hexColor,
    rgb: hexToRgbString(hexColor),
    size: sizeOrWeight,
    variantBarcode: barcode,
    // Applied automatically: Confirm correct GST slab with accountant.
    gst: String(DEFAULT_GST_SLAB),
    netQty: '1 N',
    mrp: mrp > 0 ? mrp : '',
    generalPrice: generalPrice > 0 ? generalPrice : '',
    salonPrice: salonPrice > 0 ? salonPrice : '',
    artistPrice: artistPrice > 0 ? artistPrice : '',
    beauticianPrice: beauticianPrice > 0 ? beauticianPrice : '',
    generalDiscount: mrp > 0 && generalPrice < mrp ? Math.round(((mrp - generalPrice) / mrp) * 100) : '',
    salonDiscount: mrp > 0 && salonPrice < mrp ? Math.round(((mrp - salonPrice) / mrp) * 100) : '',
    artistDiscount: mrp > 0 && artistPrice < mrp ? Math.round(((mrp - artistPrice) / mrp) * 100) : '',
    beauticianDiscount: mrp > 0 && beauticianPrice < mrp ? Math.round(((mrp - beauticianPrice) / mrp) * 100) : '',
    images: image ? [image] : [],
    productImageUrl: image || '',
    productActive,
    variantActive: productActive,
    hasMultipleShades: Boolean(shadeName),
    isParent: false,
    parentId: null,
    status
  };
};
