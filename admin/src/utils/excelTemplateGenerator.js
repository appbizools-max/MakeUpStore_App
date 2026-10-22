/**
 * MASTER EXCEL IMPORT/EXPORT TEMPLATE & REPORT GENERATOR
 * 
 * Provides:
 * 1. generateAndDownloadTemplate: Comprehensive 2-sheet Excel template matching all 22 fields
 *    plus dynamic category attributes, realistic sample rows (shade & non-shade), and Instructions sheet.
 * 2. downloadFailedRowsExcel: Exports invalid/failed rows with reason & suggested fix.
 * 3. downloadImportReportExcel: Full summary report with metrics and error logs.
 */

import * as XLSX from 'xlsx';

export const STANDARD_TEMPLATE_COLUMNS = [
  'Barcode',
  'Product Name',
  'Brand',
  'Category',
  'Subcategory',
  'Variant Type',
  'Shade Name',
  'HEX Code',
  'RGB',
  'Description',
  'Highlights',
  'Size',
  'GST %',
  'Net Qty',
  'MRP',
  'General User Discount %',
  'Salon Owner Discount %',
  'Makeup Artist Discount %',
  'Beautician Discount %',
  'Quantity Discount Tiers',
  'Status',
  'Created At',
  'Updated At'
];

export const DYNAMIC_CATEGORY_ATTRIBUTES = [
  'Finish',
  'Coverage',
  'Skin Type',
  'Hair Type',
  'Fragrance Family'
];

/**
 * Generates and triggers browser download of the Master Excel Product Import Template
 */
