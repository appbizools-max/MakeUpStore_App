import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp, DEFAULT_HOME_BANNERS } from '../../context/AppContext';
import { getSafeImageSource, DEFAULT_CATEGORY_FALLBACKS } from '../../utils/imageUtils';
import { storage } from '../../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - 32, 600);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / 2.56);

const LOCAL_BANNER_ASSETS = {
  banner_1: require('../../../Assets/banners/banner_1.jpg'),
  banner_2: require('../../../Assets/banners/banner_2.jpg'),
  banner_3: require('../../../Assets/banners/banner_3.jpg'),
  banner_4: require('../../../Assets/banners/banner_4.jpg'),
  banner_5: require('../../../Assets/banners/banner_5.jpg'),
};

// Reusable Section Header Component
const SectionHeader = ({ title, subtitle, ctaText = 'View All →', onCtaPress, showCta = true, iconName }) => (
  <View className="px-4 mb-3">
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center gap-1.5 flex-1 pr-2">
        {iconName && <Ionicons name={iconName} size={15} color="#C2477A" />}
        <Text className="text-base font-extrabold text-[#3A2430]" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {showCta && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCtaPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-xs font-bold text-[#C2477A]">{ctaText}</Text>
        </TouchableOpacity>
      )}
    </View>
    {subtitle ? (
      <Text className="text-[10px] font-medium text-[#8C7078] mt-0.5">{subtitle}</Text>
    ) : null}
  </View>
);

