import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { isB2BRole } from '../../utils/b2bVerificationService';

export const OtpScreen = () => {
  const { userRole, userProfile, setCurrentScreen, checkUserExistingProfile, prefetchUserProfile } = useApp();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(120); // 2:00 minutes countdown limit
  const [isVerifying, setIsVerifying] = useState(false);
  const inFlightRef = useRef(false);
  const inputRefs = useRef([]);

  const isOtpComplete = otp.every(d => d.trim().length === 1);

  // Background prefetch profile as soon as OTP screen mounts to eliminate verify delay
  useEffect(() => {
    if (prefetchUserProfile && userProfile?.phone) {
      prefetchUserProfile(userProfile.phone);
    }
  }, [userProfile?.phone]);

  // Smooth timer without recreating interval every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleDigitChange = (index, val) => {
    const cleanVal = val.replace(/\D/g, '');
    const updated = [...otp];
    updated[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtp(updated);

    if (cleanVal && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Instant one-tap verification with duplicate request prevention
  const handleVerifyOtp = async () => {
    if (!isOtpComplete || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsVerifying(true);

    try {
      let isComplete = false;
      if (checkUserExistingProfile) {
        isComplete = await checkUserExistingProfile(userProfile?.phone);
      }

      // Check if user is B2B (either chosen on role screen or stored in existing profile)
      const effectiveRole = (userProfile?.role || userRole || '').toLowerCase().trim();
      const isB2B = isB2BRole(effectiveRole);

      if (isB2B) {
        // DIRECTLY OPEN B2B PROFESSIONAL VERIFICATION USER ACCOUNT FOR ALL B2B USERS
        setCurrentScreen('b2b_verification');
        return;
      }

      // For General User (B2C):
      if (isComplete) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('complete_profile');
      }
    } catch (e) {
      const effectiveRole = (userProfile?.role || userRole || '').toLowerCase().trim();
      if (isB2BRole(effectiveRole)) {
        setCurrentScreen('b2b_verification');
      } else {
        setCurrentScreen('complete_profile');
      }
    } finally {
      inFlightRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleResendOtp = () => {
    setTimerSeconds(120);
    setOtp(['', '', '', '']);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
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
        <Text className="text-xs font-medium text-[#8C7078] mb-1 leading-relaxed">
          Sent verification code to <Text className="font-bold text-[#3A2430]">{userProfile?.phone || ''}</Text>
        </Text>
        <Text className="text-[11px] text-[#C2477A] font-semibold mb-6">
          Enter 4-digit code (e.g. 1234)
        </Text>

        {/* 4-Digit Crisp White OTP Inputs */}
        <View className="flex-row justify-around mb-8 px-2">
          {otp.map((digit, index) => (
            <View
              key={index}
              style={{ borderColor: digit ? '#C2477A' : '#F5A8C0' }}
              className="w-14 h-14 rounded-2xl border bg-white items-center justify-center shadow-xs"
            >
              <TextInput
                ref={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChangeText={(val) => handleDigitChange(index, val)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                keyboardType="number-pad"
                maxLength={1}
                className="text-2xl font-black text-[#3A2430] text-center w-full"
                autoFocus={index === 0}
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
          disabled={!isOtpComplete || isVerifying}
          onPress={handleVerifyOtp}
          style={{
            backgroundColor: isOtpComplete && !isVerifying ? '#C2477A' : '#E5E7EB'
          }}
          className="w-full py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4"
        >
          {isVerifying ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-black text-base tracking-wide">
                Verifying OTP...
              </Text>
            </View>
          ) : (
            <Text
              style={{ color: isOtpComplete ? '#FFFFFF' : '#9CA3AF' }}
              className="font-black text-base tracking-wide"
            >
              Verify & Continue
            </Text>
          )}
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
