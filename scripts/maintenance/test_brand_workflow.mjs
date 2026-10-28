// Automated test suite for Brand Management Module
import { 
  APPROVED_BRAND_MASTER, 
  LOOKUP_BY_NAME, 
  LOOKUP_BY_CODE, 
  LOOKUP_BY_NUMBER 
} from '../../admin/src/utils/brandMasterApprovedData.js';

import {
  generateNextBrandNumber,
  generateProposedBrandCode,
  validateBrandCode,
  validateBrandName,
  normalizeBrandName,
  escapeSpreadsheetFormula,
  deriveBrandMnemonic
} from '../../admin/src/utils/brandUtils.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('🧪 RUNNING ENTERPRISE BRAND MANAGEMENT TEST SUITE');
console.log('====================================================\n');

// 1. Reconciliation & Master Data Integrity
console.log('--- 1. MASTER DATA RECONCILIATION ---');
assert(APPROVED_BRAND_MASTER.length === 365, 'Workbook contains exactly 365 brands', `Got ${APPROVED_BRAND_MASTER.length}`);

const numbersSet = new Set(APPROVED_BRAND_MASTER.map(b => b.brand_number || b.brandNumber));
assert(numbersSet.size === 365, 'All 365 approved Brand Numbers are 100% unique');

const codesSet = new Set(APPROVED_BRAND_MASTER.map(b => b.brand_code || b.brandCode));
assert(codesSet.size === 365, 'All 365 approved Brand Codes are 100% unique');

assert(APPROVED_BRAND_MASTER[0].name === 'AGARO' && APPROVED_BRAND_MASTER[0].brandCode === 'AGA-001', 'First brand is AGARO (AGA-001)');
assert(APPROVED_BRAND_MASTER[364].name === 'ZANDU' && APPROVED_BRAND_MASTER[364].brandCode === 'ZAN-365', 'Last brand is ZANDU (ZAN-365)');

// Spot check lookups
assert(LOOKUP_BY_NAME['AIR KARPURE']?.brandCode === 'AIK-002', 'Lookup by name: AIR KARPURE -> AIK-002');
assert(LOOKUP_BY_CODE['AIW-003']?.name === 'AIR WICK', 'Lookup by code: AIW-003 -> AIR WICK');
assert(LOOKUP_BY_NUMBER['BR004']?.name === 'AJAY', 'Lookup by number: BR004 -> AJAY');
assert(LOOKUP_BY_NAME['LAKME']?.brandCode === 'LAK-167', 'Lookup by name: LAKME -> LAK-167');


// 2. Brand Number Generation & Invariance
console.log('\n--- 2. BRAND NUMBER GENERATION ---');
// System reserves 1-365 for approved brands. With extra brands 366, 367, 370 (368 & 369 deleted):
const existingList = [
  { brand_number: 'BR366' },
  { brand_number: 'BR367' },
  { brand_number: 'BR370' } // BR368 and BR369 deleted
];
const nextNum = generateNextBrandNumber(existingList);
assert(nextNum === 'BR371', `Never recalculate from count+1; uses max sequence + 1 (expected BR371, got ${nextNum})`);

// Ensure format is valid
const emptyNext = generateNextBrandNumber([]);
assert(/^BR\d{3,}$/.test(emptyNext) && emptyNext === 'BR366', `Generated Brand Number format valid (${emptyNext})`);


// 3. Brand Code Generation & Collision Detection
console.log('\n--- 3. BRAND CODE GENERATION & COLLISION ---');
assert(deriveBrandMnemonic('LAKME') === 'LAK', 'Single word mnemonic: LAKME -> LAK');
assert(deriveBrandMnemonic('AIR KARPURE') === 'AIK', 'Two word mnemonic: AIR KARPURE -> AIK');
assert(deriveBrandMnemonic('ALPS GOODNESS HERBALS') === 'AGH', 'Three word mnemonic: ALPS GOODNESS HERBALS -> AGH');

// Known approved brand preserved
const lakmeCode = generateProposedBrandCode('LAKME', []);
assert(lakmeCode === 'LAK-167', `Preserves approved code for LAKME (LAK-167), got ${lakmeCode}`);

const airKarpureCode = generateProposedBrandCode('AIR KARPURE', []);
assert(airKarpureCode === 'AIK-002', `Preserves approved code for AIR KARPURE (AIK-002), got ${airKarpureCode}`);

