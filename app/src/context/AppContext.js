import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

const INITIAL_BRANDS = [
  { id: 'b1', name: 'Lakmé', logo: '✨', enabled: true, category: 'Makeup' },
  { id: 'b2', name: "L'Oréal Professional", logo: '💆‍♀️', enabled: true, category: 'Hair' },
  { id: 'b3', name: 'Maybelline New York', logo: '💄', enabled: true, category: 'Lips & Eyes' },
  { id: 'b4', name: 'M.A.C Cosmetics', logo: '🌟', enabled: true, category: 'Premium' },
  { id: 'b5', name: 'SUGAR Cosmetics', logo: '💋', enabled: true, category: 'Lips' },
  { id: 'b6', name: 'Biotique Advanced', logo: '🌿', enabled: true, category: 'Skin' },
  { id: 'b7', name: 'Colorbar', logo: '💅', enabled: false, category: 'Nails' },
];

const INITIAL_CATEGORIES = [
  { id: 'cat1', name: 'Hair Care', icon: '💇‍♀️', color: '#FCE4EC' },
  { id: 'cat2', name: 'Skin Care', icon: '✨', color: '#F8E8EE' },
  { id: 'cat3', name: 'Lipstick', icon: '💄', color: '#FDEAF1' },
  { id: 'cat4', name: 'Eye Makeup', icon: '👁️', color: '#FFF0F5' },
  { id: 'cat5', name: 'Nail Polish', icon: '💅', color: '#FCE4EC' },
];

const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Lakmé Absolute Matte Revolution Lipstick',
    brandId: 'b1',
    brandName: 'Lakmé',
    category: 'Lipstick',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
    mrp: 800,
    salonPrice: 560,
    artistPrice: 520,
    beauticianPrice: 540,
    stock: 45,
    rating: 4.8,
    reviewsCount: 124,
    description: 'Long-lasting matte lipstick enriched with nourishing natural oils for smooth, vibrant lips all day.',
  },
  {
    id: 'p2',
    name: "L'Oréal Mythic Oil Nourishing Serum 100ml",
    brandId: 'b2',
    brandName: "L'Oréal Professional",
    category: 'Hair Care',
    image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=600&auto=format&fit=crop&q=80',
    mrp: 1450,
    salonPrice: 1015,
    artistPrice: 950,
    beauticianPrice: 980,
    stock: 28,
    rating: 4.9,
    reviewsCount: 210,
    description: 'Infused with avocado oil and grape seed oil, deeply nourishes hair giving instant shine and anti-frizz protection.',
  },
  {
    id: 'p3',
    name: 'Maybelline Fit Me Matte + Poreless Foundation',
    brandId: 'b3',
    brandName: 'Maybelline New York',
    category: 'Skin Care',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    mrp: 699,
    salonPrice: 489,
    artistPrice: 450,
    beauticianPrice: 470,
    stock: 60,
    rating: 4.6,
    reviewsCount: 380,
    description: 'Lightweight liquid foundation controls shine, refines pores, and matches natural skin tone seamlessly.',
  },
  {
    id: 'p4',
    name: 'M.A.C Studio Fix Powder Plus Foundation',
    brandId: 'b4',
    brandName: 'M.A.C Cosmetics',
    category: 'Skin Care',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    mrp: 3300,
    salonPrice: 2475,
    artistPrice: 2300,
    beauticianPrice: 2380,
    stock: 15,
    rating: 4.9,
    reviewsCount: 520,
    description: 'One-step powder and foundation that gives skin a smooth, flawless, all-matte finish with medium-to-full coverage.',
  }
];

export const AppProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [userRole, setUserRole] = useState('general');
  const [selectedBranch, setSelectedBranch] = useState('MG Road Branch');
  const [userProfile, setUserProfile] = useState({
    name: 'Bizools',
    phone: '+91 98765 43210',
    email: 'bizools@salbeau.com',
    role: 'general',
    businessName: 'Bizools Beauty Salon',
    gstNo: '29ABCDE1234F1Z5',
    certificationId: 'MUA-IND-2024-889',
    address: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
  });

  const [brands] = useState(INITIAL_BRANDS);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [products] = useState(INITIAL_PRODUCTS);

  const [selectedProduct, setSelectedProduct] = useState(INITIAL_PRODUCTS[0]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [cart, setCart] = useState([
    { product: INITIAL_PRODUCTS[0], quantity: 2 },
    { product: INITIAL_PRODUCTS[1], quantity: 1 }
  ]);

  const [orders, setOrders] = useState([
    {
      id: 'SB-892401',
      date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      items: [{ product: INITIAL_PRODUCTS[0], quantity: 2, unitPrice: 800 }],
      totalAmount: 1600,
      userRole: 'general',
      branch: 'MG Road Branch',
      deliveryType: 'delivery',
      address: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
      status: 'placed',
      editableUntil: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    }
  ]);

  const [consecutiveCancels, setConsecutiveCancels] = useState(0);
  const [showCancelWarningModal, setShowCancelWarningModal] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState(null);

  const getRolePrice = (product, role = userRole) => {
    if (!product) return 0;
    switch (role) {
      case 'salon': return product.salonPrice || product.mrp;
      case 'artist': return product.artistPrice || product.mrp;
      case 'beautician': return product.beauticianPrice || product.mrp;
      case 'general':
      default: return product.mrp;
    }
  };

  const activeProducts = products.filter(p => {
    const brand = brands.find(b => b.id === p.brandId);
    return brand ? brand.enabled : true;
  });

  const activeBrands = brands.filter(b => b.enabled);

  const addToCart = (product, quantity = 1) => {
    const brand = brands.find(b => b.id === product.brandId);
    if (brand && !brand.enabled) {
      alert("This item is no longer available as the brand is disabled.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + getRolePrice(item.product, userRole) * item.quantity, 0);

  const placeOrder = ({ deliveryType, address, branch, notes }) => {
    const newOrderId = `SB-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const editableUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const orderItems = cart.map(item => ({
      product: item.product,
      quantity: item.quantity,
      unitPrice: getRolePrice(item.product, userRole)
    }));

    const newOrder = {
      id: newOrderId,
      date: now.toISOString(),
      items: orderItems,
      totalAmount: cartSubtotal,
      userRole,
      userName: userProfile.name,
      userPhone: userProfile.phone,
      branch: branch || selectedBranch,
      deliveryType: deliveryType || 'delivery',
      address: address || userProfile.address,
      notes: notes || '',
      status: 'placed',
      editableUntil,
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const requestCancelOrder = (orderId) => {
    if (consecutiveCancels + 1 >= 3) {
      setPendingCancelOrderId(orderId);
      setShowCancelWarningModal(true);
    } else {
      executeCancelOrder(orderId);
    }
  };

  const executeCancelOrder = (orderId) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
    setConsecutiveCancels(prev => prev + 1);
    setShowCancelWarningModal(false);
    setPendingCancelOrderId(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        brands,
        activeBrands,
        categories,
        products,
        activeProducts,
        selectedBranch,
        setSelectedBranch,
        selectedProduct,
        setSelectedProduct,
        selectedCategory,
        setSelectedCategory,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        orders,
        placeOrder,
        requestCancelOrder,
        executeCancelOrder,
        consecutiveCancels,
        showCancelWarningModal,
        setShowCancelWarningModal,
        pendingCancelOrderId,
        getRolePrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
