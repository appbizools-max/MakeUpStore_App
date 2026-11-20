import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';
import { matchProductSearch } from '../../utils/productSearchEngine';
import { trackCustomerSearch } from '../../utils/customerSearchService';
import { storage } from '../../utils/storage';
import { PurplleProductCard } from '../../components/PurplleProductCard';
import { PremiumFilterBottomSheet } from '../../components/PremiumFilterBottomSheet';
import { getCartKey, getSafeProductShadesList, getCartQuantityMap } from '../../utils/cartKeyUtils';
import { cleanProductDisplayName } from '../../utils/productDisplayNameUtils';
import { getBrandThemeColor } from '../home/HomeScreen';
import { BrandCircle } from '../home/components/ContinuousBrandScroller';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Curated Category Tabs matching prompt sequence
const SEARCH_CATEGORIES = [
  'All',
  'Skincare',
  'Makeup',
  'Hair Styling',
  'Hair Care',
  'Fragrance',
  'Bath & Body',
  "Men's Grooming",
  'Beauty Tools',
  'Wellness',
  'Gift Sets'
];

// Trending Searches with curated beauty queries and icons
const TRENDING_SEARCHES = [
  { id: 'ts_1', text: 'Korean glass skin combos', icon: 'sparkles-outline', tag: 'Trending' },
  { id: 'ts_2', text: 'Satin finish matte foundations', icon: 'color-palette-outline', tag: 'Popular' },
  { id: 'ts_3', text: 'Long-lasting highlighters', icon: 'sunny-outline', tag: 'Hot' },
  { id: 'ts_4', text: 'Floral perfumes under ₹1,500', icon: 'rose-outline', tag: 'Best Value' },
];

const STORAGE_KEY_RECENT = 'salbeau_recent_searches_list';

/**
 * Redesigned Beauty & Cosmetics Search Screen
 * 
 * Visual Design:
 * - Soft blush background (#FFFFFF)
 * - Primary rose pink (#D81B60)
 * - Dark text (#352832)
 * - Muted gray (#8A7B85)
 * - Border color (#F0E3EA)
 */
