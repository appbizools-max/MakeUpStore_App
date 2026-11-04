import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

/**
 * Reusable SubcategoryFilter Component
 * Horizontal filter chips: 'All' + dynamic subcategory pills
 */
export const SubcategoryFilter = ({
  options = [],
  selectedOption = 'all',
  onSelectOption
}) => {
  if (!options || options.length === 0) return null;

  return (
    <View className="mb-3.5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* 'All' Filter Chip */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectOption('all')}
          style={{
            backgroundColor: selectedOption === 'all' ? '#B64F7D' : '#FFFFFF',
            borderColor: selectedOption === 'all' ? '#B64F7D' : '#F0E3EA',
            borderWidth: 1,
          }}
          className="px-4 py-1.5 rounded-full mr-2 shadow-2xs"
        >
          <Text
            style={{ color: selectedOption === 'all' ? '#FFFFFF' : '#33252F' }}
            className="text-xs font-bold"
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic Category Chips */}
        {options.map((opt) => {
          const optId = opt.id || opt.name;
          const isSelected = selectedOption === optId || selectedOption === opt.name;
          return (
            <TouchableOpacity
              key={optId}
              activeOpacity={0.8}
              onPress={() => onSelectOption(optId)}
              style={{
                backgroundColor: isSelected ? '#B64F7D' : '#FFFFFF',
                borderColor: isSelected ? '#B64F7D' : '#F0E3EA',
                borderWidth: 1,
              }}
              className="px-3.5 py-1.5 rounded-full mr-2 shadow-2xs"
            >
              <Text
                style={{ color: isSelected ? '#FFFFFF' : '#33252F' }}
                className="text-xs font-semibold"
              >
                {opt.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

