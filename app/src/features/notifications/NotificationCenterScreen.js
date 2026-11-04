import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const NotificationCenterScreen = () => {
  const {
    notifications = [],
    unreadNotificationsCount = 0,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotifications,
    setCurrentScreen,
    setSelectedOrderIdForDetails,
    userRole
  } = useApp();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'orders' | 'b2b' | 'unread'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (fetchNotifications) {
      await fetchNotifications();
    }
    setIsRefreshing(false);
  };

  // Format relative timestamp
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    if (filterTab === 'unread') {
      return notifications.filter(n => !n.is_read);
    }
    if (filterTab === 'orders') {
      return notifications.filter(n => n.type === 'order_status' || n.data?.orderId);
    }
    if (filterTab === 'b2b') {
      return notifications.filter(n => (n.type && n.type.startsWith('b2b')) || n.data?.verificationId);
    }
    return notifications;
  }, [notifications, filterTab]);

  const handleNotificationClick = (item) => {
    // 1. Mark as read
    if (!item.is_read && markNotificationAsRead) {
      markNotificationAsRead(item.id);
    }

    // 2. Order navigation
    const orderId = item.data?.orderId || item.data?.orderNumber;
    if (orderId && setSelectedOrderIdForDetails) {
      setSelectedOrderIdForDetails(orderId);
      setCurrentScreen('orders');
      return;
    }

    // 3. B2B Verification navigation
    if (item.type?.startsWith('b2b') || item.data?.verificationId) {
      setCurrentScreen('b2b_verification');
      return;
    }

    // 4. Welcome notification
    if (item.type === 'welcome') {
      setCurrentScreen('home');
      return;
    }
  };

  const getNotificationIconMeta = (item) => {
    const type = item.type || '';
    if (type === 'welcome' || item.data?.eventType === 'login_welcome') {
      return {
        name: 'sparkles',
        color: '#E11D48',
        bgColor: '#FFF1F2',
        label: 'Welcome'
      };
    }
    if (type === 'order_status' || item.data?.orderId) {
      return {
        name: 'cube',
        color: '#C2477A',
        bgColor: '#FCE4EC',
        label: 'Order'
      };
    }
    if (type.startsWith('b2b') || item.data?.verificationId) {
      return {
        name: 'shield-checkmark',
        color: '#0D9488',
        bgColor: '#CCFBF1',
        label: 'B2B Verification'
      };
    }
    if (type === 'payment' || type === 'refund') {
      return {
        name: 'wallet',
        color: '#7C3AED',
        bgColor: '#EDE9FE',
        label: 'Payment'
      };
    }
    return {
      name: 'notifications',
      color: '#C2477A',
      bgColor: '#FFF5F8',
      label: 'Update'
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 1. Header Bar */}
      <View className="px-4 py-3 bg-white border-b border-[#FCE4EC] flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setCurrentScreen('home')}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-white border border-[#FCE4EC] items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#C2477A" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black text-slate-900 tracking-tight">
              Notifications
            </Text>
            <Text className="text-[11px] font-bold text-slate-500">
              {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread updates` : 'All caught up'}
            </Text>
          </View>
        </View>

        {unreadNotificationsCount > 0 && (
          <TouchableOpacity
            onPress={markAllNotificationsAsRead}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#FCE4EC]"
          >
            <Ionicons name="checkmark-done" size={15} color="#C2477A" />
            <Text className="text-[11px] font-extrabold text-[#C2477A]">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Filter Pills */}
      <View className="flex-row px-4 py-2.5 bg-slate-50 border-b border-slate-100 gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadNotificationsCount})` },
          { key: 'orders', label: 'Orders' },
          { key: 'b2b', label: 'B2B' }
        ].map((tab) => {
          const isActive = filterTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilterTab(tab.key)}
              activeOpacity={0.7}
              className={`px-3 py-1.5 rounded-full ${
                isActive
                  ? 'bg-[#C2477A]'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-white' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Notification List */}
      <FlatList
        data={displayedNotifications}
        keyExtractor={(item) => String(item.id || item.created_at || Math.random())}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#C2477A']} />
        }
        contentContainerStyle={{
          paddingBottom: 90,
          flexGrow: 1
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-12">
            <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4 border border-[#FCE4EC]">
              <Ionicons name="notifications-off-outline" size={38} color="#C2477A" />
            </View>
            <Text className="text-base font-black text-slate-800 mb-1">
              No Notifications
            </Text>
            <Text className="text-xs text-slate-500 text-center max-w-[260px] leading-relaxed">
              {filterTab === 'unread'
                ? "You've read all your notifications!"
                : "We'll alert you here when your orders change status, B2B approvals are updated, or offers arrive."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = getNotificationIconMeta(item);
          const isUnread = !item.is_read;

          return (
            <TouchableOpacity
              onPress={() => handleNotificationClick(item)}
              activeOpacity={0.75}
              className={`px-4 py-3.5 border-b border-slate-100 flex-row items-start gap-3 ${
                isUnread ? 'bg-white' : 'bg-white'
              }`}
            >
              {/* Type Icon */}
              <View
                style={{ backgroundColor: meta.bgColor }}
                className="w-10 h-10 rounded-2xl items-center justify-center mt-0.5 shrink-0"
              >
                <Ionicons name={meta.name} size={18} color={meta.color} />
              </View>

              {/* Notification Details */}
              <View className="flex-1 pr-1">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                    <Text
                      numberOfLines={1}
                      className={`text-[13.5px] ${
                        isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                      }`}
                    >
                      {item.title || 'Notification'}
                    </Text>
                  </View>
                  <Text className="text-[10.5px] font-medium text-slate-600 shrink-0">
                    {formatTimeAgo(item.created_at)}
                  </Text>
                </View>

                <Text
                  numberOfLines={2}
                  className="text-xs text-slate-600 leading-snug mb-1.5 font-medium"
                >
                  {item.message || ''}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <View
                      style={{ backgroundColor: meta.bgColor }}
                      className="px-2 py-0.5 rounded-full"
                    >
                      <Text
                        style={{ color: meta.color }}
                        className="text-[9.5px] font-extrabold uppercase tracking-wider"
                      >
                        {meta.label}
                      </Text>
                    </View>
                    {item.data?.orderId && (
                      <Text className="text-[10px] font-mono font-bold text-slate-500">
                        #{String(item.data.orderId).slice(-6)}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Text className="text-[11px] font-bold text-[#C2477A]">View</Text>
                    <Ionicons name="chevron-forward" size={12} color="#C2477A" />
                  </View>
                </View>
              </View>

              {/* Unread indicator dot */}
              {isUnread && (
                <View className="w-2.5 h-2.5 rounded-full bg-[#C2477A] mt-2 shrink-0" />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

