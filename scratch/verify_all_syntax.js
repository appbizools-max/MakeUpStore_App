const fs = require('fs');
const esbuild = require('esbuild');

const files = [
  'admin/src/App.jsx',
  'admin/src/context/AdminContext.jsx',
  'admin/src/components/common/AdminSidebar.jsx',
  'admin/src/components/settings/GeneralSettingsPage.jsx',
  'admin/src/components/settings/BranchManagementPage.jsx',
  'admin/src/components/payments/UpiPaymentVerificationPage.jsx',
  'admin/src/components/governance/employees/AddEmployeePage.jsx',
  'admin/src/components/governance/employees/EditEmployeePage.jsx',
  'admin/src/components/orders/DeliveryPartnerManagementPage.jsx',
  'app/src/context/AppContext.js',
  'app/src/features/home/HomeScreen.js',
  'app/src/features/cart/CartScreen.js',
  'app/src/features/cart/PlaceOrderScreen.js',
  'app/src/features/cart/CustomerUpiPaymentStatusScreen.js',
  'app/src/features/staff/DeliveryPartnerDashboard.js',
  'app/src/features/staff/staffAuthService.js'
];

let failed = 0;
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    const loader = file.endsWith('.jsx') ? 'jsx' : 'js';
    esbuild.transformSync(code, { loader, jsx: 'transform' });
    console.log(`[PASS] ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}:`, err.message);
    failed++;
  }
}

if (failed === 0) {
  console.log('\nAll 16 critical files passed esbuild AST validation successfully!');
} else {
  process.exit(1);
}

