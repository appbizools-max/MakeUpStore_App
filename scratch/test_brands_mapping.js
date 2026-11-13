const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(url, serviceKey);

const { parseBrandNumberSeq, resolveBrandNumber } = require('../admin/src/utils/brandUtils.js');

const mapBrandFromDb = (b, metaDict = {}) => {
  const meta = metaDict[b.id] || {};
  let categories = [];
  if (Array.isArray(b.categories) && b.categories.length > 0) {
    categories = b.categories;
  } else if (Array.isArray(meta.categories) && meta.categories.length > 0) {
    categories = meta.categories;
  } else if (typeof b.categories === 'string' && b.categories.trim()) {
    try {
      const parsed = JSON.parse(b.categories);
      categories = Array.isArray(parsed) ? parsed : [b.categories];
    } catch (e) {
      categories = b.categories.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
    }
  } else if (meta.category) {
    categories = [meta.category];
  } else if (b.category) {
    categories = [b.category];
  }
  const rawNum = b.brand_number || b.brandNumber || meta.brandNumber || '';
  const brandNumber = resolveBrandNumber({ ...b, brandNumber: rawNum });
  const sortOrder = b.sort_order || meta.sortOrder || parseBrandNumberSeq(brandNumber) || 0;

  return {
    id: b.id,
    name: b.name || '',
    brandNumber,
    brand_number: brandNumber,
    categories,
    category: categories[0] || b.category || '',
    description: b.description || meta.description || '',
    internalNotes: b.internal_notes || b.internalNotes || '',
    enabled: b.enabled !== false,
    logo: b.logo || '',
    sortOrder,
    sort_order: sortOrder,
    createdAt: b.created_at || null
  };
};

(async () => {
  try {
    const { data: rawBrands, error } = await supabase.from('brands').select('*');
    if (error) {
      console.error('Fetch error:', error);
      return;
    }
    console.log('Fetched raw brands count:', rawBrands.length);

    const metaConfigRow = rawBrands.find(b => b.id === 'app_brand_metadata_config');
    let brandMetaDict = {};
    if (metaConfigRow && metaConfigRow.logo) {
      try { brandMetaDict = JSON.parse(metaConfigRow.logo); } catch (e) {}
    }

    const mapRow = rawBrands.find(b => b.id === 'app_brand_category_map');
    let categoryDict = {};
    if (mapRow && mapRow.logo) {
      try { categoryDict = JSON.parse(mapRow.logo); } catch (e) {}
    }

    console.log('Testing filter and mapping...');
    const regularBrands = rawBrands
      .filter(b => {
        const idStr = String(b.id || '');
        return (
          !idStr.startsWith('app_') &&
          !idStr.startsWith('salbeau_') &&
          b.category !== 'SystemConfig' &&
          b.category !== 'System Config'
        );
      })
      .map(b => {
        const mapped = mapBrandFromDb(b, brandMetaDict);
        const primaryCat = mapped.categories?.[0] || categoryDict[b.name] || b.category || '';
        const cats = mapped.categories && mapped.categories.length > 0
          ? mapped.categories
          : (primaryCat ? [primaryCat] : (b.category ? [b.category] : []));
        return {
          ...mapped,
          category: cats[0] || b.category || '',
          categories: cats.length > 0 ? cats : (b.category ? [b.category] : [])
        };
      })
      .sort((a, b) => {
        const seqA = parseBrandNumberSeq(a.brandNumber);
        const seqB = parseBrandNumberSeq(b.brandNumber);
        if (seqA && seqB) return seqA - seqB;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true });
      });

    console.log('Successfully mapped regularBrands count:', regularBrands.length);
    if (regularBrands.length > 0) {
      console.log('Sample mapped brand:', regularBrands[0]);
    }
  } catch (err) {
    console.error('CRASH in brands processing:', err);
  }
})();

