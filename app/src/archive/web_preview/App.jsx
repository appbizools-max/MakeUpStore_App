import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { SplashScreen } from './screens/SplashScreen.jsx';
import { OnboardingScreen } from './screens/OnboardingScreen.jsx';
import { MobileLoginScreen } from './screens/MobileLoginScreen.jsx';
import { OtpScreen } from './screens/OtpScreen.jsx';
import { CompleteProfileScreen } from './screens/CompleteProfileScreen.jsx';
import { ProductDetailScreen } from './screens/ProductDetailScreen.jsx';
import { CartScreen } from './screens/CartScreen.jsx';
import { PlaceOrderScreen } from './screens/PlaceOrderScreen.jsx';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen.jsx';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen.jsx';
import { ProfileScreen } from './screens/ProfileScreen.jsx';
import { CategoryScreen } from './screens/CategoryScreen.jsx';
import { BrandScreen } from './screens/BrandScreen.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { WishlistScreen } from './screens/WishlistScreen.jsx';
import { B2BVerificationScreen } from './screens/B2BVerificationScreen.jsx';
import { VerificationStatusScreen } from './screens/VerificationStatusScreen.jsx';
import { Home, LayoutGrid, Search, Package, User, Bell, Truck, X } from 'lucide-react';

const AppShell = () => {
  const {
    currentScreen,
    setCurrentScreen,
    orders = [],
    userProfile,
    orderStatusNotification,
    dismissOrderStatusNotification,
    setSelectedOrderIdForDetails
  } = useApp();

  // Auto-dismiss notification after 7 seconds
  React.useEffect(() => {
    if (orderStatusNotification) {
      const timer = setTimeout(() => {
        if (dismissOrderStatusNotification) dismissOrderStatusNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [orderStatusNotification, dismissOrderStatusNotification]);

  const userOrdersCount = orders.filter(o =>
    !userProfile ? true : (o.phone === userProfile.phone || o.userName === userProfile.name)
  ).length;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'login': return <MobileLoginScreen />;
      case 'otp': return <OtpScreen />;
      case 'complete_profile': return <CompleteProfileScreen />;
      case 'b2b_verification': return <B2BVerificationScreen />;
      case 'verification_status': return <VerificationStatusScreen />;
      case 'product': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <PlaceOrderScreen />;
      case 'confirmation': return <OrderConfirmationScreen />;
      case 'orders': return <OrderHistoryScreen />;
      case 'notifications': return <NotificationCenterScreen />;
      case 'profile': return <ProfileScreen />;
      case 'category': return <CategoryScreen />;
      case 'brand': return <BrandScreen />;
      case 'search': return <SearchScreen />;
      case 'wishlist': return <WishlistScreen />;
      case 'home':
      default: return <HomeScreen />;
    }
  };

  const hideBottomNav = ['splash', 'onboarding', 'login', 'otp', 'complete_profile', 'b2b_verification', 'verification_status', 'checkout', 'confirmation'].includes(currentScreen);

  // Active navigation tab determination
  const getActiveTab = () => {
    if (currentScreen === 'home') return 'home';
    if (['category', 'brand'].includes(currentScreen)) return 'category';
    if (currentScreen === 'search') return 'search';
    if (['orders'].includes(currentScreen)) return 'orders';
    if (['profile'].includes(currentScreen)) return 'profile';
    return 'home';
  };
  const activeTab = getActiveTab();

  return (
    <div className="relative min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col justify-between border-x border-[#FCE4EC]">
      {/* Realtime Order Status Floating Toast Notification */}
      {orderStatusNotification && (
        <div className="fixed top-3 left-3 right-3 max-w-sm mx-auto z-50 animate-bounce-in">
          <div className="bg-[#3A2430] text-white p-3.5 rounded-2xl shadow-2xl border border-pink-400/40 flex items-start gap-3 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-[#C2477A] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Truck size={18} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black uppercase text-pink-300 tracking-wider">
                  Live Order Update
                </span>
                <button
                  onClick={dismissOrderStatusNotification}
                  className="text-gray-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <h4 className="text-xs font-black text-white truncate mt-0.5">
                {orderStatusNotification.title}
              </h4>
              <p className="text-[11px] text-gray-200 mt-0.5 font-medium leading-snug">
                {orderStatusNotification.message}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (orderStatusNotification?.orderId && setSelectedOrderIdForDetails) {
                      setSelectedOrderIdForDetails(orderStatusNotification.orderId);
                    }
                    setCurrentScreen('orders');
                    if (dismissOrderStatusNotification) dismissOrderStatusNotification();
                  }}
                  className="bg-[#C2477A] hover:bg-[#a83765] text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Track Progress</span>
                  <span>→</span>
                </button>
                <button
                  onClick={dismissOrderStatusNotification}
                  className="text-[10px] font-bold text-gray-300 hover:text-white px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>

      {/* 5-Button Bottom Navigation: Home, Categories, Search, My Orders, Profile */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/97 backdrop-blur-md border-t border-[#FCE4EC] z-30 shadow-lg">
          <div className="flex items-center justify-around px-1 py-1.5">

            {/* 1. Home */}
            <button
              onClick={() => setCurrentScreen('home')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'home' ? 'text-[#C2477A]' : 'text-[#8C7078] hover:text-[#3A2430]'
              }`}
            >
              <Home size={20} className={activeTab === 'home' ? 'scale-110 stroke-[2.5]' : ''} />
              <span className={`text-[10px] ${activeTab === 'home' ? 'font-black text-[#C2477A]' : 'font-medium'}`}>
                Home
              </span>
            </button>

            {/* 2. Categories */}
            <button
              onClick={() => setCurrentScreen('category')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'category' ? 'text-[#C2477A]' : 'text-[#8C7078] hover:text-[#3A2430]'
              }`}
            >
              <LayoutGrid size={20} className={activeTab === 'category' ? 'scale-110 stroke-[2.5]' : ''} />
              <span className={`text-[10px] ${activeTab === 'category' ? 'font-black text-[#C2477A]' : 'font-medium'}`}>
                Categories
              </span>
            </button>

            {/* 3. Search */}
            <button
              onClick={() => setCurrentScreen('search')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'search' ? 'text-[#C2477A]' : 'text-[#8C7078] hover:text-[#3A2430]'
              }`}
            >
              <Search size={20} className={activeTab === 'search' ? 'scale-110 stroke-[2.5]' : ''} />
              <span className={`text-[10px] ${activeTab === 'search' ? 'font-black text-[#C2477A]' : 'font-medium'}`}>
                Search
              </span>
            </button>

            {/* 4. My Orders */}
            <button
              onClick={() => setCurrentScreen('orders')}
              className={`flex-1 relative flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'orders' ? 'text-[#C2477A]' : 'text-[#8C7078] hover:text-[#3A2430]'
              }`}
            >
              <div className="relative">
                <Package size={20} className={activeTab === 'orders' ? 'scale-110 stroke-[2.5]' : ''} />
                {userOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#C2477A] text-white text-[8px] font-black min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center border border-white">
                    {userOrdersCount > 9 ? '9+' : userOrdersCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${activeTab === 'orders' ? 'font-black text-[#C2477A]' : 'font-medium'}`}>
                My Orders
              </span>
            </button>

            {/* 5. Profile */}
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile' ? 'text-[#C2477A]' : 'text-[#8C7078] hover:text-[#3A2430]'
              }`}
            >
              <User size={20} className={activeTab === 'profile' ? 'scale-110 stroke-[2.5]' : ''} />
              <span className={`text-[10px] ${activeTab === 'profile' ? 'font-black text-[#C2477A]' : 'font-medium'}`}>
                Profile
              </span>
            </button>

          </div>
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
