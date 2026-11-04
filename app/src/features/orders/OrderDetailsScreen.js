import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Clipboard,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { CancelWarningModal } from './CancelWarningModal';
import { getSafeImageSource } from '../../utils/imageUtils';

export const ORDER_STAGES = [
  { key: 'placed', label: 'Placed', description: 'Order received and queued for store acceptance', icon: 'time-outline' },
  { key: 'confirmed', label: 'Confirmed', description: 'Store branch verified and confirmed the order', icon: 'checkmark-outline' },
  { key: 'processing', label: 'Processing', description: 'Order accepted, items being prepared at branch', icon: 'construct-outline' },
  { key: 'packing', label: 'Packed & Sealed', description: 'Items verified, packed & sealed with quality check', icon: 'cube-outline' },
  { key: 'ready_to_dispatch', label: 'Ready', description: 'Package staged for delivery partner handover', icon: 'car-outline' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Delivery partner / rider is en route to customer', icon: 'navigate-outline' },
  { key: 'delivered', label: 'Delivered', description: 'Order successfully delivered to customer', icon: 'checkmark-circle-outline' }
];

export const getStageIndex = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'delivered') return 6;
  if (s === 'out_for_delivery') return 5;
  if (s === 'ready_to_dispatch' || s === 'shipped') return 4;
  if (s === 'packing') return 3;
  if (s === 'processing') return 2;
  if (s === 'confirmed') return 1;
  if (s === 'placed') return 0;
  if (s.startsWith('partially_delivered')) return 5;
  if (s === 'cancelled' || s === 'rejected') return -1;
  return 0;
};

export const getStatusBadgeStyle = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered' || s === 'completed') {
    return {
      container: 'border border-[#2E7D32] bg-emerald-50',
      text: 'text-[#2E7D32]',
      label: 'DELIVERED',
      icon: 'checkmark-circle'
    };
  }
  if (s === 'out_for_delivery') {
    return {
      container: 'border border-violet-300 bg-violet-50',
      text: 'text-violet-700',
      label: 'OUT FOR DELIVERY',
      icon: 'bicycle'
    };
  }
  if (s === 'shipped' || s === 'ready_to_dispatch') {
    return {
      container: 'border border-blue-300 bg-blue-50',
      text: 'text-blue-700',
      label: 'SHIPPED',
      icon: 'airplane'
    };
  }
  if (s === 'packing') {
    return {
      container: 'border border-amber-300 bg-amber-50',
      text: 'text-amber-800',
      label: 'PACKED',
      icon: 'cube'
    };
  }
  if (s === 'processing') {
    return {
      container: 'border border-amber-300 bg-amber-50',
      text: 'text-amber-800',
      label: 'PREPARING',
      icon: 'construct'
    };
  }
  if (s === 'confirmed') {
    return {
      container: 'border border-sky-300 bg-sky-50',
      text: 'text-sky-800',
      label: 'CONFIRMED',
      icon: 'checkmark-circle'
    };
  }
  if (s === 'cancelled') {
    return {
      container: 'border border-gray-300 bg-gray-100',
      text: 'text-gray-600',
      label: 'CANCELLED',
      icon: 'close-circle'
    };
  }
  if (s === 'rejected') {
    return {
      container: 'border border-rose-300 bg-rose-50',
      text: 'text-rose-700',
      label: 'REJECTED',
      icon: 'alert-circle'
    };
  }
  return {
    container: 'border border-[#B64F7D] bg-[#FFFFFF]',
    text: 'text-[#B64F7D]',
    label: 'ORDER PLACED',
    icon: 'time'
  };
};

export const safeCopyToClipboard = (text) => {
  try {
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(text);
      return true;
    }
  } catch (_) {}
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  return false;
};

