import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { isB2BRole } from '../../utils/b2bVerificationService';

export const CompleteProfileScreen = () => {
  const { userRole, userProfile, saveUserProfile, setCurrentScreen } = useApp();

  const [fullName, setFullName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [pincode, setPincode] = useState(userProfile?.pincode || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [state, setState] = useState(userProfile?.state || '');

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pincodeTouched, setPincodeTouched] = useState(false);

  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);

  // Email format validation (optional functionally)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !email.trim() || emailRegex.test(email.trim());

  // Automatic City and State detection on valid 6-digit PIN code
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      lookupPincode(cleanPin);
    } else {
      setDetectionError('');
      if (cleanPin.length === 0) {
        setCity('');
        setState('');
      }
    }
  }, [pincode]);

  const pincodeCacheRef = useRef(new Map());

  const lookupPincode = async (code) => {
    if (pincodeCacheRef.current.has(code)) {
      const cached = pincodeCacheRef.current.get(code);
      setCity(cached.city);
      setState(cached.state);
      setDetectionError('');
      return;
    }

    setIsDetecting(true);
    setDetectionError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data && Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const detectedCity = po.District || po.Block || po.Division || po.Name || '';
        const detectedState = po.State || '';

        pincodeCacheRef.current.set(code, { city: detectedCity, state: detectedState });
        setCity(detectedCity);
        setState(detectedState);
        setDetectionError('');
      } else {
        setDetectionError("We couldn't detect your location from this PIN code. Please check the PIN code or enter your location manually.");
      }
    } catch (err) {
      setDetectionError('We couldn\'t detect your location from this PIN code. Please check the PIN code or enter your location manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Continue button validation
  const isFormValid =
    fullName.trim().length >= 2 &&
    pincode.replace(/\D/g, '').length === 6 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    isEmailValid;

  const handleContinue = async () => {
    setFullNameTouched(true);
    setPincodeTouched(true);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await saveUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim()
      });

      if (isB2BRole(userRole)) {
        setCurrentScreen('b2b_verification');
      } else {
        setCurrentScreen('home');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Arrow */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('otp')}
            className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#C2477A" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="mb-7 items-center">
          <Text className="text-2xl font-black text-[#3A2430] tracking-tight">
            Complete Your Profile
          </Text>
        </View>

        {/* ---------------- 1. Full Name * ---------------- */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-[#3A2430] mb-2">
            Full Name <Text className="text-[#C2477A]">*</Text>
          </Text>
          <View
            className={`border rounded-2xl bg-white px-4 py-3.5 shadow-2xs ${
              fullNameTouched && fullName.trim().length < 2
                ? 'border-[#E11D48]'
                : 'border-[#FCE4EC]'
            }`}
          >
            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (!fullNameTouched) setFullNameTouched(true);
              }}
              onBlur={() => setFullNameTouched(true)}
              placeholder="Enter your full name"
              placeholderTextColor="#8C7078"
              keyboardType="default"
              autoCapitalize="words"
              className="text-sm font-semibold text-[#3A2430] p-0"
            />
          </View>
          {fullNameTouched && fullName.trim().length < 2 && (
            <Text className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
              Please enter your full name.
            </Text>
          )}
        </View>

        {/* ---------------- 2. Email Address ---------------- */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-[#3A2430] mb-2">
            Email Address
          </Text>
          <View
            className={`border rounded-2xl bg-white px-4 py-3.5 shadow-2xs ${
              emailTouched && !isEmailValid
                ? 'border-[#E11D48]'
                : 'border-[#FCE4EC]'
            }`}
          >
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (!emailTouched) setEmailTouched(true);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="Enter your email"
              placeholderTextColor="#8C7078"
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-sm font-semibold text-[#3A2430] p-0"
            />
          </View>
          {emailTouched && !isEmailValid && (
            <Text className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
              Please enter a valid email format.
            </Text>
          )}
        </View>

        {/* ---------------- 3. PIN Code * ---------------- */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-[#3A2430] mb-2">
            PIN Code <Text className="text-[#C2477A]">*</Text>
          </Text>
          <View
            className={`border rounded-2xl bg-white px-4 py-3.5 flex-row items-center justify-between shadow-2xs ${
              pincodeTouched && pincode.replace(/\D/g, '').length !== 6
                ? 'border-[#E11D48]'
                : 'border-[#FCE4EC]'
            }`}
          >
            <TextInput
              value={pincode}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '').slice(0, 6);
                setPincode(cleaned);
                if (!pincodeTouched) setPincodeTouched(true);
              }}
              onBlur={() => setPincodeTouched(true)}
              placeholder="Enter PIN code"
              placeholderTextColor="#8C7078"
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 text-sm font-bold text-[#3A2430] p-0"
            />
            {isDetecting && (
              <ActivityIndicator size="small" color="#C2477A" style={{ marginLeft: 8 }} />
            )}
          </View>

          {pincodeTouched && pincode.replace(/\D/g, '').length > 0 && pincode.replace(/\D/g, '').length < 6 && (
            <Text className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
              Please enter a valid 6-digit PIN code.
            </Text>
          )}

          {detectionError ? (
            <Text className="text-[11px] font-semibold text-[#E11D48] mt-1.5 ml-1 leading-snug">
              {detectionError}
            </Text>
          ) : null}
        </View>

        {/* ---------------- 4. City (Editable + ✎ Icon) ---------------- */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-[#3A2430] mb-2">
            City
          </Text>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => cityInputRef.current?.focus()}
            className="border border-[#FCE4EC] rounded-2xl bg-white px-4 py-3.5 flex-row items-center justify-between shadow-2xs"
          >
            <TextInput
              ref={cityInputRef}
              value={city}
              onChangeText={setCity}
              placeholder="Enter City"
              placeholderTextColor="#8C7078"
              className="flex-1 text-sm font-bold text-[#3A2430] p-0"
            />
            <TouchableOpacity
              onPress={() => cityInputRef.current?.focus()}
              className="p-1 -mr-1"
            >
              <Ionicons name="pencil" size={15} color="#8C7078" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ---------------- 5. State (Editable + ✎ Icon) ---------------- */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-[#3A2430] mb-2">
            State
          </Text>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => stateInputRef.current?.focus()}
            className="border border-[#FCE4EC] rounded-2xl bg-white px-4 py-3.5 flex-row items-center justify-between shadow-2xs"
          >
            <TextInput
              ref={stateInputRef}
              value={state}
              onChangeText={setState}
              placeholder="Enter State"
              placeholderTextColor="#8C7078"
              className="flex-1 text-sm font-bold text-[#3A2430] p-0"
            />
            <TouchableOpacity
              onPress={() => stateInputRef.current?.focus()}
              className="p-1 -mr-1"
            >
              <Ionicons name="pencil" size={15} color="#8C7078" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ---------------- 6. Continue Button ---------------- */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isFormValid || isSubmitting}
          onPress={handleContinue}
          className={`w-full py-4 rounded-full items-center justify-center shadow-lg active:scale-[0.99] transition-all ${
            isFormValid && !isSubmitting
              ? 'bg-[#C2477A]'
              : 'bg-[#C2477A]/40'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-black text-base tracking-wide">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
