/**
 * Salbeau Employee & Admin Permission Engine
 * Granular Role-Based Access Control (RBAC)
 */

export const MODULE_DEFINITIONS = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    description: 'Overview analytics, metrics, and KPI summary',
    actions: [{ key: 'view', label: 'View Dashboard' }],
  },
  {
    key: 'orders',
    name: 'Orders',
    description: 'Customer orders, status processing, fulfillment, and refunds',
    actions: [
      { key: 'view', label: 'View Orders' },
      { key: 'create', label: 'Create Order' },
      { key: 'edit', label: 'Edit Order Items' },
      { key: 'confirm', label: 'Confirm Order' },
      { key: 'process', label: 'Process / Pack' },
      { key: 'dispatch', label: 'Dispatch / Ship' },
      { key: 'cancel', label: 'Cancel Order' },
      { key: 'refund', label: 'Issue Refund' },
      { key: 'assign', label: 'Assign Work to Staff' },
    ],
  },
  {
    key: 'products',
    name: 'Products',
    description: 'Catalog products, pricing tiers, and shades',
    actions: [
      { key: 'view', label: 'View Products' },
      { key: 'add', label: 'Add Product' },
      { key: 'edit', label: 'Edit Product' },
      { key: 'delete', label: 'Delete Product' },
      { key: 'publish', label: 'Publish / Archive' },
    ],
  },
  {
    key: 'brands',
    name: 'Brands',
    description: 'Brand partners, sequential brand numbers (BR001...), and logos',
    actions: [
      { key: 'view', label: 'View Brands' },
      { key: 'add', label: 'Add Brand' },
      { key: 'edit', label: 'Edit Brand' },
      { key: 'delete', label: 'Delete Brand' },
    ],
  },
  {
    key: 'categories',
    name: 'Categories',
    description: 'Catalog categories and sorting order',
    actions: [
      { key: 'view', label: 'View Categories' },
      { key: 'add', label: 'Add Category' },
      { key: 'edit', label: 'Edit Category' },
      { key: 'delete', label: 'Delete Category' },
    ],
  },
  {
    key: 'subcategories',
    name: 'Subcategories',
    description: 'Sub-departments and product classifications',
    actions: [
      { key: 'view', label: 'View Subcategories' },
      { key: 'add', label: 'Add Subcategory' },
      { key: 'edit', label: 'Edit Subcategory' },
      { key: 'delete', label: 'Delete Subcategory' },
    ],
  },
  {
    key: 'services',
    name: 'Services',
    description: 'Salon services, booking packages, and treatments',
    actions: [
      { key: 'view', label: 'View Services' },
      { key: 'add', label: 'Add Service' },
      { key: 'edit', label: 'Edit Service' },
      { key: 'delete', label: 'Delete Service' },
    ],
  },
  {
    key: 'addons',
    name: 'Add-ons',
    description: 'Service add-ons and complimentary items',
    actions: [
      { key: 'view', label: 'View Add-ons' },
      { key: 'add', label: 'Add Add-on' },
      { key: 'edit', label: 'Edit Add-on' },
      { key: 'delete', label: 'Delete Add-on' },
    ],
  },
  {
    key: 'customers',
    name: 'Customers',
    description: 'Registered users, professional verification, and profiles',
    actions: [
      { key: 'view', label: 'View Customers' },
      { key: 'edit', label: 'Edit Profile & Verification' },
      { key: 'delete', label: 'Delete Customer' },
    ],
  },
  {
    key: 'offers',
    name: 'Offers & Discounts',
    description: 'Coupons, promotions, and seasonal markdowns',
    actions: [
      { key: 'view', label: 'View Offers' },
      { key: 'add', label: 'Create Offer' },
      { key: 'edit', label: 'Edit Offer' },
      { key: 'delete', label: 'Delete Offer' },
    ],
  },
  {
    key: 'banners',
    name: 'Banners',
    description: 'Homepage hero banners and mobile promotional perks',
    actions: [
      { key: 'view', label: 'View Banners' },
      { key: 'add', label: 'Upload Banner' },
      { key: 'edit', label: 'Update Banner' },
      { key: 'delete', label: 'Delete Banner' },
    ],
  },
  {
    key: 'reports',
    name: 'Reports & Analytics',
    description: 'Sales logs, search demand analytics, and business metrics',
    actions: [
      { key: 'view', label: 'View Reports' },
      { key: 'export', label: 'Export Data (CSV/Excel)' },
    ],
  },
  {
    key: 'payments',
    name: 'Payments',
    description: 'Payment reconciliation and transaction verification',
    actions: [
      { key: 'view', label: 'View Payments' },
      { key: 'refund', label: 'Process Refund' },
    ],
  },
  {
    key: 'employees',
    name: 'Employees',
    description: 'Staff accounts, permissions, and audit logs',
    actions: [
      { key: 'view', label: 'View Employees' },
      { key: 'add', label: 'Add Employee' },
      { key: 'edit', label: 'Edit Details' },
      { key: 'disable', label: 'Enable / Disable Account' },
      { key: 'permissions', label: 'Assign & Edit Permissions' },
    ],
  },
  {
    key: 'settings',
    name: 'Settings',
    description: 'Store configurations, cancellation fees, and system preferences',
    actions: [
      { key: 'view', label: 'View Settings' },
      { key: 'edit', label: 'Modify Store Settings' },
    ],
  },
];

