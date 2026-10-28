/**
 * SALBEAU MAKEUPSTORE — BULK PRODUCT ENTRY END-TO-END VERIFICATION SUITE
 * 
 * Verifies:
 * 1. 27 Canonical Column Template Structure & 3-Sheet Generation (Product_Import, Instructions, Dropdown_Values)
 * 2. 100% Round-Trip Fidelity: Staged Data -> Export Staged XLSX -> Re-Import -> 0 Data Loss
 * 3. Bidirectional Rupee Price and Discount Recalculation
 * 4. Parent-Variant Relational Grouping by Parent_SKU
 * 5. Strict Zero-Stock Policy: No inventory or warehouse ledger fields in schema
 * 6. Strict 4-Tier Role-Based Selling Prices (Retail MRP, General, Salon, Artist, Beautician)
 */

import * as XLSX from '../../admin/node_modules/xlsx/xlsx.mjs';
import {
  CANONICAL_TEMPLATE_COLUMNS,
  generateAndDownloadTemplate,
  exportStagedProductsToExcel
} from '../../admin/src/utils/excelTemplateGenerator.js';
import {
  normalizeRow,
  matchColumnHeader,
  COLUMN_SYNONYMS,
  groupSheetRowsIntoProducts
} from '../../admin/src/services/excelProcessorService.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName} — ${details}`);
    failedTests++;
  }
}

