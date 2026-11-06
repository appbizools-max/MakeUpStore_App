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
import { getSubcategoriesForCategory } from '../../config/categoriesHierarchy';

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
  <View style={{ width: 66, alignItems: 'center', marginRight: 14 }}>
    <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#F5F5F6', marginBottom: 6 }} />
    <View style={{ width: 48, height: 10, borderRadius: 4, backgroundColor: '#F5F5F6' }} />
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

// Exact Logo Color Engine: Uniform Brand Pink Theme (#C2477A) with Crisp White Typography
export const getBrandThemeColor = (brand) => {
  return '#C2477A';
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
    if (selectedShade?.mrp && Number(selectedShade.mrp) > rolePrice) {
      return Number(selectedShade.mrp);
    }
    if (product?.mrp && Number(product.mrp) > rolePrice) {
      return Number(product.mrp);
    }
    return rolePrice;
  }, [product?.mrp, selectedShade?.priceOverride, selectedShade?.mrp, rolePrice]);

  const discountPercent = (mrp > rolePrice && mrp > 0) ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;

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
        style={{ width: '100%', height: 126, borderColor: '#F3F4F6', borderWidth: 1 }} className="relative rounded-xl overflow-hidden mb-2 bg-white items-center justify-center"
      >
        <Image
          source={getSafeImageSource(displayImage, '')}
          style={{ width: '88%', height: '88%' }}
          resizeMode="contain"
        />

        {/* Dynamic Offer / Priority Badge (only when applied from admin panel) */}
        {discountPercent > 0 ? (
          <View className="absolute top-2 left-2 bg-[#E11D48] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
              {discountPercent}% OFF
            </Text>
          </View>
        ) : (product?.isBestSeller || product?.is_bestseller) ? (
          <View className="absolute top-2 left-2 bg-[#C2477A] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
              BESTSELLER
            </Text>
          </View>
        ) : (product?.isRecommended || product?.is_recommended) ? (
          <View className="absolute top-2 left-2 bg-[#C2477A] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
              TOP PICK
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
    subcategories = [],
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
      } catch (e) { }
    };
    loadRecentlyViewed();
    return () => { isMounted = false; };
  }, []);

  const handleProductSelect = useCallback((product, shade = null) => {
    if (product?.id) {
      setRecentlyViewedIds(prev => {
        const updated = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 10);
        storage.setItem('salbeau_recently_viewed_ids', JSON.stringify(updated)).catch(() => { });
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

  // Active Category & Animated Sliding Tab Indicator for Home Screen Categories Section
  const [activeCategoryHome, setActiveCategoryHome] = useState(null);

  useEffect(() => {
    if (displayCategories.length > 0 && !activeCategoryHome) {
      setActiveCategoryHome(displayCategories[0]);
    }
  }, [displayCategories]);

  const categoryIndicatorX = useRef(new Animated.Value(0)).current;
  const categoryIndicatorWidth = useRef(new Animated.Value(0)).current;
  const categoryContentOpacity = useRef(new Animated.Value(1)).current;
  const categoryContentTranslateX = useRef(new Animated.Value(0)).current;

  const categoryTabLayouts = useRef({});
  const categoryTabsScrollRef = useRef(null);
  const hasInitializedCategoryIndicator = useRef(false);

  const moveCategoryIndicator = useCallback((x, width, animated = true) => {
    if (typeof x !== 'number' || isNaN(x) || typeof width !== 'number' || isNaN(width) || width <= 0) return;
    if (animated) {
      Animated.parallel([
        Animated.spring(categoryIndicatorX, {
          toValue: x,
          friction: 7,
          tension: 70,
          useNativeDriver: false,
        }),
        Animated.spring(categoryIndicatorWidth, {
          toValue: width,
          friction: 7,
          tension: 70,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      categoryIndicatorX.setValue(x);
      categoryIndicatorWidth.setValue(width);
    }
  }, [categoryIndicatorX, categoryIndicatorWidth]);

  const handleCategoryTabLayout = (cat, layout) => {
    if (!cat || !layout) return;
    const key = (cat.name || cat.id || '').toLowerCase();
    categoryTabLayouts.current[key] = layout;

    const currentKey = (activeCategoryHome?.name || (displayCategories[0]?.name) || '').toLowerCase();
    if (key === currentKey && !hasInitializedCategoryIndicator.current && typeof layout.x === 'number' && typeof layout.width === 'number' && layout.width > 0) {
      moveCategoryIndicator(layout.x, layout.width, false);
      hasInitializedCategoryIndicator.current = true;
      const targetScrollX = Math.max(0, layout.x - (SCREEN_WIDTH / 2) + (layout.width / 2));
      categoryTabsScrollRef.current?.scrollTo({ x: targetScrollX, animated: false });
    }
  };

  const handleCategoryTabPress = (newCat, newIndex) => {
    const currentName = (activeCategoryHome?.name || displayCategories[0]?.name || '').toLowerCase();
    const oldIndex = displayCategories.findIndex(c => (c.name || '').toLowerCase() === currentName);
    if (oldIndex === newIndex) return;

    const key = (newCat.name || newCat.id || '').toLowerCase();
    const layout = categoryTabLayouts.current[key];

    // 1. Move active tab indicator with spring physics
    if (layout) {
      moveCategoryIndicator(layout.x, layout.width, true);
      const targetScrollX = Math.max(0, layout.x - (SCREEN_WIDTH / 2) + (layout.width / 2));
      categoryTabsScrollRef.current?.scrollTo({ x: targetScrollX, animated: true });
    }

    const direction = newIndex > oldIndex ? 1 : -1;

    // 2. Previous category content smoothly fades / slides out
    Animated.parallel([
      Animated.timing(categoryContentOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(categoryContentTranslateX, {
        toValue: -18 * direction,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Update category state dynamically (NO full reload!)
      setActiveCategoryHome(newCat);
      categoryContentTranslateX.setValue(18 * direction);

      // 4. New category content fades / slides in
      Animated.parallel([
        Animated.timing(categoryContentOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(categoryContentTranslateX, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Dynamic Subcategories for currently active category tab on Home Screen
  const activeSubcategoriesHome = useMemo(() => {
    const targetCat = activeCategoryHome || displayCategories[0];
    if (!targetCat) return [];

    const nCatId = (targetCat.id || '').toLowerCase().trim();
    const nCatName = (targetCat.name || '').toLowerCase().trim();

    if (Array.isArray(subcategories) && subcategories.length > 0) {
      const matched = subcategories.filter(s => {
        if (s.enabled === false) return false;
        const sCatId = (s.categoryId || s.category_id || '').toLowerCase().trim();
        const sCatName = (s.categoryName || s.category_name || s.parentCategory || '').toLowerCase().trim();
        return (nCatId && sCatId === nCatId) ||
               (nCatName && (sCatId === nCatName || sCatName === nCatName));
      });
      if (matched.length > 0) {
        return matched.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      }
    }

    return getSubcategoriesForCategory(targetCat);
  }, [activeCategoryHome, displayCategories, subcategories]);

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
    const seen = new Set();
    const unique = [];
    list.forEach(b => {
      const norm = (b.name || '').trim().toLowerCase();
      if (norm && !seen.has(norm) && !b.id?.startsWith('app_') && !b.id?.startsWith('salbeau_')) {
        seen.add(norm);
        unique.push(b);
      }
    });
    return unique;
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
      brandScrollPos.current += 1.2;
      if (brandScrollPos.current >= totalLoopWidth) {
        brandScrollPos.current = 0;
      }
      brandScrollRef.current.scrollTo({ x: brandScrollPos.current, animated: false });
    }, 35);

    return () => {
      clearInterval(interval);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [allBrandsList]);

  // 4. New Arrivals & Recent Products (Driven dynamically by Admin Panel selection & priority)
  const newArrivals = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const markedRecent = activeProducts.filter(p => p.isRecentProduct === true);
    if (markedRecent.length > 0) {
      return [...markedRecent].sort((a, b) => {
        const prioA = Number(a.recentPriority ?? a.sort_order ?? 99999);
        const prioB = Number(b.recentPriority ?? b.sort_order ?? 99999);
        if (prioA !== prioB) return prioA - prioB;
        const timeA = new Date(a.publishedAt || a.created_at || 0).getTime();
        const timeB = new Date(b.publishedAt || b.created_at || 0).getTime();
        return timeB - timeA;
      }).slice(0, 15);
    }
    return [...activeProducts]
      .filter(p => p.showInNewArrivals !== false)
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.created_at || 0).getTime();
        const timeB = new Date(b.publishedAt || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 10);
  }, [activeProducts]);

  // 5. Best Sellers (Driven dynamically by Admin Panel selection & priority)
  const bestSellers = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const markedBestSellers = activeProducts.filter(p => p.isBestSeller === true);
    if (markedBestSellers.length > 0) {
      return [...markedBestSellers].sort((a, b) => {
        const prioA = Number(a.bestSellerPriority ?? a.sort_order ?? 99999);
        const prioB = Number(b.bestSellerPriority ?? b.sort_order ?? 99999);
        if (prioA !== prioB) return prioA - prioB;
        const salesA = productSalesCounts[a.id] || 0;
        const salesB = productSalesCounts[b.id] || 0;
        return salesB - salesA;
      }).slice(0, 15);
    }
    return [...activeProducts].sort((a, b) => {
      const salesA = productSalesCounts[a.id] || 0;
      const salesB = productSalesCounts[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return Number(a.sort_order ?? 99999) - Number(b.sort_order ?? 99999);
    }).slice(0, 10);
  }, [activeProducts, productSalesCounts]);

  // 5B. Top Recommendations (Driven dynamically by Admin Panel selection & priority)
  const topRecommendations = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const markedRecs = activeProducts.filter(p => p.isTopRecommendation === true);
    if (markedRecs.length > 0) {
      return [...markedRecs].sort((a, b) => {
        const prioA = Number(a.recommendationPriority ?? a.sort_order ?? 99999);
        const prioB = Number(b.recommendationPriority ?? b.sort_order ?? 99999);
        if (prioA !== prioB) return prioA - prioB;
        return (Number(b.rating || 0) - Number(a.rating || 0));
      }).slice(0, 15);
    }
    return [...activeProducts]
      .filter(p => (Number(p.rating || 0) >= 4.0 || p.isFeatured))
      .sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)))
      .slice(0, 10);
  }, [activeProducts]);

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
        {/* 3. SHOP BY CATEGORY WITH ANIMATED SLIDING ACTIVE TAB INDICATOR            */}
        {/* ========================================================================= */}
        {(homeSectionVisibility?.shopCategories !== false) && (displayCategories.length > 0 || isCatalogLoading) && (
          <View className="mb-5">
            <SectionHeader
              title="Shop by Category"
              subtitle="Select a category to explore authentic formulations"
              ctaText="View All →"
              onCtaPress={() => {
                if (setSelectedCategory && activeCategoryHome) setSelectedCategory(activeCategoryHome.name);
                setCurrentScreen('category');
              }}
            />

            {/* Horizontal Category Tabs Bar - Curved Tab Bar Container with Animated Sliding Indicator */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#F0F1F3',
                marginBottom: 10,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                shadowColor: '#C2477A',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <ScrollView
                ref={categoryTabsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 8,
                  paddingBottom: 10,
                  alignItems: 'center',
                }}
              >
                {/* Curved Animated Active Sliding Indicator */}
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: categoryIndicatorX,
                    width: categoryIndicatorWidth,
                    bottom: 0,
                    height: 4.5,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 2,
                    backgroundColor: '#C2477A',
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    elevation: 4,
                    zIndex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {/* Curved light reflection on top edge */}
                  <View
                    style={{
                      width: '45%',
                      height: 1.5,
                      borderRadius: 1,
                      backgroundColor: '#FFFFFF',
                      opacity: 0.75,
                      marginTop: 0.5,
                    }}
                  />
                </Animated.View>

                {displayCategories.map((cat, idx) => {
                  const currentName = (activeCategoryHome?.name || displayCategories[0]?.name || '').toLowerCase();
                  const isSelected = (cat.name || '').toLowerCase() === currentName;
                  const catIconInfo = getCategoryFA5Icon(cat.name);

                  return (
                    <TouchableOpacity
                      key={cat.id || cat.name || idx}
                      activeOpacity={0.8}
                      onPress={() => handleCategoryTabPress(cat, idx)}
                      onLayout={(e) => handleCategoryTabLayout(cat, e.nativeEvent.layout)}
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16,
                        minWidth: 64,
                        paddingVertical: 2,
                        zIndex: 2,
                      }}
                    >
                      {/* Top: Curved Story / Category Bubble */}
                      <View
                        style={{
                          width: isSelected ? 60 : 56,
                          height: isSelected ? 60 : 56,
                          borderRadius: isSelected ? 30 : 28,
                          backgroundColor: '#FFFFFF',
                          borderColor: isSelected ? '#C2477A' : '#EAEAEC',
                          borderWidth: isSelected ? 2.5 : 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 6,
                          overflow: 'hidden',
                          shadowColor: isSelected ? '#C2477A' : '#000000',
                          shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
                          shadowOpacity: isSelected ? 0.28 : 0.05,
                          shadowRadius: isSelected ? 6 : 2,
                          elevation: isSelected ? 4 : 1,
                        }}
                      >
                        {(cat.imageUrl || cat.image) ? (
                          <Image
                            source={getSafeImageSource(cat.imageUrl || cat.image)}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: isSelected ? 30 : 28,
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <FontAwesome5
                            name={catIconInfo.icon || 'sparkles'}
                            size={20}
                            color={isSelected ? '#C2477A' : '#718096'}
                          />
                        )}
                      </View>

                      {/* Bottom: Myntra Clean Category Label */}
                      <Text
                        style={{
                          color: isSelected ? '#C2477A' : '#282C3F',
                          fontSize: 11,
                          fontWeight: isSelected ? '700' : '500',
                          textAlign: 'center',
                          letterSpacing: 0.1,
                          maxWidth: 66,
                        }}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Animated Dynamic Subcategory Content (Fade / Slide Transition) - Only Text Pills */}
            <Animated.View
              style={{
                opacity: categoryContentOpacity,
                transform: [{ translateX: categoryContentTranslateX }],
                marginBottom: 6,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  alignItems: 'center',
                }}
              >
                {/* "All" Category Text Pill */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    if (setSelectedCategory && activeCategoryHome) setSelectedCategory(activeCategoryHome.name);
                    setCurrentScreen('category');
                  }}
                  style={{
                    backgroundColor: '#FFF0F5',
                    borderColor: '#F8B4D9',
                    borderWidth: 1.2,
                    borderRadius: 20,
                    paddingVertical: 7,
                    paddingHorizontal: 15,
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: '#C2477A',
                      letterSpacing: 0.1,
                    }}
                  >
                    All {activeCategoryHome?.name || ''}
                  </Text>
                </TouchableOpacity>

                {activeSubcategoriesHome && activeSubcategoriesHome.length > 0 ? (
                  activeSubcategoriesHome.map((sub, idx) => (
                    <TouchableOpacity
                      key={sub.id || sub.name || idx}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (setSelectedCategory) setSelectedCategory(activeCategoryHome?.name || displayCategories[0]?.name);
                        setCurrentScreen('category');
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#F0E3EA',
                        borderWidth: 1.2,
                        borderRadius: 20,
                        paddingVertical: 7,
                        paddingHorizontal: 15,
                        marginRight: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#C2477A',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: '#374151',
                          letterSpacing: 0.1,
                        }}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : null}
              </ScrollView>
            </Animated.View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 4. PROMOTIONAL BANNER CAROUSEL (COMPLETE IMAGE DISPLAY WITHOUT CROPPING)   */}
        {/* ========================================================================= */}
        {displayBanners.length > 0 && (
          <View className="mb-6">
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
                    className={`h-1.5 rounded-full ${activeSlide === idx ? 'w-5 bg-[#B64F7D]' : 'w-1.5 bg-[#B64F7D]/30'
                      }`}
                  />
                ))}
              </View>
            )}
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
                : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_trend_${k}`} />)}
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
                ? allBrandsList.map((brand, idx) => (
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
                : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_na_${k}`} />)}
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
                : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_bs_${k}`} />)}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8A2. TOP RECOMMENDATIONS (DYNAMICALLY MANAGED FROM ADMIN CATALOG MATRIX) */}
        {/* ========================================================================= */}
        {(topRecommendations.length > 0 || isCatalogLoading) && (
          <View className="mb-6">
            <SectionHeader
              title="Top Recommendations"
              iconName="star"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
              {topRecommendations.length > 0
                ? topRecommendations.map((item) => (
                  <HomeProductCard key={`tr_${item.id}`} product={item} badgeText="RECOMMENDED" userRole={userRole} getRolePrice={getRolePrice} isLiked={isFavorite(item.id)} onToggleFavorite={toggleFavorite} onSelectProduct={handleProductSelect} cartQuantityMap={cartQuantityMap} onAddToCart={(prod, qty, shade) => addToCart(prod, qty || 1, shade)} onUpdateCartQty={updateCartQuantity} onOpenShadeSheet={openShadeSheet} />
                ))
                : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_tr_${k}`} />)}
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
                : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_staple_${k}`} />)}
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
