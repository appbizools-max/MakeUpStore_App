// Beauty & Salon Automated Recommendation Engine
// Powers: 1. Add-Ons ("Complete Your Look ✨" / "Complete Your Order ✨")
//         2. Relevant Products ("You May Also Like 💜")

// Beauty Routine Complementary Mappings (What else is needed with this product?)
const COMPLEMENTARY_ROUTINE_MAP = {
  // Makeup: Face
  foundation: ['primer', 'sponge', 'blender', 'setting spray', 'concealer', 'compact', 'powder', 'brush', 'remover'],
  concealer: ['foundation', 'setting powder', 'beauty blender', 'sponge', 'primer', 'color corrector'],
  primer: ['foundation', 'bb cream', 'compact', 'setting spray', 'sponge'],
  compact: ['foundation', 'concealer', 'brush', 'primer', 'setting spray'],
  'setting spray': ['foundation', 'primer', 'compact', 'blender'],
  blush: ['highlighter', 'bronzer', 'makeup brush', 'primer'],
  highlighter: ['blush', 'contour', 'fan brush', 'setting spray'],

  // Makeup: Lips
  lipstick: ['lip liner', 'lip gloss', 'lip balm', 'lip scrub', 'makeup remover', 'micellar water'],
  'liquid lipstick': ['lip liner', 'lip balm', 'lip gloss', 'lip oil', 'makeup remover'],
  'lip gloss': ['lip liner', 'matte lipstick', 'lip balm'],
  'lip balm': ['lip scrub', 'lipstick', 'lip gloss'],

  // Makeup: Eyes
  eyeliner: ['kajal', 'mascara', 'eyeshadow', 'eye makeup remover', 'curler'],
  kajal: ['eyeliner', 'mascara', 'eye pencil', 'remover'],
  mascara: ['eyelash curler', 'eyeliner', 'kajal', 'remover'],
  eyeshadow: ['eye primer', 'blending brush', 'eyeliner', 'mascara'],

  // Skincare
  'face cream': ['face serum', 'sunscreen', 'cleanser', 'face wash', 'toner', 'night cream'],
  serum: ['moisturizer', 'day cream', 'sunscreen', 'cleanser', 'night cream'],
  moisturizer: ['face wash', 'sunscreen', 'serum', 'toner'],
  sunscreen: ['moisturizer', 'cleanser', 'face wash', 'aloe vera gel'],
  cleanser: ['toner', 'moisturizer', 'serum', 'face scrub'],
  'face wash': ['toner', 'moisturizer', 'sunscreen', 'scrub'],
  toner: ['cleanser', 'face wash', 'serum', 'moisturizer'],
  'face mask': ['cleanser', 'toner', 'facial roller', 'serum'],

  // Hair Care
  shampoo: ['conditioner', 'hair mask', 'hair spa', 'hair serum', 'scalp scrub', 'hair oil'],
  conditioner: ['shampoo', 'hair mask', 'hair serum', 'wide tooth comb'],
  'hair mask': ['shampoo', 'conditioner', 'hair serum', 'hair spa'],
  'hair serum': ['shampoo', 'conditioner', 'heat protectant', 'hair dryer'],
  'hair oil': ['shampoo', 'scalp massage brush', 'conditioner'],

  // Hair Styling Tools
  'hair dryer': ['heat protection spray', 'hair serum', 'paddle brush', 'section clips'],
  straightener: ['heat protection spray', 'hair serum', 'flat brush', 'clips'],
  curler: ['heat protection spray', 'hair spray', 'comb'],

  // Nails
  'nail polish': ['top coat', 'base coat', 'nail polish remover', 'cuticle oil', 'nail buffer', 'nail file'],
  'gel polish': ['uv lamp', 'top coat', 'base coat', 'acetone remover'],

  // Bath & Body
  'shower gel': ['body lotion', 'body butter', 'loofah', 'body scrub', 'body mist'],
  'body lotion': ['body wash', 'body scrub', 'body butter', 'body mist'],
  'body mist': ['shower gel', 'body lotion', 'perfume'],
  fragrance: ['body mist', 'deodorant', 'body lotion'],
  perfume: ['body mist', 'body lotion'],

  // Men's Grooming
  'beard oil': ['beard wash', 'beard comb', 'shaving foam', 'aftershave'],
  shaving: ['aftershave lotion', 'razor', 'shaving cream', 'face wash']
};

