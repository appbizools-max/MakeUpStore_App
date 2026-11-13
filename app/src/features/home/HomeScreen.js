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
import { getSubcategoriesForCategory, findCategoryConfig, CATEGORY_IMAGES } from '../../config/categoriesHierarchy';
import { PurplleProductCard } from '../../components/PurplleProductCard';
import { ContinuousBrandScroller } from './components/ContinuousBrandScroller';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - 32, 600);
const BANNER_HEIGHT = Math.max(160, Math.round(BANNER_WIDTH * (510 / 1200)));

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
            <View className="bg-[#D81B60] w-5 h-5 rounded-full items-center justify-center shadow-2xs mr-0.5">
              <Text className="text-white text-[7.5px] font-black uppercase tracking-tighter">
                {iconBadgeText}
              </Text>
            </View>
          )}
          {iconName && <Ionicons name={iconName} size={16} color="#D81B60" />}
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
            <Text className="text-xs font-bold text-[#D81B60]">{cleanCta}</Text>
            <Ionicons name="arrow-forward" size={13} color="#D81B60" />
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

// Exact Logo Color Engine: Uniform Brand Pink Theme (#D81B60) with Crisp White Typography
export const getBrandThemeColor = (brand) => {
  return '#D81B60';
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
          <View className="absolute top-2 left-2 bg-[#D81B60] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
              BESTSELLER
            </Text>
          </View>
        ) : (product?.isRecommended || product?.is_recommended) ? (
          <View className="absolute top-2 left-2 bg-[#D81B60] px-1.5 py-0.5 rounded-md shadow-xs">
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
            color="#D81B60"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Brand Name in Pink */}
      <Text className="text-[9px] font-bold text-[#D81B60] uppercase tracking-wider mb-0.5" numberOfLines={1}>
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
              const colorHex = shade.hexColor || shade.hex_color || '#D81B60';

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
              backgroundColor: cartQty > 0 ? '#D81B60' : '#FFFFFF',
              borderColor: '#D81B60',
              borderWidth: 1.2,
            }}
            className="w-full py-1.5 rounded-full flex-row items-center justify-center gap-1 shadow-2xs"
          >
            {cartQty > 0 ? (
              <>
                <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
                <Text className="text-[10.5px] font-black text-white">
                  In Bag ({cartQty}) • Shades ⌵
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[10.5px] font-bold text-[#D81B60]">
                  Choose Shade
                </Text>
                <Ionicons name="chevron-down" size={11} color="#D81B60" />
              </>
            )}
          </TouchableOpacity>
        ) : cartQty > 0 ? (
          <View
            style={{
              backgroundColor: '#D81B60',
              shadowColor: '#D81B60',
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
              borderColor: '#D81B60',
              borderWidth: 1.2,
            }}
            className="w-full py-1.5 rounded-full flex-row items-center justify-center gap-1 shadow-2xs"
          >
            <Ionicons name="add" size={13} color="#D81B60" />
            <Text className="text-[11px] font-bold text-[#D81B60]">Add</Text>
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
    selectedSubcategory,
    setSelectedSubcategory,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
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
    homeSectionVisibility = {},
    storeSettings
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

  // Continuous Promotional Banners Slideshow
  const [activeSlide, setActiveSlide] = useState(0);
  const activeSlideRef = useRef(0);
  const bannerScrollRef = useRef(null);

  const displayBanners = useMemo(() => {
    let source = [];
    if (activeBanners && activeBanners.length > 0) source = activeBanners;
    else if (Array.isArray(homeBanners)) source = homeBanners.filter(b => b.isActive !== false);
    else source = DEFAULT_HOME_BANNERS;
    return source.filter(b => b && b.id !== 'banner_1' && b.title !== 'Glow Your Own Way' && b.name !== 'Glow Your Own Way');
  }, [activeBanners, homeBanners]);

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeSlideRef.current + 1) % displayBanners.length;
      activeSlideRef.current = next;
      setActiveSlide(next);
      bannerScrollRef.current?.scrollTo({ x: next * (BANNER_WIDTH + 12), animated: true });
    }, 3600);
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

  // ── MYNTRA-INSPIRED CATEGORY NAVIGATION & DYNAMIC TAXONOMY ARCHITECTURE ────────
  // Dynamic Category Navigation (Row 1): 'All' + Store Categories with 3D Imagery & Gold Rings
  const categoryNavTabs = useMemo(() => {
    const defaultCategories = [
      { key: 'MAKEUP', label: 'Makeup', name: 'Makeup', image: CATEGORY_IMAGES?.makeup },
      { key: 'SKINCARE', label: 'Skincare', name: 'Skincare', image: CATEGORY_IMAGES?.skincare },
      { key: 'HAIR_CARE', label: 'Hair Care', name: 'Hair Care', image: CATEGORY_IMAGES?.hairCare },
      { key: 'HAIR_STYLING', label: 'Hair Styling', name: 'Hair Styling Tools', image: CATEGORY_IMAGES?.hairStylingTools },
      { key: 'BATH_BODY', label: 'Bath & Body', name: 'Bath & Body', image: CATEGORY_IMAGES?.bathBody },
    ];

    if (displayCategories && displayCategories.length > 0) {
      const tabs = [];
      displayCategories.forEach((cat) => {
        const name = (cat.name || cat.title || '').trim();
        if (name && !tabs.some(t => t.name.toLowerCase() === name.toLowerCase())) {
          const config = findCategoryConfig ? findCategoryConfig(name) : null;
          tabs.push({
            key: name.toUpperCase().replace(/\s+/g, '_'),
            label: name,
            name: name,
            image: cat.imageUrl || cat.image || config?.image || null,
            category: cat,
          });
        }
      });
      return tabs.length > 0 ? tabs : defaultCategories;
    }
    return defaultCategories;
  }, [displayCategories]);

  const DEPARTMENT_TABS = useMemo(() => categoryNavTabs.map(t => t.label), [categoryNavTabs]);
  const [activeDepartmentTab, setActiveDepartmentTab] = useState('Makeup');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const isAllCategoryFilterSelected = selectedCategoryFilter === 'All';

  // Animated Values & Layout Measurements for Raised Curved Arch Indicator
  const departmentTabLayouts = useRef({}).current;
  const departmentTabsScrollRef = useRef(null);
  const departmentIndicatorX = useRef(new Animated.Value(48)).current;
  const departmentIndicatorWidth = useRef(new Animated.Value(76)).current;
  const departmentHasMeasured = useRef(false);
  const categoryCarouselFadeAnim = useRef(new Animated.Value(1)).current;
  const categoryCarouselScaleAnim = useRef(new Animated.Value(1)).current;

  // Active Subcategories list for the selected category (Face Makeup, Eye Makeup, Lip Makeup, etc.)
  const activeCategorySubcategories = useMemo(() => {
    const activeTabObj = categoryNavTabs.find(
      t => t.label.toLowerCase() === activeDepartmentTab.toLowerCase() || t.name.toLowerCase() === activeDepartmentTab.toLowerCase()
    );
    const targetCat = activeTabObj?.category || (displayCategories || []).find(
      c => (c.name || '').toLowerCase() === (activeTabObj?.name || activeDepartmentTab).toLowerCase()
    ) || { name: activeDepartmentTab };

    const subs = getSubcategoriesForCategory ? getSubcategoriesForCategory(targetCat) : [];
    if (subs && subs.length > 0) {
      return subs;
    }

    // High-fidelity fallback subcategories matching beauty store standards
    const dLower = (activeDepartmentTab || '').toLowerCase();
    if (dLower.includes('makeup')) {
      return [
        { id: 'sub_face', name: 'Face Makeup' },
        { id: 'sub_eye', name: 'Eye Makeup' },
        { id: 'sub_lip', name: 'Lip Makeup' },
        { id: 'sub_cheeks', name: 'Cheeks' },
        { id: 'sub_tools', name: 'Makeup Tools' },
      ];
    } else if (dLower.includes('skin')) {
      return [
        { id: 'sub_cleanser', name: 'Cleansers' },
        { id: 'sub_serum', name: 'Serums & Essences' },
        { id: 'sub_moisturizer', name: 'Moisturizers' },
        { id: 'sub_sunscreen', name: 'Sunscreen' },
        { id: 'sub_eye_care', name: 'Eye Creams' },
      ];
    } else if (dLower.includes('hair')) {
      return [
        { id: 'sub_shampoo', name: 'Shampoos' },
        { id: 'sub_conditioner', name: 'Conditioners' },
        { id: 'sub_hair_oil', name: 'Hair Oils' },
        { id: 'sub_masks', name: 'Hair Masks' },
        { id: 'sub_styling', name: 'Styling Serums' },
      ];
    }
    return [
      { id: 'sub_all_1', name: 'Best Sellers' },
      { id: 'sub_all_2', name: 'New Launches' },
      { id: 'sub_all_3', name: 'Daily Essentials' },
      { id: 'sub_all_4', name: 'Luxury Beauty' },
    ];
  }, [activeDepartmentTab, categoryNavTabs, displayCategories]);

  // Dynamic Product Filter based on Active Category Tab & Subcategory Selection
  const filteredCategoryProducts = useMemo(() => {
    let prods = activeProducts || [];

    // 1. Filter by Active Top Category Tab (if not 'All')
    if (activeDepartmentTab && activeDepartmentTab.toLowerCase() !== 'all') {
      const activeTabObj = categoryNavTabs.find(
        t => t.label.toLowerCase() === activeDepartmentTab.toLowerCase() || t.name.toLowerCase() === activeDepartmentTab.toLowerCase()
      );
      const targetCatName = (activeTabObj?.name || activeDepartmentTab).toLowerCase().trim();

      prods = prods.filter(p => {
        const pCat = (p.category || p.categoryName || '').toLowerCase().trim();
        const pSub = (p.subcategory || p.subCategory || '').toLowerCase().trim();
        const pCats = Array.isArray(p.categories) ? p.categories.map(c => String(c).toLowerCase().trim()) : [];
        const combinedText = `${p.name || ''} ${pCat} ${pSub} ${p.description || ''}`.toLowerCase();
        return pCat === targetCatName || pCat.includes(targetCatName) || targetCatName.includes(pCat) || pSub.includes(targetCatName) || pCats.includes(targetCatName) || combinedText.includes(targetCatName);
      });
    }

    // 2. Filter by Specific Subcategory / Item Selection
    if (selectedCategoryFilter && selectedCategoryFilter !== 'All') {
      const filterLower = selectedCategoryFilter.toLowerCase().trim();
      prods = prods.filter(p => {
        const pCat = (p.category || p.categoryName || '').toLowerCase().trim();
        const pSub = (p.subcategory || p.subCategory || '').toLowerCase().trim();
        const pCats = Array.isArray(p.categories) ? p.categories.map(c => String(c).toLowerCase().trim()) : [];
        return pCat === filterLower || pCat.includes(filterLower) || filterLower.includes(pCat) || pSub.includes(filterLower) || pCats.includes(filterLower);
      });
    }

    return prods;
  }, [activeProducts, activeDepartmentTab, categoryNavTabs, selectedCategoryFilter]);

  // Tab Switching Handler with Spring Animation Physics & Soft Centering Scroll
  const handleDepartmentTabPress = useCallback((tab) => {
    if (tab === activeDepartmentTab) return;
    setActiveDepartmentTab(tab);
    setSelectedCategoryFilter('All');

    const layout = departmentTabLayouts[tab];
    if (layout && typeof layout.x === 'number') {
      Animated.parallel([
        Animated.spring(departmentIndicatorX, {
          toValue: layout.x,
          friction: 8,
          tension: 65,
          useNativeDriver: false,
        }),
        Animated.spring(departmentIndicatorWidth, {
          toValue: layout.width,
          friction: 8,
          tension: 65,
          useNativeDriver: false,
        }),
      ]).start();

      // Soft scrolling to center the active category tab
      const targetScrollX = Math.max(0, layout.x - (SCREEN_WIDTH / 2) + (layout.width / 2));
      departmentTabsScrollRef.current?.scrollTo({ x: targetScrollX, animated: true });
    }

    // Spring & Scale Animation for Content Transition
    categoryCarouselFadeAnim.setValue(0.25);
    categoryCarouselScaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(categoryCarouselFadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(categoryCarouselScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeDepartmentTab, departmentTabLayouts, departmentIndicatorX, departmentIndicatorWidth, categoryCarouselFadeAnim, categoryCarouselScaleAnim]);

  useEffect(() => {
    if (displayCategories.length > 0) {
      if (!activeCategoryHome || !displayCategories.some(c => (c.name || '').toLowerCase() === (activeCategoryHome.name || '').toLowerCase())) {
        setActiveCategoryHome(displayCategories[0]);
      }
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
        return prioA - prioB;
      }).slice(0, 15);
    }
    const featured = activeProducts.filter(p => p.isFeatured || p.is_featured);
    if (featured.length > 0) return featured.slice(0, 10);
    return [...activeProducts].slice(0, 10);
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
            <Ionicons name={favorites.length > 0 ? "heart" : "heart-outline"} size={24} color="#D81B60" />
            {favorites.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#D81B60] min-w-[16px] h-[16px] px-1 rounded-full items-center justify-center shadow-xs">
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
            <Ionicons name="cart-outline" size={25} color="#D81B60" />
            {totalCartQuantity > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#D81B60] min-w-[16px] h-[16px] px-1 rounded-full items-center justify-center shadow-xs">
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
            colors={['#D81B60']}
            tintColor="#D81B60"
          />
        }
      >
        {/* Live Broadcast Announcement Banner (from Admin General Settings) */}
        {storeSettings?.operations?.announcementEnabled && storeSettings?.operations?.announcementMessage ? (
          <View className="mx-4 mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] border border-pink-200 shadow-xs flex-row items-center gap-2.5">
            <Ionicons name="megaphone" size={17} color="#FFFFFF" />
            <Text className="flex-1 text-[11px] font-bold text-white tracking-tight leading-4">
              {storeSettings.operations.announcementMessage}
            </Text>
          </View>
        ) : null}

        {/* Store Closed / Paused Notice (from Admin General Settings) */}
        {storeSettings?.operations?.isAcceptingOrders === false && (
          <View className="mx-4 mb-3 p-3 rounded-2xl bg-amber-500 border border-amber-600 shadow-xs flex-row items-center gap-2.5">
            <Ionicons name="pause-circle" size={18} color="#FFFFFF" />
            <Text className="flex-1 text-xs font-bold text-white leading-4">
              {storeSettings?.operations?.pauseOrdersNotice || 'We are temporarily not accepting new orders. Please check back shortly.'}
            </Text>
          </View>
        )}

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
              <Ionicons name="scan-outline" size={19} color="#D81B60" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 3. SHOP BY CATEGORIES SECTION                                             */}
        {/* ========================================================================= */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 4, marginBottom: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
            Shop by Categories
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('category')}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            position: 'relative',
            height: 94,
            zIndex: 10,
          }}
        >
          {/* Main Navigation Row: Soft Scrollable Category Tabs */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              height: 94,
              zIndex: 2,
            }}
          >
            <ScrollView
              ref={departmentTabsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="normal"
              scrollEventThrottle={16}
              overScrollMode="never"
              bounces={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                height: 94,
                position: 'relative',
              }}
              style={{ flex: 1, height: 94 }}
            >
              {/* Far-Left 'All' Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveDepartmentTab('All');
                  setSelectedCategoryFilter('All');
                  const layout = departmentTabLayouts['All'];
                  if (layout && typeof layout.x === 'number') {
                    Animated.parallel([
                      Animated.spring(departmentIndicatorX, { toValue: layout.x, friction: 8, tension: 65, useNativeDriver: false }),
                      Animated.spring(departmentIndicatorWidth, { toValue: layout.width, friction: 8, tension: 65, useNativeDriver: false }),
                    ]).start();
                  }
                }}
                onLayout={(e) => {
                  const layout = e.nativeEvent.layout;
                  departmentTabLayouts['All'] = layout;
                  if (activeDepartmentTab === 'All' && layout.width > 0) {
                    departmentIndicatorX.setValue(layout.x);
                    departmentIndicatorWidth.setValue(layout.width);
                  }
                }}
                style={{
                  height: 90,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: activeDepartmentTab === 'All' ? 'transparent' : '#D81B60',
                  zIndex: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: activeDepartmentTab === 'All' ? '800' : '700',
                    color: activeDepartmentTab === 'All' ? '#D81B60' : '#111827',
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>

              {/* Animated Curved Raised-Border Sliding Tab Arch Indicator */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: departmentIndicatorX,
                  width: departmentIndicatorWidth,
                  bottom: 0,
                  height: 90,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderTopWidth: 2,
                  borderLeftWidth: 2,
                  borderRightWidth: 2,
                  borderBottomWidth: 0,
                  borderColor: '#D81B60',
                  backgroundColor: '#FFFFFF',
                  zIndex: 2,
                  shadowColor: '#D81B60',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              />

              {/* Dynamic Interactive Category Tabs with Gold Rings & 3D Imagery */}
              {categoryNavTabs.map((catTab) => {
                const isSelected = activeDepartmentTab.toLowerCase() === catTab.label.toLowerCase();
                const iconInfo = getCategoryFA5Icon(catTab.label);

                return (
                  <TouchableOpacity
                    key={`cat_nav_${catTab.key || catTab.label}`}
                    activeOpacity={0.85}
                    onPress={() => handleDepartmentTabPress(catTab.label)}
                    onLayout={(e) => {
                      const layout = e.nativeEvent.layout;
                      departmentTabLayouts[catTab.label] = layout;
                      if (activeDepartmentTab.toLowerCase() === catTab.label.toLowerCase() && layout.width > 0) {
                        departmentIndicatorX.setValue(layout.x);
                        departmentIndicatorWidth.setValue(layout.width);
                        departmentHasMeasured.current = true;
                      }
                    }}
                    style={{
                      height: 90,
                      width: 76,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottomWidth: 2,
                      borderBottomColor: isSelected ? 'transparent' : '#D81B60',
                      zIndex: 5,
                      paddingTop: 4,
                      paddingBottom: 6,
                    }}
                  >
                    {/* Perfectly Circular Image Container with Gold Ring */}
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#D81B60' : '#E0A96D',
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        shadowColor: isSelected ? '#D81B60' : '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isSelected ? 0.22 : 0.06,
                        shadowRadius: 3,
                        elevation: 2,
                        marginBottom: 5,
                      }}
                    >
                      {catTab.image ? (
                        <Image
                          source={getSafeImageSource(catTab.image)}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 26,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <FontAwesome5
                          name={iconInfo.icon || 'sparkles'}
                          size={20}
                          color={isSelected ? '#D81B60' : '#4B5563'}
                        />
                      )}
                    </View>

                    {/* Category Name Label Directly Below Image */}
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isSelected ? '800' : '700',
                        color: isSelected ? '#D81B60' : '#111827',
                        textAlign: 'center',
                        letterSpacing: 0.2,
                        maxWidth: 74,
                        lineHeight: 14,
                      }}
                      numberOfLines={2}
                    >
                      {catTab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Right Edge Baseline Spacer */}
              <View
                style={{
                  width: 20,
                  height: 90,
                  borderBottomWidth: 2,
                  borderBottomColor: '#D81B60',
                }}
              />
            </ScrollView>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. SUB CATEGORIES SECTION (HORIZONTAL PILL CHIPS)                         */}
        {/* ========================================================================= */}
        <View style={{ marginTop: 14, marginBottom: 12 }}>
          {/* Sub Categories Section Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
              {activeDepartmentTab.toLowerCase() !== 'all' ? `${activeDepartmentTab} Sub Categories` : 'Beauty Sub Categories'}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('category')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll of Sub Category Pill Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {activeCategorySubcategories.map((sub, idx) => {
              const isSelected = selectedCategoryFilter.toLowerCase() === (sub.name || '').toLowerCase();
              return (
                <TouchableOpacity
                  key={`sub_chip_${sub.id || idx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    const parentCatName = (activeDepartmentTab && activeDepartmentTab.toLowerCase() !== 'all')
                      ? activeDepartmentTab
                      : (sub.categoryName || (categories.find(c => c.id === sub.categoryId)?.name) || 'Makeup');
                    if (setSelectedCategory) setSelectedCategory(parentCatName);
                    if (setSelectedSubcategory) setSelectedSubcategory(sub.name);
                    setCurrentScreen('category');
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? '#D81B60' : '#E5E7EB',
                    backgroundColor: isSelected ? '#D81B60' : '#FFFFFF',
                    marginRight: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isSelected ? '#FFFFFF' : '#111827',
                    }}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* 5. DYNAMIC FULL-WIDTH PROMOTIONAL BANNERS CAROUSEL (ADMIN PANEL DRIVEN)   */}
        {/* ========================================================================= */}
        {displayBanners.length > 0 && (
          <View style={{ marginTop: 4, marginBottom: 18 }}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled={false}
              snapToInterval={BANNER_WIDTH + 12}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / (BANNER_WIDTH + 12));
                if (idx !== activeSlide && idx >= 0 && idx < displayBanners.length) {
                  setActiveSlide(idx);
                }
              }}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / (BANNER_WIDTH + 12));
                if (idx >= 0 && idx < displayBanners.length) {
                  activeSlideRef.current = idx;
                  setActiveSlide(idx);
                }
              }}
              scrollEventThrottle={16}
            >
              {displayBanners.map((banner, index) => {
                const imgUri = banner.imageUrl || banner.mobileImageUrl || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80';

                return (
                  <TouchableOpacity
                    key={banner.id || `banner_${index}`}
                    activeOpacity={0.92}
                    onPress={() => handleBannerClick(banner)}
                    style={{
                      width: BANNER_WIDTH,
                      height: BANNER_HEIGHT,
                      marginRight: 12,
                      borderRadius: 18,
                      borderWidth: 1.2,
                      borderColor: '#E0A96D',
                      backgroundColor: '#FFFDF9',
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={{ uri: imgUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dynamic Pagination Dots matching displayBanners count */}
            {displayBanners.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 5 }}>
                {displayBanners.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: activeSlide === i ? 22 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: activeSlide === i ? '#D81B60' : '#F8BBD0',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* 6. SHOP BY BRAND — PREMIUM PINK CONTINUOUS SCROLLING                      */}
        {/* ========================================================================= */}
        <ContinuousBrandScroller
          brands={topBrandsList}
          onSelectBrand={(brandName) => {
            if (setGlobalSearchQuery) setGlobalSearchQuery(brandName);
            setCurrentScreen('search');
          }}
          onViewAll={() => setCurrentScreen('search')}
        />

        {/* ========================================================================= */}
        {/* 7. TRUST / BENEFITS BAR (FREE DELIVERY | EXCITING OFFERS | AUTHENTIC)      */}
        {/* ========================================================================= */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 18,
            paddingVertical: 12,
            paddingHorizontal: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#F3F4F6',
          }}
        >
          {/* 1. Free Delivery */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
            <Ionicons name="car-outline" size={22} color="#D81B60" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#111827', lineHeight: 12 }}>
              {"Free\nDelivery"}
            </Text>
          </View>

          <View style={{ width: 1, height: 22, backgroundColor: '#E5E7EB' }} />

          {/* 2. Exciting Offers */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
            <Ionicons name="gift-outline" size={22} color="#D81B60" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#111827', lineHeight: 12 }}>
              {"Exciting\nOffers"}
            </Text>
          </View>

          <View style={{ width: 1, height: 22, backgroundColor: '#E5E7EB' }} />

          {/* 3. 100% Authentic */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#D81B60" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#111827', lineHeight: 12 }}>
              {"100%\nAuthentic"}
            </Text>
          </View>

          <View style={{ width: 1, height: 22, backgroundColor: '#E5E7EB' }} />

          {/* 4. Easy Returns */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
            <Ionicons name="repeat-outline" size={22} color="#D81B60" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#111827', lineHeight: 12 }}>
              {"Easy\nReturns"}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 8. TRENDING PRODUCTS (2-COLUMN GRID)                                      */}
        {/* ========================================================================= */}
        {((filteredCategoryProducts.length > 0 ? filteredCategoryProducts : trendingProducts).length > 0) && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Trending Products</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('search')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>View All →</Text>
              </TouchableOpacity>
            </View>

            {/* 2-Column Standardized Product Cards Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
              {(filteredCategoryProducts.length > 0 ? filteredCategoryProducts : trendingProducts).slice(0, 8).map((product) => (
                <View key={`trend_grid_${product.id}`} style={{ width: '50%', padding: 6 }}>
                  <PurplleProductCard
                    product={product}
                    userRole={userRole}
                    getRolePrice={getRolePrice}
                    cartQuantityMap={cartQuantityMap}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    onPressProduct={handleProductSelect}
                    onOpenShadeSheet={openShadeSheet}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8B. BEST SELLERS (ADMIN CATALOG SECTION - HORIZONTAL CAROUSEL)            */}
        {/* ========================================================================= */}
        {bestSellers.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flame" size={18} color="#D81B60" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Best Sellers</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('search')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>View All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
            >
              {bestSellers.slice(0, 10).map((product) => (
                <View key={`bestseller_${product.id}`} style={{ marginRight: 12 }}>
                  <PurplleProductCard
                    product={product}
                    cardWidth={165}
                    userRole={userRole}
                    getRolePrice={getRolePrice}
                    cartQuantityMap={cartQuantityMap}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    onPressProduct={handleProductSelect}
                    onOpenShadeSheet={openShadeSheet}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8C. RECENT PRODUCTS (ADMIN CATALOG SECTION - HORIZONTAL CAROUSEL)         */}
        {/* ========================================================================= */}
        {newArrivals.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={17} color="#D81B60" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Recent Products</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('search')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>View All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
            >
              {newArrivals.slice(0, 10).map((product) => (
                <View key={`recent_${product.id}`} style={{ marginRight: 12 }}>
                  <PurplleProductCard
                    product={product}
                    cardWidth={165}
                    userRole={userRole}
                    getRolePrice={getRolePrice}
                    cartQuantityMap={cartQuantityMap}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    onPressProduct={handleProductSelect}
                    onOpenShadeSheet={openShadeSheet}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 8D. TOP RECOMMENDATIONS (ADMIN CATALOG SECTION - 2-COLUMN GRID)           */}
        {/* ========================================================================= */}
        {topRecommendations.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="star" size={17} color="#D81B60" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Recommended for You</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentScreen('search')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>View All →</Text>
              </TouchableOpacity>
            </View>

            {/* 2-Column Standardized Product Cards Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
              {topRecommendations.slice(0, 8).map((product) => (
                <View key={`rec_grid_${product.id}`} style={{ width: '50%', padding: 6 }}>
                  <PurplleProductCard
                    product={product}
                    userRole={userRole}
                    getRolePrice={getRolePrice}
                    cartQuantityMap={cartQuantityMap}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    onPressProduct={handleProductSelect}
                    onOpenShadeSheet={openShadeSheet}
                  />
                </View>
              ))}
            </View>
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
            backgroundColor: '#D81B60',
            shadowColor: '#D81B60',
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
                Free delivery on orders above ₹{storeSettings?.delivery?.freeDeliveryThreshold ?? 499}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('cart')}
            className="bg-white px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-xs"
          >
            <Text className="text-[11px] font-black text-[#D81B60] uppercase tracking-wider">
              View Cart
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#D81B60" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
