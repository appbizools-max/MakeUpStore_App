import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export const ProductListingView = ({
  category,
  subcategory,
  leafCategory,
  onBack,
  products = []
}) => {
  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    isFavorite,
    toggleFavorite
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('featured'); // 'featured', 'price_asc', 'price_desc', 'rating'
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState('ALL'); // 'ALL', 'u500', '500_1000', 'a1000'
  const [showSortModal, setShowSortModal] = useState(false);

  // Cart quantity map
  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    for (const item of (cart || [])) {
      const pid = item.product?.id || item.id;
      if (pid) map.set(pid, item.quantity || 0);
    }
    return map;
  }, [cart]);

  // Unique brands list from current products
  const availableBrands = useMemo(() => {
    const brandSet = new Set();
    products.forEach(p => {
      const b = p.brandName || p.brand_name || p.brand;
      if (b && typeof b === 'string') brandSet.add(b.trim());
    });
    return Array.from(brandSet);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brandName || p.brand_name || p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || cat.includes(q);
      });
    }

    // Brand filter
    if (selectedBrand !== 'ALL') {
      list = list.filter(p => {
        const b = p.brandName || p.brand_name || p.brand || '';
        return b.toLowerCase() === selectedBrand.toLowerCase();
      });
    }

    // Price tier filter
    if (selectedPriceTier !== 'ALL') {
      list = list.filter(p => {
        const price = getRolePrice(p, userRole);
        if (selectedPriceTier === 'u500') return price < 500;
        if (selectedPriceTier === '500_1000') return price >= 500 && price <= 1000;
        if (selectedPriceTier === 'a1000') return price > 1000;
        return true;
      });
    }

    // Sort order
    if (selectedSort === 'price_asc') {
      list.sort((a, b) => getRolePrice(a, userRole) - getRolePrice(b, userRole));
    } else if (selectedSort === 'price_desc') {
      list.sort((a, b) => getRolePrice(b, userRole) - getRolePrice(a, userRole));
    } else if (selectedSort === 'rating') {
      list.sort((a, b) => (Number(b.rating || 4.5) - Number(a.rating || 4.5)));
    }

    return list;
  }, [products, searchQuery, selectedBrand, selectedPriceTier, selectedSort, userRole, getRolePrice]);

  const handleProductPress = (product) => {
    if (setSelectedProduct) setSelectedProduct(product);
    if (setCurrentScreen) setCurrentScreen('product');
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleIncrement = (e, product, currentQty) => {
    e.stopPropagation();
    updateCartQuantity(product.id, currentQty + 1);
  };

  const handleDecrement = (e, product, currentQty) => {
    e.stopPropagation();
    if (currentQty > 1) {
      updateCartQuantity(product.id, currentQty - 1);
    } else {
      removeFromCart(product.id);
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedBrand !== 'ALL' || selectedPriceTier !== 'ALL' || selectedSort !== 'featured';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
    setSelectedPriceTier('ALL');
    setSelectedSort('featured');
  };

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <View className="bg-white border-b border-[#FCE4EC] px-4 pt-3 pb-3">
        <View className="flex-row items-center justify-between mb-2.5">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-lg active:bg-pink-50"
          >
            <Ionicons name="chevron-back" size={20} color="#C2477A" />
            <Text className="text-xs font-bold text-[#C2477A]">Back</Text>
          </TouchableOpacity>

          <View className="flex-1 items-center px-2">
            <Text className="text-sm font-extrabold text-[#3A2430]" numberOfLines={1}>
              {leafCategory?.name || subcategory?.name || category?.name || 'Products'}
            </Text>
            <Text className="text-[10px] text-[#8C7078] font-medium" numberOfLines={1}>
              {category?.name} {subcategory ? `› ${subcategory.name}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 bg-[#FFF0F5] px-2.5 py-1.5 rounded-full border border-[#FCE4EC]"
          >
            <Ionicons name="swap-vertical" size={13} color="#C2477A" />
            <Text className="text-[11px] font-bold text-[#C2477A]">Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] px-3 py-2">
          <Ionicons name="search" size={15} color="#C2477A" />
          <TextInput
            placeholder={`Search in ${leafCategory?.name || subcategory?.name || 'catalog'}...`}
            placeholderTextColor="#B0909A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-xs text-[#3A2430] font-medium p-0"
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#8C7078" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── FILTER CHIPS ROW ────────────────────────────────────────── */}
      <View className="bg-white border-b border-gray-100 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
          {/* Price Filters */}
          <TouchableOpacity
            onPress={() => setSelectedPriceTier('ALL')}
            className={`px-3 py-1 rounded-full mr-2 border ${
              selectedPriceTier === 'ALL'
                ? 'bg-[#C2477A] border-[#C2477A]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                selectedPriceTier === 'ALL' ? 'text-white' : 'text-[#3A2430]'
              }`}
            >
              All Prices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriceTier('u500')}
            className={`px-3 py-1 rounded-full mr-2 border ${
              selectedPriceTier === 'u500'
                ? 'bg-[#C2477A] border-[#C2477A]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                selectedPriceTier === 'u500' ? 'text-white' : 'text-[#3A2430]'
              }`}
            >
              Under ₹500
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriceTier('500_1000')}
            className={`px-3 py-1 rounded-full mr-2 border ${
              selectedPriceTier === '500_1000'
                ? 'bg-[#C2477A] border-[#C2477A]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                selectedPriceTier === '500_1000' ? 'text-white' : 'text-[#3A2430]'
              }`}
            >
              ₹500 - ₹1,000
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriceTier('a1000')}
            className={`px-3 py-1 rounded-full mr-2 border ${
              selectedPriceTier === 'a1000'
                ? 'bg-[#C2477A] border-[#C2477A]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                selectedPriceTier === 'a1000' ? 'text-white' : 'text-[#3A2430]'
              }`}
            >
              Above ₹1,000
            </Text>
          </TouchableOpacity>

          {/* Brands */}
          {availableBrands.map((b) => (
            <TouchableOpacity
              key={b}
              onPress={() => setSelectedBrand(selectedBrand === b ? 'ALL' : b)}
              className={`px-3 py-1 rounded-full mr-2 border ${
                selectedBrand === b
                  ? 'bg-[#3A2430] border-[#3A2430]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  selectedBrand === b ? 'text-white' : 'text-[#3A2430]'
                }`}
              >
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── PRODUCT GRID ────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 90 }}
      >
        {filteredProducts.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <View className="w-16 h-16 rounded-full bg-pink-50 items-center justify-center mb-3">
              <Ionicons name="sparkles-outline" size={28} color="#C2477A" />
            </View>
            <Text className="text-base font-extrabold text-[#3A2430] mb-1 text-center">
              No Products Found
            </Text>
            <Text className="text-xs text-[#8C7078] text-center mb-4 leading-4">
              We couldn't find matches for this selection with active filters.
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                className="bg-[#C2477A] px-4 py-2 rounded-xl shadow-xs"
              >
                <Text className="text-xs font-bold text-white">Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.map((product) => {
              const rolePrice = getRolePrice(product, userRole);
              const mrp = product.mrp && product.mrp > rolePrice ? product.mrp : Math.round(rolePrice * 1.25);
              const discountPct = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;
              const isFav = isFavorite(product.id);
              const cartQty = cartQuantityMap.get(product.id) || 0;
              const rating = product.rating || '4.5';
              const ratingCount = product.reviews_count || product.reviewCount || 128;

              return (
                <TouchableOpacity
                  key={product.id}
                  activeOpacity={0.9}
                  onPress={() => handleProductPress(product)}
                  style={{ width: CARD_WIDTH }}
                  className="bg-white rounded-2xl p-2.5 mb-3.5 border border-[#FCE4EC] shadow-xs flex-col justify-between"
                >
                  {/* Top Image + Wishlist */}
                  <View className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#FFF5F8] mb-2">
                    <Image
                      source={getSafeImageSource(product?.image, '')}
                      className="w-full h-full object-cover"
                      resizeMode="cover"
                    />

                    {/* Discount badge */}
                    {discountPct > 0 && (
                      <View className="absolute top-2 left-2 bg-[#2E7D32] px-1.5 py-0.5 rounded-md">
                        <Text className="text-white text-[9px] font-black">{discountPct}% OFF</Text>
                      </View>
                    )}

                    {/* Heart button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                      activeOpacity={0.8}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 items-center justify-center shadow-xs"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={15}
                        color="#C2477A"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Brand & Name */}
                  <View className="mb-1">
                    <Text className="text-[10px] font-bold text-[#8C7078] uppercase tracking-wider mb-0.5" numberOfLines={1}>
                      {product.brandName || product.brand_name || product.brand || 'Luxury Beauty'}
                    </Text>
                    <Text className="text-xs font-bold text-[#3A2430] leading-4 h-8" numberOfLines={2}>
                      {product.name}
                    </Text>
                  </View>

                  {/* Rating */}
                  <View className="flex-row items-center gap-1 mb-2">
                    <View className="flex-row items-center bg-[#FFF8E1] px-1.5 py-0.5 rounded-md border border-[#FFE082]">
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text className="text-[10px] font-black text-[#854D0E] ml-0.5">{rating}</Text>
                    </View>
                    <Text className="text-[9.5px] text-gray-400 font-medium">({ratingCount})</Text>
                  </View>

                  {/* Price & Action Button */}
                  <View className="flex-row items-center justify-between pt-1 border-t border-gray-100">
                    <View>
                      {discountPct > 0 && (
                        <Text className="text-[10px] text-gray-400 line-through">₹{mrp}</Text>
                      )}
                      <Text className="text-sm font-black text-[#C2477A]">₹{rolePrice}</Text>
                    </View>

                    {/* Add to Bag or Stepper (DO NOT show stock counts) */}
                    {cartQty > 0 ? (
                      <View className="flex-row items-center bg-[#C2477A] rounded-full px-1.5 py-0.5">
                        <TouchableOpacity
                          onPress={(e) => handleDecrement(e, product, cartQty)}
                          className="w-5 h-5 items-center justify-center"
                        >
                          <Text className="text-white text-xs font-black">−</Text>
                        </TouchableOpacity>
                        <Text className="text-white text-xs font-black px-1.5">{cartQty}</Text>
                        <TouchableOpacity
                          onPress={(e) => handleIncrement(e, product, cartQty)}
                          className="w-5 h-5 items-center justify-center"
                        >
                          <Text className="text-white text-xs font-black">+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={(e) => handleAddToCart(e, product)}
                        activeOpacity={0.8}
                        className="bg-[#FFF0F5] border border-[#C2477A] px-2.5 py-1 rounded-full flex-row items-center gap-1 active:bg-[#C2477A]"
                      >
                        <Ionicons name="bag-add-outline" size={11} color="#C2477A" />
                        <Text className="text-[10px] font-black text-[#C2477A]">ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── SORT MODAL ──────────────────────────────────────────────── */}
      <Modal visible={showSortModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-base font-black text-[#3A2430]">Sort Products By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={20} color="#8C7078" />
              </TouchableOpacity>
            </View>

            {[
              { id: 'featured', label: 'Featured & Popular' },
              { id: 'price_asc', label: 'Price: Low to High' },
              { id: 'price_desc', label: 'Price: High to Low' },
              { id: 'rating', label: 'Customer Rating' }
            ].map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelectedSort(item.id);
                  setShowSortModal(false);
                }}
                className="flex-row items-center justify-between py-3 border-b border-gray-50"
              >
                <Text
                  className={`text-sm ${
                    selectedSort === item.id ? 'font-black text-[#C2477A]' : 'font-semibold text-[#3A2430]'
                  }`}
                >
                  {item.label}
                </Text>
                {selectedSort === item.id && (
                  <Ionicons name="checkmark-circle" size={18} color="#C2477A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