export const SearchScreen = () => {
  const {
    activeProducts = [],
    activeBrands = [],
    brands = [],
    isCatalogLoading = false,
    categories = [],
    setSelectedCategory: setGlobalSelectedCategory,
    subcategories = [],
    userRole,
    userProfile,
    getRolePrice,
    setSelectedProduct,
    setSelectedShade,
    rememberSelectedShade,
    setCurrentScreen,
    goBack,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal = 0,
    isFavorite,
    toggleFavorite,
    openShadeSheet,
    globalSearchQuery,
    setGlobalSearchQuery,
    selectedBrand,
    setSelectedBrand
  } = useApp();

  const [query, setQuery] = useState(globalSearchQuery || '');
  const [debouncedQuery, setDebouncedQuery] = useState(globalSearchQuery || '');

  // 150ms debounce prevents keystroke lag and JS thread choking while typing fast
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedBrands, setSelectedBrands] = useState([]); // Multi-select brands
  const [selectedPriceRange, setSelectedPriceRange] = useState('all'); // 'all' | 'u500' | '500_1000' | '1000_2000' | 'a2000'
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    setVisibleCount(24);
  }, [debouncedQuery, selectedCategory, selectedSubcategory, selectedBrands, selectedPriceRange, selectedDiscount]);

  const [brandFilterSearch, setBrandFilterSearch] = useState('');
  const [isRecentExpanded, setIsRecentExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Persistent recent searches list
  const [recentSearches, setRecentSearches] = useState([
    'Rose lipstick',
    'Facewash',
    'Waterproof liner',
    'Sunscreen SPF 50'
  ]);

  const searchInputRef = useRef(null);

  const totalCartQuantity = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity || 1), 0), [cart]);
  const totalCartPrice = useMemo(() => Number(cartSubtotal || 0), [cartSubtotal]);

  // Load persistent recent searches from storage
  useEffect(() => {
    const loadSearches = async () => {
      try {
        const saved = await storage.getItem(STORAGE_KEY_RECENT);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed);
          }
        }
      } catch (_) { }
    };
    loadSearches();
  }, []);

  // Sync recent searches to persistent storage
  const saveRecentSearches = useCallback((newList) => {
    setRecentSearches(newList);
    try {
      storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(newList));
    } catch (_) { }
  }, []);

  const addRecentSearch = useCallback((term) => {
    const clean = (term || '').trim();
    if (!clean) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch (_) { }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((itemToRemove) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== itemToRemove);
      try {
        storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch (_) { }
      return updated;
    });
  }, []);

  const clearAllRecent = useCallback(() => {
    saveRecentSearches([]);
  }, [saveRecentSearches]);

  // Pre-fill from globalSearchQuery (e.g. from Home search bar)
  useEffect(() => {
    if (globalSearchQuery) {
      setQuery(globalSearchQuery);
      addRecentSearch(globalSearchQuery);
      if (setGlobalSearchQuery) setGlobalSearchQuery('');
    }
  }, [globalSearchQuery, addRecentSearch, setGlobalSearchQuery]);

  // Pre-filter when navigating from Shop by Brand with a specific brand
  useEffect(() => {
    if (selectedBrand) {
      const bName = typeof selectedBrand === 'string'
        ? selectedBrand
        : (selectedBrand.name || selectedBrand.brand || '');
      if (bName) {
        setSelectedBrands([bName]);
        setQuery('');
        setSelectedCategory('All');
        setSelectedSubcategory('All');
        addRecentSearch(bName);
      }
      if (setSelectedBrand) setSelectedBrand(null);
    }
  }, [selectedBrand, setSelectedBrand, addRecentSearch]);

  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
  }, [cart]);

  // Count active applied filters (Nykaa Specification: Category, Subcategory, Brand, Price Range, Discount, Rating)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubcategory !== 'All') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedPriceRange !== 'all') count++;
    if (selectedDiscount > 0) count++;
    return count;
  }, [selectedCategory, selectedSubcategory, selectedBrands, selectedPriceRange, selectedDiscount]);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSelectedBrands([]);
    setSelectedPriceRange('all');
    setSelectedDiscount(0);
    setBrandFilterSearch('');
  };



  // Active / Available Brands computation (always fresh)
  const displayBrands = useMemo(() => {
    if (activeBrands && activeBrands.length > 0) return activeBrands;
    if (brands && brands.length > 0) return brands.filter(b => b.enabled !== false);
    return [];
  }, [activeBrands, brands]);

  // Real-Time Multi-Entity Suggestions (Brands, Categories, Subcategories, Products)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      return { all: [], brands: [], categories: [], subcategories: [], products: [], totalCount: 0 };
    }

    // 1. Matching Brands
    const matchedBrands = (displayBrands || [])
      .filter(b => (b.name || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(b => ({
        type: 'brand',
        id: b.id || b.name,
        title: b.name,
        badge: 'Brand',
        subtitle: 'Official Brand Collection',
        logo: b.logo || b.logo_url || '',
        brand: b
      }));

    // 2. Matching Categories
    const matchedCategories = (categories || [])
      .filter(c => (c.name || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'category',
        id: c.id || c.name,
        title: c.name,
        badge: 'Category',
        subtitle: 'Explore Category Department',
        image: c.image || c.icon || '',
        category: c
      }));

    // 3. Matching Subcategories
    const matchedSubcategories = (subcategories || [])
      .filter(s => (s.name || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(s => {
        const parentCat = s.category || s.category_name || '';
        return {
          type: 'subcategory',
          id: s.id || s.name,
          title: s.name,
          badge: 'Subcategory',
          subtitle: parentCat ? `in ${parentCat}` : 'Subcategory department',
          categoryName: parentCat,
          subcategory: s
        };
      });

    // 4. Matching Products
    const matchedProducts = (activeProducts || [])
      .filter(p => {
        const nMatch = (p.name || '').toLowerCase().includes(q);
        const bMatch = (p.brandName || '').toLowerCase().includes(q);
        const sMatch = Array.isArray(p.shades) && p.shades.some(sh => (sh.name || '').toLowerCase().includes(q));
        return nMatch || bMatch || sMatch;
      })
      .slice(0, 4)
      .map(p => ({
        type: 'product',
        id: p.id,
        title: cleanProductDisplayName(p.name),
        brandName: p.brandName || p.brand || '',
        price: typeof getRolePrice === 'function' ? getRolePrice(p, userRole) : (p.generalPrice || p.mrp || 0),
        mrp: p.mrp || 0,
        image: p.image || (Array.isArray(p.images) ? p.images[0] : ''),
        badge: 'Product',
        product: p
      }));

    const all = [
      ...matchedBrands,
      ...matchedCategories,
      ...matchedSubcategories,
      ...matchedProducts
    ];

    return {
      all,
      brands: matchedBrands,
      categories: matchedCategories,
      subcategories: matchedSubcategories,
      products: matchedProducts,
      totalCount: all.length
    };
  }, [query, displayBrands, categories, subcategories, activeProducts]);

  // Primary Filtered Results (Debounced for silky smooth 60fps typing)
  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    return (activeProducts || []).filter(p => {
      // Query search
      if (q) {
        const matchesQuery =
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brandName && p.brandName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (Array.isArray(p.shades) && p.shades.some(s =>
            (s?.name && s.name.toLowerCase().includes(q)) ||
            (s?.title && s.title.toLowerCase().includes(q)) ||
            (s?.code && String(s.code).toLowerCase().includes(q))
          ));
        if (!matchesQuery) return false;
      }

      // Category filter (Exact / Partial match)
      if (selectedCategory !== 'All') {
        const pCat = (p.category || '').toLowerCase().trim();
        const sCat = selectedCategory.toLowerCase().trim();
        if (!pCat.includes(sCat) && !sCat.includes(pCat)) return false;
      }

      // Subcategory filter
      if (selectedSubcategory !== 'All') {
        const pSub = (p.subcategory || '').toLowerCase().trim();
        const sSub = selectedSubcategory.toLowerCase().trim();
        if (!pSub.includes(sSub) && !sSub.includes(pSub)) return false;
      }

      // Brand filter (Multi-select) with Accent & Case Insensitive Matching
      if (selectedBrands.length > 0) {
        const pBrand = (p.brandName || p.brand || '').toLowerCase().trim();
        const isMatch = selectedBrands.some(b => {
          const target = (b || '').toLowerCase().trim();
          if (pBrand === target) return true;
          const cleanP = pBrand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
          const cleanT = target.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
          return cleanP === cleanT || cleanP.includes(cleanT) || cleanT.includes(cleanP);
        });
        if (!isMatch) return false;
      }

      // Price filter
      if (selectedPriceRange !== 'all') {
        const price = getRolePrice(p, userRole);
        if (selectedPriceRange === 'u500' && price >= 500) return false;
        if (selectedPriceRange === '500_1000' && (price < 500 || price > 1000)) return false;
        if (selectedPriceRange === '1000_2000' && (price < 1000 || price > 2000)) return false;
        if (selectedPriceRange === 'a2000' && price <= 2000) return false;
      }

      // Discount filter
      if (selectedDiscount > 0) {
        const rolePrice = getRolePrice(p, userRole);
        const mrp = Number(p.mrp) || rolePrice;
        const disc = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;
        if (disc < selectedDiscount) return false;
      }

      return true;
    });
  }, [activeProducts, debouncedQuery, selectedCategory, selectedSubcategory, selectedBrands, selectedPriceRange, selectedDiscount, userRole, getRolePrice]);

  // Customer Search Analytics Tracking
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const matchedList = (activeProducts || []).filter(p => matchProductSearch(p, trimmed).isMatch);
    const isFound = matchedList.length > 0;

    const timer = setTimeout(() => {
      trackCustomerSearch({
        query: trimmed,
        matchedProducts: matchedList,
        isFound,
        user: userProfile
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [query, activeProducts, userProfile]);

  const handleSelectQuery = (text) => {
    setQuery(text);
    addRecentSearch(text);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = useCallback((item) => {
    setShowSuggestions(false);
    if (!item) return;

    if (item.type === 'brand') {
      addRecentSearch(item.title);
      setQuery(item.title);
      setSelectedBrands([item.title]);
      setSelectedCategory('All');
      setSelectedSubcategory('All');
    } else if (item.type === 'category') {
      addRecentSearch(item.title);
      if (setGlobalSelectedCategory) setGlobalSelectedCategory(item.title);
      setCurrentScreen('category');
    } else if (item.type === 'subcategory') {
      addRecentSearch(item.title);
      if (item.categoryName && setGlobalSelectedCategory) {
        setGlobalSelectedCategory(item.categoryName);
      }
      setSelectedSubcategory(item.title);
      setCurrentScreen('category');
    } else if (item.type === 'product') {
      addRecentSearch(item.title);
      if (setSelectedProduct) setSelectedProduct(item.product);
      setCurrentScreen('product_detail');
    } else {
      handleSelectQuery(item.title || item.text);
    }
  }, [addRecentSearch, setGlobalSelectedCategory, setSelectedProduct, setCurrentScreen]);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      addRecentSearch(query);
    }
    setShowSuggestions(false);
  };

  const isSearchActive = query.trim().length > 0 || activeFilterCount > 0;

  return (
    <View className="flex-1 bg-white">
      {/* ── 1. HEADER & SEARCH BAR ───────────────────────────────────── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          shadowColor: '#D81B60',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
        className="px-4 pt-3 pb-2.5 z-30"
      >
        <View className="flex-row items-center gap-2.5">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (typeof goBack === 'function') goBack();
              else setCurrentScreen('home');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1,
            }}
            className="items-center justify-center shadow-2xs"
          >
            <Ionicons name="chevron-back" size={20} color="#D81B60" />
          </TouchableOpacity>

          {/* Prominent Rounded Search Input */}
          <View
            style={{
              height: 46,
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1.5,
              borderRadius: 24,
            }}
            className="flex-1 flex-row items-center px-3.5 shadow-2xs"
          >
            <Ionicons name="search" size={17} color="#D81B60" />
            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={(txt) => {
                setQuery(txt);
                setShowSuggestions(txt.trim().length > 0);
              }}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search products, brands, shades..."
              placeholderTextColor="#8A7B85"
              style={{ color: '#352832' }}
              className="flex-1 ml-2 text-xs font-semibold p-0"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setShowSuggestions(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#8A7B85" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Bottom Sheet Trigger Button */}
          <TouchableOpacity
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.75}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: activeFilterCount > 0 ? '#D81B60' : '#FFFFFF',
              borderColor: activeFilterCount > 0 ? '#D81B60' : '#F0E3EA',
              borderWidth: 1,
            }}
            className="items-center justify-center relative shadow-2xs"
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={activeFilterCount > 0 ? '#FFFFFF' : '#D81B60'}
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 17,
                  height: 17,
                  borderRadius: 8.5,
                  backgroundColor: '#352832',
                  borderColor: '#FFFFFF',
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 2. HORIZONTALLY SCROLLABLE CATEGORY CHIPS ──────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 8 }}
          className="mt-1"
        >
          {SEARCH_CATEGORIES.map((catName) => {
            const isSelected = selectedCategory === catName;
            return (
              <TouchableOpacity
                key={catName}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(catName)}
                style={{
                  backgroundColor: isSelected ? '#D81B60' : '#FFFFFF',
                  borderColor: isSelected ? '#D81B60' : '#F0E3EA',
                  borderWidth: 1,
                  borderRadius: 18,
                  paddingHorizontal: 13,
                  paddingVertical: 5.5,
                  marginRight: 8,
                }}
                className="shadow-2xs"
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : '#352832',
                    fontSize: 11.5,
                    fontWeight: isSelected ? '700' : '500',
                  }}
                >
                  {catName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── AUTOCOMPLETE SUGGESTIONS POPUP (Real-Time Matching Brands, Categories, Subcategories & Products) ── */}
      {showSuggestions && suggestions.totalCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 104,
            left: 14,
            right: 14,
            maxHeight: 420,
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1.5,
            borderRadius: 20,
            shadowColor: '#D81B60',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.16,
            shadowRadius: 12,
            elevation: 10,
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <View className="px-4 py-2.5 bg-[#FFF7FA] border-b border-[#F0E3EA] flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles" size={14} color="#D81B60" />
              <Text className="text-[11px] font-black text-[#352832] uppercase tracking-wider">
                Instant Suggestions
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSuggestions(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-[10px] font-bold text-[#8A7B85]">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            style={{ maxHeight: 360 }}
          >
            {suggestions.all.map((item, idx) => {
              const isBrand = item.type === 'brand';
              const isCategory = item.type === 'category';
              const isSubcategory = item.type === 'subcategory';
              const isProduct = item.type === 'product';

              return (
                <View
                  key={`${item.type}_${item.id}_${idx}`}
                  style={{
                    borderBottomWidth: idx !== suggestions.all.length - 1 ? 1 : 0,
                    borderBottomColor: '#F5ECF0',
                  }}
                  className="px-3.5 py-2.5 flex-row items-center justify-between bg-white"
                >
                  <TouchableOpacity
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 flex-1 pr-2"
                  >
                    {/* Visual Media Thumbnail */}
                    {isProduct ? (
                      <View className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-gray-100 items-center justify-center overflow-hidden p-0.5">
                        <Image
                          source={getSafeImageSource(item.image)}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : isCategory ? (
                      <View className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-indigo-100 items-center justify-center overflow-hidden p-0.5">
                        {item.image ? (
                          <Image
                            source={getSafeImageSource(item.image)}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name="grid" size={18} color="#4F46E5" />
                        )}
                      </View>
                    ) : isBrand ? (
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#FFF5F8',
                          borderWidth: 1.5,
                          borderColor: '#F080A5',
                          padding: 2.5,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            borderRadius: 15,
                            borderWidth: 1.2,
                            borderColor: '#FFFFFF',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#000000', fontSize: 10, fontWeight: '700' }}>
                            {(item.title || 'B').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-emerald-100 items-center justify-center">
                        <Ionicons name="pricetag" size={16} color="#059669" />
                      </View>
                    )}

                    {/* Content Details */}
                    <View className="flex-1">
                      {isProduct && item.brandName ? (
                        <Text className="text-[9.5px] font-bold text-[#D81B60] uppercase tracking-wider mb-0.5" numberOfLines={1}>
                          {item.brandName}
                        </Text>
                      ) : null}

                      <Text style={{ color: '#352832' }} className="text-xs font-black leading-snug" numberOfLines={1}>
                        {item.title}
                      </Text>

                      <View className="flex-row items-center gap-2 mt-0.5">
                        <Text style={{ color: '#8A7B85' }} className="text-[10px] font-medium" numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                        {isProduct && item.price > 0 && (
                          <Text style={{ color: '#352832' }} className="text-[11px] font-black">
                            ₹{item.price}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action / Stepper / Badge */}
                  <View className="flex-row items-center gap-1.5 shrink-0">
                    {isProduct && item.product ? (
                      (() => {
                        const prod = item.product;
                        const shadesList = getSafeProductShadesList(prod);
                        const firstShade = shadesList[0] || null;
                        const existingCartItem = (cart || []).find(ci => {
                          const ciPid = ci.product?.id || ci.productId;
                          return String(ciPid) === String(prod.id);
                        });
                        const pCartKey = existingCartItem ? existingCartItem.id : (getCartKey(prod.id, firstShade) || String(prod.id));
                        const inCartQty = existingCartItem ? (existingCartItem.quantity || 1) : (cartQuantityMap?.get(pCartKey) || cartQuantityMap?.get(String(prod.id)) || 0);

                        if (inCartQty > 0) {
                          return (
                            <View
                              style={{ backgroundColor: '#D81B60' }}
                              className="flex-row items-center rounded-lg px-2 py-1 gap-1.5 shadow-2xs"
                            >
                              <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={(e) => {
                                  e?.stopPropagation?.();
                                  if (inCartQty > 1) {
                                    updateCartQuantity?.(pCartKey, inCartQty - 1);
                                  } else {
                                    removeFromCart?.(pCartKey);
                                  }
                                }}
                                className="w-4 h-4 items-center justify-center"
                              >
                                <Ionicons name="remove" size={12} color="#FFFFFF" />
                              </TouchableOpacity>
                              <Text className="text-white text-[11px] font-black min-w-[12px] text-center">
                                {inCartQty}
                              </Text>
                              <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={(e) => {
                                  e?.stopPropagation?.();
                                  updateCartQuantity?.(pCartKey, inCartQty + 1);
                                }}
                                className="w-4 h-4 items-center justify-center"
                              >
                                <Ionicons name="add" size={12} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          );
                        }

                        return (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              if (shadesList.length > 1 && openShadeSheet) {
                                setShowSuggestions(false);
                                openShadeSheet(prod, firstShade);
                              } else if (addToCart) {
                                addToCart(prod, 1, firstShade);
                              }
                            }}
                            style={{
                              backgroundColor: '#FFF0F5',
                              borderColor: '#D81B60',
                              borderWidth: 1.2,
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 4.5,
                            }}
                            className="flex-row items-center justify-center gap-1 shadow-2xs"
                          >
                            <Ionicons name="bag-handle-outline" size={11} color="#D81B60" />
                            <Text style={{ color: '#D81B60', fontSize: 10, fontWeight: '900' }}>
                              + ADD
                            </Text>
                          </TouchableOpacity>
                        );
                      })()
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleSelectSuggestion(item)}
                        className="flex-row items-center gap-1.5"
                      >
                        <View
                          style={{
                            backgroundColor: isBrand
                              ? '#FCE7F3'
                              : isCategory
                                ? '#EEF2FF'
                                : isSubcategory
                                  ? '#ECFDF5'
                                  : '#FFF1F2',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: isBrand
                                ? '#D81B60'
                                : isCategory
                                  ? '#4F46E5'
                                  : isSubcategory
                                    ? '#059669'
                                    : '#D81B60',
                              fontSize: 8.5,
                              fontWeight: '800',
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.badge}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#C4B5BD" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── ACTIVE REMOVABLE FILTER CHIPS ────────────────────────────── */}
      {activeFilterCount > 0 && (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F0E3EA',
          }}
          className="px-4 py-2 flex-row items-center flex-wrap gap-1.5"
        >
          {selectedCategory !== 'All' && (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
              }}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                Category: {selectedCategory}
              </Text>
              <Ionicons name="close" size={13} color="#D81B60" />
            </TouchableOpacity>
          )}

          {selectedSubcategory !== 'All' && (
            <TouchableOpacity
              onPress={() => setSelectedSubcategory('All')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                Sub: {selectedSubcategory}
              </Text>
              <Ionicons name="close" size={13} color="#D81B60" />
            </TouchableOpacity>
          )}

          {selectedBrands.map((bName) => (
            <TouchableOpacity
              key={bName}
              onPress={() => setSelectedBrands(prev => prev.filter(b => b !== bName))}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                Brand: {bName}
              </Text>
              <Ionicons name="close" size={13} color="#D81B60" />
            </TouchableOpacity>
          ))}

          {selectedPriceRange !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedPriceRange('all')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                Price: {selectedPriceRange === 'u500' ? '< ₹500' : selectedPriceRange === '500_1000' ? '₹500-1k' : selectedPriceRange === '1000_2000' ? '₹1k-2k' : '> ₹2k'}
              </Text>
              <Ionicons name="close" size={13} color="#D81B60" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetAllFilters} className="ml-auto py-1 px-2">
            <Text style={{ color: '#D81B60' }} className="text-[11px] font-extrabold">
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SCROLLABLE SCREEN BODY ───────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 110, // Safe-area bottom padding to prevent bottom navigation overlap
        }}
        showsVerticalScrollIndicator={false}
      >
        {!isSearchActive ? (
          <>
            {/* ── 3. TRENDING SEARCHES ──────────────────────────────── */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="flame" size={16} color="#D81B60" />
                  <Text style={{ color: '#352832' }} className="text-xs font-black uppercase tracking-wider">
                    Trending Searches
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#F0E3EA',
                  borderWidth: 1,
                  borderRadius: 18,
                  overflow: 'hidden',
                  shadowColor: '#D81B60',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1.5,
                }}
              >
                {TRENDING_SEARCHES.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuery(item.text)}
                    style={{
                      borderBottomWidth: idx !== TRENDING_SEARCHES.length - 1 ? 1 : 0,
                      borderBottomColor: '#F8F9FA',
                    }}
                    className="p-3.5 flex-row items-center justify-between active:bg-[#FFFFFF]"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#FFFFFF',
                          borderColor: '#F0E3EA',
                          borderWidth: 1,
                        }}
                        className="items-center justify-center shrink-0"
                      >
                        <Ionicons name={item.icon} size={15} color="#D81B60" />
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: '#352832' }} className="text-xs font-bold leading-snug">
                          {item.text}
                        </Text>
                        <Text style={{ color: '#8A7B85' }} className="text-[10px] font-medium mt-0.5">
                          {item.tag}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="arrow-up-outline"
                      size={15}
                      color="#D81B60"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── 4. RECENT SEARCHES (Persistent, Max 2 Rows, Expandable) ── */}
            {recentSearches.length > 0 && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text style={{ color: '#352832' }} className="text-xs font-black uppercase tracking-wider">
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearAllRecent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: '#8A7B85' }} className="text-[11px] font-bold">
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {(isRecentExpanded ? recentSearches : recentSearches.slice(0, 6)).map((term, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#F0E3EA',
                        borderWidth: 1,
                        borderRadius: 20,
                        paddingLeft: 12,
                        paddingRight: 8,
                        paddingVertical: 6,
                        shadowColor: '#D81B60',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 3,
                        elevation: 1,
                      }}
                      className="flex-row items-center gap-2"
                    >
                      <TouchableOpacity onPress={() => handleSelectQuery(term)}>
                        <Text style={{ color: '#352832' }} className="text-xs font-semibold">
                          {term}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeRecentSearch(term)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={14} color="#8A7B85" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {recentSearches.length > 6 && (
                  <TouchableOpacity
                    onPress={() => setIsRecentExpanded(!isRecentExpanded)}
                    className="self-center mt-2.5 py-1 px-3"
                  >
                    <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                      {isRecentExpanded ? 'Show Less' : `+${recentSearches.length - 6} More Searches`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── 5. TOP BRANDS CAROUSEL ────────────────────────────── */}
            {(displayBrands.length > 0 || isCatalogLoading) && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text style={{ color: '#352832' }} className="text-xs font-black uppercase tracking-wider">
                    Top Brands
                  </Text>
                  <TouchableOpacity onPress={() => setCurrentScreen('category')}>
                    <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                      View All →
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingVertical: 4, paddingHorizontal: 2 }}
                >
                  {displayBrands.length > 0
                    ? displayBrands.slice(0, 20).map((brand) => {
                      const brandName = (brand?.name || (typeof brand === 'string' ? brand : '')).trim();
                      const isSelected = selectedBrands.some(
                        b => (b || '').toLowerCase() === brandName.toLowerCase()
                      );

                      return (
                        <BrandCircle
                          key={brand.id || brandName}
                          brand={brand}
                          isSelected={isSelected}
                          onSelectBrand={() => {
                            setSelectedBrands(prev =>
                              prev.some(b => (b || '').toLowerCase() === brandName.toLowerCase())
                                ? prev.filter(b => (b || '').toLowerCase() !== brandName.toLowerCase())
                                : [...prev, brandName]
                            );
                            if (!isSelected) addRecentSearch(brandName);
                          }}
                        />
                      );
                    })
                    : [1, 2, 3, 4, 5].map((k) => (
                      <View
                        key={`sk_br_${k}`}
                        style={{
                          height: 48,
                          paddingHorizontal: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <View
                          style={{
                            width: 70,
                            height: 14,
                            borderRadius: 4,
                            backgroundColor: '#F3F4F6',
                          }}
                        />
                        <View
                          style={{
                            width: 1,
                            height: 16,
                            backgroundColor: '#E5E7EB',
                            marginLeft: 20,
                            opacity: 0.8,
                          }}
                        />
                      </View>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* ── 6. CURATED DISCOVERY / RECOMMENDATIONS ────────────── */}
            {activeProducts && activeProducts.length > 0 && (
              <View className="mb-4">
                <Text style={{ color: '#352832' }} className="text-xs font-black uppercase tracking-wider mb-2.5">
                  Popular in Beauty
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {activeProducts.slice(0, 4).map((p) => (
                    <PurplleProductCard
                      key={p.id}
                      product={p}
                      cardWidth="48.5%"
                      userRole={userRole}
                      getRolePrice={getRolePrice}
                      cartQuantityMap={cartQuantityMap}
                      addToCart={addToCart}
                      updateCartQuantity={updateCartQuantity}
                      removeFromCart={removeFromCart}
                      isFavorite={isFavorite}
                      toggleFavorite={toggleFavorite}
                      onOpenShadeSheet={openShadeSheet}
                      onPressProduct={(prod, shade) => {
                        setSelectedProduct(prod);
                        if (setSelectedShade && shade) setSelectedShade(shade);
                        if (rememberSelectedShade && (prod?.id || prod?.parentProductId)) {
                          rememberSelectedShade(prod.parentProductId || prod.id, shade);
                        }
                        setCurrentScreen('product');
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          /* ── 7. SEARCH RESULTS FEED ────────────────────────────────── */
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: '#8A7B85' }} className="text-xs font-bold">
                Search Results{query ? ` for "${query}"` : ''}
              </Text>
              {activeFilterCount > 0 && (
                <Text style={{ color: '#D81B60' }} className="text-[11px] font-bold">
                  {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {results.length === 0 ? (
              isCatalogLoading ? (
                <View className="items-center justify-center py-20 px-4">
                  <Text style={{ color: '#D81B60' }} className="text-sm font-extrabold mb-1">
                    Loading Products...
                  </Text>
                  <Text style={{ color: '#8A7B85' }} className="text-xs text-center">
                    Fetching the latest beauty catalog
                  </Text>
                </View>
              ) : (
                <View className="items-center justify-center py-16 px-4">
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#F0E3EA',
                      borderWidth: 1,
                    }}
                    className="w-16 h-16 rounded-full items-center justify-center mb-3 shadow-2xs"
                  >
                    <Ionicons name="search-outline" size={28} color="#D81B60" />
                  </View>
                  <Text style={{ color: '#352832' }} className="text-sm font-extrabold mb-1">
                    No products match your search
                  </Text>
                  <Text style={{ color: '#8A7B85' }} className="text-xs text-center mb-4 leading-relaxed">
                    Try adjusting your search terms, removing filters, or checking back soon.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setQuery('');
                      resetAllFilters();
                    }}
                    style={{ backgroundColor: '#D81B60' }}
                    className="px-5 py-2.5 rounded-full shadow-xs"
                  >
                    <Text className="text-xs font-bold text-white">Reset Search & Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                {results.slice(0, visibleCount).map((p) => (
                  <PurplleProductCard
                    key={p.id}
                    product={p}
                    cardWidth="48.5%"
                    userRole={userRole}
                    getRolePrice={getRolePrice}
                    cart={cart}
                    cartQuantityMap={cartQuantityMap}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    onOpenShadeSheet={openShadeSheet}
                    rememberSelectedShade={rememberSelectedShade}
                    setSelectedShade={setSelectedShade}
                    onPressProduct={(prod, shade) => {
                      setSelectedProduct(prod);
                      if (setSelectedShade && shade) setSelectedShade(shade);
                      if (rememberSelectedShade && (prod?.id || prod?.parentProductId)) {
                        rememberSelectedShade(prod.parentProductId || prod.id, shade);
                      }
                      setCurrentScreen('product');
                    }}
                  />
                ))}
              </View>

              {results.length > visibleCount && (
                <View className="mt-6 mb-2 items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setVisibleCount(prev => prev + 24)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#D81B60',
                      borderWidth: 1.5,
                      borderRadius: 9999,
                      paddingVertical: 10,
                      paddingHorizontal: 24,
                      shadowColor: '#D81B60',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ color: '#D81B60', fontWeight: '800', fontSize: 12 }}>
                      Load More Products ({Math.min(visibleCount, results.length)} of {results.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
      </ScrollView>

      {/* ── 8. PREMIUM FILTER BOTTOM SHEET ───────────────────────────── */}
      <PremiumFilterBottomSheet
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        subcategories={subcategories}
        brands={displayBrands}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubcategory('All');
        }}
        selectedSubcategory={selectedSubcategory}
        onSelectSubcategory={setSelectedSubcategory}
        selectedBrands={selectedBrands}
        onToggleBrand={(bName) => {
          setSelectedBrands(prev =>
            prev.includes(bName) ? prev.filter(x => x !== bName) : [...prev, bName]
          );
        }}
        onClearBrands={() => setSelectedBrands([])}
        selectedPriceRange={selectedPriceRange}
        onSelectPriceRange={setSelectedPriceRange}
        selectedDiscount={selectedDiscount}
        onSelectDiscount={setSelectedDiscount}
        activeFilterCount={activeFilterCount}
        onClearAll={resetAllFilters}
        onApply={() => setIsFilterModalOpen(false)}
        totalMatchingCount={results?.length || 0}
      />

      {/* ── 9. FLOATING STICKY VIEW CART BAR (When cart has items) ──── */}
      {cart.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
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
                Tap to review bag & checkout
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

export default SearchScreen;

