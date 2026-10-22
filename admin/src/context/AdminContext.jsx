import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../config/supabase';
import { normalizeQuantityTiers, getDefaultQuantityTiers } from '../utils/quantityTiersUtils';
import { fetchAllSearchRequests, updateSearchRequestStatus as apiUpdateStatus, deleteSearchRequest as apiDeleteRequest } from '../utils/customerSearchService';
import { generateAllRichData } from '../utils/productRichDataEngine';
import { getCachedBarcodeLookup, setCachedBarcodeLookup, normalizeBarcode } from '../utils/barcodeUtils';
import {
  fetchAllB2BVerifications,
  updateVerificationStatus as updateB2BVerificationStatusApi
} from '../utils/b2bVerificationService';
import { toSupabaseProductPayload } from '../services/productEngineService';

const AdminContext = createContext();

const initialCancelFeeSettings = {
  feeAmount: 250,
  graceWindowMinutes: 15,
  maxAllowedCancels: 3,
};

export const STATUS_META = {
  placed: {
    title: 'Order Placed',
    message: 'Your order has been received and queued for store acceptance.',
    adminLabel: 'Order Placed'
  },
  confirmed: {
    title: 'Order Confirmed',
    message: 'Store has verified and accepted your order.',
    adminLabel: 'Confirmed'
  },
  processing: {
    title: 'Processing Order',
    message: 'Store team is gathering and verifying your items.',
    adminLabel: 'Processing'
  },
  packing: {
    title: 'Packed & Sealed',
    message: 'Order items packed securely with quality seal.',
    adminLabel: 'Packed & Sealed'
  },
  ready_to_dispatch: {
    title: 'Ready for Dispatch',
    message: 'Package staged for courier pickup.',
    adminLabel: 'Ready for Dispatch'
  },
  out_for_delivery: {
    title: 'Out for Delivery',
    message: 'Delivery partner / rider is en route to customer.',
    adminLabel: 'Out for Delivery'
  },
  delivered: {
    title: 'Delivered',
    message: 'Order delivered successfully to customer.',
    adminLabel: 'Delivered'
  },
  completed: {
    title: 'Completed',
    message: 'Order successfully completed.',
    adminLabel: 'Completed'
  },
  partially_delivered: {
    title: 'Partially Delivered',
    message: 'Some items delivered. Remaining items arriving separately.',
    adminLabel: 'Partially Delivered'
  },
  partially_delivered_rejected: {
    title: 'Partially Delivered',
    message: 'Delivered available items. Remaining items unable to be fulfilled.',
    adminLabel: 'Partially Delivered (Unavailable Items)'
  },
  partially_delivered_cancelled: {
    title: 'Partially Delivered',
    message: 'Delivered available items. Remaining items cancelled.',
    adminLabel: 'Partially Delivered (Cancelled Items)'
  },
  cancelled: {
    title: 'Order Cancelled',
    message: 'Order cancelled.',
    adminLabel: 'Cancelled'
  },
  rejected: {
    title: 'Store Rejection',
    message: 'We were unable to fulfill this order.',
    adminLabel: 'Store Rejected'
  }
};

// Helper transformers between DB (snake_case) and App Model (camelCase)
export const computeOverallOrderStatus = (items, currentOrderStatus = 'placed') => {
  if (!items || items.length === 0) return currentOrderStatus;

  const statuses = items.map(i => (i.status || '').toLowerCase() || 'placed');

  const allPlaced = statuses.every(s => s === 'placed');
  if (allPlaced) return 'placed';

  const allDelivered = statuses.every(s => s === 'delivered' || s === 'completed');
  if (allDelivered) return 'delivered';

  const allRejected = statuses.every(s => s === 'rejected');
  if (allRejected) return 'rejected';

  const allCancelled = statuses.every(s => s === 'cancelled');
  if (allCancelled) return 'cancelled';

  const deliveredCount = statuses.filter(s => s === 'delivered' || s === 'completed').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const cancelledCount = statuses.filter(s => s === 'cancelled').length;
  const processingCount = statuses.filter(s => s === 'processing' || s === 'placed' || s === 'pending_fulfillment' || s === 'confirmed' || s === 'packing' || s === 'ready_to_dispatch' || s === 'out_for_delivery').length;

  if (deliveredCount > 0) {
    if (processingCount > 0) return 'partially_delivered';
    if (rejectedCount > 0 && cancelledCount === 0) return 'partially_delivered_rejected';
    if (cancelledCount > 0 && rejectedCount === 0) return 'partially_delivered_cancelled';
    return 'partially_delivered';
  }

  if (processingCount > 0) {
    if (['confirmed', 'packing', 'ready_to_dispatch', 'out_for_delivery', 'placed'].includes(currentOrderStatus)) {
      return currentOrderStatus;
    }
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

  // Parse status_history safely
  let parsedHistory = [];
  if (o.status_history) {
    if (Array.isArray(o.status_history)) parsedHistory = o.status_history;
    else if (typeof o.status_history === 'string') {
      try { parsedHistory = JSON.parse(o.status_history); } catch (e) { parsedHistory = []; }
    }
  }

  // Parse shipments safely
  let parsedShipments = [];
  if (o.shipments) {
    if (Array.isArray(o.shipments)) parsedShipments = o.shipments;
    else if (typeof o.shipments === 'string') {
      try { parsedShipments = JSON.parse(o.shipments); } catch (e) { parsedShipments = []; }
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
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    status: computedStatus,
    internalStatus: o.internal_status || 'new',
    rejectionReason: o.rejection_reason || o.rejectionReason || '',
    placedAt: o.placed_at || o.placedAt,
    date: o.date,
    deliveryInstructions: o.delivery_instructions || o.deliveryInstructions || '',
    items: itemsWithStatus,
    statusHistory: parsedHistory,
    shipments: parsedShipments,
    assignedEmployeeId: o.assigned_employee_id || null,
    assignedEmployeeName: o.assigned_employee_name || null,
    assignedAt: o.assigned_at || null
  };
};

const mapUserFromDb = (u) => {
  let email = u.email || '';
  let pincode = u.pincode || '';
  let city = u.city || '';
  let state = u.state || '';
  let cleanBusinessName = u.business_name || u.businessName || '';

  // Safe fallback if legacy business_name contains stuffed JSON metadata
  if (cleanBusinessName && cleanBusinessName.startsWith('{') && cleanBusinessName.includes('email')) {
    try {
      const parsed = JSON.parse(cleanBusinessName);
      if (!email && parsed.email) email = parsed.email;
      if (!pincode && parsed.pincode) pincode = parsed.pincode;
      if (!city && parsed.city) city = parsed.city;
      if (!state && parsed.state) state = parsed.state;
      cleanBusinessName = u.role !== 'general' ? `${u.name} Studio` : '';
    } catch (e) {}
  }

  return {
    id: u.id,
    name: u.name,
    fullName: u.full_name || u.name,
    phone: u.phone,
    email,
    pincode,
    city,
    state,
    role: u.role,
    businessName: cleanBusinessName,
    branch: u.branch,
    verificationStatus: u.verification_status || u.verificationStatus || 'not_submitted',
    b2bVerified: Boolean(u.b2b_verified ?? u.b2bVerified),
    verificationSubmittedAt: u.verification_submitted_at || u.verificationSubmittedAt || null,
    verificationApprovedAt: u.verification_approved_at || u.verificationApprovedAt || null,
    verificationRejectedAt: u.verification_rejected_at || u.verificationRejectedAt || null,
    verifiedBy: u.verified_by || u.verifiedBy || null,
    cancellationCount: u.cancellation_count || u.cancellationCount || 0,
    lastActive: u.last_active || u.lastActive,
    createdAt: u.created_at || u.createdAt || null
  };
};

const mapBrandFromDb = (b) => ({
  id: b.id,
  name: b.name,
  enabled: b.enabled !== false,
  logo: b.logo
});

const mapProductFromDb = (p) => ({
  id: p.id,
  name: p.name,
  brandId: p.brand_id || p.brandId,
  brandName: p.brand_name || p.brandName,
  category: p.category || '',
  subcategory: p.subcategory || p.sub_category || p.additional_info?.subcategory || '',
  variantType: p.variant_type || p.variantType || p.product_type || p.additional_info?.variant_type || p.additional_info?.variantType || '',
  description: p.description || p.how_to_use || p.additional_info?.description || p.additional_info?.how_to_use || '',
  size: p.additional_info?.size || p.specifications?.size || p.size || '',
  netQty: p.additional_info?.net_qty || p.specifications?.net_quantity || p.netQty || '',
  gstPercent: p.additional_info?.gst_percent ?? p.specifications?.gst_percent ?? p.gst ?? 18,
  attributes: p.additional_info?.attributes || p.specifications || {},
  barcode: p.barcode || '',
  mrp: Number(p.mrp || 0),
  generalPrice: Number(p.general_price !== undefined && p.general_price !== null ? p.general_price : (p.additional_info?.general_price ?? p.generalPrice ?? p.mrp ?? 0)),
  salonPrice: Number(p.salon_price || p.salonPrice || p.mrp || 0),
  artistPrice: Number(p.artist_price || p.artistPrice || p.mrp || 0),
  beauticianPrice: Number(p.beautician_price || p.beauticianPrice || p.mrp || 0),
  stock: Number(p.stock !== undefined && p.stock !== null ? p.stock : 0),
  image: p.image || (Array.isArray(p.additional_info?.images) ? p.additional_info.images[0] : ''),
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(p.additional_info?.images) ? p.additional_info.images : (p.image ? [p.image] : [])),
  shade: p.additional_info?.shade_name || (Array.isArray(p.shades) && p.shades[0]?.name) || '',
  hexColor: p.additional_info?.hex_color || (Array.isArray(p.shades) && p.shades[0]?.hex) || '',
  rgb: p.additional_info?.rgb || '',
  discountPercentages: (() => {
    if (p.discount_percentages && typeof p.discount_percentages === 'object') return p.discount_percentages;
    if (p.quantity_tiers?.roleDiscounts) return p.quantity_tiers.roleDiscounts;
    const base = Number(p.mrp || 0);
    const getDisc = (price) => {
      const pr = Number(price);
      if (base > 0 && pr > 0 && pr < base) {
        return Math.round((1 - pr / base) * 100);
      }
      return 0;
    };
    return {
      general: getDisc(p.general_price ?? p.generalPrice),
      salon: getDisc(p.salon_price ?? p.salonPrice),
      artist: getDisc(p.artist_price ?? p.artistPrice),
      beautician: getDisc(p.beautician_price ?? p.beauticianPrice)
    };
  })(),
  // Shade/color variants — stored as JSONB in products.shades
  shades: (() => {
    try {
      const raw = p.shades;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') return JSON.parse(raw);
      return [];
    } catch (e) { return []; }
  })(),
  // Per-product quantity discount tiers — stored as JSONB in products.quantity_tiers
  quantityTiers: (() => {
    try {
      const raw = p.quantity_tiers || p.quantityTiers;
      return normalizeQuantityTiers(raw);
    } catch (e) {
      return getDefaultQuantityTiers();
    }
  })(),
  // Purplle-style Rich Discovery & Product Hierarchy fields
  productFamily: p.product_family || p.productFamily || '',
  productType: p.product_type || p.productType || '',
  searchKeywords: (() => {
    try {
      if (Array.isArray(p.search_keywords)) return p.search_keywords;
      if (typeof p.search_keywords === 'string') return JSON.parse(p.search_keywords);
      if (Array.isArray(p.searchKeywords)) return p.searchKeywords;
      return [];
    } catch { return []; }
  })(),
  searchAliases: (() => {
    try {
      if (Array.isArray(p.search_aliases)) return p.search_aliases;
      if (typeof p.search_aliases === 'string') return JSON.parse(p.search_aliases);
      if (Array.isArray(p.searchAliases)) return p.searchAliases;
      return [];
    } catch { return []; }
  })(),
  keyPoints: (() => {
    try {
      if (Array.isArray(p.key_points)) return p.key_points;
      if (typeof p.key_points === 'string') return JSON.parse(p.key_points);
      if (Array.isArray(p.keyPoints)) return p.keyPoints;
      return [];
    } catch { return []; }
  })(),
  benefits: (() => {
    try {
      if (Array.isArray(p.benefits)) return p.benefits;
      if (typeof p.benefits === 'string') return JSON.parse(p.benefits);
      return [];
    } catch { return []; }
  })(),
  highlights: (() => {
    try {
      if (Array.isArray(p.highlights)) return p.highlights;
      if (typeof p.highlights === 'string') return JSON.parse(p.highlights);
      return [];
    } catch { return []; }
  })(),
  ingredients: (() => {
    try {
      if (p.ingredients && typeof p.ingredients === 'object') return p.ingredients;
      if (typeof p.ingredients === 'string') {
        try { return JSON.parse(p.ingredients); } catch { return { keyIngredients: [], fullList: p.ingredients }; }
      }
      return { keyIngredients: [], fullList: '' };
    } catch { return { keyIngredients: [], fullList: '' }; }
  })(),
  howToUse: p.how_to_use || p.howToUse || '',
  specifications: (() => {
    try {
      if (p.specifications && typeof p.specifications === 'object') return p.specifications;
      if (typeof p.specifications === 'string') return JSON.parse(p.specifications);
      return {};
    } catch { return {}; }
  })(),
  additionalInfo: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      if (raw && typeof raw === 'object') return raw;
      if (typeof raw === 'string') return JSON.parse(raw);
      return {};
    } catch { return {}; }
  })(),
  status: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return parsed.status || p.status || 'published';
    } catch { return p.status || 'published'; }
  })(),
  enabled: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      if (p.enabled !== undefined && p.enabled !== null) {
        return p.enabled !== false && p.enabled !== 'false' && p.enabled !== 0;
      }
      return parsed.enabled !== false && parsed.enabled !== 'false' && parsed.enabled !== 0;
    } catch { return true; }
  })(),
  isTrending: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Boolean(parsed.isTrending ?? p.is_trending);
    } catch { return Boolean(p.is_trending); }
  })(),
  trendingPriority: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Number(parsed.trendingPriority ?? p.trending_priority ?? 0);
    } catch { return 0; }
  })(),
  isFeatured: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Boolean(parsed.isFeatured ?? p.is_featured);
    } catch { return Boolean(p.is_featured); }
  })(),
  featuredPriority: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Number(parsed.featuredPriority ?? p.featured_priority ?? 0);
    } catch { return 0; }
  })(),
  rating: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Number(parsed.rating ?? p.rating ?? 4.8);
    } catch { return 4.8; }
  })(),
  reviewCount: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return Number(parsed.reviewCount ?? p.review_count ?? 120);
    } catch { return 120; }
  })(),
  publishedAt: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return parsed.publishedAt || p.published_at || p.created_at || null;
    } catch { return p.published_at || p.created_at || null; }
  })(),
  showInNewArrivals: (() => {
    try {
      const raw = p.additional_info || p.additionalInfo;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
      return parsed.showInNewArrivals !== false;
    } catch { return true; }
  })(),
  seoTitle: p.seo_title || p.seoTitle || '',
  metaDescription: p.meta_description || p.metaDescription || '',
  urlSlug: p.url_slug || p.urlSlug || ''
});

