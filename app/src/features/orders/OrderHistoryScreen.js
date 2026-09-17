import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { CancelWarningModal } from './CancelWarningModal';

export const OrderHistoryScreen = () => {
  const {
    orders,
    userProfile,
    requestCancelOrder,
    cancelSpecificOrderItem,
    executeCancelOrder,
    showCancelWarningModal,
    setShowCancelWarningModal,
    pendingCancelOrderId
  } = useApp();

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Filter orders so each user ONLY sees their own placed orders
  const displayOrders = orders.filter(o =>
    !userProfile ? true : (o.phone === userProfile.phone || o.userName === userProfile.name)
  );

  const getStatusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return {
        container: 'border border-[#2E7D32] bg-white',
        text: 'text-[#2E7D32]',
        label: 'DELIVERED',
      };
    }
    if (s === 'partially_delivered') {
      return {
        container: 'border border-[#00796B] bg-white',
        text: 'text-[#00796B]',
        label: 'PARTIALLY DELIVERED',
      };
    }
    if (s === 'partially_delivered_rejected') {
      return {
        container: 'border border-[#E65100] bg-white',
        text: 'text-[#E65100]',
        label: 'PARTIAL (ITEM REJECTED)',
      };
    }
    if (s === 'partially_delivered_cancelled') {
      return {
        container: 'border border-[#6A1B9A] bg-white',
        text: 'text-[#6A1B9A]',
        label: 'PARTIAL (CANCELLED)',
      };
    }
    if (s === 'cancelled') {
      return {
        container: 'border border-[#8C7078] bg-white',
        text: 'text-[#8C7078]',
        label: 'CANCELLED',
      };
    }
    if (s === 'rejected') {
      return {
        container: 'border border-[#C62828] bg-white',
        text: 'text-[#C62828]',
        label: 'REJECTED BY STORE',
      };
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return {
        container: 'border border-[#1976D2] bg-white',
        text: 'text-[#1976D2]',
        label: 'SHIPPED',
      };
    }
    return {
      container: 'border border-[#C2477A] bg-white',
      text: 'text-[#C2477A]',
      label: 'PROCESSING',
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
          <Text className="text-[10px] font-bold text-rose-700">Rejected by Store</Text>
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="bg-white">
      {/* Header Title */}
      <Text className="text-2xl font-black text-[#3A2430] mb-5 mt-1">
        My Orders
      </Text>

      {/* Order Cards List matching Reference UI */}
      {displayOrders.map((o) => {
        const badge = getStatusBadgeStyle(o.status);
        const formattedOrderNumber = o.id.startsWith('SB-') ? o.id.replace('SB-', 'FG-') : o.id;
        const isSelectedDetails = selectedOrderDetails === o.id;
        const totalItemsCount = (o.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
        const orderTime = new Date(o.date || o.placedAt).getTime();
        const elapsedMs = Date.now() - orderTime;
        const isWithinGraceWindow = !isNaN(orderTime) && elapsedMs <= 15 * 60 * 1000;

        return (
          <View
            key={o.id}
            className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs"
          >
            {/* Top Row: Order ID, Date & Status Pill */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-col">
                <Text className="text-sm font-extrabold text-[#3A2430]">
                  Order #{formattedOrderNumber}
                </Text>
                <Text className="text-xs font-semibold text-[#8C7078] mt-0.5">
                  {formatDate(o.date || o.placedAt)}
                </Text>
              </View>

              <View className={`px-3 py-1 rounded-full ${badge.container}`}>
                <Text className={`text-[10px] font-extrabold tracking-wider ${badge.text}`}>
                  {badge.label}
                </Text>
              </View>
            </View>

            {/* Divider Line */}
            <View className="border-b border-[#FCE4EC] my-3" />

            {/* Product Image Thumbnails Row with Per-Item Status Badges */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {(o.items || []).map((item, idx) => {
                const imgUri = item?.product?.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300';
                const itemSt = (item.status || o.status || 'placed').toLowerCase();

                let iconName = "time-outline";
                let iconColor = "#B45309";
                let badgeBg = "bg-amber-100";

                if (itemSt === 'delivered' || itemSt === 'completed') {
                  iconName = "checkmark-circle";
                  iconColor = "#15803D";
                  badgeBg = "bg-emerald-100";
                } else if (itemSt === 'rejected') {
                  iconName = "close-circle";
                  iconColor = "#BE123C";
                  badgeBg = "bg-rose-100";
                } else if (itemSt === 'cancelled') {
                  iconName = "ban-outline";
                  iconColor = "#4B5563";
                  badgeBg = "bg-gray-200";
                }

                return (
                  <View key={idx} className="relative mr-2.5">
                    <View className="w-14 h-14 rounded-2xl overflow-hidden bg-[#FFF5F8] border border-[#FCE4EC] justify-center items-center">
                      <Image source={{ uri: imgUri }} className="w-full h-full object-cover" />
                    </View>
                    <View className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${badgeBg} border border-white`}>
                      <Ionicons name={iconName} size={11} color={iconColor} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Row: Total Amount with Item Count & View Details Link */}
            <View className="flex-row justify-between items-center pt-1">
              <Text className="text-xs font-semibold text-[#8C7078]">
                Total Amount: <Text className="text-sm font-black text-[#C2477A]">₹{o.totalAmount.toLocaleString('en-IN')}</Text>{' '}
                <Text className="text-[11px] font-bold text-[#8C7078]">({totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'})</Text>
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedOrderDetails(isSelectedDetails ? null : o.id)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-xs font-extrabold text-[#C2477A]">
                  View Details
                </Text>
                <Ionicons name="arrow-forward" size={13} color="#C2477A" style={{ transform: [{ rotate: '-45deg' }] }} />
              </TouchableOpacity>
            </View>

            {/* Expanded Order Details & Cancel Option */}
            {isSelectedDetails && (
              <View className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-2xl p-3 mt-3">
                <Text className="text-xs font-bold text-[#3A2430] mb-1">Order Details</Text>
                <Text className="text-[11px] text-[#8C7078] mb-0.5">Branch: {o.branch || 'MG Road Branch'}</Text>
                <Text className="text-[11px] text-[#8C7078] mb-2">Payment Method: Cash on Delivery (COD)</Text>

                <View className="pt-2 border-t border-[#FCE4EC]">
                  <Text className="text-[11px] font-extrabold text-[#3A2430] mb-2 uppercase tracking-wide">
                    Items & Item Status
                  </Text>
                  {(o.items || []).map((it, i) => {
                    const itemStatus = it.status || o.status || 'placed';
                    const canCancelItem = (itemStatus === 'placed' || itemStatus === 'processing') && isWithinGraceWindow;

                    return (
                      <View key={i} className="bg-white rounded-2xl p-3 mb-2 border border-[#FCE4EC] flex-row justify-between items-center shadow-2xs">
                        <View className="flex-1 mr-2">
                          <Text className="text-[11px] font-bold text-[#3A2430]">
                            {it?.quantity || 1}x {it?.product?.name || 'Beauty Product'}
                          </Text>
                          <Text className="text-[11px] font-extrabold text-[#C2477A] mt-0.5">
                            ₹{((it.unitPrice || it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View className="flex-col items-end gap-1">
                          {getItemStatusBadgeRN(itemStatus)}
                          {canCancelItem && (
                            <TouchableOpacity
                              onPress={() => cancelSpecificOrderItem(o.id, i)}
                              className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1"
                            >
                              <Text className="text-[10px] font-bold text-rose-600">Cancel Item</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {(o.status === 'placed' || o.status === 'processing') && isWithinGraceWindow && (
                  <TouchableOpacity
                    className="mt-3 bg-[#FDEAF1] py-2 rounded-xl items-center border border-[#F5A8C0]"
                    onPress={() => requestCancelOrder(o.id)}
                  >
                    <Text className="text-xs font-bold text-[#C2477A]">Cancel Entire Order (15m Window)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}

      <CancelWarningModal
        visible={showCancelWarningModal}
        onClose={() => setShowCancelWarningModal(false)}
        onConfirm={() => executeCancelOrder(pendingCancelOrderId)}
        orderId={pendingCancelOrderId}
      />
    </ScrollView>
  );
};
