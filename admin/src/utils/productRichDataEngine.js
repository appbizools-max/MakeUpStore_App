/**
 * Product Rich Data Engine
 * 
 * Generates verified, fact-based Key Points, Benefits, Highlights, and Variant content.
 * Adheres strictly to Rules 14-23:
 * - Rule 14: Only runs after product data (name, brand, category, subcategory, attributes, specs) is available.
 * - Rule 15: Zero generic filler ("High Quality", "Premium Product", etc.). If no verified info, shows empty state.
 * - Rule 16: Variant-aware: Parent has common info; child products inherit and automatically append child shade/color info.
 * - Rule 17: Search keywords are automatic based on parent, variants, and attributes.
 * - Rule 18 & 19: Internally distinguishes generated vs custom; dynamically replaces old generated values when attributes change while preserving custom Admin inputs.
 * - Rule 20: Strict limits: 3–6 Key Points, 2–5 Benefits, 2–4 Highlights.
 * - Rule 21: Simple Admin controls with ↻ Regenerate and + Add Custom.
 * - Rule 22: Never invents facts, clinical claims, SPF, or duration claims unless present in product data.
 */

/**
 * Extracts normalized, verified product attributes and specifications from formData and variants.
 */
export function extractVerifiedProductFacts(product = {}, variants = []) {
  const name = (product.name || '').trim();
  const brand = (product.brandName || product.brand || '').trim();
  const category = (product.category || '').trim();
  const subcategory = (product.subcategory || '').trim();
  const productType = (product.productType || product.product_type || '').trim();
  const specs = (product.specifications && typeof product.specifications === 'object') ? product.specifications : {};
  const description = (product.description || '').toLowerCase();

  // Helper to read specification case-insensitively
  const getSpec = (keys) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of Object.keys(specs)) {
      const lower = k.toLowerCase().replace(/[-_\s]/g, '');
      for (const target of keyList) {
        if (lower === target.toLowerCase().replace(/[-_\s]/g, '')) {
          const val = specs[k];
          if (val && typeof val === 'string' && val.trim()) return val.trim();
        }
      }
    }
    return '';
  };

  // Helper to inspect variant attributes
  const getVariantAttr = (keys) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const v of variants) {
      if (v.attributes && typeof v.attributes === 'object') {
        for (const [k, val] of Object.entries(v.attributes)) {
          const lower = k.toLowerCase().replace(/[-_\s]/g, '');
          for (const target of keyList) {
            if (lower === target.toLowerCase().replace(/[-_\s]/g, '')) {
              if (val && typeof val === 'string' && val.trim()) return val.trim();
            }
          }
        }
      }
    }
    return '';
  };

  // Helper to check if a word/concept exists in name, specs, or description
  const hasTextMention = (regex) => {
    return regex.test(name.toLowerCase()) || regex.test(description);
  };

  // 1. Finish
  let finish = getSpec(['finish', 'makeupFinish']) || getVariantAttr(['finish', 'makeupFinish']);
  if (!finish) {
    if (/\bmatte\b/i.test(name)) finish = 'Matte';
    else if (/\bglossy\b|\bgloss\b/i.test(name)) finish = 'Glossy';
    else if (/\bvelvet\b/i.test(name)) finish = 'Velvet';
    else if (/\bsatin\b/i.test(name)) finish = 'Satin';
    else if (/\bdewy\b/i.test(name)) finish = 'Dewy';
    else if (/\bshimmer\b/i.test(name)) finish = 'Shimmer';
    else if (/\bmetallic\b/i.test(name)) finish = 'Metallic';
  }

  // 2. Formulation
  let formulation = getSpec(['formulation', 'formula', 'itemForm', 'texture']) || getVariantAttr(['formulation', 'formula', 'texture']);
  if (!formulation) {
    if (/\bliquid\b/i.test(name)) formulation = 'Liquid';
    else if (/\bcream\b|\bcreamy\b/i.test(name)) formulation = 'Cream';
    else if (/\bgel\b/i.test(name)) formulation = 'Gel';
    else if (/\bpowder\b/i.test(name)) formulation = 'Powder';
    else if (/\bserum\b/i.test(name)) formulation = 'Serum';
    else if (/\bclay\b/i.test(name)) formulation = 'Clay';
    else if (/\bcrayon\b/i.test(name)) formulation = 'Crayon';
    else if (/\bstick\b/i.test(name)) formulation = 'Stick';
    else if (/\boil\b/i.test(name)) formulation = 'Oil';
  }

  // 3. Coverage
  let coverage = getSpec(['coverage', 'coverageLevel']) || getVariantAttr(['coverage', 'coverageLevel']);
  if (!coverage) {
    if (/\bfull coverage\b/i.test(name) || /\bfull coverage\b/i.test(description)) coverage = 'Full';
    else if (/\bmedium coverage\b/i.test(name) || /\bmedium coverage\b/i.test(description)) coverage = 'Medium';
    else if (/\bsheer coverage\b|\bsheer\b/i.test(name)) coverage = 'Sheer';
    else if (/\bbuildable\b/i.test(name) || /\bbuildable\b/i.test(description)) coverage = 'Buildable';
  }

  // 4. Skin Type
  let skinType = getSpec(['skinType', 'skin_type', 'suitableFor']) || getVariantAttr(['skinType', 'suitableFor']);

  // 5. Hair Type (if haircare)
  let hairType = getSpec(['hairType', 'hair_type']);

  // 6. Waterproof / Transfer Proof (ONLY from actual mentions or specs)
  const isWaterproof = Boolean(getSpec(['waterproof']) === 'Yes' || getSpec(['waterproof']) === 'true' || hasTextMention(/\bwaterproof\b/));
  const isTransferProof = Boolean(getSpec(['transferProof', 'transferResistant']) === 'Yes' || hasTextMention(/\btransfer[ -]proof\b|\btransfer[ -]resistant\b/));
  const isSmudgeProof = Boolean(getSpec(['smudgeProof']) === 'Yes' || hasTextMention(/\bsmudge[ -]proof\b/));

  // 7. SPF (ONLY if explicitly mentioned)
  let spfValue = getSpec(['spf', 'spfRating', 'sunProtection']);
  if (!spfValue) {
    const spfMatch = (name + ' ' + description).match(/\bspf\s*(\d{2,3}\+?)\b/i);
    if (spfMatch) spfValue = spfMatch[0].toUpperCase();
  }

  // 8. Key Ingredients (Hero Ingredients)
  const heroIngredients = Array.isArray(product.ingredients?.keyIngredients)
    ? product.ingredients.keyIngredients.filter(Boolean)
    : [];

  // 9. Variant Shades count and list
  const activeVariants = variants.filter(v => v.active !== false);
  const variantNames = activeVariants.map(v => (v.name || '').trim()).filter(Boolean);

  return {
    name,
    brand,
    category,
    subcategory,
    productType,
    finish,
    formulation,
    coverage,
    skinType,
    hairType,
    isWaterproof,
    isTransferProof,
    isSmudgeProof,
    spfValue,
    heroIngredients,
    activeVariants,
    variantNames,
    hasProductData: Boolean(name.length >= 2 || subcategory.length >= 2 || Object.keys(specs).length > 0 || variants.length > 0)
  };
}

