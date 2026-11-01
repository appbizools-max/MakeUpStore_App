import React from 'react';
import { View, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useApp } from '../../context/AppContext';

export const SplashScreen = () => {
  const { setCurrentScreen, userProfile } = useApp();

  const handleProceed = () => {
    if (userProfile?.isProfileComplete) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  React.useEffect(() => {
    if (userProfile?.isProfileComplete) {
      setCurrentScreen('home');
      return;
    }
    const timer = setTimeout(() => {
      handleProceed();
    }, 1500);
    return () => clearTimeout(timer);
  }, [userProfile?.isProfileComplete]);

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

        {/* Brand Logo only — without background and without text */}
        <View className="items-center justify-center">
          <Image
            source={require('../../../Assets/Logo_transparent.png')}
            style={{ width: 220, height: 90 }}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};
