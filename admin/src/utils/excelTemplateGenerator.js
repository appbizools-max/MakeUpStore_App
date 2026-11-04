/**
 * MASTER EXCEL IMPORT/EXPORT TEMPLATE & REPORT GENERATOR
 * 
 * Provides:
 * 1. generateAndDownloadTemplate: Comprehensive 3-sheet Excel workbook:
 *    - Sheet 1: 'Product_Import' (Canonical 27 columns, bold headers, filters, frozen row, sample rows)
 *    - Sheet 2: 'Instructions' (Step-by-step rules on Parent_SKU grouping, barcodes, 4-tier pricing, zero-stock policy)
 *    - Sheet 3: 'Dropdown_Values' (Dynamic reference tables for Categories, Subcategories, Brands, Finishes, Skin Types, Coverage, Status)
 * 2. exportStagedProductsToExcel: Exports staged preparation records using the EXACT 27 canonical columns for 100% round-trip fidelity.
 * 3. downloadFailedRowsExcel: Exports invalid/failed rows with reason & suggested fix.
 * 4. downloadImportReportExcel: Full summary report with metrics and error logs.
 */

import * as XLSX from 'xlsx';
import { REQUIRED_HEADERS } from '../services/excelHeaderValidator.js';

export const CANONICAL_TEMPLATE_COLUMNS = [...REQUIRED_HEADERS];

/**
 * Generates and triggers browser download of the Master Excel Product Import Template (18 Strict Columns)
 * Sheet 1: 'Bulk Product Upload' (Strict 18 headers, sample rows)
 * Sheet 2: 'Field Guide' (Notes and guidance only, ignored by import)
 */
