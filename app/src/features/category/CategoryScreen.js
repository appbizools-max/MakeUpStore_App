import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {
  MAIN_CATEGORIES,
  findCategoryConfig,
  filterProductsByHierarchy
} from '../../config/categoriesHierarchy';
import { getSafeImageUri, getSafeImageSource, DEFAULT_CATEGORY_FALLBACKS } from '../../utils/imageUtils';
import { CategoryDetailView } from './CategoryDetailView';
import { SubcategoryView } from './SubcategoryView';
import { ProductListingView } from './ProductListingView';

export const CategoryScreen = () => {
  const {
    categories: dbCategories,
    subcategories: liveSubcategories,
    leafCategories: liveLeafCategories,
    selectedCategory,
    setSelectedCategory,
    activeProducts,
    setCurrentScreen
  } = useApp();

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
      const matched = findCategoryConfig(selectedCategory);
      setActiveCategory(matched);
      setNavLevel(2);
      setOpenedFromHome(true);
    }
  }, [selectedCategory]);

  // Combined categories list (using MAIN_CATEGORIES with any custom DB categories preserved)
  // Combined categories list (using active DB categories as source of truth, matching MAIN_CATEGORIES configs)
  const displayCategories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) {
      return MAIN_CATEGORIES.map(c => ({
        ...c,
        image: getSafeImageUri(c.image, c.fallbackImage || DEFAULT_CATEGORY_FALLBACKS.default),
        fallbackImage: getSafeImageUri(c.fallbackImage, DEFAULT_CATEGORY_FALLBACKS.default),
      }));
    }

    // Filter active categories from db
    const activeDbCats = dbCategories.filter(c => c.enabled !== false);
    if (activeDbCats.length === 0) return [];

    return activeDbCats.map(dbCat => {
      const c = MAIN_CATEGORIES.find(mc =>
        mc.id === dbCat.id ||
        (dbCat.name && mc.name && dbCat.name.trim().toLowerCase() === mc.name.trim().toLowerCase()) ||
        (dbCat.name && mc.dbKey && dbCat.name.trim().toLowerCase() === mc.dbKey.trim().toLowerCase())
      );

      const safeImage = getSafeImageUri(dbCat.image || c?.image, c?.fallbackImage || DEFAULT_CATEGORY_FALLBACKS.default);
      const safeFallback = getSafeImageUri(c?.fallbackImage || dbCat.image, DEFAULT_CATEGORY_FALLBACKS.default);

      return {
        id: dbCat.id,
        dbKey: c?.dbKey || dbCat.name.toLowerCase(),
        name: dbCat.name,
        image: safeImage,
        fallbackImage: safeFallback,
        tagline: c?.tagline || 'Premium Beauty Collection',
        description: c?.description || 'Explore verified authentic formulations',
        accent: c?.accent || '#C2477A',
        bgLight: c?.bgLight || '#FFF0F5',
        enabled: dbCat.enabled
      };
    });
  }, [dbCategories]);

  // ── NAVIGATION HANDLERS ─────────────────────────────────────────

  // Level 1 -> Level 2
  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    setActiveLeafCategory(null);
    setNavLevel(2);
    if (setSelectedCategory) setSelectedCategory(cat);
  };

  // Level 2 -> Level 3
  const handleSelectSubcategory = (subcat) => {
    setActiveSubcategory(subcat);
    setActiveLeafCategory(null);
    setNavLevel(3);
  };

  // Level 3 -> Level 4
  const handleSelectLeafCategory = (leaf) => {
    setActiveLeafCategory(leaf);
    setNavLevel(4);
  };

  // Direct View All from Level 2 or Level 3
  const handleViewAllProducts = () => {
    setActiveLeafCategory(null);
    setNavLevel(4);
  };

  // Back Navigation Handler
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
      {/* ── TOP HEADER ────────────────────────────────────────────── */}
      <View className="bg-white border-b border-[#FCE4EC] px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-lg active:bg-pink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#C2477A" />
          <Text className="text-xs font-bold text-[#C2477A]">Home</Text>
        </TouchableOpacity>

        <Text className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Shop by Category
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentScreen('search')}
          activeOpacity={0.7}
          className="w-8 h-8 rounded-full bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]"
        >
          <Ionicons name="search" size={15} color="#C2477A" />
        </TouchableOpacity>
      </View>

      {/* ── 2-3 COLUMN RESPONSIVE GRID ────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 16,
          paddingBottom: 95
        }}
      >
        {/* Subtle Sub-heading */}
        <View className="mb-4">
          <Text className="text-base font-black text-[#3A2430]">
            Explore Collections
          </Text>
          <Text className="text-xs text-[#8C7078] font-medium mt-0.5">
            Discover 100% authentic beauty, salon & grooming formulations
          </Text>
        </View>

        {/* Categories Grid or Empty State */}
        {displayCategories.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <View className="w-16 h-16 rounded-full bg-[#FFF0F5] items-center justify-center mb-3 border border-[#FCE4EC]">
              <Ionicons name="grid-outline" size={28} color="#C2477A" />
            </View>
            <Text className="text-base font-extrabold text-[#3A2430] mb-1 text-center">
              No Categories Available
            </Text>
            <Text className="text-xs text-[#8C7078] text-center mb-4 leading-4">
              Please check back shortly or explore our best sellers from the home screen.
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              className="bg-[#C2477A] px-5 py-2.5 rounded-xl shadow-xs"
            >
              <Text className="text-xs font-bold text-white">Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-3.5">
            {displayCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id || cat.name}
                activeOpacity={0.88}
                onPress={() => handleSelectCategory(cat)}
                style={{ width: cardWidth }}
                className="bg-white rounded-2xl border border-[#FCE4EC] p-2.5 shadow-2xs active:scale-[0.98] transition-transform"
              >
                {/* Category Image - Consistent Aspect Ratio */}
                <View className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFF5F8] border border-[#FCE4EC] mb-2 relative">
                  <Image
                    source={getSafeImageSource(cat.image, cat.fallbackImage)}
                    className="w-full h-full object-cover"
                    resizeMode="cover"
                  />
                </View>

                {/* Category Name Only - DO NOT show product or category counts */}
                <View className="items-center py-1">
                  <Text
                    className="text-xs font-bold text-[#3A2430] text-center"
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryScreen;
