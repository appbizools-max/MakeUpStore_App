import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Tag,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

export const AbandonedCartsManager = ({ abandonedCarts = [], onNavigateToOrders }) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'abandoned' | 'converted' | 'cleared'
  const [searchQuery, setSearchQuery] = useState('');

  // Stats calculation from real database records
  const stats = useMemo(() => {
    let abandonedCount = 0;
    let convertedCount = 0;
    let clearedCount = 0;
    let abandonedValue = 0;
    let convertedValue = 0;

    for (const c of abandonedCarts) {
      const val = Number(c.cart_value || 0);
      if (c.status === 'abandoned') {
        abandonedCount += 1;
        abandonedValue += val;
      } else if (c.status === 'converted') {
        convertedCount += 1;
        convertedValue += val;
      } else if (c.status === 'cleared') {
        clearedCount += 1;
      }
    }

    return {
      total: abandonedCarts.length,
      abandonedCount,
      abandonedValue,
      convertedCount,
      convertedValue,
      clearedCount,
      recoveryRate: (abandonedCount + convertedCount) > 0
        ? Math.round((convertedCount / (abandonedCount + convertedCount)) * 100)
        : 0
    };
  }, [abandonedCarts]);

  const filteredCarts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return abandonedCarts.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (!q) return true;

      const name = (c.user_name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const role = (c.user_role || '').toLowerCase();
      const orderId = (c.order_id || '').toLowerCase();
      const hasMatchingProduct = (c.items || []).some(item =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.shade?.name || '').toLowerCase().includes(q)
      );

      return name.includes(q) || phone.includes(q) || role.includes(q) || orderId.includes(q) || hasMatchingProduct;
    });
  }, [abandonedCarts, filterStatus, searchQuery]);

  const formatISTDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'salon':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F8] text-black border border-[#FCE4EC]">Salon Owner</span>;
      case 'artist':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F8] text-black border border-[#FCE4EC]">Makeup Artist</span>;
      case 'beautician':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">Beautician</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">General Retail</span>;
    }
  };

  const getStatusBadge = (status, orderId) => {
    switch (status) {
      case 'converted':
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={12} className="text-emerald-600" />
              Converted / Completed
            </span>
            {orderId && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Order #{orderId}
              </span>
            )}
          </div>
        );
      case 'cleared':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <RotateCcw size={12} className="text-gray-500" />
            Cart Cleared by User
          </span>
        );
      case 'abandoned':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <AlertTriangle size={12} className="text-amber-600" />
            Abandoned Cart
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Abandoned Carts Card */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active Abandoned</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900">{stats.abandonedCount}</span>
            <span className="text-xs font-semibold text-gray-500 ml-2">carts</span>
          </div>
          <p className="text-xs font-bold text-amber-600 mt-1">₹{stats.abandonedValue.toLocaleString('en-IN')} unrecovered value</p>
        </div>

        {/* Converted Carts Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Converted Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900">{stats.convertedCount}</span>
            <span className="text-xs font-semibold text-gray-500 ml-2">completed</span>
          </div>
          <p className="text-xs font-bold text-emerald-600 mt-1">₹{stats.convertedValue.toLocaleString('en-IN')} recovered revenue</p>
        </div>

        {/* Conversion / Recovery Rate */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C2477A] uppercase tracking-wider">Recovery Rate</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F8] border border-pink-200 flex items-center justify-center text-[#C2477A]">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900">{stats.recoveryRate}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{stats.convertedCount} of {stats.abandonedCount + stats.convertedCount} converted</p>
        </div>

        {/* Cleared by Customer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Carts Cleared</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900">{stats.clearedCount}</span>
            <span className="text-xs font-semibold text-gray-500 ml-2">reset</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Users emptied their bags</p>
        </div>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${abandonedCarts.length})` },
            { id: 'abandoned', label: `Abandoned (${stats.abandonedCount})` },
            { id: 'converted', label: `Converted (${stats.convertedCount})` },
            { id: 'cleared', label: `Cleared (${stats.clearedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-[#C2477A] text-white shadow-xs'
                  : 'bg-gray-50 hover:bg-pink-50/50 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, item..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-pink-100 focus:border-[#C2477A] outline-none bg-white"
          />
        </div>
      </div>

      {/* 3. Abandoned Carts Feed / Cards */}
      {filteredCarts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-pink-100 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Carts Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'No carts match the current search filters. Try adjusting your query.'
              : 'Real-time cart tracking will appear here as users add products to their carts in the mobile app.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCarts.map((cart) => {
            const items = cart.items || [];
            const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

            return (
              <div
                key={cart.id}
                className="bg-white rounded-2xl border border-pink-100 p-5 shadow-2xs space-y-4 hover:border-pink-300 transition-all"
              >
                {/* Header: Customer Info + Status Badge + Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-pink-100/60 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFF5F8] border border-pink-200 text-[#C2477A] flex items-center justify-center font-black text-sm shrink-0">
                      {(cart.user_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">{cart.user_name || 'Customer'}</span>
                        {getRoleBadge(cart.user_role)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Phone size={11} className="text-gray-400" />
                          {cart.phone || 'No phone recorded'}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Clock size={11} className="text-gray-400" />
                          Last Active: {formatISTDate(cart.updated_at || cart.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(cart.status, cart.order_id)}
                  </div>
                </div>

                {/* Products & Shades/Variants List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Cart Items ({itemCount} {itemCount === 1 ? 'item' : 'items'} in bag):
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-pink-100/70 bg-[#FFF8FA]/60 flex items-center gap-3"
                      >
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name || 'Product'}
                            className="w-12 h-12 rounded-lg object-cover border border-pink-100 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-pink-100/50 border border-pink-200 flex items-center justify-center text-[#C2477A] font-bold text-xs shrink-0">
                            {it.quantity}x
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-gray-900 block truncate">
                            {it.name || 'Cosmetics Item'}
                          </span>
                          {it.brand && (
                            <span className="text-[9.5px] font-bold text-[#C2477A] block uppercase tracking-wide">
                              {it.brand}
                            </span>
                          )}

                          {/* Selected Shade / Variant Details */}
                          {it.shade && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {it.shade.color ? (
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                                  style={{ backgroundColor: it.shade.color }}
                                />
                              ) : null}
                              <span className="text-[10px] font-semibold text-gray-600 truncate">
                                Shade: <strong className="text-gray-800">{it.shade.name}</strong>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-gray-500 text-[11px]">
                              Qty: <strong className="text-gray-800 font-bold">{it.quantity}</strong> × ₹{it.unitPrice || 0}
                            </span>
                            <span className="font-extrabold text-[#C2477A]">
                              ₹{(it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Cart Value & Action Links */}
                <div className="pt-3 border-t border-pink-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Total Cart Value:</span>
                    <span className="text-base font-black text-[#C2477A]">
                      ₹{Number(cart.cart_value || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Recovery Actions */}
                  <div className="flex items-center gap-2">
                    {cart.phone && cart.status === 'abandoned' && (
                      <>
                        <a
                          href={`tel:${cart.phone}`}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Phone size={12} className="text-[#C2477A]" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/${cart.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hello ${cart.user_name || 'there'}, we noticed you left items in your cart at Salbeau (Total: ₹${cart.cart_value}). Would you like assistance completing your order?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <MessageCircle size={12} className="text-emerald-600" />
                          <span>WhatsApp Recovery</span>
                        </a>
                      </>
                    )}

                    {cart.status === 'converted' && cart.order_id && onNavigateToOrders && (
                      <button
                        onClick={() => onNavigateToOrders(cart.order_id)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF5F8] text-[#C2477A] hover:bg-pink-100 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        <span>View Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
