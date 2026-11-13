const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));
const fs = require('fs');

const appCfg = fs.readFileSync('app/src/config/supabase.js', 'utf8');
const urlMatch = appCfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = appCfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkCategories() {
  const { data, error } = await supabase.from('categories').select('id, name, image, icon, sort_order, enabled').order('sort_order', { ascending: true });
  if (error) {
    console.error('Error fetching categories:', error.message);
    return;
  }
  console.log('=== DB CATEGORIES (' + data.length + ') ===');
  data.forEach(c => {
    const imgStr = typeof c.image === 'string' ? (c.image.startsWith('data:') ? 'BASE64 (' + c.image.length + ' chars)' : c.image) : JSON.stringify(c.image);
    console.log(c.id, '|', c.name, '| image:', imgStr, '| enabled:', c.enabled);
  });
}

checkCategories();
