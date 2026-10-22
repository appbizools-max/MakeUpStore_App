import { supabase } from '../config/supabase.js';

// In-memory debounce cache to prevent duplicate logs within a short session window
const recentSearchLogTimes = new Map();
const THROTTLE_WINDOW_MS = 6000; // 6 seconds debounce per identical query

/**
 * Normalizes query string for grouping identical searches
 */
export const normalizeSearchQuery = (rawQuery) => {
  if (!rawQuery || typeof rawQuery !== 'string') return '';
  return rawQuery.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Tracks every product search performed by every user in the User App.
 * Records whether the search matched products (found) or returned zero results (not found),
 * along with search keywords, barcode, user metadata, matched products summary, and search timestamps.
 *
 * @param {object} params
 * @param {string} params.query - Search text query
 * @param {string} [params.barcode] - Barcode query if scanned
 * @param {Array} [params.matchedProducts] - Matched product summaries
 * @param {boolean} [params.isFound] - True if at least 1 product was found
 * @param {object} [params.user] - Logged in user profile
 * @returns {Promise<object|null>}
 */
export async function trackCustomerSearch({
  query = '',
  barcode = '',
  matchedProducts = [],
  isFound = true,
  user = null
}) {
  try {
    const trimmed = (query || barcode || '').trim();
    if (trimmed.length < 2) return null;

    const normQuery = normalizeSearchQuery(trimmed);
    const now = Date.now();
    const cacheKey = `${normQuery}_${barcode || ''}`;
    const lastLogged = recentSearchLogTimes.get(cacheKey);

    if (lastLogged && now - lastLogged < THROTTLE_WINDOW_MS) {
      return null; // Throttle repeat searches in immediate typing window
    }
    recentSearchLogTimes.set(cacheKey, now);

    const nowIso = new Date().toISOString();
    const matchedCount = Array.isArray(matchedProducts) ? matchedProducts.length : (isFound ? 1 : 0);
    const matchedSummaries = Array.isArray(matchedProducts)
      ? matchedProducts.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brandName || p.brand,
          category: p.category,
          price: p.generalPrice || p.mrp
        }))
      : [];

    // 1. Try dedicated Supabase table `customer_search_requests`
    try {
      const { data: existing, error: selectErr } = await supabase
        .from('customer_search_requests')
        .select('*')
        .eq('normalized_query', normQuery)
        .limit(1);

      if (!selectErr) {
        if (existing && existing.length > 0) {
          const rec = existing[0];
          const updatedCount = (rec.search_count || 1) + 1;
          const { data: updated, error: updateErr } = await supabase
            .from('customer_search_requests')
            .update({
              search_count: updatedCount,
              latest_searched_at: nowIso,
              is_found: isFound,
              matched_count: matchedCount,
              matched_products: matchedSummaries.length > 0 ? matchedSummaries : rec.matched_products,
              barcode: barcode || rec.barcode,
              user_id: user?.id || rec.user_id,
              user_name: user?.name || rec.user_name,
              user_phone: user?.phone || rec.user_phone,
              user_role: user?.role || rec.user_role || 'Customer'
            })
            .eq('id', rec.id)
            .select();

          if (!updateErr && updated?.[0]) return updated[0];
        } else {
          const newId = `sr_${now}_${Math.random().toString(36).substring(2, 7)}`;
          const newRecord = {
            id: newId,
            query: trimmed,
            normalized_query: normQuery,
            barcode: barcode || null,
            is_found: isFound,
            matched_count: matchedCount,
            matched_products: matchedSummaries,
            search_count: 1,
            status: isFound ? 'resolved' : 'pending',
            created_at: nowIso,
            latest_searched_at: nowIso,
            user_id: user?.id || null,
            user_name: user?.name || user?.fullName || 'Guest User',
            user_phone: user?.phone || null,
            user_role: user?.role || 'Customer'
          };

          const { data: inserted, error: insertErr } = await supabase
            .from('customer_search_requests')
            .insert(newRecord)
            .select();

          if (!insertErr && inserted?.[0]) return inserted[0];
        }
      }
    } catch (tblErr) {
      // Table fallback
    }

    // 2. Real Supabase Fallback via `brands` table ('salbeau_customer_search_requests')
    const { data: brandRows, error: brandFetchErr } = await supabase
      .from('brands')
      .select('id, logo')
      .eq('id', 'salbeau_customer_search_requests')
      .limit(1);

    if (brandFetchErr) return null;

    let requestsList = [];
    if (brandRows && brandRows.length > 0 && brandRows[0].logo) {
      try {
        const parsed = JSON.parse(brandRows[0].logo);
        if (Array.isArray(parsed)) requestsList = parsed;
      } catch (e) {
        requestsList = [];
      }
    }

    const existingIndex = requestsList.findIndex(
      (r) => r.normalized_query === normQuery || r.query?.toLowerCase() === normQuery
    );

    let savedRecord = null;
    if (existingIndex >= 0) {
      const rec = requestsList[existingIndex];
      rec.search_count = (Number(rec.search_count) || 1) + 1;
      rec.latest_searched_at = nowIso;
      rec.is_found = isFound;
      rec.matched_count = matchedCount;
      if (matchedSummaries.length > 0) rec.matched_products = matchedSummaries;
      if (barcode) rec.barcode = barcode;
      if (user?.name) rec.user_name = user.name;
      if (user?.phone) rec.user_phone = user.phone;
      if (user?.id) rec.user_id = user.id;
      if (user?.role) rec.user_role = user.role;
      savedRecord = rec;
    } else {
      const newRecord = {
        id: `sr_${now}_${Math.random().toString(36).substring(2, 7)}`,
        query: trimmed,
        normalized_query: normQuery,
        barcode: barcode || null,
        is_found: isFound,
        matched_count: matchedCount,
        matched_products: matchedSummaries,
        search_count: 1,
        status: isFound ? 'resolved' : 'pending',
        created_at: nowIso,
        latest_searched_at: nowIso,
        user_id: user?.id || null,
        user_name: user?.name || user?.fullName || 'Guest User',
        user_phone: user?.phone || null,
        user_role: user?.role || 'Customer'
      };
      requestsList.unshift(newRecord);
      savedRecord = newRecord;
    }

    // Keep max 500 records in JSON fallback
    if (requestsList.length > 500) {
      requestsList = requestsList.slice(0, 500);
    }

    await supabase.from('brands').upsert({
      id: 'salbeau_customer_search_requests',
      name: 'Customer Search Requests',
      enabled: true,
      logo: JSON.stringify(requestsList)
    });

    return savedRecord;
  } catch (err) {
    console.warn('Error tracking customer search:', err);
    return null;
  }
}

