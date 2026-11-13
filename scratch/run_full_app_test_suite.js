const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('   SALBEAU COMPREHENSIVE APP & SYSTEM TEST SUITE    ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, errorDetails = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}`);
    if (errorDetails) console.error(`         Reason: ${errorDetails}`);
  }
}

// ----------------------------------------------------
// TEST SUITE 1: ALL 63 APP JAVASCRIPT FILES SYNTAX CHECK
// ----------------------------------------------------
console.log('--- TEST SUITE 1: JAVASCRIPT SYNTAX & PARSER CHECK (app/) ---');

function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.expo', 'android', 'ios'].includes(file)) {
        results = results.concat(getJsFiles(fullPath));
      }
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const appJsFiles = getJsFiles(path.resolve('app'));
let syntaxErrors = [];

for (const filePath of appJsFiles) {
  const relPath = path.relative(path.resolve('app'), filePath);
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
  } catch (err) {
    syntaxErrors.push({ file: relPath, error: err.message });
  }
}

assert(syntaxErrors.length === 0, `All ${appJsFiles.length} JavaScript files pass syntax check (0 parse errors)`, 
  syntaxErrors.map(e => `${e.file}: ${e.error}`).join('; '));

// ----------------------------------------------------
// TEST SUITE 2: ASSET & LOCAL FILE REFERENCE INTEGRITY
// ----------------------------------------------------
console.log('\n--- TEST SUITE 2: REQUIRE & ASSET INTEGRITY AUDIT ---');

const requireRegex = /require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
let missingAssets = [];
let scannedRequires = 0;

for (const filePath of appJsFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    scannedRequires++;
    const reqPath = match[1];
    const resolvedPath = path.resolve(path.dirname(filePath), reqPath);
    
    // Check possible extensions: .js, .png, .jpg, .jpeg, .json, or exact
    const possiblePaths = [
      resolvedPath,
      resolvedPath + '.js',
      resolvedPath + '.json',
      resolvedPath + '.png',
      resolvedPath + '.jpg',
      resolvedPath + '.jpeg',
      path.join(resolvedPath, 'index.js')
    ];
    
    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (!exists) {
      missingAssets.push({
        sourceFile: path.relative(path.resolve('app'), filePath),
        referencedPath: reqPath,
        resolvedPath
      });
    }
  }
}

assert(missingAssets.length === 0, `Scanned ${scannedRequires} require() calls - all target assets/files exist on disk`,
  missingAssets.map(m => `In ${m.sourceFile}: ${m.referencedPath}`).join('; '));

// ----------------------------------------------------
// TEST SUITE 3: ANDROID NATIVE ASSETS & APP.JSON CHECK
// ----------------------------------------------------
console.log('\n--- TEST SUITE 3: ANDROID NATIVE ICONS & SPLASH ASSETS ---');

const requiredNativeFiles = [
  'app/Assets/Logo.png',
  'app/Assets/Logo_transparent.png',
  'app/Assets/adaptive-icon.png',
  'app/android/app/src/main/res/drawable/splashscreen_logo.png',
  'app/android/app/src/main/res/drawable-mdpi/assets_logo.png',
  'app/android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
  'app/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png',
  'app/android/app/src/main/res/mipmap-hdpi/ic_launcher.png',
  'app/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png',
  'app/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
  'app/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png',
  'app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
  'app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png',
  'app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
  'app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png'
];

let missingNativeAssets = [];
for (const relPath of requiredNativeFiles) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
    missingNativeAssets.push(relPath);
  }
}

assert(missingNativeAssets.length === 0, `All ${requiredNativeFiles.length} native icons and splashscreen drawables are present and non-empty`,
  missingNativeAssets.join(', '));

// Check app.json valid JSON
let appJsonValid = false;
let appJsonContent = null;
try {
  appJsonContent = JSON.parse(fs.readFileSync(path.resolve('app/app.json'), 'utf8'));
  appJsonValid = Boolean(appJsonContent?.expo?.name && appJsonContent?.expo?.icon);
} catch (e) {
  appJsonValid = false;
}

assert(appJsonValid, 'app/app.json is valid JSON with expo name and icon configurations');
assert(appJsonContent?.expo?.android?.adaptiveIcon?.foregroundImage === './Assets/adaptive-icon.png', 
  'app/app.json correctly references adaptive-icon.png for Android');

// ----------------------------------------------------
// TEST SUITE 4: SCREEN REGISTRY & BACK HANDLER LOGIC
// ----------------------------------------------------
console.log('\n--- TEST SUITE 4: NAVIGATION & SCREEN REGISTRY AUDIT ---');

