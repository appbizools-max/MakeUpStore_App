import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ChevronLeft, Star, ShoppingBag, Zap, Plus, Minus, Check } from 'lucide-react';

export const CategoryScreen = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    activeProducts,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart
  } = useApp();

  const [activeCat, setActiveCat] = useState(
    selectedCategory || (categories && categories.length > 0 ? categories[0] : null)
  );

  useEffect(() => {
    if (selectedCategory) {
      setActiveCat(selectedCategory);
    } else if (categories && categories.length > 0 && !activeCat) {
      setActiveCat(categories[0]);
    }
  }, [selectedCategory, categories]);

  const handleSelectCategory = (cat) => {
    setActiveCat(cat);
    if (setSelectedCategory) setSelectedCategory(cat);
  };

  const handleIncrement = (e, product, currentQty) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    if (currentQty === 0) {
      addToCart(product, 1);
    } else {
      updateCartQuantity(product.id, currentQty + 1);
    }
  };

  const handleDecrement = (e, productId, currentQty) => {
    e.stopPropagation();
    if (currentQty > 1) {
      updateCartQuantity(productId, currentQty - 1);
    } else if (currentQty === 1) {
      removeFromCart(productId);
    }
  };

  const categoryProducts = activeProducts.filter(p => {
    if (!activeCat) return true;
    const pCat = (p.category || '').toLowerCase();
    const cCat = (activeCat.name || '').toLowerCase();
    if (cCat.includes('lipstick')) return pCat.includes('lipstick');
    return pCat.includes(cCat) || cCat.includes(pCat);
  });

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-60px)] bg-white overflow-hidden animate-fade-in">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A] hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={18} /> Home
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Categories
        </h1>
        <div className="w-6" />
      </div>

      {/* Two-Pane Body Container */}
      <div className="flex flex-1 overflow-hidden pb-16 w-full bg-white">
        {/* Left Rail (Narrow Vertical Category Selector ~72px) */}
        <div
          style={{ width: '72px', minWidth: '72px', maxWidth: '72px', flexShrink: 0 }}
          className="bg-white border-r border-gray-100 overflow-y-auto flex flex-col py-3 items-center space-y-3 no-scrollbar"
        >
          {(categories || []).map((cat) => {
            const isSelected = activeCat && (activeCat.id === cat.id || activeCat.name.toLowerCase() === cat.name.toLowerCase());
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => handleSelectCategory(cat)}
                className="relative w-full flex flex-col items-center justify-center px-1 text-center transition-all group cursor-pointer"
              >
                {/* Active Indicator Bar on the Right Edge */}
                {isSelected && (
                  <div className="absolute right-0 top-1 bottom-1 w-1 bg-[#C2477A] rounded-l-full shadow-xs" />
                )}

                {/* Circular Category Image/Icon Bubble */}
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-xl transition-all ${isSelected
                      ? 'bg-white border-2 border-[#C2477A] text-[#C2477A] shadow-sm scale-105'
                      : 'bg-white border border-gray-100 text-[#3A2430] group-hover:border-[#C2477A]/40'
                    }`}
                >
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover p-0.5 rounded-full" />
                  ) : (
                    <span>{cat.icon || '💄'}</span>
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`text-[9.5px] leading-tight mt-1.5 px-0.5 w-full text-center truncate ${isSelected ? 'font-black text-[#C2477A]' : 'font-medium text-[#8C7078] group-hover:text-[#3A2430]'
                    }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Pane (White Background, Product Grid) */}
        <div style={{ flex: 1, minWidth: 0 }} className="overflow-y-auto p-2 bg-white">
          {/* 2-Column Product Grid */}
          {categoryProducts.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-gray-100 mt-2">
              <ShoppingBag size={24} className="mx-auto text-[#C2477A]/50 mb-1.5" />
              <p className="text-xs text-[#8C7078] font-medium">No items found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pb-24 w-full">
              {categoryProducts.map((product) => {
                const rolePrice = getRolePrice(product, userRole);
                const displayMrp = product.mrp && product.mrp > rolePrice ? product.mrp : Math.round(rolePrice * 1.25);
                const discountPercent = Math.round(((displayMrp - rolePrice) / displayMrp) * 100);
                const isOutOfStock = product.stock === 0;
                const cartItem = (cart || []).find(c => c.id === product.id || c.product?.id === product.id);
                const cartQty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentScreen('product');
                    }}
                    className="bg-white rounded-xl border border-gray-100 p-2 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[204px] relative group"
                  >
                    <div>
                      {/* Product Image Frame */}
                      <div className="relative w-full h-24 bg-white rounded-lg overflow-hidden mb-1.5 border border-gray-100">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400'}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                            isOutOfStock ? 'opacity-40' : ''
                          }`}
                        />

                        {/* Status / Discount Badges */}
                        {isOutOfStock ? (
                          <span className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[7.5px] font-black uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : discountPercent > 0 ? (
                          <span className="absolute top-1 left-1 bg-[#C2477A] text-white text-[7.5px] font-extrabold px-1.5 py-0.5 rounded uppercase shadow-2xs">
                            {discountPercent}% OFF
                          </span>
                        ) : null}

                        <span className="absolute top-1 right-1 bg-white/95 text-[#3A2430] text-[7.5px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-2xs border border-gray-100">
                          <Star size={7} className="fill-[#F5A8C0] text-[#C2477A]" /> {product.rating || '4.8'}
                        </span>
                      </div>

                      {/* Product Info */}
                      <div className="pt-0.5">
                        <div className="text-[7.5px] font-extrabold uppercase tracking-wider text-[#8C7078] truncate">
                          {product.brandName}
                        </div>
                        <h4 className="text-[10px] font-semibold text-[#3A2430] line-clamp-2 leading-tight mt-0.5">
                          {product.name}
                        </h4>
                      </div>
                    </div>

                    {/* Bottom Row: Price Block on Left, ADD / Stepper Button on Right */}
                    <div className="pt-1 flex items-center justify-between gap-1">
                      {/* Price Block */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-xs font-black text-[#C2477A]">₹{rolePrice}</span>
                          <span className="text-[8.5px] text-[#8C7078] line-through font-medium">
                            ₹{displayMrp}
                          </span>
                        </div>
                      </div>

                      {/* ADD / Stepper Button */}
                      <div className="flex-shrink-0">
                        {isOutOfStock ? (
                          <span className="bg-gray-100 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
                            N/A
                          </span>
                        ) : cartQty > 0 ? (
                          <div className="bg-[#C2477A] text-white rounded-lg px-1 py-0.5 flex items-center gap-1 shadow-2xs border border-[#C2477A]">
                            <button
                              onClick={(e) => handleDecrement(e, product.id, cartQty)}
                              className="w-4 h-4 flex items-center justify-center font-black text-xs hover:opacity-80 cursor-pointer"
                            >
                              <Minus size={9} />
                            </button>
                            <span className="text-[10px] font-extrabold px-0.5 min-w-[10px] text-center">
                              {cartQty}
                            </span>
                            <button
                              onClick={(e) => handleIncrement(e, product, cartQty)}
                              className="w-4 h-4 flex items-center justify-center font-black text-xs hover:opacity-80 cursor-pointer"
                            >
                              <Plus size={9} />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isOutOfStock}
                            onClick={(e) => handleIncrement(e, product, 0)}
                            className="px-2.5 py-0.5 rounded-lg text-[9.5px] font-extrabold border shadow-2xs transition-all bg-white text-[#C2477A] border-[#C2477A] hover:bg-[#C2477A] hover:text-white flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus size={9} /> ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
