/**
 * Salbeau Image Optimizer & Processing Pipeline
 * Client-side image compression, resizing, aspect-ratio preservation, and format conversion.
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isImageUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return /^(https?:\/\/|data:image\/)/i.test(str.trim());
}

/**
 * Loads an image from a File, Blob, Data URL, or HTTP URL into an HTMLImageElement
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image source'));

    if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Invalid image source type'));
    }
  });
}

/**
 * Optimizes an image File, Blob, or URL using Canvas.
 * - Resizes if larger than maxWidth/maxHeight preserving aspect ratio
 * - Keeps product centered and prevents distortion
 * - Converts to efficient WebP (with JPEG fallback)
 * - Returns optimized File, dimensions, sizes, and base64 preview
 */
export async function optimizeImage(source, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    preferredFormat = 'image/webp',
    filename = 'optimized-image.webp',
  } = options;

  let originalSize = 0;
  if (source instanceof Blob) {
    originalSize = source.size;
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    originalSize = Math.round((source.length * 3) / 4);
  }

  const img = await loadImage(source);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // Calculate target dimensions preserving aspect ratio (scale-down)
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Draw to canvas with smooth filtering
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image centered and scaled
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Check WebP canvas export support
  let mimeType = preferredFormat;
  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL(mimeType, quality);
    if (!dataUrl.startsWith(`data:${mimeType}`)) {
      mimeType = 'image/jpeg';
      dataUrl = canvas.toDataURL(mimeType, quality);
    }
  } catch (e) {
    mimeType = 'image/jpeg';
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  // Convert canvas to Blob
  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          // Fallback via dataUrl if toBlob fails
          const byteString = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          resolve(new Blob([ab], { type: mimeType }));
        }
      },
      mimeType,
      quality
    );
  });

  const finalName = filename.replace(/\.[^/.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg');
  const optimizedFile = new File([blob], finalName, { type: mimeType });
  const optimizedSize = blob.size;

  const savedPercent = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100))
    : 0;

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
    savedPercent,
    mimeType,
    filename: finalName,
  };
}

/**
 * Downloads an external image URL via Fetch to Blob.
 * If CORS blocks direct fetch, returns null so the caller can fall back to image element or direct reference.
 */
export async function fetchImageUrlAsBlob(url) {
  if (!url || typeof url !== 'string') return null;

  // If already a data URL
  if (url.startsWith('data:image/')) {
    const res = await fetch(url);
    return await res.blob();
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const blob = await response.blob();
    return blob;
  } catch (err) {
    console.warn('Direct fetch failed due to CORS or network; attempting canvas proxy load', err);
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    } catch (canvasErr) {
      console.warn('Canvas export of external image also blocked by CORS:', canvasErr);
      return null;
    }
  }
}

/**
 * Convenience helper to optimize an image directly to a WebP File.
 */
export async function optimizeImageForWebP(source, options = {}) {
  const result = await optimizeImage(source, {
    ...options,
    preferredFormat: 'image/webp'
  });
  return result.file;
}
