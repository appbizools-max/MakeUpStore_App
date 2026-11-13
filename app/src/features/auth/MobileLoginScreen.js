import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const MobileLoginScreen = () => {
  const {
    userProfile,
    setUserProfile,
    setCurrentScreen,
    prefetchUserProfile,
    lookupUserAccountsByPhone,
    setVerifiedPhoneForRegistration,
    resolvePostLoginDeepLink
  } = useApp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('idle'); // 'idle' | 'checking' | 'registered' | 'unregistered' | 'error'
  const [validationMessage, setValidationMessage] = useState('');
  const [lastCheckedDigits, setLastCheckedDigits] = useState('');

  // Strict session safeguard: if user already has an active authenticated profile, redirect safely
  useEffect(() => {
    if (userProfile?.isProfileComplete) {
      if (typeof resolvePostLoginDeepLink === 'function') {
        resolvePostLoginDeepLink(userProfile).then((handled) => {
          if (!handled) setCurrentScreen('home');
        }).catch(() => setCurrentScreen('home'));
      } else {
        setCurrentScreen('home');
      }
    }
  }, [userProfile?.isProfileComplete, setCurrentScreen, resolvePostLoginDeepLink]);

  const checkTimerRef = useRef(null);
  const inFlightRef = useRef(false);

  // 10 digits validation
  const cleanDigits = mobileNumber.replace(/\D/g, '');
  const isValid = cleanDigits.length === 10;

  // Real-time check function against database
  const verifyMobileRegistration = useCallback(async (digits) => {
    if (!digits || digits.length !== 10) return;
    if (inFlightRef.current && digits === lastCheckedDigits) return;

    inFlightRef.current = true;
    setIsChecking(true);
    setRegistrationStatus('checking');
    setValidationMessage('');

    try {
      let result = { isRegistered: false, accounts: [] };
      if (lookupUserAccountsByPhone) {
        result = await lookupUserAccountsByPhone(digits);
      }

      setLastCheckedDigits(digits);

      if (result && result.isRegistered && Array.isArray(result.accounts) && result.accounts.length > 0) {
        setRegistrationStatus('registered');
        setValidationMessage('');
        // Warm up profile in background for seamless OTP transition
        const fullPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        if (prefetchUserProfile) {
          prefetchUserProfile(fullPhone);
        }
      } else {
        setRegistrationStatus('unregistered');
        setValidationMessage('This mobile number is not registered.');
      }
    } catch (err) {
      console.warn('Error checking mobile registration:', err);
      setRegistrationStatus('error');
      setValidationMessage('Unable to check mobile number status. Please check your internet connection.');
    } finally {
      setIsChecking(false);
      inFlightRef.current = false;
    }
  }, [lookupUserAccountsByPhone, prefetchUserProfile, lastCheckedDigits]);

  // Trigger check immediately when 10 digits are entered
  useEffect(() => {
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    if (cleanDigits.length < 10) {
      setRegistrationStatus('idle');
      setValidationMessage('');
      setIsChecking(false);
      return;
    }

    if (cleanDigits.length === 10) {
      if (cleanDigits !== lastCheckedDigits || registrationStatus === 'idle') {
        // Small 200ms debounce to allow user to finish typing smoothly
        checkTimerRef.current = setTimeout(() => {
          verifyMobileRegistration(cleanDigits);
        }, 200);
      }
    }

    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, [cleanDigits, lastCheckedDigits, registrationStatus, verifyMobileRegistration]);

  const handleTextChange = (text) => {
    const raw = text.replace(/\D/g, '').slice(0, 10);
    if (raw.length > 5) {
      setMobileNumber(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMobileNumber(raw);
    }
  };

  // Continue to OTP for registered users
  const handleContinueToOtp = async () => {
    if (!isValid) return;

    // If still in-flight or not yet checked, perform immediate verification
    if (registrationStatus !== 'registered' || lastCheckedDigits !== cleanDigits) {
      setIsChecking(true);
      try {
        const result = await lookupUserAccountsByPhone(cleanDigits);
        setLastCheckedDigits(cleanDigits);
        if (!result || !result.isRegistered) {
          setRegistrationStatus('unregistered');
          setValidationMessage('This mobile number is not registered.');
          setIsChecking(false);
          return; // Stop: Do not navigate to OTP!
        }
        setRegistrationStatus('registered');
      } catch (e) {
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    }

    // Existing registered user continues to normal OTP verification
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

  // Continue to Register for unregistered users
  const handleContinueToRegister = () => {
    if (!isValid) return;
    const fullPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

    setUserProfile(prev => ({
      ...prev,
      phone: fullPhone,
      isPhoneVerified: false,
      isProfileComplete: false,
    }));

    if (setVerifiedPhoneForRegistration) {
      setVerifiedPhoneForRegistration(fullPhone);
    }

    // Direct navigation to Account Type Selection Screen without OTP verification
    setCurrentScreen('onboarding');
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'space-between' }}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View>
        {/* Top Header Row with Small Circular Staff / Delivery Partner Login Icon at Top-Right */}
        <View className="flex-row items-center justify-between mt-1 mb-1">
          <View style={{ width: 44 }} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('staff_login')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="flex-col items-center"
          >
            <View className="w-11 h-11 rounded-full bg-[#FFF0F5] border border-[#FCD8E3] items-center justify-center shadow-xs">
              <Ionicons name="bicycle" size={20} color="#D81B60" />
            </View>
            <Text className="text-[9px] font-black text-[#D81B60] mt-1 tracking-wider uppercase">
              Staff / Rider
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Branding Logo */}
        <View className="items-center mt-2 mb-8">
          <Image
            source={require('../../../Assets/Logo_transparent.png')}
            style={{ width: 170, height: 65 }}
            resizeMode="contain"
          />
          <View className="flex-row items-center gap-1.5 mt-2 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full">
            <Ionicons name="sparkles" size={12} color="#D81B60" />
            <Text className="text-[11px] font-bold text-[#D81B60] tracking-wider uppercase">
              Beauty & Professional Store
            </Text>
          </View>
        </View>

        {/* Mobile Input Field Box */}
        <View
          style={{
            borderColor:
              registrationStatus === 'unregistered'
                ? '#D81B60'
                : registrationStatus === 'registered'
                ? '#059669'
                : isValid
                ? '#D81B60'
                : '#FCE4EC'
          }}
          className="border bg-white rounded-full py-3.5 px-5 flex-row items-center shadow-2xs mb-3"
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

          {/* Right Status Indicators */}
          {isChecking && (
            <ActivityIndicator size="small" color="#D81B60" style={{ marginLeft: 6 }} />
          )}

          {!isChecking && registrationStatus === 'registered' && (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
          )}

          {!isChecking && registrationStatus === 'unregistered' && (
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#D81B60" />
            </View>
          )}
        </View>

        {/* Realtime Status Feedback */}
        {isChecking && (
          <View className="flex-row items-center ml-2 mb-4">
            <ActivityIndicator size="small" color="#D81B60" style={{ marginRight: 6, transform: [{ scale: 0.75 }] }} />
            <Text className="text-xs font-semibold text-[#8C7078]">
              Checking account status in database...
            </Text>
          </View>
        )}

        {/* Registered User Success Indicator */}
        {!isChecking && registrationStatus === 'registered' && (
          <View className="flex-row items-center ml-2 mb-4">
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text className="text-xs font-bold text-[#059669] ml-1.5">
              Registered account found. Tap continue to verify with OTP.
            </Text>
          </View>
        )}

        {/* UNREGISTERED USER NOTIFICATION CARD */}
        {!isChecking && registrationStatus === 'unregistered' && (
          <View className="mt-1 mb-5 p-4 bg-[#FFF5F8] border border-[#FCE4EC] rounded-2xl shadow-2xs">
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-[#FFE4EC] items-center justify-center mr-3 mt-0.5">
                <Ionicons name="alert-circle" size={20} color="#D81B60" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-[#D81B60]">
                  This mobile number is not registered.
                </Text>
                <Text className="text-xs font-medium text-[#8C7078] mt-1 leading-relaxed">
                  No existing account was found for +91 {cleanDigits}. Please continue to register your new account.
                </Text>
              </View>
            </View>

            {/* "Continue to Register" Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleContinueToRegister}
              style={{ backgroundColor: '#D81B60' }}
              className="w-full mt-4 py-3.5 rounded-full flex-row items-center justify-center shadow-md active:opacity-90"
            >
              <Ionicons name="person-add-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="font-black text-sm text-white tracking-wide">
                Continue to Register
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Error notification if database check failed */}
        {!isChecking && registrationStatus === 'error' && (
          <View className="mt-1 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex-row items-center">
            <Ionicons name="warning-outline" size={16} color="#DC2626" className="mr-2" />
            <Text className="text-xs font-semibold text-red-700 flex-1 ml-1.5">
              {validationMessage || 'Connection error. Please try again.'}
            </Text>
          </View>
        )}

        {/* NORMAL CONTINUE BUTTON: For Registered Users or Initial State */}
        {registrationStatus !== 'unregistered' && (
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!isValid || isChecking}
            onPress={handleContinueToOtp}
            style={{
              backgroundColor: isValid && !isChecking ? '#D81B60' : '#E5E7EB'
            }}
            className="w-full py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4"
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: isValid ? '#FFFFFF' : '#9CA3AF' }}
                className="font-black text-base tracking-wide"
              >
                Continue
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Footer Legal Terms Notice */}
      <View className="items-center mb-2">
        <Text className="text-xs text-[#8C7078] text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <Text className="text-[#D81B60] font-bold underline">Terms</Text> &{' '}
          <Text className="text-[#D81B60] font-bold underline">Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
};
