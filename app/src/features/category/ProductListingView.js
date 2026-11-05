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
import { PremiumFilterBottomSheet } from '../../components/PremiumFilterBottomSheet';
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
  const appCtx = useApp() || {};
  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
    setSelectedShade,
    rememberSelectedShade,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    isFavorite,
    toggleFavorite,
    categories = [],
    subcategories = []
  } = appCtx;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('featured'); // 'featured', 'price_asc', 'price_desc', 'rating'
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState('ALL'); // 'ALL', 'u500', '500_1000', 'a1000'
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  // Cart quantity map (Purplle-style keyed by cartKey)
  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
  }, [cart]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedPriceRange !== 'all') count++;
    if (selectedDiscount > 0) count++;
    if (selectedRating > 0) count++;
    return count;
  }, [selectedBrands, selectedPriceRange, selectedDiscount, selectedRating]);

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

    // Brand filter (Legacy single brand)
    if (selectedBrand !== 'ALL') {
      list = list.filter(p => {
        const b = p.brandName || p.brand_name || p.brand || '';
        return b.toLowerCase() === selectedBrand.toLowerCase();
      });
    }

    // Multi-select brands filter
    if (selectedBrands.length > 0) {
      const lowerBrands = selectedBrands.map(b => b.toLowerCase().trim());
      list = list.filter(p => {
        const b = (p.brandName || p.brand_name || p.brand || '').toLowerCase().trim();
        return lowerBrands.includes(b);
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

    // Price range filter
    if (selectedPriceRange !== 'all') {
      list = list.filter(p => {
        const price = getRolePrice(p, userRole);
        if (selectedPriceRange === 'u500') return price < 500;
        if (selectedPriceRange === '500_1000') return price >= 500 && price <= 1000;
        if (selectedPriceRange === '1000_2000') return price >= 1000 && price <= 2000;
        if (selectedPriceRange === 'a2000') return price > 2000;
        return true;
      });
    }

    // Discount filter
    if (selectedDiscount > 0) {
      list = list.filter(p => {
        const rolePrice = getRolePrice(p, userRole);
        const mrp = Number(p.mrp) || rolePrice;
        const disc = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;
        return disc >= selectedDiscount;
      });
    }

    // Rating filter
    if (selectedRating > 0) {
      list = list.filter(p => {
        const r = Number(p.rating) || 4.2;
        return r >= selectedRating;
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
  }, [products, searchQuery, selectedBrand, selectedBrands, selectedPriceTier, selectedPriceRange, selectedDiscount, selectedRating, selectedSort, userRole, getRolePrice]);

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
                backgroundColor: '#FFFFFF',
                borderColor: '#F0E3EA',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xs"
            >
              <Ionicons name="swap-vertical" size={13} color="#B64F7D" />
              <Text style={{ color: '#B64F7D' }} className="text-[11px] font-bold">Sort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: activeFilterCount > 0 ? '#C2477A' : '#FFFFFF',
                borderColor: activeFilterCount > 0 ? '#C2477A' : '#F0E3EA',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xs"
            >
              <Ionicons name="options-outline" size={13} color={activeFilterCount > 0 ? '#FFFFFF' : '#B64F7D'} />
              <Text style={{ color: activeFilterCount > 0 ? '#FFFFFF' : '#B64F7D' }} className="text-[11px] font-bold">
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentScreen('cart')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
              className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-2xs relative"
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
            backgroundColor: '#FFFFFF',
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
        {/* Subcategory Clean Header Card with 3D Icon & Explore CTA */}
        {subcategory ? (
          <View
            style={{
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 14,
              shadowColor: '#C2477A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {subcategory.image ? (
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: '#FFFFFF',
                  borderColor: '#F8B4D9',
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  overflow: 'hidden',
                  elevation: 2,
                }}
              >
                <Image
                  source={getSafeImageSource(subcategory.image)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: '#1F2937' }}
                className="text-base font-black leading-tight mb-1"
                numberOfLines={1}
              >
                {subcategory.name}
              </Text>
              <Text style={{ color: '#C2477A' }} className="text-xs font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products Available'}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: '#1F2937' }} className="text-base font-black leading-tight mb-1">
              {category?.name || 'Products'}
            </Text>
            <Text style={{ color: '#C2477A' }} className="text-xs font-bold">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products Available'}
            </Text>
          </View>
        )}

        {filteredProducts.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <View
              style={{
                backgroundColor: '#FFFFFF',
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
                  if (rememberSelectedShade && (prod?.id || prod?.parentProductId)) {
                    appCtx.rememberSelectedShade(prod.parentProductId || prod.id, shade);
                  }
                  handleProductPress(prod);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── PREMIUM FILTER BOTTOM SHEET ───────────────────────────── */}
      <PremiumFilterBottomSheet
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categories={categories}
        subcategories={subcategories}
        brands={availableBrands.map(b => ({ name: b }))}
        selectedCategory={category?.name || 'All'}
        selectedSubcategory={subcategory?.name || 'All'}
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
        selectedRating={selectedRating}
        onSelectRating={setSelectedRating}
        activeFilterCount={activeFilterCount}
        onClearAll={() => {
          setSelectedBrands([]);
          setSelectedPriceRange('all');
          setSelectedDiscount(0);
          setSelectedRating(0);
          setSelectedBrand('ALL');
          setSelectedPriceTier('ALL');
        }}
        onApply={() => setShowFilterModal(false)}
        totalMatchingCount={filteredProducts.length}
      />

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
