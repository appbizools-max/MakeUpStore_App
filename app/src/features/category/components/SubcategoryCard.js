import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getSubcategoryFA5Icon } from '../../../utils/categoryIcons';

/**
 * SubcategoryCard — text-only horizontal card.
 * Left: FA5 icon badge. Center: title + description + count. Right: chevron.
 * No images, no thumbnails.
 */
export const SubcategoryCard = ({
  title = 'Subcategory',
  description = 'Explore collection',
  productCount = 24,
  parentCategoryName,
  onPress,
}) => {
  const { icon, color, bg } = getSubcategoryFA5Icon(title, parentCategoryName);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF', borderColor: '#F0E3EA', borderWidth: 1,
        borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14,
        marginHorizontal: 16, marginBottom: 10,
        shadowColor: '#B64F7D', shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
        flexDirection: 'row', alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: '#FFFFFF', borderColor: '#F0E3EA', borderWidth: 1,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12, flexShrink: 0,
        }}
      >
        <FontAwesome5 name={icon} size={18} color={color} solid />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ color: '#33252F', fontSize: 14, fontWeight: '800', lineHeight: 18, marginBottom: 2 }} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={{ color: '#82727C', fontSize: 11.5, fontWeight: '500' }} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        {productCount > 0 ? (
          <Text style={{ color: '#B64F7D', fontSize: 10.5, fontWeight: '700', marginTop: 2 }}>
            {productCount} Products
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: '#FFF0F5', borderColor: '#F0E3EA', borderWidth: 1,
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Ionicons name="chevron-forward" size={15} color="#B64F7D" />
      </View>
    </TouchableOpacity>
  );
};

export default SubcategoryCard;
