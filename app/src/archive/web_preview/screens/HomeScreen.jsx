import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Search,
  ShoppingBag,
  Star,
  Sparkles,
  ArrowRight,
  Heart,
  Scissors,
  Palette,
  Leaf,
  Gift,
  Sun,
  Bell,
  QrCode
} from 'lucide-react';

import { getSafeImageSource, DEFAULT_CATEGORY_FALLBACKS } from '../utils/imageUtils';
import { storage } from '../utils/storage';

// Reusable Section Header Component
const SectionHeader = ({ title, subtitle, ctaText = 'View All →', onCtaPress, showCta = true, icon }) => (
  <div className="px-4 mb-3">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1.5 flex-1 pr-2">
        {icon && <span className="text-[#C2477A]">{icon}</span>}
        <h3 className="text-base font-extrabold text-[#3A2430] truncate">
          {title}
        </h3>
      </div>
      {showCta && (
        <button
          onClick={onCtaPress}
          className="text-xs font-bold text-[#C2477A] hover:opacity-80 transition-opacity cursor-pointer shrink-0"
        >
          {ctaText}
        </button>
      )}
    </div>
    {subtitle && (
      <p className="text-[10px] font-medium text-[#8C7078] mt-0.5">{subtitle}</p>
    )}
  </div>
);

// Skeleton Loading Placeholders for seamless Zero-Flicker Cold Starts
const SkeletonCategoryCard = () => (
  <div className="bg-white rounded-2xl border border-[#FCE4EC] p-2 flex flex-col items-center shadow-2xs w-[88px] shrink-0 animate-pulse">
    <div className="w-16 h-16 rounded-xl mb-1.5 bg-[#FFF0F5]" />
    <div className="w-12 h-2.5 rounded bg-[#FCE4EC] mb-1" />
    <div className="w-8 h-2 rounded bg-[#FCE4EC]/60" />
  </div>
);

const SkeletonProductCard = () => (
  <div className="w-36 shrink-0 bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC] flex flex-col animate-pulse">
    <div className="w-full h-28 rounded-xl mb-2 bg-[#FFF0F5]" />
    <div className="w-14 h-2 rounded bg-[#FCE4EC] mb-1.5" />
    <div className="w-24 h-3 rounded bg-[#FCE4EC] mb-2" />
    <div className="w-16 h-3.5 rounded bg-[#FCE4EC]/70" />
  </div>
);

const SkeletonBrandCircle = () => (
  <div className="w-[72px] h-[72px] shrink-0 rounded-full bg-[#FFF0F5] border border-[#FCE4EC] shadow-xs animate-pulse" />
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
    <div
      onClick={() => onSelectProduct(product)}
      className="w-36 shrink-0 bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC] flex flex-col cursor-pointer hover:shadow-xs transition-shadow"
    >
      {/* Product Image Box with Badge & Wishlist Heart */}
      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FFF5F8] border border-[#FCE4EC]/40 flex items-center justify-center">
        <img
          src={product.image || ''}
          alt={product.name}
          onError={(e) => { e.target.style.display = 'none'; }}
          className="w-full h-full object-cover"
        />

        {/* Badge (NEW or BESTSELLER) */}
        {badgeText && (
          <div className="absolute top-1.5 left-1.5 bg-[#C2477A] px-1.5 py-0.5 rounded-md shadow-2xs">
            <span className="text-white text-[7.5px] font-black uppercase tracking-wider block">
              {badgeText}
            </span>
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
        >
          <Heart
            size={13}
            className={isLiked ? "fill-[#C2477A] text-[#C2477A]" : "text-[#C2477A]"}
          />
        </button>
      </div>

      {/* Brand & Name */}
      <span className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5 truncate block">
        {product.brandName || 'SALBEAU'}
      </span>
      <h4 className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1 truncate">
        {product.name}
      </h4>

      {/* Rating Row: ★ 4.5 (124) */}
      <div className="flex items-center gap-1 mb-1.5">
        <Star size={10} className="fill-[#F59E0B] text-[#F59E0B]" />
        <span className="text-[9.5px] font-bold text-[#3A2430]">{rating}</span>
        <span className="text-[9px] text-[#8C7078]">({reviews})</span>
      </div>

      {/* Pricing Row: ₹599 ₹699 14% OFF */}
      <div className="flex items-baseline gap-1 mb-2 flex-wrap">
        <span className="text-xs font-black text-[#3A2430]">₹{rolePrice}</span>
        {mrp > rolePrice && (
          <span className="text-[9px] font-semibold text-[#8C7078] line-through">₹{mrp}</span>
        )}
        {discountPercent > 0 && (
          <span className="text-[9px] font-black text-[#E11D48]">{discountPercent}% OFF</span>
        )}
      </div>

      {/* Cart Control */}
      <div className="mt-auto pt-0.5">
        {cartQty > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#C2477A] text-white rounded-full flex items-center justify-between px-1.5 py-0.5 w-full shadow-xs"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateCartQty(product.id, cartQty - 1);
              }}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-bold transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="text-[11px] font-black text-white px-1 text-center min-w-[16px]">
              {cartQty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateCartQty(product.id, cartQty + 1);
              }}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-bold transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-1 rounded-full flex items-center justify-center gap-1 shadow-2xs border-[1.5px] border-[#C2477A] bg-white text-[#C2477A] hover:bg-[#FFF5F8] transition-colors cursor-pointer"
          >
            <span className="text-xs font-bold">+</span>
            <span className="text-[11px] font-black text-[#C2477A]">Add</span>
          </button>
        )}
      </div>
    </div>
  );
});

