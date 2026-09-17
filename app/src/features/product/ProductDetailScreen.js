import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const ProductDetailScreen = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    activeProducts,
    userRole,
    getRolePrice,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    setCurrentScreen
  } = useApp();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productImages = (selectedProduct?.images && selectedProduct.images.length > 0)
    ? selectedProduct.images
    : [
        selectedProduct?.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'
      ];

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);

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

  const rolePrice = getRolePrice(selectedProduct, userRole);
  const displayMrp = selectedProduct.mrp && selectedProduct.mrp > rolePrice ? Number(selectedProduct.mrp) : Math.round(rolePrice * 1.25);
  const hasDiscount = displayMrp > rolePrice;
  const savings = displayMrp - rolePrice;
  const discountPercent = Math.round((savings / displayMrp) * 100);
  const isOutOfStock = selectedProduct.stock === 0;

  const cartItem = (cart || []).find(c => c.id === selectedProduct.id || c.product?.id === selectedProduct.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const similarProducts = (activeProducts || []).filter(p => p.id !== selectedProduct.id).slice(0, 6);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(selectedProduct, 1);
    Alert.alert('Added to Cart', `${selectedProduct.name} added to cart!`);
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    if (cartQty === 0) {
      addToCart(selectedProduct, 1);
    } else {
      updateCartQuantity(selectedProduct.id, cartQty + 1);
    }
  };

  const handleDecrement = () => {
    if (cartQty > 1) {
      updateCartQuantity(selectedProduct.id, cartQty - 1);
    } else if (cartQty === 1) {
      removeFromCart(selectedProduct.id);
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
          onPress={() => setIsWishlisted(!isWishlisted)}
          className="w-10 h-10 rounded-full bg-white/90 items-center justify-center border border-[#FCE4EC] shadow-sm"
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
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
              source={{ uri: productImages[currentImageIndex] }}
              className={`w-full h-full object-contain ${isOutOfStock ? 'opacity-40' : ''}`}
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
            <Text className="text-xl font-black text-[#3A2430]">₹{rolePrice}</Text>
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
        </View>

        {/* 4. Similar Products Section */}
        {similarProducts.length > 0 && (
          <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-3">
            <Text className="text-sm font-extrabold text-[#3A2430] mb-3">Similar products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2.5">
              {similarProducts.map(p => {
                const sPrice = getRolePrice(p, userRole);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProduct(p)}
                    className="w-32 bg-white border border-gray-100 rounded-xl p-2 mr-2"
                  >
                    <Image source={{ uri: p.image }} className="w-full h-24 object-cover rounded-lg mb-1.5 border border-gray-100" />
                    <Text className="text-[8px] font-extrabold text-[#8C7078] uppercase" numberOfLines={1}>{p.brandName}</Text>
                    <Text className="text-[10px] font-bold text-[#3A2430]" numberOfLines={1}>{p.name}</Text>
                    <Text className="text-xs font-black text-[#C2477A] mt-1">₹{sPrice}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* 5. Fixed Bottom Action Bar (Positioned directly above the bottom menu) */}
      <View style={{ bottom: 53 }} className="absolute left-0 right-0 bg-white border-t border-gray-200 p-3 flex-row items-center justify-between shadow-2xl z-20">
        <View className="flex-col">
          <Text className="text-[10px] text-[#8C7078] font-bold">500 ml / 1 Unit</Text>
          <Text className="text-base font-black text-[#3A2430]">₹{rolePrice * (cartQty || 1)}</Text>
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
            disabled={isOutOfStock}
            onPress={handleAddToCart}
            className={`px-7 py-3 rounded-xl ${isOutOfStock ? 'bg-gray-200' : 'bg-[#C2477A]'}`}
          >
            <Text className="text-white text-xs font-black">Add to cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
