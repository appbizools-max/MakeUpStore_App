import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectImages() {
  console.log('--- Categories with images ---');
  const { data: cats, error: catErr } = await supabaseAdmin.from('categories').select('id, name, image');
  if (catErr) console.error('catErr:', catErr.message);
  else {
    const withImg = cats.filter(c => c.image && c.image.trim() !== '');
    console.log(`Total categories: ${cats.length}, with image: ${withImg.length}`);
    console.log(withImg);
  }

  console.log('\n--- Subcategories with images ---');
  const { data: subs, error: subErr } = await supabaseAdmin.from('subcategories').select('id, name, image');
  if (subErr) console.error('subErr:', subErr.message);
  else {
    const withImg = subs.filter(s => s.image && s.image.trim() !== '');
    console.log(`Total subcategories: ${subs.length}, with image: ${withImg.length}`);
    console.log(withImg);
  }

  console.log('\n--- Brands with images ---');
  const { data: brands, error: brandErr } = await supabaseAdmin.from('brands').select('id, name, logo, image');
  if (brandErr) console.error('brandErr:', brandErr.message);
  else {
    const withImg = brands.filter(b => (b.logo && b.logo.trim() !== '') || (b.image && b.image.trim() !== ''));
    console.log(`Total brands: ${brands.length}, with logo/image: ${withImg.length}`);
    console.log(withImg);
  }

  console.log('\n--- Products with images ---');
  const { data: prods, error: prodErr } = await supabaseAdmin.from('products').select('id, name, image');
  if (prodErr) console.error('prodErr:', prodErr.message);
  else {
    const withImg = prods.filter(p => p.image && p.image.trim() !== '');
    console.log(`Total products: ${prods.length}, with image: ${withImg.length}`);
    console.log(withImg.slice(0, 10));
  }

  console.log('\n--- Check salbeau_category_subcategory_hierarchy in brands ---');
  const { data: hier } = await supabaseAdmin.from('brands').select('id, description').eq('id', 'salbeau_category_subcategory_hierarchy');
  if (hier && hier[0]) {
    try {
      const parsed = JSON.parse(hier[0].description);
      console.log('Hierarchy json categories with image:', (parsed.categories || []).filter(c => c.image));
      console.log('Hierarchy json subcategories with image:', (parsed.subcategories || []).filter(s => s.image));
      console.log('Hierarchy json product_types with image:', (parsed.product_types || []).filter(pt => pt.image));
    } catch (e) {
      console.log('Cannot parse hierarchy description:', e.message);
    }
  }
}

inspectImages();