export const HomeScreen = () => {
  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    searchQuery,
    setSearchQuery,
    activeProducts = [],
    brands = [],
    activeBrands = [],
    categories = [],
    favorites = [],
    isFavorite,
    toggleFavorite,
    setGlobalSearchQuery,
    productSalesCounts = {},
    homeBanners = [],
    activeBanners = [],
    isCatalogLoading = false,
    unreadNotificationsCount = 0,
  } = useApp();

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

  // Home Banners state & router — Infinite Continuous Loop
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const displayBanners = useMemo(() => {
    if (activeBanners && activeBanners.length > 0) return activeBanners;
    if (homeBanners && homeBanners.length > 0) return homeBanners.filter(b => b.isActive !== false);
    return [];
  }, [activeBanners, homeBanners]);

  // Append clone of first banner to create seamless zero-jump infinite track
  const bannersWithClone = useMemo(() => {
    if (!displayBanners || displayBanners.length === 0) return [];
    if (displayBanners.length === 1) return displayBanners;
    return [...displayBanners, displayBanners[0]];
  }, [displayBanners]);

  const handleBannerClick = useCallback((banner) => {
    if (!banner) {
      setCurrentScreen('category');
      return;
    }
    const destType = (banner.destinationType || '').toUpperCase();
    const destId = banner.destinationId || banner.category || '';

    // Ultra thinking: Match target category from destinationId, destinationType, category property or banner title
    let matchedCategory = null;
    if (destId) {
      matchedCategory = (categories || []).find(c =>
        c.id?.toLowerCase() === destId.toLowerCase() ||
        c.name?.toLowerCase() === destId.toLowerCase()
      );
    }
    if (!matchedCategory && banner.title) {
      matchedCategory = (categories || []).find(c =>
        c.name?.toLowerCase().includes(banner.title.toLowerCase()) ||
        banner.title.toLowerCase().includes(c.name?.toLowerCase())
      );
    }

    if (matchedCategory) {
      setSelectedCategory(matchedCategory.name);
    } else if (destId && (destType === 'CATEGORY' || destType === 'SUBCATEGORY')) {
      setSelectedCategory(destId);
    } else if (categories && categories.length > 0 && !selectedCategory) {
      // Default to first active category if none selected
      setSelectedCategory(categories[0].name);
    }

    // Always navigate directly to categories page
    setCurrentScreen('category');
  }, [categories, selectedCategory, setSelectedCategory, setCurrentScreen]);

  // Continuous infinite scroll interval with pause-on-hover/touch
  useEffect(() => {
    if (displayBanners.length <= 1 || isBannerPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => prev + 1);
      setIsTransitioning(true);
    }, 4000);

    return () => clearInterval(timer);
  }, [displayBanners.length, isBannerPaused]);

  // Seamless zero-jump wrap when reaching cloned end
  const handleBannerTransitionEnd = () => {
    if (currentSlide === displayBanners.length) {
      setIsTransitioning(false);
      setCurrentSlide(0);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  const handleBannerTouchStart = (e) => {
    setIsBannerPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleBannerTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleBannerTouchEnd = () => {
    setIsBannerPaused(false);
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 45) {
      setCurrentSlide(prev => (prev < bannersWithClone.length - 1 ? prev + 1 : prev));
      setIsTransitioning(true);
    } else if (diff < -45) {
      if (currentSlide === 0) {
        setIsTransitioning(false);
        setCurrentSlide(displayBanners.length - 1);
      } else {
        setCurrentSlide(prev => prev - 1);
        setIsTransitioning(true);
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleDotClick = (idx) => {
    setIsTransitioning(true);
    setCurrentSlide(idx);
  };

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

  // Continuous infinite loop duplicate list for seamless 50% translation wrap
  const infiniteBrands = useMemo(() => {
    if (!topBrandsList || topBrandsList.length === 0) return [];
    let base = [...topBrandsList];
    while (base.length < 8) {
      base = [...base, ...topBrandsList];
    }
    return [...base, ...base];
  }, [topBrandsList]);

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

  // Essential Beauty Staples Data
  const beautyEssentials = useMemo(() => [
    { id: 'be1', title: 'Face Serums', subtitle: 'Radiance & Hydration', icon: Sparkles, query: 'Serum' },
    { id: 'be2', title: 'Hair Care Oils', subtitle: 'Nourishment & Spa', icon: Scissors, query: 'Hair' },
    { id: 'be3', title: 'Lipsticks & Oils', subtitle: 'Velvet & Gloss Shades', icon: Palette, query: 'Lipstick' },
    { id: 'be4', title: 'Aloevera & Green Care', subtitle: 'Pure Organic Care', icon: Leaf, query: 'Aloe' },
    { id: 'be5', title: 'Waxing & Kits', subtitle: 'Salon Smooth Finish', icon: Gift, query: 'Wax' },
    { id: 'be6', title: 'Sunscreen Shades', subtitle: 'Broad Spectrum UV', icon: Sun, query: 'Sunscreen' }
  ], []);

  return (
    <div className="min-h-screen bg-white pb-32 animate-fade-in relative selection:bg-[#FCE4EC]">
      {/* ========================================================================= */}
      {/* 1. HEADER (SALBEAU SCRIPT LOGO + NOTIFICATIONS + WISHLIST) */}
      {/* ========================================================================= */}
      <div className="px-4 pt-3 pb-2 bg-white flex justify-between items-center">
        <h1
          style={{ fontFamily: "'Great Vibes', cursive, 'Snell Roundhand', serif" }}
          className="text-4xl text-[#C2477A] tracking-wide select-none"
        >
          Salbeau
        </h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('notifications')}
            className="relative w-9 h-9 rounded-full bg-[#FFF5F8] flex items-center justify-center border border-[#FCE4EC] text-[#C2477A] hover:bg-[#FCE4EC] transition-colors cursor-pointer"
            title="Notification Center"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C2477A] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentScreen('wishlist')}
            className="relative w-9 h-9 rounded-full bg-[#FFF5F8] flex items-center justify-center border border-[#FCE4EC] text-[#C2477A] hover:bg-[#FCE4EC] transition-colors cursor-pointer"
            title="Wishlist"
          >
            <Heart size={18} className={favorites.length > 0 ? "fill-[#C2477A]" : ""} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C2477A] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH BAR (WITH SCANNER ICON ON RIGHT) */}
      {/* ========================================================================= */}
      <div className="px-4 mb-4">
        <div
          onClick={() => {
            if (setGlobalSearchQuery && searchQuery) setGlobalSearchQuery(searchQuery);
            setCurrentScreen('search');
          }}
          className="w-full flex items-center bg-white border border-[#F5A8C0] px-3.5 py-2 rounded-full shadow-2xs cursor-pointer hover:border-[#C2477A] transition-colors"
        >
          <Search size={16} className="text-[#C2477A] shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-[#8C7078] px-2.5 truncate">
            {searchQuery || 'Search products, brands, lipsticks...'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentScreen('search');
            }}
            className="text-[#C2477A] hover:opacity-80 p-0.5 cursor-pointer"
          >
            <QrCode size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HERO BANNER (INFINITE CONTINUOUS LOOP CAROUSEL) */}
      {/* ========================================================================= */}
      {displayBanners.length > 0 && (
        <div className="px-4 mb-6">
          <div
            className="relative w-full aspect-[2.56/1] rounded-3xl overflow-hidden shadow-xs border border-[#FCE4EC] bg-[#FDE8EF] select-none"
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
            onTouchStart={handleBannerTouchStart}
            onTouchMove={handleBannerTouchMove}
            onTouchEnd={handleBannerTouchEnd}
          >
            {/* Sliding Track (1, 2, 3, 4, 5, 1...) */}
            <div
              className="flex w-full h-full"
              onTransitionEnd={handleBannerTransitionEnd}
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: isTransitioning ? 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              {bannersWithClone.map((banner, idx) => (
                <div
                  key={`${banner.id || 'banner'}-${idx}`}
                  onClick={() => handleBannerClick(banner)}
                  className="min-w-full w-full h-full relative cursor-pointer shrink-0"
                >
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#FFF0F5] to-[#FCE4EC] border border-[#FCE4EC] flex flex-col justify-center px-6">
                      {banner.badge && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C2477A] mb-1">
                          {banner.badge}
                        </span>
                      )}
                      <h3 className="text-lg font-black text-[#3A2430] leading-tight">
                        {banner.title}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-xs text-[#8C7078] font-medium mt-1">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Carousel Pagination Dots */}
            {displayBanners.length > 1 && (
              <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-20">
                {displayBanners.map((banner, idx) => {
                  const isActive = (currentSlide % displayBanners.length) === idx;
                  return (
                    <button
                      key={banner.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDotClick(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive ? 'w-4 bg-[#C2477A]' : 'w-1.5 bg-black/35 hover:bg-black/50'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SHOP BY CATEGORY (HORIZONTAL CAROUSEL) */}
      {/* ========================================================================= */}
      {(displayCategories.length > 0 || isCatalogLoading) && (
        <>
          <SectionHeader
            title="Shop by Category"
            ctaText="View All →"
            onCtaPress={() => setCurrentScreen('category')}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 mb-6 pb-1">
            {displayCategories.length > 0
              ? displayCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentScreen('category');
                    }}
                    className="bg-white rounded-2xl border border-[#FCE4EC] p-2 flex flex-col items-center shadow-2xs w-[88px] shrink-0 cursor-pointer hover:border-[#C2477A]/50 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/50 flex items-center justify-center">
                      <img
                        src={cat.image || ''}
                        alt={cat.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#3A2430] text-center truncate w-full">
                      {cat.name}
                    </span>
                    <span className="text-[9px] font-medium text-[#8C7078] text-center mt-0.5">
                      {cat.countText}
                    </span>
                  </div>
                ))
              : [1, 2, 3, 4, 5].map((k) => <SkeletonCategoryCard key={`sk_cat_${k}`} />)}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. TRENDING NOW (HORIZONTAL PRODUCT CAROUSEL) */}
      {/* ========================================================================= */}
      {(trendingProducts.length > 0 || isCatalogLoading) && (
        <>
          <SectionHeader
            title="🔥 Trending Now"
            ctaText="View All →"
            onCtaPress={() => setCurrentScreen('search')}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 mb-6 pb-1">
            {trendingProducts.length > 0
              ? trendingProducts.map((item) => (
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
                ))
              : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_trend_${k}`} />)}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 6. TOP BRANDS (INFINITE CONTINUOUS LOOP CAROUSEL) */}
      {/* ========================================================================= */}
      {(topBrandsList.length > 0 || isCatalogLoading) && (
        <div className="mb-6">
          <SectionHeader
            title="Top Brands"
            ctaText="View All →"
            onCtaPress={() => setCurrentScreen('search')}
          />
          <div className="relative w-full overflow-hidden pb-1">
            {topBrandsList.length > 0 ? (
              <div className="animate-brand-marquee flex gap-3 px-4 py-1">
                {infiniteBrands.map((brand, idx) => (
                  <button
                    key={`${brand.id}-${idx}`}
                    onClick={() => {
                      const brandQuery = (brand.name || '').replace('\n', ' ');
                      if (setGlobalSearchQuery) setGlobalSearchQuery(brandQuery);
                      setSearchQuery(brandQuery);
                      setCurrentScreen('search');
                    }}
                    className="w-[72px] h-[72px] shrink-0 rounded-full bg-white border border-[#FCE4EC] shadow-xs flex items-center justify-center p-1.5 hover:border-[#C2477A] hover:scale-105 active:scale-95 transition-all cursor-pointer overflow-hidden group shrink-0"
                    title={brand.name}
                  >
                    {brand.logo && typeof brand.logo === 'string' && brand.logo.startsWith('http') ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-4/5 h-4/5 object-contain group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <span className="text-[9.5px] font-black text-center tracking-tight text-[#1F2937] line-clamp-2 px-1">
                        {brand.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 px-4 py-1">
                {[1, 2, 3, 4, 5].map((k) => <SkeletonBrandCircle key={`sk_brand_${k}`} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. NEW ARRIVALS (HORIZONTAL PRODUCT CAROUSEL) */}
      {/* ========================================================================= */}
      {(newArrivals.length > 0 || isCatalogLoading) && (
        <>
          <SectionHeader
            title="New Arrivals"
            ctaText="View All →"
            onCtaPress={() => setCurrentScreen('search')}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 mb-6 pb-1">
            {newArrivals.length > 0
              ? newArrivals.map((item) => (
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
                ))
              : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_na_${k}`} />)}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 8. BEST SELLERS (HORIZONTAL PRODUCT CAROUSEL) */}
      {/* ========================================================================= */}
      {(bestSellers.length > 0 || isCatalogLoading) && (
        <>
          <SectionHeader
            title="Best Sellers"
            ctaText="View All →"
            onCtaPress={() => setCurrentScreen('search')}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 mb-6 pb-1">
            {bestSellers.length > 0
              ? bestSellers.map((item) => (
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
                ))
              : [1, 2, 3].map((k) => <SkeletonProductCard key={`sk_bs_${k}`} />)}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 9. BEAUTY EDIT (EDITORIAL BANNER CARD) */}
      {/* ========================================================================= */}
      <SectionHeader
        title="Beauty Edit"
        ctaText="View All →"
        onCtaPress={() => setCurrentScreen('search')}
      />
      <div className="px-4 mb-6">
        <div className="bg-[#FFF0F5] rounded-3xl overflow-hidden border border-[#FCE4EC] shadow-xs flex items-center min-h-[160px]">
          {/* Left Editorial Text Column */}
          <div className="flex-1 p-4 pr-1 z-10 flex flex-col justify-center">
            <div className="bg-[#C2477A] px-2 py-0.5 rounded-full self-start mb-2">
              <span className="text-white text-[8px] font-black uppercase tracking-wider block">
                THE SALBEAU EDIT
              </span>
            </div>
            <h3 className="text-[15px] font-black text-[#3A2430] leading-snug mb-1">
              Autumn Gloss & Radiance Rituals
            </h3>
            <p className="text-[9.5px] text-[#8C7078] font-medium leading-relaxed mb-3">
              Discover curated autumn beauty masterclasses, pro artist tricks, and hydration secrets for glass skin.
            </p>
            <button
              onClick={() => setCurrentScreen('search')}
              className="bg-[#C2477A] hover:bg-[#a83765] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full self-start shadow-xs transition-colors cursor-pointer"
            >
              Read Beauty Journal →
            </button>
          </div>

          {/* Right Editorial Decoration */}
          <div className="w-[42%] h-full flex justify-center items-center relative overflow-hidden bg-white/10 rounded-r-3xl">
            <Sparkles className="text-white/40" size={48} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10. ESSENTIAL BEAUTY STAPLES (2-COLUMN GRID) */}
      {/* ========================================================================= */}
      <SectionHeader
        title="Essential Beauty Staples"
        subtitle="Handpicked pro catalog favorites"
        ctaText="Explore All →"
        onCtaPress={() => setCurrentScreen('search')}
      />
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {beautyEssentials.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (setGlobalSearchQuery) setGlobalSearchQuery(item.query);
                setSearchQuery(item.query);
                setCurrentScreen('search');
              }}
              className="bg-white rounded-2xl border border-[#FCE4EC] p-2.5 flex items-center gap-2.5 shadow-2xs cursor-pointer hover:border-[#C2477A]/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FFF5F8] border border-[#FCE4EC] shrink-0 text-[#C2477A]">
                <IconComp size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-extrabold text-[#3A2430] truncate block">
                  {item.title}
                </span>
                <span className="text-[8.5px] font-medium text-[#8C7078] truncate block">
                  {item.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 mb-6 pb-1">
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
          </div>
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
          <div className="px-4 mb-6">
            <div className="bg-[#FFF5F8] rounded-3xl p-4 border border-[#FCE4EC] shadow-2xs flex items-center justify-between">
              <div className="flex-1 pr-3">
                <span className="text-[8.5px] font-black text-[#C2477A] uppercase tracking-wider mb-1 block">
                  DUO BEAUTY BUNDLE
                </span>
                <h4 className="text-xs font-black text-[#3A2430] mb-1 leading-snug line-clamp-2">
                  {duoBundle.title}
                </h4>
                <p className="text-[9.5px] text-[#8C7078] font-medium mb-2.5 leading-relaxed">
                  {duoBundle.subtitle}
                </p>
                <button
                  onClick={handleAddBundleToCart}
                  className="bg-[#C2477A] hover:bg-[#a83765] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Add Bundle ₹{duoBundle.bundlePrice} →
                </button>
              </div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-[#F5A8C0] shrink-0">
                <img
                  src={getSafeImageSource(duoBundle.image, '')}
                  alt={duoBundle.title}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 14. STICKY VIEW CART BAR (WHEN ITEMS IN CART) */}
      {/* ========================================================================= */}
      {totalCartQuantity > 0 && (
        <div className="fixed bottom-16 left-3 right-3 z-40 bg-[#C2477A] rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag size={17} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-black text-white tracking-wide block">
                {totalCartQuantity} {totalCartQuantity === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('cart')}
            className="bg-white text-[#C2477A] text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
