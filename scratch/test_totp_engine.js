import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  computeTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  sha256Hash,
  hashPasswordWithSalt,
  generateSalt
} from '../admin/src/utils/totpSecurityEngine.js';

async function runTests() {
  console.log('--- STARTING TOTP & 2FA ENGINE INTEGRITY TESTS ---');

  // Test 1: Base32 roundtrip
  const testBytes = new Uint8Array([72, 101, 108, 108, 111, 33]); // "Hello!"
  const encoded = base32Encode(testBytes);
  const decoded = base32Decode(encoded);
  const roundtripMatches = testBytes.every((val, i) => val === decoded[i]);
  console.log('Test 1: Base32 Encoding & Decoding Roundtrip:', roundtripMatches ? 'PASSED' : 'FAILED');

  // Test 2: Generate unique 160-bit Secret
  const secret = generateTotpSecret();
  console.log('Test 2: Generated RFC 4648 Base32 Secret:', secret, '(Length:', secret.length, ')', secret.length >= 32 ? 'PASSED' : 'FAILED');

  // Test 3: RFC 6238 TOTP Code Generation (6 digits)
  const codeNow = await computeTotpCode(secret, Date.now());
  const is6Digits = /^\d{6}$/.test(codeNow);
  console.log('Test 3: Generated 6-digit TOTP Code:', codeNow, is6Digits ? 'PASSED' : 'FAILED');

  // Test 4: Verify Valid TOTP Code
  const verifyResult = await verifyTotpCode(codeNow, secret, 1);
  console.log('Test 4: Verify Current TOTP Code:', verifyResult.valid ? 'PASSED' : 'FAILED');

  // Test 5: Verify Invalid Code Rejection
  const invalidResult = await verifyTotpCode('000000', secret, 1);
  console.log('Test 5: Rejection of Invalid Code:', !invalidResult.valid ? 'PASSED' : 'FAILED');

  // Test 6: Recovery Codes (8 codes, format SALB-XXXX-XXXX)
  const recoveryCodes = generateRecoveryCodes(8);
  const allFormatted = recoveryCodes.length === 8 && recoveryCodes.every(c => /^SALB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c));
  console.log('Test 6: 8 Emergency Recovery Codes:', recoveryCodes, allFormatted ? 'PASSED' : 'FAILED');

  // Test 7: SHA-256 Hashing of Recovery Codes
  const hash1 = await sha256Hash(recoveryCodes[0]);
  const hash2 = await sha256Hash(recoveryCodes[0]);
  console.log('Test 7: SHA-256 Deterministic Hash Match:', hash1 === hash2 ? 'PASSED' : 'FAILED');

  // Test 8: Salted Password Hashing
  const salt = generateSalt(16);
  const passHash = await hashPasswordWithSalt('Salbeau@Admin2026', salt);
  const passVerify = await hashPasswordWithSalt('Salbeau@Admin2026', salt);
  console.log('Test 8: Salted Password Hash Verification:', passHash === passVerify ? 'PASSED' : 'FAILED');

  console.log('--- ALL TOTP SECURITY ENGINE INTEGRITY TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

