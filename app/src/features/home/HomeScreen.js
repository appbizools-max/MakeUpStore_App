import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';
export const HomeScreen = () => {
  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });
  const {
    userRole,
    getRolePrice,
    setSelectedProduct,
    setSelectedCategory,
    setCurrentScreen,
    addToCart,
    searchQuery,
    setSearchQuery,
    activeProducts,
    activeBrands,
    brands
  } = useApp();
  const [wishlist, setWishlist] = useState({});
  const toggleWishlist = (id) => {
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const topBrands = [
    { id: 'tb1', name: "L'Oréal", image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
    { id: 'tb2', name: 'Maybelline', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
    { id: 'tb3', name: 'Lakmé', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
    { id: 'tb4', name: 'M.A.C', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' },
    { id: 'tb5', name: 'Salbeau', image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=300' },
  ];
  const categories = [
    { id: 'c1', name: 'Makeup', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
    { id: 'c2', name: 'Skincare', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' },
    { id: 'c3', name: 'Haircare', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300' },
    { id: 'c4', name: 'Fragrances', image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=300' },
    { id: 'c5', name: 'Tools', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
  ];
  const productsList = [
    {
      id: 'hp1',
      brandName: 'SALBEAU ORGANICS',
      name: 'Glaze Hydrating Lip Oil - Rosewood',
      image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=80',
      rating: '4.8',
      mrp: 499,
      salonPrice: 399,
      artistPrice: 379,
      beauticianPrice: 389,
    },
    {
      id: 'hp3',
      brandName: 'LUXE BEAUTY',
      name: 'Rose Velvet Blush Palette',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      rating: '4.7',
      mrp: 799,
      salonPrice: 559,
      artistPrice: 529,
      beauticianPrice: 539,
    },
    {
      id: 'hp4',
      brandName: 'M.A.C COSMETICS',
      name: 'Studio Fix Matte Foundation',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
      rating: '4.9',
      mrp: 1499,
      salonPrice: 1099,
      artistPrice: 999,
      beauticianPrice: 1049,
    },
    {
      id: 'hp5',
      brandName: "L'ORÉAL PARIS",
      name: 'Absolut Repair Hair Mask 250ml',
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80',
      rating: '4.8',
      mrp: 899,
      salonPrice: 629,
      artistPrice: 599,
      beauticianPrice: 609,
    }
  ];
  const newArrivals = [
    {
      id: 'na1',
      brandName: 'SALBEAU LUXE',
      name: 'Nourishing Night Face Cream',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
      rating: '4.9',
      mrp: 1299,
      salonPrice: 949,
      artistPrice: 899,
      beauticianPrice: 919,
    },
    {
      id: 'na2',
      brandName: 'GLOW RADIANCE',
      name: 'Rose Velvet Blush Palette',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      rating: '4.7',
      mrp: 799,
      salonPrice: 559,
      artistPrice: 529,
      beauticianPrice: 539,
    }
  ];

  const displayProducts = (activeProducts && activeProducts.length > 0)
    ? activeProducts
    : productsList.filter(p => {
        const matchingBrand = (brands || []).find(b => b.id === p.brandId || b.name.toLowerCase() === p.brandName.toLowerCase());
        return matchingBrand ? matchingBrand.enabled : true;
      });

  const displayBrands = (activeBrands && activeBrands.length > 0)
    ? activeBrands
    : topBrands.filter(tb => {
        const matchingBrand = (brands || []).find(b => b.id === tb.id || b.name.toLowerCase() === tb.name.toLowerCase());
        return matchingBrand ? matchingBrand.enabled : true;
      });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="bg-white">
      {/* Header Section */}
      <View className="px-4 pt-4 pb-3 bg-white space-y-3">
        {/* Brand Logo & Top Action Buttons */}
        <View className="flex-row justify-between items-center mb-1 mt-1">
          <Text
            style={{
              fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
            }}
            className="text-[36px] text-[#C2477A] tracking-wide ml-0.5 mt-0.5"
          >
            Salbeau
          </Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setCurrentScreen('orders')}>
              <View className="w-8.5 h-8.5 rounded-full bg-[#FFF5F8] items-center justify-center border border-[#FCE4EC]">
                <Ionicons name="notifications-outline" size={18} color="#C2477A" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View className="w-8.5 h-8.5 rounded-full bg-[#FFF5F8] items-center justify-center border border-[#FCE4EC]">
                <Ionicons name="heart-outline" size={18} color="#C2477A" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Compact Search Bar with Search Icon at Left Center & Centered Placeholder */}
        <View className="items-center w-full mt-1.5">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setCurrentScreen('search')}
            className="w-[94%] flex-row items-center bg-white border border-[#F5A8C0] px-3.5 py-1.5 rounded-full shadow-2xs relative"
          >
            <View className="absolute left-3.5 z-10 justify-center items-center">
              <Ionicons name="search-outline" size={14} color="#C2477A" />
            </View>
            <TextInput
              editable={false}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products, brands, lipsticks..."
              placeholderTextColor="#8C7078"
              textAlign="center"
              className="w-full text-[11px] font-semibold text-[#3A2430] p-0"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Hero Model Banner */}
      <View className="px-4 mb-5 mt-1">
        <View className="rounded-3xl overflow-hidden shadow-sm bg-[#FCE4EC]">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=80' }}
            className="w-full h-32 object-cover"
          />
        </View>
      </View>

      {/* Shop by Category - White Box Cards with Pink Background */}
      <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">Shop by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4 mb-6">
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedCategory(cat);
              setCurrentScreen('category');
            }}
            className="bg-white rounded-2xl border border-[#FCE4EC] p-2.5 items-center mr-3 shadow-xs"
          >
            <View className="w-14 h-14 rounded-xl overflow-hidden mb-2 bg-[#FFF5F8] border border-[#FCE4EC]">
              <Image source={{ uri: cat.image }} className="w-full h-full object-cover" />
            </View>
            <Text className="text-xs font-bold text-[#3A2430]">{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Now Section Header */}
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-base font-extrabold text-[#3A2430]">Trending Now</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('search')}>
          <Text className="text-xs font-bold text-[#C2477A]">View All</Text>
        </TouchableOpacity>
      </View>

      {/* Product Cards Grid */}
      <View className="px-4 flex-row flex-wrap justify-between gap-y-4 mb-6">
        {displayProducts.map((item) => {
          const rolePrice = getRolePrice(item, userRole);
          const isLiked = wishlist[item.id];
          const originalMrp = item.mrp > rolePrice ? item.mrp : Math.round(item.mrp * 1.25);

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedProduct(item);
                setCurrentScreen('product');
              }}
              className="w-[48%] bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC]"
            >
              {/* Product Image Stage */}
              <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FCE4EC]">
                <Image source={{ uri: item.image }} className="w-full h-full object-cover" />

                {/* Heart Badge Top-Right */}
                <TouchableOpacity
                  onPress={() => toggleWishlist(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white items-center justify-center shadow-xs"
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={13}
                    color="#C2477A"
                  />
                </TouchableOpacity>
              </View>

              {/* Brand Name Tag */}
              <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                {item.brandName}
              </Text>

              {/* Product Title */}
              <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                {item.name}
              </Text>

              {/* Price & Add Button Row */}
              <View className="flex-row items-center justify-between mt-auto pt-0.5">
                <View className="flex-col">
                  <Text className="text-[9px] font-semibold text-[#8C7078] line-through">
                    MRP ₹{originalMrp}
                  </Text>
                  <Text className="text-sm font-extrabold text-[#C2477A]">₹{rolePrice}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  className="w-6.5 h-6.5 rounded-full bg-[#FCE4EC] items-center justify-center border border-[#F5A8C0]"
                >
                  <Ionicons name="add" size={16} color="#C2477A" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Top Brands - Names Only with White BG */}
      <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">Top Brands</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4 mb-6">
        {displayBrands.map((brand) => (
          <TouchableOpacity
            key={brand.id}
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('search')}
            className="px-4 py-2.5 rounded-full bg-white border border-[#F5A8C0] mr-2.5 shadow-2xs items-center justify-center"
          >
            <Text className="text-xs font-extrabold text-[#C2477A] tracking-wide">{brand.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Arrivals */}
      <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">New Arrivals</Text>
      <View className="px-4 flex-row justify-between">
        {newArrivals.map((item) => {
          const rolePrice = getRolePrice(item, userRole);
          const isLiked = wishlist[item.id];
          const originalMrp = item.mrp > rolePrice ? item.mrp : Math.round(item.mrp * 1.25);

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedProduct(item);
                setCurrentScreen('product');
              }}
              className="w-[48%] bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC]"
            >
              <View className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FCE4EC]">
                <Image source={{ uri: item.image }} className="w-full h-full object-cover" />
                <TouchableOpacity
                  onPress={() => toggleWishlist(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white items-center justify-center shadow-xs"
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={13}
                    color="#C2477A"
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase mb-0.5">{item.brandName}</Text>
              <Text className="text-[11px] font-bold text-[#3A2430]" numberOfLines={1}>{item.name}</Text>
              <View className="flex-col mt-1">
                <Text className="text-[9px] font-semibold text-[#8C7078] line-through">
                  MRP ₹{originalMrp}
                </Text>
                <Text className="text-sm font-extrabold text-[#C2477A]">₹{rolePrice}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};
