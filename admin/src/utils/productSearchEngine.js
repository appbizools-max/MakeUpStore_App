/**
 * Product Search & Discovery Engine
 * 
 * Implements high-performance, typo-tolerant, multi-field search and indexing
 * across parent products and child variants.
 * 
 * Supports:
 * - Search Keywords & Search Aliases matching
 * - Variant-specific keyword matching (e.g. searching "Pioneer" matches Pioneer 20 variant)
 * - Auto-generated index terms from attributes, shades, brand, categories, specs
 * - Customer language / spelling normalization (e.g. lippie -> lip colour -> lipstick)
 * - Search Match Preview with field attribution for Admin verification
 * - Virtual child product / variant flattening for global catalog & search
 */

// Common cosmetics customer language synonym map for typo & slang normalization
export const SEARCH_ALIASES_MAP = {
  'lippie': ['lipstick', 'lip colour', 'lip color', 'lip crayon'],
  'lippies': ['lipstick', 'lip colour', 'lip color'],
  'lip colour': ['lipstick', 'lip color', 'lippie', 'liquid lipstick'],
  'lip color': ['lipstick', 'lip colour', 'lippie', 'liquid lipstick'],
  'lip-stick': ['lipstick', 'lip color', 'lip colour'],
  'lip stick': ['lipstick', 'lip color', 'lip colour'],
  'lipstik': ['lipstick', 'lip color'],
  'kohl': ['kajal', 'eyeliner', 'eye pencil'],
  'eyeliner': ['kohl', 'kajal', 'liner', 'eye liner'],
  'eye liner': ['eyeliner', 'kohl', 'kajal'],
  'base': ['foundation', 'primer', 'bb cream', 'cc cream'],
  'blusher': ['blush', 'cheek tint', 'cheek colour'],
  'mascara': ['lash mascara', 'eye mascara'],
  'sunblock': ['sunscreen', 'spf', 'sun protection'],
  'nailpolish': ['nail polish', 'nail lacquer', 'nail enamel'],
  'nail polish': ['nailpolish', 'nail lacquer', 'nail enamel'],
  'fragrance': ['perfume', 'deodorant', 'body mist', 'edp', 'edt']
};

/**
 * Normalizes a text string for uniform search comparison
 */
export const normalizeSearchTerm = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, ' ') // replace symbols with space
    .replace(/\s+/g, ' ');      // collapse multiple spaces
};

/**
 * Automatically extracts searchable index keywords from product & variant data
 */
export const generateAutoSearchTerms = (product = {}, variants = []) => {
  const terms = new Set();

  const add = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(v => add(v));
      return;
    }
    const clean = String(val).trim();
    if (clean && clean.length >= 2) {
      terms.add(clean.toLowerCase());
      // Split multi-word strings into individual meaningful tokens
      const words = clean.split(/[\s,/-]+/);
      if (words.length > 1) {
        words.forEach(w => {
          if (w.trim().length >= 2) terms.add(w.trim().toLowerCase());
        });
      }
    }
  };

  // 1. Parent info
  add(product.name);
  add(product.barcode);
  add(product.brandName || product.brand);
  add(product.category);
  add(product.subcategory);
  add(product.productType || product.product_type);
  add(product.productFamily || product.product_family);

  // 2. Specifications & attributes
  const specs = product.specifications || {};
  add(specs.finish || product.finish);
  add(specs.formulation || product.formulation);
  add(specs.coverage || product.coverage);
  add(specs.texture || product.texture);
  add(specs.skinType || product.skinType);
  add(specs.hairType || product.hairType);
  add(specs.colourFamily || product.colourFamily);

  // 3. Benefits & Key points
  add(product.benefits);
  add(product.keyPoints || product.key_points);
  add(product.highlights);

  // 4. Hero ingredients
  if (product.ingredients?.keyIngredients) {
    add(product.ingredients.keyIngredients);
  }

  // 5. Variants / Child products (shades, codes, SKU, barcode)
  const allVars = variants && variants.length > 0 ? variants : (product.shades || product.variants || []);
  allVars.forEach(v => {
    add(v.name);
    add(v.code);
    add(v.sku);
    add(v.barcode);
    add(v.hexColor);
    if (v.attributes && typeof v.attributes === 'object') {
      Object.values(v.attributes).forEach(attrVal => add(attrVal));
    }
  });

  return Array.from(terms);
};

