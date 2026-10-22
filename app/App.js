import React, { useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StatusBar, BackHandler, ToastAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { RoleSelectionScreen } from './src/features/auth/RoleSelectionScreen';
import { MobileLoginScreen } from './src/features/auth/MobileLoginScreen';
import { OtpScreen } from './src/features/auth/OtpScreen';
import { CompleteProfileScreen } from './src/features/auth/CompleteProfileScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { CategoryScreen } from './src/features/category/CategoryScreen';
import { ProductDetailScreen } from './src/features/product/ProductDetailScreen';
import { CartScreen } from './src/features/cart/CartScreen';
import { PlaceOrderScreen } from './src/features/cart/PlaceOrderScreen';
import { OrderHistoryScreen } from './src/features/orders/OrderHistoryScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { SearchScreen } from './src/features/search/SearchScreen';
import { WishlistScreen } from './src/features/wishlist/WishlistScreen';
import { B2BVerificationScreen } from './src/features/auth/B2BVerificationScreen';
import { VerificationStatusScreen } from './src/features/auth/VerificationStatusScreen';

const MainShell = () => {
  const { currentScreen, setCurrentScreen, orders = [], userProfile, isRestoringSession } = useApp();
  const lastBackPressTimeRef = useRef(0);

  // Android Hardware Back Button Interception
  useEffect(() => {
    const onBackPress = () => {
      // 1. Splash screen: let OS default handle
      if (currentScreen === 'splash') {
        return false;
      }

      // 2. User is logged in with complete profile
      if (userProfile?.isProfileComplete) {
        if (currentScreen === 'home') {
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            BackHandler.exitApp();
            return true;
          }
          lastBackPressTimeRef.current = now;
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          }
          return true; // prevent going back to onboarding/login
        } else {
          // Any sub-screen navigates back to 'home'
          setCurrentScreen('home');
          return true;
        }
      }

      // 3. User is NOT logged in (auth flow navigation)
      if (currentScreen === 'otp') {
        setCurrentScreen('login');
        return true;
      }
      if (currentScreen === 'login') {
        setCurrentScreen('onboarding');
        return true;
      }
      if (currentScreen === 'b2b_verification' || currentScreen === 'verification_status') {
        setCurrentScreen('home');
        return true;
      }
      if (currentScreen === 'complete_profile') {
        setCurrentScreen('otp');
        return true;
      }
      if (currentScreen === 'onboarding') {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [currentScreen, userProfile?.isProfileComplete, setCurrentScreen]);

  const userOrdersCount = (orders || []).filter(o =>
    !userProfile ? true : (o.phone === userProfile.phone || o.userName === userProfile.name)
  ).length;

  const renderScreen = () => {
    if (isRestoringSession) {
      return <SplashScreen />;
    }

    switch (currentScreen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <RoleSelectionScreen />;
      case 'login': return <MobileLoginScreen />;
      case 'otp': return <OtpScreen />;
      case 'complete_profile': return <CompleteProfileScreen />;
      case 'b2b_verification': return <B2BVerificationScreen />;
      case 'verification_status': return <VerificationStatusScreen />;
      case 'home': return <HomeScreen />;
      case 'category': return <CategoryScreen />;
      case 'product': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <PlaceOrderScreen />;
      case 'orders': return <OrderHistoryScreen />;
      case 'profile': return <ProfileScreen />;
      case 'search': return <SearchScreen />;
      case 'wishlist': return <WishlistScreen />;
      default: return <HomeScreen />;
    }
  };

  const hideBottomNav = isRestoringSession || currentScreen === 'splash' || currentScreen === 'onboarding' || currentScreen === 'login' || currentScreen === 'otp' || currentScreen === 'complete_profile' || currentScreen === 'b2b_verification' || currentScreen === 'verification_status' || currentScreen === 'checkout' || currentScreen === 'confirmation';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* 5-Button Bottom Navigation: Home, Categories, Search, My Orders, Profile */}
      {!hideBottomNav && (
        <View
          style={{ backgroundColor: '#FFFFFF' }}
          className="flex-row bg-white border-t border-[#FCE4EC] py-2.5 px-1 justify-around absolute bottom-0 left-0 right-0 shadow-lg items-center"
        >
          {/* 1. Home */}
          <TouchableOpacity
            className="items-center flex-1"
            onPress={() => setCurrentScreen('home')}
          >
            <Ionicons
              name={currentScreen === 'home' ? "home" : "home-outline"}
              size={20}
              color={currentScreen === 'home' ? "#C2477A" : "#8C7078"}
            />
            <Text
              className={`text-[10px] mt-0.5 ${
                currentScreen === 'home' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'
              }`}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* 2. Categories */}
          <TouchableOpacity
            className="items-center flex-1"
            onPress={() => setCurrentScreen('category')}
          >
            <Ionicons
              name={currentScreen === 'category' ? "grid" : "grid-outline"}
              size={20}
              color={currentScreen === 'category' ? "#C2477A" : "#8C7078"}
            />
            <Text
              className={`text-[10px] mt-0.5 ${
                currentScreen === 'category' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'
              }`}
            >
              Categories
            </Text>
          </TouchableOpacity>

          {/* 3. Search */}
          <TouchableOpacity
            className="items-center flex-1"
            onPress={() => setCurrentScreen('search')}
          >
            <Ionicons
              name={currentScreen === 'search' ? "search" : "search-outline"}
              size={20}
              color={currentScreen === 'search' ? "#C2477A" : "#8C7078"}
            />
            <Text
              className={`text-[10px] mt-0.5 ${
                currentScreen === 'search' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'
              }`}
            >
              Search
            </Text>
          </TouchableOpacity>

          {/* 4. My Orders */}
          <TouchableOpacity
            className="items-center flex-1 relative"
            onPress={() => setCurrentScreen('orders')}
          >
            <View className="relative">
              <Ionicons
                name={currentScreen === 'orders' ? "receipt" : "receipt-outline"}
                size={20}
                color={currentScreen === 'orders' ? "#C2477A" : "#8C7078"}
              />
              {userOrdersCount > 0 && (
                <View className="absolute -top-1 -right-2 bg-[#C2477A] min-w-[15px] h-[15px] px-1 rounded-full items-center justify-center border border-white">
                  <Text className="text-white text-[7.5px] font-bold">
                    {userOrdersCount > 9 ? '9+' : userOrdersCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`text-[10px] mt-0.5 ${
                currentScreen === 'orders' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'
              }`}
            >
              My Orders
            </Text>
          </TouchableOpacity>

          {/* 5. Profile */}
          <TouchableOpacity
            className="items-center flex-1"
            onPress={() => setCurrentScreen('profile')}
          >
            <Ionicons
              name={currentScreen === 'profile' ? "person" : "person-outline"}
              size={20}
              color={currentScreen === 'profile' ? "#C2477A" : "#8C7078"}
            />
            <Text
              className={`text-[10px] mt-0.5 ${
                currentScreen === 'profile' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'
              }`}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}
