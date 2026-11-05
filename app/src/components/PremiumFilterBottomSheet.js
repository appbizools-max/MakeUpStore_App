import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PremiumFilterBottomSheet
 * 
 * Elegant White-and-Pink Product Filter Bottom Sheet:
 * - Fixed Header with Drag Handle, Title, and Close action
 * - Fixed Footer with permanently visible "Clear All" and "Apply Filters (N)"
 * - Independently Scrollable Sections:
 *   1. Categories & Dependent Subcategories
 *   2. Brand Partners with In-filter Search & Multi-select
 *   3. Price Range Selection
 */
export const PremiumFilterBottomSheet = ({
  visible,
  onClose,
  categories = [],
  subcategories = [],
  brands = [],
  selectedCategory = 'All',
  onSelectCategory,
  selectedSubcategory = 'All',
  onSelectSubcategory,
  selectedBrands = [],
  onToggleBrand,
  onClearBrands,
  selectedPriceRange = 'all',
  onSelectPriceRange,
  activeFilterCount = 0,
  onClearAll,
  onApply,
  totalMatchingCount = null
}) => {
  const [brandSearch, setBrandSearch] = useState('');

  // Normalize categories list
  const categoryList = [
    'All',
    ...(categories && categories.length > 0
      ? categories.filter(c => c && c.enabled !== false && c.is_active !== false).map(c => c.name || c)
      : ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body', "Men's Grooming", 'Nail Care', 'Beauty Tools'])
  ];

  // Dependent subcategories for selected category
  const activeSubs = (() => {
    if (!selectedCategory || selectedCategory === 'All') return [];
    const parentCat = (categories || []).find(
      c => (c.name || '').toLowerCase() === selectedCategory.toLowerCase()
    );
    return (subcategories || []).filter(s => {
      if (s.enabled === false) return false;
      const sCatId = (s.categoryId || s.category_id || '').toLowerCase();
      const sCatName = (s.categoryName || s.category_name || '').toLowerCase();
      const pId = (parentCat?.id || '').toLowerCase();
      const pName = (parentCat?.name || selectedCategory).toLowerCase();
      return (pId && sCatId === pId) || (sCatName && sCatName === pName);
    });
  })();

  // Filtered brands based on in-modal search
  const filteredBrands = (brands || []).filter(b => {
    const name = b.name || b.brand_name || b;
    if (!brandSearch.trim()) return true;
    return (name || '').toLowerCase().includes(brandSearch.trim().toLowerCase());
  });

  const priceOptions = [
    { id: 'all', label: 'All Prices' },
    { id: 'u500', label: 'Under ₹500' },
    { id: '500_1000', label: '₹500 – ₹1,000' },
    { id: '1000_2000', label: '₹1,000 – ₹2,000' },
    { id: 'a2000', label: 'Above ₹2,000' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }} className="flex-1 justify-end">
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: SCREEN_HEIGHT * 0.85,
                borderColor: '#F0E3EA',
                borderTopWidth: 1.5,
                shadowColor: '#C2477A',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 12,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* ── 1. FIXED HEADER ─────────────────────────────────── */}
              <View className="px-5 pt-3 pb-3 border-b border-[#F0E3EA]">
                {/* Drag Indicator */}
                <View className="items-center mb-2">
                  <View
                    style={{
                      width: 42,
                      height: 4.5,
                      borderRadius: 3,
                      backgroundColor: '#E2D3DC'
                    }}
                  />
                </View>

                {/* Header Title Row */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FFF0F5',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Ionicons name="options-outline" size={17} color="#C2477A" />
                    </View>
                    <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '800' }}>
                      Filters
                    </Text>
                    {activeFilterCount > 0 && (
                      <View
                        style={{
                          backgroundColor: '#C2477A',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 12
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' }}>
                          {activeFilterCount} Active
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#F9FAFB',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#F0E3EA'
                    }}
                  >
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── 2. INDEPENDENTLY SCROLLABLE CONTENT ────────────── */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 24
                }}
                className="flex-1"
              >
                {/* SECTION 1: CATEGORIES & SUBCATEGORIES */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>
                      CATEGORIES
                    </Text>
                    {selectedCategory !== 'All' && (
                      <TouchableOpacity
                        onPress={() => {
                          if (onSelectCategory) onSelectCategory('All');
                          if (onSelectSubcategory) onSelectSubcategory('All');
                        }}
                      >
                        <Text style={{ color: '#C2477A', fontSize: 11.5, fontWeight: '700' }}>
                          Reset Category
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Category Chips */}
                  <View className="flex-row flex-wrap gap-2">
                    {categoryList.map((catName) => {
                      const isSelected = (selectedCategory || 'All').toLowerCase() === catName.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={catName}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (onSelectCategory) onSelectCategory(catName);
                            if (onSelectSubcategory) onSelectSubcategory('All');
                          }}
                          style={{
                            backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                            borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                            borderWidth: 1.2,
                            borderRadius: 16,
                            paddingHorizontal: 13,
                            paddingVertical: 7,
                            shadowColor: isSelected ? '#C2477A' : '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isSelected ? 0.2 : 0.02,
                            shadowRadius: 2,
                            elevation: isSelected ? 2 : 0
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? '#FFFFFF' : '#374151',
                              fontSize: 12,
                              fontWeight: isSelected ? '800' : '600'
                            }}
                          >
                            {catName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Dependent Subcategories under Selected Category */}
                  {selectedCategory !== 'All' && activeSubs.length > 0 && (
                    <View
                      style={{
                        backgroundColor: '#FFF8FA',
                        borderColor: '#F8D7E6',
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 12,
                        marginTop: 12
                      }}
                    >
                      <Text style={{ color: '#C2477A', fontSize: 11.5, fontWeight: '800', marginBottom: 8 }}>
                        Subcategories in {selectedCategory}:
                      </Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {['All', ...activeSubs.map(s => s.name || s)].map((subName) => {
                          const isSubSelected = (selectedSubcategory || 'All').toLowerCase() === subName.toLowerCase();
                          return (
                            <TouchableOpacity
                              key={subName}
                              activeOpacity={0.7}
                              onPress={() => onSelectSubcategory && onSelectSubcategory(subName)}
                              style={{
                                backgroundColor: isSubSelected ? '#2B1A24' : '#FFFFFF',
                                borderColor: isSubSelected ? '#2B1A24' : '#F0E3EA',
                                borderWidth: 1,
                                borderRadius: 12,
                                paddingHorizontal: 11,
                                paddingVertical: 5
                              }}
                            >
                              <Text
                                style={{
                                  color: isSubSelected ? '#FFFFFF' : '#4B5563',
                                  fontSize: 11,
                                  fontWeight: isSubSelected ? '800' : '600'
                                }}
                              >
                                {subName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* SECTION 2: BRAND PARTNERS */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center gap-1.5">
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>
                        BRAND PARTNERS
                      </Text>
                      {selectedBrands.length > 0 && (
                        <View
                          style={{
                            backgroundColor: '#FFF0F5',
                            borderColor: '#F8B4D9',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 1
                          }}
                        >
                          <Text style={{ color: '#C2477A', fontSize: 10, fontWeight: '800' }}>
                            {selectedBrands.length} Selected
                          </Text>
                        </View>
                      )}
                    </View>

                    {selectedBrands.length > 0 && (
                      <TouchableOpacity onPress={onClearBrands}>
                        <Text style={{ color: '#C2477A', fontSize: 11.5, fontWeight: '700' }}>
                          Clear Brands
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Brand Search Bar */}
                  <View
                    style={{
                      borderColor: '#F0E3EA',
                      borderWidth: 1.2,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      height: 40,
                      marginBottom: 10
                    }}
                  >
                    <Ionicons name="search" size={15} color="#C2477A" style={{ marginRight: 8 }} />
                    <TextInput
                      value={brandSearch}
                      onChangeText={setBrandSearch}
                      placeholder="Search brands (e.g. Faces, Lakmé, Maybelline)..."
                      placeholderTextColor="#9CA3AF"
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: '#1F2937',
                        fontWeight: '500',
                        padding: 0
                      }}
                    />
                    {Boolean(brandSearch) && (
                      <TouchableOpacity onPress={() => setBrandSearch('')}>
                        <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Multi-Select Brand Chips */}
                  <View className="flex-row flex-wrap gap-2 max-h-44">
                    {filteredBrands.map((b) => {
                      const brandName = b.name || b.brand_name || b;
                      const isSelected = selectedBrands.includes(brandName);
                      return (
                        <TouchableOpacity
                          key={b.id || brandName}
                          activeOpacity={0.7}
                          onPress={() => onToggleBrand && onToggleBrand(brandName)}
                          style={{
                            backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                            borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                            borderWidth: 1.2,
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 6.5,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4.5,
                            shadowColor: isSelected ? '#C2477A' : '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isSelected ? 0.2 : 0.02,
                            shadowRadius: 2,
                            elevation: isSelected ? 2 : 0
                          }}
                        >
                          {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                          <Text
                            style={{
                              color: isSelected ? '#FFFFFF' : '#374151',
                              fontSize: 11.5,
                              fontWeight: isSelected ? '800' : '600'
                            }}
                          >
                            {brandName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {filteredBrands.length === 0 && (
                      <Text style={{ color: '#9CA3AF', fontSize: 12, fontStyle: 'italic', paddingVertical: 6 }}>
                        No brands match "{brandSearch}"
                      </Text>
                    )}
                  </View>
                </View>

                {/* SECTION 3: PRICE RANGE */}
                <View className="mb-2">
                  <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '800', letterSpacing: 0.3, marginBottom: 10 }}>
                    PRICE RANGE
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {priceOptions.map((p) => {
                      const isSelected = (selectedPriceRange || 'all') === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          activeOpacity={0.7}
                          onPress={() => onSelectPriceRange && onSelectPriceRange(p.id)}
                          style={{
                            backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                            borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                            borderWidth: 1.2,
                            borderRadius: 16,
                            paddingHorizontal: 13,
                            paddingVertical: 7,
                            shadowColor: isSelected ? '#C2477A' : '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isSelected ? 0.2 : 0.02,
                            shadowRadius: 2,
                            elevation: isSelected ? 2 : 0
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? '#FFFFFF' : '#374151',
                              fontSize: 12,
                              fontWeight: isSelected ? '800' : '600'
                            }}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* ── 3. FIXED FOOTER (Permanently Visible) ────────────── */}
              <View
                style={{
                  borderTopWidth: 1.5,
                  borderTopColor: '#F0E3EA',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  paddingBottom: Platform.OS === 'ios' ? 28 : 16,
                  flexDirection: 'row',
                  gap: 12
                }}
              >
                {/* Clear All Outline Button */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onClearAll}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: '#FFFFFF',
                    borderColor: '#F0E3EA',
                    borderWidth: 1.3,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '800' }}>
                    Clear All
                  </Text>
                </TouchableOpacity>

                {/* Apply Filters (N) Filled Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onApply) onApply();
                    onClose();
                  }}
                  style={{
                    flex: 2,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: '#C2477A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#C2477A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 3
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '800', letterSpacing: 0.3 }}>
                    Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PremiumFilterBottomSheet;