/**
 * Automatically synthesizes high-intent search keywords and customer language aliases
 * according to the specific product, brand, category, subcategory, and variants.
 */
export const generateSmartKeywordsAndAliases = (product = {}, variants = []) => {
  const brand = (product.brandName || product.brand || '').trim();
  const name = (product.name || '').trim();
  const category = (product.category || '').trim();
  const subcategory = (product.subcategory || '').trim();
  const productType = (product.productType || product.product_type || '').trim();

  const keywordsSet = new Set();
  const aliasesSet = new Set();

  const addKw = (str) => {
    if (!str) return;
    const clean = str.trim().toLowerCase();
    if (clean.length >= 2 && !keywordsSet.has(clean)) {
      keywordsSet.add(clean);
    }
  };

  const addAlias = (str) => {
    if (!str) return;
    const clean = str.trim().toLowerCase();
    if (clean.length >= 2 && !aliasesSet.has(clean) && !keywordsSet.has(clean)) {
      aliasesSet.add(clean);
    }
  };

  // 1. Direct combinations from Brand, Product Name, and Category
  if (brand && name) addKw(`${brand} ${name}`);
  if (name) addKw(name);
  if (brand && subcategory) addKw(`${brand} ${subcategory}`);
  if (brand && productType) addKw(`${brand} ${productType}`);
  if (brand && category) addKw(`${brand} ${category}`);
  if (subcategory) addKw(subcategory);
  if (productType && productType.toLowerCase() !== subcategory.toLowerCase()) addKw(productType);

  // 2. Extract key phrases from product name
  if (name) {
    const cleanedName = name.replace(/[^\w\s-]/g, ' ').trim();
    const parts = cleanedName.split(/\s+/);
    if (parts.length >= 2) {
      addKw(cleanedName);
      for (let i = 0; i < parts.length - 1; i++) {
        const pair = `${parts[i]} ${parts[i + 1]}`;
        if (pair.length >= 4) addKw(pair);
      }
    }
  }

  // 3. Category & Subcategory Specific High-Intent Keywords & Customer Language
  const normText = `${name} ${subcategory} ${productType} ${category}`.toLowerCase();

  // A. Lipsticks & Lip Products
  if (/lip|lipstick|crayon|gloss|tint/i.test(normText)) {
    addKw(`${brand ? brand + ' ' : ''}lipstick`);
    addKw('liquid lipstick');
    addKw('matte lipstick');
    addKw('long lasting lipstick');
    addKw('transfer proof lipstick');
    addKw('waterproof lipstick');
    addKw('lip colour');
    addKw('lip makeup');

    addAlias('lippie');
    addAlias('lippies');
    addAlias('lip color');
    addAlias('lip colour');
    addAlias('lip-stick');
    addAlias('lip stick');
    addAlias('liquid lip');
    addAlias('lip paint');
    addAlias('matte lip');
  }

  // B. Foundations & Base Makeup
  if (/foundation|base|concealer|cushion|bb cream|cc cream/i.test(normText)) {
    addKw(`${brand ? brand + ' ' : ''}foundation`);
    addKw('liquid foundation');
    addKw('full coverage foundation');
    addKw('waterproof foundation');
    addKw('face makeup base');

    addAlias('face base');
    addAlias('skin base');
    addAlias('fondation');
    addAlias('skin tint');
    addAlias('liquid base');
  }

  // C. Kajal, Eyeliner & Eye Makeup
  if (/kajal|kohl|eyeliner|mascara|eyeshadow/i.test(normText)) {
    if (/kajal|kohl|eyeliner/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}kajal`);
      addKw('waterproof kajal');
      addKw('smudge proof eyeliner');
      addKw('black eyeliner');
      addKw('eye pencil');

      addAlias('kohl');
      addAlias('kajol');
      addAlias('liner');
      addAlias('eye liner');
      addAlias('surma');
    }
    if (/mascara/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}mascara`);
      addKw('waterproof mascara');
      addKw('volumizing mascara');
      addAlias('lash mascara');
      addAlias('eye lash mascara');
    }
    if (/eyeshadow/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}eyeshadow`);
      addKw('eyeshadow palette');
      addAlias('eye shadow');
      addAlias('eye palette');
    }
  }

  // D. Compact & Powder & Blush
  if (/compact|powder|blush|highlighter/i.test(normText)) {
    if (/compact|powder/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}compact`);
      addKw('setting powder');
      addKw('oil control compact');
      addAlias('pressed powder');
      addAlias('face powder');
      addAlias('loose powder');
    }
    if (/blush|highlighter/i.test(normText)) {
      addKw('cheek blush');
      addKw('face highlighter');
      addAlias('blusher');
      addAlias('cheek tint');
      addAlias('glow illuminator');
    }
  }

  // E. Hair Care (Shampoo, Conditioner, Oil, Serum)
  if (/hair|shampoo|conditioner|hair oil|hair mask/i.test(normText)) {
    if (/shampoo/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}shampoo`);
      addKw('anti dandruff shampoo');
      addKw('hair fall shampoo');
      addKw('hair cleanser');
      addAlias('hair wash');
      addAlias('shampo');
    }
    if (/conditioner/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}conditioner`);
      addKw('smooth hair conditioner');
      addAlias('hair cream');
    }
    if (/hair oil/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}hair oil`);
      addKw('nourishing hair oil');
      addAlias('scalp oil');
    }
  }

  // F. Skincare (Serum, Moisturizer, Face Wash, Sunscreen)
  if (/skin|serum|cream|moisturizer|face wash|sunscreen|cleanser/i.test(normText)) {
    if (/serum/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}face serum`);
      addKw('skin glow serum');
      addKw('hydrating serum');
      addAlias('face drops');
      addAlias('skin serum');
      addAlias('ampoule');
    }
    if (/sunscreen|sunblock|spf/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}sunscreen`);
      addKw('spf 50 sunscreen');
      addKw('uv protection');
      addAlias('sunblock');
      addAlias('sun screen');
      addAlias('sun protection');
    }
    if (/face wash|cleanser/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}face wash`);
      addKw('gentle face cleanser');
      addAlias('cleanser');
      addAlias('facewash');
      addAlias('face soap');
    }
    if (/moisturizer|cream/i.test(normText)) {
      addKw(`${brand ? brand + ' ' : ''}moisturizer`);
      addKw('hydrating face cream');
      addAlias('moisturiser');
      addAlias('face cream');
      addAlias('day cream');
    }
  }

  // G. Perfumes & Fragrance
  if (/perfume|fragrance|mist|deodorant|edp|edt/i.test(normText)) {
    addKw(`${brand ? brand + ' ' : ''}perfume`);
    addKw('long lasting fragrance');
    addKw('eau de parfum');
    addAlias('scent');
    addAlias('body spray');
    addAlias('body mist');
    addAlias('attar');
  }

  // 4. Variant / Shade Specific Keywords
  const allVars = variants && variants.length > 0 ? variants : (product.shades || product.variants || []);
  allVars.forEach(v => {
    if (v.name) {
      addKw(v.name);
      if (brand) addKw(`${brand} ${v.name}`);
      if (subcategory) addKw(`${v.name} ${subcategory}`);
    }
    if (v.code) addKw(v.code);
    if (v.sku) addKw(v.sku);
    if (v.attributes && typeof v.attributes === 'object') {
      Object.entries(v.attributes).forEach(([attrKey, attrVal]) => {
        if (attrVal) {
          addKw(`${attrVal} ${subcategory || 'product'}`);
          if (attrKey.toLowerCase().includes('shade') || attrKey.toLowerCase().includes('colour')) {
            addAlias(`${attrVal} shade`);
          }
        }
      });
    }
  });

  return {
    keywords: Array.from(keywordsSet),
    aliases: Array.from(aliasesSet)
  };
};