export const generateAndDownloadTemplate = () => {
  const headers = [...STANDARD_TEMPLATE_COLUMNS, ...DYNAMIC_CATEGORY_ATTRIBUTES];

  const sampleRows = [
    // Sample 1: Shade-based Makeup Product (Lipstick with Shade Name, HEX, RGB)
    [
      '8901234567890',
      'Maybelline SuperStay Matte Ink - Pioneer',
      'Maybelline New York',
      'Makeup',
      'Lips',
      'Shade',
      'Pioneer',
      '#9B111E',
      'RGB(155, 17, 30)',
      'Up to 16HR saturated liquid matte lipstick with arrow applicator for precision.',
      'Up to 16HR wear; Transfer-proof; Highly pigmented; Precise arrow tip',
      '5 ml',
      18,
      '1 N',
      699,
      5,
      10,
      12,
      15,
      '{"salon":[{"minQty":1,"maxQty":2,"discount":0},{"minQty":3,"maxQty":4,"discount":5},{"minQty":5,"maxQty":9,"discount":8},{"minQty":10,"maxQty":null,"discount":10}]}',
      'published',
      new Date().toISOString(),
      new Date().toISOString(),
      'Matte',
      'Full',
      '',
      '',
      ''
    ],
    // Sample 2: Non-shade Skincare Product (Serum with BLANK Shade Name, HEX, and RGB)
    [
      '8901030492812',
      'L\'Oréal Paris Revitalift 1.5% Hyaluronic Acid Serum',
      'L\'Oréal Paris',
      'Skincare',
      'Face Serums & Treatments',
      'Standard',
      '', // Blank for non-shade
      '', // Blank for non-shade
      '', // Blank for non-shade
      'Intensive hydrating face serum with 1.5% pure Hyaluronic Acid for plump, radiant, youthful skin.',
      '1.5% pure Hyaluronic Acid; Deep hydration; Visibly plumps skin; Lightweight & non-greasy',
      '30 ml',
      18,
      '1 N',
      999,
      5,
      10,
      12,
      15,
      '{"salon":[{"minQty":1,"maxQty":2,"discount":0},{"minQty":3,"maxQty":4,"discount":5},{"minQty":5,"maxQty":9,"discount":8},{"minQty":10,"maxQty":null,"discount":10}]}',
      'published',
      new Date().toISOString(),
      new Date().toISOString(),
      'Dewy',
      'Sheer',
      'All Skin Types',
      '',
      ''
    ],
    // Sample 3: Hair Care Product (Non-shade with Size/Volume)
    [
      '8901526001248',
      'L\'Oréal Professionnel Absolut Repair Shampoo',
      'L\'Oréal Professionnel',
      'Hair Care',
      'Shampoo',
      'Volume',
      '',
      '',
      '',
      'Professional restorative shampoo infused with Gold Quinoa and Wheat Protein to deeply repair damaged hair.',
      'Infused with Gold Quinoa; Reduces hair surface damage; Adds intense shine; Lightweight feel',
      '300 ml',
      18,
      '1 N',
      750,
      5,
      12,
      15,
      18,
      '',
      'published',
      new Date().toISOString(),
      new Date().toISOString(),
      '',
      '',
      '',
      'Damaged / Dry',
      ''
    ]
  ];

  // Worksheet 1: Template
  const wsTemplateData = [headers, ...sampleRows];
  const wsTemplate = XLSX.utils.aoa_to_sheet(wsTemplateData);

  wsTemplate['!cols'] = [
    { wch: 18 }, // Barcode
    { wch: 38 }, // Product Name
    { wch: 24 }, // Brand
    { wch: 16 }, // Category
    { wch: 22 }, // Subcategory
    { wch: 16 }, // Variant Type
    { wch: 18 }, // Shade Name
    { wch: 12 }, // HEX Code
    { wch: 18 }, // RGB
    { wch: 45 }, // Description
    { wch: 45 }, // Highlights
    { wch: 14 }, // Size
    { wch: 10 }, // GST %
    { wch: 12 }, // Net Qty
    { wch: 12 }, // MRP
    { wch: 22 }, // General User Discount %
    { wch: 22 }, // Salon Owner Discount %
    { wch: 22 }, // Makeup Artist Discount %
    { wch: 20 }, // Beautician Discount %
    { wch: 35 }, // Quantity Discount Tiers
    { wch: 12 }, // Status
    { wch: 24 }, // Created At
    { wch: 24 }, // Updated At
    { wch: 14 }, // Finish
    { wch: 14 }, // Coverage
    { wch: 18 }, // Skin Type
    { wch: 18 }, // Hair Type
    { wch: 18 }  // Fragrance Family
  ];

  // Worksheet 2: Field Instructions & Rules
  const instructionsHeaders = ['Field Name', 'Mandatory', 'Data Type / Format', 'Description & Validation Rules'];
  const instructionsRows = [
    ['Barcode', 'Optional', 'Text / Digits', 'Unique barcode (EAN-13, UPC-A, Code 128). If left blank, system generates an internal barcode.'],
    ['Product Name', 'REQUIRED', 'Text', 'The authoritative commercial title of the product. Minimum 2 characters.'],
    ['Brand', 'REQUIRED', 'Text', 'Brand name. Matched case-insensitively and trimmed against the master brands list.'],
    ['Category', 'REQUIRED', 'Text', 'Primary category: Makeup, Skincare, Hair Care, Fragrance, Bath & Body, etc.'],
    ['Subcategory', 'Recommended', 'Text', 'Specific subcategory belonging to the selected category (e.g. Lips, Face Serum, Shampoo).'],
    ['Variant Type', 'Optional', 'Text', 'Type of variant (e.g. Shade, Size, Volume, Pack, Standard). Defaults to Shade or Standard.'],
    ['Shade Name', 'Conditional', 'Text', 'Required ONLY for shade-based products (Lipsticks, Foundations, Nail Polish). LEAVE BLANK for skincare, haircare, and fragrances.'],
    ['HEX Code', 'Conditional', 'Hex (#RRGGBB)', '6-character Hex code (e.g. #9B111E). Leave blank for non-shade products.'],
    ['RGB', 'Optional', 'rgb(r, g, b)', 'Derived automatically from HEX Code if left blank. Leave blank for non-shade products.'],
    ['Description', 'Recommended', 'Text', 'Detailed commercial product copy, formula description, and benefits.'],
    ['Highlights', 'Optional', 'Text', 'Semicolon (;) or bullet (•) separated list of key product features and USPs.'],
    ['Size', 'Recommended', 'Text', 'Product volume, weight, or size representation (e.g. 50 ml, 30 g, Standard, Full Size).'],
    ['GST %', 'Optional', 'Number (0–28)', 'Applicable GST slab (e.g. 18, 5, 12, 28). Defaults to 18% if blank.'],
    ['Net Qty', 'Optional', 'Text', 'Net commercial quantity per unit (e.g. 1 N, 2 Units, 50 ml).'],
    ['MRP', 'REQUIRED', 'Positive Number', 'Maximum Retail Price in INR (e.g. 699). Must be greater than 0.'],
    ['General User Discount %', 'Optional', 'Number (0–90)', 'B2C consumer discount percentage on MRP. General Users do NOT receive volume tiers.'],
    ['Salon Owner Discount %', 'Optional', 'Number (0–90)', 'Base B2B Salon Owner trade discount percentage on MRP (e.g. 10).'],
    ['Makeup Artist Discount %', 'Optional', 'Number (0–90)', 'Base B2B Makeup Artist discount percentage on MRP (e.g. 12).'],
    ['Beautician Discount %', 'Optional', 'Number (0–90)', 'Base B2B Beautician discount percentage on MRP (e.g. 15).'],
    ['Quantity Discount Tiers', 'Optional', 'JSON / Text', 'Custom role-specific volume tiers (e.g. {"salon":[{"minQty":3,"maxQty":4,"discount":5}]}).'],
    ['Status', 'Optional', 'Text', 'Product status: "published", "draft", or "inactive". Defaults to "published".'],
    ['Created At', 'Optional', 'ISO Date', 'Record creation timestamp. Auto-populated if blank.'],
    ['Updated At', 'Optional', 'ISO Date', 'Record update timestamp. Auto-populated if blank.'],
    ['Finish', 'Dynamic Attribute', 'Text', 'Makeup attribute: Matte, Satin, Glossy, Dewy, Shimmer, Radiant.'],
    ['Coverage', 'Dynamic Attribute', 'Text', 'Makeup attribute: Sheer, Light, Medium, Full, Buildable.'],
    ['Skin Type', 'Dynamic Attribute', 'Text', 'Skincare attribute: All Skin Types, Oily, Dry, Sensitive, Combination.'],
    ['Hair Type', 'Dynamic Attribute', 'Text', 'Hair Care attribute: All Hair Types, Damaged, Colored, Frizzy, Fine.'],
    ['Fragrance Family', 'Dynamic Attribute', 'Text', 'Fragrance attribute: Floral, Woody, Oriental, Fresh, Citrus.']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet([instructionsHeaders, ...instructionsRows]);
  wsInstructions['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 22 },
    { wch: 75 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsTemplate, 'Products Catalog Template');
  XLSX.utils.book_append_sheet(workbook, wsInstructions, 'Instructions');

  XLSX.writeFile(workbook, `Salbeau_Master_Products_Import_Template.xlsx`);
};

/**
 * Downloads failed rows in Excel with specific error reason and suggested fix
 */
export const downloadFailedRowsExcel = (failedRows = []) => {
  if (!failedRows || failedRows.length === 0) {
    alert('No failed rows to download.');
    return;
  }

  const exportData = failedRows.map((r, idx) => ({
    'Row #': r._rowIndex || idx + 1,
    'Barcode': r.barcode || '',
    'Product Name': r.name || r.product_name || '',
    'Brand': r.brand || '',
    'Category': r.category || '',
    'Subcategory': r.subcategory || '',
    'MRP': r.mrp || '',
    'Error Reason': r._error || (Array.isArray(r._errors) ? r._errors.join(', ') : 'Validation failed'),
    'Suggested Fix': (r._issues && r._issues[0]?.suggestedFix) || 'Verify required fields and correct data types'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Import Rows');
  XLSX.writeFile(workbook, `salbeau_import_failed_rows_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Downloads a comprehensive Import Report Excel file (Summary sheet + Failed Rows sheet)
 */
export const downloadImportReportExcel = (summary = {}, failedRows = []) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary Statistics
  const summaryData = [
    ['Metric', 'Value'],
    ['Report Generated At', new Date().toLocaleString()],
    ['Total Rows Processed', summary.total || 0],
    ['Successfully Created', summary.inserted || 0],
    ['Successfully Updated', summary.updated || 0],
    ['Skipped / Duplicate Records', summary.skipped || 0],
    ['Failed Records', summary.failed || (failedRows ? failedRows.length : 0)],
    ['Success Rate', `${summary.total ? Math.round(((summary.inserted + summary.updated) / summary.total) * 100) : 0}%`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Import Summary');

  // Sheet 2: Failed Rows (if any)
  if (failedRows && failedRows.length > 0) {
    const errorRows = failedRows.map((r, idx) => ({
      'Row Number': r._rowIndex || idx + 1,
      'Product Name': r.name || r.product_name || 'Unnamed',
      'Barcode': r.barcode || 'N/A',
      'Brand': r.brand || 'N/A',
      'Category': r.category || 'N/A',
      'Error Reason': r._error || (Array.isArray(r._errors) ? r._errors.join(', ') : 'Error'),
      'Suggested Fix': (r._issues && r._issues[0]?.suggestedFix) || 'Review row values'
    }));
    const wsErrors = XLSX.utils.json_to_sheet(errorRows);
    XLSX.utils.book_append_sheet(workbook, wsErrors, 'Failed Rows & Details');
  }

  XLSX.writeFile(workbook, `salbeau_catalog_import_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
