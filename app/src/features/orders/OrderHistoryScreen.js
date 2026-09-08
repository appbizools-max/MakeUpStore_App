import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { CancelWarningModal } from './CancelWarningModal';

export const OrderHistoryScreen = () => {
  const {
    orders,
    requestCancelOrder,
    executeCancelOrder,
    showCancelWarningModal,
    setShowCancelWarningModal,
    pendingCancelOrderId
  } = useApp();

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Expanded mock demonstration orders if empty to mirror reference UI
  const displayOrders = orders.length > 0 ? orders : [
    {
      id: 'FG-84773',
      date: '12 Feb 2026',
      status: 'delivered',
      totalAmount: 1299,
      branch: 'MG Road Branch',
      items: [
        { product: { name: 'Matte Passion Lipstick - Crimson', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' }, quantity: 1 },
        { product: { name: 'Sweet Peony Blush Palette', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-83210',
      date: '28 Jan 2026',
      status: 'processing',
      totalAmount: 850,
      branch: 'MG Road Branch',
      items: [
        { product: { name: 'Ceramide Intense Cream 50ml', image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-82194',
      date: '15 Jan 2026',
      status: 'cancelled',
      totalAmount: 450,
      branch: 'MG Road Branch',
      items: [
        { product: { name: 'Nourishing Face Cleanser', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-81055',
      date: '04 Jan 2026',
      status: 'delivered',
      totalAmount: 2150,
      branch: 'Indiranagar Branch',
      items: [
        { product: { name: 'Hyaluronic Acid Radiance Serum 30ml', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300' }, quantity: 1 },
        { product: { name: 'Superstay Matte Ink Lipstick', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' }, quantity: 1 },
        { product: { name: 'Absolute Radiance Compact', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-79842',
      date: '20 Dec 2025',
      status: 'delivered',
      totalAmount: 1799,
      branch: 'Koramangala Branch',
      items: [
        { product: { name: 'Studio Fix Powder Foundation', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' }, quantity: 1 },
        { product: { name: 'Velvet Soft Lip Tint', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-78510',
      date: '05 Dec 2025',
      status: 'cancelled',
      totalAmount: 620,
      branch: 'MG Road Branch',
      items: [
        { product: { name: 'Rosewater Hydrating Toner 200ml', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300' }, quantity: 1 }
      ]
    },
    {
      id: 'FG-77120',
      date: '18 Nov 2025',
      status: 'delivered',
      totalAmount: 3499,
      branch: 'Indiranagar Branch',
      items: [
        { product: { name: 'Glamour 12-Shade Eyeshadow Palette', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300' }, quantity: 1 },
        { product: { name: 'Waterproof Precision Eyeliner', image: 'https://images.unsplash.com/photo-1631730486784-5456119f69ae?w=300' }, quantity: 1 },
        { product: { name: 'Volume Express Black Mascara', image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?w=300' }, quantity: 1 },
        { product: { name: 'Dewy Finish Setting Spray', image: 'https://images.unsplash.com/photo-1608248597261-e4d0947c6999?w=300' }, quantity: 1 }
      ]
    }
  ];

  const getStatusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return {
        container: 'border border-[#2E7D32] bg-white',
        text: 'text-[#2E7D32]',
        label: 'DELIVERED',
      };
    }
    if (s === 'cancelled') {
      return {
        container: 'border border-[#8C7078] bg-white',
        text: 'text-[#8C7078]',
        label: 'CANCELLED',
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
                  {formatDate(o.date)}
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

            {/* Product Image Thumbnails Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {(o.items || []).map((item, idx) => {
                const imgUri = item?.product?.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300';
                return (
                  <View key={idx} className="w-14 h-14 rounded-2xl overflow-hidden bg-[#FFF5F8] mr-2.5 border border-[#FCE4EC] justify-center items-center">
                    <Image source={{ uri: imgUri }} className="w-full h-full object-cover" />
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
                  <Text className="text-[11px] font-bold text-[#3A2430] mb-1">Items:</Text>
                  {(o.items || []).map((it, i) => (
                    <View key={i} className="flex-row justify-between items-center py-0.5">
                      <Text className="text-[11px] text-[#3A2430] flex-1 mr-2" numberOfLines={1}>
                        • {it?.product?.name || 'Beauty Product'}
                      </Text>
                      <Text className="text-[11px] font-semibold text-[#8C7078]">
                        x{it?.quantity || 1}
                      </Text>
                    </View>
                  ))}
                </View>

                {(o.status === 'placed' || o.status === 'processing') && (
                  <TouchableOpacity
                    className="mt-3 bg-[#FDEAF1] py-2 rounded-xl items-center border border-[#F5A8C0]"
                    onPress={() => requestCancelOrder(o.id)}
                  >
                    <Text className="text-xs font-bold text-[#C2477A]">Cancel Order</Text>
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