/**
 * Performs deep matching of a query against a product and its variants.
 * Returns match status, relevance score, matched fields breakdown, and matched variants.
 */
export const matchProductSearch = (product, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return {
      isMatch: true,
      score: 1,
      matchedFields: [],
      matchedVariants: []
    };
  }

  const rawQuery = searchQuery.trim().toLowerCase();
  const normalizedQuery = normalizeSearchTerm(rawQuery);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);

  const matchedFieldsSet = new Set();
  const matchedVariants = [];
  let score = 0;

  const checkField = (fieldValue, fieldLabel, weight = 10) => {
    if (!fieldValue) return false;
    const str = normalizeSearchTerm(String(fieldValue));
    if (!str) return false;

    // Exact full match
    if (str === normalizedQuery) {
      matchedFieldsSet.add(fieldLabel);
      score += weight * 4;
      return true;
    }

    // Contains full normalized query
    if (str.includes(normalizedQuery)) {
      matchedFieldsSet.add(fieldLabel);
      score += weight * 2.5;
      return true;
    }

    // Token match: all tokens present
    const allTokensMatch = queryTokens.length > 1 && queryTokens.every(tok => str.includes(tok));
    if (allTokensMatch) {
      matchedFieldsSet.add(fieldLabel);
      score += weight * 2;
      return true;
    }

    // Partial token match
    const tokenMatches = queryTokens.filter(tok => str.includes(tok));
    if (tokenMatches.length > 0) {
      matchedFieldsSet.add(fieldLabel);
      score += weight * (tokenMatches.length / queryTokens.length);
      return true;
    }

    return false;
  };

  const checkArrayField = (arr, fieldLabel, weight = 10) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    let found = false;
    for (const item of arr) {
      const itemStr = typeof item === 'object' ? (item.name || item.text || item.value || '') : String(item);
      if (checkField(itemStr, fieldLabel, weight)) {
        found = true;
      }
    }
    return found;
  };

  // 1. HIGHEST WEIGHT: Admin-entered Search Keywords
  checkArrayField(product.searchKeywords || product.search_keywords || product.keywords, 'Keywords', 30);

  // 2. Search Aliases (Customer Language & Spellings)
  checkArrayField(product.searchAliases || product.search_aliases || product.aliases, 'Search Aliases', 25);

  // 3. Product Name & Product Family
  checkField(product.name, 'Product Name', 25);
  checkField(product.productFamily || product.product_family, 'Product Family', 20);
  checkField(product.productType || product.product_type, 'Product Type', 18);
  checkField(product.brandName || product.brand, 'Brand', 20);

  // 4. SKU & Barcode
  checkField(product.sku, 'SKU', 25);
  checkField(product.barcode, 'Barcode', 30);

  // 5. Category & Subcategory
  checkField(product.category, 'Category', 15);
  checkField(product.subcategory, 'Subcategory', 15);

  // 6. Child Products / Variants (CRITICAL: Variant-specific matching)
  const variants = getSafeActiveVariants(product);
  variants.forEach(variant => {
    let variantMatched = false;
    const vName = variant.title || variant.name || '';
    const vCode = variant.code || '';
    const vSku = variant.sku || '';
    const vBarcode = variant.barcode || '';

    if (checkField(vName, 'Variant Name', 25)) variantMatched = true;
    if (checkField(vCode, 'Shade Code', 20)) variantMatched = true;
    if (checkField(vSku, 'Variant SKU', 25)) variantMatched = true;
    if (checkField(vBarcode, 'Variant Barcode', 30)) variantMatched = true;

    // Variant-specific keywords
    if (checkArrayField(variant.keywords, 'Variant Keywords', 25)) variantMatched = true;

    // Attributes inside variant (e.g. shade, finish, size, colourFamily)
    if (variant.attributes && typeof variant.attributes === 'object') {
      Object.entries(variant.attributes).forEach(([attrKey, attrVal]) => {
        if (checkField(attrVal, `Attribute: ${attrKey}`, 15)) variantMatched = true;
      });
    }

    if (variantMatched) {
      matchedVariants.push(variant);
    }
  });

  // 7. Specifications (Finish, Formulation, Coverage, Colour Family, etc.)
  const specs = product.specifications || {};
  checkField(specs.finish || product.finish, 'Finish', 14);
  checkField(specs.formulation || product.formulation, 'Formulation', 14);
  checkField(specs.coverage || product.coverage, 'Coverage', 14);
  checkField(specs.colourFamily || product.colourFamily, 'Colour Family', 15);
  checkField(specs.texture, 'Texture', 12);
  checkField(specs.skinType, 'Skin Type', 12);
  checkField(specs.hairType, 'Hair Type', 12);

  // 8. Key Points, Benefits & Highlights
  checkArrayField(product.keyPoints || product.key_points, 'Key Points', 15);
  checkArrayField(product.benefits, 'Benefits', 16);
  checkArrayField(product.highlights, 'Highlights', 12);

  // 9. Hero Ingredients
  if (product.ingredients?.keyIngredients) {
    checkArrayField(product.ingredients.keyIngredients, 'Key Ingredients', 14);
  }

  // 10. Check alias expansion (e.g. query is 'lippie', expand to 'lipstick')
  for (const [aliasWord, mappedTerms] of Object.entries(SEARCH_ALIASES_MAP)) {
    if (rawQuery.includes(aliasWord)) {
      mappedTerms.forEach(term => {
        if (checkField(product.name, 'Alias: ' + term, 15)) {
          matchedFieldsSet.add('Customer Language Alias (' + aliasWord + ')');
        }
        if (checkField(product.category, 'Alias: ' + term, 12)) {
          matchedFieldsSet.add('Customer Language Alias (' + aliasWord + ')');
        }
      });
    }
  }

  const isMatch = matchedFieldsSet.size > 0;

  return {
    isMatch,
    score,
    matchedFields: Array.from(matchedFieldsSet),
    matchedVariants
  };
};

