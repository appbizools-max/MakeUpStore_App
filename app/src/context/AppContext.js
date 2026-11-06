import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../config/supabase';
import { storage } from '../utils/storage';
import { getSafeImageUri, DEFAULT_CATEGORY_FALLBACKS } from '../utils/imageUtils';
import { setLiveCategoryHierarchy } from '../config/categoriesHierarchy';
import {
  normalizeQuantityTiers,
  getProductTiersForRole,
  getApplicableTierForRole,
  calculateDynamicPrice,
  DEFAULT_PRICING_RULES
} from '../utils/quantityTiersUtils';
import { generateSalbeauOrderId } from '../utils/orderIdUtils';
import { getCartKey } from '../utils/cartKeyUtils';
import { flattenToSellableNykaaCatalog } from '../utils/productSearchEngine';
import {
  isB2BRole,
  isUserB2BVerified,
  getEffectivePricingRole,
  fetchUserVerificationRecord,
  submitB2BVerification as apiSubmitB2BVerification
} from '../utils/b2bVerificationService';
import {
  requestFCMToken,
  setupFCMForegroundListener,
  displayLocalNotification,
  getInitialNotification,
  setupNotificationTapListener,
  clearFCMToken
} from '../utils/fcmService';

const AppContext = createContext();

export const parseShades = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const mapProductFromDb = (p) => {
  if (!p) return null;
  const rawShades = parseShades(p.shades).filter(s => {
    if (!s || typeof s !== 'object') return false;
    const n = String(s.color_name || s.name || s.title || s.shade || '').trim().toLowerCase();
    return (
      n &&
      n !== 'default' &&
      n !== 'default shade' &&
      n !== 'standard' &&
      n !== 'standard formulation' &&
      n !== 'n/a' &&
      n !== 'non-shade' &&
      n !== 'n/a (non-shade)' &&
      n !== 'default variant'
    );
  });
  const normalizedTiers = normalizeQuantityTiers(p.quantity_tiers || p.quantityTiers);
  const mrp = Number(p.mrp || 0);
  const addInfo = (p.additional_info && typeof p.additional_info === 'object') ? p.additional_info : ((p.additionalInfo && typeof p.additionalInfo === 'object') ? p.additionalInfo : {});
  const genPrice = Number(p.general_price !== undefined && p.general_price !== null ? p.general_price : (addInfo.general_price ?? p.generalPrice ?? mrp));
  const salonPr = Number(p.salon_price !== undefined && p.salon_price !== null ? p.salon_price : (p.salonPrice ?? mrp));
  const artistPr = Number(p.artist_price !== undefined && p.artist_price !== null ? p.artist_price : (p.artistPrice ?? mrp));
  const beauticianPr = Number(p.beautician_price !== undefined && p.beautician_price !== null ? p.beautician_price : (p.beauticianPrice ?? mrp));
  const isEnabled = (p.enabled !== undefined && p.enabled !== null)
    ? (p.enabled !== false && p.enabled !== 'false' && p.enabled !== 0)
    : (addInfo.enabled !== false && addInfo.enabled !== 'false' && addInfo.enabled !== 0);
  const publishStatus = (p.status || addInfo.status || (isEnabled ? 'published' : 'draft')).toLowerCase();

  const parentImg = getSafeImageUri(p.image, '');
  const resolvedShades = rawShades.map((s, sIdx) => {
    if (!s) return s;
    const sImg = s.image || (Array.isArray(s.images) && s.images[0] ? s.images[0] : null);
    const finalImg = sImg || parentImg || '';
    return {
      ...s,
      sku: s.sku || (p.sku ? `${p.sku}-V${String(sIdx + 1).padStart(2, '0')}` : s.sku),
      image: finalImg,
      images: Array.isArray(s.images) && s.images.length > 0 ? s.images : (finalImg ? [finalImg] : [])
    };
  });

  return {
    id: p.id,
    name: p.name || '',
    brandId: p.brand_id || p.brandId || '',
    brandName: p.brand_name || p.brandName || '',
    category: p.category || '',
    subcategory: p.subcategory || p.sub_category || addInfo.subcategory || '',
    variantType: p.variant_type || p.variantType || p.product_type || addInfo.variant_type || addInfo.variantType || '',
    description: p.description || p.how_to_use || addInfo.description || '',
    size: addInfo.size || p.specifications?.size || p.size || '',
    netQty: addInfo.net_qty || p.specifications?.net_quantity || p.netQty || '',
    gstPercent: addInfo.gst_percent ?? p.specifications?.gst_percent ?? p.gst ?? 18,
    attributes: addInfo.attributes || p.specifications || {},
    barcode: p.barcode || '',
    mrp,
    generalPrice: genPrice,
    salonPrice: salonPr,
    artistPrice: artistPr,
    beauticianPrice: beauticianPr,
    image: parentImg,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(addInfo.images) && addInfo.images.length > 0 ? addInfo.images : (parentImg ? [parentImg] : [])),
    shades: resolvedShades,
    quantityTiers: normalizedTiers,
    additionalInfo: addInfo,
    specifications: p.specifications || {},
    keyPoints: Array.isArray(p.key_points) ? p.key_points : (Array.isArray(p.keyPoints) ? p.keyPoints : []),
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    ingredients: p.ingredients || {},
    howToUse: p.how_to_use || p.howToUse || '',
    searchKeywords: Array.isArray(p.search_keywords) ? p.search_keywords : (Array.isArray(p.searchKeywords) ? p.searchKeywords : []),
    searchAliases: Array.isArray(p.search_aliases) ? p.search_aliases : (Array.isArray(p.searchAliases) ? p.searchAliases : []),
    productType: p.product_type || p.productType || '',
    productFamily: p.product_family || p.productFamily || '',
    enabled: isEnabled,
    status: publishStatus,
    rating: Number(p.rating || addInfo.rating || 0),
    reviewCount: Number(p.review_count || p.reviewCount || addInfo.reviewCount || addInfo.review_count || 0),
    isTrending: Boolean(p.is_trending ?? p.isTrending ?? addInfo.isTrending ?? addInfo.is_trending ?? false),
    trendingPriority: Number(p.trending_priority ?? p.trendingPriority ?? addInfo.trendingPriority ?? addInfo.trending_priority ?? 0),
    isFeatured: Boolean(p.is_featured ?? p.isFeatured ?? addInfo.isFeatured ?? addInfo.is_featured ?? false),
    featuredPriority: Number(p.featured_priority ?? p.featuredPriority ?? addInfo.featuredPriority ?? addInfo.featured_priority ?? 0),
    isBestSeller: Boolean(p.is_bestseller ?? p.isBestSeller ?? addInfo.isBestSeller ?? addInfo.is_bestseller ?? false),
    bestSellerPriority: Number(p.bestseller_priority ?? p.bestSellerPriority ?? addInfo.bestSellerPriority ?? addInfo.bestseller_priority ?? 0),
    isRecentProduct: Boolean(p.is_recent ?? p.isRecentProduct ?? addInfo.isRecentProduct ?? addInfo.is_recent ?? addInfo.showInRecent ?? false),
    recentPriority: Number(p.recent_priority ?? p.recentPriority ?? addInfo.recentPriority ?? addInfo.recent_priority ?? 0),
    isTopRecommendation: Boolean(p.is_top_recommendation ?? p.isTopRecommendation ?? addInfo.isTopRecommendation ?? addInfo.is_top_recommendation ?? false),
    recommendationPriority: Number(p.recommendation_priority ?? p.recommendationPriority ?? addInfo.recommendationPriority ?? addInfo.recommendation_priority ?? 0),
    publishedAt: p.published_at || p.publishedAt || addInfo.publishedAt || addInfo.published_at || p.created_at || null,
    showInNewArrivals: Boolean(p.show_in_new_arrivals ?? p.showInNewArrivals ?? addInfo.showInNewArrivals ?? true),
    sort_order: Number(p.sort_order ?? p.sortOrder ?? p.display_order ?? addInfo.sort_order ?? addInfo.priority ?? 99999),
    display_order: Number(p.sort_order ?? p.sortOrder ?? p.display_order ?? addInfo.sort_order ?? addInfo.priority ?? 99999),
    priority: Number(p.sort_order ?? p.sortOrder ?? p.display_order ?? addInfo.sort_order ?? addInfo.priority ?? 99999),
    quantityDiscountEnabled: (() => {
      try {
        return Boolean(addInfo.quantityDiscountEnabled ?? p.quantity_discount_enabled ?? true);
      } catch { return true; }
    })(),
    created_at: p.created_at || null,
    updated_at: p.updated_at || null
  };
};

const mapCategoryFromDb = (c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon || '',
  image: getSafeImageUri(c.image, DEFAULT_CATEGORY_FALLBACKS.default),
  color: c.color || '#FCE4EC',
  sort_order: Number(c.sort_order || c.sortOrder || 0),
  enabled: c.enabled !== false && c.enabled !== 'false' && c.enabled !== 0,
  created_at: c.created_at || c.createdAt || null
});

export const computeOverallOrderStatus = (items, currentOrderStatus = 'placed') => {
  const normCurrent = (currentOrderStatus || '').toLowerCase().trim();
  // Preserve explicit order status set by Admin or database
  if (normCurrent && normCurrent !== 'placed') {
    return normCurrent;
  }
  if (!items || items.length === 0) return normCurrent || 'placed';

  const statuses = items.map(i => (i.status || '').toLowerCase() || 'placed');

  const allDelivered = statuses.every(s => s === 'delivered' || s === 'completed');
  if (allDelivered) return 'delivered';

  const allRejected = statuses.every(s => s === 'rejected');
  if (allRejected) return 'rejected';

  const allCancelled = statuses.every(s => s === 'cancelled');
  if (allCancelled) return 'cancelled';

  const deliveredCount = statuses.filter(s => s === 'delivered' || s === 'completed').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const cancelledCount = statuses.filter(s => s === 'cancelled').length;
  const processingCount = statuses.filter(s =>
    ['processing', 'placed', 'pending_fulfillment', 'confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery'].includes(s)
  ).length;

  if (deliveredCount > 0) {
    if (processingCount > 0) return 'partially_delivered';
    if (rejectedCount > 0 && cancelledCount === 0) return 'partially_delivered_rejected';
    if (cancelledCount > 0 && rejectedCount === 0) return 'partially_delivered_cancelled';
    return 'partially_delivered';
  }

  // Preserve explicit standard lifecycle stages set by Admin
  if (['confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery', 'placed', 'delivered', 'completed'].includes(normCurrent)) {
    return normCurrent;
  }

  if (processingCount > 0) {
    return 'processing';
  }

  if (processingCount === 0) {
    if (rejectedCount >= cancelledCount) return 'rejected';
    return 'cancelled';
  }

  return normCurrent || 'placed';
};

const mapOrderFromDb = (o) => {
  if (!o) return null;
  let rawItems = o.items || [];
  if (typeof rawItems === 'string') {
    try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
  }
  if (!Array.isArray(rawItems)) rawItems = [];

  const dbStatus = (o.status || 'placed').toLowerCase().trim();

  const itemsWithStatus = rawItems.map(item => {
    if (!item) return { status: 'placed', quantity: 1 };
    let itemSt = item.status ? item.status.toLowerCase() : '';
    if (!itemSt || itemSt === 'placed') {
      itemSt = dbStatus.includes('partially') ? 'processing' : dbStatus;
    }
    return {
      ...item,
      status: itemSt,
      rejectionReason: item.rejectionReason || o.rejection_reason || ''
    };
  });

  const computedStatus = (dbStatus && dbStatus !== 'placed')
    ? dbStatus
    : computeOverallOrderStatus(itemsWithStatus, dbStatus);

  // Safe shipments parser
  let shipmentsMeta = {};
  if (o.shipments) {
    if (typeof o.shipments === 'object' && !Array.isArray(o.shipments)) {
      shipmentsMeta = o.shipments;
    } else if (Array.isArray(o.shipments) && o.shipments.length > 0 && typeof o.shipments[0] === 'object') {
      shipmentsMeta = o.shipments[0];
    } else if (typeof o.shipments === 'string') {
      try { shipmentsMeta = JSON.parse(o.shipments); } catch {}
    }
  }

  // Safe payment status and payment method mapping
  const rawPayStatus = (o.payment_status || shipmentsMeta.paymentStatus || o.internal_status || '').toLowerCase().trim();
  const paymentStatus = ['paid', 'completed'].includes(rawPayStatus) ? 'paid' : (rawPayStatus === 'partially_paid' ? 'partially_paid' : 'pending');
  const paymentMethod = (o.payment_method || shipmentsMeta.paymentMethod || 'cash').toLowerCase().trim();

  // Parse status_history safely
  let parsedHistory = [];
  if (o.status_history) {
    if (Array.isArray(o.status_history)) parsedHistory = o.status_history;
    else if (typeof o.status_history === 'string') {
      try { parsedHistory = JSON.parse(o.status_history); } catch { parsedHistory = []; }
    }
  }

  return {
    id: o.id,
    userName: o.user_name || o.userName,
    phone: o.phone,
    avatar: o.avatar,
    itemDescription: o.item_description || o.itemDescription,
    userRole: o.user_role || o.userRole,
    branch: o.branch,
    deliveryType: o.delivery_type || o.deliveryType,
    deliveryAddress: o.delivery_address || o.deliveryAddress,
    deliveryInstructions: o.delivery_instructions || o.deliveryInstructions || '',
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    status: computedStatus,
    paymentStatus,
    paymentMethod,
    assignedEmployeeId: o.assigned_employee_id || shipmentsMeta.assignedEmployeeId || null,
    assignedEmployeeName: o.assigned_employee_name || shipmentsMeta.assignedEmployeeName || null,
    statusHistory: parsedHistory,
    rejectionReason: o.rejection_reason || o.rejectionReason || '',
    placedAt: o.placed_at || o.placedAt || o.date,
    date: o.date || o.placed_at,
    items: itemsWithStatus,
    shipments: shipmentsMeta
  };
};

