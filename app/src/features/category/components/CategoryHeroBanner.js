import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getCategoryFA5Icon } from '../../../utils/categoryIcons';

/**
 * CategoryHeroBanner — text-only header strip.
 * Shows a FA5 icon, category title, tagline, and an Explore pill.
 * No images, no banners, no pagination dots.
 */
export const CategoryHeroBanner = ({
  title = 'Category',
  subtitle = 'Discover our curated collection.',
  ctaText = 'Explore Products',
  onExplore,
}) => {
  const { icon, color, bg } = getCategoryFA5Icon(title);

  return (
    <View
      style={{
        marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        borderRadius: 18, backgroundColor: '#FFFFFF',
        borderColor: '#F0E3EA', borderWidth: 1,
        paddingVertical: 18, paddingHorizontal: 18,
        shadowColor: '#B64F7D', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        flexDirection: 'row', alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: '#FFFFFF', borderColor: '#F0E3EA', borderWidth: 1,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 14,
        }}
      >
        <FontAwesome5 name={icon} size={24} color={color} solid />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#33252F', fontSize: 17, fontWeight: '900', marginBottom: 2 }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: '#82727C', fontSize: 11.5, fontWeight: '500', lineHeight: 16, marginBottom: 10 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.82} onPress={onExplore}
          style={{
            alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
            borderColor: color, borderWidth: 1.2, borderRadius: 20,
            paddingHorizontal: 14, paddingVertical: 5,
          }}
        >
          <Text style={{ color: color, fontSize: 11, fontWeight: '700' }}>{ctaText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryHeroBanner;
