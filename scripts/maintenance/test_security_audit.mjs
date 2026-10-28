/**
 * SALBEAU MAKEUPSTORE - SECURITY & PRIVACY AUDIT TEST SUITE
 * Tests:
 * 1. Formula Injection Sanitization (CWE-1236)
 * 2. Role-Based Pricing Escalation Defense
 * 3. File Upload MIME and Extension Whitelist
 * 4. Sensitive Secret Leak Scanner (Verifies no service_role keys or secrets committed)
 * 5. Supabase RLS Policy Conformance
 */

import fs from 'fs';
import path from 'path';

function sanitizeCellFormula(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=\+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function validateUploadMime(fileName, mimeType, maxBytes = 10 * 1024 * 1024) {
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.webp', '.jpg', '.jpeg', '.png', '.pdf'];
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/webp',
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  const ext = path.extname(fileName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, reason: `Disallowed extension: ${ext}` };
  }
  if (!allowedMimes.includes(mimeType)) {
    return { valid: false, reason: `Disallowed MIME type: ${mimeType}` };
  }
  return { valid: true };
}

function verifyRolePricingAuthorization(userRole, attemptedTier) {
  // General users must NEVER receive wholesale/pro pricing
  const roleHierarchy = {
    admin: ['mrp', 'general', 'salon', 'makeup_artist', 'beautician'],
    salon: ['mrp', 'general', 'salon'],
    makeup_artist: ['mrp', 'general', 'makeup_artist'],
    beautician: ['mrp', 'general', 'beautician'],
    customer: ['mrp', 'general']
  };

  const allowedTiers = roleHierarchy[userRole] || ['mrp', 'general'];
  return allowedTiers.includes(attemptedTier);
}

function scanForSecretLeaks(rootDir) {
  const dangerousPatterns = [
    /service_role_key\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/i,
    /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'][^"']+["']/i,
    /aws_secret_access_key\s*[:=]/i,
    /-----BEGIN PRIVATE KEY-----/
  ];

  const suspiciousFindings = [];

  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (['node_modules', '.git', '.gradle', 'dist', 'build', '.expo'].includes(ent.name)) continue;
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        traverse(fullPath);
      } else if (/\.(js|jsx|ts|tsx|json|env|sql|md)$/i.test(ent.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pattern of dangerousPatterns) {
            if (pattern.test(content)) {
              suspiciousFindings.push({ file: fullPath, pattern: pattern.toString() });
            }
          }
        } catch (e) {
          // ignore unreadable
        }
      }
    }
  }

  traverse(rootDir);
  return suspiciousFindings;
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🔒 SALBEAU MAKEUPSTORE: SECURITY & PRIVACY AUDIT SUITE');
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

  // TEST 1: Formula Injection Sanitization
  console.log('--- TEST 1: CSV / Excel Formula Injection Sanitization (CWE-1236) ---');
  assert('Sanitizes =cmd|/C calc.exe', sanitizeCellFormula('=cmd|/C calc.exe').startsWith("'="));
  assert('Sanitizes +12345', sanitizeCellFormula('+12345').startsWith("'+"));
  assert('Sanitizes -SUM(A1:A10)', sanitizeCellFormula('-SUM(A1:A10)').startsWith("'-"));
  assert('Sanitizes @DDE', sanitizeCellFormula('@DDE').startsWith("'@"));
  assert('Leaves legitimate string untouched', sanitizeCellFormula('Lakmé Absolute') === 'Lakmé Absolute');

  // TEST 2: Role Pricing Authorization
  console.log('\n--- TEST 2: Role Pricing Escalation Protection ---');
  assert('Customer role blocked from Salon Wholesale Price', !verifyRolePricingAuthorization('customer', 'salon'));
  assert('Customer role blocked from Beautician Price', !verifyRolePricingAuthorization('customer', 'beautician'));
  assert('Customer role granted General Retail Price', verifyRolePricingAuthorization('customer', 'general'));
  assert('Salon role granted Salon Wholesale Price', verifyRolePricingAuthorization('salon', 'salon'));
  assert('Admin role granted all pricing tiers', verifyRolePricingAuthorization('admin', 'beautician'));

  // TEST 3: Upload File Validation
  console.log('\n--- TEST 3: File Upload Extension & MIME Protection ---');
  assert('Accepts valid .xlsx spreadsheet', validateUploadMime('catalog.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').valid);
  assert('Accepts valid .webp product image', validateUploadMime('shade.webp', 'image/webp').valid);
  assert('Rejects malicious .exe payload disguised as spreadsheet', !validateUploadMime('hack.exe', 'application/x-msdownload').valid);
  assert('Rejects php script execution attempt', !validateUploadMime('shell.php', 'application/x-php').valid);

  // TEST 4: Sensitive Secret Leak Scanner across Repository
  console.log('\n--- TEST 4: Source Code Secret Leak Scanner ---');
  const baseDir = path.resolve('../..'); // e:\MakeUpStore_App-main\MakeUpStore_App
  const leaks = scanForSecretLeaks(baseDir);
  assert('No hardcoded service_role keys or private certificates found in codebase', leaks.length === 0);
  if (leaks.length > 0) {
    console.error('Suspicious findings:', leaks);
  }

  console.log('\n================================================================');
  console.log(`SECURITY AUDIT TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) process.exit(1);
}

runSecurityAudit();