export const OrderDetailsScreen = ({ order: propOrder, onBack }) => {
  const {
    orders = [],
    userProfile,
    selectedOrderIdForDetails,
    setSelectedOrderIdForDetails,
    setCurrentScreen,
    requestCancelOrder,
    cancelSpecificOrderItem,
    executeCancelOrder,
    editOrder,
    reorderOrderItems,
    addToCart,
    showCancelWarningModal,
    setShowCancelWarningModal,
    pendingCancelOrderId
  } = useApp();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeStageNoteIdx, setActiveStageNoteIdx] = useState(null);
  const [reorderSuccess, setReorderSuccess] = useState(false);

  // Edit Order modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Keep live time ticking for remaining 60-min window countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find the target order
  const order = useMemo(() => {
    if (propOrder) return propOrder;
    if (selectedOrderIdForDetails) {
      const found = orders.find(o => o.id === selectedOrderIdForDetails);
      if (found) return found;
    }
    return orders[0] || null;
  }, [propOrder, selectedOrderIdForDetails, orders]);

  const handleCopyId = () => {
    if (!order?.id) return;
    const ok = safeCopyToClipboard(order.id);
    if (ok) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } else {
      Alert.alert('Order ID', order.id);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (setSelectedOrderIdForDetails) setSelectedOrderIdForDetails(null);
      setCurrentScreen('orders');
    }
  };

  const openEditModal = () => {
    if (!order) return;
    setEditPhone(order.phone || order.mobileNumber || userProfile?.phone || '');
    setEditAddress(order.deliveryAddress || '');
    setEditInstructions(order.deliveryInstructions || '');
    setEditBranch(order.branch || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!order) return;
    if (!editPhone.trim()) {
      Alert.alert('Required Field', 'Please enter a contact mobile number.');
      return;
    }
    if (!editAddress.trim()) {
      Alert.alert('Required Field', 'Please enter a delivery address.');
      return;
    }
    setIsSubmittingEdit(true);
    const res = await editOrder(order.id, {
      deliveryAddress: editAddress.trim(),
      branch: editBranch.trim(),
      phone: editPhone.trim(),
      mobileNumber: editPhone.trim(),
      deliveryInstructions: editInstructions.trim()
    });
    setIsSubmittingEdit(false);
    if (res && res.success === false) {
      Alert.alert('Edit Error', res.reason || 'Could not update order');
    } else {
      setIsEditing(false);
      Alert.alert('Order Updated', 'Delivery and contact details have been successfully updated.');
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    try {
      if (reorderOrderItems) {
        await reorderOrderItems(order.id);
      } else if (order.items && order.items.length > 0 && addToCart) {
        order.items.forEach(item => {
          if (item.product) {
            addToCart(item.product, item.shade || null, item.quantity || 1);
          }
        });
      }
      setReorderSuccess(true);
      setTimeout(() => setReorderSuccess(false), 3000);
      Alert.alert(
        'Items Added to Bag',
        'All available items from this order have been added to your shopping bag.',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Bag', onPress: () => setCurrentScreen('cart') }
        ]
      );
    } catch (e) {
      Alert.alert('Reorder', 'Could not reorder items. Please try again.');
    }
  };

  if (!order) {
    return (
      <View className="flex-1 bg-[#FFFFFF] items-center justify-center p-6">
        <Ionicons name="document-text-outline" size={48} color="#B64F7D" />
        <Text className="text-base font-bold text-[#352832] mt-3">Order Not Found</Text>
        <Text className="text-xs text-[#8A7B85] text-center mt-1 mb-4">
          The requested order details could not be loaded.
        </Text>
        <TouchableOpacity
          onPress={handleGoBack}
          className="bg-[#B64F7D] px-5 py-2.5 rounded-xl"
        >
          <Text className="text-xs font-bold text-white">Back to My Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const badge = getStatusBadgeStyle(order.status);
  const currentStageIdx = getStageIndex(order.status);
  const isCancelledOrRejected = currentStageIdx === -1;

  const orderTime = new Date(order.date || order.placedAt).getTime();
  const elapsedMs = Math.max(0, currentTime - orderTime);
  const remainingMs = Math.max(0, (60 * 60 * 1000) - elapsedMs);
  const isWithin60MinWindow = !isNaN(orderTime) && remainingMs > 0;
  const isEditable = (order.status === 'placed' || order.status === 'processing') && isWithin60MinWindow;

  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
  const countdownText = `${remainingMinutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;

  // Delivery estimation text
  const estimatedDeliveryText = useMemo(() => {
    if (order.status === 'delivered' || order.status === 'completed') {
      return `Delivered on ${new Date(order.date || order.placedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    const d = new Date(orderTime + 3 * 24 * 60 * 60 * 1000);
    return `Estimated by ${d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}`;
  }, [order, orderTime]);

  // Financial calculations
  const itemsSubtotal = (order.items || []).reduce((sum, it) => {
    const price = Number(it.unitPrice || it.price || 0);
    const qty = Number(it.quantity || 1);
    return sum + (price * qty);
  }, 0);

  const deliveryFee = Number(order.deliveryFee ?? 0);
  const discountAmount = Number(order.discount ?? order.couponDiscount ?? 0);
  const totalAmount = Number(order.totalAmount ?? (itemsSubtotal + deliveryFee - discountAmount));
  const gstAmount = Math.round(itemsSubtotal * 0.18); // 18% inclusive GST indicator

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      {/* ── TOP HEADER ────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          shadowColor: '#B64F7D',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2
        }}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={handleGoBack}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1
          }}
          className="items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color="#B64F7D" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-base font-extrabold text-[#352832]">Order Details</Text>
          <Text className="text-[11px] font-semibold text-[#8A7B85]">#{order.id}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Salbeau Concierge',
              'Need help with this order?\n\nEmail: support@salbeau.com\nHelpline: +91 800 725 2328\nAvailable: Mon-Sat, 9 AM - 9 PM'
            );
          }}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1
          }}
          className="items-center justify-center"
        >
          <Ionicons name="help-buoy-outline" size={18} color="#B64F7D" />
        </TouchableOpacity>
      </View>

      {/* ── MAIN SCROLLABLE CONTENT ───────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: ORDER REFERENCE & STATUS BANNER */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2
          }}
          className="p-4 mb-4"
        >
          <View className="flex-row justify-between items-start pb-3 border-b border-[#F0E3EA]">
            <View className="flex-1 mr-2">
              <Text className="text-[10px] font-bold text-[#8A7B85] uppercase tracking-wider">
                Order Reference ID
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-base font-extrabold text-[#B64F7D] mr-2">
                  {order.id}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyId}
                  activeOpacity={0.7}
                  className="bg-[#FFFFFF] border border-[#F0E3EA] px-2 py-0.5 rounded-md flex-row items-center gap-1"
                >
                  <Ionicons name="copy-outline" size={11} color="#B64F7D" />
                  <Text className="text-[10px] font-bold text-[#B64F7D]">
                    {copiedToast ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${badge.container}`}>
              <Ionicons name={badge.icon} size={11} color="#B64F7D" />
              <Text className={`text-[10px] font-black tracking-wider ${badge.text}`}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View className="pt-3 flex-row justify-between items-center">
            <View>
              <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Placed On</Text>
              <Text className="text-xs font-semibold text-[#352832] mt-0.5">
                {new Date(order.date || order.placedAt || Date.now()).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Delivery Status</Text>
              <Text className="text-xs font-bold text-[#B64F7D] mt-0.5">
                {estimatedDeliveryText}
              </Text>
            </View>
          </View>

          {/* 60-Minute Edit Window Banner */}
          {isEditable && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Ionicons name="timer-outline" size={16} color="#B45309" />
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-amber-900">
                    Modifiable Window Active
                  </Text>
                  <Text className="text-[10px] text-amber-700">
                    Address or mobile details can be updated for next {countdownText}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={openEditModal}
                className="bg-white border border-amber-300 px-2.5 py-1 rounded-lg"
              >
                <Text className="text-[10px] font-bold text-amber-900">Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rejection / Cancellation alerts */}
          {order.status === 'rejected' && (
            <View className="bg-rose-50 border border-rose-200 rounded-xl p-3 mt-3">
              <Text className="text-xs font-bold text-rose-900">Order Could Not Be Fulfilled:</Text>
              <Text className="text-[11px] text-rose-700 mt-0.5">
                {order.rejectionReason || 'We were unable to process this order. Our team is available 24/7 to assist.'}
              </Text>
            </View>
          )}
        </View>

        {/* CARD 2: SEVEN-STAGE TRACKING TIMELINE */}
        {!isCancelledOrRejected && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 2
            }}
            className="p-4 mb-4"
          >
            <View className="flex-row justify-between items-center pb-2 border-b border-[#F0E3EA] mb-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="git-network-outline" size={15} color="#B64F7D" />
                <Text className="text-xs font-extrabold text-[#352832] uppercase tracking-wider">
                  Tracking Timeline
                </Text>
              </View>
              <Text className="text-[10px] font-bold text-[#B64F7D] bg-[#FFFFFF] px-2 py-0.5 rounded-full border border-[#F0E3EA]">
                Stage {Math.min(currentStageIdx + 1, ORDER_STAGES.length)} of {ORDER_STAGES.length}
              </Text>
            </View>

            <View className="py-2">
              <View className="relative">
                {/* Background Connecting Line */}
                <View className="absolute top-3.5 left-4 right-4 h-1 bg-[#F0E3EA] rounded-full" />
                {/* Filled Progress Bar */}
                <View
                  className="absolute top-3.5 left-4 h-1 bg-[#B64F7D] rounded-full"
                  style={{
                    width: `${Math.min(100, (currentStageIdx / (ORDER_STAGES.length - 1)) * 100)}%`
                  }}
                />

                {/* 7 Interactive Stage Nodes */}
                <View className="flex-row justify-between items-start">
                  {ORDER_STAGES.map((st, idx) => {
                    const isPassed = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <TouchableOpacity
                        key={st.key}
                        activeOpacity={0.7}
                        onPress={() => {
                          setActiveStageNoteIdx(prev => (prev === idx ? null : idx));
                        }}
                        className="items-center"
                        style={{ width: `${100 / ORDER_STAGES.length}%` }}
                      >
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isPassed
                              ? 'bg-[#B64F7D]'
                              : isCurrent
                              ? 'bg-white border-2 border-[#B64F7D]'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          {isPassed ? (
                            <Ionicons name="checkmark" size={13} color="#FFF" />
                          ) : isCurrent ? (
                            <View className="w-2 h-2 rounded-full bg-[#B64F7D]" />
                          ) : (
                            <Text className="text-[9px] font-bold text-gray-400">{idx + 1}</Text>
                          )}
                        </View>
                        <Text
                          className={`mt-1.5 text-[8.5px] font-extrabold text-center ${
                            isCurrent
                              ? 'text-[#B64F7D]'
                              : isPassed
                              ? 'text-[#352832]'
                              : 'text-gray-400'
                          }`}
                        >
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Dynamic Stage Note */}
              <View className="bg-[#FFFFFF] border border-[#F0E3EA] rounded-xl p-3 mt-4">
                <Text className="text-xs font-extrabold text-[#352832]">
                  {activeStageNoteIdx != null
                    ? `${ORDER_STAGES[activeStageNoteIdx]?.label} (Stage ${activeStageNoteIdx + 1})`
                    : `Current Status: ${ORDER_STAGES[currentStageIdx]?.label}`}
                </Text>
                <Text className="text-[11px] text-[#8A7B85] mt-0.5 leading-relaxed">
                  {activeStageNoteIdx != null
                    ? ORDER_STAGES[activeStageNoteIdx]?.description
                    : ORDER_STAGES[currentStageIdx]?.description}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CARD 3: ORDERED ITEMS BREAKDOWN */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2
          }}
          className="p-4 mb-4"
        >
          <View className="flex-row justify-between items-center pb-2 border-b border-[#F0E3EA] mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="bag-handle-outline" size={15} color="#B64F7D" />
              <Text className="text-xs font-extrabold text-[#352832] uppercase tracking-wider">
                Ordered Items ({(order.items || []).length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleReorder}
              className="bg-[#FFFFFF] border border-[#F0E3EA] px-2.5 py-1 rounded-lg flex-row items-center gap-1"
            >
              <Ionicons name="repeat-outline" size={12} color="#B64F7D" />
              <Text className="text-[10px] font-bold text-[#B64F7D]">Reorder All</Text>
            </TouchableOpacity>
          </View>

          {(order.items || []).map((it, idx) => {
            const itemPrice = Number(it.unitPrice || it.price || 0);
            const itemQty = Number(it.quantity || 1);
            const lineTotal = itemPrice * itemQty;
            const itemStatus = it.status || order.status || 'placed';
            const canCancelItem = (itemStatus === 'placed' || itemStatus === 'processing') && isWithin60MinWindow;

            // Fallback image: item image -> product image -> null
            const itemImage = it.image || it.product?.image || null;

            return (
              <View
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#F0E3EA',
                  borderWidth: 1,
                  borderRadius: 16
                }}
                className="p-3 mb-2.5 flex-row justify-between items-center"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-13 h-13 rounded-xl bg-white border border-[#F0E3EA] overflow-hidden mr-3 items-center justify-center p-1">
                    {itemImage ? (
                      <Image
                        source={getSafeImageSource(itemImage)}
                        style={{ width: '88%', height: '88%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name="sparkles" size={20} color="#B64F7D" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-[9.5px] font-bold text-[#B64F7D] uppercase tracking-wider">
                      {it.product?.brandName || it.brand || 'SALBEAU'}
                    </Text>
                    <Text className="text-xs font-extrabold text-[#352832]" numberOfLines={1}>
                      {it.product?.name || it.name || 'Cosmetic Product'}
                    </Text>

                    {it.shade && (
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <View
                          style={{ backgroundColor: it.shade.hexColor || it.shade.hex || '#CE4270' }}
                          className="w-2.5 h-2.5 rounded-full border border-gray-300"
                        />
                        <Text className="text-[10px] font-semibold text-[#8A7B85]" numberOfLines={1}>
                          Shade: {it.shade.name || it.shade.color_name}
                        </Text>
                      </View>
                    )}

                    <Text className="text-[10px] text-[#8A7B85] font-semibold mt-0.5">
                      Qty: {itemQty} × ₹{itemPrice.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xs font-black text-[#B64F7D] mb-1">
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </Text>
                  {canCancelItem && (
                    <TouchableOpacity
                      onPress={() => cancelSpecificOrderItem(order.id, idx)}
                      className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1"
                    >
                      <Text className="text-[9px] font-bold text-rose-600">Cancel Item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* CARD 4: DELIVERY & CONTACT DETAILS */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2
          }}
          className="p-4 mb-4"
        >
          <View className="flex-row justify-between items-center pb-2 border-b border-[#F0E3EA] mb-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={15} color="#B64F7D" />
              <Text className="text-xs font-extrabold text-[#352832] uppercase tracking-wider">
                Delivery & Contact Details
              </Text>
            </View>
            {isEditable && (
              <TouchableOpacity
                onPress={openEditModal}
                className="bg-[#FFFFFF] border border-[#F0E3EA] px-2.5 py-1 rounded-lg flex-row items-center gap-1"
              >
                <Ionicons name="create-outline" size={11} color="#B64F7D" />
                <Text className="text-[10px] font-bold text-[#B64F7D]">Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recipient & Address */}
          <View className="py-2">
            <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Recipient Name:</Text>
            <Text className="text-xs font-extrabold text-[#352832] mt-0.5">
              {order.userName || userProfile?.name || 'Customer'}
            </Text>
          </View>

          <View className="py-2 border-t border-[#F0E3EA]">
            <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Shipping Address:</Text>
            <Text className="text-xs font-semibold text-[#352832] mt-0.5 leading-relaxed">
              {order.deliveryAddress || 'Registered Delivery Address'}
            </Text>
          </View>

          {/* Contact Mobile Number */}
          <View className="py-2 border-t border-[#F0E3EA]">
            <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Contact Mobile Number:</Text>
            <Text className="text-xs font-black text-[#B64F7D] mt-0.5">
              {order.phone || order.mobileNumber || userProfile?.phone || 'Not provided'}
            </Text>
          </View>

          {/* Delivery Instructions */}
          <View className="py-2 border-t border-[#F0E3EA]">
            <Text className="text-[10px] font-bold text-[#8A7B85] uppercase">Delivery Instructions:</Text>
            <Text className="text-xs font-medium text-[#352832] mt-0.5 leading-relaxed">
              {order.deliveryInstructions || 'No special delivery instructions provided.'}
            </Text>
          </View>
        </View>

        {/* CARD 5: PAYMENT SUMMARY */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2
          }}
          className="p-4 mb-4"
        >
          <View className="flex-row items-center gap-1.5 pb-2 border-b border-[#F0E3EA] mb-3">
            <Ionicons name="receipt-outline" size={15} color="#B64F7D" />
            <Text className="text-xs font-extrabold text-[#352832] uppercase tracking-wider">
              Payment Summary
            </Text>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-[#8A7B85] font-medium">Item Subtotal</Text>
              <Text className="text-xs font-bold text-[#352832]">₹{itemsSubtotal.toLocaleString('en-IN')}</Text>
            </View>

            {discountAmount > 0 && (
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-emerald-600 font-medium">Discounts & Offers</Text>
                <Text className="text-xs font-bold text-emerald-600">-₹{discountAmount.toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-[#8A7B85] font-medium">Delivery & Handling Fee</Text>
              <Text className="text-xs font-bold text-emerald-600">
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[11px] text-[#8A7B85] font-medium">Estimated Taxes (GST 18% incl.)</Text>
              <Text className="text-[11px] font-semibold text-[#8A7B85]">₹{gstAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View className="border-t border-[#F0E3EA] pt-2.5 mt-1 flex-row justify-between items-center">
              <View>
                <Text className="text-sm font-black text-[#352832]">Total Payable</Text>
                <Text className="text-[10px] text-[#8A7B85]">
                  Payment Mode: {order.paymentMethod || 'Cash on Delivery (COD)'}
                </Text>
              </View>
              <Text className="text-lg font-black text-[#B64F7D]">
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* BOTTOM ACTION BAR: REORDER BUTTON */}
        <TouchableOpacity
          onPress={handleReorder}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#B64F7D',
            shadowColor: '#B64F7D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4
          }}
          className="rounded-2xl py-3.5 px-5 flex-row items-center justify-center gap-2 mb-3"
        >
          <Ionicons name="repeat" size={17} color="#FFFFFF" />
          <Text className="text-xs font-black uppercase text-white tracking-wider">
            Reorder All Items (Buy Again)
          </Text>
        </TouchableOpacity>

        {/* Cancel Order Option if allowed */}
        {isWithin60MinWindow && !isCancelledOrRejected && (
          <TouchableOpacity
            onPress={() => requestCancelOrder(order.id)}
            className="py-2 items-center"
          >
            <Text className="text-xs font-bold text-rose-600 underline">
              Cancel Order (Within 60-Minute Window)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── EDIT ORDER MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={isEditing}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditing(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-[#F0E3EA] shadow-2xl">
            <View className="flex-row justify-between items-center pb-2 border-b border-[#F0E3EA] mb-3">
              <View>
                <Text className="text-sm font-black text-[#352832]">Edit Order Details</Text>
                <Text className="text-[10px] font-semibold text-[#8A7B85]">#{order.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={20} color="#8A7B85" />
              </TouchableOpacity>
            </View>

            <Text className="text-[11px] font-bold text-[#352832] mb-1">
              Contact Mobile Number *
            </Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              className="bg-[#FFFFFF] border border-[#F0E3EA] rounded-xl p-2.5 text-xs text-[#352832] mb-2.5 font-bold"
            />

            <Text className="text-[11px] font-bold text-[#352832] mb-1">
              Delivery Address *
            </Text>
            <TextInput
              value={editAddress}
              onChangeText={setEditAddress}
              multiline
              numberOfLines={2}
              placeholder="Enter updated delivery address"
              className="bg-[#FFFFFF] border border-[#F0E3EA] rounded-xl p-2.5 text-xs text-[#352832] mb-2.5"
            />

            <Text className="text-[11px] font-bold text-[#352832] mb-1">
              Delivery Instructions
            </Text>
            <TextInput
              value={editInstructions}
              onChangeText={setEditInstructions}
              multiline
              numberOfLines={2}
              placeholder="e.g. Ring bell, leave with security, landmark..."
              className="bg-[#FFFFFF] border border-[#F0E3EA] rounded-xl p-2.5 text-xs text-[#352832] mb-2.5"
            />

            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 items-center bg-gray-50"
              >
                <Text className="text-xs font-bold text-[#352832]">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isSubmittingEdit}
                onPress={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-[#B64F7D] items-center shadow-md"
              >
                <Text className="text-xs font-bold text-white">
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Warning Modal */}
      <CancelWarningModal
        visible={showCancelWarningModal}
        onClose={() => setShowCancelWarningModal(false)}
        onConfirm={() => executeCancelOrder(pendingCancelOrderId)}
        orderId={pendingCancelOrderId}
      />
    </View>
  );
};

