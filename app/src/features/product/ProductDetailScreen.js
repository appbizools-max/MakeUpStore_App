import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getProductTiersForRole } from '../../utils/quantityTiersUtils';
import { isB2BRole } from '../../utils/b2bVerificationService';
import { getSafeImageUri, getSafeImageSource } from '../../utils/imageUtils';
import { getCartKey, getSafeProductShadesList } from '../../utils/cartKeyUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Salbeau Redesigned Product Detail Page (PDP)
 * 
 * Hierarchy strictly matching FACES CANADA design reference:
 * 1. Top navigation with Back, Share, Search, & Cart (with badge)
 * 2. Large product image carousel with discount badge & bottom-center pagination dots
 * 3. Product title and description with bold black typography
 * 4. Price and rating layout (Selling price, strikethrough MRP, green discount tag, & green rating pill)
 * 5. Compact horizontal shade selector with rounded-square swatches & "All Shades >" trigger
 * 6. "More Products from [Brand]" horizontal carousel with magenta/purple active borders
 * 7. Fixed bottom purchase bar with Wishlist button & prominent "Add to cart" button
 */
export const ProductDetailScreen = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    activeProducts = [],
    userRole,
    userProfile,
    isB2BVerified,
    getRolePrice,
    addToCart,
    cart = [],
    setCurrentScreen,
    isFavorite,
    toggleFavorite,
    selectedShade: contextSelectedShade,
    setSelectedShade: setContextSelectedShade,
    openShadeSheet,
    rememberSelectedShade
  } = useApp();

  // Extract all active, valid shades
  const allSubProducts = useMemo(() => {
    return getSafeProductShadesList(selectedProduct);
  }, [selectedProduct]);

  // Distinguish pure color shades vs sizes/variants
  const { shadeList, variantList } = useMemo(() => {
    const sList = [];
    const vList = [];

    allSubProducts.forEach(item => {
      const hasHex = Boolean(item.hexColor && String(item.hexColor).trim().length > 0);
      const attrs = item.attributes || {};
      const hasShadeAttr = Boolean(
        attrs['Shade / Colour'] ||
        attrs['Shade'] ||
        attrs['Color'] ||
        attrs['Shade Code']
      );
      const hasSizeAttr = Boolean(
        attrs['Size'] ||
        attrs['Volume'] ||
        attrs['Net Quantity'] ||
        attrs['Pack']
      );

      if (hasSizeAttr && !hasHex && !hasShadeAttr) {
        vList.push(item);
      } else {
        sList.push(item);
      }
    });

    return { shadeList: sList.length > 0 ? sList : allSubProducts, variantList: vList };
  }, [allSubProducts]);

  // Active shade state
  const [selectedShade, setSelectedShade] = useState(() => {
    if (contextSelectedShade && allSubProducts.some(s => (s.id || s.name) === (contextSelectedShade.id || contextSelectedShade.name))) {
      return contextSelectedShade;
    }
    return allSubProducts[0] || null;
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryScrollRef = useRef(null);
  const [addedToastMessage, setAddedToastMessage] = useState(null);

  // Sync selected shade when product changes
  useEffect(() => {
    if (contextSelectedShade && allSubProducts.some(s => (s.id || s.name) === (contextSelectedShade.id || contextSelectedShade.name))) {
      setSelectedShade(contextSelectedShade);
    } else if (allSubProducts.length > 0) {
      if (!selectedShade || !allSubProducts.some(s => (s.id || s.name) === (selectedShade.id || selectedShade.name))) {
        setSelectedShade(allSubProducts[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [selectedProduct?.id, contextSelectedShade, allSubProducts]);

  // Toast auto-dismiss
  useEffect(() => {
    if (addedToastMessage) {
      const timer = setTimeout(() => setAddedToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToastMessage]);

  const handleSelectSubProduct = (item) => {
    setSelectedShade(item);
    if (setContextSelectedShade) setContextSelectedShade(item);
    if (rememberSelectedShade && selectedProduct?.id) {
      rememberSelectedShade(selectedProduct.id, item);
    }
  };

  // Compile high-res gallery images
  const productImages = useMemo(() => {
    const list = [];
    const shadeImg = selectedShade?.imageUrl || selectedShade?.image || selectedShade?.image_url;
    if (shadeImg) {
      const safe = getSafeImageUri(shadeImg);
      if (safe) list.push(safe);
    }
    if (selectedProduct?.images && selectedProduct.images.length > 0) {
      selectedProduct.images.forEach(img => {
        const safe = getSafeImageUri(img);
        if (safe && !list.includes(safe)) list.push(safe);
      });
    } else if (selectedProduct?.image) {
      const safe = getSafeImageUri(selectedProduct.image);
      if (safe && !list.includes(safe)) list.push(safe);
    }
    if (list.length === 0) {
      list.push('');
    }
    return list;
  }, [selectedProduct, selectedShade]);

  useEffect(() => {
    setCurrentImageIndex(0);
    if (galleryScrollRef.current) {
      galleryScrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [selectedProduct?.id, selectedShade?.id, selectedShade?.name]);

  if (!selectedProduct) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-sm font-bold text-[#171717] mb-2">No product selected.</Text>
        <TouchableOpacity
          onPress={() => setCurrentScreen('category')}
          className="bg-[#C2477A] px-5 py-2.5 rounded-xl shadow-xs"
        >
          <Text className="text-xs font-bold text-white">Return to Browse</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cart information
  const cartItemId = getCartKey(selectedProduct.id, selectedShade);
  const cartItem = (cart || []).find(c => c.id === cartItemId);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const cartBadgeCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Dynamic pricing
  const currentRolePrice = getRolePrice(selectedProduct, userRole, selectedShade, 1);
  const rawShadeMrp = selectedShade?.mrp ?? selectedShade?.priceOverride ?? selectedShade?.price_override ?? selectedShade?.price ?? selectedProduct?.mrp;
  const displayMrp = (rawShadeMrp && Number(rawShadeMrp) > currentRolePrice)
    ? Number(rawShadeMrp)
    : (selectedProduct?.mrp && Number(selectedProduct.mrp) > currentRolePrice ? Number(selectedProduct.mrp) : Math.round(currentRolePrice * 1.25));
  const hasDiscount = displayMrp > currentRolePrice;
  const savings = displayMrp - currentRolePrice;
  const discountPercent = hasDiscount ? Math.round((savings / displayMrp) * 100) : 0;

  // Rating & Review values
  const rating = selectedProduct.rating ? Number(selectedProduct.rating).toFixed(1) : '4.3';
  const reviews = selectedProduct.reviewCount || 2272;

  // "More Products from [Brand]"
  const brandName = selectedProduct.brandName || selectedProduct.brand || 'Lakmé';
  const brandProducts = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const bLower = brandName.trim().toLowerCase();
    const sameBrand = activeProducts.filter(p => {
      const b = (p.brandName || p.brand || '').trim().toLowerCase();
      return b === bLower && p.id !== selectedProduct.id;
    });
    if (sameBrand.length > 0) return sameBrand.slice(0, 10);
    // Fallback: other popular products in the catalog
    return activeProducts.filter(p => p.id !== selectedProduct.id).slice(0, 8);
  }, [selectedProduct.id, brandName, activeProducts]);

  // Add to Cart Action
  const handleAddToCart = () => {
    addToCart(selectedProduct, 1, selectedShade);
    const shadeTitle = selectedShade?.name || selectedShade?.title || '';
    setAddedToastMessage(`Added ${selectedProduct.name}${shadeTitle ? ` (${shadeTitle})` : ''} to cart! ✨`);
  };

  const isLiked = isFavorite ? isFavorite(selectedProduct?.id) : false;

  // Construct full descriptive title matching Screenshot 2's comprehensive styling
  const fullTitle = useMemo(() => {
    const parts = [];
    const brand = (selectedProduct.brandName || selectedProduct.brand || '').toUpperCase();
    if (brand) parts.push(brand);
    if (selectedProduct.name) parts.push(selectedProduct.name);
    if (selectedShade?.name) parts.push(`- ${selectedShade.name}`);
    const size = selectedProduct.size || selectedProduct.netQty || selectedShade?.size;
    if (size) parts.push(size);
    if (Array.isArray(selectedProduct.highlights) && selectedProduct.highlights.length > 0) {
      parts.push(`| ${selectedProduct.highlights.slice(0, 3).join(' | ')}`);
    } else if (selectedProduct.description) {
      const snippet = selectedProduct.description.split('.')[0];
      if (snippet) parts.push(`| ${snippet}`);
    }
    return parts.join(' ');
  }, [selectedProduct, selectedShade]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <View className="px-4 py-2.5 bg-white border-b border-[#F0F0F0] flex-row justify-between items-center z-30">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => setCurrentScreen('category')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          className="p-1"
        >
          <Ionicons name="arrow-back" size={24} color="#171717" />
        </TouchableOpacity>

        {/* Right Action Icons: Share, Search, & Cart */}
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            className="p-1"
          >
            <Ionicons name="share-social-outline" size={21} color="#171717" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentScreen('search')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            className="p-1"
          >
            <Ionicons name="search-outline" size={21} color="#171717" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentScreen('cart')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            className="p-1 relative"
          >
            <Ionicons name="bag-handle-outline" size={21} color="#171717" />
            {cartBadgeCount > 0 && (
              <View className="absolute -top-1 -right-1.5 bg-[#C2477A] min-w-[15px] h-[15px] px-1 rounded-full items-center justify-center border border-white">
                <Text className="text-white text-[7.5px] font-black">
                  {cartBadgeCount > 9 ? '9+' : cartBadgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SCROLLABLE PDP BODY */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        className="flex-1 bg-white"
      >
        {/* 2. LARGE PRODUCT IMAGE CAROUSEL */}
        <View className="relative bg-white border-b border-[#F5F5F5] items-center">
          {/* Top-Left Discount Badge */}
          {discountPercent > 0 && (
            <View className="absolute top-3.5 left-4 z-20 bg-[#16834A] px-2.5 py-1 rounded-md shadow-xs">
              <Text className="text-white text-[10px] font-black uppercase tracking-wider">
                {discountPercent}% Off
              </Text>
            </View>
          )}

          {/* Horizontal Swipeable Images */}
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / SCREEN_WIDTH);
              setCurrentImageIndex(idx);
            }}
            className="w-full bg-white"
          >
            {productImages.map((imgUri, idx) => (
              <View
                key={idx}
                style={{ width: SCREEN_WIDTH, height: 350 }}
                className="items-center justify-center bg-white p-4"
              >
                <Image
                  source={getSafeImageSource(imgUri)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Bottom-Center Dots Pagination Indicator */}
          {productImages.length > 1 && (
            <View className="flex-row items-center justify-center gap-1.5 pb-3 bg-white">
              {productImages.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setCurrentImageIndex(idx);
                    galleryScrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
                  }}
                  className={`rounded-full transition-all ${
                    idx === currentImageIndex
                      ? 'w-6 h-1.5 bg-[#C2477A]'
                      : 'w-1.5 h-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* 3. PRODUCT TITLE AND DESCRIPTION */}
        <View className="px-4 pt-3.5 pb-2.5 bg-white">
          <Text className="text-[15px] font-bold text-[#171717] leading-snug">
            {fullTitle}
          </Text>
        </View>

        {/* 4. PRICE AND DISCOUNT LAYOUT */}
        <View className="px-4 py-3 bg-white flex-row items-center justify-between border-b border-[#F0F0F0]">
          {/* Selling Price, MRP, Discount, & Taxes */}
          <View>
            <View className="flex-row items-baseline gap-2 flex-wrap">
              <Text className="text-2xl font-black text-[#171717]">
                ₹{currentRolePrice}
              </Text>
              {hasDiscount && (
                <Text className="text-xs font-semibold text-[#777777] line-through">
                  ₹{displayMrp}
                </Text>
              )}
              {discountPercent > 0 && (
                <Text className="text-xs font-black text-[#16834A]">
                  {discountPercent}% Off
                </Text>
              )}
            </View>
            <Text className="text-[11px] text-[#777777] mt-0.5">
              Inclusive of all taxes
            </Text>
          </View>
        </View>

        {/* 5. SHADE SELECTION */}
        {shadeList.length > 0 && (
          <View className="px-4 py-4 bg-white border-b border-[#F0F0F0]">
            {/* Header: Selected Shade Name & "All Shades >" Trigger */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-[#171717]">
                {selectedShade?.name || selectedShade?.title || 'Selected Shade'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (openShadeSheet) {
                    openShadeSheet(selectedProduct, selectedShade);
                  }
                }}
                activeOpacity={0.7}
                className="flex-row items-center gap-0.5"
              >
                <Text className="text-xs font-black text-[#C2477A]">
                  All Shades
                </Text>
                <Ionicons name="chevron-forward" size={13} color="#C2477A" />
              </TouchableOpacity>
            </View>

            {/* Horizontally Scrollable Rounded-Square Swatches */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="flex-row"
            >
              {shadeList.map((shade, idx) => {
                const isSelected = selectedShade && (
                  (selectedShade.id && shade.id && selectedShade.id === shade.id) ||
                  (selectedShade.name && shade.name && selectedShade.name === shade.name)
                );
                const colorHex = shade.hexColor || shade.hex_color || '#C2477A';

                return (
                  <TouchableOpacity
                    key={shade.id || shade.name || idx}
                    onPress={() => handleSelectSubProduct(shade)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: colorHex,
                      borderColor: isSelected ? '#171717' : '#E8E8E8',
                      borderWidth: isSelected ? 2.5 : 1
                    }}
                    className="w-11 h-11 rounded-xl mr-2.5 items-center justify-center shadow-2xs"
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 6. MORE PRODUCTS FROM THE SAME BRAND */}
        {brandProducts.length > 0 && (
          <View className="px-4 py-4 bg-white border-b border-[#F0F0F0]">
            <Text className="text-sm font-bold text-[#171717] mb-3">
              More Products from {brandName}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="flex-row"
            >
              {brandProducts.map((item, idx) => {
                const isCurrent = item.id === selectedProduct.id || idx === 0;
                const promoBadge = item.category || (idx % 2 === 0 ? 'Hydrating' : 'Bestseller');
                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    onPress={() => {
                      setSelectedProduct(item);
                    }}
                    activeOpacity={0.85}
                    style={{
                      borderColor: isCurrent ? '#C2477A' : '#E8E8E8',
                      borderWidth: isCurrent ? 2 : 1
                    }}
                    className="w-32 mr-3 bg-white rounded-2xl p-2.5 items-center justify-between shadow-2xs"
                  >
                    {/* Optional Promotional Badge */}
                    <View className="bg-pink-50 px-2 py-0.5 rounded-full mb-1">
                      <Text className="text-[9px] font-bold text-[#C2477A]">
                        {promoBadge}
                      </Text>
                    </View>

                    {/* Product Image */}
                    <View className="w-20 h-20 items-center justify-center my-1">
                      <Image
                        source={getSafeImageSource(item.image, '')}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    </View>

                    {/* Product Name */}
                    <Text
                      className="text-xs font-bold text-[#171717] text-center"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Quantity Discount Tiers (when applicable for user role) */}
        {(() => {
          const effectiveRole = (isB2BRole(userRole) && !isB2BVerified) ? 'general' : userRole;
          const roleTiers = getProductTiersForRole(selectedProduct, effectiveRole, selectedShade);
          if (!roleTiers || roleTiers.length === 0) return null;

          return (
            <View className="mx-4 my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Text className="text-[10px] font-black uppercase text-[#C2477A] mb-2">
                Quantity Tier Pricing ({effectiveRole.toUpperCase()})
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {roleTiers.map((tier, tIdx) => {
                  const tierUnitPrice = getRolePrice(selectedProduct, effectiveRole, selectedShade, Number(tier.minQty));
                  const isActive = cartQty >= Number(tier.minQty);
                  return (
                    <View
                      key={tier.id || tIdx}
                      className={`p-2 rounded-xl border items-center min-w-[70px] ${
                        isActive ? 'bg-[#FFF0F5] border-[#C2477A]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className="text-[10px] font-bold text-gray-800">{tier.minQty}+ units</Text>
                      <Text className="text-xs font-black text-gray-900 mt-0.5">₹{tierUnitPrice}</Text>
                      {Number(tier.additionalDiscount) > 0 && (
                        <Text className="text-[9px] font-bold text-emerald-600">+{tier.additionalDiscount}% OFF</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 7. FIXED BOTTOM PURCHASE BAR */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <View style={styles.fixedBottomBar}>
        {/* Wishlist Button */}
        <TouchableOpacity
          onPress={() => toggleFavorite(selectedProduct)}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white border border-[#E8E8E8] shadow-2xs"
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={18}
            color={isLiked ? "#C2477A" : "#171717"}
          />
          <Text className="text-xs font-bold text-[#171717]">Wishlist</Text>
        </TouchableOpacity>

        {/* Add to Cart Button */}
        <TouchableOpacity
          onPress={handleAddToCart}
          activeOpacity={0.85}
          style={styles.addToCartButton}
          className="flex-1 py-3 rounded-xl items-center justify-center shadow-md active:bg-[#B83760]"
        >
          <Text className="text-white text-xs font-black uppercase tracking-wider">
            Add to cart
          </Text>
        </TouchableOpacity>
      </View>

      {/* Celebratory In-App Toast */}
      {addedToastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
          <Text className="text-white text-xs font-bold">{addedToastMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 150
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 53, // Sits directly above the 5-button bottom nav bar
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 12
  },
  addToCartButton: {
    backgroundColor: '#C2477A',
    shadowColor: '#C2477A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  toastContainer: {
    position: 'absolute',
    bottom: 125,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 20
  }
});

export default ProductDetailScreen;
