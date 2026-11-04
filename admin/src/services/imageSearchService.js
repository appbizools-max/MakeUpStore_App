/**
 * Image Search Service for Salbeau Admin Panel
 * Performs live client-safe beauty image searches inside the admin panel.
 * Searches Wikimedia Commons and open beauty media APIs with smart fallback queries.
 */

const BEAUTY_KEYWORDS_MAP = [
  { match: /\blipstick\b/i, term: 'matte lipstick cosmetics' },
  { match: /\blip\s*gloss\b/i, term: 'lip gloss cosmetics' },
  { match: /\bfoundation\b/i, term: 'liquid foundation makeup' },
  { match: /\bconcealer\b/i, term: 'concealer makeup cosmetics' },
  { match: /\beyeliner\b/i, term: 'eyeliner cosmetics' },
  { match: /\bmascara\b/i, term: 'mascara cosmetics' },
  { match: /\beyeshadow\b/i, term: 'eyeshadow palette makeup' },
  { match: /\bblush\b/i, term: 'blush powder makeup' },
  { match: /\bserum\b/i, term: 'skincare serum bottle dropper' },
  { match: /\bcream\b/i, term: 'face cream skincare cosmetic jar' },
  { match: /\bpowder\b/i, term: 'compact powder cosmetics' },
  { match: /\bnail\b/i, term: 'nail polish bottle lacquer' },
  { match: /\bperfume\b/i, term: 'perfume bottle fragrance' },
  { match: /\bcleanser\b/i, term: 'facial cleanser skincare' },
  { match: /\bsunscreen\b/i, term: 'sunscreen lotion bottle skincare' }
];

async function fetchWikiImages(queryTerm, limit = 12) {
  const seenUrls = new Set();
  const results = [];
  try {
    const wikiEndpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryTerm)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=600&format=json&origin=*`;
    const res = await fetch(wikiEndpoint, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];

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
            source: 'Wikimedia Commons'
          });
        }
      }
    });
  } catch (err) {
    console.warn('Wiki image search failed:', err);
  }
  return results;
}

export async function searchBeautyImages(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const allResults = [];
  const seenUrls = new Set();

  const addUnique = (items) => {
    (items || []).forEach(item => {
      if (item && item.url && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allResults.push(item);
      }
    });
  };

  // 1. Direct query with cosmetics context
  const primaryResults = await fetchWikiImages(`${cleanQuery} cosmetics`);
  addUnique(primaryResults);

  // 2. If results are few, try exact query
  if (allResults.length < 6) {
    const directResults = await fetchWikiImages(cleanQuery, 8);
    addUnique(directResults);
  }

  // 3. Fallback based on cosmetic category if still fewer than 4
  if (allResults.length < 4) {
    for (const item of BEAUTY_KEYWORDS_MAP) {
      if (item.match.test(cleanQuery)) {
        const fallbackResults = await fetchWikiImages(item.term, 8);
        addUnique(fallbackResults);
        if (allResults.length >= 8) break;
      }
    }
  }

  // 4. Ultimate cosmetics packshot fallback if empty
  if (allResults.length === 0) {
    const generalResults = await fetchWikiImages('cosmetics beauty product packshot', 6);
    addUnique(generalResults);
  }

  return allResults.slice(0, 16);
}

export default {
  searchBeautyImages
};
