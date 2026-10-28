/**
 * SALBEAU MAKEUPSTORE — CENTRALIZED IMAGE PROCESSING & OPTIMIZATION ENGINE
 * 
 * High-Definition Image Processing across Brand Master, Product Catalog,
 * Categories, Subcategories, Bulk Excel Imports, and Mobile App.
 * 
 * Features:
 * - Profiles for Brand Logos, Categories, Subcategories, and Products
 * - True Alpha Transparency Preservation (Never flattens transparent PNG/WebP to white)
 * - Automatic WebP format conversion with lossless/JPEG fallbacks
 * - Metadata & EXIF Stripping (GPS coordinates, camera metadata removed for privacy & size)
 * - Responsive Image Variant Generation (Thumbnail, Small, Medium, Large, Logo, Category)
 * - Color Accuracy Preservation for Cosmetics, Shade Swatches & Complex Packaging
 * - Real-Time Compression Analytics (Storage Savings %, Original vs Optimized Bytes)
 * - Safe Decoding & Corrupted / Malformed Image Rejection
 */

export const IMAGE_PROFILES = {
  BRAND_LOGO: {
    name: 'Brand Logo',
    format: 'image/webp',
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.90,
    targetSizeKB: [20, 100],
    maxProcessedSizeKB: 150,
    fitMode: 'contain',
    preserveTransparency: true,
    upscaling: false
  },
  CATEGORY: {
    name: 'Category Image',
    format: 'image/webp',
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    targetSizeKB: [40, 120],
    maxProcessedSizeKB: 200,
    fitMode: 'contain',
    preserveTransparency: true,
    upscaling: false
  },
  SUBCATEGORY: {
    name: 'Subcategory Image',
    format: 'image/webp',
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.85,
    targetSizeKB: [25, 90],
    maxProcessedSizeKB: 150,
    fitMode: 'contain',
    preserveTransparency: true,
    upscaling: false
  },
  PRODUCT: {
    name: 'Product Image',
    format: 'image/webp',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.88,
    targetSizeKB: [80, 250],
    maxProcessedSizeKB: 350,
    fitMode: 'contain',
    preserveTransparency: true,
    colorAccuracy: true,
    upscaling: false
  }
};

export const RESPONSIVE_VARIANTS = {
  thumbnail: { maxWidth: 160, maxHeight: 160, quality: 0.80, suffix: '_thumb' },
  small: { maxWidth: 320, maxHeight: 320, quality: 0.85, suffix: '_sm' },
  medium: { maxWidth: 640, maxHeight: 640, quality: 0.85, suffix: '_md' },
  large: { maxWidth: 1200, maxHeight: 1200, quality: 0.88, suffix: '_lg' },
  logo: { maxWidth: 512, maxHeight: 512, quality: 0.90, suffix: '_logo' },
  category: { maxWidth: 800, maxHeight: 800, quality: 0.85, suffix: '_cat' }
};

/**
 * Format bytes into readable string (e.g. 42.5 KB, 2.1 MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate storage savings percentage
 * Storage Savings (%) = ((Original Size - Optimized Size) / Original Size) * 100
 */
export function calculateStorageSavings(originalBytes, optimizedBytes) {
  if (!originalBytes || originalBytes <= 0 || !optimizedBytes) return 0;
  if (optimizedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - optimizedBytes) / originalBytes) * 1000) / 10;
}

export function isImageUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return /^(https?:\/\/|data:image\/|blob:)/i.test(str.trim());
}

/**
 * Validates image file type and size constraints
 */
