/**
 * SALBEAU MAKEUPSTORE — ENTERPRISE BRAND MANAGEMENT UTILITIES
 * 
 * Provides:
 * - Permanent Sequential Brand Number Generator (BR001, BR002...) with deletion tracking
 * - Professional Brand Code Generator (Mnemonic-Hyphen-Sequence, e.g. AGA-001)
 * - Approved Brand Master Reconciliation (365 Verified Brands)
 * - Conflict Detection & Deterministic Collision Resolution
 * - Excel Export with CSV Formula Injection Safeguards
 * - Excel Import Parsing, Schema Validation & Row-Level Error Auditing
 */

import * as XLSX from 'xlsx';
import { APPROVED_BRAND_MASTER } from './brandMasterApprovedData.js';

const BRAND_SEQ_STORAGE_KEY = 'salbeau_brand_max_sequence_v1';

/**
 * Normalizes a brand name for comparison (trims extra spaces, lowercases)
 */
export const normalizeBrandName = (name) => {
  if (!name) return '';
  return name.toString().trim().replace(/\s+/g, ' ');
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

  const clean = normalizeBrandName(brand.name).toLowerCase();
  if (clean) {
    const masterMatch = APPROVED_BRAND_MASTER.find(m => (m.name || '').trim().toLowerCase() === clean);
    if (masterMatch && masterMatch.brandNumber) {
      return masterMatch.brandNumber;
    }
  }

  if (brand.id) {
    const idMatch = brand.id.toString().match(/b_(\d+)$/i);
    if (idMatch) {
      const seq = parseInt(idMatch[1], 10);
      if (seq > 0) return formatBrandNumber(seq);
    }
  }

  const orderNum = parseInt(brand.sort_order || brand.sortOrder, 10);
  if (!isNaN(orderNum) && orderNum > 0) {
    return formatBrandNumber(orderNum);
  }

  return generateNextBrandNumber(existingBrands);
};

/**
 * Resolves a Brand Code deterministically:
 * 1. Checks existing brandCode / brand_code
 * 2. Generates proposed code from mnemonic and brand number
 */
export const resolveBrandCode = (brand, existingBrands = [], assignedBrandNumber = '') => {
  if (!brand) return 'BRD-001';
  if (brand.brandCode && brand.brandCode !== '---') {
    return brand.brandCode.toUpperCase();
  }
  if (brand.brand_code && brand.brand_code !== '---') {
    return brand.brand_code.toUpperCase();
  }
  return generateProposedBrandCode(brand.name, existingBrands, assignedBrandNumber);
};


/**
 * Concurrency-Safe Sequential Brand Number Generator
 * - Considers all existing brands in database / local state
 * - Considers all 365 approved brand master records
 * - Tracks highest number ever assigned in localStorage so deleted numbers are NEVER reused
 * - Returns format 'BR001', 'BR002', 'BR366'
 */
