import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Heart,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Trash2,
  ArrowRight,
  Star
} from 'lucide-react';

export const WishlistScreen = () => {
  const {
    favorites = [],
    isFavorite,
    toggleFavorite,
    clearFavorites,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    cart = [],
    addToCart,
    updateCartQuantity
  } = useApp();

  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(cart)) {
      for (const item of cart) {
        if (item?.product?.id) {
          map.set(item.product.id, item.quantity || 0);
        }
      }
    }
    return map;
  }, [cart]);

  const { totalCartQuantity, totalCartPrice } = useMemo(() => {
    let qty = 0;
    let price = 0;
    if (Array.isArray(cart)) {
      for (const item of cart) {
        const itemQty = item.quantity || 0;
        qty += itemQty;
        const itemPrice = getRolePrice(item.product, userRole);
        price += (itemPrice * itemQty);
      }
    }
    return { totalCartQuantity: qty, totalCartPrice: price };
  }, [cart, userRole, getRolePrice]);

  const getProductCartQuantity = (productId) => {
    return cartQuantityMap.get(productId) || 0;
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all saved items from your wishlist?')) {
      clearFavorites();
    }
  };

  const renderCartControl = (product) => {
    const qty = getProductCartQuantity(product.id);

    if (qty > 0) {
      return (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#C2477A] text-white rounded-full flex items-center justify-between px-1.5 py-0.5 shadow-sm min-w-[76px]"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateCartQuantity(product.id, qty - 1);
            }}
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-bold transition-colors"
          >
            −
          </button>
          <span className="text-xs font-black px-1.5 text-center min-w-[16px]">
            {qty}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateCartQuantity(product.id, qty + 1);
            }}
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-bold transition-colors"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          addToCart(product, 1);
        }}
        className="bg-white border-2 border-[#C2477A] text-[#C2477A] hover:bg-[#C2477A] hover:text-white px-3 py-1 rounded-full text-xs font-black shadow-xs transition-colors flex items-center gap-0.5"
      >
        + Add
      </button>
    );
  };

  return (
    <div className="pb-28 min-h-screen bg-white select-none animate-fade-in">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-[#F0E6EC] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] hover:bg-gray-50 flex items-center justify-center text-[#1E1B1D] shadow-xs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black text-[#1E1B1D] uppercase tracking-wider">
              My Wishlist
            </h1>
            <p className="text-[10px] font-semibold text-[#6B5E65]">
              {favorites.length} {favorites.length === 1 ? 'item saved' : 'items saved'}
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-[#6B5E65] flex items-center gap-1"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto">
        {favorites.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center flex flex-col items-center justify-center px-4">
            <div className="w-20 h-20 rounded-full bg-[#FFF0F5] border border-[#E2D1DC] flex items-center justify-center text-[#C2477A] mb-5 shadow-xs">
              <Heart size={38} />
            </div>

            <h2 className="text-lg font-black text-[#1E1B1D] mb-1.5">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-[#6B5E65] leading-relaxed mb-6 max-w-xs">
              Explore our curated beauty collections and tap the heart icon on any product or service to save it here.
            </p>

            <button
              onClick={() => setCurrentScreen('home')}
              className="px-6 py-3.5 bg-[#C2477A] hover:bg-[#9E2D5B] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles size={15} /> Explore Catalog
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 gap-3 pb-16">
            {favorites.map((product) => {
              const rolePrice = getRolePrice(product, userRole);
              const originalMrp = product.mrp > rolePrice ? product.mrp : Math.round(product.mrp * 1.25);
              const discountPercent = Math.round(((originalMrp - rolePrice) / originalMrp) * 100);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setCurrentScreen('product');
                  }}
                  className="bg-white rounded-2xl border border-[#F0E6EC] overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square bg-[#F9FAFB] overflow-hidden">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400'}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />

                      {discountPercent > 0 && (
                        <span className="absolute top-2 left-2 bg-[#C2477A] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      )}

                      {/* Active Heart Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[#E2D1DC] flex items-center justify-center text-[#C2477A] shadow-xs hover:scale-110 transition-transform"
                      >
                        <Heart size={15} className="fill-[#C2477A] text-[#C2477A]" />
                      </button>
                    </div>

                    <div className="p-3">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#C2477A] mb-0.5">
                        {product.brandName || 'SALBEAU'}
                      </div>
                      <h4 className="text-xs font-bold text-[#1E1B1D] line-clamp-2 leading-snug mb-2">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-sm font-extrabold text-[#C2477A]">₹{rolePrice}</span>
                      <span className="text-[10px] text-[#8C7E86] line-through ml-1">₹{originalMrp}</span>
                    </div>

                    {renderCartControl(product)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- STICKY VIEW CART BOTTOM BAR ---------------- */}
      {totalCartQuantity > 0 && (
        <div className="fixed bottom-[56px] left-0 right-0 max-w-md mx-auto px-3 z-40 animate-fade-in pointer-events-auto">
          <div className="bg-[#C2477A] text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide">
                  {totalCartQuantity} {totalCartQuantity === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentScreen('cart')}
              className="bg-white text-[#C2477A] hover:bg-gray-50 px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            >
              View Cart <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
