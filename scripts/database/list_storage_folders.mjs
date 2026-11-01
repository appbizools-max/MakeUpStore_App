import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listFolder(bucket, folder) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(folder, { limit: 100 });
  if (error) console.error(`Error listing ${bucket}/${folder}:`, error.message);
  else {
    console.log(`\n=== Bucket: ${bucket}, Folder: ${folder} (Count: ${data?.length || 0}) ===`);
    console.log((data || []).map(f => f.name));
  }
}

async function run() {
  await listFolder('gc-home-assets', 'categories');
  await listFolder('gc-home-assets', 'subcategories');
  await listFolder('gc-home-assets', 'products');
  await listFolder('products', 'categories');
  await listFolder('products', 'products');
}

run();

