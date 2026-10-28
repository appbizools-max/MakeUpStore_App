// Automated verification test suite for Centralized Image Processing & Optimization
import {
  IMAGE_PROFILES,
  RESPONSIVE_VARIANTS,
  calculateAspectRatioFit,
  calculateStorageSavings,
  formatBytes,
  validateImageFile
} from '../../admin/src/utils/imageOptimizer.js';

import { getResponsiveImageUri } from '../../app/src/utils/imageUtils.js';

let passed = 0;
let failed = 0;

function assert(cond, name, details = '') {
  if (cond) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${name} - ${details}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🖼️ RUNNING CENTRALIZED IMAGE OPTIMIZATION TEST SUITE');
console.log('====================================================\n');

// 1. Profile Configurations
console.log('--- 1. IMAGE OPTIMIZATION PROFILES ---');
const logoProfile = IMAGE_PROFILES.BRAND_LOGO;
assert(logoProfile && logoProfile.maxWidth === 512 && logoProfile.maxHeight === 512, 'Brand Logo profile: Max dimensions 512×512 px');
assert(logoProfile.quality === 0.90, 'Brand Logo profile: Quality 90/100');
assert(logoProfile.preserveTransparency === true, 'Brand Logo profile: Transparency preservation active');
assert(logoProfile.maxProcessedSizeKB === 150, 'Brand Logo profile: Max processed size 150 KB');
assert(logoProfile.fitMode === 'contain', 'Brand Logo profile: Fit mode contain');

const catProfile = IMAGE_PROFILES.CATEGORY;
assert(catProfile && catProfile.maxWidth === 800 && catProfile.maxHeight === 800, 'Category profile: Max dimensions 800×800 px');
assert(catProfile.quality === 0.85, 'Category profile: Quality 85/100');
assert(catProfile.maxProcessedSizeKB === 200, 'Category profile: Max processed size 200 KB');

const subProfile = IMAGE_PROFILES.SUBCATEGORY;
assert(subProfile && subProfile.maxWidth === 600 && subProfile.maxHeight === 600, 'Subcategory profile: Max dimensions 600×600 px');
assert(subProfile.quality === 0.85, 'Subcategory profile: Quality 85/100');
assert(subProfile.maxProcessedSizeKB === 150, 'Subcategory profile: Max processed size 150 KB');

const prodProfile = IMAGE_PROFILES.PRODUCT;
assert(prodProfile && prodProfile.maxWidth === 1200 && prodProfile.maxHeight === 1200, 'Product profile: Max dimensions 1200×1200 px');
assert(prodProfile.quality === 0.88, 'Product profile: Quality 88/100 (conservative for cosmetic shades)');
assert(prodProfile.colorAccuracy === true, 'Product profile: Color accuracy preservation active');
assert(prodProfile.maxProcessedSizeKB === 350, 'Product profile: Max processed size 350 KB');


// 2. Responsive Variant Specifications
console.log('\n--- 2. RESPONSIVE VARIANT SPECIFICATIONS ---');
assert(RESPONSIVE_VARIANTS.thumbnail.maxWidth === 160 && RESPONSIVE_VARIANTS.thumbnail.maxHeight === 160, 'Thumbnail variant: 160×160 px');
assert(RESPONSIVE_VARIANTS.small.maxWidth === 320 && RESPONSIVE_VARIANTS.small.maxHeight === 320, 'Small variant: 320×320 px');
assert(RESPONSIVE_VARIANTS.medium.maxWidth === 640 && RESPONSIVE_VARIANTS.medium.maxHeight === 640, 'Medium variant: 640×640 px');
assert(RESPONSIVE_VARIANTS.large.maxWidth === 1200 && RESPONSIVE_VARIANTS.large.maxHeight === 1200, 'Large variant: 1200×1200 px');
assert(RESPONSIVE_VARIANTS.logo.maxWidth === 512 && RESPONSIVE_VARIANTS.logo.maxHeight === 512, 'Logo variant: 512×512 px');
assert(RESPONSIVE_VARIANTS.category.maxWidth === 800 && RESPONSIVE_VARIANTS.category.maxHeight === 800, 'Category variant: 800×800 px');


// 3. Proportional Scaling & Aspect Ratio Preservation
console.log('\n--- 3. ASPECT RATIO PRESERVATION & CONTAIN SCALING ---');
// Wide landscape image (e.g. 2400x1200) into 1200x1200
const wideScaled = calculateAspectRatioFit(2400, 1200, 1200, 1200, false);
assert(wideScaled.width === 1200 && wideScaled.height === 600, `Landscape 2400×1200 scales proportionally to 1200×600 (Got ${wideScaled.width}×${wideScaled.height})`);

// Tall portrait image (e.g. 1000x2000) into 1200x1200
const tallScaled = calculateAspectRatioFit(1000, 2000, 1200, 1200, false);
assert(tallScaled.width === 600 && tallScaled.height === 1200, `Portrait 1000×2000 scales proportionally to 600×1200 (Got ${tallScaled.width}×${tallScaled.height})`);

// Small image (e.g. 200x200) with upscaling=false should NOT upscale
const smallNoUpscale = calculateAspectRatioFit(200, 200, 512, 512, false);
assert(smallNoUpscale.width === 200 && smallNoUpscale.height === 200, `Small image 200×200 is not upscaled (Got ${smallNoUpscale.width}×${smallNoUpscale.height})`);

// Horizontal logo into 512x512
const logoScaled = calculateAspectRatioFit(1200, 400, 512, 512, false);
assert(logoScaled.width === 512 && logoScaled.height === 171, `Horizontal logo 1200×400 scales proportionally to 512×171 without distortion (Got ${logoScaled.width}×${logoScaled.height})`);


// 4. Storage Savings Metric & Formatting
console.log('\n--- 4. PERFORMANCE & STORAGE SAVINGS MONITORING ---');
const savings1 = calculateStorageSavings(1000 * 1024, 100 * 1024);
assert(savings1 === 90, `1,000 KB to 100 KB gives exact 90% savings (Got ${savings1}%)`);

const savings2 = calculateStorageSavings(4 * 1024 * 1024, 80 * 1024);
assert(savings2 >= 98, `4 MB to 80 KB gives >= 98% savings (Got ${savings2}%)`);

assert(formatBytes(1024 * 50) === '50 KB', 'formatBytes(50 KB) formats accurately');
assert(formatBytes(1024 * 1024 * 2.5) === '2.5 MB', 'formatBytes(2.5 MB) formats accurately');


// 5. File Validation Constraints
console.log('\n--- 5. IMAGE SECURITY & FORMAT VALIDATION ---');
const validFile = { name: 'lipstick.webp', type: 'image/webp', size: 500 * 1024 };
assert(validateImageFile(validFile).valid, 'Valid WebP file accepted');

const validPng = { name: 'brand_logo.png', type: 'image/png', size: 1024 * 1024 };
assert(validateImageFile(validPng).valid, 'Valid PNG file accepted');

const oversizedFile = { name: 'huge_raw.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 };
assert(!validateImageFile(oversizedFile, { maxSizeBytes: 10 * 1024 * 1024 }).valid, 'Oversized 15 MB file rejected');

const invalidMime = { name: 'script.exe', type: 'application/octet-stream', size: 1024 };
assert(!validateImageFile(invalidMime).valid, 'Invalid non-image file rejected');


// 6. Mobile App Responsive Variant Resolution
console.log('\n--- 6. MOBILE APP RESPONSIVE VARIANT RESOLUTION ---');
const mockProductWithVariants = {
  url: 'https://cdn.salbeau.com/products/lipstick_master.webp',
  variants: {
    thumbnail: 'https://cdn.salbeau.com/products/lipstick_thumb.webp',
    small: 'https://cdn.salbeau.com/products/lipstick_sm.webp',
    medium: 'https://cdn.salbeau.com/products/lipstick_md.webp',
    large: 'https://cdn.salbeau.com/products/lipstick_lg.webp'
  }
};

const resolvedThumb = getResponsiveImageUri(mockProductWithVariants, 'thumbnail');
assert(resolvedThumb === 'https://cdn.salbeau.com/products/lipstick_thumb.webp', 'Resolves thumbnail variant for compact list');

const resolvedSmall = getResponsiveImageUri(mockProductWithVariants, 'small');
assert(resolvedSmall === 'https://cdn.salbeau.com/products/lipstick_sm.webp', 'Resolves small variant for mobile product card');

const resolvedLarge = getResponsiveImageUri(mockProductWithVariants, 'large');
assert(resolvedLarge === 'https://cdn.salbeau.com/products/lipstick_lg.webp', 'Resolves large variant for product detail zoom');

// Fallback to master URL when variants not present
const mockSimpleProduct = {
  url: 'https://cdn.salbeau.com/products/foundation.webp'
};
const resolvedSimple = getResponsiveImageUri(mockSimpleProduct, 'small');
assert(resolvedSimple === 'https://cdn.salbeau.com/products/foundation.webp', 'Gracefully falls back to master URL when variant object not present');

// Plain string URL support
const resolvedString = getResponsiveImageUri('https://cdn.salbeau.com/products/mascara.webp', 'small');
assert(resolvedString === 'https://cdn.salbeau.com/products/mascara.webp', 'Direct string URL supported without breaking');


console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
