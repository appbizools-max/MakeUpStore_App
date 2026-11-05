import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';

/**
 * Standardized CategoryHeader Component
 * Standardized, minimal white-and-pink header across all category & subcategory listing screens:
 * - Back button with parent label (< Back / < Categories) clearly visible
 * - Clean spacing with category title and breadcrumb text removed from the top header
 * - Responsive action controls:
 *   - Listing mode: Sort pill, Filter pill (with active count badge), and Shopping Bag
 *   - Detail / Navigation mode: Search button and Shopping Bag (with live cart badge)
 */
export const CategoryHeader = ({
  parentTitle = 'Back',
  onBack,
  onSort = null,
  onFilter = null,
  activeFilterCount = 0,
  onSearch = null,
  onCart = null,
  rightActions = null,
}) => {
  const appContext = useApp ? useApp() : {};
  const { setCurrentScreen, cart = [] } = appContext || {};

  const cartCount = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
  }, [cart]);

  const handleSearchPress = () => {
    if (typeof onSearch === 'function') {
      onSearch();
    } else if (typeof setCurrentScreen === 'function') {
      setCurrentScreen('search');
    }
  };

  const handleCartPress = () => {
    if (typeof onCart === 'function') {
      onCart();
    } else if (typeof setCurrentScreen === 'function') {
      setCurrentScreen('cart');
    }
  };

  const isListingMode = typeof onSort === 'function' || typeof onFilter === 'function';

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#F0E3EA',
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#C2477A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
      className="px-4 py-3 flex-row items-center justify-between z-30"
    >
      {/* Back Button with clearly visible label */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-xl active:bg-pink-50"
      >
        <Ionicons name="chevron-back" size={20} color="#B64F7D" />
        <Text style={{ color: '#B64F7D' }} className="text-sm font-bold">
          {parentTitle || 'Back'}
        </Text>
      </TouchableOpacity>

      {/* Spacer (Category title and breadcrumb removed per user specification) */}
      <View className="flex-1" />

      {/* Action Controls */}
      {rightActions ? (
        rightActions
      ) : isListingMode ? (
        <View className="flex-row items-center gap-2">
          {onSort && (
            <TouchableOpacity
              onPress={onSort}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#F0E3EA',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xs"
            >
              <Ionicons name="swap-vertical" size={13} color="#B64F7D" />
              <Text style={{ color: '#B64F7D' }} className="text-[11px] font-bold">Sort</Text>
            </TouchableOpacity>
          )}

          {onFilter && (
            <TouchableOpacity
              onPress={onFilter}
              activeOpacity={0.7}
              style={{
                backgroundColor: activeFilterCount > 0 ? '#C2477A' : '#FFFFFF',
                borderColor: activeFilterCount > 0 ? '#C2477A' : '#F0E3EA',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xs"
            >
              <Ionicons name="options-outline" size={13} color={activeFilterCount > 0 ? '#FFFFFF' : '#B64F7D'} />
              <Text style={{ color: activeFilterCount > 0 ? '#FFFFFF' : '#B64F7D' }} className="text-[11px] font-bold">
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleCartPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-2xs relative"
            accessibilityLabel="Cart"
          >
            <Ionicons name="bag-handle-outline" size={15} color="#B64F7D" />
            {cartCount > 0 && (
              <View
                style={{ minWidth: 15, height: 15, paddingHorizontal: 2 }}
                className="absolute -top-1 -right-1 bg-[#C2477A] rounded-full items-center justify-center border border-white"
              >
                <Text className="text-[9px] font-black text-white leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleSearchPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
            className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-2xs"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={16} color="#C2477A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCartPress}
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
      )}
    </View>
  );
};

export default CategoryHeader;
