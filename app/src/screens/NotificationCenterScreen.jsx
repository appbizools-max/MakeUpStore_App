import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Trash2
} from 'lucide-react';

export const NotificationCenterScreen = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setCurrentScreen,
    setSelectedOrderIdForDetails
  } = useApp();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'orders' | 'unread'

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
    return notifications;
  }, [notifications, filterTab]);

  // Handle clicking on a notification item
  const handleNotificationClick = (item) => {
    // 1. Mark as read
    if (!item.is_read && markNotificationAsRead) {
      markNotificationAsRead(item.id);
    }

    // 2. If it's an order notification, navigate to Order Details
    const orderId = item.data?.orderId || item.data?.orderNumber;
    if (orderId && setSelectedOrderIdForDetails) {
      setSelectedOrderIdForDetails(orderId);
      setCurrentScreen('orders');
    }
  };

  // Get category badge style & icon
  const getCategoryDetails = (type) => {
    switch (type) {
      case 'order_status':
        return { label: 'Order Update', bg: 'bg-pink-50 text-[#C2477A] border-pink-200', icon: Package };
      case 'payment':
        return { label: 'Payment', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CreditCard };
      case 'refund':
        return { label: 'Refund', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: RotateCcw };
      case 'cancellation':
        return { label: 'Cancellation', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: RotateCcw };
      default:
        return { label: 'Notification', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Sparkles };
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFD] flex flex-col pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-gray-700 hover:bg-pink-100 transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight">Notification Center</h1>
              {unreadNotificationsCount > 0 && (
                <span className="bg-[#C2477A] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-gray-400">Live order & account updates</p>
          </div>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] font-black text-[#C2477A] hover:text-[#9c325f] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-pink-50 bg-white">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'orders', label: 'Orders' },
          { id: 'unread', label: `Unread (${unreadNotificationsCount})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'bg-[#C2477A] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-[#C2477A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-4 py-3 space-y-2.5 overflow-y-auto">
        {displayedNotifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto mb-3 text-[#C2477A]">
              <Bell size={28} className="stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-black text-gray-800">No Notifications</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto font-medium">
              {filterTab === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You have no order notifications yet. When your beauty orders update, they'll appear here in real-time."}
            </p>
          </div>
        ) : (
          displayedNotifications.map((item) => {
            const cat = getCategoryDetails(item.type);
            const CatIcon = cat.icon;
            const orderNum = item.data?.orderNumber || (item.data?.orderId ? String(item.data.orderId).slice(-6).toUpperCase() : null);

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.is_read
                    ? 'bg-white border-pink-100 hover:border-pink-200 shadow-2xs'
                    : 'bg-gradient-to-r from-pink-50/70 to-white border-pink-300 shadow-xs'
                }`}
              >
                {/* Unread indicator dot */}
                {!item.is_read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#C2477A] ring-4 ring-pink-100 animate-pulse" />
                )}

                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cat.bg}`}>
                    <CatIcon size={16} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${cat.bg}`}>
                        {cat.label}
                      </span>
                      {orderNum && (
                        <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{orderNum}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-gray-400 ml-auto">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <h4 className={`text-xs font-black mt-1 leading-snug ${item.is_read ? 'text-gray-800' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-gray-600 font-medium mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Quick Action Footer if relates to an order */}
                    {orderNum && (
                      <div className="mt-2.5 pt-2 border-t border-pink-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#C2477A] flex items-center gap-1 group-hover:underline">
                          <span>View Order Details</span>
                          <ChevronRight size={12} />
                        </span>
                        {!item.is_read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(item.id);
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1"
                          >
                            <Check size={11} />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

