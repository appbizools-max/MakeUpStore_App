const path = require('path');
const { createClient } = require(path.resolve('admin/node_modules/@supabase/supabase-js'));
const fs = require('fs');

const appCfg = fs.readFileSync('app/src/config/supabase.js', 'utf8');
const urlMatch = appCfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = appCfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkRow() {
  const { data, error } = await supabase.from('brands').select('id, name').or('id.like.app_%,id.like.salbeau_%');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Found rows:', data.length);
    data.forEach(r => console.log(r.id, '|', r.name));
  }
  process.exit(0);
}

checkRow();

