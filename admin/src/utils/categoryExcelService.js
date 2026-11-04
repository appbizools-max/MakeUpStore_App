import * as XLSX from 'xlsx';

/**
 * SALBEAU MAKEUPSTORE — CATEGORY ARCHITECTURE EXCEL SERVICE
 * 
 * Supports 3-Level Category Architecture:
 * - Level 1: Main Categories
 * - Level 2: Subcategories (Children of Main Category)
 * - Level 3: Select Categories / Product Types (Children of Subcategory)
 * 
 * Provides:
 * 1. Downloadable templates for each level (and full multi-sheet master)
 * 2. Exporting for each level (and full master hierarchy)
 * 3. Pre-import validation, duplicate detection, and row-level error reporting
 * 4. Error report export (.xlsx)
 */

export const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const escapeFormula = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+@-]/i.test(str)) return `'${str}`;
  return str;
};

// ── 1. TEMPLATE GENERATORS ─────────────────────────────────────────────

/**
 * Level 1: Main Categories Template
 */
export const downloadMainCategoriesTemplate = () => {
  const headers = [
    'S.No',
    'Category Name',
    'Description',
    'Display Order',
    'Status',
    'Show in Mobile App',
    'Image URL'
  ];

  const sampleRows = [
    [1, 'Makeup', 'Cosmetics, lipsticks, foundations and beauty essentials', 1, 'Active', 'Yes', ''],
    [2, 'Skincare', 'Cleansers, toners, serums and moisturizers', 2, 'Active', 'Yes', ''],
    [3, 'Hair Care', 'Shampoos, conditioners, hair oils and salon treatments', 3, 'Active', 'Yes', ''],
    [4, 'Fragrance', 'Perfumes, deodorants, body mists and attars', 4, 'Active', 'Yes', ''],
    [5, 'Bath & Body', 'Body washes, scrubs, lotions and soaps', 5, 'Active', 'Yes', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 45 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 35 }
  ];

  const guideHeaders = ['Field Name', 'Required', 'Format / Valid Values', 'Notes'];
  const guideRows = [
    ['S.No', 'Optional', 'Numeric (1, 2, 3...)', 'Sequential row counter.'],
    ['Category Name', 'REQUIRED', 'Text (2 - 80 chars)', 'Must be unique across main categories.'],
    ['Description', 'Optional', 'Text (max 500 chars)', 'Brief overview of category catalog.'],
    ['Display Order', 'Optional', 'Number (1, 2, 3...)', 'Sort order in admin panel and customer app.'],
    ['Status', 'Optional', 'Active | Inactive', 'Defaults to Active if blank.'],
    ['Show in Mobile App', 'Optional', 'Yes | No', 'Controls visibility on customer mobile app.'],
    ['Image URL', 'Optional', 'Valid HTTP/HTTPS URL', 'Permanent URL or leave blank to upload later.']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 45 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Main Categories');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Field Guide');
  XLSX.writeFile(wb, 'salbeau_main_categories_template.xlsx');
};

/**
 * Level 2: Subcategories Template
 */
