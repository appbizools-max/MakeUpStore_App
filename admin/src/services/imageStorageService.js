/**
 * SALBEAU MAKEUPSTORE — ENTERPRISE IMAGE STORAGE SERVICE
 * 
 * Orchestrates:
 * 1. Pre-upload automatic compression using specialized profiles
 * 2. Responsive variant generation (thumbnail, small, medium, large)
 * 3. Upload to persistent Supabase Storage buckets (brand-logos, products, categories)
 * 4. High-availability fallback caching for offline or network-degraded environments
 * 5. Returns canonical URLs, paths, dimensions, and storage savings analytics
 */

import { supabase } from '../config/supabase';
import { 
  optimizeImage, 
  generateResponsiveVariants, 
  fetchImageUrlAsBlob, 
  IMAGE_PROFILES, 
  formatBytes,
  calculateStorageSavings 
} from '../utils/imageOptimizer';

const BUCKET_MAPPING = {
  BRAND_LOGO: ['brand-logos', 'gc-home-assets', 'categories'],
  CATEGORY: ['categories', 'gc-home-assets', 'products'],
  SUBCATEGORY: ['categories', 'gc-home-assets', 'products'],
  PRODUCT: ['products', 'gc-home-assets', 'categories'],
  VERIFICATION_DOC: ['verification-docs', 'products', 'gc-home-assets']
};

/**
 * Uploads an image to Supabase Storage with automatic profile-based optimization.
 * 
 * @param {File|Blob|string} source - Input image (file, blob, data URL, or external URL)
 * @param {string} profileType - 'BRAND_LOGO' | 'CATEGORY' | 'SUBCATEGORY' | 'PRODUCT'
 * @param {object} options - { folder, filenamePrefix, generateVariants, brandCode }
 */
export async function uploadOptimizedImage(source, profileType = 'PRODUCT', options = {}) {
  const {
    folder = 'assets',
    filenamePrefix = 'img',
    generateVariants = false,
    brandCode = null
  } = options;

  if (!source) return null;

  // If already an existing persistent CDN/storage URL and not a data URL, return as-is
  if (typeof source === 'string' && source.startsWith('http') && !source.includes('localhost') && !source.startsWith('data:')) {
    // If it's an external URL to be imported and optimized (e.g. from Excel or web search), fetch it
    if (options.downloadRemote) {
      const blob = await fetchImageUrlAsBlob(source);
      if (blob) {
        source = blob;
      }
    } else {
      return {
        url: source,
        masterUrl: source,
        variants: {},
        stats: { savingsPercent: 0, originalSize: 0, optimizedSize: 0 }
      };
    }
  }

  // 1. Optimize master image with profile
  const optimized = await optimizeImage(source, profileType, {
    filename: `${filenamePrefix}_master.webp`
  });

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanPrefix = (brandCode || filenamePrefix || 'asset').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const masterFilename = `${cleanPrefix}_${timestamp}_${randomStr}.webp`;
  const storagePath = `${folder}/${masterFilename}`;

  // 2. Select appropriate storage buckets
  const buckets = BUCKET_MAPPING[profileType] || ['products', 'gc-home-assets', 'categories'];

  let publicUrl = null;
  let uploadSuccess = false;

  // 3. Attempt upload to Supabase Storage
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, optimized.file, {
          contentType: optimized.mimeType || 'image/webp',
          cacheControl: '31536000', // 1 year cache
          upsert: true
        });

      if (!error) {
        const { data: pubData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        if (pubData?.publicUrl) {
          publicUrl = `${pubData.publicUrl}?v=${timestamp}`;
          uploadSuccess = true;
          break;
        }
      }
    } catch (err) {
      // Try next bucket
    }
  }

  // Fallback: If remote storage unreachable, use optimized high-efficiency data URL
  if (!uploadSuccess || !publicUrl) {
    publicUrl = optimized.dataUrl;
  }

  // 4. Generate responsive variants if required (e.g. for products)
  const variants = {};
  if (generateVariants && profileType === 'PRODUCT') {
    try {
      const variantResults = await generateResponsiveVariants(optimized.blob, cleanPrefix);
      for (const [key, v] of Object.entries(variantResults)) {
        let variantUrl = null;
        if (uploadSuccess) {
          const vPath = `${folder}/${cleanPrefix}_${timestamp}_${v.filename}`;
          try {
            const { error: vErr } = await supabase.storage
              .from(buckets[0])
              .upload(vPath, v.file, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
              });
            if (!vErr) {
              const { data: vPub } = supabase.storage.from(buckets[0]).getPublicUrl(vPath);
              variantUrl = vPub?.publicUrl ? `${vPub.publicUrl}?v=${timestamp}` : v.dataUrl;
            }
          } catch (e) {
            variantUrl = v.dataUrl;
          }
        } else {
          variantUrl = v.dataUrl;
        }
        variants[key] = variantUrl || v.dataUrl;
      }
    } catch (varErr) {
      console.warn('Failed to generate one or more responsive variants:', varErr);
    }
  }

  return {
    url: publicUrl,
    masterUrl: publicUrl,
    storagePath,
    width: optimized.width,
    height: optimized.height,
    originalSize: optimized.originalSize,
    optimizedSize: optimized.optimizedSize,
    savedPercent: optimized.savedPercent,
    durationMs: optimized.durationMs,
    format: 'webp',
    hasTransparency: optimized.hasTransparency,
    variants,
    stats: {
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      savingsPercent: optimized.savedPercent,
      originalFormatted: formatBytes(optimized.originalSize),
      optimizedFormatted: formatBytes(optimized.optimizedSize),
      durationMs: optimized.durationMs
    }
  };
}
