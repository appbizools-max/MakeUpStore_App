import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Reusable SubcategorySectionHeader Component
 * Displays section heading with 'View All >' action
 */
export const SubcategorySectionHeader = ({
  title = 'SUBCATEGORIES',
  ctaText = 'View All >',
  onCtaPress
}) => {
  return (
    <View className="px-4 mt-2.5 mb-2.5 flex-row items-center justify-between">
      <Text
        style={{ color: '#33252F' }}
        className="text-[13.5px] font-black uppercase tracking-wider"
      >
        {title}
      </Text>
      {ctaText ? (
        <TouchableOpacity
          onPress={onCtaPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: '#B64F7D' }} className="text-xs font-bold">
            {ctaText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

