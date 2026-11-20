import { NativeModules, Platform } from 'react-native';

// In-memory cache for ultra-fast synchronous access and persistent runtime session
const memoryCache = new Map();

// Standard AsyncStorage instance from @react-native-async-storage/async-storage
let asyncStorageInstance = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  asyncStorageInstance = mod.default || mod;
} catch (_) {
  asyncStorageInstance = null;
}

// Helper to access native storage module directly if present
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
    // 1. In-memory cache hit (0ms)
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    // 2. Official @react-native-async-storage/async-storage (fast SQLite on Android/iOS)
    if (asyncStorageInstance && typeof asyncStorageInstance.getItem === 'function') {
      try {
        const val = await asyncStorageInstance.getItem(key);
        if (val !== null && val !== undefined) {
          memoryCache.set(key, val);
          return val;
        }
      } catch (_) {}
    }

    // 3. Direct native module check (fallback)
    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiGet === 'function') {
      try {
        const val = await new Promise((resolve) => {
          const timer = setTimeout(() => resolve(null), 500);
          nativeMod.multiGet([key], (errors, result) => {
            clearTimeout(timer);
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

    // 4. Web localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) {
          memoryCache.set(key, val);
          return val;
        }
      } catch (_) {}
    }

    // 5. FileSystem fallback
    await loadFsFromFile();
    return memoryCache.get(key) || null;
  },

  async setItem(key, value) {
    const strVal = String(value);
    memoryCache.set(key, strVal);

    // 1. Official @react-native-async-storage/async-storage
    if (asyncStorageInstance && typeof asyncStorageInstance.setItem === 'function') {
      try {
        await asyncStorageInstance.setItem(key, strVal);
      } catch (_) {}
    }

    // 2. Direct native module write (fallback)
    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiSet === 'function') {
      try {
        await new Promise((resolve) => {
          const timer = setTimeout(() => resolve(), 500);
          nativeMod.multiSet([[key, strVal]], () => {
            clearTimeout(timer);
            resolve();
          });
        });
      } catch (_) {}
    }

    // 3. Web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (_) {}
    }

    // 4. FileSystem fallback (only if AsyncStorage not present)
    if (!asyncStorageInstance) {
      syncFsToFile().catch(() => {});
    }
  },

  async removeItem(key) {
    memoryCache.delete(key);

    if (asyncStorageInstance && typeof asyncStorageInstance.removeItem === 'function') {
      try {
        await asyncStorageInstance.removeItem(key);
      } catch (_) {}
    }

    const nativeMod = getRawNativeModule();
    if (nativeMod && typeof nativeMod.multiRemove === 'function') {
      try {
        await new Promise((resolve) => {
          const timer = setTimeout(() => resolve(), 500);
          nativeMod.multiRemove([key], () => {
            clearTimeout(timer);
            resolve();
          });
        });
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (_) {}
    }

    if (!asyncStorageInstance) {
      syncFsToFile().catch(() => {});
    }
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
