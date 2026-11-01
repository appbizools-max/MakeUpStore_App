import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  const { data: cats } = await supabaseAdmin.from('categories').select('id, name, image');
  console.log('=== DATABASE CATEGORIES ===');
  const catMap = {};
  for (const c of cats || []) {
    catMap[c.id] = c;
    catMap[c.name.toLowerCase()] = c;
    console.log(`[${c.id}] "${c.name}" -> ${c.image}`);
  }

  const { data: subs } = await supabaseAdmin.from('subcategories').select('id, name, category_id, image');
  console.log(`\n=== DATABASE SUBCATEGORIES (Total: ${subs?.length}) ===`);
  const subsWithoutImg = (subs || []).filter(s => !s.image || s.image.trim() === '');
  const subsWithImg = (subs || []).filter(s => s.image && s.image.trim() !== '');
  console.log(`With image: ${subsWithImg.length}, Without image: ${subsWithoutImg.length}`);

  // Group subcategories by category
  const subsByCat = {};
  for (const s of subs || []) {
    const cId = s.category_id || 'unknown';
    if (!subsByCat[cId]) subsByCat[cId] = [];
    subsByCat[cId].push(s);
  }

  console.log('\n=== SUBCATEGORIES GROUPED BY CATEGORY ===');
  for (const [cId, list] of Object.entries(subsByCat)) {
    const parentCat = catMap[cId];
    console.log(`\nCategory: ${cId} (${parentCat?.name || 'Unknown'}) - Count: ${list.length}`);
    for (const s of list) {
      console.log(`  - [${s.id}] "${s.name}": image = ${s.image ? s.image.slice(0, 50) + '...' : 'EMPTY'}`);
    }
  }
}

run();