// Custom brand with assigned number
const customCode = generateProposedBrandCode('BEAUTY QUEEN', [], 'BR380');
assert(customCode === 'BEQ-380', `Generates mnemonic and number BEQ-380, got ${customCode}`);

// Custom brand collision resolution
const collisionBrands = [
  { brand_code: 'BEQ-380', brand_name: 'FIRST BEAUTY QUEEN' }
];
const resolvedCode = generateProposedBrandCode('SECOND BEAUTY QUEEN', collisionBrands, 'BR380');
assert(resolvedCode !== 'BEQ-380' && resolvedCode.endsWith('-380'), `Collision resolved deterministically to alternate code (${resolvedCode})`);

// Code format & uniqueness validation
const validCodeRes = validateBrandCode('AGA-001', []);
assert(validCodeRes.valid, 'AGA-001 is a valid format');

const invalidCodeRes = validateBrandCode('INVALID_CODE', []);
assert(!invalidCodeRes.valid, 'INVALID_CODE is rejected by format validator');

const duplicateCodeRes = validateBrandCode('AGA-001', [{ id: 'b2', brand_code: 'AGA-001', brand_name: 'AGARO' }], 'b1');
assert(!duplicateCodeRes.valid, 'Duplicate code is rejected when owned by another brand');

const selfCodeRes = validateBrandCode('AGA-001', [{ id: 'b1', brand_code: 'AGA-001', brand_name: 'AGARO' }], 'b1');
assert(selfCodeRes.valid, 'Self code is valid during edit of the same brand');


// 4. Brand Name Validation & Normalization
console.log('\n--- 4. BRAND NAME VALIDATION & NORMALIZATION ---');
assert(normalizeBrandName('  Maybelline   New   York  ') === 'Maybelline New York', 'Normalizes and trims whitespace');

const duplicateNameRes = validateBrandName('agaro', [{ id: 'b2', brand_name: 'AGARO' }], 'b1');
assert(!duplicateNameRes.valid, 'Case-insensitive duplicate brand name rejected');

const validNameRes = validateBrandName('Brand New Unique', [{ id: 'b2', brand_name: 'AGARO' }]);
assert(validNameRes.valid, 'Unique brand name accepted');


// 5. Spreadsheet Formula Injection Prevention
console.log('\n--- 5. SPREADSHEET FORMULA INJECTION PREVENTION ---');
assert(escapeSpreadsheetFormula('=SUM(A1:A10)') === "'=SUM(A1:A10)", 'Formula with = is escaped with leading apostrophe');
assert(escapeSpreadsheetFormula('+cmd|"/c calc"!A0') === "'+cmd|\"/c calc\"!A0", 'Formula with + is escaped');
assert(escapeSpreadsheetFormula('-1+1') === "'-1+1", 'Formula with - is escaped');
assert(escapeSpreadsheetFormula('@something') === "'@something", 'Formula with @ is escaped');
assert(escapeSpreadsheetFormula('Normal Brand') === 'Normal Brand', 'Normal text is left untouched');


// 6. Safe Deletion & Product Reference Check
console.log('\n--- 6. SAFE DELETION VALIDATION ---');
const products = [
  { id: 'p1', brand_id: 'brand-101', name: 'Lipstick' },
  { id: 'p2', brand_name: 'Maybelline', name: 'Foundation' }
];

function canSafelyDeleteBrand(brand, productList) {
  const referencedByProducts = productList.some(p => 
    p.brand_id === brand.id || 
    (p.brand_name && normalizeBrandName(p.brand_name).toLowerCase() === normalizeBrandName(brand.brand_name || brand.name).toLowerCase()) ||
    (p.brand && typeof p.brand === 'object' && p.brand.id === brand.id)
  );
  if (referencedByProducts) {
    return { canDelete: false, message: 'Cannot delete: brand is linked to active products. Deactivate instead.' };
  }
  return { canDelete: true };
}

const checkInUse = canSafelyDeleteBrand({ id: 'brand-101', brand_name: 'LAKME' }, products);
assert(!checkInUse.canDelete, 'Cannot delete brand when products link via brand_id');

const checkInUseByName = canSafelyDeleteBrand({ id: 'brand-999', brand_name: 'MAYBELLINE' }, products);
assert(!checkInUseByName.canDelete, 'Cannot delete brand when products link via brand_name');

const checkUnused = canSafelyDeleteBrand({ id: 'brand-unused', brand_name: 'UNUSED BRAND' }, products);
assert(checkUnused.canDelete, 'Unused brand can be safely deleted');


console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
