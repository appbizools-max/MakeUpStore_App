const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(url, serviceKey);

(async () => {
  const start = Date.now();
  const [brandsRes, configsRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, enabled, logo, created_at, category, sort_order, updated_at')
      .not('id', 'like', 'app_%')
      .not('id', 'like', 'salbeau_%'),
    supabase
      .from('brands')
      .select('id, logo, name')
      .or('id.like.app_%,id.like.salbeau_%')
  ]);

  console.log(`Parallel fetch completed in ${Date.now() - start} ms!`);
  console.log(`Partner brands count: ${brandsRes.data ? brandsRes.data.length : 0}`);
  console.log(`Config rows count: ${configsRes.data ? configsRes.data.length : 0}`);
  if (configsRes.data) {
    console.log('Config IDs:', configsRes.data.map(c => c.id));
  }
})();

