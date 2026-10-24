/**
 * Excel Processor & Master Product Ingestion Service
 * 
 * Comprehensive workbook analysis, dynamic column auto-mapping, multi-sheet
 * relational linking, schema validation, duplicate detection, and sanitized error export.
 */

import * as XLSX from 'xlsx';
import { validateBarcodeChecksum, detectBarcodeFormat } from './barcodeLookupService';
import { matchBeautyShade } from './aiColorService';

// Comprehensive Column Mapping Dictionary
export const COLUMN_SYNONYMS = {
  name: ['product name', 'product', 'title', 'item name', 'item description', 'product title', 'item', 'name'],
  brand: ['brand', 'brand name', 'brand_name', 'manufacturer', 'make'],
  category: ['category', 'main category', 'main_category', 'department', 'dept'],
  subcategory: ['subcategory', 'sub category', 'sub_category', 'sub-category', 'category 2'],
  productType: ['product type', 'product_type', 'type', 'select category', 'leaf category', 'item type'],
  productGroup: ['product group', 'product_group', 'group', 'family', 'product family', 'series'],
  sku: ['sku', 'item code', 'article no', 'article number', 'product code', 'style #', 'style code'],
  barcode: ['barcode', 'bar code', 'ean', 'upc', 'ean-13', 'upc-a', 'gtin'],
  barcodeType: ['barcode type', 'barcode_type', 'format', 'symbology'],
  shade: ['shade', 'shade name', 'shade_name', 'variant', 'variant name', 'color variant', 'tone'],
  colorName: ['color', 'color name', 'colour', 'color_name', 'shade description'],
  hexColor: ['hex', 'hex color', 'hex code', 'color hex', '#hex', 'hex_color'],
  colorFamily: ['color family', 'colour family', 'shade family', 'color_family'],
  mrp: ['mrp', 'm.r.p.', 'maximum retail price', 'retail price', 'list price', 'mrp (inr)'],
  generalPrice: ['general price', 'general_price', 'selling price', 'sale price', 'customer price', 'b2c price', 'price'],
  salonPrice: ['salon price', 'salon_price', 'salon wholesale', 'trade price', 'b2b salon', 'salon rate'],
  artistPrice: ['artist price', 'artist_price', 'makeup artist price', 'pro price', 'artist rate'],
  beauticianPrice: ['beautician price', 'beautician_price', 'beautician rate', 'spa price'],
  image: ['image', 'primary image', 'image url', 'main image', 'picture', 'photo', 'image_url'],
  images: ['gallery images', 'additional images', 'images', 'secondary images'],
  description: ['description', 'product description', 'about', 'details'],
  status: ['status', 'publishing status', 'publish status', 'state'],
  ingredients: ['ingredients', 'ingredients list', 'key ingredients', 'composition'],
  benefits: ['benefits', 'key benefits', 'features'],
  howToUse: ['how to use', 'directions', 'usage instructions', 'application'],
  netQuantity: ['net quantity', 'net qty', 'volume', 'weight', 'size', 'net weight'],
  unit: ['unit', 'uom', 'measurement unit']
};

/**
 * Normalizes header string for fuzzy matching
 */
const cleanHeader = (header) => {
  if (!header || typeof header !== 'string') return '';
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ');
};

/**
 * Suggests standard field name for raw Excel column header
 */
