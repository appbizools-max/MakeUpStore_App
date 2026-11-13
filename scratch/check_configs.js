const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));
const fs = require('fs');

const appCfg = fs.readFileSync('app/src/config/supabase.js', 'utf8');
const urlMatch = appCfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = appCfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkConfigs() {
  const { data, error } = await supabase.from('brands').select('id, name, logo').or('id.like.app_%,id.like.salbeau_%');
  if (error) {
    console.error('Error fetching configs:', error.message);
    process.exit(1);
  }
  console.log('Configs count:', data.length);
  data.forEach(c => {
    console.log('ID:', c.id, 'name:', c.name, 'logo length:', (c.logo || '').length);
    if (c.id === 'salbeau_category_subcategory_hierarchy' || c.id === 'app_category_order_config') {
      try {
        const parsed = JSON.parse(c.logo);
        if (parsed.categories) {
          console.log('Categories in ' + c.id + ':');
          parsed.categories.forEach(cat => console.log('  -', cat.id, '|', cat.name, '| image:', typeof cat.image === 'string' ? cat.image.substring(0, 80) : cat.image));
        }
      } catch (e) {
        console.log('  Failed to parse JSON for ' + c.id, e.message);
      }
    }
  });
  process.exit(0);
}

checkConfigs();
