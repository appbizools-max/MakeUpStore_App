import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listAllFiles(bucket, path = '') {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(path, { limit: 200 });
  if (error) {
    console.error(`Error listing ${bucket}/${path}:`, error.message);
    return [];
  }
  let files = [];
  for (const item of data || []) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder
      const subFiles = await listAllFiles(bucket, itemPath);
      files = files.concat(subFiles);
    } else {
      const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(itemPath);
      files.push({
        bucket,
        path: itemPath,
        name: item.name,
        publicUrl: urlData.publicUrl,
        metadata: item.metadata
      });
    }
  }
  return files;
}

async function audit() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  console.log('--- ALL STORAGE ASSETS ---');
  for (const b of buckets || []) {
    const files = await listAllFiles(b.id);
    console.log(`\nBucket: ${b.id} (Total files: ${files.length})`);
    for (const f of files) {
      console.log(`  [${f.bucket}] ${f.path} -> ${f.publicUrl}`);
    }
  }
}

audit();