export const matchColumnHeader = (rawHeader) => {
  const clean = cleanHeader(rawHeader);
  if (!clean) return null;

  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    if (synonyms.some(syn => clean === cleanHeader(syn) || clean.includes(cleanHeader(syn)))) {
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
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

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
          for (let i = 0; i < Math.min(5, rawRows.length); i++) {
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
              rowObj[h] = rowArr[colIdx] !== undefined ? rowArr[colIdx] : '';
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

/**
 * Transforms raw sheet data using approved column mapping into normalized product entities
 */
export const transformSheetToEntities = (sheet, mapping, existingProducts = []) => {
  const rawRows = sheet.dataRows || [];
  const normalizedRows = [];

  const existingBarcodeMap = new Map();
  const existingSkuMap = new Map();

  existingProducts.forEach(p => {
    if (p.barcode) existingBarcodeMap.set(String(p.barcode).trim(), p);
    if (p.sku) existingSkuMap.set(String(p.sku).trim(), p);
    (p.shades || []).forEach(s => {
      if (s.barcode) existingBarcodeMap.set(String(s.barcode).trim(), p);
      if (s.sku) existingSkuMap.set(String(s.sku).trim(), p);
    });
  });

  const workbookBarcodeCounts = {};
  const workbookSkuCounts = {};

  // First pass: detect duplicate barcodes/SKUs within the uploaded sheet itself
  rawRows.forEach(r => {
    const rawBarcode = String(r[Object.keys(mapping).find(k => mapping[k] === 'barcode')] || '').trim();
    const rawSku = String(r[Object.keys(mapping).find(k => mapping[k] === 'sku')] || '').trim();
    if (rawBarcode) workbookBarcodeCounts[rawBarcode] = (workbookBarcodeCounts[rawBarcode] || 0) + 1;
    if (rawSku) workbookSkuCounts[rawSku] = (workbookSkuCounts[rawSku] || 0) + 1;
  });

  rawRows.forEach((r, idx) => {
    const getVal = (field) => {
      const col = Object.keys(mapping).find(k => mapping[k] === field);
      return col && r[col] !== undefined ? String(r[col]).trim() : '';
    };

    const getNum = (field, fallback = 0) => {
      const v = getVal(field);
      const clean = v.replace(/[^0-9.]/g, '');
      const num = parseFloat(clean);
      return !isNaN(num) ? num : fallback;
    };

    const productName = getVal('name');
    const brand = getVal('brand');
    const category = getVal('category');
    const subcategory = getVal('subcategory');
    const productType = getVal('productType');
    const productGroup = getVal('productGroup') || productName;
    const shade = getVal('shade');
    let colorName = getVal('colorName');
    let hexColor = getVal('hexColor');
    let colorFamily = getVal('colorFamily');

    // Auto AI-color inference if hex is provided but name is missing
    if (hexColor && !colorName) {
      const shadeMatch = matchBeautyShade(hexColor);
      colorName = shadeMatch.name;
      colorFamily = shadeMatch.family;
    }

    const mrp = getNum('mrp', 0);
    const generalPrice = getNum('generalPrice', mrp);
    const salonPrice = getNum('salonPrice', generalPrice);
    const artistPrice = getNum('artistPrice', salonPrice);
    const beauticianPrice = getNum('beauticianPrice', salonPrice);
    const barcode = getVal('barcode');
    const barcodeType = getVal('barcodeType') || detectBarcodeFormat(barcode);
    const sku = getVal('sku') || (brand && shade ? `${brand.slice(0, 3).toUpperCase()}-${shade.replace(/\s+/g, '-').toUpperCase()}` : `SKU-${Date.now()}-${idx + 1}`);
    const image = getVal('image');
    const description = getVal('description');

    // Validation checks
    const errors = [];
    const warnings = [];

    if (!productName) errors.push('Product Name is required');
    if (!brand) errors.push('Brand is required');
    if (!category) errors.push('Category is required');
    if (mrp <= 0) errors.push('MRP must be greater than 0');
    if (generalPrice > mrp) errors.push(`General Price (₹${generalPrice}) exceeds MRP (₹${mrp})`);
    if (salonPrice > mrp) errors.push(`Salon Price (₹${salonPrice}) exceeds MRP (₹${mrp})`);

    if (barcode) {
      if (!validateBarcodeChecksum(barcode)) {
        warnings.push(`Barcode checksum may be invalid for ${barcodeType}`);
      }
    } else {
      warnings.push('No barcode provided (system will allow manual scan later)');
    }

    // Duplicate classification
    let duplicateStatus = 'NEW';
    let duplicateMatch = null;

    if (barcode && existingBarcodeMap.has(barcode)) {
      duplicateStatus = 'EXACT_DUPLICATE';
      duplicateMatch = existingBarcodeMap.get(barcode);
      errors.push(`Barcode "${barcode}" already exists on database product "${duplicateMatch.name}"`);
    } else if (sku && existingSkuMap.has(sku)) {
      duplicateStatus = 'EXACT_DUPLICATE';
      duplicateMatch = existingSkuMap.get(sku);
      errors.push(`SKU "${sku}" already exists on database product "${duplicateMatch.name}"`);
    } else if (barcode && workbookBarcodeCounts[barcode] > 1) {
      duplicateStatus = 'EXACT_DUPLICATE';
      errors.push(`Duplicate barcode "${barcode}" found multiple times in this Excel file`);
    } else if (sku && workbookSkuCounts[sku] > 1) {
      duplicateStatus = 'EXACT_DUPLICATE';
      errors.push(`Duplicate SKU "${sku}" found multiple times in this Excel file`);
    }

    normalizedRows.push({
      _rowIndex: idx + 1,
      _valid: errors.length === 0,
      _errors: errors,
      _warnings: warnings,
      _duplicateStatus: duplicateStatus,
      productName,
      brand,
      category,
      subcategory,
      productType,
      productGroup,
      shade,
      colorName,
      hexColor,
      colorFamily,
      mrp,
      generalPrice,
      salonPrice,
      artistPrice,
      beauticianPrice,
      barcode,
      barcodeType,
      sku,
      image,
      description,
      status: getVal('status') || 'published'
    });
  });

  return normalizedRows;
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
export const downloadErrorExcel = (failedRows, originalFileName = 'import') => {
  const exportData = failedRows.map(r => ({
    'Row #': r._rowIndex,
    'Errors': sanitizeExcelCell((r._errors || []).join('; ')),
    'Warnings': sanitizeExcelCell((r._warnings || []).join('; ')),
    'Product Name': sanitizeExcelCell(r.productName),
    'Brand': sanitizeExcelCell(r.brand),
    'Category': sanitizeExcelCell(r.category),
    'Subcategory': sanitizeExcelCell(r.subcategory),
    'Product Type': sanitizeExcelCell(r.productType),
    'Product Group': sanitizeExcelCell(r.productGroup),
    'Shade': sanitizeExcelCell(r.shade),
    'Color Name': sanitizeExcelCell(r.colorName),
    'Hex Color': sanitizeExcelCell(r.hexColor),
    'SKU': sanitizeExcelCell(r.sku),
    'Barcode': sanitizeExcelCell(r.barcode),
    'MRP': r.mrp,
    'General Price': r.generalPrice,
    'Salon Price': r.salonPrice
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');

  const base = originalFileName.replace(/\.[^/.]+$/, '');
  const outName = `${base}_failed_rows_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, outName);
};