export function validateImageFile(file, options = {}) {
  const { maxSizeBytes = 10 * 1024 * 1024 } = options;
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  const validMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/bmp'
  ];

  if (!validMimes.includes(file.type) && !/\.(jpe?g|png|webp|svg|gif|bmp)$/i.test(file.name || '')) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload PNG, JPG, JPEG, WebP, or SVG.'
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of ${formatBytes(maxSizeBytes)}.`
    };
  }

  return { valid: true };
}

/**
 * Safely loads an image source (File, Blob, Data URL, or HTTP URL) into an HTMLImageElement
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (!source) {
      return reject(new Error('Image source is empty or invalid.'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = null;

    const cleanup = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = (err) => {
      cleanup();
      reject(new Error('Failed to decode image source. Image may be corrupted or blocked by CORS.'));
    };

    if (source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Unsupported image source type. Expected File, Blob, or URL string.'));
    }
  });
}

/**
 * Checks if canvas contains transparent pixels in its alpha channel
 */
export function hasAlphaChannel(ctx, width, height) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // Sample every 4th pixel for fast detection
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) {
        return true;
      }
    }
    return false;
  } catch (e) {
    // If CORS tainted, assume transparency needs preservation
    return true;
  }
}

/**
 * Calculate scaled dimensions respecting aspect ratio and max bounds
 */
export function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight, allowUpscale = false) {
  if (!srcWidth || !srcHeight) {
    return { width: maxWidth, height: maxHeight };
  }

  if (!allowUpscale && srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio))
  };
}

/**
 * Centralized Core Image Optimization Function
 * 
 * @param {File|Blob|string} source - Image source (file, blob, data URL, or HTTP URL)
 * @param {string|object} profile - Profile name ('BRAND_LOGO', 'CATEGORY', 'SUBCATEGORY', 'PRODUCT') or custom options
 * @param {object} overrideOptions - Additional overrides (e.g. filename, preferredFormat)
 */
export async function optimizeImage(source, profile = 'PRODUCT', overrideOptions = {}) {
  const startTime = Date.now();

  const profileConfig = typeof profile === 'string'
    ? (IMAGE_PROFILES[profile] || IMAGE_PROFILES.PRODUCT)
    : (profile || IMAGE_PROFILES.PRODUCT);

  const options = {
    ...profileConfig,
    ...overrideOptions
  };

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.88,
    preserveTransparency = true,
    upscaling = false,
    preferredFormat = 'image/webp',
    filename = 'optimized-asset.webp',
    maxProcessedSizeKB = 350
  } = options;

  let originalSize = 0;
  if (source instanceof Blob) {
    originalSize = source.size;
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    originalSize = Math.round((source.length * 3) / 4);
  }

  // 1. Decode image safely
  const img = await loadImage(source);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // 2. Compute proportional dimensions without stretching
  const targetDims = calculateAspectRatioFit(origWidth, origHeight, maxWidth, maxHeight, upscaling);
  const targetWidth = targetDims.width;
  const targetHeight = targetDims.height;

  // 3. Render onto canvas (stripping EXIF metadata & GPS data)
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context could not be initialized.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 4. Handle transparency: NEVER paint white background if image has alpha
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const containsAlpha = preserveTransparency && hasAlphaChannel(ctx, targetWidth, targetHeight);

  // 5. Select optimal output format
  let mimeType = preferredFormat;
  let targetQuality = quality;

  // Check WebP canvas export support
  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL(mimeType, targetQuality);
    if (!dataUrl.startsWith(`data:${mimeType}`)) {
      // Fallback: If WebP unsupported, use PNG for transparency, JPEG for opaque
      mimeType = containsAlpha ? 'image/png' : 'image/jpeg';
      dataUrl = canvas.toDataURL(mimeType, targetQuality);
    }
  } catch (e) {
    mimeType = containsAlpha ? 'image/png' : 'image/jpeg';
    dataUrl = canvas.toDataURL(mimeType, targetQuality);
  }

  // 6. Convert canvas to Blob
  let blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          try {
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            resolve(new Blob([ab], { type: mimeType }));
          } catch (bErr) {
            resolve(null);
          }
        }
      },
      mimeType,
      targetQuality
    );
  });

  if (!blob) {
    throw new Error('Failed to generate optimized image blob.');
  }

  // 7. Adaptive compression if image exceeds maxProcessedSizeKB
  const maxBytes = maxProcessedSizeKB * 1024;
  if (blob.size > maxBytes && mimeType === 'image/webp' && targetQuality > 0.65) {
    targetQuality = Math.max(0.65, targetQuality - 0.15);
    const recompressedBlob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, targetQuality));
    if (recompressedBlob && recompressedBlob.size < blob.size) {
      blob = recompressedBlob;
      dataUrl = canvas.toDataURL(mimeType, targetQuality);
    }
  }

  const fileExt = mimeType === 'image/webp' ? '.webp' : (mimeType === 'image/png' ? '.png' : '.jpg');
  const cleanBaseName = (filename || 'asset').replace(/\.[^/.]+$/, '');
  const finalFilename = `${cleanBaseName}${fileExt}`;
  const optimizedFile = new File([blob], finalFilename, { type: mimeType });

  const optimizedSize = blob.size;
  const savingsPercent = calculateStorageSavings(originalSize, optimizedSize);
  const durationMs = Date.now() - startTime;

  return {
    file: optimizedFile,
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    originalWidth: origWidth,
    originalHeight: origHeight,
    originalSize,
    optimizedSize,
    savedPercent: savingsPercent,
    mimeType,
    filename: finalFilename,
    hasTransparency: containsAlpha,
    durationMs,
    summary: `${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savingsPercent}% reduction)`
  };
}

/**
 * Generates all responsive image variants from a master source
 * Variants: thumbnail (160x160), small (320x320), medium (640x640), large (1200x1200)
 */
export async function generateResponsiveVariants(source, baseFilename = 'product') {
  const variantKeys = ['thumbnail', 'small', 'medium', 'large'];
  const results = {};

  for (const key of variantKeys) {
    const spec = RESPONSIVE_VARIANTS[key];
    if (!spec) continue;

    try {
      const opt = await optimizeImage(source, {
        maxWidth: spec.maxWidth,
        maxHeight: spec.maxHeight,
        quality: spec.quality,
        preserveTransparency: true,
        filename: `${baseFilename}${spec.suffix}.webp`
      });

      results[key] = {
        file: opt.file,
        blob: opt.blob,
        dataUrl: opt.dataUrl,
        width: opt.width,
        height: opt.height,
        size: opt.optimizedSize,
        mimeType: opt.mimeType,
        filename: opt.filename
      };
    } catch (e) {
      console.warn(`Failed to generate variant ${key}:`, e);
    }
  }

  return results;
}

/**
 * Downloads an external image URL via Fetch to Blob.
 * Supports CORS, data URLs, and canvas fallback.
 */
export async function fetchImageUrlAsBlob(url) {
  if (!url || typeof url !== 'string') return null;

  if (url.startsWith('data:image/')) {
    try {
      const res = await fetch(url);
      return await res.blob();
    } catch (e) {
      return null;
    }
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.blob();
  } catch (err) {
    // Attempt canvas proxy load if fetch failed due to CORS headers
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    } catch (canvasErr) {
      console.warn('Canvas export of external image blocked by CORS or network:', canvasErr);
      return null;
    }
  }
}

/**
 * Convenience helper to optimize an image directly to a WebP File.
 */
export async function optimizeImageForWebP(source, options = {}) {
  const result = await optimizeImage(source, 'PRODUCT', {
    ...options,
    preferredFormat: 'image/webp'
  });
  return result.file;
}
