import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const OtpScreen = () => {
  const { userRole, userProfile, setCurrentScreen } = useApp();
  const [otp, setOtp] = useState(['4', '8', '2', '1']);
  const [timerSeconds, setTimerSeconds] = useState(120); // 2:00 minutes countdown limit

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon';
      case 'artist': return 'Makeup Artist';
      case 'beautician': return 'Beautician';
      case 'general':
      default: return 'General User';
    }
  };

  const handleVerifyOtp = () => {
    setCurrentScreen('home');
  };

  const handleResendOtp = () => {
    setTimerSeconds(120);
    setOtp(['4', '8', '2', '1']);
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
            onPress={() => setCurrentScreen('login')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="arrow-back" size={20} color="#C2477A" />
          </TouchableOpacity>

          <View className="bg-white border border-[#F5A8C0] px-3.5 py-1.5 rounded-full shadow-2xs">
            <Text className="text-xs font-black text-[#C2477A]">
              {getRoleTitle()}
            </Text>
          </View>
        </View>

        {/* Heading Title & Subtitle */}
        <Text className="text-2xl font-black text-[#3A2430] mb-1.5">
          Verify OTP
        </Text>
        <Text className="text-xs font-medium text-[#8C7078] mb-8 leading-relaxed">
          Sent verification code to <Text className="font-bold text-[#3A2430]">{userProfile?.phone || '+91 98765 43210'}</Text>
        </Text>

        {/* 4-Digit Crisp White OTP Inputs */}
        <View className="flex-row justify-around mb-8 px-2">
          {otp.map((digit, index) => (
            <View
              key={index}
              className="w-14 h-14 rounded-2xl border border-[#F5A8C0] bg-white items-center justify-center shadow-xs"
            >
              <TextInput
                value={digit}
                onChangeText={(val) => {
                  const updated = [...otp];
                  updated[index] = val;
                  setOtp(updated);
                }}
                keyboardType="number-pad"
                maxLength={1}
                className="text-2xl font-black text-[#3A2430] text-center w-full"
              />
            </View>
          ))}
        </View>

        {/* 2:00 Countdown Timer Display */}
        <View className="items-center mb-8">
          {timerSeconds > 0 ? (
            <View className="bg-white border border-[#FCE4EC] px-4 py-2 rounded-full flex-row items-center gap-2 shadow-2xs">
              <Ionicons name="time-outline" size={16} color="#C2477A" />
              <Text className="text-xs font-semibold text-[#8C7078]">
                Resend OTP in <Text className="text-sm font-black text-[#C2477A]">{formatTimer(timerSeconds)}</Text>
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResendOtp}
              className="bg-white border border-[#F5A8C0] px-4.5 py-2 rounded-full flex-row items-center gap-1.5 shadow-2xs"
            >
              <Ionicons name="refresh" size={14} color="#C2477A" />
              <Text className="text-xs font-black text-[#C2477A]">Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify & Continue Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleVerifyOtp}
          className="w-full bg-[#C2477A] py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4"
        >
          <Text className="text-white font-black text-base tracking-wide">
            Verify & Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Notice */}
      <View className="items-center mb-2">
        <Text className="text-xs text-[#8C7078] text-center leading-relaxed">
          Didn't receive the code? Check spam or tap resend above.
        </Text>
      </View>
    </ScrollView>
  );
};
