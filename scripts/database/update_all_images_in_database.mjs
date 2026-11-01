import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Canonical Category Images from Supabase Storage
const CATEGORY_STORAGE_IMAGES = {
  cat_8: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505683962_hunl1d.webp?v=1793505683962',
  cat_7: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505754975_gvytzx.webp?v=1793505754975',
  cat_hair_styling: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505817403_oybioz.webp?v=1793505817403',
  cat_9: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505874428_6r1hr8.webp?v=1793505874428',
  cat_fragrance: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505916828_ivu8o1.webp?v=1793505916828',
  cat_14: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505951442_sl1hjy.webp?v=1793505951442',
  cat_11: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505998316_5h3t1a.webp?v=1793505998316',
  cat_personal_care: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506048096_8lqwd8.webp?v=1793506048096',
  cat_beauty_tools_accessories: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506139285_xc2eij.webp?v=1793506139285',
  cat_salon_professional: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506188470_oisjf7.webp?v=1793506188470',
  cat_professional_makeup: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506271587_ijsvxp.webp?v=1793506271587',
  cat_mens_grooming: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506238512_er0eqb.webp?v=1793506238512',
  cat_18: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  cat_organic_natural_beauty: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507451291_o8a7ke.webp?v=1793507451291',
  cat_travel_mini_products: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507547400_5a1n8l.webp?v=1793507547400',
  cat_beauty_accessories: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507585635_myh93a.webp?v=1793507585635',

  // Alias maps
  skincare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505683962_hunl1d.webp?v=1793505683962',
  makeup: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505754975_gvytzx.webp?v=1793505754975',
  'hair care': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505874428_6r1hr8.webp?v=1793505874428',
  'hair styling': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505817403_oybioz.webp?v=1793505817403',
  fragrance: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505916828_ivu8o1.webp?v=1793505916828',
  'nail care': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505951442_sl1hjy.webp?v=1793505951442',
  'bath & body': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793505998316_5h3t1a.webp?v=1793505998316',
  'personal care': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506048096_8lqwd8.webp?v=1793506048096',
  'beauty tools & accessories': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506139285_xc2eij.webp?v=1793506139285',
  'salon professional': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506188470_oisjf7.webp?v=1793506188470',
  'professional makeup': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506271587_ijsvxp.webp?v=1793506271587',
  "men's grooming": 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793506238512_er0eqb.webp?v=1793506238512',
  'beauty kits & combos': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  'organic & natural beauty': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507451291_o8a7ke.webp?v=1793507451291',
  'travel & mini products': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507547400_5a1n8l.webp?v=1793507547400',
  'beauty accessories': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/categories/cat_1793507585635_myh93a.webp?v=1793507585635'
};

// Specialized Subcategory Images from Supabase Storage
const SPECIFIC_SUBCATEGORY_IMAGES = {
  // Skincare specifics in storage
  'face cleansers': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507697583_9rrwg7.webp',
  'face wash': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507762806_ngtbee.webp',
  toners: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507804573_n36vb9.webp',
  'face serums': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507864076_omq4ng.webp',
  'face moisturizers': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507920402_q8o5ql.webp',
  'face creams': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793507965230_jgfs2z.webp',
  'face gels': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/gc-home-assets/subcategories/sub_1793508001013_8qvxmt.webp',

  // Makeup specifics in storage
  'face makeup': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/sub_1790838712221_vdg0av.jpg',
  'lip makeup': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/sub_1790838733473_h4c0h1.jpg',
  'eye makeup': 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/sub_1790838756897_sy637u.jpg',

  // Fragrance specifics
  perfume: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80',

  // Hair care specifics
  'hair care products': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80',
  'hair accessories': 'https://images.unsplash.com/photo-1590159763121-7c9ff3149e0a?w=500&auto=format&fit=crop&q=80',

  // Personal & Oral Care specifics
  'pain relief': 'https://images.unsplash.com/photo-1608248597359-2c0612c62c3e?w=500&auto=format&fit=crop&q=80',
  toothbrushes: 'https://images.unsplash.com/photo-1559591937-e1032b217643?w=500&auto=format&fit=crop&q=80',
  'air freshener': 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=500&auto=format&fit=crop&q=80'
};

// Available product photos in Supabase storage
const PRODUCT_STORAGE_IMAGES = [
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790936995927_kass1a.webp',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790953860537_8p4d7h.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790953865279_jq0kw3.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790953967205_q5tiam.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790953971962_etf0jb.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790956994316_shxm8i.webp',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790956999425_j9qgb5.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790957010559_qs4ke2.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790998410485_1kyznv.webp',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790998454770_p5p2qf.webp',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1790998461670_kh3pux.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791198640679_4zxbee.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791271815167_ooo579.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791271826839_llkxr8.avif',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791271842224_vqidft.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791271844858_i34hh9.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791292529625_dt7z27.webp',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791292844400_i3nl11.jpg',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/products/prod_1791292890448_vp2jyc.jpg'
];

