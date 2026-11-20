import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useApp } from '../../context/AppContext';

export const SplashScreen = () => {
  const { setCurrentScreen, userProfile, isRestoringSession } = useApp();

  useEffect(() => {
    if (!isRestoringSession) {
      const isCustomerLoggedIn = Boolean(userProfile?.phone && (userProfile?.isProfileComplete || userProfile?.name));
      if (isCustomerLoggedIn) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    }
  }, [isRestoringSession, userProfile?.phone, userProfile?.isProfileComplete, userProfile?.name, setCurrentScreen]);

  const handleProceed = () => {
    if (!isRestoringSession) {
      const isCustomerLoggedIn = Boolean(userProfile?.phone && (userProfile?.isProfileComplete || userProfile?.name));
      if (isCustomerLoggedIn) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-white"
      onScrollBeginDrag={handleProceed}
      scrollEventThrottle={16}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleProceed}
        className="w-full flex-1 justify-center items-center relative px-6 py-12 bg-white"
        style={{
          backgroundColor: '#FFFFFF',
          minHeight: '100%',
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Brand Logo only — standard default sizing (195x65) */}
        <View className="items-center justify-center">
          <Image
            source={require('../../../Assets/Logo_transparent.png')}
            style={{ width: 195, height: 65 }}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};
