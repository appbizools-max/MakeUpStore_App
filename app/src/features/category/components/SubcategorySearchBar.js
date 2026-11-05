import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SubcategorySearchBar
 * Clean, minimal search for subcategories.
 */
export const SubcategorySearchBar = ({
  value = '',
  onChangeText,
  onClear,
  placeholder = 'Search subcategories...',
  currentCategoryName = 'Category',
}) => {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 8 }}>
      <View
        style={{
          height: 44,
          backgroundColor: '#FFFFFF',
          borderColor: '#F0E3EA',
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#C2477A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Ionicons name="search" size={16} color="#C2477A" style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A8929E"
          style={{
            flex: 1,
            color: '#33252F',
            fontSize: 12.5,
            fontWeight: '600',
            paddingVertical: 0,
          }}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={16} color="#A8929E" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SubcategorySearchBar;
