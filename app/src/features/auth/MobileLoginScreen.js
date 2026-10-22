import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const MobileLoginScreen = () => {
  const { userRole, userProfile, setUserProfile, setCurrentScreen, prefetchUserProfile } = useApp();
  const [mobileNumber, setMobileNumber] = useState('');

  const cleanDigits = mobileNumber.replace(/\D/g, '');
  const isValid = cleanDigits.length === 10;

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon';
      case 'artist': return 'Makeup Artist';
      case 'beautician': return 'Beautician';
      case 'general':
      default: return 'General User';
    }
  };

  const handleTextChange = (text) => {
    const raw = text.replace(/\D/g, '').slice(0, 10);
    if (raw.length > 5) {
      setMobileNumber(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMobileNumber(raw);
    }
  };

  const handleSendOtp = () => {
    if (!isValid) return;
    const fullPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
    setUserProfile(prev => ({
      ...prev,
      phone: fullPhone,
    }));
    if (prefetchUserProfile) {
      prefetchUserProfile(fullPhone);
    }
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
          We'll send you a 4-digit verification code.
        </Text>

        {/* Mobile Input Field Box */}
        <View
          style={{ borderColor: isValid ? '#C2477A' : '#FCE4EC' }}
          className="border bg-white rounded-full py-3.5 px-5 flex-row items-center shadow-2xs mb-6"
        >
          {/* Indian Flag Badge Visual */}
          <View className="w-6 h-4 bg-[#FF9933] rounded-xs mr-2 overflow-hidden justify-between border border-[#E8DDD7]">
            <View className="h-1.5 bg-[#FF9933]" />
            <View className="h-1 bg-white items-center justify-center">
              <View className="w-1 h-1 rounded-full bg-[#000080]" />
            </View>
            <View className="h-1.5 bg-[#138808]" />
          </View>

          {/* Country Code +91 */}
          <Text className="text-sm font-black text-[#3A2430] mr-2">
            +91
          </Text>

          <Text className="text-sm text-[#8C7078] mr-3">|</Text>

          {/* Clean Mobile Input */}
          <TextInput
            value={mobileNumber}
            onChangeText={handleTextChange}
            keyboardType="phone-pad"
            maxLength={11}
            className="flex-1 text-sm font-bold text-[#3A2430] p-0"
            placeholder="Enter 10-digit number"
            placeholderTextColor="#8C7078"
            autoFocus
          />
        </View>

        {/* Send OTP Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isValid}
          onPress={handleSendOtp}
          style={{ backgroundColor: isValid ? '#C2477A' : '#E5E7EB' }}
          className="w-full py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4"
        >
          <Text style={{ color: isValid ? '#FFFFFF' : '#9CA3AF' }} className="font-black text-base tracking-wide">
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
