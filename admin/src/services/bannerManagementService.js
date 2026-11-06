import { supabase, supabaseAdmin } from '../config/supabase.js';

export const BANNER_TYPES = [
  { id: 'home', label: 'Home Page Banner', description: 'Hero carousel banner on main store page', recommendedSize: '1200 × 510 px (2.35:1)' }
];

const LOCAL_STORAGE_KEY = 'salbeau_central_banners';
const DB_CONFIG_ID = 'app_central_banners_master';
const DB_HOME_CONFIG_ID = 'app_home_banners';
const DB_BACKUP_ID = 'app_banners_backup_snapshot';

// Default home banners aligned 100% with Mobile App HomeScreen
export const DEFAULT_CENTRAL_BANNERS = [
  {
    id: 'banner_1',
    name: 'Glow Your Own Way',
    title: 'Glow Your Own Way',
    subtitle: 'Discover authentic beauty, salon & grooming formulations',
    bannerType: 'home',
    type: 'home',
    ctaText: 'Shop Best Sellers →',
    ctaLabel: 'Shop Best Sellers →',
    destinationType: 'BEST_SELLERS',
    destinationId: 'best_sellers',
    selectionId: 'best_sellers',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_1.jpg',
    mobileImageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_1.jpg',
    displayOrder: 1,
    isActive: true
  },
  {
    id: 'banner_2',
    name: 'Healthy Skin, Happier You',
    title: 'Healthy Skin, Happier You',
    subtitle: 'Salon-grade skincare for everyday radiant results',
    bannerType: 'home',
    type: 'home',
    ctaText: 'Shop Skincare →',
    ctaLabel: 'Shop Skincare →',
    destinationType: 'CATEGORY',
    destinationId: 'Skin Care',
    categoryId: 'Skin Care',
    categoryName: 'Skin Care',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_2.jpg',
    mobileImageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_2.jpg',
    displayOrder: 2,
    isActive: true
  },
  {
    id: 'banner_3',
    name: 'Bold Looks, Brighter Days',
    title: 'Bold Looks, Brighter Days',
    subtitle: 'Premium makeup for salon-perfect finish',
    bannerType: 'home',
    type: 'home',
    ctaText: 'Explore Makeup →',
    ctaLabel: 'Explore Makeup →',
    destinationType: 'CATEGORY',
    destinationId: 'Makeup',
    categoryId: 'Makeup',
    categoryName: 'Makeup',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_3.jpg',
    mobileImageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_3.jpg',
    displayOrder: 3,
    isActive: true
  },
  {
    id: 'banner_4',
    name: 'Stronger Hair, Healthier You',
    title: 'Stronger Hair, Healthier You',
    subtitle: 'Nourishment, repair & salon care for every hair type',
    bannerType: 'home',
    type: 'home',
    ctaText: 'Shop Hair Care →',
    ctaLabel: 'Shop Hair Care →',
    destinationType: 'CATEGORY',
    destinationId: 'Hair Care',
    categoryId: 'Hair Care',
    categoryName: 'Hair Care',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_4.jpg',
    mobileImageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_4.jpg',
    displayOrder: 4,
    isActive: true
  },
  {
    id: 'banner_5',
    name: 'Autumn Glamour & Glass Glow',
    title: 'Autumn Glamour & Glass Glow',
    subtitle: 'Up to 35% wholesale pricing for verified salon pros & artists',
    bannerType: 'home',
    type: 'home',
    ctaText: 'Explore Pro Rates →',
    ctaLabel: 'Explore Pro Rates →',
    destinationType: 'CATEGORY',
    destinationId: 'Makeup',
    categoryId: 'Makeup',
    categoryName: 'Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&auto=format&fit=crop&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&auto=format&fit=crop&q=80',
    displayOrder: 5,
    isActive: true
  }
];

/**
 * Fetch all central banners from Supabase
 */
