import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const SearchScreen = () => {
  const { activeProducts, getRolePrice, setSelectedProduct, setCurrentScreen, userRole } = useApp();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'Rose lipstick',
    'Facewash',
    'Waterproof liner',
    'Sunscreen SPF 50',
  ]);

  const trendingSearches = [
    { id: 't1', text: 'Korean glass skin combos', icon: 'flower-outline' },
    { id: 't2', text: 'Satin finish matte foundations', icon: 'pulse-outline' },
    { id: 't3', text: 'Long lasting highlighters', icon: 'eye-outline' },
    { id: 't4', text: 'Floral perfumes under 1500', icon: 'sparkles-outline' },
  ];

  const popularCategories = [
    { id: 'pc1', name: 'Mascara', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
    { id: 'pc2', name: 'Serums', image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=300' },
    { id: 'pc3', name: 'Toners', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' },
    { id: 'pc4', name: 'Lip Balm', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' },
  ];

  const removeRecentSearch = (itemToRemove) => {
    setRecentSearches(prev => prev.filter(item => item !== itemToRemove));
  };

  const results = activeProducts.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.brandName.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="bg-white">
      {/* Header Row with Back Button & Title */}
      <View className="flex-row items-center gap-3 mb-5 mt-1">
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          className="w-9 h-9 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
        >
          <Ionicons name="chevron-back" size={18} color="#3A2430" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#3A2430]">Search</Text>
      </View>

      {/* Styled Pink Border Search Input Bar */}
      <View className="w-full bg-white border-2 border-[#C2477A] px-4 py-2.5 rounded-full flex-row items-center justify-between mb-6 shadow-xs">
        <Ionicons name="search-outline" size={18} color="#C2477A" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Lipstick matte"
          placeholderTextColor="#8C7078"
          className="flex-1 ml-2.5 text-sm font-semibold text-[#3A2430] p-0"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8C7078" />
          </TouchableOpacity>
        )}
      </View>

      {query.length === 0 ? (
        <>
          {/* Recent Searches Section */}
          {recentSearches.length > 0 && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-extrabold text-[#3A2430]">Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text className="text-xs font-bold text-[#8C7078]">Clear All</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setQuery(term)}
                    className="bg-white border border-[#FCE4EC] px-3.5 py-2 rounded-full flex-row items-center gap-1.5 shadow-2xs"
                  >
                    <Text className="text-xs font-bold text-[#8C7078]">{term}</Text>
                    <TouchableOpacity onPress={() => removeRecentSearch(term)}>
                      <Ionicons name="close" size={13} color="#8C7078" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Trending Searches Section */}
          <View className="mb-6">
            <Text className="text-sm font-extrabold text-[#3A2430] mb-3">Trending Searches</Text>
            <View className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-2xs">
              {trendingSearches.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setQuery(item.text)}
                  className={`flex-row items-center justify-between p-3.5 ${
                    index !== trendingSearches.length - 1 ? 'border-b border-[#FCE4EC]' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name={item.icon} size={16} color="#C2477A" />
                    <Text className="text-xs font-bold text-[#3A2430]">{item.text}</Text>
                  </View>
                  <Ionicons
                    name="arrow-up-outline"
                    size={15}
                    color="#8C7078"
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Beauty Categories Section */}
          <View className="mb-6">
            <Text className="text-sm font-extrabold text-[#3A2430] mb-3">Popular Beauty Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
              {popularCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setQuery(cat.name)}
                  className="items-center mr-5"
                >
                  <View className="w-16 h-16 rounded-full border-2 border-[#F5A8C0] p-0.5 mb-2 bg-[#FFF5F8] overflow-hidden shadow-2xs justify-center items-center">
                    <Image source={{ uri: cat.image }} className="w-full h-full rounded-full object-cover" />
                  </View>
                  <Text className="text-xs font-extrabold text-[#3A2430]">{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      ) : (
        /* Search Results Grid Feed */
        <View>
          <Text className="text-xs font-bold text-[#8C7078] mb-3">
            {results.length} product{results.length !== 1 ? 's' : ''} found for "{query}"
          </Text>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {results.map(p => {
              const rolePrice = getRolePrice(p, userRole);
              const originalMrp = p.mrp > rolePrice ? p.mrp : Math.round(p.mrp * 1.25);

              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setSelectedProduct(p);
                    setCurrentScreen('product');
                  }}
                  className="w-[48%] bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC]"
                >
                  <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FCE4EC]">
                    <Image source={{ uri: p.image }} className="w-full h-full object-cover" />
                  </View>
                  <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                    {p.brandName}
                  </Text>
                  <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                    {p.name}
                  </Text>
                  <View className="flex-col mt-auto pt-0.5">
                    <Text className="text-[9px] font-semibold text-[#8C7078] line-through">
                      MRP ₹{originalMrp}
                    </Text>
                    <Text className="text-sm font-extrabold text-[#C2477A]">₹{rolePrice}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};
