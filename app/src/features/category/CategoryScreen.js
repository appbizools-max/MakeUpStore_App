import React, { useState, useEffect, useMemo } from 'react';
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
  findCategoryConfig,
  filterProductsByHierarchy,
  CATEGORY_IMAGES
} from '../../config/categoriesHierarchy';

import { getCategoryFA5Icon } from '../../utils/categoryIcons';
import { getSafeImageSource } from '../../utils/imageUtils';
import { CategoryDetailView } from './CategoryDetailView';
import { SubcategoryView } from './SubcategoryView';
import { ProductListingView } from './ProductListingView';

/**
 * CategoryScreen - Luxury Cosmetics Category Experience (Nykaa-inspired)
 *
 * 1. Single Source of Truth: Driven directly by live Supabase categories (CRUD in sync with Admin Panel).
 * 2. Vertical Row Layout: One category per row, eliminating square cards and 2-column grids.
 * 3. 3D Nykaa Icon Consistency: Reuses identical 3D circular cosmetic product illustrations.
 * 4. Distinct Explore Now Pill: Clear interactive navigation into subcategories & product catalogs.
 */
export const CategoryScreen = () => {
  const {
    categories: dbCategories = [],
    subcategories: liveSubcategories = [],
    leafCategories: liveLeafCategories = [],
    selectedCategory,
    setSelectedCategory,
    activeProducts = [],
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

  // ── NAVIGATION LEVELS ───────────────────────────────────────────
  // level 1: Main Categories Vertical List ("Shop by Category")
  // level 2: Category Detail (Hero Banner + Subcategories visual list)
  // level 3: Subcategory Screen (Subcategory Banner + Leaf Categories)
  // level 4: Product Listing Screen (2-column products grid with search & filters)
  const [navLevel, setNavLevel] = useState(1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeLeafCategory, setActiveLeafCategory] = useState(null);
  const [openedFromHome, setOpenedFromHome] = useState(false);

  // ── DYNAMIC SINGLE SOURCE OF TRUTH: LIVE SUPABASE CATEGORIES ────
  const displayCategories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return [];

    return dbCategories
      .filter(c => c && c.enabled !== false && !c.id?.startsWith('app_') && !c.id?.startsWith('salbeau_'))
      .sort((a, b) => (Number(a.sort_order ?? a.sortOrder ?? 0)) - (Number(b.sort_order ?? b.sortOrder ?? 0)))
      .map(cat => {
        const fallbackConfig = findCategoryConfig(cat.name);
        // Canonical 3D icon URL from database, fallback to hierarchy config
        const normKey = (cat.name || '').toLowerCase().trim();
        let fallbackImage = null;
        if (normKey.includes('makeup')) fallbackImage = CATEGORY_IMAGES.makeup;
        else if (normKey.includes('skin')) fallbackImage = CATEGORY_IMAGES.skincare;
        else if (normKey.includes('hair care') || normKey.includes('salon')) fallbackImage = CATEGORY_IMAGES.hairCare;
        else if (normKey.includes('styling') || normKey.includes('tool') || normKey.includes('appliance')) fallbackImage = CATEGORY_IMAGES.hairStylingTools;
        else if (normKey.includes('bath') || normKey.includes('body')) fallbackImage = CATEGORY_IMAGES.bathBody;
        else if (normKey.includes('fragrance') || normKey.includes('perfume') || normKey.includes('freshener')) fallbackImage = CATEGORY_IMAGES.fragrance;
        else if (normKey.includes('men') || normKey.includes('grooming')) fallbackImage = CATEGORY_IMAGES.mensGrooming;
        else if (normKey.includes('nail')) fallbackImage = CATEGORY_IMAGES.nailCare;
        else if (normKey.includes('baby')) fallbackImage = CATEGORY_IMAGES.babyCare;
        else if (normKey.includes('wellness') || normKey.includes('personal')) fallbackImage = CATEGORY_IMAGES.personalCare;
        else if (normKey.includes('gift') || normKey.includes('kit')) fallbackImage = CATEGORY_IMAGES.beautyKits;

        const imageUrl = cat.image || cat.image_url || fallbackConfig?.image || fallbackImage || null;
        const { icon, color } = getCategoryFA5Icon(cat.name);

        const subCount = (liveSubcategories || []).filter(s =>
          (s.categoryId === cat.id || s.category_id === cat.id) ||
          (s.parentCategory && s.parentCategory.toLowerCase() === cat.name.toLowerCase())
        ).length;

        return {
          id: cat.id,
          name: cat.name,
          image: imageUrl,
          sort_order: cat.sort_order,
          icon,
          iconColor: color,
          tagline: cat.tagline || fallbackConfig?.tagline || '100% Authentic Luxury Formulations',
          description: cat.description || fallbackConfig?.description || '',
          subcategoriesCount: subCount
        };
      });
  }, [dbCategories, liveSubcategories]);

  // Synchronize when navigating with selectedCategory from HomeScreen
  useEffect(() => {
    if (selectedCategory) {
      const categoryName = typeof selectedCategory === 'string' ? selectedCategory : selectedCategory?.name;
      const matched = displayCategories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
      if (matched) {
        setActiveCategory(matched);
        setNavLevel(2);
        setOpenedFromHome(true);
      }
    }
  }, [selectedCategory, displayCategories]);

  // ── NAVIGATION HANDLERS ─────────────────────────────────────────
  const handleSelectCategory = (cat) => {
    const config = findCategoryConfig(cat.name) || {};
    const fullCategory = { ...cat, ...config };
    setActiveCategory(fullCategory);
    setActiveSubcategory(null);
    setActiveLeafCategory(null);

    // If subcategories exist, navigate to Category Detail View (Level 2)
    // If flat category, jump straight to Product Listing View (Level 4)
    if (cat.subcategoriesCount > 0 || (fullCategory.subcategories && fullCategory.subcategories.length > 0)) {
      setNavLevel(2);
    } else {
      setNavLevel(4);
    }

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
    setActiveSubcategory(null);
    setActiveLeafCategory(null);
    setNavLevel(3);
  };

  const handleBack = () => {
    if (navLevel === 3 || navLevel === 4) {
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

  // ── LEVEL 3: PRODUCT LISTING (2-Level Hierarchy: Main Category -> Subcategory) ──
  if (navLevel === 3 || navLevel === 4) {
    return (
      <ProductListingView
        category={activeCategory}
        subcategory={activeSubcategory}
        products={currentProducts}
        onBack={handleBack}
      />
    );
  }

  // ── LEVEL 2: CATEGORY DETAIL ────────────────────────────────────
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

  // ── LEVEL 1: VERTICAL SHOP BY CATEGORY EXPERIENCE ───────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          backgroundColor: '#FFFFFF',
          elevation: 2,
          shadowColor: '#C2477A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
        }}
        className="px-4 py-3 flex-row items-center justify-between z-30"
      >
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-row items-center gap-1 -ml-1 py-1 px-2 rounded-xl active:bg-pink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#C2477A" />
          <Text style={{ color: '#C2477A' }} className="text-xs font-bold">
            Home
          </Text>
        </TouchableOpacity>

        <Text style={{ color: '#2B1A24' }} className="text-sm font-extrabold uppercase tracking-wider">
          Shop by Categories
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setCurrentScreen('search')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-2xs"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={16} color="#C2477A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentScreen('cart')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-2xs relative"
            accessibilityLabel="Shopping Cart"
          >
            <Ionicons name="bag-handle-outline" size={17} color="#C2477A" />
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

      {/* ── VERTICAL ONE-CATEGORY-PER-ROW LIST ───────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110
        }}
        className="bg-white flex-1"
      >
        {/* Module Sub-Header */}
        <View className="mb-4">
          <Text style={{ color: '#2B1A24' }} className="text-base font-black">
            Explore All Collections
          </Text>
          <Text style={{ color: '#8A7A84' }} className="text-xs font-medium mt-0.5">
            Discover 100% authentic cosmetic formulations & beauty essentials
          </Text>
        </View>

        {/* Vertical Category Rows */}
        <View className="space-y-3">
          {displayCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id || cat.name}
              activeOpacity={0.88}
              onPress={() => handleSelectCategory(cat)}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#F3E8EE',
                borderWidth: 1.2,
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 14,
                marginBottom: 12,
                shadowColor: '#C2477A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Left Side: 3D Golden/Pink Circular Icon + Category Title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                {/* 3D Circular Avatar Container */}
                <View
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 33,
                    backgroundColor: '#FFFFFF',
                    borderColor: '#F8B4D9',
                    borderWidth: 1.5,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.16,
                    shadowRadius: 4,
                    elevation: 3,
                    marginRight: 14,
                    flexShrink: 0
                  }}
                >
                  {cat.image ? (
                    <Image
                      source={getSafeImageSource(cat.image)}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  ) : (
                    <FontAwesome5 name={cat.icon || 'sparkles'} size={24} color={cat.iconColor || '#C2477A'} />
                  )}
                </View>

                {/* Typography Area: Category Name */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    style={{ color: '#2B1A24', fontSize: 15, fontWeight: '800', lineHeight: 20 }}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </View>
              </View>

              {/* Right Side: Simple, Elegant Arrow Indicator */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#FFF0F5',
                  borderColor: '#F8B4D9',
                  borderWidth: 1.2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Ionicons name="chevron-forward" size={17} color="#C2477A" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryScreen;
