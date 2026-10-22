import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { CancelWarningModal } from './CancelWarningModal';
import { getSafeImageSource } from '../../utils/imageUtils';

const ORDER_STAGES = [
  { key: 'processing', label: 'Processing', description: 'Order confirmed & preparing at branch' },
  { key: 'shipped', label: 'Shipped', description: 'Picked up by courier delivery partner' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Out with local delivery executive' },
  { key: 'completed', label: 'Completed', description: 'Successfully delivered to customer' }
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
    pendingCancelOrderId
  } = useApp();

  // Two Main Filters: 'all' | 'completed'
  const [activeFilter, setActiveFilter] = useState('all');

  // Full-page order details view state
  const [selectedFullOrder, setSelectedFullOrder] = useState(null);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [editingOrder, setEditingOrder] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
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

  // Keep full order in sync if status changes
  const currentFullOrder = useMemo(() => {
    if (!selectedFullOrder) return null;
    return displayOrders.find(o => o.id === selectedFullOrder.id) || selectedFullOrder;
  }, [selectedFullOrder, displayOrders]);

  // Count for Completed orders
  const completedCount = useMemo(() => {
    return displayOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'completed' || s === 'delivered';
    }).length;
  }, [displayOrders]);

  // Filtered orders according to the two main buttons: 'All Orders' vs 'Completed'
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'completed') {
      return displayOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'completed' || s === 'delivered';
      });
    }
    return displayOrders;
  }, [displayOrders, activeFilter]);

  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return 3;
    if (s === 'out_for_delivery') return 2;
    if (s === 'shipped') return 1;
    if (s === 'cancelled' || s === 'rejected') return -1;
    return 0; // 'placed', 'processing', 'preparing'
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return {
        container: 'border border-[#2E7D32] bg-emerald-50',
        text: 'text-[#2E7D32]',
        label: 'COMPLETED',
        icon: 'checkmark-circle'
      };
    }
    if (s === 'out_for_delivery') {
      return {
        container: 'border border-[#1976D2] bg-blue-50',
        text: 'text-[#1976D2]',
        label: 'OUT FOR DELIVERY',
        icon: 'car-outline'
      };
    }
    if (s === 'shipped') {
      return {
        container: 'border border-[#5E35B1] bg-indigo-50',
        text: 'text-[#5E35B1]',
        label: 'SHIPPED',
        icon: 'cube-outline'
      };
    }
    if (s === 'cancelled') {
      return {
        container: 'border border-[#8C7078] bg-gray-100',
        text: 'text-[#8C7078]',
        label: 'CANCELLED',
        icon: 'close-circle-outline'
      };
    }
    if (s === 'rejected') {
      return {
        container: 'border border-[#C62828] bg-rose-50',
        text: 'text-[#C62828]',
        label: 'REJECTED BY STORE',
        icon: 'alert-circle-outline'
      };
    }
    return {
      container: 'border border-[#C2477A] bg-[#FFF5F8]',
      text: 'text-[#C2477A]',
      label: 'PROCESSING',
      icon: 'time-outline'
    };
  };

  const getItemStatusBadgeRN = (status) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return (
        <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-row items-center">
          <Ionicons name="checkmark-circle" size={11} color="#15803D" style={{ marginRight: 3 }} />
          <Text className="text-[10px] font-bold text-emerald-700">Delivered</Text>
        </View>
      );
    }
    if (s === 'rejected') {
      return (
        <View className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex-row items-center">
          <Ionicons name="close-circle" size={11} color="#BE123C" style={{ marginRight: 3 }} />
          <Text className="text-[10px] font-bold text-rose-700">Rejected</Text>
        </View>
      );
    }
    if (s === 'cancelled') {
      return (
        <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 flex-row items-center">
          <Ionicons name="ban-outline" size={11} color="#4B5563" style={{ marginRight: 3 }} />
          <Text className="text-[10px] font-bold text-gray-600">Cancelled</Text>
        </View>
      );
    }
    return (
      <View className="bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex-row items-center">
        <Ionicons name="time-outline" size={11} color="#B45309" style={{ marginRight: 3 }} />
        <Text className="text-[10px] font-bold text-amber-700">Processing</Text>
      </View>
    );
  };

  const formatDate = (isoStringOrDateStr) => {
    if (!isoStringOrDateStr) return '07 Sep 2026';
    if (isoStringOrDateStr.includes('Feb') || isoStringOrDateStr.includes('Jan') || isoStringOrDateStr.includes('Dec') || isoStringOrDateStr.includes('Nov')) return isoStringOrDateStr;
    try {
      const d = new Date(isoStringOrDateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '07 Sep 2026';
    }
  };

  const openEditModal = (o) => {
    setEditingOrder(o);
    setEditAddress(o.deliveryAddress || '');
    setEditBranch(o.branch || '');
    setEditPhone(o.phone || o.mobileNumber || userProfile?.phone || '');
    setEditInstructions(o.deliveryInstructions || '');
  };

  const handleBackFromOrderDetails = () => {
    setEditingOrder(null);
    setSelectedFullOrder(null);
  };

  // Reset any active edit modal when switching into or out of Order Details
  useEffect(() => {
    setEditingOrder(null);
  }, [selectedFullOrder]);

  /* =======================================================================
     EDIT ORDER DETAILS MODAL (REACT NATIVE)
     ======================================================================= */
  const renderEditOrderModal = () => {
    if (!editingOrder) return null;

    return (
      <Modal
        visible={!!editingOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingOrder(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-[#FCE4EC] shadow-2xl">
            <View className="flex-row justify-between items-center pb-2 border-b border-[#FCE4EC] mb-3">
              <View>
                <Text className="text-sm font-black text-[#3A2430]">Edit Order Details</Text>
                <Text className="text-[10px] font-semibold text-[#8C7078]">{editingOrder.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Ionicons name="close" size={20} color="#8C7078" />
              </TouchableOpacity>
            </View>

            {/* Field 1: Contact Mobile Number */}
            <Text className="text-[11px] font-bold text-[#3A2430] mb-1">
              Contact Mobile Number *
            </Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-xl p-2.5 text-xs text-[#3A2430] mb-2.5 font-bold"
            />

            {/* Field 2: Delivery Address */}
            <Text className="text-[11px] font-bold text-[#3A2430] mb-1">
              Delivery Address *
            </Text>
            <TextInput
              value={editAddress}
              onChangeText={setEditAddress}
              multiline
              numberOfLines={2}
              placeholder="Enter updated delivery address"
              className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-xl p-2.5 text-xs text-[#3A2430] mb-2.5"
            />

            {/* Field 3: Delivery Instructions */}
            <Text className="text-[11px] font-bold text-[#3A2430] mb-1">
              Delivery Instructions
            </Text>
            <TextInput
              value={editInstructions}
              onChangeText={setEditInstructions}
              multiline
              numberOfLines={2}
              placeholder="e.g. Ring bell, leave with security, landmark..."
              className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-xl p-2.5 text-xs text-[#3A2430] mb-2.5"
            />

            {/* Field 4: Store Branch */}
            <Text className="text-[11px] font-bold text-[#3A2430] mb-1">Branch / Store</Text>
            <TextInput
              value={editBranch}
              onChangeText={setEditBranch}
              placeholder="Branch name"
              className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-xl p-2.5 text-xs text-[#3A2430] mb-4"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setEditingOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 items-center bg-gray-50"
              >
                <Text className="text-xs font-bold text-[#3A2430]">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={editSubmitting}
                onPress={async () => {
                  if (!editPhone.trim()) {
                    Alert.alert('Required Field', 'Please enter a contact mobile number.');
                    return;
                  }
                  if (!editAddress.trim()) {
                    Alert.alert('Required Field', 'Please enter a delivery address.');
                    return;
                  }
                  setEditSubmitting(true);
                  const res = await editOrder(editingOrder.id, {
                    deliveryAddress: editAddress.trim(),
                    branch: editBranch.trim(),
                    phone: editPhone.trim(),
                    mobileNumber: editPhone.trim(),
                    deliveryInstructions: editInstructions.trim()
                  });
                  setEditSubmitting(false);
                  if (res && res.success === false) {
                    Alert.alert('Edit Error', res.reason || 'Could not update order');
                  } else {
                    setEditingOrder(null);
                    Alert.alert('Order Updated', 'Your delivery details and contact number have been updated.');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#C2477A] items-center shadow-md"
              >
                <Text className="text-xs font-bold text-white">
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCancelModal = () => (
    <CancelWarningModal
      visible={showCancelWarningModal}
      onClose={() => setShowCancelWarningModal(false)}
      onConfirm={() => executeCancelOrder(pendingCancelOrderId)}
      orderId={pendingCancelOrderId}
    />
  );

  /* =======================================================================
     FULL-PAGE ORDER DETAILS VIEW (REACT NATIVE)
     ======================================================================= */
  if (currentFullOrder) {
    const o = currentFullOrder;
    const badge = getStatusBadgeStyle(o.status);
    const orderTime = new Date(o.date || o.placedAt).getTime();
    const elapsedMs = Math.max(0, currentTime - orderTime);
    const remainingMs = Math.max(0, (60 * 60 * 1000) - elapsedMs);
    const isWithin60MinWindow = !isNaN(orderTime) && remainingMs > 0;
    const isEditable = (o.status === 'placed' || o.status === 'processing') && isWithin60MinWindow;

    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
    const countdownText = `${remainingMinutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;

    const currentStageIdx = getStageIndex(o.status);
    const isCancelledOrRejected = currentStageIdx === -1;

    return (
      <View className="flex-1 bg-[#FFF8FA]">
        {/* Full-Page Top Navigation Header */}
        <View className="bg-white px-4 py-3.5 border-b border-[#FCE4EC] flex-row items-center justify-between shadow-2xs">
          <TouchableOpacity
            onPress={handleBackFromOrderDetails}
            className="flex-row items-center bg-[#FFF5F8] px-3 py-1.5 rounded-full border border-[#FCE4EC]"
          >
            <Ionicons name="chevron-back" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] ml-1">Back</Text>
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-sm font-black text-[#3A2430]">Order Details</Text>
            <Text className="text-[10px] font-bold text-[#8C7078]">#{o.id}</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Salbeau Helpdesk', 'Call Customer Desk at +91 800 725 2328 or contact support@salbeau.com.');
            }}
            className="p-2 rounded-full bg-[#FFF5F8] border border-[#FCE4EC]"
          >
            <Ionicons name="help-circle-outline" size={18} color="#C2477A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
          {/* Section 1: Order Reference ID, Date & Status Banner */}
          <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
            <View className="flex-row justify-between items-start pb-3 border-b border-[#FCE4EC]">
              <View>
                <Text className="text-[10px] font-bold text-[#8C7078] uppercase tracking-wider">
                  Order Reference ID
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-base font-black text-[#C2477A] mr-2">
                    {o.id}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Clipboard.setString(o.id);
                      Alert.alert('Copied', `Order ID ${o.id} copied to clipboard.`);
                    }}
                  >
                    <Ionicons name="copy-outline" size={14} color="#8C7078" />
                  </TouchableOpacity>
                </View>
                <Text className="text-[11px] text-[#8C7078] mt-0.5 font-medium">
                  Placed on {formatDate(o.date || o.placedAt)} (IST)
                </Text>
              </View>

              <View className={`px-3 py-1 rounded-full ${badge.container}`}>
                <Text className={`text-[10px] font-black tracking-wider ${badge.text}`}>
                  {badge.label}
                </Text>
              </View>
            </View>

            {/* 60-Minute Countdown Action Banner (Task 2) */}
            {isEditable && (
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mt-3">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="time-outline" size={14} color="#B45309" style={{ marginRight: 4 }} />
                  <Text className="text-xs font-black text-amber-900">
                    60-Min Edit & Cancel Window Active
                  </Text>
                </View>
                <Text className="text-[11px] text-amber-800 font-semibold mb-2">
                  You have <Text className="font-black text-rose-700">{countdownText}</Text> left to modify mobile number, address, or cancel.
                </Text>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => openEditModal(o)}
                    className="flex-1 bg-amber-600 py-2 rounded-xl flex-row items-center justify-center gap-1 shadow-2xs"
                  >
                    <Ionicons name="create-outline" size={13} color="#FFF" />
                    <Text className="text-xs font-bold text-white">Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => requestCancelOrder(o.id)}
                    className="flex-1 bg-rose-600 py-2 rounded-xl flex-row items-center justify-center gap-1 shadow-2xs"
                  >
                    <Ionicons name="close-circle-outline" size={13} color="#FFF" />
                    <Text className="text-xs font-bold text-white">Cancel Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Store Rejection Notice */}
            {o.status === 'rejected' && (
              <View className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mt-3">
                <Text className="text-xs font-bold text-rose-900">Order Could Not Be Fulfilled:</Text>
                <Text className="text-[11px] text-rose-700 mt-0.5">
                  {o.rejectionReason || 'We were unable to process this order. Please contact our support team for assistance.'}
                </Text>
              </View>
            )}
          </View>

          {/* Section 2: Full Horizontal Process-Line / Stepper */}
          {!isCancelledOrRejected && (
            <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
              <View className="flex-row justify-between items-center pb-2 border-b border-[#FCE4EC] mb-3">
                <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wider">
                  Order Tracking Timeline
                </Text>
                <Text className="text-[10px] font-bold text-[#C2477A] bg-[#FFF5F8] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                  Stage {currentStageIdx + 1} of 4
                </Text>
              </View>

              <View className="py-2">
                <View className="relative">
                  {/* Track Line */}
                  <View className="absolute top-3.5 left-4 right-4 h-1 bg-[#FCE4EC] rounded-full" />
                  <View
                    className="absolute top-3.5 left-4 h-1 bg-[#C2477A] rounded-full"
                    style={{ width: `${(currentStageIdx / (ORDER_STAGES.length - 1)) * 100}%` }}
                  />

                  {/* 4 Interactive Clickable Nodes */}
                  <View className="flex-row justify-between items-start">
                    {ORDER_STAGES.map((st, idx) => {
                      const isPassed = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <TouchableOpacity
                          key={st.key}
                          onPress={() => {
                            setActiveStageNote(prev => ({
                              ...prev,
                              [o.id]: prev[o.id] === idx ? null : idx
                            }));
                          }}
                          className="items-center"
                          style={{ width: '24%' }}
                        >
                          <View
                            className={`w-7 h-7 rounded-full items-center justify-center ${
                              isPassed
                                ? 'bg-[#C2477A]'
                                : isCurrent
                                ? 'bg-white border-2 border-[#C2477A]'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            {isPassed ? (
                              <Ionicons name="checkmark" size={13} color="#FFF" />
                            ) : isCurrent ? (
                              <View className="w-2 h-2 rounded-full bg-[#C2477A]" />
                            ) : (
                              <Text className="text-[9px] font-bold text-gray-400">{idx + 1}</Text>
                            )}
                          </View>
                          <Text
                            className={`mt-1.5 text-[9px] font-black text-center ${
                              isCurrent ? 'text-[#C2477A]' : isPassed ? 'text-[#3A2430]' : 'text-gray-400'
                            }`}
                          >
                            {st.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Stage Info Note */}
                <View className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-xl p-2.5 mt-4">
                  <Text className="text-[11px] font-black text-[#3A2430]">
                    Current Status: {ORDER_STAGES[currentStageIdx]?.label}
                  </Text>
                  <Text className="text-[10px] text-[#8C7078] mt-0.5">
                    {ORDER_STAGES[currentStageIdx]?.description}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Section 3: Ordered Products Breakdown */}
          <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
            <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wider pb-2 border-b border-[#FCE4EC] mb-3">
              Ordered Items ({(o.items || []).length})
            </Text>

            {(o.items || []).map((it, idx) => {
              const itemStatus = it.status || o.status || 'placed';
              const canCancelItem = (itemStatus === 'placed' || itemStatus === 'processing') && isWithin60MinWindow;

              return (
                <View
                  key={idx}
                  className="bg-[#FFF5F8] rounded-2xl p-3 mb-2.5 border border-[#FCE4EC] flex-row justify-between items-center"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-12 h-12 rounded-xl bg-white border border-[#FCE4EC] overflow-hidden mr-2.5 items-center justify-center">
                      {it.product?.image ? (
                        <Image source={getSafeImageSource(it.product.image)} className="w-full h-full object-cover" />
                      ) : (
                        <Text className="text-xs font-black text-[#C2477A]">{it.quantity || 1}x</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[9px] font-bold text-[#C2477A] uppercase">
                        {it.product?.brandName || 'SALBEAU LUXE'}
                      </Text>
                      <Text className="text-xs font-extrabold text-[#3A2430]" numberOfLines={1}>
                        {it.product?.name || 'Beauty Product'}
                      </Text>
                      {it.shade && (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <View
                            style={{ backgroundColor: it.shade.hexColor || '#CE4270' }}
                            className="w-2 h-2 rounded-full border border-gray-200"
                          />
                          <Text className="text-[9.5px] font-bold text-violet-800">
                            Shade: {it.shade.name}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[10px] text-[#8C7078] font-semibold mt-0.5">
                        Qty: {it.quantity || 1} × ₹{it.unitPrice || it.price || 0}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-xs font-black text-[#C2477A] mb-1">
                      ₹{(((it.unitPrice || it.price || 0) * (it.quantity || 1))).toLocaleString('en-IN')}
                    </Text>
                    {getItemStatusBadgeRN(itemStatus)}
                    {canCancelItem && (
                      <TouchableOpacity
                        onPress={() => cancelSpecificOrderItem(o.id, idx)}
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

          {/* Section 4: Shipping Address, Mobile Number, Delivery Instructions & Store Details */}
          <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
            <View className="flex-row justify-between items-center pb-2 border-b border-[#FCE4EC] mb-2">
              <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wider">
                Delivery & Contact Details
              </Text>
              {isEditable && (
                <TouchableOpacity
                  onPress={() => openEditModal(o)}
                  className="bg-[#FFF5F8] border border-[#FCE4EC] px-2.5 py-1 rounded-xl flex-row items-center gap-1"
                >
                  <Ionicons name="create-outline" size={11} color="#C2477A" />
                  <Text className="text-[10px] font-bold text-[#C2477A]">Edit Details</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Shipping Address */}
            <View className="py-1.5">
              <Text className="text-[10px] font-bold text-[#8C7078] uppercase">Shipping Address:</Text>
              <Text className="text-xs font-extrabold text-[#3A2430] mt-0.5 leading-relaxed">
                {o.deliveryAddress || 'Standard Registered Delivery Address'}
              </Text>
            </View>

            {/* Contact Mobile Number */}
            <View className="py-2 border-t border-[#FCE4EC] mt-1">
              <Text className="text-[10px] font-bold text-[#8C7078] uppercase">Contact Mobile Number:</Text>
              <Text className="text-xs font-black text-[#C2477A] mt-0.5">
                {o.phone || o.mobileNumber || userProfile?.phone || 'Not provided'}
              </Text>
            </View>

            {/* Delivery Instructions */}
            <View className="py-2 border-t border-[#FCE4EC] mt-1">
              <Text className="text-[10px] font-bold text-[#8C7078] uppercase">Delivery Instructions:</Text>
              <Text className="text-xs font-bold text-[#3A2430] mt-0.5 leading-relaxed">
                {o.deliveryInstructions ? o.deliveryInstructions : 'No special delivery instructions provided.'}
              </Text>
            </View>

            {/* Store Branch */}
            <View className="py-2 border-t border-[#FCE4EC] mt-1">
              <Text className="text-[10px] font-bold text-[#8C7078] uppercase">Fulfillment Branch:</Text>
              <Text className="text-xs font-extrabold text-[#3A2430] mt-0.5">
                {o.branch || 'Salbeau Flagship Branch'}
              </Text>
            </View>
          </View>

          {/* Section 5: Billing & Payment Summary */}
          <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
            <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wider pb-2 border-b border-[#FCE4EC] mb-2">
              Payment & Price Summary
            </Text>

            <View className="flex-row justify-between py-1">
              <Text className="text-xs text-[#8C7078]">Items Subtotal:</Text>
              <Text className="text-xs font-bold text-[#3A2430]">₹{o.totalAmount}</Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-xs text-[#8C7078]">Delivery Fee:</Text>
              <Text className="text-xs font-bold text-emerald-600">FREE</Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-xs text-[#8C7078]">Payment Method:</Text>
              <Text className="text-xs font-bold text-[#3A2430]">Cash on Delivery (COD)</Text>
            </View>

            <View className="flex-row justify-between pt-2 border-t border-[#FCE4EC] mt-1">
              <Text className="text-sm font-black text-[#3A2430]">Grand Total:</Text>
              <Text className="text-base font-black text-[#C2477A]">₹{o.totalAmount}</Text>
            </View>
          </View>

          {/* Quick Action: Reorder */}
          {reorderOrderItems && (
            <TouchableOpacity
              onPress={() => {
                reorderOrderItems(o);
                Alert.alert('Reordered', 'All items from this order have been added to your cart.');
              }}
              className="bg-[#C2477A] py-3.5 rounded-2xl items-center shadow-md mb-3"
            >
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                Reorder All Items
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Edit Order Modal (appears right on Order Details page) */}
        {renderEditOrderModal()}

        {/* Cancel Warning Modal */}
        {renderCancelModal()}
      </View>
    );
  }

  /* =======================================================================
     MAIN ORDERS LIST VIEW (REACT NATIVE)
     ======================================================================= */
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="bg-white">
      {/* Header Title */}
      <Text className="text-2xl font-black text-[#3A2430] mb-4 mt-1">
        My Orders
      </Text>

      {/* ONLY TWO MAIN FILTER BUTTONS: 'All Orders' and 'Completed' */}
      <View className="flex-row p-1 bg-[#FFF8FA] border border-[#FCE4EC] rounded-2xl mb-4">
        {/* Button 1: All Orders */}
        <TouchableOpacity
          onPress={() => setActiveFilter('all')}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
            activeFilter === 'all' ? 'bg-[#C2477A] shadow-xs' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-xs font-black mr-1.5 ${
              activeFilter === 'all' ? 'text-white' : 'text-[#8C7078]'
            }`}
          >
            All Orders
          </Text>
          <View
            className={`px-1.5 py-0.5 rounded-full ${
              activeFilter === 'all' ? 'bg-white/20' : 'bg-[#FFF0F4]'
            }`}
          >
            <Text
              className={`text-[10px] font-black ${
                activeFilter === 'all' ? 'text-white' : 'text-[#C2477A]'
              }`}
            >
              {displayOrders.length}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Button 2: Completed */}
        <TouchableOpacity
          onPress={() => setActiveFilter('completed')}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
            activeFilter === 'completed' ? 'bg-[#C2477A] shadow-xs' : 'bg-transparent'
          }`}
        >
          <Ionicons
            name="checkmark-circle"
            size={13}
            color={activeFilter === 'completed' ? '#FFF' : '#15803D'}
            style={{ marginRight: 4 }}
          />
          <Text
            className={`text-xs font-black mr-1.5 ${
              activeFilter === 'completed' ? 'text-white' : 'text-[#8C7078]'
            }`}
          >
            Completed
          </Text>
          <View
            className={`px-1.5 py-0.5 rounded-full ${
              activeFilter === 'completed' ? 'bg-white/20' : 'bg-emerald-50'
            }`}
          >
            <Text
              className={`text-[10px] font-black ${
                activeFilter === 'completed' ? 'text-white' : 'text-emerald-700'
              }`}
            >
              {completedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Orders Cards List */}
      {filteredOrders.length === 0 ? (
        <View className="p-8 items-center bg-[#FFF8FA] rounded-3xl border border-[#FCE4EC] my-4">
          <Ionicons name="cube-outline" size={40} color="#C2477A" style={{ marginBottom: 12 }} />
          <Text className="text-sm font-black text-[#3A2430] mb-1">
            {activeFilter === 'completed' ? 'No Completed Orders' : 'No Orders Found'}
          </Text>
          <Text className="text-xs text-[#8C7078] text-center mb-4">
            {activeFilter === 'completed'
              ? 'When orders are delivered, they will show under Completed.'
              : 'You have not placed any orders yet.'}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentScreen && setCurrentScreen('home')}
            className="bg-[#C2477A] px-5 py-2.5 rounded-xl"
          >
            <Text className="text-xs font-black text-white">Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredOrders.map((o) => {
          const badge = getStatusBadgeStyle(o.status);
          const formattedOrderNumber = o.id.startsWith('SB-') ? o.id.replace('SB-', 'FG-') : o.id;
          const orderTime = new Date(o.date || o.placedAt).getTime();
          const elapsedMs = Math.max(0, currentTime - orderTime);
          const remainingMs = Math.max(0, (60 * 60 * 1000) - elapsedMs);
          const isWithin60MinWindow = !isNaN(orderTime) && remainingMs > 0;
          const isEditable = (o.status === 'placed' || o.status === 'processing') && isWithin60MinWindow;

          const remainingMinutes = Math.floor(remainingMs / 60000);
          const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
          const countdownText = `${remainingMinutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;

          const currentStageIdx = getStageIndex(o.status);
          const isCancelledOrRejected = currentStageIdx === -1;

          return (
            <View
              key={o.id}
              className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs"
            >
              {/* Top Row: Order ID, Date & Status Pill */}
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-sm font-black text-[#3A2430]">
                    Order #{formattedOrderNumber}
                  </Text>
                  <Text className="text-xs font-semibold text-[#8C7078] mt-0.5">
                    {formatDate(o.date || o.placedAt)}
                  </Text>
                </View>

                <View className="items-end">
                  <View className={`px-2.5 py-0.5 rounded-full ${badge.container}`}>
                    <Text className={`text-[10px] font-black tracking-wider ${badge.text}`}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* HORIZONTAL PROCESS-LINE / STEPPER WITH CLICKABLE STATUS BUTTONS */}
              {!isCancelledOrRejected ? (
                <View className="py-2.5 my-1 border-t border-[#FCE4EC]">
                  <View className="relative">
                    {/* Background Gray Connector */}
                    <View className="absolute top-3 left-4 right-4 h-1 bg-[#FCE4EC] rounded-full" />
                    {/* Filled Progress Bar */}
                    <View
                      className="absolute top-3 left-4 h-1 bg-[#C2477A] rounded-full"
                      style={{
                        width: `${(currentStageIdx / (ORDER_STAGES.length - 1)) * 100}%`
                      }}
                    />

                    {/* 4 Clickable Stage Buttons */}
                    <View className="flex-row justify-between items-start">
                      {ORDER_STAGES.map((st, idx) => {
                        const isPassed = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <TouchableOpacity
                            key={st.key}
                            onPress={() => {
                              setActiveStageNote(prev => ({
                                ...prev,
                                [o.id]: prev[o.id] === idx ? null : idx
                              }));
                            }}
                            className="items-center"
                            style={{ width: '24%' }}
                          >
                            <View
                              className={`w-6 h-6 rounded-full items-center justify-center ${
                                isPassed
                                  ? 'bg-[#C2477A]'
                                  : isCurrent
                                  ? 'bg-white border-2 border-[#C2477A]'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              {isPassed ? (
                                <Ionicons name="checkmark" size={12} color="#FFF" />
                              ) : isCurrent ? (
                                <View className="w-1.5 h-1.5 rounded-full bg-[#C2477A]" />
                              ) : (
                                <Text className="text-[8px] font-bold text-gray-400">{idx + 1}</Text>
                              )}
                            </View>
                            <Text
                              className={`mt-1 text-[9px] font-extrabold text-center ${
                                isCurrent
                                  ? 'text-[#C2477A] font-black'
                                  : isPassed
                                  ? 'text-[#3A2430]'
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

                  {/* Stage description note on click */}
                  {activeStageNote[o.id] !== undefined && activeStageNote[o.id] !== null && (
                    <View className="mt-2.5 p-2 bg-[#FFF5F8] rounded-xl border border-[#FCE4EC]">
                      <Text className="text-[10px] font-black text-[#3A2430]">
                        {ORDER_STAGES[activeStageNote[o.id]]?.label}:
                      </Text>
                      <Text className="text-[9.5px] text-[#8C7078] mt-0.5">
                        {ORDER_STAGES[activeStageNote[o.id]]?.description}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="py-2 px-2.5 my-1 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center gap-1.5">
                  <Ionicons name="alert-circle-outline" size={14} color="#8C7078" />
                  <Text className="text-[10px] font-bold text-gray-700">
                    {o.status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected by Branch'}
                  </Text>
                </View>
              )}

              {/* Bottom Row: Total & VIEW DETAILS button directly following status tracker */}
              <View className="flex-row justify-between items-center pt-2.5 border-t border-[#FCE4EC] mt-1">
                <View>
                  <Text className="text-[9.5px] font-bold text-[#8C7078] uppercase">Total</Text>
                  <Text className="text-sm font-black text-[#3A2430]">
                    ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* View Details Button opens Full-Page Order Details Screen */}
                <TouchableOpacity
                  onPress={() => setSelectedFullOrder(o)}
                  className="bg-[#C2477A] px-4 py-2 rounded-xl flex-row items-center gap-1 shadow-2xs"
                >
                  <Ionicons name="eye-outline" size={13} color="#FFF" />
                  <Text className="text-xs font-black text-white">View Details</Text>
                  <Ionicons name="chevron-forward" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Modals */}
      {renderEditOrderModal()}
      {renderCancelModal()}
    </ScrollView>
  );
};