// Generic categories fallback map if specific terms not matched
const CATEGORY_COMPLEMENTARY_FALLBACK = {
  makeup: ['tools', 'remover', 'primer', 'brush', 'sponge'],
  skincare: ['sunscreen', 'cleanser', 'serum', 'mask'],
  'hair care': ['conditioner', 'serum', 'spa', 'mask'],
  'bath & body': ['lotion', 'mist', 'scrub'],
  fragrance: ['body mist', 'lotion'],
  'nail care': ['remover', 'top coat', 'base coat'],
  'hair styling tools': ['serum', 'spray', 'brush']
};

/**
 * Normalizes text string for token matching
 */
const normalize = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
};

/**
 * Extracts descriptive keywords from a product record
 */
const getProductTokens = (product) => {
  if (!product) return [];
  const tokens = new Set();

  const addTokens = (str) => {
    if (!str) return;
    normalize(str)
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['and', 'for', 'with', 'the', 'pro', 'all'].includes(w))
      .forEach(w => tokens.add(w));
  };

  addTokens(product.name);
  addTokens(product.category);
  addTokens(product.subcategory);
  addTokens(product.product_type);
  addTokens(product.product_family);

  if (Array.isArray(product.search_keywords)) {
    product.search_keywords.forEach(addTokens);
  }
  if (Array.isArray(product.key_points)) {
    product.key_points.forEach(addTokens);
  }

  return Array.from(tokens);
};

/**
 * 1. AUTOMATIC ADD-ONS RECOMMENDATION ENGINE ("Complete Your Look ✨" / "Complete Your Order ✨")
 * Focus: Complementary items needed alongside the current product or cart.
 *
 * @param {Object|Array} target - Single product or array of cart items
 * @param {Array} allProducts - Full active catalog of products
 * @param {Array} cart - Current cart items (to prevent recommending items already in cart)
 * @param {Object} options - Config options (maxCount, etc.)
 */