const DEFAULT_HOME_SECTIONS = {
  branchBar: true,
  pricingRoleBanner: true,
  heroPromoBanner: true,
  shopCategories: true,
  featuredBrands: true,
  bestSellers: true,
};

export const DEFAULT_RECOMMENDATION_CONFIG = {
  enabled: true,
  maxAddOns: 8,
  maxRelevant: 8,
  minRelevance: 'auto',
  frequentlyBoughtTogether: true,
  popularProductsFallback: true,
};

export const AUTH_SESSION_KEY = 'salbeau_auth_session';

const getCachedData = (key, fallback) => {
  try {
    const memorySaved = storage.getSync(key);
    if (memorySaved) {
      const parsed = JSON.parse(memorySaved);
      if (parsed !== undefined && parsed !== null) return parsed;
    }
  } catch (e) {}
  return fallback;
};

const setCachedData = (key, val) => {
  try {
    storage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

export const EMPTY_USER_PROFILE = {
  id: null,
  name: '',
  phone: '',
  email: '',
  pincode: '',
  city: '',
  state: '',
  role: 'general',
  businessName: '',
  gstNo: '',
  certificationId: '',
  address: '',
  isProfileComplete: false,
  verificationStatus: 'not_submitted',
  b2bVerified: false,
  verificationSubmittedAt: null,
  verificationApprovedAt: null,
  verificationRejectedAt: null,
  verifiedBy: null,
  rejectionReason: null
};

const getInitialAuthSession = () => {
  try {
    const memorySaved = storage.getSync(AUTH_SESSION_KEY);
    if (memorySaved) {
      const parsed = JSON.parse(memorySaved);
      if (parsed && parsed.phone && parsed.isProfileComplete) {
        return parsed;
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phone && parsed.isProfileComplete) {
          return parsed;
        }
      }
    }
  } catch (e) {}
  return null;
};

export const DEFAULT_HOME_BANNERS = [
  {
    id: 'banner_1',
    badge: 'Up to 30% OFF',
    discountBadge: 'Up to 30% OFF',
    title: 'Healthy Hair Starts Here',
    subtitle: 'Nourish • Repair • Shine',
    ctaLabel: 'Shop Hair Care →',
    destinationType: 'CATEGORY',
    destinationId: 'Hair Care',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    displayOrder: 1,
    isActive: true,
    startDate: null,
    endDate: null
  },
  {
    id: 'banner_2',
    badge: 'SKINCARE RITUALS',
    title: 'Healthy Skin, Happier You',
    subtitle: 'Salon-grade skincare for everyday radiant results',
    ctaLabel: 'Shop Skincare →',
    destinationType: 'CATEGORY',
    destinationId: 'Skin Care',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_2.jpg',
    displayOrder: 2,
    isActive: true,
    startDate: null,
    endDate: null
  },
  {
    id: 'banner_3',
    badge: 'MAKEUP FOR EVERY YOU',
    title: 'Bold Looks, Brighter Days',
    subtitle: 'Premium makeup for salon-perfect finish',
    ctaLabel: 'Explore Makeup →',
    destinationType: 'CATEGORY',
    destinationId: 'Makeup',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_3.jpg',
    displayOrder: 3,
    isActive: true,
    startDate: null,
    endDate: null
  },
  {
    id: 'banner_4',
    badge: 'HAIR CARE & SPA',
    title: 'Stronger Hair, Healthier You',
    subtitle: 'Nourishment, repair & salon care for every hair type',
    ctaLabel: 'Shop Hair Care →',
    destinationType: 'CATEGORY',
    destinationId: 'Hair Care',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_4.jpg',
    displayOrder: 4,
    isActive: true,
    startDate: null,
    endDate: null
  },
  {
    id: 'banner_5',
    badge: 'EXCLUSIVE PRO TIER',
    title: 'Autumn Glamour & Glass Glow',
    subtitle: 'Up to 35% wholesale pricing for verified salon pros & artists',
    ctaLabel: 'Explore Pro Rates →',
    destinationType: 'CATEGORY',
    destinationId: 'Face Cream & Serums',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_5.jpg',
    displayOrder: 5,
    isActive: true,
    startDate: null,
    endDate: null
  }
];

export const AppProvider = ({ children }) => {
  const initialSession = useMemo(() => getInitialAuthSession(), []);

  const [currentScreen, _setCurrentScreen] = useState('splash');
  const [previousScreen, setPreviousScreen] = useState('home');

  const setCurrentScreen = useCallback((newScr) => {
    _setCurrentScreen(prev => {
      if (prev !== newScr && prev !== 'splash') {
        setPreviousScreen(prev);
      }
      return newScr;
    });
  }, []);

  const [userRole, setUserRole] = useState(() => {
    return initialSession?.role || initialSession?.profile?.role || 'general';
  });
  const [selectedBranch, setSelectedBranch] = useState('MG Road Branch');
  const [homeBanners, setHomeBanners] = useState(() => {
    try {
      const saved = storage.getSync('salbeau_home_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return DEFAULT_HOME_BANNERS;
  });

  const [allBanners, setAllBanners] = useState(() => {
    try {
      const saved = storage.getSync('salbeau_central_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const getCategoryBanner = useCallback((catIdOrName) => {
    if (!catIdOrName || !Array.isArray(allBanners)) return null;
    const norm = String(catIdOrName).trim().toLowerCase();
    return allBanners.find(b =>
      b.isActive !== false &&
      b.bannerType === 'category' &&
      (
        (b.categoryId && String(b.categoryId).trim().toLowerCase() === norm) ||
        (b.categoryName && String(b.categoryName).trim().toLowerCase() === norm) ||
        (b.destinationId && String(b.destinationId).trim().toLowerCase() === norm)
      )
    ) || null;
  }, [allBanners]);

  const getSubcategoryBanner = useCallback((subIdOrName) => {
    if (!subIdOrName || !Array.isArray(allBanners)) return null;
    const norm = String(subIdOrName).trim().toLowerCase();
    return allBanners.find(b =>
      b.isActive !== false &&
      b.bannerType === 'subcategory' &&
      (
        (b.subcategoryId && String(b.subcategoryId).trim().toLowerCase() === norm) ||
        (b.subcategoryName && String(b.subcategoryName).trim().toLowerCase() === norm) ||
        (b.destinationId && String(b.destinationId).trim().toLowerCase() === norm)
      )
    ) || null;
  }, [allBanners]);

  const activeBanners = useMemo(() => {
    return (homeBanners || [])
      .filter(b => b.isActive !== false)
      .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
  }, [homeBanners]);
  const [homeSectionVisibility, setHomeSectionVisibility] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('salbeau_home_section_visibility');
        if (saved) return { ...DEFAULT_HOME_SECTIONS, ...JSON.parse(saved) };
      }
    } catch (e) { }
    return DEFAULT_HOME_SECTIONS;
  });
  const [recommendationConfig, setRecommendationConfig] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('salbeau_recommendation_config');
        if (saved) return { ...DEFAULT_RECOMMENDATION_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) { }
    return DEFAULT_RECOMMENDATION_CONFIG;
  });
  const [userProfile, setUserProfile] = useState(() => {
    return initialSession?.profile || EMPTY_USER_PROFILE;
  });

  const [userVerificationRecord, setUserVerificationRecord] = useState(null);
  const [isVerificationSubmitting, setIsVerificationSubmitting] = useState(false);

  const [addresses, setAddresses] = useState(() => {
    return initialSession?.addresses || [];
  });

  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Restore authenticated session from persistent storage on startup
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        // Automatic global user data & cache reset for mobile app
        const cacheVer = await storage.getItem('salbeau_mobile_cache_v12');
        if (cacheVer !== 'true') {
          await Promise.all([
            storage.removeItem(AUTH_SESSION_KEY),
            storage.removeItem('salbeau_user_profile'),
            storage.removeItem('salbeau_cache_orders'),
            storage.removeItem('salbeau_cache_cart'),
            storage.removeItem('salbeau_cart'),
            storage.removeItem('salbeau_favorites'),
            storage.removeItem('salbeau_addresses'),
            storage.removeItem('salbeau_user_role'),
            storage.removeItem('salbeau_b2b_verification_record'),
            storage.removeItem('salbeau_search_history'),
            storage.removeItem('salbeau_recent_searches'),
            storage.removeItem('salbeau_cache_products'),
            storage.removeItem('salbeau_cache_categories'),
            storage.removeItem('salbeau_cache_brands'),
            storage.removeItem('salbeau_cache_subcategories'),
            storage.removeItem('salbeau_recently_viewed_ids'),
            storage.setItem('salbeau_mobile_cache_v12', 'true')
          ]).catch(() => {});
          setUserProfile(EMPTY_USER_PROFILE);
          setUserRole('general');
          setOrders([]);
          setCart([]);
          setFavorites([]);
          setAddresses([]);
        }

        const [savedAuth, savedProds, savedCats, savedBrands, savedSubs] = await Promise.all([
          storage.getItem(AUTH_SESSION_KEY),
          storage.getItem('salbeau_cache_products'),
          storage.getItem('salbeau_cache_categories'),
          storage.getItem('salbeau_cache_brands'),
          storage.getItem('salbeau_cache_subcategories'),
        ]);

        if (isMounted) {
          if (savedProds) {
            try {
              const parsedProds = JSON.parse(savedProds);
              if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                setProducts(prev => (prev.length === 0 ? parsedProds : prev));
                setIsCatalogLoading(false);
              }
            } catch (_) {}
          }
          if (savedCats) {
            try {
              const parsedCats = JSON.parse(savedCats);
              if (Array.isArray(parsedCats) && parsedCats.length > 0) {
                setRawCategories(prev => (prev.length === 0 ? parsedCats : prev));
              }
            } catch (_) {}
          }
          if (savedBrands) {
            try {
              const parsedBrands = JSON.parse(savedBrands);
              if (Array.isArray(parsedBrands) && parsedBrands.length > 0) {
                setBrands(prev => (prev.length === 0 ? parsedBrands : prev));
              }
            } catch (_) {}
          }
          if (savedSubs) {
            try {
              const parsedSubs = JSON.parse(savedSubs);
              if (Array.isArray(parsedSubs) && parsedSubs.length > 0) {
                setSubcategories(prev => (prev.length === 0 ? parsedSubs : prev));
              }
            } catch (_) {}
          }

          if (savedAuth) {
            const parsed = JSON.parse(savedAuth);
            if (parsed && parsed.phone && parsed.isProfileComplete) {
              if (parsed.profile) setUserProfile(parsed.profile);
              if (parsed.role) setUserRole(parsed.role);
              if (parsed.addresses && Array.isArray(parsed.addresses)) setAddresses(parsed.addresses);
              // Profile and authentication restored cleanly. SplashScreen's 1.8s branded timer handles navigation to 'home'.
              setIsRestoringSession(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    };
    restoreSession();
    return () => { isMounted = false; };
  }, []);

  // Manage background/foreground transitions: keep authenticated user locked on their screen
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Returned to foreground: ensure authenticated user never drops into onboarding/login/otp
        if (userProfile?.isProfileComplete) {
          setCurrentScreen(prev => (prev === 'onboarding' || prev === 'login' || prev === 'otp') ? 'home' : prev);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userProfile?.isProfileComplete]);

  // Debounced session persist � 800ms prevents write storm on rapid renders
  useEffect(() => {
    if (!userProfile?.isProfileComplete || !userProfile?.phone) return;
    const _pt = setTimeout(() => {
      const cleanDigits = userProfile.phone.replace(/\D/g, '');
      const sessionData = {
        userId: userProfile.id || `u_${cleanDigits}`,
        phone: userProfile.phone,
        role: userRole || userProfile.role || 'general',
        isProfileComplete: true,
        profile: userProfile,
        addresses: addresses || [],
        token: `sess_${Date.now()}_${cleanDigits}`,
        authenticatedAt: new Date().toISOString()
      };
      storage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
      storage.setItem('salbeau_user_profile', JSON.stringify(userProfile));
    }, 800);
    return () => clearTimeout(_pt);
  }, [userProfile, userRole, addresses]);

  const addAddress = (newAddr) => {
    const created = {
      id: 'addr_' + Date.now(),
      label: newAddr.label || 'Home',
      name: newAddr.name || userProfile?.name || '',
      phone: newAddr.phone || userProfile?.phone || '',
      houseNo: newAddr.houseNo || '',
      streetArea: newAddr.streetArea || '',
      landmark: newAddr.landmark || '',
      city: newAddr.city || '',
      state: newAddr.state || '',
      pincode: newAddr.pincode || '',
      text: newAddr.text || '',
      isDefault: addresses.length === 0,
    };
    setAddresses(prev => [...prev, created]);
    setUserProfile(prev => ({ ...prev, address: created.text }));
    return created;
  };

  const updateAddress = (id, updatedFields) => {
    setAddresses(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updatedFields } : a);
      const target = next.find(a => a.id === id);
      if (target && (target.isDefault || next[0]?.id === id)) {
        setUserProfile(up => ({ ...up, address: target.text }));
      }
      return next;
    });
  };

  const deleteAddress = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefaultAddress = (id) => {
    setAddresses(prev => {
      const next = prev.map(a => ({ ...a, isDefault: a.id === id }));
      const target = next.find(a => a.id === id);
      if (target) {
        setUserProfile(up => ({ ...up, address: target.text }));
      }
      return next;
    });
  };

  const userProfileRef = useRef(userProfile);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

  const userRoleRef = useRef(userRole);
  useEffect(() => { userRoleRef.current = userRole; }, [userRole]);
  const [brands, setBrands] = useState(() => getCachedData('salbeau_cache_brands', []));
  const [rawCategories, setRawCategories] = useState(() => getCachedData('salbeau_cache_categories', []));
  const [subcategories, setSubcategories] = useState(() => getCachedData('salbeau_cache_subcategories', []));
  const [leafCategories, setLeafCategories] = useState(() => getCachedData('salbeau_cache_leaf_categories', []));
  const [pricingRules, setPricingRules] = useState(() => getCachedData('salbeau_pricing_rules', DEFAULT_PRICING_RULES));
  const categories = useMemo(() => {
    return (rawCategories || []).filter(c => c.enabled !== false);
  }, [rawCategories]);
  const [products, setProducts] = useState(() => getCachedData('salbeau_cache_products', []));
  const [isCatalogLoading, setIsCatalogLoading] = useState(() => {
    const cachedProds = getCachedData('salbeau_cache_products', []);
    const cachedCats = getCachedData('salbeau_cache_categories', []);
    return !(cachedProds && cachedProds.length > 0 && cachedCats && cachedCats.length > 0);
  });

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Persist cart to storage � survives app restarts and background kills
  useEffect(() => {
    try { setCachedData('salbeau_cache_cart', cart); } catch (_) {}
  }, [cart]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedShade, setSelectedShade] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [cart, setCart] = useState(() => {
    try {
      const saved = getCachedData('salbeau_cache_cart', null);
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (_) {}
    return [];
  });
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState(() => getCachedData('salbeau_cache_orders', []));
  const [consecutiveCancels, setConsecutiveCancels] = useState(0);
  const [showCancelWarningModal, setShowCancelWarningModal] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState(null);
  const [productSalesCounts, setProductSalesCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState(null);
  const [orderStatusNotification, setOrderStatusNotification] = useState(null);

  // Shade Selection Bottom Sheet Global State (Nykaa style)
  const [shadeSheetState, setShadeSheetState] = useState({
    isOpen: false,
    product: null,
    initialShade: null
  });

  const [lastSelectedShades, setLastSelectedShades] = useState({});

  const openShadeSheet = useCallback((product, initialShade = null) => {
    if (!product) return;
    const rememberedShade = initialShade || lastSelectedShades[product.id] || null;
    setShadeSheetState({
      isOpen: true,
      product,
      initialShade: rememberedShade
    });
  }, [lastSelectedShades]);

  const closeShadeSheet = useCallback(() => {
    setShadeSheetState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const rememberSelectedShade = useCallback((productId, shade) => {
    if (!productId || !shade) return;
    setLastSelectedShades(prev => ({
      ...prev,
      [productId]: shade
    }));
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    return (notifications || []).filter(n => !n.is_read).length;
  }, [notifications]);

  // Parallel fetch critical catalog data with deduplication & SWR TTL caching
  const inFlightCatalogFetchRef = useRef(null);

  const fetchCatalog = useCallback(async () => {
    if (inFlightCatalogFetchRef.current) {
      return inFlightCatalogFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        // Ultra-low latency banner sync: updates banners in milliseconds without waiting for products or orders
        supabase
          .from('brands')
          .select('id, logo')
          .eq('id', 'app_home_banners')
          .maybeSingle()
          .then(({ data }) => {
            if (data?.logo) {
              try {
                const parsed = JSON.parse(data.logo);
                if (Array.isArray(parsed)) {
                  setHomeBanners(parsed);
                  setCachedData('salbeau_home_banners', parsed);
                }
              } catch (_) {}
            }
          })
          .catch(() => {});

        // Check cached sales counts with a 15-minute TTL to prevent high-frequency orders table thrashing under 10,000 CCU
        let cachedSales = null;
        try {
          const raw = storage.getSync('salbeau_sales_counts_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.ts && (Date.now() - parsed.ts < 15 * 60 * 1000) && parsed.data) {
              cachedSales = parsed.data;
            }
          }
        } catch (_) {}

        const fetchOrdersPromise = cachedSales
          ? Promise.resolve({ data: null, isCached: true })
          : supabase.from('orders').select('id, items, status').order('date', { ascending: false }).limit(200);

        const [brandsRes, productsRes, categoriesRes, subcategoriesRes, storeOrdersRes] = await Promise.all([
          supabase.from('brands').select('*'),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('sort_order', { ascending: true }),
          supabase.from('subcategories').select('*').order('sort_order', { ascending: true }),
          fetchOrdersPromise
        ]);

        if (cachedSales) {
          setProductSalesCounts(cachedSales);
        } else if (storeOrdersRes && storeOrdersRes.data) {
          const salesMap = {};
          for (const o of storeOrdersRes.data) {
            const st = (o.status || '').toLowerCase();
            if (['delivered', 'completed', 'placed', 'processing', 'confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery'].includes(st)) {
              for (const item of (o.items || [])) {
                const pid = item.product?.id || item.productId || item.id;
                if (pid) {
                  salesMap[pid] = (salesMap[pid] || 0) + (Number(item.quantity) || 1);
                }
              }
            }
          }
          setProductSalesCounts(salesMap);
          try {
            storage.setItem('salbeau_sales_counts_cache', JSON.stringify({ ts: Date.now(), data: salesMap }));
          } catch (_) {}
        }

      let hierarchyCategories = [];
      let parsedHier = null;

      if (brandsRes.data) {
        const brandsData = brandsRes.data;

        // Pricing Rules (global role discounts & quantity tiers)
        const pricingRow = brandsData.find(b => b.id === 'app_pricing_discount_config');
        if (pricingRow && pricingRow.logo) {
          try {
            const parsedPricing = JSON.parse(pricingRow.logo);
            if (parsedPricing && typeof parsedPricing === 'object') {
              setPricingRules(parsedPricing);
              setCachedData('salbeau_pricing_rules', parsedPricing);
            }
          } catch (e) {}
        }

        const visibilityRow = brandsData.find(b => b.id === 'app_home_section_visibility');
        if (visibilityRow && visibilityRow.logo) {
          try {
            const parsedVisibility = JSON.parse(visibilityRow.logo);
            if (parsedVisibility && typeof parsedVisibility === 'object') {
              setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
              setCachedData('salbeau_home_section_visibility', parsedVisibility);
            }
          } catch (e) { }
        }

        const recRow = brandsData.find(b => b.id === 'app_recommendation_config');
        if (recRow && recRow.logo) {
          try {
            const parsedRec = JSON.parse(recRow.logo);
            if (parsedRec && typeof parsedRec === 'object') {
              setRecommendationConfig(prev => ({ ...prev, ...parsedRec }));
              setCachedData('salbeau_recommendation_config', parsedRec);
            }
          } catch (e) { }
        }

        const centralRow = brandsData.find(b => b.id === 'app_central_banners_master');
        if (centralRow && centralRow.logo) {
          try {
            const parsedCentral = JSON.parse(centralRow.logo);
            if (Array.isArray(parsedCentral)) {
              setAllBanners(parsedCentral);
              setCachedData('salbeau_central_banners', parsedCentral);
              const homeFromCentral = parsedCentral.filter(b => b.bannerType === 'home' || !b.bannerType);
              if (homeFromCentral.length > 0) {
                setHomeBanners(homeFromCentral);
                setCachedData('salbeau_home_banners', homeFromCentral);
              }
            }
          } catch (e) { }
        }

        const bannersRow = brandsData.find(b => b.id === 'app_home_banners');
        if (bannersRow && bannersRow.logo) {
          try {
            const parsedBanners = JSON.parse(bannersRow.logo);
            if (Array.isArray(parsedBanners)) {
              setHomeBanners(parsedBanners);
              setCachedData('salbeau_home_banners', parsedBanners);
            }
          } catch (e) { }
        }

        const mappedBrands = brandsData
          .filter(b => !b.id.startsWith('app_') && !b.id.startsWith('salbeau_') && b.category !== 'SystemConfig' && b.category !== 'System Config')
          .map(b => ({
            id: b.id,
            name: b.name,
            category: b.category || '',
            categories: b.category ? [b.category] : [],
            enabled: b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0 && b.status !== 'hidden' && b.status !== 'disabled',
            logo: b.logo,
            sort_order: Number(b.sort_order ?? b.sortOrder ?? 99999)
          }))
          .sort((a, b) => ((Number(a.sort_order) || 99999) - (Number(b.sort_order) || 99999)) || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }));

        setBrands(mappedBrands);
        setCachedData('salbeau_cache_brands', mappedBrands);

        // Live Category & Subcategory Master Hierarchy Sync
        const hierRow = brandsData.find(b => b.id === 'salbeau_category_subcategory_hierarchy');
        if (hierRow && hierRow.logo) {
          try {
            parsedHier = JSON.parse(hierRow.logo);
            if (parsedHier) {
              setLiveCategoryHierarchy(parsedHier);
              if (Array.isArray(parsedHier.categories)) {
                hierarchyCategories = parsedHier.categories.map(mapCategoryFromDb);
              }
              if (Array.isArray(parsedHier.subcategories)) {
                setSubcategories(parsedHier.subcategories);
                setCachedData('salbeau_cache_subcategories', parsedHier.subcategories);
              }
              if (Array.isArray(parsedHier.leafCategories)) {
                setLeafCategories(parsedHier.leafCategories);
                setCachedData('salbeau_cache_leaf_categories', parsedHier.leafCategories);
              }
            }
          } catch (e) {}
        }

        // Merge subcategories from subcategories table if present
        if (subcategoriesRes && subcategoriesRes.data && subcategoriesRes.data.length > 0) {
          const dbSubs = subcategoriesRes.data.map(s => ({
            id: s.id,
            categoryId: s.category_id || s.categoryId,
            name: s.name,
            image: s.image,
            tagline: s.tagline || '',
            sort_order: Number(s.sort_order || 1),
            enabled: s.enabled !== false && s.enabled !== 'false' && s.enabled !== 0,
            leafCategories: []
          }));

          const hierSubs = (parsedHier && Array.isArray(parsedHier.subcategories)) ? parsedHier.subcategories : [];
          const hierLeaves = (parsedHier && Array.isArray(parsedHier.leafCategories)) ? parsedHier.leafCategories : [];
          const mergedSubs = dbSubs.map(ds => {
            const hSub = hierSubs.find(hs => hs.id === ds.id || (hs.name && ds.name && hs.name.toLowerCase() === ds.name.toLowerCase()));
            let leaves = (hSub && Array.isArray(hSub.leafCategories) && hSub.leafCategories.length > 0) ? hSub.leafCategories : [];
            if (leaves.length === 0 && hierLeaves.length > 0) {
              const dsId = (ds.id || '').toLowerCase();
              const dsName = (ds.name || '').toLowerCase();
              leaves = hierLeaves.filter(l => {
                const lSubId = (l.subcategoryId || l.subcategory_id || '').toLowerCase();
                const lSubName = (l.subcategoryName || l.subcategory_name || '').toLowerCase();
                return (dsId && lSubId === dsId) || (dsName && (lSubName === dsName || lSubId === dsName));
              });
            }
            return {
              ...ds,
              image: ds.image || hSub?.image || '',
              leafCategories: leaves
            };
          });
          mergedSubs.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setSubcategories(mergedSubs);
          setCachedData('salbeau_cache_subcategories', mergedSubs);
        }

        const catConfigRow = brandsData.find(b => b.id === 'app_category_order_config');
        if (catConfigRow && catConfigRow.logo && (!categoriesRes.data || categoriesRes.data.length === 0)) {
          try {
            const parsedCatList = JSON.parse(catConfigRow.logo);
            if (Array.isArray(parsedCatList) && parsedCatList.length > 0) {
              hierarchyCategories = parsedCatList.map(mapCategoryFromDb);
            }
          } catch (e) {}
        }
      }

      // Merge categories from DB table (Ground Truth) and hierarchy config
      let dbCats = (categoriesRes && categoriesRes.data && categoriesRes.data.length > 0) ? categoriesRes.data.map(mapCategoryFromDb) : [];
      let finalCategories = [];

      if (dbCats.length > 0) {
        // Ground truth: Only active categories present in the database
        finalCategories = dbCats.map(dc => {
          const hMatch = hierarchyCategories.find(hc => hc.id === dc.id || (hc.name && dc.name && hc.name.toLowerCase() === dc.name.toLowerCase()));
          return {
            ...dc,
            image: dc.image || hMatch?.image || ''
          };
        });
      } else if (hierarchyCategories.length > 0) {
        finalCategories = hierarchyCategories;
      }

      finalCategories.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      setRawCategories(finalCategories);
      setCachedData('salbeau_cache_categories', finalCategories);

      if (productsRes.data) {
        const mappedProducts = productsRes.data.map(mapProductFromDb).filter(Boolean);
        mappedProducts.sort((a, b) => (Number(a.sort_order ?? a.display_order ?? a.priority) || 99999) - (Number(b.sort_order ?? b.display_order ?? b.priority) || 99999));
        setProducts(mappedProducts);
        setCachedData('salbeau_cache_products', mappedProducts);
      } else {
        setProducts([]);
        setCachedData('salbeau_cache_products', []);
      }
      setIsCatalogLoading(false);
    } catch (err) {
      console.warn('Supabase catalog fetch error:', err);
      setIsCatalogLoading(false);
    } finally {
      inFlightCatalogFetchRef.current = null;
    }
    })();

    inFlightCatalogFetchRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Real-Time Subscriptions: Single consolidated subscription channel
  useEffect(() => {
    fetchCatalog();

    let isCleaningUp = false;
    let reconnectTimer = null;

    // Use a unique channel topic per mount to prevent callback collisions after subscribe
    const channelName = 'app-realtime-sync-v1';
    const channel = supabase
      .channel(channelName)
      // 1. ORDERS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrderFromDb(payload.new);
          if (!updatedOrder) return;
          const curProfile = userProfileRef.current;
          const cleanPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
          const p1 = cleanPhone(curProfile?.phone);
          const p2 = cleanPhone(updatedOrder.phone);
          const cleanName = (curProfile?.name || '').trim().toLowerCase();

          setOrders(prev => {
            const idx = prev.findIndex(o => o.id === updatedOrder.id);
            const isAlreadyInList = idx >= 0;
            const isMyOrder = Boolean(
              isAlreadyInList ||
              !curProfile ||
              (curProfile?.id && (payload.new.user_id === curProfile.id || payload.new.userId === curProfile.id || String(payload.new.user_id) === String(curProfile.id))) ||
              (p1 && p2 && p1 === p2) ||
              (cleanName && updatedOrder.userName && updatedOrder.userName.trim().toLowerCase() === cleanName) ||
              !updatedOrder.phone
            );

            if (!isMyOrder) return prev;

            if (idx >= 0) {
              const copy = [...prev];
              const oldOrder = copy[idx];
              if (oldOrder && (oldOrder.status !== updatedOrder.status || oldOrder.paymentStatus !== updatedOrder.paymentStatus)) {
                let statusTitle = `Order Status: ${updatedOrder.status.toUpperCase().replace(/_/g, ' ')}`;
                let statusMsg = `Your order #${updatedOrder.id.slice(-6)} is now ${updatedOrder.status.replace(/_/g, ' ')}.`;
                if (oldOrder.paymentStatus !== updatedOrder.paymentStatus && updatedOrder.paymentStatus === 'paid') {
                  statusTitle = 'Payment Received!';
                  statusMsg = `Payment for order #${updatedOrder.id.slice(-6)} has been confirmed (Paid).`;
                }
                // Send directly to Mobile System Notification Drawer
                displayLocalNotification(statusTitle, statusMsg, {
                  orderId: String(updatedOrder.id),
                  status: String(updatedOrder.status),
                  screen: 'order_details'
                }).catch(() => {});
              }
              copy[idx] = updatedOrder;
              return copy;
            }
            return [updatedOrder, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setOrders(prev => prev.filter(o => o.id !== deletedId));
          }
        }
      })
      // 2. USERS (profile, role, verification status)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        const u = payload.new;
        const curProfile = userProfileRef.current;
        if (u && (u.phone === curProfile?.phone || u.id === curProfile?.id)) {
          setUserProfile(prev => {
            const nextRole = u.role || prev.role || 'general';
            if (nextRole !== userRoleRef.current) {
              setUserRole(nextRole);
            }
            return {
              ...prev,
              name: u.full_name || u.name || prev.name,
              role: nextRole,
              verificationStatus: u.verification_status || prev.verificationStatus,
              b2bVerified: u.b2b_verified !== undefined ? Boolean(u.b2b_verified) : prev.b2bVerified,
              verificationSubmittedAt: u.verification_submitted_at || prev.verificationSubmittedAt,
              verificationApprovedAt: u.verification_approved_at || prev.verificationApprovedAt,
              verificationRejectedAt: u.verification_rejected_at || prev.verificationRejectedAt,
              verifiedBy: u.verified_by || prev.verifiedBy,
              businessName: u.business_name || prev.businessName,
              branch: u.branch || prev.branch,
              email: u.email || prev.email,
              city: u.city || prev.city,
              state: u.state || prev.state,
              pincode: u.pincode || prev.pincode
            };
          });
        }
      })
      // 2b. B2B VERIFICATIONS (application status and rejection notes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_verifications' }, (payload) => {
        const v = payload.new;
        const curProf = userProfileRef.current;
        if (v && (v.user_id === curProf?.id || v.phone === curProf?.phone)) {
          setUserVerificationRecord(v);
          if (v.verification_status) {
            setUserProfile(prev => ({
              ...prev,
              verificationStatus: v.verification_status,
              rejectionReason: v.rejection_reason || null
            }));
          }
        }
      })
      // 2c. NOTIFICATIONS (In-App & Push Notification Center Realtime Sync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        const notif = payload.new;
        if (!notif) return;
        const curProfile = userProfileRef.current;
        const cleanPhone = (curProfile?.phone || '').trim();
        const cleanId = (curProfile?.id || '').trim();
        const isForMe = Boolean(
          !curProfile ||
          (cleanId && notif.user_id === cleanId) ||
          (cleanPhone && notif.user_id === cleanPhone) ||
          notif.target === 'all' ||
          notif.target === curProfile?.role ||
          notif.target === 'b2c'
        );
        if (!isForMe) return;

        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
          if (!notif.is_read) {
            // Post directly to Android / iOS System Notification Tray & Lock Screen
            displayLocalNotification(
              notif.title || 'Salbeau Notification',
              notif.message || '',
              {
                orderId: String(notif.data?.orderId || notif.data?.orderNumber || ''),
                type: String(notif.type || notif.data?.eventType || 'general'),
                screen: String(notif.data?.screen || (notif.data?.orderId ? 'order_details' : 'home')),
                id: String(notif.id || '')
              }
            ).catch(() => {});
          }
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === notif.id ? notif : n));
        } else if (payload.eventType === 'DELETE') {
          if (payload.old?.id) {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      })
      // 3. BRANDS & APP CONFIGS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.id === 'app_pricing_discount_config' && payload.new.logo) {
            try {
              const parsedPricing = JSON.parse(payload.new.logo);
              if (parsedPricing && typeof parsedPricing === 'object') {
                setPricingRules(parsedPricing);
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_category_order_config' && payload.new.logo) {
            try {
              const parsedCatList = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedCatList)) {
                setRawCategories(parsedCatList.map(mapCategoryFromDb));
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'salbeau_category_subcategory_hierarchy' && payload.new.logo) {
            try {
              const parsedHier = JSON.parse(payload.new.logo);
              if (parsedHier) {
                setLiveCategoryHierarchy(parsedHier);
                if (Array.isArray(parsedHier.categories)) {
                  setRawCategories(parsedHier.categories.map(mapCategoryFromDb));
                }
                if (Array.isArray(parsedHier.subcategories)) {
                  setSubcategories(parsedHier.subcategories);
                }
                if (Array.isArray(parsedHier.leafCategories)) {
                  setLeafCategories(parsedHier.leafCategories);
                }
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_home_section_visibility' && payload.new.logo) {
            try {
              const parsedVisibility = JSON.parse(payload.new.logo);
              if (parsedVisibility && typeof parsedVisibility === 'object') {
                setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_recommendation_config' && payload.new.logo) {
            try {
              const parsedRec = JSON.parse(payload.new.logo);
              if (parsedRec && typeof parsedRec === 'object') {
                setRecommendationConfig(prev => ({ ...prev, ...parsedRec }));
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_central_banners_master' && payload.new.logo) {
            try {
              const parsedCentral = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedCentral)) {
                setAllBanners(parsedCentral);
                storage.setItem('salbeau_central_banners', JSON.stringify(parsedCentral)).catch(() => {});
                const homeFromCentral = parsedCentral.filter(b => b.bannerType === 'home' || !b.bannerType);
                setHomeBanners(homeFromCentral);
                storage.setItem('salbeau_home_banners', JSON.stringify(homeFromCentral)).catch(() => {});
              }
            } catch (e) {}
            return;
          }

          if (payload.new && payload.new.id === 'app_home_banners' && payload.new.logo) {
            try {
              const parsedBanners = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedBanners)) {
                setHomeBanners(parsedBanners);
                storage.setItem('salbeau_home_banners', JSON.stringify(parsedBanners)).catch(() => {});
              }
            } catch (e) {}
            return;
          }

          if (payload.new && (
            payload.new.id === 'app_brand_category_map' ||
            payload.new.id === 'app_home_banners' ||
            payload.new.id === 'app_pricing_discount_config' ||
            payload.new.id === 'app_category_order_config' ||
            payload.new.id === 'salbeau_category_subcategory_hierarchy' ||
            payload.new.id === 'app_home_section_visibility' ||
            payload.new.id === 'app_recommendation_config' ||
            payload.new.id === 'salbeau_customer_search_requests'
          )) {
            return;
          }

          const b = payload.new;
          const updatedBrand = {
            id: b.id,
            name: b.name,
            enabled: b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0 && b.status !== 'hidden' && b.status !== 'disabled',
            logo: b.logo
          };
          setBrands(prev => {
            const idx = prev.findIndex(item => item.id === updatedBrand.id || (item.name && b.name && item.name.trim().toLowerCase() === b.name.trim().toLowerCase()));
            let updatedList;
            if (idx >= 0) {
              updatedList = [...prev];
              updatedList[idx] = updatedBrand;
            } else {
              updatedList = [...prev, updatedBrand];
            }
            return updatedList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }));
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setBrands(prev => prev.filter(b => b.id !== deletedId));
            setSelectedBrand(prev => (prev && prev.id === deletedId ? null : prev));
          }
        }
      })
      // 4. CATEGORIES
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedCat = mapCategoryFromDb(payload.new);
          setRawCategories(prev => {
            const idx = prev.findIndex(item => item.id === updatedCat.id);
            let updated;
            if (idx >= 0) {
              updated = [...prev];
              updated[idx] = updatedCat;
            } else {
              updated = [...prev, updatedCat];
            }
            return updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          });
          setSelectedCategory(prev => {
            if (prev && (prev.id === updatedCat.id || prev.name === updatedCat.name)) {
              return updatedCat.enabled === false ? null : { ...prev, ...updatedCat };
            }
            return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setRawCategories(prev => prev.filter(c => c.id !== deletedId));
            setSelectedCategory(prev => (prev && (prev.id === deletedId || prev.name === deletedId) ? null : prev));
            setSubcategories(prev => prev.filter(s => s.categoryId !== deletedId && s.category_id !== deletedId));
          }
        }
      })
      // 5. SUBCATEGORIES
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const s = payload.new;
          const updatedSub = {
            id: s.id,
            categoryId: s.category_id || s.categoryId,
            name: s.name,
            image: s.image || '',
            tagline: s.tagline || '',
            sort_order: Number(s.sort_order || 1),
            enabled: s.enabled !== false && s.enabled !== 'false' && s.enabled !== 0,
            leafCategories: []
          };
          setSubcategories(prev => {
            const idx = prev.findIndex(item => item.id === updatedSub.id);
            let updated;
            if (idx >= 0) {
              updated = [...prev];
              updated[idx] = { ...updated[idx], ...updatedSub };
            } else {
              updated = [...prev, updatedSub];
            }
            return updated.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setSubcategories(prev => prev.filter(s => s.id !== deletedId));
          }
        }
      })
      // 6. PRODUCTS (instant sync for Add, Edit, Delete, Prices, Variants, Shades, Barcode, Images)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedProduct = mapProductFromDb(payload.new);
          if (!updatedProduct) return;

          setProducts(prev => {
            const idx = prev.findIndex(item => item.id === updatedProduct.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedProduct;
              return copy;
            }
            return [updatedProduct, ...prev];
          });

          // Reconcile selectedProduct: update if still active, or clear if product was disabled
          setSelectedProduct(prev => {
            if (prev && prev.id === updatedProduct.id) {
              if (!updatedProduct.enabled || updatedProduct.status === 'inactive' || updatedProduct.status === 'draft') {
                return null;
              }
              return { ...prev, ...updatedProduct };
            }
            return prev;
          });

          // Reconcile Cart: if product became disabled/inactive/draft, remove it.
          // If variant in cart was deleted by Admin, remove it. Otherwise, update product & shade.
          setCart(prev => {
            if (!updatedProduct.enabled || updatedProduct.status === 'inactive' || updatedProduct.status === 'draft') {
              return prev.filter(item => (item.product?.id || item.id) !== updatedProduct.id && !item.id?.startsWith(updatedProduct.id + '_'));
            }
            let hasItem = false;
            const nextCart = prev.map(item => {
              if (item.product?.id === updatedProduct.id) {
                hasItem = true;
                let updatedShade = item.shade;
                if (item.shade && Array.isArray(updatedProduct.shades)) {
                  const shadeMatch = updatedProduct.shades.find(s => s.id === item.shade.id || s.name === item.shade.name);
                  if (shadeMatch) {
                    updatedShade = shadeMatch;
                  } else {
                    // Variant was removed by Admin; remove from cart
                    return null;
                  }
                }
                return {
                  ...item,
                  product: updatedProduct,
                  shade: updatedShade
                };
              }
              return item;
            }).filter(Boolean);
            return hasItem ? nextCart : prev;
          });

          // Reconcile Favorites
          setFavorites(prev => {
            const idx = prev.findIndex(item => item.id === updatedProduct.id);
            if (idx >= 0) {
              if (!updatedProduct.enabled || updatedProduct.status === 'inactive' || updatedProduct.status === 'draft') {
                return prev.filter(item => item.id !== updatedProduct.id);
              }
              const copy = [...prev];
              copy[idx] = updatedProduct;
              return copy;
            }
            return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setProducts(prev => prev.filter(item => item.id !== deletedId));
            setSelectedProduct(prev => (prev && prev.id === deletedId ? null : prev));
            setCart(prev => prev.filter(item => (item.product?.id || item.id) !== deletedId && !item.id?.startsWith(deletedId + '_')));
            setFavorites(prev => prev.filter(item => (item.id || item) !== deletedId));
          }
        }
      })
      // 7. FAVORITES
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, (payload) => {
        const curP = userProfileRef.current;
        const userId = curP?.id || ('u_' + (curP?.phone || '').replace(/\D/g, '')) || 'guest_user';
        if (payload.eventType === 'INSERT' && payload.new && payload.new.user_id === userId) {
          const matchedProd = productsRef.current.find(p => p.id === payload.new.product_id);
          if (matchedProd) {
            setFavorites(prev => prev.some(p => p.id === matchedProd.id) ? prev : [matchedProd, ...prev]);
          }
        } else if (payload.eventType === 'DELETE' && payload.old && payload.old.user_id === userId) {
          setFavorites(prev => prev.filter(p => p.id !== payload.old.product_id));
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // Active realtime subscription
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!isCleaningUp) {
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              if (!isCleaningUp) fetchCatalog();
            }, 3000);
          }
        }
        // status === 'CLOSED' is normal teardown during unmount; no warning or reconnect needed
      });

    return () => {
      isCleaningUp = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [fetchCatalog]);

  // Load user orders in background on demand or user change with robust phone normalization
  const fetchUserOrders = useCallback(async () => {
    const rawPhone = (userProfile?.phone || '').trim();
    const rawId = (userProfile?.id || '').trim();
    const digits10 = rawPhone.replace(/\D/g, '').slice(-10);

    if (!rawPhone && !rawId) {
      setOrders([]);
      return [];
    }

    try {
      let query = supabase.from('orders').select('*').order('date', { ascending: false });
      const conds = [];
      if (rawPhone) conds.push(`phone.eq.${rawPhone}`);
      if (digits10 && digits10.length >= 10) {
        conds.push(`phone.eq.${digits10}`);
        conds.push(`phone.eq.+91${digits10}`);
        conds.push(`phone.eq.+91 ${digits10}`);
        conds.push(`phone.eq.+91 ${digits10.slice(0, 5)} ${digits10.slice(5)}`);
      }
      if (rawId) {
        conds.push(`user_id.eq.${rawId}`);
        conds.push(`userId.eq.${rawId}`);
      }

      if (conds.length > 0) {
        query = query.or(conds.join(','));
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapOrderFromDb);
        setOrders(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('fetchUserOrders error:', err);
    }
    return [];
  }, [userProfile?.phone, userProfile?.id]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // In-App Notification Center helpers & Supabase queries
  const fetchNotifications = useCallback(async () => {
    const cleanPhone = (userProfile?.phone || '').trim();
    const cleanId = (userProfile?.id || '').trim();
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(60);
      if (cleanPhone || cleanId) {
        const conds = [];
        if (cleanPhone) conds.push(`user_id.eq.${cleanPhone}`);
        if (cleanId) conds.push(`user_id.eq.${cleanId}`);
        query = query.or(conds.join(','));
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.warn('fetchNotifications error:', e);
    }
  }, [userProfile?.phone, userProfile?.id]);

  const markNotificationAsRead = useCallback(async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    } catch (e) {
      console.warn('markNotificationAsRead error:', e);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const cleanPhone = (userProfile?.phone || '').trim();
      const cleanId = (userProfile?.id || '').trim();
      let query = supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      if (cleanPhone || cleanId) {
        const conds = [];
        if (cleanPhone) conds.push(`user_id.eq.${cleanPhone}`);
        if (cleanId) conds.push(`user_id.eq.${cleanId}`);
        query = query.or(conds.join(','));
      }
      await query;
    } catch (e) {
      console.warn('markAllNotificationsAsRead error:', e);
    }
  }, [userProfile?.phone, userProfile?.id]);

  const dismissOrderStatusNotification = useCallback(() => {}, []);

  // Handle System Tray Notification Clicks & Deep-Linking (Cold & Warm)
  const handleSystemNotificationTap = useCallback((data) => {
    if (!data) return;
    const orderId = data.orderId || data.order_id || data.orderNumber;
    const targetScreen = data.screen || data.targetScreen;
    
    if (orderId) {
      setSelectedOrderIdForDetails(orderId);
      setCurrentScreen('order_details');
    } else if (targetScreen) {
      setCurrentScreen(targetScreen);
    } else if (data.type === 'order_status' || (data.eventType && String(data.eventType).startsWith('order_'))) {
      setCurrentScreen('orders');
    } else if (data.type === 'b2b_approved' || data.type === 'b2b_update') {
      setCurrentScreen('profile');
    } else {
      setCurrentScreen('home');
    }
  }, []);

  // Native Android FCM & Notifications synchronization
  useEffect(() => {
    fetchNotifications();
    const cleanPhone = (userProfile?.phone || '').trim();
    const cleanId = (userProfile?.id || '').trim();
    // Always request FCM token & Android 13+ runtime permission on mount
    requestFCMToken(cleanId, cleanPhone);

    // 1. Cold Launch: Check if app was opened by clicking a system notification in tray
    getInitialNotification().then((initial) => {
      if (initial) {
        console.log('[System Tray Cold Launch]:', initial);
        handleSystemNotificationTap(initial);
      }
    }).catch(() => {});

    // 2. Warm Launch: Listen for system notification clicks while app is open / backgrounded
    const unsubTap = setupNotificationTapListener((tapPayload) => {
      console.log('[System Tray Warm Tap]:', tapPayload);
      handleSystemNotificationTap(tapPayload);
    });

    // 3. Foreground Push: Deliver directly to OS System Notification Drawer
    const unsubFCM = setupFCMForegroundListener((pushData) => {
      fetchNotifications();
      displayLocalNotification(pushData.title, pushData.message, {
        ...(pushData.data || {}),
        orderId: pushData.data?.orderId,
        screen: pushData.data?.screen || (pushData.data?.orderId ? 'order_details' : 'home')
      }).catch(() => {});
    });

    return () => {
      if (typeof unsubTap === 'function') unsubTap();
      if (typeof unsubFCM === 'function') unsubFCM();
    };
  }, [userProfile?.phone, userProfile?.id, fetchNotifications, handleSystemNotificationTap]);

  // Personalized Real-time & In-App Welcome Notification on User Login
  const triggerLoginWelcomeNotification = useCallback(async (profileOverride = null) => {
    const profile = profileOverride || userProfileRef.current;
    if (!profile || !profile.phone) return;

    const cleanPhone = (profile.phone || '').trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const name = (profile.name || profile.fullName || '').trim() || 'Beauty Lover';
    const role = (profile.role || userRoleRef.current || 'general').toLowerCase();

    // Ensure FCM token registration on login
    requestFCMToken(profile.id, cleanPhone).catch(() => {});

    // 1. Personalized title & greeting tailored to customer role/persona
    let title = `Welcome to Salbeau, ${name}! ✨`;
    let message = 'Discover authentic luxury cosmetics, curated shades, and exclusive beauty deals for your skin.';

    if (role.includes('salon') || role.includes('parlour')) {
      title = `Welcome to Salbeau Salon Pro, ${name}! 🏛️`;
      message = 'Your salon wholesale rates, bulk tier savings, and priority dispatch are ready.';
    } else if (role.includes('artist') || role.includes('mua')) {
      title = `Welcome to Salbeau Pro MUA, ${name}! 💄`;
      message = 'Access professional makeup artist discounts, master kits, and bulk tier rates.';
    } else if (role.includes('beautician')) {
      title = `Welcome to Salbeau Beautician Partner, ${name}! 🌸`;
      message = 'Explore specialized beautician pricing, salon packs, and verified cosmetic products.';
    } else if (role.includes('wholesale') || role.includes('reseller')) {
      title = `Welcome to Salbeau Wholesale, ${name}! 📦`;
      message = 'Direct B2B distribution rates, bulk purchase discounts, and GST invoice billing unlocked.';
    }

    // Deliver directly to Android / iOS System Notification Tray
    displayLocalNotification(title, message, {
      type: 'welcome',
      eventType: 'login_welcome',
      screen: 'home'
    }).catch(() => {});

    // 3. Persistent Notification Center item in local state
    const newNotifItem = {
      id: `notif_welcome_${cleanDigits}_${Date.now()}`,
      user_id: cleanPhone,
      title,
      message,
      type: 'welcome',
      data: { eventType: 'login_welcome', role, name },
      is_read: false,
      created_at: new Date().toISOString()
    };

    setNotifications(prev => [newNotifItem, ...prev.filter(n => n.type !== 'welcome' || n.id !== newNotifItem.id)]);

    // 4. Persist to Supabase notifications table in background
    try {
      await supabase.from('notifications').insert([{
        user_id: cleanPhone,
        title,
        message,
        type: 'welcome',
        data: { eventType: 'login_welcome', role, name },
        is_read: false
      }]);
    } catch (e) {
      console.warn('Welcome notification db insert skipped/offline:', e?.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Server-side session verification and sync on app startup / refresh
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      let session = getInitialAuthSession();
      if (!session) {
        try {
          const raw = await storage.getItem(AUTH_SESSION_KEY);
          if (raw) session = JSON.parse(raw);
        } catch (_) {}
      }
      if (!session || !session.phone) return;

      const cleanDigits = session.phone.replace(/\D/g, '');
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.u_${cleanDigits},phone.eq.${session.phone}`)
          .maybeSingle();

        if (!isMounted) return;

        if (dbUser && dbUser.name && dbUser.name.trim().length >= 2) {
          let meta = {};
          if (dbUser.business_name) {
            try { meta = JSON.parse(dbUser.business_name); } catch (e) { }
          }
          const city = dbUser.city || meta.city || '';
          const state = dbUser.state || meta.state || '';
          const pincode = dbUser.pincode || meta.pincode || '';
          const email = dbUser.email || meta.email || '';
          const fullAddr = (city && state) ? `${city}, ${state}${pincode ? ` - ${pincode}` : ''}` : '';

          const cleanBizName = (dbUser.business_name && !dbUser.business_name.startsWith('{'))
            ? dbUser.business_name
            : (dbUser.role !== 'general' ? `${dbUser.name} Studio` : '');

          const updatedProfile = {
            id: dbUser.id,
            name: dbUser.name,
            phone: dbUser.phone || session.phone,
            email: email,
            pincode: pincode,
            city: city,
            state: state,
            role: dbUser.role || session.role || 'general',
            businessName: cleanBizName,
            address: fullAddr,
            isProfileComplete: true,
            verificationStatus: dbUser.verification_status || 'not_submitted',
            b2bVerified: Boolean(dbUser.b2b_verified === true || dbUser.b2b_verified === 'true'),
            verificationSubmittedAt: dbUser.verification_submitted_at || null,
            verificationApprovedAt: dbUser.verification_approved_at || null,
            verificationRejectedAt: dbUser.verification_rejected_at || null,
            verifiedBy: dbUser.verified_by || null,
            rejectionReason: dbUser.rejection_reason || null,
          };

          setUserProfile(updatedProfile);
          if (dbUser.role) setUserRole(dbUser.role);

          const defaultAddr = {
            id: `addr_${dbUser.id}`,
            label: 'Home',
            name: dbUser.name,
            phone: dbUser.phone || session.phone,
            text: fullAddr || `${dbUser.name}'s Address`,
            isDefault: true
          };
          setAddresses(prev => prev.length > 0 ? prev : [defaultAddr]);

          const refreshedSession = {
            ...session,
            userId: dbUser.id,
            role: dbUser.role || 'general',
            isProfileComplete: true,
            profile: updatedProfile,
            addresses: [defaultAddr]
          };
          await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(refreshedSession));
          await storage.setItem('salbeau_user_profile', JSON.stringify(updatedProfile));
        }
      } catch (e) {
        console.warn('Session verification error:', e);
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  // Hydrate favorites from Supabase on mount or user change
  useEffect(() => {
    const loadFavorites = async () => {
      const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
      try {
        const { data: favData } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);

        if (favData && favData.length > 0 && products.length > 0) {
          const favIds = new Set(favData.map(f => f.product_id));
          const matched = products.filter(p => favIds.has(p.id));
          setFavorites(matched);
        }
      } catch (err) { }
    };

    if (products.length > 0) {
      loadFavorites();
    }
  }, [userProfile?.id, userProfile?.phone, products.length]);

  // In-memory cache for ultra-fast OTP verification (0ms)
  const profileCacheRef = useRef(new Map());
  const pendingPrefetchRef = useRef(new Map());

  // Non-blocking prefetch of user profile to eliminate OTP verification delay
  const prefetchUserProfile = (phoneNumber) => {
    const cleanPhone = (phoneNumber || userProfile?.phone || '').trim();
    if (!cleanPhone) return;
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanDigits) return;

    if (profileCacheRef.current.has(cleanDigits) || pendingPrefetchRef.current.has(cleanDigits)) {
      return;
    }

    const prefetchPromise = (async () => {
      try {
        const last10Digits = cleanDigits.slice(-10);
        const candidateIds = [`u_${cleanDigits}`, `u_91${last10Digits}`, `u_${last10Digits}`];

        let data = null;
        // 1. Direct primary key lookup using candidate IDs
        const { data: idMatches } = await supabase
          .from('users')
          .select('*')
          .in('id', candidateIds)
          .limit(1);

        if (idMatches && idMatches.length > 0) {
          data = idMatches[0];
        }

        // 2. Fallback query by phone variants if not matched by ID
        if (!data) {
          const res = await supabase
            .from('users')
            .select('*')
            .or(`phone.eq.${cleanPhone},phone.ilike.%${last10Digits}%`)
            .limit(1);
          if (res.data && res.data.length > 0) {
            data = res.data[0];
          }
        }

        if (data && (data.name || data.role)) {
          let meta = {};
          if (data.business_name) {
            try {
              meta = JSON.parse(data.business_name);
            } catch (e) { }
          }

          const city = data.city || meta.city || '';
          const state = data.state || meta.state || '';
          const pincode = data.pincode || meta.pincode || '';
          const email = data.email || meta.email || '';

          const isProfileComplete = Boolean(pincode && city && state && (data.name || '').trim().length >= 2);
          const cleanBizName = (data.business_name && !data.business_name.startsWith('{'))
            ? data.business_name
            : (data.role !== 'general' ? `${data.name || 'Professional'} Studio` : '');

          const vStatus = (data.verification_status || (data.role === 'general' ? 'approved' : 'not_submitted')).toLowerCase().trim();
          const isVerified = Boolean(data.b2b_verified === true || data.b2b_verified === 'true' || vStatus === 'verified' || vStatus === 'approved');

          const loadedProfile = {
            ...userProfile,
            id: data.id,
            name: data.name || userProfile?.name || 'Customer',
            phone: data.phone || cleanPhone,
            email: email,
            pincode: pincode,
            city: city,
            state: state,
            role: data.role || userRole || 'general',
            businessName: cleanBizName,
            address: isProfileComplete ? `${city}, ${state} - ${pincode}` : (data.address || ''),
            isProfileComplete: isProfileComplete,
            verificationStatus: vStatus,
            b2bVerified: isVerified,
            verificationSubmittedAt: data.verification_submitted_at || null,
            verificationApprovedAt: data.verification_approved_at || null,
            verificationRejectedAt: data.verification_rejected_at || null,
            verifiedBy: data.verified_by || null,
            rejectionReason: data.rejection_reason || null,
          };
          profileCacheRef.current.set(cleanDigits, { isComplete: isProfileComplete, profile: loadedProfile });
          return { isComplete: isProfileComplete, profile: loadedProfile };
        }

        profileCacheRef.current.set(cleanDigits, { isComplete: false, profile: null });
        return { isComplete: false, profile: null };
      } catch (err) {
        profileCacheRef.current.set(cleanDigits, { isComplete: false, profile: null });
        return { isComplete: false, profile: null };
      } finally {
        pendingPrefetchRef.current.delete(cleanDigits);
      }
    })();

    pendingPrefetchRef.current.set(cleanDigits, prefetchPromise);
  };

  // Instant (0ms from cache) or ultra-fast profile check for OTP screen
  const checkUserExistingProfile = async (phoneNumber) => {
    const cleanPhone = (phoneNumber || userProfile?.phone || '').trim();
    if (!cleanPhone) return false;
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanDigits) return false;

    const commitSession = (profile) => {
      setUserProfile(profile);
      if (profile.role) setUserRole(profile.role);
      const userAddr = [
        {
          id: `addr_${profile.id || cleanDigits}`,
          label: 'Home',
          name: profile.name,
          phone: profile.phone || cleanPhone,
          text: profile.address || `${profile.name}'s Address`,
          isDefault: true
        }
      ];
      setAddresses(userAddr);

      const sessionData = {
        userId: profile.id || `u_${cleanDigits}`,
        phone: profile.phone || cleanPhone,
        role: profile.role || 'general',
        isProfileComplete: profile.isProfileComplete || false,
        profile: profile,
        addresses: userAddr,
        token: `sess_${Date.now()}_${cleanDigits}`,
        authenticatedAt: new Date().toISOString()
      };
      storage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
      storage.setItem('salbeau_user_profile', JSON.stringify(profile));
    };

    // 1. Instant return from cache (0ms delay)
    if (profileCacheRef.current.has(cleanDigits)) {
      const cached = profileCacheRef.current.get(cleanDigits);
      if (cached && cached.profile) {
        commitSession(cached.profile);
        return cached.isComplete;
      }
      return false;
    }

    // 2. Await in-flight prefetch with strict 1000ms timeout
    if (pendingPrefetchRef.current.has(cleanDigits)) {
      try {
        const inFlight = pendingPrefetchRef.current.get(cleanDigits);
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ isComplete: false, profile: null }), 1000));
        const result = await Promise.race([inFlight, timeout]);
        if (result && result.profile) {
          commitSession(result.profile);
          return result.isComplete;
        }
        return false;
      } catch (e) {
        return false;
      }
    }

    // 3. Fast fallback with strict 1000ms timeout
    try {
      prefetchUserProfile(cleanPhone);
      const inFlight = pendingPrefetchRef.current.get(cleanDigits);
      if (inFlight) {
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ isComplete: false, profile: null }), 1000));
        const result = await Promise.race([inFlight, timeout]);
        if (result && result.profile) {
          commitSession(result.profile);
          return result.isComplete;
        }
      }
    } catch (e) { }

    return false;
  };

  // Lookup all registered user accounts by phone number
  const lookupUserAccountsByPhone = async (phoneNumber) => {
    const raw = (phoneNumber || userProfile?.phone || '').trim();
    if (!raw) return { isRegistered: false, accounts: [] };
    const cleanDigits = raw.replace(/\D/g, '');
    const last10Digits = cleanDigits.slice(-10);
    if (last10Digits.length !== 10) return { isRegistered: false, accounts: [] };

    const formattedPhone = `+91 ${last10Digits.slice(0, 5)} ${last10Digits.slice(5)}`;

    try {
      const candidateIds = [`u_${cleanDigits}`, `u_91${last10Digits}`, `u_${last10Digits}`];

      // Query database for all user rows matching this phone
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${formattedPhone},phone.ilike.%${last10Digits}%,id.in.(${candidateIds.map(id => `"${id}"`).join(',')})`);

      if (error) {
        console.warn('lookupUserAccountsByPhone db note:', error.message);
      }

      const rows = Array.isArray(data) ? data : [];
      const validAccountsMap = new Map();

      rows.forEach(r => {
        if (!r) return;
        const role = (r.role || 'general').toLowerCase().trim();
        const hasName = r.name && r.name.trim().length >= 2;
        const isComplete = Boolean(r.is_profile_complete || r.isProfileComplete || hasName);

        if (isComplete || hasName || r.b2b_verified || r.business_name) {
          const profile = {
            id: r.id || `u_${last10Digits}`,
            name: r.name || 'User',
            phone: r.phone || formattedPhone,
            email: r.email || '',
            pincode: r.pincode || '',
            city: r.city || '',
            state: r.state || '',
            role: role,
            businessName: r.business_name || (role !== 'general' ? `${r.name || 'Professional'} Studio` : ''),
            address: r.address || `${r.city || ''}, ${r.state || ''} - ${r.pincode || ''}`.trim(),
            isProfileComplete: true,
            verificationStatus: (r.verification_status || (role === 'general' ? 'approved' : 'not_submitted')).toLowerCase().trim(),
            b2bVerified: Boolean(r.b2b_verified === true || r.b2b_verified === 'true')
          };

          if (!validAccountsMap.has(role)) {
            validAccountsMap.set(role, profile);
          }
        }
      });

      const accounts = Array.from(validAccountsMap.values());
      return {
        isRegistered: accounts.length > 0,
        accounts
      };
    } catch (e) {
      console.warn('lookupUserAccountsByPhone exception:', e);
      return { isRegistered: false, accounts: [] };
    }
  };

  // Sign in directly with a verified user account and navigate to dashboard
  const loginWithAccount = async (account) => {
    if (!account) return;
    const cleanDigits = (account.phone || '').replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

    const fullProfile = {
      ...account,
      phone: formattedPhone,
      isProfileComplete: true
    };

    setUserProfile(fullProfile);
    if (account.role) {
      setUserRole(account.role);
    }

    const primaryAddress = {
      id: `addr_${account.id || cleanDigits}`,
      label: 'Home',
      name: account.name || 'User',
      phone: formattedPhone,
      text: account.address || `${account.city || ''}, ${account.state || ''} - ${account.pincode || ''}`.trim() || 'Home Address',
      isDefault: true,
    };
    setAddresses([primaryAddress]);

    const sessionData = {
      userId: account.id || `u_${cleanDigits}`,
      phone: formattedPhone,
      role: account.role || 'general',
      isProfileComplete: true,
      profile: fullProfile,
      addresses: [primaryAddress],
      token: `sess_${Date.now()}_${cleanDigits}`,
      authenticatedAt: new Date().toISOString()
    };

    try {
      await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
      await storage.setItem('salbeau_user_profile', JSON.stringify(fullProfile));
    } catch (_) {}

    if (triggerLoginWelcomeNotification) {
      triggerLoginWelcomeNotification(fullProfile);
    }

    // Direct dashboard navigation based on role
    const effectiveRole = (account.role || 'general').toLowerCase();
    if (isB2BRole(effectiveRole)) {
      if (account.b2bVerified || account.verificationStatus === 'approved') {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('b2b_verification');
      }
    } else {
      setCurrentScreen('home');
    }

    return fullProfile;
  };

  // Set verified phone for brand new user registration
  const setVerifiedPhoneForRegistration = (phoneNumber) => {
    const cleanDigits = (phoneNumber || '').replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

    setUserProfile(prev => ({
      ...prev,
      phone: formattedPhone,
      isPhoneVerified: true,
      isProfileComplete: false
    }));
  };

  // Save completed user profile to Supabase and context, with persistent session
  const saveUserProfile = async (profileInput = {}) => {
    const fullName = (profileInput.fullName || profileInput.name || profileInput.ownerName || userProfile?.name || '').trim();
    const email = (profileInput.email ?? userProfile?.email ?? '').trim();
    const pincode = (profileInput.pincode ?? userProfile?.pincode ?? '').trim();
    const city = (profileInput.city ?? userProfile?.city ?? '').trim();
    const state = (profileInput.state ?? userProfile?.state ?? '').trim();
    const address = (profileInput.address ?? userProfile?.address ?? '').trim();
    const businessName = (profileInput.businessName ?? profileInput.business_name ?? userProfile?.businessName ?? '').trim();
    const businessType = profileInput.businessType ?? userProfile?.businessType ?? '';
    const specializations = Array.isArray(profileInput.specializations) ? profileInput.specializations : (userProfile?.specializations || []);
    const experience = profileInput.experience ?? userProfile?.experience ?? '';
    const gstNumber = (profileInput.gstNumber ?? profileInput.gstin ?? userProfile?.gstNumber ?? '').trim();
    const effectiveRole = profileInput.role || userRole || 'general';

    const cleanPhone = (profileInput.phone || userProfile?.phone || '').trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const userId = userProfile?.id || (cleanDigits ? `u_${cleanDigits}` : `u_${Date.now()}`);
    const fullAddress = address || (city ? `${city}, ${state}${pincode ? ` - ${pincode}` : ''}` : '');

    const isB2B = isB2BRole(effectiveRole);
    const initialStatus = isB2B ? (userProfile?.verificationStatus || 'not_submitted') : 'approved';
    const isB2BVer = isB2B ? Boolean(userProfile?.b2bVerified) : false;

    const updatedProfile = {
      ...userProfile,
      ...profileInput,
      id: userId,
      name: fullName,
      phone: cleanPhone,
      email: email,
      pincode: pincode,
      city: city,
      state: state,
      address: fullAddress,
      businessName: businessName,
      business_name: businessName,
      businessType: businessType,
      specializations: specializations,
      experience: experience,
      gstNumber: gstNumber,
      role: effectiveRole,
      isPhoneVerified: true,
      isProfileComplete: true,
      verificationStatus: initialStatus,
      b2bVerified: isB2BVer
    };

    setUserProfile(updatedProfile);
    setUserRole(effectiveRole);

    // Warm cache immediately so any subsequent checks are 0ms
    if (cleanDigits) {
      profileCacheRef.current.set(cleanDigits, { isComplete: true, profile: updatedProfile });
    }

    // Update primary delivery address
    const primaryAddress = {
      id: `addr_${userId}`,
      label: 'Home',
      name: fullName,
      phone: cleanPhone,
      text: fullAddress,
      isDefault: true,
    };
    setAddresses([primaryAddress]);

    // Persist authenticated session
    const sessionData = {
      userId,
      phone: cleanPhone,
      role: effectiveRole,
      isProfileComplete: true,
      profile: updatedProfile,
      addresses: [primaryAddress],
      token: `sess_${Date.now()}_${cleanDigits}`,
      authenticatedAt: new Date().toISOString()
    };
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    storage.setItem('salbeau_user_profile', JSON.stringify(updatedProfile));

    // Sync to Supabase cleanly without stuffing JSON into business_name
    try {
      const cleanBizName = effectiveRole !== 'general' ? (businessName || `${fullName} Studio`) : null;

      const userPayload = {
        id: userId,
        name: fullName,
        full_name: fullName,
        phone: cleanPhone,
        email: email,
        pincode: pincode,
        city: city,
        state: state,
        role: effectiveRole,
        business_name: cleanBizName,
        branch: `${city || 'MG Road'} Branch`,
        verification_status: initialStatus,
        b2b_verified: isB2BVer,
        cancellation_count: consecutiveCancels || 0,
        last_active: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase.from('users').upsert(userPayload);
      if (upsertErr) {
        // Fallback for legacy DB schema before migration is applied
        const { error: fallbackErr } = await supabase.from('users').upsert({
          id: userId,
          name: fullName,
          phone: cleanPhone,
          role: effectiveRole,
          business_name: cleanBizName,
          branch: `${city || 'MG Road'} Branch`,
          verification_status: initialStatus,
          cancellation_count: consecutiveCancels || 0,
          last_active: new Date().toISOString()
        });
        if (fallbackErr) {
          console.warn('Fallback user profile save error:', fallbackErr);
        }
      }
    } catch (err) {
      console.warn('Error saving user profile to Supabase:', err);
    }

    return updatedProfile;
  };

  // Complete logout: clears all stored session, state, and caches
  const logout = async () => {
    try {
      // Clear FCM Token from device and Supabase user record to prevent notification bleed
      await clearFCMToken(userProfile?.id, userProfile?.phone);
      await storage.removeItem(AUTH_SESSION_KEY);
      await storage.removeItem('salbeau_user_profile');
      await storage.removeItem('salbeau_cart');
      await storage.removeItem('salbeau_cache_cart');
      await storage.removeItem('salbeau_cache_orders');
      await storage.removeItem('salbeau_cache_favorites');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        window.localStorage.removeItem('salbeau_user_profile');
        window.localStorage.removeItem('salbeau_cart');
        window.localStorage.removeItem('salbeau_cache_orders');
        window.localStorage.removeItem('salbeau_cache_favorites');
      }
    } catch (e) { }

    profileCacheRef.current.clear();
    pendingPrefetchRef.current.clear();

    setUserProfile(EMPTY_USER_PROFILE);
    setUserRole('general');
    setAddresses([]);
    setCart([]);
    setOrders([]);
    setFavorites([]);
    setCurrentScreen('login');
  };

  const isB2BVerified = useMemo(() => {
    return isUserB2BVerified(userProfile);
  }, [userProfile]);

  const effectivePricingRole = useMemo(() => {
    return getEffectivePricingRole(userProfile);
  }, [userProfile]);

  const getRolePrice = useCallback((product, role = userRole, selectedShade = null, quantity = 1) => {
    // Critical B2B Pricing Rule: Professional prices unlock ONLY when verification_status === 'approved' AND b2b_verified === true
    const effectiveRole = (isB2BRole(role) && !isUserB2BVerified(userProfile)) ? 'general' : role;
    return calculateDynamicPrice(product, effectiveRole, selectedShade, quantity, pricingRules);
  }, [userRole, userProfile, pricingRules]);

  const getApplicableTier = (product, role = userRole, quantity = 1, selectedShade = null) => {
    const effectiveRole = (isB2BRole(role) && !isUserB2BVerified(userProfile)) ? 'general' : role;
    return getApplicableTierForRole(product, effectiveRole, quantity, selectedShade);
  };

  const loadUserB2BVerification = useCallback(async (userId = userProfile?.id) => {
    if (!userId || !isB2BRole(userRole || userProfile?.role)) return null;
    try {
      const rec = await fetchUserVerificationRecord(supabase, userId);
      if (rec) {
        setUserVerificationRecord(rec);
        if (rec.verification_status && rec.verification_status !== userProfile?.verificationStatus) {
          setUserProfile(prev => ({
            ...prev,
            verificationStatus: rec.verification_status,
            b2bVerified: rec.verification_status === 'approved' && Boolean(rec.b2b_verified),
            rejectionReason: rec.rejection_reason || null
          }));
        }
        return rec;
      }
    } catch (e) {
      console.warn('Error loading user verification record:', e);
    }
    return null;
  }, [userProfile?.id, userProfile?.verificationStatus, userRole]);

  const submitUserB2BVerification = useCallback(async (formData, documents = [], isResubmission = false) => {
    const cleanDigits = (userProfile?.phone || '').replace(/\D/g, '');
    const userId = userProfile?.id || ('u_' + cleanDigits);
    setIsVerificationSubmitting(true);
    try {
      const res = await apiSubmitB2BVerification(supabase, {
        userId,
        role: userRole || userProfile?.role || 'salon',
        ...formData,
        documents,
        isResubmission
      });

      if (res?.success) {
        setUserVerificationRecord(res.verification);
        const updatedProfile = {
          ...userProfile,
          role: userRole || userProfile?.role || 'salon',
          verificationStatus: 'submitted',
          b2bVerified: false,
          verificationSubmittedAt: new Date().toISOString(),
          businessName: formData.businessName || userProfile?.businessName || ''
        };
        setUserProfile(updatedProfile);
        try {
          await storage.setItem('salbeau_user_profile', JSON.stringify(updatedProfile));
        } catch (_) {}
        return res;
      }
      throw new Error('Failed to submit verification');
    } finally {
      setIsVerificationSubmitting(false);
    }
  }, [userProfile, userRole]);

  // Load verification record whenever user logs in or profile hydrates
  useEffect(() => {
    if (userProfile?.id && isB2BRole(userRole || userProfile?.role)) {
      loadUserB2BVerification(userProfile.id);
    }
  }, [userProfile?.id, userRole, loadUserB2BVerification]);

  const activeBrands = useMemo(() => {
    return brands.filter(b => Boolean(b.enabled));
  }, [brands]);

  const activeProductFamilies = useMemo(() => {
    const enabledBrandNames = new Set();
    const disabledBrandIds = new Set();
    if (brands && brands.length > 0) {
      for (const b of brands) {
        const isEn = b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0;
        const normName = (b.name || '').trim().toLowerCase();
        if (isEn && normName) {
          enabledBrandNames.add(normName);
        }
      }
      for (const b of brands) {
        const isEn = b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0;
        if (!isEn && b.id) {
          const normName = (b.name || '').trim().toLowerCase();
          if (!enabledBrandNames.has(normName)) {
            disabledBrandIds.add(b.id);
          }
        }
      }
    }
    return products.filter(p => {
      if (p.enabled === false) return false;
      const st = (p.status || p.additionalInfo?.status || '').toLowerCase();
      if (['draft', 'unpublished', 'archived', 'inactive', 'disabled', 'hidden'].includes(st)) return false;
      if (p.brandId && disabledBrandIds.has(p.brandId)) return false;
      return true;
    });
  }, [products, brands]);

  // Standard unified catalog products (1 card per product with interactive shade chips, Purplle style)
  // Each product has 1 card with shade chips instead of exploding into duplicate cards
  // Nykaa-style sellable catalog:
  // Every sellable variant appears as an individual product card
  // (e.g. 10 shades = 10 cards with variant image, shade name, 4-tier role prices, discount %).
  // Standalone products (0 variants) remain as 1 card.
  const activeProducts = useMemo(() => {
    return flattenToSellableNykaaCatalog(activeProductFamilies);
  }, [activeProductFamilies]);

  const addToCart = useCallback((product, quantity = 1, shade = null) => {
    const isVarChild = Boolean(product?.isVariantChild);
    const parentProduct = (isVarChild && product.parentProduct) ? product.parentProduct : product;
    const effectiveShade = shade || (isVarChild ? (product.variantData || {
      id: product.realVariantId,
      name: product.variantName,
      title: product.variantTitle,
      hexColor: product.hexColor,
      image: product.image,
      imageUrl: product.imageUrl,
      mrp: product.mrp,
      salonPrice: product.salonPrice,
      artistPrice: product.artistPrice,
      beauticianPrice: product.beauticianPrice,
      barcode: product.barcode,
      sku: product.sku
    }) : null);

    const cartItemId = getCartKey(parentProduct.id, effectiveShade);

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cartItemId, product: parentProduct, quantity, shade: effectiveShade, variantId: effectiveShade?.name || effectiveShade?.id || null }];
    });
  }, []);

  const updateCartQuantity = useCallback((cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item)));
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const clearCart = async () => {
    setCart([]);
    const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
    try {
      await supabase.from('abandoned_carts').update({
        status: 'cleared',
        items: [],
        cart_value: 0,
        item_count: 0,
        updated_at: new Date().toISOString()
      }).eq('id', `cart_${userId}`).eq('status', 'abandoned');
    } catch (e) {}
  };

  // Task 4: Real-time Abandoned Cart Sync to Supabase
  useEffect(() => {
    const syncAbandonedCart = async () => {
      const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
      if (!userId) return;
      const cartId = `cart_${userId}`;

      if (cart.length > 0) {
        const itemsData = cart.map(item => ({
          id: item.product?.id,
          name: item.product?.name,
          brand: item.product?.brandName,
          image: item.product?.image,
          shade: item.shade || null,
          quantity: item.quantity,
          unitPrice: getRolePrice(item.product, userRole, item.shade, item.quantity),
          totalPrice: getRolePrice(item.product, userRole, item.shade, item.quantity) * item.quantity
        }));

        try {
          await supabase.from('abandoned_carts').upsert({
            id: cartId,
            user_id: userId,
            user_name: userProfile?.name || 'Customer',
            phone: userProfile?.phone || '',
            user_role: userRole || 'general',
            items: itemsData,
            cart_value: cartSubtotal,
            item_count: cart.reduce((s, i) => s + i.quantity, 0),
            status: 'abandoned',
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Error syncing abandoned cart:', e);
        }
      }
    };

    const timer = setTimeout(syncAbandonedCart, 1500);
    return () => clearTimeout(timer);
  }, [cart, userProfile?.id, userProfile?.phone, userProfile?.name, userRole, cartSubtotal]);

  const isFavorite = useCallback((productId) => {
    if (!productId) return false;
    return favorites.some(item => item.id === productId);
  }, [favorites]);

  const toggleFavorite = async (product) => {
    if (!product || !product.id) return false;
    const exists = favorites.some(item => item.id === product.id);
    const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
    const favId = `fav_${userId}_${product.id}`;

    if (exists) {
      setFavorites(prev => prev.filter(item => item.id !== product.id));
      try {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', product.id);
      } catch (err) { }
      return false;
    } else {
      setFavorites(prev => {
        if (prev.some(item => item.id === product.id)) return prev;
        return [product, ...prev];
      });
      try {
        await supabase.from('favorites').upsert({
          id: favId,
          user_id: userId,
          product_id: product.id
        });
      } catch (err) { }
      return true;
    }
  };

  const removeFromFavorites = async (productId) => {
    if (!productId) return;
    setFavorites(prev => prev.filter(item => item.id !== productId));
    const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
    try {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
    } catch (e) { }
  };

  const clearFavorites = async () => {
    setFavorites([]);
    const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
    try {
      await supabase.from('favorites').delete().eq('user_id', userId);
    } catch (e) { }
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + getRolePrice(item.product, userRole, item.shade, item.quantity) * item.quantity, 0);
  }, [cart, userRole, userProfile]);

  // Task 1: Generate Order ID in exact DDMMYYYY-CC-OOOOO format with IST server/database time
  const placeOrder = async ({ deliveryType, address, branch, notes, deliveryInstructions }) => {
    const now = new Date();
    const finalInstructions = (deliveryInstructions || notes || '').trim();

    const newOrderId = await generateSalbeauOrderId({
      customerPhone: userProfile.phone,
      customerOrdersCount: orders.filter(o => o.phone === userProfile.phone).length,
      existingOrders: orders,
      supabaseClient: supabase,
      creationDate: now
    });

    const orderItems = cart.map(item => ({
      product: item.product,
      quantity: item.quantity,
      shade: item.shade || null,
      unitPrice: getRolePrice(item.product, userRole, item.shade, item.quantity),
      status: 'placed'
    }));

    const formattedOrder = {
      id: newOrderId,
      userName: userProfile.name || 'Customer',
      phone: userProfile.phone || '',
      avatar: '',
      itemDescription: orderItems.map(i => `${i.product?.name || 'Item'}${i.shade ? ` - ${i.shade.name}` : ''} (x${i.quantity})`).join(', ') || 'Cosmetics Package',
      userRole: userRole === 'salon' ? 'Salon Owner' : userRole === 'artist' ? 'Makeup Artist' : userRole === 'beautician' ? 'Beautician' : 'General Retail',
      branch: branch || selectedBranch || 'MG Road Branch',
      deliveryType: deliveryType || 'delivery',
      deliveryAddress: address || userProfile.address || '',
      deliveryInstructions: finalInstructions,
      totalAmount: cartSubtotal,
      status: 'placed',
      rejectionReason: '',
      placedAt: now.toLocaleString(),
      date: now.toISOString(),
      items: orderItems
    };

    setOrders(prev => [formattedOrder, ...prev]);

    try {
      const orderPayload = {
        id: newOrderId,
        user_name: formattedOrder.userName,
        phone: formattedOrder.phone,
        avatar: formattedOrder.avatar,
        item_description: formattedOrder.itemDescription,
        user_role: formattedOrder.userRole,
        branch: formattedOrder.branch,
        delivery_type: formattedOrder.deliveryType,
        delivery_address: formattedOrder.deliveryAddress,
        delivery_instructions: finalInstructions,
        total_amount: formattedOrder.totalAmount,
        status: 'placed',
        placed_at: formattedOrder.placedAt,
        date: formattedOrder.date,
        items: formattedOrder.items
      };

      const { error: insErr } = await supabase.from('orders').insert(orderPayload);
      if (insErr) {
        // Fallback for legacy DB schema before migration is applied
        const { delivery_instructions, ...fallbackOrder } = orderPayload;
        const { error: fallbackErr } = await supabase.from('orders').insert(fallbackOrder);
        if (fallbackErr) {
          console.error('Error writing order to Supabase:', fallbackErr);
        }
      }
    } catch (e) {
      console.error('Error writing order to Supabase:', e);
    }

    // Task 4: Mark abandoned cart as Converted/Completed
    const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
    try {
      await supabase.from('abandoned_carts').upsert({
        id: `cart_${userId}`,
        user_id: userId,
        user_name: userProfile?.name || 'Customer',
        phone: userProfile?.phone || '',
        user_role: userRole || 'general',
        items: orderItems,
        cart_value: cartSubtotal,
        item_count: cart.reduce((s, i) => s + i.quantity, 0),
        status: 'converted',
        order_id: newOrderId,
        converted_at: now.toISOString(),
        updated_at: now.toISOString()
      });
    } catch (e) {
      console.warn('Error updating converted abandoned cart in Supabase:', e);
    }

    clearCart();

    // Trigger Mobile System Tray Notification for Order Placed
    displayLocalNotification(
      'Order Placed Successfully! 🎉',
      `Your makeup order #${newOrderId} for ₹${Number(formattedOrder.totalAmount || 0).toLocaleString('en-IN')} has been placed. We are preparing your beauty essentials!`,
      { orderId: newOrderId, screen: 'order_details', eventType: 'order_placed' }
    ).catch(() => {});

    // Save notification to backend database for auditing & delivery logs
    supabase.from('notifications').insert({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      target: 'customer',
      title: 'Order Placed Successfully! 🎉',
      message: `Your makeup order #${newOrderId} for ₹${Number(formattedOrder.totalAmount || 0).toLocaleString('en-IN')} has been placed.`,
      type: 'order_status',
      data: { orderId: newOrderId, orderNumber: newOrderId, eventType: 'order_placed' },
      is_read: false,
      created_at: now.toISOString()
    }).catch(() => {});

    return formattedOrder;
  };

  // Task 2: 60-Minute Edit & Cancel Window with Server/Database Verification
  const cancelSpecificOrderItem = async (orderId, itemIndex) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.items || !targetOrder.items[itemIndex]) return { success: false, reason: 'Order or item not found' };

    const targetItem = targetOrder.items[itemIndex];
    if (targetItem.status === 'delivered' || targetItem.status === 'rejected') {
      return { success: false, reason: 'Delivered or rejected items cannot be cancelled' };
    }

    // Enforce 60-Minute Grace Window with Database-level validation
    let orderDateMs = new Date(targetOrder.date || targetOrder.placedAt).getTime();
    try {
      const { data: dbOrder } = await supabase.from('orders').select('date, status').eq('id', orderId).single();
      if (dbOrder && dbOrder.date) {
        orderDateMs = new Date(dbOrder.date).getTime();
      }
    } catch (e) {}

    const elapsedMs = Date.now() - orderDateMs;
    const isWithin60MinWindow = !isNaN(orderDateMs) && elapsedMs <= 60 * 60 * 1000;

    if (!isWithin60MinWindow) {
      return { success: false, reason: '60-minute cancellation grace window has expired. Modifications are no longer permitted.' };
    }

    const updatedItems = [...targetOrder.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      status: 'cancelled'
    };

    const newOverallStatus = computeOverallOrderStatus(updatedItems, targetOrder.status);
    setConsecutiveCancels(prev => prev + 1);

    const updatedFields = {
      items: updatedItems,
      status: newOverallStatus
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      const { error: dbError } = await supabase.from('orders').update({
        items: updatedItems,
        status: newOverallStatus
      }).eq('id', orderId);
      if (dbError) throw dbError;
    } catch (e) {
      console.warn('Error cancelling item in Supabase:', e);
      return { success: false, reason: e.message || 'Database error while cancelling item' };
    }

    return { success: true };
  };

  const requestCancelOrder = (orderId) => {
    if (consecutiveCancels + 1 >= 3) {
      setPendingCancelOrderId(orderId);
      setShowCancelWarningModal(true);
    } else {
      executeCancelOrder(orderId);
    }
  };

  const executeCancelOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, reason: 'Order not found' };

    // Enforce 60-Minute Grace Window with Database-level validation
    let orderDateMs = new Date(targetOrder.date || targetOrder.placedAt).getTime();
    try {
      const { data: dbOrder } = await supabase.from('orders').select('date, status').eq('id', orderId).single();
      if (dbOrder && dbOrder.date) {
        orderDateMs = new Date(dbOrder.date).getTime();
      }
    } catch (e) {}

    const elapsedMs = Date.now() - orderDateMs;
    const isWithin60MinWindow = !isNaN(orderDateMs) && elapsedMs <= 60 * 60 * 1000;

    if (!isWithin60MinWindow) {
      return { success: false, reason: '60-minute cancellation grace window has expired. Order can no longer be cancelled.' };
    }

    const updatedItems = (targetOrder?.items || []).map(i => ({ ...i, status: 'cancelled' }));

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled', items: updatedItems } : o)));
    setConsecutiveCancels(prev => prev + 1);
    setShowCancelWarningModal(false);
    setPendingCancelOrderId(null);

    try {
      const { error: dbError } = await supabase.from('orders').update({ status: 'cancelled', items: updatedItems }).eq('id', orderId);
      if (dbError) throw dbError;

      // Deliver directly to Android / iOS System Notification Tray
      displayLocalNotification(
        'Order Cancelled',
        `Your makeup order #${String(orderId).slice(-6)} has been cancelled.`,
        { orderId, screen: 'orders', eventType: 'cancelled' }
      ).catch(() => {});
    } catch (e) {
      console.warn('Error cancelling order in Supabase:', e);
      return { success: false, reason: e.message || 'Database error while cancelling order' };
    }

    return { success: true };
  };

  // Task 2: Edit Order Details (Address / Branch / Items / Mobile / Delivery Instructions) within 60-minute window
  const editOrder = async (orderId, { deliveryAddress, branch, items, phone, mobileNumber, deliveryInstructions }) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, reason: 'Order not found' };

    let orderDateMs = new Date(targetOrder.date || targetOrder.placedAt).getTime();
    try {
      const { data: dbOrder } = await supabase.from('orders').select('date, status').eq('id', orderId).single();
      if (dbOrder && dbOrder.date) {
        orderDateMs = new Date(dbOrder.date).getTime();
      }
    } catch (e) {}

    const elapsedMs = Date.now() - orderDateMs;
    if (isNaN(orderDateMs) || elapsedMs > 60 * 60 * 1000) {
      return { success: false, reason: '60-minute edit window has expired. Changes can no longer be saved.' };
    }

    const cleanPhone = phone !== undefined ? phone : mobileNumber;
    const updatedFields = {
      ...(deliveryAddress !== undefined ? { deliveryAddress } : {}),
      ...(branch !== undefined ? { branch } : {}),
      ...(items !== undefined ? { items } : {}),
      ...(cleanPhone !== undefined ? { phone: cleanPhone, mobileNumber: cleanPhone } : {}),
      ...(deliveryInstructions !== undefined ? { deliveryInstructions } : {})
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      const dbPayload = {
        ...(deliveryAddress !== undefined ? { delivery_address: deliveryAddress } : {}),
        ...(branch !== undefined ? { branch } : {}),
        ...(items !== undefined ? { items } : {}),
        ...(cleanPhone !== undefined ? { phone: cleanPhone } : {}),
        ...(deliveryInstructions !== undefined ? { delivery_instructions: deliveryInstructions } : {})
      };
      let { error: dbError } = await supabase.from('orders').update(dbPayload).eq('id', orderId);
      if (dbError && dbPayload.delivery_instructions) {
        const { delivery_instructions, ...fallbackPayload } = dbPayload;
        const res = await supabase.from('orders').update(fallbackPayload).eq('id', orderId);
        dbError = res.error;
      }
      if (dbError) throw dbError;
    } catch (e) {
      console.warn('Error updating order in Supabase:', e);
      return { success: false, reason: e.message || 'Database error while editing order' };
    }

    return { success: true };
  };

  const reorderOrderItems = (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    for (const item of order.items) {
      if (item.product) {
        addToCart(item.product, item.quantity || 1, item.selectedShade || null);
      }
    }
    setCurrentScreen('cart');
  };

  const setProtectedScreen = useCallback((targetScreen) => {
    if (userProfile?.isProfileComplete && (targetScreen === 'splash' || targetScreen === 'onboarding' || targetScreen === 'login' || targetScreen === 'otp')) {
      if (isB2BRole(userRole || userProfile?.role) && (!userProfile?.verificationStatus || userProfile?.verificationStatus === 'not_submitted')) {
        setCurrentScreen('b2b_verification');
        return;
      }
      setCurrentScreen('home');
      return;
    }
    setCurrentScreen(targetScreen);
  }, [userProfile?.isProfileComplete, userProfile?.verificationStatus, userRole]);

  const contextValue = {
        currentScreen,
        previousScreen,
        setCurrentScreen: setProtectedScreen,
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        addresses,
        setAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        brands,
        activeBrands,
        categories,
        subcategories,
        leafCategories,
        products,
        activeProducts,
        selectedBranch,
        setSelectedBranch,
        selectedProduct,
        setSelectedProduct,
        selectedShade,
        setSelectedShade,
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        searchQuery,
        setSearchQuery,
        globalSearchQuery,
        setGlobalSearchQuery,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        favorites,
        isFavorite,
        toggleFavorite,
        removeFromFavorites,
        clearFavorites,
        orders,
        placeOrder,
        requestCancelOrder,
        executeCancelOrder,
        editOrder,
        reorderOrderItems,
        cancelSpecificOrderItem,
        showCancelWarningModal,
        setShowCancelWarningModal,
        pendingCancelOrderId,
        getRolePrice,
        getApplicableTier,
        isB2BVerified,
        effectivePricingRole,
        userVerificationRecord,
        isVerificationSubmitting,
        submitUserB2BVerification,
        loadUserB2BVerification,
        pricingRules,
        setPricingRules,
        homeSectionVisibility,
        recommendationConfig,
        setRecommendationConfig,
        prefetchUserProfile,
        checkUserExistingProfile,
        lookupUserAccountsByPhone,
        loginWithAccount,
        setVerifiedPhoneForRegistration,
        saveUserProfile,
        refreshCatalog: fetchCatalog,
        logout,
        isRestoringSession,
        isCatalogLoading,
        productSalesCounts,
        homeBanners,
        activeBanners,
        allBanners,
        getCategoryBanner,
        getSubcategoryBanner,
        setHomeBanners,
        notifications,
        unreadNotificationsCount,
        orderStatusNotification,
        setOrderStatusNotification,
        dismissOrderStatusNotification,
        triggerLoginWelcomeNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        fetchNotifications,
        refreshNotifications: fetchNotifications,
        selectedOrderIdForDetails,
        setSelectedOrderIdForDetails,
        fetchUserOrders,
        refreshOrders: fetchUserOrders,
        shadeSheetState,
        openShadeSheet,
        closeShadeSheet,
        rememberSelectedShade,

  };


















  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
