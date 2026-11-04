import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

/**
 * Reusable SubcategoryFilter Component
 * Clean horizontal filter chips without images or product counts.
 */
export const SubcategoryFilter = ({
  options = [],
  selectedOption = 'all',
  onSelectOption
}) => {
  if (!options || options.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
      >
        {/* 'All' Filter Chip */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectOption('all')}
          style={{
            backgroundColor: selectedOption === 'all' ? '#C2477A' : '#FFFFFF',
            borderColor: selectedOption === 'all' ? '#C2477A' : '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            paddingVertical: 7,
            paddingHorizontal: 15,
            marginRight: 8,
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedOption === 'all' ? 0.2 : 0.04,
            shadowRadius: 3,
            elevation: selectedOption === 'all' ? 2 : 1,
          }}
        >
          <Text
            style={{
              color: selectedOption === 'all' ? '#FFFFFF' : '#2B1A24',
              fontSize: 12,
              fontWeight: selectedOption === 'all' ? '800' : '600',
              letterSpacing: 0.1,
            }}
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
                backgroundColor: isSelected ? '#C2477A' : '#FFFFFF',
                borderColor: isSelected ? '#C2477A' : '#F0E3EA',
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 7,
                paddingHorizontal: 14,
                marginRight: 8,
                shadowColor: '#C2477A',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isSelected ? 0.2 : 0.04,
                shadowRadius: 3,
                elevation: isSelected ? 2 : 1,
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : '#2B1A24',
                  fontSize: 12,
                  fontWeight: isSelected ? '800' : '600',
                  letterSpacing: 0.1,
                }}
                numberOfLines={1}
              >
                {opt.name || opt.title || optId}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SubcategoryFilter;
