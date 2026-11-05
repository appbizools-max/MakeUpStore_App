import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';
import { CategoryHeader } from './CategoryHeader';
import { CompactCategoryBanner } from './CompactCategoryBanner';
import { CategoryTitleRow } from './CategoryTitleRow';
import { SubcategorySearchBar } from './SubcategorySearchBar';
import { HorizontalSubcategoryNavigation } from './HorizontalSubcategoryNavigation';
import { PurplleProductCard } from '../../../components/PurplleProductCard';
import { getCartQuantityMap } from '../../../utils/cartKeyUtils';
import { filterProductsByHierarchy } from '../../../config/categoriesHierarchy';

/**
 * Universal Reusable Subcategory Page Template.
 * Complete UI/UX Redesign adhering to final layout hierarchy:
 * 1. Compact Banner
 * 2. Category Icon | Category Name | Explore Products
 * 3. Search subcategories...
 * 4. All | Acne & Blemishes | Anti-Aging | Cleansers | Face Wash | Moisturizers | Serums | Sunscreen →
 * 5. Product Listing (2-column responsive grid)
 */
export const CategoryPage = ({
  parentTitle = 'Categories',
  title = 'Category',
  bannerTitle,
  bannerSubtitle = null,
  image = null,
  subcategories = [],
  onBack,
  onShopAll,
  onSelectSubcategory,
  onExploreProducts,
}) => {
  const {
    activeProducts = [],
    userRole,
    getRolePrice,
    cart = [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    isFavorite,
    toggleFavorite,
    setSelectedProduct,
    setSelectedShade,
    setCurrentScreen,
    openShadeSheet
  } = useApp();

  // Selected subcategory state (defaults to 'all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  const cardWidth = Math.max(150, (windowWidth - 44) / 2);

  // Cart quantity map for fast lookups
  const cartQuantityMap = useMemo(() => {
    return getCartQuantityMap(cart);
  }, [cart]);

  // Handle subcategory pill selection
  const handleSelectSubcategoryPill = (subId, subObj) => {
    setSelectedSubcategory(subId);
    if (onSelectSubcategory && subObj) {
      // Optional callback for analytics or parent tracking
    }
  };

  // Filter products matching category and selected subcategory
  const displayedProducts = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    const catName = (title || '').trim().toLowerCase();

    // 1. Filter by category
    let catProducts = activeProducts.filter(p => {
      const pCat = (p.category || '').trim().toLowerCase();
      return pCat === catName || pCat.includes(catName) || catName.includes(pCat);
    });

    if (catProducts.length === 0) {
      catProducts = filterProductsByHierarchy(activeProducts, title, null, null);
    }

    // 2. Filter by subcategory if not 'all'
    if (selectedSubcategory !== 'all') {
      const activeSubObj = subcategories.find(s => (s.id || s.name) === selectedSubcategory);
      const subName = (activeSubObj?.name || activeSubObj?.title || selectedSubcategory).trim().toLowerCase();

      const subFiltered = catProducts.filter(p => {
        const pSub = (p.subcategory || p.sub_category || '').trim().toLowerCase();
        const pName = (p.name || '').trim().toLowerCase();
        return pSub === subName || pSub.includes(subName) || subName.includes(pSub) || pName.includes(subName);
      });

      if (subFiltered.length > 0) return subFiltered;
      return filterProductsByHierarchy(catProducts, title, subName, null);
    }

    return catProducts;
  }, [activeProducts, title, selectedSubcategory, subcategories]);

  const handleExploreAction = () => {
    setSelectedSubcategory('all');
    if (onExploreProducts) {
      onExploreProducts();
    } else if (onShopAll) {
      onShopAll();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <CategoryHeader
        parentTitle={parentTitle}
        title={title}
        onBack={onBack}
        onShopAll={onShopAll || handleExploreAction}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 120 }}
        className="bg-white flex-1"
      >
        {/* 1. COMPACT BANNER (Shorter, cleaner ribbon) */}
        <CompactCategoryBanner
          title={bannerTitle || title}
          subtitle={bannerSubtitle}
        />

        {/* 2. CATEGORY ICON | CATEGORY NAME | EXPLORE PRODUCTS (In one single line) */}
        <CategoryTitleRow
          title={title}
          image={image}
          onExploreProducts={handleExploreAction}
          exploreText="Explore All"
        />

        {/* 3. SEARCH SUBCATEGORIES (Text and Voice Search) */}
        <SubcategorySearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search subcategories..."
          currentCategoryName={title}
        />

        {/* 4. ALL | SUBCATEGORY 1 | SUBCATEGORY 2 → (Clean horizontal list, no icons, no counts) */}
        <HorizontalSubcategoryNavigation
          subcategories={subcategories}
          selectedSubcategoryId={selectedSubcategory}
          onSelectSubcategory={handleSelectSubcategoryPill}
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        />

        {/* 5. PRODUCT LISTING (2-column responsive beauty grid) */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          {displayedProducts.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                rowGap: 14,
              }}
            >
              {displayedProducts.map((product, idx) => (
                <PurplleProductCard
                  key={product.id || idx}
                  product={product}
                  cardWidth={cardWidth}
                  userRole={userRole}
                  getRolePrice={getRolePrice}
                  cartQuantityMap={cartQuantityMap}
                  addToCart={addToCart}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                  onPressProduct={(prod, shade) => {
                    if (setSelectedShade && shade) setSelectedShade(shade);
                    if (setSelectedProduct) setSelectedProduct(prod);
                    if (setCurrentScreen) setCurrentScreen('product');
                  }}
                  onOpenShadeSheet={openShadeSheet}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 45,
                paddingHorizontal: 24,
                backgroundColor: '#FFF5F8',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F8D7E6',
                marginTop: 8,
              }}
            >
              <Ionicons name="sparkles-outline" size={34} color="#C2477A" style={{ marginBottom: 10 }} />
              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '800', textAlign: 'center' }}>
                No products found in this selection
              </Text>
              <Text
                style={{
                  color: '#8C7078',
                  fontSize: 11.5,
                  fontWeight: '500',
                  marginTop: 4,
                  textAlign: 'center',
                  lineHeight: 16,
                }}
              >
                Try selecting another subcategory or tap below to browse all {title} products.
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedSubcategory('all')}
                style={{
                  marginTop: 14,
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  backgroundColor: '#C2477A',
                  borderRadius: 20,
                  shadowColor: '#C2477A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
                  View All {title} Products
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryPage;
