import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';
import { CategoryHeader } from './CategoryHeader';
import { CategoryHeroBanner } from './CategoryHeroBanner';
import { SubcategorySectionHeader } from './SubcategorySectionHeader';
import { SubcategoryFilter } from './SubcategoryFilter';
import { SubcategoryCard } from './SubcategoryCard';

/**
 * Universal Reusable Subcategory Page Template.
 * Banner images removed � uses text-only CategoryHeroBanner and SubcategoryCard.
 */
export const CategoryPage = ({
  parentTitle = 'Categories',
  title = 'Category',
  bannerTitle,
  bannerSubtitle = 'Discover our curated collection.',
  subcategories = [],
  sectionTitle = 'SELECT CATEGORY',
  sectionCtaText,
  onBack,
  onShopAll,
  onSelectSubcategory,
  onExploreProducts,
}) => {
  const { activeProducts = [] } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const subcategoriesWithCounts = useMemo(() => {
    return subcategories.map((sub, idx) => {
      const subName = sub.title || sub.name || '';
      const subKeywords = Array.isArray(sub.keywords) ? sub.keywords : [];
      const count = activeProducts.filter(p => {
        const text = `${p.name} ${p.subcategory || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        return (subName && text.includes(subName.toLowerCase())) ||
               subKeywords.some(k => text.includes(k.toLowerCase()));
      }).length;
      const fallbackCount = Math.max(count, sub.productCount || (28 - idx * 3));
      return {
        ...sub,
        computedCount: count > 0 ? count : fallbackCount,
        displayTitle: subName,
        displayDesc: sub.description || sub.tagline || 'Explore this collection.',
      };
    });
  }, [subcategories, activeProducts]);

  const filteredSubcategories = useMemo(() => {
    if (selectedFilter === 'all') return subcategoriesWithCounts;
    return subcategoriesWithCounts.filter(s =>
      s.id === selectedFilter || s.name === selectedFilter || s.displayTitle === selectedFilter
    );
  }, [subcategoriesWithCounts, selectedFilter]);

  const filterOptions = useMemo(() => {
    return subcategoriesWithCounts.map(s => ({ id: s.id || s.name, name: s.displayTitle }));
  }, [subcategoriesWithCounts]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CategoryHeader parentTitle={parentTitle} title={title} onBack={onBack} onShopAll={onShopAll} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 110 }}
        className="bg-white flex-1"
      >
        <CategoryHeroBanner
          title={bannerTitle || title}
          subtitle={bannerSubtitle}
          onExplore={onExploreProducts || onShopAll}
        />
        <SubcategorySectionHeader
          title={sectionTitle}
          ctaText={sectionCtaText || `All ${title}`}
          onCtaPress={onShopAll}
        />
        {filterOptions.length > 1 && (
          <SubcategoryFilter
            options={filterOptions}
            selectedOption={selectedFilter}
            onSelectOption={setSelectedFilter}
          />
        )}
        {filteredSubcategories.length > 0 ? (
          filteredSubcategories.map((sub, idx) => (
            <SubcategoryCard
              key={sub.id || idx}
              title={sub.displayTitle}
              description={sub.displayDesc}
              productCount={sub.computedCount}
              parentCategoryName={title}
              image={sub.image || sub.imageUrl}
              onPress={() => onSelectSubcategory?.(sub)}
            />
          ))
        ) : (
          <View className="items-center justify-center py-12 px-6">
            <View className="w-14 h-14 rounded-full bg-[#FFF5F8] items-center justify-center mb-2 border border-[#F0E3EA]">
              <Ionicons name="sparkles-outline" size={24} color="#B64F7D" />
            </View>
            <Text style={{ color: '#33252F' }} className="text-sm font-bold mb-1">No Subcategories Found</Text>
            <Text style={{ color: '#82727C' }} className="text-xs text-center mb-3">Explore all products in this category.</Text>
            <TouchableOpacity onPress={onShopAll} style={{ backgroundColor: '#B64F7D' }} className="px-4 py-2 rounded-full">
              <Text className="text-white text-xs font-bold">Shop All Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export const SelectCategoryPage = CategoryPage;
export default CategoryPage;
