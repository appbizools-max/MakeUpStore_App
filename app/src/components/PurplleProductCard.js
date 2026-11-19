import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSafeImageSource } from '../utils/imageUtils';
import { getCartKey, getSafeProductShadesList } from '../utils/cartKeyUtils';
import { cleanProductDisplayName } from '../utils/productDisplayNameUtils';

export const PurplleProductCard = React.memo(({
  product,
  cardWidth,
  userRole,
  getRolePrice,
  cart = [],
  cartQuantityMap,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  isFavorite,
  toggleFavorite,
  onPressProduct,
  onOpenShadeSheet,
  rememberSelectedShade,
  setSelectedShade: setGlobalSelectedShade,
  className = '',
  style = {}
}) => {
  const openShadeSheet = onOpenShadeSheet;
  // Extract all active, valid shades
  const shades = useMemo(() => {
    return getSafeProductShadesList(product);
  }, [product]);

  const hasShades = shades.length > 0;

  // Nykaa/Purplle rule: Variant-specific card initializes with its specific variant
  const [selectedShade, setSelectedShade] = useState(() => {
    if (product?.isVariantChild && product?.variantData) {
      return product.variantData;
    }
    return hasShades ? shades[0] : null;
  });

  // Keep selectedShade in sync if product changes
  React.useEffect(() => {
    if (product?.isVariantChild && product?.variantData) {
      setSelectedShade(product.variantData);
    } else if (hasShades) {
      if (!selectedShade || !shades.some(s => (s.id || s.name) === (selectedShade.id || selectedShade.name))) {
        setSelectedShade(shades[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [product?.id, product?.realVariantId, hasShades, shades]);

  // Active cartKey belongs STRICTLY to selected shade (or parent if no shades)
  const effectiveParentId = product?.parentProduct?.id || product?.parentProductId || product?.id;
  const currentCartKey = useMemo(() => {
    return getCartKey(effectiveParentId, hasShades ? selectedShade : (product?.variantData || null));
  }, [effectiveParentId, hasShades, selectedShade, product?.variantData]);

  // Resolve existing matching cart item if already in bag
  const existingCartItem = useMemo(() => {
    const cartList = cart || [];
    if (!Array.isArray(cartList) || cartList.length === 0) return null;
    const pid = effectiveParentId || product?.id;
    if (hasShades && selectedShade) {
      const targetKey = getCartKey(pid, selectedShade);
      const exact = cartList.find(item => item && item.id === targetKey);
      if (exact) return exact;
    }
    return cartList.find(item => {
      if (!item) return false;
      const itemPid = item.product?.id || item.productId;
      return String(itemPid) === String(pid);
    }) || null;
  }, [cart, effectiveParentId, product?.id, hasShades, selectedShade]);

  const activeCartKey = existingCartItem ? existingCartItem.id : currentCartKey;

  // Counter looks up existing item or cartQuantityMap
  const currentQty = useMemo(() => {
    if (existingCartItem && typeof existingCartItem.quantity === 'number') {
      return existingCartItem.quantity;
    }
    if (!cartQuantityMap) return 0;
    if (activeCartKey && cartQuantityMap.has(activeCartKey)) {
      return cartQuantityMap.get(activeCartKey) || 0;
    }
    const pid = effectiveParentId || product?.id;
    if (pid && cartQuantityMap.has(String(pid))) {
      return cartQuantityMap.get(String(pid)) || 0;
    }
    return 0;
  }, [existingCartItem, cartQuantityMap, activeCartKey, effectiveParentId, product?.id]);

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
    if (selectedShade?.mrp && Number(selectedShade.mrp) > rolePrice) {
      return Number(selectedShade.mrp);
    }
    if (product?.mrp && Number(product.mrp) > rolePrice) {
      return Number(product.mrp);
    }
    return rolePrice;
  }, [product?.mrp, selectedShade?.priceOverride, selectedShade?.mrp, rolePrice]);

  const discountPercent = (mrp > rolePrice && mrp > 0) ? Math.round(((mrp - rolePrice) / mrp) * 100) : 0;

  // Active image: updates if selected shade has an image or variant has its own image
  const displayImage = product?.isVariantChild
    ? (product.image || product.imageUrl || selectedShade?.image || selectedShade?.imageUrl)
    : (selectedShade?.image || selectedShade?.imageUrl || product?.image);

  // Cart actions strictly pass activeCartKey & selectedShade
  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (addToCart) {
      addToCart(product, 1, hasShades ? selectedShade : null);
    }
  };

  const handleIncrement = (e) => {
    e?.stopPropagation?.();
    const key = activeCartKey || currentCartKey;
    if (updateCartQuantity && key) {
      updateCartQuantity(key, currentQty + 1);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation?.();
    const key = activeCartKey || currentCartKey;
    if (currentQty > 1) {
      if (updateCartQuantity && key) {
        updateCartQuantity(key, currentQty - 1);
      }
    } else if (currentQty === 1) {
      if (removeFromCart && key) {
        removeFromCart(key);
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
      style={[
        {
          width: cardWidth,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'transparent', // Transparent outer border per user specification
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        },
        style
      ]}
      className={`p-2.5 justify-between ${className}`}
    >
      {/* 1. PRODUCT IMAGE & WISHLIST */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onPressProduct?.(product, selectedShade)}
      >
        <View className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-[#FAFAFA] items-center justify-center p-2">
          <Image
            source={getSafeImageSource(displayImage, '')}
            style={{ width: '92%', height: '92%' }}
            resizeMode="contain"
          />

          {discountPercent > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                backgroundColor: '#FFF0F5',
                borderColor: '#F8BBD0',
                borderWidth: 0.5,
                paddingHorizontal: 5,
                paddingVertical: 2,
                borderRadius: 4,
                zIndex: 10
              }}
            >
              <Text style={{ color: '#D81B60', fontSize: 8.5, fontWeight: '800' }}>
                {discountPercent}% OFF
              </Text>
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
                color="#D81B60"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. BRAND & TITLE (Exact Fixed Height for Uniform Sizing) */}
        <Text style={{ fontSize: 9, fontWeight: '800', color: '#D81B60', letterSpacing: 0.8, textTransform: 'uppercase', height: 14, marginBottom: 2 }} numberOfLines={1}>
          {product?.brandName || product?.brand || product?.category || 'SALBEAU'}
        </Text>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#111827', lineHeight: 15, height: 30, marginBottom: 6 }} numberOfLines={2}>
          {cleanProductDisplayName(product?.name)}
        </Text>
      </TouchableOpacity>

      {/* 3. SHADE DOTS / CHIPS OR UNIFORM BADGE (Exact Same 38px Height across all products) */}
      <View style={{ height: 38, justifyContent: 'center', marginBottom: 6 }}>
        {hasShades ? (
          <View>
            <TouchableOpacity
              onPress={handleOpenShades}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#D81B60' }} numberOfLines={1}>
                  {shades.length > 1 ? `${shades.length} Shades` : '1 Shade'}
                </Text>
                <Ionicons name="chevron-down" size={9} color="#D81B60" />
              </View>
              <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#8C7078', maxWidth: 85 }} numberOfLines={1}>
                {selectedShade?.name || selectedShade?.title || ''}
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {shades.map((shade, idx) => {
                const isSelected = selectedShade && (
                  (selectedShade.id && shade.id && selectedShade.id === shade.id) ||
                  (selectedShade.name && shade.name && selectedShade.name === shade.name)
                );
                const colorHex = shade.hexColor || shade.hex_color || '#D81B60';

                return (
                  <TouchableOpacity
                    key={shade.id || shade.name || idx}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setSelectedShade(shade);
                      if (rememberSelectedShade && effectiveParentId) {
                        rememberSelectedShade(effectiveParentId, shade);
                      }
                      if (setGlobalSelectedShade) {
                        setGlobalSelectedShade(shade);
                      }
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                    style={{ marginRight: 5, padding: 1 }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: colorHex,
                        borderColor: isSelected ? '#D81B60' : '#E5E7EB',
                        borderWidth: isSelected ? 2 : 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ scale: isSelected ? 1.15 : 1.0 }]
                      }}
                    >
                      {isSelected && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={{ justifyContent: 'center' }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FFF0F5' }}>
              <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#D81B60', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {product?.productType || product?.category || 'Authentic'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 4. PRICE & SELECTED SHADE CART STEPPER / ADD BUTTON */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', height: 36, marginTop: 'auto' }}>
        <View>
          {mrp > rolePrice && (
            <Text style={{ fontSize: 9, fontWeight: '600', color: '#9CA3AF', textDecorationLine: 'line-through' }}>
              ₹{mrp}
            </Text>
          )}
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>
            ₹{rolePrice}
          </Text>
        </View>

        <View>
          {currentQty > 0 ? (
            <View
              style={{
                backgroundColor: '#D81B60',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5
              }}
            >
              <TouchableOpacity
                onPress={handleDecrement}
                className="w-4 h-4 items-center justify-center"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove" size={12} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-[10.5px] font-black px-1 min-w-[12px] text-center">
                {currentQty}
              </Text>
              <TouchableOpacity
                onPress={handleIncrement}
                className="w-4 h-4 items-center justify-center"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                if (hasShades && shades.length > 1 && (onOpenShadeSheet || openShadeSheet)) {
                  handleOpenShades(e);
                } else {
                  handleAdd(e);
                }
              }}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1.2,
                borderColor: '#D81B60',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Ionicons name="bag-handle-outline" size={12} color="#D81B60" />
              <Text style={{ color: '#D81B60', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                + ADD
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

export const ProductCard = PurplleProductCard;
export default PurplleProductCard;