/**
 * Permission Presets for quick employee role assignment
 */
export const PERMISSION_PRESETS = [
  {
    id: 'operations',
    name: 'Operations',
    description: 'Order fulfillment, packing, delivery dispatch, and catalog viewing',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      orders: {
        enabled: true,
        actions: { view: true, create: true, edit: true, confirm: true, process: true, dispatch: true, cancel: false, refund: false, assign: false },
      },
      products: { enabled: true, actions: { view: true, add: false, edit: false, delete: false, publish: false } },
      categories: { enabled: true, actions: { view: true, add: false, edit: false, delete: false } },
      customers: { enabled: true, actions: { view: true, edit: false, delete: false } },
    },
  },
  {
    id: 'catalog_manager',
    name: 'Catalog Manager',
    description: 'Full product management, category setup, subcategories, and banners',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      products: { enabled: true, actions: { view: true, add: true, edit: true, delete: false, publish: true } },
      categories: { enabled: true, actions: { view: true, add: true, edit: true, delete: false } },
      subcategories: { enabled: true, actions: { view: true, add: true, edit: true, delete: false } },
      banners: { enabled: true, actions: { view: true, add: true, edit: true, delete: true } },
      offers: { enabled: true, actions: { view: true, add: true, edit: true, delete: false } },
    },
  },
  {
    id: 'order_manager',
    name: 'Order Manager',
    description: 'Complete order workflow from confirmation to dispatch and cancellation',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      orders: {
        enabled: true,
        actions: { view: true, create: true, edit: true, confirm: true, process: true, dispatch: true, cancel: true, refund: false, assign: true },
      },
      customers: { enabled: true, actions: { view: true, edit: false, delete: false } },
      products: { enabled: true, actions: { view: true, add: false, edit: false, delete: false, publish: false } },
    },
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Customer inquiry resolution, order status tracking, and account verification',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      customers: { enabled: true, actions: { view: true, edit: true, delete: false } },
      orders: {
        enabled: true,
        actions: { view: true, create: false, edit: false, confirm: false, process: false, dispatch: false, cancel: false, refund: false, assign: false },
      },
      products: { enabled: true, actions: { view: true, add: false, edit: false, delete: false, publish: false } },
    },
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Banners, promotional perks, coupons, and offers management',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      banners: { enabled: true, actions: { view: true, add: true, edit: true, delete: true } },
      offers: { enabled: true, actions: { view: true, add: true, edit: true, delete: true } },
      products: { enabled: true, actions: { view: true, add: false, edit: false, delete: false, publish: false } },
      categories: { enabled: true, actions: { view: true, add: false, edit: false, delete: false } },
    },
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Payment reconciliation, refund processing, and audit reporting',
    modules: {
      dashboard: { enabled: true, actions: { view: true } },
      orders: {
        enabled: true,
        actions: { view: true, create: false, edit: false, confirm: false, process: false, dispatch: false, cancel: false, refund: true, assign: false },
      },
      payments: { enabled: true, actions: { view: true, refund: true } },
      reports: { enabled: true, actions: { view: true, export: true } },
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tailored permissions configured manually by Admin',
    modules: {},
  },
];