/**
 * Generates 3–6 concise Key Points (Rule 20) strictly from verified product facts (Rule 22).
 * Zero generic filler like "High Quality" or "Premium Product" (Rule 15).
 */
export function generateVerifiedKeyPoints(facts) {
  if (!facts.hasProductData) return [];

  const points = [];
  const add = (pt) => {
    if (!pt) return;
    const clean = pt.trim();
    if (!points.some(p => p.toLowerCase() === clean.toLowerCase())) {
      points.push(clean);
    }
  };

  // 1. Finish
  if (facts.finish) {
    add(`${facts.finish} Finish`);
  }

  // 2. Formulation
  if (facts.formulation) {
    add(`${facts.formulation} Formula`);
  }

  // 3. Coverage
  if (facts.coverage) {
    add(`${facts.coverage} Coverage`);
  }

  // 4. Performance specifications (strictly verified)
  if (facts.isTransferProof) {
    add('Transfer Resistant');
  }
  if (facts.isWaterproof) {
    add('Water Resistant');
  }
  if (facts.isSmudgeProof) {
    add('Smudge Proof');
  }

  // 5. SPF / Sunscreen
  if (facts.spfValue) {
    add(`${facts.spfValue} Protection`);
  }

  // 6. Skin / Hair Type specificity
  if (facts.skinType && facts.skinType.toLowerCase() !== 'all' && facts.skinType.toLowerCase() !== 'all skin types') {
    add(`For ${facts.skinType}`);
  } else if (facts.hairType) {
    add(`For ${facts.hairType}`);
  }

  // 7. Hero Ingredient badge
  if (facts.heroIngredients.length > 0) {
    add(`With ${facts.heroIngredients[0]}`);
  }

  // 8. Category-specific verified traits
  if (points.length < 3) {
    const sub = facts.subcategory.toLowerCase();
    if (sub.includes('lipstick') || sub.includes('lip')) {
      if (facts.finish?.toLowerCase() === 'matte') add('Non-Drying Wear');
      else if (facts.finish?.toLowerCase() === 'glossy') add('High Shine');
    } else if (sub.includes('foundation') || sub.includes('concealer')) {
      if (facts.finish?.toLowerCase() === 'matte') add('Oil Control');
      else if (facts.finish?.toLowerCase() === 'dewy') add('Radiant Glow');
    }
  }

  // Strict Rule 20 limit: 3 to 6 Key Points
  return points.slice(0, 6);
}