export const getAddOnRecommendations = (target, allProducts = [], cart = [], options = {}) => {
  if (options.enabled === false) return [];
  const maxCount = options.maxCount || 8;
  if (!allProducts || allProducts.length === 0) return [];

  // Collect all product IDs in cart to exclude
  const excludedIds = new Set();
  (cart || []).forEach(item => {
    if (item.product?.id) excludedIds.add(item.product.id);
    if (item.id) excludedIds.add(item.id);
  });

  // Also exclude target product if single
  const targetProducts = Array.isArray(target)
    ? target.map(t => t.product || t).filter(Boolean)
    : (target ? [target] : []);

  targetProducts.forEach(p => {
    if (p.id) excludedIds.add(p.id);
  });

  // Extract routine complementary keywords from target products
  const complementaryKeywords = new Set();

  targetProducts.forEach(prod => {
    const tokens = getProductTokens(prod);
    const textDesc = normalize(`${prod.name} ${prod.category} ${prod.subcategory} ${prod.product_type || ''}`);

    // Check specific routine mappings
    for (const [key, complements] of Object.entries(COMPLEMENTARY_ROUTINE_MAP)) {
      if (textDesc.includes(key)) {
        complements.forEach(c => complementaryKeywords.add(c));
      }
    }

    // Check category fallback mappings
    for (const [catKey, complements] of Object.entries(CATEGORY_COMPLEMENTARY_FALLBACK)) {
      if (textDesc.includes(catKey)) {
        complements.forEach(c => complementaryKeywords.add(c));
      }
    }
  });

  const keywordsList = Array.from(complementaryKeywords);

  // Score candidate products in catalog
  const scored = [];

  allProducts.forEach(candidate => {
    if (!candidate || excludedIds.has(candidate.id)) return;
    if (candidate.enabled === false || candidate.status === 'hidden' || candidate.status === 'disabled') return;

    const candText = normalize(`${candidate.name} ${candidate.category} ${candidate.subcategory || ''} ${candidate.product_type || ''} ${Array.isArray(candidate.search_keywords) ? candidate.search_keywords.join(' ') : ''}`);

    let score = 0;

    // Highest score: matches specific complementary routine terms
    keywordsList.forEach(kw => {
      if (candText.includes(kw)) {
        score += 15;
      }
    });

    // Cross-selling bonus if candidate belongs to a complementary category or beauty tools/combos
    const candCat = normalize(candidate.category);
    if (candCat.includes('combo') || candCat.includes('kit') || candCat.includes('tool')) {
      score += 5;
    }

    // Penalize if exact same subcategory as target (that belongs in "You May Also Like", not add-ons!)
    targetProducts.forEach(tp => {
      if (tp.subcategory && candidate.subcategory && normalize(tp.subcategory) === normalize(candidate.subcategory)) {
        score -= 8;
      }
    });

    if (score > 0) {
      scored.push({ product: candidate, score });
    }
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  let results = scored.map(s => s.product);

  // If complementary results are fewer than desired and fallback is enabled, add popular distinct products
  const allowFallback = options.popularProductsFallback !== false;
  if (allowFallback && results.length < maxCount) {
    const remaining = allProducts.filter(p =>
      !excludedIds.has(p.id) &&
      !results.some(r => r.id === p.id) &&
      p.enabled !== false &&
      p.status !== 'hidden' &&
      p.status !== 'disabled'
    );
    results = results.concat(remaining);
  }

  return results.slice(0, maxCount);
};

/**
 * 2. AUTOMATIC RELEVANT PRODUCTS ENGINE ("You May Also Like 💜")
 * Focus: Similar alternatives, same family, related formulations, product discovery.
 *
 * @param {Object} targetProduct - The product currently viewed
 * @param {Array} allProducts - Full active catalog of products
 * @param {Array} cart - Current cart items (to prevent recommending items already in cart)
 * @param {Object} options - Config options (maxCount, excludeIds, etc.)
 */
export const getRelevantProductRecommendations = (targetProduct, allProducts = [], cart = [], options = {}) => {
  if (options.enabled === false) return [];
  const maxCount = options.maxCount || 8;
  if (!targetProduct || !allProducts || allProducts.length === 0) return [];

  const excludedIds = new Set();
  excludedIds.add(targetProduct.id);
  
  (cart || []).forEach(item => {
    if (item.product?.id) excludedIds.add(item.product.id);
    if (item.id) excludedIds.add(item.id);
  });

  // Also exclude any IDs specifically passed (e.g., products already displayed in Add-Ons)
  if (Array.isArray(options.excludeIds)) {
    options.excludeIds.forEach(id => {
      if (id) excludedIds.add(id);
    });
  }

  const targetCategory = normalize(targetProduct.category);
  const targetSubcategory = normalize(targetProduct.subcategory);
  const targetFamily = normalize(targetProduct.product_family);
  const targetType = normalize(targetProduct.product_type);
  const targetBrand = normalize(targetProduct.brandName || targetProduct.brand_name);
  const targetTokens = getProductTokens(targetProduct);

  const scored = [];

  allProducts.forEach(candidate => {
    if (!candidate || excludedIds.has(candidate.id)) return;
    if (candidate.enabled === false || candidate.status === 'hidden' || candidate.status === 'disabled') return;

    let score = 0;
    const candCat = normalize(candidate.category);
    const candSub = normalize(candidate.subcategory);
    const candFamily = normalize(candidate.product_family);
    const candType = normalize(candidate.product_type);
    const candBrand = normalize(candidate.brandName || candidate.brand_name);
    const candTokens = getProductTokens(candidate);

    // Exact subcategory match = high relevance for discovery
    if (targetSubcategory && candSub && targetSubcategory === candSub) {
      score += 25;
    }

    // Exact category match
    if (targetCategory && candCat && targetCategory === candCat) {
      score += 15;
    }

    // Product family match
    if (targetFamily && candFamily && targetFamily === candFamily) {
      score += 20;
    }

    // Product type match
    if (targetType && candType && targetType === candType) {
      score += 18;
    }

    // Shared brand match
    if (targetBrand && candBrand && targetBrand === candBrand) {
      score += 8;
    }

    // Shared beauty keyword tokens
    const sharedTokens = candTokens.filter(t => targetTokens.includes(t));
    score += sharedTokens.length * 3;

    scored.push({ product: candidate, score });
  });

  scored.sort((a, b) => b.score - a.score);

  let results = scored.map(s => s.product);

  // Fallback to same category if not enough exact matches
  if (results.length < maxCount) {
    const remaining = allProducts.filter(p =>
      !excludedIds.has(p.id) &&
      !results.some(r => r.id === p.id) &&
      p.enabled !== false &&
      p.status !== 'hidden' &&
      p.status !== 'disabled' &&
      normalize(p.category) === targetCategory
    );
    results = results.concat(remaining);
  }

  return results.slice(0, maxCount);
};

/**
 * Helper to extract safe active shades/variants from a product record
 */
export const getSafeProductShades = (product) => {
  if (!product) return [];
  let raw = product.shades || [];
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) raw = [];
  return raw.filter(s => s && s.active !== false);
};

