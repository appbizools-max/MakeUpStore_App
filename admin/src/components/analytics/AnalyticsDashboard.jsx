import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Wallet,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  QrCode,
  ShieldCheck,
  Store,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  DATE_PRESETS,
  resolveDateRange,
  computeBusinessAnalytics,
  toISTDateString
} from '../../services/analyticsEngine';
import { fetchExpenses } from '../../services/expenseService';

export default function AnalyticsDashboard({
  orders = [],
  products = [],
  users = [],
  onNavigateTab
}) {
  const [datePreset, setDatePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState(() => {
    try {
      const d = new Date();
      d.setDate(1);
      return toISTDateString(d);
    } catch (e) {
      return '2026-11-01';
    }
  });
  const [customEnd, setCustomEnd] = useState(() => {
    try {
      return toISTDateString(new Date());
    } catch (e) {
      return '2026-11-19';
    }
  });

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProductTab, setActiveProductTab] = useState('top_revenue');

  // Load expenses
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute analytics
  const analytics = useMemo(() => {
    const dateRange = resolveDateRange(datePreset, customStart, customEnd);
    return computeBusinessAnalytics({
      orders,
      products,
      expenses,
      users,
      dateRange
    });
  }, [orders, products, expenses, users, datePreset, customStart, customEnd]);

  const { kpis, growth, orderFulfillment, b2bVsB2c, paymentMethods, products: prodStats, timeSeries } = analytics;

  // Max value in time series for chart scaling
  const maxRevenueInChart = useMemo(() => {
    if (!timeSeries.length) return 10000;
    return Math.max(...timeSeries.map(t => t.revenue), 1000);
  }, [timeSeries]);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-gray-900 pb-12">
      {/* ── TOP HEADER & FILTER BAR ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D81B60] uppercase tracking-wider mb-1">
            <TrendingUp size={15} />
            <span>Store Performance Analytics • Asia/Kolkata (IST)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Business Analytics & Sales Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Track key metrics: Revenue, Net Sales, Orders, Customers, Gross Profit, Refunds, and Loss.
          </p>
        </div>

        {/* Date Filter & Fast Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-pink-50/70 p-1.5 rounded-2xl border border-pink-100">
            <Calendar size={14} className="text-[#D81B60] ml-2 shrink-0" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-none pr-3 cursor-pointer"
            >
              {DATE_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-pink-100 text-xs font-semibold">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="outline-none text-xs"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="outline-none text-xs"
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadExpenses}
            title="Refresh Live Analytics"
            className="p-2.5 rounded-2xl bg-white border border-pink-100 text-gray-700 hover:text-[#D81B60] hover:bg-pink-50 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="px-4 py-2.5 rounded-2xl bg-[#D81B60] hover:bg-[#b8144f] text-white text-xs font-black shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} />
            <span>16 BI Reports</span>
          </button>
        </div>
      </div>

      {/* ── 7 CORE KPI METRIC CARDS ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-600">
            Core Business Performance Indicators
          </h2>
          <span className="text-[11px] font-bold text-gray-400">
            Filtered Range: {analytics.dateRangeSummary.startDateIST} to {analytics.dateRangeSummary.endDateIST}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* 1. Total Revenue */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
            <div className="text-xl font-black text-gray-900 mt-1">
              ₹{(kpis.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              {growth.grossRevenue >= 0 ? (
                <span className="text-emerald-600 flex items-center"><ArrowUpRight size={11} />+{growth.grossRevenue}%</span>
              ) : (
                <span className="text-rose-600 flex items-center"><ArrowDownRight size={11} />{growth.grossRevenue}%</span>
              )}
              <span className="text-gray-400">vs prev</span>
            </div>
          </div>

          {/* 2. Total Net Sales */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Net Sales</span>
            <div className="text-xl font-black text-[#D81B60] mt-1">
              ₹{(kpis.totalSales || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] font-semibold text-gray-400 block mt-1">After discounts</span>
          </div>

          {/* 3. Total Orders */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Orders</span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {kpis.totalOrders || 0}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              {growth.totalOrders >= 0 ? (
                <span className="text-emerald-600 flex items-center"><ArrowUpRight size={11} />+{growth.totalOrders}%</span>
              ) : (
                <span className="text-rose-600 flex items-center"><ArrowDownRight size={11} />{growth.totalOrders}%</span>
              )}
              <span className="text-gray-400">volume</span>
            </div>
          </div>

          {/* 4. Total Customers */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Customers</span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {kpis.totalCustomers || 0}
            </div>
            <span className="text-[10px] font-semibold text-gray-400 block mt-1">Unique buyers</span>
          </div>

          {/* 5. Gross Profit */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-sm transition-all bg-emerald-50/20">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Gross Profit</span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              ₹{(kpis.grossProfit || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 block mt-1">Sales - COGS</span>
          </div>

          {/* 6. Total Refunds */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Refunds</span>
            <div className="text-xl font-black text-gray-900 mt-1">
              ₹{(kpis.totalRefunds || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] font-semibold text-gray-400 block mt-1">Issued refunds</span>
          </div>

          {/* 7. Total Loss */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-sm transition-all">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">Loss</span>
            <div className="text-xl font-black text-rose-600 mt-1">
              ₹{(kpis.totalLoss || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] font-semibold text-rose-400 block mt-1">Returns + Logistics</span>
          </div>
        </div>
      </div>

      {/* ── CHARTS & BREAKDOWN SECTION ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue & Profit Trend Chart (SVG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">Revenue & Profit Progression</h3>
              <p className="text-xs text-gray-500 font-medium">Daily order collections and gross contribution</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-[#D81B60]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D81B60]" />
                <span>Revenue</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Gross Profit</span>
              </span>
            </div>
          </div>

          {/* Visual SVG Chart */}
          <div className="h-64 w-full bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-end relative border border-pink-50">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold">
                No order activity in selected date window.
              </div>
            ) : (
              <div className="h-full w-full flex items-end gap-2 pt-6">
                {timeSeries.map((d) => {
                  const revHeight = Math.max(8, (d.revenue / maxRevenueInChart) * 100);
                  const profHeight = Math.max(4, (d.profit / maxRevenueInChart) * 100);
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                        {d.date}: ₹{d.revenue.toLocaleString()} ({d.orders} orders)
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-full max-w-[14px] bg-gradient-to-t from-[#D81B60] to-[#E25586] rounded-t-sm transition-all"
                        />
                        <div
                          style={{ height: `${profHeight}%` }}
                          className="w-full max-w-[14px] bg-emerald-400 rounded-t-sm transition-all"
                        />
                      </div>

                      <span className="text-[9px] font-bold text-gray-400 mt-2 truncate w-full text-center">
                        {d.date.substring(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Status & Fulfillment Funnel */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Order Fulfillment Funnel</h3>
            <p className="text-xs text-gray-500 font-medium">Delivery velocity & returns audit</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">Delivered / Completed</span>
                <span className="text-gray-900 font-black">{orderFulfillment.delivered} orders</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${orderFulfillment.total > 0 ? (orderFulfillment.delivered / orderFulfillment.total) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">Pending / In Dispatch</span>
                <span className="text-gray-900 font-black">{orderFulfillment.pending} orders</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${orderFulfillment.total > 0 ? (orderFulfillment.pending / orderFulfillment.total) * 100 : 0}%` }}
                  className="bg-amber-500 h-full rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-700">Cancelled by Customer / Admin</span>
                <span className="text-gray-900 font-black">{orderFulfillment.cancelled} orders</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${orderFulfillment.total > 0 ? (orderFulfillment.cancelled / orderFulfillment.total) * 100 : 0}%` }}
                  className="bg-rose-500 h-full rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-purple-700">Returned / Reverse Shipped</span>
                <span className="text-gray-900 font-black">{orderFulfillment.returned} orders</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${orderFulfillment.total > 0 ? (orderFulfillment.returned / orderFulfillment.total) * 100 : 0}%` }}
                  className="bg-purple-500 h-full rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-100 text-xs flex items-center justify-between">
            <span className="font-bold text-gray-700">Fulfillment Success Rate</span>
            <span className="font-black text-[#D81B60] text-sm">
              {orderFulfillment.total > 0
                ? `${(((orderFulfillment.delivered + orderFulfillment.pending) / orderFulfillment.total) * 100).toFixed(1)}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* ── B2B vs B2C & PAYMENT CHANNELS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* B2B vs B2C Split */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">B2B Wholesale vs B2C Retail Split</h3>
              <p className="text-xs text-gray-500 font-medium">Trade client volume vs retail salon consumers</p>
            </div>
            <Store size={20} className="text-[#D81B60]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
              <span className="text-xs font-bold text-[#D81B60] uppercase tracking-wide block">B2C Retail</span>
              <div className="text-xl font-black text-gray-900">
                ₹{(b2bVsB2c.b2c.revenue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-bold text-gray-500 space-y-0.5">
                <div>Orders: {b2bVsB2c.b2c.orders || 0}</div>
                <div>Gross Profit: ₹{(b2bVsB2c.b2c.grossProfit || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide block">B2B Wholesale</span>
              <div className="text-xl font-black text-gray-900">
                ₹{(b2bVsB2c.b2b.revenue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-bold text-gray-500 space-y-0.5">
                <div>Orders: {b2bVsB2c.b2b.orders || 0}</div>
                <div>Gross Profit: ₹{(b2bVsB2c.b2b.grossProfit || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">Payment Channel Collections</h3>
              <p className="text-xs text-gray-500 font-medium">Doorstep UPI vs Cash COD vs Online</p>
            </div>
            <CreditCard size={20} className="text-[#D81B60]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
              <QrCode size={18} className="text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Doorstep UPI</span>
              <div className="text-sm font-black text-indigo-950 mt-1">
                ₹{(paymentMethods.upi.amount || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-bold text-indigo-600 mt-0.5 block">{paymentMethods.upi.count || 0} txns</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
              <DollarSign size={18} className="text-amber-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Cash COD</span>
              <div className="text-sm font-black text-amber-950 mt-1">
                ₹{(paymentMethods.cod.amount || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">{paymentMethods.cod.count || 0} txns</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
              <ShieldCheck size={18} className="text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Online Gateway</span>
              <div className="text-sm font-black text-emerald-950 mt-1">
                ₹{(paymentMethods.online.amount || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">{paymentMethods.online.count || 0} txns</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRODUCT PERFORMANCE TABLE (FULL WIDTH) ───────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-gray-900">Product Performance Intelligence</h3>
            <p className="text-xs text-gray-500 font-medium">Rankings by sales, revenue, profit, and return rate</p>
          </div>

          <div className="flex items-center gap-1 bg-pink-50/60 p-1 rounded-xl border border-pink-100 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveProductTab('top_revenue')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activeProductTab === 'top_revenue' ? 'bg-[#D81B60] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Top Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('most_profitable')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activeProductTab === 'most_profitable' ? 'bg-[#D81B60] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Most Profitable
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('zero_sales')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activeProductTab === 'zero_sales' ? 'bg-[#D81B60] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Zero Sales
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('high_returns')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activeProductTab === 'high_returns' ? 'bg-[#D81B60] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              High Returns
            </button>
          </div>
        </div>

        {/* Table display */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-center">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">Profit / Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {activeProductTab === 'top_revenue' && prodStats.topByRevenue.map(p => (
                <tr key={p.id} className="hover:bg-pink-50/30">
                  <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-2">
                    <img src={p.image} alt="" className="w-7 h-7 rounded-md object-contain border border-pink-100" />
                    <span className="truncate max-w-[320px]">{p.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-gray-700">{p.unitsSold}</td>
                  <td className="py-3 px-3 text-right font-black text-gray-900">₹{(p.revenue || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">₹{((p.revenue || 0) - (p.cogs || 0)).toLocaleString('en-IN')}</td>
                </tr>
              ))}

              {activeProductTab === 'most_profitable' && prodStats.mostProfitable.map(p => (
                <tr key={p.id} className="hover:bg-pink-50/30">
                  <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-2">
                    <img src={p.image} alt="" className="w-7 h-7 rounded-md object-contain border border-pink-100" />
                    <span className="truncate max-w-[320px]">{p.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-gray-700">{p.unitsSold}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-700">₹{(p.revenue || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600">₹{(p.profit || 0).toLocaleString('en-IN')} ({p.margin}%)</td>
                </tr>
              ))}

              {activeProductTab === 'zero_sales' && prodStats.zeroSales.map(p => (
                <tr key={p.id} className="hover:bg-pink-50/30">
                  <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-2">
                    <img src={p.image} alt="" className="w-7 h-7 rounded-md object-contain border border-pink-100" />
                    <span className="truncate max-w-[320px]">{p.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-rose-600">0 Units</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-500">₹{p.price}</td>
                  <td className="py-3 px-3 text-right font-bold text-amber-600">{p.stock} units in stock</td>
                </tr>
              ))}

              {activeProductTab === 'high_returns' && (
                prodStats.highReturns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 font-semibold">
                      No return records recorded in this timeframe. Excellent product quality!
                    </td>
                  </tr>
                ) : (
                  prodStats.highReturns.map(p => (
                    <tr key={p.id} className="hover:bg-pink-50/30">
                      <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-2">
                        <img src={p.image} alt="" className="w-7 h-7 rounded-md object-contain border border-pink-100" />
                        <span className="truncate max-w-[320px]">{p.name}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-700">{p.unitsSold}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-700">{p.returns} returned</td>
                      <td className="py-3 px-3 text-right font-black text-rose-600">{p.returnRate}% return rate</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
