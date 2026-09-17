import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ChevronLeft, Trash2, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react';

export const CartScreen = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    userRole,
    getRolePrice,
    setCurrentScreen
  } = useApp();

  const hasOutOfStockItems = cart.some(item => item.product.stock === 0);

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

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Continue Shopping
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Shopping Cart ({cart.length})
        </h1>
        <div className="w-6" />
      </div>

      <div className="p-4 space-y-4">
        {/* Out of Stock Warning Banner */}
        {hasOutOfStockItems && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-start gap-2.5 text-rose-900 shadow-2xs">
            <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Out of Stock Items in Cart</span>
              <span className="text-[11px] opacity-90 block mt-0.5">
                Some items in your cart are no longer in stock. Please remove them before proceeding to place order.
              </span>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-3">
          {cart.map((item) => {
            const product = item.product;
            const price = getRolePrice(product, userRole);
            const isItemOutOfStock = product.stock === 0;

            return (
              <div
                key={product.id}
                className={`p-3.5 bg-white rounded-2xl border transition-all ${
                  isItemOutOfStock ? 'border-rose-300 bg-rose-50/30' : 'border-[#FCE4EC] shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FCE4EC]/40 border border-[#FCE4EC] flex-shrink-0">
                    <img src={product.image} alt={product.name} className={`w-full h-full object-cover ${isItemOutOfStock ? 'opacity-40' : ''}`} />
                    {isItemOutOfStock && (
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] font-black text-white uppercase text-center px-1">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#C2477A] uppercase">{product.brandName}</span>
                        <h4 className="text-xs font-semibold text-[#3A2430] truncate">{product.name}</h4>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-extrabold text-[#C2477A]">₹{price * item.quantity}</span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2.5 bg-[#FFF8FA] px-2 py-1 rounded-lg border border-[#FCE4EC]">
                        <button
                          onClick={() => updateCartQuantity(product.id, item.quantity - 1)}
                          className="w-5 h-5 rounded text-[#C2477A] font-bold text-xs flex items-center justify-center bg-white border border-[#FCE4EC]"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#3A2430]">{item.quantity}</span>
                        <button
                          disabled={item.quantity >= product.stock || isItemOutOfStock}
                          onClick={() => updateCartQuantity(product.id, item.quantity + 1)}
                          className="w-5 h-5 rounded text-[#C2477A] font-bold text-xs flex items-center justify-center bg-white border border-[#FCE4EC] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {isItemOutOfStock && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                        ⚠️ Out of Stock - Please remove to proceed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
          disabled={hasOutOfStockItems}
          onClick={() => setCurrentScreen('checkout')}
          className={`w-full py-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
            hasOutOfStockItems
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-[#C2477A] hover:bg-[#a83765] text-white active:scale-[0.99]'
          }`}
        >
          <span>Proceed to Place Order</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
