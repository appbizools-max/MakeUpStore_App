import React, { useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StatusBar, BackHandler, ToastAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { AppProvider, useApp } from './src/context/AppContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RoleSelectionScreen } from './src/features/auth/RoleSelectionScreen';
import { MobileLoginScreen } from './src/features/auth/MobileLoginScreen';
import { OtpScreen } from './src/features/auth/OtpScreen';
import { CompleteProfileScreen } from './src/features/auth/CompleteProfileScreen';
import { B2BRegistrationForm } from './src/features/auth/B2BRegistrationForm';
import { SplashScreen } from './src/features/splash/SplashScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { CategoryScreen } from './src/features/category/CategoryScreen';
import { ProductDetailScreen } from './src/features/product/ProductDetailScreen';
import { CartScreen } from './src/features/cart/CartScreen';
import { PlaceOrderScreen } from './src/features/cart/PlaceOrderScreen';
import { OrderHistoryScreen } from './src/features/orders/OrderHistoryScreen';
import { OrderDetailsScreen } from './src/features/orders/OrderDetailsScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { SearchScreen } from './src/features/search/SearchScreen';
import { WishlistScreen } from './src/features/wishlist/WishlistScreen';
import { B2BVerificationScreen } from './src/features/auth/B2BVerificationScreen';
import { VerificationStatusScreen } from './src/features/auth/VerificationStatusScreen';
import { SelectShadeBottomSheet } from './src/components/SelectShadeBottomSheet';
import { requestFCMToken } from './src/utils/fcmService';


// Apply Manrope font globally � must be after imports, before component definitions
const defaultFont = Platform.select({
  ios: 'Manrope-Regular',
  android: 'Manrope-Regular',
  default: 'Manrope, sans-serif',
});
try {
  if (Text.defaultProps == null) Text.defaultProps = {};
  Text.defaultProps.style = [{ fontFamily: defaultFont }, Text.defaultProps.style];
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  TextInput.defaultProps.style = [{ fontFamily: defaultFont }, TextInput.defaultProps.style];
} catch (_) {}

const MainShell = () => {
  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'GreatVibes': GreatVibes_400Regular,
    'GreatVibes_400Regular': GreatVibes_400Regular,
    GreatVibes_400Regular,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const {
    currentScreen,
    setCurrentScreen,
    orders = [],
    userProfile,
    isRestoringSession,
    setSelectedOrderIdForDetails,
  } = useApp();
  const lastBackPressTimeRef = useRef(0);

  useEffect(() => {
    requestFCMToken().catch(() => {});
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'splash') return false;
      if (userProfile?.isProfileComplete) {
        if (currentScreen === 'home') {
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            BackHandler.exitApp();
            return true;
          }
          lastBackPressTimeRef.current = now;
          if (Platform.OS === 'android') ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          return true;
        } else {
          setCurrentScreen('home');
          return true;
        }
      }
      if (currentScreen === 'complete_profile' || currentScreen === 'b2b_registration') {
        setCurrentScreen('onboarding');
        return true;
      }
      if (currentScreen === 'onboarding') {
        setCurrentScreen('login');
        return true;
      }
      if (currentScreen === 'otp') {
        setCurrentScreen('login');
        return true;
      }
      if (currentScreen === 'login') {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressTimeRef.current = now;
        if (Platform.OS === 'android') ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      }
      if (currentScreen === 'b2b_verification' || currentScreen === 'verification_status') {
        setCurrentScreen('home');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentScreen, userProfile?.isProfileComplete, setCurrentScreen]);

  const userOrdersCount = (orders || []).filter(o => {
    if (!o) return false;
    if (!userProfile?.isProfileComplete) return false;
    const cleanPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
    const uPhone = cleanPhone(userProfile?.phone);
    const oPhone = cleanPhone(o?.phone);
    return Boolean(
      (uPhone && oPhone && uPhone === oPhone) ||
      (userProfile?.id && (o?.userId === userProfile.id || o?.user_id === userProfile.id))
    );
  }).length;

  const renderScreen = () => {
    if (isRestoringSession) return <SplashScreen />;
    let screenComponent;
    switch (currentScreen) {
      case 'splash':              screenComponent = <SplashScreen />; break;
      case 'onboarding':          screenComponent = <RoleSelectionScreen />; break;
      case 'login':               screenComponent = <MobileLoginScreen />; break;
      case 'otp':                 screenComponent = <OtpScreen />; break;
      case 'complete_profile':    screenComponent = <CompleteProfileScreen />; break;
      case 'b2b_registration':    screenComponent = <B2BRegistrationForm />; break;
      case 'b2b_verification':    screenComponent = <B2BVerificationScreen />; break;
      case 'verification_status': screenComponent = <VerificationStatusScreen />; break;
      case 'home':                screenComponent = <HomeScreen />; break;
      case 'category':            screenComponent = <CategoryScreen />; break;
      case 'product':
      case 'product_detail':      screenComponent = <ProductDetailScreen />; break;
      case 'cart':                screenComponent = <CartScreen />; break;
      case 'checkout':            screenComponent = <PlaceOrderScreen />; break;
      case 'orders':              screenComponent = <OrderHistoryScreen />; break;
      case 'order_details':       screenComponent = <OrderDetailsScreen />; break;
      case 'profile':             screenComponent = <ProfileScreen />; break;
      case 'search':              screenComponent = <SearchScreen />; break;
      case 'wishlist':            screenComponent = <WishlistScreen />; break;
      default:                    screenComponent = <HomeScreen />; break;
    }
    return (
      <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
        {screenComponent}
      </ErrorBoundary>
    );
  };

  if (!fontsLoaded) return <SplashScreen />;

  const hideBottomNav =
    isRestoringSession ||
    ['splash','onboarding','login','otp','complete_profile','b2b_registration','b2b_verification','verification_status','checkout','confirmation','product','product_detail'].includes(currentScreen);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={{ flex: 1 }} pointerEvents="box-none">{renderScreen()}</View>

      {!hideBottomNav && (
        <View style={{ backgroundColor: '#FFFFFF' }} className="flex-row bg-white border-t border-[#FCE4EC] py-2.5 px-1 justify-around shadow-lg items-center">
          <TouchableOpacity className="items-center flex-1 py-1" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => setCurrentScreen('home')}>
            <Ionicons name={currentScreen === 'home' ? 'home' : 'home-outline'} size={20} color={currentScreen === 'home' ? '#B64F7D' : '#8C7078'} />
            <Text className={`text-[10px] mt-0.5 ${currentScreen === 'home' ? 'text-[#B64F7D] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center flex-1 py-1" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => setCurrentScreen('search')}>
            <Ionicons name={currentScreen === 'search' ? 'search' : 'search-outline'} size={20} color={currentScreen === 'search' ? '#B64F7D' : '#8C7078'} />
            <Text className={`text-[10px] mt-0.5 ${currentScreen === 'search' ? 'text-[#B64F7D] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center flex-1 py-1" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => setCurrentScreen('category')}>
            <Ionicons name={currentScreen === 'category' ? 'grid' : 'grid-outline'} size={20} color={currentScreen === 'category' ? '#B64F7D' : '#8C7078'} />
            <Text className={`text-[10px] mt-0.5 ${currentScreen === 'category' ? 'text-[#B64F7D] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center flex-1 py-1 relative" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => setCurrentScreen('orders')}>
            <View className="relative">
              <Ionicons name={currentScreen === 'orders' || currentScreen === 'order_details' ? 'cube' : 'cube-outline'} size={20} color={currentScreen === 'orders' || currentScreen === 'order_details' ? '#B64F7D' : '#8C7078'} />
              {userOrdersCount > 0 && (
                <View className="absolute -top-1 -right-2 bg-[#B64F7D] min-w-[15px] h-[15px] px-1 rounded-full items-center justify-center border border-white">
                  <Text className="text-white text-[7.5px] font-bold">{userOrdersCount > 9 ? '9+' : userOrdersCount}</Text>
                </View>
              )}
            </View>
            <Text className={`text-[10px] mt-0.5 ${currentScreen === 'orders' || currentScreen === 'order_details' ? 'text-[#B64F7D] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center flex-1 py-1" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => setCurrentScreen('profile')}>
            <Ionicons name={currentScreen === 'profile' ? 'person' : 'person-outline'} size={20} color={currentScreen === 'profile' ? '#B64F7D' : '#8C7078'} />
            <Text className={`text-[10px] mt-0.5 ${currentScreen === 'profile' ? 'text-[#B64F7D] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <SelectShadeBottomSheet />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