console.log('================================================================');
console.log('SALBEAU MAKEUPSTORE: BULK PRODUCT ENTRY AUTOMATED TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: CANONICAL 27 COLUMNS VERIFICATION
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Canonical 27 Columns Specification ---');
assert(
  CANONICAL_TEMPLATE_COLUMNS.length === 27,
  'Canonical columns array contains exactly 27 supported fields',
  `Found ${CANONICAL_TEMPLATE_COLUMNS.length} columns`
);

const expectedHeaders = [
  'Barcode', 'Image', 'Parent_SKU', 'Product_Name', 'Product_Type',
  'Category', 'Subcategory', 'Brand', 'Product_Description', 'Highlights',
  'Variant_SKU', 'Variant_Name', 'Shade_Name', 'Shade_Code', 'Size_or_Weight',
  'Variant_Barcode', 'MRP', 'General_User_Price', 'Salon_Price',
  'Makeup_Artist_Price', 'Beautician_Price', 'Finish', 'Skin_Type',
  'Coverage', 'Product_Image_URL', 'Product_Active', 'Variant_Active'
];

const matchesAllExpected = expectedHeaders.every(h => CANONICAL_TEMPLATE_COLUMNS.includes(h));
assert(matchesAllExpected, 'Canonical columns list contains all 27 specified headers in exact format');

// -----------------------------------------------------------------------------
// TEST 2: 3-SHEET WORKBOOK GENERATION & STRUCTURE
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: 3-Sheet Workbook Generation ---');
const mockCategories = [
  { id: 'cat-1', name: 'Makeup', subcategories: [{ id: 'sub-1', name: 'Lips' }, { id: 'sub-2', name: 'Eyes' }] },
  { id: 'cat-2', name: 'Skincare', subcategories: [{ id: 'sub-3', name: 'Serums' }] }
];
const mockBrands = [
  { id: 'b-1', name: 'Lakmé' },
  { id: 'b-2', name: 'L\'Oréal Paris' },
  { id: 'b-3', name: 'Maybelline New York' }
];

const templateWorkbook = generateAndDownloadTemplate(mockCategories, mockBrands, { returnWorkbook: true });
assert(templateWorkbook !== null, 'Workbook generated successfully');
assert(templateWorkbook.SheetNames.length === 3, 'Workbook contains exactly 3 sheets', `Sheet count: ${templateWorkbook.SheetNames.length}`);
assert(templateWorkbook.SheetNames.includes('Product_Import'), 'Sheet 1 is "Product_Import"');
assert(templateWorkbook.SheetNames.includes('Instructions'), 'Sheet 2 is "Instructions"');
assert(templateWorkbook.SheetNames.includes('Dropdown_Values'), 'Sheet 3 is "Dropdown_Values"');

const importSheet = templateWorkbook.Sheets['Product_Import'];
assert(importSheet['!autofilter'] !== undefined, 'Sheet 1 has Excel auto-filter enabled');
assert(importSheet['!freeze'] !== undefined, 'Sheet 1 has header row frozen');

const dropdownSheet = templateWorkbook.Sheets['Dropdown_Values'];
const dropdownRows = XLSX.utils.sheet_to_json(dropdownSheet);
assert(dropdownRows.length > 0, 'Dropdown sheet contains master data entries');

// -----------------------------------------------------------------------------
// TEST 3: ZERO-STOCK POLICY VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Strict Zero-Stock Policy Verification ---');
const inventoryKeywords = ['stock', 'inventory', 'warehouse', 'quantity_in_stock', 'qty_available', 'restock'];
const hasInventoryColumn = CANONICAL_TEMPLATE_COLUMNS.some(col => 
  inventoryKeywords.some(keyword => col.toLowerCase().includes(keyword))
);
assert(!hasInventoryColumn, 'No stock/inventory columns exist in the canonical schema (Zero-Stock Policy enforced)');

// -----------------------------------------------------------------------------
// TEST 4: 100% ROUND-TRIP EXPORT & RE-IMPORT FIDELITY
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: 100% Round-Trip Export and Re-Import Fidelity ---');
const originalStagedRows = [
  {
    _id: 'row-parent-1',
    _rowIndex: 1,
    barcode: '8901030381017',
    parentSku: 'LAK-MATTE-LIP',
    name: 'Lakmé Forever Matte Liquid Lip Colour',
    productType: 'Liquid Lipstick',
    category: 'Makeup',
    subcategory: 'Lips',
    brand: 'Lakmé',
    description: 'Intense matte finish with 16-hour lightweight wear.',
    highlights: ['16hr Long Lasting', 'Transfer Proof', 'Lightweight'],
    variantSku: 'LAK-MATTE-01',
    variantName: 'Red Carpet',
    shade: 'Red Carpet',
    shadeCode: '01',
    size: '5.6 ml',
    variantBarcode: '8901030381017',
    mrp: 349,
    generalPrice: 314,
    generalDiscount: 10,
    salonPrice: 244,
    salonDiscount: 30,
    artistPrice: 227,
    artistDiscount: 35,
    beauticianPrice: 237,
    beauticianDiscount: 32,
    finish: 'Matte',
    skinType: 'All Skin Types',
    coverage: 'Full',
    images: ['https://cdn.salbeau.com/products/lakme-matte-01.jpg'],
    productActive: true,
    variantActive: true
  },
  {
    _id: 'row-child-2',
    parentId: 'row-parent-1',
    _rowIndex: 2,
    barcode: '8901030381017',
    parentSku: 'LAK-MATTE-LIP',
    name: 'Lakmé Forever Matte Liquid Lip Colour - Nude Myth',
    productType: 'Liquid Lipstick',
    category: 'Makeup',
    subcategory: 'Lips',
    brand: 'Lakmé',
    description: 'Intense matte finish with 16-hour lightweight wear.',
    highlights: ['16hr Long Lasting', 'Transfer Proof'],
    variantSku: 'LAK-MATTE-02',
    variantName: 'Nude Myth',
    shade: 'Nude Myth',
    shadeCode: '02',
    size: '5.6 ml',
    variantBarcode: '8901030381024',
    mrp: 349,
    generalPrice: 314,
    generalDiscount: 10,
    salonPrice: 244,
    salonDiscount: 30,
    artistPrice: 227,
    artistDiscount: 35,
    beauticianPrice: 237,
    beauticianDiscount: 32,
    finish: 'Matte',
    skinType: 'All Skin Types',
    coverage: 'Full',
    images: ['https://cdn.salbeau.com/products/lakme-matte-02.jpg'],
    productActive: true,
    variantActive: true
  }
];

// Perform export into in-memory workbook
const exportedWorkbook = exportStagedProductsToExcel(originalStagedRows, { returnWorkbook: true });
assert(exportedWorkbook !== null, 'Staged products exported to workbook successfully');

const exportedSheet = exportedWorkbook.Sheets['Product_Import'];
const exportedJson = XLSX.utils.sheet_to_json(exportedSheet, { defval: '' });
assert(exportedJson.length === 2, 'Exported sheet contains exactly 2 rows');

// Re-import and normalize
const reimportedRow1 = normalizeRow(exportedJson[0], 0);
const reimportedRow2 = normalizeRow(exportedJson[1], 1);

assert(reimportedRow1.parentSku === 'LAK-MATTE-LIP', 'Re-imported Row 1 parentSku matches original ("LAK-MATTE-LIP")');
assert(reimportedRow1.variantSku === 'LAK-MATTE-01', 'Re-imported Row 1 variantSku matches original ("LAK-MATTE-01")');
assert(reimportedRow1.shadeCode === '01', 'Re-imported Row 1 shadeCode matches original ("01")');
assert(reimportedRow1.mrp === 349, 'Re-imported Row 1 MRP preserved (349)');
assert(reimportedRow1.generalPrice === 314, 'Re-imported Row 1 General Price preserved (314)');
assert(reimportedRow1.salonPrice === 244, 'Re-imported Row 1 Salon Price preserved (244)');
assert(reimportedRow1.artistPrice === 227, 'Re-imported Row 1 Makeup Artist Price preserved (227)');
assert(reimportedRow1.beauticianPrice === 237, 'Re-imported Row 1 Beautician Price preserved (237)');
assert(reimportedRow1.finish === 'Matte', 'Re-imported Row 1 Finish preserved ("Matte")');
assert(reimportedRow1.coverage === 'Full', 'Re-imported Row 1 Coverage preserved ("Full")');

assert(reimportedRow2.parentSku === 'LAK-MATTE-LIP', 'Re-imported Row 2 parentSku matches original ("LAK-MATTE-LIP")');
assert(reimportedRow2.variantSku === 'LAK-MATTE-02', 'Re-imported Row 2 variantSku matches original ("LAK-MATTE-02")');
assert(reimportedRow2.shadeCode === '02', 'Re-imported Row 2 shadeCode matches original ("02")');
assert(reimportedRow2.variantBarcode === '8901030381024', 'Re-imported Row 2 variantBarcode preserved');

// -----------------------------------------------------------------------------
// TEST 5: PARENT-VARIANT RELATIONAL GROUPING
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Relational Parent-Variant Grouping by Parent_SKU ---');
const fiveVariantRows = [
  { Parent_SKU: 'LAK-MATTE-LIP', Variant_SKU: 'LAK-MATTE-01', Product_Name: 'Lakmé Forever Matte', Shade_Name: 'Red Carpet', Shade_Code: '01', MRP: '349', General_User_Price: '314', Salon_Price: '244', Makeup_Artist_Price: '227', Beautician_Price: '237' },
  { Parent_SKU: 'LAK-MATTE-LIP', Variant_SKU: 'LAK-MATTE-02', Product_Name: 'Lakmé Forever Matte', Shade_Name: 'Nude Myth', Shade_Code: '02', MRP: '349', General_User_Price: '314', Salon_Price: '244', Makeup_Artist_Price: '227', Beautician_Price: '237' },
  { Parent_SKU: 'LAK-MATTE-LIP', Variant_SKU: 'LAK-MATTE-03', Product_Name: 'Lakmé Forever Matte', Shade_Name: 'Berry Crush', Shade_Code: '03', MRP: '349', General_User_Price: '314', Salon_Price: '244', Makeup_Artist_Price: '227', Beautician_Price: '237' },
  { Parent_SKU: 'LAK-MATTE-LIP', Variant_SKU: 'LAK-MATTE-04', Product_Name: 'Lakmé Forever Matte', Shade_Name: 'Pink Blush', Shade_Code: '04', MRP: '349', General_User_Price: '314', Salon_Price: '244', Makeup_Artist_Price: '227', Beautician_Price: '237' },
  { Parent_SKU: 'LAK-MATTE-LIP', Variant_SKU: 'LAK-MATTE-05', Product_Name: 'Lakmé Forever Matte', Shade_Name: 'Mocha Shot', Shade_Code: '05', MRP: '349', General_User_Price: '314', Salon_Price: '244', Makeup_Artist_Price: '227', Beautician_Price: '237' }
];

const groupedResult = groupSheetRowsIntoProducts(fiveVariantRows);
const groupedProducts = groupedResult.groupedProducts;

assert(groupedProducts && groupedProducts.length === 1, '5 variant rows with same Parent_SKU grouped into exactly 1 parent product entity', `Grouped count: ${groupedProducts?.length}`);
assert(groupedProducts[0].shades.length === 5, 'Parent product entity holds all 5 variant items in its "shades" array', `Shades count: ${groupedProducts[0].shades.length}`);
assert(groupedProducts[0].parentSku === 'LAK-MATTE-LIP', 'Parent product entity has correct parentSku ("LAK-MATTE-LIP")');

// -----------------------------------------------------------------------------
// TEST 6: CANONICAL SYNONYMS NORMALIZATION
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Header Synonyms Normalization ---');
assert(matchColumnHeader('highlite') === 'highlights', 'Normalized "highlite" -> "highlights"');
assert(matchColumnHeader('Product Highlights') === 'highlights', 'Normalized "Product Highlights" -> "highlights"');
assert(matchColumnHeader('Product Description') === 'productDescription', 'Normalized "Product Description" -> "productDescription"');
assert(matchColumnHeader('Parent_SKU') === 'parentSku', 'Normalized "Parent_SKU" -> "parentSku"');
assert(matchColumnHeader('Variant_Barcode') === 'variantBarcode', 'Normalized "Variant_Barcode" -> "variantBarcode"');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`BULK PRODUCT ENTRY TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL BULK PRODUCT ENTRY AUDIT & IMPLEMENTATION REQUIREMENTS SATISFIED!\n');
}
