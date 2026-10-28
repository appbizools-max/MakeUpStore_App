import React, { useState } from 'react';

/**
 * SALBEAU ENTERPRISE RESPONSIVE IMAGE COMPONENT (ADMIN)
 * 
 * Supports:
 * - Dynamic resolution based on variant ('thumbnail', 'small', 'medium', 'large', 'logo', 'category')
 * - Preserves transparent alpha channel without forced opaque backgrounds
 * - Prevents layout shifts
 * - Visual fallback with initials or icon
 */
export default function ResponsiveImage({
  src,
  variant = 'medium',
  alt = 'Image',
  className = '',
  aspectRatio = 'square',
  fit = 'contain',
  fallbackIcon = null,
  fallbackText = ''
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  let resolvedUri = '';
  if (typeof src === 'string') {
    resolvedUri = src;
  } else if (src && typeof src === 'object') {
    const v = src.variants || src.responsiveVariants;
    if (v) {
      resolvedUri = v[variant] || v.small || v.medium || v.large || src.url || src.image || '';
    } else {
      resolvedUri = src.url || src.image || src.src || '';
    }
  }

  const aspectClass = aspectRatio === 'square'
    ? 'aspect-square'
    : (aspectRatio === 'auto' ? '' : aspectRatio);

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  if (!resolvedUri || hasError) {
    return (
      <div className={`w-full h-full ${aspectClass} bg-pink-50/40 flex flex-col items-center justify-center text-pink-300 select-none p-2 rounded-inherit ${className}`}>
        {fallbackIcon || (
          <div className="w-7 h-7 rounded-lg bg-pink-100/60 flex items-center justify-center text-[#C2477A] font-bold text-[10px] uppercase">
            {fallbackText ? fallbackText.slice(0, 2) : 'SB'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${aspectClass} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-pink-50/30 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-pink-200 border-t-[#C2477A] animate-spin" />
        </div>
      )}
      <img
        src={resolvedUri}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full ${fitClass} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