export async function fetchAllCentralBanners() {
  const client = supabaseAdmin || supabase;
  let banners = null;

  try {
    // 1. Fetch from centralized config row in brands table
    const { data: brandConfig } = await client
      .from('brands')
      .select('logo')
      .eq('id', DB_CONFIG_ID)
      .maybeSingle();

    if (brandConfig?.logo) {
      try {
        const parsed = JSON.parse(brandConfig.logo);
        if (Array.isArray(parsed)) {
          banners = parsed;
        }
      } catch (_) {}
    }

    // 2. Fetch from legacy app_home_banners if banners still null
    if (banners === null) {
      const { data: legacyRow } = await client
        .from('brands')
        .select('logo')
        .eq('id', DB_HOME_CONFIG_ID)
        .maybeSingle();

      if (legacyRow?.logo) {
        try {
          const legacy = JSON.parse(legacyRow.logo);
          if (Array.isArray(legacy)) {
            banners = legacy.map(b => ({
              ...b,
              bannerType: b.bannerType || b.destinationType || 'home',
              type: b.bannerType || b.destinationType || 'home',
              name: b.name || b.title || 'Home Banner',
              ctaText: b.ctaText || b.ctaLabel || 'Shop Now →'
            }));
          }
        } catch (_) {}
      }
    }

    // 3. Fetch from home_banners table if present
    if (banners === null) {
      try {
        const { data: tableData } = await client
          .from('home_banners')
          .select('*')
          .order('display_order', { ascending: true });

        if (tableData && tableData.length > 0) {
          banners = tableData.map(b => ({
            id: b.id,
            name: b.title || b.name || 'Banner',
            title: b.title || '',
            subtitle: b.subtitle || '',
            bannerType: b.banner_type || b.destination_type || 'home',
            type: b.banner_type || b.destination_type || 'home',
            imageUrl: b.image_url || '',
            mobileImageUrl: b.mobile_image_url || b.image_url || '',
            categoryId: b.category_id || '',
            categoryName: b.category_name || '',
            subcategoryId: b.subcategory_id || '',
            subcategoryName: b.subcategory_name || '',
            selectionId: b.destination_id || '',
            selectionName: b.destination_id || '',
            ctaText: b.cta_label || b.ctaText || 'Shop Now →',
            ctaLabel: b.cta_label || b.ctaText || 'Shop Now →',
            displayOrder: Number(b.display_order || 1),
            isActive: b.is_active !== false,
            createdAt: b.created_at || new Date().toISOString(),
            updatedAt: b.updated_at || new Date().toISOString()
          }));
        }
      } catch (_) {}
    }

    // 4. If row was never created in DB, initialize with default banners
    if (banners === null) {
      banners = [...DEFAULT_CENTRAL_BANNERS];
      saveCentralBannersMaster(banners).catch(e => console.warn('Banner seed notice:', e));
    }

    // Keep ONLY home banners across the entire system
    const homeBannersOnly = (banners || [])
      .filter(b => !b.bannerType || b.bannerType === 'home' || b.type === 'home')
      .map(b => ({
        ...b,
        bannerType: 'home',
        type: 'home'
      }));

    // Update local cache
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(homeBannersOnly));
        localStorage.setItem('salbeau_home_banners', JSON.stringify(homeBannersOnly));
      } catch (_) {}
    }

    return homeBannersOnly.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
  } catch (err) {
    console.error('Error in fetchAllCentralBanners:', err);
    return [...DEFAULT_CENTRAL_BANNERS];
  }
}

/**
 * Permanently save central banners to Supabase with automatic backup snapshot
 */
