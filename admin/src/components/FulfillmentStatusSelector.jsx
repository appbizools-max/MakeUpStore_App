import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';

export const STATUS_CONFIG = {
  placed: {
    id: 'placed',
    label: 'Placed',
    step: 1,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70',
    dotColor: 'bg-amber-500',
    description: 'Order placed by customer and queued for store acceptance',
    icon: Clock
  },
  confirmed: {
    id: 'confirmed',
    label: 'Confirmed',
    step: 2,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70',
    dotColor: 'bg-blue-500',
    description: 'Store branch verified and confirmed the order',
    icon: Check
  },
  processing: {
    id: 'processing',
    label: 'Processing',
    step: 3,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/70',
    dotColor: 'bg-sky-500',
    description: 'Order accepted, items being picked and verified',
    icon: Truck
  },
  packing: {
    id: 'packing',
    label: 'Packed & Sealed',
    step: 4,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70',
    dotColor: 'bg-purple-500',
    description: 'Items packed securely with quality seal for dispatch',
    icon: PackageCheck
  },
  ready_to_dispatch: {
    id: 'ready_to_dispatch',
    label: 'Ready for Dispatch',
    step: 5,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70',
    dotColor: 'bg-indigo-500',
    description: 'Parcel staged at dock awaiting courier pickup',
    icon: Truck
  },
  out_for_delivery: {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    step: 6,
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100/70',
    dotColor: 'bg-cyan-500',
    description: 'Delivery partner / rider is en route to customer',
    icon: Truck
  },
  delivered: {
    id: 'delivered',
    label: 'Delivered',
    step: 7,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
    dotColor: 'bg-emerald-500',
    description: 'Order successfully handed over and fulfilled completely',
    icon: PackageCheck
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    step: 7,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
    dotColor: 'bg-emerald-500',
    description: 'Order finalized and marked complete',
    icon: PackageCheck
  },
  partially_delivered: {
    id: 'partially_delivered',
    label: 'Partially Delivered',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/70',
    dotColor: 'bg-violet-500',
    description: 'A portion of items delivered; remaining items arriving separately',
    icon: CheckCircle2
  },
  partially_delivered_rejected: {
    id: 'partially_delivered_rejected',
    label: 'Partially Delivered — Item Rejected',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70',
    dotColor: 'bg-orange-500',
    description: 'Delivered available items; rejected unavailable items',
    icon: AlertTriangle
  },
  partially_delivered_cancelled: {
    id: 'partially_delivered_cancelled',
    label: 'Partially Delivered — Remaining Cancelled',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70',
    dotColor: 'bg-purple-500',
    description: 'Delivered partial items; remaining items cancelled',
    icon: AlertTriangle
  },
  cancelled: {
    id: 'cancelled',
    label: 'Cancelled',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200/70',
    dotColor: 'bg-gray-500',
    description: 'Customer or store requested order cancellation',
    icon: XCircle
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected by Store',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70',
    dotColor: 'bg-rose-500',
    description: 'Store unable to fulfill due to branch policies or constraints',
    icon: ShieldAlert
  }
};

const STANDARD_LIFECYCLE = [
  'placed',
  'confirmed',
  'processing',
  'packing',
  'ready_to_dispatch',
  'out_for_delivery',
  'delivered'
];

const REJECTION_REASONS = [
  'Items unable to be fulfilled at this branch',
  'Delivery address is outside serviceable area',
  'Customer unreachable / requested cancellation',
  'Duplicate or fraudulent order detected',
  'Store branch currently closed for operations',
  'Other'
];

/**
 * Advanced Fulfillment Status Selector Component
 * 
 * Replaces basic browser select with an interactive, lifecycle-aware visual status timeline.
 * Features:
 * - Timeline progression (Placed -> Processing -> Delivered) with completion indicators
 * - Special outcomes (Partial delivery variants, Cancelled, Rejected)
 * - Confirmation drawer before database commit
 * - Reason selection & input for rejection
 * - Item-level breakdown for partial deliveries
 * - Fully responsive (modal on desktop, bottom sheet on mobile)
 */
