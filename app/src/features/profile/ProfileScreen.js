import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const ProfileScreen = () => {
  const { userProfile, userRole, setCurrentScreen } = useApp();

  const name = userProfile?.name || 'Bizools';
  const email = userProfile?.email || 'bizools@salbeau.com';
  const initialLetter = name.charAt(0).toUpperCase() || 'B';

  const menuItems = [
    { title: 'My Orders', screen: 'orders' },
    { title: 'My Wishlist', action: () => Alert.alert('My Wishlist', 'Your wishlist is currently empty.') },
    { title: 'Delivery Addresses', action: () => Alert.alert('Delivery Address', userProfile?.address || '102 Rosewood Heights, MG Road, Bengaluru') },
    { title: 'Payment Methods', action: () => Alert.alert('Payment Methods', 'Default: Cash on Delivery (COD)') },
    { title: 'Notifications', action: () => Alert.alert('Notifications', 'No new notifications.') },
    { title: 'Help & Support', action: () => Alert.alert('Help & Support', 'Contact us at support@salbeau.com') },
    { title: 'About Salbeau', action: () => Alert.alert('About Salbeau', 'Salbeau Beauty Platform v2.4.1') },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="bg-white">
      {/* Header Title */}
      <Text className="text-2xl font-black text-[#3A2430] mb-5 mt-1">
        Profile
      </Text>

      {/* User Profile Avatar & Info Card */}
      <View className="bg-white rounded-3xl border border-[#FCE4EC] p-6 mb-5 items-center shadow-2xs">
        {/* Initial Letter Avatar Circle matching "B" requirement */}
        <View className="w-20 h-20 rounded-full bg-[#FDEAF1] border-2 border-[#F5A8C0] items-center justify-center mb-3 shadow-xs">
          <Text className="text-3xl font-black text-[#C2477A]">
            {initialLetter}
          </Text>
        </View>

        {/* User Name */}
        <Text className="text-lg font-black text-[#3A2430] mb-0.5">
          {name}
        </Text>

        {/* Email Address */}
        <Text className="text-xs font-semibold text-[#8C7078] mb-3">
          {email}
        </Text>

        {/* Role Pill Badge */}
        <View className="bg-[#FFF5F8] border border-[#F5A8C0] px-4 py-1.5 rounded-full">
          <Text className="text-[10px] font-extrabold text-[#C2477A] uppercase tracking-wider">
            {(userRole || 'GENERAL').toUpperCase()} USER
          </Text>
        </View>
      </View>

      {/* Profile Navigation Links Card */}
      <View className="bg-white rounded-3xl border border-[#FCE4EC] mb-6 overflow-hidden shadow-2xs">
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          return (
            <TouchableOpacity
              key={item.title}
              onPress={() => {
                if (item.screen) {
                  setCurrentScreen(item.screen);
                } else if (item.action) {
                  item.action();
                }
              }}
              className={`flex-row justify-between items-center py-4 px-5 bg-white ${
                !isLast ? 'border-b border-[#FCE4EC]' : ''
              }`}
            >
              <Text className="text-sm font-extrabold text-[#3A2430]">
                {item.title}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color="#8C7078"
                style={{ transform: [{ rotate: '-45deg' }] }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => setCurrentScreen('onboarding')}
        className="bg-white border border-[#C2477A] rounded-full py-3.5 px-5 items-center flex-row justify-center gap-2 mb-3 shadow-2xs"
      >
        <Ionicons name="log-out-outline" size={16} color="#C2477A" />
        <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
          LOGOUT
        </Text>
      </TouchableOpacity>

      {/* App Version Footer */}
      <Text className="text-center text-xs font-semibold text-[#8C7078] mb-4">
        Version 2.4.1
      </Text>
    </ScrollView>
  );
};
