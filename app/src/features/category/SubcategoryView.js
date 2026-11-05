import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLeafCategoriesForSubcategory } from '../../config/categoriesHierarchy';
import { CategoryHeader } from './components/CategoryHeader';
import { ProductListingView } from './ProductListingView';

export const SubcategoryView = ({
  category,
  subcategory,
  onSelectLeaf,
  onBack,
  onDirectViewAll,
  liveLeafCategories = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const leafCategories = useMemo(() => {
    if (subcategory?.leafCategories && Array.isArray(subcategory.leafCategories) && subcategory.leafCategories.length > 0) {
      return subcategory.leafCategories.filter(l => l.enabled !== false);
    }
    if (liveLeafCategories && Array.isArray(liveLeafCategories) && liveLeafCategories.length > 0) {
      const nSubId   = (subcategory?.id   || '').toLowerCase().trim();
      const nSubName = (subcategory?.name || '').toLowerCase().trim();
      const matched = liveLeafCategories.filter(l => {
        if (l.enabled === false) return false;
        const lSubId   = (l.subcategoryId   || '').toLowerCase().trim();
        const lSubName = (l.subcategoryName || '').toLowerCase().trim();
        return (nSubId && lSubId === nSubId) || (nSubName && (lSubId === nSubName || lSubName === nSubName));
      });
      if (matched.length > 0) {
        return matched.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      }
    }
    return getLeafCategoriesForSubcategory(subcategory, category);
  }, [subcategory, category, liveLeafCategories]);

  if (!leafCategories || leafCategories.length === 0) {
    return (
      <ProductListingView
        category={category}
        subcategory={subcategory}
        onBack={onBack}
      />
    );
  }

  const subName = subcategory?.name || 'Subcategory';
  const catName = category?.name || 'Category';

  const filteredLeaves = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return leafCategories;
    return leafCategories.filter(l => (l.name || '').toLowerCase().includes(q));
  }, [leafCategories, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <CategoryHeader
        parentTitle={catName}
        title={subName}
        categoryIcon="sparkles-outline"
        categoryImage={subcategory?.image || null}
        onBack={onBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110
        }}
        className="bg-white flex-1"
      >
        <View
          style={{
            backgroundColor: '#FFF0F5',
            borderColor: '#F6DCE6',
            borderWidth: 1.2,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              borderColor: '#F8B4D9',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              flexShrink: 0
            }}
          >
            {subcategory?.image ? (
              <Image
                source={{ uri: subcategory.image }}
                style={{ width: '84%', height: '84%' }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="sparkles" size={20} color="#C2477A" />
            )}
          </View>

          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
              {subName}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
              Explore verified formulations & shades
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onDirectViewAll}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#C2477A',
              borderWidth: 1.3,
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 13,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0
            }}
          >
            <Text style={{ color: '#C2477A', fontSize: 12, fontWeight: '800' }}>
              Explore All
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#C2477A" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1.2,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 46,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            elevation: 1
          }}
        >
          <Ionicons name="search" size={18} color="#C2477A" style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${subName.toLowerCase()} types...`}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, color: '#1F2937', fontSize: 13.5, fontWeight: '500' }}
            returnKeyType="search"
          />
        </View>

        <View className="space-y-3">
          {filteredLeaves.map((leaf) => (
            <TouchableOpacity
              key={leaf.id || leaf.name}
              activeOpacity={0.7}
              onPress={() => onSelectLeaf && onSelectLeaf(leaf)}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#F0E3EA',
                borderWidth: 1.2,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 18,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                elevation: 1
              }}
            >
              <View style={{ flex: 1, paddingRight: 14 }}>
                <Text style={{ color: '#1F2937', fontSize: 15.5, fontWeight: '800' }}>
                  {leaf.name}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 12.5, fontWeight: '500', marginTop: 4 }}>
                  {leaf.description || `Browse all ${leaf.name} collections.`}
                </Text>
              </View>

              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFF0F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Ionicons name="chevron-forward" size={16} color="#C2477A" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubcategoryView;
