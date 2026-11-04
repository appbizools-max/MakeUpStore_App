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
import { getCartQuantityMap } from '../../utils/cartKeyUtils';

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
 * - Primary rose pink (#B34D7D)
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
    userRole,
    userProfile,
    getRolePrice,
    setSelectedProduct,
    setSelectedShade,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    isFavorite,
    toggleFavorite,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  const [query, setQuery] = useState(globalSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all'); // 'all' | 'u500' | '500_1000' | '1000_2000' | 'a2000'
  const [minRating, setMinRating] = useState(0); // 0 | 4 | 3
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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
      } catch (_) {}
    };
    loadSearches();
  }, []);

  // Sync recent searches to persistent storage
  const saveRecentSearches = useCallback((newList) => {
    setRecentSearches(newList);
    try {
      storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(newList));
    } catch (_) {}
  }, []);

  const addRecentSearch = useCallback((term) => {
    const clean = (term || '').trim();
    if (!clean) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((itemToRemove) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== itemToRemove);
      try {
        storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch (_) {}
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

  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
  }, [cart]);

  // Count active applied filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedBrand !== 'All') count++;
    if (selectedPriceRange !== 'all') count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedCategory, selectedBrand, selectedPriceRange, minRating, inStockOnly]);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedPriceRange('all');
    setMinRating(0);
    setInStockOnly(false);
  };

  // Active / Available Brands computation (always fresh)
  const displayBrands = useMemo(() => {
    if (activeBrands && activeBrands.length > 0) return activeBrands;
    if (brands && brands.length > 0) return brands.filter(b => b.enabled !== false);
    return [];
  }, [activeBrands, brands]);

  // Autocomplete Suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const matchedBrands = (displayBrands || [])
      .filter(b => (b.name || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(b => ({ type: 'brand', text: b.name }));

    const matchedProducts = (activeProducts || [])
      .filter(p => (p.name || '').toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({ type: 'product', text: p.name, product: p }));

    const matchedTrending = TRENDING_SEARCHES
      .filter(t => t.text.toLowerCase().includes(q))
      .slice(0, 2)
      .map(t => ({ type: 'trending', text: t.text }));

    return [...matchedBrands, ...matchedTrending, ...matchedProducts].slice(0, 6);
  }, [query, displayBrands, activeProducts]);

  // Primary Filtered Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

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

      // Category filter
      if (selectedCategory !== 'All') {
        const pCat = `${p.category || ''} ${p.subcategory || ''}`.toLowerCase();
        const sCat = selectedCategory.toLowerCase();
        if (!pCat.includes(sCat) && !sCat.includes(pCat)) return false;
      }

      // Brand filter
      if (selectedBrand !== 'All') {
        const pBrand = (p.brandName || p.brand || '').toLowerCase();
        const sBrand = selectedBrand.toLowerCase();
        if (pBrand !== sBrand) return false;
      }

      // Price filter
      if (selectedPriceRange !== 'all') {
        const price = getRolePrice(p, userRole);
        if (selectedPriceRange === 'u500' && price >= 500) return false;
        if (selectedPriceRange === '500_1000' && (price < 500 || price > 1000)) return false;
        if (selectedPriceRange === '1000_2000' && (price < 1000 || price > 2000)) return false;
        if (selectedPriceRange === 'a2000' && price <= 2000) return false;
      }

      // Rating filter
      if (minRating > 0) {
        const pRating = Number(p.rating || 4.5);
        if (pRating < minRating) return false;
      }

      // In stock only
      if (inStockOnly) {
        if (p.inStock === false || p.stock === 0 || p.status === 'out_of_stock') return false;
      }

      return true;
    });
  }, [activeProducts, query, selectedCategory, selectedBrand, selectedPriceRange, minRating, inStockOnly, userRole, getRolePrice]);

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
          shadowColor: '#B34D7D',
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
            onPress={() => setCurrentScreen('home')}
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
            <Ionicons name="chevron-back" size={20} color="#B34D7D" />
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
            <Ionicons name="search" size={17} color="#B34D7D" />
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
            {query.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setShowSuggestions(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#8A7B85" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => searchInputRef.current?.focus()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="mic-outline" size={18} color="#B34D7D" />
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
              backgroundColor: activeFilterCount > 0 ? '#B34D7D' : '#FFFFFF',
              borderColor: activeFilterCount > 0 ? '#B34D7D' : '#F0E3EA',
              borderWidth: 1,
            }}
            className="items-center justify-center relative shadow-2xs"
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={activeFilterCount > 0 ? '#FFFFFF' : '#B34D7D'}
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
                  backgroundColor: isSelected ? '#B34D7D' : '#FFFFFF',
                  borderColor: isSelected ? '#B34D7D' : '#F0E3EA',
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

      {/* ── AUTOCOMPLETE SUGGESTIONS POPUP ──────────────────────────── */}
      {showSuggestions && suggestions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 104,
            left: 16,
            right: 16,
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 18,
            shadowColor: '#B34D7D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={`${item.type}_${idx}`}
              onPress={() => handleSelectQuery(item.text)}
              style={{
                borderBottomWidth: idx !== suggestions.length - 1 ? 1 : 0,
                borderBottomColor: '#F8F9FA',
              }}
              className="px-4 py-3 flex-row items-center justify-between active:bg-[#FFFFFF]"
            >
              <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                <Ionicons
                  name={
                    item.type === 'brand'
                      ? 'business-outline'
                      : item.type === 'trending'
                      ? 'flame-outline'
                      : 'search-outline'
                  }
                  size={15}
                  color="#B34D7D"
                />
                <Text style={{ color: '#352832' }} className="text-xs font-semibold" numberOfLines={1}>
                  {item.text}
                </Text>
              </View>
              <Text style={{ color: '#8A7B85' }} className="text-[10px] font-bold uppercase">
                {item.type}
              </Text>
            </TouchableOpacity>
          ))}
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
              onPress={() => setSelectedCategory('All')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Category: {selectedCategory}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {selectedBrand !== 'All' && (
            <TouchableOpacity
              onPress={() => setSelectedBrand('All')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Brand: {selectedBrand}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {selectedPriceRange !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedPriceRange('all')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Price: {selectedPriceRange}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {minRating > 0 && (
            <TouchableOpacity
              onPress={() => setMinRating(0)}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Rating: {minRating}★+
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {inStockOnly && (
            <TouchableOpacity
              onPress={() => setInStockOnly(false)}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                In Stock Only
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetAllFilters} className="ml-auto py-1 px-2">
            <Text style={{ color: '#B34D7D' }} className="text-[11px] font-extrabold">
              Reset All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SCROLLABLE SCREEN BODY ───────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
                  <Ionicons name="flame" size={16} color="#B34D7D" />
                  <Text style={{ color: '#352832' }} className="text-xs font-black uppercase tracking-wider">
                    Trending Searches
                  </Text>
                </View>
                <Text style={{ color: '#B34D7D' }} className="text-[10px] font-bold">
                  Live Insights
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#F0E3EA',
                  borderWidth: 1,
                  borderRadius: 18,
                  overflow: 'hidden',
                  shadowColor: '#B34D7D',
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
                        <Ionicons name={item.icon} size={15} color="#B34D7D" />
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
                      color="#B34D7D"
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
                        shadowColor: '#B34D7D',
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
                    <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
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
                    <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                      View All →
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingVertical: 2 }}
                >
                  {displayBrands.length > 0
                    ? displayBrands.slice(0, 20).map((brand) => {
                        const isSelected = (selectedBrand || '').toLowerCase() === (brand.name || '').toLowerCase();
                        return (
                          <TouchableOpacity
                            key={brand.id || brand.name}
                            activeOpacity={0.8}
                            onPress={() => {
                              const newBrand = isSelected ? 'All' : brand.name;
                              setSelectedBrand(newBrand);
                              setQuery(isSelected ? '' : brand.name);
                              if (!isSelected) addRecentSearch(brand.name);
                            }}
                            style={{
                              minWidth: 108,
                              height: 42,
                              paddingHorizontal: 14,
                              marginRight: 10,
                              backgroundColor: isSelected ? '#FFF0F5' : '#FFFFFF',
                              borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                              borderWidth: 1.5,
                              borderRadius: 14,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#B64F7D',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 3,
                              elevation: 1.5,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? '#C2477A' : '#3A2430',
                                fontSize: 11.5,
                                fontWeight: isSelected ? '800' : '700',
                                textAlign: 'center',
                              }}
                              numberOfLines={1}
                            >
                              {brand.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    : [1, 2, 3, 4, 5].map((k) => (
                        <View
                          key={`sk_br_${k}`}
                          style={{
                            minWidth: 108,
                            height: 42,
                            marginRight: 10,
                            backgroundColor: '#F9F5F7',
                            borderColor: '#F0E3EA',
                            borderWidth: 1,
                            borderRadius: 14,
                          }}
                        />
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
                      onPressProduct={(prod, shade) => {
                        setSelectedProduct(prod);
                        if (setSelectedShade && shade) setSelectedShade(shade);
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
                {results.length} product{results.length !== 1 ? 's' : ''} found
                {query ? ` for "${query}"` : ''}
              </Text>
              {activeFilterCount > 0 && (
                <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                  {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {results.length === 0 ? (
              isCatalogLoading ? (
                <View className="items-center justify-center py-20 px-4">
                  <Text style={{ color: '#C2477A' }} className="text-sm font-extrabold mb-1">
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
                    <Ionicons name="search-outline" size={28} color="#B34D7D" />
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
                    style={{ backgroundColor: '#B34D7D' }}
                    className="px-5 py-2.5 rounded-full shadow-xs"
                  >
                    <Text className="text-xs font-bold text-white">Reset Search & Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {results.map((p) => (
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
                    onPressProduct={(prod, shade) => {
                      setSelectedProduct(prod);
                      if (setSelectedShade && shade) setSelectedShade(shade);
                      setCurrentScreen('product');
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── 8. COMPREHENSIVE FILTER BOTTOM SHEET MODAL ────────────────── */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterModalOpen(false)}>
          <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }} className="flex-1 justify-end">
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  maxHeight: '82%',
                  borderColor: '#F0E3EA',
                  borderTopWidth: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 10,
                }}
                className="p-5 pb-7"
              >
                {/* Drag Indicator */}
                <View className="items-center mb-3">
                  <View className="w-10 h-1 rounded-full bg-slate-300" />
                </View>

                {/* Modal Header */}
                <View className="flex-row items-center justify-between pb-3 border-b border-[#F0E3EA] mb-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="options-outline" size={18} color="#B34D7D" />
                    <Text style={{ color: '#352832' }} className="text-base font-extrabold">
                      Filter Products
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                    <Ionicons name="close" size={20} color="#8A7B85" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
                  {/* Filter: Price Range */}
                  <View>
                    <Text style={{ color: '#352832' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                      Price Range
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All Prices' },
                        { id: 'u500', label: 'Under ₹500' },
                        { id: '500_1000', label: '₹500 – ₹1,000' },
                        { id: '1000_2000', label: '₹1,000 – ₹2,000' },
                        { id: 'a2000', label: 'Above ₹2,000' },
                      ].map((p) => {
                        const isSelected = selectedPriceRange === p.id;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => setSelectedPriceRange(p.id)}
                            style={{
                              backgroundColor: isSelected ? '#B34D7D' : '#FFFFFF',
                              borderColor: isSelected ? '#B34D7D' : '#F0E3EA',
                              borderWidth: 1,
                              borderRadius: 16,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? '#FFFFFF' : '#352832',
                                fontSize: 11,
                                fontWeight: isSelected ? '700' : '500',
                              }}
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Filter: Category */}
                  <View className="mt-3">
                    <Text style={{ color: '#352832' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                      Category
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['All', 'Skincare', 'Makeup', 'Hair Care', 'Hair Styling', 'Fragrance'].map((c) => {
                        const isSelected = selectedCategory === c;
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => setSelectedCategory(c)}
                            style={{
                              backgroundColor: isSelected ? '#B34D7D' : '#FFFFFF',
                              borderColor: isSelected ? '#B34D7D' : '#F0E3EA',
                              borderWidth: 1,
                              borderRadius: 16,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? '#FFFFFF' : '#352832',
                                fontSize: 11,
                                fontWeight: isSelected ? '700' : '500',
                              }}
                            >
                              {c}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Filter: Brand */}
                  {activeBrands && activeBrands.length > 0 && (
                    <View className="mt-3">
                      <Text style={{ color: '#352832' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                        Brand
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {['All', ...activeBrands.slice(0, 8).map(b => b.name)].map((bName) => {
                          const isSelected = selectedBrand === bName;
                          return (
                            <TouchableOpacity
                              key={bName}
                              onPress={() => setSelectedBrand(bName)}
                              style={{
                                backgroundColor: isSelected ? '#352832' : '#FFFFFF',
                                borderColor: isSelected ? '#352832' : '#F0E3EA',
                                borderWidth: 1,
                                borderRadius: 16,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected ? '#FFFFFF' : '#352832',
                                  fontSize: 11,
                                  fontWeight: isSelected ? '700' : '500',
                                }}
                              >
                                {bName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Filter: Minimum Customer Rating */}
                  <View className="mt-3">
                    <Text style={{ color: '#352832' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                      Customer Rating
                    </Text>
                    <View className="flex-row gap-2">
                      {[
                        { val: 0, label: 'All Ratings' },
                        { val: 4, label: '4★ & Above' },
                        { val: 3, label: '3★ & Above' },
                      ].map((r) => {
                        const isSelected = minRating === r.val;
                        return (
                          <TouchableOpacity
                            key={r.val}
                            onPress={() => setMinRating(r.val)}
                            style={{
                              backgroundColor: isSelected ? '#B34D7D' : '#FFFFFF',
                              borderColor: isSelected ? '#B34D7D' : '#F0E3EA',
                              borderWidth: 1,
                              borderRadius: 16,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? '#FFFFFF' : '#352832',
                                fontSize: 11,
                                fontWeight: isSelected ? '700' : '500',
                              }}
                            >
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Filter: Availability Toggle */}
                  <View className="mt-3 mb-4 flex-row items-center justify-between p-3 bg-[#FFFFFF] rounded-2xl border border-[#F0E3EA]">
                    <View>
                      <Text style={{ color: '#352832' }} className="text-xs font-bold">
                        In Stock Only
                      </Text>
                      <Text style={{ color: '#8A7B85' }} className="text-[10px] mt-0.5">
                        Exclude sold out and unavailable items
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setInStockOnly(!inStockOnly)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: inStockOnly ? '#B34D7D' : '#E2E8F0',
                        padding: 2,
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#FFFFFF',
                          alignSelf: inStockOnly ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {/* Modal Footer Actions */}
                <View className="pt-3 border-t border-[#F0E3EA] flex-row gap-3">
                  <TouchableOpacity
                    onPress={resetAllFilters}
                    style={{
                      borderColor: '#F0E3EA',
                      borderWidth: 1,
                      backgroundColor: '#FFFFFF',
                    }}
                    className="flex-1 py-3 rounded-xl items-center justify-center"
                  >
                    <Text style={{ color: '#8A7B85' }} className="text-xs font-bold">
                      Reset Filters
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsFilterModalOpen(false)}
                    style={{ backgroundColor: '#B34D7D' }}
                    className="flex-1 py-3 rounded-xl items-center justify-center shadow-xs"
                  >
                    <Text className="text-xs font-bold text-white">
                      Apply Filters ({activeFilterCount})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default SearchScreen;
