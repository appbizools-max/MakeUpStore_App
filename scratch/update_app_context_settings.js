const fs = require('fs');

const appCtxPath = 'app/src/context/AppContext.js';
let code = fs.readFileSync(appCtxPath, 'utf8');

// 1. Add DEFAULT_STORE_SETTINGS if not present
if (!code.includes('export const DEFAULT_STORE_SETTINGS')) {
  const storeSettingsDef = `
export const DEFAULT_STORE_SETTINGS = {
  identity: {
    storeName: 'Salbeau',
    tagline: 'Luxury Beauty & Salon Cosmetics Store',
    contactEmail: 'contact@salbeau.com',
    supportPhone: '+91 98765 43210',
    hqAddress: 'Salbeau Headquarters, VIP Road, Visakhapatnam, AP - 530003',
    currencySymbol: '₹'
  },
  delivery: {
    standardDeliveryFee: 49,
    freeDeliveryThreshold: 499,
    estimatedDeliveryTime: 'Same Day / 24-48 Hours',
    minOrderAmount: 99,
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
    allowCustomerSelfCancel: true,
  }
};
`;
  code = code.replace(
    'export const AppProvider = ({ children }) => {',
    storeSettingsDef + '\nexport const AppProvider = ({ children }) => {'
  );
}

// 2. Add storeSettings state & getDeliveryFee helper inside AppProvider
if (!code.includes('const [storeSettings, setStoreSettings]')) {
  const settingsState = `  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = storage.getSync('salbeau_store_settings_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_STORE_SETTINGS,
            ...parsed,
            identity: { ...DEFAULT_STORE_SETTINGS.identity, ...(parsed.identity || {}) },
            delivery: { ...DEFAULT_STORE_SETTINGS.delivery, ...(parsed.delivery || {}) },
            payments: { ...DEFAULT_STORE_SETTINGS.payments, ...(parsed.payments || {}) },
            operations: { ...DEFAULT_STORE_SETTINGS.operations, ...(parsed.operations || {}) },
            policies: { ...DEFAULT_STORE_SETTINGS.policies, ...(parsed.policies || {}) },
          };
        }
      }
    } catch (e) {}
    return DEFAULT_STORE_SETTINGS;
  });

  const getDeliveryFee = useCallback((amount = 0) => {
    const threshold = Number(storeSettings?.delivery?.freeDeliveryThreshold ?? 499);
    if (Number(amount) >= threshold) return 0;
    return Number(storeSettings?.delivery?.standardDeliveryFee ?? 49);
  }, [storeSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.addEventListener) {
      const handleStorageSync = (e) => {
        if (e.key === 'salbeau_general_settings_sync' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data?.settings) {
              setStoreSettings(prev => ({
                ...prev,
                ...data.settings
              }));
            }
          } catch (_) {}
        }
      };
      window.addEventListener('storage', handleStorageSync);
      return () => window.removeEventListener('storage', handleStorageSync);
    }
  }, []);
`;
  code = code.replace(
    '  const [currentUpiOrder, setCurrentUpiOrder] = useState(null);',
    '  const [currentUpiOrder, setCurrentUpiOrder] = useState(null);\n' + settingsState
  );
}

// 3. Add fetching store settings in fetchCatalog
if (!code.includes("eq('id', 'salbeau_store_settings')")) {
  const fetchSettingsCall = `        // Fetch Store Settings from brands table
        supabase
          .from('brands')
          .select('id, logo')
          .eq('id', 'salbeau_store_settings')
          .maybeSingle()
          .then(({ data }) => {
            if (data?.logo) {
              try {
                const parsed = JSON.parse(data.logo);
                if (parsed && typeof parsed === 'object') {
                  setStoreSettings(prev => ({
                    ...prev,
                    ...parsed,
                    identity: { ...prev.identity, ...(parsed.identity || {}) },
                    delivery: { ...prev.delivery, ...(parsed.delivery || {}) },
                    payments: { ...prev.payments, ...(parsed.payments || {}) },
                    operations: { ...prev.operations, ...(parsed.operations || {}) },
                    policies: { ...prev.policies, ...(parsed.policies || {}) },
                  }));
                  try {
                    storage.setItem('salbeau_store_settings_cache', JSON.stringify(parsed));
                  } catch (_) {}
                }
              } catch (_) {}
            }
          })
          .catch(() => {});
`;
  code = code.replace(
    "// Ultra-low latency banner sync: updates banners in milliseconds without waiting for products or orders",
    fetchSettingsCall + "\n        // Ultra-low latency banner sync: updates banners in milliseconds without waiting for products or orders"
  );
}

// 4. Expose storeSettings, setStoreSettings, getDeliveryFee in contextValue
if (!code.includes('storeSettings,')) {
  code = code.replace(
    'currentUpiOrder,',
    'storeSettings,\n        setStoreSettings,\n        getDeliveryFee,\n        currentUpiOrder,'
  );
}

fs.writeFileSync(appCtxPath, code, 'utf8');
console.log('AppContext.js updated successfully with storeSettings.');

