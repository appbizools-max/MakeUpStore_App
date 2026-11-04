import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getSubcategoryFA5Icon } from '../../../utils/categoryIcons';

/**
 * SubcategoryCard - Premium 3D cosmetic icon & details card.
 * Left: 3D circular cosmetic icon with golden/pink border.
 * Center: title + description + count.
 * Right: Chevron forward button.
 */
export const SubcategoryCard = ({
  title = 'Subcategory',
  description = 'Explore collection',
  productCount = 0,
  parentCategoryName,
  image = null,
  imageUrl = null,
  onPress,
}) => {
  const { icon, color } = getSubcategoryFA5Icon(title, parentCategoryName);
  const iconSource = image || imageUrl || null;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#F0E3EA',
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        shadowColor: '#C2477A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Premium 3D Cosmetic Avatar Icon */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#FFFFFF',
          borderColor: '#F8B4D9',
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
          flexShrink: 0,
          overflow: 'hidden',
          shadowColor: '#C2477A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {iconSource ? (
          <Image
            source={{ uri: iconSource }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <FontAwesome5 name={icon || 'sparkles'} size={20} color={color || '#C2477A'} solid />
        )}
      </View>

      {/* Title & Product Count */}
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text
          style={{
            color: '#2B1A24',
            fontSize: 14.5,
            fontWeight: '800',
            lineHeight: 19,
            marginBottom: 2
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description ? (
          <Text style={{ color: '#82727C', fontSize: 11.5, fontWeight: '500' }} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        {productCount > 0 ? (
          <Text style={{ color: '#C2477A', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {productCount} Products
          </Text>
        ) : null}
      </View>

      {/* Right chevron pill */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          borderColor: '#F8B4D9',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="chevron-forward" size={15} color="#C2477A" />
      </View>
    </TouchableOpacity>
  );
};

export default SubcategoryCard;
