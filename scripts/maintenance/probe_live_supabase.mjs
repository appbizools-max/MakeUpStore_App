import { createClient } from '../../admin/node_modules/@supabase/supabase-js/dist/index.mjs';
import fs from 'fs';

const configContent = fs.readFileSync('../../admin/src/config/supabase.js', 'utf8');
const url = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];
const serviceKey = configContent.match(/SERVICE_ROLE_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1];

const supabaseAnon = createClient(url, key);
const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null;

async function probe() {
  console.log('================================================================');
  console.log('📡 LIVE SUPABASE BACKEND PROBE & SCHEMA AUDIT');
  console.log('URL:', url);
  console.log('================================================================\n');

  const tables = [
    'products',
    'categories',
    'brands',
    'orders',
    'users',
    'b2b_verifications',
    'abandoned_carts',
    'search_requests',
    'employees',
    'audit_logs',
    'home_banners',
    'home_sections',
    'home_config'
  ];

  console.log('--- 1. ANON KEY ACCESS (RLS ENFORCED) ---');
  for (const t of tables) {
    try {
      const { data, error, count } = await supabaseAnon.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table [${t}]: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table [${t}]: Available | Row count: ${count}`);
      }
    } catch (err) {
      console.log(`⚠️ Table [${t}]: Exception - ${err.message}`);
    }
  }

  if (supabaseAdmin) {
    console.log('\n--- 2. SERVICE ROLE DIRECT PROBE (ADMIN ACCESS) ---');
    for (const t of tables) {
      try {
        const { data, error, count } = await supabaseAdmin.from(t).select('*', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ Table [${t}]: ${error.message} (Code: ${error.code})`);
        } else {
          console.log(`✅ Table [${t}]: Exists in DB | Real Row count: ${count}`);
        }
      } catch (err) {
        console.log(`⚠️ Table [${t}]: Exception - ${err.message}`);
      }
    }

    // Inspect actual records in products table
    console.log('\n--- 3. SAMPLE PRODUCTS SCHEMA INSPECTION ---');
    const { data: prods, error: pErr } = await supabaseAdmin.from('products').select('*').limit(3);
    if (pErr) {
      console.log('Products fetch error:', pErr.message);
    } else {
      console.log(`Retrieved ${prods.length} sample products from database:`);
      prods.forEach((p, idx) => {
        console.log(`\n[Product ${idx + 1}] ID: ${p.id} | Name: ${p.name || p.title}`);
        console.log('Keys present in record:', Object.keys(p));
        console.log('MRP:', p.mrp, '| General Price:', p.general_price || p.price);
        console.log('Stock column value:', p.stock);
        console.log('Shades count:', Array.isArray(p.shades) ? p.shades.length : (p.shades ? 'JSON object' : 'null'));
      });
    }

    // Inspect orders
    console.log('\n--- 4. SAMPLE ORDERS SCHEMA INSPECTION ---');
    const { data: ordersData, error: oErr } = await supabaseAdmin.from('orders').select('*').limit(2);
    if (oErr) {
      console.log('Orders fetch error:', oErr.message);
    } else {
      console.log(`Retrieved ${ordersData.length} sample orders:`);
      ordersData.forEach((o, idx) => {
        console.log(`[Order ${idx + 1}] ID: ${o.id} | Status: ${o.status} | Total: ${o.total || o.total_amount}`);
      });
    }
  }
}

probe();
