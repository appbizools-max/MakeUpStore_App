import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {
  MAIN_CATEGORIES,
  CATEGORY_IMAGES,
  findCategoryConfig,
  filterProductsByHierarchy
} from '../../config/categoriesHierarchy';

import { getCategoryFA5Icon } from '../../utils/categoryIcons';
import { CategoryDetailView } from './CategoryDetailView';
import { SubcategoryView } from './SubcategoryView';
import { ProductListingView } from './ProductListingView';

// Curated 12 Core Categories in exact mandated sequence
// iconName fields kept for backward compatibility with CategoryDetailView/SubcategoryView;
// the grid cards now resolve icons via getCategoryFA5Icon() for consistent FA5 rendering.
export const MANDATED_CATEGORIES = [
  {
    id: 'cat_skincare',
    name: 'Skincare',
    iconName: 'spa',                    // FA5
    image: CATEGORY_IMAGES.skincare,
    fallbackImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    tagline: 'Glow from Within'
  },
  {
    id: 'cat_makeup',
    name: 'Makeup',
    iconName: 'paint-brush',            // FA5
    image: CATEGORY_IMAGES.makeup,
    fallbackImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    tagline: 'Bold. Radiant. Iconic.'
  },
  {
    id: 'cat_hair_styling',
    name: 'Hair Styling',
    iconName: 'magic',                  // FA5
    image: CATEGORY_IMAGES.hairStylingTools,
    fallbackImage: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80',
    tagline: 'Salon Finish at Home'
  },
  {
    id: 'cat_hair_care',
    name: 'Hair Care',
    iconName: 'leaf',                   // FA5
    image: CATEGORY_IMAGES.hairCare,
    fallbackImage: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
    tagline: 'Strong. Silky. Vibrant.'
  },
  {
    id: 'cat_fragrance',
    name: 'Fragrance',
    iconName: 'spray-can',              // FA5
    image: CATEGORY_IMAGES.fragrance,
    fallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80',
    tagline: 'Your Signature Scent'
  },
  {
    id: 'cat_nail_care',
    name: 'Nail Care',
    iconName: 'gem',                    // FA5
    image: CATEGORY_IMAGES.nailCare,
    fallbackImage: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=80',
    tagline: 'Chic. Polished. Flawless.'
  },
  {
    id: 'cat_bath_body',
    name: 'Bath & Body',
    iconName: 'bath',                   // FA5
    image: CATEGORY_IMAGES.bathBody,
    fallbackImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
    tagline: 'Pure Indulgence'
  },
  {
    id: 'cat_mens_grooming',
    name: "Men's Grooming",
    iconName: 'male',                   // FA5
    image: CATEGORY_IMAGES.mensGrooming,
    fallbackImage: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=80',
    tagline: 'Sharp. Refined. Confident.'
  },
  {
    id: 'cat_beauty_tools',
    name: 'Beauty Tools',
    iconName: 'tools',                  // FA5
    image: CATEGORY_IMAGES.beautyTools,
    fallbackImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80',
    tagline: 'Precision Essentials'
  },
  {
    id: 'cat_personal_care',
    name: 'Personal Care',
    iconName: 'pump-soap',              // FA5
    image: CATEGORY_IMAGES.personalCare,
    fallbackImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    tagline: 'Daily Wellness & Hygiene'
  },
  {
    id: 'cat_wellness',
    name: 'Wellness',
    iconName: 'heartbeat',              // FA5
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80',
    tagline: 'Balance & Inner Vitality'
  },
  {
    id: 'cat_gift_sets',
    name: 'Gift Sets',
    iconName: 'gift',                   // FA5
    image: CATEGORY_IMAGES.beautyKits,
    fallbackImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=80',
    tagline: 'The Ultimate Gift of Beauty'
  }
];

