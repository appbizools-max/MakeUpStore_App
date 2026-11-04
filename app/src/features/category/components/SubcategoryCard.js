import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SubcategoryCard - Clean text-only subcategory card.
 * All Subcategory icons, thumbnail images, and product counts have been completely removed.
 */
export const SubcategoryCard = ({
  title = 'Subcategory',
  description = null,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#F0E3EA',
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        shadowColor: '#C2477A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, paddingRight: 8, justifyContent: 'center' }}>
        <Text
          style={{
            color: '#2B1A24',
            fontSize: 14,
            fontWeight: '800',
            lineHeight: 18,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {description ? (
          <Text style={{ color: '#8C7078', fontSize: 11, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color="#C2477A" />
    </TouchableOpacity>
  );
};

export default SubcategoryCard;
