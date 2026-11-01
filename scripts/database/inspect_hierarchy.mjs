import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspect() {
  console.log('--- 1. Check brands table for salbeau_category_subcategory_hierarchy ---');
  const { data: hierRows, error: hierErr } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('id', 'salbeau_category_subcategory_hierarchy');

  if (hierErr) console.error('hierErr:', hierErr);
  else if (hierRows && hierRows.length > 0) {
    const row = hierRows[0];
    console.log('Row found: id:', row.id, 'name:', row.name);
    console.log('logo length:', row.logo?.length);
    console.log('description length:', row.description?.length);
    const content = row.logo || row.description;
    try {
      const parsed = JSON.parse(content);
      console.log('Categories count in hierarchy:', parsed.categories?.length);
      console.log('Subcategories count in hierarchy:', parsed.subcategories?.length);
      console.log('Leaf categories count:', parsed.leafCategories?.length);
      const catsWithImg = (parsed.categories || []).filter(c => c.image);
      const subsWithImg = (parsed.subcategories || []).filter(s => s.image);
      console.log('Cats with img:', catsWithImg.length, 'Subs with img:', subsWithImg.length);
      console.log('Sample subs in hierarchy:', (parsed.subcategories || []).slice(0, 5));
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  } else {
    console.log('No hierarchy row in brands table!');
  }

  console.log('\n--- 2. Inspect Storage Buckets ---');
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) console.error('bErr:', bErr);
  else {
    console.log('Buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
    for (const b of buckets) {
      const { data: files } = await supabaseAdmin.storage.from(b.id).list('', { limit: 50 });
      console.log(`Bucket '${b.id}' top-level items (${files?.length || 0}):`, (files || []).map(f => f.name));
    }
  }
}

inspect();