/**
 * Extracts active and sellable variants from either p.variants or p.shades
 */
export const getSafeActiveVariants = (p) => {
  if (!p) return [];
  const list = [];

  let rawVariants = p.variants;
  if (typeof rawVariants === 'string') {
    try { rawVariants = JSON.parse(rawVariants); } catch (e) { rawVariants = []; }
  }
  if (Array.isArray(rawVariants) && rawVariants.length > 0) {
    rawVariants.forEach((v, idx) => {
      if (v && v.active !== false && v.isSellable !== false && !v.isDeleted) {
        list.push({ ...v, _source: 'variants', _idx: idx });
      }
    });
  }

  if (list.length === 0) {
    let rawShades = p.shades;
    if (typeof rawShades === 'string') {
      try { rawShades = JSON.parse(rawShades); } catch (e) { rawShades = []; }
    }
    if (Array.isArray(rawShades) && rawShades.length > 0) {
      rawShades.forEach((s, idx) => {
        if (s && s.active !== false && !s.isDeleted) {
          list.push({ ...s, _source: 'shades', _idx: idx });
        }
      });
    }
  }

  return list;
};

/**
 * Flattens products into a dual catalog view:
 * Each child variant becomes an individual sellable catalog product
 * linked to its parent product family, without duplicating records.
 */
