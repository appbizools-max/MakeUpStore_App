import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CheckCircle2, Clock, ShoppingBag, ArrowRight } from 'lucide-react';

export const OrderConfirmationScreen = () => {
  const { orders, setCurrentScreen } = useApp();
  const latestOrder = orders[0];

  return (
    <div className="min-h-screen bg-[#FFF8FA] p-6 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center mb-5 shadow-inner">
        <CheckCircle2 size={44} />
      </div>

      <span className="text-[10px] uppercase font-bold tracking-widest text-[#C2477A] bg-[#FCE4EC] px-3 py-1 rounded-full mb-2">
        Order Successfully Received!
      </span>

      <h1 className="text-xl font-extrabold text-[#3A2430]">
        Thank You for Shopping!
      </h1>

      {latestOrder && (
        <div className="mt-4 p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm w-full max-w-xs space-y-2 text-xs text-left">
          <div className="flex justify-between items-center border-b border-[#FCE4EC] pb-2">
            <span className="text-[#8C7078] font-medium">Order ID</span>
            <span className="font-extrabold text-[#C2477A]">{latestOrder.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#8C7078]">Store Branch</span>
            <span className="font-semibold text-[#3A2430]">{latestOrder.branch}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#8C7078]">Total Amount</span>
            <span className="font-extrabold text-[#C2477A]">₹{latestOrder.totalAmount}</span>
          </div>

          <div className="p-2.5 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] mt-2 flex items-center gap-2 text-[11px] text-[#8C7078]">
            <Clock size={14} className="text-[#C2477A] flex-shrink-0" />
            <span>You can edit or cancel this order within 15 minutes.</span>
          </div>
        </div>
      )}

      <div className="mt-6 w-full max-w-xs space-y-3">
        <button
          onClick={() => setCurrentScreen('orders')}
          className="w-full py-3.5 bg-[#C2477A] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <span>View Order History</span>
          <ArrowRight size={16} />
        </button>

        <button
          onClick={() => setCurrentScreen('home')}
          className="w-full py-3.5 bg-white text-[#C2477A] font-bold text-xs rounded-xl border border-[#FCE4EC] shadow-sm flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} />
          <span>Continue Shopping</span>
        </button>
      </div>
    </div>
  );
};