export default function FulfillmentStatusSelector({
  order,
  onUpdateStatus,
  onSuccessToast = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(order.status || 'placed');
  const [selectedRejectionReason, setSelectedRejectionReason] = useState(REJECTION_REASONS[0]);
  const [customRejectionText, setCustomRejectionText] = useState('');
  const [itemStatuses, setItemStatuses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync internal state when order changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetStatus(order.status || 'placed');
      setSelectedRejectionReason(order.rejectionReason || REJECTION_REASONS[0]);
      setCustomRejectionText('');

      const rawItems = order.items || [];
      setItemStatuses(rawItems.map(item => ({
        ...item,
        status: item.status || (order.status === 'delivered' ? 'delivered' : 'placed')
      })));
    }
  }, [isOpen, order]);

  const currentCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const targetCfg = STATUS_CONFIG[targetStatus] || currentCfg;
  const isChanged = targetStatus !== order.status;

  const currentStep = currentCfg.step || 0;
  const isTerminalDelivered = order.status === 'delivered';

  // Toggle item status in partial delivery view
  const handleToggleItemStatus = (idx, newSt) => {
    setItemStatuses(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status: newSt };
      return copy;
    });
  };

  // Commit status change
  const handleConfirmUpdate = async () => {
    if (!isChanged) {
      setIsOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalReason = '';
      if (targetStatus === 'rejected') {
        finalReason = selectedRejectionReason === 'Other' ? customRejectionText.trim() || 'Store rejected order' : selectedRejectionReason;
      }

      let customItems = null;
      if (targetStatus.startsWith('partially_delivered')) {
        customItems = itemStatuses;
      }

      await onUpdateStatus(order.id, targetStatus, finalReason, customItems);

      if (onSuccessToast) {
        onSuccessToast(`Order #${order.id} status updated to "${targetCfg.label}"`);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. Clickable Status Badge Button (Replaces raw <select>) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 group ${currentCfg.badgeClass}`}
        title={`Click to update fulfillment status for Order #${order.id}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${currentCfg.dotColor} group-hover:animate-ping`} />
        <span>{currentCfg.label}</span>
        <ChevronDown size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* 2. Advanced Fulfillment Status Selector Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-pink-100/80 bg-gradient-to-r from-pink-50/60 via-white to-pink-50/30 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                    Update Fulfillment Status
                  </h3>
                  <span className="font-mono text-xs font-bold text-[#CE4270] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                    #{order.id}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Customer: <span className="font-bold text-gray-800">{order.userName}</span> • Role: <span className="font-bold text-[#CE4270]">{order.userRole}</span> • Branch: <span className="font-semibold text-gray-700">{order.branch}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 border border-gray-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Selector Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
              
              {/* CURRENT STATUS BANNER */}
              <div className="bg-[#FFF8FA] p-3.5 rounded-2xl border border-pink-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${currentCfg.badgeClass}`}>
                    <currentCfg.icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Current Status</span>
                    <div className="text-xs font-black text-gray-900">{currentCfg.label}</div>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 max-w-[200px] text-right truncate">
                  {currentCfg.description}
                </span>
              </div>

              {/* 1. STANDARD ORDER LIFECYCLE (VERTICAL PROGRESSION TIMELINE) */}
              <div className="space-y-3">
                <div className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={14} className="text-[#CE4270]" />
                  <span>Standard Fulfillment Lifecycle</span>
                </div>

                <div className="space-y-1 relative pl-2">
                  {STANDARD_LIFECYCLE.map((stKey, idx) => {
                    const stCfg = STATUS_CONFIG[stKey];
                    const isSelected = targetStatus === stKey;
                    const isCurrentOrderState = order.status === stKey;
                    const isPast = currentStep > stCfg.step;
                    const isFuture = currentStep < stCfg.step;
                    const isInvalidTransition = isTerminalDelivered && stKey !== 'delivered';

                    return (
                      <div key={stKey} className="relative flex items-start gap-3.5 group">
                        {/* Connecting Line between steps */}
                        {idx < STANDARD_LIFECYCLE.length - 1 && (
                          <div
                            className={`absolute left-[15px] top-[28px] w-0.5 h-[calc(100%-8px)] transition-colors ${
                              isPast ? 'bg-emerald-400' : 'bg-gray-200'
                            }`}
                          />
                        )}

                        {/* Step Icon / Indicator */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 transition-all shrink-0 ${
                            isCurrentOrderState
                              ? 'bg-[#CE4270] text-white ring-4 ring-pink-100 shadow-xs'
                              : isSelected
                              ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                              : isPast
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {isPast ? <Check size={14} /> : stCfg.step}
                        </div>

                        {/* Interactive Step Card */}
                        <button
                          type="button"
                          disabled={isInvalidTransition}
                          onClick={() => setTargetStatus(stKey)}
                          className={`flex-1 text-left p-3 rounded-2xl border transition-all cursor-pointer mb-2 ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50/60 shadow-xs'
                              : isCurrentOrderState
                              ? 'border-[#CE4270]/40 bg-[#FFF5F8]'
                              : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                          } ${isInvalidTransition ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-gray-900">
                                {stCfg.label}
                              </span>
                              {isCurrentOrderState && (
                                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-[#CE4270] text-white">
                                  Current
                                </span>
                              )}
                              {isSelected && !isCurrentOrderState && (
                                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-violet-600 text-white">
                                  Target
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">Step {stCfg.step}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {stCfg.description}
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SPECIAL STATUS OUTCOMES */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>Special Status Outcomes / Exceptions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'partially_delivered',
                    'partially_delivered_rejected',
                    'partially_delivered_cancelled',
                    'cancelled',
                    'rejected'
                  ].map((stKey) => {
                    const stCfg = STATUS_CONFIG[stKey];
                    const isSelected = targetStatus === stKey;
                    const isCurrentOrderState = order.status === stKey;

                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => setTargetStatus(stKey)}
                        className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50/70 shadow-xs'
                            : isCurrentOrderState
                            ? 'border-[#CE4270]/40 bg-[#FFF5F8]'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <stCfg.icon size={14} className={stKey === 'rejected' ? 'text-rose-600' : stKey === 'cancelled' ? 'text-gray-600' : 'text-teal-600'} />
                            <span className="font-extrabold text-xs text-gray-900">{stCfg.label}</span>
                          </div>
                          {isCurrentOrderState && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#CE4270] text-white">Current</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                          {stCfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. DYNAMIC CONFIRMATION & ACTION AREA */}
              {isChanged && (
                <div className="p-4 rounded-2xl border bg-gradient-to-br from-gray-50 to-pink-50/30 border-pink-200/80 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900 uppercase">
                      Confirm Transition:
                    </span>
                    <span className="text-xs font-bold text-gray-500 line-through">
                      {currentCfg.label}
                    </span>
                    <ArrowRight size={13} className="text-[#CE4270]" />
                    <span className="text-xs font-black text-[#CE4270] bg-pink-100/80 px-2.5 py-0.5 rounded-full">
                      {targetCfg.label}
                    </span>
                  </div>

                  {/* SPECIAL OUTCOME ACTION 1: REJECTION REASON SELECTION */}
                  {targetStatus === 'rejected' && (
                    <div className="space-y-2 pt-2 border-t border-rose-100">
                      <label className="block text-xs font-extrabold text-rose-700">
                        Select Store Rejection Reason <span className="text-rose-600">*</span>
                      </label>
                      <div className="space-y-1.5">
                        {REJECTION_REASONS.map((reason) => (
                          <label
                            key={reason}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              selectedRejectionReason === reason
                                ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rejectionReason"
                              checked={selectedRejectionReason === reason}
                              onChange={() => setSelectedRejectionReason(reason)}
                              className="accent-rose-600"
                            />
                            <span>{reason}</span>
                          </label>
                        ))}
                      </div>

                      {selectedRejectionReason === 'Other' && (
                        <textarea
                          placeholder="Enter specific rejection reason for customer..."
                          value={customRejectionText}
                          onChange={(e) => setCustomRejectionText(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs font-medium text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        />
                      )}
                    </div>
                  )}

                  {/* SPECIAL OUTCOME ACTION 2: CUSTOMER CANCELLATION NOTICE */}
                  {targetStatus === 'cancelled' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span>Confirm Customer Cancellation</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Are you sure you want to mark this order as cancelled? This order will be excluded from active fulfillment.
                      </p>
                    </div>
                  )}

                  {/* SPECIAL OUTCOME ACTION 3: PARTIALLY DELIVERED ITEM-LEVEL TOGGLES */}
                  {targetStatus.startsWith('partially_delivered') && (
                    <div className="space-y-2 pt-2 border-t border-teal-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-900">
                          Configure Item-Level Delivery Status ({itemStatuses.length} items)
                        </span>
                        <span className="text-[10px] text-gray-500">Delivered vs Arriving Separately</span>
                      </div>

                      {itemStatuses.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {itemStatuses.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="truncate flex-1">
                                <div className="font-bold text-gray-800 truncate">
                                  {item.product?.name || item.name || 'Cosmetic Item'}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Qty: {item.quantity || 1} {item.shade?.name ? `• ${item.shade.name}` : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(idx, 'delivered')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    item.status === 'delivered'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title="Mark delivered in this shipment"
                                >
                                  ✓ Delivered
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(idx, 'pending_fulfillment')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    item.status === 'pending_fulfillment'
                                      ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title="Item will arrive in separate delivery"
                                >
                                  ⏳ Arriving Later
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(idx, targetStatus === 'partially_delivered_cancelled' ? 'cancelled' : 'rejected')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    item.status === 'rejected' || item.status === 'cancelled'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title="Cannot fulfill item"
                                >
                                  ✕ {targetStatus === 'partially_delivered_cancelled' ? 'Cancel' : 'Reject'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">
                          Order contains package-level fulfillment items.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 sm:px-6 py-4 border-t border-pink-100/80 bg-gray-50/90 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isChanged || isSubmitting}
                onClick={handleConfirmUpdate}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-xs transition-all ${
                  !isChanged
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    : targetStatus === 'rejected'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                    : 'bg-[#CE4270] hover:bg-[#b83760] text-white cursor-pointer active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Update Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