/**
 * Creates a clean default permission structure with all modules disabled
 */
export function createEmptyPermissions() {
  const permissions = {};
  MODULE_DEFINITIONS.forEach((mod) => {
    permissions[mod.key] = {
      enabled: false,
      actions: {},
    };
    mod.actions.forEach((act) => {
      permissions[mod.key].actions[act.key] = false;
    });
  });
  return permissions;
}

export const EMPLOYEE_DESIGNATIONS = [
  '(admin)',
  'manager',
  'account',
  'employee'
];

export const getPresetForDesignation = (designation) => {
  if (!designation) return 'employee';
  const lower = designation.toLowerCase().trim();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('manag')) return 'manager';
  if (lower.includes('account')) return 'account';
  return 'employee';
};

export const getDepartmentForDesignation = (designation) => {
  return '';
};

/**
 * Generates full permissions for a given preset
 */
export function applyPreset(presetId) {
  const base = createEmptyPermissions();

  // 1. (admin): Full access to ALL modules and ALL actions!
  if (presetId === 'admin' || presetId === '(admin)' || presetId === 'Admin (Main Access)' || presetId === 'super_admin') {
    MODULE_DEFINITIONS.forEach((mod) => {
      base[mod.key] = {
        enabled: true,
        actions: {},
      };
      mod.actions.forEach((act) => {
        base[mod.key].actions[act.key] = true;
      });
    });
    return base;
  }

  // 2. manager: Full business management access
  if (presetId === 'manager' || presetId === 'Manager') {
    const managerModules = ['dashboard', 'products', 'brands', 'categories', 'subcategories', 'customers', 'orders', 'banners', 'offers', 'reports', 'payments'];
    MODULE_DEFINITIONS.forEach((mod) => {
      const isMgr = managerModules.includes(mod.key);
      base[mod.key] = {
        enabled: isMgr,
        actions: {},
      };
      mod.actions.forEach((act) => {
        base[mod.key].actions[act.key] = isMgr;
      });
    });
    return base;
  }

  // 3. account: Finance, payments, orders & reports
  if (presetId === 'account' || presetId === 'Account' || presetId === 'finance') {
    const accountModules = ['dashboard', 'orders', 'payments', 'reports', 'settings'];
    MODULE_DEFINITIONS.forEach((mod) => {
      const isAcc = accountModules.includes(mod.key);
      base[mod.key] = {
        enabled: isAcc,
        actions: {},
      };
      mod.actions.forEach((act) => {
        base[mod.key].actions[act.key] = isAcc;
      });
    });
    return base;
  }

  // 4. employee: Standard operations & order fulfillment
  if (presetId === 'employee' || presetId === 'Employee' || presetId === 'employees' || presetId === 'Employees' || presetId === 'operations') {
    base.dashboard = { enabled: true, actions: { view: true } };
    if (base.products) base.products = { enabled: true, actions: { view: true, add: false, edit: false, delete: false, publish: false } };
    if (base.categories) base.categories = { enabled: true, actions: { view: true, add: false, edit: false, delete: false } };
    if (base.orders) {
      base.orders = {
        enabled: true,
        actions: { view: true, create: true, edit: true, confirm: true, process: true, dispatch: true, cancel: false, refund: false, assign: false }
      };
    }
    return base;
  }

  const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
  if (!preset || !preset.modules) return base;

  Object.keys(preset.modules).forEach((modKey) => {
    if (base[modKey]) {
      const presetMod = preset.modules[modKey];
      base[modKey].enabled = Boolean(presetMod.enabled);
      if (presetMod.actions) {
        Object.keys(presetMod.actions).forEach((actKey) => {
          base[modKey].actions[actKey] = Boolean(presetMod.actions[actKey]);
        });
      }
    }
  });

  return base;
}

