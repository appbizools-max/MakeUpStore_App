import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Dimensions,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * PremiumFilterBottomSheet
 * 
 * Signature Nykaa / Purplle Two-Pane Mobile Filtering Experience:
 * - Fixed Header with Drag Handle, Active Badge, "Clear All", and Close CTA
 * - Left Navigation Rail (36% width): Categories, Subcategories, Top Brands, Price Range, Discount, Rating
 * - Right Independently Scrollable Option Panel (64% width):
 *   - Category-Specific Top Brands with fast in-tab search and Nykaa-style tick checkboxes
 *   - Dynamically resolves available brands based on the active selected category
 * - Fixed Footer with "Reset" and prominent "Apply Filters (N)" CTA
 * - Strictly preserves the white-and-pink theme (#C2477A, #FFF0F5, #F0E3EA) and Manrope typography
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
  selectedDiscount = 0,
  onSelectDiscount,
  activeFilterCount = 0,
  onClearAll,
  onApply,
  totalMatchingCount = null
}) => {
  const { activeProducts = [] } = useApp() || {};

  // Active section on the left navigation rail: 'brands' | 'categories' | 'subcategories' | 'price' | 'discount'
  const [activeTab, setActiveTab] = useState('brands');
  const [brandSearch, setBrandSearch] = useState('');

  // 1. Normalized Categories list
  const categoryList = useMemo(() => {
    const list = ['All'];
    if (categories && categories.length > 0) {
      categories
        .filter(c => c && c.enabled !== false && c.is_active !== false)
        .forEach(c => {
          const name = typeof c === 'string' ? c : (c.name || '');
          if (name && !list.includes(name)) list.push(name);
        });
    } else {
      list.push('Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body', "Men's Grooming", 'Nail Care', 'Beauty Tools');
    }
    return list;
  }, [categories]);

  // 2. Dependent Subcategories for currently selected category (Deduplicated)
  const activeSubs = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      const raw = (subcategories || []).filter(s => s && s.enabled !== false).map(s => (typeof s === 'string' ? s : s.name || ''));
      return Array.from(new Set(raw.filter(Boolean)));
    }
    const catLower = selectedCategory.trim().toLowerCase();
    const parentCat = (categories || []).find(
      c => (c.name || '').toLowerCase() === catLower
    );
    const parentId = (parentCat?.id || '').toLowerCase();

    const matched = (subcategories || []).filter(s => {
      if (s.enabled === false) return false;
      const sCatId = (s.categoryId || s.category_id || '').toLowerCase();
      const sCatName = (s.categoryName || s.category_name || '').toLowerCase();
      return (parentId && sCatId === parentId) || (sCatName && sCatName === catLower);
    });

    const names = matched.map(s => (typeof s === 'string' ? s : s.name || ''));
    return Array.from(new Set(names.filter(Boolean)));
  }, [selectedCategory, categories, subcategories]);

  // 3. Dynamic Category-Specific Top Brands (Nykaa Specification)
  // Dynamically filters brands based on products in the selected category
  const dynamicCategoryBrands = useMemo(() => {
    const brandCounts = new Map();

    // Scan activeProducts to count products per brand within current category
    const isCatFiltered = selectedCategory && selectedCategory !== 'All';
    const catLower = isCatFiltered ? selectedCategory.trim().toLowerCase() : '';

    (activeProducts || []).forEach(p => {
      const pCat = (p.category || p.categoryName || '').trim().toLowerCase();
      if (!isCatFiltered || pCat === catLower || pCat.includes(catLower) || catLower.includes(pCat)) {
        const b = (p.brandName || p.brand || '').trim();
        if (b) {
          brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
        }
      }
    });

    // Merge with explicitly passed brands
    (brands || []).forEach(b => {
      const name = typeof b === 'string' ? b.trim() : (b.name || b.brand_name || '').trim();
      if (name && !brandCounts.has(name) && !isCatFiltered) {
        brandCounts.set(name, 0);
      }
    });

    // Convert to sorted list: Highest product count first ("Top Brands")
    return Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [selectedCategory, activeProducts, brands]);

  // Filtered brands for in-tab search
  const visibleBrands = useMemo(() => {
    if (!brandSearch.trim()) return dynamicCategoryBrands;
    const q = brandSearch.trim().toLowerCase();
    return dynamicCategoryBrands.filter(b => b.name.toLowerCase().includes(q));
  }, [dynamicCategoryBrands, brandSearch]);

  // Price range options
  const priceOptions = [
    { id: 'all', label: 'All Prices' },
    { id: 'u500', label: 'Under ₹500' },
    { id: '500_1000', label: '₹500 – ₹1,000' },
    { id: '1000_2000', label: '₹1,000 – ₹2,000' },
    { id: 'a2000', label: 'Above ₹2,000' },
  ];

  // Discount options
  const discountOptions = [
    { value: 0, label: 'All Discounts' },
    { value: 50, label: '50% & Above' },
    { value: 40, label: '40% & Above' },
    { value: 30, label: '30% & Above' },
    { value: 20, label: '20% & Above' },
    { value: 10, label: '10% & Above' },
  ];

  // Count active filters per section for left rail badge indicators
  const sectionCounts = {
    categories: selectedCategory !== 'All' ? 1 : 0,
    subcategories: selectedSubcategory !== 'All' ? 1 : 0,
    brands: selectedBrands.length,
    price: selectedPriceRange !== 'all' ? 1 : 0,
    discount: selectedDiscount > 0 ? 1 : 0,
  };

  const navTabs = [
    { id: 'brands', label: 'Top Brands', count: sectionCounts.brands },
    { id: 'categories', label: 'Category', count: sectionCounts.categories },
    { id: 'subcategories', label: 'Subcategory', count: sectionCounts.subcategories },
    { id: 'price', label: 'Price Range', count: sectionCounts.price },
    { id: 'discount', label: 'Discount', count: sectionCounts.discount },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* ───────────────────────────────────────────────────────────── */}
              {/* 1. FIXED HEADER */}
              {/* ───────────────────────────────────────────────────────────── */}
              <View style={styles.header}>
                <View style={styles.dragHandle} />
                <View style={styles.headerRow}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="options-outline" size={16} color="#C2477A" />
                    </View>
                    <Text style={styles.headerTitle}>Filters</Text>
                    {activeFilterCount > 0 && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>
                          {activeFilterCount} Active
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.headerRight}>
                    {activeFilterCount > 0 && (
                      <TouchableOpacity
                        onPress={onClearAll}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.clearHeaderButton}
                      >
                        <Text style={styles.clearHeaderText}>Clear All</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={18} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 2. TWO-PANE INDEPENDENTLY SCROLLABLE BODY (Nykaa Specification) */}
              {/* ───────────────────────────────────────────────────────────── */}
              <View style={styles.twoPaneBody}>
                {/* ── LEFT NAVIGATION RAIL (36% width) ── */}
                <View style={styles.leftRail}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.leftRailScroll}
                  >
                    {navTabs.map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          activeOpacity={0.8}
                          onPress={() => setActiveTab(tab.id)}
                          style={[
                            styles.leftRailTab,
                            isActive && styles.leftRailTabActive
                          ]}
                        >
                          <View style={styles.tabLabelRow}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.leftRailTabText,
                                isActive && styles.leftRailTabTextActive
                              ]}
                            >
                              {tab.label}
                            </Text>
                            {tab.count > 0 && (
                              <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{tab.count}</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* ── RIGHT OPTION PANEL (64% width) ── */}
                <View style={styles.rightPanel}>
                  {/* TAB 1: TOP BRANDS */}
                  {activeTab === 'brands' && (
                    <View style={styles.rightContentContainer}>
                      {/* Brand Search Input */}
                      <View style={styles.searchBox}>
                        <Ionicons name="search" size={14} color="#C2477A" style={{ marginRight: 6 }} />
                        <TextInput
                          value={brandSearch}
                          onChangeText={setBrandSearch}
                          placeholder={
                            selectedCategory !== 'All'
                              ? `Search ${selectedCategory} brands...`
                              : 'Search all brands...'
                          }
                          placeholderTextColor="#9CA3AF"
                          style={styles.searchInput}
                        />
                        {Boolean(brandSearch) && (
                          <TouchableOpacity onPress={() => setBrandSearch('')}>
                            <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Category Context Banner */}
                      {selectedCategory !== 'All' && (
                        <View style={styles.contextBanner}>
                          <Text style={styles.contextBannerText} numberOfLines={1}>
                            Showing brands with products in <Text style={{ fontWeight: '800' }}>{selectedCategory}</Text>
                          </Text>
                        </View>
                      )}

                      {/* Brand Multi-Select Checkbox List */}
                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.optionsList}
                      >
                        {visibleBrands.map((b, idx) => {
                          const isSelected = selectedBrands.includes(b.name);
                          return (
                            <TouchableOpacity
                              key={`brand_${b.name}_${idx}`}
                              activeOpacity={0.7}
                              onPress={() => onToggleBrand && onToggleBrand(b.name)}
                              style={[
                                styles.brandRowItem,
                                isSelected && styles.brandRowItemSelected
                              ]}
                            >
                              {/* Square Nykaa Checkbox */}
                              <View style={[
                                styles.checkboxSquare,
                                isSelected && styles.checkboxSquareSelected
                              ]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                                )}
                              </View>

                              {/* Brand Title */}
                              <Text
                                style={[
                                  styles.brandTitleText,
                                  isSelected && styles.brandTitleTextSelected
                                ]}
                                numberOfLines={1}
                              >
                                {b.name}
                              </Text>

                              {/* Product Count Pill */}
                              {b.count > 0 && (
                                <Text style={styles.brandCountText}>
                                  ({b.count})
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}

                        {visibleBrands.length === 0 && (
                          <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={28} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>
                              No brands match "{brandSearch}"
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* TAB 2: CATEGORIES */}
                  {activeTab === 'categories' && (
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={styles.optionsList}
                    >
                      <Text style={styles.sectionHeaderLabel}>Select Category</Text>
                      {categoryList.map((catName, idx) => {
                        const isSelected = (selectedCategory || 'All').toLowerCase() === catName.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={`cat_${catName}_${idx}`}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (onSelectCategory) onSelectCategory(catName);
                              if (onSelectSubcategory) onSelectSubcategory('All');
                            }}
                            style={[
                              styles.radioRowItem,
                              isSelected && styles.radioRowItemSelected
                            ]}
                          >
                            <View style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected
                            ]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <Text style={[
                              styles.radioLabelText,
                              isSelected && styles.radioLabelTextSelected
                            ]}>
                              {catName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* TAB 3: SUBCATEGORIES */}
                  {activeTab === 'subcategories' && (
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={styles.optionsList}
                    >
                      <View style={styles.subcatHeaderRow}>
                        <Text style={styles.sectionHeaderLabel}>
                          {selectedCategory !== 'All' ? `${selectedCategory} Subcategories` : 'All Subcategories'}
                        </Text>
                      </View>

                      {['All', ...activeSubs].map((subName, idx) => {
                        const isSelected = (selectedSubcategory || 'All').toLowerCase() === subName.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={`sub_${subName}_${idx}`}
                            activeOpacity={0.7}
                            onPress={() => onSelectSubcategory && onSelectSubcategory(subName)}
                            style={[
                              styles.radioRowItem,
                              isSelected && styles.radioRowItemSelected
                            ]}
                          >
                            <View style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected
                            ]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <Text style={[
                              styles.radioLabelText,
                              isSelected && styles.radioLabelTextSelected
                            ]}>
                              {subName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {activeSubs.length === 0 && selectedCategory !== 'All' && (
                        <Text style={styles.emptyNotice}>
                          No subcategories configured for {selectedCategory}
                        </Text>
                      )}
                    </ScrollView>
                  )}

                  {/* TAB 4: PRICE RANGE */}
                  {activeTab === 'price' && (
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={styles.optionsList}
                    >
                      <Text style={styles.sectionHeaderLabel}>Price Range</Text>
                      {priceOptions.map(p => {
                        const isSelected = (selectedPriceRange || 'all') === p.id;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            activeOpacity={0.7}
                            onPress={() => onSelectPriceRange && onSelectPriceRange(p.id)}
                            style={[
                              styles.radioRowItem,
                              isSelected && styles.radioRowItemSelected
                            ]}
                          >
                            <View style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected
                            ]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <Text style={[
                              styles.radioLabelText,
                              isSelected && styles.radioLabelTextSelected
                            ]}>
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* TAB 5: DISCOUNT */}
                  {activeTab === 'discount' && (
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={styles.optionsList}
                    >
                      <Text style={styles.sectionHeaderLabel}>Minimum Discount</Text>
                      {discountOptions.map(d => {
                        const isSelected = Number(selectedDiscount || 0) === d.value;
                        return (
                          <TouchableOpacity
                            key={d.value}
                            activeOpacity={0.7}
                            onPress={() => onSelectDiscount && onSelectDiscount(d.value)}
                            style={[
                              styles.radioRowItem,
                              isSelected && styles.radioRowItemSelected
                            ]}
                          >
                            <View style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected
                            ]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <Text style={[
                              styles.radioLabelText,
                              isSelected && styles.radioLabelTextSelected
                            ]}>
                              {d.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </View>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 3. FIXED FOOTER */}
              {/* ───────────────────────────────────────────────────────────── */}
              <View style={styles.footer}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onClearAll}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onApply) onApply();
                    onClose();
                  }}
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>
                    Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                    {totalMatchingCount !== null ? ` • ${totalMatchingCount} Items` : ''}
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.82,
    borderTopWidth: 1.5,
    borderTopColor: '#F0E3EA',
    shadowColor: '#C2477A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 16,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E3EA',
    backgroundColor: '#FFFFFF',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2D3DC',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
  },
  activePill: {
    backgroundColor: '#C2477A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearHeaderButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearHeaderText: {
    color: '#C2477A',
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0E3EA',
  },
  twoPaneBody: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  leftRail: {
    width: '36%',
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1.5,
    borderRightColor: '#F0E3EA',
  },
  leftRailScroll: {
    paddingVertical: 6,
  },
  leftRailTab: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: 'transparent',
    backgroundColor: 'transparent',
  },
  leftRailTabActive: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#C2477A',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRailTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  leftRailTabTextActive: {
    fontWeight: '800',
    color: '#C2477A',
  },
  tabBadge: {
    backgroundColor: '#C2477A',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  rightPanel: {
    width: '64%',
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  rightContentContainer: {
    flex: 1,
    padding: 12,
  },
  searchBox: {
    borderColor: '#F0E3EA',
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: '#1F2937',
    fontWeight: '500',
    padding: 0,
  },
  contextBanner: {
    backgroundColor: '#FFF8FA',
    borderColor: '#F8D7E6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  contextBannerText: {
    fontSize: 10,
    color: '#C2477A',
  },
  optionsList: {
    padding: 12,
    paddingBottom: 24,
  },
  brandRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 3,
  },
  brandRowItemSelected: {
    backgroundColor: '#FFF5F8',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxSquareSelected: {
    backgroundColor: '#C2477A',
    borderColor: '#C2477A',
  },
  brandTitleText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  brandTitleTextSelected: {
    color: '#1F2937',
    fontWeight: '800',
  },
  brandCountText: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 4,
  },
  radioRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 3,
  },
  radioRowItemSelected: {
    backgroundColor: '#FFF5F8',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#C2477A',
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#C2477A',
  },
  radioLabelText: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
  },
  radioLabelTextSelected: {
    color: '#C2477A',
    fontWeight: '800',
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subcatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emptyNotice: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyStateText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1.5,
    borderTopColor: '#F0E3EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'row',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0E3EA',
    borderWidth: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 12.5,
    fontWeight: '800',
  },
  applyButton: {
    flex: 2,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#C2477A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C2477A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default PremiumFilterBottomSheet;
