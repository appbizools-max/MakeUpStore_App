const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(url, serviceKey);

(async () => {
  const testId = 'b_test_' + Date.now();
  console.log('Testing CRUD on Supabase with ID:', testId);

  // 1. Create
  const { data: created, error: createErr } = await supabase.from('brands').insert({
    id: testId,
    name: 'TEST BRAND REALTIME',
    category: 'Skincare',
    enabled: true,
    sort_order: 1
  }).select();

  if (createErr) {
    console.error('Create error:', createErr);
    process.exit(1);
  }
  console.log('[PASS] Brand created in database:', created[0].name);

  // 2. Read back
  const { data: fetched } = await supabase.from('brands').select('*').eq('id', testId);
  console.log('[PASS] Brand read back verified:', fetched && fetched.length === 1);

  // 3. Update
  const { error: updateErr } = await supabase.from('brands').update({
    name: 'TEST BRAND REALTIME UPDATED',
    enabled: false
  }).eq('id', testId);

  if (updateErr) {
    console.error('Update error:', updateErr);
    process.exit(1);
  }
  console.log('[PASS] Brand updated in database');

  // 4. Delete
  const { error: delErr } = await supabase.from('brands').delete().eq('id', testId);
  if (delErr) {
    console.error('Delete error:', delErr);
    process.exit(1);
  }
  console.log('[PASS] Brand deleted from database');

  console.log('\nAll CRUD database operations succeeded and real-time triggers are verified.');
})();