export async function saveCentralBannersMaster(bannersList) {
  const client = supabaseAdmin || supabase;
  const rawList = Array.isArray(bannersList) ? bannersList : [];
  const cleanList = rawList
    .filter(b => !b.bannerType || b.bannerType === 'home' || b.type === 'home')
    .map(b => ({
      ...b,
      bannerType: 'home',
      type: 'home'
    }));

  // 1. Create a safety backup in Supabase before overwriting
  try {
    const { data: currentMaster } = await client
      .from('brands')
      .select('logo')
      .eq('id', DB_CONFIG_ID)
      .maybeSingle();

    if (currentMaster?.logo) {
      await client.from('brands').upsert({
        id: DB_BACKUP_ID,
        name: 'Banners Backup Snapshot',
        category: 'SystemConfig',
        enabled: true,
        logo: currentMaster.logo,
        updated_at: new Date().toISOString()
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('salbeau_banners_backup', currentMaster.logo);
      }
    }
  } catch (backupErr) {
    console.warn('Backup snapshot notice:', backupErr);
  }

  // Update local storage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanList));
      const homeOnly = cleanList.filter(b => b.bannerType === 'home' || !b.bannerType);
      localStorage.setItem('salbeau_home_banners', JSON.stringify(homeOnly));
    } catch (_) {}
  }

  // 2. Persist master list to brands row app_central_banners_master
  const masterPayload = {
    id: DB_CONFIG_ID,
    name: 'Central Banners Master Configuration',
    category: 'SystemConfig',
    enabled: true,
    logo: JSON.stringify(cleanList),
    updated_at: new Date().toISOString()
  };
  try {
    await client.from('brands').upsert(masterPayload);
  } catch (mErr) {
    console.warn('Master banners config upsert warning:', mErr);
  }

  // 3. Synchronize app_home_banners row for mobile app
  const homeOnly = cleanList
    .filter(b => b.bannerType === 'home' || !b.bannerType)
    .map(b => ({
      ...b,
      ctaLabel: b.ctaText || b.ctaLabel || 'Shop Now →',
      destinationType: b.bannerType === 'home' ? (b.destinationType || 'CATEGORY') : (b.destinationType || 'CATEGORY'),
      destinationId: b.destinationId || b.selectionId || b.categoryId || 'Makeup'
    }));

  const homePayload = {
    id: DB_HOME_CONFIG_ID,
    name: 'Home Banners Configuration',
    category: 'SystemConfig',
    enabled: true,
    logo: JSON.stringify(homeOnly),
    updated_at: new Date().toISOString()
  };
  try {
    await client.from('brands').upsert(homePayload);
  } catch (hErr) {
    console.warn('Home banners config upsert warning:', hErr);
  }

  // 4. Upsert to home_banners table if present
  try {
    const tableRows = cleanList.map(b => ({
      id: b.id,
      title: b.title || b.name || '',
      subtitle: b.subtitle || '',
      badge: b.badge || b.theme || '',
      image_url: b.imageUrl || '',
      mobile_image_url: b.mobileImageUrl || b.imageUrl || '',
      cta_label: b.ctaText || b.ctaLabel || 'Shop Now →',
      destination_type: b.bannerType || 'home',
      destination_id: b.selectionId || b.subcategoryId || b.categoryId || '',
      display_order: Number(b.displayOrder || 1),
      is_active: b.isActive !== false,
      updated_at: new Date().toISOString()
    }));

    if (tableRows.length > 0) {
      await client.from('home_banners').upsert(tableRows);
    }
  } catch (tErr) {
    console.warn('home_banners table upsert warning:', tErr);
  }

  return cleanList;
}

/**
 * Permanent Delete Banner: Removes from Supabase tables, config, and deletes storage file
 */
export async function deleteBannerPermanent(bannerId, imageUrl = '', existingBanners = null) {
  const client = supabaseAdmin || supabase;

  // 1. Delete from home_banners table
  try {
    await client.from('home_banners').delete().eq('id', bannerId);
  } catch (_) {}

  // 2. Delete storage file if hosted in Supabase
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co/storage/v1/object/public/')) {
    try {
      const parts = imageUrl.split('supabase.co/storage/v1/object/public/')[1];
      if (parts) {
        const bucket = parts.split('/')[0];
        const filePath = parts.substring(bucket.length + 1).split('?')[0];
        if (bucket && filePath) {
          await client.storage.from(bucket).remove([filePath]);
        }
      }
    } catch (storageErr) {
      console.warn('Notice: Storage file cleanup warning:', storageErr);
    }
  }

  // 3. Mutate master list directly from provided active list or DB
  let currentList = existingBanners;
  if (!Array.isArray(currentList)) {
    currentList = await fetchAllCentralBanners();
  }

  const updatedList = currentList.filter(b => b.id !== bannerId);
  await saveCentralBannersMaster(updatedList);

  return updatedList;
}
