import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getSafeImageSource } from '../utils/imageUtils';
import { getCartKey, getSafeProductShadesList } from '../utils/cartKeyUtils';
import { cleanProductDisplayName } from '../utils/productDisplayNameUtils';

export const PurplleProductCard = ({
  product,
  cardWidth,
  userRole,
  getRolePrice,
  cartQuantityMap,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  isFavorite,
  toggleFavorite,
  onPressProduct,
  onOpenShadeSheet,
  className = '',
  style = {}
}) => {
  const appCtx = useApp() || {};
  const openShadeSheet = appCtx.openShadeSheet;
  // Extract all active, valid shades
  const shades = useMemo(() => {
    return getSafeProductShadesList(product);
  }, [product]);

  const hasShades = shades.length > 0;

  // Purplle rule: First shade is selected by default
  const [selectedShade, setSelectedShade] = useState(() => {
    return hasShades ? shades[0] : null;
  });

  // Keep selectedShade in sync if product changes
  React.useEffect(() => {
    if (hasShades) {
      if (!selectedShade || !shades.some(s => (s.id || s.name) === (selectedShade.id || selectedShade.name))) {
        setSelectedShade(shades[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [product?.id, hasShades, shades]);

  // Purplle rule: Active cartKey belongs STRICTLY to selected shade (or parent if no shades)
  const currentCartKey = useMemo(() => {
    return getCartKey(product?.id, hasShades ? selectedShade : null);
  }, [product?.id, hasShades, selectedShade]);

  // Counter strictly looks up currentCartKey
  const currentQty = (cartQuantityMap && currentCartKey)
    ? (cartQuantityMap.get(currentCartKey) || 0)
    : 0;

  // Dynamic price & MRP based on currently selected shade
  const rolePrice = useMemo(() => {
    if (typeof getRolePrice === 'function') {
      return getRolePrice(product, userRole, selectedShade, 1);
    }
    return product?.generalPrice || product?.mrp || 0;
  }, [product, userRole, selectedShade, getRolePrice]);

  const mrp = useMemo(() => {
    if (selectedShade?.priceOverride && Number(selectedShade.priceOverride) > rolePrice) {
      return Number(selectedShade.priceOverride);
    }
    if (product?.mrp && Number(product.mrp) > rolePrice) {
      return Number(product.mrp);
    }
    return Math.round(rolePrice * 1.25);
  }, [product?.mrp, selectedShade?.priceOverride, rolePrice]);

  const discountPercent = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;

  // Active image: updates if selected shade has an image
  const displayImage = selectedShade?.image || selectedShade?.imageUrl || product?.image;

  // Cart actions strictly pass currentCartKey & selectedShade
  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (addToCart) {
      addToCart(product, 1, hasShades ? selectedShade : null);
    }
  };

  const handleIncrement = (e) => {
    e?.stopPropagation?.();
    if (updateCartQuantity && currentCartKey) {
      updateCartQuantity(currentCartKey, currentQty + 1);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation?.();
    if (currentQty > 1) {
      if (updateCartQuantity && currentCartKey) {
        updateCartQuantity(currentCartKey, currentQty - 1);
      }
    } else if (currentQty === 1) {
      if (removeFromCart && currentCartKey) {
        removeFromCart(currentCartKey);
      }
    }
  };

  const isLiked = isFavorite ? isFavorite(product?.id) : false;

  const handleOpenShades = (e) => {
    e?.stopPropagation?.();
    if (onOpenShadeSheet) {
      onOpenShadeSheet(product, selectedShade);
    } else if (openShadeSheet) {
      openShadeSheet(product, selectedShade);
    }
  };


  return (
    <View
      style={[{ width: cardWidth }, style]}
      className={`bg-white rounded-2xl p-2.5 shadow-2xs border border-gray-100 justify-between ${className}`}
    >
      {/* 1. PRODUCT IMAGE & WISHLIST */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPressProduct?.(product, selectedShade)}
      >
        <View className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-[#FAFAFA] border border-gray-100 items-center justify-center p-2">
          <Image
            source={getSafeImageSource(displayImage, '')}
            style={{ width: '92%', height: '92%' }}
            resizeMode="contain"
          />

          {discountPercent > 0 && (
            <View className="absolute top-1.5 left-1.5 bg-[#C2477A] px-1.5 py-0.5 rounded shadow-2xs">
              <Text className="text-white text-[8px] font-black">{discountPercent}% OFF</Text>
            </View>
          )}

          {toggleFavorite && (
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                toggleFavorite(product);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="absolute top-1.5 right-1.5 p-1 items-center justify-center bg-transparent z-10"
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color="#C2477A"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. BRAND & TITLE */}
        <Text className="text-[8px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5" numberOfLines={1}>
          {product?.brandName || product?.brand || 'SALBEAU'}
        </Text>
        <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1 min-h-[30px]" numberOfLines={2}>
          {cleanProductDisplayName(product?.name)}
        </Text>
      </TouchableOpacity>

      {/* 3. PURPLLE SHADE DOTS / CHIPS (Interactive) */}
      {hasShades ? (
        <View className="mb-2">
          <TouchableOpacity
            onPress={handleOpenShades}
            activeOpacity={0.7}
            className="flex-row items-center justify-between mb-1"
          >
            <View className="flex-row items-center gap-1">
              <Text className="text-[8.5px] font-extrabold text-[#C2477A]" numberOfLines={1}>
                {shades.length} Shades
              </Text>
              <Ionicons name="chevron-down" size={9} color="#C2477A" />
            </View>
            <Text className="text-[8.5px] font-bold text-[#8C7078] max-w-[90px]" numberOfLines={1}>
              {selectedShade?.name || selectedShade?.title || ''}
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-row py-0.5"
          >
            {shades.map((shade, idx) => {
              const isSelected = selectedShade && (
                (selectedShade.id && shade.id && selectedShade.id === shade.id) ||
                (selectedShade.name && shade.name && selectedShade.name === shade.name)
              );
              const colorHex = shade.hexColor || shade.hex_color || '#C2477A';

              return (
                <TouchableOpacity
                  key={shade.id || shade.name || idx}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setSelectedShade(shade);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  className="mr-1.5 items-center justify-center p-0.5"
                >
                  <View
                    style={{
                      backgroundColor: colorHex,
                      borderColor: isSelected ? '#C2477A' : '#E5E7EB',
                      borderWidth: isSelected ? 2 : 1,
                      transform: [{ scale: isSelected ? 1.15 : 1.0 }]
                    }}
                    className="w-4 h-4 rounded-full shadow-2xs items-center justify-center"
                  >
                    {isSelected && (
                      <View className="w-1 h-1 rounded-full bg-white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View className="h-2" />
      )}

      {/* 4. PRICE & SELECTED SHADE CART STEPPER / ADD BUTTON */}
      <View className="flex-row items-center justify-between pt-1 border-t border-gray-100 mt-auto">
        <View>
          {mrp > rolePrice && (
            <Text className="text-[8.5px] font-semibold text-[#8C7078] line-through">
              ₹{mrp}
            </Text>
          )}
          <Text className="text-xs font-black text-[#C2477A]">₹{rolePrice}</Text>
        </View>

        <View>
          {hasShades ? (
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={handleOpenShades}
                activeOpacity={0.85}
                className="flex-row items-center gap-1 px-2 py-1 rounded-lg border border-[#C2477A] bg-white shadow-2xs active:bg-[#FCE4EC]"
              >
                <Text className="text-[#C2477A] text-[9.5px] font-black uppercase tracking-wider">
                  Select Shade
                </Text>
                <Ionicons name="chevron-down" size={10} color="#C2477A" />
              </TouchableOpacity>

              {currentQty > 0 && (
                <View className="bg-[#C2477A] rounded-lg px-1.5 py-0.5 flex-row items-center gap-0.5 shadow-2xs">
                  <TouchableOpacity
                    onPress={handleDecrement}
                    className="w-3.5 h-3.5 items-center justify-center"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="text-white text-xs font-black">-</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-[10px] font-extrabold px-0.5 min-w-[10px] text-center">
                    {currentQty}
                  </Text>
                  <TouchableOpacity
                    onPress={handleIncrement}
                    className="w-3.5 h-3.5 items-center justify-center"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="text-white text-xs font-black">+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : currentQty > 0 ? (
            <View className="bg-[#C2477A] rounded-lg px-1.5 py-0.5 flex-row items-center gap-1 shadow-2xs">
              <TouchableOpacity
                onPress={handleDecrement}
                className="w-4 h-4 items-center justify-center"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text className="text-white text-xs font-black">-</Text>
              </TouchableOpacity>
              <Text className="text-white text-[10px] font-extrabold px-0.5 min-w-[12px] text-center">
                {currentQty}
              </Text>
              <TouchableOpacity
                onPress={handleIncrement}
                className="w-4 h-4 items-center justify-center"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text className="text-white text-xs font-black">+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.85}
              className="px-2.5 py-1 rounded-lg border border-[#C2477A] bg-white shadow-2xs active:bg-[#FFF0F5]"
            >
              <Text className="text-[#C2477A] text-[9.5px] font-extrabold">+ ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

