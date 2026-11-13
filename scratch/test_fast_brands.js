const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(url, serviceKey);

(async () => {
  const start = Date.now();
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo, category, brand_number, enabled, sort_order, created_at, description, internal_notes')
    .not('id', 'like', 'app_%')
    .not('id', 'like', 'salbeau_%');

  const duration = Date.now() - start;
  console.log(`Fast brands query returned ${data ? data.length : 0} rows in ${duration} ms!`);
  if (error) console.error('Error:', error);
})();