export const generateAndDownloadTemplate = (categories = [], brands = [], options = {}) => {
  const headers = [...REQUIRED_HEADERS];

    const sampleRows = [
    // Sample 1: Parent-Child Variant Row 1 (Lakmé Liquid Lipstick - Shade 01 Red Carpet)
    [
      '8901030383811',                                                           // 1. BARCODE
      'Lakmé',                                                                   // 2. BRAND
      '',                                                                        // 3. IMAGE
      'LAK-LIP-MAT001',                                                          // 4. SKU_NUMBER
      'Lakmé Forever Matte Liquid Lip Colour',                                   // 5. PRODUCT_NAME
      'Makeup',                                                                  // 6. CATEGORY
      'Lips',                                                                    // 7. SUBCATEGORY
      '01 Red Carpet',                                                           // 8. SHADE_NAME
      '#C71585',                                                                 // 10. HEX & SWATCH
      '5.6 ml',                                                                  // 11. SIZE_OR_WEIGHT
      399,                                                                       // 12. MRP
      349,                                                                       // 13. GENERAL_USER_PRICE
      280,                                                                       // 14. SALON_PRICE
      260,                                                                       // 15. MAKEUP_ARTIST_PRICE
      245,                                                                       // 16. BEAUTICIAN_PRICE
      'TRUE',                                                                    // 17. PRODUCT_ACTIVE
      'ACTIVE'                                                                   // 18. STATUS
    ],
    // Sample 2: Parent-Child Variant Row 2 (Lakmé Liquid Lipstick - Shade 02 Nude Myth)
    [
      '8901030383828',                                                           // 1. BARCODE
      'Lakmé',                                                                   // 2. BRAND
      '',                                                                        // 3. IMAGE
      'LAK-LIP-MAT001',                                                          // 4. SKU_NUMBER
      'Lakmé Forever Matte Liquid Lip Colour',                                   // 5. PRODUCT_NAME
      'Makeup',                                                                  // 6. CATEGORY
      'Lips',                                                                    // 7. SUBCATEGORY
      '02 Nude Myth',                                                            // 8. SHADE_NAME
      '#D2691E',                                                                 // 10. HEX & SWATCH
      '5.6 ml',                                                                  // 11. SIZE_OR_WEIGHT
      399,                                                                       // 12. MRP
      349,                                                                       // 13. GENERAL_USER_PRICE
      280,                                                                       // 14. SALON_PRICE
      260,                                                                       // 15. MAKEUP_ARTIST_PRICE
      245,                                                                       // 16. BEAUTICIAN_PRICE
      'TRUE',                                                                    // 17. PRODUCT_ACTIVE
      'ACTIVE'                                                                   // 18. STATUS
    ],
    // Sample 3: Standalone Single Product (Face Serum without shades)
    [
      '8901030492812',                                                           // 1. BARCODE
      "L'Oréal Paris",                                                           // 2. BRAND
      '',                                                                        // 3. IMAGE
      'LOR-REVIT-30ML',                                                          // 4. SKU_NUMBER
      "L'Oréal Paris Revitalift 1.5% Hyaluronic Acid Serum",                     // 5. PRODUCT_NAME
      'Skincare',                                                                // 6. CATEGORY
      'Face Serums',                                                             // 7. SUBCATEGORY
      '',                                                                        // 8. SHADE_NAME
      '',                                                                        // 10. HEX & SWATCH
      '30 ml',                                                                   // 11. SIZE_OR_WEIGHT
      999,                                                                       // 12. MRP
      899,                                                                       // 13. GENERAL_USER_PRICE
      720,                                                                       // 14. SALON_PRICE
      680,                                                                       // 15. MAKEUP_ARTIST_PRICE
      640,                                                                       // 16. BEAUTICIAN_PRICE
      'TRUE',                                                                    // 17. PRODUCT_ACTIVE
      'ACTIVE'                                                                   // 18. STATUS
    ]
  ];

  // ---------------------------------------------------------------------------
  // SHEET 1: Bulk Product Upload (Strict 18 Headers)
  // ---------------------------------------------------------------------------
  const wsTemplateData = [headers, ...sampleRows];
  const wsTemplate = XLSX.utils.aoa_to_sheet(wsTemplateData);

  wsTemplate['!cols'] = [
    { wch: 18 }, // 1. BARCODE
    { wch: 20 }, // 2. BRAND
    { wch: 35 }, // 3. IMAGE
    { wch: 18 }, // 4. SKU_NUMBER
    { wch: 38 }, // 5. PRODUCT_NAME
    { wch: 16 }, // 6. CATEGORY
    { wch: 20 }, // 7. SUBCATEGORY
    { wch: 18 }, // 8. SHADE_NAME
    { wch: 16 }, // 9. HEX & SWATCH
    { wch: 16 }, // 10. SIZE_OR_WEIGHT
    { wch: 12 }, // 11. MRP
    { wch: 20 }, // 12. GENERAL_USER_PRICE
    { wch: 16 }, // 13. SALON_PRICE
    { wch: 22 }, // 14. MAKEUP_ARTIST_PRICE
    { wch: 18 }, // 15. BEAUTICIAN_PRICE
    { wch: 16 }, // 16. PRODUCT_ACTIVE
    { wch: 14 }  // 17. STATUS
  ];

  // Freeze top header row
  wsTemplate['!views'] = [{ state: 'frozen', ySplit: 1 }];
  wsTemplate['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  // Auto-filter across all 17 headers
  wsTemplate['!autofilter'] = { ref: `A1:Q${sampleRows.length + 1}` };

  // ---------------------------------------------------------------------------
  // SHEET 2: Field Guide (Notes & Formatting Rules - Ignored during import)
  // ---------------------------------------------------------------------------
    const instructionsData = [
    ['SALBEAU MAKEUPSTORE — BULK PRODUCT IMPORT FIELD GUIDE'],
    ['NOTE: This sheet is a reference guide only and is completely ignored by the import engine.'],
    ['All product data must be placed in the "Bulk Product Upload" sheet.'],
    [''],
    ['17 FIXED REQUIRED COLUMNS REFERENCE (IN EXACT SEQUENCE):'],
    ['Column Header', 'Required?', 'Sample Value', 'Description & Rules'],
    ['BARCODE', 'Optional', '8901030383811', 'EAN-13, UPC, or custom barcode for scanner checkout. Format as text.'],
    ['BRAND', 'REQUIRED', 'Lakmé', 'Brand name matching your catalog (Brand placed before Image).'],
    ['IMAGE', 'Optional', 'Direct storage/CDN image URL', 'Direct HTTP/HTTPS link to product image. Image is optional.'],
    ['SKU_NUMBER', 'Optional', 'LAK-LIP-MAT001', 'Unique SKU code for the product or variant family. Auto-generated if blank.'],
    ['PRODUCT_NAME', 'REQUIRED', 'Lakmé Forever Matte Liquid Lip Colour', 'Full display name of the product.'],
    ['CATEGORY', 'REQUIRED', 'Makeup', 'Master product category (e.g. Makeup, Skincare, Hair Care).'],
    ['SUBCATEGORY', 'Optional', 'Lips', 'Subcategory under category (e.g. Lips, Eyes, Face).'],
    ['SHADE_NAME', 'Optional', '01 Red Carpet', 'Color name for shade variants (mandatory for color variants).'],
    ['HEX & SWATCH', 'Optional', '#C71585', 'Hex color code for shade swatch circle (e.g. #C71585 or #D2691E).'],
    ['SIZE_OR_WEIGHT', 'Optional', '5.6 ml', 'Volume or net weight (e.g. 5.6 ml, 30 ml, 50 g).'],
    ['MRP', 'REQUIRED', '399', 'Maximum Retail Price in rupees (must be > 0).'],
    ['GENERAL_USER_PRICE', 'Optional', '349', 'Selling price for retail shoppers. If left empty, defaults to MRP.'],
    ['SALON_PRICE', 'Optional', '280', 'Selling price for verified salon owners. If left empty, auto-calculated at 30% discount.'],
    ['MAKEUP_ARTIST_PRICE', 'Optional', '260', 'Selling price for verified makeup artists. If left empty, auto-calculated at 35% discount.'],
    ['BEAUTICIAN_PRICE', 'Optional', '245', 'Selling price for verified beauticians. If left empty, auto-calculated at 32% discount.'],
    ['PRODUCT_ACTIVE', 'Optional', 'TRUE', 'TRUE or FALSE. Controls product catalog visibility.'],
    ['STATUS', 'Optional', 'ACTIVE', 'ACTIVE, PUBLISHED, or DRAFT.']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 28 },
    { wch: 80 }
  ];

  // ---------------------------------------------------------------------------
  // SHEET 3: Dropdown_Values (Dynamic Store Master Data Reference)
  // ---------------------------------------------------------------------------
  const liveCategories = categories.length > 0
    ? categories.map(c => c.name || c)
    : ['Makeup', 'Skincare', 'Hair Care', 'Fragrance', 'Bath & Body', 'Tools & Accessories'];

  const liveSubcategories = categories.length > 0 && categories.some(c => Array.isArray(c.subcategories))
    ? Array.from(new Set(categories.flatMap(c => (c.subcategories || []).map(s => s.name || s))))
    : ['Lips', 'Eyes', 'Face', 'Nails', 'Face Serums', 'Moisturizers', 'Cleansers', 'Sunscreen', 'Shampoo', 'Conditioner'];

  const liveBrands = brands.length > 0
    ? brands.map(b => b.name || b)
    : ['Lakmé', 'L\'Oréal Paris', 'M.A.C', 'Maybelline New York', 'Colorbar', 'Sugar Cosmetics', 'Huda Beauty', 'Faces Canada', 'Kay Beauty', 'Nykaa'];

  const productTypes = [
    'Matte Lipstick', 'Liquid Lipstick', 'Lip Gloss', 'Lip Liner', 'Foundation',
    'Concealer', 'Compact Powder', 'Eyeliner', 'Mascara', 'Eyeshadow Palette',
    'Face Serum', 'Moisturizer', 'Sunscreen', 'Shampoo', 'Hair Oil', 'Nail Polish'
  ];

  const finishes = ['Matte', 'Glossy', 'Dewy', 'Satin', 'Shimmer', 'Metallic', 'Glitter', 'Natural'];
  const skinTypes = ['All Skin Types', 'Oily', 'Dry', 'Sensitive', 'Combination', 'Normal'];
  const coverages = ['Full Coverage', 'Medium Coverage', 'Sheer Coverage', 'Buildable Coverage', 'Light Coverage'];
  const activeOptions = ['TRUE', 'FALSE'];

  const maxRows = Math.max(
    liveCategories.length,
    liveSubcategories.length,
    liveBrands.length,
    productTypes.length,
    finishes.length,
    skinTypes.length,
    coverages.length,
    activeOptions.length
  );

  const dropdownHeader = [
    'Category',
    'Subcategory',
    'Brand',
    'Finish',
    'Skin_Type',
    'Coverage',
    'Active_Status'
  ];

  const dropdownMatrix = [dropdownHeader];
  for (let i = 0; i < maxRows; i++) {
    dropdownMatrix.push([
      liveCategories[i] || '',
      liveSubcategories[i] || '',
      liveBrands[i] || '',
      finishes[i] || '',
      skinTypes[i] || '',
      coverages[i] || '',
      activeOptions[i] || ''
    ]);
  }

  const wsDropdowns = XLSX.utils.aoa_to_sheet(dropdownMatrix);
  wsDropdowns['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 }
  ];

  // ---------------------------------------------------------------------------
  // Assemble Workbook: 'Bulk Product Upload' + 'Field Guide' (+ 'Dropdown_Values')
  // ---------------------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsTemplate, 'Bulk Product Upload');
  XLSX.utils.book_append_sheet(workbook, wsInstructions, 'Field Guide');
  XLSX.utils.book_append_sheet(workbook, wsDropdowns, 'Dropdown_Values');

  if (options && options.returnWorkbook) {
    return workbook;
  }

  // Trigger Download
  XLSX.writeFile(workbook, 'Salbeau_Product_Import_Template.xlsx');
  return workbook;
};

