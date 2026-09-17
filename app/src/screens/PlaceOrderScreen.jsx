import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ChevronLeft, MapPin, Store, CheckCircle, Plus, Sparkles } from 'lucide-react';

export const PlaceOrderScreen = () => {
  const {
    cart,
    cartSubtotal,
    addresses = [],
    addAddress,
    selectedBranch,
    placeOrder,
    setCurrentScreen,
    userProfile
  } = useApp();

  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'pickup'
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find(a => a.isDefault)?.id || (addresses[0] ? addresses[0].id : 'custom')
  );
  const [customAddress, setCustomAddress] = useState(userProfile.address || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAddrObj = addresses.find(a => a.id === selectedAddressId);
  const finalAddressText = deliveryType === 'pickup'
    ? `Pickup from ${selectedBranch}`
    : (activeAddrObj ? activeAddrObj.text : customAddress);

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const createdOrder = placeOrder({
        deliveryType,
        address: finalAddressText,
        branch: selectedBranch,
        notes: orderNotes
      });
      setIsSubmitting(false);
      if (createdOrder) {
        setCurrentScreen('confirmation');
      }
    }, 600);
  };

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('cart')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Back to Cart
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Checkout Order
        </h1>
        <div className="w-6" />
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Fulfillment Type Selector */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
          <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px]">
            1. Select Fulfillment Method
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                deliveryType === 'delivery'
                  ? 'border-[#C2477A] bg-[#FCE4EC]/50 text-[#C2477A] font-bold'
                  : 'border-[#FCE4EC] text-[#8C7078] hover:border-[#F5A8C0]'
              }`}
            >
              <MapPin size={20} />
              <span>Home Delivery</span>
            </button>

            <button
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                deliveryType === 'pickup'
                  ? 'border-[#C2477A] bg-[#FCE4EC]/50 text-[#C2477A] font-bold'
                  : 'border-[#FCE4EC] text-[#8C7078] hover:border-[#F5A8C0]'
              }`}
            >
              <Store size={20} />
              <span>Branch Store Pickup</span>
            </button>
          </div>
        </div>

        {/* Address Selection (Feature 3) */}
        {deliveryType === 'delivery' ? (
          <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px]">
                2. Delivery Address Book
              </h3>
              <button
                onClick={() => setCurrentScreen('profile')}
                className="text-[11px] font-bold text-[#C2477A] underline"
              >
                Manage Addresses
              </button>
            </div>

            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    selectedAddressId === addr.id
                      ? 'border-[#C2477A] bg-[#FCE4EC]/30'
                      : 'border-[#FCE4EC] hover:bg-[#FFF8FA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="checkoutAddress"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 accent-[#C2477A]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3A2430] text-xs">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] bg-[#C2477A] text-white px-1.5 py-0.5 rounded font-bold">Default</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8C7078] mt-0.5 leading-snug">{addr.text}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{addr.name} • {addr.phone}</p>
                  </div>
                </div>
              ))}

              <div
                onClick={() => setSelectedAddressId('custom')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  selectedAddressId === 'custom'
                    ? 'border-[#C2477A] bg-[#FCE4EC]/30'
                    : 'border-[#FCE4EC] hover:bg-[#FFF8FA]'
                }`}
              >
                <input
                  type="radio"
                  name="checkoutAddress"
                  checked={selectedAddressId === 'custom'}
                  onChange={() => setSelectedAddressId('custom')}
                  className="mt-0.5 accent-[#C2477A]"
                />
                <div className="flex-1">
                  <span className="font-bold text-[#3A2430] text-xs">Enter New Address</span>
                  {selectedAddressId === 'custom' && (
                    <textarea
                      rows={2}
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="House no, Street, Landmark, Area, City, Pincode..."
                      className="w-full mt-2 p-2.5 rounded-lg border border-[#F5A8C0] bg-white outline-none focus:border-[#C2477A] text-xs text-[#3A2430]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-2">
            <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px]">
              2. Pickup Store Branch
            </h3>
            <div className="p-3 bg-[#FCE4EC]/40 rounded-xl border border-[#F5A8C0] text-xs">
              <span className="font-bold text-[#C2477A] block">{selectedBranch}</span>
              <span className="text-[11px] text-[#8C7078] mt-0.5 block">
                Order will be prepared at store counter. Bring Order ID for instant collection.
              </span>
            </div>
          </div>
        )}

        {/* Notes & Summary */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
          <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px]">
            3. Order Notes (Optional)
          </h3>
          <input
            type="text"
            placeholder="e.g. Call before delivery, handle with care..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full p-3 rounded-xl border border-[#FCE4EC] outline-none focus:border-[#C2477A] bg-white text-xs text-[#3A2430]"
          />

          <div className="pt-3 border-t border-[#FCE4EC] space-y-1.5 text-xs text-[#8C7078]">
            <div className="flex justify-between">
              <span>Items Total ({cart.length})</span>
              <span>₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Gateway Fee</span>
              <span className="text-[#4C8C5C] font-semibold">₹0 (No Gateway Needed)</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-[#3A2430] pt-1">
              <span>Total Store Bill</span>
              <span className="text-[#C2477A] text-base">₹{cartSubtotal}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          disabled={isSubmitting}
          onClick={handleConfirmOrder}
          className="w-full py-4 bg-[#C2477A] hover:bg-[#a83765] text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle size={16} />
          {isSubmitting ? 'Submitting Order...' : `Confirm & Place Order — ₹${cartSubtotal}`}
        </button>
      </div>
    </div>
  );
};
