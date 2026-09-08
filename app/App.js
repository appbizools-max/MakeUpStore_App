import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { RoleSelectionScreen } from './src/features/auth/RoleSelectionScreen';
import { MobileLoginScreen } from './src/features/auth/MobileLoginScreen';
import { OtpScreen } from './src/features/auth/OtpScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { CategoryScreen } from './src/features/category/CategoryScreen';
import { ProductDetailScreen } from './src/features/product/ProductDetailScreen';
import { CartScreen } from './src/features/cart/CartScreen';
import { PlaceOrderScreen } from './src/features/cart/PlaceOrderScreen';
import { OrderHistoryScreen } from './src/features/orders/OrderHistoryScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { SearchScreen } from './src/features/search/SearchScreen';

const MainShell = () => {
  const { currentScreen, setCurrentScreen, cart } = useApp();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <RoleSelectionScreen />;
      case 'login': return <MobileLoginScreen />;
      case 'otp': return <OtpScreen />;
      case 'home': return <HomeScreen />;
      case 'category': return <CategoryScreen />;
      case 'product': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <PlaceOrderScreen />;
      case 'orders': return <OrderHistoryScreen />;
      case 'profile': return <ProfileScreen />;
      case 'search': return <SearchScreen />;
      default: return <HomeScreen />;
    }
  };

  const hideBottomNav = currentScreen === 'splash' || currentScreen === 'onboarding' || currentScreen === 'login' || currentScreen === 'otp' || currentScreen === 'checkout' || currentScreen === 'confirmation';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Vector Bottom Navigation Bar matching Screenshot UI */}
      {!hideBottomNav && (
        <View
          style={{ backgroundColor: '#FFFFFF' }}
          className="flex-row bg-white border-t border-[#FCE4EC] py-2.5 px-2 justify-around absolute bottom-0 left-0 right-0 shadow-lg items-center"
        >
        {/* Home Tab */}
        <TouchableOpacity className="items-center" onPress={() => setCurrentScreen('home')}>
          <Ionicons
            name={currentScreen === 'home' ? "home" : "home-outline"}
            size={20}
            color={currentScreen === 'home' ? "#C2477A" : "#8C7078"}
          />
          <Text className={`text-[10px] mt-0.5 ${currentScreen === 'home' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Categories Tab */}
        <TouchableOpacity className="items-center" onPress={() => setCurrentScreen('category')}>
          <Ionicons
            name={currentScreen === 'category' ? "grid" : "grid-outline"}
            size={20}
            color={currentScreen === 'category' ? "#C2477A" : "#8C7078"}
          />
          <Text className={`text-[10px] mt-0.5 ${currentScreen === 'category' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>
            Categories
          </Text>
        </TouchableOpacity>

        {/* Cart Tab with Badge */}
        <TouchableOpacity className="items-center relative" onPress={() => setCurrentScreen('cart')}>
          <View className="relative">
            <Ionicons
              name={currentScreen === 'cart' ? "bag-handle" : "bag-handle-outline"}
              size={20}
              color={currentScreen === 'cart' ? "#C2477A" : "#8C7078"}
            />
            {cartItemCount > 0 && (
              <View className="absolute -top-1 -right-2 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center border border-white">
                <Text className="text-white text-[8px] font-bold">{cartItemCount}</Text>
              </View>
            )}
          </View>
          <Text className={`text-[10px] mt-0.5 ${currentScreen === 'cart' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>
            Cart
          </Text>
        </TouchableOpacity>

        {/* Orders Tab */}
        <TouchableOpacity className="items-center" onPress={() => setCurrentScreen('orders')}>
          <Ionicons
            name={currentScreen === 'orders' ? "cube" : "cube-outline"}
            size={20}
            color={currentScreen === 'orders' ? "#C2477A" : "#8C7078"}
          />
          <Text className={`text-[10px] mt-0.5 ${currentScreen === 'orders' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>
            Orders
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity className="items-center" onPress={() => setCurrentScreen('profile')}>
          <Ionicons
            name={currentScreen === 'profile' ? "person" : "person-outline"}
            size={20}
            color={currentScreen === 'profile' ? "#C2477A" : "#8C7078"}
          />
          <Text className={`text-[10px] mt-0.5 ${currentScreen === 'profile' ? 'text-[#C2477A] font-extrabold' : 'text-[#8C7078] font-semibold'}`}>
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
