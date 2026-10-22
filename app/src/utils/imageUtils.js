import { supabase } from '../config/supabase';

// Curated high-res beauty category fallbacks
export const DEFAULT_CATEGORY_FALLBACKS = {
  makeup: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800&auto=format&fit=crop&q=80',
  skincare: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  hairCare: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  hairStylingTools: 'https://images.unsplash.com/photo-1620118657710-23d8f6d2da74?w=800&auto=format&fit=crop&q=80',
  bathBody: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80',
  fragrance: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&auto=format&fit=crop&q=80',
  mensGrooming: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80',
  nailCare: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80',
  salonProducts: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80',
  beautyTools: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
  personalCare: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&auto=format&fit=crop&q=80',
  beautyKits: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800&auto=format&fit=crop&q=80'
};

export const getSafeImageUri = (input, fallback = DEFAULT_CATEGORY_FALLBACKS.default) => {
  // If input is null/undefined
  if (!input) {
    return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : DEFAULT_CATEGORY_FALLBACKS.default;
  }

  // If input is already an object (the exact cause of RCTImageView ReadableNativeMap crash)
  if (typeof input === 'object') {
    // Check if it's { uri: '...' }
    if (input.uri) {
      return getSafeImageUri(input.uri, fallback);
    }
    // Check if it's { data: { publicUrl: '...' } }
    if (input.data && typeof input.data === 'object' && input.data.publicUrl) {
      return getSafeImageUri(input.data.publicUrl, fallback);
    }
    // Check if it's { publicUrl: '...' }
    if (input.publicUrl) {
      return getSafeImageUri(input.publicUrl, fallback);
    }
    // Check if it's { url: '...' }
    if (input.url) {
      return getSafeImageUri(input.url, fallback);
    }
    // Check if it's { src: '...' }
    if (input.src) {
      return getSafeImageUri(input.src, fallback);
    }
    // Check if it's { path: '...' }
    if (input.path) {
      return getSafeImageUri(input.path, fallback);
    }
    // If it's an unrecognized object, fall back safely to valid string
    return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : DEFAULT_CATEGORY_FALLBACKS.default;
  }

  // If input is a string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : DEFAULT_CATEGORY_FALLBACKS.default;
    }

    // Check if it's a JSON string representing an object
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return getSafeImageUri(parsed, fallback);
      } catch (_) {}
    }

    // Check if it's an HTTP/HTTPS URL or base64 data URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }

    // If it's a Supabase storage path (e.g., "products/xyz.jpg" or "categories/abc.png")
    if (trimmed.includes('/') && !trimmed.startsWith('file://')) {
      const parts = trimmed.split('/');
      const bucket = parts[0];
      const filePath = parts.slice(1).join('/');
      try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      } catch (_) {}
    }

    return trimmed;
  }

  // Fallback default
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : DEFAULT_CATEGORY_FALLBACKS.default;
};

/**
 * Returns a guaranteed valid React Native Image source object or local number.
 * Ensures RCTImageView never receives a nested map or invalid src.
 */
export const getSafeImageSource = (imageInput, fallbackUri = DEFAULT_CATEGORY_FALLBACKS.default) => {
  if (typeof imageInput === 'number') {
    return imageInput;
  }
  const safeUri = getSafeImageUri(imageInput, fallbackUri);
  return { uri: safeUri };
};

export default {
  getSafeImageUri,
  getSafeImageSource,
  DEFAULT_CATEGORY_FALLBACKS
};
