/**
 * Automated Test Suite: Salbeau Employee Management Workflow
 * Tests Employee Information, Password Security, Role Presets,
 * Permission Dependencies, Lifecycle Transitions, and Audit Logging.
 */

import {
  MODULE_DEFINITIONS,
  PERMISSION_PRESETS,
  SENSITIVE_ACTIONS,
  ACCOUNT_STATES,
  ACCOUNT_STATE_META,
  applyPreset,
  createEmptyPermissions,
  generateEmployeeCode,
  generateSecureTemporaryPassword,
  validatePasswordPolicy,
  ensurePermissionDependencies,
  countPermissionsSummary,
  isValidStatusTransition
} from '../../admin/src/utils/permissionEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   SALBEAU - EMPLOYEE MANAGEMENT WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Concurrency-Safe Sequential Employee Code Generator
  console.log('--- 1. EMPLOYEE CODE GENERATION ---');
  const mockExisting1 = [
    { employee_code: 'EMP-0001' },
    { employee_code: 'EMP-0002' },
    { employee_code: 'EMP-0003' }
  ];
  assert(generateEmployeeCode(mockExisting1) === 'EMP-0004', 'Generates next sequential code EMP-0004 from array');

  const mockExistingGaps = [
    { employee_code: 'EMP-0001' },
    { employee_code: 'EMP-0008' },
    { employee_code: 'EMP-0003' }
  ];
  assert(generateEmployeeCode(mockExistingGaps) === 'EMP-0009', 'Finds highest existing number and increments past gaps (EMP-0009)');

  assert(generateEmployeeCode([]) === 'EMP-0001', 'Handles empty list by returning EMP-0001');

  // Test 2: Cryptographically Secure Temporary Password Generator & Policy
  console.log('\n--- 2. SECURE PASSWORD GENERATION & POLICY ---');
  for (let i = 0; i < 10; i++) {
    const generatedPassword = generateSecureTemporaryPassword();
    const policyResult = validatePasswordPolicy(generatedPassword);
    assert(policyResult.isValid, `Generated random password "${generatedPassword}" satisfies all policy rules`);
  }

  // Test weak passwords
  assert(!validatePasswordPolicy('short1!').isValid, 'Rejects password shorter than 8 chars');
  assert(!validatePasswordPolicy('alllowercase1!').isValid, 'Rejects password without uppercase letters');
  assert(!validatePasswordPolicy('ALLUPPERCASE1!').isValid, 'Rejects password without lowercase letters');
  assert(!validatePasswordPolicy('NoSpecialChar123').isValid, 'Rejects password without special characters');
  assert(!validatePasswordPolicy('NoNumbersHere!@#').isValid, 'Rejects password without numbers');

  // Test 3: Role Presets & Granular Permissions
  console.log('\n--- 3. ROLE PRESETS & GRANULAR PERMISSIONS ---');
  const requiredPresets = ['operations', 'catalog_manager', 'order_manager', 'customer_support', 'marketing', 'finance', 'custom'];
  requiredPresets.forEach(presetId => {
    const found = PERMISSION_PRESETS.some(p => p.id === presetId);
    assert(found, `Required role preset "${presetId}" exists`);
  });

  const operationsPerms = applyPreset('operations');
  assert(operationsPerms.orders?.enabled === true, 'Operations preset enables orders module');
  assert(operationsPerms.orders?.actions?.process === true, 'Operations preset allows process order action');
  assert(operationsPerms.orders?.actions?.refund === false, 'Operations preset disallows refund order action (least privilege)');

  const catalogPerms = applyPreset('catalog_manager');
  assert(catalogPerms.products?.actions?.add === true, 'Catalog manager allows add product');
  assert(catalogPerms.products?.actions?.delete === false, 'Catalog manager disallows delete product by default');

  const financePerms = applyPreset('finance');
  assert(financePerms.payments?.actions?.refund === true, 'Finance preset enables payment refunds');
  assert(financePerms.orders?.actions?.refund === true, 'Finance preset enables order refunds');

  // Test 4: Permission Dependency Resolution
  console.log('\n--- 4. PERMISSION DEPENDENCY ENFORCEMENT ---');
  // Scenario A: Mutation action enabled while view is disabled -> View should be auto-enabled
  const rawPerms1 = {
    products: {
      enabled: true,
      actions: { view: false, add: true, edit: false, delete: false }
    }
  };
  const resolved1 = ensurePermissionDependencies(rawPerms1);
  assert(resolved1.products.actions.view === true, 'Enabling mutation (add) auto-enables view action');

  // Scenario B: Module disabled -> All sub-actions must be disabled
  const rawPerms2 = {
    orders: {
      enabled: false,
      actions: { view: true, process: true }
    }
  };
  const resolved2 = ensurePermissionDependencies(rawPerms2);
  assert(resolved2.orders.actions.view === false && resolved2.orders.actions.process === false, 'Disabling module turns off all child actions');

  // Test 5: Sensitive Actions Identification & Summaries
  console.log('\n--- 5. SENSITIVE ACTIONS TAGGING & SUMMARY ---');
  assert(SENSITIVE_ACTIONS.has('delete'), 'Flags "delete" as sensitive action');
  assert(SENSITIVE_ACTIONS.has('refund'), 'Flags "refund" as sensitive action');
  assert(SENSITIVE_ACTIONS.has('export'), 'Flags "export" as sensitive action');
  assert(SENSITIVE_ACTIONS.has('permissions'), 'Flags "permissions" as sensitive action');
  assert(!SENSITIVE_ACTIONS.has('view'), 'Does not flag "view" as sensitive action');

  const summaryFinance = countPermissionsSummary(financePerms);
  assert(summaryFinance.sensitiveActionsCount >= 2, `Correctly counts sensitive actions in Finance preset (found ${summaryFinance.sensitiveActionsCount})`);

  // Test 6: Account Lifecycle State Transitions
  console.log('\n--- 6. ACCOUNT LIFECYCLE STATE TRANSITIONS ---');
  assert(isValidStatusTransition('invitation_pending', 'active'), 'Allows transition invitation_pending -> active');
  assert(isValidStatusTransition('active', 'suspended'), 'Allows transition active -> suspended');
  assert(isValidStatusTransition('suspended', 'active'), 'Allows transition suspended -> active');
  assert(isValidStatusTransition('active', 'deactivated'), 'Allows transition active -> deactivated');
  assert(isValidStatusTransition('locked', 'active'), 'Allows transition locked -> active (admin unlock)');
  assert(!isValidStatusTransition('deactivated', 'suspended'), 'Blocks invalid transition deactivated -> suspended');

  console.log('\n================================================================');
  console.log(`   ALL ${passedTests} / ${totalTests} TESTS EXECUTED AND PASSED!`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
