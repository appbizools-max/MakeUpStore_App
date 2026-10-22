import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';
import { matchProductSearch } from '../../utils/productSearchEngine';
import { trackCustomerSearch } from '../../utils/customerSearchService';

export const SearchScreen = () => {
  const {
    activeProducts,
    activeBrands,
    categories,
    userRole,
    userProfile,
    getRolePrice,
    setSelectedProduct,
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
  const [selectedCatName, setSelectedCatName] = useState('All');
  const [selectedBrandName, setSelectedBrandName] = useState('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all'); // 'all' | 'under500' | '500to1500' | 'above1500'
  const [recentSearches, setRecentSearches] = useState([
    'Rose lipstick',
    'Facewash',
    'Waterproof liner',
    'Sunscreen SPF 50',
  ]);

  const searchInputRef = useRef(null);

  // Pre-fill from globalSearchQuery (e.g. tapped from Home search bar)
  useEffect(() => {
    if (globalSearchQuery) {
      setQuery(globalSearchQuery);
      if (setGlobalSearchQuery) setGlobalSearchQuery('');
    }
  }, [globalSearchQuery]);

  const removeRecentSearch = (itemToRemove) => {
    setRecentSearches(prev => prev.filter(item => item !== itemToRemove));
  };

  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    for (const item of (cart || [])) {
      const pid = item.product?.id || item.id;
      if (pid) map.set(pid, item.quantity || 0);
    }
    return map;
  }, [cart]);

  const trendingSearches = [
    { id: 't1', text: 'Korean glass skin combos', icon: 'flower-outline' },
    { id: 't2', text: 'Satin finish matte foundations', icon: 'pulse-outline' },
    { id: 't3', text: 'Long lasting highlighters', icon: 'eye-outline' },
    { id: 't4', text: 'Floral perfumes under 1500', icon: 'sparkles-outline' },
  ];

  // Filtered products calculation
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (activeProducts || []).filter(p => {
      // Query filter
      if (q) {
        const matchesQuery =
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brandName && p.brandName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Category filter
      if (selectedCatName !== 'All') {
        const pCat = (p.category || '').toLowerCase();
        const sCat = selectedCatName.toLowerCase();
        if (!pCat.includes(sCat) && !sCat.includes(pCat)) return false;
      }

      // Brand filter
      if (selectedBrandName !== 'All') {
        const pBrand = (p.brandName || '').toLowerCase();
        const sBrand = selectedBrandName.toLowerCase();
        if (pBrand !== sBrand) return false;
      }

      // Price filter
      if (selectedPriceFilter !== 'all') {
        const price = getRolePrice(p, userRole);
        if (selectedPriceFilter === 'under500' && price > 500) return false;
        if (selectedPriceFilter === '500to1500' && (price < 500 || price > 1500)) return false;
        if (selectedPriceFilter === 'above1500' && price < 1500) return false;
      }

      return true;
    });
  }, [activeProducts, query, selectedCatName, selectedBrandName, selectedPriceFilter, userRole, getRolePrice]);

  // Customer Search Tracking:
  // Track EVERY product search performed by every user in the User App (found and not found).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const matchedList = (activeProducts || []).filter(p => matchProductSearch(p, trimmed).isMatch);
    const isFound = matchedList.length > 0;

    // Debounce to allow user to finish typing before saving
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

  const handleIncrement = (product, currentQty) => {
    if (currentQty === 0) {
      addToCart(product, 1);
    } else {
      updateCartQuantity(product.id, currentQty + 1);
    }
  };

  const handleDecrement = (productId, currentQty) => {
    if (currentQty > 1) {
      updateCartQuantity(productId, currentQty - 1);
    } else if (currentQty === 1) {
      removeFromCart(productId);
    }
  };

  const hasActiveFilters = selectedCatName !== 'All' || selectedBrandName !== 'All' || selectedPriceFilter !== 'all';

  const resetFilters = () => {
    setSelectedCatName('All');
    setSelectedBrandName('All');
    setSelectedPriceFilter('all');
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header Row with Back Button, Search Bar & Quick Wishlist Link */}
      <View className="px-4 pt-3 pb-2 bg-white border-b border-[#FCE4EC]">
        <View className="flex-row items-center gap-2 mb-2.5">
          <TouchableOpacity
            onPress={() => setCurrentScreen('home')}
            className="w-9 h-9 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="chevron-back" size={18} color="#3A2430" />
          </TouchableOpacity>

          {/* Search Input Bar */}
          <View className="flex-1 bg-white border-2 border-[#C2477A] px-3.5 py-1.5 rounded-full flex-row items-center justify-between shadow-2xs">
            <Ionicons name="search-outline" size={16} color="#C2477A" />
            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search products, brands, lipsticks..."
              placeholderTextColor="#8C7078"
              className="flex-1 ml-2 text-xs font-semibold text-[#3A2430] p-0"
              autoFocus={!globalSearchQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color="#8C7078" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Wishlist Shortcut */}
          <TouchableOpacity
            onPress={() => setCurrentScreen('wishlist')}
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="heart-outline" size={17} color="#C2477A" />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
          <TouchableOpacity
            onPress={() => setSelectedCatName('All')}
            className={`mr-2 px-3 py-1 rounded-full border ${
              selectedCatName === 'All'
                ? 'bg-[#C2477A] border-[#C2477A]'
                : 'bg-white border-[#FCE4EC]'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                selectedCatName === 'All' ? 'text-white' : 'text-[#3A2430]'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          {(categories || []).map(cat => (
            <TouchableOpacity
              key={cat.id || cat.name}
              onPress={() => setSelectedCatName(selectedCatName === cat.name ? 'All' : cat.name)}
              className={`mr-2 px-3 py-1 rounded-full border ${
                selectedCatName === cat.name
                  ? 'bg-[#C2477A] border-[#C2477A]'
                  : 'bg-white border-[#FCE4EC]'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  selectedCatName === cat.name ? 'text-white' : 'text-[#3A2430]'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price Filter Chips & Reset */}
        <View className="flex-row items-center justify-between pt-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <TouchableOpacity
              onPress={() => setSelectedPriceFilter('all')}
              className={`mr-1.5 px-2.5 py-0.5 rounded-full border ${
                selectedPriceFilter === 'all'
                  ? 'bg-[#3A2430] border-[#3A2430]'
                  : 'bg-[#F9FAFB] border-gray-200'
              }`}
            >
              <Text className={`text-[9px] font-bold ${selectedPriceFilter === 'all' ? 'text-white' : 'text-[#8C7078]'}`}>
                Any Price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPriceFilter(selectedPriceFilter === 'under500' ? 'all' : 'under500')}
              className={`mr-1.5 px-2.5 py-0.5 rounded-full border ${
                selectedPriceFilter === 'under500'
                  ? 'bg-[#C2477A] border-[#C2477A]'
                  : 'bg-[#F9FAFB] border-gray-200'
              }`}
            >
              <Text className={`text-[9px] font-bold ${selectedPriceFilter === 'under500' ? 'text-white' : 'text-[#8C7078]'}`}>
                Under ₹500
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPriceFilter(selectedPriceFilter === '500to1500' ? 'all' : '500to1500')}
              className={`mr-1.5 px-2.5 py-0.5 rounded-full border ${
                selectedPriceFilter === '500to1500'
                  ? 'bg-[#C2477A] border-[#C2477A]'
                  : 'bg-[#F9FAFB] border-gray-200'
              }`}
            >
              <Text className={`text-[9px] font-bold ${selectedPriceFilter === '500to1500' ? 'text-white' : 'text-[#8C7078]'}`}>
                ₹500 - ₹1,500
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPriceFilter(selectedPriceFilter === 'above1500' ? 'all' : 'above1500')}
              className={`mr-1.5 px-2.5 py-0.5 rounded-full border ${
                selectedPriceFilter === 'above1500'
                  ? 'bg-[#C2477A] border-[#C2477A]'
                  : 'bg-[#F9FAFB] border-gray-200'
              }`}
            >
              <Text className={`text-[9px] font-bold ${selectedPriceFilter === 'above1500' ? 'text-white' : 'text-[#8C7078]'}`}>
                ₹1,500+
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {hasActiveFilters && (
            <TouchableOpacity onPress={resetFilters} className="pl-2">
              <Text className="text-[10px] font-bold text-[#C2477A]">Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        className="bg-white flex-1"
      >
        {query.length === 0 && !hasActiveFilters ? (
          <>
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-xs font-extrabold text-[#3A2430]">Recent Searches</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text className="text-[10px] font-bold text-[#8C7078]">Clear All</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setQuery(term)}
                      className="bg-white border border-[#FCE4EC] px-3 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-2xs"
                    >
                      <Text className="text-[11px] font-bold text-[#8C7078]">{term}</Text>
                      <TouchableOpacity onPress={() => removeRecentSearch(term)}>
                        <Ionicons name="close" size={12} color="#8C7078" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Searches Section */}
            <View className="mb-5">
              <Text className="text-xs font-extrabold text-[#3A2430] mb-2.5">Trending Searches</Text>
              <View className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-2xs">
                {trendingSearches.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setQuery(item.text)}
                    className={`flex-row items-center justify-between p-3 ${
                      index !== trendingSearches.length - 1 ? 'border-b border-[#FCE4EC]' : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <Ionicons name={item.icon} size={15} color="#C2477A" />
                      <Text className="text-xs font-bold text-[#3A2430]">{item.text}</Text>
                    </View>
                    <Ionicons
                      name="arrow-up-outline"
                      size={14}
                      color="#8C7078"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* All Brands Quick Select */}
            {activeBrands && activeBrands.length > 0 && (
              <View className="mb-5">
                <Text className="text-xs font-extrabold text-[#3A2430] mb-2.5">Top Brands</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {activeBrands.slice(0, 10).map(brand => (
                    <TouchableOpacity
                      key={brand.id || brand.name}
                      onPress={() => {
                        setSelectedBrandName(brand.name);
                        setQuery(brand.name);
                      }}
                      className="mr-3 items-center"
                    >
                      <View className="w-14 h-14 rounded-full border border-[#FCE4EC] bg-[#FFF5F8] overflow-hidden items-center justify-center p-1 mb-1">
                        {brand.logo || brand.image ? (
                          <Image source={getSafeImageSource(brand.logo || brand.image, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300')} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Text className="text-xs font-black text-[#C2477A]">{(brand.name || 'B').charAt(0)}</Text>
                        )}
                      </View>
                      <Text className="text-[10px] font-bold text-[#3A2430]" numberOfLines={1}>{brand.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          /* Search Results Grid Feed */
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold text-[#8C7078]">
                {results.length} product{results.length !== 1 ? 's' : ''} found
                {query ? ` for "${query}"` : ''}
              </Text>
              {hasActiveFilters && (
                <Text className="text-[10px] font-bold text-[#C2477A]">Filtered</Text>
              )}
            </View>

            {results.length === 0 ? (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-16 h-16 rounded-full bg-[#FFF5F8] border border-[#FCE4EC] items-center justify-center mb-3">
                  <Ionicons name="search-outline" size={28} color="#C2477A" />
                </View>
                <Text className="text-sm font-extrabold text-[#3A2430] mb-1">No products match your search</Text>
                <Text className="text-xs text-[#8C7078] text-center mb-4">
                  Try checking your spelling or reset filters to see all available items.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    resetFilters();
                  }}
                  className="bg-[#C2477A] px-4 py-2 rounded-full shadow-xs"
                >
                  <Text className="text-xs font-bold text-white">Clear Search & Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {results.map(p => {
                  const rolePrice = getRolePrice(p, userRole);
                  const displayMrp = p.mrp > rolePrice ? p.mrp : Math.round(rolePrice * 1.25);
                  const discountPercent = Math.round(((displayMrp - rolePrice) / displayMrp) * 100);
                  const cartQty = cartQuantityMap.get(p.id) || 0;

                  return (
                    <View
                      key={p.id}
                      style={{ width: '48.5%' }}
                      className="bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC] justify-between"
                    >
                      {/* Product Image & Tap to Detail */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedProduct(p);
                          setCurrentScreen('product');
                        }}
                        activeOpacity={0.8}
                      >
                        <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FFF5F8] border border-[#FCE4EC]">
                          <Image
                            source={getSafeImageSource(p.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400')}
                            className="w-full h-full object-cover"
                          />
                          {discountPercent > 0 && (
                            <View className="absolute top-1.5 left-1.5 bg-[#C2477A] px-1.5 py-0.5 rounded">
                              <Text className="text-white text-[8px] font-black">{discountPercent}% OFF</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              toggleFavorite(p);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white items-center justify-center shadow-xs"
                          >
                            <Ionicons
                              name={isFavorite(p.id) ? "heart" : "heart-outline"}
                              size={13}
                              color="#C2477A"
                            />
                          </TouchableOpacity>
                        </View>

                        <Text className="text-[8px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5" numberOfLines={1}>
                          {p.brandName}
                        </Text>
                        <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>

                      {/* Price & Cart Stepper Button */}
                      <View className="flex-row items-center justify-between pt-1 border-t border-[#FCE4EC]/50">
                        <View>
                          <Text className="text-[8.5px] font-semibold text-[#8C7078] line-through">
                            ₹{displayMrp}
                          </Text>
                          <Text className="text-xs font-black text-[#C2477A]">₹{rolePrice}</Text>
                        </View>

                        <View>
                          {cartQty > 0 ? (
                            <View className="bg-[#C2477A] rounded-lg px-1.5 py-0.5 flex-row items-center gap-1 shadow-2xs">
                              <TouchableOpacity onPress={() => handleDecrement(p.id, cartQty)} className="w-4 h-4 items-center justify-center">
                                <Text className="text-white text-xs font-black">-</Text>
                              </TouchableOpacity>
                              <Text className="text-white text-[10px] font-extrabold px-0.5 min-w-[10px] text-center">{cartQty}</Text>
                              <TouchableOpacity onPress={() => handleIncrement(p, cartQty)} className="w-4 h-4 items-center justify-center">
                                <Text className="text-white text-xs font-black">+</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleIncrement(p, 0)}
                              className="px-2.5 py-1 rounded-lg border border-[#C2477A] bg-white shadow-2xs"
                            >
                              <Text className="text-[#C2477A] text-[9.5px] font-extrabold">+ ADD</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
