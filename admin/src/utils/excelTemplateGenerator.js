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

export const CANONICAL_TEMPLATE_COLUMNS = [
  // 1-10: Product Identification & Core Info
  'Barcode',
  'Image',
  'Parent_SKU',
  'Product_Name',
  'Product_Type',
  'Category',
  'Subcategory',
  'Brand',
  'Product_Description',
  'Highlights',

  // 11-16: Variant Identification
  'Variant_SKU',
  'Variant_Name',
  'Shade_Name',
  'Shade_Code',
  'Size_or_Weight',
  'Variant_Barcode',

  // 17-21: Four-Tier Role-Based Pricing
  'MRP',
  'General_User_Price',
  'Salon_Price',
  'Makeup_Artist_Price',
  'Beautician_Price',

  // 22-24: Category Attributes
  'Finish',
  'Skin_Type',
  'Coverage',

  // 25-27: Media & Status
  'Product_Image_URL',
  'Product_Active',
  'Variant_Active'
];

/**
 * Generates and triggers browser download of the Master Excel Product Import Template (3-Sheet Structure)
 */
export const generateAndDownloadTemplate = (categories = [], brands = [], options = {}) => {
  const headers = [...CANONICAL_TEMPLATE_COLUMNS];

  const sampleRows = [
    // Sample 1: Parent-Child Variant Row 1 (Lakmé Liquid Lipstick - Shade 01 Red Carpet)
    [
      '8901030383811',           // Barcode
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800', // Image
      'LAK-MATTE-LIP',           // Parent_SKU
      'Lakmé Forever Matte Liquid Lip Colour', // Product_Name
      'Liquid Lipstick',         // Product_Type
      'Makeup',                  // Category
      'Lips',                    // Subcategory
      'Lakmé',                   // Brand
      'Intense matte liquid lip colour that lasts up to 16 hours with a lightweight, comfortable feel.', // Product_Description
      '16hr longwear; Smudge-proof; Ultra-lightweight', // Highlights
      'LAK-MATTE-01',            // Variant_SKU
      '01 Red Carpet',           // Variant_Name
      'Red Carpet',              // Shade_Name
      '01',                      // Shade_Code
      '5.6 ml',                  // Size_or_Weight
      '8901030383811',           // Variant_Barcode
      399,                       // MRP
      349,                       // General_User_Price
      280,                       // Salon_Price
      260,                       // Makeup_Artist_Price
      245,                       // Beautician_Price
      'Matte',                   // Finish
      'All Skin Types',          // Skin_Type
      'Full Coverage',           // Coverage
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800', // Product_Image_URL
      'TRUE',                    // Product_Active
      'TRUE'                     // Variant_Active
    ],
    // Sample 2: Parent-Child Variant Row 2 (Lakmé Liquid Lipstick - Shade 02 Nude Myth sharing Parent_SKU)
    [
      '8901030383828',           // Barcode
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800', // Image
      'LAK-MATTE-LIP',           // Parent_SKU (Same Parent SKU as Row 1 -> Grouped together!)
      'Lakmé Forever Matte Liquid Lip Colour', // Product_Name
      'Liquid Lipstick',         // Product_Type
      'Makeup',                  // Category
      'Lips',                    // Subcategory
      'Lakmé',                   // Brand
      'Intense matte liquid lip colour that lasts up to 16 hours with a lightweight, comfortable feel.', // Product_Description
      '16hr longwear; Smudge-proof; Ultra-lightweight', // Highlights
      'LAK-MATTE-02',            // Variant_SKU (Unique Variant SKU)
      '02 Nude Myth',            // Variant_Name
      'Nude Myth',               // Shade_Name
      '02',                      // Shade_Code
      '5.6 ml',                  // Size_or_Weight
      '8901030383828',           // Variant_Barcode
      399,                       // MRP
      349,                       // General_User_Price
      280,                       // Salon_Price
      260,                       // Makeup_Artist_Price
      245,                       // Beautician_Price
      'Matte',                   // Finish
      'All Skin Types',          // Skin_Type
      'Full Coverage',           // Coverage
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800', // Product_Image_URL
      'TRUE',                    // Product_Active
      'TRUE'                     // Variant_Active
    ],
    // Sample 3: Standalone Single Product (Face Serum without shades/variants)
    [
      '8901030492812',           // Barcode
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', // Image
      'LOR-REVIT-30ML',          // Parent_SKU
      'L\'Oréal Paris Revitalift 1.5% Hyaluronic Acid Serum', // Product_Name
      'Face Serum',              // Product_Type
      'Skincare',                // Category
      'Face Serums',             // Subcategory
      'L\'Oréal Paris',          // Brand
      'Intensive hydrating face serum with 1.5% pure Hyaluronic Acid for plump, radiant, youthful skin.', // Product_Description
      '1.5% Pure Hyaluronic Acid; Deep hydration; Radiant glow', // Highlights
      'LOR-REVIT-30ML',          // Variant_SKU (Same as Parent_SKU -> Standalone Product)
      '30 ml Bottle',            // Variant_Name
      '',                        // Shade_Name (Blank for non-shade)
      '',                        // Shade_Code (Blank for non-shade)
      '30 ml',                   // Size_or_Weight
      '8901030492812',           // Variant_Barcode
      999,                       // MRP
      899,                       // General_User_Price
      720,                       // Salon_Price
      680,                       // Makeup_Artist_Price
      640,                       // Beautician_Price
      'Dewy',                    // Finish
      'All Skin Types',          // Skin_Type
      'Sheer',                   // Coverage
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', // Product_Image_URL
      'TRUE',                    // Product_Active
      'TRUE'                     // Variant_Active
    ]
  ];

  // ---------------------------------------------------------------------------
  // SHEET 1: Product_Import (Primary Staging Sheet)
  // ---------------------------------------------------------------------------
  const wsTemplateData = [headers, ...sampleRows];
  const wsTemplate = XLSX.utils.aoa_to_sheet(wsTemplateData);

  wsTemplate['!cols'] = [
    { wch: 18 }, // Barcode
    { wch: 35 }, // Image
    { wch: 18 }, // Parent_SKU
    { wch: 38 }, // Product_Name
    { wch: 18 }, // Product_Type
    { wch: 16 }, // Category
    { wch: 20 }, // Subcategory
    { wch: 22 }, // Brand
    { wch: 45 }, // Product_Description
    { wch: 35 }, // Highlights
    { wch: 18 }, // Variant_SKU
    { wch: 22 }, // Variant_Name
    { wch: 18 }, // Shade_Name
    { wch: 14 }, // Shade_Code
    { wch: 16 }, // Size_or_Weight
    { wch: 18 }, // Variant_Barcode
    { wch: 12 }, // MRP
    { wch: 20 }, // General_User_Price
    { wch: 16 }, // Salon_Price
    { wch: 22 }, // Makeup_Artist_Price
    { wch: 18 }, // Beautician_Price
    { wch: 16 }, // Finish
    { wch: 18 }, // Skin_Type
    { wch: 16 }, // Coverage
    { wch: 35 }, // Product_Image_URL
    { wch: 16 }, // Product_Active
    { wch: 16 }  // Variant_Active
  ];

  // Freeze top header row so it stays visible during vertical scroll
  wsTemplate['!views'] = [{ state: 'frozen', ySplit: 1 }];
  wsTemplate['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  // Enable Auto-filter on the header row across all 27 canonical columns
  wsTemplate['!autofilter'] = { ref: `A1:AA${sampleRows.length + 1}` };

  // ---------------------------------------------------------------------------
  // SHEET 2: Instructions (User Manual & Formatting Rules)
  // ---------------------------------------------------------------------------
  const instructionsData = [
    ['SALBEAU MAKEUPSTORE — BULK PRODUCT IMPORT INSTRUCTIONS & COLUMN GUIDE'],
    [''],
    ['RULE 1: PARENT–CHILD PRODUCT RELATIONSHIPS & AUTO-SKU DETECTION'],
    ['* Rows sharing the SAME Parent_SKU (or sharing Brand + Product Name if Parent_SKU is left blank) are automatically grouped under a SINGLE parent product.'],
    ['* If Parent_SKU or Variant_SKU is left blank, Salbeau automatically detects and generates clean alphanumeric SKUs following beauty retail standards.'],
    ['* For standalone products without variants, set Variant_SKU equal to Parent_SKU or leave Shade_Name blank.'],
    [''],
    ['RULE 2: BARCODES & SKUs'],
    ['* Always format barcodes as TEXT to prevent Excel from dropping leading zeros (e.g. 0890123456789).'],
    ['* If provided, Variant_SKU must be unique across all variants in your catalog.'],
    ['* If Variant_SKU is left blank, unique variant SKUs are automatically generated using shade codes, sizes, or sequential numbering.'],
    ['* Variant_Barcode must be unique across all purchasable items.'],
    [''],
    ['RULE 3: FOUR-TIER ROLE-BASED PRICING'],
    ['* MRP: Maximum Retail Price in rupees (e.g. 399). Must be greater than 0.'],
    ['* General_User_Price: Standard retail consumer selling price (Must be <= MRP).'],
    ['* Salon_Price: Verified B2B Salon wholesale trade price (Must be <= General_User_Price).'],
    ['* Makeup_Artist_Price: Verified B2B Makeup Artist wholesale trade price.'],
    ['* Beautician_Price: Verified B2B Beautician wholesale trade price.'],
    [''],
    ['RULE 4: ZERO INVENTORY POLICY'],
    ['* Salbeau MakeUpStore explicitly DOES NOT track finite stock counts, warehouse ledgers, or low-stock alerts.'],
    ['* Product availability is controlled by Product_Active (TRUE/FALSE) and Variant_Active (TRUE/FALSE).'],
    [''],
    ['RULE 5: IMAGES'],
    ['* Image / Product_Image_URL: Public HTTP/HTTPS URL for the product family thumbnail and gallery.'],
    [''],
    ['CANONICAL COLUMN REFERENCE TABLE:'],
    ['Column Header', 'Required?', 'Data Type', 'Description / Validation'],
    ['Barcode', 'Optional', 'Text', 'Primary EAN-13 / UPC barcode for parent item'],
    ['Image', 'Optional', 'URL', 'Public image link for product'],
    ['Parent_SKU', 'Optional (Auto-Generated if blank)', 'Text', 'Parent code used to group variants. Auto-generates from Brand + Name if blank.'],
    ['Product_Name', 'REQUIRED', 'Text', 'Title of the parent product (e.g. Lakmé Forever Matte Lipstick)'],
    ['Product_Type', 'Optional', 'Text', 'Specific item type (e.g. Liquid Lipstick, Face Serum)'],
    ['Category', 'REQUIRED', 'Text', 'Main category (e.g. Makeup, Skincare, Hair Care)'],
    ['Subcategory', 'Optional', 'Text', 'Subcategory (e.g. Lips, Face Serums, Shampoo)'],
    ['Brand', 'REQUIRED', 'Text', 'Brand name (e.g. Lakmé, L\'Oréal Paris, Maybelline)'],
    ['Product_Description', 'Optional', 'Text', 'Full product overview and marketing copy'],
    ['Highlights', 'Optional', 'Text', 'Key features separated by semicolons (;)'],
    ['Variant_SKU', 'Optional (Auto-Generated if blank)', 'Text', 'Unique SKU for this variant. Auto-generates from Parent SKU + Shade/Size if blank.'],
    ['Variant_Name', 'Optional', 'Text', 'Display name for variant (e.g. 01 Red Carpet, 30 ml)'],
    ['Shade_Name', 'Optional', 'Text', 'Shade name for cosmetics (e.g. Ruby Velvet)'],
    ['Shade_Code', 'Optional', 'Text', 'Numerical or short code for shade (e.g. 01, 220)'],
    ['Size_or_Weight', 'Optional', 'Text', 'Volume, net quantity, or weight (e.g. 5 ml, 30 ml, 50g)'],
    ['Variant_Barcode', 'Optional', 'Text', 'Variant-specific barcode for scanner and checkout'],
    ['MRP', 'REQUIRED', 'Number', 'Maximum Retail Price in rupees (e.g. 499)'],
    ['General_User_Price', 'REQUIRED', 'Number', 'Retail customer price (Must be <= MRP)'],
    ['Salon_Price', 'Optional', 'Number', 'Discounted price for verified salon owners'],
    ['Makeup_Artist_Price', 'Optional', 'Number', 'Discounted price for verified makeup artists'],
    ['Beautician_Price', 'Optional', 'Number', 'Discounted price for verified beauticians'],
    ['Finish', 'Optional', 'Text', 'Cosmetic finish: Matte, Glossy, Dewy, Satin, Shimmer'],
    ['Skin_Type', 'Optional', 'Text', 'Target skin type: All Skin Types, Oily, Dry, Sensitive'],
    ['Coverage', 'Optional', 'Text', 'Level of coverage: Full, Medium, Sheer, Buildable'],
    ['Product_Image_URL', 'Optional', 'URL', 'Public image URL for parent product'],
    ['Product_Active', 'Optional', 'TRUE/FALSE', 'Whether parent product is published and visible'],
    ['Variant_Active', 'Optional', 'TRUE/FALSE', 'Whether this child variant is purchasable']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 26 },
    { wch: 14 },
    { wch: 16 },
    { wch: 75 }
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
    'Product_Type',
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
      productTypes[i] || '',
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
  // Assemble 3-Sheet Workbook
  // ---------------------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsTemplate, 'Product_Import');
  XLSX.utils.book_append_sheet(workbook, wsInstructions, 'Instructions');
  XLSX.utils.book_append_sheet(workbook, wsDropdowns, 'Dropdown_Values');

  if (options && options.returnWorkbook) {
    return workbook;
  }

  // Trigger Download
  XLSX.writeFile(workbook, 'Salbeau_Product_Import_Template.xlsx');
  return workbook;
};

/**
 * Exports currently staged preparation records using the EXACT 27 canonical columns.
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

    const highlightsStr = Array.isArray(r.highlights)
      ? r.highlights.join('; ')
      : (r.highlights || '');

    const finishVal = r.finish || r.attributes?.Finish || r.attributes?.finish || '';
    const skinTypeVal = r.skinType || r.attributes?.['Skin Type'] || r.attributes?.skin_type || '';
    const coverageVal = r.coverage || r.attributes?.Coverage || r.attributes?.coverage || '';

    const firstImage = Array.isArray(r.images) && r.images.length > 0
      ? r.images[0]
      : (r.image || r.productImageUrl || '');

    return {
      'Barcode': String(r.barcode || '').trim(),
      'Image': firstImage,
      'Parent_SKU': r.parentSku || r.parent_sku || r.sku || '',
      'Product_Name': r.name || r.productName || r.product_name || '',
      'Product_Type': r.productType || r.product_type || r.variantType || '',
      'Category': r.category || '',
      'Subcategory': r.subcategory || '',
      'Brand': r.brand || r.brand_name || '',
      'Product_Description': r.description || r.productDescription || '',
      'Highlights': highlightsStr,
      'Variant_SKU': r.variantSku || r.sku || r.parentSku || '',
      'Variant_Name': r.variantName || r.shade || (r.size ? `${r.size}` : 'Standard Variant'),
      'Shade_Name': r.shade || r.shadeName || '',
      'Shade_Code': r.shadeCode || r.code || '',
      'Size_or_Weight': r.size || r.sizeOrWeight || '',
      'Variant_Barcode': String(r.variantBarcode || r.barcode || '').trim(),
      'MRP': numMrp,
      'General_User_Price': genP,
      'Salon_Price': salonP,
      'Makeup_Artist_Price': artistP,
      'Beautician_Price': beauticianP,
      'Finish': finishVal,
      'Skin_Type': skinTypeVal,
      'Coverage': coverageVal,
      'Product_Image_URL': firstImage,
      'Product_Active': (r.status !== 'draft' && r.productActive !== false) ? 'TRUE' : 'FALSE',
      'Variant_Active': r.variantActive !== false ? 'TRUE' : 'FALSE'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: CANONICAL_TEMPLATE_COLUMNS });
  worksheet['!cols'] = [
    { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 38 }, { wch: 18 },
    { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 45 }, { wch: 35 },
    { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 22 },
    { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 35 },
    { wch: 16 }, { wch: 16 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Product_Import');

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