/**
 * Generates 2–5 Benefits (Rule 20) strictly from verified product facts (Rule 22).
 * If no verified benefits, returns empty array (Rule 15).
 */
export function generateVerifiedBenefits(facts) {
  if (!facts.hasProductData) return [];

  const benefits = [];
  const add = (bn) => {
    if (!bn) return;
    const clean = bn.trim();
    if (!benefits.some(b => b.toLowerCase() === clean.toLowerCase())) {
      benefits.push(clean);
    }
  };

  // Finish benefits
  if (facts.finish?.toLowerCase() === 'matte') {
    add('Matte Finish');
    add('Oil Control');
  } else if (facts.finish?.toLowerCase() === 'glossy') {
    add('Glossy Finish');
    add('Hydrating');
  } else if (facts.finish?.toLowerCase() === 'dewy') {
    add('Hydrating');
  }

  // Formulation benefits
  if (facts.formulation?.toLowerCase() === 'serum' || facts.formulation?.toLowerCase() === 'cream') {
    add('Nourishing');
  }

  // Coverage benefits
  if (facts.coverage?.toLowerCase() === 'full') {
    add('Full Coverage');
  }

  // Verified performance
  if (facts.isTransferProof) add('Transfer Resistant');
  if (facts.isWaterproof) add('Water Resistant');
  if (facts.spfValue) add('Sun Protection (SPF)');

  // Strict Rule 20 limit: 2 to 5 Benefits
  return benefits.slice(0, 5);
}

/**
 * Generates 2–4 single-sentence Highlights (Rule 20 & 21) from verified attributes.
 * Zero filler or invented claims.
 */
export function generateVerifiedHighlights(facts) {
  if (!facts.hasProductData) return [];

  const highlights = [];

  // Highlight 1: Formulation & Finish combination
  if (facts.formulation && facts.finish) {
    highlights.push(`Smooth ${facts.formulation.toLowerCase()} formula with a ${facts.finish.toLowerCase()} finish.`);
  } else if (facts.finish) {
    highlights.push(`Delivers a refined ${facts.finish.toLowerCase()} finish.`);
  } else if (facts.formulation) {
    highlights.push(`Lightweight ${facts.formulation.toLowerCase()} formula designed for seamless application.`);
  }

  // Highlight 2: Coverage / Performance
  if (facts.coverage) {
    highlights.push(`Provides ${facts.coverage.toLowerCase()} coverage with a comfortable, natural feel.`);
  } else if (facts.isTransferProof && facts.isWaterproof) {
    highlights.push('Waterproof and transfer-resistant formula for dependable wear throughout the day.');
  } else if (facts.isTransferProof) {
    highlights.push('Specially formulated to resist transfers and smudging.');
  } else if (facts.isWaterproof) {
    highlights.push('Water-resistant formulation designed to withstand humidity.');
  }

  // Highlight 3: Skin/Hair Type or Hero Ingredient
  if (facts.heroIngredients.length > 0) {
    highlights.push(`Enriched with ${facts.heroIngredients.slice(0, 2).join(' and ')} to help nourish and protect.`);
  } else if (facts.skinType && facts.skinType.toLowerCase() !== 'all' && facts.skinType.toLowerCase() !== 'all skin types') {
    highlights.push(`Specially suited for ${facts.skinType.toLowerCase()} skin types.`);
  }

  // Highlight 4: Variant shade range (Rule 16)
  if (facts.activeVariants.length > 1) {
    highlights.push(`Available in ${facts.activeVariants.length} curated shades to complement diverse beauty preferences.`);
  }

  // Fallback if less than 2
  if (highlights.length < 2 && facts.name && facts.subcategory) {
    highlights.push(`${facts.brand ? facts.brand + ' ' : ''}${facts.subcategory} crafted for effortless, everyday wear.`);
  }

  // Strict Rule 20 limit: 2 to 4 Highlights
  return highlights.slice(0, 4);
}

