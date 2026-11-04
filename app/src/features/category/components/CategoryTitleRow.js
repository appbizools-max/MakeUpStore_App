import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSafeImageSource } from '../../../utils/imageUtils';

/**
 * CategoryTitleRow
 * Displays [Category Icon] | [Category Name] | [Explore Products] on one single horizontal row.
 * - Consistent vertical alignment
 * - Professional luxury typography
 * - Clean responsive action button
 */
export const CategoryTitleRow = ({
  title = 'Category',
  image = null,
  onExploreProducts,
  exploreText = 'Explore Products',
}) => {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: 3D Category Icon + Category Name in one horizontal line */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
        {/* Compact 3D Category Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            borderColor: '#F8B4D9',
            borderWidth: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 2,
            elevation: 2,
            flexShrink: 0,
          }}
        >
          {image ? (
            <Image
              source={getSafeImageSource(image, '')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: '#C2477A', fontSize: 14, fontWeight: '900' }}>
              {(title || 'C').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Category Name */}
        <Text
          style={{
            color: '#1F2937',
            fontSize: 16.5,
            fontWeight: '900',
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right: Explore Products Action */}
      <TouchableOpacity
        onPress={onExploreProducts}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          paddingVertical: 5,
          paddingHorizontal: 11,
          borderRadius: 20,
          backgroundColor: '#FFF0F5',
          borderColor: '#F8D7E6',
          borderWidth: 1,
        }}
      >
        <Text style={{ color: '#C2477A', fontSize: 11, fontWeight: '800' }}>
          {exploreText}
        </Text>
        <Ionicons name="arrow-forward" size={12} color="#C2477A" />
      </TouchableOpacity>
    </View>
  );
};

export default CategoryTitleRow;

