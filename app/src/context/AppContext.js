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
import { generateSalbeauOrderId, getISTDateParts } from '../utils/orderIdUtils';
import { flattenProductsToIndividualVariants } from '../utils/productSearchEngine';
import {
  isB2BRole,
  isUserB2BVerified,
  getEffectivePricingRole,
  fetchUserVerificationRecord,
  submitB2BVerification as apiSubmitB2BVerification
} from '../utils/b2bVerificationService';

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
  const rawShades = parseShades(p.shades);
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

  return {
    id: p.id,
    name: p.name || '',
    brandId: p.brand_id || p.brandId || '',
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
    stock: Number(p.stock || 0),
    image: getSafeImageUri(p.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400'),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(addInfo.images) && addInfo.images.length > 0 ? addInfo.images : (p.image ? [p.image] : [])),
    shades: rawShades,
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
    rating: Number(p.rating || addInfo.rating || 4.5),
    reviewCount: Number(p.review_count || p.reviewCount || addInfo.reviewCount || addInfo.review_count || 120),
    isTrending: Boolean(p.is_trending ?? p.isTrending ?? addInfo.isTrending ?? addInfo.is_trending ?? false),
    trendingPriority: Number(p.trending_priority ?? p.trendingPriority ?? addInfo.trendingPriority ?? addInfo.trending_priority ?? 0),
    isFeatured: Boolean(p.is_featured ?? p.isFeatured ?? addInfo.isFeatured ?? addInfo.is_featured ?? false),
    featuredPriority: Number(p.featured_priority ?? p.featuredPriority ?? addInfo.featuredPriority ?? addInfo.featured_priority ?? 0),
    publishedAt: p.published_at || p.publishedAt || addInfo.publishedAt || addInfo.published_at || p.created_at || null,
    showInNewArrivals: Boolean(p.show_in_new_arrivals ?? p.showInNewArrivals ?? addInfo.showInNewArrivals ?? true),
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
  if (!items || items.length === 0) return currentOrderStatus;

  const statuses = items.map(i => (i.status || '').toLowerCase() || 'placed');

  const allPlaced = statuses.every(s => s === 'placed');
  if (allPlaced) return 'placed';

  const allDelivered = statuses.every(s => s === 'delivered');
  if (allDelivered) return 'delivered';

  const allRejected = statuses.every(s => s === 'rejected');
  if (allRejected) return 'rejected';

  const allCancelled = statuses.every(s => s === 'cancelled');
  if (allCancelled) return 'cancelled';

  const deliveredCount = statuses.filter(s => s === 'delivered').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const cancelledCount = statuses.filter(s => s === 'cancelled').length;
  const processingCount = statuses.filter(s => s === 'processing' || s === 'placed').length;

  if (deliveredCount > 0) {
    if (processingCount > 0) return 'partially_delivered';
    if (rejectedCount > 0 && cancelledCount === 0) return 'partially_delivered_rejected';
    if (cancelledCount > 0 && rejectedCount === 0) return 'partially_delivered_cancelled';
    return 'partially_delivered';
  }

  if (processingCount > 0) {
    return 'processing';
  }

  if (processingCount === 0) {
    if (rejectedCount >= cancelledCount) return 'rejected';
    return 'cancelled';
  }

  return currentOrderStatus;
};

const mapOrderFromDb = (o) => {
  const rawItems = o.items || [];
  const dbStatus = (o.status || 'placed').toLowerCase();

  const itemsWithStatus = rawItems.map(item => {
    let itemSt = item.status ? item.status.toLowerCase() : '';
    if (!itemSt) {
      itemSt = dbStatus.includes('partially') ? 'processing' : dbStatus;
    }
    return {
      ...item,
      status: itemSt,
      rejectionReason: item.rejectionReason || ''
    };
  });

  const computedStatus = computeOverallOrderStatus(itemsWithStatus, o.status || 'placed');

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
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    status: computedStatus,
    rejectionReason: o.rejection_reason || o.rejectionReason || '',
    placedAt: o.placed_at || o.placedAt,
    date: o.date,
    items: itemsWithStatus
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
    badge: 'BEAUTY ESSENTIALS',
    title: 'Glow Your Own Way',
    subtitle: 'Discover authentic beauty, salon & grooming formulations',
    ctaLabel: 'Shop Best Sellers →',
    destinationType: 'BEST_SELLERS',
    destinationId: 'best_sellers',
    imageUrl: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_1.jpg',
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

  const [currentScreen, setCurrentScreen] = useState(() => {
    return initialSession ? 'home' : 'splash';
  });
  const [userRole, setUserRole] = useState(() => {
    return initialSession?.role || initialSession?.profile?.role || 'general';
  });
  const [selectedBranch, setSelectedBranch] = useState('MG Road Branch');
  const [homeBanners, setHomeBanners] = useState(() => {
    try {
      const saved = storage.getSync('salbeau_home_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_HOME_BANNERS;
  });

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
        const saved = await storage.getItem(AUTH_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.phone && parsed.isProfileComplete) {
            if (isMounted) {
              if (parsed.profile) setUserProfile(parsed.profile);
              if (parsed.role) setUserRole(parsed.role);
              if (parsed.addresses && Array.isArray(parsed.addresses)) setAddresses(parsed.addresses);
              setCurrentScreen('home');
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
        // Returned to foreground: ensure authenticated user never drops into splash or onboarding
        if (userProfile?.isProfileComplete) {
          setCurrentScreen(prev => (prev === 'splash' || prev === 'onboarding' || prev === 'login' || prev === 'otp') ? 'home' : prev);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userProfile?.isProfileComplete]);

  // Continuously persist authenticated session whenever user profile updates
  useEffect(() => {
    if (userProfile?.isProfileComplete && userProfile?.phone) {
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
    }
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

  const [brands, setBrands] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [leafCategories, setLeafCategories] = useState([]);
  const [pricingRules, setPricingRules] = useState(DEFAULT_PRICING_RULES);
  const categories = useMemo(() => {
    return (rawCategories || []).filter(c => c.enabled !== false);
  }, [rawCategories]);
  const [products, setProducts] = useState([]);

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedShade, setSelectedShade] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [consecutiveCancels, setConsecutiveCancels] = useState(0);
  const [showCancelWarningModal, setShowCancelWarningModal] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState(null);
  const [productSalesCounts, setProductSalesCounts] = useState({});

  // Parallel fetch critical catalog data (brands, products, categories, subcategories)
  const fetchCatalog = useCallback(async () => {
    try {
      const [brandsRes, productsRes, categoriesRes, subcategoriesRes, storeOrdersRes] = await Promise.all([
        supabase.from('brands').select('id, name, enabled, logo'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('subcategories').select('*').order('sort_order', { ascending: true }),
        supabase.from('orders').select('id, items, status').order('date', { ascending: false }).limit(200)
      ]);

      if (storeOrdersRes && storeOrdersRes.data) {
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
            }
          } catch (e) {}
        }

        const visibilityRow = brandsData.find(b => b.id === 'app_home_section_visibility');
        if (visibilityRow && visibilityRow.logo) {
          try {
            const parsedVisibility = JSON.parse(visibilityRow.logo);
            if (parsedVisibility && typeof parsedVisibility === 'object') {
              setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
            }
          } catch (e) { }
        }

        const recRow = brandsData.find(b => b.id === 'app_recommendation_config');
        if (recRow && recRow.logo) {
          try {
            const parsedRec = JSON.parse(recRow.logo);
            if (parsedRec && typeof parsedRec === 'object') {
              setRecommendationConfig(prev => ({ ...prev, ...parsedRec }));
            }
          } catch (e) { }
        }

        const bannersRow = brandsData.find(b => b.id === 'app_home_banners');
        if (bannersRow && bannersRow.logo) {
          try {
            const parsedBanners = JSON.parse(bannersRow.logo);
            if (Array.isArray(parsedBanners) && parsedBanners.length > 0) {
              setHomeBanners(parsedBanners);
              storage.setItem('salbeau_home_banners', JSON.stringify(parsedBanners)).catch(() => {});
            }
          } catch (e) { }
        }

        setBrands(brandsData
          .filter(b => b.id !== 'app_category_order_config' && b.id !== 'app_brand_category_map' && b.id !== 'app_home_section_visibility' && b.id !== 'app_recommendation_config' && b.id !== 'app_pricing_discount_config' && b.id !== 'app_home_banners' && b.id !== 'salbeau_category_subcategory_hierarchy' && b.id !== 'salbeau_customer_search_requests')
          .map(b => ({
            id: b.id,
            name: b.name,
            enabled: b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0 && b.status !== 'hidden' && b.status !== 'disabled',
            logo: b.logo
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }))
        );

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
              }
              if (Array.isArray(parsedHier.leafCategories)) {
                setLeafCategories(parsedHier.leafCategories);
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
          hierSubs.forEach(hs => {
            if (!mergedSubs.some(ms => ms.id === hs.id || (ms.name && hs.name && ms.name.toLowerCase() === hs.name.toLowerCase()))) {
              mergedSubs.push(hs);
            }
          });
          mergedSubs.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setSubcategories(mergedSubs);
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

      // Merge categories from DB table and hierarchy config cleanly
      let dbCats = (categoriesRes && categoriesRes.data && categoriesRes.data.length > 0) ? categoriesRes.data.map(mapCategoryFromDb) : [];
      let finalCategories = [];

      if (dbCats.length > 0) {
        finalCategories = dbCats.map(dc => {
          const hMatch = hierarchyCategories.find(hc => hc.id === dc.id || (hc.name && dc.name && hc.name.toLowerCase() === dc.name.toLowerCase()));
          return {
            ...dc,
            image: dc.image || hMatch?.image || ''
          };
        });
        hierarchyCategories.forEach(hc => {
          if (!finalCategories.some(fc => fc.id === hc.id || (fc.name && hc.name && fc.name.toLowerCase() === hc.name.toLowerCase()))) {
            finalCategories.push(hc);
          }
        });
      } else if (hierarchyCategories.length > 0) {
        finalCategories = hierarchyCategories;
      }

      finalCategories.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      setRawCategories(finalCategories);

      if (productsRes.data) {
        setProducts(productsRes.data.map(mapProductFromDb).filter(Boolean));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('Supabase catalog fetch error:', err);
    }
  }, []);

  // Real-Time Subscriptions: Single consolidated subscription channel
  useEffect(() => {
    fetchCatalog();

    const channel = supabase
      .channel('app-realtime-sync')
      // 1. ORDERS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrderFromDb(payload.new);
          const cleanPhone = (userProfile?.phone || '').trim();
          const cleanName = (userProfile?.name || '').trim().toLowerCase();
          const isMyOrder = Boolean(
            !cleanPhone || !updatedOrder.phone ||
            (cleanPhone && updatedOrder.phone && updatedOrder.phone.trim() === cleanPhone) ||
            (cleanName && updatedOrder.userName && updatedOrder.userName.trim().toLowerCase() === cleanName)
          );
          if (isMyOrder) {
            setOrders(prev => {
              const idx = prev.findIndex(o => o.id === updatedOrder.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = updatedOrder;
                return copy;
              }
              return [updatedOrder, ...prev];
            });
          }
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
        if (u && (u.phone === userProfile?.phone || u.id === userProfile?.id)) {
          setUserProfile(prev => {
            const nextRole = u.role || prev.role || 'general';
            if (nextRole !== userRole) {
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
        if (v && (v.user_id === userProfile?.id || v.phone === userProfile?.phone)) {
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
          if (payload.new && payload.new.id === 'app_home_banners' && payload.new.logo) {
            try {
              const parsedBanners = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedBanners) && parsedBanners.length > 0) {
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
      // 6. PRODUCTS (instant sync for Add, Edit, Delete, Prices, Variants, Shades, Stock, Barcode, Images)
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
        const userId = userProfile?.id || ('u_' + (userProfile?.phone || '').replace(/\D/g, '')) || 'guest_user';
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
          // Connected
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Supabase Realtime] Reconnecting after status:', status, err);
          setTimeout(() => {
            fetchCatalog();
          }, 2500);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.phone, userProfile?.id, userRole, fetchCatalog]);

  // Load user orders in background on demand or user change
  useEffect(() => {
    const cleanPhone = (userProfile?.phone || '').trim();
    if (!cleanPhone) {
      setOrders([]);
      return;
    }

    let isMounted = true;
    const fetchUserOrders = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('phone', cleanPhone)
          .order('date', { ascending: false });

        if (isMounted && data) {
          setOrders(data.map(mapOrderFromDb));
        }
      } catch (err) { }
    };

    fetchUserOrders();
    return () => { isMounted = false; };
  }, [userProfile?.phone]);

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

  // Save completed user profile to Supabase and context, with persistent session
  const saveUserProfile = async ({ fullName, email, pincode, city, state }) => {
    const cleanPhone = (userProfile?.phone || '').trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const userId = userProfile?.id || 'u_' + cleanDigits;
    const fullAddress = `${city}, ${state} - ${pincode}`;

    const isB2B = isB2BRole(userRole);
    const initialStatus = isB2B ? (userProfile?.verificationStatus || 'not_submitted') : 'approved';
    const isB2BVer = isB2B ? Boolean(userProfile?.b2bVerified) : false;

    const updatedProfile = {
      ...userProfile,
      id: userId,
      name: fullName.trim(),
      phone: cleanPhone,
      email: (email || '').trim(),
      pincode: pincode.trim(),
      city: city.trim(),
      state: state.trim(),
      address: fullAddress,
      role: userRole || 'general',
      isProfileComplete: true,
      verificationStatus: initialStatus,
      b2bVerified: isB2BVer
    };

    setUserProfile(updatedProfile);

    // Warm cache immediately so any subsequent checks are 0ms
    if (cleanDigits) {
      profileCacheRef.current.set(cleanDigits, { isComplete: true, profile: updatedProfile });
    }

    // Update primary delivery address
    const primaryAddress = {
      id: `addr_${userId}`,
      label: 'Home',
      name: fullName.trim(),
      phone: cleanPhone,
      text: fullAddress,
      isDefault: true,
    };
    setAddresses([primaryAddress]);

    // Persist authenticated session
    const sessionData = {
      userId,
      phone: cleanPhone,
      role: userRole || 'general',
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
      const cleanBizName = userRole !== 'general' ? ((userProfile?.businessName || userProfile?.business_name) || `${fullName.trim()} Studio`) : null;

      const userPayload = {
        id: userId,
        name: fullName.trim(),
        full_name: fullName.trim(),
        phone: cleanPhone,
        email: (email || '').trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        role: userRole || 'general',
        business_name: cleanBizName,
        branch: `${city.trim()} Branch`,
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
          name: fullName.trim(),
          phone: cleanPhone,
          role: userRole || 'general',
          business_name: cleanBizName,
          branch: `${city.trim()} Branch`,
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
      await storage.removeItem(AUTH_SESSION_KEY);
      await storage.removeItem('salbeau_user_profile');
      await storage.removeItem('salbeau_cart');
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
    setCurrentScreen('onboarding');
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
    const disabledBrandIds = new Set();
    const disabledBrandNames = new Set();
    if (brands && brands.length > 0) {
      for (const b of brands) {
        if (!b.enabled) {
          if (b.id) disabledBrandIds.add(b.id);
          if (b.name) disabledBrandNames.add(b.name.trim().toLowerCase());
        }
      }
    }
    return products.filter(p => {
      if (p.enabled === false) return false;
      const st = (p.status || p.additionalInfo?.status || '').toLowerCase();
      if (['draft', 'unpublished', 'archived', 'inactive', 'disabled', 'hidden'].includes(st)) return false;
      if (p.brandId && disabledBrandIds.has(p.brandId)) return false;
      if (p.brandName && disabledBrandNames.has(p.brandName.trim().toLowerCase())) return false;
      return true;
    });
  }, [products, brands]);

  // Expose every valid, active, sellable variant independently as a catalog product
  // while preserving its relationship with the parent product family
  const activeProducts = useMemo(() => {
    return flattenProductsToIndividualVariants(activeProductFamilies);
  }, [activeProductFamilies]);

  const addToCart = (product, quantity = 1, shade = null) => {
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

    const variantKey = effectiveShade ? (effectiveShade.id || effectiveShade.sku || effectiveShade.name) : null;
    const cartItemId = variantKey ? `${parentProduct.id}_${variantKey}` : parentProduct.id;

    setCart(prev => {
      const existing = prev.find(item => (item.id === cartItemId || item.product?.id === cartItemId));
      if (existing) {
        return prev.map(item =>
          (item.id === cartItemId || item.product?.id === cartItemId) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cartItemId, product: parentProduct, quantity, shade: effectiveShade, variantId: variantKey }];
    });
  };

  const updateCartQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => ((item.id || item.product?.id) === cartItemId ? { ...item, quantity } : item)));
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => (item.id || item.product?.id) !== cartItemId));
  };

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

  const isFavorite = (productId) => {
    if (!productId) return false;
    return favorites.some(item => item.id === productId);
  };

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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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

  return (
    <AppContext.Provider
      value={{
        currentScreen,
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
        saveUserProfile,
        refreshCatalog: fetchCatalog,
        logout,
        isRestoringSession,
        productSalesCounts,
        homeBanners,
        activeBanners,
        setHomeBanners,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
