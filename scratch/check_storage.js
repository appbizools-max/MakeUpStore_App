const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkStorage() {
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) {
    console.error('Error listing buckets:', bErr.message);
  } else {
    console.log('Buckets:', buckets.map(b => b.name));
    for (const b of buckets) {
      const { data: files, error: fErr } = await supabaseAdmin.storage.from(b.name).list('', { limit: 10 });
      if (!fErr && files) {
        console.log('Bucket ' + b.name + ' files (' + files.length + ' sample):', files.map(f => f.name));
      }
    }
  }
  process.exit(0);
}

checkStorage();
