const fs = require('fs');
const child = require('child_process');

const apkPath = 'e:/MakeUpStore_App-main/MakeUpStore_App/app/android/app/build/outputs/apk/debug/app-debug.apk';
console.log('Exists:', fs.existsSync(apkPath));
console.log('Size:', (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2), 'MB');

try {
  const listing = child.execSync(`tar -tf "${apkPath}"`).toString().split(/\r?\n/).filter(Boolean);
  console.log('Total entries:', listing.length);
  const bundleEntries = listing.filter(e => e.includes('bundle') || e.includes('assets'));
  console.log('Bundle/Assets entries count:', bundleEntries.length);
  console.log('First 10 bundle/asset entries:', bundleEntries.slice(0, 10));
} catch (e) {
  console.error('Tar error:', e.message);
}

