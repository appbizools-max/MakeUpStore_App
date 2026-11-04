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
    subcategories = [],
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
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedBrands, setSelectedBrands] = useState([]); // Multi-select brands
  const [selectedPriceRange, setSelectedPriceRange] = useState('all'); // 'all' | 'u500' | '500_1000' | '1000_2000' | 'a2000'
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
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

  // Count active applied filters (Nykaa Specification: Category, Brand, Price Range)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubcategory !== 'All') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedPriceRange !== 'all') count++;
    return count;
  }, [selectedCategory, selectedSubcategory, selectedBrands, selectedPriceRange]);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSelectedBrands([]);
    setSelectedPriceRange('all');
    setBrandFilterSearch('');
  };

  const handleVoiceApply = (spokenText) => {
    const clean = (spokenText || '').trim();
    if (clean) {
      setQuery(clean);
      addRecentSearch(clean);
      setShowSuggestions(false);
    }
    setIsVoiceModalOpen(false);
  };

  useEffect(() => {
    if (!isVoiceModalOpen) return;
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
              setVoiceTranscript(transcript);
              if (event.results[0].isFinal) {
                handleVoiceApply(transcript);
              }
            }
          };
          recognition.start();
          return () => {
            try { recognition.stop(); } catch (_) {}
          };
        } catch (_) {}
      }
    }
  }, [isVoiceModalOpen]);

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

      // Brand filter (Multi-select)
      if (selectedBrands.length > 0) {
        const pBrand = (p.brandName || p.brand || '').toLowerCase().trim();
        const isMatch = selectedBrands.some(b => b.toLowerCase().trim() === pBrand);
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

      return true;
    });
  }, [activeProducts, query, selectedCategory, selectedSubcategory, selectedBrands, selectedPriceRange, userRole, getRolePrice]);

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
                onPress={() => {
                  setVoiceTranscript('');
                  setIsVoiceModalOpen(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
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
              onPress={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
              }}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Category: {selectedCategory}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {selectedSubcategory !== 'All' && (
            <TouchableOpacity
              onPress={() => setSelectedSubcategory('All')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Sub: {selectedSubcategory}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          {selectedBrands.map((bName) => (
            <TouchableOpacity
              key={bName}
              onPress={() => setSelectedBrands(prev => prev.filter(b => b !== bName))}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Brand: {bName}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          ))}

          {selectedPriceRange !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedPriceRange('all')}
              className="bg-white border border-[#F0E3EA] px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
            >
              <Text style={{ color: '#B34D7D' }} className="text-[11px] font-bold">
                Price: {selectedPriceRange === 'u500' ? '< ₹500' : selectedPriceRange === '500_1000' ? '₹500-1k' : selectedPriceRange === '1000_2000' ? '₹1k-2k' : '> ₹2k'}
              </Text>
              <Ionicons name="close" size={13} color="#B34D7D" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetAllFilters} className="ml-auto py-1 px-2">
            <Text style={{ color: '#B34D7D' }} className="text-[11px] font-extrabold">
              Clear All
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
                        const isSelected = selectedBrands.some(
                          b => (b || '').toLowerCase() === (brand.name || '').toLowerCase()
                        );
                        return (
                          <TouchableOpacity
                            key={brand.id || brand.name}
                            activeOpacity={0.8}
                            onPress={() => {
                              setSelectedBrands(prev =>
                                prev.some(b => (b || '').toLowerCase() === (brand.name || '').toLowerCase())
                                  ? prev.filter(b => (b || '').toLowerCase() !== (brand.name || '').toLowerCase())
                                  : [...prev, brand.name]
                              );
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

            {/* ── 8. COMPREHENSIVE NYKAA-STYLE FILTER MODAL ────────────────── */}
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
                  maxHeight: '85%',
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
                <View className="flex-row items-center justify-between pb-3 border-b border-[#F0E3EA] mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="options-outline" size={18} color="#C2477A" />
                    <Text style={{ color: '#2B1A24' }} className="text-base font-extrabold">
                      Filter Products
                    </Text>
                    {activeFilterCount > 0 && (
                      <View className="bg-[#C2477A] px-2 py-0.5 rounded-full">
                        <Text className="text-white text-[10px] font-black">{activeFilterCount}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} className="p-1">
                    <Ionicons name="close" size={20} color="#8A7B85" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
                  {/* Filter 1: Dynamic Categories (from Supabase) */}
                  <View>
                    <Text style={{ color: '#2B1A24' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                      Category
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['All', ...(categories && categories.length > 0 ? categories.filter(c => c.is_active !== false).map(c => c.name) : ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body', "Men's Grooming", 'Nail Care', 'Beauty Tools'])].map((catName) => {
                        const isSelected = selectedCategory === catName;
                        return (
                          <TouchableOpacity
                            key={catName}
                            onPress={() => {
                              setSelectedCategory(catName);
                              setSelectedSubcategory('All');
                            }}
                            style={{
                              backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                              borderColor: isSelected ? '#C2477A' : '#F0E3EA',
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
                              {catName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Dependent Subcategories under Selected Category */}
                    {selectedCategory !== 'All' && (() => {
                      const parentCatObj = (categories || []).find(c => c.name?.toLowerCase() === selectedCategory.toLowerCase());
                      const matchingSubs = (subcategories || []).filter(s =>
                        (parentCatObj && (s.category_id === parentCatObj.id || s.categoryId === parentCatObj.id)) ||
                        (s.categoryName && s.categoryName.toLowerCase() === selectedCategory.toLowerCase())
                      );

                      if (!matchingSubs || matchingSubs.length === 0) return null;

                      return (
                        <View className="mt-2.5 pt-2 border-t border-dashed border-[#F0E3EA]">
                          <Text style={{ color: '#C2477A' }} className="text-[11px] font-bold mb-1.5">
                            Subcategories in {selectedCategory}:
                          </Text>
                          <View className="flex-row flex-wrap gap-1.5">
                            {['All', ...matchingSubs.map(s => s.name)].map((subName) => {
                              const isSubSelected = selectedSubcategory === subName;
                              return (
                                <TouchableOpacity
                                  key={subName}
                                  onPress={() => setSelectedSubcategory(subName)}
                                  style={{
                                    backgroundColor: isSubSelected ? '#2B1A24' : '#FFFFFF',
                                    borderColor: isSubSelected ? '#2B1A24' : '#E8E8E8',
                                    borderWidth: 1,
                                    borderRadius: 12,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4.5,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: isSubSelected ? '#FFFFFF' : '#4A3B45',
                                      fontSize: 10.5,
                                      fontWeight: isSubSelected ? '700' : '500',
                                    }}
                                  >
                                    {subName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Filter 2: Dedicated Brand Filter with In-Filter Search & Multi-Select */}
                  <View className="mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text style={{ color: '#2B1A24' }} className="text-xs font-bold uppercase tracking-wider">
                        Brand Partner {selectedBrands.length > 0 ? `(${selectedBrands.length} selected)` : ''}
                      </Text>
                      {selectedBrands.length > 0 && (
                        <TouchableOpacity onPress={() => setSelectedBrands([])}>
                          <Text style={{ color: '#C2477A' }} className="text-[11px] font-bold">Clear Brands</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Brand Filter Search Box */}
                    <View
                      style={{
                        borderColor: '#F0E3EA',
                        borderWidth: 1,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="search-outline" size={14} color="#8A7B85" />
                      <TextInput
                        value={brandFilterSearch}
                        onChangeText={setBrandFilterSearch}
                        placeholder="Search brands (e.g. Maybelline, Lakme, Agaro)..."
                        placeholderTextColor="#9CA3AF"
                        style={{ flex: 1, fontSize: 11, color: '#1F2937', padding: 0, marginLeft: 6 }}
                      />
                      {brandFilterSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setBrandFilterSearch('')}>
                          <Ionicons name="close-circle" size={14} color="#8A7B85" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Multi-Select Brand Chips */}
                    <View className="flex-row flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {(displayBrands || [])
                        .filter(b => !brandFilterSearch || (b.name || '').toLowerCase().includes(brandFilterSearch.toLowerCase()))
                        .map((b) => {
                          const isBrandSelected = selectedBrands.includes(b.name);
                          return (
                            <TouchableOpacity
                              key={b.id || b.name}
                              onPress={() => {
                                setSelectedBrands(prev =>
                                  prev.includes(b.name)
                                    ? prev.filter(x => x !== b.name)
                                    : [...prev, b.name]
                                );
                              }}
                              style={{
                                backgroundColor: isBrandSelected ? '#C2477A' : '#FFFFFF',
                                borderColor: isBrandSelected ? '#C2477A' : '#F0E3EA',
                                borderWidth: 1,
                                borderRadius: 16,
                                paddingHorizontal: 11,
                                paddingVertical: 5.5,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {isBrandSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                              <Text
                                style={{
                                  color: isBrandSelected ? '#FFFFFF' : '#352832',
                                  fontSize: 11,
                                  fontWeight: isBrandSelected ? '700' : '500',
                                }}
                              >
                                {b.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  </View>

                  {/* Filter 3: Price Range */}
                  <View className="mt-3 mb-2">
                    <Text style={{ color: '#2B1A24' }} className="text-xs font-bold uppercase tracking-wider mb-2">
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
                              backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                              borderColor: isSelected ? '#C2477A' : '#F0E3EA',
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
                    className="flex-1 py-3 rounded-xl items-center justify-center cursor-pointer"
                  >
                    <Text style={{ color: '#8A7B85' }} className="text-xs font-bold">
                      Clear All
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsFilterModalOpen(false)}
                    style={{ backgroundColor: '#C2477A' }}
                    className="flex-1 py-3 rounded-xl items-center justify-center shadow-xs cursor-pointer"
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

      {/* ── 9. VOICE SEARCH MODAL ─────────────────────────────────────── */}
      <Modal
        visible={isVoiceModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVoiceModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsVoiceModalOpen(false)}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} className="flex-1 items-center justify-center p-5">
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 28,
                  borderColor: '#F0E3EA',
                  borderWidth: 1.5,
                  maxWidth: 380,
                  width: '100%',
                  shadowColor: '#C2477A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 10,
                }}
                className="p-6 items-center"
              >
                {/* Header with Close */}
                <View className="flex-row items-center justify-between w-full mb-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="mic" size={18} color="#C2477A" />
                    <Text style={{ color: '#2B1A24' }} className="text-sm font-extrabold">
                      Voice Search
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsVoiceModalOpen(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="p-1"
                  >
                    <Ionicons name="close" size={20} color="#8A7B85" />
                  </TouchableOpacity>
                </View>

                {/* Animated Pulsing Mic Avatar */}
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    backgroundColor: '#FFF0F5',
                    borderColor: '#F8B4D9',
                    borderWidth: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: '#C2477A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="mic" size={32} color="#FFFFFF" />
                  </View>
                </View>

                {/* Listening Status */}
                <Text style={{ color: '#2B1A24', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
                  Listening for Cosmetics...
                </Text>
                <Text style={{ color: '#8A7B85', fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
                  Speak the name of any cosmetic product, brand, or shade
                </Text>

                {/* Speech Input Field */}
                <View
                  style={{
                    borderColor: '#F0E3EA',
                    borderWidth: 1.5,
                    borderRadius: 16,
                    backgroundColor: '#FFFFFF',
                    width: '100%',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <TextInput
                    value={voiceTranscript}
                    onChangeText={setVoiceTranscript}
                    placeholder="e.g. Maybelline Foundation, Matte Lipstick..."
                    placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937', padding: 0 }}
                    onSubmitEditing={() => {
                      if (voiceTranscript.trim()) {
                        handleVoiceApply(voiceTranscript.trim());
                      }
                    }}
                  />
                  {voiceTranscript.length > 0 && (
                    <TouchableOpacity onPress={() => handleVoiceApply(voiceTranscript.trim())}>
                      <Ionicons name="arrow-forward-circle" size={24} color="#C2477A" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Voice Suggestion Chips */}
                <Text style={{ color: '#8A7B85', fontSize: 11, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 8 }}>
                  Try Saying:
                </Text>
                <View className="flex-row flex-wrap gap-2 w-full mb-4">
                  {[
                    'Matte Lipstick',
                    'Vitamin C Serum',
                    'Sunscreen SPF 50',
                    'Foundation',
                    'Face Wash',
                    'Kajal',
                    'Perfume',
                  ].map((phrase) => (
                    <TouchableOpacity
                      key={phrase}
                      onPress={() => handleVoiceApply(phrase)}
                      activeOpacity={0.75}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#F0E3EA',
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingHorizontal: 11,
                        paddingVertical: 5.5,
                      }}
                    >
                      <Text style={{ color: '#C2477A', fontSize: 11, fontWeight: '700' }}>
                        "{phrase}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2.5 w-full">
                  <TouchableOpacity
                    onPress={() => setIsVoiceModalOpen(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>

                  {voiceTranscript.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => handleVoiceApply(voiceTranscript.trim())}
                      style={{
                        flex: 1,
                        paddingVertical: 11,
                        borderRadius: 14,
                        backgroundColor: '#C2477A',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>Search Now</Text>
                    </TouchableOpacity>
                  )}
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
