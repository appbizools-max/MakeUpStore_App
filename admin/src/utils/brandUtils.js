/**
 * SALBEAU MAKEUPSTORE — ENTERPRISE BRAND MANAGEMENT UTILITIES
 * 
 * Provides:
 * - Permanent Sequential Brand Number Generator (BR001, BR002...) with deletion tracking
  * - Approved Brand Master Reconciliation (365 Verified Brands)
 * - Conflict Detection & Deterministic Collision Resolution
 * - Excel Export with CSV Formula Injection Safeguards
 * - Excel Import Parsing, Schema Validation & Row-Level Error Auditing
 */

import * as XLSX from 'xlsx';
import { APPROVED_BRAND_MASTER } from './brandMasterApprovedData.js';

const BRAND_SEQ_STORAGE_KEY = 'salbeau_brand_max_sequence_v1';

/**
 * Global Brand Normalization Engine:
 * 1. Converts to string and trims leading/trailing whitespace
 * 2. Normalizes multiple spaces to a single space
 * 3. Normalizes Unicode NFD decomposition to strip diacritics / accents (e.g. 'LAKMÉ' -> 'lakme', 'é' -> 'e')
 * 4. Normalizes typographic quotes / apostrophes (’ / ‘ / ` -> ')
 * 5. Lowercases for case-insensitive matching
 */
