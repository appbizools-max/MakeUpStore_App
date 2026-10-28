import assert from 'assert';

// ----------------------------------------------------------------------------
// BRAND DICTIONARY & NORMALIZATION
// ----------------------------------------------------------------------------
const KNOWN_BRAND_CODES = {
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
  if (KNOWN_BRAND_CODES[normalized]) {
    return KNOWN_BRAND_CODES[normalized];
  }
  if (KNOWN_BRAND_CODES[clean]) {
    return KNOWN_BRAND_CODES[clean];
  }
  // Fallback: remove non-alphanumeric, take up to 4 chars
  const alpha = clean.toUpperCase();
  return alpha.length >= 3 ? alpha.slice(0, 4) : (alpha + 'XXX').slice(0, 3);
};

// ----------------------------------------------------------------------------
// PRODUCT NAME SLUGIFICATION
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

  // Take significant parts from up to 3 words
  if (words.length === 2) {
    return `${words[0].slice(0, 4)}-${words[1].slice(0, 4)}`;
  }
  return `${words[0].slice(0, 3)}-${words[1].slice(0, 3)}-${words[2].slice(0, 3)}`;
};

// ----------------------------------------------------------------------------
// PARENT SKU GENERATOR
// ----------------------------------------------------------------------------
export const generateParentSku = (brand, productName) => {
  const brandCode = generateBrandCode(brand);
  const prodSlug = generateProductSlug(productName);
  return `${brandCode}-${prodSlug}`;
};

// ----------------------------------------------------------------------------
// VARIANT SKU GENERATOR
// ----------------------------------------------------------------------------
export const generateVariantSku = (parentSku, {
  explicitVariantSku = '',
  shadeCode = '',
  shadeName = '',
  sizeOrWeight = '',
  indexInGroup = 0,
  totalInGroup = 1
} = {}) => {
  // If user provided a valid explicit SKU, preserve it!
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
    // Check if shade name starts with digits (e.g. "01 Red Wine")
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

// ----------------------------------------------------------------------------
// AUTOMATED UNIT TESTS FOR SKU AUTO-DETECTION
// ----------------------------------------------------------------------------
console.log('Testing SKU Generation & Auto-Detection...');

// Brand tests
assert.strictEqual(generateBrandCode('Lakmé'), 'LAK');
assert.strictEqual(generateBrandCode("L'Oréal Paris"), 'LOR');
assert.strictEqual(generateBrandCode('M.A.C'), 'MAC');
assert.strictEqual(generateBrandCode('Maybelline New York'), 'MAY');
assert.strictEqual(generateBrandCode('Salbeau'), 'SAL');
assert.strictEqual(generateBrandCode('Custom Beauty Co'), 'CUST');
console.log('✅ Brand code generation verified');

// Parent SKU tests
assert.strictEqual(
  generateParentSku('Lakmé', 'Absolute Matte Liquid Lipstick'),
  'LAK-ABS-MAT-LIQ'
);
assert.strictEqual(
  generateParentSku("L'Oréal Paris", 'Revitalift Serum'),
  'LOR-REVI-SERU'
);
assert.strictEqual(
  generateParentSku('M.A.C', 'Studio Fix Fluid'),
  'MAC-STU-FIX-FLU'
);
console.log('✅ Parent SKU generation verified');

// Variant SKU tests
const parent = 'LAK-MATLIP';

// With shade code
assert.strictEqual(
  generateVariantSku(parent, { shadeCode: '01' }),
  'LAK-MATLIP-01'
);

// With MAC shade code
assert.strictEqual(
  generateVariantSku('MAC-SFF', { shadeCode: 'NC20' }),
  'MAC-SFF-NC20'
);

// With Size
assert.strictEqual(
  generateVariantSku('LOR-REVIT', { sizeOrWeight: '30ml' }),
  'LOR-REVIT-30ML'
);

// With shade name starting with number
assert.strictEqual(
  generateVariantSku(parent, { shadeName: '05 Crimson Red' }),
  'LAK-MATLIP-05'
);

// With text-only shade name
assert.strictEqual(
  generateVariantSku(parent, { shadeName: 'Ruby Rose' }),
  'LAK-MATLIP-RUBYR'
);

// Multiple variants sequential
assert.strictEqual(
  generateVariantSku(parent, { indexInGroup: 0, totalInGroup: 3 }),
  'LAK-MATLIP-01'
);
assert.strictEqual(
  generateVariantSku(parent, { indexInGroup: 1, totalInGroup: 3 }),
  'LAK-MATLIP-02'
);

// Standalone product
assert.strictEqual(
  generateVariantSku('TBS-FACEWASH', { totalInGroup: 1 }),
  'TBS-FACEWASH-STD'
);

// Preserves explicit SKU
assert.strictEqual(
  generateVariantSku(parent, { explicitVariantSku: 'CUSTOM-SKU-99' }),
  'CUSTOM-SKU-99'
);

console.log('✅ Variant SKU generation verified');
console.log('🎉 ALL SKU AUTO-DETECTION UNIT TESTS PASSED!');
