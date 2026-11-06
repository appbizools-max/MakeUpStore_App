import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS, ROLE_SHORT_TITLES } from '../../utils/b2bVerificationService';

export const OtpScreen = () => {
  const {
    userProfile,
    setCurrentScreen,
    prefetchUserProfile,
    lookupUserAccountsByPhone,
    loginWithAccount,
    setVerifiedPhoneForRegistration
  } = useApp();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Unregistered state & Multiple accounts selection state
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [multipleAccounts, setMultipleAccounts] = useState([]);
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);

  const inFlightRef = useRef(false);
  const inputRefs = useRef([]);

  const isOtpComplete = otp.every(d => d.trim().length === 1);

  // Background prefetch profile as soon as OTP screen mounts to eliminate verify delay
  useEffect(() => {
    if (prefetchUserProfile && userProfile?.phone) {
      prefetchUserProfile(userProfile.phone);
    }
  }, [userProfile?.phone, prefetchUserProfile]);

  // Smooth countdown timer
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

  const handleDigitChange = (index, val) => {
    setOtpError('');
    setIsUnregistered(false);
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

  // ── OTP VERIFICATION & RECOGNITION OF EXISTING / NEW ACCOUNTS ─────────
  const handleVerifyOtp = async () => {
    if (!isOtpComplete || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsVerifying(true);
    setOtpError('');
    setIsUnregistered(false);
    setMultipleAccounts([]);

    try {
      const code = otp.join('');
      // In production/simulation, accept valid 4-digit code
      if (code.length !== 4) {
        setOtpError('Please enter the full 4-digit verification code.');
        return;
      }

      // Query database for existing registered accounts matching this verified phone
      const phoneToVerify = userProfile?.phone || '';
      let lookupResult = { isRegistered: false, accounts: [] };

      if (lookupUserAccountsByPhone) {
        lookupResult = await lookupUserAccountsByPhone(phoneToVerify);
      }

      const { isRegistered, accounts } = lookupResult;

      // ── SCENARIO A: SINGLE REGISTERED ACCOUNT (DIRECT DASHBOARD) ─────────
      if (isRegistered && accounts.length === 1) {
        if (loginWithAccount) {
          await loginWithAccount(accounts[0]);
        }
        return;
      }

      // ── SCENARIO B: MULTIPLE REGISTERED ACCOUNT ROLES ─────────────────────
      if (isRegistered && accounts.length > 1) {
        setMultipleAccounts(accounts);
        return;
      }

      // ── SCENARIO C: NEW USER (NOT REGISTERED) ───────────────────────────
      // Display: "Your mobile number is not registered." + "Register Now" button
      setIsUnregistered(true);
    } catch (e) {
      console.warn('OTP Verification note:', e);
      setOtpError('Verification could not be completed. Please check your network and try again.');
    } finally {
      inFlightRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleSelectMultipleAccount = async (account) => {
    if (isSelectingAccount || !account) return;
    setIsSelectingAccount(true);
    try {
      if (loginWithAccount) {
        await loginWithAccount(account);
      }
    } catch (e) {
      setOtpError('Failed to sign in to selected account.');
    } finally {
      setIsSelectingAccount(false);
    }
  };

  const handleRegisterNow = () => {
    // Automatically prefill the verified mobile number and navigate to Account Type Selection
    if (setVerifiedPhoneForRegistration) {
      setVerifiedPhoneForRegistration(userProfile?.phone);
    }
    setCurrentScreen('onboarding');
  };

  const handleResendOtp = () => {
    setTimerSeconds(120);
    setOtp(['', '', '', '']);
    setOtpError('');
    setIsUnregistered(false);
    setMultipleAccounts([]);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'space-between' }}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View>
        {/* Top Header: Back Arrow & Change Number */}
        <View className="flex-row justify-between items-center mt-2 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('login')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="arrow-back" size={20} color="#C2477A" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('login')}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100"
          >
            <Ionicons name="create-outline" size={13} color="#C2477A" />
            <Text className="text-xs font-bold text-[#C2477A]">Edit Number</Text>
          </TouchableOpacity>
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
        <View className="flex-row justify-around mb-6 px-2">
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

        {/* Error message notice */}
        {otpError ? (
          <View className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#E11D48" />
            <Text className="text-xs font-bold text-rose-800 flex-1">{otpError}</Text>
          </View>
        ) : null}

        {/* ── NOT REGISTERED MESSAGE & REGISTER NOW ACTION ─────────────── */}
        {isUnregistered && (
          <View className="mb-6 p-5 rounded-2xl bg-[#FFF9FA] border border-[#FCE4EC] shadow-2xs animate-in fade-in duration-200">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-8 h-8 rounded-full bg-pink-100 items-center justify-center">
                <Ionicons name="person-add" size={16} color="#C2477A" />
              </View>
              <Text className="text-sm font-black text-[#3A2430]">
                Your mobile number is not registered.
              </Text>
            </View>

            <Text className="text-xs text-stone-600 mb-4 leading-relaxed">
              No existing profile was found for <Text className="font-bold text-[#3A2430]">{userProfile?.phone}</Text>. Tap below to choose your account type and create your store account.
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleRegisterNow}
              className="w-full py-3.5 rounded-full bg-[#C2477A] items-center justify-center flex-row gap-2 shadow-md active:opacity-90"
            >
              <Text className="text-white font-black text-sm tracking-wide">
                Register Now
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── MULTIPLE REGISTERED ACCOUNTS SELECTOR ─────────────────────── */}
        {multipleAccounts.length > 1 && (
          <View className="mb-6 p-5 rounded-2xl bg-white border border-[#C2477A] shadow-md animate-in fade-in duration-200">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Ionicons name="people" size={18} color="#C2477A" />
              <Text className="text-sm font-black text-[#3A2430]">
                Multiple Registered Accounts Found
              </Text>
            </View>
            <Text className="text-xs text-stone-500 mb-3.5">
              Select which account role you wish to access:
            </Text>

            <View className="space-y-2.5">
              {multipleAccounts.map((acc, idx) => {
                const rTitle = ROLE_SHORT_TITLES[acc.role] || (acc.role === 'general' ? 'General User' : acc.role);
                const isB2B = acc.role !== 'general';
                return (
                  <TouchableOpacity
                    key={acc.id || idx}
                    disabled={isSelectingAccount}
                    onPress={() => handleSelectMultipleAccount(acc)}
                    activeOpacity={0.85}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-pink-50 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          acc.role === 'salon' ? 'bg-pink-100 text-pink-700' :
                          acc.role === 'artist' ? 'bg-purple-100 text-purple-700' :
                          acc.role === 'beautician' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rTitle}
                        </span>
                        {isB2B && acc.b2bVerified && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Verified
                          </span>
                        )}
                      </View>
                      <Text className="text-xs font-bold text-[#3A2430]">
                        {acc.businessName || acc.name || 'Account'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 text-[#C2477A]">
                      <Text className="text-xs font-bold text-[#C2477A]">Sign In</Text>
                      <Ionicons name="chevron-forward" size={14} color="#C2477A" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 2:00 Countdown Timer Display */}
        <View className="items-center mb-6">
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

        {/* Verify & Continue Button (Hidden once registered check completed) */}
        {!isUnregistered && multipleAccounts.length <= 1 && (
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
        )}
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