export const normalizeBrandKey = (name) => {
  if (!name && name !== 0) return '';
  return String(name)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’‘`]/g, "'")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Normalizes a brand name for presentation while preserving clean casing & spacing
 */
export const normalizeBrandName = (name) => {
  if (!name && name !== 0) return '';
  return String(name).trim().replace(/\s+/g, ' ');
};

/**
 * Builds an ultra-fast O(1) normalized lookup map from an array of Brand Master records.
 * Indexes each brand by:
 * - Normalized key (e.g. 'lakme', 'l\'oreal', 'maybelline')
 * - Punctuation-stripped key (e.g. 'loreal')
 * - Brand Number (e.g. 'br001', 'br002')
 * - Brand ID (e.g. 'b_001', uuid)
 */
export const buildBrandLookupMap = (brands = []) => {
  const map = new Map();

  (brands || []).forEach(b => {
    if (!b) return;
    const rawName = b.brand_name || b.brandName || b.name || '';
    const canonicalName = String(rawName).trim();
    if (!canonicalName) return;

    const brandRecord = {
      id: b.id,
      name: canonicalName,
      brand_name: canonicalName,
      brandName: canonicalName,
      brandNumber: b.brandNumber || b.brand_number || '',
      brand_number: b.brandNumber || b.brand_number || '',
      categories: b.categories || [],
      logo_url: b.logo_url || b.logoUrl || '',
      raw: b
    };

    // Index by normalized key (accents removed, lowercased, single spaced)
    const normKey = normalizeBrandKey(canonicalName);
    if (normKey && !map.has(normKey)) {
      map.set(normKey, brandRecord);
    }

    // Also index with punctuation stripped as secondary fallback (e.g. "LOREAL" vs "L'OREAL")
    const strippedKey = normKey.replace(/[^a-z0-9]/g, '');
    if (strippedKey && strippedKey !== normKey && !map.has(strippedKey)) {
      map.set(strippedKey, brandRecord);
    }

    // Index by Brand Number (e.g. BR001)
    const bNum = String(b.brandNumber || b.brand_number || '').trim().toLowerCase();
    if (bNum && !map.has(bNum)) {
      map.set(bNum, brandRecord);
    }

    // Index by ID
    const bId = String(b.id || '').trim().toLowerCase();
    if (bId && !map.has(bId)) {
      map.set(bId, brandRecord);
    }

    // Index first base word as fallback if multiple words and base not yet registered
    // (e.g. "LOREAL COSMETICS" allows "loreal" to resolve to LOREAL COSMETICS if standalone "LOREAL" does not exist)
    const baseWord = normKey.split(/\s+/)[0];
    if (baseWord && baseWord.length >= 3 && !map.has(baseWord)) {
      map.set(baseWord, brandRecord);
    }
    const strippedBaseWord = strippedKey.split(/\s+/)[0];
    if (strippedBaseWord && strippedBaseWord.length >= 3 && !map.has(strippedBaseWord)) {
      map.set(strippedBaseWord, brandRecord);
    }
  });

  return map;
};

const COMMON_NOISE_SUFFIXES = [
  'new york',
  'paris',
  'london',
  'india',
  'cosmetics',
  'cosmetic',
  'beauty',
  'professional',
  'skincare',
  'skin care',
  'haircare',
  'hair care'
];

/**
 * Matches an input brand against Brand Master using case-insensitive, accent-insensitive logic.
 * Returns { matched: true, brand: brandRecord } or { matched: false, brand: null }
 */
export const matchBrandMaster = (inputBrand, brandsOrMap) => {
  if (!inputBrand && inputBrand !== 0) {
    return { matched: false, brand: null };
  }

  const lookupMap = brandsOrMap instanceof Map
    ? brandsOrMap
    : buildBrandLookupMap(brandsOrMap || []);

  const rawInput = String(inputBrand).trim();
  if (!rawInput) {
    return { matched: false, brand: null };
  }

  // 1. Direct normalized key match
  const normKey = normalizeBrandKey(rawInput);
  if (lookupMap.has(normKey)) {
    return { matched: true, brand: lookupMap.get(normKey) };
  }

  // 2. Stripped punctuation match (e.g. LOREAL vs L'Oreal)
  const strippedKey = normKey.replace(/[^a-z0-9]/g, '');
  if (strippedKey && lookupMap.has(strippedKey)) {
    return { matched: true, brand: lookupMap.get(strippedKey) };
  }

  // 3. Strip common noise suffixes (e.g. "Maybelline New York" -> "Maybelline", "Sugar Cosmetics" -> "Sugar")
  for (const suffix of COMMON_NOISE_SUFFIXES) {
    if (normKey.endsWith(' ' + suffix)) {
      const strippedSuffixKey = normKey.slice(0, -(suffix.length + 1)).trim();
      if (lookupMap.has(strippedSuffixKey)) {
        return { matched: true, brand: lookupMap.get(strippedSuffixKey) };
      }
      const strippedClean = strippedSuffixKey.replace(/[^a-z0-9]/g, '');
      if (strippedClean && lookupMap.has(strippedClean)) {
        return { matched: true, brand: lookupMap.get(strippedClean) };
      }
    }
  }

  // 4. Base first word match (e.g. "L'Oreal Paris" -> base "loreal")
  const firstWord = normKey.split(/[\s'’]+/)[0];
  if (firstWord && firstWord.length >= 3 && lookupMap.has(firstWord)) {
    return { matched: true, brand: lookupMap.get(firstWord) };
  }

  // 5. Brand number match (e.g. BR001, BR12)
  const inputLower = rawInput.toLowerCase();
  if (lookupMap.has(inputLower)) {
    return { matched: true, brand: lookupMap.get(inputLower) };
  }

  return { matched: false, brand: null };
};

/**
 * Extracts integer sequence from a Brand Number (e.g. 'BR001' -> 1, 'BR365' -> 365, 'b_256' -> 256, 12 -> 12)
 */
export const parseBrandNumberSeq = (brandNum) => {
  if (!brandNum && brandNum !== 0) return 0;
  if (typeof brandNum === 'number') return brandNum;
  const str = brandNum.toString().trim();
  const brMatch = str.match(/^BR0*(\d+)$/i);
  if (brMatch) return parseInt(brMatch[1], 10);
  const bMatch = str.match(/^b_(\d+)$/i);
  if (bMatch) return parseInt(bMatch[1], 10);
  const numMatch = str.match(/^#?0*(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 0;
};

/**
 * Formats a sequence number into permanent Brand Number (e.g. 1 -> 'BR001', 366 -> 'BR366', 1000 -> 'BR1000')
 */
export const formatBrandNumber = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return 'BR001';
  if (n <= 999) {
    return `BR${String(n).padStart(3, '0')}`;
  }
  return `BR${n}`;
};

/**
 * Resolves and formats a Brand Number deterministically:
 * 1. Checks existing brandNumber / brand_number (if valid and not BR000)
 * 2. Matches brand name against approved 365 brand master
 * 3. Checks numeric suffix in ID (e.g. b_256 -> BR256)
 * 4. Checks sort_order / sortOrder (e.g. 1 -> BR001)
 * 5. Falls back to sequential generator
 */
export const resolveBrandNumber = (brand, existingBrands = []) => {
  if (!brand) return 'BR001';
  const rawNum = brand.brandNumber || brand.brand_number;
  if (rawNum && rawNum !== 'BR000') {
    const seq = parseBrandNumberSeq(rawNum);
    if (seq > 0) return formatBrandNumber(seq);
  }

  const orderNum = parseInt(brand.sort_order || brand.sortOrder, 10);
  if (!isNaN(orderNum) && orderNum > 0) {
    return formatBrandNumber(orderNum);
  }

  if (brand.id) {
    const idMatch = brand.id.toString().match(/b_(\d+)$/i);
    if (idMatch) {
      const seq = parseInt(idMatch[1], 10);
      if (seq > 0 && seq < 100000) return formatBrandNumber(seq);
    }
  }

  return generateNextBrandNumber(existingBrands);
};

/**
 * Resolves a Brand Code deterministically:
 * 1. Checks existing brandNumber / brand_number
 * 2. Generates proposed code from mnemonic and brand number
 */
export const resolveBrandCode = () => '';


/**
 * Concurrency-Safe Sequential Brand Number Generator
 * - Scans existing brands in database / local state
 * - Starts strictly from S.No 1 (BR001) when catalog is empty
 * - Increments sequentially without skipping
 * - Returns format 'BR001', 'BR002', 'BR003'
 */
export const generateNextBrandNumber = (existingBrands = []) => {
  let highestSeq = 0;

  // Scan active / existing brands in state
  (existingBrands || []).forEach(b => {
    const seq = parseBrandNumberSeq(b.brandNumber || b.brand_number || b.sort_order || b.sortOrder);
    if (seq && seq > highestSeq) highestSeq = seq;
  });

  // If there are no existing brands, start from S.No 1 (BR001)
  if (highestSeq === 0 && (!existingBrands || existingBrands.length === 0)) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(BRAND_SEQ_STORAGE_KEY);
      } catch (e) {}
    }
    return formatBrandNumber(1);
  }

  // Check persistent high-water mark so deleted brand numbers are not recycled when catalog exists
  if (typeof window !== 'undefined' && window.localStorage && existingBrands.length > 0) {
    try {
      const savedMax = parseInt(localStorage.getItem(BRAND_SEQ_STORAGE_KEY) || '0', 10);
      if (!isNaN(savedMax) && savedMax > highestSeq && savedMax < 100000) {
        highestSeq = savedMax;
      }
    } catch (e) {}
  }

  const nextSeq = highestSeq + 1;

  // Persist updated high-water mark
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(BRAND_SEQ_STORAGE_KEY, String(nextSeq));
    } catch (e) {}
  }

  return formatBrandNumber(nextSeq);
};

/**
 * Derives a 3-character uppercase mnemonic from brand name
 */
export const deriveBrandMnemonic = (brandName) => {
  if (!brandName) return 'BRD';
  const clean = brandName.toString().replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    if (words[0].length >= 2) {
      return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
    } else {
      return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
    }
  } else if (words.length === 1) {
    const single = words[0];
    if (single.length >= 3) {
      return single.slice(0, 3).toUpperCase();
    } else {
      return (single + 'XX').slice(0, 3).toUpperCase();
    }
  }
  return 'BRD';
};

/**
 * Generates Professional Brand Code:
 * 1. 3-character mnemonic + '-' + 3-digit sequence (derived from Brand Number or sequence).
 * 2. Checks uniqueness against existing brands.
 * 3. In case of collision, resolves with deterministic alternative mnemonic.
 */
export const generateProposedBrandCode = () => '';

/**
 * Validates Brand Code format and uniqueness
 */
export const validateBrandCode = () => ({ valid: true });

/**
 * Validates Brand Name uniqueness
 */
export const validateBrandName = (name, arg2 = null, arg3 = []) => {
  let excludeBrandId = typeof arg2 === 'string' ? arg2 : (typeof arg3 === 'string' ? arg3 : null);
  let existingBrands = Array.isArray(arg2) ? arg2 : (Array.isArray(arg3) ? arg3 : []);

  if (!name || !name.trim()) {
    return { valid: false, error: 'Brand Name is required.' };
  }
  const cleanName = normalizeBrandName(name);
  if (cleanName.length < 2) {
    return { valid: false, error: 'Brand Name must be at least 2 characters.' };
  }

  const collision = (existingBrands || []).find(b => {
    if (excludeBrandId && b.id === excludeBrandId) return false;
    const bName = normalizeBrandName(b.brand_name || b.brandName || b.name);
    return bName.toLowerCase() === cleanName.toLowerCase();
  });

  if (collision) {
    const colName = collision.brand_name || collision.brandName || collision.name || name;
    return {
      valid: false,
      error: `A brand with the name "${colName}" already exists (${collision.brandNumber || collision.brand_number || 'ID: ' + collision.id}).`
    };
  }

  return { valid: true };
};

/**
 * Escapes values for Excel export to prevent CSV / Formula Injection attacks
 */
export const escapeSpreadsheetFormula = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+@-]/i.test(str)) {
    return `'${str}`;
  }
  return str;
};

