const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));

const url = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(url, serviceKey);

(async () => {
  const start = Date.now();
  const { data, error } = await supabase.from('brands').select('id, name, logo, category');
  console.log('Query took:', Date.now() - start, 'ms');
  if (data) {
    let totalBytes = 0;
    const largeRows = [];
    data.forEach(r => {
      const len = (r.logo || '').length;
      totalBytes += len;
      if (len > 5000) {
        largeRows.push({ id: r.id, name: r.name, bytes: len });
      }
    });
    console.log('Total rows:', data.length);
    console.log('Total logo text size:', Math.round(totalBytes / 1024), 'KB');
    console.log('Large rows (>5KB):', largeRows);
  }
})();

