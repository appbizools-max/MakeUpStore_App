import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ChevronLeft, Trash2, ShoppingBag, ArrowRight, X, Sparkles, Palette, Plus } from 'lucide-react';
import { getAddOnRecommendations, getSafeProductShades } from '../utils/recommendationEngine';

export const CartScreen = () => {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    userRole,
    getRolePrice,
    setCurrentScreen,
    activeProducts,
    recommendationConfig,
    setSelectedProduct
  } = useApp();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [quickShadeModalItem, setQuickShadeModalItem] = useState(null);
  const [selectedQuickShade, setSelectedQuickShade] = useState(null);
  const [addedToastMessage, setAddedToastMessage] = useState(null);
  const [locallyAddedIds, setLocallyAddedIds] = useState([]);

  useEffect(() => {
    if (addedToastMessage) {
      const timer = setTimeout(() => setAddedToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToastMessage]);

  const cartAddOns = useMemo(() => {
    if (recommendationConfig?.enabled === false || !cart || cart.length === 0) return [];
    const recs = getAddOnRecommendations(cart, activeProducts, cart, {
      maxCount: (recommendationConfig?.maxAddOns || 8) + locallyAddedIds.length,
      frequentlyBoughtTogether: recommendationConfig?.frequentlyBoughtTogether !== false,
      popularProductsFallback: recommendationConfig?.popularProductsFallback !== false
    });
    return recs.filter(p => !locallyAddedIds.includes(p.id)).slice(0, recommendationConfig?.maxAddOns || 8);
  }, [cart, activeProducts, recommendationConfig, locallyAddedIds]);

  const handleAddOnPress = (product) => {
    const subItems = getSafeProductShades(product);
    if (subItems.length > 1) {
      setQuickShadeModalItem(product);
      setSelectedQuickShade(subItems[0]);
    } else {
      const chosenShade = subItems.length === 1 ? subItems[0] : null;
      addToCart(product, 1, chosenShade);
      setLocallyAddedIds(prev => [...prev, product.id]);
      setAddedToastMessage(`Added ${product.name} to cart! ✨`);
    }
  };

  const handleConfirmQuickShadeAdd = () => {
    if (!quickShadeModalItem) return;
    addToCart(quickShadeModalItem, 1, selectedQuickShade);
    setLocallyAddedIds(prev => [...prev, quickShadeModalItem.id]);
    setAddedToastMessage(`Added ${quickShadeModalItem.name}${selectedQuickShade ? ` (${selectedQuickShade.name})` : ''} to cart! ✨`);
    setQuickShadeModalItem(null);
    setSelectedQuickShade(null);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center mb-4">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-base font-bold text-[#3A2430]">Your Cart is Empty</h2>
        <p className="text-xs text-[#8C7078] mt-1 max-w-[240px]">
          Explore beauty products and add items to your shopping cart.
        </p>
        <button
          onClick={() => setCurrentScreen('home')}
          className="mt-5 bg-[#C2477A] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in relative">
      {/* Header with Back, Title & Prominent Clear All Button */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Shop
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Shopping Cart ({cart.length})
        </h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
          title="Clear entire cart"
        >
          <Trash2 size={13} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#FCE4EC] max-w-xs w-full p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 size={24} />
            </div>
            <h3 className="text-sm font-black text-[#3A2430]">Clear Entire Cart?</h3>
            <p className="text-xs text-[#8C7078] leading-relaxed">
              Are you sure you want to remove all {totalQuantity} item{totalQuantity > 1 ? 's' : ''} ({cart.length} product{cart.length > 1 ? 's' : ''}) from your cart?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-[#FCE4EC] text-[#3A2430] bg-[#FFF8FA] hover:bg-[#FCE4EC]"
              >
                Keep Items
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Cart Items List */}
        <div className="space-y-3">
          {cart.map((item) => {
            const product = item.product;
            const itemId = item.id || product.id;
            const price = getRolePrice(product, userRole, item.shade, item.quantity);

            return (
              <div
                key={itemId}
                className="p-3.5 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FCE4EC]/40 border border-[#FCE4EC] flex-shrink-0">
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#C2477A] uppercase">{product.brandName}</span>
                        <h4 className="text-xs font-semibold text-[#3A2430] truncate">{product.name}</h4>
                        {item.shade && (
                          <div className="flex items-center gap-1.5 mt-1 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 w-fit">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                              style={{ background: item.shade.hexColor || '#CE4270' }}
                            />
                            <span className="text-[10px] font-bold text-violet-800">{item.shade.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-[#C2477A]">₹{price * item.quantity}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 font-medium">₹{price}/unit</span>
                          {price < getRolePrice(product, userRole, item.shade, 1) && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Tier Applied
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2.5 bg-[#FFF8FA] px-2 py-1 rounded-lg border border-[#FCE4EC]">
                        <button
                          onClick={() => updateCartQuantity(itemId, item.quantity - 1)}
                          className="w-5 h-5 rounded text-[#C2477A] font-bold text-xs flex items-center justify-center bg-white border border-[#FCE4EC] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#3A2430]">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(itemId, item.quantity + 1)}
                          className="w-5 h-5 rounded text-[#C2477A] font-bold text-xs flex items-center justify-center bg-white border border-[#FCE4EC] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── COMPLETE YOUR ORDER ✨ (AUTOMATIC ADD-ONS) ── */}
        {cartAddOns.length > 0 && (
          <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    Complete Your Order ✨
                  </h3>
                  <span className="text-[10px] text-[#8C7078] block">
                    Complementary additions based on your bag
                  </span>
                </div>
              </div>
              <span className="bg-[#FFF0F5] text-[#C2477A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                {cartAddOns.length}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {cartAddOns.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <div
                    key={p.id}
                    className="w-36 flex-shrink-0 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div
                        onClick={() => {
                          setSelectedProduct(p);
                          setCurrentScreen('product_detail');
                        }}
                        className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 cursor-pointer"
                      >
                        <img
                          src={subItems[0]?.image || p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {subItems.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Palette size={10} />
                            <span>{subItems.length}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[8.5px] font-extrabold text-[#C2477A] uppercase truncate block">
                        {p.brandName || p.category || 'Salbeau'}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#3A2430] line-clamp-2 leading-tight mb-1">
                        {p.name}
                      </h5>

                      {subItems.length > 1 ? (
                        <span className="text-[9px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 inline-block mb-1.5">
                          {subItems.length} shades
                        </span>
                      ) : subItems.length === 1 ? (
                        <span className="text-[9px] text-[#8C7078] truncate block mb-1.5">
                          Shade: {subItems[0].name}
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#8C7078] truncate block mb-1.5">
                          {p.category || 'Standard'}
                        </span>
                      )}

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xs font-black text-[#C2477A]">₹{pPrice}</span>
                        {pMrp > pPrice && (
                          <span className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddOnPress(p)}
                      className="w-full py-1.5 rounded-xl bg-[#C2477A] hover:bg-[#a83765] text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>{subItems.length > 1 ? '+ Select' : '+ Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtotal Summary */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-2 text-xs">
          <div className="flex justify-between text-[#8C7078]">
            <span>Items Subtotal</span>
            <span>₹{cartSubtotal}</span>
          </div>
          <div className="flex justify-between text-[#8C7078]">
            <span>Branch Processing</span>
            <span className="text-[#4C8C5C] font-semibold">Free (Direct Store Bill)</span>
          </div>
          <div className="pt-2 border-t border-[#FCE4EC] flex justify-between font-extrabold text-sm text-[#3A2430]">
            <span>Total Payable Amount</span>
            <span className="text-[#C2477A] text-base">₹{cartSubtotal}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setCurrentScreen('checkout')}
          className="w-full py-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 bg-[#C2477A] hover:bg-[#a83765] text-white active:scale-[0.99]"
        >
          <span>Proceed to Place Order</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Floating Success Toast */}
      {addedToastMessage && (
        <div className="fixed top-14 left-4 right-4 z-50 p-3 bg-[#3A2430] border border-[#C2477A]/40 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FCE4EC]" />
            <span>{addedToastMessage}</span>
          </div>
          <button
            onClick={() => setAddedToastMessage(null)}
            className="text-white hover:text-pink-200 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Shade Selection Modal for Web */}
      {quickShadeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#FCE4EC] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4EC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#3A2430] uppercase">Select Your Shade</h4>
                  <span className="text-[10px] text-[#8C7078] block truncate max-w-[240px]">
                    {quickShadeModalItem.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQuickShadeModalItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selected Shade Preview */}
            {selectedQuickShade && (
              <div className="flex items-center gap-3 bg-[#FFF5F8] p-3 rounded-2xl border border-[#FCE4EC]">
                <img
                  src={selectedQuickShade.image || quickShadeModalItem.image}
                  alt={selectedQuickShade.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#FCE4EC]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {selectedQuickShade.hexColor && (
                      <span
                        style={{ backgroundColor: selectedQuickShade.hexColor }}
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
                      />
                    )}
                    <span className="text-xs font-extrabold text-[#3A2430]">
                      {selectedQuickShade.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#C2477A] block mt-0.5">
                    ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                  </span>
                </div>
              </div>
            )}

            {/* Shades Grid */}
            <div>
              <span className="text-[10px] font-black text-[#8C7078] uppercase tracking-wider block mb-2">
                Available Options ({getSafeProductShades(quickShadeModalItem).length})
              </span>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {getSafeProductShades(quickShadeModalItem).map((shade, idx) => {
                  const isSel = selectedQuickShade && (selectedQuickShade.id === shade.id || selectedQuickShade.name === shade.name);
                  const sPrice = getRolePrice(quickShadeModalItem, userRole, shade, 1);
                  return (
                    <button
                      key={shade.id || idx}
                      onClick={() => setSelectedQuickShade(shade)}
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSel ? 'bg-[#FFF0F5] border-[#C2477A] shadow-xs' : 'bg-white border-[#FCE4EC] hover:border-gray-300'
                      }`}
                    >
                      <div className="relative w-12 h-12 mx-auto rounded-xl overflow-hidden mb-1 bg-[#FFF5F8] flex items-center justify-center">
                        <img
                          src={shade.image || quickShadeModalItem.image}
                          alt={shade.name}
                          className="w-full h-full object-cover"
                        />
                        {shade.hexColor && (
                          <span
                            style={{ backgroundColor: shade.hexColor }}
                            className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-white"
                          />
                        )}
                        {isSel && (
                          <span className="absolute top-0.5 left-0.5 bg-[#C2477A] text-white w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold block truncate ${isSel ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                        {shade.name}
                      </span>
                      <span className="text-[10px] font-black text-[#C2477A] block mt-0.5">
                        ₹{sPrice}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Add Button */}
            <button
              onClick={handleConfirmQuickShadeAdd}
              className="w-full py-3.5 rounded-2xl bg-[#C2477A] hover:bg-[#a83765] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>
                Add {selectedQuickShade ? selectedQuickShade.name : 'Selected'} To Bag • ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