// Reusable Universal Product Card Component
const ProductCard = React.memo(({
  product,
  badgeText = 'NEW',
  userRole,
  getRolePrice,
  isLiked = false,
  onToggleFavorite,
  onSelectProduct,
  cartQty = 0,
  onAddToCart,
  onUpdateCartQty,
}) => {
  const rolePrice = getRolePrice(product, userRole);
  const mrp = product.mrp && product.mrp > rolePrice ? Number(product.mrp) : Math.round(rolePrice * 1.25);
  const discountPercent = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 14;

  const rating = product.rating ? Number(product.rating).toFixed(1) : '4.5';
  const reviews = product.reviewCount || 120;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onSelectProduct(product)}
      style={{ width: 144, borderColor: '#FCE4EC', borderWidth: 1 }}
      className="mr-3 bg-white rounded-2xl p-2.5 shadow-xs flex-col"
    >
      {/* Product Image Box with Badge & Wishlist Heart */}
      <View
        style={{ width: '100%', height: 110, borderColor: '#FCE4EC', borderWidth: 1 }}
        className="relative rounded-xl overflow-hidden mb-2 bg-[#FFF5F8] items-center justify-center"
      >
        <Image
          source={getSafeImageSource(product.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Badge (NEW or BESTSELLER) */}
        {badgeText ? (
          <View className="absolute top-1.5 left-1.5 bg-[#C2477A] px-1.5 py-0.5 rounded-md shadow-xs">
            <Text className="text-white text-[7.5px] font-black uppercase tracking-wider">
              {badgeText}
            </Text>
          </View>
        ) : null}

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite(product);
          }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white items-center justify-center shadow-xs"
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={13}
            color="#C2477A"
          />
        </TouchableOpacity>
      </View>

      {/* Brand & Name */}
      <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5" numberOfLines={1}>
        {product.brandName || 'SALBEAU'}
      </Text>
      <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1" numberOfLines={1}>
        {product.name}
      </Text>

      {/* Rating Row: ★ 4.5 (124) */}
      <View className="flex-row items-center gap-1 mb-1.5">
        <Ionicons name="star" size={10} color="#F59E0B" />
        <Text className="text-[9.5px] font-bold text-[#3A2430]">{rating}</Text>
        <Text className="text-[9px] text-[#8C7078]">({reviews})</Text>
      </View>

      {/* Pricing Row: ₹599 ₹699 14% OFF */}
      <View className="flex-row items-baseline gap-1 mb-2 flex-wrap">
        <Text className="text-xs font-black text-[#3A2430]">₹{rolePrice}</Text>
        {mrp > rolePrice && (
          <Text className="text-[9px] font-semibold text-[#8C7078] line-through">₹{mrp}</Text>
        )}
        {discountPercent > 0 && (
          <Text className="text-[9px] font-black text-[#E11D48]">{discountPercent}% OFF</Text>
        )}
      </View>

      {/* Cart Control */}
      <View className="mt-auto pt-0.5">
        {cartQty > 0 ? (
          <View
            style={{
              backgroundColor: '#C2477A',
              shadowColor: '#C2477A',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}
            className="rounded-full flex-row items-center justify-between px-1.5 py-0.5 w-full"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onUpdateCartQty(product.id, cartQty - 1);
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
                onUpdateCartQty(product.id, cartQty + 1);
              }}
              className="w-5 h-5 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="add" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart(product);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#C2477A',
              borderWidth: 1.5,
            }}
            className="w-full py-1 rounded-full flex-row items-center justify-center gap-1 shadow-xs"
          >
            <Ionicons name="add" size={12} color="#C2477A" />
            <Text className="text-[11px] font-black text-[#C2477A]">Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const HomeScreen = () => {
  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
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
    productSalesCounts = {},
    homeBanners = [],
    activeBanners = [],
    setSelectedBrand,
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

  // Cart quantity lookup map for instant O(1) checks
  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    for (const item of (cart || [])) {
      if (item.product?.id) map.set(item.product.id, item.quantity || 0);
    }
    return map;
  }, [cart]);

  const totalCartQuantity = useMemo(() => {
    return (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return (cart || []).reduce((sum, item) => {
      const price = getRolePrice(item.product, userRole);
      return sum + (price * (item.quantity || 0));
    }, 0);
  }, [cart, userRole, getRolePrice]);

  const getProductCartQuantity = useCallback((productId) => {
    return cartQuantityMap.get(productId) || 0;
  }, [cartQuantityMap]);

  // Customer-Specific Recently Viewed tracking in persistent storage (NO mock fallbacks!)
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

  const handleProductSelect = useCallback((product) => {
    if (product?.id) {
      setRecentlyViewedIds(prev => {
        const updated = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 10);
        storage.setItem('salbeau_recently_viewed_ids', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }
    setSelectedProduct(product);
    setCurrentScreen('product');
  }, [setSelectedProduct, setCurrentScreen]);

  const [activeSlide, setActiveSlide] = useState(0);
  const bannerScrollRef = useRef(null);

  const displayBanners = useMemo(() => {
    if (activeBanners && activeBanners.length > 0) return activeBanners;
    if (homeBanners && homeBanners.length > 0) return homeBanners.filter(b => b.isActive !== false);
    return DEFAULT_HOME_BANNERS;
  }, [activeBanners, homeBanners]);

  const handleBannerClick = useCallback((banner) => {
    if (!banner) return;
    const destType = (banner.destinationType || '').toUpperCase();
    const destId = banner.destinationId || '';

    switch (destType) {
      case 'BEST_SELLERS':
        setSearchQuery('');
        setSelectedCategory('Best Sellers');
        setCurrentScreen('search');
        break;

      case 'CATEGORY':
        if (destId) {
          const matched = (categories || []).find(c => 
            c.id?.toLowerCase() === destId.toLowerCase() || 
            c.name?.toLowerCase() === destId.toLowerCase()
          );
          setSelectedCategory(matched?.name || destId);
        }
        setCurrentScreen('category');
        break;

      case 'SUBCATEGORY':
        if (destId) {
          setSelectedCategory(destId);
        }
        setCurrentScreen('category');
        break;

      case 'BRAND':
        if (destId) {
          const matched = (brands || []).find(b =>
            b.id?.toLowerCase() === destId.toLowerCase() ||
            b.name?.toLowerCase() === destId.toLowerCase()
          );
          setSelectedBrand(matched || { name: destId });
          setSearchQuery(matched?.name || destId);
        }
        setCurrentScreen('search');
        break;

      case 'PRODUCT':
        if (destId) {
          const matched = (activeProducts || []).find(p => p.id === destId || p.barcode === destId);
          if (matched) {
            handleProductSelect(matched);
            return;
          }
        }
        setCurrentScreen('product');
        break;

      case 'NEW_ARRIVALS':
        setCurrentScreen('search');
        break;

      case 'TRENDING':
        setCurrentScreen('search');
        break;

      default:
        if (destId) {
          setSelectedCategory(destId);
          setCurrentScreen('category');
        } else {
          setCurrentScreen('search');
        }
        break;
    }
  }, [categories, brands, activeProducts, setSelectedCategory, setSelectedBrand, setSearchQuery, setCurrentScreen, handleProductSelect]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % displayBanners.length;
        bannerScrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  // 1. Shop by Category — Pure database categories
  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories
      .filter(c => c.enabled !== false && !c.id.startsWith('app_') && !c.id.startsWith('salbeau_'))
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map(cat => {
        const productCount = (activeProducts || []).filter(p => p.category?.toLowerCase() === cat.name?.toLowerCase()).length;
        return {
          id: cat.id,
          name: cat.name,
          image: cat.image || DEFAULT_CATEGORY_FALLBACKS.default,
          countText: productCount > 0 ? `${productCount} Products` : 'Explore'
        };
      });
  }, [categories, activeProducts]);

  // 2. Trending Now — Customer Engagement / Orders + Admin Curated Override
  const trendingProducts = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    return [...activeProducts].sort((a, b) => {
      // 1. Admin curated trending flag & priority
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isTrending && b.isTrending) {
        return (b.trendingPriority || 0) - (a.trendingPriority || 0);
      }
      // 2. Real sales data ranking
      const salesA = productSalesCounts[a.id] || 0;
      const salesB = productSalesCounts[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      // 3. Ratings / review count
      return (b.rating || 0) - (a.rating || 0);
    }).slice(0, 10);
  }, [activeProducts, productSalesCounts]);

  // 3. Top Brands — Dynamic from Database
  const topBrandsList = useMemo(() => {
    const list = activeBrands && activeBrands.length > 0 ? activeBrands : brands.filter(b => b.enabled !== false);
    return list.filter(b => b.name && !b.id.startsWith('app_') && !b.id.startsWith('salbeau_')).slice(0, 12);
  }, [activeBrands, brands]);

  // 4. New Arrivals — Automatic by publishedAt / created_at DESC
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

  // 5. Best Sellers — Real Units Sold from Completed Store Orders
  const bestSellers = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    return [...activeProducts].sort((a, b) => {
      const salesA = productSalesCounts[a.id] || 0;
      const salesB = productSalesCounts[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    }).slice(0, 10);
  }, [activeProducts, productSalesCounts]);

  // 6. Recently Viewed — Customer's Personalized History (ZERO mock fallbacks!)
  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length === 0 || !activeProducts || activeProducts.length === 0) {
      return [];
    }
    const map = new Map(activeProducts.map(p => [p.id, p]));
    return recentlyViewedIds.map(id => map.get(id)).filter(Boolean);
  }, [recentlyViewedIds, activeProducts]);

  // 7. Complete Your Look — Real Catalog Product Bundle
  const duoBundle = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return null;
    const lipProduct = activeProducts.find(p => (p.category || '').toLowerCase().includes('lip') || (p.name || '').toLowerCase().includes('lip'));
    const faceProduct = activeProducts.find(p => p.id !== lipProduct?.id && ((p.category || '').toLowerCase().includes('face') || (p.category || '').toLowerCase().includes('cream') || (p.name || '').toLowerCase().includes('blush') || (p.name || '').toLowerCase().includes('serum')));
    const p1 = lipProduct || activeProducts[0];
    const p2 = faceProduct || activeProducts[1] || activeProducts[0];
    if (!p1 || !p2) return null;

    const price1 = getRolePrice(p1, userRole);
    const price2 = getRolePrice(p2, userRole);
    const rawTotal = price1 + (p1.id !== p2.id ? price2 : 0);
    const bundlePrice = Math.round(rawTotal * 0.80);

    return {
      title: p1.id !== p2.id ? `${p1.name} + ${p2.name}` : p1.name,
      subtitle: 'Save 20% extra when buying this salon-ready radiance pair.',
      bundlePrice,
      rawTotal,
      p1,
      p2,
      image: p1.image || p2.image
    };
  }, [activeProducts, userRole, getRolePrice]);

  const handleAddBundleToCart = useCallback(() => {
    if (!duoBundle) return;
    addToCart(duoBundle.p1, 1);
    if (duoBundle.p2 && duoBundle.p2.id !== duoBundle.p1.id) {
      addToCart(duoBundle.p2, 1);
    }
  }, [duoBundle, addToCart]);

  // Essential Beauty Staples Data (Categories & Real Queries)
  const beautyEssentials = useMemo(() => [
    { id: 'be1', title: 'Face Serums', subtitle: 'Radiance & Hydration', iconName: 'sparkles', query: 'Serum' },
    { id: 'be2', title: 'Hair Care Oils', subtitle: 'Nourishment & Spa', iconName: 'cut', query: 'Hair' },
    { id: 'be3', title: 'Lipsticks & Oils', subtitle: 'Velvet & Gloss Shades', iconName: 'color-palette', query: 'Lipstick' },
    { id: 'be4', title: 'Aloevera & Green Care', subtitle: 'Pure Organic Care', iconName: 'leaf', query: 'Aloe' },
    { id: 'be5', title: 'Waxing & Kits', subtitle: 'Salon Smooth Finish', iconName: 'gift', query: 'Wax' },
    { id: 'be6', title: 'Sunscreen Shades', subtitle: 'Broad Spectrum UV', iconName: 'sunny', query: 'Sunscreen' }
  ], []);

  return (
    <View className="flex-1 bg-white relative">
      <ScrollView
        contentContainerStyle={{ paddingBottom: totalCartQuantity > 0 ? 160 : 100 }}
        showsVerticalScrollIndicator={false}
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
        {/* 1. HEADER (SALBEAU SCRIPT LOGO + NOTIFICATIONS + WISHLIST) */}
        {/* ========================================================================= */}
        <View className="px-4 pt-3 pb-2 bg-white">
          <View className="flex-row justify-between items-center">
            <Text
              style={{
                fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
              }}
              className="text-[36px] text-[#C2477A] tracking-wide ml-0.5 mt-0.5"
            >
              Salbeau
            </Text>
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('orders')}
                style={{ borderColor: '#FCE4EC', borderWidth: 1 }}
                className="w-9 h-9 rounded-full bg-[#FFF5F8] items-center justify-center"
              >
                <Ionicons name="notifications-outline" size={18} color="#C2477A" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('wishlist')}
                style={{ borderColor: '#FCE4EC', borderWidth: 1 }}
                className="w-9 h-9 rounded-full bg-[#FFF5F8] items-center justify-center relative"
              >
                <Ionicons name={favorites.length > 0 ? "heart" : "heart-outline"} size={18} color="#C2477A" />
                {favorites.length > 0 && (
                  <View className="absolute -top-1 -right-1 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-[8px] font-black">{favorites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. SEARCH BAR (WITH SCANNER ICON ON RIGHT) */}
        {/* ========================================================================= */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (setGlobalSearchQuery && searchQuery) setGlobalSearchQuery(searchQuery);
              setCurrentScreen('search');
            }}
            style={{ borderColor: '#F5A8C0', borderWidth: 1 }}
            className="w-full flex-row items-center bg-white px-3.5 py-2 rounded-full shadow-xs"
          >
            <Ionicons name="search-outline" size={16} color="#C2477A" />
            <Text
              className="flex-1 text-[11px] font-semibold text-[#8C7078] px-2.5"
              numberOfLines={1}
            >
              {searchQuery || 'Search products, brands, lipsticks...'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation?.();
                setCurrentScreen('search');
              }}
            >
              <Ionicons name="scan-outline" size={16} color="#C2477A" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 3. HERO BANNER (EDITORIAL BEAUTY CARD + CTA + CAROUSEL DOTS) */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 3. HERO BANNER (EDITORIAL BEAUTY CARD + CTA + CAROUSEL DOTS) */}
        {/* ========================================================================= */}
        <View className="mb-6">
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
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
              const imageSource = LOCAL_BANNER_ASSETS[banner.id] || (banner.imageUrl ? { uri: banner.imageUrl } : null);
              return (
                <View
                  key={banner.id || idx}
                  style={{
                    width: BANNER_WIDTH,
                    height: BANNER_HEIGHT,
                    marginRight: idx < displayBanners.length - 1 ? 12 : 0,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: '#FDE8EF',
                    borderColor: '#FCE4EC',
                    borderWidth: 1,
                    elevation: 3,
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => handleBannerClick(banner)}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {imageSource && (
                      <Image
                        source={imageSource}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                    {/* Interactive CTA pill overlay */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 14,
                        bottom: 12,
                        backgroundColor: 'rgba(194, 71, 122, 0.92)',
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 }}>
                        {banner.ctaText || banner.ctaLabel || 'Shop Now →'}
                      </Text>
                    </View>
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
                    activeSlide === idx ? 'w-5 bg-[#C2477A]' : 'w-1.5 bg-[#C2477A]/30'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 4. SHOP BY CATEGORY (HORIZONTAL CAROUSEL) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="Shop by Category"
          ctaText="View All →"
          onCtaPress={() => setCurrentScreen('category')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          className="mb-6"
        >
          {displayCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedCategory(cat);
                setCurrentScreen('category');
              }}
              style={{ width: 88, borderColor: '#FCE4EC', borderWidth: 1 }}
              className="bg-white rounded-2xl p-2 items-center mr-3 shadow-xs"
            >
              <View
                style={{ width: 64, height: 64, borderColor: '#FCE4EC', borderWidth: 1 }}
                className="rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] items-center justify-center"
              >
                <Image
                  source={getSafeImageSource(cat.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Text className="text-[11px] font-bold text-[#3A2430] text-center" numberOfLines={1}>
                {cat.name}
              </Text>
              <Text className="text-[9px] font-medium text-[#8C7078] text-center mt-0.5">
                {cat.countText}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ========================================================================= */}
        {/* 5. TRENDING NOW (HORIZONTAL PRODUCT CAROUSEL) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="🔥 Trending Now"
          ctaText="View All →"
          onCtaPress={() => setCurrentScreen('search')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          className="mb-6"
        >
          {trendingProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              badgeText="NEW"
              userRole={userRole}
              getRolePrice={getRolePrice}
              isLiked={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
              onSelectProduct={handleProductSelect}
              cartQty={getProductCartQuantity(item.id)}
              onAddToCart={(prod) => addToCart(prod, 1)}
              onUpdateCartQty={updateCartQuantity}
            />
          ))}
        </ScrollView>

        {/* ========================================================================= */}
        {/* 6. TOP BRANDS (CIRCULAR BRAND CAROUSEL) */}
        {/* ========================================================================= */}
        {topBrandsList.length > 0 && (
          <>
            <SectionHeader
              title="Top Brands"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
              className="mb-6"
            >
              {topBrandsList.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    const brandQuery = (brand.name || '').replace('\n', ' ');
                    if (setGlobalSearchQuery) setGlobalSearchQuery(brandQuery);
                    setSearchQuery(brandQuery);
                    setCurrentScreen('search');
                  }}
                  style={{ width: 72, height: 72, borderColor: '#FCE4EC', borderWidth: 1 }}
                  className="rounded-full bg-white mr-3 shadow-xs items-center justify-center p-1.5 overflow-hidden"
                >
                  {brand.logo && typeof brand.logo === 'string' && brand.logo.startsWith('http') ? (
                    <Image
                      source={{ uri: brand.logo }}
                      style={{ width: '80%', height: '80%' }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text
                      className="text-[9.5px] font-black text-center tracking-tight text-[#1F2937]"
                      numberOfLines={2}
                    >
                      {brand.name}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ========================================================================= */}
        {/* 7. NEW ARRIVALS (HORIZONTAL PRODUCT CAROUSEL) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="New Arrivals"
          ctaText="View All →"
          onCtaPress={() => setCurrentScreen('search')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          className="mb-6"
        >
          {newArrivals.map((item) => (
            <ProductCard
              key={`na_${item.id}`}
              product={item}
              badgeText="NEW"
              userRole={userRole}
              getRolePrice={getRolePrice}
              isLiked={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
              onSelectProduct={handleProductSelect}
              cartQty={getProductCartQuantity(item.id)}
              onAddToCart={(prod) => addToCart(prod, 1)}
              onUpdateCartQty={updateCartQuantity}
            />
          ))}
        </ScrollView>

        {/* ========================================================================= */}
        {/* 8. BEST SELLERS (HORIZONTAL PRODUCT CAROUSEL) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="Best Sellers"
          ctaText="View All →"
          onCtaPress={() => setCurrentScreen('search')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          className="mb-6"
        >
          {bestSellers.map((item) => (
            <ProductCard
              key={`bs_${item.id}`}
              product={item}
              badgeText="NEW"
              userRole={userRole}
              getRolePrice={getRolePrice}
              isLiked={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
              onSelectProduct={handleProductSelect}
              cartQty={getProductCartQuantity(item.id)}
              onAddToCart={(prod) => addToCart(prod, 1)}
              onUpdateCartQty={updateCartQuantity}
            />
          ))}
        </ScrollView>

        {/* ========================================================================= */}
        {/* 9. BEAUTY EDIT (EDITORIAL BANNER CARD) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="Beauty Edit"
          ctaText="View All →"
          onCtaPress={() => setCurrentScreen('search')}
        />
        <View className="px-4 mb-6">
          <View
            style={{ height: 170, backgroundColor: '#FFF0F5', borderColor: '#FCE4EC', borderWidth: 1 }}
            className="rounded-3xl overflow-hidden shadow-xs flex-row items-center"
          >
            {/* Left Editorial Text Column */}
            <View className="flex-1 p-4 pr-1 z-10 justify-center">
              <View className="bg-[#C2477A] px-2 py-0.5 rounded-full self-start mb-2">
                <Text className="text-white text-[8px] font-black uppercase tracking-wider">
                  THE SALBEAU EDIT
                </Text>
              </View>
              <Text className="text-[15px] font-black text-[#3A2430] leading-snug mb-1">
                Autumn Gloss & Radiance Rituals
              </Text>
              <Text className="text-[9.5px] text-[#8C7078] font-medium leading-relaxed mb-3">
                Discover curated autumn beauty masterclasses, pro artist tricks, and hydration secrets for glass skin.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setCurrentScreen('search')}
                className="bg-[#C2477A] px-3.5 py-1.5 rounded-full self-start shadow-xs"
              >
                <Text className="text-white text-[10px] font-black">
                  Read Beauty Journal →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right Editorial Model Image */}
            <View style={{ width: '42%', height: '100%' }} className="justify-center items-end relative overflow-hidden">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 10. ESSENTIAL BEAUTY STAPLES (2-COLUMN GRID) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="Essential Beauty Staples"
          subtitle="Handpicked pro catalog favorites"
          ctaText="Explore All →"
          onCtaPress={() => setCurrentScreen('search')}
        />
        <View className="px-4 flex-row flex-wrap justify-between gap-y-3 mb-6">
          {beautyEssentials.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => {
                if (setGlobalSearchQuery) setGlobalSearchQuery(item.query);
                setSearchQuery(item.query);
                setCurrentScreen('search');
              }}
              style={{ borderColor: '#FCE4EC', borderWidth: 1 }}
              className="w-[48%] bg-white rounded-2xl p-2.5 flex-row items-center gap-2.5 shadow-xs"
            >
              <View
                style={{ borderColor: '#FCE4EC', borderWidth: 1 }}
                className="w-9 h-9 rounded-xl items-center justify-center bg-[#FFF5F8]"
              >
                <Ionicons name={item.iconName} size={16} color="#C2477A" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-extrabold text-[#3A2430]" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-[8.5px] font-medium text-[#8C7078]" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========================================================================= */}
        {/* 11. RECENTLY VIEWED (HORIZONTAL CAROUSEL — PERSONALIZED PER CUSTOMER) */}
        {/* ========================================================================= */}
        {recentlyViewedProducts.length > 0 && (
          <>
            <SectionHeader
              title="Recently Viewed"
              ctaText="View All →"
              onCtaPress={() => setCurrentScreen('search')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
              className="mb-6"
            >
              {recentlyViewedProducts.map((item) => (
                <ProductCard
                  key={`rv_${item.id}`}
                  product={item}
                  badgeText=""
                  userRole={userRole}
                  getRolePrice={getRolePrice}
                  isLiked={isFavorite(item.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectProduct={handleProductSelect}
                  cartQty={getProductCartQuantity(item.id)}
                  onAddToCart={(prod) => addToCart(prod, 1)}
                  onUpdateCartQty={updateCartQuantity}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ========================================================================= */}
        {/* 12. COMPLETE YOUR LOOK (DYNAMIC DUO BUNDLE PROMO CARD) */}
        {/* ========================================================================= */}
        {duoBundle && (
          <>
            <SectionHeader
              title="Complete Your Look"
              showCta={false}
            />
            <View className="px-4 mb-6">
              <View
                style={{ backgroundColor: '#FFF5F8', borderColor: '#FCE4EC', borderWidth: 1 }}
                className="rounded-3xl p-4 shadow-xs flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[8.5px] font-black text-[#C2477A] uppercase tracking-wider mb-1">
                    DUO BEAUTY BUNDLE
                  </Text>
                  <Text className="text-xs font-black text-[#3A2430] mb-1 leading-snug" numberOfLines={2}>
                    {duoBundle.title}
                  </Text>
                  <Text className="text-[9.5px] text-[#8C7078] font-medium mb-2.5 leading-relaxed">
                    {duoBundle.subtitle}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleAddBundleToCart}
                    className="bg-[#C2477A] px-3.5 py-1.5 rounded-full self-start shadow-xs"
                  >
                    <Text className="text-white text-[10px] font-black">
                      Add Bundle ₹{duoBundle.bundlePrice} →
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{ width: 80, height: 80, borderColor: '#F5A8C0', borderWidth: 1 }}
                  className="rounded-2xl overflow-hidden bg-white items-center justify-center"
                >
                  <Image
                    source={getSafeImageSource(duoBundle.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* 13. SEASONAL COLLECTION (FULL-WIDTH PROMO CARD) */}
        {/* ========================================================================= */}
        <SectionHeader
          title="Seasonal Collection"
          showCta={false}
        />
        <View className="px-4 mb-4">
          <View
            style={{ backgroundColor: '#FFF8F3', borderColor: '#FCE4EC', borderWidth: 1 }}
            className="rounded-3xl overflow-hidden shadow-xs"
          >
            <View style={{ width: '100%', height: 128 }} className="relative bg-[#FCE4EC]">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View className="absolute top-2.5 left-2.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-pink-100">
                <Text className="text-[#C2477A] text-[8px] font-black uppercase tracking-wider">
                  SEASONAL COLLECTION
                </Text>
              </View>
            </View>
            <View className="p-3.5 flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-xs font-black text-[#3A2430]">
                  Luxe Bridal & Salon Master Series
                </Text>
                <Text className="text-[9.5px] text-[#8C7078] font-medium mt-0.5">
                  Professional bridal kits with extended durability formulas.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setCurrentScreen('search')}
                className="bg-[#C2477A] px-3.5 py-1.5 rounded-full shadow-xs"
              >
                <Text className="text-white text-[10px] font-black">Explore →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 14. STICKY VIEW CART BAR (WHEN ITEMS IN CART) */}
      {/* ========================================================================= */}
      {totalCartQuantity > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 58,
            left: 12,
            right: 12,
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
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="bag-handle" size={17} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xs font-black text-white tracking-wide">
                {totalCartQuantity} {totalCartQuantity === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('cart')}
            className="bg-white px-3.5 py-1.5 rounded-xl flex-row items-center gap-1 shadow-xs"
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
