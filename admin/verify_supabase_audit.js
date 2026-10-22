import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runAudit() {
  console.log('================================================================');
  console.log('   SALBEAU MAKEUPSTORE APP - SUPABASE AUDIT & HEALTH PROBE');
  console.log('   Target:', SUPABASE_URL);
  console.log('================================================================\n');

  const tables = ['brands', 'products', 'users', 'orders', 'categories', 'abandoned_carts', 'favorites'];
  const tableStatus = {};

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(3);
      if (error) {
        tableStatus[t] = { exists: false, error: error.message, count: 0 };
      } else {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        tableStatus[t] = { exists: true, count: count ?? data?.length ?? 0 };
      }
    } catch (e) {
      tableStatus[t] = { exists: false, error: e.message, count: 0 };
    }
  }

  console.log('--- 1. TABLE PRESENCE & ROW COUNTS ---');
  for (const [tbl, stat] of Object.entries(tableStatus)) {
    if (stat.exists) {
      console.log(`  [PASS] public.${tbl.padEnd(16)} EXISTS (${stat.count} rows)`);
    } else {
      console.log(`  [FAIL] public.${tbl.padEnd(16)} MISSING -> ${stat.error}`);
    }
  }

  console.log('\n--- 2. COLUMN VERIFICATION ---');
  // Check products columns
  const productCols = ['barcode', 'shades', 'quantity_tiers'];
  for (const col of productCols) {
    const { error } = await supabase.from('products').select(col).limit(1);
    if (error) {
      console.log(`  [FAIL] products.${col.padEnd(16)} MISSING: ${error.message}`);
    } else {
      console.log(`  [PASS] products.${col.padEnd(16)} PRESENT`);
    }
  }

  // Check users columns
  const userCols = ['full_name', 'email', 'pincode', 'city', 'state'];
  for (const col of userCols) {
    const { error } = await supabase.from('users').select(col).limit(1);
    if (error) {
      console.log(`  [FAIL] users.${col.padEnd(19)} MISSING: ${error.message}`);
    } else {
      console.log(`  [PASS] users.${col.padEnd(19)} PRESENT`);
    }
  }

  // Check orders columns
  const { error: ordErr } = await supabase.from('orders').select('delivery_instructions').limit(1);
  if (ordErr) {
    console.log(`  [FAIL] orders.delivery_instructions MISSING: ${ordErr.message}`);
  } else {
    console.log(`  [PASS] orders.delivery_instructions PRESENT`);
  }

  // Check brands columns
  const { error: brandErr } = await supabase.from('brands').select('category').limit(1);
  if (brandErr) {
    console.log(`  [FAIL] brands.category             MISSING: ${brandErr.message}`);
  } else {
    console.log(`  [PASS] brands.category             PRESENT`);
  }

  console.log('\n--- 3. USER DATA INTEGRITY (JSON STUFFING CHECK) ---');
  try {
    const { data: usersWithJson } = await supabase.from('users').select('id, name, business_name').like('business_name', '{%email%}');
    if (usersWithJson && usersWithJson.length > 0) {
      console.log(`  [WARN] Found ${usersWithJson.length} users with legacy JSON stuffed in business_name:`);
      for (const u of usersWithJson) {
        console.log(`         User ${u.id} (${u.name}): ${u.business_name}`);
      }
    } else {
      console.log('  [PASS] 0 users with JSON-stuffed business_name detected.');
    }
  } catch (e) {
    console.log('  [INFO] Could not check users table JSON stuffing:', e.message);
  }

  console.log('\n================================================================');
  console.log('   AUDIT PROBE COMPLETED');
  console.log('================================================================\n');
}

runAudit();