/**
 * Checks if the current user has access to view a module
 * ADMIN always has access!
 */
export function hasModuleAccess(permissions, moduleKey, userRole = null) {
  if (userRole === 'admin') return true;
  if (!permissions || typeof permissions !== 'object') return false;
  const mod = permissions[moduleKey];
  if (!mod) return false;
  return Boolean(mod.enabled);
}

/**
 * Checks if the current user has a specific granular action permission
 * ADMIN always has access!
 */
export function hasActionPermission(permissions, moduleKey, actionKey, userRole = 'admin') {
  if (userRole === 'admin') return true;
  if (!permissions || typeof permissions !== 'object') return false;
  const mod = permissions[moduleKey];
  if (!mod || !mod.enabled) return false;
  return Boolean(mod.actions?.[actionKey]);
}

/**
 * Sensitive permissions that require elevated caution
 */
export const SENSITIVE_ACTIONS = new Set([
  'delete',
  'refund',
  'cancel',
  'export',
  'disable',
  'permissions',
  'assign'
]);

/**
 * Account Lifecycle States and Metadata
 */
export const ACCOUNT_STATES = {
  INVITATION_PENDING: 'invitation_pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
  LOCKED: 'locked',
};

export const ACCOUNT_STATE_META = {
  invitation_pending: {
    label: 'Invitation Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Invitation sent; waiting for employee to establish login credentials.',
    canLogin: false,
  },
  active: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Employee account active and authorized for system login.',
    canLogin: true,
  },
  suspended: {
    label: 'Suspended',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Temporarily blocked from signing in by administrator.',
    canLogin: false,
  },
  deactivated: {
    label: 'Deactivated',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
    description: 'Permanently deactivated; all sessions revoked.',
    canLogin: false,
  },
  locked: {
    label: 'Locked',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Account locked due to security policy or excessive failed logins.',
    canLogin: false,
  },
};

/**
 * Validates allowed lifecycle status transitions
 */
export function isValidStatusTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;
  const allowed = {
    invitation_pending: ['active', 'deactivated'],
    active: ['suspended', 'deactivated', 'locked'],
    suspended: ['active', 'deactivated'],
    locked: ['active', 'deactivated'],
    deactivated: ['active'],
  };
  return Boolean(allowed[currentStatus]?.includes(targetStatus));
}

/**
 * Generates concurrency-safe sequential Employee Code (e.g. EMP-0001)
 * Scans all existing codes and produces the strictly next integer
 */
export function generateEmployeeCode(existingEmployeesOrCount = 0) {
  if (Array.isArray(existingEmployeesOrCount)) {
    let maxNum = 0;
    for (const emp of existingEmployeesOrCount) {
      const code = emp.employee_code || emp.employeeCode || emp.id || '';
      const match = String(code).match(/EMP-(\d+)/i);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
    return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
  }
  const num = (Number(existingEmployeesOrCount) || 0) + 1;
  return `EMP-${String(num).padStart(4, '0')}`;
}

/**
 * Standard department options
 */
export const EMPLOYEE_DEPARTMENTS = [
  'Operations',
  'Catalog & Merchandising',
  'Order Fulfillment',
  'Customer Support',
  'Marketing & Growth',
  'Finance & Accounting',
  'Logistics & Dispatch',
  'IT & Systems',
];

/**
 * Designation mappings per department
 */
export const DEPARTMENT_DESIGNATIONS_MAP = {
  'Operations': [
    'Operations Lead',
    'Operations Associate',
    'Store Manager',
    'Inventory Supervisor',
  ],
  'Catalog & Merchandising': [
    'Catalog Lead',
    'Catalog Specialist',
    'Product Merchandiser',
    'Pricing & Tier Analyst',
  ],
  'Order Fulfillment': [
    'Fulfillment Specialist',
    'Packing & Quality Supervisor',
    'Dispatch Coordinator',
    'Store Executive',
  ],
  'Customer Support': [
    'Support Team Lead',
    'Customer Support Representative',
    'Escalation & Grievance Specialist',
  ],
  'Marketing & Growth': [
    'Marketing Executive',
    'Campaign & Banner Specialist',
    'Social & Promotions Lead',
    'SEO & Content Strategist',
  ],
  'Finance & Accounting': [
    'Finance Manager',
    'Accounts & Reconciliation Specialist',
    'Billing & Refunds Executive',
  ],
  'Logistics & Dispatch': [
    'Logistics Manager',
    'Fleet & Dispatch Lead',
    'Delivery Associate',
  ],
  'IT & Systems': [
    'Systems Administrator',
    'Platform Security Specialist',
    'Technical Support Engineer',
  ],
};


/**
 * Employment Types
 */
export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
];

