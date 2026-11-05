import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useApp, DEFAULT_HOME_BANNERS } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';
import { storage } from '../../utils/storage';
import { getCartQuantityMap, getCartKey, getSafeProductShadesList } from '../../utils/cartKeyUtils';
import { getCategoryFA5Icon } from '../../utils/categoryIcons';
import { cleanProductDisplayName } from '../../utils/productDisplayNameUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - 32, 600);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.44);

// Reusable Section Header Component
const SectionHeader = ({
  title,
  subtitle,
  ctaText = 'View All',
  onCtaPress,
  showCta = true,
  iconBadgeText,
  iconName
}) => {
  const cleanCta = (ctaText || 'View All').replace('→', '').replace('->', '').trim();
  return (
    <View className="px-4 mb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1.5 flex-1 pr-2">
          {iconBadgeText && (
            <View className="bg-[#C2477A] w-5 h-5 rounded-full items-center justify-center shadow-2xs mr-0.5">
              <Text className="text-white text-[7.5px] font-black uppercase tracking-tighter">
                {iconBadgeText}
              </Text>
            </View>
          )}
          {iconName && <Ionicons name={iconName} size={16} color="#C2477A" />}
          <Text className="text-base font-extrabold text-[#3A2430]" numberOfLines={1}>
            {title}
          </Text>
        </View>
        {showCta && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCtaPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-1"
          >
            <Text className="text-xs font-bold text-[#C2477A]">{cleanCta}</Text>
            <Ionicons name="arrow-forward" size={13} color="#C2477A" />
          </TouchableOpacity>
        )}
      </View>
      {subtitle ? (
        <Text className="text-[10px] font-medium text-[#8C7078] mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
  );
};

// Skeleton Loading Placeholders for zero-flicker cold starts
const SkeletonCategoryCard = () => (
  <View
    style={{ width: 78 }} className="items-center mr-3"
  >
    <View style={{ width: 62, height: 62 }} className="rounded-xl mb-1.5 bg-white opacity-60" />
    <View style={{ width: 52, height: 10 }} className="rounded bg-white opacity-60" />
  </View>
);

const SkeletonProductCard = () => (
  <View
    style={{ width: 172, borderColor: '#FCE4EC', borderWidth: 1 }}
    className="mr-3 bg-white rounded-2xl p-2.5 shadow-xs flex-col"
  >
    <View style={{ width: '100%', height: 126 }} className="rounded-xl mb-2 bg-[#F3F4F6] opacity-60" />
    <View style={{ width: 60, height: 8 }} className="rounded bg-white mb-1.5 opacity-60" />
    <View style={{ width: 110, height: 12 }} className="rounded bg-white mb-2 opacity-60" />
    <View style={{ width: 80, height: 14 }} className="rounded bg-white opacity-60 mb-2" />
    <View style={{ width: '100%', height: 28 }} className="rounded-full bg-white opacity-60 mt-auto" />
  </View>
);

// Authentic Beauty Brands Theme Palette Engine
const KNOWN_BRAND_COLORS = {
  'lakme': '#1A1A1A',
  'maybelline': '#D10024',
  'loreal': '#C7102E',
  "l'oreal": '#C7102E',
  'mac': '#111111',
  'nykaa': '#FC2779',
  'faces': '#C2477A',
  'faces canada': '#C2477A',
  'sugar': '#D7266E',
  'swiss beauty': '#BA2252',
  'kay beauty': '#C9637A',
  'colorbar': '#D6004C',
  'mamaearth': '#4B8233',
  'plum': '#5B2D6E',
  'insight': '#A33368',
  'insight cosmetics': '#A33368',
  'renee': '#A52A56',
  'wow': '#7B3828',
  'wow skin science': '#7B3828',
  'dot & key': '#E85D75',
  'minimalist': '#212529',
  'cetaphil': '#00639E',
  'neutrogena': '#007AC2',
  'the ordinary': '#333333',
  'forest essentials': '#7B5C35',
  'biotique': '#2E5F38',
  'himalaya': '#246B46',
  'kama ayurveda': '#4E3524',
  'nivea': '#002D72',
  'dove': '#004B87',
  'tresemme': '#1C1C1C',
  'matrix': '#D9222A',
  'streax': '#961937',
  'bblunt': '#E91E63',
  'khadi': '#4B6636',
  'olay': '#8C6D1F',
  'garnier': '#568203',
  'clinique': '#2B5838',
  'estee lauder': '#0E2A47',
  'huda beauty': '#9E2A5B',
  'pac': '#111111',
  'chambor': '#002A5C',
  'revlon': '#C60020',
  'bella vita': '#684B29',
  'ahsan': '#6B2D5C',
  'anoos': '#7A3E2D',
  '2.0hi': '#6B21A8'
};

const LUXURY_BRAND_PALETTE = [
  '#B8497D', '#9333EA', '#0F766E', '#1E40AF', '#BE185D',
  '#0369A1', '#B91C1C', '#4338CA', '#854D0E', '#065F46',
  '#9D174D', '#15803D', '#334155', '#6B21A8', '#831843'
];

export const getBrandThemeColor = (brand) => {
  if (!brand) return '#B8497D';
  if (brand.themeColor && brand.themeColor.startsWith('#')) return brand.themeColor;
  if (brand.color && brand.color.startsWith('#')) return brand.color;
  if (brand.brand_color && brand.brand_color.startsWith('#')) return brand.brand_color;
  if (brand.bgColor && brand.bgColor.startsWith('#')) return brand.bgColor;

  const raw = String(brand.name || '').trim().toLowerCase();
  const cleanKey = raw.replace(/[^a-z0-9]/g, '');
  if (KNOWN_BRAND_COLORS[raw]) return KNOWN_BRAND_COLORS[raw];
  if (KNOWN_BRAND_COLORS[cleanKey]) return KNOWN_BRAND_COLORS[cleanKey];

  for (const [k, c] of Object.entries(KNOWN_BRAND_COLORS)) {
    if (raw.includes(k) || k.includes(raw)) return c;
  }

  // Deterministic luxury palette fallback
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return LUXURY_BRAND_PALETTE[Math.abs(hash) % LUXURY_BRAND_PALETTE.length];
};

// Brand Card: Premium brand button with theme color background, white typography, subtle press animation
const BrandCard = ({ brand, onSelectBrand, onInteractionStart, onInteractionEnd, screenWidth = 375 }) => {
  const isTablet = screenWidth >= 600;
  const brandName = (brand.name || '').trim();
  const themeColor = getBrandThemeColor(brand);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    onInteractionStart?.();
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    onInteractionEnd?.();
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  };

  const hasLogo = Boolean(brand.logo && typeof brand.logo === 'string' && brand.logo.startsWith('http'));

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelectBrand(brand)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          minWidth: isTablet ? 140 : 112,
          height: isTablet ? 50 : 44,
          paddingHorizontal: 16,
          marginRight: 10,
          backgroundColor: themeColor,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          shadowColor: themeColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius: 5,
          elevation: 3,
        }}
      >
        {hasLogo && (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 1.5,
            }}
          >
            <Image
              source={getSafeImageSource(brand.logo)}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        )}
        <Text
          style={{
            fontSize: isTablet ? 13 : 11.5,
            fontWeight: '800',
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
          numberOfLines={1}
        >
          {brandName}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SkeletonBrandCard = () => (
  <View
    style={{
      width: 112,
      height: 44,
      borderRadius: 14,
      borderColor: '#F0E3EA',
      borderWidth: 1.5,
      backgroundColor: '#FFFFFF',
      marginRight: 10,
    }}
    className="opacity-60"
  />
);

// Salbeau Universal Product Card matching premium design
const HomeProductCard = React.memo(({
  product,
  badgeText = 'NEW',
  userRole,
  getRolePrice,
  isLiked = false,
  onToggleFavorite,
  onSelectProduct,
  cartQuantityMap,
  onAddToCart,
  onUpdateCartQty,
  onOpenShadeSheet,
}) => {
  const shades = useMemo(() => {
    return getSafeProductShadesList(product);
  }, [product]);
  const hasShades = shades.length > 0;

  const [selectedShade, setSelectedShade] = useState(() => hasShades ? shades[0] : null);

  useEffect(() => {
    if (hasShades) {
      if (!selectedShade || !shades.some(s => (s.id || s.name) === (selectedShade.id || selectedShade.name))) {
        setSelectedShade(shades[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [product?.id, hasShades, shades]);

  const currentCartKey = useMemo(() => {
    return getCartKey(product?.id, hasShades ? selectedShade : null);
  }, [product?.id, hasShades, selectedShade]);

  const cartQty = (cartQuantityMap && currentCartKey) ? (cartQuantityMap.get(currentCartKey) || 0) : 0;

  const rolePrice = useMemo(() => {
    if (typeof getRolePrice === 'function') {
      return getRolePrice(product, userRole, selectedShade, 1);
    }
    return product?.generalPrice || product?.mrp || 0;
  }, [product, userRole, selectedShade, getRolePrice]);

  const mrp = useMemo(() => {
    if (selectedShade?.priceOverride && Number(selectedShade.priceOverride) > rolePrice) {
      return Number(selectedShade.priceOverride);
    }
    if (product?.mrp && Number(product.mrp) > rolePrice) {
      return Number(product.mrp);
    }
    return Math.round(rolePrice * 1.25);
  }, [product?.mrp, selectedShade?.priceOverride, rolePrice]);

  const discountPercent = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 15;

  const displayImage = selectedShade?.image || selectedShade?.imageUrl || product?.image;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onSelectProduct(product, hasShades ? selectedShade : null)}
      style={{
        width: 172,
        borderColor: '#F3F4F6', borderWidth: 1, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
      }}
      className="mr-3 bg-white rounded-2xl p-2.5 flex-col"
    >
      {/* 1. Product Image Box with Badge & Wishlist Heart */}
      <View
        style={{ width: '100%', height: 126, borderColor: '#F3F4F6', borderWidth: 1 }} className="relative rounded-xl overflow-hidden mb-2 bg-[#F9FAFB] items-center justify-center"
      >
        <Image
          source={getSafeImageSource(displayImage, '')}
          style={{ width: '88%', height: '88%' }}
          resizeMode="contain"
        />

        {/* Badge (NEW, BESTSELLER, STAPLE) */}
        {badgeText ? (
          <View className="absolute top-2 left-2 bg-[#C2477A] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
              {badgeText}
            </Text>
          </View>
        ) : null}

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite(product);
          }}
          className="absolute top-2 right-2 p-1 items-center justify-center bg-transparent z-10"
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={19}
            color="#C2477A"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Brand Name in Pink */}
      <Text className="text-[9px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5" numberOfLines={1}>
        {product.brandName || product.brand || 'SALBEAU'}
      </Text>

      {/* 3. Product Name - Full 2-line Visibility */}
      <Text className="text-[11.5px] font-black text-[#1F2937] leading-tight mb-1 min-h-[30px]" numberOfLines={2}>
        {cleanProductDisplayName(product.name)}
      </Text>

      {/* 4. Shade Selection / Swatches */}
      {hasShades ? (
        <View className="mb-1">
          <Text className="text-[9.5px] font-medium text-[#6B7280] mb-1" numberOfLines={1}>
            Choose Shade: {selectedShade?.name || selectedShade?.title || 'Rose Pink'}
          </Text>
          <View className="flex-row items-center gap-1.5">
            {shades.slice(0, 4).map((shade, idx) => {
              const isSelected = selectedShade && (
                (selectedShade.id && shade.id && selectedShade.id === shade.id) ||
                (selectedShade.name && shade.name && selectedShade.name === shade.name)
              );
              const colorHex = shade.hexColor || shade.hex_color || '#C2477A';

              return (
                <TouchableOpacity
                  key={shade.id || shade.name || idx}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setSelectedShade(shade);
                  }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                >
                  <View
                    style={{
                      backgroundColor: colorHex,
                      borderColor: isSelected ? '#1F2937' : '#E5E7EB',
                      borderWidth: isSelected ? 2 : 1,
                      width: 17,
                      height: 17,
                      borderRadius: 8.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {shades.length > 4 && (
              <Text className="text-[9.5px] font-bold text-[#8C7078] ml-0.5">
                +{shades.length - 4}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={{ height: 28 }} className="justify-center">
          <Text className="text-[9.5px] font-medium text-[#9CA3AF]">
            Standard formulation
          </Text>
        </View>
      )}

      

      {/* 6. Pricing Row */}
      <View className="flex-row items-baseline gap-1.5 mb-2.5 flex-wrap">
        <Text className="text-xs font-black text-[#1F2937]">₹{rolePrice}</Text>
        {mrp > rolePrice && (
          <Text className="text-[9.5px] font-semibold text-[#9CA3AF] line-through">₹{mrp}</Text>
        )}
        {discountPercent > 0 && (
          <Text className="text-[9.5px] font-black text-[#E11D48]">{discountPercent}% OFF</Text>
        )}
      </View>

      {/* 7. Action Button: Choose Shade ⌵ / Add / Quantity Stepper */}
      <View className="mt-auto">
        {hasShades ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation?.();
              if (onOpenShadeSheet) {
                onOpenShadeSheet(product, selectedShade);
              }
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#C2477A',
              borderWidth: 1.2,
            }}
            className="w-full py-1.5 rounded-full flex-row items-center justify-center gap-1 shadow-2xs"
          >
            <Text className="text-[10.5px] font-bold text-[#C2477A]">
              Choose Shade
            </Text>
            <Ionicons name="chevron-down" size={11} color="#C2477A" />
          </TouchableOpacity>
        ) : cartQty > 0 ? (
          <View
            style={{
              backgroundColor: '#C2477A',
              shadowColor: '#C2477A',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}
            className="rounded-full flex-row items-center justify-between px-2 py-1 w-full"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onUpdateCartQty(currentCartKey, cartQty - 1);
              }}
              className="w-5 h-5 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="remove" size={12} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-[11px] font-black text-white px-1 text-center min-w-[16px]">
              {cartQty}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onUpdateCartQty(currentCartKey, cartQty + 1);
              }}
              className="w-5 h-5 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="add" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart(product, 1, null);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#C2477A',
              borderWidth: 1.2,
            }}
            className="w-full py-1.5 rounded-full flex-row items-center justify-center gap-1 shadow-2xs"
          >
            <Ionicons name="add" size={13} color="#C2477A" />
            <Text className="text-[11px] font-bold text-[#C2477A]">Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const HomeScreen = () => {
  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
    setSelectedShade,
    rememberSelectedShade,
    setSelectedCategory,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    searchQuery,
    setSearchQuery,
    activeProducts = [],
    categories = [],
    brands = [],
    activeBrands = [],
    favorites = [],
    isFavorite,
    toggleFavorite,
    setGlobalSearchQuery,
    refreshCatalog,
    isCatalogLoading = false,
    productSalesCounts = {},
    homeBanners = [],
    activeBanners = [],
    unreadNotificationsCount = 0,
    openShadeSheet,
    homeSectionVisibility = {}
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshCatalog) await refreshCatalog();
    } catch (e) {
      console.warn('Pull-to-refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCatalog]);

  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
  }, [cart]);

  const totalCartQuantity = useMemo(() => {
    return (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return (cart || []).reduce((sum, item) => {
      const price = getRolePrice(item.product, userRole, item.shade);
      return sum + (price * (item.quantity || 0));
    }, 0);
  }, [cart, userRole, getRolePrice]);

  // Customer-Specific Recently Viewed tracking with persistent storage
  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadRecentlyViewed = async () => {
      try {
        const saved = await storage.getItem('salbeau_recently_viewed_ids');
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setRecentlyViewedIds(parsed);
        }
      } catch (e) {}
    };
    loadRecentlyViewed();
    return () => { isMounted = false; };
  }, []);

  const handleProductSelect = useCallback((product, shade = null) => {
    if (product?.id) {
      setRecentlyViewedIds(prev => {
        const updated = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 10);
        storage.setItem('salbeau_recently_viewed_ids', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }
    if (setSelectedShade && shade) {
      setSelectedShade(shade);
    }
    if (rememberSelectedShade && (product?.id || product?.parentProductId) && shade) {
      rememberSelectedShade(product.parentProductId || product.id, shade);
    }
    setSelectedProduct(product);
    setCurrentScreen('product');
  }, [setSelectedProduct, setSelectedShade, setCurrentScreen]);

  // Promotional Banners Carousel with Auto-sliding
  const [activeSlide, setActiveSlide] = useState(0);
  const bannerScrollRef = useRef(null);

  const displayBanners = useMemo(() => {
    if (activeBanners && activeBanners.length > 0) return activeBanners;
    if (Array.isArray(homeBanners)) return homeBanners.filter(b => b.isActive !== false);
    return DEFAULT_HOME_BANNERS;
  }, [activeBanners, homeBanners]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % displayBanners.length;
        bannerScrollRef.current?.scrollTo({ x: next * (BANNER_WIDTH + 12), animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const handleBannerClick = useCallback((banner) => {
    if (!banner) {
      setCurrentScreen('search');
      return;
    }
    if (banner.destinationType === 'CATEGORY' && banner.destinationId) {
      if (setSelectedCategory) setSelectedCategory(banner.destinationId);
      setCurrentScreen('category');
    } else {
      if (setGlobalSearchQuery) setGlobalSearchQuery(banner.destinationId || banner.title || '');
      setCurrentScreen('search');
    }
  }, [setSelectedCategory, setGlobalSearchQuery, setCurrentScreen]);

  // 1. Shop by Category — precompute FA5 icons once here, never inside render
  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories
      .filter(c => c.enabled !== false && !c.id?.startsWith('app_') && !c.id?.startsWith('salbeau_'))
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map(cat => {
        const { icon, color, bg } = getCategoryFA5Icon(cat.name);
        const imageUrl = cat.image || cat.image_url || '';
        return { id: cat.id, name: cat.name, icon, color, bg, imageUrl: imageUrl || null };
      });
  }, [categories]);

  // 2. Trending Now Products
  const trendingProducts = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    return [...activeProducts].sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isTrending && b.isTrending) {
        return (b.trendingPriority || 0) - (a.trendingPriority || 0);
      }
      const salesA = productSalesCounts[a.id] || 0;
      const salesB = productSalesCounts[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return Number(b.sort_order ?? 99999) - Number(a.sort_order ?? 99999);
    }).slice(0, 10);
  }, [activeProducts, productSalesCounts]);

  // 3. All Brands for continuous auto-scrolling
  const allBrandsList = useMemo(() => {
    const list = activeBrands && activeBrands.length > 0 ? activeBrands : brands.filter(b => b.enabled !== false);
    return list.filter(b => b.name && !b.id?.startsWith('app_') && !b.id?.startsWith('salbeau_'));
  }, [activeBrands, brands]);
  const topBrandsList = allBrandsList;

  // Continuous auto-scroller for Shop by Brand with pause-on-touch & gentle resume
  const brandScrollRef = useRef(null);
  const brandScrollPos = useRef(0);
  const isBrandInteracting = useRef(false);
  const resumeTimerRef = useRef(null);

  const pauseBrandScroll = useCallback(() => {
    isBrandInteracting.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
  }, []);

  const resumeBrandScroll = useCallback((delay = 1800) => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isBrandInteracting.current = false;
    }, delay);
  }, []);

  useEffect(() => {
    if (!allBrandsList || allBrandsList.length <= 1) return;
    const itemWidth = 120; // approximate brand button width + gap
    const totalLoopWidth = allBrandsList.length * itemWidth;

    const interval = setInterval(() => {
      if (isBrandInteracting.current || !brandScrollRef.current) return;
      brandScrollPos.current += 1.0;
      if (brandScrollPos.current >= totalLoopWidth) {
        brandScrollPos.current = 0;
      }
      brandScrollRef.current.scrollTo({ x: brandScrollPos.current, animated: false });
    }, 25);

    return () => {
      clearInterval(interval);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [allBrandsList]);

  // 4. New Arrivals (Sorted by newest date)
  const newArrivals = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    return [...activeProducts]
      .filter(p => p.showInNewArrivals !== false)
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.created_at || 0).getTime();
        const timeB = new Date(b.publishedAt || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 10);
  }, [activeProducts]);

  // 5. Best Sellers (Dynamically based on real sales and order counts)
  const bestSellers = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    return [...activeProducts].sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      const salesA = productSalesCounts[a.id] || 0;
      const salesB = productSalesCounts[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return Number(b.sort_order ?? 99999) - Number(a.sort_order ?? 99999);
    }).slice(0, 10);
  }, [activeProducts, productSalesCounts]);

  // 6. Recently Viewed Products (User-specific tracking with persistence)
  const recentlyViewedProducts = useMemo(() => {
    if (!recentlyViewedIds.length || !activeProducts.length) return [];
    return recentlyViewedIds
      .map(id => activeProducts.find(p => p.id === id))
      .filter(Boolean);
  }, [recentlyViewedIds, activeProducts]);

  // 7. Essential Beauty Staples (Relevant everyday essentials from catalog)
  const beautyStaples = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const stapleKeywords = ['serum', 'lipstick', 'cleanser', 'facewash', 'sunscreen', 'primer', 'moisturizer', 'compact', 'kajal', 'cream'];
    const matches = activeProducts.filter(p => {
      const text = `${p.name} ${p.subcategory || ''} ${p.category || ''}`.toLowerCase();
      return stapleKeywords.some(k => text.includes(k));
    });
    return (matches.length > 0 ? matches : activeProducts).slice(0, 10);
  }, [activeProducts]);

  return (
    <View className="flex-1 bg-white relative">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (ACTUAL LOGO IMMEDIATELY + NOTIFICATIONS + WISHLIST + CART) */}
      {/* ========================================================================= */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#FFF0F5'
        }}
        className="px-4 py-1.5 bg-white z-30 flex-row justify-between items-center shadow-xs"
      >
        {/* Actual Salbeau Brand Logo rendered immediately on frame 0 with 0ms delay and zero font flicker */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setCurrentScreen('home')}
          className="items-center justify-center ml-0.5"
        >
          <Image
            source={require('../../../Assets/Logo_transparent.png')}
            style={{ width: 118, height: 38 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Top-Right Action Icons */}
        <View className="flex-row items-center gap-3">
          {/* Notification Bell */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setCurrentScreen('notifications')}
            className="p-1 items-center justify-center relative bg-transparent"
          >
            <Ionicons name="notifications-outline" size={24} color="#C2477A" />
            {unreadNotificationsCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#C2477A] min-w-[16px] h-[16px] px-1 rounded-full items-center justify-center shadow-xs">
                <Text className="text-white text-[8px] font-black">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Wishlist Heart */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setCurrentScreen('wishlist')}
            className="p-1 items-center justify-center relative bg-transparent"
          >
            <Ionicons name={favorites.length > 0 ? "heart" : "heart-outline"} size={24} color="#C2477A" />
            {favorites.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#C2477A] min-w-[16px] h-[16px] px-1 rounded-full items-center justify-center shadow-xs">
                <Text className="text-white text-[8px] font-black">{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart Bag with Badge */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setCurrentScreen('cart')}
            className="p-1 items-center justify-center relative bg-transparent"
          >
            <Ionicons name="cart-outline" size={25} color="#C2477A" />
            {totalCartQuantity > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#C2477A] min-w-[16px] h-[16px] px-1 rounded-full items-center justify-center shadow-xs">
                <Text className="text-white text-[8px] font-black">
                  {totalCartQuantity > 9 ? '9+' : totalCartQuantity}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 10, paddingBottom: totalCartQuantity > 0 ? 150 : 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="bg-white"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C2477A']}
            tintColor="#C2477A"
          />
        }
      >
        {/* ========================================================================= */}
        {/* 2. SEARCH BAR (SEARCH INPUT + BARCODE SCANNER ICON)                       */}
        {/* ========================================================================= */}
        <View className="px-4 mb-3.5">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (setGlobalSearchQuery && searchQuery) setGlobalSearchQuery(searchQuery);
              setCurrentScreen('search');
            }}
            style={{ borderColor: '#E5E7EB', borderWidth: 1 }}
            className="w-full flex-row items-center bg-white px-3.5 py-2.5 rounded-full shadow-xs"
          >
            <Ionicons name="search-outline" size={17} color="#9CA3AF" />
            <Text
              className="flex-1 text-xs font-medium text-[#9CA3AF] px-2.5"
              numberOfLines={1}
            >
              {searchQuery || 'Search for skincare, makeup, hair care...'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation?.();
                setCurrentScreen('search');
              }}
            >
              <Ionicons name="scan-outline" size={19} color="#C2477A" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 3. PROMOTIONAL BANNER CAROUSEL (COMPLETE IMAGE DISPLAY WITHOUT CROPPING)   */}
        {/* ========================================================================= */}
        {displayBanners.length > 0 && (
        <View className="mb-5">
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / (BANNER_WIDTH + 12));
              setActiveSlide(Math.max(0, Math.min(newIndex, displayBanners.length - 1)));
            }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            decelerationRate="fast"
            snapToInterval={BANNER_WIDTH + 12}
            snapToAlignment="start"
          >
            {displayBanners.map((banner, idx) => {
              const rawUrl = (banner.imageUrl && typeof banner.imageUrl === 'string' && banner.imageUrl.trim().length > 0)
                ? banner.imageUrl.trim()
                : '';
              const imageSource = rawUrl ? getSafeImageSource(rawUrl) : null;

              return (
                <View
                  key={banner.id || idx}
                  style={{
                    width: BANNER_WIDTH,
                    height: BANNER_HEIGHT,
                    marginRight: idx < displayBanners.length - 1 ? 12 : 0,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    borderColor: '#F0E3EA',
                    borderWidth: 1,
                    elevation: 3,
                    shadowColor: '#B64F7D',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => handleBannerClick(banner)}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {imageSource ? (
                      /* Display complete banner image across container with crisp proportion and zero distortion */
                      <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <Image
                          source={imageSource}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      /* Styled editorial fallback card */
                      <View className="flex-1 flex-row items-center justify-between p-4 relative bg-white">
                        <View className="flex-1 pr-3 justify-center z-10">
                          <Text
                            className="text-lg font-black text-[#3A2430] leading-tight mb-1"
                            numberOfLines={2}
                          >
                            {banner.title || 'Healthy Hair Starts Here'}
                          </Text>
                          <Text
                            className="text-xs font-semibold text-[#8C7078] mb-3"
                            numberOfLines={1}
                          >
                            {banner.subtitle || 'Nourish • Repair • Shine'}
                          </Text>
                          <View className="bg-[#C2477A] px-3.5 py-1.5 rounded-full self-start flex-row items-center gap-1 shadow-xs">
                            <Text className="text-white text-[11px] font-bold">
                              {banner.ctaLabel || 'Shop Hair Care →'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Carousel Pagination Dots */}
          {displayBanners.length > 1 && (
            <View className="flex-row items-center justify-center gap-1.5 mt-2.5">
              {displayBanners.map((banner, idx) => (
                <TouchableOpacity
                  key={`dot-${banner.id || idx}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveSlide(idx);
                    bannerScrollRef.current?.scrollTo({ x: idx * (BANNER_WIDTH + 12), animated: true });
                  }}
                  className={`h-1.5 rounded-full ${
                    activeSlide === idx ? 'w-5 bg-[#B64F7D]' : 'w-1.5 bg-[#B64F7D]/30'
                  }`}
                />
              ))}
            </View>
          )}
        </View>
        )}

        {/* ========================================================================= */}
        {/* 4. SHOP BY CATEGORY (PREMIUM RESPONSIVE CATEGORY SECTION)                 */}
        {/* ========================================================================= */}
        {(homeSectionVisibility?.shopCategories !== false) && (displayCategories.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="Shop by Category"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('category')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            >
              {displayCategories.length > 0
                ? displayCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id || cat.name}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (setSelectedCategory) setSelectedCategory(cat.name);
                        setCurrentScreen('category');
                      }}
                      style={{ width: 84, borderColor: '#FCE4EC', borderWidth: 1 }}
                      className="bg-white rounded-2xl p-2 items-center mr-3 shadow-xs"
                    >
                      <View
                        style={{
                          width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF',
                          borderColor: '#F8B4D9', borderWidth: 1.5,
                          marginBottom: 6,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                          elevation: 3,
                          shadowColor: '#C2477A',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.18,
                          shadowRadius: 4,
                        }}
                      >
                        {cat.imageUrl ? (
                          <Image
                            source={getSafeImageSource(cat.imageUrl)}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <FontAwesome5 name={cat.icon || 'sparkles'} size={24} color={cat.color || '#C2477A'} />
                        )}
                      </View>
                      <Text
                        className="text-[11px] font-bold text-[#3A2430] text-center min-h-[28px] leading-tight"
                        numberOfLines={2}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                : [1, 2, 3, 4, 5].map((k) => <SkeletonCategoryCard key={`sk_cat_${k}`} />)}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 5. TRENDING NOW PRODUCT CAROUSEL                                          */}
        {/* ========================================================================= */}
        {(homeSectionVisibility?.heroPromoBanner !== false) && (trendingProducts.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="🔥 Trending Now"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {trendingProducts.length > 0
                ? trendingProducts.map((item) => (
                    <HomeProductCard key={`trend_${item.id}`} product={item} badgeText="NEW" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
                  ))
                : [1,2,3].map((k) => <SkeletonProductCard key={`sk_trend_${k}`} />)}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 6. SHOP BY BRAND (UNIFORM CIRCULAR LOGOS WITH LABELS UNDERNEATH)          */}
        {/* ========================================================================= */}
        {(homeSectionVisibility?.featuredBrands !== false) && (topBrandsList.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="Shop by Brand"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView
              ref={brandScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onTouchStart={pauseBrandScroll}
              onTouchEnd={() => resumeBrandScroll(1800)}
              onScrollBeginDrag={pauseBrandScroll}
              onScrollEndDrag={() => resumeBrandScroll(1800)}
              onMomentumScrollBegin={pauseBrandScroll}
              onMomentumScrollEnd={() => resumeBrandScroll(1800)}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            >
              {allBrandsList.length > 0
                ? (allBrandsList.length > 3 ? [...allBrandsList, ...allBrandsList] : allBrandsList).map((brand, idx) => (
                    <BrandCard
                      key={`${brand.id || brand.name}_${idx}`}
                      brand={brand}
                      screenWidth={SCREEN_WIDTH}
                      onInteractionStart={pauseBrandScroll}
                      onInteractionEnd={() => resumeBrandScroll(1800)}
                      onSelectBrand={(b) => {
                        const brandQuery = (b.name || '').replace('\n', ' ');
                        if (setGlobalSearchQuery) setGlobalSearchQuery(brandQuery);
                        setSearchQuery(brandQuery);
                        setCurrentScreen('search');
                      }}
                    />
                  ))
                : [1, 2, 3, 4, 5].map((k) => (
                    <SkeletonBrandCard key={`sk_brand_${k}`} />
                  ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 7. NEW ARRIVALS CAROUSEL                                                  */}
        {/* ========================================================================= */}
        {(newArrivals.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="New Arrivals"
              iconBadgeText="NEW"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {newArrivals.length > 0
                ? newArrivals.map((item) => (
                    <HomeProductCard key={`na_${item.id}`} product={item} badgeText="NEW" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
                  ))
                : [1,2,3].map((k) => <SkeletonProductCard key={`sk_na_${k}`} />)}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8A. BEST SELLERS (DYNAMICALLY RANKED BY REAL SALES AND ORDERS)            */}
        {/* ========================================================================= */}
        {(homeSectionVisibility?.bestSellers !== false) && (bestSellers.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="Best Sellers"
              iconName="flame"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {bestSellers.length > 0
                ? bestSellers.map((item) => (
                    <HomeProductCard key={`bs_${item.id}`} product={item} badgeText="BESTSELLER" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
                  ))
                : [1,2,3].map((k) => <SkeletonProductCard key={`sk_bs_${k}`} />)}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8B. RECENTLY VIEWED (CUSTOMER-SPECIFIC TRACKING & PERSISTENCE)            */}
        {/* ========================================================================= */}
        {recentlyViewedProducts.length > 0 && (
          <View className="mb-6">
            <SectionHeader
              title="Recently Viewed"
              iconName="time-outline"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {recentlyViewedProducts.map((item) => (
                <HomeProductCard key={`rv_${item.id}`} product={item} badgeText="" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8C. ESSENTIAL BEAUTY STAPLES (EVERYDAY CATALOG BEAUTY FORMULATIONS)       */}
        {/* ========================================================================= */}
        {(beautyStaples.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="Essential Beauty Staples"
              iconName="sparkles"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {beautyStaples.length > 0
                ? beautyStaples.map((item) => (
                    <HomeProductCard key={`staple_${item.id}`} product={item} badgeText="STAPLE" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
                  ))
                : [1,2,3].map((k) => <SkeletonProductCard key={`sk_staple_${k}`} />)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 9. STICKY CART SUMMARY BAR (FLOATING ABOVE BOTTOM NAVIGATION)             */}
      {/* ========================================================================= */}
      {totalCartQuantity > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 14,
            right: 14,
            zIndex: 50,
            backgroundColor: '#C2477A',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          className="rounded-2xl px-4 py-2.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="bag-handle" size={17} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xs font-black text-white tracking-wide">
                {totalCartQuantity} {totalCartQuantity === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice.toFixed(2).replace(/\.00$/, '')}
              </Text>
              <Text className="text-[10px] font-medium text-pink-100">
                Free delivery on orders above ₹499
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('cart')}
            className="bg-white px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-xs"
          >
            <Text className="text-[11px] font-black text-[#C2477A] uppercase tracking-wider">
              View Cart
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#C2477A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
