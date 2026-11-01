const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('MakeUpStore_App/app/src/config/supabase.js', 'utf8');
const urlMatch = envContent.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envContent.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
  const { data: prods, error: pErr } = await supabase.from('products').select('id, name, stock, barcode, mrp, general_price, status, enabled, additional_info').limit(20);
  console.log('Products count:', prods?.length, 'error:', pErr?.message);
  if (prods && prods[0]) console.log('Sample prod:', JSON.stringify(prods[0], null, 2));

  const { data: cats, error: cErr } = await supabase.from('categories').select('*');
  console.log('Categories count:', cats?.length, 'error:', cErr?.message);
  if (cats) console.log('Sample cat:', cats.slice(0, 3));

  const { data: brands, error: bErr } = await supabase.from('brands').select('*');
  console.log('Brands count:', brands?.length, 'error:', bErr?.message);
  if (brands) console.log('Sample brand:', brands.slice(0, 3));

  const { data: orders, error: oErr } = await supabase.from('orders').select('id, status, items, total, created_at').limit(10);
  console.log('Orders count:', orders?.length, 'error:', oErr?.message);
  if (orders && orders[0]) console.log('Sample order:', JSON.stringify(orders[0], null, 2));

  const { data: homeCfg, error: hErr } = await supabase.from('home_config').select('*');
  console.log('home_config table:', homeCfg ? homeCfg.length : 'none', 'error:', hErr?.message);

  const { data: homeSections, error: sErr } = await supabase.from('home_sections').select('*');
  console.log('home_sections table:', homeSections ? homeSections.length : 'none', 'error:', sErr?.message);
}
check();
