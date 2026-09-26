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

const INITIAL_CATEGORIES = [
  { id: 'cat1', name: 'Hair Care', icon: '💇‍♀️', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300', color: '#FCE4EC', sort_order: 1, enabled: true },
  { id: 'cat2', name: 'Skin Care', icon: '✨', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300', color: '#F8E8EE', sort_order: 2, enabled: true },
  { id: 'cat3', name: 'Lipstick & Gloss', icon: '💄', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300', color: '#FDEAF1', sort_order: 3, enabled: true },
  { id: 'cat4', name: 'Eye Makeup', icon: '👁️', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300', color: '#FFF0F5', sort_order: 4, enabled: true },
  { id: 'cat5', name: 'Nail Polish', icon: '💅', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300', color: '#FCE4EC', sort_order: 5, enabled: true },
];

const mapCategoryFromDb = (c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon || '',
  image: c.image || '',
  color: c.color || '#FCE4EC',
  sort_order: Number(c.sort_order || c.sortOrder || 0),
  enabled: c.enabled !== false && c.enabled !== 'false' && c.enabled !== 0
});

const DEFAULT_HOME_SECTIONS = {
  branchBar: true,
  pricingRoleBanner: true,
  heroPromoBanner: true,
  shopCategories: true,
  featuredBrands: true,
  bestSellers: true,
};

export const AdminProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [cancelFeeSettings, setCancelFeeSettings] = useState(initialCancelFeeSettings);
  const [cancelledOrdersLog, setCancelledOrdersLog] = useState([]);
  const [homeSectionVisibility, setHomeSectionVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_home_section_visibility');
      if (saved) return { ...DEFAULT_HOME_SECTIONS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_HOME_SECTIONS;
  });

  // Fetch initial data and subscribe to real-time updates via Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, usersRes, brandsRes, productsRes, categoriesRes] = await Promise.all([
          supabase.from('orders').select('*').order('date', { ascending: false }),
          supabase.from('users').select('*'),
          supabase.from('brands').select('*'),
          supabase.from('products').select('*'),
          supabase.from('categories').select('*').order('sort_order', { ascending: true })
        ]);

        if (ordersRes.data) setOrders(ordersRes.data.map(mapOrderFromDb));
        if (usersRes.data) setUsers(usersRes.data.map(mapUserFromDb));
        if (brandsRes.data) {
          const configRow = brandsRes.data.find(b => b.id === 'app_category_order_config');
          if (configRow && configRow.logo) {
            try {
              const parsedCatList = JSON.parse(configRow.logo);
              if (Array.isArray(parsedCatList) && parsedCatList.length > 0) {
                setCategories(parsedCatList);
              }
            } catch (e) {
              console.warn('Error parsing category config from brands:', e);
            }
          }

          const mapRow = brandsRes.data.find(b => b.id === 'app_brand_category_map');
          let categoryDict = {};
          if (mapRow && mapRow.logo) {
            try {
              categoryDict = JSON.parse(mapRow.logo);
            } catch (e) {}
          }

          const visibilityRow = brandsRes.data.find(b => b.id === 'app_home_section_visibility');
          if (visibilityRow && visibilityRow.logo) {
            try {
              const parsedVisibility = JSON.parse(visibilityRow.logo);
              if (parsedVisibility && typeof parsedVisibility === 'object') {
                setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
                try {
                  localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(parsedVisibility));
                } catch (e) {}
              }
            } catch (e) {
              console.warn('Error parsing home section visibility from brands:', e);
            }
          }

          setBrands(brandsRes.data
            .filter(b => b.id !== 'app_category_order_config' && b.id !== 'app_brand_category_map' && b.id !== 'app_home_section_visibility')
            .map(b => ({
              ...mapBrandFromDb(b),
              category: categoryDict[b.name] || b.category || 'General'
            }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }))
          );
        }
        if (productsRes.data) setProducts(productsRes.data.map(mapProductFromDb));
        if (categoriesRes && categoriesRes.data && categoriesRes.data.length > 0) {
          setCategories(categoriesRes.data.map(mapCategoryFromDb).sort((a, b) => a.sort_order - b.sort_order));
        }
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
          if (payload.new && payload.new.id === 'app_category_order_config' && payload.new.logo) {
            try {
              const parsedCatList = JSON.parse(payload.new.logo);
              if (Array.isArray(parsedCatList)) {
                setCategories(parsedCatList);
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_home_section_visibility' && payload.new.logo) {
            try {
              const parsedVisibility = JSON.parse(payload.new.logo);
              if (parsedVisibility && typeof parsedVisibility === 'object') {
                setHomeSectionVisibility(prev => ({ ...prev, ...parsedVisibility }));
                try {
                  localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(parsedVisibility));
                } catch (e) {}
              }
            } catch (e) {}
            return;
          }
          if (payload.new && payload.new.id === 'app_brand_category_map') {
            return;
          }
          const updatedBrand = mapBrandFromDb(payload.new);
          setBrands(prev => {
            const index = prev.findIndex(b => b.id === updatedBrand.id);
            let updatedList;
            if (index >= 0) {
              updatedList = [...prev];
              updatedList[index] = { ...updatedList[index], ...updatedBrand };
            } else {
              updatedList = [...prev, updatedBrand];
            }
            return updatedList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }));
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedCat = mapCategoryFromDb(payload.new);
          setCategories(prev => {
            const index = prev.findIndex(c => c.id === updatedCat.id);
            let nextList = [...prev];
            if (index >= 0) {
              nextList[index] = updatedCat;
            } else {
              nextList.push(updatedCat);
            }
            return nextList.sort((a, b) => a.sort_order - b.sort_order);
          });
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
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

  const updateCategoriesOrder = async (orderedCategories) => {
    const updatedList = orderedCategories.map((cat, index) => ({
      ...cat,
      sort_order: index + 1
    }));
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      await supabase.from('categories').upsert(updatedList.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '',
        image: cat.image || '',
        color: cat.color || '#FCE4EC',
        sort_order: cat.sort_order,
        enabled: cat.enabled !== false
      }))).catch(() => {});
    } catch (e) {
      console.warn('Error updating categories order in Supabase:', e);
    }
  };

  const toggleCategoryStatus = async (categoryId) => {
    const target = categories.find(c => c.id === categoryId);
    if (!target) return;
    const newEnabled = !target.enabled;
    const updatedList = categories.map(c => c.id === categoryId ? { ...c, enabled: newEnabled } : c);
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      await supabase.from('categories').upsert({
        id: target.id,
        name: target.name,
        icon: target.icon || '',
        image: target.image || '',
        color: target.color || '#FCE4EC',
        sort_order: target.sort_order,
        enabled: newEnabled
      }).catch(() => {});
    } catch (e) {
      console.warn('Error toggling category status in Supabase:', e);
    }
  };

  const addCategory = async (newCat) => {
    const newId = 'cat_' + Date.now();
    const newCategoryObj = {
      id: newId,
      name: newCat.name,
      icon: newCat.icon || '🛍️',
      image: newCat.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300',
      color: newCat.color || '#FCE4EC',
      sort_order: categories.length + 1,
      enabled: newCat.enabled !== false
    };

    const updatedList = [...categories, newCategoryObj];
    setCategories(updatedList);

    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      await supabase.from('categories').upsert(newCategoryObj).catch(() => {});
    } catch (e) {
      console.warn('Error adding category to Supabase:', e);
    }
  };

  const deleteCategory = async (categoryId) => {
    const updatedList = categories.filter(c => c.id !== categoryId);
    setCategories(updatedList);
    try {
      await supabase.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(updatedList),
        enabled: true
      });
      await supabase.from('categories').delete().eq('id', categoryId).catch(() => {});
    } catch (e) {
      console.warn('Error deleting category from Supabase:', e);
    }
  };

  const toggleHomeSectionVisibility = async (key) => {
    setHomeSectionVisibility(prev => {
      const updated = {
        ...prev,
        [key]: prev[key] === false ? true : false
      };
      try {
        localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(updated));
      } catch (e) {}

      supabase.from('brands').upsert({
        id: 'app_home_section_visibility',
        name: 'Home Section Visibility Config',
        logo: JSON.stringify(updated),
        enabled: true
      }).catch(err => console.warn('Error saving section visibility to Supabase:', err));

      return updated;
    });
  };

  const resetHomeSectionVisibility = async () => {
    setHomeSectionVisibility(DEFAULT_HOME_SECTIONS);
    try {
      localStorage.setItem('salbeau_home_section_visibility', JSON.stringify(DEFAULT_HOME_SECTIONS));
    } catch (e) {}

    try {
      await supabase.from('brands').upsert({
        id: 'app_home_section_visibility',
        name: 'Home Section Visibility Config',
        logo: JSON.stringify(DEFAULT_HOME_SECTIONS),
        enabled: true
      });
    } catch (e) {
      console.warn('Error resetting section visibility in Supabase:', e);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        brands,
        products,
        categories,
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
        homeSectionVisibility,
        toggleHomeSectionVisibility,
        resetHomeSectionVisibility,
        updateCategoriesOrder,
        toggleCategoryStatus,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);


