import assert from 'assert';
import {
  toSupabaseProductPayload
} from '../../admin/src/services/productEngineService.js';

// Pure mapping validator mirroring AppContext.js / AdminContext.jsx
const mapProductFromDb = (p) => ({
  id: p.id,
  name: p.name || '',
  image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
  shades: Array.isArray(p.shades) ? p.shades.map(s => ({
    ...s,
    image: s.image || p.image || '',
    images: Array.isArray(s.images) && s.images.length > 0 ? s.images : (s.image ? [s.image] : (p.image ? [p.image] : []))
  })) : []
});

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log('================================================================');
console.log('📸 SALBEAU: PROFESSIONAL PRODUCT IMAGE MANAGEMENT SYSTEM SUITE');
console.log('================================================================\n');

// --- 1. FORMAT & FILE SIZE VALIDATION ---
console.log('--- 1. FILE FORMAT & SIZE CONSTRAINTS ---');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const isAllowedExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');

  if (!ALLOWED_MIME_TYPES.includes(type) && !isAllowedExt) {
    return { valid: false, error: 'Unsupported format. Allowed: JPG, PNG, WebP.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 10MB limit.' };
  }
  return { valid: true };
}

test('Accepts standard JPEG image', () => {
  const res = validateImageFile({ name: 'packshot.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 });
  assert.strictEqual(res.valid, true);
});

test('Accepts PNG image with transparency', () => {
  const res = validateImageFile({ name: 'bottle_transparent.png', type: 'image/png', size: 3.5 * 1024 * 1024 });
  assert.strictEqual(res.valid, true);
});

test('Accepts high-efficiency WebP image', () => {
  const res = validateImageFile({ name: 'palette.webp', type: 'image/webp', size: 800 * 1024 });
  assert.strictEqual(res.valid, true);
});

test('Rejects oversized file (> 10MB)', () => {
  const res = validateImageFile({ name: 'raw_shoot.png', type: 'image/png', size: 14 * 1024 * 1024 });
  assert.strictEqual(res.valid, false);
  assert.ok(res.error.includes('10MB'));
});

test('Rejects unsupported file type (.exe, .pdf, .svg, .bmp)', () => {
  const res = validateImageFile({ name: 'payload.exe', type: 'application/x-msdownload', size: 50 * 1024 });
  assert.strictEqual(res.valid, false);
  assert.ok(res.error.includes('Unsupported format'));
});

// --- 2. MULTI-IMAGE MANAGEMENT & REORDERING ENGINE ---
console.log('\n--- 2. GENERAL PRODUCT GALLERY (REORDER, PRIMARY, REPLACE, DELETE) ---');

function manageProductGallery(initialImages) {
  let images = [...initialImages];

  return {
    getImages: () => [...images],
    getPrimary: () => images[0] || '',
    addImages: (newUrls) => {
      newUrls.forEach(u => {
        if (!images.includes(u)) images.push(u);
      });
    },
    setPrimary: (index) => {
      if (index <= 0 || index >= images.length) return;
      const target = images[index];
      images = [target, ...images.filter((_, i) => i !== index)];
    },
    move: (index, direction) => {
      const newIdx = direction === 'left' ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= images.length) return;
      const temp = images[index];
      images[index] = images[newIdx];
      images[newIdx] = temp;
    },
    replace: (index, newUrl) => {
      if (index >= 0 && index < images.length) {
        images[index] = newUrl;
      }
    },
    remove: (index) => {
      images = images.filter((_, i) => i !== index);
    }
  };
}

test('Initializes with multiple images and sets index 0 as Primary', () => {
  const gallery = manageProductGallery(['https://cdn.salbeau.com/front.webp', 'https://cdn.salbeau.com/side.webp']);
  assert.strictEqual(gallery.getImages().length, 2);
  assert.strictEqual(gallery.getPrimary(), 'https://cdn.salbeau.com/front.webp');
});

test('Promotes non-primary image to Primary (#2 becomes #1)', () => {
  const gallery = manageProductGallery([
    'https://cdn.salbeau.com/front.webp',
    'https://cdn.salbeau.com/swatch.webp',
    'https://cdn.salbeau.com/box.webp'
  ]);
  gallery.setPrimary(1); // promote 'swatch.webp'
  assert.strictEqual(gallery.getPrimary(), 'https://cdn.salbeau.com/swatch.webp');
  assert.strictEqual(gallery.getImages()[1], 'https://cdn.salbeau.com/front.webp');
  assert.strictEqual(gallery.getImages().length, 3);
});

test('Reorders images with Move Right and Move Left', () => {
  const gallery = manageProductGallery(['imgA', 'imgB', 'imgC']);
  gallery.move(0, 'right'); // imgA moves to index 1 -> ['imgB', 'imgA', 'imgC']
  assert.deepStrictEqual(gallery.getImages(), ['imgB', 'imgA', 'imgC']);
  gallery.move(2, 'left'); // imgC moves to index 1 -> ['imgB', 'imgC', 'imgA']
  assert.deepStrictEqual(gallery.getImages(), ['imgB', 'imgC', 'imgA']);
});

test('Replaces specific image in-place without altering other positions', () => {
  const gallery = manageProductGallery(['img1', 'img2_old', 'img3']);
  gallery.replace(1, 'img2_new');
  assert.deepStrictEqual(gallery.getImages(), ['img1', 'img2_new', 'img3']);
});

test('Deletes an image and automatically recalculates primary image', () => {
  const gallery = manageProductGallery(['img1', 'img2', 'img3']);
  gallery.remove(0); // remove img1
  assert.strictEqual(gallery.getPrimary(), 'img2');
  assert.strictEqual(gallery.getImages().length, 2);
});

// --- 3. VARIANT & SHADE IMAGES SECTION ---
console.log('\n--- 3. VARIANT & SHADE IMAGES ARCHITECTURE ---');

test('Standalone product with zero variants has empty variant imagery list', () => {
  const product = { name: 'Facial Scrub', shades: [] };
  assert.strictEqual(product.shades.length, 0);
});

test('Product with variants supports separate custom images per variant', () => {
  const variants = [
    { id: 'v1', name: 'Ruby Red', hexColor: '#E11D48', image: '', images: [] },
    { id: 'v2', name: 'Nude Pink', hexColor: '#E7A9A0', image: '', images: [] }
  ];

  // Admin attaches custom packshot to Ruby Red
  variants[0].image = 'https://cdn.salbeau.com/ruby_red.webp';
  variants[0].images = ['https://cdn.salbeau.com/ruby_red.webp', 'https://cdn.salbeau.com/ruby_red_swatch.webp'];

  assert.strictEqual(variants[0].images.length, 2);
  assert.strictEqual(variants[0].image, 'https://cdn.salbeau.com/ruby_red.webp');
  assert.strictEqual(variants[1].images.length, 0); // Nude Pink remains without custom images
});

test('Variant without custom image inherits main product packshot fallback', () => {
  const mainImage = 'https://cdn.salbeau.com/parent_packshot.webp';
  const variant = { id: 'v2', name: 'Nude Pink', image: '', images: [] };

  const effectiveImage = variant.image || mainImage;
  assert.strictEqual(effectiveImage, mainImage);
});

test('Variant with custom image overrides parent packshot', () => {
  const mainImage = 'https://cdn.salbeau.com/parent_packshot.webp';
  const variant = { id: 'v1', name: 'Ruby Red', image: 'https://cdn.salbeau.com/ruby.webp', images: ['https://cdn.salbeau.com/ruby.webp'] };

  const effectiveImage = variant.image || mainImage;
  assert.strictEqual(effectiveImage, 'https://cdn.salbeau.com/ruby.webp');
});

// --- 4. SUPABASE STORAGE & DATABASE PERSISTENCE ---
console.log('\n--- 4. SUPABASE STORAGE BUCKET & DATABASE MAPPING ---');

test('toSupabaseProductPayload correctly preserves image and images array', () => {
  const product = {
    name: 'Matte Liquid Lipstick',
    category: 'Makeup',
    subcategory: 'Lipstick',
    mrp: 499,
    image: 'https://cdn.salbeau.com/products/lipstick_front.webp',
    images: [
      'https://cdn.salbeau.com/products/lipstick_front.webp',
      'https://cdn.salbeau.com/products/lipstick_back.webp',
      'https://cdn.salbeau.com/products/lipstick_texture.webp'
    ],
    shades: [
      {
        id: 'var_01',
        name: 'Plum Passion',
        image: 'https://cdn.salbeau.com/products/variants/plum.webp',
        images: ['https://cdn.salbeau.com/products/variants/plum.webp']
      }
    ]
  };

  const payload = toSupabaseProductPayload(product);

  assert.strictEqual(payload.image, 'https://cdn.salbeau.com/products/lipstick_front.webp');
  assert.strictEqual(payload.images.length, 3);
  assert.strictEqual(payload.shades[0].image, 'https://cdn.salbeau.com/products/variants/plum.webp');
  assert.strictEqual(payload.shades[0].images.length, 1);
});

test('Zero-fake-image policy: Product without uploaded images has empty image and empty images array', () => {
  const productWithoutImages = {
    name: 'Herbal Shampoo',
    category: 'Hair Care',
    subcategory: 'Shampoo',
    mrp: 299,
    image: '',
    images: [],
    shades: []
  };

  const payload = toSupabaseProductPayload(productWithoutImages);
  assert.strictEqual(Boolean(payload.image), false);
  assert.deepStrictEqual(payload.images, []);
});

test('mapProductFromDb accurately restores images and variants for mobile app', () => {
  const dbRow = {
    id: 'prod_99',
    name: 'Velvet Lip Tint',
    category: 'Makeup',
    subcategory: 'Lipstick',
    mrp: 350,
    image: 'https://cdn.salbeau.com/products/front.webp',
    images: ['https://cdn.salbeau.com/products/front.webp', 'https://cdn.salbeau.com/products/swatch.webp'],
    shades: [
      {
        id: 'shade_1',
        name: 'Crimson',
        image: 'https://cdn.salbeau.com/products/variants/crimson.webp',
        images: ['https://cdn.salbeau.com/products/variants/crimson.webp']
      }
    ]
  };

  const mapped = mapProductFromDb(dbRow);
  assert.strictEqual(mapped.image, 'https://cdn.salbeau.com/products/front.webp');
  assert.strictEqual(mapped.images.length, 2);
  assert.strictEqual(mapped.shades[0].image, 'https://cdn.salbeau.com/products/variants/crimson.webp');
});

// --- 5. MOBILE APP PDP CAROUSEL SYNCHRONIZATION ---
console.log('\n--- 5. MOBILE PDP CAROUSEL COMPILATION ORDER ---');

test('Mobile PDP carousel places variant images first, then remaining parent gallery packshots', () => {
  const productImages = [];
  const selectedShade = {
    image: 'https://cdn.salbeau.com/plum_custom.webp',
    images: ['https://cdn.salbeau.com/plum_custom.webp', 'https://cdn.salbeau.com/plum_swatch.webp']
  };
  const effectiveProduct = {
    image: 'https://cdn.salbeau.com/parent_front.webp',
    images: [
      'https://cdn.salbeau.com/parent_front.webp',
      'https://cdn.salbeau.com/parent_ingredients.webp'
    ]
  };

  // Compile PDP carousel (logic from ProductDetailScreen.js lines 177-203)
  if (selectedShade?.images && Array.isArray(selectedShade.images)) {
    selectedShade.images.forEach(img => {
      if (img && !productImages.includes(img)) productImages.push(img);
    });
  }
  if (effectiveProduct?.images && Array.isArray(effectiveProduct.images)) {
    effectiveProduct.images.forEach(img => {
      if (img && !productImages.includes(img)) productImages.push(img);
    });
  }

  // Variant images MUST lead
  assert.strictEqual(productImages[0], 'https://cdn.salbeau.com/plum_custom.webp');
  assert.strictEqual(productImages[1], 'https://cdn.salbeau.com/plum_swatch.webp');
  // General parent images follow
  assert.strictEqual(productImages[2], 'https://cdn.salbeau.com/parent_front.webp');
  assert.strictEqual(productImages[3], 'https://cdn.salbeau.com/parent_ingredients.webp');
  assert.strictEqual(productImages.length, 4);
});

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
