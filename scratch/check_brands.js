const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

console.log('Connecting to Supabase at:', url);
const supabase = createClient(url, serviceKey);

(async () => {
  try {
    const { data, error } = await supabase.from('brands').select('*');
    if (error) {
      console.error('Error fetching brands:', error);
      return;
    }
    console.log('Total rows in brands table:', data ? data.length : 0);
    if (data && data.length > 0) {
      data.forEach(r => {
        console.log(`- ID: ${r.id} | Name: ${r.name} | Category: ${r.category} | Enabled: ${r.enabled}`);
      });
    }

    // Also check products to see what brands are referenced in products!
    const { data: prodData, error: prodErr } = await supabase.from('products').select('brand, brand_name, name').limit(10);
    console.log('\nSample products brand values:', prodData);
  } catch (err) {
    console.error('Crash in check script:', err);
  }
})();
