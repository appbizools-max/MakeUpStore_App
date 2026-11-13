const fs = require('fs');

const contextPath = 'admin/src/context/AdminContext.jsx';
let code = fs.readFileSync(contextPath, 'utf8');

// 1. Add DEFAULT_GENERAL_SETTINGS at top if not present
if (!code.includes('export const DEFAULT_GENERAL_SETTINGS')) {
  const settingsDef = `
export const DEFAULT_GENERAL_SETTINGS = {
  identity: {
    storeName: 'Salbeau',
    tagline: 'Luxury Beauty & Salon Cosmetics Store',
    contactEmail: 'contact@salbeau.com',
    supportPhone: '+91 98765 43210',
    hqAddress: 'Salbeau Headquarters, VIP Road, Visakhapatnam, AP - 530003',
    gstin: '37AAAAA0000A1Z5',
    currencyCode: 'INR',
    currencySymbol: '₹'
  },
  delivery: {
    standardDeliveryFee: 49,
    freeDeliveryThreshold: 499,
    estimatedDeliveryTime: 'Same Day / 24-48 Hours',
    minOrderAmount: 99,
    maxOrderItems: 50,
  },
  payments: {
    allowCod: true,
    allowUpi: true,
    upiId: 'salbeau.store@okaxis',
    maxCodLimit: 5000,
  },
  operations: {
    isAcceptingOrders: true,
    pauseOrdersNotice: 'We are temporarily not taking new orders. Please check back shortly.',
    announcementEnabled: false,
    announcementMessage: '✨ Welcome to Salbeau Luxury Cosmetics! Enjoy Free Shipping on orders above ₹499.',
    announcementType: 'info',
  },
  policies: {
    cancellationWindowMinutes: 30,
    cancellationFee: 0,
    allowCustomerSelfCancel: true,
    requireB2BVerification: true,
  }
};
`;
  // Place before AdminProvider
  code = code.replace('export const AdminProvider = ({ children }) => {', settingsDef + '\nexport const AdminProvider = ({ children }) => {');
}

// 2. Add generalSettings state
if (!code.includes('const [generalSettings, setGeneralSettings]')) {
  const stateDef = `  // General Store Settings & Live Configuration
  const [generalSettings, setGeneralSettings] = useState(() => {
    const cached = getCachedData('salbeau_admin_cache_general_settings', null);
    return cached ? { ...DEFAULT_GENERAL_SETTINGS, ...cached } : DEFAULT_GENERAL_SETTINGS;
  });
`;
  code = code.replace(
    '  // Branch Management (Configured by Admin in Settings -> Branch Management)',
    stateDef + '  // Branch Management (Configured by Admin in Settings -> Branch Management)'
  );
}

// 3. Add fetching from Supabase in fetchData
if (!code.includes('salbeau_store_settings')) {
  const fetchBlock = `
      // Process General Store Settings from Supabase
      try {
        const settingsRes = await safeDbFetch(adminClient.from('brands').select('logo').eq('id', 'salbeau_store_settings').limit(1));
        if (settingsRes?.data?.[0]?.logo) {
          try {
            const parsed = JSON.parse(settingsRes.data[0].logo);
            if (parsed && typeof parsed === 'object') {
              const merged = {
                ...DEFAULT_GENERAL_SETTINGS,
                ...parsed,
                identity: { ...DEFAULT_GENERAL_SETTINGS.identity, ...(parsed.identity || {}) },
                delivery: { ...DEFAULT_GENERAL_SETTINGS.delivery, ...(parsed.delivery || {}) },
                payments: { ...DEFAULT_GENERAL_SETTINGS.payments, ...(parsed.payments || {}) },
                operations: { ...DEFAULT_GENERAL_SETTINGS.operations, ...(parsed.operations || {}) },
                policies: { ...DEFAULT_GENERAL_SETTINGS.policies, ...(parsed.policies || {}) },
              };
              setGeneralSettings(merged);
              setCachedData('salbeau_admin_cache_general_settings', merged);
            }
          } catch (e) { }
        }
      } catch (err) {
        console.warn('General settings fetch note:', err);
      }
`;
  code = code.replace(
    '// Process Branches from Supabase & Cloud Backup',
    fetchBlock + '\n      // Process Branches from Supabase & Cloud Backup'
  );
}

// 4. Add updateGeneralSettings handler
if (!code.includes('const updateGeneralSettings =')) {
  const handlerBlock = `
  /**
   * GENERAL STORE SETTINGS
   */
  const updateGeneralSettings = async (partialOrFull) => {
    try {
      const merged = {
        ...generalSettings,
        ...partialOrFull,
        identity: { ...generalSettings.identity, ...(partialOrFull.identity || {}) },
        delivery: { ...generalSettings.delivery, ...(partialOrFull.delivery || {}) },
        payments: { ...generalSettings.payments, ...(partialOrFull.payments || {}) },
        operations: { ...generalSettings.operations, ...(partialOrFull.operations || {}) },
        policies: { ...generalSettings.policies, ...(partialOrFull.policies || {}) },
      };

      setGeneralSettings(merged);
      setCachedData('salbeau_admin_cache_general_settings', merged);

      // Persist to Supabase brands table as store settings document
      const client = supabaseAdmin || supabase;
      await client.from('brands').upsert({
        id: 'salbeau_store_settings',
        name: 'Salbeau Store Settings',
        slug: 'salbeau-store-settings',
        logo: JSON.stringify(merged),
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // Signal other windows/tabs (e.g. mobile app preview)
      try {
        localStorage.setItem('salbeau_general_settings_sync', JSON.stringify({
          timestamp: Date.now(),
          settings: merged
        }));
      } catch (e) { }

      return merged;
    } catch (err) {
      console.error('Failed to update general settings:', err);
      throw err;
    }
  };
`;
  code = code.replace(
    'const addBranch = async (branchData) => {',
    handlerBlock + '\n  const addBranch = async (branchData) => {'
  );
}

// 5. Export generalSettings and updateGeneralSettings in Provider value
if (!code.includes('generalSettings,')) {
  code = code.replace(
    'branches,',
    'generalSettings,\n        updateGeneralSettings,\n        DEFAULT_GENERAL_SETTINGS,\n        branches,'
  );
}

fs.writeFileSync(contextPath, code, 'utf8');
console.log('Successfully updated AdminContext.jsx with General Settings!');