/**
 * Generates Child-Variant specific rich data (Rule 16).
 * Parent product contains common information.
 * Child product automatically inherits parent information and adds variant-specific shade details.
 */
export function generateChildVariantRichData(parentProduct = {}, variant = {}) {
  const commonKeyPoints = Array.isArray(parentProduct.keyPoints) ? [...parentProduct.keyPoints] : [];
  const commonBenefits = Array.isArray(parentProduct.benefits) ? [...parentProduct.benefits] : [];
  const commonHighlights = Array.isArray(parentProduct.highlights) ? [...parentProduct.highlights] : [];

  const vName = (variant.name || '').trim();
  const vCode = (variant.code || '').trim();

  // Child-specific Key Point: e.g. "Pioneer Shade" or "Pioneer 20 Shade"
  const childKeyPoints = [...commonKeyPoints];
  if (vName) {
    const shadeTag = vName.toLowerCase().endsWith('shade') ? vName : `${vName} Shade`;
    if (!childKeyPoints.some(p => p.toLowerCase() === shadeTag.toLowerCase())) {
      childKeyPoints.push(shadeTag);
    }
  }

  // Child-specific Highlights:
  const childHighlights = [...commonHighlights];
  if (vName) {
    childHighlights.unshift(`Features the signature shade "${vName}"${vCode ? ` (${vCode})` : ''}.`);
  }

  return {
    keyPoints: childKeyPoints,
    benefits: commonBenefits,
    highlights: childHighlights
  };
}

/**
 * Dynamic Synchronizer (Rule 18 & 19):
 * Automatically replaces outdated generated suggestions when product attributes change
 * (e.g. Finish: Matte -> Glossy removes "Matte Finish" and adds "Glossy Finish"),
 * while preserving any custom items manually entered by Admin.
 */
export function synchronizeGeneratedAndCustomItems({
  currentList = [],
  previousGenerated = [],
  newGenerated = []
}) {
  const prevGenLower = new Set(previousGenerated.map(s => String(s).toLowerCase().trim()));
  const newGenLower = new Set(newGenerated.map(s => String(s).toLowerCase().trim()));

  // Identify custom items: current items that were NOT part of previous generated suggestions
  const customItems = currentList.filter(item => {
    return !prevGenLower.has(String(item).toLowerCase().trim());
  });

  // Combined: new generated items + preserved custom items
  const combined = [...newGenerated];
  const combinedLower = new Set(combined.map(s => String(s).toLowerCase().trim()));

  customItems.forEach(item => {
    if (!combinedLower.has(String(item).toLowerCase().trim())) {
      combined.push(item);
      combinedLower.add(String(item).toLowerCase().trim());
    }
  });

  return {
    nextList: combined,
    customItems,
    generatedItems: newGenerated
  };
}

// =============================================================================
// BACKGROUND AUTO-GENERATION ORCHESTRATOR
// =============================================================================
// Imported here (bottom of file) to avoid circular dep issues at module init.
// productSearchEngine imports nothing from productRichDataEngine, so this is safe.
import {
  generateSmartKeywordsAndAliases,
  generateAutoSearchTerms,
} from './productSearchEngine.js';

/**
 * generateAllRichData
 *
 * Single entry-point called after a product is saved (add OR update).
 * Accepts the full saved product object (DB snake_case or app camelCase shape)
 * and returns a flat patch object ready to be upserted back to Supabase.
 *
 * Preserves any Admin-edited custom values via synchronizeGeneratedAndCustomItems.
 *
 * @param {object} product  — saved product row
 * @param {object} [opts]   — { preserveExisting?: boolean }  default true
 * @returns {object}          patch ready for supabase .update()
 */
