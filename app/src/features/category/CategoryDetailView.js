import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSubcategoriesForCategory } from '../../config/categoriesHierarchy';
import { getSafeImageSource } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CategoryDetailView = ({
  category,
  onSelectSubcategory,
  onBack,
  onViewAllProducts,
  liveSubcategories = null,
  liveLeafCategories = null
}) => {
  // Compute subcategories dynamically from live props with fallback
  const subcategories = useMemo(() => {
    if (liveSubcategories && Array.isArray(liveSubcategories) && liveSubcategories.length > 0) {
      const nCatId = (category?.id || '').toLowerCase().trim();
      const nCatName = (category?.name || '').toLowerCase().trim();
      const nCatDbKey = (category?.dbKey || '').toLowerCase().trim();

      const matched = liveSubcategories.filter(s => {
        if (s.enabled === false) return false;
        const sCatId = (s.categoryId || s.category_id || '').toLowerCase().trim();
        const sCatName = (s.categoryName || s.category_name || '').toLowerCase().trim();

        return (nCatId && sCatId === nCatId) ||
               (nCatName && (sCatId === nCatName || sCatName === nCatName)) ||
               (nCatDbKey && sCatId === nCatDbKey);
      });

      if (matched.length > 0) {
        return matched
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
          .map(s => {
            // Attach leaf categories if available from liveLeafCategories
            let childLeaves = [];
            if (liveLeafCategories && Array.isArray(liveLeafCategories)) {
              const sId = (s.id || '').toLowerCase().trim();
              const sName = (s.name || '').toLowerCase().trim();
              childLeaves = liveLeafCategories.filter(l => {
                if (l.enabled === false) return false;
                const lSubId = (l.subcategoryId || '').toLowerCase().trim();
                const lSubName = (l.subcategoryName || '').toLowerCase().trim();
                return (sId && lSubId === sId) || (sName && (lSubId === sName || lSubName === sName));
              });
            }
            if (childLeaves.length === 0 && Array.isArray(s.leafCategories)) {
              childLeaves = s.leafCategories.filter(l => l.enabled !== false);
            }
            return {
              ...s,
              leafCategories: childLeaves
            };
          });
      }
    }

    // Fallback to static helper
    return getSubcategoriesForCategory(category);
  }, [category, liveSubcategories, liveLeafCategories]);

  return (
    <View className="flex-1 bg-white">
      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <View className="bg-white border-b border-[#FCE4EC] px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-lg active:bg-pink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#C2477A" />
          <Text className="text-xs font-bold text-[#C2477A]">Categories</Text>
        </TouchableOpacity>

        <Text className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider" numberOfLines={1}>
          {category?.name || 'Category'}
        </Text>

        <TouchableOpacity
          onPress={onViewAllProducts}
          activeOpacity={0.7}
          className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]"
        >
          <Text className="text-[11px] font-bold text-[#C2477A]">Shop All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── TOP HERO BANNER ─────────────────────────────────────────── */}
        <View className="mx-4 mt-3 mb-4 rounded-2xl overflow-hidden shadow-xs border border-[#FCE4EC] bg-[#FFF0F5] relative h-44">
          <Image
            source={getSafeImageSource(category?.image, category?.fallbackImage || '')}
            className="w-full h-full object-cover"
            resizeMode="cover"
          />
          {/* Subtle dark gradient overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent justify-end p-4">
            <View className="bg-white/20 self-start px-2.5 py-0.5 rounded-full mb-1.5 backdrop-blur-md">
              <Text className="text-white text-[10px] font-extrabold tracking-wider uppercase">
                Featured Collection
              </Text>
            </View>
            <Text className="text-2xl font-black text-white leading-tight">
              {category?.name}
            </Text>
            {category?.tagline ? (
              <Text className="text-xs font-bold text-white/95 mt-0.5">
                {category.tagline}
              </Text>
            ) : null}
            {category?.description ? (
              <Text className="text-[11px] text-white/80 font-medium mt-1 leading-4" numberOfLines={2}>
                {category.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── SECTION HEADER ─────────────────────────────────────────── */}
        <View className="px-4 mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wide">
            Subcategories
          </Text>
          <TouchableOpacity onPress={onViewAllProducts}>
            <Text className="text-xs font-bold text-[#C2477A]">Explore All ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── SUBCATEGORIES VISUAL LIST / CARDS ───────────────────────── */}
        <View className="px-4 gap-y-3">
          {subcategories.map((sub, idx) => (
            <TouchableOpacity
              key={sub.id || idx}
              activeOpacity={0.88}
              onPress={() => onSelectSubcategory(sub)}
              className="bg-white rounded-2xl border border-[#FCE4EC] p-3 flex-row items-center justify-between shadow-2xs active:bg-[#FFF5F8]"
            >
              <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                {/* Visual Thumbnail */}
                <View className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF0F5] border border-[#FCE4EC]">
                  <Image
                    source={getSafeImageSource(sub.image, '')}
                    className="w-full h-full object-cover"
                    resizeMode="cover"
                  />
                </View>

                {/* Name & Subtle Tagline */}
                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#3A2430] leading-snug">
                    {sub.name}
                  </Text>
                  {sub.tagline ? (
                    <Text className="text-[11px] text-[#8C7078] font-medium mt-0.5" numberOfLines={1}>
                      {sub.tagline}
                    </Text>
                  ) : null}
                  {sub.leafCategories && sub.leafCategories.length > 0 ? (
                    <Text className="text-[10px] font-semibold text-[#C2477A] mt-0.5">
                      {sub.leafCategories.length} Select Categories
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* View All / Arrow CTA */}
              <View className="flex-row items-center gap-1 bg-[#FFF0F5] px-2.5 py-1.5 rounded-full border border-[#FCE4EC]">
                <Text className="text-[10px] font-bold text-[#C2477A]">View</Text>
                <Ionicons name="chevron-forward" size={12} color="#C2477A" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
