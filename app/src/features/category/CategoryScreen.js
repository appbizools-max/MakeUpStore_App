import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../../context/AppContext';

export const CategoryScreen = () => {
  const {
    selectedCategory,
    activeProducts,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart
  } = useApp();

  const filteredProducts = activeProducts.filter(p =>
    selectedCategory ? p.category === selectedCategory.name : true
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }} className="bg-white">
      <TouchableOpacity onPress={() => setCurrentScreen('home')} className="mb-3">
        <Text className="text-xs font-bold text-[#C2477A]">← Back to Home</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold text-[#3A2430] mb-1">
        {selectedCategory ? selectedCategory.name : 'All Categories'}
      </Text>
      <Text className="text-xs text-[#8C7078] mb-4">Showing {filteredProducts.length} items</Text>

      <View className="flex-row flex-wrap justify-between">
        {filteredProducts.map(p => {
          const rolePrice = getRolePrice(p);
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                setSelectedProduct(p);
                setCurrentScreen('product');
              }}
              className="w-[48%] bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden mb-3 p-2.5 shadow-xs"
            >
              <Image source={{ uri: p.image }} className="w-full h-28 bg-[#FCE4EC] rounded-xl mb-2" />
              <Text className="text-[9px] font-bold text-[#8C7078] uppercase">{p.brandName}</Text>
              <Text className="text-xs font-semibold text-[#3A2430]" numberOfLines={1}>{p.name}</Text>
              <Text className="text-sm font-bold text-[#C2477A] mt-1">₹{rolePrice}</Text>

              <TouchableOpacity
                className="mt-2 bg-[#FCE4EC] py-1.5 rounded-lg items-center"
                onPress={() => addToCart(p)}
              >
                <Text className="text-[11px] font-bold text-[#C2477A]">+ Add</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};
