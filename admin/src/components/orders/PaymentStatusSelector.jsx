import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, CreditCard, DollarSign } from 'lucide-react';

export const PAYMENT_STATUS_OPTIONS = [
  {
    id: 'pending',
    label: 'COD Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70',
    dotColor: 'bg-amber-500',
    description: 'Cash on delivery payment pending collection'
  },
  {
    id: 'paid',
    label: 'Paid (Collected)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
    dotColor: 'bg-emerald-500',
    description: 'Payment fully collected via Cash / UPI / Card'
  },
  {
    id: 'partially_paid',
    label: 'Partially Paid',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70',
    dotColor: 'bg-blue-500',
    description: 'Partial advance or split payment collected'
  },
  {
    id: 'refunded',
    label: 'Refunded',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70',
    dotColor: 'bg-purple-500',
    description: 'Amount refunded to customer'
  },
  {
    id: 'cancelled',
    label: 'Cancelled / Void',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70',
    dotColor: 'bg-rose-500',
    description: 'Payment voided or order cancelled'
  }
];

export default function PaymentStatusSelector({ order, onUpdatePaymentStatus, onSuccessToast, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  const currentStatusId = (order?.paymentStatus || order?.internalStatus || 'pending').toLowerCase();
  const currentOption = PAYMENT_STATUS_OPTIONS.find(o => o.id === currentStatusId) || PAYMENT_STATUS_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (newStatusId) => {
    if (newStatusId === currentStatusId || isUpdating || disabled) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdatePaymentStatus(order.id, newStatusId);
      if (onSuccessToast) {
        const sel = PAYMENT_STATUS_OPTIONS.find(o => o.id === newStatusId);
        onSuccessToast(`Payment status updated to ${sel ? sel.label : newStatusId}`);
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || isUpdating}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${currentOption.badgeClass} ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        title="Click to update payment status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotColor} shrink-0`}></span>
        <span className="truncate max-w-[110px]">{currentOption.label}</span>
        <ChevronDown size={11} className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-pink-100 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-gray-400">Update Payment</span>
            <span className="text-[10px] font-bold text-[#C2477A]">COD / Manual</span>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {PAYMENT_STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.id === currentStatusId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-pink-50/60 transition-colors cursor-pointer ${
                    isSelected ? 'bg-pink-50/80 font-bold text-[#C2477A]' : 'text-gray-700 font-medium'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dotColor} mt-1 shrink-0`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{opt.label}</span>
                      {isSelected && <Check size={12} className="text-[#C2477A] shrink-0" />}
                    </div>
                    <div className="text-[10px] text-gray-400 font-normal truncate mt-0.5">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

