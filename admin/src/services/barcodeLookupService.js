/**
 * Barcode Lookup & Enrichment Service
 * 
 * Provides automated product data lookup from trusted barcode databases:
 * 1. Open Beauty Facts API (dedicated to cosmetics, hair care, skincare)
 * 2. Open Food / Product Facts API
 * 3. Fallback Web Search normalization
 * 
 * Never assumes the barcode contains product data; treats it as an external key.
 * Strictly returns only verified data with confidence levels.
 */

// Helper to determine barcode format (EAN-13, UPC-A, Code-128, etc.)
export const detectBarcodeFormat = (barcode) => {
  if (!barcode) return 'UNKNOWN';
  const clean = String(barcode).trim();
  if (/^\d{13}$/.test(clean)) return 'EAN-13';
  if (/^\d{12}$/.test(clean)) return 'UPC-A';
  if (/^\d{8}$/.test(clean)) return 'EAN-8';
  if (/^\d{14}$/.test(clean)) return 'ITF-14';
  return 'CODE-128';
};

// Check EAN-13 Checksum
export const validateBarcodeChecksum = (barcode) => {
  const clean = String(barcode).trim();
  if (!/^\d{12,13}$/.test(clean)) return true; // non-numeric or other format
  if (clean.length === 13) {
    const digits = clean.split('').map(Number);
    const checksum = digits[12];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const calculated = (10 - (sum % 10)) % 10;
    return checksum === calculated;
  }
  return true;
};

/**
 * Queries Open Beauty Facts and Open Products database for barcode info
 * @param {string} barcode 
 * @returns {Promise<Object>} Normalized product detection result
 */
export const lookupBarcodeData = async (barcode) => {
  if (!barcode || !String(barcode).trim()) {
    throw new Error('Please provide a valid barcode');
  }

  const cleanBarcode = String(barcode).trim();
  const barcodeType = detectBarcodeFormat(cleanBarcode);

  const result = {
    barcode: cleanBarcode,
    barcodeType,
    found: false,
    source: 'None',
    confidence: 'Low',
    data: {
      brand: '',
      productName: '',
      manufacturer: '',
      category: '',
      subcategory: '',
      productType: '',
      image: '',
      images: [],
      description: '',
      netQuantity: '',
      unit: '',
      countryOfOrigin: '',
      ingredients: '',
      productUrl: ''
    },
    raw: null
  };

  try {
    // 1. Try Open Beauty Facts (Cosmetics specific)
    const beautyUrl = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const res = await fetch(beautyUrl, {
      headers: {
        'User-Agent': 'SalbeauAdmin/1.0 (contact@salbeau.com)'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 1 && json.product) {
        const p = json.product;
        result.found = true;
        result.source = 'Open Beauty Facts';
        result.raw = p;

        result.data.brand = p.brands || p.brand_owner || '';
        result.data.productName = p.product_name || p.product_name_en || p.generic_name || '';
        result.data.manufacturer = p.manufacturing_places || p.brand_owner || '';
        result.data.image = p.image_url || p.image_front_url || p.image_small_url || '';
        result.data.images = [
          p.image_url,
          p.image_front_url,
          p.image_ingredients_url
        ].filter(Boolean);
        result.data.netQuantity = p.quantity || '';
        result.data.countryOfOrigin = p.origins || p.countries || '';
        result.data.ingredients = p.ingredients_text || p.ingredients_text_en || '';
        result.data.productUrl = p.url || '';

        // Category suggestions
        if (p.categories) {
          const cats = p.categories.split(',').map(c => c.trim());
          result.data.category = cats[0] || '';
          result.data.subcategory = cats[1] || '';
        }

        // Calculate confidence
        let confidenceScore = 0;
        if (result.data.productName) confidenceScore += 40;
        if (result.data.brand) confidenceScore += 30;
        if (result.data.image) confidenceScore += 20;
        if (result.data.ingredients) confidenceScore += 10;

        result.confidence = confidenceScore >= 70 ? 'High' : (confidenceScore >= 40 ? 'Medium' : 'Low');
        return result;
      }
    }

    // 2. Try Open Food Facts fallback
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const offRes = await fetch(offUrl, {
      headers: { 'User-Agent': 'SalbeauAdmin/1.0' }
    });

    if (offRes.ok) {
      const json = await offRes.json();
      if (json && json.status === 1 && json.product) {
        const p = json.product;
        result.found = true;
        result.source = 'Open Product Facts';
        result.raw = p;

        result.data.brand = p.brands || p.brand_owner || '';
        result.data.productName = p.product_name || p.product_name_en || '';
        result.data.image = p.image_url || p.image_front_url || '';
        result.data.countryOfOrigin = p.countries || '';
        result.data.netQuantity = p.quantity || '';

        let confidenceScore = 0;
        if (result.data.productName) confidenceScore += 40;
        if (result.data.brand) confidenceScore += 30;
        if (result.data.image) confidenceScore += 20;

        result.confidence = confidenceScore >= 60 ? 'High' : (confidenceScore >= 30 ? 'Medium' : 'Low');
        return result;
      }
    }
  } catch (err) {
    console.warn('Barcode lookup network error:', err);
  }

  // Not found in structured databases
  result.found = false;
  return result;
};

/**
 * Generates web search queries for barcode fallback
 */
export const buildBarcodeSearchQuery = (barcode, brand = '', productName = '') => {
  const cleanBarcode = String(barcode).trim();
  if (brand && productName) {
    return `${brand} ${productName} ${cleanBarcode} beauty`;
  }
  if (brand) {
    return `${brand} barcode ${cleanBarcode}`;
  }
  return `${cleanBarcode} cosmetic beauty product`;
};
