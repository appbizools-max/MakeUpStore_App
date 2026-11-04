import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';

/**
 * Reusable CategoryHeader Component
 * Unified header across Category pages:
 * - Back button with parent category label
 * - Centered uppercase dynamic title
 * - Search icon (opens search screen)
 * - Cart icon with real-time badge count (opens cart screen)
 */
export const CategoryHeader = ({
  parentTitle = 'Categories',
  title = 'Category',
  onBack,
  onSearch,
  onCart
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

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#F0E3EA',
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#B64F7D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
      className="px-4 py-3 flex-row items-center justify-between z-30"
    >
      {/* Back Button to Parent Category */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="flex-row items-center gap-1 -ml-1 py-1 px-1.5 rounded-xl active:bg-pink-50 max-w-[28%]"
      >
        <Ionicons name="chevron-back" size={20} color="#B64F7D" />
        <Text style={{ color: '#B64F7D' }} className="text-xs font-bold" numberOfLines={1}>
          {parentTitle}
        </Text>
      </TouchableOpacity>

      {/* Dynamic Centered Title */}
      <Text
        style={{ color: '#33252F' }}
        className="text-[13.5px] font-extrabold uppercase tracking-wider text-center flex-1 px-2"
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Action Icons: Search & Cart with Badge */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={handleSearchPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
          className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-2xs"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={15} color="#B64F7D" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCartPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ borderColor: '#F0E3EA', borderWidth: 1 }}
          className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-2xs relative"
          accessibilityLabel="Shopping Cart"
        >
          <Ionicons name="bag-handle-outline" size={16} color="#B64F7D" />
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
  );
};

export default CategoryHeader;
