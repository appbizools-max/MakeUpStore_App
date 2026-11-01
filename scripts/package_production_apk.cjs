const fs = require('fs');
const path = require('path');
const child = require('child_process');

const PROJECT_ROOT = 'e:/MakeUpStore_App-main/MakeUpStore_App';
const WORKSPACE_ROOT = 'e:/MakeUpStore_App-main';
const BASE_APK = path.join(PROJECT_ROOT, 'app/android/app/build/outputs/apk/debug/app-debug.apk');
const BUNDLE_SRC = path.join(PROJECT_ROOT, 'app/android/app/src/main/assets/index.android.bundle');
const ASSETS_SRC = path.join(PROJECT_ROOT, 'app/android/app/src/main/res');
const RELEASE_KEYSTORE = path.join(PROJECT_ROOT, 'app/android/app/release.keystore');
const DEBUG_KEYSTORE = path.join(PROJECT_ROOT, 'app/android/app/debug.keystore');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'release-output');
const STAGING_DIR = path.join(PROJECT_ROOT, 'app/android/app/build/staging_apk');

const PROD_APK = path.join(OUTPUT_DIR, 'Salbeau-MakeupStore-Production-v1.0.1.apk');
const DEBUG_APK = path.join(OUTPUT_DIR, 'Salbeau-MakeupStore-Debug-v1.0.1.apk');
const LEGACY_PROD_APK = path.join(OUTPUT_DIR, 'Salbeau-MakeupStore-Production-v1.0.0.apk');

console.log('=== SALBEAU COMPREHENSIVE APK BUILD PIPELINE (PROD & DEBUG) ===');

if (!fs.existsSync(BASE_APK)) {
  console.error('ERROR: Base APK not found at:', BASE_APK);
  process.exit(1);
}
if (!fs.existsSync(BUNDLE_SRC)) {
  console.error('ERROR: Compiled JS bundle not found at:', BUNDLE_SRC);
  process.exit(1);
}
if (!fs.existsSync(RELEASE_KEYSTORE)) {
  console.error('ERROR: Release keystore not found at:', RELEASE_KEYSTORE);
  process.exit(1);
}

// Prepare Staging & Output Dirs
console.log('[1/6] Preparing staging directory...');
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Extract Base APK
console.log('[2/6] Extracting base APK contents...');
child.execSync(`tar -xf "${BASE_APK}" -C "${STAGING_DIR}"`);

// Inject Production Offline Bundle & Assets
console.log('[3/6] Injecting offline bundle and assets...');
const targetAssetsDir = path.join(STAGING_DIR, 'assets');
if (!fs.existsSync(targetAssetsDir)) {
  fs.mkdirSync(targetAssetsDir, { recursive: true });
}
fs.copyFileSync(BUNDLE_SRC, path.join(targetAssetsDir, 'index.android.bundle'));
console.log('  -> Copied index.android.bundle (' + (fs.statSync(BUNDLE_SRC).size / 1024).toFixed(1) + ' KB)');

if (fs.existsSync(ASSETS_SRC)) {
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    for (const item of items) {
      const s = path.join(src, item);
      const d = path.join(dest, item);
      if (fs.statSync(s).isDirectory()) {
        copyRecursive(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  };
  copyRecursive(ASSETS_SRC, path.join(STAGING_DIR, 'res'));
  console.log('  -> Synced production resources into res/');
}

// Purge legacy signatures
console.log('[4/6] Purging legacy signatures from META-INF...');
const metaInfDir = path.join(STAGING_DIR, 'META-INF');
if (fs.existsSync(metaInfDir)) {
  const sigFiles = fs.readdirSync(metaInfDir).filter(f => 
    f.endsWith('.RSA') || f.endsWith('.SF') || f.endsWith('.MF') || f.endsWith('.DSA') || f.endsWith('.EC')
  );
  for (const f of sigFiles) {
    fs.unlinkSync(path.join(metaInfDir, f));
  }
}

// Package un-signed container
console.log('[5/6] Packaging APK containers...');
const unsignedApk = path.join(OUTPUT_DIR, 'unsigned_temp.apk');
if (fs.existsSync(unsignedApk)) fs.unlinkSync(unsignedApk);
child.execSync(`jar -c -f "${unsignedApk}" -M -C "${STAGING_DIR}" .`);

// Cleanup staging
fs.rmSync(STAGING_DIR, { recursive: true, force: true });

// Step 6: Generate Production-Signed APK
console.log('[6/6] Generating Production-Signed APK (release.keystore)...');
fs.copyFileSync(unsignedApk, PROD_APK);
const prodSignCmd = `jarsigner -keystore "${RELEASE_KEYSTORE}" -storepass salbeau123 -keypass salbeau123 -sigalg SHA256withRSA -digestalg SHA-256 "${PROD_APK}" salbeau-release-key`;
child.execSync(prodSignCmd);
fs.copyFileSync(PROD_APK, LEGACY_PROD_APK);
fs.copyFileSync(PROD_APK, path.join(WORKSPACE_ROOT, 'Salbeau-MakeupStore-Production-v1.0.1.apk'));
fs.copyFileSync(PROD_APK, path.join(WORKSPACE_ROOT, 'Salbeau-MakeupStore-Production-v1.0.0.apk'));
console.log('  -> Production APK verified:', child.execSync(`jarsigner -verify "${PROD_APK}"`).toString().trim());

// Generate Debug-Signed APK (matches existing developer installs on phone)
console.log('Generating Debug-Signed APK (debug.keystore)...');
fs.copyFileSync(unsignedApk, DEBUG_APK);
const debugSignCmd = `jarsigner -keystore "${DEBUG_KEYSTORE}" -storepass android -keypass android -sigalg SHA256withRSA -digestalg SHA-256 "${DEBUG_APK}" androiddebugkey`;
child.execSync(debugSignCmd);
fs.copyFileSync(DEBUG_APK, path.join(WORKSPACE_ROOT, 'Salbeau-MakeupStore-Debug-v1.0.1.apk'));
console.log('  -> Debug APK verified:', child.execSync(`jarsigner -verify "${DEBUG_APK}"`).toString().trim());

// Remove temp
fs.unlinkSync(unsignedApk);

console.log('\n================ BUILD SUMMARY ================');
console.log('1. Production APK (Official Clean Install / Play Store):');
console.log('   Path:', PROD_APK);
console.log('   Size:', (fs.statSync(PROD_APK).size / (1024 * 1024)).toFixed(2), 'MB');
console.log('2. Debug-Signed APK (For directly updating existing dev apps on phone):');
console.log('   Path:', DEBUG_APK);
console.log('   Size:', (fs.statSync(DEBUG_APK).size / (1024 * 1024)).toFixed(2), 'MB');
console.log('===============================================');
