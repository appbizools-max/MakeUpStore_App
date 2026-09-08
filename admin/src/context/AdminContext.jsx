import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

const initialBrands = [
  { id: 'b1', name: 'Lakmé', logo: '✨', enabled: true, category: 'Makeup' },
  { id: 'b2', name: "L'Oréal Professional", logo: '💆‍♀️', enabled: true, category: 'Hair' },
  { id: 'b3', name: 'Maybelline New York', logo: '💄', enabled: true, category: 'Lips & Eyes' },
  { id: 'b4', name: 'M.A.C Cosmetics', logo: '🌟', enabled: true, category: 'Premium' },
  { id: 'b5', name: 'SUGAR Cosmetics', logo: '💋', enabled: true, category: 'Lips' },
  { id: 'b6', name: 'Biotique Advanced', logo: '🌿', enabled: true, category: 'Skin' },
  { id: 'b7', name: 'Colorbar', logo: '💅', enabled: false, category: 'Nails' },
];

const initialProducts = [
  { id: 'p1', name: 'Lakmé Absolute Matte Revolution Lipstick', brandName: 'Lakmé', category: 'Lipstick & Gloss', mrp: 800, salonPrice: 560, artistPrice: 520, beauticianPrice: 540, stock: 45 },
  { id: 'p2', name: "L'Oréal Mythic Oil Nourishing Serum 100ml", brandName: "L'Oréal Professional", category: 'Hair Care', mrp: 1450, salonPrice: 1015, artistPrice: 950, beauticianPrice: 980, stock: 28 },
  { id: 'p3', name: 'Maybelline Fit Me Matte + Poreless Foundation', brandName: 'Maybelline New York', category: 'Skin Care', mrp: 699, salonPrice: 489, artistPrice: 450, beauticianPrice: 470, stock: 60 },
  { id: 'p4', name: 'M.A.C Studio Fix Powder Plus Foundation', brandName: 'M.A.C Cosmetics', category: 'Skin Care', mrp: 3300, salonPrice: 2475, artistPrice: 2300, beauticianPrice: 2380, stock: 15 },
  { id: 'p5', name: 'SUGAR Transferproof Lip Crayon Velvet', brandName: 'SUGAR Cosmetics', category: 'Lipstick & Gloss', mrp: 799, salonPrice: 559, artistPrice: 519, beauticianPrice: 539, stock: 32 },
];

const initialOrders = [
  {
    id: 'SB-892401',
    userName: 'Priya Sharma',
    userRole: 'salon',
    branch: 'MG Road Branch',
    deliveryType: 'delivery',
    totalAmount: 1575,
    status: 'placed',
    items: [
      { product: { name: 'Lakmé Absolute Matte Revolution Lipstick' }, quantity: 2, unitPrice: 560 },
      { product: { name: 'SUGAR Transferproof Lip Crayon Velvet' }, quantity: 1, unitPrice: 455 }
    ]
  },
  {
    id: 'SB-762910',
    userName: 'Ananya Verma',
    userRole: 'artist',
    branch: 'Indiranagar Branch',
    deliveryType: 'pickup',
    totalAmount: 3250,
    status: 'preparing',
    items: [
      { product: { name: 'M.A.C Studio Fix Powder Plus Foundation' }, quantity: 1, unitPrice: 2300 },
      { product: { name: "L'Oréal Mythic Oil Nourishing Serum" }, quantity: 1, unitPrice: 950 }
    ]
  }
];

export const AdminProvider = ({ children }) => {
  const [brands, setBrands] = useState(initialBrands);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);

  const toggleBrandStatus = (brandId) => {
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, enabled: !b.enabled } : b)));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const updateProductRolePrices = (productId, newPrices) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...newPrices } : p)));
  };

  return (
    <AdminContext.Provider
      value={{
        brands,
        products,
        orders,
        toggleBrandStatus,
        updateOrderStatus,
        updateProductRolePrices,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
