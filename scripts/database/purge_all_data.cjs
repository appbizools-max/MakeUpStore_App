/**
 * SALBEAU ENTERPRISE — FULL DATABASE & USER PURGE SCRIPT
 * 
 * Safely purges:
 * 1. All Users (public.users) & Supabase Auth Accounts (auth.users)
 * 2. All Admins / Staff (public.employees, permissions, activity logs, staged ops)
 * 3. Complete Database Data (orders, products, categories, brands, carts, verifications, banners, etc.)
 */

const { createClient } = require('e:/MakeUpStore_App-main/MakeUpStore_App/admin/node_modules/@supabase/supabase-js');

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const ALL_TABLES = [
  'verification_documents',
  'verification_history',
  'b2b_verifications',
  'employee_permissions',
  'employee_activity_logs',
  'employee_staged_operations',
  'employees',
  'customer_search_requests',
  'abandoned_carts',
  'favorites',
  'notifications',
  'import_history',
  'orders',
  'products',
  'home_banners',
  'pricing_rules',
  'categories',
  'brands',
  'users',
  'home_config',
  'home_sections'
];

async function purgeCompleteDatabase() {
  console.log('================================================================');
  console.log('   SALBEAU - COMPLETE DATABASE PURGE UTILITY');
  console.log('   Target URL:', SUPABASE_URL);
  console.log('================================================================\n');

  console.log('Step 1: Purging Supabase Public Tables...');
  for (const table of ALL_TABLES) {
    try {
      const { data, error } = await supabase.from(table).delete().not('id', 'is', null);
      if (error) {
        // Fallback for tables that might not have an id column
        const { error: fallbackErr } = await supabase.from(table).delete().neq('created_at', '1900-01-01');
        if (fallbackErr) {
          console.log(`  [-] Table ${table.padEnd(28)}: Note -> ${error.message}`);
        } else {
          console.log(`  [+] Table ${table.padEnd(28)}: PURGED SUCCESSFULLY`);
        }
      } else {
        console.log(`  [+] Table ${table.padEnd(28)}: PURGED SUCCESSFULLY`);
      }
    } catch (e) {
      console.log(`  [-] Table ${table.padEnd(28)}: Exception -> ${e.message}`);
    }
  }

  console.log('\nStep 2: Purging Supabase Auth Users...');
  try {
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.log(`  [-] Auth Users List Failed: ${listErr.message}`);
    } else if (!users || users.length === 0) {
      console.log('  [+] 0 Auth Users found. Auth table is clean.');
    } else {
      console.log(`  Found ${users.length} Auth User(s). Deleting...`);
      for (const u of users) {
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (delErr) {
          console.log(`  [-] Failed to delete user ${u.id} (${u.email || u.phone}): ${delErr.message}`);
        } else {
          console.log(`  [+] Deleted Auth User: ${u.id} (${u.email || u.phone})`);
        }
      }
    }
  } catch (e) {
    console.log(`  [-] Auth Users purge exception: ${e.message}`);
  }

  console.log('\n================================================================');
  console.log('   PURGE OPERATION COMPLETED');
  console.log('================================================================\n');
}

purgeCompleteDatabase();
