/**
 * SALBEAU MAKEUPSTORE - SIDEBAR FUNCTIONALITY & NAVIGATION AUDIT TEST SUITE
 * Tests:
 * 1. Reorganized Information Architecture (Phase 2 compliance)
 * 2. 100% Valid Route Mapping for Every Sidebar Item
 * 3. Precise Active Tab Route Matching & Submenu Auto-Expansion
 * 4. Parent-Child Collapsible Hierarchy
 * 5. Data Integrity: Real Badges & Removal of Decorative "Fast" / "Active" tags
 * 6. RBAC Permission Filtering for Subordinate Roles
 */

import fs from 'fs';
import path from 'path';

// Valid routes recognized in App.jsx
const VALID_ADMIN_ROUTES = new Set([
  'dashboard',
  'dashboard_visibility',
  'home_banners',
  'categories',
  'add_brand',
  'products',
  'products/new',
  'products/bulk',
  'attributes',
  'order_updated',
  'approval_center',
  'users',
  'users/b2c',
  'users/b2b',
  'user',
  'user/b2c',
  'user/b2b',
  'search_requests',
  'abandoned_carts',
  'b2b-verification',
  'b2b-verification/salon',
  'b2b-verification/makeup-artist',
  'b2b-verification/beautician',
  'b2b_verification',
  'cancel_fee',
  'pricing_rules',
  'employees',
  'employees/new',
  'employees/activity',
  'audit_trail',
  'quick_panel',
  'settings'
]);

// Expected Phase 2 Navigation Hierarchy
const EXPECTED_SECTIONS = [
  'OVERVIEW',
  'STORE MANAGEMENT',
  'PRODUCT MANAGEMENT',
  'ORDERS & APPROVALS',
  'CUSTOMER MANAGEMENT',
  'B2B VERIFICATIONS',
  'PRICING & REVENUE',
  'STAFF & GOVERNANCE',
  'SYSTEM & QUICK ACCESS'
];

