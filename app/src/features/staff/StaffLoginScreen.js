import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { loginStaffWithCredentials } from './staffAuthService';

export const StaffLoginScreen = () => {
  const { setCurrentScreen, setStaffProfile } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorReason, setErrorReason] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setErrorReason('');

    try {
      const result = await loginStaffWithCredentials(identifier.trim(), password.trim());

      if (!result.success) {
        setErrorReason(result.reason || 'ERROR');
        setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Successful Authentication
      if (setStaffProfile) {
        setStaffProfile(result.session);
      }
      setCurrentScreen('delivery_dashboard');
    } catch (err) {
      console.warn('Staff login exception:', err);
      setErrorReason('ERROR');
      setErrorMessage('Network connection error. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = identifier.trim().length >= 3 && password.trim().length >= 4;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, paddingBottom: 48, flexGrow: 1, justifyContent: 'space-between' }}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View>
        {/* Top Header Row with Back to Customer Login */}
        <View className="flex-row items-center justify-between mt-2 mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('login')}
            className="w-10 h-10 rounded-full bg-[#FFF0F5] border border-[#FCE4EC] items-center justify-center shadow-2xs"
          >
            <Ionicons name="arrow-back" size={20} color="#D81B60" />
          </TouchableOpacity>

          {/* Secure Staff Badge */}
          <View className="flex-row items-center bg-[#FDF2F8] border border-[#FCE4EC] px-3.5 py-1.5 rounded-full">
            <Ionicons name="shield-checkmark" size={14} color="#D81B60" style={{ marginRight: 5 }} />
            <Text className="text-[11px] font-black text-[#D81B60] tracking-wider uppercase">
              Admin Assigned Staff
            </Text>
          </View>
        </View>

        {/* Center Icon & Branding */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-3xl bg-[#FFF0F5] border border-[#FCD8E3] items-center justify-center shadow-sm mb-3">
            <Ionicons name="bicycle" size={38} color="#D81B60" />
          </View>
          <Text className="text-2xl font-black text-[#3A2430] text-center">
            Delivery Partner Login
          </Text>
          <Text className="text-xs font-medium text-[#8C7078] text-center mt-1.5 leading-relaxed max-w-[280px]">
            Log in with the User ID (or Mobile Number) and Password assigned to you by the administrator.
          </Text>
        </View>

        {/* ── ERROR ALERT BANNER ── */}
        {errorMessage ? (
          <View className={`mb-5 p-4 rounded-2xl border ${errorReason === 'DEACTIVATED' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <View className="flex-row items-start">
              <Ionicons
                name={errorReason === 'DEACTIVATED' ? 'ban-outline' : 'alert-circle'}
                size={20}
                color={errorReason === 'DEACTIVATED' ? '#D97706' : '#D81B60'}
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <View className="flex-1">
                <Text className={`text-xs font-black ${errorReason === 'DEACTIVATED' ? 'text-amber-800' : 'text-red-700'}`}>
                  {errorReason === 'DEACTIVATED' ? 'Account Deactivated' : 'Authentication Error'}
                </Text>
                <Text className={`text-xs mt-0.5 leading-relaxed font-medium ${errorReason === 'DEACTIVATED' ? 'text-amber-700' : 'text-red-600'}`}>
                  {errorMessage}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── INPUT 1: USER ID / EMPLOYEE CODE / MOBILE ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-[#553846] mb-2 ml-1">
            User ID, Employee Code, or Mobile Number *
          </Text>

          <View className="border border-[#FCE4EC] focus:border-[#D81B60] bg-white rounded-2xl py-3.5 px-4 flex-row items-center shadow-2xs">
            <Ionicons name="person-outline" size={18} color="#8C7078" style={{ marginRight: 10 }} />
            <TextInput
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              className="flex-1 text-sm font-bold text-[#3A2430] p-0"
              placeholder="e.g. EMP-DEL-01 or 9876543210"
              placeholderTextColor="#8C7078"
            />
            {identifier.trim().length >= 3 && (
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
            )}
          </View>
        </View>

        {/* ── INPUT 2: PASSWORD ── */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-[#553846] mb-2 ml-1">
            Staff Password (Assigned by Admin) *
          </Text>

          <View className="border border-[#FCE4EC] focus:border-[#D81B60] bg-white rounded-2xl py-3.5 px-4 flex-row items-center shadow-2xs">
            <Ionicons name="lock-closed-outline" size={18} color="#8C7078" style={{ marginRight: 10 }} />
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 text-sm font-bold text-[#3A2430] p-0"
              placeholder="Enter password assigned by admin"
              placeholderTextColor="#8C7078"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8C7078" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LOGIN BUTTON ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isFormValid || isSubmitting}
          onPress={handleLogin}
          style={{ backgroundColor: isFormValid && !isSubmitting ? '#D81B60' : '#E5E7EB' }}
          className="w-full py-4 rounded-full flex-row items-center justify-center shadow-lg active:opacity-90 mb-4"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ color: isFormValid ? '#FFFFFF' : '#9CA3AF' }} className="font-black text-sm tracking-wide mr-2">
                Log In to Delivery Dashboard
              </Text>
              <Ionicons name="arrow-forward" size={17} color={isFormValid ? '#FFFFFF' : '#9CA3AF'} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Back to Customer Login Footer Link */}
      <View className="items-center mt-6">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCurrentScreen('login')}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={14} color="#8C7078" style={{ marginRight: 4 }} />
          <Text className="text-xs font-bold text-[#8C7078]">
            Back to Customer & B2B Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
