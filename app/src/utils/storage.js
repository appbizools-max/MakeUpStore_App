import { NativeModules, Platform } from 'react-native';

// In-memory cache for ultra-fast synchronous access and persistent runtime session
const memoryCache = new Map();

// Helper to access native storage module directly if present, without importing
// the wrapper package that throws when the native module is absent from the APK
function getRawNativeModule() {
  try {
    const nm = typeof NativeModules !== 'undefined' && NativeModules ? NativeModules : {};
    return (
      nm.RNCAsyncStorage ||
      nm.PlatformLocalStorage ||
      nm.AsyncLocalStorage ||
      nm.AsyncSQLiteDBStorage ||
      null
    );
  } catch (_) {
    return null;
  }
}

// FileSystem persistence fallback (Expo FileSystem)
let expoFs = null;
let fsChecked = false;
let fsFilePath = null;
let fsLoaded = false;

function getExpoFileSystem() {
  if (fsChecked) return expoFs;
  fsChecked = true;
  try {
    const fs = require('expo-file-system');
    if (fs && fs.documentDirectory) {
      expoFs = fs;
      fsFilePath = `${fs.documentDirectory}salbeau_app_storage_v1.json`;
    }
  } catch (_) {
    expoFs = null;
  }
  return expoFs;
}

async function syncFsToFile() {
  try {
    const fs = getExpoFileSystem();
    if (fs && fsFilePath) {
      const plainObj = {};
      for (const [k, v] of memoryCache.entries()) {
        plainObj[k] = v;
      }
      await fs.writeAsStringAsync(fsFilePath, JSON.stringify(plainObj));
    }
  } catch (_) {}
}

async function loadFsFromFile() {
  if (fsLoaded) return;
  fsLoaded = true;
  try {
    const fs = getExpoFileSystem();
    if (fs && fsFilePath) {
      const info = await fs.getInfoAsync(fsFilePath);
      if (info && info.exists) {
        const raw = await fs.readAsStringAsync(fsFilePath);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([k, v]) => {
              if (!memoryCache.has(k)) {
                memoryCache.set(k, String(v));
              }
            });
          }
        }
      }
    }
  } catch (_) {}
}

// Preload file cache in background
loadFsFromFile().catch(() => {});

export const storage = {
  async getItem(key) {
    // 1. In-memory cache hit
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    // 2. Direct native module check (if linked natively)
    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiGet === 'function') {
      try {
        const val = await new Promise((resolve) => {
          nativeMod.multiGet([key], (errors, result) => {
            if (!errors && result && result[0] && result[0][1] !== null && result[0][1] !== undefined) {
              resolve(result[0][1]);
            } else {
              resolve(null);
            }
          });
        });
        if (val !== null && val !== undefined) {
          memoryCache.set(key, val);
          return val;
        }
      } catch (_) {}
    }

    // 3. Web localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) {
          memoryCache.set(key, val);
          return val;
        }
      } catch (_) {}
    }

    // 4. FileSystem fallback
    await loadFsFromFile();
    return memoryCache.get(key) || null;
  },

  async setItem(key, value) {
    const strVal = String(value);
    memoryCache.set(key, strVal);

    // Direct native module write (if linked natively)
    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiSet === 'function') {
      try {
        await new Promise((resolve) => {
          nativeMod.multiSet([[key, strVal]], () => resolve());
        });
      } catch (_) {}
    }

    // Web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (_) {}
    }

    // FileSystem
    syncFsToFile().catch(() => {});
  },

  async removeItem(key) {
    memoryCache.delete(key);

    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiRemove === 'function') {
      try {
        await new Promise((resolve) => {
          nativeMod.multiRemove([key], () => resolve());
        });
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (_) {}
    }

    syncFsToFile().catch(() => {});
  },

  getSync(key) {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {}
    }
    return null;
  }
};

export default storage;
