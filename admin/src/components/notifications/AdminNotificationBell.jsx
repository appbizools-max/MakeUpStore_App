import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Package,
  ShieldCheck,
  AlertTriangle,
  Search,
  ShoppingCart,
  Boxes,
  CheckCheck,
  X,
  ChevronRight,
  Clock,
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import { playNotificationBellSound, isChimeEnabled, setChimeEnabled } from '../../utils/soundEffects';

export const AdminNotificationBell = ({
  orders = [],
  b2bVerifications = [],
  employeeOperations = [],
  searchRequests = [],
  abandonedCarts = [],
  products = [],
  navigateToTab,
  currentAuthUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'orders' | 'b2b' | 'approvals' | 'activity' | 'stock'
  const [chimeActive, setChimeActive] = useState(() => isChimeEnabled());
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('salbeau_admin_notifications_read_ids_v1');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Track live incoming toast
  const [liveToast, setLiveToast] = useState(null);
  const prevEventIdsRef = useRef(new Set());
  const isInitialMountRef = useRef(true);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Persist read IDs
  const markAsRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('salbeau_admin_notifications_read_ids_v1', JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = aggregatedNotifications.map(n => n.id);
    setReadIds(prev => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem('salbeau_admin_notifications_read_ids_v1', JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  const clearReadNotifications = () => {
    // Keep only unread notifications
    const unread = aggregatedNotifications.filter(n => !readIds.has(n.id)).map(n => n.id);
    setReadIds(new Set());
    try {
      localStorage.removeItem('salbeau_admin_notifications_read_ids_v1');
    } catch (e) {}
  };

  const toggleSound = () => {
    const next = !chimeActive;
    setChimeActive(next);
    setChimeEnabled(next);
    if (next) {
      playNotificationBellSound({ isManualTest: true });
    }
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

  // Aggregate all notifications from across the platform
  const aggregatedNotifications = useMemo(() => {
    const list = [];

    // 1. ORDERS: Recent or pending orders
    (orders || []).slice(0, 30).forEach(order => {
      const isPending = !order.status || order.status === 'placed' || order.status === 'pending';
      const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
      const orderDate = order.date || order.created_at || new Date().toISOString();
      const orderNum = order.id ? String(order.id).slice(-6).toUpperCase() : 'NEW';
      const customer = order.userName || order.customerName || order.phone || 'Customer';
      const totalFormatted = Number(order.totalAmount || order.total || 0).toLocaleString('en-IN');
      const roleLabel = (order.userRole || 'b2c').toUpperCase();

      list.push({
        id: `ord_${order.id}`,
        rawId: order.id,
        category: 'orders',
        type: isCancelled ? 'order_cancelled' : isPending ? 'new_order' : 'order_update',
        title: isCancelled
          ? `Order #${orderNum} Cancelled`
          : isPending
          ? `New Order #${orderNum} Placed`
          : `Order #${orderNum} [${(order.status || '').toUpperCase()}]`,
        message: `${customer} (${roleLabel}) • ₹${totalFormatted} • ${(order.items || []).length} items`,
        timestamp: orderDate,
        targetTab: 'order_updated',
        priority: isPending ? 'high' : 'normal',
        badge: isCancelled ? 'Cancelled' : isPending ? 'Action Required' : order.status
      });
    });

    // 2. B2B VERIFICATIONS: Pending salon, makeup artist, beautician documents
    (b2bVerifications || []).forEach(v => {
      const isPending = v.status === 'pending' || v.verification_status === 'pending' || !v.status;
      if (isPending) {
        const busName = v.businessName || v.business_name || v.salonName || v.salon_name || v.fullName || v.name || 'Professional';
        const role = (v.role || v.requested_role || 'B2B').toUpperCase();
        const date = v.created_at || v.submitted_at || new Date().toISOString();
        const targetTab = role.includes('SALON')
          ? 'b2b-verification-salon'
          : role.includes('ARTIST')
          ? 'b2b-verification-artist'
          : role.includes('BEAUTICIAN')
          ? 'b2b-verification-beautician'
          : 'b2b-verification-salon';

        list.push({
          id: `b2b_${v.id || v.user_id || busName}`,
          rawId: v.id,
          category: 'b2b',
          type: 'b2b_pending',
          title: `New ${role} Verification`,
          message: `${busName} submitted registration documents for review.`,
          timestamp: date,
          targetTab: targetTab,
          priority: 'high',
          badge: 'Pending Review'
        });
      }
    });

    // 3. EMPLOYEE OPERATIONS: Operations pending Admin approval
    (employeeOperations || []).forEach(op => {
      const isPending = op.status === 'pending' || !op.status;
      if (isPending) {
        const empName = op.employeeName || op.employee_name || 'Staff Member';
        const opType = (op.operationType || op.operation_type || 'Catalog Update').replace(/_/g, ' ');
        const date = op.created_at || op.timestamp || new Date().toISOString();

        list.push({
          id: `op_${op.id}`,
          rawId: op.id,
          category: 'approvals',
          type: 'approval_required',
          title: `Employee Operation Pending Approval`,
          message: `${empName} staged: "${opType}" on ${op.entityName || 'Catalog'}`,
          timestamp: date,
          targetTab: 'approval_center',
          priority: 'high',
          badge: 'Sign-Off Needed'
        });
      }
    });

    // 4. CUSTOMER SEARCH REQUESTS: Items not found in catalog (Live Merchandising)
    (searchRequests || []).slice(0, 15).forEach(req => {
      const isPending = !req.status || req.status === 'pending';
      const term = req.query || req.search_term || req.searchTerm || 'Unknown';
      const date = req.created_at || req.timestamp || new Date().toISOString();
      const user = req.userName || req.user_phone || 'Shopper';

      list.push({
        id: `sr_${req.id || term}_${date}`,
        rawId: req.id,
        category: 'activity',
        type: 'search_request',
        title: `Search Not Found: "${term}"`,
        message: `${user} searched for this item with 0 catalog matches.`,
        timestamp: date,
        targetTab: 'search_requests',
        priority: isPending ? 'medium' : 'low',
        badge: isPending ? 'Unresolved' : 'Logged'
      });
    });

    // 5. ABANDONED CARTS: Incomplete checkouts
    (abandonedCarts || []).slice(0, 15).forEach(cart => {
      const isAbandoned = !cart.status || cart.status === 'abandoned';
      if (isAbandoned) {
        const date = cart.created_at || cart.last_active || new Date().toISOString();
        const total = Number(cart.total || cart.cart_total || 0).toLocaleString('en-IN');
        const user = cart.user_name || cart.phone || 'Shopper';

        list.push({
          id: `cart_${cart.id}`,
          rawId: cart.id,
          category: 'activity',
          type: 'abandoned_cart',
          title: `Abandoned Cart: ₹${total}`,
          message: `${user} left items in checkout without completing order.`,
          timestamp: date,
          targetTab: 'abandoned_carts',
          priority: 'medium',
          badge: 'Recovery'
        });
      }
    });

    // 6. LOW STOCK ALERTS: Inventory running out
    (products || []).forEach(prod => {
      const stock = Number(prod.stock != null ? prod.stock : prod.inventory_count);
      if (!isNaN(stock) && stock >= 0 && stock <= 5) {
        list.push({
          id: `stock_${prod.id}`,
          rawId: prod.id,
          category: 'stock',
          type: 'low_stock',
          title: stock === 0 ? `Out of Stock: ${prod.name}` : `Low Stock Alert (${stock} left)`,
          message: `Product "${prod.name}" has ${stock} units remaining. Restock recommended.`,
          timestamp: prod.updated_at || new Date().toISOString(),
          targetTab: 'products',
          priority: stock === 0 ? 'high' : 'medium',
          badge: stock === 0 ? 'Out of Stock' : `${stock} Left`
        });
      }
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [orders, b2bVerifications, employeeOperations, searchRequests, abandonedCarts, products]);

  // Unread count
  const unreadNotifications = useMemo(() => {
    return aggregatedNotifications.filter(n => !readIds.has(n.id));
  }, [aggregatedNotifications, readIds]);

  const unreadCount = unreadNotifications.length;

  // Real-time detection of NEW incoming events to fire audio chime and floating toast
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevEventIdsRef.current = new Set(aggregatedNotifications.map(n => n.id));
      return;
    }

    // Check for newly arrived notification IDs
    const newArrivals = aggregatedNotifications.filter(
      n => !prevEventIdsRef.current.has(n.id) && !readIds.has(n.id)
    );

    if (newArrivals.length > 0) {
      const topEvent = newArrivals[0];

      // Play official notification bell sound ONLY for high priority events (new order, B2B verification, approval required, stockout)
      playNotificationBellSound({ priority: topEvent.priority });

      // Show toast
      setLiveToast(topEvent);
      const timer = setTimeout(() => {
        setLiveToast(null);
      }, 7000);

      // Update tracked IDs
      prevEventIdsRef.current = new Set(aggregatedNotifications.map(n => n.id));

      return () => clearTimeout(timer);
    } else {
      prevEventIdsRef.current = new Set(aggregatedNotifications.map(n => n.id));
    }
  }, [aggregatedNotifications, readIds]);

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    if (filterTab === 'all') return aggregatedNotifications;
    return aggregatedNotifications.filter(n => n.category === filterTab);
  }, [aggregatedNotifications, filterTab]);

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (navigateToTab && item.targetTab) {
      navigateToTab(item.targetTab);
    }
  };

  // Icon metadata generator
  const getIconMeta = (item) => {
    switch (item.category) {
      case 'orders':
        return {
          icon: Package,
          bg: 'bg-pink-100 text-[#C2477A] border-pink-200',
          dot: 'bg-[#C2477A]'
        };
      case 'b2b':
        return {
          icon: ShieldCheck,
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          dot: 'bg-teal-600'
        };
      case 'approvals':
        return {
          icon: AlertTriangle,
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-600'
        };
      case 'activity':
        return item.type === 'search_request'
          ? { icon: Search, bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-600' }
          : { icon: ShoppingCart, bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-600' };
      case 'stock':
        return {
          icon: Boxes,
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-600'
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-600'
        };
    }
  };

  return (
    <div className="relative">
      {/* 1. Header Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Admin Notifications & Real-Time Alerts"
        aria-label="Admin Notifications"
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-[#C2477A] text-white border-[#C2477A] shadow-md ring-2 ring-pink-200'
            : unreadCount > 0
            ? 'bg-white hover:bg-[#FFF5F8] text-slate-800 border-[#FCE4EC] shadow-2xs hover:border-[#C2477A]/40'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing size={17} className={`${unreadCount > 0 ? 'animate-bounce text-[#C2477A]' : ''} ${isOpen ? 'text-white' : ''}`} />
        ) : (
          <Bell size={17} />
        )}

        {/* Live Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-gradient-to-r from-rose-600 to-[#C2477A] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Floating Dropdown Flyout Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{ width: '420px', maxWidth: '92vw' }}
          className="absolute right-0 top-12 z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-pink-400">
                <Bell size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">Notifications</h3>
                  {unreadCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C2477A] text-white">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-time store stream</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                title={chimeActive ? 'Mute Notification Chime' : 'Unmute Notification Chime'}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                {chimeActive ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} className="text-slate-400" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-500">
              {aggregatedNotifications.length} Total Alerts Logged
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-extrabold text-[#C2477A] hover:text-pink-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              {readIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearReadNotifications}
                  title="Reset read indicators"
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: aggregatedNotifications.length },
              { id: 'orders', label: 'Orders', count: aggregatedNotifications.filter(n => n.category === 'orders').length },
              { id: 'b2b', label: 'B2B', count: aggregatedNotifications.filter(n => n.category === 'b2b').length },
              { id: 'approvals', label: 'Approvals', count: aggregatedNotifications.filter(n => n.category === 'approvals').length },
              { id: 'activity', label: 'Search/Carts', count: aggregatedNotifications.filter(n => n.category === 'activity').length },
              { id: 'stock', label: 'Low Stock', count: aggregatedNotifications.filter(n => n.category === 'stock').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  filterTab === tab.id
                    ? 'bg-[#C2477A] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1 py-0.2 rounded-full text-[9px] ${
                    filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-pink-100 text-[#C2477A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-800">No Notifications</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                  {filterTab === 'all'
                    ? 'Everything is running smoothly! New orders, B2B registrations, and alerts will appear here in real-time.'
                    : `No alerts found under "${filterTab}".`}
                </p>
              </div>
            ) : (
              displayedNotifications.map(item => {
                const isRead = readIds.has(item.id);
                const meta = getIconMeta(item);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-white relative ${
                      isRead ? 'bg-white/60 opacity-80' : 'bg-white'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${meta.bg}`}>
                      <IconComponent size={17} />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${isRead ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-snug font-medium mb-1.5">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider border ${
                          item.priority === 'high' && !isRead
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.badge}
                        </span>

                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#C2477A] group-hover:underline">
                          <span>View Details</span>
                          <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} shrink-0 mt-1 shadow-xs`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-white border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (navigateToTab) navigateToTab('order_updated');
              }}
              className="text-xs font-bold text-slate-600 hover:text-[#C2477A] transition-colors cursor-pointer py-1 block w-full"
            >
              Go to Full Order Management →
            </button>
          </div>
        </div>
      )}

      {/* 3. Real-Time Floating Toast Banner on Incoming Alert */}
      {liveToast && (
        <div
          onClick={() => {
            handleNotificationClick(liveToast);
            setLiveToast(null);
          }}
          className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-[#C2477A] animate-in slide-in-from-top-4 duration-200 cursor-pointer flex items-start gap-3 text-slate-900 group hover:bg-white"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-pink-200 text-[#C2477A] flex items-center justify-center shrink-0 shadow-2xs">
            <BellRing size={20} className="animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C2477A]">
                Live Store Alert
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Just now</span>
            </div>
            <h5 className="text-xs font-black text-slate-900 mt-0.5 truncate">
              {liveToast.title}
            </h5>
            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-tight font-medium">
              {liveToast.message}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-black text-[#C2477A]">
              <span>Tap to Open</span>
              <ChevronRight size={12} />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiveToast(null);
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

