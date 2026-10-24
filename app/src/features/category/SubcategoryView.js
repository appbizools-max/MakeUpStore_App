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
import { getSafeImageSource } from '../../utils/imageUtils';
import { getLeafCategoriesForSubcategory } from '../../config/categoriesHierarchy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SubcategoryView = ({
  category,
  subcategory,
  onSelectLeaf,
  onBack,
  onDirectViewAll,
  liveLeafCategories = null
}) => {
  // Compute leaf categories dynamically from live props or fallback
  const leafCategories = useMemo(() => {
    // 1. If embedded directly in subcategory object
    if (subcategory?.leafCategories && Array.isArray(subcategory.leafCategories) && subcategory.leafCategories.length > 0) {
      return subcategory.leafCategories.filter(l => l.enabled !== false);
    }

    // 2. If liveLeafCategories passed from AppContext
    if (liveLeafCategories && Array.isArray(liveLeafCategories) && liveLeafCategories.length > 0) {
      const nSubId = (subcategory?.id || '').toLowerCase().trim();
      const nSubName = (subcategory?.name || '').toLowerCase().trim();
      const matched = liveLeafCategories.filter(l => {
        if (l.enabled === false) return false;
        const lSubId = (l.subcategoryId || '').toLowerCase().trim();
        const lSubName = (l.subcategoryName || '').toLowerCase().trim();
        return (nSubId && lSubId === nSubId) || (nSubName && (lSubId === nSubName || lSubName === nSubName));
      });
      if (matched.length > 0) {
        return matched.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      }
    }

    // 3. Fallback to categoriesHierarchy helper
    return getLeafCategoriesForSubcategory(subcategory, category);
  }, [subcategory, category, liveLeafCategories]);

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
          <Text className="text-xs font-bold text-[#C2477A]">Back</Text>
        </TouchableOpacity>

        <Text className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider" numberOfLines={1}>
          {subcategory?.name || 'Subcategory'}
        </Text>

        <TouchableOpacity
          onPress={onDirectViewAll}
          activeOpacity={0.7}
          className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]"
        >
          <Text className="text-[11px] font-bold text-[#C2477A]">View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* ── SUBCATEGORY BANNER ──────────────────────────────────────── */}
        <View className="mx-4 mt-3 mb-4 rounded-2xl overflow-hidden shadow-xs border border-[#FCE4EC] bg-[#FFF0F5] relative h-36">
          <Image
            source={getSafeImageSource(subcategory?.image, category?.fallbackImage || '')}
            className="w-full h-full object-cover"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent justify-end p-4">
            <View className="bg-white/20 self-start px-2 py-0.5 rounded-md mb-1 backdrop-blur-md">
              <Text className="text-white text-[10px] font-black uppercase tracking-wider">
                {category?.name}
              </Text>
            </View>
            <Text className="text-xl font-black text-white leading-tight">
              {subcategory?.name}
            </Text>
            {subcategory?.tagline ? (
              <Text className="text-xs text-white/90 font-medium mt-0.5" numberOfLines={1}>
                {subcategory.tagline}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── SECTION TITLE ───────────────────────────────────────────── */}
        <View className="px-4 mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wide">
            Select Category
          </Text>
          <TouchableOpacity onPress={onDirectViewAll}>
            <Text className="text-xs font-bold text-[#C2477A]">All {subcategory?.name} ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── LEAF CATEGORIES LIST / CARDS ───────────────────────────── */}
        <View className="px-4 gap-y-2.5">
          {leafCategories.map((leaf, index) => (
            <TouchableOpacity
              key={leaf.id || index}
              activeOpacity={0.85}
              onPress={() => onSelectLeaf(leaf)}
              className="bg-white rounded-2xl p-3 border border-[#FCE4EC] flex-row items-center justify-between shadow-2xs active:bg-[#FFF5F8]"
            >
              <View className="flex-row items-center gap-3 flex-1">
                {/* Visual Indicator / Thumbnail Image with beauty fallback */}
                <View className="w-12 h-12 rounded-xl bg-[#FFF0F5] border border-[#FCE4EC] overflow-hidden items-center justify-center shadow-2xs">
                  {leaf.image ? (
                    <Image
                      source={getSafeImageSource(leaf.image, '')}
                      className="w-full h-full object-cover"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="sparkles" size={18} color="#C2477A" />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#3A2430]">
                    {leaf.name}
                  </Text>
                  <Text className="text-[11px] text-[#8C7078] font-medium mt-0.5" numberOfLines={1}>
                    {Array.isArray(leaf.keywords) && leaf.keywords.length > 0
                      ? leaf.keywords.slice(0, 3).join(' • ')
                      : 'Explore collection'}
                  </Text>
                </View>
              </View>

              <View className="w-7 h-7 rounded-full bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                <Ionicons name="chevron-forward" size={14} color="#C2477A" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
