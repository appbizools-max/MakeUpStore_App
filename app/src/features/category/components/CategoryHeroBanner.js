import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { getSafeImageSource } from '../../../utils/imageUtils';

/**
 * CategoryHeroBanner - Premium 3D cosmetic banner strip.
 * Shows the premium 3D category icon, category title, tagline, and an Explore button.
 * No FontAwesome icons, pure white background (#FFFFFF) with rose/magenta branding.
 */
export const CategoryHeroBanner = ({
  title = 'Category',
  subtitle = null,
  ctaText = 'Explore Products',
  image = null,
  onExplore,
}) => {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 10,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderColor: '#F0E3EA',
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: '#C2477A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* 3D Category Illustration inside circular border */}
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: '#FFFFFF',
          borderColor: '#F8B4D9',
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginRight: 14,
          overflow: 'hidden',
          shadowColor: '#C2477A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {image ? (
          <Image
            source={getSafeImageSource(image, '')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#C2477A', fontSize: 18, fontWeight: '900' }}>
              {(title || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Title, Subtitle, and Explore Button */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: '#1F2937', fontSize: 16, fontWeight: '900', marginBottom: 2 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', lineHeight: 15, marginBottom: 8 }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onExplore}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#C2477A',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 4.5,
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
            {ctaText} →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryHeroBanner;
