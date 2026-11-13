import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';
import {
  ORDER_STAGES,
  getStageIndex,
  getStatusBadgeStyle,
  safeCopyToClipboard
} from './OrderDetailsScreen';

export const OrderHistoryScreen = () => {
  const {
    orders = [],
    userProfile,
    setCurrentScreen,
    setSelectedOrderIdForDetails,
    reorderOrderItems,
    addToCart,
    isCatalogLoading,
    refreshOrders,
    goBack
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshOrders?.();
    const interval = setInterval(() => {
      refreshOrders?.();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Two Main Tabs: 'all' | 'completed'
  const [activeTab, setActiveTab] = useState('all');
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [activeStageNote, setActiveStageNote] = useState({}); // { [orderId]: stageIndex }

  // Filter orders for the logged-in user + enforce automatic 60-day customer visibility window
  const userOrders = useMemo(() => {
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgoTimestamp = Date.now() - sixtyDaysMs;

    const matched = orders.filter(o => {
      if (!o) return false;

      // 60-day automatic visibility window: orders older than 60 days disappear from customer view
      const orderTime = new Date(o.date || o.placedAt || o.created_at).getTime();
      if (!isNaN(orderTime) && orderTime < sixtyDaysAgoTimestamp) {
        return false;
      }

      if (!userProfile) return true;
      const cleanPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
      const uPhone = cleanPhone(userProfile.phone);
      const oPhone = cleanPhone(o.phone);
      const idMatch = userProfile.id && (
        o.userId === userProfile.id ||
        o.user_id === userProfile.id ||
        String(o.userId) === String(userProfile.id) ||
        String(o.user_id) === String(userProfile.id)
      );
      const phoneMatch = uPhone && oPhone && uPhone === oPhone;
      const nameMatch = userProfile.name && o.userName && userProfile.name.trim().toLowerCase() === o.userName.trim().toLowerCase();
      return Boolean(idMatch || phoneMatch || nameMatch);
    });

    if (matched.length === 0 && orders.length > 0) {
      return orders.filter(o => {
        const orderTime = new Date(o?.date || o?.placedAt || o?.created_at).getTime();
        return isNaN(orderTime) || orderTime >= sixtyDaysAgoTimestamp;
      });
    }
    return matched;
  }, [orders, userProfile]);

  // Counts
  const allOrdersCount = userOrders.length;
  const completedOrdersCount = useMemo(() => {
    return userOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'completed' || s === 'delivered';
    }).length;
  }, [userOrders]);

  // Tab Filtered Orders
  const filteredOrders = useMemo(() => {
    if (activeTab === 'completed') {
      return userOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'completed' || s === 'delivered';
      });
    }
    return userOrders;
  }, [userOrders, activeTab]);

  const handleCopyId = (orderId) => {
    const ok = safeCopyToClipboard(orderId);
    if (ok) {
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } else {
      Alert.alert('Order ID', orderId);
    }
  };

  const handleOpenDetails = (order) => {
    if (setSelectedOrderIdForDetails) {
      setSelectedOrderIdForDetails(order.id);
    }
    setCurrentScreen('order_details');
  };

  const handleQuickReorder = async (order) => {
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
      Alert.alert(
        'Items Added to Bag',
        'All available items from this order have been added to your shopping bag.',
        [
          { text: 'Keep Shopping', style: 'cancel' },
          { text: 'View Bag', onPress: () => setCurrentScreen('cart') }
        ]
      );
    } catch (_) {
      Alert.alert('Reorder', 'Could not add items to bag. Please try again.');
    }
  };

  const formatOrderDate = (isoOrDateStr) => {
    if (!isoOrDateStr) return 'Recent';
    try {
      const d = new Date(isoOrDateStr);
      if (isNaN(d.getTime())) return String(isoOrDateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F0E3EA',
          shadowColor: '#D81B60',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2
        }}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => {
            if (typeof goBack === 'function') goBack();
            else setCurrentScreen('home');
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
          <Ionicons name="chevron-back" size={20} color="#D81B60" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-base font-extrabold text-[#352832]">My Orders</Text>
          <Text className="text-[11px] font-semibold text-[#8A7B85]">
            {allOrdersCount} Total {allOrdersCount === 1 ? 'Order' : 'Orders'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentScreen('cart')}
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
          <Ionicons name="bag-handle-outline" size={19} color="#D81B60" />
        </TouchableOpacity>
      </View>

      {/* ── TWO TABS: ALL ORDERS vs COMPLETED ─────────────────────────── */}
      <View className="px-4 pt-3 pb-2">
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1,
            borderRadius: 16
          }}
          className="p-1 flex-row shadow-2xs"
        >
          {/* Tab 1: All Orders */}
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
            style={{
              backgroundColor: activeTab === 'all' ? '#D81B60' : 'transparent',
              borderRadius: 12
            }}
            className="flex-1 py-2 flex-row items-center justify-center gap-1.5"
          >
            <Ionicons
              name="layers-outline"
              size={13}
              color={activeTab === 'all' ? '#FFFFFF' : '#8A7B85'}
            />
            <Text
              className={`text-xs font-black ${
                activeTab === 'all' ? 'text-white' : 'text-[#8A7B85]'
              }`}
            >
              All Orders
            </Text>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-[#FFFFFF] border border-[#F0E3EA]'
              }`}
            >
              <Text
                className={`text-[9.5px] font-black ${
                  activeTab === 'all' ? 'text-white' : 'text-[#D81B60]'
                }`}
              >
                {allOrdersCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Completed */}
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            activeOpacity={0.8}
            style={{
              backgroundColor: activeTab === 'completed' ? '#D81B60' : 'transparent',
              borderRadius: 12
            }}
            className="flex-1 py-2 flex-row items-center justify-center gap-1.5"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color={activeTab === 'completed' ? '#FFFFFF' : '#2E7D32'}
            />
            <Text
              className={`text-xs font-black ${
                activeTab === 'completed' ? 'text-white' : 'text-[#8A7B85]'
              }`}
            >
              Completed
            </Text>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-emerald-50 border border-emerald-200'
              }`}
            >
              <Text
                className={`text-[9.5px] font-black ${
                  activeTab === 'completed' ? 'text-white' : 'text-emerald-700'
                }`}
              >
                {completedOrdersCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ORDERS LIST SCROLLER ──────────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              try { await refreshOrders?.(); } catch (_) {}
              setIsRefreshing(false);
            }}
            colors={['#D81B60']}
            tintColor="#D81B60"
          />
        }
      >
        {isCatalogLoading && filteredOrders.length === 0 ? (
          <View className="p-8 items-center justify-center my-6">
            <ActivityIndicator size="large" color="#D81B60" />
            <Text className="text-xs text-[#8A7B85] mt-2 font-semibold">Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#F0E3EA',
              borderWidth: 1,
              borderRadius: 24
            }}
            className="p-8 items-center my-4 shadow-xs"
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FFFFFF',
                borderColor: '#F0E3EA',
                borderWidth: 1.5
              }}
              className="items-center justify-center mb-3"
            >
              <Ionicons
                name={activeTab === 'completed' ? 'checkmark-done-circle-outline' : 'cube-outline'}
                size={32}
                color="#D81B60"
              />
            </View>
            <Text className="text-base font-black text-[#352832] mb-1">
              {activeTab === 'completed' ? 'No Completed Orders' : 'No Orders Placed Yet'}
            </Text>
            <Text className="text-xs text-[#8A7B85] text-center mb-4 leading-relaxed px-4 font-medium">
              {activeTab === 'completed'
                ? 'Orders delivered to your doorstep will appear in this tab with invoices and tracking details.'
                : 'Explore our catalog of salon-grade cosmetics, skincare, and beauty essentials to place your first order.'}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#D81B60',
                shadowColor: '#D81B60',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3
              }}
              className="px-6 py-2.5 rounded-full flex-row items-center gap-1.5"
            >
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text className="text-xs font-black text-white">Browse Beauty Catalog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map(order => {
            const badge = getStatusBadgeStyle(order.status);
            const currentStageIdx = getStageIndex(order.status);
            const isCancelledOrRejected = currentStageIdx === -1;
            const orderDateStr = formatOrderDate(order.date || order.placedAt);
            const items = order.items || [];
            const firstItem = items[0];
            const remainingItemsCount = Math.max(0, items.length - 1);
            const isCopied = copiedOrderId === order.id;

            return (
              <View
                key={order.id}
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
                className="p-4 mb-3.5"
              >
                {/* 1. Card Top: Order ID & Status Pill */}
                <View className="flex-row justify-between items-start pb-2.5 border-b border-[#F0E3EA]">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-xs font-black text-[#352832]" numberOfLines={1}>
                        Order #{order.id}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCopyId(order.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                        className="bg-[#FFFFFF] border border-[#F0E3EA] px-1.5 py-0.5 rounded flex-row items-center gap-0.5"
                      >
                        <Ionicons name="copy-outline" size={10} color="#D81B60" />
                        <Text className="text-[9px] font-bold text-[#D81B60]">
                          {isCopied ? 'Copied!' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-[10.5px] font-medium text-[#8A7B85] mt-0.5">
                      Placed on {orderDateStr} • {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>

                  <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 shrink-0 ${badge.container}`}>
                    <Ionicons name={badge.icon} size={11} color="#D81B60" />
                    <Text className={`text-[9.5px] font-black tracking-wider ${badge.text}`}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* 2. Seven-Stage Tracking Timeline */}
                {!isCancelledOrRejected ? (
                  <View className="py-2.5 my-1 border-t border-[#F0E3EA]">
                    <View className="relative">
                      {/* Background Bar */}
                      <View className="absolute top-3 left-4 right-4 h-1 bg-[#F0E3EA] rounded-full" />
                      {/* Filled Progress Bar */}
                      <View
                        className="absolute top-3 left-4 h-1 bg-[#D81B60] rounded-full"
                        style={{
                          width: `${Math.min(100, (currentStageIdx / (ORDER_STAGES.length - 1)) * 100)}%`
                        }}
                      />

                      {/* 7 Interactive Stage Nodes */}
                      <View className="flex-row justify-between items-start">
                        {ORDER_STAGES.map((st, idx) => {
                          const isPassed = idx < currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          const shortLabels = ['Placed', 'Conf.', 'Proc.', 'Packed', 'Disp.', 'Out', 'Deliv.'];

                          return (
                            <TouchableOpacity
                              key={st.key}
                              activeOpacity={0.7}
                              onPress={() => {
                                setActiveStageNote(prev => ({
                                  ...prev,
                                  [order.id]: prev[order.id] === idx ? null : idx
                                }));
                              }}
                              className="items-center"
                              style={{ width: `${100 / ORDER_STAGES.length}%` }}
                            >
                              <View
                                className={`w-5 h-5 rounded-full items-center justify-center ${
                                  isPassed
                                    ? 'bg-[#D81B60]'
                                    : isCurrent
                                    ? 'bg-white border-2 border-[#D81B60]'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                {isPassed ? (
                                  <Ionicons name="checkmark" size={10} color="#FFF" />
                                ) : isCurrent ? (
                                  <View className="w-1.5 h-1.5 rounded-full bg-[#D81B60]" />
                                ) : (
                                  <Text className="text-[7.5px] font-bold text-gray-400">{idx + 1}</Text>
                                )}
                              </View>
                              <Text
                                numberOfLines={1}
                                className={`mt-0.5 text-[7.5px] font-black text-center ${
                                  isCurrent
                                    ? 'text-[#D81B60]'
                                    : isPassed
                                    ? 'text-[#352832]'
                                    : 'text-gray-400'
                                }`}
                              >
                                {shortLabels[idx] || st.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Stage status indicator pill */}
                    <View className="mt-2 py-1 px-2.5 rounded-lg bg-[#FFF2F6] border border-pink-100 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-[#D81B60]" />
                        <Text className="text-[10px] font-black text-[#D81B60]">
                          {ORDER_STAGES[currentStageIdx]?.label || badge.label}
                        </Text>
                      </View>
                      <Text className="text-[9px] font-extrabold text-[#8A7B85]">
                        Stage {currentStageIdx + 1} of 7
                      </Text>
                    </View>

                    {/* Stage Note if clicked */}
                    {activeStageNote[order.id] != null && (
                      <View className="mt-2.5 p-2 bg-[#FFFFFF] rounded-xl border border-[#F0E3EA]">
                        <Text className="text-[10px] font-black text-[#352832]">
                          {ORDER_STAGES[activeStageNote[order.id]]?.label}:
                        </Text>
                        <Text className="text-[9.5px] text-[#8A7B85] mt-0.5">
                          {ORDER_STAGES[activeStageNote[order.id]]?.description}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="py-2 px-2.5 my-1 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center gap-1.5">
                    <Ionicons name="alert-circle-outline" size={14} color="#8A7B85" />
                    <Text className="text-[10px] font-bold text-gray-700">
                      {order.status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected by Branch'}
                    </Text>
                  </View>
                )}

                {/* 4. Ordered Items Preview Strip */}
                {firstItem && (
                  <TouchableOpacity
                    onPress={() => handleOpenDetails(order)}
                    activeOpacity={0.8}
                    className="bg-[#FFFFFF] border border-[#F0E3EA] rounded-xl p-2.5 my-2 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-10 h-10 rounded-lg bg-white border border-[#F0E3EA] overflow-hidden mr-2.5 items-center justify-center p-0.5">
                        {firstItem.image || firstItem.product?.image ? (
                          <Image
                            source={getSafeImageSource(firstItem.image || firstItem.product?.image)}
                            style={{ width: '88%', height: '88%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name="cube-outline" size={16} color="#D81B60" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] font-bold text-[#352832]" numberOfLines={1}>
                          {firstItem.product?.name || firstItem.name || 'Cosmetic Product'}
                        </Text>
                        <Text className="text-[10px] text-[#8A7B85]">
                          Qty: {firstItem.quantity || 1}
                          {firstItem.shade ? ` · Shade: ${firstItem.shade.name || firstItem.shade.color_name}` : ''}
                        </Text>
                      </View>
                    </View>

                    {remainingItemsCount > 0 && (
                      <View className="bg-white border border-[#F0E3EA] px-2 py-1 rounded-md">
                        <Text className="text-[10px] font-bold text-[#D81B60]">
                          +{remainingItemsCount} more
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* 5. Card Bottom: Total & Actions */}
                <View className="flex-row justify-between items-center pt-2.5 border-t border-[#F0E3EA] mt-1">
                  <View>
                    <Text className="text-[9.5px] font-bold text-[#8A7B85] uppercase">Total Amount</Text>
                    <Text className="text-base font-black text-[#D81B60]">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleQuickReorder(order)}
                      activeOpacity={0.8}
                      className="bg-[#FFFFFF] border border-[#F0E3EA] px-3 py-2 rounded-xl flex-row items-center gap-1"
                    >
                      <Ionicons name="repeat-outline" size={13} color="#D81B60" />
                      <Text className="text-xs font-bold text-[#D81B60]">Reorder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenDetails(order)}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: '#D81B60',
                        shadowColor: '#D81B60',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 2
                      }}
                      className="px-3.5 py-2 rounded-xl flex-row items-center gap-1"
                    >
                      <Text className="text-xs font-bold text-white">Details</Text>
                      <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