/**
 * Backward compatibility alias for recording missing product queries
 */
export async function recordSearchNotFound(rawQuery, user = null) {
  return trackCustomerSearch({
    query: rawQuery,
    isFound: false,
    matchedProducts: [],
    user
  });
}

/**
 * Fetches all customer search requests and activity from Supabase
 */
export async function fetchCustomerSearchRequests() {
  try {
    // 1. Try dedicated table first
    const { data: tableData, error: tableErr } = await supabase
      .from('customer_search_requests')
      .select('*')
      .order('latest_searched_at', { ascending: false });

    if (!tableErr && tableData && tableData.length > 0) {
      return tableData;
    }

    // 2. Fallback to Supabase brands table storage
    const { data: brandRows, error: brandErr } = await supabase
      .from('brands')
      .select('id, logo')
      .eq('id', 'salbeau_customer_search_requests')
      .limit(1);

    if (!brandErr && brandRows && brandRows.length > 0 && brandRows[0].logo) {
      const parsed = JSON.parse(brandRows[0].logo);
      if (Array.isArray(parsed)) return parsed;
    }

    return [];
  } catch (err) {
    console.warn('Error fetching customer searches:', err);
    return [];
  }
}

export const fetchAllSearchRequests = fetchCustomerSearchRequests;

export async function updateSearchRequestStatus(requestId, newStatus, notes = null) {
  try {
    const { error } = await supabase
      .from('customer_search_requests')
      .update({ status: newStatus, notes, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    // Also update fallback
    const { data: bData } = await supabase.from('brands').select('logo').eq('id', 'salbeau_customer_search_requests').limit(1);
    if (bData?.[0]?.logo) {
      try {
        const parsed = JSON.parse(bData[0].logo);
        if (Array.isArray(parsed)) {
          const updated = parsed.map(r => r.id === requestId ? { ...r, status: newStatus, notes } : r);
          await supabase.from('brands').update({ logo: JSON.stringify(updated) }).eq('id', 'salbeau_customer_search_requests');
        }
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('Error updating search request status:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteSearchRequest(requestId) {
  try {
    await supabase.from('customer_search_requests').delete().eq('id', requestId);
    const { data: bData } = await supabase.from('brands').select('logo').eq('id', 'salbeau_customer_search_requests').limit(1);
    if (bData?.[0]?.logo) {
      try {
        const parsed = JSON.parse(bData[0].logo);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(r => r.id !== requestId);
          await supabase.from('brands').update({ logo: JSON.stringify(updated) }).eq('id', 'salbeau_customer_search_requests');
        }
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('Error deleting search request:', err);
    return { success: false, error: err.message };
  }
}

