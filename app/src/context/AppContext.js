import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AppContext = createContext();

const INITIAL_CATEGORIES = [
  { id: 'cat1', name: 'Hair Care', icon: '💇‍♀️', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300', color: '#FCE4EC' },
  { id: 'cat2', name: 'Skin Care', icon: '✨', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300', color: '#F8E8EE' },
  { id: 'cat3', name: 'Lipstick & Gloss', icon: '💄', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300', color: '#FDEAF1' },
  { id: 'cat4', name: 'Eye Makeup', icon: '👁️', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300', color: '#FFF0F5' },
  { id: 'cat5', name: 'Nail Polish', icon: '💅', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300', color: '#FCE4EC' },
];

export const computeOverallOrderStatus = (items, currentOrderStatus = 'placed') => {
  if (!items || items.length === 0) return currentOrderStatus;

  const statuses = items.map(i => (i.status || '').toLowerCase() || 'placed');

  const allPlaced = statuses.every(s => s === 'placed');
  if (allPlaced) return 'placed';

  const allDelivered = statuses.every(s => s === 'delivered');
  if (allDelivered) return 'delivered';

  const allRejected = statuses.every(s => s === 'rejected');
  if (allRejected) return 'rejected';

  const allCancelled = statuses.every(s => s === 'cancelled');
  if (allCancelled) return 'cancelled';

  const deliveredCount = statuses.filter(s => s === 'delivered').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const cancelledCount = statuses.filter(s => s === 'cancelled').length;
  const processingCount = statuses.filter(s => s === 'processing' || s === 'placed').length;

  if (deliveredCount > 0) {
    if (processingCount > 0) return 'partially_delivered';
    if (rejectedCount > 0 && cancelledCount === 0) return 'partially_delivered_rejected';
    if (cancelledCount > 0 && rejectedCount === 0) return 'partially_delivered_cancelled';
    return 'partially_delivered';
  }

  if (processingCount > 0) {
    return 'processing';
  }

  if (processingCount === 0) {
    if (rejectedCount >= cancelledCount) return 'rejected';
    return 'cancelled';
  }

  return currentOrderStatus;
};

const mapOrderFromDb = (o) => {
  const rawItems = o.items || [];
  const dbStatus = (o.status || 'placed').toLowerCase();

  const itemsWithStatus = rawItems.map(item => {
    let itemSt = item.status ? item.status.toLowerCase() : '';
    if (!itemSt) {
      itemSt = dbStatus.includes('partially') ? 'processing' : dbStatus;
    }
    return {
      ...item,
      status: itemSt,
      rejectionReason: item.rejectionReason || ''
    };
  });

  const computedStatus = computeOverallOrderStatus(itemsWithStatus, o.status || 'placed');

  return {
    id: o.id,
    userName: o.user_name || o.userName,
    phone: o.phone,
    avatar: o.avatar,
    itemDescription: o.item_description || o.itemDescription,
    userRole: o.user_role || o.userRole,
    branch: o.branch,
    deliveryType: o.delivery_type || o.deliveryType,
    deliveryAddress: o.delivery_address || o.deliveryAddress,
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    status: computedStatus,
    rejectionReason: o.rejection_reason || o.rejectionReason || '',
    placedAt: o.placed_at || o.placedAt,
    date: o.date,
    items: itemsWithStatus
  };
};

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

  const [addresses, setAddresses] = useState([
    {
      id: 'addr_1',
      label: 'Home',
      name: 'Bizools',
      phone: '+91 98765 43210',
      text: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
      isDefault: true,
    },
    {
      id: 'addr_2',
      label: 'Office / Salon',
      name: 'Bizools Beauty Salon',
      phone: '+91 98765 43210',
      text: 'Shop #12, Ground Floor, Indiranagar 100ft Road, Bengaluru - 560038',
      isDefault: false,
    },
  ]);

  const addAddress = (newAddr) => {
    const created = {
      id: 'addr_' + Date.now(),
      label: newAddr.label || 'Home',
      name: newAddr.name || userProfile.name || 'Bizools',
      phone: newAddr.phone || userProfile.phone || '+91 98765 43210',
      text: newAddr.text,
      isDefault: addresses.length === 0,
    };
    setAddresses(prev => [...prev, created]);
    setUserProfile(prev => ({ ...prev, address: newAddr.text }));
    return created;
  };

  const [brands, setBrands] = useState([]);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [consecutiveCancels, setConsecutiveCancels] = useState(0);
  const [showCancelWarningModal, setShowCancelWarningModal] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState(null);

  // Subscribe to Supabase live orders and user profiles updates
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const { data: ordersData } = await supabase.from('orders').select('*').order('date', { ascending: false });
        if (ordersData) setOrders(ordersData.map(mapOrderFromDb));

        const { data: brandsData } = await supabase.from('brands').select('*');
        if (brandsData) {
          setBrands(brandsData.map(b => ({
            id: b.id,
            name: b.name,
            enabled: b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0 && b.status !== 'hidden' && b.status !== 'disabled',
            logo: b.logo
          })));
        }

        const { data: productsData } = await supabase.from('products').select('*');
        if (productsData) setProducts(productsData.map(p => ({
          id: p.id,
          name: p.name,
          brandId: p.brand_id || p.brandId,
          brandName: p.brand_name || p.brandName,
          category: p.category,
          mrp: Number(p.mrp || 0),
          salonPrice: Number(p.salon_price || p.salonPrice || p.mrp || 0),
          artistPrice: Number(p.artist_price || p.artistPrice || p.mrp || 0),
          beauticianPrice: Number(p.beautician_price || p.beauticianPrice || p.mrp || 0),
          stock: Number(p.stock || 0),
          image: p.image
        })));
      } catch (err) {
        console.warn('Supabase RN mobile fetch error:', err);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel('app-rn-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrderFromDb(payload.new);
          setOrders(prev => {
            const idx = prev.findIndex(o => o.id === updatedOrder.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedOrder;
              return copy;
            }
            return [updatedOrder, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.new && (payload.new.phone === userProfile.phone || payload.new.id === userProfile.id)) {
          setUserProfile(prev => ({
            ...prev,
            verificationStatus: payload.new.verification_status || prev.verificationStatus
          }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const b = payload.new;
          const updatedBrand = {
            id: b.id,
            name: b.name,
            enabled: b.enabled !== false && b.enabled !== 'false' && b.enabled !== 0 && b.status !== 'hidden' && b.status !== 'disabled',
            logo: b.logo
          };
          setBrands(prev => {
            const idx = prev.findIndex(item => item.id === updatedBrand.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedBrand;
              return copy;
            }
            return [...prev, updatedBrand];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const p = payload.new;
          const updatedProduct = {
            id: p.id,
            name: p.name,
            brandId: p.brand_id || p.brandId,
            brandName: p.brand_name || p.brandName,
            category: p.category,
            mrp: Number(p.mrp || 0),
            salonPrice: Number(p.salon_price || p.salonPrice || p.mrp || 0),
            artistPrice: Number(p.artist_price || p.artistPrice || p.mrp || 0),
            beauticianPrice: Number(p.beautician_price || p.beauticianPrice || p.mrp || 0),
            stock: Number(p.stock || 0),
            image: p.image
          };
          setProducts(prev => {
            const idx = prev.findIndex(item => item.id === updatedProduct.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedProduct;
              return copy;
            }
            return [...prev, updatedProduct];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile.phone, userProfile.id]);

  // Sync user profile to Supabase `users` table on load/update
  useEffect(() => {
    const syncUserProfile = async () => {
      try {
        const userId = userProfile.id || 'u_' + (userProfile.phone ? userProfile.phone.replace(/\D/g, '') : '9876543210');
        await supabase.from('users').upsert({
          id: userId,
          name: userProfile.name || 'Bizools',
          phone: userProfile.phone || '+91 98765 43210',
          role: userProfile.role || userRole || 'general',
          business_name: userProfile.businessName || 'Bizools Beauty Salon',
          branch: selectedBranch || 'MG Road Branch',
          verification_status: 'verified',
          cancellation_count: consecutiveCancels || 0,
          last_active: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error syncing user profile to Supabase:', e);
      }
    };
    syncUserProfile();
  }, [userProfile, userRole, selectedBranch, consecutiveCancels]);

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
    const brand = brands.find(b =>
      (b.id && p.brandId && b.id === p.brandId) ||
      (b.name && p.brandName && b.name.trim().toLowerCase() === p.brandName.trim().toLowerCase())
    );
    return brand ? Boolean(brand.enabled) : true;
  });

  const activeBrands = brands.filter(b => Boolean(b.enabled));

  const addToCart = (product, quantity = 1) => {
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

  const placeOrder = async ({ deliveryType, address, branch }) => {
    const newOrderId = `SB-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const orderItems = cart.map(item => ({
      product: item.product,
      quantity: item.quantity,
      unitPrice: getRolePrice(item.product, userRole)
    }));

    const formattedOrder = {
      id: newOrderId,
      userName: userProfile.name || 'Bizools',
      phone: userProfile.phone || '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      itemDescription: orderItems.map(i => `${i.product?.name || 'Item'} (x${i.quantity})`).join(', ') || 'Cosmetics Package',
      userRole: userRole === 'salon' ? 'Salon Owner' : userRole === 'artist' ? 'Makeup Artist' : userRole === 'beautician' ? 'Beautician' : 'General Retail',
      branch: branch || selectedBranch || 'MG Road Branch',
      deliveryType: deliveryType || 'delivery',
      deliveryAddress: address || userProfile.address || 'MG Road, Bengaluru',
      totalAmount: cartSubtotal,
      status: 'placed',
      rejectionReason: '',
      placedAt: now.toLocaleString(),
      date: now.toISOString(),
      items: orderItems
    };

    setOrders(prev => [formattedOrder, ...prev]);

    try {
      await supabase.from('orders').insert({
        id: newOrderId,
        user_name: formattedOrder.userName,
        phone: formattedOrder.phone,
        avatar: formattedOrder.avatar,
        item_description: formattedOrder.itemDescription,
        user_role: formattedOrder.userRole,
        branch: formattedOrder.branch,
        delivery_type: formattedOrder.deliveryType,
        delivery_address: formattedOrder.deliveryAddress,
        total_amount: formattedOrder.totalAmount,
        status: 'placed',
        placed_at: formattedOrder.placedAt,
        date: formattedOrder.date,
        items: formattedOrder.items
      });
    } catch (e) {
      console.error('Error writing order to Supabase:', e);
    }

    clearCart();
    return formattedOrder;
  };

  const cancelSpecificOrderItem = async (orderId, itemIndex) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.items || !targetOrder.items[itemIndex]) return { success: false, reason: 'Order or item not found' };

    const targetItem = targetOrder.items[itemIndex];
    if (targetItem.status === 'delivered' || targetItem.status === 'rejected') {
      return { success: false, reason: 'Delivered or rejected items cannot be cancelled' };
    }

    const orderTime = new Date(targetOrder.date || targetOrder.placedAt).getTime();
    const elapsedMs = Date.now() - orderTime;
    const isWithinGraceWindow = !isNaN(orderTime) && elapsedMs <= 15 * 60 * 1000;

    if (!isWithinGraceWindow) {
      return { success: false, reason: '15-minute cancellation grace window has expired' };
    }

    const updatedItems = [...targetOrder.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      status: 'cancelled'
    };

    const newOverallStatus = computeOverallOrderStatus(updatedItems, targetOrder.status);

    setConsecutiveCancels(prev => prev + 1);

    const updatedFields = {
      items: updatedItems,
      status: newOverallStatus
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      await supabase.from('orders').update({
        items: updatedItems,
        status: newOverallStatus
      }).eq('id', orderId);
    } catch (e) {
      console.warn('Error cancelling item in Supabase:', e);
    }

    return { success: true };
  };

  const requestCancelOrder = (orderId) => {
    if (consecutiveCancels + 1 >= 3) {
      setPendingCancelOrderId(orderId);
      setShowCancelWarningModal(true);
    } else {
      executeCancelOrder(orderId);
    }
  };

  const executeCancelOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const updatedItems = (targetOrder?.items || []).map(i => ({ ...i, status: 'cancelled' }));

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled', items: updatedItems } : o)));
    setConsecutiveCancels(prev => prev + 1);
    setShowCancelWarningModal(false);
    setPendingCancelOrderId(null);

    try {
      await supabase.from('orders').update({ status: 'cancelled', items: updatedItems }).eq('id', orderId);
    } catch (e) {
      console.warn('Error cancelling order in Supabase:', e);
    }
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
        addresses,
        setAddresses,
        addAddress,
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
        cancelSpecificOrderItem,
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
