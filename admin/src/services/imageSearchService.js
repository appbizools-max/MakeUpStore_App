/**
 * Image Search Service for Salbeau Admin Panel
 * Zero default/mock/curated stock images stored.
 * Queries live Wikimedia Commons public domain API when explicitly searched.
 */

export async function searchBeautyImages(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const results = [];
  const seenUrls = new Set();

  try {
    const wikiEndpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery + ' cosmetics OR makeup OR skincare OR beauty')}&gsrlimit=8&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=500&format=json&origin=*`;
    const res = await fetch(wikiEndpoint, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages || {};
      Object.values(pages).forEach(page => {
        const info = page.imageinfo?.[0];
        if (info && info.thumburl && !seenUrls.has(info.thumburl)) {
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
    console.warn('Image search error:', err);
  }

  return results;
}

export default {
  searchBeautyImages
};
