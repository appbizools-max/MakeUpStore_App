import { cleanProductDisplayName } from '../../utils/productDisplayNameUtils';
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
 * Hierarchy matching Nykaa & Purplle Beauty Standards:
 * 1. Top navigation with Back, Share, Search, & Cart (with badge)
 * 2. Large product image carousel with discount badge & bottom-center pagination dots
 * 3. Product title and description with bold black typography
 * 4. Price and rating layout (Selling price, strikethrough MRP, green discount tag)
 * 5. Compact horizontal shade selector with rounded-square swatches & "All Shades >" trigger
 * 6. Non-sticky in-flow purchase bar with Multi-Quantity stepper, Add to Bag, and Wishlist
 * 7. "More Products from [Brand]" horizontal carousel
 * 8. Quantity discount tiers
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
    updateCartQuantity,
    removeFromCart,
    cart = [],
    setCurrentScreen,
    isFavorite,
    toggleFavorite,
    selectedShade: contextSelectedShade,
    setSelectedShade: setContextSelectedShade,
    openShadeSheet,
    rememberSelectedShade,
    lastSelectedShades = {}
  } = useApp();

  // Resolve true parent product and sibling variants (Nykaa 2-level hierarchy)
  const effectiveProduct = useMemo(() => {
    return (selectedProduct?.isVariantChild && selectedProduct?.parentProduct)
      ? selectedProduct.parentProduct
      : (selectedProduct || {});
  }, [selectedProduct]);

  // Extract all active, valid shades from parent
  const allSubProducts = useMemo(() => {
    return getSafeProductShadesList(effectiveProduct);
  }, [effectiveProduct]);

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

  // Track product ID to prevent shade reset on incidental re-renders
  const activeProductIdRef = useRef(effectiveProduct?.id);

  // Robust shade resolver matching Nykaa specification
  const resolveInitialShade = useCallback(() => {
    // 1. Clicked variant child from navigation
    if (selectedProduct?.isVariantChild && selectedProduct?.variantData) {
      const match = allSubProducts.find(s =>
        (s.id && selectedProduct.variantData.id && String(s.id) === String(selectedProduct.variantData.id)) ||
        (s.name && selectedProduct.variantData.name && s.name.toLowerCase() === selectedProduct.variantData.name.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Remembered shade for this product from AppContext
    const remembered = lastSelectedShades?.[effectiveProduct?.id];
    if (remembered) {
      const match = allSubProducts.find(s =>
        (s.id && remembered.id && String(s.id) === String(remembered.id)) ||
        (s.name && remembered.name && s.name.toLowerCase() === remembered.name.toLowerCase())
      );
      if (match) return match;
    }

    // 3. Context selected shade
    if (contextSelectedShade) {
      const match = allSubProducts.find(s =>
        (s.id && contextSelectedShade.id && String(s.id) === String(contextSelectedShade.id)) ||
        (s.name && contextSelectedShade.name && s.name.toLowerCase() === contextSelectedShade.name.toLowerCase())
      );
      if (match) return match;
    }

    // 4. Default to first available shade
    return allSubProducts[0] || null;
  }, [selectedProduct, effectiveProduct?.id, allSubProducts, lastSelectedShades, contextSelectedShade]);

  // Active shade state
  const [selectedShade, setSelectedShade] = useState(resolveInitialShade);
  // Quantity selector state for multi-product addition
  const [selectedQty, setSelectedQty] = useState(1);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryScrollRef = useRef(null);
  const [addedToastMessage, setAddedToastMessage] = useState(null);

  // Sync selected shade ONLY when switching to a DIFFERENT product
  useEffect(() => {
    if (activeProductIdRef.current !== effectiveProduct?.id) {
      activeProductIdRef.current = effectiveProduct?.id;
      const initial = resolveInitialShade();
      setSelectedShade(initial);
      setSelectedQty(1);
    }
  }, [effectiveProduct?.id, resolveInitialShade]);

  // Toast auto-dismiss
  useEffect(() => {
    if (addedToastMessage) {
      const timer = setTimeout(() => setAddedToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToastMessage]);

  const handleSelectSubProduct = (item) => {
    if (!item) return;
    setSelectedShade(item);
    if (setContextSelectedShade) setContextSelectedShade(item);
    if (rememberSelectedShade && effectiveProduct?.id) {
      rememberSelectedShade(effectiveProduct.id, item);
    }
  };

  // Compile high-res gallery images: variant images first, then parent images
  const productImages = useMemo(() => {
    const list = [];
    if (selectedShade?.images && Array.isArray(selectedShade.images) && selectedShade.images.length > 0) {
      selectedShade.images.forEach(img => {
        const safe = getSafeImageUri(img);
        if (safe && !list.includes(safe)) list.push(safe);
      });
    }
    const shadeImg = selectedShade?.imageUrl || selectedShade?.image || selectedShade?.image_url;
    if (shadeImg) {
      const safe = getSafeImageUri(shadeImg);
      if (safe && !list.includes(safe)) list.push(safe);
    }
    if (effectiveProduct?.images && effectiveProduct.images.length > 0) {
      effectiveProduct.images.forEach(img => {
        const safe = getSafeImageUri(img);
        if (safe && !list.includes(safe)) list.push(safe);
      });
    } else if (effectiveProduct?.image) {
      const safe = getSafeImageUri(effectiveProduct.image);
      if (safe && !list.includes(safe)) list.push(safe);
    }
    if (list.length === 0) {
      list.push('');
    }
    return list;
  }, [effectiveProduct, selectedShade]);

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

  // Cart information for the CURRENTLY selected shade
  const cartItemId = getCartKey(effectiveProduct?.id || selectedProduct?.id, selectedShade);
  const cartItem = (cart || []).find(c => c.id === cartItemId);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const cartBadgeCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Dynamic pricing
  const currentRolePrice = getRolePrice(selectedProduct, userRole, selectedShade, selectedQty);
  const rawShadeMrp = selectedShade?.mrp ?? selectedShade?.priceOverride ?? selectedShade?.price_override ?? selectedShade?.price ?? selectedProduct?.mrp;
  const displayMrp = (rawShadeMrp && Number(rawShadeMrp) > currentRolePrice)
    ? Number(rawShadeMrp)
    : (selectedProduct?.mrp && Number(selectedProduct.mrp) > currentRolePrice ? Number(selectedProduct.mrp) : Math.round(currentRolePrice * 1.25));
  const hasDiscount = displayMrp > currentRolePrice;
  const savings = displayMrp - currentRolePrice;
  const discountPercent = hasDiscount ? Math.round((savings / displayMrp) * 100) : 0;

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

  // Add to Cart Action: Adds selectedQty units of the active shade
  const handleAddToCart = () => {
    addToCart(effectiveProduct || selectedProduct, selectedQty, selectedShade);
    const shadeTitle = selectedShade?.name || selectedShade?.title || '';
    setAddedToastMessage(`Added ${selectedQty}x ${(effectiveProduct || selectedProduct).name}${shadeTitle ? ` (${shadeTitle})` : ''} to bag! ✨`);
    if (rememberSelectedShade && effectiveProduct?.id && selectedShade) {
      rememberSelectedShade(effectiveProduct.id, selectedShade);
    }
  };

  const isLiked = isFavorite ? isFavorite(selectedProduct?.id) : false;

  // Display only: Product Name – Variant Name (Strict Nykaa Specification)
  const fullTitle = useMemo(() => {
    const parentName = (selectedProduct.name || selectedProduct.title || '').trim();
    const variantName = (
      selectedShade?.name ||
      selectedShade?.title ||
      selectedShade?.shade ||
      selectedProduct.variantName ||
      selectedProduct.variant ||
      selectedProduct.size ||
      ''
    ).trim();

    if (variantName && variantName.toLowerCase() !== parentName.toLowerCase()) {
      return `${parentName} – ${variantName}`;
    }
    return parentName;
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

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 6. NORMAL IN-FLOW PURCHASE & MULTI-PRODUCT CART MANAGEMENT */}
        {/* ───────────────────────────────────────────────────────────── */}
        <View className="px-4 py-4 bg-white border-b border-[#F0F0F0]">
          {/* Row 1: Quantity Stepper & In-Cart Counter */}
          <View className="flex-row items-center justify-between mb-3 bg-[#FFF8FA] p-3 rounded-2xl border border-[#F8D7E6]">
            <View>
              <Text className="text-xs font-extrabold text-[#1F2937]">Select Quantity</Text>
              <Text className="text-[10.5px] text-[#8C7078] mt-0.5">
                {cartQty > 0
                  ? `✨ ${cartQty} units already in your bag`
                  : 'Add multiple units as needed'}
              </Text>
            </View>

            {/* Stepper: [-] Qty [+] */}
            <View className="flex-row items-center bg-white rounded-xl border border-[#F0E3EA] p-1 shadow-2xs">
              <TouchableOpacity
                onPress={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                className="w-7 h-7 rounded-lg bg-[#FFF0F5] items-center justify-center"
              >
                <Ionicons name="remove" size={15} color="#C2477A" />
              </TouchableOpacity>

              <Text className="text-sm font-black text-[#1F2937] px-3.5 min-w-[34px] text-center">
                {selectedQty}
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedQty(prev => prev + 1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                className="w-7 h-7 rounded-lg bg-[#FFF0F5] items-center justify-center"
              >
                <Ionicons name="add" size={15} color="#C2477A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Wishlist + Add to Bag CTA */}
          <View className="flex-row items-center gap-3">
            {/* Wishlist Button */}
            <TouchableOpacity
              onPress={() => toggleFavorite(selectedProduct)}
              activeOpacity={0.8}
              className="flex-row items-center justify-center gap-1.5 px-4 h-12 rounded-xl bg-white border border-[#E8E8E8] shadow-2xs"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={19}
                color={isLiked ? "#C2477A" : "#171717"}
              />
              <Text className="text-xs font-bold text-[#171717]">Wishlist</Text>
            </TouchableOpacity>

            {/* Add to Cart CTA */}
            <TouchableOpacity
              onPress={handleAddToCart}
              activeOpacity={0.85}
              style={styles.addToCartButton}
              className="flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:bg-[#B83760]"
            >
              <Ionicons name="bag-handle" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-black uppercase tracking-wider">
                {cartQty > 0
                  ? `Add ${selectedQty} More to Bag`
                  : `Add to Bag • ₹${currentRolePrice * selectedQty}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional Direct Shortcut to Bag */}
          {cartQty > 0 && (
            <TouchableOpacity
              onPress={() => setCurrentScreen('cart')}
              activeOpacity={0.75}
              className="mt-2.5 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FFF0F5] border border-[#F8B4D9]"
            >
              <Ionicons name="checkmark-circle" size={15} color="#C2477A" />
              <Text className="text-xs font-extrabold text-[#C2477A]">
                {cartQty} {cartQty === 1 ? 'unit' : 'units'} in Bag • View Bag & Checkout ↗
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Manual Description */}
        {(() => {
          const desc = String(effectiveProduct?.description || selectedProduct?.description || '').trim();
          if (!desc) return null;
          return (
            <View className="px-4 py-3 bg-white border-b border-[#F0F0F0]">
              <Text className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                Description
              </Text>
              <Text className="text-xs text-gray-700 leading-relaxed font-normal">
                {desc}
              </Text>
            </View>
          );
        })()}

        {/* Dynamic Master Attributes */}
        {(() => {
          const rawAttrs = effectiveProduct?.attributes || selectedProduct?.attributes || selectedShade?.attributes;
          if (!rawAttrs || typeof rawAttrs !== 'object' || Object.keys(rawAttrs).length === 0) return null;
          const validEntries = Object.entries(rawAttrs).filter(([_, v]) => v !== undefined && v !== null && String(v).trim().length > 0);
          if (validEntries.length === 0) return null;

          return (
            <View className="px-4 py-3 bg-white border-b border-[#F0F0F0]">
              <Text className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                Product Specifications
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {validEntries.map(([k, v]) => (
                  <View key={k} className="px-2.5 py-1 rounded-lg bg-pink-50/70 border border-pink-100 flex-row items-center gap-1">
                    <Text className="text-[10px] font-bold text-gray-500 uppercase">{k}:</Text>
                    <Text className="text-[10.5px] font-black text-[#C2477A]">{String(v)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* 7. MORE PRODUCTS FROM THE SAME BRAND */}
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
                    <View className="bg-white px-2 py-0.5 rounded-full mb-1">
                      <Text className="text-[9px] font-bold text-[#C2477A]">
                        {promoBadge}
                      </Text>
                    </View>

                    <View className="w-20 h-20 items-center justify-center my-1">
                      <Image
                        source={getSafeImageSource(item.image, '')}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    </View>

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

        {/* 8. Quantity Discount Tiers */}
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
                        isActive ? 'bg-white border-[#C2477A]' : 'bg-white border-slate-200'
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
    paddingBottom: 40
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
    bottom: 24,
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
