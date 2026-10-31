import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Platform, Image } from 'react-native';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';

export const SplashScreen = () => {
  const { setCurrentScreen, userProfile } = useApp();
  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

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
      className="flex-1 bg-[#FDEAF1]"
      onScrollBeginDrag={handleProceed}
      scrollEventThrottle={16}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleProceed}
        className="w-full flex-1 justify-center items-center relative px-6 py-12"
        style={{
          backgroundColor: '#FDEAF1',
          minHeight: '100%',
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FDEAF1" />

        {/* Main Centered Brand Content */}
        <View className="items-center justify-center -mt-8">
          {/* Approved Brand Logo */}
          <View className="w-24 h-24 rounded-3xl bg-white/90 p-2.5 items-center justify-center mb-4 shadow-sm border border-[#FCE4EC]">
            <Image
              source={require('../../../Assets/Logo.png')}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
          </View>

          {/* Brand Title with Home screen GreatVibes cursive font */}
          <Text
            style={{
              fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
            }}
            className="text-[64px] text-[#C2477A] text-center tracking-wide mb-2"
          >
            Salbeau
          </Text>

          {/* Subtitle matching reference design */}
          <Text className="text-sm font-medium text-[#8C7078] text-center tracking-wide mb-6">
            Beauty, priced right for you.
          </Text>
        </View>

        {/* Bottom Page Indicator Dots matching reference screenshot */}
        <View className="absolute bottom-12 flex-row items-center justify-center gap-2">
          <View className="w-2 h-2 rounded-full bg-[#C2477A]" />
          <View className="w-2 h-2 rounded-full bg-[#F5A8C0]/60" />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};
