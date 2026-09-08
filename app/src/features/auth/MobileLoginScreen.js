import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const MobileLoginScreen = () => {
  const { userRole, userProfile, setUserProfile, setCurrentScreen } = useApp();
  const [mobileNumber, setMobileNumber] = useState('98765 43210');

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon';
      case 'artist': return 'Makeup Artist';
      case 'beautician': return 'Beautician';
      case 'general':
      default: return 'General User';
    }
  };

  const handleSendOtp = () => {
    setUserProfile({
      ...userProfile,
      phone: `+91 ${mobileNumber}`,
    });
    setCurrentScreen('otp');
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'space-between' }}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View>
        {/* Top Header: Back Arrow & Selected Role Pill Badge */}
        <View className="flex-row justify-between items-center mt-2 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('onboarding')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="arrow-back" size={20} color="#C2477A" />
          </TouchableOpacity>

          <View className="bg-[#FFF5F8] border border-[#F5A8C0] px-3.5 py-1.5 rounded-full">
            <Text className="text-xs font-black text-[#C2477A]">
              {getRoleTitle()}
            </Text>
          </View>
        </View>

        {/* Heading Title & Subtitle matching Reference UI */}
        <Text className="text-2xl font-black text-[#3A2430] mb-1.5">
          Enter your mobile number
        </Text>
        <Text className="text-xs font-medium text-[#8C7078] mb-8 leading-relaxed">
          We'll send you a verification code.
        </Text>

        {/* Mobile Input Field Box */}
        <View className="border border-[#FCE4EC] bg-white rounded-full py-3.5 px-5 flex-row items-center shadow-2xs mb-6">
          {/* Indian Flag Badge Visual */}
          <View className="w-6 h-4 bg-[#FF9933] rounded-xs mr-2 overflow-hidden justify-between border border-[#E8DDD7]">
            <View className="h-1.5 bg-[#FF9933]" />
            <View className="h-1.5 bg-white items-center justify-center">
              <View className="w-1 h-1 rounded-full bg-[#000080]" />
            </View>
            <View className="h-1.5 bg-[#138808]" />
          </View>

          {/* Country Code +91 */}
          <Text className="text-sm font-black text-[#3A2430] mr-2">
            +91
          </Text>

          <Text className="text-sm text-[#8C7078] mr-3">|</Text>

          {/* Default Mobile Input */}
          <TextInput
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={13}
            className="flex-1 text-sm font-bold text-[#3A2430] p-0"
            placeholder="98765 43210"
            placeholderTextColor="#8C7078"
          />
        </View>

        {/* Send OTP Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSendOtp}
          className="w-full bg-[#C2477A] py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4"
        >
          <Text className="text-white font-black text-base tracking-wide">
            Send OTP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Legal Terms Notice */}
      <View className="items-center mb-2">
        <Text className="text-xs text-[#8C7078] text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <Text className="text-[#C2477A] font-bold underline">Terms</Text> &{' '}
          <Text className="text-[#C2477A] font-bold underline">Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
};