export const CategoryScreen = () => {
  const {
    categories: dbCategories = [],
    subcategories: liveSubcategories,
    leafCategories: liveLeafCategories,
    selectedCategory,
    setSelectedCategory,
    activeProducts,
    setCurrentScreen,
    cart = []
  } = useApp();

  const cartCount = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
  }, [cart]);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove?.();
  }, []);

  const screenWidth = windowDimensions.width;
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const cardGap = 12;
  const horizontalPadding = 16;
  const cardWidth = (screenWidth - (horizontalPadding * 2) - (cardGap * (numColumns - 1))) / numColumns;

  // ── NAVIGATION LEVELS ───────────────────────────────────────────
  // level: 1 = Main Categories Grid ("Shop by Category")
  // level: 2 = Category Detail (Top Banner + Subcategories visual list)
  // level: 3 = Subcategory Screen (Subcategory Banner + Leaf Categories)
  // level: 4 = Product Listing Screen (2-column products grid with search & filters)
  const [navLevel, setNavLevel] = useState(1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeLeafCategory, setActiveLeafCategory] = useState(null);
  const [openedFromHome, setOpenedFromHome] = useState(false);

  // Synchronize when coming with selectedCategory from HomeScreen or elsewhere
  useEffect(() => {
    if (selectedCategory) {
      const categoryName = typeof selectedCategory === 'string' ? selectedCategory : selectedCategory?.name;
      const matched = findCategoryConfig(categoryName) || MANDATED_CATEGORIES.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
      if (matched) {
        setActiveCategory(matched);
        setNavLevel(2);
        setOpenedFromHome(true);
      }
    }
  }, [selectedCategory]);

  // Merge live database categories with Mandated Sequence
  const displayCategories = useMemo(() => {
    return MANDATED_CATEGORIES.map(mCat => {
      // Find matching db category if present for real-time live database synchronization
      const dbMatch = dbCategories.find(dbCat =>
        dbCat.id === mCat.id ||
        (dbCat.name && mCat.name && dbCat.name.trim().toLowerCase() === mCat.name.trim().toLowerCase())
      );

      return {
        ...mCat,
        dbId: dbMatch?.id,
        enabled: dbMatch ? dbMatch.enabled !== false : true
      };
    });
  }, [dbCategories]);

  // ── NAVIGATION HANDLERS ─────────────────────────────────────────
  const handleSelectCategory = (cat) => {
    const config = findCategoryConfig(cat.name) || cat;
    setActiveCategory(config);
    setActiveSubcategory(null);
    setActiveLeafCategory(null);
    setNavLevel(2);
    if (setSelectedCategory) setSelectedCategory(cat.name);
  };

  const handleSelectSubcategory = (subcat) => {
    setActiveSubcategory(subcat);
    setActiveLeafCategory(null);
    setNavLevel(3);
  };

  const handleSelectLeafCategory = (leaf) => {
    setActiveLeafCategory(leaf);
    setNavLevel(4);
  };

  const handleViewAllProducts = () => {
    setActiveLeafCategory(null);
    setNavLevel(4);
  };

  const handleBack = () => {
    if (navLevel === 4) {
      if (activeLeafCategory) {
        setNavLevel(3);
      } else {
        setNavLevel(2);
      }
    } else if (navLevel === 3) {
      setNavLevel(2);
    } else if (navLevel === 2) {
      if (openedFromHome) {
        setOpenedFromHome(false);
        if (setSelectedCategory) setSelectedCategory(null);
        setCurrentScreen('home');
      } else {
        if (setSelectedCategory) setSelectedCategory(null);
        setNavLevel(1);
      }
    } else {
      setCurrentScreen('home');
    }
  };

  // Filtered products for Level 4
  const currentProducts = useMemo(() => {
    return filterProductsByHierarchy(
      activeProducts,
      activeCategory?.name,
      activeSubcategory?.name,
      activeLeafCategory
    );
  }, [activeProducts, activeCategory, activeSubcategory, activeLeafCategory]);

  // ── RENDER LEVEL 4: PRODUCT LISTING ─────────────────────────────
  if (navLevel === 4) {
    return (
      <ProductListingView
        category={activeCategory}
        subcategory={activeSubcategory}
        leafCategory={activeLeafCategory}
        products={currentProducts}
        onBack={handleBack}
      />
    );
  }

  // ── RENDER LEVEL 3: SUBCATEGORY (LEAF CATEGORIES) ───────────────
  if (navLevel === 3) {
    return (
      <SubcategoryView
        category={activeCategory}
        subcategory={activeSubcategory}
        onSelectLeaf={handleSelectLeafCategory}
        onDirectViewAll={handleViewAllProducts}
        onBack={handleBack}
        liveLeafCategories={liveLeafCategories}
      />
    );
  }

  // ── RENDER LEVEL 2: CATEGORY DETAIL ─────────────────────────────
  if (navLevel === 2 && activeCategory) {
    return (
      <CategoryDetailView
        category={activeCategory}
        onSelectSubcategory={handleSelectSubcategory}
        onViewAllProducts={handleViewAllProducts}
        onBack={handleBack}
        liveSubcategories={liveSubcategories}
        liveLeafCategories={liveLeafCategories}
      />
    );
  }

  // ── RENDER LEVEL 1: SHOP BY CATEGORY GRID ───────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── FIXED TOP HEADER ───────────────────────────────────────── */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          backgroundColor: '#FFFFFF',
          elevation: 2,
          shadowColor: '#B64F7D',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }}
        className="px-4 py-3 flex-row items-center justify-between z-30"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-row items-center gap-1 -ml-1 py-1.5 px-2 rounded-xl active:bg-pink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#B64F7D" />
          <Text style={{ color: '#B64F7D' }} className="text-xs font-bold">
            Home
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ color: '#33252F' }} className="text-sm font-extrabold uppercase tracking-wider">
          Shop by Category
        </Text>

        {/* Actions: Search & Cart with Badge */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setCurrentScreen('search')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-[#FFF5F8] items-center justify-center shadow-2xs"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={16} color="#B64F7D" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentScreen('cart')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-[#FFF5F8] items-center justify-center shadow-2xs relative"
            accessibilityLabel="Shopping Cart"
          >
            <Ionicons name="bag-handle-outline" size={17} color="#B64F7D" />
            {cartCount > 0 && (
              <View
                style={{ minWidth: 16, height: 16, paddingHorizontal: 3 }}
                className="absolute -top-1 -right-1 bg-[#C2477A] rounded-full items-center justify-center border border-white"
              >
                <Text className="text-[9px] font-black text-white leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── VERTICALLY SCROLLABLE 2-COLUMN GRID ─────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 16,
          paddingBottom: 110 // Ensures categories 7-12 appear naturally without overlapping bottom nav
        }}
        className="bg-white flex-1"
      >
        {/* Subtle Sub-heading */}
        <View className="mb-4">
          <Text style={{ color: '#33252F' }} className="text-base font-black">
            Explore Collections
          </Text>
          <Text style={{ color: '#82727C' }} className="text-xs font-medium mt-0.5">
            Discover 100% authentic beauty, salon & grooming formulations
          </Text>
        </View>

        {/* Categories 2-Column Responsive Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-3.5">
          {displayCategories.map((cat, idx) => (
            <TouchableOpacity
              key={cat.id || cat.name}
              activeOpacity={0.82}
              onPress={() => handleSelectCategory(cat)}
              style={{
                width: cardWidth,
                backgroundColor: '#FFFFFF',
                borderColor: '#F0E3EA',
                borderWidth: 1,
                borderRadius: 18,
                padding: 10,
                shadowColor: '#B64F7D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 2,
              }}
              className="flex-col justify-between"
            >
              {/* 1. FA5 Icon Box — replaces product category image */}
              {(() => {
                const { icon, color, bg } = getCategoryFA5Icon(cat.name);
                return (
                  <View
                    style={{
                      width: '100%',
                      height: 116,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#F0E3EA',
                      borderWidth: 1,
                      marginBottom: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesome5 name={icon} size={48} color={color} solid />
                  </View>
                );
              })()}

              {/* 2 & 3. FA5 icon badge + Category Title */}
              {(() => {
                const { icon, color, bg } = getCategoryFA5Icon(cat.name);
                return (
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <View
                      style={{ borderColor: '#F0E3EA', borderWidth: 1, backgroundColor: '#FFFFFF', width: 24, height: 24, borderRadius: 12 }}
                      className="items-center justify-center shrink-0"
                    >
                      <FontAwesome5 name={icon} size={11} color={color} solid />
                    </View>
                    <Text
                      style={{ color: '#33252F' }}
                      className="text-[12.5px] font-extrabold flex-1 leading-tight"
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </View>
                );
              })()}

              {/* 4. Explore Products text with right arrow */}
              <View className="flex-row items-center gap-1 mt-0.5 pt-0.5">
                <Text style={{ color: '#82727C' }} className="text-[10.5px] font-semibold">
                  Explore Products
                </Text>
                <Ionicons name="arrow-forward" size={10} color="#B64F7D" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryScreen;
