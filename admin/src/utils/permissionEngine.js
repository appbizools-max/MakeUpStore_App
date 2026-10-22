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
    description: 'Catalog products, pricing tiers, shades, and stock',
    actions: [
      { key: 'view', label: 'View Products' },
      { key: 'add', label: 'Add Product' },
      { key: 'edit', label: 'Edit Product' },
      { key: 'delete', label: 'Delete Product' },
      { key: 'publish', label: 'Publish / Archive' },
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
    description: 'Sales logs, stock audit history, and business metrics',
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

/**
 * Generates full permissions for a given preset
 */
export function applyPreset(presetId) {
  const base = createEmptyPermissions();
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
export function hasModuleAccess(permissions, moduleKey, userRole = 'admin') {
  if (userRole === 'admin') return true;
  if (!permissions || typeof permissions !== 'object') return false;
  const mod = permissions[moduleKey];
  if (!mod) return false;
  return Boolean(mod.enabled && mod.actions?.view);
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
 * Generates formatted sequential Employee code (e.g. EMP-0001, EMP-0002)
 */
export function generateEmployeeCode(existingCount = 0) {
  const num = (Number(existingCount) || 0) + 1;
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
 * Standard designation options
 */
export const EMPLOYEE_DESIGNATIONS = [
  'Store Manager',
  'Operations Lead',
  'Fulfillment Specialist',
  'Catalog Specialist',
  'Customer Support Representative',
  'Marketing Executive',
  'Inventory Coordinator',
  'Logistics Associate',
  'Executive Staff',
];
