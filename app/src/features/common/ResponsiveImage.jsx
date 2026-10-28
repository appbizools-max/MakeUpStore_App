import React, { useState } from 'react';
import { getResponsiveImageUri } from '../../utils/imageUtils';

/**
 * SALBEAU RESPONSIVE IMAGE COMPONENT
 * 
 * Supports:
 * - High-efficiency WebP resolution based on device component size (thumbnail, small, medium, large, logo)
 * - Transparent alpha preservation (no artificial white backgrounds for logos)
 * - Aspect ratio reservation to eliminate Cumulative Layout Shift (CLS)
 * - Soft skeleton / placeholder state during network loads
 * - Graceful fallback badge on network error or missing assets
 */
export default function ResponsiveImage({
  src,
  variant = 'medium',
  alt = 'Image',
  className = '',
  aspectRatio = 'square', // 'square' | 'auto' | custom e.g. 'aspect-square'
  fit = 'contain', // 'contain' | 'cover'
  fallbackIcon = null,
  fallbackText = ''
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedUri = getResponsiveImageUri(src, variant, '');

  const aspectClass = aspectRatio === 'square'
    ? 'aspect-square'
    : (aspectRatio === 'auto' ? '' : aspectRatio);

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  if (!resolvedUri || hasError) {
    return (
      <div className={`w-full h-full ${aspectClass} bg-pink-50/50 flex flex-col items-center justify-center text-pink-300 select-none p-2 rounded-inherit ${className}`}>
        {fallbackIcon || (
          <div className="w-8 h-8 rounded-full bg-pink-100/60 flex items-center justify-center text-[#C2477A] font-bold text-xs uppercase">
            {fallbackText ? fallbackText.slice(0, 2) : 'SB'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${aspectClass} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-pink-50/40 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-pink-200 border-t-[#C2477A] animate-spin" />
        </div>
      )}
      <img
        src={resolvedUri}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full ${fitClass} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