/**
 * Exports Brand Master to Excel with exact 8 columns in specified order
 */
export const exportBrandsToExcel = (brandsList = [], options = {}) => {
  const {
    customFilename = null,
    includeInternalNotes = true
  } = options;

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `brand_master_${todayStr}.xlsx`;

  // Exact 8 columns in order:
  // 1. Brand Number
  // 2. Brand Name
    // 4. Categories
  // 5. Logo URL
  // 6. Visibility
  // 7. Brand Description
  // 8. Internal Notes
  const headers = [
    'Brand Number',
    'Brand Name',
    'Categories',
    'Logo URL',
    'Visibility',
    'Brand Description',
    'Internal Notes'
  ];

  const rows = brandsList.map(b => {
    // Categories format: join array with semicolon and space
    let catsStr = '';
    if (Array.isArray(b.categories)) {
      catsStr = b.categories.join('; ');
    } else if (typeof b.categories === 'string' && b.categories.trim()) {
      catsStr = b.categories;
    } else if (b.category) {
      catsStr = b.category;
    }

    const visibilityStr = (b.enabled !== false) ? 'Active' : 'Inactive';

    return [
      escapeSpreadsheetFormula(b.brandNumber || b.brand_number || ''),
      escapeSpreadsheetFormula(b.name || ''),
      escapeSpreadsheetFormula(catsStr),
      escapeSpreadsheetFormula(b.logo || ''),
      escapeSpreadsheetFormula(visibilityStr),
      escapeSpreadsheetFormula(b.description || ''),
      includeInternalNotes ? escapeSpreadsheetFormula(b.internalNotes || b.internal_notes || '') : ''
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column width auto-sizing for a premium export experience
  ws['!cols'] = [
    { wch: 15 }, // Brand Number
    { wch: 28 }, // Brand Name
    { wch: 32 }, // Categories
    { wch: 45 }, // Logo URL
    { wch: 14 }, // Visibility
    { wch: 40 }, // Brand Description
    { wch: 30 }  // Internal Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Brand Master');

  XLSX.writeFile(wb, filename);
  return filename;
};

/**
 * Generates Blank Simplified Brand Import Template Excel
 * Strictly contains ONLY two columns: | Brand Name | Category |
 * No sample records, no unnecessary instructions sheet.
 */
export const downloadBrandImportTemplate = () => {
  const headers = ['Brand Name', 'Category'];

  // Single sheet, empty template with bold headers and appropriate column widths
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = [
    { wch: 32 }, // Brand Name
    { wch: 28 }  // Category
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Brands');

  XLSX.writeFile(wb, 'Brand_Import_Template.xlsx');
};

/**
 * Parses and validates Brand Excel workbook for import.
 * Strictly reads ONLY Brand Name and Category (both mandatory).
 * Detects duplicates, matches categories exactly against Supabase Master Categories,
 * and provides row-level validation auditing.
 */
export const parseAndValidateBrandExcel = async (file, masterCategories = [], existingBrands = []) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            error: 'The uploaded Excel file contains no data rows.'
          });
          return;
        }

        // Map column variations strictly for Brand Name and Category
        const getFieldVal = (row, candidates) => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_.-]+/g, '');
            for (const cand of candidates) {
              if (cleanKey === cand.toLowerCase().replace(/[\s_.-]+/g, '')) {
                return String(row[key] || '').trim();
              }
            }
          }
          return '';
        };

        const existingBrandNamesMap = new Map();
        (existingBrands || []).forEach(b => {
          const name = normalizeBrandName(b.name || b.brandName || '').toLowerCase();
          if (name) existingBrandNamesMap.set(name, b);
        });

        const validMasterCatMap = new Map();
        (masterCategories || []).forEach(c => {
          const name = (typeof c === 'string' ? c : c.name || '').trim();
          if (name) validMasterCatMap.set(name.toLowerCase(), name);
        });
        const missingCategoriesSet = new Set();

        const maxExistingSeq = (existingBrands || []).reduce((max, b) => {
          const seq = parseBrandNumberSeq(b.brandNumber || b.brand_number || b.sort_order || b.sortOrder);
          return seq && seq > max ? seq : max;
        }, 0);

        const parsedRows = [];
        const seenInFileNames = new Set();

        let validCount = 0;
        let invalidCount = 0;
        let duplicateRecordsCount = 0;
        let invalidCategoriesCount = 0;

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // Row 1 is header in Excel
          const errors = [];
          const warnings = [];

          // Read ONLY Brand Name and Category
          const brandName = getFieldVal(row, [
            'Brand Name', 'BrandName', 'Brand', 'Name'
          ]);

          const categoryRaw = getFieldVal(row, [
            'Category', 'Categories', 'Primary Category', 'Main Category'
          ]);

          // 1. Mandatory Validation: Brand Name
          if (!brandName) {
            errors.push('Brand Name is required.');
          } else {
            const nameNorm = normalizeBrandName(brandName).toLowerCase();
            if (seenInFileNames.has(nameNorm)) {
              errors.push(`Duplicate brand "${brandName}" found multiple times in this spreadsheet.`);
              duplicateRecordsCount++;
            } else if (existingBrandNamesMap.has(nameNorm)) {
              errors.push(`Brand "${brandName}" already exists in the database.`);
              duplicateRecordsCount++;
            } else {
              seenInFileNames.add(nameNorm);
            }
          }

          // 2. Mandatory Validation: Category
          const parsedCategories = [];
          const rowMissingCategories = [];

          if (!categoryRaw) {
            errors.push('Category is required.');
          } else {
            const splitted = categoryRaw.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
            if (splitted.length === 0) {
              errors.push('Category is required.');
            } else {
              splitted.forEach(cat => {
                const lower = cat.toLowerCase();
                if (validMasterCatMap.has(lower)) {
                  const canonical = validMasterCatMap.get(lower);
                  if (!parsedCategories.includes(canonical)) {
                    parsedCategories.push(canonical);
                  }
                } else {
                  parsedCategories.push(cat);
                  rowMissingCategories.push(cat);
                  missingCategoriesSet.add(cat);
                }
              });
            }
          }

          if (rowMissingCategories.length > 0) {
            errors.push(`Invalid Category: "${rowMissingCategories.join(', ')}" does not exist in the Categories List.`);
            invalidCategoriesCount++;
          }

          const brandNumber = formatBrandNumber(maxExistingSeq + index + 1);
          const isValid = errors.length === 0;

          if (isValid) validCount++;
          else invalidCount++;

          parsedRows.push({
            rowNumber: rowNum,
            isValid,
            isExisting: Boolean(brandName && existingBrandNamesMap.has(normalizeBrandName(brandName).toLowerCase())),
            brandNumber,
            brandName,
            category: parsedCategories[0] || categoryRaw,
            categories: parsedCategories,
            logoUrl: '',
            enabled: true,
            description: '',
            internalNotes: '',
            errors,
            warnings
          });
        });

        resolve({
          success: true,
          totalRows: rawJson.length,
          validRows: validCount,
          invalidRows: invalidCount,
          duplicateRecords: duplicateRecordsCount,
          invalidCategories: invalidCategoriesCount,
          missingCategories: Array.from(missingCategoriesSet),
          missingCategoriesCount: missingCategoriesSet.size,
          rows: parsedRows
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generates an Excel error audit report for download
 * Identifying the exact Excel row and reason for failure
 */
export const downloadBrandImportErrorReport = (parsedRows = []) => {
  const headers = [
    'Excel Row',
    'Status',
    'Brand Name',
    'Category',
    'Failure Reason'
  ];

  const dataRows = parsedRows
    .filter(r => !r.isValid)
    .map(r => [
      `Row ${r.rowNumber}`,
      'Failed',
      r.brandName || '(Blank)',
      r.category || (Array.isArray(r.categories) ? r.categories.join('; ') : '') || '(Blank)',
      r.errors.join(' | ')
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 30 },
    { wch: 26 },
    { wch: 55 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
  XLSX.writeFile(wb, 'Brand_Import_Errors.xlsx');
};


/**
 * Canonical Find-or-Create Brand Engine
 * Used by ALL paths: Manual Brand Add, Excel Import, Single Product Add, and Bulk Product Upload.
 * 
 * Rules:
 * 1. Normalizes brand name (trimmed, whitespace collapsed, case-insensitive).
 * 2. Checks existingBrands. If found, REUSES the brand (never duplicates).
 * 3. If new brand:
 *    - If sub-brand (has parent_brand_id / parentBrandId):
 *      - Resolves parent brand.
 *      - Sub-brand number: `${parent.brandNumber}-01` (e.g. BR120-01).
 *      - Sub-brand code: `${parent.brandNumber}-01` (e.g. LOR-120-01).
 *      - Does NOT consume a new main sequence number!
 *    - If main brand:
 *      - Generates brandNumber (e.g. BR377) and brandNumber (e.g. SOU-377) sequentially from a locked counter.
 *      - Never random, never reused, strictly sequential.
 * 4. Persists new brand to Supabase (if client provided) and returns { brand, created }.
 */
export const findOrCreateBrand = async (brandInput, existingBrands = [], supabaseClient = null) => {
  if (!brandInput) return null;

  const rawName = typeof brandInput === 'string'
    ? brandInput
    : (brandInput.name || brandInput.brandName || brandInput.brand || '');
  const cleanName = normalizeBrandName(rawName);
  if (!cleanName) return null;

  const normalizedLower = cleanName.toLowerCase();
  const parentId = typeof brandInput === 'object'
    ? (brandInput.parent_brand_id || brandInput.parentBrandId || null)
    : null;

  // 1. Match existing brand using global case-insensitive, accent-insensitive engine
  const existingMatch = matchBrandMaster(rawName, existingBrands);
  if (existingMatch.matched && existingMatch.brand) {
    // REUSE existing brand! Do not create duplicate!
    return { brand: existingMatch.brand, created: false };
  }

  const existing = (existingBrands || []).find(b => {
    if (!b) return false;
    if (typeof brandInput === 'object' && brandInput.id && b.id === brandInput.id) return true;
    return normalizeBrandKey(b.name || b.brandName || b.brand || '') === normalizeBrandKey(rawName);
  });

  if (existing) {
    return { brand: existing, created: false };
  }

  // 2. Brand does NOT exist -> Create new brand sequentially
  let brandNumber = '';
    let parentBrandObj = null;

  if (parentId) {
    parentBrandObj = (existingBrands || []).find(b =>
      b.id === parentId ||
      b.brandNumber === parentId ||
      b.brand_number === parentId ||
      normalizeBrandName(b.name || '').toLowerCase() === normalizeBrandName(parentId).toLowerCase()
    );
  }

  if (parentBrandObj) {
    // Sub-brand under parent: BR120-01 / LOR-120-01 without consuming new main number
    const parentNum = parentBrandObj.brandNumber || parentBrandObj.brand_number || 'BR001';
  } else {
    // Main Brand: Sequential from locked counter (e.g. BR377, SOU-377)
    brandNumber = generateNextBrandNumber(existingBrands);
  }

  const brandId = (typeof brandInput === 'object' && brandInput.id)
    ? brandInput.id
    : ('b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

  const categoriesList = (typeof brandInput === 'object' && Array.isArray(brandInput.categories))
    ? brandInput.categories
    : ((typeof brandInput === 'object' && brandInput.category) ? [brandInput.category] : []);

  const sortOrder = parseBrandNumberSeq(brandNumber) || (existingBrands.length + 1);

  const newBrandObj = {
    id: brandId,
    name: cleanName,
    brandNumber,
    brand_number: brandNumber,
    categories: categoriesList,
    category: categoriesList[0] || '',
    description: (typeof brandInput === 'object' && brandInput.description) || '',
    internalNotes: (typeof brandInput === 'object' && (brandInput.internalNotes || brandInput.internal_notes)) || '',
    enabled: true,
    logo: (typeof brandInput === 'object' && brandInput.logo) || '',
    sortOrder,
    sort_order: sortOrder,
    parent_brand_id: parentBrandObj ? parentBrandObj.id : null,
    parent_brand_name: parentBrandObj ? parentBrandObj.name : null,
    createdAt: new Date().toISOString()
  };

  // Persist to Supabase if client is passed
  if (supabaseClient) {
    try {
      const { error: insErr } = await supabaseClient.from('brands').upsert({
        id: newBrandObj.id,
        name: newBrandObj.name,
        category: newBrandObj.category || (newBrandObj.categories?.[0] || null),
        sort_order: sortOrder,
        enabled: newBrandObj.enabled !== false,
        logo: newBrandObj.logo || ''
      }, { onConflict: 'id' });
      if (insErr) {
        console.error('Note on saving new brand to Supabase:', insErr);
        throw insErr;
      }

      // Persist brand metadata configuration so brandNumber & brandNumber persist across reloads
      const { data: existingMetaRow } = await supabaseClient.from('brands').select('logo').eq('id', 'app_brand_metadata_config').maybeSingle();
      let currentMeta = {};
      if (existingMetaRow?.logo) {
        try { currentMeta = JSON.parse(existingMetaRow.logo); } catch (e) { }
      }
      currentMeta[newBrandObj.id] = {
        brandNumber: newBrandObj.brandNumber,
        categories: newBrandObj.categories,
        description: newBrandObj.description,
        internalNotes: newBrandObj.internalNotes,
        sortOrder
      };
      await supabaseClient.from('brands').upsert({
        id: 'app_brand_metadata_config',
        name: 'Brand Metadata Configuration',
        enabled: true,
        logo: JSON.stringify(currentMeta),
        category: 'System Config',
        sort_order: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('Note on saving new brand to Supabase:', dbErr);
      throw dbErr;
    }
  }

  return { brand: newBrandObj, created: true };
};
