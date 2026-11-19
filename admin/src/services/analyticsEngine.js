/**
 * Salbeau Business Intelligence & Analytics Engine
 * Complete Financial, Sales, Inventory, P&L and Multi-Dimensional Reporting
 * Designed for Indian E-Commerce with Asia/Kolkata (IST) timezone precision.
 */

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_week', label: 'Last Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'last_quarter', label: 'Last Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'custom', label: 'Custom Range' }
];

// IST Offset in milliseconds (UTC + 5 hours 30 minutes)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getNowIST() {
  const utcNow = new Date();
  return new Date(utcNow.getTime() + IST_OFFSET_MS);
}

export function toISTDateString(date) {
  if (!date) {
    const fallback = new Date();
    const istFallback = new Date(fallback.getTime() + IST_OFFSET_MS);
    return istFallback.toISOString().split('T')[0];
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const istFallback = new Date(fallback.getTime() + IST_OFFSET_MS);
    return istFallback.toISOString().split('T')[0];
  }
  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  if (isNaN(istDate.getTime())) {
    const fallback = new Date();
    return fallback.toISOString().split('T')[0];
  }
  return istDate.toISOString().split('T')[0];
}

/**
 * Calculates start and end timestamps (UTC ISO strings) for any date preset or custom range
 */
export function resolveDateRange(presetId, customStart = null, customEnd = null) {
  const now = new Date();
  // Anchor to current IST local date
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const curYear = istNow.getUTCFullYear();
  const curMonth = istNow.getUTCMonth(); // 0-indexed
  const curDay = istNow.getUTCDate();
  const dayOfWeek = istNow.getUTCDay(); // 0 = Sun, 1 = Mon...

  let startIST = new Date(Date.UTC(curYear, curMonth, curDay, 0, 0, 0));
  let endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));

  switch (presetId) {
    case 'today':
      // Already startIST & endIST of today
      break;

    case 'yesterday': {
      startIST = new Date(Date.UTC(curYear, curMonth, curDay - 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay - 1, 23, 59, 59, 999));
      break;
    }

    case 'last_7_days': {
      startIST = new Date(Date.UTC(curYear, curMonth, curDay - 6, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'last_30_days': {
      startIST = new Date(Date.UTC(curYear, curMonth, curDay - 29, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'this_week': {
      // Monday as week start
      const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startIST = new Date(Date.UTC(curYear, curMonth, curDay - diffToMon, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'last_week': {
      const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonDay = curDay - diffToMon - 7;
      startIST = new Date(Date.UTC(curYear, curMonth, lastMonDay, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, lastMonDay + 6, 23, 59, 59, 999));
      break;
    }

    case 'this_month': {
      startIST = new Date(Date.UTC(curYear, curMonth, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'last_month': {
      const prevMonthLastDay = new Date(Date.UTC(curYear, curMonth, 0)).getUTCDate();
      startIST = new Date(Date.UTC(curYear, curMonth - 1, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth - 1, prevMonthLastDay, 23, 59, 59, 999));
      break;
    }

    case 'this_quarter': {
      const qStartMonth = Math.floor(curMonth / 3) * 3;
      startIST = new Date(Date.UTC(curYear, qStartMonth, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'last_quarter': {
      const qCurrentStartMonth = Math.floor(curMonth / 3) * 3;
      const prevQStartMonth = qCurrentStartMonth - 3;
      const lastDayOfPrevQ = new Date(Date.UTC(curYear, qCurrentStartMonth, 0)).getUTCDate();
      startIST = new Date(Date.UTC(curYear, prevQStartMonth, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, prevQStartMonth + 2, lastDayOfPrevQ, 23, 59, 59, 999));
      break;
    }

    case 'this_year': {
      startIST = new Date(Date.UTC(curYear, 0, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
      break;
    }

    case 'last_year': {
      startIST = new Date(Date.UTC(curYear - 1, 0, 1, 0, 0, 0));
      endIST = new Date(Date.UTC(curYear - 1, 11, 31, 23, 59, 59, 999));
      break;
    }

    case 'custom': {
      if (customStart && typeof customStart === 'string' && customStart.includes('-')) {
        const [sy, sm, sd] = customStart.split('-').map(Number);
        if (!isNaN(sy) && !isNaN(sm) && !isNaN(sd)) {
          startIST = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));
        }
      }
      if (customEnd && typeof customEnd === 'string' && customEnd.includes('-')) {
        const [ey, em, ed] = customEnd.split('-').map(Number);
        if (!isNaN(ey) && !isNaN(em) && !isNaN(ed)) {
          endIST = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
        }
      }
      break;
    }

    default:
      break;
  }

  // Ensure startIST and endIST are valid
  if (isNaN(startIST.getTime())) {
    startIST = new Date(Date.UTC(curYear, curMonth, 1, 0, 0, 0));
  }
  if (isNaN(endIST.getTime())) {
    endIST = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
  }

  // Convert back from IST wall clock to actual UTC timestamps
  const startUTC = new Date(startIST.getTime() - IST_OFFSET_MS);
  const endUTC = new Date(endIST.getTime() - IST_OFFSET_MS);
  const safeStartUTC = isNaN(startUTC.getTime()) ? new Date() : startUTC;
  const safeEndUTC = isNaN(endUTC.getTime()) ? new Date() : endUTC;

  // Compute duration in ms for previous period comparison
  const durationMs = Math.max(1, safeEndUTC.getTime() - safeStartUTC.getTime());
  const prevEndUTC = new Date(safeStartUTC.getTime() - 1);
  const prevStartUTC = new Date(prevEndUTC.getTime() - durationMs);

  return {
    startUTC: safeStartUTC.toISOString(),
    endUTC: safeEndUTC.toISOString(),
    prevStartUTC: isNaN(prevStartUTC.getTime()) ? safeStartUTC.toISOString() : prevStartUTC.toISOString(),
    prevEndUTC: isNaN(prevEndUTC.getTime()) ? safeEndUTC.toISOString() : prevEndUTC.toISOString(),
    startDateIST: startIST.toISOString().split('T')[0],
    endDateIST: endIST.toISOString().split('T')[0]
  };
}

/**
 * Extracts order items safely from orders table
 */
export function extractOrderItems(order) {
  if (Array.isArray(order.items)) return order.items;
  if (order.items && typeof order.items === 'object') {
    if (Array.isArray(order.items.items)) return order.items.items;
    return Object.values(order.items);
  }
  return [];
}

/**
 * Resolves product unit cost price with reliable fallbacks
 */
export function resolveProductCost(item, productsMap = new Map()) {
  const masterProduct = item.product_id ? productsMap.get(item.product_id) : null;
  const cost = 
    Number(item.cost_price) || 
    Number(item.purchase_cost) || 
    Number(item.costPrice) ||
    Number(masterProduct?.cost_price) || 
    Number(masterProduct?.purchase_cost) || 
    Number(masterProduct?.costPrice) ||
    0;

  if (cost > 0) return cost;

  // Cosmetic wholesale fallback: 55% of retail selling price if cost not recorded
  const sellingPrice = Number(item.price) || Number(item.unit_price) || 0;
  return Math.round(sellingPrice * 0.55);
}

/**
 * Calculates complete Business Intelligence, 14 KPIs and Financial Models
 */
export function computeBusinessAnalytics({
  orders = [],
  products = [],
  expenses = [],
  users = [],
  dateRange
}) {
  const { startUTC, endUTC, prevStartUTC, prevEndUTC, startDateIST, endDateIST } = dateRange;

  const startMs = new Date(startUTC).getTime();
  const endMs = new Date(endUTC).getTime();
  const prevStartMs = new Date(prevStartUTC).getTime();
  const prevEndMs = new Date(prevEndUTC).getTime();

  // Create fast product lookup map
  const productsMap = new Map();
  products.forEach(p => {
    if (p.id) productsMap.set(p.id, p);
  });

  // Filter current period orders
  const currentOrders = orders.filter(o => {
    if (!o || typeof o !== 'object') return false;
    const rawDate = o.placed_at || o.created_at || o.date;
    if (!rawDate) return false;
    const oDate = new Date(rawDate).getTime();
    if (isNaN(oDate)) return false;
    return oDate >= startMs && oDate <= endMs;
  });

  // Filter previous period orders for comparison
  const previousOrders = orders.filter(o => {
    if (!o || typeof o !== 'object') return false;
    const rawDate = o.placed_at || o.created_at || o.date;
    if (!rawDate) return false;
    const oDate = new Date(rawDate).getTime();
    if (isNaN(oDate)) return false;
    return oDate >= prevStartMs && oDate <= prevEndMs;
  });

  // Filter current period expenses
  const currentExpenses = expenses.filter(e => {
    if (!e || typeof e !== 'object') return false;
    const rawDate = e.date || e.created_at;
    if (!rawDate) return false;
    const eDate = new Date(rawDate).getTime();
    if (isNaN(eDate)) return false;
    return eDate >= startMs && eDate <= endMs;
  });

  // Filter previous period expenses
  const previousExpenses = expenses.filter(e => {
    if (!e || typeof e !== 'object') return false;
    const rawDate = e.date || e.created_at;
    if (!rawDate) return false;
    const eDate = new Date(rawDate).getTime();
    if (isNaN(eDate)) return false;
    return eDate >= prevStartMs && eDate <= prevEndMs;
  });

  // Helper to calculate financial metrics for a set of orders and expenses
  function calculatePeriodMetrics(periodOrders, periodExpenses) {
    let grossRevenue = 0;
    let netSales = 0;
    let totalCogs = 0;
    let totalLoss = 0;
    let totalRefunds = 0;
    let outstandingAmount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let returnedCount = 0;
    let pendingCount = 0;
    const customerSet = new Set();

    let b2bRevenue = 0;
    let b2bOrdersCount = 0;
    let b2bCogs = 0;

    let b2cRevenue = 0;
    let b2cOrdersCount = 0;
    let b2cCogs = 0;

    const paymentBreakdown = {
      upi: { amount: 0, count: 0 },
      cod: { amount: 0, count: 0 },
      online: { amount: 0, count: 0 }
    };

    const productStats = new Map();

    periodOrders.forEach(order => {
      const orderTotal = Number(order.total_amount) || Number(order.total) || 0;
      const discount = Number(order.discount) || 0;
      const orderNet = Math.max(0, orderTotal - discount);
      const status = (order.status || '').toLowerCase();
      const paymentStatus = (order.payment_status || '').toLowerCase();
      const paymentMethod = (order.payment_method || '').toLowerCase();
      const isB2B = order.user_role === 'b2b' || order.order_type === 'b2b' || Boolean(order.b2b_trade);

      if (order.user_id || order.customer_id || order.phone) {
        customerSet.add(order.user_id || order.customer_id || order.phone);
      }

      // Order status buckets
      if (status === 'delivered' || status === 'completed') {
        deliveredCount++;
      } else if (status === 'cancelled') {
        cancelledCount++;
      } else if (status === 'returned' || status === 'refunded' || status === 'return_requested') {
        returnedCount++;
      } else {
        pendingCount++;
      }

      // Track payment methods
      if (paymentMethod.includes('upi')) {
        paymentBreakdown.upi.amount += orderTotal;
        paymentBreakdown.upi.count++;
      } else if (paymentMethod.includes('cod') || paymentMethod.includes('cash')) {
        paymentBreakdown.cod.amount += orderTotal;
        paymentBreakdown.cod.count++;
      } else {
        paymentBreakdown.online.amount += orderTotal;
        paymentBreakdown.online.count++;
      }

      // Outstanding check
      if (paymentStatus === 'pending' || paymentStatus === 'unpaid' || status === 'placed') {
        outstandingAmount += orderTotal;
      }

      // Financials (exclude cancelled from revenue)
      if (status !== 'cancelled') {
        grossRevenue += orderTotal;
        netSales += orderNet;

        // B2B vs B2C
        if (isB2B) {
          b2bRevenue += orderTotal;
          b2bOrdersCount++;
        } else {
          b2cRevenue += orderTotal;
          b2cOrdersCount++;
        }

        // Calculate COGS per item
        const items = extractOrderItems(order);
        let orderCogs = 0;

        items.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const unitCost = resolveProductCost(item, productsMap);
          const itemCostTotal = unitCost * qty;
          const itemRevenue = (Number(item.price) || 0) * qty;

          orderCogs += itemCostTotal;

          // Track Product level performance
          const pId = item.product_id || item.id || item.title || item.name;
          const pName = item.title || item.name || 'Unknown Product';
          const pImage = item.image || item.thumbnail || masterProductImage(item.product_id, productsMap);

          if (!productStats.has(pId)) {
            productStats.set(pId, {
              id: pId,
              name: pName,
              image: pImage,
              unitsSold: 0,
              revenue: 0,
              cogs: 0,
              returns: 0
            });
          }

          const currStat = productStats.get(pId);
          currStat.unitsSold += qty;
          currStat.revenue += itemRevenue;
          currStat.cogs += itemCostTotal;
          if (status === 'returned') {
            currStat.returns += qty;
          }
        });

        totalCogs += orderCogs;
        if (isB2B) b2bCogs += orderCogs;
        else b2cCogs += orderCogs;
      }

      // Handle Returns / Losses
      if (status === 'returned' || status === 'refunded') {
        const refundAmt = Number(order.refund_amount) || orderTotal;
        totalRefunds += refundAmt;
        // Estimated loss: return shipping costs + 20% unsellable item depreciation
        totalLoss += Math.round(refundAmt * 0.25) + 120; // 120 reverse logistics charge
      } else if (status === 'cancelled') {
        // Minor cancellation handling charge loss
        totalLoss += 40;
      }
    });

    const totalOrdersCount = periodOrders.length;
    const aov = deliveredCount + pendingCount > 0 
      ? Math.round(grossRevenue / (deliveredCount + pendingCount)) 
      : 0;

    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const grossProfit = Math.max(0, netSales - totalCogs);
    const netProfit = grossProfit - totalExpenses - totalLoss;
    const netProfitMargin = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(1) : 0;

    return {
      totalOrders: totalOrdersCount,
      deliveredCount,
      cancelledCount,
      returnedCount,
      pendingCount,
      totalCustomers: customerSet.size,
      grossRevenue,
      netSales,
      cogs: totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      netProfitMargin: Number(netProfitMargin),
      totalLoss,
      totalRefunds,
      outstandingAmount,
      aov,
      b2b: {
        revenue: b2bRevenue,
        orders: b2bOrdersCount,
        cogs: b2bCogs,
        grossProfit: Math.max(0, b2bRevenue - b2bCogs),
        aov: b2bOrdersCount > 0 ? Math.round(b2bRevenue / b2bOrdersCount) : 0
      },
      b2c: {
        revenue: b2cRevenue,
        orders: b2cOrdersCount,
        cogs: b2cCogs,
        grossProfit: Math.max(0, b2cRevenue - b2cCogs),
        aov: b2cOrdersCount > 0 ? Math.round(b2cRevenue / b2cOrdersCount) : 0
      },
      paymentBreakdown,
      productStats
    };
  }

  function masterProductImage(id, map) {
    if (!id) return '/Logo.png';
    const p = map.get(id);
    if (!p) return '/Logo.png';
    if (p.images && p.images[0]) return p.images[0];
    if (p.thumbnail) return p.thumbnail;
    return '/Logo.png';
  }

  // Calculate current & previous metrics
  const current = calculatePeriodMetrics(currentOrders, currentExpenses);
  const previous = calculatePeriodMetrics(previousOrders, previousExpenses);

  // Growth percentage calculator
  function computeGrowth(curr, prev) {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  }

  const growth = {
    grossRevenue: computeGrowth(current.grossRevenue, previous.grossRevenue),
    netSales: computeGrowth(current.netSales, previous.netSales),
    totalOrders: computeGrowth(current.totalOrders, previous.totalOrders),
    totalCustomers: computeGrowth(current.totalCustomers, previous.totalCustomers),
    grossProfit: computeGrowth(current.grossProfit, previous.grossProfit),
    netProfit: computeGrowth(current.netProfit, previous.netProfit),
    totalExpenses: computeGrowth(current.totalExpenses, previous.totalExpenses),
    aov: computeGrowth(current.aov, previous.aov)
  };

  // Inventory valuation across entire catalog
  let totalCatalogProducts = products.length;
  let totalCatalogStock = 0;
  let totalInventoryValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let deadStockCount = 0;

  // Active sold product IDs in current period
  const activeSoldProductIds = new Set(Array.from(current.productStats.keys()));

  products.forEach(p => {
    const stock = Number(p.stock) || 0;
    totalCatalogStock += stock;
    const unitCost = Number(p.cost_price) || Number(p.purchase_cost) || Number(p.costPrice) || Math.round((Number(p.price) || 0) * 0.55);
    totalInventoryValuation += stock * unitCost;

    if (stock === 0) {
      outOfStockCount++;
    } else if (stock <= 10) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    // Dead stock: has stock (> 15 units) but zero sales in this period
    if (stock > 15 && !activeSoldProductIds.has(p.id)) {
      deadStockCount++;
    }
  });

  // Product Rankings
  const productStatsList = Array.from(current.productStats.values());
  const topSellingByVolume = [...productStatsList].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
  const topSellingByRevenue = [...productStatsList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const mostProfitableProducts = [...productStatsList]
    .map(p => ({ ...p, profit: p.revenue - p.cogs, margin: p.revenue > 0 ? (((p.revenue - p.cogs) / p.revenue) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const zeroSaleProducts = products
    .filter(p => !activeSoldProductIds.has(p.id))
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      name: p.name || p.title,
      price: p.price,
      stock: p.stock,
      image: (p.images && p.images[0]) || p.thumbnail || '/Logo.png'
    }));

  const highReturnProducts = [...productStatsList]
    .filter(p => p.returns > 0)
    .map(p => ({ ...p, returnRate: p.unitsSold > 0 ? ((p.returns / p.unitsSold) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 5);

  // Daily time series for trend charts
  const dailyMap = new Map();
  currentOrders.forEach(o => {
    const dayStr = toISTDateString(o.placed_at || o.created_at || o.date);
    if (!dailyMap.has(dayStr)) {
      dailyMap.set(dayStr, { date: dayStr, revenue: 0, orders: 0, profit: 0 });
    }
    const dayEntry = dailyMap.get(dayStr);
    const amt = Number(o.total_amount) || 0;
    if (o.status !== 'cancelled') {
      dayEntry.revenue += amt;
      dayEntry.orders += 1;
      dayEntry.profit += Math.round(amt * 0.45); // estimated gross day margin
    }
  });

  const timeSeriesData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    kpis: {
      totalRevenue: current.grossRevenue,
      totalSales: current.netSales,
      totalOrders: current.totalOrders,
      totalCustomers: current.totalCustomers,
      totalExpenses: current.totalExpenses,
      cogs: current.cogs,
      grossProfit: current.grossProfit,
      netProfit: current.netProfit,
      netProfitMargin: current.netProfitMargin,
      totalLoss: current.totalLoss,
      totalRefunds: current.totalRefunds,
      outstandingPayments: current.outstandingAmount,
      inventoryValue: totalInventoryValuation,
      aov: current.aov
    },
    growth,
    orderFulfillment: {
      total: current.totalOrders,
      delivered: current.deliveredCount,
      pending: current.pendingCount,
      cancelled: current.cancelledCount,
      returned: current.returnedCount
    },
    inventory: {
      totalProducts: totalCatalogProducts,
      totalStock: totalCatalogStock,
      valuation: totalInventoryValuation,
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      deadStock: deadStockCount
    },
    b2bVsB2c: {
      b2b: current.b2b,
      b2c: current.b2c
    },
    paymentMethods: current.paymentBreakdown,
    products: {
      topByVolume: topSellingByVolume,
      topByRevenue: topSellingByRevenue,
      mostProfitable: mostProfitableProducts,
      zeroSales: zeroSaleProducts,
      highReturns: highReturnProducts
    },
    timeSeries: timeSeriesData,
    dateRangeSummary: {
      startDateIST,
      endDateIST
    }
  };
}

/**
 * 16 Dedicated Reports Master Definitions & Table Schema
 */
export const REPORT_TYPES = [
  { id: 'daily_sales', name: '1. Daily Sales & Performance Report', category: 'Sales' },
  { id: 'weekly_sales', name: '2. Weekly Sales Report', category: 'Sales' },
  { id: 'monthly_sales', name: '3. Monthly Sales & Revenue Report', category: 'Sales' },
  { id: 'quarterly_perf', name: '4. Quarterly Business Performance Report', category: 'Financial' },
  { id: 'annual_financial', name: '5. Annual / Yearly Financial Report', category: 'Financial' },
  { id: 'detailed_sales', name: '6. Detailed Sales Report (Order-Level)', category: 'Sales' },
  { id: 'profit_loss', name: '7. Profit & Loss (P&L) Statement', category: 'Financial' },
  { id: 'expenses_detailed', name: '8. Business Expenses Detailed Report', category: 'Expense' },
  { id: 'product_performance', name: '9. Product Performance & Margin Report', category: 'Product' },
  { id: 'inventory_valuation', name: '10. Inventory Valuation & Stock Movement', category: 'Inventory' },
  { id: 'customer_analytics', name: '11. Customer Acquisition & LTV Report', category: 'Customer' },
  { id: 'b2b_wholesale', name: '12. B2B Wholesale & Salon Trade Report', category: 'B2B' },
  { id: 'b2c_retail', name: '13. B2C Retail Order Report', category: 'B2C' },
  { id: 'payment_reconciliation', name: '14. Payment Method & Reconciliation', category: 'Payment' },
  { id: 'returns_loss', name: '15. Returns, Cancellations & Loss Analysis', category: 'Loss' },
  { id: 'gst_summary', name: '16. GST & Tax Liability Summary', category: 'Tax' }
];

/**
 * Generates table data and columns for each of the 16 reports
 */
export function generateReportData(reportId, { orders = [], products = [], expenses = [], users = [], dateRange }) {
  const { startUTC, endUTC } = dateRange;
  const startMs = new Date(startUTC).getTime();
  const endMs = new Date(endUTC).getTime();

  // Filter orders and expenses safely
  const filteredOrders = orders.filter(o => {
    if (!o || typeof o !== 'object') return false;
    const raw = o.placed_at || o.created_at || o.date;
    if (!raw) return false;
    const t = new Date(raw).getTime();
    if (isNaN(t)) return false;
    return t >= startMs && t <= endMs;
  });

  const filteredExpenses = expenses.filter(e => {
    if (!e || typeof e !== 'object') return false;
    const raw = e.date || e.created_at;
    if (!raw) return false;
    const t = new Date(raw).getTime();
    if (isNaN(t)) return false;
    return t >= startMs && t <= endMs;
  });

  switch (reportId) {
    case 'daily_sales': {
      const days = new Map();
      filteredOrders.forEach(o => {
        const d = toISTDateString(o.placed_at || o.created_at);
        if (!days.has(d)) days.set(d, { date: d, orders: 0, delivered: 0, revenue: 0, aov: 0 });
        const row = days.get(d);
        row.orders++;
        if (o.status === 'delivered') row.delivered++;
        if (o.status !== 'cancelled') row.revenue += Number(o.total_amount) || 0;
      });
      const rows = Array.from(days.values()).map(r => ({
        ...r,
        aov: r.orders > 0 ? Math.round(r.revenue / r.orders) : 0
      })).sort((a, b) => b.date.localeCompare(a.date));

      return {
        columns: [
          { key: 'date', label: 'Date (IST)' },
          { key: 'orders', label: 'Total Orders' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'revenue', label: 'Gross Revenue (₹)', format: 'currency' },
          { key: 'aov', label: 'AOV (₹)', format: 'currency' }
        ],
        rows
      };
    }

    case 'detailed_sales': {
      const rows = filteredOrders.map(o => ({
        id: o.id || o.order_id || 'ORD',
        date: toISTDateString(o.placed_at || o.created_at),
        customer: o.user_name || o.customer_name || o.shipping_address?.name || 'Customer',
        userRole: (o.user_role || 'b2c').toUpperCase(),
        status: (o.status || 'placed').toUpperCase(),
        paymentMethod: (o.payment_method || 'UPI').toUpperCase(),
        paymentStatus: (o.payment_status || 'pending').toUpperCase(),
        amount: Number(o.total_amount) || 0
      }));
      return {
        columns: [
          { key: 'id', label: 'Order ID' },
          { key: 'date', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'userRole', label: 'Type' },
          { key: 'status', label: 'Status' },
          { key: 'paymentMethod', label: 'Payment' },
          { key: 'paymentStatus', label: 'Payment Status' },
          { key: 'amount', label: 'Order Amount (₹)', format: 'currency' }
        ],
        rows
      };
    }

    case 'profit_loss': {
      let sales = 0;
      let cogs = 0;
      filteredOrders.forEach(o => {
        if (o.status !== 'cancelled') {
          sales += Number(o.total_amount) || 0;
          cogs += Math.round((Number(o.total_amount) || 0) * 0.55);
        }
      });
      const grossProfit = sales - cogs;
      const totalExp = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const netProfit = grossProfit - totalExp;

      const rows = [
        { item: 'Gross Sales Revenue', category: 'Income', amount: sales },
        { item: 'Less: Cost of Goods Sold (COGS)', category: 'Direct Cost', amount: -cogs },
        { item: 'GROSS PROFIT', category: 'Summary', amount: grossProfit },
        { item: 'Less: Operating Expenses (Salaries, Rent, Marketing, Logistics)', category: 'Operating Cost', amount: -totalExp },
        { item: 'NET BUSINESS PROFIT / (LOSS)', category: 'Bottom Line', amount: netProfit }
      ];

      return {
        columns: [
          { key: 'item', label: 'P&L Line Item' },
          { key: 'category', label: 'Classification' },
          { key: 'amount', label: 'Amount (₹)', format: 'currency' }
        ],
        rows
      };
    }

    case 'expenses_detailed': {
      const rows = filteredExpenses.map(e => ({
        id: e.id,
        date: e.date,
        title: e.title,
        category: (e.category || '').toUpperCase(),
        vendor: e.vendor || 'N/A',
        paymentMethod: e.paymentMethod,
        ref: e.referenceNumber || 'N/A',
        amount: Number(e.amount) || 0
      }));
      return {
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'title', label: 'Expense Title' },
          { key: 'category', label: 'Category' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'paymentMethod', label: 'Mode' },
          { key: 'ref', label: 'Ref / Invoice' },
          { key: 'amount', label: 'Amount (₹)', format: 'currency' }
        ],
        rows
      };
    }

    case 'product_performance': {
      const pMap = new Map();
      filteredOrders.forEach(o => {
        if (o.status !== 'cancelled') {
          extractOrderItems(o).forEach(i => {
            const name = i.title || i.name || 'Product';
            if (!pMap.has(name)) pMap.set(name, { name, qty: 0, revenue: 0 });
            const r = pMap.get(name);
            const q = Number(i.quantity) || 1;
            r.qty += q;
            r.revenue += (Number(i.price) || 0) * q;
          });
        }
      });
      const rows = Array.from(pMap.values()).map(r => ({
        name: r.name,
        qty: r.qty,
        revenue: r.revenue,
        cogs: Math.round(r.revenue * 0.55),
        profit: Math.round(r.revenue * 0.45)
      })).sort((a, b) => b.revenue - a.revenue);

      return {
        columns: [
          { key: 'name', label: 'Product Name' },
          { key: 'qty', label: 'Units Sold' },
          { key: 'revenue', label: 'Gross Revenue (₹)', format: 'currency' },
          { key: 'cogs', label: 'Estimated COGS (₹)', format: 'currency' },
          { key: 'profit', label: 'Gross Profit (₹)', format: 'currency' }
        ],
        rows
      };
    }

    case 'inventory_valuation': {
      const rows = products.map(p => {
        const stock = Number(p.stock) || 0;
        const price = Number(p.price) || 0;
        const cost = Number(p.cost_price) || Number(p.purchase_cost) || Math.round(price * 0.55);
        return {
          sku: p.sku || p.id?.substring(0, 8),
          name: p.name || p.title,
          stock,
          unitCost: cost,
          retailPrice: price,
          valuation: stock * cost,
          status: stock === 0 ? 'OUT OF STOCK' : stock <= 10 ? 'LOW STOCK' : 'IN STOCK'
        };
      });
      return {
        columns: [
          { key: 'sku', label: 'SKU / Code' },
          { key: 'name', label: 'Product Name' },
          { key: 'stock', label: 'Available Stock' },
          { key: 'unitCost', label: 'Purchase Cost (₹)', format: 'currency' },
          { key: 'retailPrice', label: 'Selling Price (₹)', format: 'currency' },
          { key: 'valuation', label: 'Total Valuation (₹)', format: 'currency' },
          { key: 'status', label: 'Stock Health' }
        ],
        rows
      };
    }

    case 'gst_summary': {
      let taxableSales = 0;
      filteredOrders.forEach(o => {
        if (o.status !== 'cancelled') taxableSales += Number(o.total_amount) || 0;
      });
      // 18% standard GST calculation breakdown (CGST 9% + SGST 9%)
      const baseValue = Math.round(taxableSales / 1.18);
      const totalTax = taxableSales - baseValue;
      const cgst = Math.round(totalTax / 2);
      const sgst = totalTax - cgst;

      const rows = [
        { rate: '18% GST (Standard Cosmetics)', base: baseValue, cgst, sgst, totalTax, gross: taxableSales }
      ];

      return {
        columns: [
          { key: 'rate', label: 'Tax Slab' },
          { key: 'base', label: 'Taxable Turnover (₹)', format: 'currency' },
          { key: 'cgst', label: 'CGST (9%) (₹)', format: 'currency' },
          { key: 'sgst', label: 'SGST (9%) (₹)', format: 'currency' },
          { key: 'totalTax', label: 'Total Output Tax (₹)', format: 'currency' },
          { key: 'gross', label: 'Gross Invoice Total (₹)', format: 'currency' }
        ],
        rows
      };
    }

    // Default generator for remaining reports (B2B, B2C, Payment, Weekly, Monthly, etc.)
    default: {
      const rows = filteredOrders.slice(0, 50).map(o => ({
        id: o.id || 'ORD',
        date: toISTDateString(o.placed_at || o.created_at),
        customer: o.user_name || o.customer_name || 'Customer',
        type: (o.user_role || 'b2c').toUpperCase(),
        method: (o.payment_method || 'UPI').toUpperCase(),
        status: (o.status || 'placed').toUpperCase(),
        total: Number(o.total_amount) || 0
      }));
      return {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'date', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'type', label: 'Trade Type' },
          { key: 'method', label: 'Payment Mode' },
          { key: 'status', label: 'Status' },
          { key: 'total', label: 'Amount (₹)', format: 'currency' }
        ],
        rows
      };
    }
  }
}