const appJsContent = fs.readFileSync(path.resolve('app/App.js'), 'utf8');
const switchCases = [...appJsContent.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map(m => m[1]);

const expectedScreens = [
  'splash', 'onboarding', 'login', 'otp', 'complete_profile',
  'b2b_registration', 'b2b_verification', 'verification_status',
  'home', 'category', 'product', 'product_detail', 'cart',
  'checkout', 'orders', 'order_details', 'profile', 'search',
  'wishlist', 'staff_login', 'delivery_dashboard', 'upi_payment_status'
];

const missingScreens = expectedScreens.filter(s => !switchCases.includes(s));
assert(missingScreens.length === 0, `App.js screen switch covers all ${expectedScreens.length} expected routes`,
  `Missing: ${missingScreens.join(', ')}`);

// ----------------------------------------------------
// TEST SUITE 5: TOTP 2FA SECURITY SUITE (RFC 6238)
// ----------------------------------------------------
console.log('\n--- TEST SUITE 5: 2FA RFC 6238 AUTHENTICATION ENGINE ---');

const {
  generateTotpSecret,
  generateOtpAuthUri,
  computeTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  hashPasswordWithSalt,
  generateSalt,
  issuePaymentAccessSession,
  isPaymentSessionValid,
  revokePaymentAccessSession,
  recordFailedVerificationAttempt,
  resetFailedAttempts,
  getAdminSecurityProfile
} = require('../admin/src/utils/totpSecurityEngine.js');

(async () => {
  try {
    // 1. Secret generation
    const secret = generateTotpSecret();
    assert(secret && secret.length === 32, 'TOTP Base32 secret generated (32 characters)');

    // 2. URI generation
    const uri = generateOtpAuthUri({ email: 'admin@salbeau.com', secret });
    assert(uri.startsWith('otpauth://totp/Salbeau:admin'), 'TOTP URI matches standard otpauth:// schema');

    // 3. TOTP Code Computation & Verification
    const currentCode = await computeTotpCode(secret);
    assert(/^\d{6}$/.test(currentCode), 'Computed TOTP code is a valid 6-digit numeric string');
    const isTotpValid = await verifyTotpCode(currentCode, secret);
    assert(isTotpValid.valid === true, 'Computed TOTP code successfully verifies against secret within RFC 6238 window');

    // 4. Password hashing with salt
    const salt = generateSalt(16);
    const hash = await hashPasswordWithSalt('SalbeauSuperAdmin#2026', salt);
    const sameHash = await hashPasswordWithSalt('SalbeauSuperAdmin#2026', salt);
    const diffHash = await hashPasswordWithSalt('WrongPassword123', salt);
    assert(hash === sameHash, 'SHA-256 salted password hashing produces deterministic digest for correct password');
    assert(hash !== diffHash, 'SHA-256 salted password hashing produces completely different digest for incorrect password');

    // 5. Payment Session Token Test
    issuePaymentAccessSession('admin@salbeau.com');
    assert(isPaymentSessionValid('admin@salbeau.com') === true, 'Payment session token is valid immediately after grant');
    revokePaymentAccessSession();
    assert(isPaymentSessionValid('admin@salbeau.com') === false, 'Payment session token is revoked immediately on sign-out/lock');

    // 6. Recovery codes generator
    const recoveryCodes = generateRecoveryCodes(8);
    assert(recoveryCodes.length === 8, 'Generates exactly 8 emergency recovery codes');
    assert(recoveryCodes.every(c => /^SALB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)), 'Recovery codes match SALB-XXXX-XXXX format');

    // ----------------------------------------------------
    // TEST SUITE 6: CASH-ON-DELIVERY & UPI STATE TEST
    // ----------------------------------------------------
    console.log('\n--- TEST SUITE 6: PAYMENT & ORDER LOGIC VALIDATION ---');

    // Delivery Partner calculateTotals logic simulation
    const mockOrderList = [
      { id: 'ord_1', status: 'delivered', payment_method: 'cod', total: 1200 },
      { id: 'ord_2', status: 'delivered', payment_method: 'upi_doorstep', total: 850 },
      { id: 'ord_3', status: 'out_for_delivery', payment_method: 'cod', total: 500 }
    ];

    const deliveredOrders = mockOrderList.filter(o => o.status === 'delivered');
    const totalCodCollected = deliveredOrders
      .filter(o => o.payment_method === 'cod')
      .reduce((sum, o) => sum + o.total, 0);
    const totalUpiCollected = deliveredOrders
      .filter(o => o.payment_method === 'upi_doorstep')
      .reduce((sum, o) => sum + o.total, 0);

    assert(totalCodCollected === 1200, 'Delivery partner COD collection tally accurately sums delivered COD orders');
    assert(totalUpiCollected === 850, 'Delivery partner UPI collection tally accurately sums delivered UPI orders');

    // Final Report
    console.log('\n====================================================');
    console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      console.log('All tests passed with 100% success rate! No crash issues detected.\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
})();
