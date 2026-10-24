import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
  Plus,
  Minus,
  Heart,
  Search,
  X,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import {
  MAIN_CATEGORIES,
  CATEGORY_DETAILS_MAP,
  findCategoryConfig,
  getSubcategoriesForCategory,
  getLeafCategoriesForSubcategory,
  filterProductsByHierarchy
} from '../config/categoriesHierarchy';

export const CategoryScreen = () => {
  const {
    categories: dbCategories,
    selectedCategory,
    setSelectedCategory,
    activeProducts,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart = [],
    isFavorite,
    toggleFavorite
  } = useApp();

  // Navigation Stack Level:
  // 1: Shop by Category (12 Main Categories Grid)
  // 2: Category Detail (Hero Banner + Subcategories visual list)
  // 3: Subcategory Screen (Subcategory Banner + Leaf Categories)
  // 4: Product Listing (2-Column Grid + Search & Filter)
  const [navLevel, setNavLevel] = useState(1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeLeafCategory, setActiveLeafCategory] = useState(null);
  const [openedFromHome, setOpenedFromHome] = useState(false);

  // Sync if selectedCategory is passed from HomeScreen
  useEffect(() => {
    if (selectedCategory) {
      const matched = findCategoryConfig(selectedCategory);
      setActiveCategory(matched);
      setNavLevel(2);
      setOpenedFromHome(true);
    }
  }, [selectedCategory]);

  // Combined categories list (preserving MAIN_CATEGORIES + any custom DB categories)
  const displayCategories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return MAIN_CATEGORIES;
    
    // Filter active categories from db
    const activeDbCats = dbCategories.filter(c => c.enabled !== false);
    if (activeDbCats.length === 0) return [];

    return activeDbCats.map(dbCat => {
      const matched = MAIN_CATEGORIES.find(c =>
        c.id === dbCat.id ||
        (dbCat.name && c.name && dbCat.name.trim().toLowerCase() === c.name.trim().toLowerCase()) ||
        (dbCat.name && c.dbKey && dbCat.name.trim().toLowerCase() === c.dbKey.trim().toLowerCase())
      );

      return {
        id: dbCat.id,
        dbKey: matched?.dbKey || dbCat.name.toLowerCase(),
        name: dbCat.name,
        // Live image from DB takes highest priority
        image: dbCat.image || matched?.image || '',
        fallbackImage: matched?.fallbackImage || dbCat.image || '',
        tagline: matched?.tagline || 'Premium Beauty Collection',
        description: matched?.description || 'Explore verified authentic formulations',
        accent: matched?.accent || '#C2477A',
        bgLight: matched?.bgLight || '#FFF0F5',
        enabled: dbCat.enabled
      };
    });
  }, [dbCategories]);

  // Cart quantity map
  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    for (const item of (cart || [])) {
      const pid = item.product?.id || item.id;
      if (pid) map.set(pid, item.quantity || 0);
    }
    return map;
  }, [cart]);

  // Handlers
  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    setActiveLeafCategory(null);
    setNavLevel(2);
    if (setSelectedCategory) setSelectedCategory(cat);
  };

  const handleSelectSubcategory = (subcat) => {
    setActiveSubcategory(subcat);
    setActiveLeafCategory(null);
    setNavLevel(3);
  };

  const handleSelectLeafCategory = (leaf) => {
    setActiveLeafCategory(leaf);
    setNavLevel(4);
  };

  const handleViewAllProducts = () => {
    setActiveLeafCategory(null);
    setNavLevel(4);
  };

  const handleBack = () => {
    if (navLevel === 4) {
      if (activeLeafCategory) {
        setNavLevel(3);
      } else {
        setNavLevel(2);
      }
    } else if (navLevel === 3) {
      setNavLevel(2);
    } else if (navLevel === 2) {
      if (openedFromHome) {
        setOpenedFromHome(false);
        if (setSelectedCategory) setSelectedCategory(null);
        setCurrentScreen('home');
      } else {
        if (setSelectedCategory) setSelectedCategory(null);
        setNavLevel(1);
      }
    } else {
      setCurrentScreen('home');
    }
  };

  // Product Listing state for Level 4
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState('ALL');

  // Filtered products for Level 4
  const currentProducts = useMemo(() => {
    let list = filterProductsByHierarchy(
      activeProducts,
      activeCategory?.name,
      activeSubcategory?.name,
      activeLeafCategory
    );

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (selectedBrand !== 'ALL') {
      list = list.filter(p => {
        const b = p.brandName || p.brand_name || p.brand || '';
        return b.toLowerCase() === selectedBrand.toLowerCase();
      });
    }

    if (selectedPriceTier !== 'ALL') {
      list = list.filter(p => {
        const price = getRolePrice(p, userRole);
        if (selectedPriceTier === 'u500') return price < 500;
        if (selectedPriceTier === '500_1000') return price >= 500 && price <= 1000;
        if (selectedPriceTier === 'a1000') return price > 1000;
        return true;
      });
    }

    if (selectedSort === 'price_asc') {
      list.sort((a, b) => getRolePrice(a, userRole) - getRolePrice(b, userRole));
    } else if (selectedSort === 'price_desc') {
      list.sort((a, b) => getRolePrice(b, userRole) - getRolePrice(a, userRole));
    } else if (selectedSort === 'rating') {
      list.sort((a, b) => (Number(b.rating || 4.5) - Number(a.rating || 4.5)));
    }

    return list;
  }, [activeProducts, activeCategory, activeSubcategory, activeLeafCategory, searchQuery, selectedBrand, selectedPriceTier, selectedSort, userRole, getRolePrice]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set();
    (activeProducts || []).forEach(p => {
      const b = p.brandName || p.brand_name || p.brand;
      if (b && typeof b === 'string') brandSet.add(b.trim());
    });
    return Array.from(brandSet);
  }, [activeProducts]);

  // ─────────────────────────────────────────────────────────────
  // LEVEL 4: PRODUCT LISTING SCREEN
  // ─────────────────────────────────────────────────────────────
  if (navLevel === 4) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#FCE4EC] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs font-bold text-[#C2477A] hover:opacity-80 transition-opacity"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <div className="text-center px-2 flex-1">
              <h1 className="text-sm font-extrabold text-[#3A2430] truncate">
                {activeLeafCategory?.name || activeSubcategory?.name || activeCategory?.name}
              </h1>
              <p className="text-[10px] text-[#8C7078] font-medium truncate">
                {activeCategory?.name} {activeSubcategory ? `› ${activeSubcategory.name}` : ''}
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* Search bar */}
          <div className="flex items-center bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] px-3 py-2">
            <Search size={14} className="text-[#C2477A] shrink-0" />
            <input
              type="text"
              placeholder={`Search in ${activeLeafCategory?.name || activeSubcategory?.name || 'catalog'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-2 bg-transparent text-xs text-[#3A2430] outline-none placeholder-[#B0909A] font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border-b border-gray-100 py-2 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="text-xs font-bold text-[#3A2430] bg-[#FFF0F5] border border-[#FCE4EC] rounded-full px-2.5 py-1 outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <button
            onClick={() => setSelectedPriceTier('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedPriceTier === 'ALL' ? 'bg-[#C2477A] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Prices
          </button>
          <button
            onClick={() => setSelectedPriceTier('u500')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedPriceTier === 'u500' ? 'bg-[#C2477A] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Under ₹500
          </button>
          <button
            onClick={() => setSelectedPriceTier('500_1000')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedPriceTier === '500_1000' ? 'bg-[#C2477A] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            ₹500 - ₹1,000
          </button>
          <button
            onClick={() => setSelectedPriceTier('a1000')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedPriceTier === 'a1000' ? 'bg-[#C2477A] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Above ₹1,000
          </button>
        </div>

        {/* 2-Column Product Grid */}
        <div className="p-4">
          {currentProducts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3 text-[#C2477A]">
                <Sparkles size={24} />
              </div>
              <h2 className="text-sm font-bold text-[#3A2430]">No Products Found</h2>
              <p className="text-xs text-gray-500 mt-1">Try resetting search filters or explore another collection.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBrand('ALL');
                  setSelectedPriceTier('ALL');
                }}
                className="mt-4 px-4 py-1.5 bg-[#C2477A] text-white text-xs font-bold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {currentProducts.map((p) => {
                const rolePrice = getRolePrice(p, userRole);
                const mrp = p.mrp && p.mrp > rolePrice ? p.mrp : Math.round(rolePrice * 1.25);
                const discountPct = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;
                const isFav = isFavorite(p.id);
                const qty = cartQuantityMap.get(p.id) || 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setCurrentScreen('product');
                    }}
                    className="bg-white rounded-2xl p-2.5 border border-[#FCE4EC] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Image + Wishlist */}
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#FFF5F8] mb-2">
                        <img
                          src={p.image || ''}
                          alt={p.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                          className="w-full h-full object-cover"
                        />
                        {discountPct > 0 && (
                          <div className="absolute top-2 left-2 bg-[#2E7D32] px-1.5 py-0.5 rounded text-white text-[9px] font-black">
                            {discountPct}% OFF
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[#C2477A] shadow-xs"
                        >
                          <Heart size={14} fill={isFav ? '#C2477A' : 'none'} />
                        </button>
                      </div>

                      <p className="text-[10px] font-bold text-[#8C7078] uppercase tracking-wider truncate">
                        {p.brandName || p.brand_name || p.brand || 'Luxury'}
                      </p>
                      <h3 className="text-xs font-bold text-[#3A2430] leading-4 line-clamp-2 h-8 mt-0.5">
                        {p.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        <div className="flex items-center bg-[#FFF8E1] px-1.5 py-0.5 rounded border border-[#FFE082] text-[10px] font-black text-[#854D0E]">
                          <Star size={10} className="fill-[#F59E0B] text-[#F59E0B] mr-0.5" />
                          <span>{p.rating || '4.5'}</span>
                        </div>
                        <span className="text-[9.5px] text-gray-400 font-medium">
                          ({p.reviews_count || 128})
                        </span>
                      </div>
                    </div>

                    {/* Price and Cart Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div>
                        {discountPct > 0 && (
                          <p className="text-[10px] text-gray-400 line-through">₹{mrp}</p>
                        )}
                        <p className="text-sm font-black text-[#C2477A]">₹{rolePrice}</p>
                      </div>

                      {qty > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center bg-[#C2477A] text-white rounded-full px-2 py-0.5 gap-1.5"
                        >
                          <button
                            onClick={() => {
                              if (qty > 1) updateCartQuantity(p.id, qty - 1);
                              else removeFromCart(p.id);
                            }}
                            className="font-black text-xs"
                          >
                            −
                          </button>
                          <span className="text-xs font-black">{qty}</span>
                          <button
                            onClick={() => updateCartQuantity(p.id, qty + 1)}
                            className="font-black text-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 1);
                          }}
                          className="bg-[#FFF0F5] border border-[#C2477A] text-[#C2477A] text-[10px] font-black px-2.5 py-1 rounded-full hover:bg-[#C2477A] hover:text-white transition-colors"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 3: SUBCATEGORY SCREEN (LEAF CATEGORIES)
  if (navLevel === 3) {
    const leafCategories = (activeSubcategory?.leafCategories && activeSubcategory.leafCategories.length > 0)
      ? activeSubcategory.leafCategories
      : getLeafCategoriesForSubcategory(activeSubcategory, activeCategory);

    return (
      <div className="flex flex-col min-h-screen bg-white pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#FCE4EC] px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
          >
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
            {activeSubcategory?.name}
          </h1>
          <button
            onClick={handleViewAllProducts}
            className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC] text-[11px] font-bold text-[#C2477A]"
          >
            View All
          </button>
        </div>

        {/* Hero banner */}
        <div className="mx-4 mt-3 mb-4 rounded-2xl overflow-hidden shadow-xs border border-[#FCE4EC] bg-[#FFF0F5] relative h-36">
          <img
            src={activeSubcategory?.image || activeCategory?.image || ''}
            alt={activeSubcategory?.name}
            onError={(e) => { e.target.style.display = 'none'; }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent flex flex-col justify-end p-4">
            <span className="bg-white/20 self-start px-2 py-0.5 rounded text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md mb-1">
              {activeCategory?.name}
            </span>
            <h2 className="text-xl font-black text-white">{activeSubcategory?.name}</h2>
            {activeSubcategory?.tagline && (
              <p className="text-xs text-white/90 font-medium">{activeSubcategory.tagline}</p>
            )}
          </div>
        </div>

        <div className="px-4 mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wider">
            Select Category
          </h3>
          <button onClick={handleViewAllProducts} className="text-xs font-bold text-[#C2477A]">
            All {activeSubcategory?.name} ›
          </button>
        </div>

        <div className="px-4 space-y-2.5">
          {leafCategories.map((leaf, idx) => (
            <button
              key={leaf.id || idx}
              onClick={() => handleSelectLeafCategory(leaf)}
              className="w-full bg-white rounded-2xl p-3 border border-[#FCE4EC] flex items-center justify-between shadow-2xs hover:bg-[#FFF5F8] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFF0F5] border border-[#FCE4EC] overflow-hidden flex items-center justify-center text-[#C2477A] shrink-0">
                  {leaf.image ? (
                    <img
                      src={leaf.image}
                      alt={leaf.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Sparkles size={18} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3A2430]">{leaf.name}</h4>
                  <p className="text-[11px] text-[#8C7078] font-medium">Explore collection</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#FFF0F5] flex items-center justify-center border border-[#FCE4EC] text-[#C2477A]">
                <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 2: CATEGORY DETAIL SCREEN
  // ─────────────────────────────────────────────────────────────
  if (navLevel === 2 && activeCategory) {
    const subcategories = getSubcategoriesForCategory(activeCategory);

    return (
      <div className="flex flex-col min-h-screen bg-white pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#FCE4EC] px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
          >
            <ChevronLeft size={18} /> Categories
          </button>
          <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
            {activeCategory.name}
          </h1>
          <button
            onClick={handleViewAllProducts}
            className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC] text-[11px] font-bold text-[#C2477A]"
          >
            Shop All
          </button>
        </div>

        {/* Top Hero Banner */}
        <div className="mx-4 mt-3 mb-4 rounded-2xl overflow-hidden shadow-xs border border-[#FCE4EC] bg-[#FFF0F5] relative h-44">
          <img
            src={activeCategory.image || activeCategory.fallbackImage}
            alt={activeCategory.name}
            onError={(e) => {
              if (activeCategory.fallbackImage && e.currentTarget.src !== activeCategory.fallbackImage) {
                e.currentTarget.src = activeCategory.fallbackImage;
              }
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
            <span className="bg-white/20 self-start px-2.5 py-0.5 rounded-full text-white text-[10px] font-extrabold tracking-wider uppercase mb-1 backdrop-blur-md">
              Featured Collection
            </span>
            <h2 className="text-2xl font-black text-white">{activeCategory.name}</h2>
            {activeCategory.tagline && (
              <p className="text-xs font-bold text-white/95 mt-0.5">{activeCategory.tagline}</p>
            )}
            {activeCategory.description && (
              <p className="text-[11px] text-white/80 font-medium mt-1 line-clamp-2">
                {activeCategory.description}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wider">
            Subcategories
          </h3>
          <button onClick={handleViewAllProducts} className="text-xs font-bold text-[#C2477A]">
            Explore All ›
          </button>
        </div>

        {/* Subcategories visual cards */}
        <div className="px-4 space-y-3">
          {subcategories.map((sub, idx) => (
            <button
              key={sub.id || idx}
              onClick={() => handleSelectSubcategory(sub)}
              className="w-full bg-white rounded-2xl border border-[#FCE4EC] p-3 flex items-center justify-between shadow-2xs hover:bg-[#FFF5F8] transition-colors text-left"
            >
              <div className="flex items-center gap-3.5 pr-2">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF0F5] border border-[#FCE4EC] shrink-0">
                  <img
                    src={sub.image || ''}
                    alt={sub.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3A2430] leading-snug">{sub.name}</h4>
                  {sub.tagline && (
                    <p className="text-[11px] text-[#8C7078] font-medium mt-0.5">{sub.tagline}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#FFF0F5] px-2.5 py-1.5 rounded-full border border-[#FCE4EC] text-[#C2477A] text-[10px] font-bold shrink-0">
                <span>View</span>
                <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 1: SHOP BY CATEGORY GRID (12 MAIN CATEGORIES)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#FCE4EC] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Home
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Shop by Category
        </h1>
        <button
          onClick={() => setCurrentScreen('search')}
          className="w-8 h-8 rounded-full bg-[#FFF0F5] flex items-center justify-center border border-[#FCE4EC] text-[#C2477A]"
        >
          <Search size={15} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-base font-black text-[#3A2430]">Explore Collections</h2>
          <p className="text-xs text-[#8C7078] font-medium mt-0.5">
            Discover 100% authentic beauty, salon & grooming formulations
          </p>
        </div>

        {/* 2-3 Column Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {displayCategories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => handleSelectCategory(cat)}
              className="bg-white rounded-2xl border border-[#FCE4EC] p-2.5 shadow-2xs hover:shadow-md hover:scale-[1.01] transition-all flex flex-col text-left group"
            >
              {/* Category Image - Consistent Aspect Ratio */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFF5F8] border border-[#FCE4EC] mb-2 relative">
                <img
                  src={cat.image || cat.fallbackImage}
                  alt={cat.name}
                  onError={(e) => {
                    if (cat.fallbackImage && e.currentTarget.src !== cat.fallbackImage) {
                      e.currentTarget.src = cat.fallbackImage;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Category Name Only - DO NOT show product counts or category counts */}
              <div className="text-center py-1 w-full">
                <span className="text-xs font-bold text-[#3A2430] group-hover:text-[#C2477A] transition-colors line-clamp-2">
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryScreen;