async function runSidebarTestSuite() {
  console.log('================================================================');
  console.log('💄 SALBEAU MAKEUPSTORE: SIDEBAR REDESIGN AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failCount++;
    }
  }

  // TEST 1: Inspect AdminSidebar.jsx file structure
  console.log('--- TEST 1: AdminSidebar Component Architecture ---');
  const sidebarFile = path.resolve('../../admin/src/components/common/AdminSidebar.jsx');
  assert('AdminSidebar.jsx component exists in components/common', fs.existsSync(sidebarFile));

  const sidebarContent = fs.readFileSync(sidebarFile, 'utf8');

  // TEST 2: Section Hierarchy Check
  console.log('\n--- TEST 2: Information Architecture & Sections ---');
  for (const sec of EXPECTED_SECTIONS) {
    assert(`Contains section: "${sec}"`, sidebarContent.includes(`title: '${sec}'`));
  }

  // TEST 3: Route Validity Check
  console.log('\n--- TEST 3: Route Destination Verification ---');
  const idMatches = sidebarContent.match(/id:\s*['"]([^'"]+)['"]/g) || [];
  const extractedIds = idMatches.map(m => m.replace(/id:\s*['"]/, '').replace(/['"]/, ''));

  assert('Sidebar defines at least 15 distinct navigation items', extractedIds.length >= 15);

  let allRoutesValid = true;
  for (const id of extractedIds) {
    if (!VALID_ADMIN_ROUTES.has(id)) {
      console.error(`Unknown route ID in sidebar: ${id}`);
      allRoutesValid = false;
    }
  }
  assert('100% of sidebar items map to existing, valid application routes', allRoutesValid);

  // TEST 4: Brand Directory Terminology Check
  console.log('\n--- TEST 4: Brand Directory Terminology Normalization ---');
  assert('Brand menu item uses consistent label "Brands" instead of "Add Brand"', sidebarContent.includes("label: 'Brands'"));

  // TEST 5: Decorative Badges Removal Check
  console.log('\n--- TEST 5: Decorative Badge Policy Enforcement ---');
  assert('Decorative "Fast" badge removed from Bulk Product Entry', !sidebarContent.includes("badge: 'Fast'"));
  assert('Fake "Active" badge removed from Log Out button', !sidebarContent.includes("badge: 'Active'"));

  // TEST 6: Real Dynamic Data Badges
  console.log('\n--- TEST 6: Dynamic Data-Driven Badges ---');
  assert('Home Banners badge computes real active count', sidebarContent.includes('activeBannersCount'));
  assert('Categories badge uses real categories.length', sidebarContent.includes('(categories || []).length'));
  assert('Brands badge uses real brands.length', sidebarContent.includes('(brands || []).length'));
  assert('Products badge uses real products.length', sidebarContent.includes('(products || []).length'));
  assert('Users badge uses real users.length', sidebarContent.includes('(users || []).length'));
  assert('B2C Users badge uses real b2cUsersCount', sidebarContent.includes('b2cUsersCount'));
  assert('B2B Users badge uses real b2bUsersCount', sidebarContent.includes('b2bUsersCount'));
  assert('Approval Center badge computes real pendingApprovalsCount', sidebarContent.includes('pendingApprovalsCount'));

  // TEST 7: Collapsible Parent-Child Menus
  console.log('\n--- TEST 7: Collapsible Submenus Architecture ---');
  assert('Users item has subItems for B2C and B2B', sidebarContent.includes("id: 'users/b2c'") && sidebarContent.includes("id: 'users/b2b'"));
  assert('B2B Applications item has subItems for Salon, MUA, Beautician', sidebarContent.includes("id: 'b2b-verification/salon'") && sidebarContent.includes("id: 'b2b-verification/makeup-artist'"));
  assert('Employees item has subItems for All Employees and Activity', sidebarContent.includes("id: 'employees/activity'"));

  // TEST 8: Accessibility & Semantic Structure
  console.log('\n--- TEST 8: Accessibility & Semantics ---');
  assert('Sidebar uses semantic <aside> landmark with aria-label', sidebarContent.includes('<aside') && sidebarContent.includes('aria-label='));
  assert('Navigation uses semantic <nav> landmark with aria-label', sidebarContent.includes('<nav') && sidebarContent.includes('aria-label='));
  assert('Interactive items use semantic <button type="button">', sidebarContent.includes('type="button"'));
  assert('Submenu parents support aria-expanded', sidebarContent.includes('aria-expanded='));
  assert('Focus rings implemented for keyboard accessibility', sidebarContent.includes('focus-visible:ring-2'));

  // TEST 9: Viewport Height & Independent Scrollbar
  console.log('\n--- TEST 9: Viewport Height & Independent Scrolling ---');
  assert('Sidebar occupies full viewport height with h-screen max-h-screen', sidebarContent.includes('h-screen max-h-screen'));
  assert('Navigation list scrolls independently with overflow-y-auto', sidebarContent.includes('overflow-y-auto'));
  assert('Navigation list has id="admin-sidebar-nav" for targeting', sidebarContent.includes('id="admin-sidebar-nav"'));
  assert('Persistent footer pinned at bottom with mt-auto', sidebarContent.includes('mt-auto'));

  // TEST 10: App.jsx Integration
  console.log('\n--- TEST 10: App.jsx Integration ---');
  const appFile = path.resolve('../../admin/src/App.jsx');
  const appContent = fs.readFileSync(appFile, 'utf8');
  assert('App.jsx imports AdminSidebar component', appContent.includes("import AdminSidebar from './components/common/AdminSidebar'"));
  assert('App.jsx renders <AdminSidebar', appContent.includes('<AdminSidebar'));

  console.log('\n================================================================');
  console.log(`SIDEBAR TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) process.exit(1);
}

runSidebarTestSuite();