const INITIAL_CATEGORIES = [];

const generateCategorySlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const mapCategoryFromDb = (c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug || generateCategorySlug(c.name),
  description: c.description || '',
  icon: c.icon || '',
  image: c.image || c.image_url || '',
  image_url: c.image || c.image_url || '',
  color: c.color || '#FCE4EC',
  sort_order: Number(c.sort_order || c.sortOrder || c.display_order || 0),
  display_order: Number(c.sort_order || c.sortOrder || c.display_order || 0),
  enabled: c.enabled !== false && c.enabled !== 'false' && c.enabled !== 0,
  is_active: c.enabled !== false && c.enabled !== 'false' && c.enabled !== 0,
  show_in_mobile_app: c.show_in_mobile_app !== false,
  created_at: c.created_at || c.createdAt || null
});

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

// Default Pricing Rules: MRP → Role Discount → Role Base Price → Qty Discount → Final Price
export const DEFAULT_PRICING_RULES = {
  // Role base discount percentages off MRP
  roleDiscounts: {
    salon: 30,      // Salon Owner gets 30% off MRP
    artist: 35,     // Makeup Artist gets 35% off MRP
    beautician: 32, // Beautician gets 32% off MRP
  },
  // Quantity tiers: additional % off the role base price
  // Only applies to Salon Owner, Makeup Artist, Beautician (NOT General User)
  quantityTiers: [
    { label: '1–2 units',  minQty: 1,  maxQty: 2,  additionalDiscount: 0  },
    { label: '3–4 units',  minQty: 3,  maxQty: 4,  additionalDiscount: 3  },
    { label: '5–9 units',  minQty: 5,  maxQty: 9,  additionalDiscount: 6  },
    { label: '10+ units',  minQty: 10, maxQty: null, additionalDiscount: 10 },
  ],
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

export const AdminProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [homeBanners, setHomeBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_home_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_HOME_BANNERS;
  });
  const [cancelFeeSettings, setCancelFeeSettings] = useState(initialCancelFeeSettings);
  const [cancelledOrdersLog, setCancelledOrdersLog] = useState([]);
  const [homeSectionVisibility, setHomeSectionVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_home_section_visibility');
      if (saved) return { ...DEFAULT_HOME_SECTIONS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_HOME_SECTIONS;
  });
  const [recommendationConfig, setRecommendationConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_recommendation_config');
      if (saved) return { ...DEFAULT_RECOMMENDATION_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_RECOMMENDATION_CONFIG;
  });
  const [pricingRules, setPricingRules] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_pricing_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          roleDiscounts: { ...DEFAULT_PRICING_RULES.roleDiscounts, ...(parsed.roleDiscounts || {}) },
          quantityTiers: parsed.quantityTiers && parsed.quantityTiers.length > 0
            ? parsed.quantityTiers
            : DEFAULT_PRICING_RULES.quantityTiers,
        };
      }
    } catch (e) {}
    return DEFAULT_PRICING_RULES;
  });
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [searchRequests, setSearchRequests] = useState([]);
  const [searchRequestsLoading, setSearchRequestsLoading] = useState(false);
  const [b2bVerifications, setB2BVerifications] = useState([]);
  const [b2bLoading, setB2BLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeActivityLogs, setEmployeeActivityLogs] = useState([]);
  const [employeeOperations, setEmployeeOperations] = useState([]);
  const [currentAuthUser, setCurrentAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_auth_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'admin_root',
      email: 'admin@salbeau.com',
      role: 'admin',
      fullName: 'System Administrator',
      permissions: null,
    };
  });
  const [stockAuditLogs, setStockAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_stock_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch initial data and subscribe to real-time updates via Supabase
  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [ordersRes, usersRes, brandsRes, productsRes, categoriesRes, cartsRes] = await Promise.all([
        supabase.from('orders').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('abandoned_carts').select('*').order('updated_at', { ascending: false })
      ]);

        if (ordersRes.data) setOrders(ordersRes.data.map(mapOrderFromDb));
        if (usersRes.data) setUsers(usersRes.data.map(mapUserFromDb));
        if (cartsRes && cartsRes.data) setAbandonedCarts(cartsRes.data);
        if (brandsRes.data) {
          const configRow = brandsRes.data.find(b => b.id === 'app_category_order_config');
          if (configRow && configRow.logo) {
            try {
              const parsedCatList = JSON.parse(configRow.logo);
              if (Array.isArray(parsedCatList) && parsedCatList.length > 0) {
                setCategories(parsedCatList);
              }
            } catch (e) {
              console.warn('Error parsing category config from brands:', e);
            }
          }

          const mapRow = brandsRes.data.find(b => b.id === 'app_brand_category_map');
          let categoryDict = {};
          if (mapRow && mapRow.logo) {
            try {
              categoryDict = JSON.parse(mapRow.logo);
            } catch (e) {}
          }

          const visibilityRow = brandsRes.data.find(b => b.id === 'app_home_section_visibility');
          if (visibilityRow && visibilityRow.logo) {
            try {
              const parsedVisibility = JSON.parse(visibilityRow.logo);
              if (parsedVisibility && typeof parsedVisibility === 'object') {
                setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
                try {
                  localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(parsedVisibility));
                } catch (e) {}
              }
            } catch (e) {
              console.warn('Error parsing home section visibility from brands:', e);
            }
          }

          const recRow = brandsRes.data.find(b => b.id === 'app_recommendation_config');
          if (recRow && recRow.logo) {
            try {
              const parsedRec = JSON.parse(recRow.logo);
              if (parsedRec && typeof parsedRec === 'object') {
                setRecommendationConfig(prev => ({ ...prev, ...parsedRec }));
                try {
                  localStorage.setItem('salbeau_recommendation_config', JSON.stringify(parsedRec));
                } catch (e) {}
              }
            } catch (e) {
              console.warn('Error parsing recommendation config from brands:', e);
            }
          }

          const pricingRow = brandsRes.data.find(b => b.id === 'app_pricing_discount_config');
          if (pricingRow && pricingRow.logo) {
            try {
              const parsedPricing = JSON.parse(pricingRow.logo);
              if (parsedPricing && typeof parsedPricing === 'object') {
                const merged = {
                  roleDiscounts: { ...DEFAULT_PRICING_RULES.roleDiscounts, ...(parsedPricing.roleDiscounts || {}) },
                  quantityTiers: parsedPricing.quantityTiers && parsedPricing.quantityTiers.length > 0
                    ? parsedPricing.quantityTiers
                    : DEFAULT_PRICING_RULES.quantityTiers,
                };
                setPricingRules(merged);
                try {
                  localStorage.setItem('salbeau_pricing_rules', JSON.stringify(merged));
                } catch (e) {}
              }
            } catch (e) {
              console.warn('Error parsing pricing config from brands:', e);
            }
          }

          const searchRequestsRow = brandsRes.data.find(b => b.id === 'salbeau_customer_search_requests');
          if (searchRequestsRow && searchRequestsRow.logo) {
            try {
              const parsedRequests = JSON.parse(searchRequestsRow.logo);
              if (Array.isArray(parsedRequests)) {
                setSearchRequests(parsedRequests);
              }
            } catch (e) {
              console.warn('Error parsing customer search requests from brands:', e);
            }
          }

          const bannersRow = brandsRes.data.find(b => b.id === 'app_home_banners');
          if (bannersRow && bannersRow.logo) {
            try {
              const parsedBanners = JSON.parse(bannersRow.logo);
              if (Array.isArray(parsedBanners)) {
                setHomeBanners(parsedBanners);
                try {
                  localStorage.setItem('salbeau_home_banners', JSON.stringify(parsedBanners));
                } catch (e) {}
              }
            } catch (e) {
              console.warn('Error parsing home banners from brands:', e);
            }
          }

          setBrands(brandsRes.data
            .filter(b => 
              b.id !== 'app_category_order_config' && 
              b.id !== 'app_brand_category_map' && 
              b.id !== 'app_home_section_visibility' && 
              b.id !== 'app_recommendation_config' && 
              b.id !== 'app_pricing_discount_config' &&
              b.id !== 'app_home_banners' &&
              b.id !== 'salbeau_category_subcategory_hierarchy' &&
              b.id !== 'salbeau_customer_search_requests'
            )
            .map(b => ({
              ...mapBrandFromDb(b),
              category: categoryDict[b.name] || b.category || 'General'
            }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }))
          );
        }
        if (productsRes.data) setProducts(productsRes.data.map(mapProductFromDb));
        if (categoriesRes && categoriesRes.data) {
          setCategories(categoriesRes.data.map(mapCategoryFromDb).sort((a, b) => a.sort_order - b.sort_order));
        }

        // Also attempt direct fetch for customer_search_requests if dedicated table exists
        try {
          const directReqs = await fetchAllSearchRequests();
          if (Array.isArray(directReqs) && directReqs.length > 0) {
            setSearchRequests(directReqs);
          }
        } catch (e) {}

        // Fetch Employees and Employee Activity Logs
        try {
          const [empRes, logsRes] = await Promise.all([
            supabase.from('employees').select('*, employee_permissions(*)').order('created_at', { ascending: false }),
            supabase.from('employee_activity_logs').select('*').order('created_at', { ascending: false }).limit(200)
          ]);
          if (empRes.data) {
            setEmployees(empRes.data.map(emp => ({
              ...emp,
              permissions: emp.employee_permissions?.[0]?.permissions || {}
            })));
          }
          if (logsRes.data) {
            setEmployeeActivityLogs(logsRes.data);
          }
        } catch (empFetchErr) {
          console.warn('Employees / Activity logs fetch note:', empFetchErr);
        }

        // Fetch B2B Professional Verification Applications
        try {
          const verifs = await fetchAllB2BVerifications(supabase);
          if (Array.isArray(verifs)) {
            setB2BVerifications(verifs);
          }
        } catch (b2bFetchErr) {
          console.warn('B2B Verifications fetch note:', b2bFetchErr);
        }
      } catch (err) {
        console.warn('Supabase initial fetch error:', err);
        setFetchError(err.message || 'Failed to load database records');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchData();

      // Subscribe to Supabase Realtime Channels
      // Channel 1: Core operational tables (always present in database)
      const coreChannel = supabase
      .channel('admin-core-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrderFromDb(payload.new);
          setOrders(prev => {
            const index = prev.findIndex(o => o.id === updatedOrder.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedOrder;
              return copy;
            }
            return [updatedOrder, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDb(payload.new);
          setUsers(prev => {
            const index = prev.findIndex(u => u.id === updatedUser.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedUser;
              return copy;
            }
            return [...prev, updatedUser];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.id === 'app_category_order_config' && payload.new.logo) {
            try {
              const parsedCatList = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedCatList)) {
                setCategories(parsedCatList);
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_home_section_visibility' && payload.new.logo) {
            try {
              const parsedVisibility = JSON.parse(payload.new.logo);
              if (parsedVisibility && typeof parsedVisibility === 'object') {
                setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
                try {
                  localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(parsedVisibility));
                } catch (e) {}
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_recommendation_config' && payload.new.logo) {
            try {
              const parsedRec = JSON.parse(payload.new.logo);
              if (parsedRec && typeof parsedRec === 'object') {
                setRecommendationConfig(prev => ({ ...prev, ...parsedRec }));
                try {
                  localStorage.setItem('salbeau_recommendation_config', JSON.stringify(parsedRec));
                } catch (e) {}
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_brand_category_map') {
            return;
          }
          if (payload.new && payload.new.id === 'salbeau_customer_search_requests') {
            if (payload.new.logo) {
              try {
                const parsed = JSON.parse(payload.new.logo);
                if (Array.isArray(parsed)) {
                  setSearchRequests(parsed);
                }
              } catch (e) {}
            }
            return;
          }
          if (payload.new && payload.new.id === 'salbeau_category_subcategory_hierarchy' && payload.new.logo) {
            try {
              const parsedHier = JSON.parse(payload.new.logo);
              if (parsedHier && Array.isArray(parsedHier.categories)) {
                setCategories(parsedHier.categories.map(mapCategoryFromDb));
              }
            } catch (e) {}
            return;
          }
          if (
            payload.new?.id === 'app_category_order_config' ||
            payload.new?.id === 'app_home_section_visibility' ||
            payload.new?.id === 'app_recommendation_config' ||
            payload.new?.id === 'app_pricing_discount_config'
          ) {
            return;
          }
          const updatedBrand = mapBrandFromDb(payload.new);
          setBrands(prev => {
            const index = prev.findIndex(b => b.id === updatedBrand.id);
            let updatedList;
            if (index >= 0) {
              updatedList = [...prev];
              updatedList[index] = { ...updatedList[index], ...updatedBrand };
            } else {
              updatedList = [...prev, updatedBrand];
            }
            return updatedList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }));
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedProduct = mapProductFromDb(payload.new);
          setProducts(prev => {
            const index = prev.findIndex(p => p.id === updatedProduct.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedProduct;
              return copy;
            }
            return [updatedProduct, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old?.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_verifications' }, async () => {
        try {
          const fresh = await fetchAllB2BVerifications(supabase);
          if (Array.isArray(fresh)) {
            setB2BVerifications(fresh);
          }
        } catch (e) {}
      })
      .subscribe((status, err) => {
        if (err) console.warn('Supabase core realtime channel status:', status, err);
      });

    // Channel 2: Extended tables (categories & abandoned carts)
    const extChannel = supabase
      .channel('admin-extended-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abandoned_carts' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = payload.new;
          setAbandonedCarts(prev => {
            const idx = prev.findIndex(c => c.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [updated, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setAbandonedCarts(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedCat = mapCategoryFromDb(payload.new);
          setCategories(prev => {
            const index = prev.findIndex(c => c.id === updatedCat.id);
            let nextList = [...prev];
            if (index >= 0) {
              nextList[index] = updatedCat;
            } else {
              nextList.push(updatedCat);
            }
            return nextList.sort((a, b) => a.sort_order - b.sort_order);
          });
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe((status, err) => {
        if (err) console.warn('Supabase extended realtime channel status (categories/abandoned_carts):', status, err);
      });

    // Channel 3: Employees, Permissions & Activity Logs Realtime
    const empChannel = supabase
      .channel('admin-employees-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, async () => {
        const { data } = await supabase.from('employees').select('*, employee_permissions(*)').order('created_at', { ascending: false });
        if (data) {
          setEmployees(data.map(emp => ({
            ...emp,
            permissions: emp.employee_permissions?.[0]?.permissions || {}
          })));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_permissions' }, async () => {
        const { data } = await supabase.from('employees').select('*, employee_permissions(*)').order('created_at', { ascending: false });
        if (data) {
          setEmployees(data.map(emp => ({
            ...emp,
            permissions: emp.employee_permissions?.[0]?.permissions || {}
          })));
          // Realtime permission sync for current active session
          setCurrentAuthUser(prev => {
            if (!prev || prev.role !== 'employee') return prev;
            const matching = data.find(e => e.id === prev.id || e.email === prev.email);
            if (matching) {
              const updated = {
                ...prev,
                permissions: matching.employee_permissions?.[0]?.permissions || {}
              };
              try { localStorage.setItem('salbeau_auth_session', JSON.stringify(updated)); } catch (e) {}
              return updated;
            }
            return prev;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_activity_logs' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEmployeeActivityLogs(prev => [payload.new, ...prev.slice(0, 199)]);
        }
      })
      .subscribe((status, err) => {
        if (err) console.warn('Supabase employee realtime channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(coreChannel);
      supabase.removeChannel(extChannel);
      supabase.removeChannel(empChannel);
    };
  }, []);

  const toggleBrandStatus = async (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    const newStatus = !brand.enabled;
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, enabled: newStatus } : b)));
    try {
      await supabase.from('brands').upsert({
        id: brandId,
        name: brand.name,
        enabled: newStatus,
        logo: brand.logo
      });
    } catch (e) {
      console.warn('Error toggling brand in Supabase:', e);
    }
  };

  const addBrand = async (newBrand) => {
    const brandId = 'b_' + Date.now();
    const isEnabled = newBrand.enabled !== false && newBrand.enabled !== 'false' && newBrand.enabled !== 0;
    const brandObj = { ...newBrand, id: brandId, enabled: isEnabled };
    setBrands(prev => {
      const next = [...prev, brandObj];
      return next.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }));
    });
    try {
      await supabase.from('brands').insert({
        id: brandId,
        name: brandObj.name,
        enabled: isEnabled,
        logo: brandObj.logo || ''
      });
    } catch (e) {
      console.warn('Error adding brand to Supabase:', e);
    }
  };

  const updateBrand = async (brandId, updatedFields) => {
    const isEnabled = updatedFields.enabled !== undefined
      ? (updatedFields.enabled !== false && updatedFields.enabled !== 'false' && updatedFields.enabled !== 0)
      : undefined;

    setBrands(prev => prev.map(b => {
      if (b.id === brandId) {
        return {
          ...b,
          ...updatedFields,
          ...(isEnabled !== undefined ? { enabled: isEnabled } : {})
        };
      }
      return b;
    }));

    try {
      const payload = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.logo !== undefined) payload.logo = updatedFields.logo;
      if (isEnabled !== undefined) payload.enabled = isEnabled;

      await supabase.from('brands').update(payload).eq('id', brandId);
    } catch (e) {
      console.warn('Error updating brand in Supabase:', e);
    }
  };

  const checkBarcodeInSupabase = async (barcode, excludeProductId = null) => {
    const cleanBarcode = normalizeBarcode(barcode);
    if (!cleanBarcode) return { exists: false, product: null };

    // 1. Fast In-Memory Cache Check (0ms response)
    const cacheKey = `chk_${cleanBarcode.toLowerCase()}_${excludeProductId || 'all'}`;
    const cached = getCachedBarcodeLookup(cacheKey);
    if (cached) return cached;

    try {
      // 2. Fast in-memory check against local products state (parent barcode, category, or shades)
      const localMatch = products.find(p =>
        (excludeProductId ? p.id !== excludeProductId : true) &&
        ((p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase()) ||
         (p.category && p.category.trim().toLowerCase() === cleanBarcode.toLowerCase()) ||
         (Array.isArray(p.shades) && p.shades.some(s => s.barcode && s.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase())))
      );
      if (localMatch) {
        const result = { exists: true, product: localMatch };
        setCachedBarcodeLookup(cacheKey, result);
        return result;
      }

      // 3. Database indexed lookup on 'products' table querying only required columns
      try {
        let bQuery = supabase
          .from('products')
          .select('id, name, brand_name, barcode, category, mrp, general_price, shades')
          .eq('barcode', cleanBarcode)
          .limit(1);
        if (excludeProductId) {
          bQuery = bQuery.neq('id', excludeProductId);
        }
        const { data: barcodeMatches, error: bErr } = await bQuery;
        if (!bErr && barcodeMatches && barcodeMatches.length > 0) {
          const result = { exists: true, product: barcodeMatches[0] };
          setCachedBarcodeLookup(cacheKey, result);
          return result;
        }
      } catch (e) {}

      // 4. Check category column fallback
      let catQuery = supabase
        .from('products')
        .select('id, name, brand_name, category, barcode, mrp, general_price, shades')
        .eq('category', cleanBarcode)
        .limit(1);
      if (excludeProductId) {
        catQuery = catQuery.neq('id', excludeProductId);
      }
      const { data: catMatches, error: catErr } = await catQuery;

      if (!catErr && catMatches && catMatches.length > 0) {
        const result = { exists: true, product: catMatches[0] };
        setCachedBarcodeLookup(cacheKey, result);
        return result;
      }

      const notFoundResult = { exists: false, product: null };
      setCachedBarcodeLookup(cacheKey, notFoundResult);
      return notFoundResult;
    } catch (err) {
      console.warn('Error validating barcode in Supabase:', err);
      const localMatch = products.find(p =>
        (excludeProductId ? p.id !== excludeProductId : true) &&
        ((p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase()) ||
         (p.category && p.category.trim().toLowerCase() === cleanBarcode.toLowerCase()))
      );
      return { exists: Boolean(localMatch), product: localMatch || null };
    }
  };

  /**
   * searchProductByBarcode — optimized live Supabase lookup with instant in-memory cache.
   * Checks:
   *   1. In-memory LRU cache (0ms)
   *   2. Local products state (parent + variant barcodes) (<1ms)
   *   3. Indexed products.barcode column query in Supabase
   *
   * Returns:
   *   { exists: boolean, product: FullProductObj|null, matchType: 'parent'|'variant',
   *     isVariantMatch: boolean, matchedVariant: ShadeObj|null }
   */
  const searchProductByBarcode = async (barcode) => {
    const cleanBarcode = normalizeBarcode(barcode);
    if (!cleanBarcode) return { exists: false, product: null, matchType: null, isVariantMatch: false, matchedVariant: null };

    // 1. Fast Cache Check
    const cacheKey = `search_${cleanBarcode.toLowerCase()}`;
    const cached = getCachedBarcodeLookup(cacheKey);
    if (cached) return cached;

    const trimmed = cleanBarcode.toLowerCase();

    try {
      // 2. Check local products state in memory first (<1ms)
      const localParent = products.find(
        p => p.barcode && p.barcode.trim().toLowerCase() === trimmed
      );
      if (localParent) {
        const res = {
          exists: true,
          product: localParent,
          matchType: 'parent',
          isVariantMatch: false,
          matchedVariant: null
        };
        setCachedBarcodeLookup(cacheKey, res);
        return res;
      }

      // Check variant barcodes in memory
      const localVariantMatch = products.find(p =>
        Array.isArray(p.shades) &&
        p.shades.some(s => s.barcode && s.barcode.trim().toLowerCase() === trimmed)
      );

      if (localVariantMatch) {
        const matchedVariant = localVariantMatch.shades.find(
          s => s.barcode && s.barcode.trim().toLowerCase() === trimmed
        );
        const res = {
          exists: true,
          product: localVariantMatch,
          matchType: 'variant',
          isVariantMatch: true,
          matchedVariant
        };
        setCachedBarcodeLookup(cacheKey, res);
        return res;
      }

      // 3. Check parent barcode column in Supabase (indexed lookup with limit 1)
      const { data: parentMatches, error: pErr } = await supabase
        .from('products')
        .select('*')
        .ilike('barcode', trimmed)
        .limit(1);

      if (!pErr && parentMatches && parentMatches.length > 0) {
        const raw = parentMatches[0];
        const mapped = mapProductFromDb(raw);
        const res = {
          exists: true,
          product: mapped,
          matchType: 'parent',
          isVariantMatch: false,
          matchedVariant: null
        };
        setCachedBarcodeLookup(cacheKey, res);
        return res;
      }

      // 4. Scan products for variant barcodes if not found
      const { data: allProducts, error: allErr } = await supabase
        .from('products')
        .select('*')
        .limit(300);

      if (!allErr && Array.isArray(allProducts)) {
        for (const raw of allProducts) {
          const shadesArr = (() => {
            try {
              if (!raw.shades) return [];
              if (Array.isArray(raw.shades)) return raw.shades;
              return JSON.parse(raw.shades);
            } catch { return []; }
          })();
          const matchedVariant = shadesArr.find(
            s => s.barcode && s.barcode.trim().toLowerCase() === trimmed
          );
          if (matchedVariant) {
            const mapped = mapProductFromDb(raw);
            const res = {
              exists: true,
              product: mapped,
              matchType: 'variant',
              isVariantMatch: true,
              matchedVariant
            };
            setCachedBarcodeLookup(cacheKey, res);
            return res;
          }
        }
      }

      const notFoundRes = { exists: false, product: null, matchType: null, isVariantMatch: false, matchedVariant: null };
      setCachedBarcodeLookup(cacheKey, notFoundRes);
      return notFoundRes;
    } catch (err) {
      console.warn('searchProductByBarcode error:', err);
      // Fallback to local memory
      const localParent = products.find(
        p => p.barcode && p.barcode.trim().toLowerCase() === trimmed
      );
      if (localParent) {
        return { exists: true, product: localParent, matchType: 'parent', isVariantMatch: false, matchedVariant: null };
      }
      const localVariant = products.find(p =>
        Array.isArray(p.shades) &&
        p.shades.some(s => s.barcode && s.barcode.trim().toLowerCase() === trimmed)
      );
      if (localVariant) {
        const matchedVariant = localVariant.shades.find(
          s => s.barcode && s.barcode.trim().toLowerCase() === trimmed
        );
        return { exists: true, product: localVariant, matchType: 'variant', isVariantMatch: true, matchedVariant };
      }
      return { exists: false, product: null, matchType: null, isVariantMatch: false, matchedVariant: null };
    }
  };

  const addProduct = async (newProduct, isDirectAdminWrite = false) => {
    // If current actor is an employee without direct publish permission, stage operation for Admin approval
    if (currentAuthUser?.role === 'employee' && !isDirectAdminWrite) {
      const staged = await stageEmployeeOperation({
        operationType: 'CREATE_PRODUCT',
        module: 'products',
        entityType: 'product',
        entityId: newProduct.id || `p_${Date.now()}`,
        recordTitle: newProduct.name || 'New Product Submission',
        oldData: null,
        newData: newProduct
      });
      return { success: true, staged: true, message: 'Product submitted to Approval Center for Administrator review.', operation: staged.operation };
    }

    const barcodeVal = (newProduct.barcode || '').trim();
    if (barcodeVal) {
      const check = await checkBarcodeInSupabase(barcodeVal);
      if (check.exists) {
        throw new Error(`Barcode already exists on "${check.product?.name || 'existing catalog product'}"`);
      }
    }

    const resolvedBrandObj = brands.find(b =>
      (newProduct.brandId && b.id === newProduct.brandId) ||
      (newProduct.brandName && b.name?.trim().toLowerCase() === newProduct.brandName?.trim().toLowerCase())
    );
    const resolvedBrandId = newProduct.brandId || resolvedBrandObj?.id || '';
    const resolvedBrandName = newProduct.brandName || resolvedBrandObj?.name || '';

    // Auto-enable brand if it was disabled so products added under this brand will immediately show in the customer store!
    if (resolvedBrandObj && !resolvedBrandObj.enabled) {
      setBrands(prev => prev.map(b => (b.id === resolvedBrandObj.id ? { ...b, enabled: true } : b)));
      supabase.from('brands').update({ enabled: true }).eq('id', resolvedBrandObj.id).then(() => {});
    }

    const resolvedCategory = (newProduct.category || '').trim() ||
      resolvedBrandObj?.category ||
      'General';

    const productId = 'p_' + Date.now();
    const productObj = {
      ...newProduct,
      id: productId,
      barcode: barcodeVal,
      brandId: resolvedBrandId,
      brandName: resolvedBrandName,
      category: resolvedCategory
    };

    setProducts(prev => [productObj, ...prev]);

    const mrpVal = Number(productObj.mrp || 0);
    const genPriceVal = Number(productObj.generalPrice !== undefined && productObj.generalPrice !== '' ? productObj.generalPrice : mrpVal);

    const resolvedStatus = productObj.status || productObj.additionalInfo?.status || 'published';
    const resolvedEnabled = productObj.enabled !== false && productObj.enabled !== 'false' && productObj.enabled !== 0;

    // Merge general_price, status, enabled, subcategory, variant_type, description, size, net_qty, gst, attributes, images into additional_info
    const mergedAdditionalInfo = {
      ...(productObj.additionalInfo || {}),
      status: resolvedStatus,
      enabled: resolvedEnabled,
      general_price: genPriceVal,
      ...(productObj.subcategory ? { subcategory: productObj.subcategory } : {}),
      ...(productObj.variantType ? { variant_type: productObj.variantType } : {}),
      ...(productObj.description ? { description: productObj.description } : {}),
      ...(productObj.size ? { size: productObj.size } : {}),
      ...(productObj.netQty || productObj.net_qty ? { net_qty: productObj.netQty || productObj.net_qty } : {}),
      ...(productObj.gstPercent !== undefined || productObj.gst !== undefined ? { gst_percent: productObj.gstPercent ?? productObj.gst } : {}),
      ...(productObj.attributes ? { attributes: productObj.attributes } : {}),
      ...(Array.isArray(productObj.images) && productObj.images.length > 0 ? { images: productObj.images } : {})
    };

    const payload = {
      id: productId,
      name: productObj.name,
      parent_id: productObj.parent_id || productObj.parentId || null,
      brand_id: resolvedBrandId,
      brand_name: resolvedBrandName,
      category: resolvedCategory,
      mrp: mrpVal,
      general_price: genPriceVal,
      salon_price: Number(productObj.salonPrice || mrpVal),
      artist_price: Number(productObj.artistPrice || mrpVal),
      beautician_price: Number(productObj.beauticianPrice || mrpVal),
      stock: Number(productObj.stock !== undefined ? productObj.stock : 9999),
      image: productObj.image || (Array.isArray(productObj.images) && productObj.images[0] ? productObj.images[0] : '')
    };

    // Include shades if present
    const shadesPayload = productObj.shades && productObj.shades.length > 0
      ? { shades: productObj.shades }
      : {};

    // Include per-product quantity tiers if present (with roleDiscounts)
    const normalizedTiers = productObj.quantityTiers ? normalizeQuantityTiers(productObj.quantityTiers) : null;
    const tiersPayload = normalizedTiers
      ? {
          quantity_tiers: {
            ...normalizedTiers,
            ...(productObj.quantityTiers?.roleDiscounts || productObj.discountPercentages
              ? { roleDiscounts: productObj.quantityTiers?.roleDiscounts || productObj.discountPercentages }
              : {})
          }
        }
      : {};

    // Include discovery and rich data payload
    const extraDiscoveryPayload = {
      ...(productObj.searchKeywords?.length ? { search_keywords: productObj.searchKeywords } : {}),
      ...(productObj.searchAliases?.length ? { search_aliases: productObj.searchAliases } : {}),
      ...(productObj.keyPoints?.length ? { key_points: productObj.keyPoints } : {}),
      ...(productObj.benefits?.length ? { benefits: productObj.benefits } : {}),
      ...(productObj.highlights?.length ? { highlights: productObj.highlights } : {}),
      ...(productObj.ingredients ? { ingredients: productObj.ingredients } : {}),
      ...(productObj.howToUse || productObj.description ? { how_to_use: productObj.howToUse || productObj.description } : {}),
      ...(productObj.specifications ? { specifications: productObj.specifications } : {}),
      additional_info: mergedAdditionalInfo,
      ...(productObj.productType || productObj.variantType ? { product_type: productObj.productType || productObj.variantType } : {}),
      ...(productObj.productFamily ? { product_family: productObj.productFamily } : {}),
      ...(productObj.seoTitle ? { seo_title: productObj.seoTitle } : {}),
      ...(productObj.metaDescription ? { meta_description: productObj.metaDescription } : {}),
      ...(productObj.urlSlug ? { url_slug: productObj.urlSlug } : {})
    };

    // Helper that tries insert and automatically strips general_price, status, enabled, or parent_id if column is missing from schema cache
    const safeInsert = async (insertObj) => {
      let res = await supabase.from('products').insert(insertObj);
      if (res.error && (res.error.message?.includes('general_price') || res.error.message?.includes('status') || res.error.message?.includes('enabled') || res.error.message?.includes('parent_id') || res.error.code === 'PGRST204')) {
        const cleanObj = { ...insertObj };
        if (res.error.message?.includes('general_price')) delete cleanObj.general_price;
        if (res.error.message?.includes('status')) delete cleanObj.status;
        if (res.error.message?.includes('enabled')) delete cleanObj.enabled;
        if (res.error.message?.includes('parent_id')) delete cleanObj.parent_id;
        res = await supabase.from('products').insert(cleanObj);
      }
      return res;
    };

    try {
      let { error: insertErr } = await safeInsert({
        ...payload,
        ...shadesPayload,
        ...tiersPayload,
        ...extraDiscoveryPayload,
        barcode: barcodeVal
      });

      if (insertErr) {
        // Fallback 1: try inserting without extra discovery columns in case database table is pending migration
        const fallback1 = await safeInsert({
          ...payload,
          ...shadesPayload,
          ...tiersPayload,
          barcode: barcodeVal
        });
        insertErr = fallback1.error;
      }

      if (insertErr) {
        // Fallback 2: try inserting with barcode explicitly set (no discovery fields)
        const fallback2 = await safeInsert({
          ...payload,
          ...shadesPayload,
          ...tiersPayload,
          category: resolvedCategory
        });
        insertErr = fallback2.error;
      }

      if (insertErr) {
        // Fallback 3: without quantity_tiers
        const fallback3 = await safeInsert({
          ...payload,
          ...shadesPayload,
          category: resolvedCategory
        });
        insertErr = fallback3.error;
      }

      if (insertErr) {
        // Fallback 4: bare payload
        const fallback4 = await safeInsert({
          ...payload,
          category: resolvedCategory
        });
        insertErr = fallback4.error;
      }

      if (insertErr) {
        console.warn('Error inserting product in Supabase:', insertErr);
        throw insertErr;
      }

      // ── Background rich-data auto-generation ──────────────────────────────
      // Fire-and-forget: generate keywords, aliases, keyPoints, benefits,
      // highlights, SEO fields and upsert them back to Supabase.
      // Does NOT block the UI — runs after the page has already navigated away.
      setTimeout(async () => {
        try {
          const patch = generateAllRichData(productObj, { preserveExisting: false });
          const richPayload = {
            search_keywords:  patch.searchKeywords,
            search_aliases:   patch.searchAliases,
            key_points:       patch.keyPoints,
            benefits:         patch.benefits,
            highlights:       patch.highlights,
            seo_title:        patch.seoTitle   || undefined,
            meta_description: patch.metaDescription || undefined,
            url_slug:         patch.urlSlug    || undefined,
          };
          // Remove undefined keys so Supabase doesn't complain
          Object.keys(richPayload).forEach(k => richPayload[k] === undefined && delete richPayload[k]);
          await supabase.from('products').update(richPayload).eq('id', productId);
          // Reflect in local state so the details panel shows it immediately
          setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            return {
              ...p,
              searchKeywords:  patch.searchKeywords,
              searchAliases:   patch.searchAliases,
              keyPoints:       patch.keyPoints,
              benefits:        patch.benefits,
              highlights:      patch.highlights,
              seoTitle:        patch.seoTitle,
              metaDescription: patch.metaDescription,
              urlSlug:         patch.urlSlug,
            };
          }));
        } catch (genErr) {
          console.warn('[RichData] Background generation failed (non-fatal):', genErr);
        }
      }, 0);

      return { success: true, product: productObj };
    } catch (e) {
      console.warn('Error adding product to Supabase:', e);
      throw e;
    }
  };

  const saveBulkProducts = async (productsArray, onProgress) => {
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return { success: true, count: 0 };
    }

    const total = productsArray.length;
    let savedCount = 0;
    const chunkSize = 100;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = productsArray.slice(i, i + chunkSize);
      if (onProgress) {
        onProgress({
          current: i,
          total,
          percent: Math.round((i / total) * 100),
          text: `Saving products batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(total / chunkSize)} to database...`
        });
      }

      const payloads = chunk.map(row => {
        const id = row.id || row._id || ('p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        return toSupabaseProductPayload({ ...row, id });
      });

      try {
        const { error } = await supabase
          .from('products')
          .upsert(payloads, { onConflict: 'barcode', ignoreDuplicates: false });

        if (error) {
          console.warn('Batch upsert warning, fallback to row-by-row upsert:', error);
          for (const p of payloads) {
            try {
              const { error: singleErr } = await supabase.from('products').upsert(p, { onConflict: 'barcode' });
              if (!singleErr) savedCount++;
            } catch (err) {
              console.warn('Single product upsert error:', err);
            }
          }
        } else {
          savedCount += payloads.length;
        }
      } catch (err) {
        console.error('saveBulkProducts batch error:', err);
      }
    }

    if (onProgress) {
      onProgress({ current: total, total, percent: 100, text: 'Synchronizing Products Catalog...' });
    }

    // Instantly refresh products from Supabase so all newly imported products appear on the Products page!
    try {
      const { data: freshProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (freshProducts && Array.isArray(freshProducts)) {
        setProducts(freshProducts.map(mapProductFromDb));
      }
    } catch (err) {
      console.warn('Could not refresh products after bulk save:', err);
    }

    return { success: true, count: savedCount };
  };

  const uploadImage = async (fileOrBlob, folder = 'products', filenamePrefix = 'asset') => {
    if (!fileOrBlob) return null;
    // If it's already an uploaded HTTP/HTTPS URL, return as-is
    if (typeof fileOrBlob === 'string' && (fileOrBlob.startsWith('http://') || fileOrBlob.startsWith('https://'))) {
      return fileOrBlob;
    }
    try {
      const fileExt = fileOrBlob.name?.split('.').pop() || (fileOrBlob.type === 'image/webp' ? 'webp' : 'jpg');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const cleanFileName = `${filenamePrefix}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `${folder}/${cleanFileName}`;

      const primaryBucket = 'products';
      const fallbackBuckets = ['gc-home-assets', 'categories'];
      const bucketsToTry = [primaryBucket, ...fallbackBuckets];

      for (const bucketName of bucketsToTry) {
        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileOrBlob, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            const baseUrl = publicData?.publicUrl;
            if (baseUrl) return `${baseUrl}?v=${timestamp}`;
          }
        } catch (bErr) {
          // continue to next bucket
        }
      }

      console.error('Supabase storage upload failed across all buckets (products, gc-home-assets, categories).');
      throw new Error('Image storage upload failed across all buckets. Please verify storage permissions or upload an image file under 5MB.');
    } catch (e) {
      console.warn('Error in uploadImage:', e);
      throw e;
    }
  };

  const uploadProductImage = async (file) => {
    return uploadImage(file, 'products', 'prod');
  };

  const updateOrderStatus = async (orderId, newStatus, rejectionReason = '', customItems = null) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedItems = customItems && customItems.length > 0
      ? customItems
      : (targetOrder.items || []).map(item => ({
          ...item,
          status: newStatus,
          rejectionReason: newStatus === 'rejected' ? rejectionReason : (item.rejectionReason || '')
        }));

    const computedOverall = customItems ? computeOverallOrderStatus(updatedItems, newStatus) : newStatus;
    const meta = STATUS_META[computedOverall] || {
      title: computedOverall.replace(/_/g, ' ').toUpperCase(),
      message: 'Status updated to ' + computedOverall
    };

    const newHistoryEntry = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      status: computedOverall,
      title: meta.title,
      message: computedOverall === 'rejected' && rejectionReason ? rejectionReason : meta.message,
      timestamp: new Date().toISOString(),
      updatedBy: 'Admin'
    };

    const currentHistory = Array.isArray(targetOrder.statusHistory)
      ? targetOrder.statusHistory
      : (Array.isArray(targetOrder.status_history) ? targetOrder.status_history : []);
    const updatedHistory = [...currentHistory, newHistoryEntry];

    const updatedFields = {
      status: computedOverall,
      items: updatedItems,
      rejectionReason: (computedOverall === 'rejected' || newStatus === 'rejected') ? rejectionReason : (targetOrder?.rejectionReason || ''),
      statusHistory: updatedHistory,
      updated_at: new Date().toISOString()
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      const { error } = await supabase.from('orders').update({
        status: computedOverall,
        items: updatedItems,
        rejection_reason: updatedFields.rejectionReason,
        status_history: updatedHistory,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      if (error) {
        // Fallback in case updated_at column does not exist on orders table
        await supabase.from('orders').update({
          status: computedOverall,
          items: updatedItems,
          rejection_reason: updatedFields.rejectionReason,
          status_history: updatedHistory
        }).eq('id', orderId);
      }

      // Non-blocking write to order_status_history audit table
      try {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          status: computedOverall,
          title: newHistoryEntry.title,
          customer_message: newHistoryEntry.message,
          changed_by: 'store_admin',
          changed_at: newHistoryEntry.timestamp
        });
      } catch (histErr) {
        console.warn('order_status_history insert non-fatal notice:', histErr);
      }
    } catch (e) {
      console.warn('Error updating order status in Supabase:', e);
      throw e;
    }
  };

  const updateOrderItemStatus = async (orderId, itemIndex, newStatus, rejectionReason = '') => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.items[itemIndex]) return;

    const targetItem = targetOrder.items[itemIndex];
    const updatedItems = [...targetOrder.items];
    updatedItems[itemIndex] = {
      ...targetItem,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : (targetItem.rejectionReason || '')
    };

    const newOverallStatus = computeOverallOrderStatus(updatedItems, targetOrder.status);

    const friendlyItemName = targetItem.product?.name || targetItem.name || `Item #${itemIndex + 1}`;
    const newHistoryEntry = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      status: newOverallStatus,
      title: 'Item Fulfillment Update',
      message: `${friendlyItemName}: ${newStatus === 'pending_fulfillment' ? 'Arriving in separate delivery' : newStatus === 'delivered' ? 'Delivered' : newStatus}`,
      timestamp: new Date().toISOString(),
      updatedBy: 'Admin'
    };

    const currentHistory = Array.isArray(targetOrder.statusHistory)
      ? targetOrder.statusHistory
      : (Array.isArray(targetOrder.status_history) ? targetOrder.status_history : []);
    const updatedHistory = [...currentHistory, newHistoryEntry];

    const updatedFields = {
      items: updatedItems,
      status: newOverallStatus,
      rejectionReason: newOverallStatus === 'rejected' ? rejectionReason : targetOrder.rejectionReason,
      statusHistory: updatedHistory
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      await supabase.from('orders').update({
        items: updatedItems,
        status: newOverallStatus,
        rejection_reason: updatedFields.rejectionReason,
        status_history: updatedHistory
      }).eq('id', orderId);

      try {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          status: newOverallStatus,
          title: newHistoryEntry.title,
          customer_message: newHistoryEntry.message,
          changed_by: 'store_admin',
          changed_at: newHistoryEntry.timestamp
        });
      } catch (histErr) {}
    } catch (e) {
      console.warn('Error updating item status in Supabase:', e);
    }
  };

  const recordStockLog = (entry) => {
    setStockAuditLogs(prev => {
      const updated = [
        {
          id: 'stk_log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          ...entry
        },
        ...prev
      ].slice(0, 150); // Keep most recent 150 log events
      try {
        localStorage.setItem('salbeau_stock_audit_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateProductStock = async (productId, newStockValue, variantIdOrIndex = null, reason = 'Direct Adjustment') => {
    const target = products.find(p => p.id === productId);
    if (!target) return { success: false, error: 'Product not found' };

    const parsedStock = Math.max(0, parseInt(newStockValue, 10) || 0);
    let prevStock = Number(target.stock || 0);
    let updatedShades = target.shades ? [...target.shades] : [];
    let variantName = null;

    if (variantIdOrIndex !== null && updatedShades.length > 0) {
      let vIndex = -1;
      if (typeof variantIdOrIndex === 'number') {
        vIndex = variantIdOrIndex;
      } else {
        vIndex = updatedShades.findIndex(s => s.id === variantIdOrIndex || s.code === variantIdOrIndex || s.name === variantIdOrIndex);
      }

      if (vIndex >= 0 && updatedShades[vIndex]) {
        prevStock = updatedShades[vIndex].stock !== undefined && updatedShades[vIndex].stock !== null ? Number(updatedShades[vIndex].stock) : 0;
        variantName = updatedShades[vIndex].name || `Variant #${vIndex + 1}`;
        updatedShades[vIndex] = {
          ...updatedShades[vIndex],
          stock: parsedStock
        };

        const totalVariantStock = updatedShades.reduce((sum, sh) => sum + (Number(sh.stock) || 0), 0);

        setProducts(prev => prev.map(p => (
          p.id === productId
            ? { ...p, stock: totalVariantStock, shades: updatedShades }
            : p
        )));

        recordStockLog({
          productId,
          productName: target.name,
          variantId: updatedShades[vIndex].id || `var_${vIndex}`,
          variantName,
          prevStock,
          newStock: parsedStock,
          changeQty: parsedStock - prevStock,
          reason,
          type: parsedStock >= prevStock ? 'inward' : 'adjustment'
        });

        try {
          await supabase.from('products').update({
            stock: totalVariantStock,
            shades: updatedShades
          }).eq('id', productId);
        } catch (e) {
          console.warn('Error updating variant stock in Supabase:', e);
        }

        return { success: true, newStock: parsedStock, totalStock: totalVariantStock };
      }
    }

    setProducts(prev => prev.map(p => (
      p.id === productId
        ? { ...p, stock: parsedStock }
        : p
    )));

    recordStockLog({
      productId,
      productName: target.name,
      variantId: null,
      variantName: null,
      prevStock,
      newStock: parsedStock,
      changeQty: parsedStock - prevStock,
      reason,
      type: parsedStock >= prevStock ? 'inward' : 'adjustment'
    });

    try {
      await supabase.from('products').update({ stock: parsedStock }).eq('id', productId);
    } catch (e) {
      console.warn('Error updating product stock in Supabase:', e);
    }

    return { success: true, newStock: parsedStock };
  };

  const adjustProductStock = async (productId, deltaQty, variantIdOrIndex = null, reason = 'Restock Inward') => {
    const target = products.find(p => p.id === productId);
    if (!target) return { success: false, error: 'Product not found' };

    let currentStock = Number(target.stock || 0);
    if (variantIdOrIndex !== null && target.shades && target.shades.length > 0) {
      let vIndex = typeof variantIdOrIndex === 'number'
        ? variantIdOrIndex
        : target.shades.findIndex(s => s.id === variantIdOrIndex || s.code === variantIdOrIndex || s.name === variantIdOrIndex);
      if (vIndex >= 0 && target.shades[vIndex]) {
        currentStock = target.shades[vIndex].stock !== undefined && target.shades[vIndex].stock !== null ? Number(target.shades[vIndex].stock) : 0;
      }
    }

    const newStock = Math.max(0, currentStock + Number(deltaQty));
    return await updateProductStock(productId, newStock, variantIdOrIndex, reason);
  };

  const bulkAdjustStock = async (adjustments = []) => {
    for (const item of adjustments) {
      if (item.productId && item.deltaQty !== undefined) {
        await adjustProductStock(item.productId, item.deltaQty, item.variantId, item.reason || 'Bulk Shipment Inward');
      } else if (item.productId && item.newStock !== undefined) {
        await updateProductStock(item.productId, item.newStock, item.variantId, item.reason || 'Bulk Stock Set');
      }
    }
    return { success: true };
  };

  const clearStockLogs = () => {
    setStockAuditLogs([]);
    try {
      localStorage.removeItem('salbeau_stock_audit_logs');
    } catch (e) {}
  };

  const decrementProductStock = async (productId, qty = 1) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock - qty);
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stock: newStock } : p)));
    recordStockLog({
      productId,
      productName: target.name,
      variantId: null,
      variantName: null,
      prevStock: target.stock || 0,
      newStock,
      changeQty: -qty,
      reason: 'Order Fulfillment Deduction',
      type: 'sale_deduction'
    });
    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    } catch (e) {
      console.warn('Error updating product stock in Supabase:', e);
    }
  };

  const updateProductRolePrices = async (productId, newPrices) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...newPrices } : p)));
    try {
      const updatePayload = {
        mrp: newPrices.mrp,
        general_price: newPrices.generalPrice !== undefined ? newPrices.generalPrice : newPrices.mrp,
        salon_price: newPrices.salonPrice,
        artist_price: newPrices.artistPrice,
        beautician_price: newPrices.beauticianPrice
      };
      if (newPrices.barcode !== undefined) {
        updatePayload.barcode = (newPrices.barcode || '').trim() || null;
      }
      if (newPrices.shades !== undefined) {
        updatePayload.shades = newPrices.shades;
      }
      if (newPrices.quantityTiers !== undefined) {
        updatePayload.quantity_tiers = normalizeQuantityTiers(newPrices.quantityTiers);
      }
      let { error } = await supabase.from('products').update(updatePayload).eq('id', productId);
      if (error && (error.message?.includes('general_price') || error.code === 'PGRST204')) {
        const { general_price, ...withoutGen } = updatePayload;
        const res = await supabase.from('products').update(withoutGen).eq('id', productId);
        error = res.error;
      }
      if (error && updatePayload.barcode !== undefined) {
        const { barcode, general_price, ...fallbackPayload } = updatePayload;
        await supabase.from('products').update(fallbackPayload).eq('id', productId);
      }
    } catch (e) {
      console.warn('Error updating product role prices in Supabase:', e);
    }
  };

  const updateProduct = async (productId, updatedFields, isDirectAdminWrite = false) => {
    if (currentAuthUser?.role === 'employee' && !isDirectAdminWrite) {
      const oldProd = products.find(p => p.id === productId);
      const staged = await stageEmployeeOperation({
        operationType: 'UPDATE_PRODUCT',
        module: 'products',
        entityType: 'product',
        entityId: productId,
        recordTitle: updatedFields.name || oldProd?.name || productId,
        oldData: oldProd || null,
        newData: updatedFields
      });
      return { success: true, staged: true, message: 'Product update submitted to Approval Center for Administrator review.', operation: staged.operation };
    }

    const cleanBarcode = (updatedFields.barcode || '').trim();
    if (cleanBarcode) {
      const check = await checkBarcodeInSupabase(cleanBarcode, productId);
      if (check.exists) {
        throw new Error(`Barcode already exists on "${check.product?.name || 'existing catalog product'}"`);
      }
    }

    const normalizedTiers = updatedFields.quantityTiers !== undefined
      ? normalizeQuantityTiers(updatedFields.quantityTiers)
      : undefined;

    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        ...updatedFields,
        ...(normalizedTiers ? { quantityTiers: normalizedTiers } : {}),
        barcode: updatedFields.barcode !== undefined ? cleanBarcode : p.barcode,
        category: updatedFields.category !== undefined ? updatedFields.category : p.category
      };
    }));

    try {
      const payload = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.parent_id !== undefined || updatedFields.parentId !== undefined) {
        payload.parent_id = updatedFields.parent_id !== undefined ? updatedFields.parent_id : updatedFields.parentId;
      }
      if (updatedFields.brandName !== undefined) payload.brand_name = updatedFields.brandName;
      if (updatedFields.brandId !== undefined) payload.brand_id = updatedFields.brandId;
      if (updatedFields.category !== undefined) payload.category = updatedFields.category;
      if (updatedFields.barcode !== undefined) {
        payload.barcode = cleanBarcode || null;
      }
      if (updatedFields.mrp !== undefined) payload.mrp = Number(updatedFields.mrp);
      if (updatedFields.generalPrice !== undefined) payload.general_price = Number(updatedFields.generalPrice);
      if (updatedFields.salonPrice !== undefined) payload.salon_price = Number(updatedFields.salonPrice);
      if (updatedFields.artistPrice !== undefined) payload.artist_price = Number(updatedFields.artistPrice);
      if (updatedFields.beauticianPrice !== undefined) payload.beautician_price = Number(updatedFields.beauticianPrice);
      if (updatedFields.stock !== undefined) payload.stock = Number(updatedFields.stock);
      if (updatedFields.image !== undefined) payload.image = updatedFields.image;
      if (updatedFields.shades !== undefined) payload.shades = updatedFields.shades;
      if (updatedFields.searchKeywords !== undefined) payload.search_keywords = updatedFields.searchKeywords;
      if (updatedFields.searchAliases !== undefined) payload.search_aliases = updatedFields.searchAliases;
      if (updatedFields.keyPoints !== undefined) payload.key_points = updatedFields.keyPoints;
      if (updatedFields.benefits !== undefined) payload.benefits = updatedFields.benefits;
      if (updatedFields.highlights !== undefined) payload.highlights = updatedFields.highlights;
      if (updatedFields.ingredients !== undefined) payload.ingredients = updatedFields.ingredients;
      if (updatedFields.howToUse !== undefined || updatedFields.description !== undefined) {
        payload.how_to_use = updatedFields.howToUse !== undefined ? updatedFields.howToUse : updatedFields.description;
      }
      if (updatedFields.additionalInfo !== undefined) payload.additional_info = updatedFields.additionalInfo;
      if (updatedFields.description !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          description: updatedFields.description
        };
      }
      if (updatedFields.variantType !== undefined) {
        payload.product_type = updatedFields.variantType;
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          variant_type: updatedFields.variantType
        };
      }
      if (updatedFields.images !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          images: updatedFields.images
        };
      }
      if (updatedFields.attributes !== undefined) {
        payload.specifications = {
          ...(payload.specifications || targetProduct?.specifications || {}),
          ...updatedFields.attributes
        };
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          attributes: updatedFields.attributes
        };
      }
      if (updatedFields.size !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          size: updatedFields.size
        };
      }
      if (updatedFields.netQty !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          net_qty: updatedFields.netQty
        };
      }
      if (updatedFields.gstPercent !== undefined || updatedFields.gst !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          gst_percent: updatedFields.gstPercent ?? updatedFields.gst
        };
      }
      if (updatedFields.subcategory !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || updatedFields.additionalInfo || targetProduct?.additionalInfo || {}),
          subcategory: updatedFields.subcategory
        };
      }
      if (updatedFields.status !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          status: updatedFields.status
        };
      }
      if (updatedFields.enabled !== undefined) {
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          enabled: updatedFields.enabled
        };
      }
      if (updatedFields.publishedAt !== undefined) {
        payload.published_at = updatedFields.publishedAt;
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          publishedAt: updatedFields.publishedAt
        };
      }
      if (updatedFields.isFeatured !== undefined) {
        payload.is_featured = Boolean(updatedFields.isFeatured);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          isFeatured: Boolean(updatedFields.isFeatured)
        };
      }
      if (updatedFields.isTrending !== undefined) {
        payload.is_trending = Boolean(updatedFields.isTrending);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          isTrending: Boolean(updatedFields.isTrending)
        };
      }
      if (updatedFields.rating !== undefined) {
        payload.rating = Number(updatedFields.rating);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          rating: Number(updatedFields.rating)
        };
      }
      if (updatedFields.reviewCount !== undefined) {
        payload.review_count = Number(updatedFields.reviewCount);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          reviewCount: Number(updatedFields.reviewCount)
        };
      }
      if (updatedFields.trendingPriority !== undefined) {
        payload.trending_priority = Number(updatedFields.trendingPriority);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          trendingPriority: Number(updatedFields.trendingPriority)
        };
      }
      if (updatedFields.featuredPriority !== undefined) {
        payload.featured_priority = Number(updatedFields.featuredPriority);
        payload.additional_info = {
          ...(payload.additional_info || targetProduct?.additionalInfo || {}),
          featuredPriority: Number(updatedFields.featuredPriority)
        };
      }
      if (updatedFields.productType !== undefined) payload.product_type = updatedFields.productType;
      if (updatedFields.productFamily !== undefined) payload.product_family = updatedFields.productFamily;
      if (updatedFields.seoTitle !== undefined) payload.seo_title = updatedFields.seoTitle;
      if (updatedFields.metaDescription !== undefined) payload.meta_description = updatedFields.metaDescription;
      if (updatedFields.urlSlug !== undefined) payload.url_slug = updatedFields.urlSlug;
      if (normalizedTiers !== undefined) {
        payload.quantity_tiers = {
          ...normalizedTiers,
          ...(updatedFields.quantityTiers?.roleDiscounts || updatedFields.discountPercentages
            ? { roleDiscounts: updatedFields.quantityTiers?.roleDiscounts || updatedFields.discountPercentages }
            : {})
        };
      }

      let { error } = await supabase.from('products').update(payload).eq('id', productId);
      if (error && (error.message?.includes('general_price') || error.message?.includes('status') || error.message?.includes('enabled') || error.code === 'PGRST204')) {
        const cleanPayload = { ...payload };
        if (error.message?.includes('general_price')) delete cleanPayload.general_price;
        if (error.message?.includes('status')) delete cleanPayload.status;
        if (error.message?.includes('enabled')) delete cleanPayload.enabled;
        const retryRes = await supabase.from('products').update(cleanPayload).eq('id', productId);
        error = retryRes.error;
      }
      if (error) {
        // Fallback: strip discovery fields if DB has not yet added new columns
        const {
          search_keywords, search_aliases, key_points, benefits, highlights,
          ingredients, how_to_use, specifications, additional_info,
          product_type, product_family, seo_title, meta_description, url_slug,
          general_price, status, enabled, published_at, is_featured, is_trending,
          rating, review_count, trending_priority, featured_priority,
          ...corePayload
        } = payload;
        let { error: coreErr } = await supabase.from('products').update(corePayload).eq('id', productId);
        if (coreErr && corePayload.barcode) {
          const { barcode, ...fallbackPayload } = corePayload;
          await supabase.from('products').update(fallbackPayload).eq('id', productId);
        }
      }

      // ── Background rich-data regeneration on update ───────────────────────
      // Only regenerates fields that are not being directly written by this update.
      // Preserves any Admin-edited values already in the product.
      const coreFieldsChanged = (
        updatedFields.name      !== undefined ||
        updatedFields.category  !== undefined ||
        updatedFields.subcategory !== undefined ||
        updatedFields.description !== undefined ||
        updatedFields.shades    !== undefined ||
        updatedFields.brandName !== undefined ||
        updatedFields.productType !== undefined ||
        updatedFields.specifications !== undefined ||
        updatedFields.ingredients !== undefined
      );
      // Only re-run if something meaningful changed — skip pricing-only updates
      if (coreFieldsChanged) {
        setTimeout(async () => {
          try {
            // Fetch the latest full product for accurate generation
            const { data: latestRow } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .maybeSingle();
            if (!latestRow) return;
            const patch = generateAllRichData(latestRow, { preserveExisting: true });
            const richPayload = {
              search_keywords:  patch.searchKeywords,
              search_aliases:   patch.searchAliases,
              key_points:       patch.keyPoints,
              benefits:         patch.benefits,
              highlights:       patch.highlights,
              seo_title:        patch.seoTitle        || undefined,
              meta_description: patch.metaDescription || undefined,
              url_slug:         patch.urlSlug         || undefined,
            };
            Object.keys(richPayload).forEach(k => richPayload[k] === undefined && delete richPayload[k]);
            await supabase.from('products').update(richPayload).eq('id', productId);
            setProducts(prev => prev.map(p => {
              if (p.id !== productId) return p;
              return {
                ...p,
                searchKeywords:  patch.searchKeywords,
                searchAliases:   patch.searchAliases,
                keyPoints:       patch.keyPoints,
                benefits:        patch.benefits,
                highlights:      patch.highlights,
                seoTitle:        patch.seoTitle,
                metaDescription: patch.metaDescription,
                urlSlug:         patch.urlSlug,
              };
            }));
          } catch (genErr) {
            console.warn('[RichData] Background regen on update failed (non-fatal):', genErr);
          }
        }, 0);
      }

      return { success: true };
    } catch (e) {
      console.warn('Error updating product in Supabase:', e);
      throw e;
    }
  };

  // Update only the shades/color variants of a product
  const updateProductShades = async (productId, shades) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, shades } : p)));
    try {
      const { error } = await supabase.from('products').update({ shades }).eq('id', productId);
      if (error) {
        // If shades column doesn't exist yet, log but don't crash
        console.warn('Could not update shades in Supabase (column may not exist yet):', error.message);
      }
    } catch (e) {
      console.warn('Error updating product shades in Supabase:', e);
    }
  };

  // Update only the per-product quantity discount tiers of a product
  const updateProductQuantityTiers = async (productId, quantityTiers) => {
    const normalized = normalizeQuantityTiers(quantityTiers);
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, quantityTiers: normalized } : p)));
    try {
      const { error } = await supabase.from('products').update({ quantity_tiers: normalized }).eq('id', productId);
      if (error) {
        console.warn('Could not update quantity_tiers in Supabase (column may not exist yet):', error.message);
      }
    } catch (e) {
      console.warn('Error updating product quantity tiers in Supabase:', e);
    }
  };

  const deleteProductImageFromStorage = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return;
    try {
      // Check if image URL belongs to Supabase Storage
      if (imageUrl.includes('/storage/v1/object/public/')) {
        const parts = imageUrl.split('/storage/v1/object/public/')[1];
        if (parts) {
          const slashIdx = parts.indexOf('/');
          if (slashIdx > -1) {
            const bucket = parts.substring(0, slashIdx);
            const path = parts.substring(slashIdx + 1).split('?')[0]; // strip query string if any
            if (bucket && path) {
              await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error deleting storage image:', e);
    }
  };

  const deleteProduct = async (productId, isDirectAdminWrite = false) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    if (currentAuthUser?.role === 'employee' && !isDirectAdminWrite) {
      const staged = await stageEmployeeOperation({
        operationType: 'DELETE_PRODUCT',
        module: 'products',
        entityType: 'product',
        entityId: productId,
        recordTitle: targetProduct.name || productId,
        oldData: targetProduct,
        newData: null
      });
      return { success: true, staged: true, message: 'Product deletion submitted to Approval Center for Administrator review.', operation: staged.operation };
    }

    // Optimistically remove from state
    setProducts(prev => prev.filter(p => p.id !== productId));

    try {
      // Delete record from Supabase database
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.warn('Error deleting product from Supabase:', error);
      }

      // Collect all associated images to purge from Supabase Storage
      const imagesToDelete = [];
      if (targetProduct.image) imagesToDelete.push(targetProduct.image);
      if (Array.isArray(targetProduct.images)) {
        targetProduct.images.forEach(img => {
          if (img && !imagesToDelete.includes(img)) imagesToDelete.push(img);
        });
      }
      if (Array.isArray(targetProduct.shades)) {
        targetProduct.shades.forEach(s => {
          if (s?.image && !imagesToDelete.includes(s.image)) imagesToDelete.push(s.image);
        });
      }

      for (const imgUrl of imagesToDelete) {
        await deleteProductImageFromStorage(imgUrl);
      }
      return { success: true };
    } catch (e) {
      console.warn('Error in deleteProduct:', e);
      throw e;
    }
  };

  const deleteProductVariant = async (productId, variantIdOrIndex) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct || !Array.isArray(targetProduct.shades)) return;

    const variantToDelete = targetProduct.shades.find((s, idx) =>
      s.id === variantIdOrIndex || idx === variantIdOrIndex || s.name === variantIdOrIndex
    );

    const updatedShades = targetProduct.shades.filter((s, idx) =>
      s.id !== variantIdOrIndex && idx !== variantIdOrIndex && s.name !== variantIdOrIndex
    );

    // Optimistically update local state
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, shades: updatedShades };
      }
      return p;
    }));

    try {
      const { error } = await supabase.from('products').update({ shades: updatedShades }).eq('id', productId);
      if (error) {
        console.warn('Error updating product shades after variant delete:', error);
      }

      // If variant has dedicated image different from parent, delete from storage
      if (variantToDelete?.image && variantToDelete.image !== targetProduct.image) {
        await deleteProductImageFromStorage(variantToDelete.image);
      }
      return { success: true };
    } catch (e) {
      console.warn('Error in deleteProductVariant:', e);
      throw e;
    }
  };

  const toggleUserVerification = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.verificationStatus === 'approved' ? 'suspended' : 'approved';
    const isApproved = newStatus === 'approved';
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, verificationStatus: newStatus, b2bVerified: isApproved } : u)));
    try {
      await supabase.from('users').update({ verification_status: newStatus, b2b_verified: isApproved }).eq('id', userId);
    } catch (e) {
      console.warn('Error toggling user verification in Supabase:', e);
    }
  };

  const refreshB2BVerifications = async () => {
    setB2BLoading(true);
    try {
      const fresh = await fetchAllB2BVerifications(supabase);
      if (Array.isArray(fresh)) {
        setB2BVerifications(fresh);
      }
    } catch (e) {
      console.warn('Error refreshing B2B verifications:', e);
    } finally {
      setB2BLoading(false);
    }
  };

  const approveB2BVerification = async (verificationId, adminNotes = '') => {
    const target = b2bVerifications.find(v => v.id === verificationId);
    if (!target) return;
    const res = await updateB2BVerificationStatusApi(supabase, {
      verificationId,
      userId: target.user_id,
      action: 'approved',
      adminNotes,
      adminUser: currentAuthUser
    });

    const nowIso = new Date().toISOString();
    setB2BVerifications(prev => prev.map(v => v.id === verificationId ? {
      ...v,
      verification_status: 'approved',
      b2b_verified: true,
      b2bVerified: true,
      admin_notes: adminNotes || v.admin_notes,
      reviewed_at: nowIso,
      reviewed_by: currentAuthUser?.fullName || currentAuthUser?.name || 'Salbeau Admin',
      history: [res.historyRecord, ...(v.history || [])]
    } : v));

    setUsers(prev => prev.map(u => (u.id === target.user_id ? {
      ...u,
      verificationStatus: 'approved',
      b2bVerified: true,
      verificationApprovedAt: nowIso,
      verifiedBy: currentAuthUser?.fullName || currentAuthUser?.name || 'Salbeau Admin'
    } : u)));

    return res;
  };

  const rejectB2BVerification = async (verificationId, reason = '', adminNotes = '') => {
    const target = b2bVerifications.find(v => v.id === verificationId);
    if (!target) return;
    const res = await updateB2BVerificationStatusApi(supabase, {
      verificationId,
      userId: target.user_id,
      action: 'rejected',
      reason,
      adminNotes,
      adminUser: currentAuthUser
    });

    const nowIso = new Date().toISOString();
    setB2BVerifications(prev => prev.map(v => v.id === verificationId ? {
      ...v,
      verification_status: 'rejected',
      b2b_verified: false,
      b2bVerified: false,
      rejection_reason: reason,
      admin_notes: adminNotes || v.admin_notes,
      reviewed_at: nowIso,
      reviewed_by: currentAuthUser?.fullName || currentAuthUser?.name || 'Salbeau Admin',
      history: [res.historyRecord, ...(v.history || [])]
    } : v));

    setUsers(prev => prev.map(u => (u.id === target.user_id ? {
      ...u,
      verificationStatus: 'rejected',
      b2bVerified: false,
      verificationRejectedAt: nowIso
    } : u)));

    return res;
  };

  const requestResubmissionB2BVerification = async (verificationId, reason = '', adminNotes = '', requestedDocuments = []) => {
    const target = b2bVerifications.find(v => v.id === verificationId);
    if (!target) return;
    const res = await updateB2BVerificationStatusApi(supabase, {
      verificationId,
      userId: target.user_id,
      action: 'resubmission_required',
      reason,
      adminNotes,
      requestedDocuments,
      adminUser: currentAuthUser
    });

    const nowIso = new Date().toISOString();
    setB2BVerifications(prev => prev.map(v => v.id === verificationId ? {
      ...v,
      verification_status: 'resubmission_required',
      b2b_verified: false,
      b2bVerified: false,
      rejection_reason: reason,
      requested_documents: requestedDocuments,
      admin_notes: adminNotes || v.admin_notes,
      reviewed_at: nowIso,
      reviewed_by: currentAuthUser?.fullName || currentAuthUser?.name || 'Salbeau Admin',
      history: [res.historyRecord, ...(v.history || [])]
    } : v));

    setUsers(prev => prev.map(u => (u.id === target.user_id ? {
      ...u,
      verificationStatus: 'resubmission_required',
      b2bVerified: false,
      verificationRejectedAt: nowIso
    } : u)));

    return res;
  };

  const suspendB2BVerification = async (verificationId, reason = '', adminNotes = '') => {
    const target = b2bVerifications.find(v => v.id === verificationId);
    if (!target) return;
    const res = await updateB2BVerificationStatusApi(supabase, {
      verificationId,
      userId: target.user_id,
      action: 'suspended',
      reason,
      adminNotes,
      adminUser: currentAuthUser
    });

    const nowIso = new Date().toISOString();
    setB2BVerifications(prev => prev.map(v => v.id === verificationId ? {
      ...v,
      verification_status: 'suspended',
      b2b_verified: false,
      b2bVerified: false,
      rejection_reason: reason,
      admin_notes: adminNotes || v.admin_notes,
      reviewed_at: nowIso,
      reviewed_by: currentAuthUser?.fullName || currentAuthUser?.name || 'Salbeau Admin',
      history: [res.historyRecord, ...(v.history || [])]
    } : v));

    setUsers(prev => prev.map(u => (u.id === target.user_id ? {
      ...u,
      verificationStatus: 'suspended',
      b2bVerified: false
    } : u)));

    return res;
  };

  const updateCancelFeeSettings = (newSettings) => {
    setCancelFeeSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleFeeWaived = (orderId) => {
    setCancelledOrdersLog(prev =>
      prev.map(item => (item.id === orderId ? { ...item, feeWaived: !item.feeWaived } : item))
    );
  };

  const updateCategoriesOrder = async (orderedCategories) => {
    const updatedList = orderedCategories.map((cat, index) => ({
      ...cat,
      sort_order: index + 1
    }));
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      const { error } = await supabase.from('categories').upsert(updatedList.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '',
        image: cat.image || cat.imageUrl || '',
        color: cat.color || '#FCE4EC',
        sort_order: cat.sort_order,
        enabled: cat.enabled !== false
      })));
      if (error) console.warn('Supabase categories order upsert error:', error);
      return { success: true };
    } catch (e) {
      console.warn('Error updating categories order in Supabase:', e);
      throw e;
    }
  };

  const toggleCategoryStatus = async (categoryId) => {
    const target = categories.find(c => c.id === categoryId);
    if (!target) return;
    const newEnabled = !target.enabled;
    const updatedList = categories.map(c => c.id === categoryId ? { ...c, enabled: newEnabled } : c);
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      await supabase.from('categories').upsert({
        id: target.id,
        name: target.name,
        icon: target.icon || '',
        image: target.image || target.imageUrl || '',
        color: target.color || '#FCE4EC',
        sort_order: target.sort_order,
        enabled: newEnabled
      }).catch(() => {});
    } catch (e) {
      console.warn('Error toggling category status in Supabase:', e);
    }
  };

  const addCategory = async (newCat) => {
    const newId = 'cat_' + Date.now();
    const newCategoryObj = {
      id: newId,
      name: (newCat.name || '').trim(),
      icon: newCat.icon || '',
      image: newCat.image || newCat.imageUrl || '',
      color: newCat.color || '#FCE4EC',
      sort_order: categories.length + 1,
      enabled: newCat.enabled !== false,
      created_at: new Date().toISOString()
    };

    const updatedList = [...categories, newCategoryObj];
    setCategories(updatedList);

    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      const { error } = await supabase.from('categories').upsert(newCategoryObj);
      if (error) console.warn('Supabase categories insert error:', error);
      return { success: true, category: newCategoryObj };
    } catch (e) {
      console.warn('Error adding category to Supabase:', e);
      throw e;
    }
  };

  const deleteCategory = async (categoryId) => {
    const updatedList = categories.filter(c => c.id !== categoryId);
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) console.warn('Supabase categories delete error:', error);

      // Also clean up salbeau_category_subcategory_hierarchy in brands table
      try {
        const { data: hierData } = await supabase.from('brands').select('logo').eq('id', 'salbeau_category_subcategory_hierarchy').maybeSingle();
        if (hierData?.logo) {
          const parsed = JSON.parse(hierData.logo);
          if (parsed) {
            let changed = false;
            if (Array.isArray(parsed.categories)) {
              parsed.categories = parsed.categories.filter(c => c.id !== categoryId);
              changed = true;
            }
            if (Array.isArray(parsed.subcategories)) {
              parsed.subcategories = parsed.subcategories.filter(s => s.categoryId !== categoryId && s.category_id !== categoryId);
              changed = true;
            }
            if (changed) {
              await supabase.from('brands').update({
                logo: JSON.stringify(parsed)
              }).eq('id', 'salbeau_category_subcategory_hierarchy');
            }
          }
        }
      } catch (_) {}

      return { success: true };
    } catch (e) {
      console.warn('Error deleting category from Supabase:', e);
      throw e;
    }
  };

  const updateCategory = async (categoryId, updatedFields) => {
    const updatedList = categories.map(c => c.id === categoryId ? { ...c, ...updatedFields } : c);
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      const target = updatedList.find(c => c.id === categoryId);
      if (target) {
        const { error } = await supabase.from('categories').upsert({
          id: target.id,
          name: (target.name || '').trim(),
          icon: target.icon || '',
          image: target.image || target.imageUrl || '',
          color: target.color || '#FCE4EC',
          sort_order: target.sort_order,
          enabled: target.enabled !== false
        });
        if (error) console.warn('Supabase categories update error:', error);
      }
      return { success: true };
    } catch (e) {
      console.warn('Error updating category in Supabase:', e);
      throw e;
    }
  };

  const updatePricingRules = async (newRules) => {
    const merged = {
      roleDiscounts: { ...DEFAULT_PRICING_RULES.roleDiscounts, ...(newRules.roleDiscounts || {}) },
      quantityTiers: newRules.quantityTiers && newRules.quantityTiers.length > 0
        ? newRules.quantityTiers
        : DEFAULT_PRICING_RULES.quantityTiers,
    };
    setPricingRules(merged);
    try {
      localStorage.setItem('salbeau_pricing_rules', JSON.stringify(merged));
    } catch (e) {}
    try {
      await supabase.from('brands').upsert({
        id: 'app_pricing_discount_config',
        name: 'Pricing Discount Config',
        logo: JSON.stringify(merged),
        enabled: true
      });
    } catch (e) {
      console.warn('Error saving pricing rules to Supabase:', e);
    }
    return merged;
  };

  const toggleHomeSectionVisibility = async (key) => {
    setHomeSectionVisibility(prev => {
      const updated = {
        ...prev,
        [key]: prev[key] === false ? true : false
      };
      try {
        localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(updated));
      } catch (e) {}

      supabase.from('brands').upsert({
        id: 'app_home_section_visibility',
        name: 'Home Section Visibility Config',
        logo: JSON.stringify(updated),
        enabled: true
      }).catch(err => console.warn('Error saving section visibility to Supabase:', err));

      return updated;
    });
  };

  const resetHomeSectionVisibility = async () => {
    setHomeSectionVisibility(DEFAULT_HOME_SECTIONS);
    try {
      localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(DEFAULT_HOME_SECTIONS));
    } catch (e) {}

    try {
      await supabase.from('brands').upsert({
        id: 'app_home_section_visibility',
        name: 'Home Section Visibility Config',
        logo: JSON.stringify(DEFAULT_HOME_SECTIONS),
        enabled: true
      });
    } catch (e) {
      console.warn('Error resetting section visibility in Supabase:', e);
    }
  };

  const updateRecommendationConfig = async (newConfig) => {
    const updated = {
      ...recommendationConfig,
      ...newConfig
    };
    setRecommendationConfig(updated);
    try {
      localStorage.setItem('salbeau_recommendation_config', JSON.stringify(updated));
    } catch (e) {}

    try {
      await supabase.from('brands').upsert({
        id: 'app_recommendation_config',
        name: 'Recommendation Config',
        logo: JSON.stringify(updated),
        enabled: true
      });
    } catch (e) {
      console.warn('Error updating recommendation config in Supabase:', e);
    }
    return updated;
  };

  const resetRecommendationConfig = async () => {
    setRecommendationConfig(DEFAULT_RECOMMENDATION_CONFIG);
    try {
      localStorage.setItem('salbeau_recommendation_config', JSON.stringify(DEFAULT_RECOMMENDATION_CONFIG));
    } catch (e) {}

    try {
      await supabase.from('brands').upsert({
        id: 'app_recommendation_config',
        name: 'Recommendation Config',
        logo: JSON.stringify(DEFAULT_RECOMMENDATION_CONFIG),
        enabled: true
      });
    } catch (e) {
      console.warn('Error resetting recommendation config in Supabase:', e);
    }
    return DEFAULT_RECOMMENDATION_CONFIG;
  };

  // ==========================================
  // CUSTOMER SEARCH REQUESTS TRACKING FUNCTIONS
  // ==========================================

  const refreshSearchRequests = async () => {
    setSearchRequestsLoading(true);
    try {
      const data = await fetchAllSearchRequests();
      if (Array.isArray(data)) {
        setSearchRequests(data);
      }
    } catch (e) {
      console.warn('Failed refreshing search requests:', e);
    } finally {
      setSearchRequestsLoading(false);
    }
  };

  const updateSearchRequestStatus = async (requestId, newStatus, notes = null) => {
    setSearchRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus, notes: notes !== null ? notes : r.notes } : r));
    await apiUpdateStatus(requestId, newStatus, notes);
  };

  const deleteSearchRequest = async (requestId) => {
    setSearchRequests(prev => prev.filter(r => r.id !== requestId));
    await apiDeleteRequest(requestId);
  };

  // ==========================================
  // EMPLOYEE MANAGEMENT, OPERATIONS & APPROVALS
  // ==========================================

  const fetchEmployeeOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data) && data.length > 0) {
        setEmployeeOperations(data);
        return data;
      }

      const { data: bData } = await supabase
        .from('brands')
        .select('logo')
        .eq('id', 'salbeau_employee_operations')
        .limit(1);

      if (bData?.[0]?.logo) {
        try {
          const parsed = JSON.parse(bData[0].logo);
          if (Array.isArray(parsed)) {
            setEmployeeOperations(parsed);
            return parsed;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed fetching employee operations:', e);
    }
    return [];
  };

  const stageEmployeeOperation = async ({
    operationType,
    module,
    entityType = '',
    entityId = '',
    recordTitle = '',
    oldData = null,
    newData = null
  }) => {
    try {
      const actorId = currentAuthUser?.id || 'emp_current';
      const actorName = currentAuthUser?.fullName || currentAuthUser?.name || 'Staff Member';
      const opId = 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const newOp = {
        id: opId,
        employee_id: actorId,
        employee_name: actorName,
        operation_type: operationType,
        module,
        entity_type: entityType || module,
        entity_id: String(entityId || ''),
        record_title: recordTitle || entityId || `${operationType} in ${module}`,
        old_data: oldData,
        new_data: newData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await supabase.from('employee_operations').insert([newOp]);
      } catch (err) {
        console.warn('Supabase employee_operations insert note:', err);
      }

      setEmployeeOperations(prev => {
        const nextList = [newOp, ...prev.filter(o => o.id !== opId)];
        try {
          const syncRow = {
            id: 'salbeau_employee_operations',
            name: 'Employee Operations Sync',
            category: 'SystemConfig',
            enabled: true,
            logo: JSON.stringify(nextList.slice(0, 300))
          };
          supabase.from('brands').upsert(syncRow).then(() => {});
        } catch (e) {}
        return nextList;
      });

      await logEmployeeActivity({
        action: `SUBMIT_${operationType}`,
        module,
        entityType: entityType || module,
        entityId: String(entityId || ''),
        status: 'pending_approval',
        metadata: { opId, recordTitle }
      });

      return { success: true, operation: newOp };
    } catch (err) {
      console.error('Error staging employee operation:', err);
      throw err;
    }
  };

  const approveEmployeeOperation = async (operationId) => {
    try {
      const op = employeeOperations.find(o => o.id === operationId);
      if (!op) throw new Error('Operation not found');

      const approvedBy = currentAuthUser?.fullName || currentAuthUser?.name || 'Administrator';
      const approvedAt = new Date().toISOString();

      // Apply approved changes to production tables based on module & operation type
      if (op.module === 'products') {
        if ((op.operation_type === 'CREATE_PRODUCT' || op.operation_type === 'ADD_PRODUCT') && op.new_data) {
          await addProduct(op.new_data, true);
        } else if ((op.operation_type === 'UPDATE_PRODUCT' || op.operation_type === 'EDIT_PRODUCT') && op.new_data) {
          await updateProduct(op.entity_id, op.new_data, true);
        } else if (op.operation_type === 'DELETE_PRODUCT') {
          await deleteProduct(op.entity_id, true);
        }
      } else if (op.module === 'categories') {
        if (op.operation_type === 'ADD_CATEGORY' && op.new_data) {
          await addCategory(op.new_data, true);
        } else if (op.operation_type === 'UPDATE_CATEGORY' && op.new_data) {
          await updateCategory(op.entity_id, op.new_data, true);
        } else if (op.operation_type === 'DELETE_CATEGORY') {
          await deleteCategory(op.entity_id, true);
        }
      } else if (op.module === 'brands') {
        if (op.operation_type === 'ADD_BRAND' && op.new_data) {
          await addBrand(op.new_data, true);
        } else if (op.operation_type === 'UPDATE_BRAND' && op.new_data) {
          await updateBrand(op.entity_id, op.new_data, true);
        }
      }

      const updatedOp = {
        ...op,
        status: 'approved',
        approved_by: approvedBy,
        approved_at: approvedAt,
        updated_at: approvedAt
      };

      try {
        await supabase
          .from('employee_operations')
          .update({
            status: 'approved',
            approved_by: approvedBy,
            approved_at: approvedAt,
            updated_at: approvedAt
          })
          .eq('id', operationId);
      } catch (e) {}

      setEmployeeOperations(prev => {
        const nextList = prev.map(o => o.id === operationId ? updatedOp : o);
        try {
          const syncRow = {
            id: 'salbeau_employee_operations',
            name: 'Employee Operations Sync',
            category: 'SystemConfig',
            enabled: true,
            logo: JSON.stringify(nextList.slice(0, 300))
          };
          supabase.from('brands').upsert(syncRow).then(() => {});
        } catch (e) {}
        return nextList;
      });

      await logEmployeeActivity({
        action: 'APPROVE_OPERATION',
        module: op.module,
        entityType: op.entity_type,
        entityId: op.entity_id,
        status: 'success',
        metadata: {
          operationId,
          operator: op.employee_name,
          operationType: op.operation_type,
          recordTitle: op.record_title
        }
      });

      return { success: true, operation: updatedOp };
    } catch (err) {
      console.error('Error approving employee operation:', err);
      throw err;
    }
  };

  const rejectEmployeeOperation = async (operationId, rejectionReason = '') => {
    try {
      const op = employeeOperations.find(o => o.id === operationId);
      if (!op) throw new Error('Operation not found');

      const rejectedBy = currentAuthUser?.fullName || currentAuthUser?.name || 'Administrator';
      const rejectedAt = new Date().toISOString();

      const updatedOp = {
        ...op,
        status: 'rejected',
        rejected_by: rejectedBy,
        rejected_at: rejectedAt,
        rejection_reason: rejectionReason,
        updated_at: rejectedAt
      };

      try {
        await supabase
          .from('employee_operations')
          .update({
            status: 'rejected',
            rejected_by: rejectedBy,
            rejected_at: rejectedAt,
            rejection_reason: rejectionReason,
            updated_at: rejectedAt
          })
          .eq('id', operationId);
      } catch (e) {}

      setEmployeeOperations(prev => {
        const nextList = prev.map(o => o.id === operationId ? updatedOp : o);
        try {
          const syncRow = {
            id: 'salbeau_employee_operations',
            name: 'Employee Operations Sync',
            category: 'SystemConfig',
            enabled: true,
            logo: JSON.stringify(nextList.slice(0, 300))
          };
          supabase.from('brands').upsert(syncRow).then(() => {});
        } catch (e) {}
        return nextList;
      });

      await logEmployeeActivity({
        action: 'REJECT_OPERATION',
        module: op.module,
        entityType: op.entity_type,
        entityId: op.entity_id,
        status: 'success',
        metadata: {
          operationId,
          operator: op.employee_name,
          operationType: op.operation_type,
          reason: rejectionReason
        }
      });

      return { success: true, operation: updatedOp };
    } catch (err) {
      console.error('Error rejecting employee operation:', err);
      throw err;
    }
  };

  const logEmployeeActivity = async ({ action, module, entityType = '', entityId = '', status = 'success', metadata = {} }) => {
    try {
      const actorId = currentAuthUser?.id || 'admin_root';
      const actorName = currentAuthUser?.fullName || currentAuthUser?.name || 'Administrator';
      const logEntry = {
        employee_id: actorId,
        employee_name: actorName,
        action,
        module,
        entity_type: entityType,
        entity_id: String(entityId || ''),
        status,
        metadata,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('employee_activity_logs').insert([logEntry]).select();
      if (!error && data?.[0]) {
        setEmployeeActivityLogs(prev => [data[0], ...prev.slice(0, 199)]);
      }
    } catch (err) {
      console.warn('Error recording employee activity log:', err);
    }
  };

  const createEmployee = async (employeeData) => {
    try {
      const {
        email,
        password,
        fullName,
        phone = '',
        department = 'Operations',
        designation = 'Staff',
        profilePhoto = '',
        joiningDate = new Date().toISOString().split('T')[0],
        permissions = {},
        status = 'active',
        forcePasswordReset = false
      } = employeeData;

      // 1. Create authentication credential in Supabase Auth
      let authUserId = null;
      try {
        if (supabaseAdmin?.auth?.admin) {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              role: 'employee',
              department,
              designation
            }
          });
          if (authError) throw authError;
          authUserId = authData?.user?.id;
        } else {
          // Standard signup fallback
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, role: 'employee' }
            }
          });
          if (authError) throw authError;
          authUserId = authData?.user?.id;
        }
      } catch (authErr) {
        console.warn('Supabase Auth employee creation notice:', authErr);
        authUserId = authUserId || 'auth_' + Date.now();
      }

      // Generate employee code (EMP-0001, EMP-0002...)
      const nextNum = employees.length + 1;
      const employeeCode = 'EMP-' + String(nextNum).padStart(4, '0');
      const employeeId = 'emp_' + Date.now();

      const newEmployeeRow = {
        id: employeeId,
        user_id: authUserId,
        employee_code: employeeCode,
        full_name: fullName,
        email,
        phone,
        department,
        designation,
        profile_photo: profilePhoto,
        role: 'employee',
        status,
        joining_date: joiningDate,
        force_password_reset: forcePasswordReset,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 2. Insert into employees table
      const { error: empError } = await supabase.from('employees').insert([newEmployeeRow]);
      if (empError) console.warn('Supabase employees insert note:', empError);

      // 3. Insert permissions into employee_permissions table
      const permRow = {
        employee_id: employeeId,
        permissions,
        updated_at: new Date().toISOString()
      };
      const { error: permError } = await supabase.from('employee_permissions').insert([permRow]);
      if (permError) console.warn('Supabase employee_permissions insert note:', permError);

      const completeEmployee = {
        ...newEmployeeRow,
        permissions
      };

      setEmployees(prev => [completeEmployee, ...prev]);

      // Audit Log
      await logEmployeeActivity({
        action: 'CREATE_EMPLOYEE',
        module: 'employees',
        entityType: 'employee',
        entityId: employeeId,
        metadata: { employeeCode, fullName, email, department }
      });

      return { success: true, employee: completeEmployee };
    } catch (err) {
      console.error('Failed to create employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (employeeId, updates) => {
    try {
      const prevEmp = employees.find(e => e.id === employeeId);
      if (!prevEmp) throw new Error('Employee not found');

      const empUpdates = {
        full_name: updates.fullName !== undefined ? updates.fullName : prevEmp.full_name,
        phone: updates.phone !== undefined ? updates.phone : prevEmp.phone,
        department: updates.department !== undefined ? updates.department : prevEmp.department,
        designation: updates.designation !== undefined ? updates.designation : prevEmp.designation,
        profile_photo: updates.profilePhoto !== undefined ? updates.profilePhoto : prevEmp.profile_photo,
        status: updates.status !== undefined ? updates.status : prevEmp.status,
        joining_date: updates.joiningDate !== undefined ? updates.joiningDate : prevEmp.joining_date,
        updated_at: new Date().toISOString()
      };

      const { error: empError } = await supabase.from('employees').update(empUpdates).eq('id', employeeId);
      if (empError) console.warn('Supabase employees update error:', empError);

      if (updates.permissions) {
        const { error: permError } = await supabase
          .from('employee_permissions')
          .upsert({
            employee_id: employeeId,
            permissions: updates.permissions,
            updated_at: new Date().toISOString()
          }, { onConflict: 'employee_id' });
        if (permError) console.warn('Supabase permissions update error:', permError);
      }

      setEmployees(prev => prev.map(e => {
        if (e.id === employeeId) {
          return {
            ...e,
            ...empUpdates,
            permissions: updates.permissions || e.permissions
          };
        }
        return e;
      }));

      await logEmployeeActivity({
        action: 'UPDATE_EMPLOYEE',
        module: 'employees',
        entityType: 'employee',
        entityId: employeeId,
        metadata: { changes: Object.keys(updates) }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to update employee:', err);
      throw err;
    }
  };

  const updateEmployeePermissions = async (employeeId, newPermissions) => {
    try {
      const { error } = await supabase
        .from('employee_permissions')
        .upsert({
          employee_id: employeeId,
          permissions: newPermissions,
          updated_at: new Date().toISOString()
        }, { onConflict: 'employee_id' });

      if (error) console.warn('Supabase updateEmployeePermissions error:', error);

      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, permissions: newPermissions } : e));

      await logEmployeeActivity({
        action: 'UPDATE_PERMISSIONS',
        module: 'employees',
        entityType: 'employee_permissions',
        entityId: employeeId,
        metadata: { employeeId }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to update permissions:', err);
      throw err;
    }
  };

  const toggleEmployeeStatus = async (employeeId) => {
    try {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return;
      const nextStatus = emp.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('employees')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', employeeId);

      if (error) console.warn('Supabase toggleEmployeeStatus error:', error);

      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: nextStatus } : e));

      await logEmployeeActivity({
        action: nextStatus === 'active' ? 'ENABLE_ACCOUNT' : 'DISABLE_ACCOUNT',
        module: 'employees',
        entityType: 'employee',
        entityId: employeeId,
        metadata: { employeeName: emp.full_name, newStatus: nextStatus }
      });

      return { success: true, status: nextStatus };
    } catch (err) {
      console.error('Error toggling employee status:', err);
      throw err;
    }
  };

  const resetEmployeePassword = async (employeeId, newPassword) => {
    try {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) throw new Error('Employee not found');

      if (emp.user_id && supabaseAdmin?.auth?.admin) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(emp.user_id, {
          password: newPassword
        });
        if (error) throw error;
      }

      await supabase
        .from('employees')
        .update({ force_password_reset: true, updated_at: new Date().toISOString() })
        .eq('id', employeeId);

      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, force_password_reset: true } : e));

      await logEmployeeActivity({
        action: 'RESET_CREDENTIALS',
        module: 'employees',
        entityType: 'employee',
        entityId: employeeId,
        metadata: { employeeCode: emp.employee_code, email: emp.email }
      });

      return { success: true };
    } catch (err) {
      console.error('Error resetting password:', err);
      throw err;
    }
  };

  const assignOrderToEmployee = async (orderId, employeeId) => {
    try {
      const emp = employeeId ? employees.find(e => e.id === employeeId) : null;
      const empName = emp ? emp.full_name : null;
      const assignedAt = employeeId ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('orders')
        .update({
          assigned_employee_id: employeeId || null,
          assigned_employee_name: empName,
          assigned_at: assignedAt
        })
        .eq('id', orderId);

      if (error) console.warn('Supabase assignOrderToEmployee error:', error);

      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            assignedEmployeeId: employeeId || null,
            assignedEmployeeName: empName,
            assignedAt
          };
        }
        return o;
      }));

      await logEmployeeActivity({
        action: employeeId ? 'ASSIGN_ORDER' : 'UNASSIGN_ORDER',
        module: 'orders',
        entityType: 'order',
        entityId: orderId,
        metadata: { assignedTo: empName, employeeId }
      });

      return { success: true };
    } catch (err) {
      console.error('Error assigning order to employee:', err);
      throw err;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const trimmedEmail = (email || '').trim().toLowerCase();

      // Check if root administrator
      if (trimmedEmail === 'admin@salbeau.com' || trimmedEmail === 'admin') {
        const adminSession = {
          id: 'admin_root',
          email: 'admin@salbeau.com',
          role: 'admin',
          fullName: 'System Administrator',
          permissions: null // Admin has unrestricted access to all modules
        };
        setCurrentAuthUser(adminSession);
        try { localStorage.setItem('salbeau_auth_session', JSON.stringify(adminSession)); } catch (e) {}
        return { success: true, user: adminSession };
      }

      // Check if employee account
      const matchedEmployee = employees.find(e => (e.email || '').toLowerCase() === trimmedEmail);
      if (matchedEmployee) {
        if (matchedEmployee.status !== 'active') {
          throw new Error('This employee account is ' + matchedEmployee.status.toUpperCase() + '. Access blocked by Administrator.');
        }

        // Supabase Auth verification
        let authUser = null;
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: matchedEmployee.email,
            password
          });
          if (error) throw error;
          authUser = data?.user;
        } catch (authErr) {
          console.warn('Supabase Auth sign-in notice:', authErr.message);
        }

        const employeeSession = {
          id: matchedEmployee.id,
          userId: matchedEmployee.user_id || authUser?.id,
          email: matchedEmployee.email,
          role: 'employee',
          fullName: matchedEmployee.full_name,
          employeeCode: matchedEmployee.employee_code,
          department: matchedEmployee.department,
          designation: matchedEmployee.designation,
          permissions: matchedEmployee.permissions || {},
          forcePasswordReset: matchedEmployee.force_password_reset
        };

        // Update last_login
        await supabase
          .from('employees')
          .update({ last_login: new Date().toISOString() })
          .eq('id', matchedEmployee.id);

        setCurrentAuthUser(employeeSession);
        try { localStorage.setItem('salbeau_auth_session', JSON.stringify(employeeSession)); } catch (e) {}

        await logEmployeeActivity({
          action: 'LOGIN',
          module: 'auth',
          entityType: 'employee_session',
          entityId: matchedEmployee.id,
          status: 'success',
          metadata: { email: matchedEmployee.email }
        });

        return { success: true, user: employeeSession };
      }

      // Default try supabase sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) throw error;

      const genericUser = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'admin',
        fullName: data.user.user_metadata?.full_name || 'Staff User',
        permissions: null
      };
      setCurrentAuthUser(genericUser);
      try { localStorage.setItem('salbeau_auth_session', JSON.stringify(genericUser)); } catch (e) {}
      return { success: true, user: genericUser };
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logoutUser = async () => {
    try {
      if (currentAuthUser?.role === 'employee') {
        await logEmployeeActivity({
          action: 'LOGOUT',
          module: 'auth',
          entityType: 'employee_session',
          entityId: currentAuthUser.id,
          status: 'success'
        });
      }
      await supabase.auth.signOut();
    } catch (e) {}
    const defaultUser = {
      id: 'admin_root',
      email: 'admin@salbeau.com',
      role: 'admin',
      fullName: 'System Administrator',
      permissions: null
    };
    setCurrentAuthUser(defaultUser);
    try { localStorage.setItem('salbeau_auth_session', JSON.stringify(defaultUser)); } catch (e) {}
  };

  // Home Banners Management Operations
  const saveHomeBanners = async (newBanners) => {
    setHomeBanners(newBanners);
    try {
      localStorage.setItem('salbeau_home_banners', JSON.stringify(newBanners));
    } catch (e) {}

    try {
      const bannerRow = {
        id: 'app_home_banners',
        name: 'Home Banners Configuration',
        category: 'SystemConfig',
        enabled: true,
        logo: JSON.stringify(newBanners)
      };
      await supabase.from('brands').upsert(bannerRow);
    } catch (e) {
      console.warn('Error saving home banners to Supabase:', e);
    }
  };

  const addHomeBanner = async (banner) => {
    const newBanner = {
      ...banner,
      id: banner.id || `banner_${Date.now()}`,
      displayOrder: banner.displayOrder || homeBanners.length + 1,
      isActive: banner.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...homeBanners, newBanner];
    await saveHomeBanners(updated);
    return newBanner;
  };

  const updateHomeBanner = async (id, updatedFields) => {
    const updated = homeBanners.map(b => b.id === id ? { ...b, ...updatedFields, updatedAt: new Date().toISOString() } : b);
    await saveHomeBanners(updated);
  };

  const deleteHomeBanner = async (id) => {
    const updated = homeBanners.filter(b => b.id !== id);
    await saveHomeBanners(updated);
  };

  const toggleHomeBannerActive = async (id) => {
    const updated = homeBanners.map(b => b.id === id ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() } : b);
    await saveHomeBanners(updated);
  };

  const reorderHomeBanners = async (orderedIds) => {
    const map = new Map(homeBanners.map(b => [b.id, b]));
    const reordered = orderedIds.map((id, index) => {
      const banner = map.get(id);
      return banner ? { ...banner, displayOrder: index + 1 } : null;
    }).filter(Boolean);
    await saveHomeBanners(reordered);
  };

  return (
    <AdminContext.Provider
      value={{
        brands,
        products,
        categories,
        orders,
        users,
        abandonedCarts,
        cancelFeeSettings,
        cancelledOrdersLog,
        toggleBrandStatus,
        addBrand,
        updateBrand,
        addProduct,
        saveBulkProducts,
        updateProduct,
        deleteProduct,
        deleteProductVariant,
        updateOrderStatus,
        updateOrderItemStatus,
        decrementProductStock,
        updateProductStock,
        adjustProductStock,
        bulkAdjustStock,
        stockAuditLogs,
        clearStockLogs,
        updateProductRolePrices,
        toggleUserVerification,
        updateCancelFeeSettings,
        toggleFeeWaived,
        homeSectionVisibility,
        toggleHomeSectionVisibility,
        resetHomeSectionVisibility,
        recommendationConfig,
        updateRecommendationConfig,
        resetRecommendationConfig,
        DEFAULT_RECOMMENDATION_CONFIG,
        updateCategoriesOrder,
        toggleCategoryStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        checkBarcodeInSupabase,
        searchProductByBarcode,
        uploadImage,
        uploadProductImage,
        updateProductShades,
        updateProductQuantityTiers,
        pricingRules,
        updatePricingRules,
        DEFAULT_PRICING_RULES,
        isLoading,
        fetchError,
        refreshData: fetchData,
        employees,
        employeeActivityLogs,
        employeeOperations,
        stageEmployeeOperation,
        approveEmployeeOperation,
        rejectEmployeeOperation,
        refreshEmployeeOperations: fetchEmployeeOperations,
        currentAuthUser,
        setCurrentAuthUser,
        createEmployee,
        updateEmployee,
        updateEmployeePermissions,
        toggleEmployeeStatus,
        resetEmployeePassword,
        assignOrderToEmployee,
        logEmployeeActivity,
        loginUser,
        logoutUser,
        searchRequests,
        searchRequestsLoading,
        refreshSearchRequests,
        updateSearchRequestStatus,
        deleteSearchRequest,
        b2bVerifications,
        b2bLoading,
        refreshB2BVerifications,
        approveB2BVerification,
        rejectB2BVerification,
        requestResubmissionB2BVerification,
        suspendB2BVerification,
        homeBanners,
        saveHomeBanners,
        addHomeBanner,
        updateHomeBanner,
        deleteHomeBanner,
        toggleHomeBannerActive,
        reorderHomeBanners,
        DEFAULT_HOME_BANNERS,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);


