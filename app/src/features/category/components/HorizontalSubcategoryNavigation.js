import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

/**
 * HorizontalSubcategoryNavigation
 * Clean, modern horizontal scrolling navigation for subcategories.
 * - Strictly NO icon images, NO thumbnail images, NO decorative images
 * - Strictly NO product count numbers
 * - Clean professional typography and balanced padding
 * - Smooth horizontal scroll
 * - Active pill highlighted in #C2477A
 */
export const HorizontalSubcategoryNavigation = ({
  subcategories = [],
  selectedSubcategoryId = 'all',
  onSelectSubcategory,
  searchQuery = '',
  onResetSearch,
}) => {
  // Filter subcategories dynamically if search query is entered
  const filteredList = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return subcategories;
    const q = searchQuery.trim().toLowerCase();
    return subcategories.filter(sub => {
      const name = (sub.name || sub.title || '').toLowerCase();
      const keywords = Array.isArray(sub.keywords) ? sub.keywords.join(' ').toLowerCase() : '';
      return name.includes(q) || keywords.includes(q);
    });
  }, [subcategories, searchQuery]);

  return (
    <View style={{ marginBottom: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
      >
        {/* 'All' Subcategory Option */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectSubcategory('all', null)}
          style={{
            backgroundColor: selectedSubcategoryId === 'all' ? '#C2477A' : '#FFFFFF',
            borderColor: selectedSubcategoryId === 'all' ? '#C2477A' : '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            paddingVertical: 7,
            paddingHorizontal: 15,
            marginRight: 8,
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedSubcategoryId === 'all' ? 0.2 : 0.04,
            shadowRadius: 3,
            elevation: selectedSubcategoryId === 'all' ? 2 : 1,
          }}
        >
          <Text
            style={{
              color: selectedSubcategoryId === 'all' ? '#FFFFFF' : '#2B1A24',
              fontSize: 12,
              fontWeight: selectedSubcategoryId === 'all' ? '800' : '600',
              letterSpacing: 0.1,
            }}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic Subcategory Names Only (No icons, no images, no counts) */}
        {filteredList.map((sub, idx) => {
          const subId = sub.id || sub.name || String(idx);
          const subName = sub.name || sub.title || `Subcategory ${idx + 1}`;
          const isSelected = selectedSubcategoryId === subId || selectedSubcategoryId === subName;

          return (
            <TouchableOpacity
              key={subId}
              activeOpacity={0.8}
              onPress={() => onSelectSubcategory(subId, sub)}
              style={{
                backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 7,
                paddingHorizontal: 14,
                marginRight: 8,
                shadowColor: '#C2477A',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isSelected ? 0.2 : 0.04,
                shadowRadius: 3,
                elevation: isSelected ? 2 : 1,
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : '#2B1A24',
                  fontSize: 12,
                  fontWeight: isSelected ? '800' : '600',
                  letterSpacing: 0.1,
                }}
                numberOfLines={1}
              >
                {subName}
              </Text>
            </TouchableOpacity>
          );
        })}

        {filteredList.length === 0 && searchQuery.trim().length > 0 && (
          <TouchableOpacity
            onPress={onResetSearch}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: '#8A2D53', fontSize: 11, fontWeight: '700' }}>
              No matching subcategories. Reset search ↺
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default HorizontalSubcategoryNavigation;

