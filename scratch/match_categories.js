const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function matchCategories() {
  const { data: categories } = await supabaseAdmin.from('categories').select('id, name, image, sort_order').order('sort_order', { ascending: true });
  const { data: storageFiles } = await supabaseAdmin.storage.from('categories').list('', { limit: 100 });

  const fileNames = (storageFiles || []).map(f => f.name);

  console.log('--- CATEGORY MATCHING ---');
  categories.forEach(cat => {
    // Check if there is an exact icon_cat_{id}.png
    const cleanId = cat.id.replace('cat_', '');
    const directMatch = fileNames.find(f => f === 'icon_' + cat.id + '.png' || f === 'icon_cat_' + cleanId + '.png');
    console.log(cat.id, '|', cat.name, '=> direct match:', directMatch || 'NONE');
  });

  console.log('\nAll icon files in storage:', fileNames.filter(f => f.startsWith('icon_')));
  process.exit(0);
}

matchCategories();

