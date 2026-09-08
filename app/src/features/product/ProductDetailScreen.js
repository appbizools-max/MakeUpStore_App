import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';

export const ProductDetailScreen = () => {
  const { selectedProduct, userRole, getRolePrice, addToCart, setCurrentScreen } = useApp();
  const [quantity, setQuantity] = useState(1);

  if (!selectedProduct) return null;

  const rolePrice = getRolePrice(selectedProduct, userRole);
  const hasDiscount = userRole !== 'general' && rolePrice < selectedProduct.mrp;
  const savings = selectedProduct.mrp - rolePrice;

  const handleAdd = () => {
    addToCart(selectedProduct, quantity);
    Alert.alert('Added to Cart', `${quantity}x ${selectedProduct.name} added to cart!`);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }} className="bg-white">
      <TouchableOpacity onPress={() => setCurrentScreen('home')} className="mb-3">
        <Text className="text-xs font-bold text-[#C2477A]">← Back to Browse</Text>
      </TouchableOpacity>

      <Image source={{ uri: selectedProduct.image }} className="w-full h-64 bg-white rounded-2xl mb-4 border border-[#FCE4EC]" />

      <View className="bg-white p-4 rounded-2xl border border-[#FCE4EC] mb-4">
        <Text className="text-xs font-bold text-[#C2477A] uppercase">{selectedProduct.brandName}</Text>
        <Text className="text-base font-bold text-[#3A2430] mt-1 mb-2">{selectedProduct.name}</Text>

        <View className="bg-[#FCE4EC] p-3 rounded-xl border border-[#F5A8C0] mb-3">
          <Text className="text-[10px] font-bold text-[#8C7078]">ROLE PRICING MODE: {userRole.toUpperCase()}</Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-2xl font-bold text-[#C2477A]">₹{rolePrice}</Text>
            {hasDiscount && (
              <>
                <Text className="text-xs text-[#8C7078] line-through">₹{selectedProduct.mrp}</Text>
                <Text className="text-xs font-bold text-[#4C8C5C]">Save ₹{savings}</Text>
              </>
            )}
          </View>
        </View>

        <Text className="text-xs font-bold text-[#3A2430] mb-1">Description</Text>
        <Text className="text-xs text-[#8C7078] leading-5">{selectedProduct.description}</Text>
      </View>

      <TouchableOpacity
        onPress={handleAdd}
        className="bg-[#C2477A] py-3.5 rounded-xl items-center shadow-md"
      >
        <Text className="text-sm font-bold text-white">Add to Cart — ₹{rolePrice * quantity}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