export const downloadSubcategoriesTemplate = (existingCategories = []) => {
  const headers = [
    'S.No',
    'Parent Main Category',
    'Subcategory Name',
    'Tagline',
    'Display Order',
    'Status',
    'Show in Mobile App',
    'Image URL'
  ];

  const sampleRows = [
    [1, 'Makeup', 'Lips', 'Lipsticks, liquid lipsticks and lip glosses', 1, 'Active', 'Yes', ''],
    [2, 'Makeup', 'Eyes', 'Eyeliners, mascaras, kajal and eyeshadows', 2, 'Active', 'Yes', ''],
    [3, 'Makeup', 'Face', 'Foundations, compacts, primers and concealers', 3, 'Active', 'Yes', ''],
    [4, 'Skincare', 'Face Cleansers', 'Gentle foaming face washes and micellar waters', 1, 'Active', 'Yes', ''],
    [5, 'Skincare', 'Serums & Treatments', 'Vitamin C, hyaluronic acid and retinol serums', 2, 'Active', 'Yes', ''],
    [6, 'Hair Care', 'Shampoos', 'Daily cleansing, anti-dandruff and color-protect formulas', 1, 'Active', 'Yes', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 25 },
    { wch: 45 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subcategories');

  // Available Main Categories Reference Sheet
  const catRefHeaders = ['Available Main Category Name', 'Category ID', 'Status'];
  const catRefRows = (existingCategories || []).map(c => [
    c.name,
    c.id,
    c.is_active || c.enabled !== false ? 'Active' : 'Inactive'
  ]);
  const wsCatRef = XLSX.utils.aoa_to_sheet([catRefHeaders, ...(catRefRows.length ? catRefRows : [['Makeup', 'cat_makeup', 'Active']])]);
  wsCatRef['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsCatRef, 'Available Categories');

  XLSX.writeFile(wb, 'salbeau_subcategories_template.xlsx');
};

/**
 * Level 3: Select Categories (Product Types) Template
 */
export const downloadSelectCategoriesTemplate = (existingCategories = [], existingSubcategories = []) => {
  const headers = [
    'S.No',
    'Parent Main Category',
    'Parent Subcategory',
    'Select Category Name',
    'Description',
    'Display Order',
    'Status',
    'Show in Mobile App',
    'Image URL'
  ];

  const sampleRows = [
    [1, 'Makeup', 'Lips', 'Matte Lipstick', 'Velvety matte finish with 12-hour wear', 1, 'Active', 'Yes', ''],
    [2, 'Makeup', 'Lips', 'Liquid Lipstick', 'Transfer-proof pigmented liquid lipstick', 2, 'Active', 'Yes', ''],
    [3, 'Makeup', 'Lips', 'Lip Gloss', 'High-shine plumping lip gloss', 3, 'Active', 'Yes', ''],
    [4, 'Makeup', 'Eyes', 'Gel Eyeliner', 'Smudge-proof waterproof gel pencil', 1, 'Active', 'Yes', ''],
    [5, 'Makeup', 'Eyes', 'Volumizing Mascara', 'Curling and lengthening mascara', 2, 'Active', 'Yes', ''],
    [6, 'Skincare', 'Face Cleansers', 'Foaming Face Wash', 'Deep pore purifying foam', 1, 'Active', 'Yes', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 25 },
    { wch: 28 },
    { wch: 45 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Select Categories');

  // Hierarchy Reference Sheet
  const hierHeaders = ['Parent Main Category', 'Parent Subcategory'];
  const hierRows = [];
  (existingSubcategories || []).forEach(s => {
    const parentCat = (existingCategories || []).find(c => c.id === s.category_id || c.id === s.categoryId);
    const parentCatName = parentCat ? parentCat.name : (s.category_name || s.categoryName || 'General');
    hierRows.push([parentCatName, s.name]);
  });
  const wsHier = XLSX.utils.aoa_to_sheet([hierHeaders, ...(hierRows.length ? hierRows : [['Makeup', 'Lips'], ['Makeup', 'Eyes']])]);
  wsHier['!cols'] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsHier, 'Hierarchy Reference');

  XLSX.writeFile(wb, 'salbeau_select_categories_template.xlsx');
};

/**
 * Multi-Sheet Complete Hierarchy Template
 */
export const downloadFullHierarchyTemplate = (categories = [], subcategories = []) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Main Categories
  const catHeaders = ['S.No', 'Category Name', 'Description', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
  const catRows = [
    [1, 'Makeup', 'Cosmetics and color beauty products', 1, 'Active', 'Yes', ''],
    [2, 'Skincare', 'Daily facial care and targeted treatments', 2, 'Active', 'Yes', ''],
    [3, 'Hair Care', 'Salon hair care and styling essentials', 3, 'Active', 'Yes', '']
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  ws1['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 45 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Main Categories');

  // Sheet 2: Subcategories
  const subHeaders = ['S.No', 'Parent Main Category', 'Subcategory Name', 'Tagline', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
  const subRows = [
    [1, 'Makeup', 'Lips', 'Lipsticks, liquid lipsticks and glosses', 1, 'Active', 'Yes', ''],
    [2, 'Makeup', 'Eyes', 'Eyeliners, mascaras and palettes', 2, 'Active', 'Yes', ''],
    [3, 'Skincare', 'Cleansers', 'Face washes and scrubs', 1, 'Active', 'Yes', '']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([subHeaders, ...subRows]);
  ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 45 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Subcategories');

  // Sheet 3: Select Categories
  const ptHeaders = ['S.No', 'Parent Main Category', 'Parent Subcategory', 'Select Category Name', 'Description', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
  const ptRows = [
    [1, 'Makeup', 'Lips', 'Matte Lipstick', 'Velvet bullet lipstick', 1, 'Active', 'Yes', ''],
    [2, 'Makeup', 'Lips', 'Liquid Lipstick', 'Long stay formula', 2, 'Active', 'Yes', ''],
    [3, 'Makeup', 'Eyes', 'Gel Eyeliner', 'Waterproof gel formula', 1, 'Active', 'Yes', '']
  ];
  const ws3 = XLSX.utils.aoa_to_sheet([ptHeaders, ...ptRows]);
  ws3['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 45 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Select Categories');

  XLSX.writeFile(wb, 'salbeau_complete_category_hierarchy_template.xlsx');
};

/**
 * Universal Simple Category Template
 * Allows entering any combination of Main Category, Subcategory, and Select Category.
 */
export const downloadSimpleCategoryTemplate = () => {
  const headers = [
    'Main Category',
    'Subcategory',
    'Select Category',
    'Description',
    'Display Order',
    'Status',
    'Show in Mobile App',
    'Image URL'
  ];

  const sampleRows = [
    ['Makeup', 'Lips', 'Matte Lipstick', 'Velvety matte lipstick', 1, 'Active', 'Yes', ''],
    ['Makeup', 'Lips', 'Liquid Lipstick', 'Long stay liquid formula', 2, 'Active', 'Yes', ''],
    ['Makeup', 'Eyes', 'Gel Eyeliner', 'Waterproof gel formula', 1, 'Active', 'Yes', ''],
    ['Skincare', 'Cleansers', 'Foaming Face Wash', 'Gentle foaming cleanser', 1, 'Active', 'Yes', ''],
    ['Hair Care', 'Shampoos', '', 'Salon quality daily shampoo', 1, 'Active', 'Yes', ''],
    ['Fragrance', '', '', 'Perfumes, body mists and attars', 1, 'Active', 'Yes', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 25 },
    { wch: 35 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 35 }
  ];

  const guideHeaders = ['Column', 'Required', 'Description'];
  const guideRows = [
    ['Main Category', 'Optional / Level 1', 'Main category name (e.g. Makeup, Skincare). If importing subcategories only, you can leave this blank and assign a parent in the admin.'],
    ['Subcategory', 'Optional / Level 2', 'Subcategory name (e.g. Lips, Eyes, Cleansers).'],
    ['Select Category', 'Optional / Level 3', 'Select category or product type name (e.g. Matte Lipstick, Gel Eyeliner).'],
    ['Description', 'Optional', 'Brief summary, details, or tagline.'],
    ['Display Order', 'Optional', 'Sorting position (1, 2, 3...).'],
    ['Status', 'Optional', 'Active or Inactive (defaults to Active).'],
    ['Show in Mobile App', 'Optional', 'Yes or No (defaults to Yes).'],
    ['Image URL', 'Optional', 'Direct link to category icon or photo.']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Category Import');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guide');
  XLSX.writeFile(wb, 'salbeau_simple_category_template.xlsx');
};

// ── 2. EXPORT FUNCTIONS ────────────────────────────────────────────────

export const exportCategoriesToExcel = ({
  categories = [],
  subcategories = [],
  productTypes = [],
  scope = 'all', // 'all' | 'categories' | 'subcategories' | 'product_types'
  selectedCategory = null,
  selectedSubcategory = null
}) => {
  const today = new Date().toISOString().split('T')[0];
  const wb = XLSX.utils.book_new();

  // Helper mapping
  const catMap = new Map();
  categories.forEach(c => catMap.set(c.id, c.name));
  const subMap = new Map();
  subcategories.forEach(s => subMap.set(s.id, s));

  if (scope === 'categories' || scope === 'all') {
    const catHeaders = ['S.No', 'Category Name', 'Category ID', 'Description', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
    const catRows = categories.map((c, i) => [
      i + 1,
      escapeFormula(c.name),
      c.id,
      escapeFormula(c.description || ''),
      c.sort_order || c.display_order || (i + 1),
      c.is_active || c.enabled !== false ? 'Active' : 'Inactive',
      c.show_in_mobile_app !== false ? 'Yes' : 'No',
      escapeFormula(c.image || c.image_url || '')
    ]);
    const ws = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
    ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Main Categories');
  }

  if (scope === 'subcategories' || scope === 'all') {
    const filteredSubs = selectedCategory
      ? subcategories.filter(s => s.category_id === selectedCategory.id || s.categoryId === selectedCategory.id)
      : subcategories;

    const subHeaders = ['S.No', 'Parent Main Category', 'Subcategory Name', 'Subcategory ID', 'Tagline', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
    const subRows = filteredSubs.map((s, i) => {
      const parentName = catMap.get(s.category_id || s.categoryId) || selectedCategory?.name || 'General';
      return [
        i + 1,
        escapeFormula(parentName),
        escapeFormula(s.name),
        s.id,
        escapeFormula(s.tagline || s.description || ''),
        s.sort_order || s.display_order || (i + 1),
        s.is_active || s.enabled !== false ? 'Active' : 'Inactive',
        s.show_in_mobile_app !== false ? 'Yes' : 'No',
        escapeFormula(s.image || s.image_url || '')
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([subHeaders, ...subRows]);
    ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Subcategories');
  }

  if (scope === 'product_types' || scope === 'all') {
    const filteredPTs = selectedSubcategory
      ? productTypes.filter(p => p.subcategory_id === selectedSubcategory.id || p.subcategoryId === selectedSubcategory.id)
      : productTypes;

    const ptHeaders = ['S.No', 'Parent Main Category', 'Parent Subcategory', 'Select Category Name', 'Select Category ID', 'Description', 'Display Order', 'Status', 'Show in Mobile App', 'Image URL'];
    const ptRows = filteredPTs.map((pt, i) => {
      const subObj = subMap.get(pt.subcategory_id || pt.subcategoryId) || selectedSubcategory;
      const subName = subObj ? subObj.name : 'General';
      const parentCatName = catMap.get(pt.category_id || pt.categoryId || subObj?.category_id) || selectedCategory?.name || 'General';
      return [
        i + 1,
        escapeFormula(parentCatName),
        escapeFormula(subName),
        escapeFormula(pt.name),
        pt.id,
        escapeFormula(pt.description || ''),
        pt.sort_order || pt.display_order || (i + 1),
        pt.is_active || pt.enabled !== false ? 'Active' : 'Inactive',
        pt.show_in_mobile_app !== false ? 'Yes' : 'No',
        escapeFormula(pt.image || pt.image_url || '')
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([ptHeaders, ...ptRows]);
    ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Select Categories');
  }

  const filename = scope === 'all'
    ? `salbeau_master_category_hierarchy_${today}.xlsx`
    : `salbeau_${scope}_export_${today}.xlsx`;

  XLSX.writeFile(wb, filename);
};

// ── 3. SMART COLUMN INSPECTOR & FLEXIBLE IMPORT ENGINE ─────────────────

/**
 * Inspects any uploaded category Excel/CSV workbook:
 * - Detects column headers automatically
 * - Matches candidates for Main Category, Subcategory, Select Category, Description, etc.
 * - Extracts sample rows for instant preview
 */
export const inspectCategoryExcelWorkbook = async (file) => {
  let data;
  if (typeof file.arrayBuffer === 'function') {
    const buf = await file.arrayBuffer();
    data = new Uint8Array(buf);
  } else if (typeof FileReader !== 'undefined') {
    data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error('Unsupported file reader environment.');
  }

  const wb = XLSX.read(data, { type: 'array' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    return { success: false, error: 'The uploaded file contains no sheets.' };
  }

  const sheetNames = wb.SheetNames;
  const targetSheetName = sheetNames.find(s => {
    const low = s.toLowerCase();
    return !low.includes('guide') && !low.includes('help') && !low.includes('readme');
  }) || sheetNames[0];

  const sheet = wb.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const headerMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const rawHeaderRow = headerMatrix.length > 0 ? headerMatrix[0] : [];
  const headers = rawHeaderRow.map(h => String(h || '').trim()).filter(Boolean);
  const finalHeaders = headers.length > 0 ? headers : Object.keys(rawRows[0] || {});

  const findCol = (candidates, avoidPatterns = []) => {
    for (const h of finalHeaders) {
      const cleanH = h.toLowerCase().replace(/[\s_.-]+/g, '');
      for (const cand of candidates) {
        if (cleanH === cand.toLowerCase().replace(/[\s_.-]+/g, '')) {
          return h;
        }
      }
    }
    for (const h of finalHeaders) {
      const normH = h.toLowerCase();
      const shouldAvoid = avoidPatterns.some(p => normH.includes(p.toLowerCase()));
      if (shouldAvoid) continue;

      for (const cand of candidates) {
        if (normH.includes(cand.toLowerCase())) {
          return h;
        }
      }
    }
    return '';
  };

  const mainCategoryCol = findCol([
    'Main Category Name', 'Main Category', 'Category Name', 'Category', 'Parent Main Category', 'Parent Category', 'Main Cat'
  ], ['sub', 'select', 'leaf', 'product type']);

  const subcategoryCol = findCol([
    'Subcategory Name', 'Subcategory', 'Sub Category Name', 'Sub Category', 'Sub-category', 'SubCat'
  ], ['select', 'leaf', 'product type']);

  const selectCategoryCol = findCol([
    'Select Category Name', 'Select Category', 'Product Type Name', 'Product Type', 'Leaf Category', 'Item Type', 'Type'
  ]);

  const descriptionCol = findCol([
    'Description', 'Tagline', 'Details', 'Notes', 'About'
  ]);

  const orderCol = findCol([
    'Display Order', 'Sort Order', 'Order', 'Position', 'S.No', 'SNo'
  ]);

  const statusCol = findCol([
    'Status', 'Active', 'Enabled', 'Is Active', 'Visibility'
  ]);

  const imageCol = findCol([
    'Image URL', 'Image', 'Photo', 'Icon', 'Logo', 'Picture'
  ]);

  const mobileCol = findCol([
    'Show in Mobile App', 'Mobile App', 'Show Mobile', 'Mobile'
  ]);

  return {
    success: true,
    sheetNames,
    selectedSheet: targetSheetName,
    headers: finalHeaders,
    rawRows,
    totalRows: rawRows.length,
    detectedMapping: {
      mainCategoryCol,
      subcategoryCol,
      selectCategoryCol,
      descriptionCol,
      orderCol,
      statusCol,
      imageCol,
      mobileCol
    },
    hasMain: Boolean(mainCategoryCol),
    hasSub: Boolean(subcategoryCol),
    hasSelect: Boolean(selectCategoryCol)
  };
};

/**
 * Builds the import payload based on user's active level toggles and parent category assignments
 */
export const buildFlexibleCategoryImportPlan = ({
  rawRows = [],
  mapping = {},
  toggles = { importMain: true, importSub: false, importSelect: false },
  parentConfig = {},
  existingHierarchy = {},
  mode = 'add_new'
}) => {
  const existingCats = existingHierarchy.categories || [];
  const existingSubs = existingHierarchy.subcategories || [];
  const existingPTs = existingHierarchy.productTypes || [];

  const catByName = new Map();
  existingCats.forEach(c => catByName.set(c.name.trim().toLowerCase(), c));

  const subByCatAndName = new Map();
  existingSubs.forEach(s => {
    const parentCat = existingCats.find(c => c.id === (s.category_id || s.categoryId));
    const parentName = parentCat ? parentCat.name.trim().toLowerCase() : '';
    subByCatAndName.set(`${parentName}:::${s.name.trim().toLowerCase()}`, s);
    subByCatAndName.set(s.name.trim().toLowerCase(), s);
  });

  const ptByKey = new Map();
  existingPTs.forEach(p => {
    const sub = existingSubs.find(s => s.id === (p.subcategory_id || p.subcategoryId));
    const cat = existingCats.find(c => c.id === (p.category_id || p.categoryId));
    const catName = cat ? cat.name.trim().toLowerCase() : '';
    const subName = sub ? sub.name.trim().toLowerCase() : '';
    ptByKey.set(`${catName}:::${subName}:::${p.name.trim().toLowerCase()}`, p);
    ptByKey.set(p.name.trim().toLowerCase(), p);
  });

  const parsedRows = [];
  const seenCatNames = new Set();
  const seenSubKeys = new Set();
  const seenPTKeys = new Set();

  let validCount = 0;
  let invalidCount = 0;
  let existingCount = 0;
  let newCount = 0;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;

    const descVal = mapping.descriptionCol ? String(row[mapping.descriptionCol] || '').trim() : '';
    const orderVal = mapping.orderCol ? parseInt(row[mapping.orderCol], 10) : (idx + 1);
    const statusVal = mapping.statusCol ? String(row[mapping.statusCol] || '').trim() : 'Active';
    const imageVal = mapping.imageCol ? String(row[mapping.imageCol] || '').trim() : '';
    const mobileVal = mapping.mobileCol ? String(row[mapping.mobileCol] || '').trim() : 'Yes';

    const isEnabled = !/^(inactive|false|0|disabled|no)$/i.test(statusVal);
    const showInMobile = !/^(no|false|0|hide|hidden)$/i.test(mobileVal);

    // 1. MAIN CATEGORY
    if (toggles.importMain && mapping.mainCategoryCol) {
      const rawCatName = String(row[mapping.mainCategoryCol] || '').trim();
      if (rawCatName) {
        const normCat = rawCatName.toLowerCase();
        if (!seenCatNames.has(normCat)) {
          seenCatNames.add(normCat);
          const existing = catByName.get(normCat);
          const isExisting = Boolean(existing);
          if (isExisting) existingCount++;
          else newCount++;
          validCount++;

          parsedRows.push({
            rowNumber: rowNum,
            levelType: 'category',
            name: rawCatName,
            parentCategory: '',
            parentSubcategory: '',
            description: descVal,
            displayOrder: orderVal || (parsedRows.length + 1),
            isEnabled,
            showInMobile,
            imageUrl: imageVal,
            isExisting,
            matchedId: existing ? existing.id : null,
            isValid: true,
            errors: [],
            warnings: []
          });
        }
      }
    }

    // 2. SUBCATEGORY
    if (toggles.importSub && mapping.subcategoryCol) {
      const rawSubName = String(row[mapping.subcategoryCol] || '').trim();
      if (rawSubName) {
        let parentCat = '';
        if (parentConfig.subParentMode === 'fixed' && parentConfig.subFixedParentName) {
          parentCat = parentConfig.subFixedParentName.trim();
        } else if (mapping.mainCategoryCol && row[mapping.mainCategoryCol]) {
          parentCat = String(row[mapping.mainCategoryCol]).trim();
        } else if (parentConfig.subFixedParentName) {
          parentCat = parentConfig.subFixedParentName.trim();
        } else {
          parentCat = 'General';
        }

        const subKey = `${parentCat.toLowerCase()}:::${rawSubName.toLowerCase()}`;
        if (!seenSubKeys.has(subKey)) {
          seenSubKeys.add(subKey);
          const existing = subByCatAndName.get(subKey);
          const isExisting = Boolean(existing);
          if (isExisting) existingCount++;
          else newCount++;
          validCount++;

          parsedRows.push({
            rowNumber: rowNum,
            levelType: 'subcategory',
            name: rawSubName,
            parentCategory: parentCat,
            parentSubcategory: '',
            description: descVal,
            displayOrder: orderVal || (parsedRows.length + 1),
            isEnabled,
            showInMobile,
            imageUrl: imageVal,
            isExisting,
            matchedId: existing ? existing.id : null,
            isValid: true,
            errors: [],
            warnings: []
          });
        }
      }
    }

    // 3. SELECT CATEGORY (PRODUCT TYPE)
    if (toggles.importSelect && mapping.selectCategoryCol) {
      const rawSelectName = String(row[mapping.selectCategoryCol] || '').trim();
      if (rawSelectName) {
        let parentCat = '';
        if (parentConfig.selectParentCatMode === 'fixed' && parentConfig.selectFixedParentCatName) {
          parentCat = parentConfig.selectFixedParentCatName.trim();
        } else if (mapping.mainCategoryCol && row[mapping.mainCategoryCol]) {
          parentCat = String(row[mapping.mainCategoryCol]).trim();
        } else if (parentConfig.selectFixedParentCatName) {
          parentCat = parentConfig.selectFixedParentCatName.trim();
        } else {
          parentCat = 'General';
        }

        let parentSub = '';
        if (parentConfig.selectParentSubMode === 'fixed' && parentConfig.selectFixedParentSubName) {
          parentSub = parentConfig.selectFixedParentSubName.trim();
        } else if (mapping.subcategoryCol && row[mapping.subcategoryCol]) {
          parentSub = String(row[mapping.subcategoryCol]).trim();
        } else if (parentConfig.selectFixedParentSubName) {
          parentSub = parentConfig.selectFixedParentSubName.trim();
        } else {
          parentSub = 'General';
        }

        const ptKey = `${parentCat.toLowerCase()}:::${parentSub.toLowerCase()}:::${rawSelectName.toLowerCase()}`;
        if (!seenPTKeys.has(ptKey)) {
          seenPTKeys.add(ptKey);
          const existing = ptByKey.get(ptKey);
          const isExisting = Boolean(existing);
          if (isExisting) existingCount++;
          else newCount++;
          validCount++;

          parsedRows.push({
            rowNumber: rowNum,
            levelType: 'product_type',
            name: rawSelectName,
            parentCategory: parentCat,
            parentSubcategory: parentSub,
            description: descVal,
            displayOrder: orderVal || (parsedRows.length + 1),
            isEnabled,
            showInMobile,
            imageUrl: imageVal,
            isExisting,
            matchedId: existing ? existing.id : null,
            isValid: true,
            errors: [],
            warnings: []
          });
        }
      }
    }
  });

  const categoriesCount = parsedRows.filter(r => r.levelType === 'category').length;
  const subcategoriesCount = parsedRows.filter(r => r.levelType === 'subcategory').length;
  const productTypesCount = parsedRows.filter(r => r.levelType === 'product_type').length;

  return {
    rows: parsedRows,
    totalToImport: parsedRows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    existingCount,
    newCount,
    summary: {
      categoriesCount,
      subcategoriesCount,
      productTypesCount
    }
  };
};

// ── 4. PARSE & PRE-IMPORT VALIDATION (LEGACY MULTI-SHEET COMPATIBILITY) ───

export const parseAndValidateCategoryExcel = async (file, targetScope = 'auto', existingHierarchy = {}) => {
  let data;
  if (typeof file.arrayBuffer === 'function') {
    const buf = await file.arrayBuffer();
    data = new Uint8Array(buf);
  } else if (typeof FileReader !== 'undefined') {
    data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error('Unsupported file reader environment.');
  }

  try {
    const wb = XLSX.read(data, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return { success: false, error: 'The uploaded file contains no sheets.' };
    }

        const existingCats = existingHierarchy.categories || [];
        const existingSubs = existingHierarchy.subcategories || [];
        const existingPTs = existingHierarchy.productTypes || [];

        // Dictionaries for fast collision & relational lookup
        const catByName = new Map();
        existingCats.forEach(c => catByName.set(c.name.trim().toLowerCase(), c));

        const subByCatAndName = new Map();
        existingSubs.forEach(s => {
          const cat = existingCats.find(c => c.id === s.category_id || c.id === s.categoryId);
          const catKey = cat ? cat.name.trim().toLowerCase() : '';
          const key = `${catKey}:::${s.name.trim().toLowerCase()}`;
          subByCatAndName.set(key, s);
          subByCatAndName.set(s.name.trim().toLowerCase(), s);
        });

        const ptByKey = new Map();
        existingPTs.forEach(p => {
          const sub = existingSubs.find(s => s.id === p.subcategory_id || s.id === p.subcategoryId);
          const cat = existingCats.find(c => c.id === p.category_id || c.id === p.categoryId);
          const key = `${cat ? cat.name.trim().toLowerCase() : ''}:::${sub ? sub.name.trim().toLowerCase() : ''}:::${p.name.trim().toLowerCase()}`;
          ptByKey.set(key, p);
          ptByKey.set(p.name.trim().toLowerCase(), p);
        });

        const getVal = (row, candidates) => {
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

        const parsedRows = [];
        let totalRows = 0;
        let validRows = 0;
        let invalidRows = 0;
        let existingCount = 0;
        let newCount = 0;
        let duplicateCount = 0;

        const seenKeysInFile = new Set();

        // Process a specific sheet
        const processSheet = (sheetName, levelType) => {
          const sheet = wb.Sheets[sheetName];
          if (!sheet) return;

          const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          rawRows.forEach((row, idx) => {
            totalRows++;
            const rowNum = idx + 2;
            const errors = [];
            const warnings = [];

            // Detect fields
            const parentCatName = getVal(row, ['Parent Main Category', 'Parent Category', 'Main Category', 'Category', 'Category Name']);
            const parentSubName = getVal(row, ['Parent Subcategory', 'Parent Sub Category', 'Subcategory', 'Sub Category', 'Subcategory Name']);
            const catName = getVal(row, ['Category Name', 'Main Category Name', 'Category']);
            const subName = getVal(row, ['Subcategory Name', 'Sub Category Name', 'Subcategory', 'Sub Category']);
            const selectCatName = getVal(row, ['Select Category Name', 'Select Category', 'Product Type', 'Product Type Name', 'Leaf Category', 'Type']);
            const description = getVal(row, ['Description', 'Tagline', 'Details', 'Notes']);
            const orderRaw = getVal(row, ['Display Order', 'Order', 'Sort Order', 'Position']);
            const statusRaw = getVal(row, ['Status', 'Active', 'Enabled', 'Visibility']);
            const mobileRaw = getVal(row, ['Show in Mobile App', 'Mobile App', 'Mobile', 'Show Mobile']);
            const imageUrl = getVal(row, ['Image URL', 'Image', 'Icon', 'Logo', 'Photo']);

            const displayOrder = parseInt(orderRaw, 10) || totalRows;
            const isEnabled = statusRaw ? !/^(inactive|false|0|disabled|no)$/i.test(statusRaw) : true;
            const showInMobile = mobileRaw ? !/^(no|false|0|hide|hidden)$/i.test(mobileRaw) : true;

            let rowEntity = levelType;
            let finalName = '';
            let resolvedParentCat = '';
            let resolvedParentSub = '';
            let isExisting = false;
            let matchedId = null;

            if (levelType === 'categories') {
              finalName = catName || getVal(row, ['Name']);
              if (!finalName) {
                errors.push('Category Name is required.');
              }
              const dedupKey = `cat:::${finalName.toLowerCase()}`;
              if (seenKeysInFile.has(dedupKey)) {
                errors.push(`Duplicate category name "${finalName}" found multiple times in spreadsheet.`);
                duplicateCount++;
              } else {
                seenKeysInFile.add(dedupKey);
              }

              if (catByName.has(finalName.toLowerCase())) {
                isExisting = true;
                matchedId = catByName.get(finalName.toLowerCase()).id;
              }
            } else if (levelType === 'subcategories') {
              finalName = subName || getVal(row, ['Name']);
              resolvedParentCat = parentCatName;

              if (!finalName) errors.push('Subcategory Name is required.');
              if (!resolvedParentCat) errors.push('Parent Main Category is required.');

              const dedupKey = `sub:::${(resolvedParentCat || '').toLowerCase()}:::${finalName.toLowerCase()}`;
              if (seenKeysInFile.has(dedupKey)) {
                errors.push(`Duplicate subcategory "${finalName}" under "${resolvedParentCat}" found in spreadsheet.`);
                duplicateCount++;
              } else {
                seenKeysInFile.add(dedupKey);
              }

              const existingKey = `${(resolvedParentCat || '').toLowerCase()}:::${finalName.toLowerCase()}`;
              if (subByCatAndName.has(existingKey)) {
                isExisting = true;
                matchedId = subByCatAndName.get(existingKey).id;
              }

              if (resolvedParentCat && !catByName.has(resolvedParentCat.toLowerCase())) {
                warnings.push(`Parent Main Category "${resolvedParentCat}" does not exist yet. It will be created automatically.`);
              }
            } else if (levelType === 'product_types') {
              finalName = selectCatName || getVal(row, ['Name']);
              resolvedParentCat = parentCatName;
              resolvedParentSub = parentSubName;

              if (!finalName) errors.push('Select Category Name is required.');
              if (!resolvedParentCat) errors.push('Parent Main Category is required.');
              if (!resolvedParentSub) errors.push('Parent Subcategory is required.');

              const dedupKey = `pt:::${(resolvedParentCat || '').toLowerCase()}:::${(resolvedParentSub || '').toLowerCase()}:::${finalName.toLowerCase()}`;
              if (seenKeysInFile.has(dedupKey)) {
                errors.push(`Duplicate Select Category "${finalName}" found in spreadsheet.`);
                duplicateCount++;
              } else {
                seenKeysInFile.add(dedupKey);
              }

              const existingKey = `${(resolvedParentCat || '').toLowerCase()}:::${(resolvedParentSub || '').toLowerCase()}:::${finalName.toLowerCase()}`;
              if (ptByKey.has(existingKey)) {
                isExisting = true;
                matchedId = ptByKey.get(existingKey).id;
              }

              if (resolvedParentCat && !catByName.has(resolvedParentCat.toLowerCase())) {
                warnings.push(`Parent Category "${resolvedParentCat}" will be created.`);
              }
              const subKey = `${(resolvedParentCat || '').toLowerCase()}:::${(resolvedParentSub || '').toLowerCase()}`;
              if (resolvedParentSub && !subByCatAndName.has(subKey)) {
                warnings.push(`Parent Subcategory "${resolvedParentSub}" will be created.`);
              }
            }

            const isValid = errors.length === 0;
            if (isValid) {
              validRows++;
              if (isExisting) existingCount++;
              else newCount++;
            } else {
              invalidRows++;
            }

            parsedRows.push({
              sheetName,
              rowNumber: rowNum,
              levelType,
              isValid,
              isExisting,
              matchedId,
              name: finalName,
              parentCategory: resolvedParentCat,
              parentSubcategory: resolvedParentSub,
              description,
              displayOrder,
              isEnabled,
              showInMobile,
              imageUrl,
              errors,
              warnings
            });
          });
        };

        // Auto-detect or use target scope
        const sheetNames = wb.SheetNames;
        const lowerSheets = sheetNames.map(s => s.toLowerCase().trim());

        const hasCatSheet = lowerSheets.some(s => s.includes('main') || s === 'categories');
        const hasSubSheet = lowerSheets.some(s => s.includes('sub'));
        const hasPTSheet = lowerSheets.some(s => s.includes('select') || s.includes('type') || s.includes('leaf'));

        if (targetScope === 'categories' || (targetScope === 'auto' && hasCatSheet && !hasSubSheet && !hasPTSheet)) {
          const sheetName = sheetNames.find(s => s.toLowerCase().includes('main') || s.toLowerCase() === 'categories') || sheetNames[0];
          processSheet(sheetName, 'categories');
        } else if (targetScope === 'subcategories' || (targetScope === 'auto' && hasSubSheet && !hasCatSheet && !hasPTSheet)) {
          const sheetName = sheetNames.find(s => s.toLowerCase().includes('sub')) || sheetNames[0];
          processSheet(sheetName, 'subcategories');
        } else if (targetScope === 'product_types' || (targetScope === 'auto' && hasPTSheet && !hasCatSheet && !hasSubSheet)) {
          const sheetName = sheetNames.find(s => s.toLowerCase().includes('select') || s.toLowerCase().includes('type')) || sheetNames[0];
          processSheet(sheetName, 'product_types');
        } else {
          // Multi-sheet or first sheet heuristics
          let handledAny = false;
          sheetNames.forEach(name => {
            const low = name.toLowerCase().trim();
            if (low.includes('guide') || low.includes('help') || low.includes('dropdown')) return;
            if (low.includes('main') || low === 'categories') {
              processSheet(name, 'categories');
              handledAny = true;
            } else if (low.includes('sub')) {
              processSheet(name, 'subcategories');
              handledAny = true;
            } else if (low.includes('select') || low.includes('product') || low.includes('type')) {
              processSheet(name, 'product_types');
              handledAny = true;
            }
          });

          if (!handledAny) {
            // Inspect first sheet columns
            const firstSheet = wb.Sheets[sheetNames[0]];
            const rawSample = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] || [];
            const headerStr = rawSample.map(String).join(' ').toLowerCase();

            if (headerStr.includes('select category') || headerStr.includes('product type')) {
              processSheet(sheetNames[0], 'product_types');
            } else if (headerStr.includes('subcategory') || headerStr.includes('parent main')) {
              processSheet(sheetNames[0], 'subcategories');
            } else {
              processSheet(sheetNames[0], 'categories');
            }
          }
        }

        return {
          success: true,
          totalRows,
          validRows,
          invalidRows,
          existingCount,
          newCount,
          duplicateCount,
          rows: parsedRows
        };
  } catch (err) {
    console.error('Category Excel Parse Error:', err);
    return {
      success: false,
      error: err.message || 'Error parsing category spreadsheet.'
    };
  }
};

/**
 * Downloads a row-level error audit spreadsheet
 */
export const downloadCategoryImportErrorReport = (parsedRows = []) => {
  const headers = [
    'Sheet Name',
    'Row #',
    'Level / Scope',
    'Status',
    'Name',
    'Parent Main Category',
    'Parent Subcategory',
    'Errors',
    'Warnings'
  ];

  const dataRows = parsedRows
    .filter(r => !r.isValid || r.warnings.length > 0)
    .map(r => [
      r.sheetName,
      r.rowNumber,
      r.levelType.toUpperCase(),
      r.isValid ? 'Valid with Warnings' : 'Failed / Invalid',
      escapeFormula(r.name),
      escapeFormula(r.parentCategory || ''),
      escapeFormula(r.parentSubcategory || ''),
      r.errors.join(' | '),
      r.warnings.join(' | ')
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
    { wch: 45 },
    { wch: 45 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
  XLSX.writeFile(wb, `category_import_error_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

