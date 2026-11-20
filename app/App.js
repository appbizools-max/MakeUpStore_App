import React, { useRef, useEffect, useState } from 'react';
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
import { StaffLoginScreen } from './src/features/staff/StaffLoginScreen';
import { DeliveryPartnerDashboard } from './src/features/staff/DeliveryPartnerDashboard';
import { CustomerUpiPaymentStatusScreen } from './src/features/cart/CustomerUpiPaymentStatusScreen';
import { FloatingCenterTabBar } from './src/components/navigation/FloatingCenterTabBar';
import { NetworkStatusBanner } from './src/components/common/NetworkStatusBanner';
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
} catch (_) { }

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
    navigationHistory = [],
    goBack,
  } = useApp();
  const lastBackPressTimeRef = useRef(0);

  useEffect(() => {
    requestFCMToken().catch(() => { });
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'splash') return false;

      // Root screen double-tap exit check
      const isCustomerLoggedIn = Boolean(userProfile?.phone && (userProfile?.isProfileComplete || userProfile?.name));
      const isRootScreen =
        (currentScreen === 'home' && isCustomerLoggedIn) ||
        currentScreen === 'login' ||
        currentScreen === 'delivery_dashboard';

      if (isRootScreen) {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressTimeRef.current = now;
        if (Platform.OS === 'android') {
          const msg = currentScreen === 'delivery_dashboard'
            ? 'Press back again to exit delivery app'
            : 'Press back again to exit';
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        }
        return true;
      }

      // If navigation history has a stack of screens, cleanly pop to previous screen!
      if (navigationHistory && navigationHistory.length > 1) {
        if (typeof goBack === 'function') {
          goBack();
          return true;
        }
      }

      // Fallback transitions for onboarding flows
      if (currentScreen === 'complete_profile' || currentScreen === 'b2b_registration') {
        setCurrentScreen('onboarding');
        return true;
      }
      if (currentScreen === 'onboarding' || currentScreen === 'otp' || currentScreen === 'staff_login') {
        setCurrentScreen('login');
        return true;
      }
      if (currentScreen === 'b2b_verification' || currentScreen === 'verification_status') {
        setCurrentScreen('home');
        return true;
      }
      if (isCustomerLoggedIn) {
        setCurrentScreen('home');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentScreen, userProfile?.phone, userProfile?.isProfileComplete, userProfile?.name, navigationHistory, goBack, setCurrentScreen]);

  // Persistent Tab Navigation: Keep visited primary tab screens alive in memory
  // This eliminates the 400-800ms unmount/remount freeze, making tab switching 0ms instantaneous.
  const TAB_SCREENS = ['home', 'category', 'search', 'wishlist', 'orders', 'profile'];
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['home']));

  useEffect(() => {
    if (TAB_SCREENS.includes(currentScreen)) {
      setVisitedTabs(prev => {
        if (prev.has(currentScreen)) return prev;
        const next = new Set(prev);
        next.add(currentScreen);
        return next;
      });
    }
  }, [currentScreen]);

  const isTabScreen = TAB_SCREENS.includes(currentScreen);

  // 2. Persistent Primary Tab Screens (Lazy mounted on first visit, kept alive for 0ms transitions)
  const renderPersistentTabs = () => (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {visitedTabs.has('home') && (
        <View style={{ flex: 1, display: currentScreen === 'home' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <HomeScreen />
          </ErrorBoundary>
        </View>
      )}
      {visitedTabs.has('category') && (
        <View style={{ flex: 1, display: currentScreen === 'category' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <CategoryScreen />
          </ErrorBoundary>
        </View>
      )}
      {visitedTabs.has('search') && (
        <View style={{ flex: 1, display: currentScreen === 'search' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <SearchScreen />
          </ErrorBoundary>
        </View>
      )}
      {visitedTabs.has('wishlist') && (
        <View style={{ flex: 1, display: currentScreen === 'wishlist' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <WishlistScreen />
          </ErrorBoundary>
        </View>
      )}
      {visitedTabs.has('orders') && (
        <View style={{ flex: 1, display: currentScreen === 'orders' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <OrderHistoryScreen />
          </ErrorBoundary>
        </View>
      )}
      {visitedTabs.has('profile') && (
        <View style={{ flex: 1, display: currentScreen === 'profile' ? 'flex' : 'none' }}>
          <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
            <ProfileScreen />
          </ErrorBoundary>
        </View>
      )}
    </View>
  );

  const renderScreen = () => {
    if (isRestoringSession) {
      return <SplashScreen />;
    }

    let screenComponent;
    switch (currentScreen) {
      case 'splash': screenComponent = <SplashScreen />; break;
      case 'onboarding': screenComponent = <RoleSelectionScreen />; break;
      case 'login': screenComponent = <MobileLoginScreen />; break;
      case 'otp': screenComponent = <OtpScreen />; break;
      case 'complete_profile': screenComponent = <CompleteProfileScreen />; break;
      case 'b2b_registration': screenComponent = <B2BRegistrationForm />; break;
      case 'b2b_verification': screenComponent = <B2BVerificationScreen />; break;
      case 'verification_status': screenComponent = <VerificationStatusScreen />; break;
      case 'product':
      case 'product_detail': screenComponent = <ProductDetailScreen />; break;
      case 'cart': screenComponent = <CartScreen />; break;
      case 'checkout': screenComponent = <PlaceOrderScreen />; break;
      case 'order_details': screenComponent = <OrderDetailsScreen />; break;
      case 'staff_login': screenComponent = <StaffLoginScreen />; break;
      case 'delivery_dashboard': screenComponent = <DeliveryPartnerDashboard />; break;
      case 'upi_payment_status': screenComponent = <CustomerUpiPaymentStatusScreen />; break;
      case 'home':
      case 'category':
      case 'search':
      case 'wishlist':
      case 'orders':
      case 'profile':
      default:
        return renderPersistentTabs();
    }
    return (
      <ErrorBoundary onGoHome={() => setCurrentScreen('home')} onReset={() => setCurrentScreen('home')}>
        {screenComponent}
      </ErrorBoundary>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      </View>
    );
  }

  const hideBottomNav =
    isRestoringSession ||
    ['splash', 'onboarding', 'login', 'otp', 'complete_profile', 'b2b_registration', 'b2b_verification', 'verification_status', 'checkout', 'confirmation', 'product', 'product_detail', 'staff_login', 'delivery_dashboard', 'upi_payment_status'].includes(currentScreen);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NetworkStatusBanner />

      <View style={{ flex: 1 }} pointerEvents="box-none">{renderScreen()}</View>

      {!hideBottomNav && <FloatingCenterTabBar fourthTabMode="orders" />}

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
