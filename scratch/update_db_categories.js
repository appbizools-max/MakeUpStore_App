const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CDN_BASE = `${SUPABASE_URL}/storage/v1/object/public/categories`;

const CATEGORY_MAP = {
  'cat_7': 'icon_cat_7.png',
  'cat_8': 'icon_cat_8.png',
  'cat_9': 'icon_cat_9.png',
  'cat_11': 'icon_cat_11.png',
  'cat_14': 'icon_cat_14.png',
  'cat_18': 'icon_cat_18.png',
  'cat_hair_styling': 'icon_cat_hair_styling.png',
  'cat_fragrance': 'icon_cat_fragrance.png',
  'cat_personal_care': 'icon_cat_personal_care.png',
  'cat_salon_professional': 'icon_cat_salon_professional.png',
  'cat_professional_makeup': 'icon_cat_professional_makeup.png',
  'cat_mens_grooming': 'icon_cat_mens_grooming.png',
  'cat_organic_natural_beauty': 'icon_cat_organic_natural_beauty.png',
  'cat_travel_mini_products': 'icon_cat_travel_mini_products.png',
  'cat_beauty_accessories': 'icon_cat_beauty_accessories.png',
  'air-fresheners': 'icon_cat_fragrance.png',
  'baby-care': 'icon_cat_personal_care.png'
};

async function updateDbCategories() {
  console.log('Updating database categories with canonical CDN image URLs...');
  for (const [id, filename] of Object.entries(CATEGORY_MAP)) {
    const publicUrl = `${CDN_BASE}/${filename}?v=2`;
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ image: publicUrl })
      .eq('id', id);

    if (error) {
      console.error(`Failed to update ${id}:`, error.message);
    } else {
      console.log(`Updated ${id} => ${filename}`);
    }
  }

  // Also update salbeau_category_subcategory_hierarchy to not contain giant base64
  console.log('\nCleaning hierarchy configuration record in brands...');
  const { data: catRows } = await supabaseAdmin.from('categories').select('*').order('sort_order', { ascending: true });
  const { data: subcatRows } = await supabaseAdmin.from('subcategories').select('*').order('sort_order', { ascending: true });

  const cleanHierarchy = {
    categories: catRows || [],
    subcategories: subcatRows || [],
    leafCategories: []
  };

  const { error: hierErr } = await supabaseAdmin.from('brands').update({
    logo: JSON.stringify(cleanHierarchy)
  }).eq('id', 'salbeau_category_subcategory_hierarchy');

  if (hierErr) {
    console.error('Failed to update hierarchy record:', hierErr.message);
  } else {
    console.log('Successfully updated salbeau_category_subcategory_hierarchy without base64 bloat!');
  }

  const { error: orderErr } = await supabaseAdmin.from('brands').update({
    logo: JSON.stringify(catRows || [])
  }).eq('id', 'app_category_order_config');

  if (orderErr) {
    console.error('Failed to update app_category_order_config:', orderErr.message);
  } else {
    console.log('Successfully updated app_category_order_config!');
  }

  console.log('All categories and configs cleaned and updated!');
  process.exit(0);
}

updateDbCategories();