/**
 * Exports currently staged preparation records using the EXACT 18 required columns.
 * Guarantees 100% round-trip fidelity between Staging -> Export -> Re-import.
 */
export const exportStagedProductsToExcel = (stagedRows = [], options = {}) => {
  if (!stagedRows || stagedRows.length === 0) {
    throw new Error('No staged products available to export.');
  }

  const exportData = stagedRows.map(r => {
    // Determine MRP & calculated rupee prices
    const numMrp = Number(r.mrp || 0);
    const genP = r.generalPrice !== undefined && r.generalPrice !== null && r.generalPrice !== ''
      ? Number(r.generalPrice)
      : (r.generalDiscount ? Math.round(numMrp * (1 - Number(r.generalDiscount) / 100)) : numMrp);

    const salonP = r.salonPrice !== undefined && r.salonPrice !== null && r.salonPrice !== ''
      ? Number(r.salonPrice)
      : (r.salonDiscount ? Math.round(numMrp * (1 - Number(r.salonDiscount) / 100)) : Math.round(numMrp * 0.70));

    const artistP = r.artistPrice !== undefined && r.artistPrice !== null && r.artistPrice !== ''
      ? Number(r.artistPrice)
      : (r.artistDiscount ? Math.round(numMrp * (1 - Number(r.artistDiscount) / 100)) : Math.round(numMrp * 0.65));

    const beauticianP = r.beauticianPrice !== undefined && r.beauticianPrice !== null && r.beauticianPrice !== ''
      ? Number(r.beauticianPrice)
      : (r.beauticianDiscount ? Math.round(numMrp * (1 - Number(r.beauticianDiscount) / 100)) : Math.round(numMrp * 0.68));

    const firstImage = Array.isArray(r.images) && r.images.length > 0
      ? r.images[0]
      : (r.image || r.productImageUrl || '');

        return {
      'BARCODE': String(r.barcode || r.variantBarcode || '').trim(),
      'BRAND': r.brand || r.brand_name || '',
      'IMAGE': firstImage,
      'SKU_NUMBER': r.parentSku || r.parent_sku || r.sku || '',
      'PRODUCT_NAME': r.name || r.productName || r.product_name || '',
      'CATEGORY': r.category || '',
      'SUBCATEGORY': r.subcategory || '',
      'SHADE_NAME': r.shade || r.shadeName || '',
      'HEX & SWATCH': r.hexColor || '',
      'SIZE_OR_WEIGHT': r.size || r.sizeOrWeight || '',
      'MRP': numMrp,
      'GENERAL_USER_PRICE': genP,
      'SALON_PRICE': salonP,
      'MAKEUP_ARTIST_PRICE': artistP,
      'BEAUTICIAN_PRICE': beauticianP,
      'PRODUCT_ACTIVE': (r.status !== 'draft' && r.productActive !== false) ? 'TRUE' : 'FALSE',
      'STATUS': (r.status || 'ACTIVE').toUpperCase()
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: REQUIRED_HEADERS });
  worksheet['!cols'] = [
    { wch: 18 }, // 1. BARCODE
    { wch: 20 }, // 2. BRAND
    { wch: 35 }, // 3. IMAGE
    { wch: 18 }, // 4. SKU_NUMBER
    { wch: 38 }, // 5. PRODUCT_NAME
    { wch: 16 }, // 6. CATEGORY
    { wch: 20 }, // 7. SUBCATEGORY
    { wch: 18 }, // 8. SHADE_NAME
    { wch: 16 }, // 9. HEX & SWATCH
    { wch: 16 }, // 10. SIZE_OR_WEIGHT
    { wch: 12 }, // 11. MRP
    { wch: 20 }, // 12. GENERAL_USER_PRICE
    { wch: 16 }, // 13. SALON_PRICE
    { wch: 22 }, // 14. MAKEUP_ARTIST_PRICE
    { wch: 18 }, // 15. BEAUTICIAN_PRICE
    { wch: 16 }, // 16. PRODUCT_ACTIVE
    { wch: 14 }  // 17. STATUS
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Product Upload');

  const filename = options.filename || `Salbeau_Staged_Products_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (options.returnWorkbook) {
    return workbook;
  }
  XLSX.writeFile(workbook, filename);
  return { success: true, count: exportData.length, filename };
};

/**
 * Downloads failed rows in Excel with specific error reason and suggested fix
 */
export const downloadFailedRowsExcel = (failedRows = [], originalFileName = 'import') => {
  if (!failedRows || failedRows.length === 0) return;

  const exportData = failedRows.map((r, i) => ({
    'Excel Row #': r._rowIndex || (i + 2),
    'Error Reason': (r._errors || [r._error]).filter(Boolean).join('; '),
    'Suggested Fix': (r._warnings || []).concat(r._suggestedFix ? [r._suggestedFix] : []).join('; ') || 'Check required fields & data types',
    'Barcode': r.barcode || r.variantBarcode || '',
    'Parent_SKU': r.parentSku || '',
    'Product_Name': r.productName || r.name || '',
    'Brand': r.brand || '',
    'Category': r.category || '',
    'Variant_SKU': r.variantSku || r.sku || '',
    'Variant_Name': r.variantName || r.shade || '',
    'MRP': r.mrp || 0,
    'General_User_Price': r.generalPrice || 0,
    'Salon_Price': r.salonPrice || 0
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed Rows');

  const base = (originalFileName || 'products').replace(/\.[^/.]+$/, '');
  XLSX.writeFile(wb, `${base}_failed_rows_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Downloads a comprehensive Import Report Excel file (Summary sheet + Failed Rows sheet)
 */
export const downloadImportReportExcel = (summary = {}, failedRows = []) => {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['SALBEAU MAKEUPSTORE — BULK IMPORT EXECUTION AUDIT REPORT'],
    ['Generated At:', new Date().toLocaleString()],
    [''],
    ['METRIC', 'VALUE'],
    ['Total Rows Evaluated', summary.total || 0],
    ['Parent Products Created', summary.productsCreated || summary.created || 0],
    ['Parent Products Updated', summary.productsUpdated || summary.updated || 0],
    ['Child Variants Created', summary.variantsCreated || 0],
    ['Child Variants Updated', summary.variantsUpdated || 0],
    ['Rows Skipped', summary.skipped || 0],
    ['Rows Failed', summary.failed || (failedRows.length) || 0],
    ['Status', (summary.failed || 0) === 0 ? 'COMPLETED_SUCCESSFULLY' : 'COMPLETED_WITH_WARNINGS']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Execution Summary');

  if (failedRows && failedRows.length > 0) {
    const errorData = failedRows.map((r, i) => ({
      'Row #': r._rowIndex || (i + 2),
      'Product Name': r.productName || r.name || 'Untitled',
      'SKU': r.variantSku || r.sku || '',
      'Barcode': r.barcode || r.variantBarcode || '',
      'Error Description': (r._errors || [r._error]).filter(Boolean).join('; '),
      'Suggested Fix': (r._warnings || []).join('; ') || 'Correct invalid values and re-upload'
    }));
    const wsErrors = XLSX.utils.json_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, wsErrors, 'Failed Rows Details');
  }

  XLSX.writeFile(wb, `Salbeau_Import_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
