import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectProducts() {
  const { data: prods, error } = await supabaseAdmin.from('products').select('*').limit(5);
  if (error) console.error('Error fetching products:', error);
  else {
    console.log('Sample product keys:', prods.length > 0 ? Object.keys(prods[0]) : 'None');
    console.log('Sample product rows:');
    for (const p of prods) {
      console.log({
        id: p.id,
        name: p.name,
        category: p.category,
        category_id: p.category_id,
        subcategory: p.subcategory,
        image: p.image,
        images: p.images,
        image_url: p.image_url
      });
    }
  }
}

inspectProducts();

