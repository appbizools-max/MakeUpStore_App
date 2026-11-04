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
import { PurplleProductCard } from '../../components/PurplleProductCard';
import { getCartQuantityMap } from '../../utils/cartKeyUtils';

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
    setSelectedShade,
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

  // Cart quantity map (Purplle-style keyed by cartKey)
  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
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
    } else if (selectedSort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
      // Default: priority sequence arrangement from admin
      list.sort((a, b) => {
        const orderA = Number(a.sort_order ?? a.display_order ?? a.priority) || 99999;
        const orderB = Number(b.sort_order ?? b.display_order ?? b.priority) || 99999;
        return orderA - orderB;
      });
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
    <View className="flex-1 bg-white">
      {/* ── TOP FIXED HEADER ─────────────────────────────────────────── */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          backgroundColor: '#FFFFFF',
          elevation: 2,
          shadowColor: '#B64F7D',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }}
        className="px-4 pt-3 pb-3"
      >
        <View className="flex-row items-center justify-between mb-2.5">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-lg active:bg-pink-50"
          >
            <Ionicons name="chevron-back" size={20} color="#B64F7D" />
            <Text style={{ color: '#B64F7D' }} className="text-xs font-bold">Back</Text>
          </TouchableOpacity>

          <View className="flex-1 items-center px-2">
            <Text style={{ color: '#33252F' }} className="text-sm font-extrabold" numberOfLines={1}>
              {leafCategory?.name || subcategory?.name || category?.name || 'Products'}
            </Text>
            <Text style={{ color: '#82727C' }} className="text-[10.5px] font-medium" numberOfLines={1}>
              {category?.name || 'Catalog'} {subcategory ? `› ${subcategory.name}` : ''}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#FFF0F5',
                borderColor: '#F0E3EA',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xs"
            >
              <Ionicons name="swap-vertical" size={13} color="#B64F7D" />
              <Text style={{ color: '#B64F7D' }} className="text-[11px] font-bold">Sort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentScreen('cart')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
              className="w-8 h-8 rounded-full bg-[#FFF0F5] items-center justify-center shadow-2xs relative"
              accessibilityLabel="Cart"
            >
              <Ionicons name="bag-handle-outline" size={15} color="#B64F7D" />
              {cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) > 0 && (
                <View
                  style={{ minWidth: 15, height: 15, paddingHorizontal: 2 }}
                  className="absolute -top-1 -right-1 bg-[#C2477A] rounded-full items-center justify-center border border-white"
                >
                  <Text className="text-[9px] font-black text-white leading-none">
                    {cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) > 99
                      ? '99+'
                      : cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Search Bar (Height 52px, Rounded, Light Pink #FFF0F5) */}
        <View
          style={{
            height: 52,
            backgroundColor: '#FFF0F5',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 16,
          }}
          className="flex-row items-center px-3.5"
        >
          <Ionicons name="search" size={18} color="#B64F7D" />
          <TextInput
            placeholder={`Search in ${leafCategory?.name || subcategory?.name || category?.name || 'Products'}...`}
            placeholderTextColor="#B0909A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: '#33252F' }}
            className="flex-1 ml-2 text-xs font-medium p-0"
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#82727C" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── HORIZONTALLY SCROLLABLE FILTER BAR ───────────────────────── */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          backgroundColor: '#FFFFFF',
        }}
        className="py-2.5"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {/* Price Filters */}
          {[
            { id: 'ALL', label: 'All Prices' },
            { id: 'u500', label: 'Under ₹500' },
            { id: '500_1000', label: '₹500 - ₹1,000' },
            { id: 'a1000', label: 'Above ₹1,000' },
          ].map((tier) => {
            const isSelected = selectedPriceTier === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                onPress={() => setSelectedPriceTier(tier.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? '#B64F7D' : '#FFFFFF',
                  borderColor: isSelected ? '#B64F7D' : '#F0E3EA',
                  borderWidth: 1,
                }}
                className="px-3.5 py-1.5 rounded-full mr-2 shadow-2xs"
              >
                <Text
                  style={{ color: isSelected ? '#FFFFFF' : '#33252F' }}
                  className="text-xs font-semibold"
                >
                  {tier.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Brands */}
          {availableBrands.map((b) => {
            const isSelected = selectedBrand === b;
            return (
              <TouchableOpacity
                key={b}
                onPress={() => setSelectedBrand(selectedBrand === b ? 'ALL' : b)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? '#33252F' : '#FFFFFF',
                  borderColor: isSelected ? '#33252F' : '#F0E3EA',
                  borderWidth: 1,
                }}
                className="px-3.5 py-1.5 rounded-full mr-2 shadow-2xs"
              >
                <Text
                  style={{ color: isSelected ? '#FFFFFF' : '#33252F' }}
                  className="text-xs font-semibold"
                >
                  {b}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── RESPONSIVE TWO-COLUMN PRODUCT GRID ──────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 110, // Safe-area bottom padding to prevent bottom navigation overlap
        }}
      >
        {/* Level 3 Select Category (Typography & Text Only) / Subcategory Full Banner (Total Container) */}
        {leafCategory ? (
          /* Select Category: NO image - show only content in proper typography, text in container */
          <View
            style={{
              borderRadius: 18,
              backgroundColor: '#FFF0F5',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              padding: 16,
              marginBottom: 14,
              shadowColor: '#B64F7D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <View className="self-start px-2.5 py-0.5 rounded-full bg-[#B64F7D] mb-2">
              <Text className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                Select Category
              </Text>
            </View>
            <Text
              style={{ color: '#33252F' }}
              className="text-lg font-black leading-tight mb-1"
              numberOfLines={2}
            >
              {leafCategory.name}
            </Text>
            {leafCategory.description ? (
              <Text
                style={{ color: '#82727C' }}
                className="text-xs font-semibold leading-relaxed mb-2"
                numberOfLines={2}
              >
                {leafCategory.description}
              </Text>
            ) : null}
            <Text style={{ color: '#B64F7D' }} className="text-xs font-bold">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products Available'}
            </Text>
          </View>
        ) : subcategory?.image ? (
          /* Subcategory Full Banner: Fills total container (Not in a box) */
          <View
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              marginBottom: 14,
              height: 140,
              backgroundColor: '#FFF0F5',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              shadowColor: '#B64F7D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <Image
              source={getSafeImageSource(subcategory.image)}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ) : (
          /* Editorial Content when no banner image */
          <View
            style={{
              borderRadius: 18,
              backgroundColor: '#FFF0F5',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: '#33252F' }} className="text-lg font-black leading-tight mb-1">
              {subcategory?.name || category?.name}
            </Text>
            <Text style={{ color: '#B64F7D' }} className="text-xs font-bold">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </Text>
          </View>
        )}

        {filteredProducts.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <View
              style={{
                backgroundColor: '#FFF0F5',
                borderColor: '#F0E3EA',
                borderWidth: 1,
              }}
              className="w-16 h-16 rounded-full items-center justify-center mb-3 shadow-2xs"
            >
              <Ionicons name="sparkles-outline" size={28} color="#B64F7D" />
            </View>
            <Text style={{ color: '#33252F' }} className="text-base font-extrabold mb-1 text-center">
              No Products Found
            </Text>
            <Text style={{ color: '#82727C' }} className="text-xs text-center mb-4 leading-4">
              We couldn't find matches for this selection with active filters.
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                style={{ backgroundColor: '#B64F7D' }}
                className="px-4 py-2 rounded-xl shadow-xs"
              >
                <Text className="text-xs font-bold text-white">Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {filteredProducts.map((product) => (
              <PurplleProductCard
                key={product.id}
                product={product}
                cardWidth={CARD_WIDTH}
                userRole={userRole}
                getRolePrice={getRolePrice}
                cartQuantityMap={cartQuantityMap}
                addToCart={addToCart}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                onPressProduct={(prod, shade) => {
                  if (setSelectedShade && shade) setSelectedShade(shade);
                  handleProductPress(prod);
                }}
              />
            ))}
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
              { id: 'featured', label: 'Recommended Priority' },
              { id: 'price_asc', label: 'Price: Low to High' },
              { id: 'price_desc', label: 'Price: High to Low' },
              { id: 'newest', label: 'Newest Arrivals' }
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

export const ProductListingPage = ProductListingView;
export default ProductListingView;
