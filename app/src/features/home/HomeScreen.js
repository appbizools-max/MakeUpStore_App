import React, { useState, useEffect } from 'react';
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
    brands,
    categories,
    homeSectionVisibility
  } = useApp();

  const [wishlist, setWishlist] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      id: 'hs1',
      badge: 'EXCLUSIVE PRO TIER',
      title: 'Autumn Glamour & Glass Glow',
      subtitle: 'Up to 35% Wholesale Pricing for Salon Pros & Artists',
      ctaText: 'Explore Pro Rates →',
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=80',
      screen: 'onboarding'
    },
    {
      id: 'hs2',
      badge: '365+ VERIFIED BRANDS',
      title: '100% Authentic Beauty Direct Supplies',
      subtitle: 'L\'Oréal, M.A.C, Maybelline, Agaro, Biotique & More In-Stock',
      ctaText: 'Browse All Brands →',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80',
      screen: 'search'
    },
    {
      id: 'hs3',
      badge: 'SAME DAY EXPRESS DISPATCH',
      title: 'Store Pickup & Express Shipping',
      subtitle: 'Realtime order tracking & wholesale tier invoice receipts',
      ctaText: 'Shop Best Sellers →',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop&q=80',
      screen: 'search'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const toggleWishlist = (id) => {
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fallbackTopBrands = [
    { id: 'tb1', name: "L'Oréal", image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
    { id: 'tb2', name: 'Maybelline', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
    { id: 'tb3', name: 'Lakmé', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
    { id: 'tb4', name: 'M.A.C', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' },
    { id: 'tb5', name: 'Salbeau', image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=300' },
  ];

  const fallbackCategories = [
    { id: 'c1', name: 'Hair Care', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
    { id: 'c2', name: 'Skin Care', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' },
    { id: 'c3', name: 'Lipstick & Gloss', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
    { id: 'c4', name: 'Eye Makeup', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300' },
    { id: 'c5', name: 'Nail Polish', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300' },
  ];

  const displayCategories = (categories && categories.length > 0) ? categories : fallbackCategories;

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

  // Essential Beauty Staples Data
  const beautyEssentials = [
    { id: 'be1', title: 'Face Serums', iconName: 'sparkles', subtitle: 'Radiance & Hydration' },
    { id: 'be2', title: 'Hair Care Oils', iconName: 'cut', subtitle: 'Nourishment & Spa' },
    { id: 'be3', title: 'Lipsticks & Oils', iconName: 'color-palette', subtitle: 'Velvet & Gloss Shades' },
    { id: 'be4', title: 'Aloevera & Gels', iconName: 'leaf', subtitle: 'Pure Organic Care' },
    { id: 'be5', title: 'Waxing & Kits', iconName: 'gift', subtitle: 'Salon Smooth Finish' },
    { id: 'be6', title: 'Sunscreen Shield', iconName: 'sunny', subtitle: 'Broad Spectrum UV' }
  ];

  const recommendedProducts = [
    {
      id: 'rec1',
      brandName: 'DERMAVIVE',
      name: 'Hydrating Hydra-Boost Serum 50ml',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
      rating: '4.9',
      mrp: 999,
      salonPrice: 749,
      artistPrice: 699,
      beauticianPrice: 719,
    },
    {
      id: 'rec2',
      brandName: 'BIOTIQUE',
      name: 'Bio Kelp Protein Conditioner',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      rating: '4.6',
      mrp: 350,
      salonPrice: 245,
      artistPrice: 229,
      beauticianPrice: 235,
    }
  ];

  const recentlyViewedProducts = [
    {
      id: 'rv1',
      name: 'Glaze Lip Oil',
      brandName: 'SALBEAU',
      image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300',
      price: 399
    },
    {
      id: 'rv2',
      name: 'Matte Foundation',
      brandName: 'M.A.C',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
      price: 1099
    },
    {
      id: 'rv3',
      name: 'Hair Repair Mask',
      brandName: "L'ORÉAL",
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300',
      price: 629
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
    : fallbackTopBrands.filter(tb => {
        const matchingBrand = (brands || []).find(b => b.id === tb.id || b.name.toLowerCase() === tb.name.toLowerCase());
        return matchingBrand ? matchingBrand.enabled : true;
      });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 110 }} className="bg-white">
      {/* ---------------- 1. EXISTING HEADER ---------------- */}
      <View className="px-4 pt-4 pb-3 bg-white space-y-3">
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

      {/* ---------------- 2. HERO SLIDER BANNER (CLEAN WITH BUTTON ONLY) ---------------- */}
      <View className="px-4 mb-5 mt-2">
        <View className="rounded-3xl overflow-hidden shadow-md bg-[#FCE4EC] relative h-48 border border-[#FCE4EC]">
          {/* Slider Banner Image */}
          <Image
            source={{ uri: heroSlides[activeSlide].image }}
            className="w-full h-full object-cover"
          />

          {/* Button Only Overlay */}
          <View className="absolute bottom-3.5 left-3.5">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCurrentScreen(heroSlides[activeSlide].screen || 'onboarding')}
              className="bg-white px-4 py-2 rounded-xl shadow-md border border-pink-100"
            >
              <Text className="text-xs font-black text-[#C2477A]">
                {heroSlides[activeSlide].ctaText || 'Shop Collection →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ---------------- 3. EXISTING SHOP BY CATEGORY ---------------- */}
      <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">Shop by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4 mb-6">
        {displayCategories.map((cat) => (
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

      {/* ---------------- 4. EXISTING TRENDING NOW ---------------- */}
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-base font-extrabold text-[#3A2430]">Trending Now</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('search')}>
          <Text className="text-xs font-bold text-[#C2477A]">View All</Text>
        </TouchableOpacity>
      </View>

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
              <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FCE4EC]">
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

              <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                {item.brandName}
              </Text>
              <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                {item.name}
              </Text>

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

      {/* ---------------- 5. EXISTING TOP BRANDS ---------------- */}
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

      {/* ---------------- 6. EXISTING NEW ARRIVALS ---------------- */}
      <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">New Arrivals</Text>
      <View className="px-4 flex-row justify-between mb-8">
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

      {/* ========================================================================= */}
      {/* 💥 NEW ADDITIONS BELOW CURRENT EXISTING CONTENT (100% PRESERVED ABOVE) 💥 */}
      {/* ========================================================================= */}

      {/* NEW SECTION 1: BEAUTY EDIT (EDITORIAL CONTENT) */}
      <View className="px-4 mb-8">
        <Text className="text-base font-extrabold text-[#3A2430] mb-3">Beauty Edit</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-[#FCE4EC] shadow-xs">
          <View className="relative w-full h-36 bg-[#FCE4EC]">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80' }}
              className="w-full h-full object-cover"
            />
            <View className="absolute top-3 left-3 bg-[#C2477A] px-2.5 py-1 rounded-full">
              <Text className="text-white text-[9px] font-black uppercase tracking-wider">THE SALBEAU EDIT</Text>
            </View>
          </View>
          <View className="p-4 bg-white">
            <Text className="text-xs font-black text-[#3A2430] mb-1">
              Autumn Gloss & Radiance Rituals
            </Text>
            <Text className="text-[10.5px] text-[#8C7078] font-medium leading-relaxed mb-3">
              Discover curated autumn beauty masterclasses, pro artist tricks, and hydration secrets for glass skin.
            </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('search')} className="flex-row items-center gap-1">
              <Text className="text-[11px] font-extrabold text-[#C2477A]">Read Beauty Journal</Text>
              <Ionicons name="arrow-forward" size={13} color="#C2477A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>


      {/* NEW SECTION 3: RECOMMENDED FOR YOU */}
      <View className="px-4 mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-extrabold text-[#3A2430]">Recommended For You</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('search')}>
            <Text className="text-xs font-bold text-[#C2477A]">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {recommendedProducts.map((item) => {
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
                <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FCE4EC]">
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

                <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                  {item.brandName}
                </Text>
                <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                  {item.name}
                </Text>

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
      </View>

      {/* NEW SECTION 4: ESSENTIAL BEAUTY STAPLES */}
      <View className="px-4 mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-base font-extrabold text-[#3A2430]">Essential Beauty Staples</Text>
            <Text className="text-[10px] font-medium text-[#8C7078]">Handpicked pro catalog favorites</Text>
          </View>
          <TouchableOpacity onPress={() => setCurrentScreen('search')}>
            <Text className="text-xs font-bold text-[#C2477A]">Explore All →</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          {beautyEssentials.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => {
                setSearchQuery(item.title);
                setCurrentScreen('search');
              }}
              className="w-[48%] bg-white rounded-2xl border border-[#FCE4EC] p-3 flex-row items-center gap-3 shadow-2xs"
            >
              <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#FFF5F8] border border-[#FCE4EC]">
                <Ionicons name={item.iconName} size={18} color="#C2477A" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-extrabold text-[#3A2430]" numberOfLines={1}>{item.title}</Text>
                <Text className="text-[9px] font-medium text-[#8C7078]" numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NEW SECTION 5: BEST SELLERS */}
      <View className="px-4 mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-extrabold text-[#3A2430]">Best Sellers</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('search')}>
            <Text className="text-xs font-bold text-[#C2477A]">View All</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {displayProducts.slice(0, 2).map((item) => {
            const rolePrice = getRolePrice(item, userRole);
            const isLiked = wishlist[item.id];
            const originalMrp = item.mrp > rolePrice ? item.mrp : Math.round(item.mrp * 1.25);

            return (
              <TouchableOpacity
                key={`bs_${item.id}`}
                onPress={() => {
                  setSelectedProduct(item);
                  setCurrentScreen('product');
                }}
                className="w-[48%] bg-white rounded-2xl p-2.5 shadow-2xs border border-[#FCE4EC]"
              >
                <View className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-[#FCE4EC]">
                  <Image source={{ uri: item.image }} className="w-full h-full object-cover" />
                  <View className="absolute top-1.5 left-1.5 bg-[#C2477A] px-1.5 py-0.5 rounded-md">
                    <Text className="text-white text-[8px] font-black uppercase">BESTSELLER</Text>
                  </View>
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

                <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                  {item.brandName}
                </Text>
                <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-2 h-7" numberOfLines={2}>
                  {item.name}
                </Text>

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
      </View>

      {/* NEW SECTION 6: RECENTLY VIEWED */}
      <View className="mb-8">
        <Text className="text-base font-extrabold text-[#3A2430] px-4 mb-3">Recently Viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
          {recentlyViewedProducts.map((rv) => (
            <TouchableOpacity
              key={rv.id}
              activeOpacity={0.85}
              onPress={() => setCurrentScreen('product')}
              className="bg-white rounded-2xl border border-[#FCE4EC] p-2.5 mr-3 shadow-2xs w-28 items-center"
            >
              <View className="w-16 h-16 rounded-xl overflow-hidden mb-2 bg-[#FFF5F8] border border-[#FCE4EC]">
                <Image source={{ uri: rv.image }} className="w-full h-full object-cover" />
              </View>
              <Text className="text-[8.5px] font-bold text-[#C2477A] uppercase mb-0.5">{rv.brandName}</Text>
              <Text className="text-[10.5px] font-bold text-[#3A2430] text-center" numberOfLines={1}>{rv.name}</Text>
              <Text className="text-xs font-extrabold text-[#C2477A] mt-1">₹{rv.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* NEW SECTION 7: COMPLETE YOUR LOOK */}
      <View className="px-4 mb-8">
        <Text className="text-base font-extrabold text-[#3A2430] mb-3">Complete Your Look</Text>
        <View className="bg-[#FFF5F8] rounded-3xl p-4 border border-[#FCE4EC] shadow-2xs flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[9px] font-extrabold text-[#C2477A] uppercase tracking-wider mb-0.5">DUO BEAUTY BUNDLE</Text>
            <Text className="text-xs font-extrabold text-[#3A2430] mb-1">
              Hydrating Lip Oil + Rose Velvet Blush
            </Text>
            <Text className="text-[10px] text-[#8C7078] font-medium mb-2">
              Save 20% extra when buying this salon-ready radiance pair.
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentScreen('cart')}
              className="bg-[#C2477A] px-3 py-1.5 rounded-xl self-start"
            >
              <Text className="text-white text-[10px] font-bold">Add Bundle ₹899 →</Text>
            </TouchableOpacity>
          </View>
          <View className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-[#F5A8C0]">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' }}
              className="w-full h-full object-cover"
            />
          </View>
        </View>
      </View>

      {/* NEW SECTION 8: SEASONAL BEAUTY COLLECTION */}
      <View className="px-4 mb-4">
        <View className="rounded-3xl overflow-hidden border border-[#FCE4EC] bg-white shadow-xs">
          <View className="relative w-full h-36 bg-[#FCE4EC]">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80' }}
              className="w-full h-full object-cover"
            />
            <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full">
              <Text className="text-[#C2477A] text-[9px] font-black uppercase tracking-wider">SEASONAL COLLECTION</Text>
            </View>
          </View>
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-black text-[#3A2430]">
                Luxe Bridal & Salon Master Series
              </Text>
              <Text className="text-[10px] text-[#8C7078] font-medium">
                Professional bridal kits with extended durability formulas.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen('search')}
              className="bg-[#C2477A] px-3 py-2 rounded-xl"
            >
              <Text className="text-white text-[10px] font-black">Explore →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