async function updateSubcategoriesAndHierarchy() {
  console.log('--- 1. Fetching subcategories from DB ---');
  const { data: subs, error: subErr } = await supabaseAdmin.from('subcategories').select('*');
  if (subErr) {
    console.error('subErr:', subErr);
    return;
  }
  console.log(`Found ${subs.length} subcategories.`);

  let updatedCount = 0;
  const updatedSubs = [];

  for (const s of subs) {
    let resolvedImage = s.image && s.image.trim() !== '' ? s.image : null;

    if (!resolvedImage) {
      const normName = (s.name || '').toLowerCase().trim();
      if (SPECIFIC_SUBCATEGORY_IMAGES[normName]) {
        resolvedImage = SPECIFIC_SUBCATEGORY_IMAGES[normName];
      } else {
        // Find parent category image
        const cId = s.category_id || s.categoryId;
        resolvedImage = CATEGORY_STORAGE_IMAGES[cId] || CATEGORY_STORAGE_IMAGES[cId?.toLowerCase()] || CATEGORY_STORAGE_IMAGES['skincare'];
      }
    }

    if (resolvedImage !== s.image) {
      const { error: updErr } = await supabaseAdmin
        .from('subcategories')
        .update({ image: resolvedImage })
        .eq('id', s.id);

      if (updErr) {
        console.warn(`Error updating subcategory ${s.id}:`, updErr.message);
      } else {
        updatedCount++;
      }
    }

    updatedSubs.push({
      ...s,
      image: resolvedImage,
      image_url: resolvedImage
    });
  }

  console.log(`Updated ${updatedCount} subcategories in subcategories table.`);

  // 2. Update salbeau_category_subcategory_hierarchy in brands table
  console.log('\n--- 2. Updating master hierarchy in brands table ---');
  const { data: hierRows } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('id', 'salbeau_category_subcategory_hierarchy');

  if (hierRows && hierRows.length > 0) {
    try {
      const currentHier = JSON.parse(hierRows[0].logo);
      const hierarchyCats = (currentHier.categories || []).map(c => ({
        ...c,
        image: c.image || CATEGORY_STORAGE_IMAGES[c.id] || CATEGORY_STORAGE_IMAGES[c.name?.toLowerCase()]
      }));

      const hierarchySubs = (currentHier.subcategories || []).map(s => {
        let resolved = s.image && s.image.trim() !== '' ? s.image : null;
        if (!resolved) {
          const normName = (s.name || '').toLowerCase().trim();
          resolved = SPECIFIC_SUBCATEGORY_IMAGES[normName] || CATEGORY_STORAGE_IMAGES[s.category_id] || CATEGORY_STORAGE_IMAGES[s.categoryId] || CATEGORY_STORAGE_IMAGES['skincare'];
        }
        return {
          ...s,
          image: resolved,
          image_url: resolved
        };
      });

      const updatedHierarchyObj = {
        ...currentHier,
        categories: hierarchyCats,
        subcategories: hierarchySubs
      };

      const { error: hUpdErr } = await supabaseAdmin
        .from('brands')
        .update({ logo: JSON.stringify(updatedHierarchyObj), updated_at: new Date().toISOString() })
        .eq('id', 'salbeau_category_subcategory_hierarchy');

      if (hUpdErr) console.error('Error updating hierarchy row:', hUpdErr);
      else console.log('Successfully updated salbeau_category_subcategory_hierarchy row in brands table!');
    } catch (e) {
      console.error('Error updating hierarchy JSON:', e.message);
    }
  }

  // 3. Assign images to products in products table
  console.log('\n--- 3. Updating demo products in products table ---');
  const { data: prods } = await supabaseAdmin.from('products').select('id, name, image, images');
  if (prods && prods.length > 0) {
    let pIdx = 0;
    for (const p of prods) {
      if (!p.image || p.image.trim() === '') {
        const assignedImg = PRODUCT_STORAGE_IMAGES[pIdx % PRODUCT_STORAGE_IMAGES.length];
        pIdx++;
        const { error: pErr } = await supabaseAdmin
          .from('products')
          .update({
            image: assignedImg,
            images: [assignedImg],
            updated_at: new Date().toISOString()
          })
          .eq('id', p.id);

        if (pErr) console.warn(`Error updating product ${p.id}:`, pErr.message);
        else console.log(`Assigned image to product [${p.id}] "${p.name}": ${assignedImg.slice(0, 70)}...`);
      }
    }
  }
}

updateSubcategoriesAndHierarchy();
