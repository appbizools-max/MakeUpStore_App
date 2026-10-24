import { supabase } from '../config/supabase';

// Neutral empty beauty category fallbacks - no default images
export const DEFAULT_CATEGORY_FALLBACKS = {
  makeup: '',
  skincare: '',
  hairCare: '',
  hairStylingTools: '',
  bathBody: '',
  fragrance: '',
  mensGrooming: '',
  nailCare: '',
  salonProducts: '',
  beautyTools: '',
  personalCare: '',
  beautyKits: '',
  default: ''
};

export const getSafeImageUri = (input, fallback = '') => {
  // If input is null/undefined
  if (!input) {
    return typeof fallback === 'string' ? fallback.trim() : '';
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
    return typeof fallback === 'string' ? fallback.trim() : '';
  }

  // If input is a string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return typeof fallback === 'string' ? fallback.trim() : '';
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
  return typeof fallback === 'string' ? fallback.trim() : '';
};

/**
 * Returns a guaranteed valid React Native Image source object or local number.
 * Ensures RCTImageView never receives a nested map or invalid src.
 */
export const getSafeImageSource = (imageInput, fallbackUri = '') => {
  if (typeof imageInput === 'number') {
    return imageInput;
  }
  const safeUri = getSafeImageUri(imageInput, fallbackUri);
  return { uri: safeUri || '' };
};

export default {
  getSafeImageUri,
  getSafeImageSource,
  DEFAULT_CATEGORY_FALLBACKS
};