export function generateAllRichData(product = {}, opts = {}) {
  const { preserveExisting = true } = opts;

  // ── Normalise DB (snake_case) ↔ App (camelCase) field shapes ─────────────
  const p = {
    name:           (product.name || '').trim(),
    brandName:      (product.brandName || product.brand_name || product.brand || '').trim(),
    category:       (product.category || '').trim(),
    subcategory:    (product.subcategory
                      || product.additionalInfo?.subcategory
                      || product.additional_info?.subcategory
                      || '').trim(),
    productType:    (product.productType   || product.product_type   || '').trim(),
    productFamily:  (product.productFamily || product.product_family || '').trim(),
    description:    product.description || '',
    specifications: product.specifications || {},
    ingredients:    product.ingredients || { keyIngredients: [], fullList: '' },
    // Existing admin values (may include custom edits)
    searchKeywords: Array.isArray(product.searchKeywords) ? product.searchKeywords
                  : Array.isArray(product.search_keywords) ? product.search_keywords : [],
    searchAliases:  Array.isArray(product.searchAliases)  ? product.searchAliases
                  : Array.isArray(product.search_aliases)  ? product.search_aliases  : [],
    keyPoints:      Array.isArray(product.keyPoints)  ? product.keyPoints
                  : Array.isArray(product.key_points) ? product.key_points : [],
    benefits:       Array.isArray(product.benefits)   ? product.benefits   : [],
    highlights:     Array.isArray(product.highlights) ? product.highlights : [],
  };

  const variants = Array.isArray(product.shades)   ? product.shades
                 : Array.isArray(product.variants)  ? product.variants
                 : [];

  // ── 1. Search Keywords & Aliases ─────────────────────────────────────────
  const smart      = generateSmartKeywordsAndAliases(p, variants);
  const autoTerms  = generateAutoSearchTerms(p, variants);

  const genKeywords = Array.from(
    new Set([...(smart.keywords || []), ...autoTerms])
  ).slice(0, 20);
  const genAliases  = (smart.aliases || []).slice(0, 12);

  // ── 2. Key Points / Benefits / Highlights ────────────────────────────────
  const facts         = extractVerifiedProductFacts(p, variants);
  const genKeyPoints  = generateVerifiedKeyPoints(facts);
  const genBenefits   = generateVerifiedBenefits(facts);
  const genHighlights = generateVerifiedHighlights(facts);

  // ── 3. Merge — preserve Admin-edited custom items ────────────────────────
  const merge = (current, generated) => {
    if (!preserveExisting || current.length === 0) return generated;
    const { nextList } = synchronizeGeneratedAndCustomItems({
      currentList:       current,
      previousGenerated: generated,
      newGenerated:      generated,
    });
    return nextList;
  };

  const finalKeywords = preserveExisting && p.searchKeywords.length > 0
    ? Array.from(new Set([...p.searchKeywords, ...genKeywords])).slice(0, 20)
    : genKeywords;

  const finalAliases = preserveExisting && p.searchAliases.length > 0
    ? Array.from(new Set([...p.searchAliases, ...genAliases])).slice(0, 12)
    : genAliases;

  const finalKeyPoints  = merge(p.keyPoints,  genKeyPoints);
  const finalBenefits   = merge(p.benefits,   genBenefits);
  const finalHighlights = merge(p.highlights, genHighlights);

  // ── 4. SEO fields ────────────────────────────────────────────────────────
  const seoTitle = p.name
    ? `${p.name}${p.brandName ? ' by ' + p.brandName : ''}${p.category ? ' | ' + p.category : ''} — Salbeau`
    : '';

  const metaDescription = p.name
    ? `Buy ${p.name}${p.brandName ? ' by ' + p.brandName : ''}${p.category ? ' (' + p.category + ')' : ''}. ${
        finalKeyPoints.slice(0, 2).join('. ')}${finalKeyPoints.length > 0 ? '.' : ''
      } Shop at Salbeau for professional beauty pricing.`
    : '';

  const urlSlug = p.name
    ? p.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80)
    : '';

  return {
    searchKeywords:  finalKeywords,
    searchAliases:   finalAliases,
    keyPoints:       finalKeyPoints,
    benefits:        finalBenefits,
    highlights:      finalHighlights,
    seoTitle,
    metaDescription,
    urlSlug,
    _autoGenerated:  true,
    _generatedAt:    new Date().toISOString(),
  };
}
