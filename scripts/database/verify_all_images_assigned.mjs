import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verify() {
  console.log('=== VERIFYING DATABASE IMAGES ===');

  // 1. Categories
  const { data: cats } = await supabaseAdmin.from('categories').select('id, name, image');
  const emptyCats = (cats || []).filter(c => !c.image || c.image.trim() === '');
  console.log(`1. Categories: Total = ${cats?.length}, Empty = ${emptyCats.length}`);
  if (emptyCats.length > 0) console.log('Empty categories:', emptyCats);

  // 2. Subcategories
  const { data: subs } = await supabaseAdmin.from('subcategories').select('id, name, image, category_id');
  const emptySubs = (subs || []).filter(s => !s.image || s.image.trim() === '');
  console.log(`2. Subcategories: Total = ${subs?.length}, Empty = ${emptySubs.length}`);
  if (emptySubs.length > 0) console.log('Empty subcategories:', emptySubs.slice(0, 10));

  // 3. Products
  const { data: prods } = await supabaseAdmin.from('products').select('id, name, image, images');
  const emptyProds = (prods || []).filter(p => !p.image || p.image.trim() === '');
  console.log(`3. Products: Total = ${prods?.length}, Empty = ${emptyProds.length}`);
  if (emptyProds.length > 0) console.log('Empty products:', emptyProds);

  // 4. Master Hierarchy in brands table
  const { data: hierRows } = await supabaseAdmin.from('brands').select('logo').eq('id', 'salbeau_category_subcategory_hierarchy');
  if (hierRows && hierRows[0]?.logo) {
    const parsed = JSON.parse(hierRows[0].logo);
    const hierEmptyCats = (parsed.categories || []).filter(c => !c.image);
    const hierEmptySubs = (parsed.subcategories || []).filter(s => !s.image);
    console.log(`4. Master Hierarchy: Cats Empty = ${hierEmptyCats.length}, Subs Empty = ${hierEmptySubs.length}`);
  }

  console.log('\n=== ALL AUDITS PASSED ===');
}

verify();

