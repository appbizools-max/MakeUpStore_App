import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';

export const RoleSelectionScreen = () => {
  const { userRole, setUserRole, setCurrentScreen } = useApp();
  const [selectedRole, setSelectedRole] = useState(userRole || 'salon');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

  const roles = [
    { id: 'general', title: 'General User', icon: 'bag-handle-outline' },
    { id: 'salon', title: 'Salon', icon: 'storefront-outline' },
    { id: 'artist', title: 'Makeup Artist', icon: 'brush-outline' },
    { id: 'beautician', title: 'Beautician', icon: 'sparkles-outline' },
  ];

  const currentRoleObj = roles.find(r => r.id === selectedRole);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setDropdownOpen(false);
  };

  const handleContinue = () => {
    setUserRole(selectedRole);
    setCurrentScreen('login');
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 50, flexGrow: 1, justifyContent: 'space-between' }}
      className="flex-1 bg-white"
    >
      <View>
        {/* Top Centered Brand Logo */}
        <View className="items-center mt-2 mb-4">
          <Text
            style={{
              fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
            }}
            className="text-[36px] text-[#C2477A] text-center tracking-wide"
          >
            Salbeau
          </Text>
        </View>

        {/* Heading Title & Subtitle */}
        <Text className="text-2xl font-black text-[#3A2430] mb-1.5">
          Who's shopping today?
        </Text>
        <Text className="text-xs font-medium text-[#8C7078] mb-6 leading-relaxed">
          Choose your account type to see the right pricing for you.
        </Text>

        {/* Dropdown Container */}
        <View className="relative z-30 mb-4">
          {/* Form Field Label */}
          <Text className="text-xs font-semibold text-[#8C7078] mb-2 ml-1">
            Account Type
          </Text>

          {/* Medium Dropdown Field Pill */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            className="border border-[#F5A8C0] bg-white rounded-full py-3.5 px-5 flex-row justify-between items-center shadow-2xs"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name={currentRoleObj ? currentRoleObj.icon : "person-outline"}
                size={18}
                color="#C2477A"
              />
              <Text className="text-sm font-bold text-[#3A2430]">
                {currentRoleObj ? currentRoleObj.title : 'Select account type'}
              </Text>
            </View>
            <Ionicons
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#C2477A"
            />
          </TouchableOpacity>

          {/* Medium Floating Dropdown Options Overlay */}
          {dropdownOpen && (
            <View className="bg-white rounded-3xl border border-[#FCE4EC] p-2 shadow-xl mt-2 z-40">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectRole(role.id)}
                    className={`rounded-2xl py-3 px-4 flex-row items-center justify-between my-0.5 transition-all ${isSelected ? 'bg-[#FDEAF1]' : 'bg-white'
                      }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name={role.icon}
                        size={18}
                        color={isSelected ? "#C2477A" : "#8C7078"}
                      />
                      <Text
                        className={`text-sm font-extrabold ${isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'
                          }`}
                      >
                        {role.title}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#C2477A" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Bottom Action Button */}
      <View className="mt-6 mb-4">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleContinue}
          className="w-full bg-[#C2477A] py-4 rounded-full items-center justify-center shadow-lg active:opacity-90"
        >
          <Text className="text-white font-black text-base tracking-wide">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