export const generateNextBrandNumber = (existingBrands = []) => {
  let highestSeq = 0;

  // 1. Scan approved master
  APPROVED_BRAND_MASTER.forEach(b => {
    const seq = parseBrandNumberSeq(b.brandNumber);
    if (seq > highestSeq) highestSeq = seq;
  });

  // 2. Scan active / existing brands in state
  (existingBrands || []).forEach(b => {
    const seq = parseBrandNumberSeq(b.brandNumber || b.brand_number);
    if (seq > highestSeq) highestSeq = seq;
  });

  // 3. Check persistent high-water mark so deleted brand numbers are never recycled
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedMax = parseInt(localStorage.getItem(BRAND_SEQ_STORAGE_KEY) || '0', 10);
      if (!isNaN(savedMax) && savedMax > highestSeq) {
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
 * 1. Checks 365 approved brand master dictionary first for verified codes.
 * 2. If new brand: 3-character mnemonic + '-' + 3-digit sequence (derived from Brand Number).
 * 3. Checks uniqueness against existing brands.
 * 4. In case of collision, resolves with deterministic alternative mnemonic.
 */
export const generateProposedBrandCode = (brandName, existingBrands = [], assignedBrandNumber = '') => {
  if (!brandName || !brandName.trim()) return '';

  const normalized = normalizeBrandName(brandName).toLowerCase();

  // 1. Check approved 365 brand master dictionary
  const masterMatch = APPROVED_BRAND_MASTER.find(b => (b.brand_name || b.name || '').toLowerCase() === normalized);
  if (masterMatch && (masterMatch.brandCode || masterMatch.brand_code)) {
    const masterCode = masterMatch.brandCode || masterMatch.brand_code;
    // If not colliding with a different brand, use verified master code
    const collision = (existingBrands || []).find(b =>
      (b.brandCode || b.brand_code) === masterCode &&
      normalizeBrandName(b.brand_name || b.brandName || b.name).toLowerCase() !== normalized
    );
    if (!collision) {
      return masterCode;
    }
  }

  // 2. Extract numeric sequence from assignedBrandNumber or calculate next
  let seqNumber = parseBrandNumberSeq(assignedBrandNumber);
  if (!seqNumber || seqNumber <= 0) {
    seqNumber = parseBrandNumberSeq(generateNextBrandNumber(existingBrands));
  }

  const seqStr = seqNumber <= 999
    ? String(seqNumber).padStart(3, '0')
    : String(seqNumber);

  // 3. Derive mnemonic
  let mnemonic = deriveBrandMnemonic(brandName);
  let proposedCode = `${mnemonic}-${seqStr}`;

  // 4. Collision check across existing brands
  const isCodeTaken = (code) => {
    return (existingBrands || []).some(b => {
      const bCode = (b.brandCode || b.brand_code || '').trim().toUpperCase();
      const bNorm = normalizeBrandName(b.brand_name || b.brandName || b.name).toLowerCase();
      return bCode === code && bNorm !== normalized;
    });
  };

  if (!isCodeTaken(proposedCode)) {
    return proposedCode;
  }

  // Deterministic collision resolution: Alter 3rd character
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < alphabet.length; i++) {
    const altMnemonic = mnemonic.slice(0, 2) + alphabet[i];
    const altCode = `${altMnemonic}-${seqStr}`;
    if (!isCodeTaken(altCode)) {
      return altCode;
    }
  }

  return `${mnemonic}X-${seqStr}`;
};

/**
 * Validates Brand Code format and uniqueness
 */
export const validateBrandCode = (code, arg2 = null, arg3 = []) => {
  let excludeBrandId = typeof arg2 === 'string' ? arg2 : (typeof arg3 === 'string' ? arg3 : null);
  let existingBrands = Array.isArray(arg2) ? arg2 : (Array.isArray(arg3) ? arg3 : []);

  if (!code || !code.trim()) {
    return { valid: false, error: 'Brand Code is required.' };
  }
  const cleanCode = code.trim().toUpperCase();
  const formatRegex = /^[A-Z0-9]{3}-\d{3,4}$/;
  if (!formatRegex.test(cleanCode)) {
    return {
      valid: false,
      error: 'Brand Code must follow standard format: 3-character mnemonic, hyphen, 3+ digits (e.g. AGA-001).'
    };
  }

  const collision = (existingBrands || []).find(b => {
    if (excludeBrandId && (b.id === excludeBrandId)) return false;
    const bCode = (b.brandCode || b.brand_code || '').trim().toUpperCase();
    return bCode === cleanCode;
  });

  if (collision) {
    const colName = collision.brand_name || collision.brandName || collision.name || 'another brand';
    return {
      valid: false,
      error: `Brand Code "${cleanCode}" is already assigned to brand "${colName}". Brand Codes must be unique.`
    };
  }

  return { valid: true };
};

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
  // 3. Brand Code
  // 4. Categories
  // 5. Logo URL
  // 6. Visibility
  // 7. Brand Description
  // 8. Internal Notes
  const headers = [
    'Brand Number',
    'Brand Name',
    'Brand Code',
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
      escapeSpreadsheetFormula(b.brandCode || b.brand_code || ''),
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
    { wch: 16 }, // Brand Code
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
 * Generates Blank Brand Import Template Excel
 */
export const downloadBrandImportTemplate = () => {
  const headers = [
    'Brand Number',
    'Brand Name',
    'Brand Code',
    'Categories',
    'Logo URL',
    'Visibility',
    'Brand Description',
    'Internal Notes'
  ];

  const sampleRows = [
    [
      'BR001',
      'AGARO',
      'AGA-001',
      'Beauty Tools & Devices',
      'https://example.com/agaro.png',
      'Active',
      'Leading personal care appliances and beauty tools',
      'Approved manufacturer partner'
    ],
    [
      '', // Blank Brand Number for new record (backend will generate)
      'LAKME',
      '', // Blank Brand Code for new record (backend will generate)
      'Makeup; Lips & Eyes',
      '',
      'Active',
      'Indian cosmetics brand',
      'New brand addition'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 28 },
    { wch: 16 },
    { wch: 30 },
    { wch: 35 },
    { wch: 14 },
    { wch: 40 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  // Add Instructions Sheet
  const instructions = [
    ['SALBEAU BRAND MASTER IMPORT INSTRUCTIONS'],
    [''],
    ['Column', 'Rules & Requirements'],
    ['Brand Number', 'Existing identifier for updates (e.g. BR001). Leave BLANK for new brand records to auto-generate.'],
    ['Brand Name', 'REQUIRED. Official unique brand name.'],
    ['Brand Code', 'Preserve approved code (e.g. AGA-001). Leave BLANK for new brands to auto-generate.'],
    ['Categories', 'Optional. Semicolon or comma-separated list of existing categories (e.g. "Makeup; Skin Care").'],
    ['Logo URL', 'Optional. Direct web image link (PNG, JPG, WebP).'],
    ['Visibility', '"Active" or "Inactive". Defaults to "Active" if blank.'],
    ['Brand Description', 'Optional short description of the brand.'],
    ['Internal Notes', 'Optional administrative notes.']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guide');

  XLSX.writeFile(wb, 'salbeau_brand_import_template.xlsx');
};

/**
 * Parses and validates Brand Excel workbook for import
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

        // Map column variations flexibly
        const getFieldVal = (row, candidates) => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
            for (const cand of candidates) {
              if (cleanKey === cand.toLowerCase().replace(/[\s_-]+/g, '')) {
                return String(row[key] || '').trim();
              }
            }
          }
          return '';
        };

        const existingBrandNumbersMap = new Map();
        const existingBrandCodesMap = new Map();
        const existingBrandNamesMap = new Map();

        existingBrands.forEach(b => {
          const num = (b.brandNumber || b.brand_number || '').trim().toUpperCase();
          const code = (b.brandCode || b.brand_code || '').trim().toUpperCase();
          const name = normalizeBrandName(b.name).toLowerCase();
          if (num) existingBrandNumbersMap.set(num, b);
          if (code) existingBrandCodesMap.set(code, b);
          if (name) existingBrandNamesMap.set(name, b);
        });

        const validMasterCatNames = new Set(
          (masterCategories || []).map(c => (typeof c === 'string' ? c : c.name || '').trim().toLowerCase()).filter(Boolean)
        );

        const parsedRows = [];
        const seenInFileNumbers = new Set();
        const seenInFileCodes = new Set();
        const seenInFileNames = new Set();

        let validCount = 0;
        let invalidCount = 0;
        let newBrandsCount = 0;
        let existingBrandsCount = 0;
        let duplicateRecordsCount = 0;
        let duplicateCodesCount = 0;
        let invalidCategoriesCount = 0;

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // 1-based, row 1 is header
          const errors = [];
          const warnings = [];

          const brandNumber = getFieldVal(row, ['Brand Number', 'BrandNumber', 'Brand ID', 'BrandId']).toUpperCase();
          const brandName = getFieldVal(row, ['Brand Name', 'BrandName', 'Standardized Brand Name', 'Name', 'Brand']);
          const brandCode = getFieldVal(row, ['Brand Code', 'BrandCode', 'Code']).toUpperCase();
          const categoriesRaw = getFieldVal(row, ['Categories', 'Category', 'Primary Category', 'Other Categories']);
          const logoUrl = getFieldVal(row, ['Logo URL', 'Logo', 'LogoURL', 'Image URL']);
          const visibilityRaw = getFieldVal(row, ['Visibility', 'Status', 'Brand Status', 'Active']);
          const description = getFieldVal(row, ['Brand Description', 'Description']);
          const internalNotes = getFieldVal(row, ['Internal Notes', 'Notes', 'InternalNotes']);

          // 1. Validate Brand Name
          if (!brandName) {
            errors.push('Brand Name is required.');
          } else {
            const nameNorm = normalizeBrandName(brandName).toLowerCase();
            if (seenInFileNames.has(nameNorm)) {
              errors.push(`Duplicate brand name "${brandName}" found multiple times in this spreadsheet.`);
              duplicateRecordsCount++;
            } else {
              seenInFileNames.add(nameNorm);
            }
          }

          // 2. Validate Brand Number (if provided)
          let isExisting = false;
          let matchedExistingBrand = null;

          if (brandNumber) {
            if (!/^BR\d{3,}$/i.test(brandNumber)) {
              errors.push(`Invalid Brand Number format "${brandNumber}". Must be BR001, BR002, etc.`);
            } else if (seenInFileNumbers.has(brandNumber)) {
              errors.push(`Duplicate Brand Number "${brandNumber}" found multiple times in this spreadsheet.`);
              duplicateRecordsCount++;
            } else {
              seenInFileNumbers.add(brandNumber);
            }

            if (existingBrandNumbersMap.has(brandNumber)) {
              isExisting = true;
              matchedExistingBrand = existingBrandNumbersMap.get(brandNumber);
            }
          }

          // Match by name if brandNumber was not given
          if (!isExisting && brandName) {
            const nameNorm = normalizeBrandName(brandName).toLowerCase();
            if (existingBrandNamesMap.has(nameNorm)) {
              isExisting = true;
              matchedExistingBrand = existingBrandNamesMap.get(nameNorm);
            }
          }

          if (isExisting) {
            existingBrandsCount++;
          } else {
            newBrandsCount++;
          }

          // 3. Validate Brand Code (if provided)
          if (brandCode) {
            const formatCheck = /^[A-Z0-9]{3}-\d{3,4}$/;
            if (!formatCheck.test(brandCode)) {
              errors.push(`Invalid Brand Code format "${brandCode}". Must be like AGA-001.`);
            } else if (seenInFileCodes.has(brandCode)) {
              errors.push(`Duplicate Brand Code "${brandCode}" within this spreadsheet.`);
              duplicateCodesCount++;
            } else {
              seenInFileCodes.add(brandCode);
            }

            // Check if code conflicts with a DIFFERENT existing brand
            if (existingBrandCodesMap.has(brandCode)) {
              const existingWithCode = existingBrandCodesMap.get(brandCode);
              if (!matchedExistingBrand || existingWithCode.id !== matchedExistingBrand.id) {
                errors.push(`Brand Code "${brandCode}" is already taken by existing brand "${existingWithCode.name}".`);
                duplicateCodesCount++;
              }
            }
          }

          // 4. Validate Categories
          const parsedCategories = [];
          if (categoriesRaw) {
            const splitted = categoriesRaw.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
            splitted.forEach(cat => {
              parsedCategories.push(cat);
              if (validMasterCatNames.size > 0 && !validMasterCatNames.has(cat.toLowerCase())) {
                warnings.push(`Category "${cat}" is not currently in the Master Category list.`);
                invalidCategoriesCount++;
              }
            });
          }

          // 5. Visibility normalization
          const isEnabled = visibilityRaw ? !/^(inactive|false|0|disabled|no)$/i.test(visibilityRaw) : true;

          const isValid = errors.length === 0;
          if (isValid) validCount++;
          else invalidCount++;

          parsedRows.push({
            rowNumber: rowNum,
            isValid,
            isExisting,
            matchedBrandId: matchedExistingBrand ? matchedExistingBrand.id : null,
            brandNumber: brandNumber || (matchedExistingBrand?.brandNumber || ''),
            brandName,
            brandCode: brandCode || (matchedExistingBrand?.brandCode || ''),
            categories: parsedCategories,
            logoUrl,
            enabled: isEnabled,
            description,
            internalNotes,
            errors,
            warnings
          });
        });

        resolve({
          success: true,
          totalRows: rawJson.length,
          validRows: validCount,
          invalidRows: invalidCount,
          newBrands: newBrandsCount,
          existingBrands: existingBrandsCount,
          duplicateRecords: duplicateRecordsCount,
          duplicateCodes: duplicateCodesCount,
          invalidCategories: invalidCategoriesCount,
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
 */
export const downloadBrandImportErrorReport = (parsedRows = []) => {
  const headers = [
    'Row #',
    'Status',
    'Brand Number',
    'Brand Name',
    'Brand Code',
    'Errors',
    'Warnings'
  ];

  const dataRows = parsedRows
    .filter(r => !r.isValid || r.warnings.length > 0)
    .map(r => [
      r.rowNumber,
      r.isValid ? 'Valid with Warnings' : 'Failed / Invalid',
      r.brandNumber,
      r.brandName,
      r.brandCode,
      r.errors.join(' | '),
      r.warnings.join(' | ')
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 16 },
    { wch: 50 },
    { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
  XLSX.writeFile(wb, `brand_import_error_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