export const flattenProductsToIndividualVariants = (products = []) => {
  const flattened = [];

  products.forEach(p => {
    if (!p) return;
    const variants = getSafeActiveVariants(p);

    if (variants.length === 0) {
      // Standard single product without variants
      flattened.push({
        ...p,
        isParent: false,
        isVariantChild: false,
        catalogDisplayName: p.name,
        typeLabel: 'Standalone',
        parentProduct: p
      });
    } else {
      // 1. Also include Parent Product Family entry
      flattened.push({
        ...p,
        isParent: true,
        isVariantChild: false,
        catalogDisplayName: p.name,
        variantsCount: variants.length,
        typeLabel: `Product Family · ${variants.length} ${variants.length === 1 ? 'Variant' : 'Variants'}`,
        parentProduct: p
      });

      // 2. Include each Child Variant as an individual sellable product item
      variants.forEach((v, vIdx) => {
        const variantId = v.id || v.sku || `${p.id}_var_${vIdx}`;
        const rawVariantLabel = v.title || v.name || (v.attributes && Object.keys(v.attributes).length > 0
          ? Object.entries(v.attributes).map(([_, val]) => `${val}`).join(' / ')
          : (v.code ? `Shade ${v.code}` : `Variant ${vIdx + 1}`));

        const variantNameClean = String(rawVariantLabel).trim();
        const fullVariantName = variantNameClean.toLowerCase().includes(String(p.name).toLowerCase())
          ? variantNameClean
          : `${p.name} — ${variantNameClean}`;

        const vMrp = Number(v.mrp !== undefined && v.mrp !== '' ? v.mrp : (v.priceOverride !== undefined && v.priceOverride !== '' ? v.priceOverride : (p.mrp || 0)));
        const vOriginalMrp = Number(v.originalMrp !== undefined && v.originalMrp !== '' ? v.originalMrp : (p.originalMrp || vMrp));
        const vGeneralPrice = Number(v.generalPrice !== undefined && v.generalPrice !== '' ? v.generalPrice : (v.general_price !== undefined && v.general_price !== '' ? v.general_price : (p.generalPrice ?? vMrp)));
        const vSalonPrice = Number(v.salonPrice !== undefined && v.salonPrice !== '' ? v.salonPrice : (v.salon_price !== undefined && v.salon_price !== '' ? v.salon_price : (p.salonPrice ?? vGeneralPrice)));
        const vArtistPrice = Number(v.artistPrice !== undefined && v.artistPrice !== '' ? v.artistPrice : (v.artist_price !== undefined && v.artist_price !== '' ? v.artist_price : (p.artistPrice ?? vSalonPrice)));
        const vBeauticianPrice = Number(v.beauticianPrice !== undefined && v.beauticianPrice !== '' ? v.beauticianPrice : (v.beautician_price !== undefined && v.beautician_price !== '' ? v.beautician_price : (p.beauticianPrice ?? vSalonPrice)));
        const vImg = v.imageUrl || v.image || p.imageUrl || p.image;
        const vBarcode = v.barcode || p.barcode || '';
        const vSku = v.sku || (p.sku ? `${p.sku}-${v.code || vIdx + 1}` : undefined);

        flattened.push({
          ...p,
          id: `${p.id}_var_${variantId}`,
          realVariantId: variantId,
          parentProductId: p.id,
          parentName: p.name,
          parentProduct: p,
          isParent: false,
          isVariantChild: true,
          typeLabel: 'Variant',
          catalogDisplayName: fullVariantName,
          name: fullVariantName,
          variantName: variantNameClean,
          variantTitle: variantNameClean,
          variantCode: v.code || '',
          sku: vSku,
          barcode: vBarcode,
          image: vImg,
          imageUrl: vImg,
          images: v.images && Array.isArray(v.images) ? v.images : (vImg ? [vImg] : p.images || []),
          hexColor: v.hexColor || v.hex_color || null,
          mrp: vMrp,
          originalMrp: vOriginalMrp,
          generalPrice: vGeneralPrice,
          salonPrice: vSalonPrice,
          artistPrice: vArtistPrice,
          beauticianPrice: vBeauticianPrice,
          quantityTiers: v.quantityTiers || p.quantityTiers,
          active: v.active !== false,
          isSellable: v.isSellable !== false,
          attributes: v.attributes || (v.hexColor ? { Shade: variantNameClean } : {}),
          keyPoints: [
            ...(p.keyPoints || []),
            ...(variantNameClean ? [`${variantNameClean} Edition`] : [])
          ],
          highlights: [
            ...(p.highlights || []),
            ...(variantNameClean ? [`Features the signature ${variantNameClean} shade/variant.`] : [])
          ],
          benefits: p.benefits || [],
          variantData: {
            ...v,
            name: variantNameClean,
            title: variantNameClean,
            mrp: vMrp,
            originalMrp: vOriginalMrp,
            generalPrice: vGeneralPrice,
            salonPrice: vSalonPrice,
            artistPrice: vArtistPrice,
            beauticianPrice: vBeauticianPrice,
            image: vImg,
            imageUrl: vImg,
            barcode: vBarcode,
            sku: vSku
          }
        });
      });
    }
  });

  return flattened;
};
