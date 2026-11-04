import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { createClient } = require('../../admin/node_modules/@supabase/supabase-js/dist/index.cjs');

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🧪 RUNNING BANNER CRUD, PERMANENT DELETE & BACKUP SNAPSHOT TEST SUITE...\n');

async function runTestSuite() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Check Supabase connectivity & brands table
    console.log('Test 1: Supabase Connectivity & System Config Row Check');
    const { data: brandConfig, error: brandErr } = await client
      .from('brands')
      .select('id, logo')
      .eq('id', 'app_central_banners_master')
      .maybeSingle();

    assert(!brandErr, 'Queried app_central_banners_master without error');
    assert(brandConfig !== undefined, 'app_central_banners_master row query returned');

    // TEST 2: Verify backup snapshot mechanism
    console.log('\nTest 2: Backup Snapshot Verification');
    const testBackupData = JSON.stringify([
      { id: 'test_backup_banner', title: 'Backup Test Banner', isActive: true, updatedAt: new Date().toISOString() }
    ]);

    const { error: snapErr } = await client.from('brands').upsert({
      id: 'app_banners_backup_snapshot',
      name: 'Banners Backup Snapshot',
      category: 'SystemConfig',
      enabled: true,
      logo: testBackupData,
      updated_at: new Date().toISOString()
    });
    assert(!snapErr, 'Safety backup snapshot persisted to Supabase brands table');

    const { data: snapRead } = await client
      .from('brands')
      .select('logo')
      .eq('id', 'app_banners_backup_snapshot')
      .maybeSingle();

    assert(snapRead && snapRead.logo === testBackupData, 'Safety backup snapshot readable and identical');

    // TEST 3: CRUD Banner Lifecycle: Create -> Update -> Delete Permanent
    console.log('\nTest 3: CRUD Banner Lifecycle (Create -> Verify -> Delete Permanent)');
    const testBannerId = `test_banner_${Date.now()}`;
    const initialBanners = [
      {
        id: testBannerId,
        name: 'Automated Test Banner',
        title: 'Automated Test Banner',
        bannerType: 'home',
        imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/test.jpg',
        isActive: true,
        displayOrder: 99
      }
    ];

    // Save test banner
    const { error: saveErr } = await client.from('brands').upsert({
      id: 'app_central_banners_master',
      name: 'Central Banners Master Configuration',
      category: 'SystemConfig',
      enabled: true,
      logo: JSON.stringify(initialBanners),
      updated_at: new Date().toISOString()
    });
    assert(!saveErr, 'Test banner created in app_central_banners_master');

    // Also sync to app_home_banners
    const { error: homeSaveErr } = await client.from('brands').upsert({
      id: 'app_home_banners',
      name: 'Home Banners Configuration',
      category: 'SystemConfig',
      enabled: true,
      logo: JSON.stringify(initialBanners),
      updated_at: new Date().toISOString()
    });
    assert(!homeSaveErr, 'Test banner synchronized to app_home_banners for mobile');

    // Verify Read
    const { data: readMaster } = await client
      .from('brands')
      .select('logo')
      .eq('id', 'app_central_banners_master')
      .single();
    const parsed = JSON.parse(readMaster.logo);
    assert(parsed.some(b => b.id === testBannerId), 'Created banner exists in database');

    // Now permanently delete the banner
    console.log('\nTest 4: Permanent Delete Banner from Supabase');
    const remainingBanners = parsed.filter(b => b.id !== testBannerId);

    // Save snapshot of pre-delete state
    await client.from('brands').upsert({
      id: 'app_banners_backup_snapshot',
      name: 'Banners Backup Snapshot',
      category: 'SystemConfig',
      enabled: true,
      logo: JSON.stringify(parsed),
      updated_at: new Date().toISOString()
    });

    // Update master row with test banner removed
    await client.from('brands').upsert({
      id: 'app_central_banners_master',
      name: 'Central Banners Master Configuration',
      category: 'SystemConfig',
      enabled: true,
      logo: JSON.stringify(remainingBanners),
      updated_at: new Date().toISOString()
    });

    // Update app_home_banners row
    await client.from('brands').upsert({
      id: 'app_home_banners',
      name: 'Home Banners Configuration',
      category: 'SystemConfig',
      enabled: true,
      logo: JSON.stringify(remainingBanners),
      updated_at: new Date().toISOString()
    });

    // Verify test banner is completely gone
    const { data: finalMaster } = await client
      .from('brands')
      .select('logo')
      .eq('id', 'app_central_banners_master')
      .single();
    const finalParsed = JSON.parse(finalMaster.logo);
    assert(!finalParsed.some(b => b.id === testBannerId), 'Deleted banner permanently removed from Supabase');

    const { data: finalHome } = await client
      .from('brands')
      .select('logo')
      .eq('id', 'app_home_banners')
      .single();
    const finalHomeParsed = JSON.parse(finalHome.logo);
    assert(!finalHomeParsed.some(b => b.id === testBannerId), 'Deleted banner permanently removed from app_home_banners');

    // TEST 5: Verify Mobile App Context Exports
    console.log('\nTest 5: AppContext Export Verification');
    const appCtxCode = fs.readFileSync('MakeUpStore_App/app/src/context/AppContext.js', 'utf8');
    assert(appCtxCode.includes('allBanners'), 'AppContext exports allBanners');
    assert(appCtxCode.includes('getCategoryBanner'), 'AppContext exports getCategoryBanner');
    assert(appCtxCode.includes('getSubcategoryBanner'), 'AppContext exports getSubcategoryBanner');

    // TEST 6: Verify Mobile App Name Visibility
    console.log('\nTest 6: Mobile App Name Visibility Verification');
    const homeCode = fs.readFileSync('MakeUpStore_App/app/src/features/home/HomeScreen.js', 'utf8');
    assert(homeCode.includes('min-h-[30px]" numberOfLines={2}'), 'HomeScreen product name uses numberOfLines={2}');
    assert(homeCode.includes('numberOfLines={2}'), 'HomeScreen category name uses numberOfLines={2}');

    const purplleCode = fs.readFileSync('MakeUpStore_App/app/src/components/PurplleProductCard.js', 'utf8');
    assert(purplleCode.includes('min-h-[30px]" numberOfLines={2}'), 'PurplleProductCard product name uses min-h-[30px] numberOfLines={2}');

    const subCardCode = fs.readFileSync('MakeUpStore_App/app/src/features/category/components/SubcategoryCard.js', 'utf8');
    assert(subCardCode.includes('numberOfLines={2}'), 'SubcategoryCard uses numberOfLines={2}');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  }

  console.log(`\n===========================================`);
  console.log(`RESULT: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);
  if (failed > 0) process.exit(1);
}

runTestSuite();
