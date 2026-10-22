/**
 * Product Description Auto-Generator
 * 
 * Generates natural, professional product descriptions based on:
 * - Product Name
 * - Brand Name
 * - Category & Subcategory
 * - Product Specifications
 * - Ingredients (if available)
 * - Other product details
 */

/**
 * Category-specific templates for product descriptions
 */
const DESCRIPTION_TEMPLATES = {
  // Makeup - Lip Products
  lipstick: (data) => {
    const { name, brand, subcategory } = data;
    const finish = extractFinish(data);
    const coverage = extractCoverage(data);
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${finish ? finish + ' ' : ''}${subcategory || 'lipstick'} that delivers ${coverage ? coverage + ' coverage with ' : ''}stunning color payoff. ${benefits ? benefits + ' ' : ''}Perfect for creating a bold, beautiful lip look that lasts all day.`;
  },

  lipGloss: (data) => {
    const { name, brand, subcategory } = data;
    const finish = extractFinish(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${finish ? finish + ' ' : ''}${subcategory || 'lip gloss'} that adds instant shine and dimension to your lips. The lightweight formula glides on smoothly, delivering a luxurious, glass-like finish without stickiness.`;
  },

  // Makeup - Face Products
  foundation: (data) => {
    const { name, brand, subcategory } = data;
    const coverage = extractCoverage(data);
    const finish = extractFinish(data);
    const skinType = extractSkinType(data);
    const spf = extractSPF(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${coverage ? coverage + ' coverage ' : ''}${subcategory || 'foundation'} that creates a ${finish ? finish : 'flawless'} complexion. ${skinType ? 'Suitable for ' + skinType + ', ' : ''}this formula blends seamlessly into skin for a natural, second-skin finish${spf ? ' with ' + spf + ' sun protection' : ''}. Buildable and long-lasting for all-day wear.`;
  },

  concealer: (data) => {
    const { name, brand, subcategory } = data;
    const coverage = extractCoverage(data);
    const finish = extractFinish(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${coverage ? coverage + ' coverage ' : ''}${subcategory || 'concealer'} designed to instantly hide imperfections, dark circles, and blemishes. The ${finish ? finish : 'creamy'} formula blends effortlessly and stays crease-free all day.`;
  },

  compact: (data) => {
    const { name, brand, subcategory } = data;
    const coverage = extractCoverage(data);
    const finish = extractFinish(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${coverage ? coverage + ' coverage ' : ''}${subcategory || 'compact powder'} that sets makeup and controls shine. The ${finish ? finish : 'smooth'} powder formula provides a flawless, airbrushed finish while keeping skin looking fresh and natural all day.`;
  },

  blush: (data) => {
    const { name, brand, subcategory } = data;
    const finish = extractFinish(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${finish ? finish + ' ' : ''}${subcategory || 'blush'} that adds a natural flush of color to cheeks. The silky, blendable formula delivers buildable color payoff and a healthy, radiant glow that lasts for hours.`;
  },

  // Makeup - Eye Products
  eyeshadow: (data) => {
    const { name, brand, subcategory } = data;
    const finish = extractFinish(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${finish ? finish + ' ' : ''}${subcategory || 'eyeshadow'} that delivers rich, pigmented color in one swipe. The velvety formula blends seamlessly and stays vibrant all day without creasing or fading.`;
  },

  eyeliner: (data) => {
    const { name, brand, subcategory } = data;
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a precision ${subcategory || 'eyeliner'} that glides on smoothly for defined, dramatic eyes. ${benefits ? benefits + ' ' : ''}Perfect for creating sharp wings or subtle definition that lasts all day.`;
  },

  mascara: (data) => {
    const { name, brand, subcategory } = data;
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${subcategory || 'mascara'} that delivers instant volume and length to lashes. ${benefits ? benefits + ' ' : ''}The specially designed brush coats every lash from root to tip for a dramatic, clump-free finish.`;
  },

  // Skincare
  serum: (data) => {
    const { name, brand, subcategory } = data;
    const ingredients = extractKeyIngredients(data);
    const skinConcern = extractSkinConcern(data);
    const skinType = extractSkinType(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a concentrated ${subcategory || 'face serum'} ${ingredients ? 'enriched with ' + ingredients : 'formulated with powerful active ingredients'}${skinConcern ? ' to target ' + skinConcern : ''}. ${skinType ? 'Suitable for ' + skinType + ', ' : ''}this lightweight formula absorbs quickly and delivers visible results for healthier, more radiant skin.`;
  },

  moisturizer: (data) => {
    const { name, brand, subcategory } = data;
    const skinType = extractSkinType(data);
    const spf = extractSPF(data);
    const texture = extractTexture(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${texture ? texture : 'nourishing'} ${subcategory || 'moisturizer'} that deeply hydrates and softens skin. ${skinType ? 'Specially formulated for ' + skinType + ', ' : ''}this rich formula locks in moisture and strengthens the skin barrier${spf ? ', with ' + spf + ' sun protection' : ''} for a healthy, supple complexion.`;
  },

  faceWash: (data) => {
    const { name, brand, subcategory } = data;
    const skinType = extractSkinType(data);
    const skinConcern = extractSkinConcern(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a gentle ${subcategory || 'face wash'} that effectively cleanses and purifies skin without stripping away natural moisture. ${skinType ? 'Perfect for ' + skinType + ', ' : ''}${skinConcern ? 'this formula helps with ' + skinConcern + ' while ' : 'it '}leaving skin feeling fresh, soft, and balanced.`;
  },

  sunscreen: (data) => {
    const { name, brand, subcategory } = data;
    const spf = extractSPF(data);
    const finish = extractFinish(data);
    const skinType = extractSkinType(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a broad-spectrum ${subcategory || 'sunscreen'} that provides ${spf || 'powerful sun'} protection against harmful UVA and UVB rays. ${skinType ? 'Suitable for ' + skinType + ', ' : ''}the ${finish ? finish : 'lightweight'} formula absorbs quickly without leaving a white cast, making it perfect for daily use.`;
  },

  // Hair Care
  shampoo: (data) => {
    const { name, brand, subcategory } = data;
    const hairType = extractHairType(data);
    const hairConcern = extractHairConcern(data);
    const fragrance = extractFragrance(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${subcategory || 'shampoo'} ${hairType ? 'specially formulated for ' + hairType : 'designed to cleanse and nourish hair'}${hairConcern ? ', targeting ' + hairConcern : ''}. ${fragrance ? 'Infused with ' + fragrance + ', ' : ''}This gentle formula cleanses thoroughly while maintaining hair's natural moisture balance, leaving it soft, shiny, and healthy.`;
  },

  conditioner: (data) => {
    const { name, brand, subcategory } = data;
    const hairType = extractHairType(data);
    const hairConcern = extractHairConcern(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a nourishing ${subcategory || 'conditioner'} that deeply moisturizes and detangles hair. ${hairType ? 'Perfect for ' + hairType + ', ' : ''}${hairConcern ? 'this formula helps with ' + hairConcern + ' while ' : 'it '}leaving hair silky smooth, manageable, and beautifully soft.`;
  },

  hairOil: (data) => {
    const { name, brand, subcategory } = data;
    const hairConcern = extractHairConcern(data);
    const ingredients = extractKeyIngredients(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a nourishing ${subcategory || 'hair oil'} ${ingredients ? 'enriched with ' + ingredients : 'packed with natural ingredients'} to strengthen and revitalize hair${hairConcern ? ', targeting ' + hairConcern : ''}. This lightweight oil penetrates deeply to repair damage, reduce frizz, and add brilliant shine without weighing hair down.`;
  },

  hairColor: (data) => {
    const { name, brand, subcategory } = data;
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a professional ${subcategory || 'hair color'} that delivers vibrant, long-lasting color with full gray coverage. ${benefits ? benefits + ' ' : ''}The ammonia-free formula nourishes hair while coloring, leaving it soft, shiny, and healthy-looking.`;
  },

  // Fragrance
  perfume: (data) => {
    const { name, brand, subcategory } = data;
    const fragranceFamily = extractFragranceFamily(data);
    const concentration = extractConcentration(data);
    const notes = extractFragranceNotes(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a captivating ${concentration ? concentration + ' ' : ''}${subcategory || 'perfume'} ${fragranceFamily ? 'from the ' + fragranceFamily + ' family ' : ''}that enchants the senses. ${notes ? notes + ' ' : ''}This sophisticated fragrance is perfect for any occasion, offering long-lasting scent that evolves beautifully throughout the day.`;
  },

  deodorant: (data) => {
    const { name, brand, subcategory } = data;
    const fragrance = extractFragrance(data);
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${subcategory || 'deodorant'} that provides all-day freshness and protection. ${fragrance ? 'With a ' + fragrance + ' scent, ' : ''}${benefits ? benefits + ' ' : ''}This gentle formula keeps you feeling confident and fresh from morning to night.`;
  },

  // Nail Care
  nailPolish: (data) => {
    const { name, brand, subcategory } = data;
    const finish = extractFinish(data);
    const benefits = extractBenefits(data);
    
    return `${brand ? brand + ' ' : ''}${name} is a ${finish ? finish + ' ' : ''}${subcategory || 'nail polish'} that delivers vibrant, salon-quality color. ${benefits ? benefits + ' ' : ''}The smooth, chip-resistant formula glides on evenly for a flawless manicure that lasts for days.`;
  },
};

/**
 * Extract finish type from product data
 */
function extractFinish(data) {
  const { specs = {}, description = '' } = data;
  const finishPattern = /\b(matte|satin|glossy|dewy|natural|radiant|shimmer|metallic|glitter|cream|velvet)\b/i;
  
  if (specs.finish) return specs.finish.toLowerCase();
  
  const match = description.match(finishPattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract coverage level from product data
 */
function extractCoverage(data) {
  const { specs = {}, description = '' } = data;
  const coveragePattern = /\b(sheer|light|medium|full|buildable|heavy)\s+coverage\b/i;
  
  if (specs.coverage) return specs.coverage.toLowerCase();
  
  const match = description.match(coveragePattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract skin type from product data
 */
function extractSkinType(data) {
  const { specs = {}, description = '' } = data;
  const skinTypePattern = /\b(all skin types?|normal|dry|oily|combination|sensitive|acne-prone)\b/i;
  
  if (specs.skinType) return specs.skinType.toLowerCase();
  
  const match = description.match(skinTypePattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract skin concern from product data
 */
function extractSkinConcern(data) {
  const { specs = {}, description = '' } = data;
  const concernPattern = /\b(acne|aging|wrinkles|dark spots?|pigmentation|dryness|dehydration|dullness|pores?|redness|sensitivity)\b/i;
  
  if (specs.skinConcern) return specs.skinConcern.toLowerCase();
  
  const match = description.match(concernPattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract SPF level from product data
 */
function extractSPF(data) {
  const { specs = {}, description = '' } = data;
  const spfPattern = /\b(SPF\s*\d+[\+]*|PA[\+]+)\b/i;
  
  if (specs.spf) return specs.spf;
  
  const match = description.match(spfPattern);
  return match ? match[0].toUpperCase() : '';
}

/**
 * Extract texture from product data
 */
function extractTexture(data) {
  const { specs = {}, description = '' } = data;
  const texturePattern = /\b(lightweight|velvety|silky|rich|creamy|whipped|watery|gel-based|smooth)\b/i;
  
  if (specs.texture) return specs.texture.toLowerCase();
  
  const match = description.match(texturePattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract key ingredients from product data
 */
function extractKeyIngredients(data) {
  const { specs = {}, ingredients = '', description = '' } = data;
  const commonIngredients = ['hyaluronic acid', 'vitamin c', 'niacinamide', 'retinol', 'salicylic acid', 
                             'argan oil', 'shea butter', 'tea tree oil', 'ceramides', 'peptides', 
                             'centella asiatica', 'squalane', 'glycolic acid', 'lactic acid'];
  
  if (specs.keyIngredient) return specs.keyIngredient;
  
  const searchText = (ingredients + ' ' + description).toLowerCase();
  const found = commonIngredients.filter(ing => searchText.includes(ing));
  
  return found.length > 0 ? found.slice(0, 2).join(' and ') : '';
}

/**
 * Extract hair type from product data
 */
function extractHairType(data) {
  const { specs = {}, description = '' } = data;
  const hairTypePattern = /\b(straight|wavy|curly|coily|fine|thick|color[- ]treated|chemically treated|all hair types?)\b/i;
  
  if (specs.hairType) return specs.hairType.toLowerCase();
  
  const match = description.match(hairTypePattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract hair concern from product data
 */
function extractHairConcern(data) {
  const { specs = {}, description = '' } = data;
  const concernPattern = /\b(hair fall|dandruff|frizz|dryness|damage|color protection|volume|thinning|split ends?)\b/i;
  
  if (specs.hairConcern) return specs.hairConcern.toLowerCase();
  
  const match = description.match(concernPattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract fragrance from product data
 */
function extractFragrance(data) {
  const { specs = {}, description = '' } = data;
  const fragrancePattern = /\b(rose|lavender|jasmine|vanilla|citrus|sandalwood|oud|musk|amber|aqua|fresh)\b/i;
  
  if (specs.fragrance) return specs.fragrance.toLowerCase();
  
  const match = description.match(fragrancePattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract fragrance family from product data
 */
function extractFragranceFamily(data) {
  const { specs = {}, description = '' } = data;
  const familyPattern = /\b(floral|oriental|woody|fresh|aquatic|gourmand|fruity|spicy|aromatic)\b/i;
  
  if (specs.fragranceFamily) return specs.fragranceFamily.toLowerCase();
  
  const match = description.match(familyPattern);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract concentration from product data
 */
function extractConcentration(data) {
  const { specs = {}, description = '' } = data;
  const concentrationPattern = /\b(eau de cologne|EDC|eau de toilette|EDT|eau de parfum|EDP|parfum|extrait|body mist)\b/i;
  
  if (specs.concentration) return specs.concentration;
  
  const match = description.match(concentrationPattern);
  return match ? match[0] : '';
}

/**
 * Extract fragrance notes from product data
 */
function extractFragranceNotes(data) {
  const { description = '' } = data;
  const notesPattern = /(top|heart|base) notes?:?\s*([^.]+)/i;
  
  const match = description.match(notesPattern);
  return match ? `Featuring ${match[0]}` : '';
}

/**
 * Extract benefits from product data
 */
function extractBenefits(data) {
  const { specs = {}, description = '' } = data;
  const benefitsPattern = /\b(long-lasting|waterproof|smudge-proof|transfer-proof|hydrating|nourishing|volumizing|lengthening|cruelty-free|vegan|paraben-free)\b/i;
  
  if (specs.benefits) return specs.benefits;
  
  const matches = description.match(new RegExp(benefitsPattern, 'gi'));
  return matches && matches.length > 0 ? `This ${matches.slice(0, 2).join(' and ')} formula` : '';
}

/**
 * Determine product category and select appropriate template
 */
function getTemplateForProduct(data) {
  const { category = '', subcategory = '', name = '' } = data;
  const normCat = category.toLowerCase();
  const normSub = subcategory.toLowerCase();
  const normName = name.toLowerCase();

  // Lipstick
  if (normSub.includes('lipstick') || normSub.includes('lip color') || 
      (normCat.includes('lip') && normName.includes('lipstick'))) {
    return DESCRIPTION_TEMPLATES.lipstick;
  }

  // Lip Gloss
  if (normSub.includes('gloss') || normSub.includes('lip oil') || normSub.includes('lip balm') ||
      normSub.includes('lip tint')) {
    return DESCRIPTION_TEMPLATES.lipGloss;
  }

  // Foundation
  if (normSub.includes('foundation') || (normCat.includes('face') && normName.includes('foundation'))) {
    return DESCRIPTION_TEMPLATES.foundation;
  }

  // Concealer
  if (normSub.includes('concealer') || normSub.includes('corrector')) {
    return DESCRIPTION_TEMPLATES.concealer;
  }

  // Compact/Powder
  if (normSub.includes('compact') || normSub.includes('powder') || normSub.includes('setting')) {
    return DESCRIPTION_TEMPLATES.compact;
  }

  // Blush/Bronzer/Highlighter
  if (normSub.includes('blush') || normSub.includes('bronzer') || normSub.includes('highlighter')) {
    return DESCRIPTION_TEMPLATES.blush;
  }

  // Eyeshadow
  if (normSub.includes('eyeshadow') || normSub.includes('eye shadow') || normSub.includes('pigment')) {
    return DESCRIPTION_TEMPLATES.eyeshadow;
  }

  // Eyeliner/Kajal
  if (normSub.includes('eyeliner') || normSub.includes('eye liner') || normSub.includes('kajal') || 
      normSub.includes('kohl')) {
    return DESCRIPTION_TEMPLATES.eyeliner;
  }

  // Mascara
  if (normSub.includes('mascara')) {
    return DESCRIPTION_TEMPLATES.mascara;
  }

  // Face Serum
  if (normSub.includes('serum') || normSub.includes('essence') || normSub.includes('ampoule')) {
    return DESCRIPTION_TEMPLATES.serum;
  }

  // Moisturizer
  if (normSub.includes('moisturizer') || normSub.includes('moisturiser') || 
      normSub.includes('cream') || normSub.includes('lotion')) {
    return DESCRIPTION_TEMPLATES.moisturizer;
  }

  // Face Wash
  if (normSub.includes('face wash') || normSub.includes('cleanser') || normSub.includes('scrub')) {
    return DESCRIPTION_TEMPLATES.faceWash;
  }

  // Sunscreen
  if (normSub.includes('sunscreen') || normSub.includes('sunblock') || normSub.includes('spf')) {
    return DESCRIPTION_TEMPLATES.sunscreen;
  }

  // Shampoo
  if (normSub.includes('shampoo')) {
    return DESCRIPTION_TEMPLATES.shampoo;
  }

  // Conditioner
  if (normSub.includes('conditioner') || normSub.includes('hair mask')) {
    return DESCRIPTION_TEMPLATES.conditioner;
  }

  // Hair Oil
  if (normSub.includes('hair oil') || normSub.includes('hair serum')) {
    return DESCRIPTION_TEMPLATES.hairOil;
  }

  // Hair Color
  if (normSub.includes('hair color') || normSub.includes('hair colour') || normSub.includes('hair dye')) {
    return DESCRIPTION_TEMPLATES.hairColor;
  }

  // Perfume
  if (normSub.includes('perfume') || normSub.includes('parfum') || normSub.includes('eau de')) {
    return DESCRIPTION_TEMPLATES.perfume;
  }

  // Deodorant
  if (normSub.includes('deodorant') || normSub.includes('body mist') || normSub.includes('body spray')) {
    return DESCRIPTION_TEMPLATES.deodorant;
  }

  // Nail Polish
  if (normSub.includes('nail polish') || normSub.includes('nail lacquer') || normSub.includes('nail')) {
    return DESCRIPTION_TEMPLATES.nailPolish;
  }

  // Generic fallback
  return null;
}

/**
 * Generate generic description when no template matches
 */
function generateGenericDescription(data) {
  const { name, brand, category, subcategory } = data;
  
  if (!name) return '';
  
  return `${brand ? brand + ' ' : ''}${name} is a premium ${subcategory || category || 'beauty product'} designed to deliver exceptional results. This high-quality product combines advanced formulation with luxurious texture for professional-grade performance.`;
}

/**
 * Main function: Generate product description
 * @param {Object} data - Product data
 * @param {string} data.name - Product name
 * @param {string} data.brand - Brand name
 * @param {string} data.category - Product category
 * @param {string} data.subcategory - Product subcategory
 * @param {Object} data.specs - Product specifications object
 * @param {string} data.ingredients - Ingredients list
 * @param {string} data.description - Existing description (optional, for extracting info)
 * @returns {string} Generated description
 */
export function generateProductDescription(data) {
  if (!data || !data.name) {
    return '';
  }

  const template = getTemplateForProduct(data);
  
  if (template) {
    return template(data);
  }

  return generateGenericDescription(data);
}

/**
 * Check if a description appears to be auto-generated
 * (Used to determine if description should be regenerated)
 */
export function isAutoGeneratedDescription(description) {
  if (!description || description.trim().length === 0) {
    return false;
  }

  // Check for common template patterns
  const autoGenPatterns = [
    /is a .+ that delivers/i,
    /specially formulated for/i,
    /designed to .+ and .+/i,
    /perfect for creating/i,
    /this .+ formula/i,
    /enriched with/i,
    /suitable for .+ skin/i,
    /is a premium .+ designed/i
  ];

  return autoGenPatterns.some(pattern => pattern.test(description));
}

/**
 * Generate intelligent product highlights based on product data
 * @param {Object} data
 * @returns {string[]} Array of key highlights
 */
export function generateProductHighlights(data) {
  if (!data) return [];
  const name = (data.name || '').trim();
  const brand = (data.brand || '').trim();
  const category = (data.category || '').trim();
  const subcategory = (data.subcategory || '').trim();
  const size = (data.size || '').trim();
  const shade = (data.shade || '').trim();

  const highlights = [];

  if (brand) {
    highlights.push(`100% Genuine & Authentic ${brand}`);
  }

  const subLower = subcategory.toLowerCase();
  const catLower = category.toLowerCase();
  const nameLower = name.toLowerCase();

  // Lip products
  if (subLower.includes('lipstick') || subLower.includes('lip') || nameLower.includes('lipstick') || nameLower.includes('lip')) {
    highlights.push('Rich, intense pigment payoff in a single glide');
    highlights.push('Long-wearing & transfer-resistant formula');
    if (shade) highlights.push(`Vibrant shade: ${shade}`);
    else highlights.push('Non-drying, comfortable matte or satin finish');
  } 
  // Foundation / Concealer / Face
  else if (subLower.includes('foundation') || subLower.includes('concealer') || subLower.includes('compact') || catLower.includes('face') || nameLower.includes('foundation')) {
    highlights.push('Seamless, blendable coverage with natural finish');
    highlights.push('Weightless all-day wear without creasing or caking');
    highlights.push('Dermatologically tested & suitable for daily wear');
  } 
  // Eye products
  else if (subLower.includes('eyeliner') || subLower.includes('kajal') || subLower.includes('mascara') || subLower.includes('eyeshadow') || catLower.includes('eye')) {
    highlights.push('Smudge-proof & waterproof all-day performance');
    highlights.push('High-definition color with ultra-smooth application');
    highlights.push('Ophthalmologically tested & safe for sensitive eyes');
  } 
  // Skincare / Serum / Moisturizer
  else if (catLower.includes('skin') || subLower.includes('serum') || subLower.includes('cream') || subLower.includes('moisturizer')) {
    highlights.push('Deeply hydrates and nourishes skin barrier');
    highlights.push('Fast-absorbing, non-greasy lightweight texture');
    highlights.push('Formulated with active ingredients for healthy radiant glow');
  } 
  // Hair Care
  else if (catLower.includes('hair') || subLower.includes('shampoo') || subLower.includes('oil') || subLower.includes('conditioner')) {
    highlights.push('Strengthens strands and boosts natural shine');
    highlights.push('Tames frizz while protecting against damage');
    highlights.push('Gentle everyday salon-grade formulation');
  } 
  // Nails / Fragrance / General
  else {
    highlights.push(`Professional salon-grade ${subcategory || category || 'beauty formulation'}`);
    highlights.push('High-performance formula with lasting finish');
    highlights.push('Quality assured & verified for everyday beauty routine');
  }

  if (size) {
    highlights.push(`Net Quantity: ${size}`);
  }

  return highlights;
}
