import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  FileText,
  HelpCircle,
  XCircle,
  CheckCircle2,
  AlertOctagon,
  Phone,
  MessageCircle,
  Mail,
  Edit2,
  X,
  Package,
  Truck,
  Check,
  MapPin,
  Store,
  Eye,
  Copy,
  ShoppingBag,
  MessageSquare
} from 'lucide-react';

const ORDER_STAGES = [
  { key: 'placed', label: 'Placed', description: 'Order received and queued for store acceptance' },
  { key: 'confirmed', label: 'Confirmed', description: 'Store branch verified and confirmed the order' },
  { key: 'processing', label: 'Processing', description: 'Order accepted, items being prepared at branch' },
  { key: 'packing', label: 'Packed', description: 'Items verified, packed & sealed with quality check' },
  { key: 'ready_to_dispatch', label: 'Ready', description: 'Package staged for delivery partner handover' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Delivery partner / rider is en route to customer' },
  { key: 'delivered', label: 'Delivered', description: 'Order successfully delivered to customer' }
];

export const OrderHistoryScreen = () => {
  const {
    orders,
    userProfile,
    requestCancelOrder,
    cancelSpecificOrderItem,
    executeCancelOrder,
    editOrder,
    reorderOrderItems,
    setCurrentScreen,
    showCancelWarningModal,
    setShowCancelWarningModal,
    pendingCancelOrderId,
    selectedOrderIdForDetails,
    setSelectedOrderIdForDetails
  } = useApp();

  // Two Main Filters: 'all' | 'completed'
  const [activeFilter, setActiveFilter] = useState('all');

  // Full-page order details view state
  const [selectedFullOrder, setSelectedFullOrder] = useState(null);

  // Modals & sub-states
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Edit Order Details state (Address, Mobile, Delivery Instructions, Branch)
  const [editingOrder, setEditingOrder] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [copiedId, setCopiedId] = useState(null);
  const [activeStageNote, setActiveStageNote] = useState({}); // { [orderId]: stageIndex }

  // Live timer tick every second for real-time remaining countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders so each user ONLY sees their own placed orders
  const displayOrders = useMemo(() => {
    return orders.filter(o =>
      !userProfile ? true : (o.phone === userProfile.phone || o.userName === userProfile.name)
    );
  }, [orders, userProfile?.phone, userProfile?.name]);

  // Auto-open order details when navigating from notification or deep link
  useEffect(() => {
    if (selectedOrderIdForDetails && displayOrders.length > 0) {
      const target = displayOrders.find(o =>
        o.id === selectedOrderIdForDetails ||
        String(o.id).toLowerCase().endsWith(String(selectedOrderIdForDetails).toLowerCase())
      );
      if (target) {
        setSelectedFullOrder(target);
      }
    }
  }, [selectedOrderIdForDetails, displayOrders]);

  // Keep selectedFullOrder in sync with orders list
  const currentFullOrder = useMemo(() => {
    if (!selectedFullOrder) return null;
    return displayOrders.find(o => o.id === selectedFullOrder.id) || selectedFullOrder;
  }, [selectedFullOrder, displayOrders]);

  // Counts for the two main filters
  const completedCount = useMemo(() => {
    return displayOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'completed' || s === 'delivered';
    }).length;
  }, [displayOrders]);

  // Filtered orders list based on the two main buttons
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'completed') {
      return displayOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'completed' || s === 'delivered';
      });
    }
    return displayOrders;
  }, [displayOrders, activeFilter]);

  // Helper to get stage index across 7-step standard lifecycle
  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return 6;
    if (s === 'out_for_delivery') return 5;
    if (s === 'ready_to_dispatch') return 4;
    if (s === 'packing') return 3;
    if (s === 'processing') return 2;
    if (s === 'confirmed') return 1;
    if (s === 'placed') return 0;
    if (s === 'partially_delivered' || s === 'partially_delivered_rejected' || s === 'partially_delivered_cancelled') return 5;
    if (s === 'cancelled' || s === 'rejected') return -1;
    return 0;
  };

  const getStatusBadge = (status, rejectionReason) => {
    const s = (status || 'placed').toLowerCase();
    if (s === 'completed' || s === 'delivered') {
      return (
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
          <CheckCircle2 size={12} className="text-emerald-600" /> Completed
        </span>
      );
    }
    if (s === 'partially_delivered' || s === 'partially_delivered_rejected' || s === 'partially_delivered_cancelled') {
      return (
        <span className="bg-violet-50 text-violet-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-violet-200 flex items-center gap-1 shadow-2xs">
          <Truck size={12} className="text-violet-600" /> Partially Delivered
        </span>
      );
    }
    if (s === 'out_for_delivery') {
      return (
        <span className="bg-cyan-50 text-cyan-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-cyan-200 flex items-center gap-1 shadow-2xs">
          <Truck size={12} className="text-cyan-600" /> Out for Delivery
        </span>
      );
    }
    if (s === 'ready_to_dispatch') {
      return (
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1 shadow-2xs">
          <Package size={12} className="text-indigo-600" /> Ready for Dispatch
        </span>
      );
    }
    if (s === 'packing') {
      return (
        <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1 shadow-2xs">
          <Package size={12} className="text-purple-600" /> Packed & Sealed
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 shadow-2xs">
          <CheckCircle2 size={12} className="text-blue-600" /> Confirmed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="bg-gray-100 text-gray-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-gray-200 flex items-center gap-1">
          <XCircle size={12} className="text-gray-500" /> Cancelled
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
          <AlertOctagon size={12} className="text-rose-600" /> Unable to Fulfill
        </span>
      );
    }
    if (s === 'processing') {
      return (
        <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-sky-200 flex items-center gap-1">
          <Clock size={12} className="text-sky-600" /> Processing
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
        <Clock size={12} className="text-amber-600" /> Order Placed
      </span>
    );
  };

  const getItemStatusBadge = (status) => {
    const s = (status || 'placed').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return (
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
          <CheckCircle2 size={11} className="text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === 'pending_fulfillment') {
      return (
        <span className="bg-violet-50 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200 flex items-center gap-1 shadow-2xs">
          <Clock size={11} className="text-violet-500" /> Arriving Separately
        </span>
      );
    }
    if (s === 'rejected' || s === 'cancelled') {
      return (
        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1 shadow-2xs">
          <XCircle size={11} className="text-gray-500" /> {s === 'cancelled' ? 'Cancelled' : 'Unable to Fulfill'}
        </span>
      );
    }
    if (s === 'packing') {
      return (
        <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 shadow-2xs">
          <Package size={11} className="text-purple-600" /> Packed
        </span>
      );
    }
    if (s === 'ready_to_dispatch' || s === 'out_for_delivery') {
      return (
        <span className="bg-cyan-50 text-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200 flex items-center gap-1 shadow-2xs">
          <Truck size={11} className="text-cyan-600" /> In Transit
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs">
        <Clock size={11} className="text-amber-600" /> Processing
      </span>
    );
  };

  const handleCopyId = (id) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {}
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditAddress(order.deliveryAddress || '');
    setEditBranch(order.branch || '');
    setEditPhone(order.phone || order.mobileNumber || userProfile?.phone || '');
    setEditInstructions(order.deliveryInstructions || '');
    setEditError('');
  };

  const handleBackFromOrderDetails = () => {
    setEditingOrder(null);
    setSelectedFullOrder(null);
    if (setSelectedOrderIdForDetails) setSelectedOrderIdForDetails(null);
  };

  // Reset any active edit modal when switching into or out of Order Details
  useEffect(() => {
    setEditingOrder(null);
  }, [selectedFullOrder]);

  /* =======================================================================
     EDIT ORDER DETAILS MODAL (Address, Mobile Number, Delivery Instructions, Branch)
     ======================================================================= */
  const renderEditOrderModal = () => {
    if (!editingOrder) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#FCE4EC] max-w-sm w-full p-5 shadow-2xl space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#FCE4EC]">
            <div>
              <h3 className="text-sm font-extrabold text-[#3A2430]">Edit Order Details</h3>
              <span className="text-[10px] font-semibold text-[#8C7078]">{editingOrder.id}</span>
            </div>
            <button
              onClick={() => setEditingOrder(null)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {editError ? (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-bold">
              {editError}
            </div>
          ) : null}

          {/* Field 1: Contact Mobile Number */}
          <div>
            <label className="text-[11px] font-bold text-[#3A2430] flex items-center gap-1 mb-1">
              <Phone size={12} className="text-[#C2477A]" />
              <span>Contact Mobile Number</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full text-xs p-2.5 bg-[#FFF8FA] border border-[#FCE4EC] rounded-xl focus:border-[#C2477A] focus:bg-white outline-none font-semibold text-[#3A2430]"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Field 2: Delivery Address */}
          <div>
            <label className="text-[11px] font-bold text-[#3A2430] flex items-center gap-1 mb-1">
              <MapPin size={12} className="text-[#C2477A]" />
              <span>Delivery Address</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 bg-[#FFF8FA] border border-[#FCE4EC] rounded-xl focus:border-[#C2477A] focus:bg-white outline-none font-semibold text-[#3A2430]"
              placeholder="Enter full shipping address..."
            />
          </div>

          {/* Field 3: Delivery Instructions */}
          <div>
            <label className="text-[11px] font-bold text-[#3A2430] flex items-center gap-1 mb-1">
              <MessageSquare size={12} className="text-[#C2477A]" />
              <span>Delivery Instructions</span>
            </label>
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 bg-[#FFF8FA] border border-[#FCE4EC] rounded-xl focus:border-[#C2477A] focus:bg-white outline-none font-semibold text-[#3A2430]"
              placeholder="e.g. Leave with security guard, call upon arrival, landmark..."
            />
          </div>

          {/* Field 4: Store Branch */}
          <div>
            <label className="text-[11px] font-bold text-[#3A2430] flex items-center gap-1 mb-1">
              <Store size={12} className="text-[#C2477A]" />
              <span>Fulfillment Branch</span>
            </label>
            <input
              type="text"
              value={editBranch}
              onChange={(e) => setEditBranch(e.target.value)}
              className="w-full text-xs p-2.5 bg-[#FFF8FA] border border-[#FCE4EC] rounded-xl focus:border-[#C2477A] focus:bg-white outline-none font-semibold text-[#3A2430]"
              placeholder="Store branch name"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setEditingOrder(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-[#3A2430] hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={editSubmitting}
              onClick={async () => {
                if (!editPhone.trim()) {
                  setEditError('Mobile number is required.');
                  return;
                }
                if (!editAddress.trim()) {
                  setEditError('Delivery address is required.');
                  return;
                }
                setEditSubmitting(true);
                setEditError('');
                const res = await editOrder(editingOrder.id, {
                  deliveryAddress: editAddress.trim(),
                  branch: editBranch.trim(),
                  phone: editPhone.trim(),
                  mobileNumber: editPhone.trim(),
                  deliveryInstructions: editInstructions.trim()
                });
                setEditSubmitting(false);
                if (res && res.success === false) {
                  setEditError(res.reason || 'Failed to edit order');
                } else {
                  setEditingOrder(null);
                }
              }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#C2477A] hover:bg-[#a83765] shadow-md disabled:opacity-50 cursor-pointer"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =======================================================================
     FULL-PAGE ORDER DETAILS VIEW
     ======================================================================= */
  if (currentFullOrder) {
    const order = currentFullOrder;
    const orderTime = new Date(order.date || order.placedAt).getTime();
    const elapsedMs = Math.max(0, currentTime - orderTime);
    const remainingMs = Math.max(0, (60 * 60 * 1000) - elapsedMs);
    const isWithin60MinWindow = !isNaN(orderTime) && remainingMs > 0;
    const isEditable = (order.status === 'placed' || order.status === 'processing') && isWithin60MinWindow;

    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
    const countdownText = `${remainingMinutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;

    const currentStageIdx = getStageIndex(order.status);
    const isCancelledOrRejected = currentStageIdx === -1;

    return (
      <div className="min-h-screen bg-[#FFF8FA] pb-28 animate-fade-in">
        {/* Full-Page Top Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between shadow-2xs">
          <button
            onClick={handleBackFromOrderDetails}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#C2477A] hover:bg-[#FFF5F8] px-3 py-1.5 rounded-xl border border-[#FCE4EC] transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Orders</span>
          </button>
          <div className="text-center">
            <h1 className="text-xs font-black text-[#3A2430] uppercase tracking-wider">
              Order Details
            </h1>
            <span className="text-[10px] text-[#8C7078] font-bold block truncate max-w-[150px]">
              #{order.id}
            </span>
          </div>
          <button
            onClick={() => setShowSupportModal(true)}
            className="text-xs font-extrabold text-[#C2477A] hover:bg-[#FFF5F8] p-1.5 rounded-xl border border-[#FCE4EC] flex items-center gap-1"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Help</span>
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          {/* Card 1: Order ID, Date & Status Banner */}
          <div className="bg-white rounded-3xl border border-[#FCE4EC] p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#FCE4EC]">
              <div>
                <span className="text-[10px] font-extrabold text-[#8C7078] uppercase tracking-wider block">
                  Order Reference ID
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm sm:text-base font-black text-[#C2477A] tracking-tight">
                    {order.id}
                  </span>
                  <button
                    onClick={() => handleCopyId(order.id)}
                    title="Copy Order ID"
                    className="p-1 rounded-lg hover:bg-[#FCE4EC] text-[#8C7078] hover:text-[#C2477A] transition-colors"
                  >
                    {copiedId === order.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <span className="text-[11px] text-[#8C7078] font-medium block mt-0.5">
                  Placed on {new Date(order.date || order.placedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} (IST)
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(order.status, order.rejectionReason)}
              </div>
            </div>

            {/* 60-Minute Countdown Banner with Edit & Cancel Window (Task 2) */}
            {isEditable && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={16} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900">
                      Edit & Cancel Window Active
                    </h4>
                    <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                      You can modify mobile number, address, or cancel within <span className="font-black text-rose-700">{countdownText}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(order)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit Details
                  </button>
                  <button
                    onClick={() => requestCancelOrder(order.id)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle size={12} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Store Rejection Banner */}
            {order.status === 'rejected' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
                <AlertOctagon size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs">Order Could Not Be Fulfilled:</span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    {order.rejectionReason || 'We were unable to process this order. Please contact our support team for assistance.'}
                  </span>
                </div>
              </div>
            )}

            {/* Partially Delivered Banner */}
            {(order.status === 'partially_delivered' || order.status === 'partially_delivered_rejected' || order.status === 'partially_delivered_cancelled') && (
              <div className="p-3.5 bg-violet-50 border border-violet-200 rounded-2xl text-xs text-violet-900 flex items-start gap-2.5">
                <Truck size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs">Delivered in Multiple Shipments</span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    Some items from your order will be delivered separately. You can track each item's status below.
                  </span>
                </div>
              </div>
            )}

            {/* Cancelled Banner */}
            {order.status === 'cancelled' && (
              <div className="p-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-xs text-gray-800 flex items-start gap-2.5">
                <XCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs">Order Cancelled:</span>
                  <span className="text-[11px] text-gray-600 block mt-0.5">
                    This order was cancelled by the customer within the allowed cancellation window.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Horizontal Process-Line & Realtime Activity Feed */}
          {!isCancelledOrRejected && (
            <div className="bg-white rounded-3xl border border-[#FCE4EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FCE4EC]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FFF0F4] text-[#C2477A] flex items-center justify-center">
                    <Truck size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-[#3A2430] uppercase tracking-wider">
                      Order Journey
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-bold text-emerald-700">
                        Live Tracking Active
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#C2477A] bg-[#FFF0F4] px-2.5 py-1 rounded-full border border-[#FCE4EC]">
                  Stage {Math.min(currentStageIdx + 1, ORDER_STAGES.length)} of {ORDER_STAGES.length}
                </span>
              </div>

              {/* Stepper Process-Line Bar */}
              <div className="pt-2 pb-1 px-1">
                <div className="relative">
                  {/* Background Track */}
                  <div className="absolute top-3.5 left-4 right-4 h-1 bg-[#FCE4EC] rounded-full" />

                  {/* Filled Active Track */}
                  <div
                    className="absolute top-3.5 left-4 h-1 bg-[#C2477A] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (currentStageIdx / (ORDER_STAGES.length - 1)) * 100)}%`
                    }}
                  />

                  {/* 7 Interactive Nodes */}
                  <div className="relative z-10 flex justify-between items-start">
                    {ORDER_STAGES.map((stage, idx) => {
                      const isPassed = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <button
                          key={stage.key}
                          onClick={() => {
                            setActiveStageNote(prev => ({
                              ...prev,
                              [order.id]: prev[order.id] === idx ? null : idx
                            }));
                          }}
                          className="flex flex-col items-center group cursor-pointer focus:outline-none"
                          style={{ width: `${100 / ORDER_STAGES.length}%` }}
                        >
                          {/* Node Icon Circle */}
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                              isPassed
                                ? 'bg-[#C2477A] text-white shadow-2xs'
                                : isCurrent
                                ? 'bg-white text-[#C2477A] border-2 border-[#C2477A] shadow-md ring-3 ring-[#FCE4EC]'
                                : 'bg-white text-gray-300 border border-gray-200'
                            }`}
                          >
                            {isPassed ? (
                              <Check size={11} className="stroke-[3]" />
                            ) : isCurrent ? (
                              <div className="w-2 h-2 rounded-full bg-[#C2477A] animate-pulse" />
                            ) : (
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400">{idx + 1}</span>
                            )}
                          </div>

                          {/* Node Label */}
                          <span
                            className={`mt-1.5 text-[8px] sm:text-[9.5px] font-black text-center leading-tight transition-colors line-clamp-1 ${
                              isCurrent
                                ? 'text-[#C2477A]'
                                : isPassed
                                ? 'text-[#3A2430]'
                                : 'text-gray-400'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stage Note Banner */}
              <div className="p-3.5 bg-gradient-to-r from-[#FFF5F8] to-[#FFF0F4] rounded-2xl border border-[#FCE4EC] text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C2477A] animate-ping shrink-0" />
                  <span className="font-extrabold text-[#3A2430]">
                    Current Status: {ORDER_STAGES[currentStageIdx]?.label || order.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#8C7078] mt-1 font-medium leading-relaxed">
                  {ORDER_STAGES[currentStageIdx]?.description}
                </p>
              </div>

              {/* Live Status History & Activity Feed */}
              <div className="pt-2 border-t border-[#FCE4EC] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-[#3A2430] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-[#C2477A]" />
                    <span>Real-Time Activity Feed</span>
                  </h4>
                  <span className="text-[10px] text-[#8C7078] font-bold">
                    {(order.statusHistory || []).length} Event{((order.statusHistory || []).length === 1 ? '' : 's')}
                  </span>
                </div>

                <div className="space-y-2 relative pl-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#FCE4EC]">
                  {(order.statusHistory && order.statusHistory.length > 0) ? (
                    order.statusHistory.map((item, hIdx) => (
                      <div key={item.id || hIdx} className="relative flex items-start gap-3 text-xs">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#C2477A] ring-4 ring-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs z-10">
                          <Check size={8} className="text-white stroke-[3]" />
                        </div>
                        <div className="flex-1 bg-[#FFF8FA] p-2.5 rounded-xl border border-[#FCE4EC]/70 shadow-2xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-[#3A2430] text-[11px]">
                              {item.title || item.status}
                            </span>
                            <span className="text-[9.5px] text-[#8C7078] font-semibold shrink-0">
                              {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {item.message && (
                            <p className="text-[10.5px] text-[#8C7078] font-medium mt-0.5">
                              {item.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    ORDER_STAGES.slice(0, currentStageIdx + 1).map((st, sIdx) => {
                      const isLatest = sIdx === currentStageIdx;
                      return (
                        <div key={st.key} className="relative flex items-start gap-3 text-xs">
                          <div className={`w-3.5 h-3.5 rounded-full ${isLatest ? 'bg-[#C2477A] animate-pulse' : 'bg-emerald-500'} ring-4 ring-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs z-10`}>
                            <Check size={8} className="text-white stroke-[3]" />
                          </div>
                          <div className="flex-1 bg-[#FFF8FA] p-2.5 rounded-xl border border-[#FCE4EC]/70 shadow-2xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-[#3A2430] text-[11px]">
                                {st.label}
                              </span>
                              <span className="text-[9.5px] text-[#8C7078] font-semibold shrink-0">
                                {isLatest ? 'Active' : 'Completed'}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-[#8C7078] font-medium mt-0.5">
                              {st.description}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Ordered Products Breakdown */}
          <div className="bg-white rounded-3xl border border-[#FCE4EC] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#FCE4EC]">
              <h3 className="text-xs font-extrabold text-[#3A2430] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-[#C2477A]" />
                <span>Ordered Items ({order.items?.length || 0})</span>
              </h3>
              <span className="text-[10px] font-bold text-[#8C7078]">
                Total Items: {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}
              </span>
            </div>

            {/* Multi-Shipment Status Banner if partial delivery or pending fulfillment items */}
            {(order.status?.startsWith('partially_delivered') || (order.items || []).some(it => it.status === 'pending_fulfillment')) && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-violet-600" />
                  <span className="font-extrabold text-xs text-violet-900">
                    Dispatched in Multiple Deliveries
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-violet-100 shadow-2xs">
                    <span className="font-black text-emerald-700 block text-xs">
                      ✓ {(order.items || []).filter(it => it.status === 'delivered').length} Delivered
                    </span>
                    <span className="text-[#8C7078] text-[9.5px]">Received in primary delivery</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-violet-100 shadow-2xs">
                    <span className="font-black text-violet-700 block text-xs">
                      ⏳ {(order.items || []).filter(it => it.status !== 'delivered' && it.status !== 'rejected' && it.status !== 'cancelled').length} Arriving Separately
                    </span>
                    <span className="text-[#8C7078] text-[9.5px]">In dispatch preparation</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {order.items?.map((item, idx) => {
                const itemStatus = item.status || order.status || 'placed';
                const canCancelItem = (itemStatus === 'placed' || itemStatus === 'processing') && isWithin60MinWindow;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded-xl border border-[#FCE4EC] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#FCE4EC]/60 border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] font-extrabold text-xs flex-shrink-0">
                          {item.quantity}x
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[9.5px] font-extrabold text-[#C2477A] uppercase tracking-wider block">
                          {item.product?.brandName || 'SALBEAU LUXE'}
                        </span>
                        <h4 className="font-extrabold text-xs text-[#3A2430] truncate">
                          {item.product?.name || 'Beauty Product'}
                        </h4>
                        {item.shade && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs"
                              style={{ backgroundColor: item.shade.hexColor || '#CE4270' }}
                            />
                            <span className="text-[10px] font-bold text-violet-800">
                              Shade: {item.shade.name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-[#8C7078]">
                            Qty: <strong className="text-[#3A2430]">{item.quantity}</strong> × ₹{item.unitPrice || item.price || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="font-black text-xs text-[#C2477A]">
                        ₹{((item.unitPrice || item.price || 0) * item.quantity).toLocaleString('en-IN')}
                      </span>
                      {getItemStatusBadge(itemStatus)}
                      {canCancelItem && (
                        <button
                          onClick={() => cancelSpecificOrderItem(order.id, idx)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-2 py-0.5 rounded-lg border border-rose-200 text-[9px] transition-all cursor-pointer"
                        >
                          Cancel Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Delivery, Mobile Number, Instructions & Store Details */}
          <div className="bg-white rounded-3xl border border-[#FCE4EC] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#FCE4EC]">
              <h3 className="text-xs font-extrabold text-[#3A2430] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-[#C2477A]" /> Delivery & Contact Details
              </h3>
              {isEditable && (
                <button
                  onClick={() => openEditModal(order)}
                  className="text-[10.5px] font-bold text-[#C2477A] bg-[#FFF5F8] border border-[#FCE4EC] px-2.5 py-1 rounded-xl flex items-center gap-1 hover:bg-[#FCE4EC] transition-all cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>Edit Details</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Shipping Address */}
              <div className="p-3.5 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] space-y-1">
                <span className="text-[10px] font-bold text-[#8C7078] uppercase flex items-center gap-1">
                  <MapPin size={12} className="text-[#C2477A]" /> Shipping Address
                </span>
                <p className="font-bold text-[#3A2430] text-[11px] leading-relaxed">
                  {order.deliveryAddress || 'Standard Registered Delivery Address'}
                </p>
                <p className="text-[10px] text-[#8C7078]">
                  Recipient: <strong>{order.userName || userProfile?.name || 'Customer'}</strong>
                </p>
              </div>

              {/* Mobile Number */}
              <div className="p-3.5 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] space-y-1">
                <span className="text-[10px] font-bold text-[#8C7078] uppercase flex items-center gap-1">
                  <Phone size={12} className="text-[#C2477A]" /> Contact Mobile Number
                </span>
                <p className="font-black text-[#C2477A] text-sm">
                  {order.phone || order.mobileNumber || userProfile?.phone || 'Not provided'}
                </p>
                <p className="text-[10px] text-[#8C7078]">
                  Used by courier for delivery verification and OTP calls.
                </p>
              </div>

              {/* Delivery Instructions (Text Field Display) */}
              <div className="p-3.5 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-[#8C7078] uppercase flex items-center gap-1">
                  <MessageSquare size={12} className="text-[#C2477A]" /> Delivery Instructions
                </span>
                <p className="font-semibold text-[#3A2430] text-[11px] leading-relaxed">
                  {order.deliveryInstructions ? (
                    order.deliveryInstructions
                  ) : (
                    <span className="text-gray-400 italic">No specific delivery instructions provided.</span>
                  )}
                </p>
              </div>

              {/* Store Branch */}
              <div className="p-3.5 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-[#8C7078] uppercase flex items-center gap-1">
                  <Store size={12} className="text-[#C2477A]" /> Fulfillment Branch
                </span>
                <p className="font-bold text-[#3A2430] text-[11px]">
                  {order.branch || 'Salbeau Flagship Store'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Payment Summary & Billing */}
          <div className="bg-white rounded-3xl border border-[#FCE4EC] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-[#3A2430] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#FCE4EC]">
              <FileText size={14} className="text-[#C2477A]" /> Payment & Price Summary
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#8C7078]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[#3A2430]">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-[#8C7078]">
                <span>Standard Delivery:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-[#8C7078]">
                <span>Payment Mode:</span>
                <span className="font-bold text-[#3A2430]">Cash on Delivery (COD)</span>
              </div>
              <div className="pt-2 border-t border-[#FCE4EC] flex justify-between items-center text-sm font-black text-[#3A2430]">
                <span>Total Amount:</span>
                <span className="text-[#C2477A] text-base font-black">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-3 border-t border-[#FCE4EC] flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedReceiptOrder(order)}
                className="flex-1 bg-[#FFF8FA] hover:bg-[#FCE4EC] text-[#3A2430] py-2.5 rounded-xl text-xs font-bold border border-[#FCE4EC] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText size={14} className="text-[#C2477A]" />
                <span>Download / Print Receipt</span>
              </button>

              {reorderOrderItems && (
                <button
                  onClick={() => reorderOrderItems(order)}
                  className="flex-1 bg-[#FCE4EC] hover:bg-[#F5A8C0] text-[#C2477A] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Reorder All Items</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Order Modal */}
        {renderEditOrderModal()}

        {/* Invoice / Receipt Modal */}
        {selectedReceiptOrder && renderReceiptModal(selectedReceiptOrder, () => setSelectedReceiptOrder(null), getItemStatusBadge)}

        {/* Support Modal */}
        {showSupportModal && renderSupportModal(() => setShowSupportModal(false))}
      </div>
    );
  }

  /* =======================================================================
     MAIN ORDERS LIST VIEW (WITH 2 MAIN FILTERS & HORIZONTAL STEPPER)
     ======================================================================= */
  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-extrabold text-[#C2477A] hover:bg-[#FFF5F8] px-2.5 py-1.5 rounded-xl border border-[#FCE4EC] transition-all cursor-pointer"
        >
          <ChevronLeft size={16} /> Home
        </button>
        <h1 className="text-sm font-black text-[#3A2430] uppercase tracking-wider">
          My Orders
        </h1>
        <button
          onClick={() => setShowSupportModal(true)}
          className="text-[#C2477A] font-extrabold text-xs flex items-center gap-1 hover:bg-[#FFF5F8] px-2.5 py-1.5 rounded-xl border border-[#FCE4EC]"
        >
          <HelpCircle size={16} /> Help
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* ONLY TWO MAIN FILTER BUTTONS: 'All Orders' and 'Completed' */}
        <div className="flex items-center gap-2 p-1 bg-white border border-[#FCE4EC] rounded-2xl shadow-2xs">
          {/* Button 1: All Orders */}
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#C2477A] text-white shadow-sm'
                : 'text-[#8C7078] hover:text-[#3A2430] hover:bg-[#FFF8FA]'
            }`}
          >
            <span>All Orders</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FFF0F4] text-[#C2477A]'
              }`}
            >
              {displayOrders.length}
            </span>
          </button>

          {/* Button 2: Completed */}
          <button
            onClick={() => setActiveFilter('completed')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-[#C2477A] text-white shadow-sm'
                : 'text-[#8C7078] hover:text-[#3A2430] hover:bg-[#FFF8FA]'
            }`}
          >
            <CheckCircle2
              size={14}
              className={activeFilter === 'completed' ? 'text-white' : 'text-emerald-600'}
            />
            <span>Completed</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeFilter === 'completed'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#FCE4EC] space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center mx-auto border border-[#FCE4EC]">
              <Package size={28} />
            </div>
            <h3 className="text-sm font-extrabold text-[#3A2430]">
              {activeFilter === 'completed' ? 'No Completed Orders Yet' : 'No Orders Found'}
            </h3>
            <p className="text-xs text-[#8C7078] max-w-xs mx-auto">
              {activeFilter === 'completed'
                ? 'Orders you complete or have successfully delivered will appear here.'
                : 'Explore our catalog and place your first beauty order today.'}
            </p>
            <button
              onClick={() => setCurrentScreen('home')}
              className="mt-2 bg-[#C2477A] hover:bg-[#a83765] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderTime = new Date(order.date || order.placedAt).getTime();
            const elapsedMs = Math.max(0, currentTime - orderTime);
            const remainingMs = Math.max(0, (60 * 60 * 1000) - elapsedMs);
            const isWithin60MinWindow = !isNaN(orderTime) && remainingMs > 0;
            const isEditable = (order.status === 'placed' || order.status === 'processing') && isWithin60MinWindow;

            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
            const countdownText = `${remainingMinutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;

            const currentStageIdx = getStageIndex(order.status);
            const isCancelledOrRejected = currentStageIdx === -1;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#FCE4EC] p-4 sm:p-5 shadow-sm space-y-4 hover:border-[#F5A8C0] transition-all"
              >
                {/* Order Card Top Row: ID, Date & Status Badge */}
                <div className="flex items-start justify-between pb-3 border-b border-[#FCE4EC] gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-[#C2477A]">
                        {order.id}
                      </span>
                      <button
                        onClick={() => handleCopyId(order.id)}
                        title="Copy ID"
                        className="text-[#8C7078] hover:text-[#C2477A] p-0.5"
                      >
                        {copiedId === order.id ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-[#8C7078] font-semibold block mt-0.5">
                      {new Date(order.date || order.placedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status, order.rejectionReason)}
                  </div>
                </div>

                {/* HORIZONTAL PROCESS-LINE / STEPPER PROGRESS */}
                {!isCancelledOrRejected ? (
                  <div className="py-2 px-1">
                    <div className="relative">
                      {/* Gray Connector Track */}
                      <div className="absolute top-2 left-2 right-2 h-1 bg-[#FCE4EC] rounded-full" />

                      {/* Filled Progress Track */}
                      <div
                        className="absolute top-2 left-2 h-1 bg-[#C2477A] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (currentStageIdx / (ORDER_STAGES.length - 1)) * 100)}%`
                        }}
                      />

                      {/* Stepper Stage Dots */}
                      <div className="relative z-10 flex justify-between items-center">
                        {ORDER_STAGES.map((stage, idx) => {
                          const isPassed = idx < currentStageIdx;
                          const isCurrent = idx === currentStageIdx;

                          return (
                            <button
                              key={stage.key}
                              onClick={() => {
                                setActiveStageNote(prev => ({
                                  ...prev,
                                  [order.id]: prev[order.id] === idx ? null : idx
                                }));
                              }}
                              className="flex flex-col items-center group cursor-pointer focus:outline-none"
                              title={`${stage.label}: ${stage.description}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                  isPassed
                                    ? 'bg-[#C2477A] text-white shadow-2xs'
                                    : isCurrent
                                    ? 'bg-white border-2 border-[#C2477A] ring-2 ring-[#FCE4EC] shadow-sm'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                {isPassed ? (
                                  <Check size={8} className="stroke-[3]" />
                                ) : isCurrent ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#C2477A] animate-pulse" />
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Status Pill */}
                    <div className="mt-2.5 flex items-center justify-between text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C2477A] animate-ping" />
                        <span className="font-extrabold text-[#3A2430]">
                          {ORDER_STAGES[currentStageIdx]?.label || order.status}
                        </span>
                        <span className="text-[#8C7078] hidden sm:inline">
                          • {ORDER_STAGES[currentStageIdx]?.description}
                        </span>
                      </div>
                      <span className="font-bold text-[#C2477A] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FCE4EC] shrink-0">
                        Step {currentStageIdx + 1} of {ORDER_STAGES.length}
                      </span>
                    </div>

                    {/* Expandable Clickable Stage Note */}
                    {activeStageNote[order.id] !== undefined && activeStageNote[order.id] !== null && (
                      <div className="mt-2.5 p-2.5 bg-[#FFF5F8] rounded-xl border border-[#FCE4EC] text-[11px] animate-fade-in flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#C2477A] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#3A2430]">
                            {ORDER_STAGES[activeStageNote[order.id]]?.label}:
                          </span>{' '}
                          <span className="text-[#8C7078]">
                            {ORDER_STAGES[activeStageNote[order.id]]?.description}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center gap-2">
                    {order.status === 'cancelled' ? (
                      <>
                        <XCircle size={15} className="text-gray-500 flex-shrink-0" />
                        <span className="text-[11px] text-gray-700 font-semibold">
                          Order was cancelled. Tracking timeline paused.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon size={15} className="text-rose-600 flex-shrink-0" />
                        <span className="text-[11px] text-rose-800 font-semibold">
                          Order was rejected by branch. {order.rejectionReason}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Bottom Row: Total & VIEW DETAILS directly following status tracker */}
                <div className="pt-3 border-t border-[#FCE4EC] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#8C7078] font-bold uppercase tracking-wider block">
                      Total
                    </span>
                    <span className="text-sm font-black text-[#3A2430]">
                      ₹{order.totalAmount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details Button opens the full-page order details screen */}
                    <button
                      onClick={() => setSelectedFullOrder(order)}
                      className="bg-[#C2477A] hover:bg-[#a83765] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View Details</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Order Modal */}
      {renderEditOrderModal()}

      {/* Invoice / Receipt Modal */}
      {selectedReceiptOrder && renderReceiptModal(selectedReceiptOrder, () => setSelectedReceiptOrder(null), getItemStatusBadge)}

      {/* Support Modal */}
      {showSupportModal && renderSupportModal(() => setShowSupportModal(false))}

      {/* Cancellation Limit Warning Modal */}
      {showCancelWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto mb-3">
              <AlertOctagon size={24} />
            </div>

            <h3 className="font-extrabold text-base text-[#3A2430]">Cancellation Limit Warning</h3>
            <p className="text-xs text-[#8C7078] mt-1 mb-5">
              You have cancelled 3 consecutive orders. Future late cancellations will incur a late cancellation fee on store settlement.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelWarningModal(false)}
                className="w-1/2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={() => executeCancelOrder(pendingCancelOrderId)}
                className="w-1/2 bg-rose-600 text-white py-3 rounded-xl font-bold cursor-pointer"
              >
                Proceed Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Helper Modal Renderers */
const renderReceiptModal = (order, onClose, getItemStatusBadge) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FCE4EC]">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-[#C2477A]" />
          <div>
            <h3 className="font-extrabold text-sm text-[#3A2430]">Official Store Receipt</h3>
            <span className="text-[10px] text-[#8C7078]">{order.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] space-y-1">
          <div className="flex justify-between">
            <span className="text-[#8C7078]">Store Branch:</span>
            <span className="font-bold text-[#3A2430]">{order.branch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8C7078]">Date & Time:</span>
            <span className="font-medium text-[#3A2430]">
              {new Date(order.date || order.placedAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8C7078]">Overall Status:</span>
            <span className="font-bold uppercase text-[#C2477A]">{order.status}</span>
          </div>
          {order.phone && (
            <div className="flex justify-between">
              <span className="text-[#8C7078]">Contact Phone:</span>
              <span className="font-bold text-[#3A2430]">{order.phone}</span>
            </div>
          )}
          {order.deliveryInstructions && (
            <div className="flex justify-between">
              <span className="text-[#8C7078]">Instructions:</span>
              <span className="font-semibold text-[#3A2430] truncate max-w-[180px]">{order.deliveryInstructions}</span>
            </div>
          )}
        </div>

        <div className="border border-[#FCE4EC] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-[#FCE4EC] text-[#C2477A] font-bold uppercase">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FCE4EC]/60">
              {order.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 font-medium text-[#3A2430]">{it.product?.name}</td>
                  <td className="p-2 text-center">
                    {getItemStatusBadge(it.status || order.status)}
                  </td>
                  <td className="p-2 text-center font-bold">{it.quantity}</td>
                  <td className="p-2 text-right font-bold text-[#C2477A]">₹{(it.unitPrice || it.price || 0) * it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-[#FCE4EC] flex justify-between items-center text-sm font-extrabold text-[#3A2430]">
          <span>Grand Total</span>
          <span className="text-[#C2477A]">₹{order.totalAmount}</span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-5 bg-[#C2477A] text-white py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-[#a83765]"
      >
        Close Receipt
      </button>
    </div>
  </div>
);

const renderSupportModal = (onClose) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center font-bold mx-auto mb-3">
        <HelpCircle size={24} />
      </div>

      <h3 className="font-extrabold text-base text-[#3A2430]">Salbeau Store Support</h3>
      <p className="text-xs text-[#8C7078] mt-1 mb-5">
        Need assistance with your order, verification, or branch collection?
      </p>

      <div className="space-y-2.5 text-left">
        <a
          href="tel:+918007252328"
          className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
        >
          <Phone size={18} className="text-[#C2477A]" />
          <div>
            <span className="block text-xs">Call Customer Desk</span>
            <span className="text-[10px] text-[#8C7078] font-normal">+91 800 725 2328 (Toll Free)</span>
          </div>
        </a>

        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noreferrer"
          className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
        >
          <MessageCircle size={18} className="text-emerald-600" />
          <div>
            <span className="block text-xs">WhatsApp Branch Helpdesk</span>
            <span className="text-[10px] text-[#8C7078] font-normal">+91 98765 43210 (Instant Chat)</span>
          </div>
        </a>

        <a
          href="mailto:support@salbeau.com"
          className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]"
        >
          <Mail size={18} className="text-[#C2477A]" />
          <div>
            <span className="block text-xs">Email Salbeau Support</span>
            <span className="text-[10px] text-[#8C7078] font-normal">support@salbeau.com</span>
          </div>
        </a>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-gray-200"
      >
        Close Helpdesk
      </button>
    </div>
  </div>
);
