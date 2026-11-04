import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CompactCategoryBanner
 * Sleek, compact luxury ribbon banner (~44px height).
 * Eliminates oversized banners and empty space.
 * Responsive across mobile, tablet, and desktop.
 */
export const CompactCategoryBanner = ({
  title = 'Category',
  subtitle = null,
  tagline = null,
}) => {
  const displayTagline = subtitle || tagline || '100% Authentic Luxury Formulations';

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 6,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: '#FFF5F8',
        borderColor: '#F8D7E6',
        borderWidth: 1,
        paddingVertical: 9,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#C2477A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
        <Ionicons name="sparkles" size={13} color="#C2477A" />
        <Text
          style={{
            color: '#8A2D53',
            fontSize: 11.5,
            fontWeight: '700',
            letterSpacing: 0.2,
          }}
          numberOfLines={1}
        >
          {displayTagline}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#F8B4D9',
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text style={{ color: '#C2477A', fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase' }}>
          Official Store
        </Text>
      </View>
    </View>
  );
};

export default CompactCategoryBanner;
