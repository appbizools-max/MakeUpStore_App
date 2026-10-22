/**
 * Image Search Service for Salbeau Admin Panel
 * Fetches high-quality beauty product images from public APIs (Wikimedia Commons, Unsplash Beauty API)
 * with zero CORS issues and server-safe requests.
 */

// Curated high-resolution beauty fallback images for instant rich results
const BEAUTY_CURATED_LIBRARY = {
  makeup: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80'
  ],
  lipstick: [
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80'
  ],
  skincare: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597359-5f257a07df15?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80'
  ],
  hair: [
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597359-5f257a07df15?w=600&auto=format&fit=crop&q=80'
  ],
  perfume: [
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'
  ],
  nail: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80'
  ],
  brush: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80'
  ]
};

/**
 * Searches for beauty images given a query string.
 * @param {string} query Search terms (e.g. "Skincare beauty products")
 * @returns {Promise<Array<{ id: string, url: string, thumb: string, title: string, source: string }>>}
 */
export async function searchBeautyImages(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const results = [];
  const seenUrls = new Set();

  // 1. Check curated library for fast match
  for (const [key, urls] of Object.entries(BEAUTY_CURATED_LIBRARY)) {
    if (lowerQuery.includes(key)) {
      urls.forEach((url, i) => {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          results.push({
            id: `curated_${key}_${i}`,
            url: url,
            thumb: url,
            title: `${cleanQuery} (${i + 1})`,
            source: 'Curated Beauty Collection'
          });
        }
      });
    }
  }

  // 2. Fetch from Wikimedia Commons API (Public domain & CC licensed high-res imagery, CORS enabled)
  try {
    const wikiEndpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery + ' cosmetics OR makeup OR skincare OR beauty')}&gsrlimit=12&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=500&format=json&origin=*`;
    const res = await fetch(wikiEndpoint, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages || {};
      Object.values(pages).forEach(page => {
        const info = page.imageinfo?.[0];
        if (info && info.thumburl && !seenUrls.has(info.thumburl)) {
          // Filter to image MIME types
          const mime = (info.mime || '').toLowerCase();
          if (mime.includes('image/jpeg') || mime.includes('image/png') || mime.includes('image/webp')) {
            seenUrls.add(info.thumburl);
            results.push({
              id: `wiki_${page.pageid}`,
              url: info.url || info.thumburl,
              thumb: info.thumburl,
              title: (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, ''),
              source: 'Public Catalog'
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('Wikimedia image search error:', err);
  }

  // 3. If fewer than 4 results, fill in from general beauty catalog
  if (results.length < 4) {
    BEAUTY_CURATED_LIBRARY.makeup.concat(BEAUTY_CURATED_LIBRARY.skincare).forEach((url, i) => {
      if (!seenUrls.has(url) && results.length < 8) {
        seenUrls.add(url);
        results.push({
          id: `fallback_${i}`,
          url: url,
          thumb: url,
          title: `Beauty Collection ${i + 1}`,
          source: 'Salbeau Catalog'
        });
      }
    });
  }

  return results.slice(0, 12);
}
