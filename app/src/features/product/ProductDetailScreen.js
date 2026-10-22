import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getProductTiersForRole } from '../../utils/quantityTiersUtils';
import { isB2BRole } from '../../utils/b2bVerificationService';
import { getSafeImageUri, getSafeImageSource } from '../../utils/imageUtils';
import {
  getAddOnRecommendations,
  getRelevantProductRecommendations,
  getSafeProductShades
} from '../../utils/recommendationEngine';

export const ProductDetailScreen = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    activeProducts,
    userRole,
    userProfile,
    isB2BVerified,
    getRolePrice,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    setCurrentScreen,
    isFavorite,
    toggleFavorite,
    selectedShade: contextSelectedShade,
    setSelectedShade: setContextSelectedShade,
    recommendationConfig
  } = useApp();

  // Active shades and variants from product (robust parsing supporting string or array)
  const allSubProducts = useMemo(() => {
    let raw = selectedProduct?.shades || [];
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (!Array.isArray(raw)) raw = [];
    return raw.filter(s => s && s.active !== false);
  }, [selectedProduct?.shades]);

  // Distinguish between pure color shades and size/type variants
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
      } else if (hasHex || hasShadeAttr) {
        sList.push(item);
      } else {
        const cat = String(selectedProduct?.category || '').toLowerCase();
        if (cat.includes('lip') || cat.includes('makeup') || cat.includes('polish') || cat.includes('eye')) {
          sList.push(item);
        } else {
          vList.push(item);
        }
      }
    });

    return { shadeList: sList, variantList: vList };
  }, [allSubProducts, selectedProduct?.category]);

  const [selectedShade, setSelectedShade] = useState(() => {
    if (contextSelectedShade && allSubProducts.some(s => s.id === contextSelectedShade.id || s.name === contextSelectedShade.name)) {
      return contextSelectedShade;
    }
    return allSubProducts[0] || null;
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (contextSelectedShade && allSubProducts.some(s => s.id === contextSelectedShade.id || s.name === contextSelectedShade.name)) {
      setSelectedShade(contextSelectedShade);
    } else if (allSubProducts.length > 0) {
      if (!selectedShade || !allSubProducts.some(s => s.id === selectedShade.id || s.name === selectedShade.name)) {
        setSelectedShade(allSubProducts[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [selectedProduct?.id, contextSelectedShade, allSubProducts]);

  const handleSelectSubProduct = (item) => {
    setSelectedShade(item);
    if (setContextSelectedShade) setContextSelectedShade(item);
  };

  const productImages = useMemo(() => {
    const list = [];
    if (selectedShade?.image) {
      const safe = getSafeImageUri(selectedShade.image);
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
      list.push('https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400');
    }
    return list;
  }, [selectedProduct, selectedShade?.image]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct?.id, selectedShade?.id, selectedShade?.name]);

  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  if (!selectedProduct) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-sm font-bold text-[#3A2430] mb-2">No product selected.</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('category')} className="bg-[#C2477A] px-4 py-2 rounded-xl">
          <Text className="text-xs font-bold text-white">Return to Browse</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cartItemId = selectedShade ? `${selectedProduct.id}_${selectedShade.id || selectedShade.name}` : selectedProduct.id;
  const cartItem = (cart || []).find(c => (c.id || c.product?.id) === cartItemId);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const currentRolePrice = getRolePrice(selectedProduct, userRole, selectedShade, Math.max(1, cartQty));
  const displayMrp = selectedShade?.priceOverride && Number(selectedShade.priceOverride) > currentRolePrice
    ? Number(selectedShade.priceOverride)
    : (selectedProduct.mrp && selectedProduct.mrp > currentRolePrice ? Number(selectedProduct.mrp) : Math.round(currentRolePrice * 1.25));
  const hasDiscount = displayMrp > currentRolePrice;
  const savings = displayMrp - currentRolePrice;
  const discountPercent = Math.round((savings / displayMrp) * 100);

  const [quickShadeModalItem, setQuickShadeModalItem] = useState(null);
  const [selectedQuickShade, setSelectedQuickShade] = useState(null);
  const [addedToastMessage, setAddedToastMessage] = useState(null);
  const [locallyAddedIds, setLocallyAddedIds] = useState([]);

  useEffect(() => {
    if (addedToastMessage) {
      const timer = setTimeout(() => setAddedToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToastMessage]);

  useEffect(() => {
    setLocallyAddedIds([]);
  }, [selectedProduct?.id]);

  const addOnProducts = useMemo(() => {
    if (recommendationConfig?.enabled === false) return [];
    const recs = getAddOnRecommendations(selectedProduct, activeProducts, cart, {
      maxCount: (recommendationConfig?.maxAddOns || 8) + locallyAddedIds.length,
      frequentlyBoughtTogether: recommendationConfig?.frequentlyBoughtTogether !== false,
      popularProductsFallback: recommendationConfig?.popularProductsFallback !== false
    });
    return recs.filter(p => !locallyAddedIds.includes(p.id)).slice(0, recommendationConfig?.maxAddOns || 8);
  }, [selectedProduct, activeProducts, cart, recommendationConfig, locallyAddedIds]);

  const relevantProducts = useMemo(() => {
    if (recommendationConfig?.enabled === false) return [];
    const addOnIds = addOnProducts.map(p => p.id);
    return getRelevantProductRecommendations(selectedProduct, activeProducts, cart, {
      maxCount: recommendationConfig?.maxRelevant || 8,
      excludeIds: [...addOnIds, ...locallyAddedIds]
    });
  }, [selectedProduct, activeProducts, cart, recommendationConfig, addOnProducts, locallyAddedIds]);

  const handleAddOnPress = (product) => {
    const subItems = getSafeProductShades(product);
    if (subItems.length > 1) {
      setQuickShadeModalItem(product);
      setSelectedQuickShade(subItems[0]);
    } else {
      const chosenShade = subItems.length === 1 ? subItems[0] : null;
      addToCart(product, 1, chosenShade);
      setLocallyAddedIds(prev => [...prev, product.id]);
      setAddedToastMessage(`Added ${product.name} to cart! ✨`);
    }
  };

  const handleConfirmQuickShadeAdd = () => {
    if (!quickShadeModalItem) return;
    addToCart(quickShadeModalItem, 1, selectedQuickShade);
    setLocallyAddedIds(prev => [...prev, quickShadeModalItem.id]);
    setAddedToastMessage(`Added ${quickShadeModalItem.name}${selectedQuickShade ? ` (${selectedQuickShade.name})` : ''} to cart! ✨`);
    setQuickShadeModalItem(null);
    setSelectedQuickShade(null);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, 1, selectedShade);
    setAddedToastMessage(`Added ${selectedProduct.name}${selectedShade ? ` (${selectedShade.name})` : ''} to cart! ✨`);
  };

  const handleIncrement = () => {
    if (cartQty === 0) {
      addToCart(selectedProduct, 1, selectedShade);
    } else {
      updateCartQuantity(cartItemId, cartQty + 1);
    }
  };

  const handleDecrement = () => {
    if (cartQty > 1) {
      updateCartQuantity(cartItemId, cartQty - 1);
    } else if (cartQty === 1) {
      removeFromCart(cartItemId);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <View className="flex-1 bg-[#F4F5F8]">
      {/* 1. Transparent Floating Top Navigation Bar */}
      <View className="px-3 py-3 flex-row justify-between items-center z-30 absolute top-0 left-0 right-0">
        <TouchableOpacity
          onPress={() => setCurrentScreen('category')}
          className="w-10 h-10 rounded-full bg-white/80 items-center justify-center border border-white/50 shadow-sm"
        >
          <Text className="text-lg font-black text-[#3A2430]">←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => toggleFavorite(selectedProduct)}
          className="w-10 h-10 rounded-full bg-white/90 items-center justify-center border border-[#FCE4EC] shadow-sm"
        >
          <Ionicons
            name={isFavorite(selectedProduct?.id) ? "heart" : "heart-outline"}
            size={20}
            color="#C2477A"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingTop: 60, paddingBottom: 150 }} className="bg-[#F4F5F8]">
        {/* 2. Interactive Hero Image Slider & Dots */}
        <View className="bg-white p-4 rounded-2xl border border-gray-100 items-center mb-3 relative">
          <View className="w-full h-64 bg-white items-center justify-center relative">
            <Image
              source={getSafeImageSource(productImages[currentImageIndex])}
              className="w-full h-full object-contain"
            />
            {productImages.length > 1 && (
              <View className="absolute flex-row justify-between w-full px-1">
                <TouchableOpacity onPress={prevImage} className="w-8 h-8 rounded-full bg-white/90 items-center justify-center border border-gray-200">
                  <Text className="text-sm font-bold">‹</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextImage} className="w-8 h-8 rounded-full bg-white/90 items-center justify-center border border-gray-200">
                  <Text className="text-sm font-bold">›</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Dots */}
          <View className="flex-row items-center gap-2 mt-3">
            {productImages.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentImageIndex(idx)}
                className={`rounded-full ${
                  idx === currentImageIndex ? 'w-3 h-3 bg-[#C2477A]' : 'w-2 h-2 bg-gray-300'
                }`}
              />
            ))}
          </View>
        </View>

        {/* 3. Main Product Info Card */}
        <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 space-y-2">
          <View className="flex-row mb-1">
            <View className="bg-[#FCE4EC] px-2.5 py-0.5 rounded-full">
              <Text className="text-[9px] font-black text-[#C2477A] uppercase">{selectedProduct.brandName}</Text>
            </View>
          </View>

          <Text className="text-base font-extrabold text-[#3A2430] leading-snug">
            {selectedProduct.name}
          </Text>
          <Text className="text-xs font-bold text-[#8C7078]">
            {selectedProduct.category} • Net Vol. 500 ml / 15g
          </Text>

          <Text className="text-xs text-[#8C7078] leading-5 pt-1 border-t border-gray-100 mt-1">
            {selectedProduct.description || 'Professional grade cosmetic formulation designed for long-lasting, smudge-proof perfection.'}
          </Text>

          <View className="pt-2 flex-row items-baseline gap-2">
            <Text className="text-xs font-black text-[#8C7078] uppercase">MRP</Text>
            <Text className="text-xl font-black text-[#3A2430]">₹{currentRolePrice}</Text>
            {hasDiscount && (
              <Text className="text-xs text-[#8C7078] line-through font-semibold">
                ₹{displayMrp}
              </Text>
            )}
            {discountPercent > 0 && (
              <View className="bg-[#C2477A] px-2 py-0.5 rounded ml-1">
                <Text className="text-white text-[9.5px] font-black">{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          {/* Bulk Quantity Discounts — For all roles including General User, Salon Owner, Makeup Artist, and Beautician */}
          {(() => {
            const effectiveRole = (isB2BRole(userRole) && !isB2BVerified) ? 'general' : userRole;
            const roleTiers = getProductTiersForRole(selectedProduct, effectiveRole, selectedShade);
            if (!roleTiers || roleTiers.length === 0) return null;

            const roleName = effectiveRole === 'salon'
              ? 'Salon Owner'
              : effectiveRole === 'artist'
              ? 'Makeup Artist'
              : effectiveRole === 'beautician'
              ? 'Beautician'
              : 'General User';

            return (
              <View className="mt-3 pt-3 border-t border-pink-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase text-[#C2477A]">
                    Quantity Discount Tiers ({roleName})
                  </Text>
                  <Text className="text-[9.5px] text-gray-400">Buy more, save more</Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {roleTiers.map((tier, tIdx) => {
                    const tierUnitPrice = getRolePrice(selectedProduct, effectiveRole, selectedShade, Number(tier.minQty));
                    const isActive = cartQty >= Number(tier.minQty);
                    return (
                      <View
                        key={tier.id || tIdx}
                        className={`p-2 rounded-xl border items-center min-w-[70px] ${
                          isActive ? 'bg-[#FCE4EC] border-[#C2477A]' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text className="text-[10px] font-bold text-gray-800">{tier.minQty}+ units</Text>
                        <Text className="text-xs font-black text-gray-900 mt-0.5">₹{tierUnitPrice}</Text>
                        {Number(tier.additionalDiscount) > 0 ? (
                          <Text className="text-[9px] font-bold text-emerald-600">+{tier.additionalDiscount}% OFF</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}
        </View>

        {/* ── 4A. AVAILABLE SHADES (HORIZONTAL PRODUCT CARDS) ── */}
        {shadeList.length > 0 && (
          <View className="bg-white py-3.5 rounded-2xl border border-[#FCE4EC] mb-3 shadow-2xs">
            <View className="px-4 flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-lg bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                  <Ionicons name="color-palette" size={13} color="#C2477A" />
                </View>
                <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                  Available Shades
                </Text>
                <View className="bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                  <Text className="text-[10px] font-bold text-[#C2477A]">{shadeList.length}</Text>
                </View>
              </View>
              {selectedShade && shadeList.some(s => s.id === selectedShade.id || s.name === selectedShade.name) && (
                <View className="flex-row items-center gap-1.5 bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]">
                  <View
                    style={{ backgroundColor: selectedShade.hexColor || '#C2477A' }}
                    className="w-3 h-3 rounded-full border border-white shadow-2xs"
                  />
                  <Text className="text-[10.5px] font-bold text-[#C2477A]" numberOfLines={1}>
                    {selectedShade.name}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {shadeList.map((shade, idx) => {
                const isSelected = selectedShade && (selectedShade.id === shade.id || selectedShade.name === shade.name);
                const sPrice = getRolePrice(selectedProduct, userRole, shade, 1);
                const sMrp = shade.priceOverride && Number(shade.priceOverride) > sPrice
                  ? Number(shade.priceOverride)
                  : (selectedProduct.mrp && selectedProduct.mrp > sPrice ? Number(selectedProduct.mrp) : Math.round(sPrice * 1.25));

                return (
                  <TouchableOpacity
                    key={shade.id || idx}
                    activeOpacity={0.85}
                    onPress={() => handleSelectSubProduct(shade)}
                    className={`w-28 mr-2.5 rounded-2xl p-2 border transition-all ${
                      isSelected
                        ? 'bg-[#FFF5F8] border-[#C2477A] shadow-xs'
                        : 'bg-white border-[#FCE4EC]'
                    }`}
                  >
                    {/* Visual Thumbnail & Swatch Preview */}
                    <View className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 items-center justify-center">
                      <Image
                        source={getSafeImageSource(shade.image || selectedProduct.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300')}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />
                      {/* Swatch color bubble */}
                      {shade.hexColor ? (
                        <View
                          style={{ backgroundColor: shade.hexColor }}
                          className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                        />
                      ) : null}
                      {/* Selected badge */}
                      {isSelected ? (
                        <View className="absolute top-1.5 left-1.5 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center shadow-xs">
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>

                    {/* Shade Title */}
                    <Text
                      className={`text-[11px] font-bold leading-tight ${
                        isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'
                      }`}
                      numberOfLines={2}
                    >
                      {shade.name}
                    </Text>

                    {/* Price Info */}
                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-xs font-black text-[#C2477A]">₹{sPrice}</Text>
                      {sMrp > sPrice && (
                        <Text className="text-[9px] text-[#8C7078] line-through">₹{sMrp}</Text>
                      )}
                    </View>

                    {/* Selection button */}
                    <View className={`mt-1.5 py-0.5 rounded-full items-center justify-center ${
                      isSelected ? 'bg-[#C2477A]' : 'bg-[#FFF0F5] border border-[#FCE4EC]'
                    }`}>
                      <Text className={`text-[9px] font-bold ${
                        isSelected ? 'text-white' : 'text-[#C2477A]'
                      }`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 4B. AVAILABLE VARIANTS / SIZES (HORIZONTAL PRODUCT CARDS) ── */}
        {variantList.length > 0 && (
          <View className="bg-white py-3.5 rounded-2xl border border-[#FCE4EC] mb-3 shadow-2xs">
            <View className="px-4 flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-lg bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                  <Ionicons name="layers" size={13} color="#C2477A" />
                </View>
                <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                  Available Variants
                </Text>
                <View className="bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                  <Text className="text-[10px] font-bold text-[#C2477A]">{variantList.length}</Text>
                </View>
              </View>
              {selectedShade && variantList.some(v => v.id === selectedShade.id || v.name === selectedShade.name) && (
                <View className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]">
                  <Text className="text-[10.5px] font-bold text-[#C2477A]" numberOfLines={1}>
                    {selectedShade.name}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {variantList.map((variant, idx) => {
                const isSelected = selectedShade && (selectedShade.id === variant.id || selectedShade.name === variant.name);
                const vPrice = getRolePrice(selectedProduct, userRole, variant, 1);
                const vMrp = variant.priceOverride && Number(variant.priceOverride) > vPrice
                  ? Number(variant.priceOverride)
                  : (selectedProduct.mrp && selectedProduct.mrp > vPrice ? Number(selectedProduct.mrp) : Math.round(vPrice * 1.25));

                return (
                  <TouchableOpacity
                    key={variant.id || idx}
                    activeOpacity={0.85}
                    onPress={() => handleSelectSubProduct(variant)}
                    className={`w-28 mr-2.5 rounded-2xl p-2 border transition-all ${
                      isSelected
                        ? 'bg-[#FFF5F8] border-[#C2477A] shadow-xs'
                        : 'bg-white border-[#FCE4EC]'
                    }`}
                  >
                    <View className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 items-center justify-center">
                      <Image
                        source={getSafeImageSource(variant.image || selectedProduct.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300')}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />
                      {isSelected ? (
                        <View className="absolute top-1.5 left-1.5 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center shadow-xs">
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>

                    <Text
                      className={`text-[11px] font-bold leading-tight ${
                        isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'
                      }`}
                      numberOfLines={2}
                    >
                      {variant.name}
                    </Text>

                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-xs font-black text-[#C2477A]">₹{vPrice}</Text>
                      {vMrp > vPrice && (
                        <Text className="text-[9px] text-[#8C7078] line-through">₹{vMrp}</Text>
                      )}
                    </View>

                    <View className={`mt-1.5 py-0.5 rounded-full items-center justify-center ${
                      isSelected ? 'bg-[#C2477A]' : 'bg-[#FFF0F5] border border-[#FCE4EC]'
                    }`}>
                      <Text className={`text-[9px] font-bold ${
                        isSelected ? 'text-white' : 'text-[#C2477A]'
                      }`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 5. COMPLETE YOUR LOOK ✨ (AUTOMATIC ADD-ONS) ── */}
        {addOnProducts.length > 0 && (
          <View className="bg-white py-4 rounded-2xl border border-[#FCE4EC] mb-3 shadow-2xs">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-lg bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                  <Ionicons name="sparkles" size={13} color="#C2477A" />
                </View>
                <View>
                  <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    Complete Your Look ✨
                  </Text>
                  <Text className="text-[9.5px] text-[#8C7078]">
                    Complementary essentials for your routine
                  </Text>
                </View>
              </View>
              <View className="bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                <Text className="text-[10px] font-bold text-[#C2477A]">{addOnProducts.length}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {addOnProducts.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <View
                    key={p.id}
                    className="w-36 mr-3 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs flex-col justify-between"
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedProduct(p)}
                      className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 items-center justify-center"
                    >
                      <Image
                        source={getSafeImageSource(subItems[0]?.image || p.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300')}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />
                      {subItems.length > 1 && (
                        <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-md flex-row items-center gap-1">
                          <Ionicons name="color-palette" size={9} color="#FFF" />
                          <Text className="text-[8.5px] font-bold text-white">{subItems.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text className="text-[8.5px] font-extrabold text-[#C2477A] uppercase tracking-wider" numberOfLines={1}>
                        {p.brandName || p.category || 'Salbeau'}
                      </Text>
                      <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1" numberOfLines={2}>
                        {p.name}
                      </Text>

                      {subItems.length > 1 ? (
                        <Text className="text-[9px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 mb-1.5 self-start">
                          {subItems.length} shades available
                        </Text>
                      ) : subItems.length === 1 ? (
                        <Text className="text-[9px] font-medium text-[#8C7078] mb-1.5" numberOfLines={1}>
                          Shade: {subItems[0].name}
                        </Text>
                      ) : (
                        <Text className="text-[9px] font-medium text-[#8C7078] mb-1.5" numberOfLines={1}>
                          {p.category || 'Standard'}
                        </Text>
                      )}

                      <View className="flex-row items-baseline gap-1 mb-2">
                        <Text className="text-xs font-black text-[#C2477A]">₹{pPrice}</Text>
                        {pMrp > pPrice && (
                          <Text className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleAddOnPress(p)}
                      className="w-full py-1.5 rounded-xl bg-[#C2477A] active:bg-[#a83765] flex-row items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ionicons name="add" size={12} color="#FFFFFF" />
                      <Text className="text-[10px] font-black text-white">
                        {subItems.length > 1 ? '+ Select' : '+ Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 6. YOU MAY ALSO LIKE 💜 (RELEVANT PRODUCTS) ── */}
        {relevantProducts.length > 0 && (
          <View className="bg-white py-4 rounded-2xl border border-[#FCE4EC] mb-3 shadow-2xs">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-lg bg-[#F3E5F5] items-center justify-center border border-[#E1BEE7]">
                  <Ionicons name="heart" size={13} color="#8E24AA" />
                </View>
                <View>
                  <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    You May Also Like 💜
                  </Text>
                  <Text className="text-[9.5px] text-[#8C7078]">
                    Similar formulations and alternative favorites
                  </Text>
                </View>
              </View>
              <View className="bg-[#F3E5F5] px-2 py-0.5 rounded-full border border-[#E1BEE7]">
                <Text className="text-[10px] font-bold text-[#8E24AA]">{relevantProducts.length}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {relevantProducts.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedProduct(p)}
                    className="w-36 mr-3 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs"
                  >
                    <View className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 items-center justify-center">
                      <Image
                        source={getSafeImageSource(p.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400')}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />
                      {subItems.length > 1 && (
                        <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-md flex-row items-center gap-1">
                          <Ionicons name="color-palette" size={9} color="#FFF" />
                          <Text className="text-[8.5px] font-bold text-white">{subItems.length}</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-[8.5px] font-extrabold text-[#8C7078] uppercase tracking-wider" numberOfLines={1}>
                      {p.brandName || p.category}
                    </Text>
                    <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1" numberOfLines={2}>
                      {p.name}
                    </Text>

                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-xs font-black text-[#C2477A]">₹{pPrice}</Text>
                      {pMrp > pPrice && (
                        <Text className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</Text>
                      )}
                    </View>

                    <View className="mt-2 py-1 rounded-xl bg-[#FFF0F5] border border-[#FCE4EC] items-center justify-center">
                      <Text className="text-[9.5px] font-bold text-[#C2477A]">
                        View Details
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── 7. FLOATING SUCCESS TOAST ── */}
      {addedToastMessage && (
        <View style={{ top: 56 }} className="absolute left-4 right-4 z-50 bg-[#3A2430] py-2.5 px-4 rounded-2xl flex-row items-center justify-between shadow-2xl border border-[#C2477A]/40">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <Ionicons name="sparkles" size={16} color="#FCE4EC" />
            <Text className="text-white text-xs font-bold" numberOfLines={1}>
              {addedToastMessage}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAddedToastMessage(null)}>
            <Ionicons name="close-circle" size={18} color="#FCE4EC" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 8. QUICK SHADE SELECTION MODAL FOR ADD-ONS ── */}
      {quickShadeModalItem && (
        <Modal
          transparent
          visible={Boolean(quickShadeModalItem)}
          animationType="slide"
          onRequestClose={() => setQuickShadeModalItem(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl border-t border-[#FCE4EC] p-5 shadow-2xl max-h-[80%]">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-[#FCE4EC]">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                    <Ionicons name="sparkles" size={15} color="#C2477A" />
                  </View>
                  <View>
                    <Text className="text-xs font-black text-[#3A2430] uppercase">Select Your Shade</Text>
                    <Text className="text-[10px] text-[#8C7078] max-w-[220px]" numberOfLines={1}>
                      {quickShadeModalItem.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setQuickShadeModalItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#3A2430" />
                </TouchableOpacity>
              </View>

              {/* Selected Shade Preview */}
              {selectedQuickShade && (
                <View className="flex-row items-center gap-3 bg-[#FFF5F8] p-3 rounded-2xl border border-[#FCE4EC] my-3">
                  <Image
                    source={getSafeImageSource(selectedQuickShade.image || quickShadeModalItem.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300')}
                    className="w-12 h-12 rounded-xl object-cover border border-[#FCE4EC]"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      {selectedQuickShade.hexColor && (
                        <View
                          style={{ backgroundColor: selectedQuickShade.hexColor }}
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        />
                      )}
                      <Text className="text-xs font-extrabold text-[#3A2430]">
                        {selectedQuickShade.name}
                      </Text>
                    </View>
                    <Text className="text-sm font-black text-[#C2477A] mt-0.5">
                      ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Shades Horizontal List */}
              <Text className="text-[10px] font-black text-[#8C7078] uppercase tracking-wider mb-2">
                Available Options ({getSafeProductShades(quickShadeModalItem).length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
                {getSafeProductShades(quickShadeModalItem).map((shade, idx) => {
                  const isSel = selectedQuickShade && (selectedQuickShade.id === shade.id || selectedQuickShade.name === shade.name);
                  const sPrice = getRolePrice(quickShadeModalItem, userRole, shade, 1);
                  return (
                    <TouchableOpacity
                      key={shade.id || idx}
                      activeOpacity={0.85}
                      onPress={() => setSelectedQuickShade(shade)}
                      className={`mr-2.5 p-2 rounded-2xl border items-center w-24 ${
                        isSel ? 'bg-[#FFF0F5] border-[#C2477A]' : 'bg-white border-[#FCE4EC]'
                      }`}
                    >
                      <View className="relative w-16 h-16 rounded-xl overflow-hidden mb-1 bg-[#FFF5F8] items-center justify-center">
                        <Image
                          source={getSafeImageSource(shade.image || quickShadeModalItem.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200')}
                          className="w-full h-full object-cover"
                        />
                        {shade.hexColor && (
                          <View
                            style={{ backgroundColor: shade.hexColor }}
                            className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white"
                          />
                        )}
                        {isSel && (
                          <View className="absolute top-1 left-1 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text className={`text-[10px] font-bold text-center ${isSel ? 'text-[#C2477A]' : 'text-[#3A2430]'}`} numberOfLines={1}>
                        {shade.name}
                      </Text>
                      <Text className="text-[10px] font-black text-[#C2477A] mt-0.5">₹{sPrice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Confirm Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmQuickShadeAdd}
                className="w-full py-3.5 rounded-2xl bg-[#C2477A] items-center justify-center shadow-md flex-row gap-2"
              >
                <Ionicons name="bag-add" size={16} color="#FFFFFF" />
                <Text className="text-xs font-black text-white uppercase tracking-wider">
                  Add {selectedQuickShade ? selectedQuickShade.name : 'Selected'} To Bag • ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 9. Fixed Bottom Action Bar */}
      <View style={{ bottom: 53 }} className="absolute left-0 right-0 bg-white border-t border-gray-200 p-3 flex-row items-center justify-between shadow-2xl z-20">
        <View className="flex-col">
          <Text className="text-[10px] text-[#8C7078] font-bold">
            {selectedShade ? `Shade: ${selectedShade.name}` : '500 ml / 1 Unit'}
          </Text>
          <Text className="text-base font-black text-[#3A2430]">₹{currentRolePrice * (cartQty || 1)}</Text>
          <Text className="text-[8.5px] text-[#8C7078]">Inclusive of all taxes</Text>
        </View>

        {/* Action Button */}
        {cartQty > 0 ? (
          <View className="bg-[#C2477A] rounded-xl px-4 py-2.5 flex-row items-center gap-3">
            <TouchableOpacity onPress={handleDecrement}>
              <Text className="text-white text-base font-black px-1">-</Text>
            </TouchableOpacity>
            <Text className="text-sm font-black text-white px-1">{cartQty}</Text>
            <TouchableOpacity onPress={handleIncrement}>
              <Text className="text-white text-base font-black px-1">+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAddToCart}
            className="px-7 py-3 rounded-xl bg-[#C2477A]"
          >
            <Text className="text-white text-xs font-black">
              Add to cart
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
