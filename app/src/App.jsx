import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { SplashScreen } from './screens/SplashScreen.jsx';
import { OnboardingScreen } from './screens/OnboardingScreen.jsx';
import { MobileLoginScreen } from './screens/MobileLoginScreen.jsx';
import { OtpScreen } from './screens/OtpScreen.jsx';
import { ProductDetailScreen } from './screens/ProductDetailScreen.jsx';
import { CartScreen } from './screens/CartScreen.jsx';
import { PlaceOrderScreen } from './screens/PlaceOrderScreen.jsx';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen.jsx';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen.jsx';
import { ProfileScreen } from './screens/ProfileScreen.jsx';
import { CategoryScreen } from './screens/CategoryScreen.jsx';
import { BrandScreen } from './screens/BrandScreen.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { Home, Search, ShoppingBag, Package, User } from 'lucide-react';

const AppShell = () => {
  const { currentScreen, setCurrentScreen, cart } = useApp();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'login': return <MobileLoginScreen />;
      case 'otp': return <OtpScreen />;
      case 'product': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <PlaceOrderScreen />;
      case 'confirmation': return <OrderConfirmationScreen />;
      case 'orders': return <OrderHistoryScreen />;
      case 'profile': return <ProfileScreen />;
      case 'category': return <CategoryScreen />;
      case 'brand': return <BrandScreen />;
      case 'search': return <SearchScreen />;
      case 'home':
      default: return <HomeScreen />;
    }
  };

  const hideBottomNav = currentScreen === 'splash' || currentScreen === 'onboarding' || currentScreen === 'login' || currentScreen === 'otp' || currentScreen === 'checkout' || currentScreen === 'confirmation';

  return (
    <div className="relative min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col justify-between border-x border-[#FCE4EC]">
      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#FCE4EC] py-2 px-3 flex items-center justify-around z-30 shadow-lg">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentScreen === 'home' ? 'text-[#C2477A] font-bold' : 'text-[#8C7078] hover:text-[#3A2430]'
            }`}
          >
            <Home size={18} />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setCurrentScreen('search')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentScreen === 'search' ? 'text-[#C2477A] font-bold' : 'text-[#8C7078] hover:text-[#3A2430]'
            }`}
          >
            <Search size={18} />
            <span className="text-[10px]">Search</span>
          </button>

          <button
            onClick={() => setCurrentScreen('cart')}
            className={`relative flex flex-col items-center gap-1 transition-colors ${
              currentScreen === 'cart' ? 'text-[#C2477A] font-bold' : 'text-[#8C7078] hover:text-[#3A2430]'
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[10px]">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-1 bg-[#C2477A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentScreen('orders')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentScreen === 'orders' ? 'text-[#C2477A] font-bold' : 'text-[#8C7078] hover:text-[#3A2430]'
            }`}
          >
            <Package size={18} />
            <span className="text-[10px]">Orders</span>
          </button>

          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentScreen === 'profile' ? 'text-[#C2477A] font-bold' : 'text-[#8C7078] hover:text-[#3A2430]'
            }`}
          >
            <User size={18} />
            <span className="text-[10px]">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
