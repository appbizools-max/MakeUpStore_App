import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';

export const WishlistScreen = () => {
  const {
    favorites = [],
    isFavorite,
    toggleFavorite,
    clearFavorites,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity
  } = useApp();

  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(cart)) {
      for (const item of cart) {
        if (item?.product?.id) {
          map.set(item.product.id, item.quantity || 0);
        }
      }
    }
    return map;
  }, [cart]);

  const { totalCartQuantity, totalCartPrice } = useMemo(() => {
    let qty = 0;
    let price = 0;
    if (Array.isArray(cart)) {
      for (const item of cart) {
        const itemQty = item.quantity || 0;
        qty += itemQty;
        const itemPrice = getRolePrice(item.product, userRole);
        price += (itemPrice * itemQty);
      }
    }
    return { totalCartQuantity: qty, totalCartPrice: price };
  }, [cart, userRole, getRolePrice]);

  const getProductCartQuantity = (productId) => {
    return cartQuantityMap.get(productId) || 0;
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all saved items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearFavorites }
      ]
    );
  };

  const renderCartControl = (item) => {
    const qty = getProductCartQuantity(item.id);

    if (qty > 0) {
      return (
        <View
          style={{
            backgroundColor: '#C2477A',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 3,
          }}
          className="rounded-full flex-row items-center justify-between px-1.5 py-1 min-w-[76px]"
        >
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => {
              e.stopPropagation?.();
              updateCartQuantity(item.id, qty - 1);
            }}
            className="w-6 h-6 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="remove" size={13} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-xs font-black text-white px-1.5 text-center min-w-[16px]">
            {qty}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => {
              e.stopPropagation?.();
              updateCartQuantity(item.id, qty + 1);
            }}
            className="w-6 h-6 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="add" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          e.stopPropagation?.();
          addToCart(item, 1);
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#C2477A',
          borderWidth: 1.5,
        }}
        className="px-3 py-1 rounded-full flex-row items-center gap-1 shadow-2xs"
      >
        <Ionicons name="add" size={13} color="#C2477A" />
        <Text className="text-xs font-black text-[#C2477A]">Add</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white relative">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar */}
      <View className="px-4 pt-3 pb-3 bg-white border-b border-[#F0E6EC] flex-row items-center justify-between shadow-2xs">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setCurrentScreen('home')}
            style={{ borderColor: '#E5E7EB', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-xs"
          >
            <Ionicons name="chevron-back" size={18} color="#1E1B1D" />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-black text-[#1E1B1D] tracking-tight">
              My Wishlist
            </Text>
            <Text className="text-[10px] font-semibold text-[#6B5E65]">
              {favorites.length} {favorites.length === 1 ? 'item saved' : 'items saved'}
            </Text>
          </View>
        </View>

        {favorites.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200"
          >
            <Text className="text-[11px] font-bold text-[#6B5E65]">Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      {favorites.length === 0 ? (
        /* Empty State (Amazon/Purplle style) */
        <View className="flex-1 justify-center items-center px-6">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FFF0F5',
              borderColor: '#E2D1DC',
              borderWidth: 1.5,
            }}
            className="items-center justify-center mb-5 shadow-xs"
          >
            <Ionicons name="heart-outline" size={38} color="#C2477A" />
          </View>

          <Text className="text-lg font-black text-[#1E1B1D] mb-1.5 text-center">
            Your Wishlist is Empty
          </Text>
          <Text className="text-xs text-[#6B5E65] text-center leading-relaxed mb-6 max-w-xs">
            Explore our luxury cosmetics, bridal kits, and salon essentials. Tap the heart icon on any item to save it here.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('home')}
            style={{
              backgroundColor: '#C2477A',
              shadowColor: '#C2477A',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
            className="px-6 py-3.5 rounded-full flex-row items-center gap-2"
          >
            <Ionicons name="sparkles" size={15} color="#FFFFFF" />
            <Text className="text-xs font-black text-white uppercase tracking-wider">
              Explore Products
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Populated Grid */
        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: totalCartQuantity > 0 ? 150 : 100 }}
          showsVerticalScrollIndicator={false}
          className="bg-white"
        >
          <View className="flex-row flex-wrap justify-between gap-y-3.5">
            {favorites.map((item) => {
              const rolePrice = getRolePrice(item, userRole);
              const originalMrp = item.mrp > rolePrice ? item.mrp : Math.round(item.mrp * 1.25);
              const discountPercent = Math.round(((originalMrp - rolePrice) / originalMrp) * 100);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.92}
                  onPress={() => {
                    setSelectedProduct(item);
                    setCurrentScreen('product');
                  }}
                  style={{
                    width: '48.5%',
                    backgroundColor: '#FFFFFF',
                    borderColor: '#F0E6EC',
                    borderWidth: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                  className="rounded-2xl p-2.5 flex-col justify-between"
                >
                  <View>
                    {/* Product Image Box with Heart Button */}
                    <View className="relative w-full h-32 rounded-xl overflow-hidden mb-2 bg-[#F9FAFB] border border-[#F0E6EC]">
                      <Image
                        source={getSafeImageSource(item.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400')}
                        className="w-full h-full object-cover"
                      />

                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <View
                          style={{ backgroundColor: '#C2477A' }}
                          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full"
                        >
                          <Text className="text-white text-[8.5px] font-black uppercase">
                            {discountPercent}% OFF
                          </Text>
                        </View>
                      )}

                      {/* Active Heart Toggle Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleFavorite(item);
                        }}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2D1DC',
                          borderWidth: 1,
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center shadow-xs"
                      >
                        <Ionicons
                          name="heart"
                          size={15}
                          color="#C2477A"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Brand & Name */}
                    <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                      {item.brandName || 'SALBEAU'}
                    </Text>
                    <Text
                      className="text-[11px] font-bold text-[#1E1B1D] leading-tight mb-2 h-7"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </View>

                  {/* Price & Cart Stepper Row */}
                  <View className="pt-1 border-t border-gray-100 flex-row items-center justify-between mt-auto">
                    <View className="flex-col">
                      <Text className="text-[9px] font-semibold text-[#8C7E86] line-through">
                        MRP ₹{originalMrp}
                      </Text>
                      <Text className="text-sm font-extrabold text-[#C2477A]">
                        ₹{rolePrice}
                      </Text>
                    </View>

                    {renderCartControl(item)}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ---------------- STICKY VIEW CART BOTTOM BAR ---------------- */}
      {totalCartQuantity > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 58,
            left: 12,
            right: 12,
            zIndex: 50,
            backgroundColor: '#C2477A',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          className="rounded-2xl px-4 py-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="bag-handle" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-sm font-black text-white tracking-wide">
                {totalCartQuantity} {totalCartQuantity === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('cart')}
            className="bg-white px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
          >
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              View Cart
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#C2477A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