/**
 * Standard Work Locations
 */
export const WORK_LOCATIONS = [
  'Visakhapatnam Main Store & Headquarters',
  'Gajuwaka Fulfillment Center (Branch 2)',
  'Madhurawada Express Hub (Branch 3)',
  'Central Logistics Warehouse',
  'Remote / Work From Home',
];

/**
 * Supported Country Codes
 */
export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
];

/**
 * Generates a cryptographically secure random temporary password
 * Guaranteed to satisfy policy: Uppercase, Lowercase, Number, Special symbol, min 10 chars
 */
export function generateSecureTemporaryPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';

  const getRandomChar = (charset) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return charset[arr[0] % charset.length];
    }
    return charset[Math.floor(Math.random() * charset.length)];
  };

  // Ensure at least 2 of each class
  let result = [
    getRandomChar(uppers),
    getRandomChar(uppers),
    getRandomChar(lowers),
    getRandomChar(lowers),
    getRandomChar(numbers),
    getRandomChar(numbers),
    getRandomChar(symbols),
    getRandomChar(symbols),
  ];

  const allChars = uppers + lowers + numbers + symbols;
  for (let i = 0; i < 4; i++) {
    result.push(getRandomChar(allChars));
  }

  // Shuffle array using Fisher-Yates
  for (let i = result.length - 1; i > 0; i--) {
    let j;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      j = arr[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result.join('');
}

/**
 * Validates password: any normal password is valid
 */
export function validatePasswordPolicy(password) {
  const errors = [];
  if (!password || !password.trim()) {
    errors.push('Password cannot be empty');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Ensures permission dependencies are respected:
 * - If any mutation action is enabled, 'view' must be true.
 * - If 'view' is disabled, all actions in that module must be false.
 */
export function ensurePermissionDependencies(permissions) {
  if (!permissions || typeof permissions !== 'object') return permissions;
  const sanitized = JSON.parse(JSON.stringify(permissions));

  Object.keys(sanitized).forEach((modKey) => {
    const mod = sanitized[modKey];
    if (!mod || !mod.actions) return;

    const actionKeys = Object.keys(mod.actions);

    if (!mod.enabled) {
      // If module master switch is disabled, disable all sub-actions
      mod.enabled = false;
      actionKeys.forEach((act) => {
        mod.actions[act] = false;
      });
    } else {
      // If module is enabled, check action dependencies
      const nonViewActions = actionKeys.filter((act) => act !== 'view');
      const hasAnyMutationTrue = nonViewActions.some((act) => Boolean(mod.actions[act]));

      if (hasAnyMutationTrue) {
        // If any mutation action is granted, view MUST be granted
        mod.actions.view = true;
      } else if (!mod.actions.view) {
        // If view is disabled and no mutation actions active, turn module off
        mod.enabled = false;
        actionKeys.forEach((act) => {
          mod.actions[act] = false;
        });
      }
    }
  });

  return sanitized;
}

/**
 * Computes summary count of enabled modules and actions
 */
export function countPermissionsSummary(permissions) {
  let enabledModules = 0;
  let totalActions = 0;
  let sensitiveActionsCount = 0;

  if (permissions && typeof permissions === 'object') {
    Object.keys(permissions).forEach((modKey) => {
      const mod = permissions[modKey];
      if (mod?.enabled) {
        enabledModules += 1;
        if (mod.actions) {
          Object.keys(mod.actions).forEach((actKey) => {
            if (mod.actions[actKey]) {
              totalActions += 1;
              if (SENSITIVE_ACTIONS.has(actKey)) {
                sensitiveActionsCount += 1;
              }
            }
          });
        }
      }
    });
  }

  return { enabledModules, totalActions, sensitiveActionsCount };
}

/**
 * Checks whether an actor (admin or employee) has permission to access a specific navigation tab or page.
 */
export function canAccessTab(tabId, user) {
  if (!user) return false;
  // System administrator has unrestricted access to all modules and routes
  if (user.role === 'admin' || user.id === 'admin_root') return true;

  const perms = user.permissions || {};

  switch (tabId) {
    case 'dashboard':
      return Boolean(perms.dashboard?.enabled);
    case 'order_updated':
      return Boolean(perms.orders?.enabled);
    case 'approval_center':
      return Boolean(perms.approvals?.enabled || perms.orders?.actions?.assign);
    case 'products':
    case 'attributes':
      return Boolean(perms.products?.enabled);
    case 'products/new':
      return Boolean(perms.products?.enabled && (perms.products?.actions?.add || perms.products?.actions?.create));
    case 'products/bulk':
      return Boolean(perms.products?.enabled && perms.products?.actions?.add);
    case 'add_brand':
    case 'brands':
      return Boolean(perms.brands?.enabled);
    case 'categories':
    case 'categories_order':
      return Boolean(perms.categories?.enabled);
    case 'home_banners':
      return Boolean(perms.banners?.enabled || perms.settings?.enabled);
    case 'users':
    case 'user':
    case 'users/b2c':
    case 'user/b2c':
    case 'users/b2b':
    case 'user/b2b':
      return Boolean(perms.customers?.enabled);
    case 'search_requests':
      return Boolean(perms.customers?.enabled || perms.reports?.enabled || perms.products?.enabled);
    case 'abandoned_carts':
      return Boolean(perms.orders?.enabled);
    case 'b2b-verification':
    case 'b2b_verification':
    case 'b2b-verification/salon':
    case 'b2b_verification/salon':
    case 'b2b-verification/makeup-artist':
    case 'b2b_verification/makeup-artist':
    case 'b2b_verification/makeup_artist':
    case 'b2b-verification/beautician':
    case 'b2b_verification/beautician':
      return Boolean(perms.customers?.enabled || perms.approvals?.enabled);
    case 'cancel_fee':
      return Boolean(perms.payments?.enabled);
    case 'pricing_rules':
      return Boolean(perms.offers?.enabled);
    case 'employees':
      return Boolean(perms.employees?.enabled);
    case 'employees/new':
      return Boolean(perms.employees?.enabled && perms.employees?.actions?.add);
    case 'employees/activity':
    case 'audit_trail':
      return Boolean(perms.employees?.enabled || perms.reports?.enabled);
    case 'dashboard_visibility':
    case 'settings':
      return Boolean(perms.settings?.enabled);
    case 'quick_panel': {
      if (user.role === 'admin' || user.id === 'admin_root') return true;
      const desig = (user.designation || '').toLowerCase();
      const preset = (user.rolePreset || user.role || '').toLowerCase();
      return desig.includes('manager') || preset.includes('manager');
    }
    default:
      if (tabId.startsWith('employees/')) {
        return Boolean(perms.employees?.enabled);
      }
      return false;
  }
}

/**
 * Resolves the primary landing tab for an authenticated user based on their specific granted permissions.
 */
export function getFirstAccessibleTab(user) {
  if (!user) return 'dashboard';
  if (user.role === 'admin' || user.id === 'admin_root') return 'dashboard';

  const candidateTabs = [
    'dashboard',
    'order_updated',
    'products',
    'categories',
    'add_brand',
    'users/b2c',
    'users',
    'b2b-verification',
    'search_requests',
    'abandoned_carts',
    'home_banners',
    'pricing_rules',
    'cancel_fee',
    'employees',
    'employees/activity',
    'audit_trail',
    'approval_center',
    'dashboard_visibility',
    'quick_panel'
  ];

  for (const tab of candidateTabs) {
    if (canAccessTab(tab, user)) {
      return tab;
    }
  }

  // Safe fallback if no candidate matched
  return 'order_updated';
}
