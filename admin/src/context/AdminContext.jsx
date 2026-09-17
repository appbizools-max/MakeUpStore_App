import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AdminContext = createContext();

const initialCancelFeeSettings = {
  feeAmount: 250,
  graceWindowMinutes: 15,
  maxAllowedCancels: 3,
};

// Helper transformers between DB (snake_case) and App Model (camelCase)
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

const mapUserFromDb = (u) => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  role: u.role,
  businessName: u.business_name || u.businessName,
  branch: u.branch,
  verificationStatus: u.verification_status || u.verificationStatus || 'pending',
  cancellationCount: u.cancellation_count || u.cancellationCount || 0,
  lastActive: u.last_active || u.lastActive
});

const mapBrandFromDb = (b) => ({
  id: b.id,
  name: b.name,
  enabled: b.enabled !== false,
  logo: b.logo
});

const mapProductFromDb = (p) => ({
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
});

export const AdminProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [cancelFeeSettings, setCancelFeeSettings] = useState(initialCancelFeeSettings);
  const [cancelledOrdersLog, setCancelledOrdersLog] = useState([]);

  // Fetch initial data and subscribe to real-time updates via Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, usersRes, brandsRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*').order('date', { ascending: false }),
          supabase.from('users').select('*'),
          supabase.from('brands').select('*'),
          supabase.from('products').select('*')
        ]);

        if (ordersRes.data) setOrders(ordersRes.data.map(mapOrderFromDb));
        if (usersRes.data) setUsers(usersRes.data.map(mapUserFromDb));
        if (brandsRes.data) setBrands(brandsRes.data.map(mapBrandFromDb));
        if (productsRes.data) setProducts(productsRes.data.map(mapProductFromDb));
      } catch (err) {
        console.warn('Supabase initial fetch error:', err);
      }
    };

    fetchData();

    // Subscribe to Supabase Realtime Channels
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrderFromDb(payload.new);
          setOrders(prev => {
            const index = prev.findIndex(o => o.id === updatedOrder.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedOrder;
              return copy;
            }
            return [updatedOrder, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDb(payload.new);
          setUsers(prev => {
            const index = prev.findIndex(u => u.id === updatedUser.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedUser;
              return copy;
            }
            return [...prev, updatedUser];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedBrand = mapBrandFromDb(payload.new);
          setBrands(prev => {
            const index = prev.findIndex(b => b.id === updatedBrand.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedBrand;
              return copy;
            }
            return [...prev, updatedBrand];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedProduct = mapProductFromDb(payload.new);
          setProducts(prev => {
            const index = prev.findIndex(p => p.id === updatedProduct.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedProduct;
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
  }, []);

  const toggleBrandStatus = async (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    const newStatus = !brand.enabled;
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, enabled: newStatus } : b)));
    try {
      await supabase.from('brands').upsert({
        id: brandId,
        name: brand.name,
        enabled: newStatus,
        logo: brand.logo
      });
    } catch (e) {
      console.warn('Error toggling brand in Supabase:', e);
    }
  };

  const addBrand = async (newBrand) => {
    const brandId = 'b_' + Date.now();
    const brandObj = { ...newBrand, id: brandId, enabled: true };
    setBrands(prev => [...prev, brandObj]);
    try {
      await supabase.from('brands').insert({
        id: brandId,
        name: brandObj.name,
        enabled: true,
        logo: brandObj.logo || ''
      });
    } catch (e) {
      console.warn('Error adding brand to Supabase:', e);
    }
  };

  const addProduct = async (newProduct) => {
    const productId = 'p_' + Date.now();
    const productObj = { ...newProduct, id: productId };
    setProducts(prev => [...prev, productObj]);
    try {
      await supabase.from('products').insert({
        id: productId,
        name: productObj.name,
        brand_id: productObj.brandId,
        brand_name: productObj.brandName,
        category: productObj.category,
        mrp: productObj.mrp,
        salon_price: productObj.salonPrice,
        artist_price: productObj.artistPrice,
        beautician_price: productObj.beauticianPrice,
        stock: productObj.stock,
        image: productObj.image
      });
    } catch (e) {
      console.warn('Error adding product to Supabase:', e);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, rejectionReason = '') => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedItems = (targetOrder.items || []).map(item => ({
      ...item,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : (item.rejectionReason || '')
    }));

    const updatedFields = {
      status: newStatus,
      items: updatedItems,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : (targetOrder?.rejectionReason || '')
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      await supabase.from('orders').update({
        status: newStatus,
        items: updatedItems,
        rejection_reason: updatedFields.rejectionReason
      }).eq('id', orderId);
    } catch (e) {
      console.warn('Error updating order status in Supabase:', e);
    }
  };

  const updateOrderItemStatus = async (orderId, itemIndex, newStatus, rejectionReason = '') => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.items[itemIndex]) return;

    const updatedItems = [...targetOrder.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : (updatedItems[itemIndex].rejectionReason || '')
    };

    const newOverallStatus = computeOverallOrderStatus(updatedItems, targetOrder.status);

    const updatedFields = {
      items: updatedItems,
      status: newOverallStatus,
      rejectionReason: newOverallStatus === 'rejected' ? rejectionReason : targetOrder.rejectionReason
    };

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o)));

    try {
      await supabase.from('orders').update({
        items: updatedItems,
        status: newOverallStatus,
        rejection_reason: updatedFields.rejectionReason
      }).eq('id', orderId);
    } catch (e) {
      console.warn('Error updating item status in Supabase:', e);
    }
  };

  const decrementProductStock = async (productId, qty = 1) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock - qty);
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stock: newStock } : p)));
    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    } catch (e) {
      console.warn('Error updating product stock in Supabase:', e);
    }
  };

  const updateProductRolePrices = async (productId, newPrices) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...newPrices } : p)));
    try {
      await supabase.from('products').update({
        mrp: newPrices.mrp,
        salon_price: newPrices.salonPrice,
        artist_price: newPrices.artistPrice,
        beautician_price: newPrices.beauticianPrice
      }).eq('id', productId);
    } catch (e) {
      console.warn('Error updating product role prices in Supabase:', e);
    }
  };

  const toggleUserVerification = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.verificationStatus === 'verified' ? 'pending' : 'verified';
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, verificationStatus: newStatus } : u)));
    try {
      await supabase.from('users').update({ verification_status: newStatus }).eq('id', userId);
    } catch (e) {
      console.warn('Error toggling user verification in Supabase:', e);
    }
  };

  const updateCancelFeeSettings = (newSettings) => {
    setCancelFeeSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleFeeWaived = (orderId) => {
    setCancelledOrdersLog(prev =>
      prev.map(item => (item.id === orderId ? { ...item, feeWaived: !item.feeWaived } : item))
    );
  };

  return (
    <AdminContext.Provider
      value={{
        brands,
        products,
        orders,
        users,
        cancelFeeSettings,
        cancelledOrdersLog,
        toggleBrandStatus,
        addBrand,
        addProduct,
        updateOrderStatus,
        updateOrderItemStatus,
        decrementProductStock,
        updateProductRolePrices,
        toggleUserVerification,
        updateCancelFeeSettings,
        toggleFeeWaived,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);

