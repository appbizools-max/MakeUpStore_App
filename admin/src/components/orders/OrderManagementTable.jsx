import React, { useState, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Hourglass,
  Truck,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Search,
  Filter,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  MoreVertical,
  Banknote,
  Smartphone,
  Clock,
  Check,
  MapPin,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  Calendar,
  X,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Layers,
  Wand2,
  Image as ImageIcon,
  QrCode,
  Upload,
  CreditCard as LucideCreditCard
} from 'lucide-react';

// Resilient icon with SVG fallback to guarantee zero runtime reference errors
const CreditCardIcon = (props) => {
  if (typeof LucideCreditCard !== 'undefined' && LucideCreditCard) {
    return <LucideCreditCard {...props} />;
  }
  return (
    <svg width={props?.size || 16} height={props?.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props?.className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
};
import * as XLSX from 'xlsx';
import FulfillmentStatusSelector from './FulfillmentStatusSelector';
import { useAdmin } from '../../context/AdminContext';

export const isTestOrder = (o) => {
  if (!o) return false;
  const name = String(o.userName || '').toLowerCase();
  const phone = String(o.phone || '').replace(/\D/g, '');
  const itemsText = (o.items || []).map(i => i.product?.name || i.name || '').join(' ').toLowerCase();
  return (
    name.includes('test') ||
    name.includes('demo') ||
    name.includes('sample') ||
    itemsText.includes('demo ') ||
    itemsText.includes('test ') ||
    ['9999999999', '0000000000', '1234567890'].includes(phone)
  );
};

export const OrderManagementTable = ({
  orders = [],
  employees = [],
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderPaymentMethod,
  assignOrderToEmployee,
  deleteOrder,
  bulkDeleteOrders,
  clearTestOrders,
  currentAuthUser,
  onViewInvoice,
  onRefresh,
  isLoading = false
}) => {
  // Table container ref for smooth horizontal scrolling
  const tableScrollRef = useRef(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all'); // all, b2c, b2b, salon, artist, beautician
  const [branchFilter, setBranchFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all'); // all, unassigned, or empId
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  // Multi-selection state for batch actions
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    orderIds: [],
    orders: [],
    isTestClear: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Product expanded map for "+X more items"
  const [expandedOrders, setExpandedOrders] = useState({});

  // Payment Proof Viewer state (QR is accessible strictly via Delivery Partner App)
  const [viewingProof, setViewingProof] = useState(null);
  const adminCtx = useAdmin() || {};
  const verifyUpiPayment = adminCtx.verifyUpiPayment;
  const generalSettings = adminCtx.generalSettings;
  const updateGeneralSettings = adminCtx.updateGeneralSettings;
  const quickUpdateUpiQr = adminCtx.quickUpdateUpiQr;

  // Live Store UPI & Rider Payment QR Code Management Modal
  // Live Store UPI & Rider Payment Credentials Modal
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState(false);
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiName: ''
  });
  const [isSavingUpiQr, setIsSavingUpiQr] = useState(false);
  const [upiQrSaveSuccess, setUpiQrSaveSuccess] = useState(false);

  const openUpiQrModal = () => {
    setUpiForm({
      upiId: generalSettings?.payments?.upiId || '',
      upiName: generalSettings?.payments?.upiName || generalSettings?.identity?.storeName || 'Salbeau MakeUpStore'
    });
    setUpiQrSaveSuccess(false);
    setIsUpiQrModalOpen(true);
  };

  const handleSaveUpiQr = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!upiForm.upiId.trim()) {
      alert('Official UPI ID (VPA) is required.');
      return;
    }
    setIsSavingUpiQr(true);
    try {
      if (typeof quickUpdateUpiQr === 'function') {
        await quickUpdateUpiQr({
          upiId: upiForm.upiId,
          upiName: upiForm.upiName
        });
      } else if (typeof updateGeneralSettings === 'function') {
        await updateGeneralSettings({
          payments: {
            ...(generalSettings?.payments || {}),
            upiId: upiForm.upiId.trim(),
            upiName: upiForm.upiName.trim(),
            updatedAt: new Date().toISOString()
          }
        });
      }
      setUpiQrSaveSuccess(true);
      setTimeout(() => setUpiQrSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update UPI settings:', err);
      alert('Error saving UPI configuration: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingUpiQr(false);
    }
  };

  // Cash Confirmation Modal state
  const [cashModalOrder, setCashModalOrder] = useState(null);
  const [cashNote, setCashNote] = useState('');
  const [isConfirmingCash, setIsConfirmingCash] = useState(false);

  // Actions menu dropdown state
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Horizontal scroll helpers
  const scrollTable = (direction) => {
    if (tableScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      tableScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // ── METRIC CALCULATIONS ──────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = orders.length;
    let pending = 0;
    let ongoing = 0;
    let completed = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      const s = (o.status || 'placed').toLowerCase();
      const p = (o.paymentStatus || 'pending').toLowerCase();
      const amount = Number(o.totalAmount || 0);

      if (s === 'placed' || s === 'pending') pending++;
      else if (['confirmed', 'processing', 'packing', 'ready_to_dispatch', 'shipped', 'out_for_delivery'].includes(s)) ongoing++;
      else if (s === 'delivered' || s === 'completed') completed++;
      else if (s === 'cancelled' || s === 'rejected') cancelled++;

      if (p === 'paid' || s === 'delivered' || s === 'completed') {
        totalRevenue += amount;
      }
    });

    return { total, pending, ongoing, completed, cancelled, totalRevenue };
  }, [orders]);

  // ── FILTERED ORDERS ──────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Text Search (ID, customer name, phone, product name)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = String(o.id || '').toLowerCase().includes(query);
        const matchesName = String(o.userName || '').toLowerCase().includes(query);
        const matchesPhone = String(o.phone || '').toLowerCase().includes(query);
        const matchesProduct = (o.items || []).some((item) =>
          String(item.product?.name || item.name || '').toLowerCase().includes(query)
        );
        if (!matchesId && !matchesName && !matchesPhone && !matchesProduct) {
          return false;
        }
      }

      // 2. Fulfillment Filter
      if (fulfillmentFilter !== 'all') {
        const ft = (o.deliveryType || 'delivery').toLowerCase();
        if (fulfillmentFilter === 'delivery' && ft !== 'delivery') return false;
        if (fulfillmentFilter === 'pickup' && ft !== 'pickup' && ft !== 'store_pickup') return false;
      }

      // 3. Payment Method Filter
      if (paymentMethodFilter !== 'all') {
        const pm = (o.paymentMethod || 'cash').toLowerCase();
        if (paymentMethodFilter !== pm) return false;
      }

      // 4. Payment Status Filter
      if (paymentStatusFilter !== 'all') {
        const ps = (o.paymentStatus || 'pending').toLowerCase();
        if (paymentStatusFilter === 'paid' && ps !== 'paid') return false;
        if (paymentStatusFilter === 'pending' && ps !== 'pending' && ps !== 'partially_paid') return false;
      }

      // 5. Order Status Filter
      if (orderStatusFilter !== 'all') {
        const st = (o.status || 'placed').toLowerCase();
        if (orderStatusFilter !== st) return false;
      }

      // 6. Customer Type Filter (B2C / B2B)
      if (customerTypeFilter !== 'all') {
        const role = (o.userRole || 'b2c').toLowerCase();
        if (customerTypeFilter === 'b2c' && ['salon', 'artist', 'beautician'].includes(role)) return false;
        if (customerTypeFilter === 'b2b' && !['salon', 'artist', 'beautician'].includes(role)) return false;
        if (['salon', 'artist', 'beautician'].includes(customerTypeFilter) && role !== customerTypeFilter) return false;
      }

      // 7. Branch Filter
      if (branchFilter !== 'all') {
        const br = (o.branch || '').toLowerCase();
        if (!br.includes(branchFilter.toLowerCase())) return false;
      }

      // 8. Assigned Staff Filter
      if (staffFilter !== 'all') {
        if (staffFilter === 'unassigned') {
          if (o.assignedEmployeeId || o.assignedEmployeeName) return false;
        } else {
          if (o.assignedEmployeeId !== staffFilter && o.assignedEmployeeName !== staffFilter) return false;
        }
      }

      // 9. Date Filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(o.date || o.placedAt);
        const now = new Date();
        if (dateFilter === 'today') {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [
    orders,
    searchTerm,
    fulfillmentFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    orderStatusFilter,
    customerTypeFilter,
    branchFilter,
    staffFilter,
    dateFilter
  ]);

  // Detected test/demo orders for quick bulk cleanup
  const testOrders = useMemo(() => orders.filter(isTestOrder), [orders]);

  // Unique branches from orders for branch filter dropdown
  const uniqueBranches = useMemo(() => {
    const set = new Set();
    orders.forEach(o => {
      if (o.branch) set.add(o.branch);
    });
    return Array.from(set);
  }, [orders]);

  // ── SELECTION & DELETION ACTIONS ─────────────────────────────────────────
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const openDeleteModalForSelected = () => {
    const targetOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    setDeleteConfirmModal({
      isOpen: true,
      orderIds: selectedOrderIds,
      orders: targetOrders,
      isTestClear: false
    });
  };

  const openDeleteModalForSingle = (order) => {
    setDeleteConfirmModal({
      isOpen: true,
      orderIds: [order.id],
      orders: [order],
      isTestClear: false
    });
  };

  const openClearTestOrdersModal = () => {
    setDeleteConfirmModal({
      isOpen: true,
      orderIds: testOrders.map(o => o.id),
      orders: testOrders,
      isTestClear: true
    });
  };

  const handleExecuteDeletion = async () => {
    if (!deleteConfirmModal.orderIds.length) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmModal.isTestClear && typeof clearTestOrders === 'function') {
        const res = await clearTestOrders();
        if (res && res.message && res.count === 0) {
          alert(res.message);
        }
      } else if (typeof bulkDeleteOrders === 'function') {
        await bulkDeleteOrders(deleteConfirmModal.orderIds);
      } else if (typeof deleteOrder === 'function') {
        for (const id of deleteConfirmModal.orderIds) {
          await deleteOrder(id);
        }
      }
      setSelectedOrderIds(prev => prev.filter(id => !deleteConfirmModal.orderIds.includes(id)));
      setDeleteConfirmModal({ isOpen: false, orderIds: [], orders: [], isTestClear: false });
    } catch (e) {
      alert('Error deleting orders: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── EXPORT TO EXCEL (COMPREHENSIVE ALL 22 AUDIT COLUMNS) ───────────────────
  const handleExportExcel = () => {
    try {
      const exportRows = filteredOrders.map((o) => {
        const role = (o.userRole || 'b2c').toLowerCase();
        const customerType = role === 'salon' ? 'B2B - Salon Owner'
          : role === 'artist' ? 'B2B - Makeup Artist'
          : role === 'beautician' ? 'B2B - Beautician'
          : 'B2C - Retail Customer';

        const rawItems = Array.isArray(o.items) ? o.items : [];
        const productNames = rawItems.map(i => i.product?.name || i.name || 'Product').join(', ');
        const productSkus = rawItems.map(i => i.product?.sku || i.sku || i.product?.barcode || i.barcode || '—').join(', ');
        const variantsShades = rawItems.map(i => {
          const shade = i.shade?.name || i.shade?.color_name || i.selectedShade?.name;
          const variant = i.variantName || i.variant || i.selectedVariant?.name;
          return [variant, shade].filter(Boolean).join(' - ') || 'Standard';
        }).join(', ');

        const totalQty = rawItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
        const subtotal = rawItems.reduce((sum, i) => sum + (Number(i.unitPrice || i.price || 0) * Number(i.quantity || 1)), 0);
        const discounts = Number(o.discount || o.couponDiscount || 0);
        const deliveryCharges = Number(o.deliveryFee || 0);
        const finalAmount = Number(o.totalAmount || (subtotal + deliveryCharges - discounts));
        const estimatedGst = Math.round(subtotal * 0.18);

        return {
          'Order ID': o.id,
          'Order Date': formatOrderDateTime(o.date || o.placedAt),
          'Customer Name': o.userName || 'Customer',
          'Customer Phone': o.phone || '',
          'Customer Type (B2B/B2C)': customerType,
          'Product Names': productNames || '—',
          'Product SKUs': productSkus,
          'Variants and Shades': variantsShades,
          'Quantity': totalQty,
          'Unit Price': rawItems.length === 1 ? Number(rawItems[0].unitPrice || rawItems[0].price || 0) : 'Multiple',
          'Role-based Pricing Tier': customerType,
          'Total Product Amount': subtotal,
          'Discounts': discounts,
          'GST (18% Incl.)': estimatedGst,
          'Delivery Charges': deliveryCharges,
          'Final Order Amount': finalAmount,
          'Fulfillment Type': o.deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          'Branch': o.branch || 'MG Road Branch',
          'Assigned Staff': o.assignedEmployeeName || 'Unassigned',
          'Order Status': (o.status || 'placed').toUpperCase(),
          'Payment Method': (o.paymentMethod || 'cash').toUpperCase() === 'QR' ? 'QR / Scanner' : 'Cash on Delivery',
          'Payment Status': (o.paymentStatus || 'pending').toUpperCase()
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      // Auto column widths
      if (exportRows.length > 0) {
        worksheet['!cols'] = Object.keys(exportRows[0]).map(key => ({
          wch: Math.max(key.length + 3, 14)
        }));
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      XLSX.writeFile(workbook, `Salbeau_Orders_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting orders:', err);
      alert('Failed to generate Excel export: ' + err.message);
    }
  };

  // Format date helper
  function formatOrderDateTime(dateVal) {
    if (!dateVal) return 'Recent';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  }

  // Handle Cash Payment Confirmation
  const handleConfirmCashPayment = async () => {
    if (!cashModalOrder) return;
    setIsConfirmingCash(true);
    try {
      await updateOrderPaymentStatus(
        cashModalOrder.id,
        'paid',
        'cash',
        cashNote ? `Cash collected by staff. Note: ${cashNote}` : 'Cash collected by delivery staff'
      );
      setCashModalOrder(null);
      setCashNote('');
      if (typeof onRefresh === 'function') onRefresh();
    } catch (e) {
      console.error('Error confirming cash payment:', e);
    } finally {
      setIsConfirmingCash(false);
    }
  };

  // Handle QR Payment Verification
  const handleVerifyQrPayment = async () => {
    if (!qrModalOrder) return;
    setIsVerifyingQr(true);
    try {
      await updateOrderPaymentStatus(
        qrModalOrder.id,
        'paid',
        'qr',
        qrUtrNumber ? `QR/UPI verified with UTR/Ref: ${qrUtrNumber}` : 'QR payment verified by staff'
      );
      setQrModalOrder(null);
      setQrUtrNumber('');
      if (typeof onRefresh === 'function') onRefresh();
    } catch (e) {
      console.error('Error verifying QR payment:', e);
    } finally {
      setIsVerifyingQr(false);
    }
  };

  return (
    <div className="space-y-6 font-['Manrope',sans-serif] animate-fade-in text-gray-900">
      {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-pink-100 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-[#1E1118] tracking-tight">Order Management</h1>
          <p className="text-xs text-[#8C7078] font-medium mt-1">
            Manage, track, and process all customer orders in real-time
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Sync Real-time Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700">Live Sync (Real-time)</span>
          </div>

          {/* Quick Store UPI & Rider Payment Credentials Button */}
          <button
            type="button"
            onClick={openUpiQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/90 text-purple-900 transition-colors shadow-2xs cursor-pointer font-bold text-xs"
            title="Manage Official Store UPI ID & Payee Name (Real-Time Sync to Delivery Rider App)"
          >
            <CreditCardIcon size={14} className="text-purple-700" />
            <span>Rider Store UPI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl border border-pink-100 bg-white hover:bg-pink-50/50 flex items-center justify-center text-gray-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw size={15} className={`text-[#D81B60] ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Date Presets Dropdown */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-pink-100 bg-white hover:border-[#D81B60] text-gray-800 outline-none cursor-pointer shadow-2xs transition-colors"
            >
              <option value="all">All Orders</option>
              <option value="today">Today Orders</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── TOP METRIC SUMMARY CARDS (MATCHING IMAGE 2) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF0F5] border border-pink-100 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} className="text-[#D81B60]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-gray-900">{metrics.total}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">↑ +12%</span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Total Orders</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Hourglass size={20} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black text-gray-900">{metrics.pending}</span>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Pending Orders</p>
          </div>
        </div>

        {/* Ongoing Orders */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <Truck size={20} className="text-sky-600" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black text-gray-900">{metrics.ongoing}</span>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Ongoing Orders</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black text-gray-900">{metrics.completed}</span>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Completed Orders</p>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <XCircle size={20} className="text-rose-600" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black text-gray-900">{metrics.cancelled}</span>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Cancelled Orders</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <IndianRupee size={20} className="text-purple-600" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-gray-900 truncate block">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* ── FILTER & ACTION ROW (MATCHING IMAGE 2) ───────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Customer, Product..."
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-pink-100 bg-white placeholder-gray-400 text-gray-800 outline-none focus:border-[#D81B60] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fulfillment Type */}
            <div className="relative">
              <select
                value={fulfillmentFilter}
                onChange={(e) => setFulfillmentFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">Fulfillment Type</option>
                <option value="delivery">Delivery</option>
                <option value="pickup">Store Pickup</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Customer Type Filter */}
            <div className="relative">
              <select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">Customer Type</option>
                <option value="b2c">B2C Retail Customers</option>
                <option value="b2b">All B2B Professionals</option>
                <option value="salon">Salon Owner</option>
                <option value="artist">Makeup Artist</option>
                <option value="beautician">Beautician</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Branch Filter */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Assigned Staff Filter */}
            <div className="relative">
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">All Staff</option>
                <option value="unassigned">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name || emp.fullName}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Method */}
            <div className="relative">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">Payment Method</option>
                <option value="cash">Cash</option>
                <option value="qr">QR / Scanner</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Status */}
            <div className="relative">
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">Payment Status</option>
                <option value="pending">COD Pending</option>
                <option value="paid">Paid</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Order Status */}
            <div className="relative">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-pink-100 bg-white text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
              >
                <option value="all">Order Status</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Completed / Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Admin Delete Selected Batch Button */}
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={openDeleteModalForSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs animate-fade-in"
                title="Delete Selected Orders"
              >
                <Trash2 size={14} className="text-rose-600" />
                <span>Delete Selected ({selectedOrderIds.length})</span>
              </button>
            )}

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={15} className="text-emerald-700" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Active Filter Info & Table Scroll Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-pink-100/60 text-xs">
          <div className="text-gray-500 font-medium">
            Showing <span className="font-bold text-[#D81B60]">{filteredOrders.length}</span> of {orders.length} Orders
          </div>

          {/* Smooth Horizontal Scroll Buttons as requested */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold hidden sm:inline mr-1">Scroll Table:</span>
            <button
              type="button"
              onClick={() => scrollTable('left')}
              className="w-8 h-8 rounded-lg border border-pink-200 bg-white hover:bg-pink-50 flex items-center justify-center text-gray-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft size={16} color="#D81B60" />
            </button>
            <button
              type="button"
              onClick={() => scrollTable('right')}
              className="w-8 h-8 rounded-lg border border-pink-200 bg-white hover:bg-pink-50 flex items-center justify-center text-gray-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight size={16} color="#D81B60" />
            </button>
          </div>
        </div>
      </div>

      {/* ── EXCEL-STYLE ORDER MANAGEMENT TABLE (MATCHING IMAGE 2) ───────── */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-xs overflow-hidden relative">
        <div
          ref={tableScrollRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-pink-50/20"
        >
          <table className="w-full text-left border-collapse min-w-[1280px]">
            {/* Table Header: Soft Pink Tinted Bar matching Image 2 */}
            <thead>
              <tr className="bg-[#FFF0F5] border-b border-[#FADCE8] text-[#30212B] text-[11.5px] uppercase font-black tracking-wider">
                <th className="py-3.5 px-3.5 rounded-l-xl whitespace-nowrap w-10 text-center sticky left-0 bg-[#FFF0F5] z-20">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-[#D81B60] focus:ring-[#D81B60] cursor-pointer accent-[#D81B60]"
                    title="Select All Orders"
                  />
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap sticky left-10 bg-[#FFF0F5] z-20 border-r border-pink-200/50 shadow-xs">Order ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[190px]">Customer & Address</th>
                <th className="py-3.5 px-4 min-w-[220px]">Products & Qty</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Fulfillment</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Branch</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Assigned Staff</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Order Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Payment Method</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">Payment Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Amount</th>
                <th className="py-3.5 px-4 text-center rounded-r-xl whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#FDF0F6] text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag size={36} className="text-[#D81B60] opacity-40" />
                      <p className="font-bold text-sm text-gray-700">No orders found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const items = Array.isArray(o.items) ? o.items : [];
                  const isExpanded = Boolean(expandedOrders[o.id]);
                  const displayedItems = isExpanded ? items : items.slice(0, 2);
                  const hasMoreItems = items.length > 2;

                  const shipMeta = (typeof o.shipments === 'object' && o.shipments) ? o.shipments : {};
                  const rawPaySt = String(o.payment_status || o.paymentStatus || shipMeta.paymentStatus || o.internalStatus || o.internal_status || '').toLowerCase().trim();
                  const verifSt = String(o.verification_status || o.verificationStatus || shipMeta.verificationStatus || '').toUpperCase().trim();
                  const itemSt = (Array.isArray(items) ? items.find(i => i?.paymentStatus)?.paymentStatus : '') || '';
                  const isPaid = ['paid', 'completed'].includes(rawPaySt) || ['paid', 'completed'].includes(String(shipMeta.paymentStatus || '').toLowerCase()) || verifSt === 'VERIFIED' || itemSt.toLowerCase() === 'paid';
                  const isQrMethod = (o.paymentMethod || o.payment_method || shipMeta.paymentMethod || '').toLowerCase() === 'qr';
                  const isSelected = selectedOrderIds.includes(o.id);

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-[#FFF9FB] transition-colors border-b border-[#FCE8F0] ${isSelected ? 'bg-pink-50/40' : ''}`}
                    >
                      {/* Selection Checkbox */}
                      <td className={`py-4 px-3.5 text-center align-top sticky left-0 z-10 ${isSelected ? 'bg-pink-50' : 'bg-white'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(o.id)}
                          className="w-4 h-4 rounded text-[#D81B60] focus:ring-[#D81B60] cursor-pointer accent-[#D81B60]"
                        />
                      </td>
                      {/* 1. ORDER ID */}
                      <td className={`py-4 px-4 align-top whitespace-nowrap sticky left-10 z-10 border-r border-pink-100/60 shadow-xs ${isSelected ? 'bg-pink-50' : 'bg-white'}`}>
                        <div className="font-extrabold text-[#D81B60] text-[12.5px] tracking-tight">
                          {o.id}
                        </div>
                        <div className="text-[10.5px] text-gray-400 font-medium mt-0.5">
                          {formatOrderDateTime(o.date || o.placedAt)}
                        </div>
                      </td>

                      {/* 2. CUSTOMER & ADDRESS */}
                      <td className="py-4 px-4 align-top min-w-[190px]">
                        <div className="flex items-start gap-2.5">
                          {/* Avatar Circle with initial */}
                          <div className="w-8 h-8 rounded-full bg-[#FFF0F5] border border-[#FADCE8] text-[#D81B60] font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {(o.userName || 'P').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{o.userName || 'Customer'}</div>
                            <div className="text-[11px] font-semibold text-gray-600 mt-0.5">
                              {o.phone || 'No phone'}
                            </div>
                            {o.deliveryAddress && (
                              <div className="text-[10px] text-gray-500 font-medium flex items-start gap-1 mt-1 max-w-[190px] leading-snug">
                                <MapPin size={11} className="text-[#D81B60] shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{o.deliveryAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. PRODUCTS (QTY) */}
                      <td className="py-4 px-4 align-top min-w-[220px]">
                        {items.length === 0 ? (
                          <span className="text-gray-400 italic text-[11px]">No items data</span>
                        ) : (
                          <div className="space-y-2">
                            {displayedItems.map((item, itIdx) => {
                              const prod = item.product || {};
                              const pName = prod.name || item.name || 'Cosmetic Item';
                              const shadeName = item.shade?.name || item.shade?.color_name || '';
                              const img = prod.image || item.image || (Array.isArray(prod.images) ? prod.images[0] : null);

                              return (
                                <div key={itIdx} className="flex items-center gap-2">
                                  {/* Product Thumbnail */}
                                  <div className="w-8 h-8 rounded-lg bg-white border border-pink-100 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
                                    {img ? (
                                      <img
                                        src={img}
                                        alt={pName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <ShoppingBag size={13} className="text-[#D81B60]" />
                                    )}
                                  </div>

                                  {/* Product Details */}
                                  <div className="min-w-0 flex-1 max-w-[170px]">
                                    <div className="font-semibold text-gray-900 text-[11px] leading-tight truncate" title={pName}>
                                      {pName}
                                    </div>
                                    {shadeName && (
                                      <div className="text-[9.5px] text-gray-500 font-medium truncate">
                                        (Shade: {shadeName})
                                      </div>
                                    )}
                                  </div>

                                  {/* Qty Pill Badge */}
                                  <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black text-[#D81B60] bg-[#FFF0F5] border border-[#FADCE8] shrink-0">
                                    Qty: {item.quantity || 1}
                                  </span>
                                </div>
                              );
                            })}

                            {hasMoreItems && (
                              <button
                                type="button"
                                onClick={() => toggleExpandOrder(o.id)}
                                className="text-[10.5px] font-bold text-[#D81B60] hover:underline cursor-pointer flex items-center gap-0.5 mt-1"
                              >
                                {isExpanded ? 'Show less' : `+${items.length - 2} more item${items.length - 2 > 1 ? 's' : ''}`}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 4. FULFILLMENT */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {o.deliveryType === 'delivery' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                            <span className="text-xs">🚚</span> Delivery
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
                            <span className="text-xs">🛍️</span> Pickup
                          </span>
                        )}
                      </td>

                      {/* 5. BRANCH */}
                      <td className="py-4 px-4 align-top whitespace-nowrap font-semibold text-gray-800 text-[11.5px]">
                        {o.branch || 'MG Road Branch'}
                      </td>

                      {/* 6. ASSIGNED STAFF */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <select
                          value={o.assignedEmployeeId || ''}
                          onChange={(e) => assignOrderToEmployee(o.id, e.target.value || null)}
                          className="px-2.5 py-1.5 text-xs rounded-xl border border-pink-100 bg-white font-medium text-gray-800 outline-none hover:border-[#D81B60] cursor-pointer shadow-2xs transition-colors"
                        >
                          <option value="">Unassigned</option>
                          {(employees || []).filter((e) => e.status === 'active').map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.employee_code || 'Staff'})
                            </option>
                          ))}
                        </select>
                        {o.assignedEmployeeName && (
                          <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{o.assignedEmployeeName}</span>
                          </div>
                        )}
                      </td>

                      {/* 7. ORDER STATUS */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <FulfillmentStatusSelector
                          order={o}
                          onUpdateStatus={updateOrderStatus}
                          onSuccessToast={() => {}}
                        />
                      </td>

                      {/* 8. PAYMENT METHOD & COLLECTION DETAILS */}
                      <td className="py-4 px-4 align-top">
                        {(() => {
                          const ship = (typeof o.shipments === 'object' && o.shipments) ? o.shipments : {};
                          const method = (ship.paymentMethod || o.paymentMethod || o.payment_method || 'cash').toLowerCase();
                          const isUpi = method === 'upi' || method === 'qr';
                          const collectedBy = ship.collectedBy || o.payment_collected_by || (ship.confirmedByStaff ? (ship.assignedEmployeeName || o.assignedEmployeeName) : null);
                          const collectedAt = ship.collectedAt || o.payment_collected_at || ship.deliveredAt;
                          const upiUtr = ship.upiUtr || o.upi_ref || ship.upiVerification?.upiTransactionId;
                          const proofUrl = ship.upiVerification?.proofUrl || ship.upiVerification?.payment_proof_url || ship.payment_proof_url || o.payment_proof;

                          return (
                            <div className="space-y-1.5 min-w-[190px]">
                              {/* Method Badge */}
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    isUpi
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {isUpi ? <Smartphone size={13} /> : <Banknote size={13} />}
                                  <span>{isUpi ? 'UPI / QR Payment' : 'Cash on Delivery (COD)'}</span>
                                </span>
                              </div>

                              {/* Collected By Details */}
                              {collectedBy && (
                                <div className="text-[11px] text-gray-600 font-semibold flex items-center gap-1">
                                  <User size={11} className="text-gray-400 shrink-0" />
                                  <span>Collected by: <strong className="text-gray-900">{collectedBy}</strong></span>
                                </div>
                              )}

                              {/* Collection Date and Time */}
                              {collectedAt && (
                                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                  <Clock size={10} className="text-gray-400 shrink-0" />
                                  <span>{new Date(collectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                              )}

                              {/* Transaction Reference (UTR) */}
                              {upiUtr && (
                                <div className="text-[10.5px] font-mono text-purple-700 bg-purple-50/70 border border-purple-100 rounded px-1.5 py-0.5 inline-block">
                                  UTR: <strong>{upiUtr}</strong>
                                </div>
                              )}

                              {/* Payment Proof Button */}
                              {proofUrl && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setViewingProof({
                                      url: proofUrl,
                                      orderId: o.id,
                                      customerName: o.userName,
                                      amount: o.totalAmount,
                                      utr: upiUtr,
                                      date: collectedAt
                                    })}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <ImageIcon size={11} />
                                    <span>View Payment Proof</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 9. PAYMENT STATUS & VERIFICATION */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {(() => {
                          const ship = (typeof o.shipments === 'object' && o.shipments) ? o.shipments : {};
                          const rawPay = String(o.payment_status || o.paymentStatus || ship.paymentStatus || o.internalStatus || o.internal_status || 'pending').toLowerCase();
                          const verifStatus = String(o.verification_status || o.verificationStatus || ship.verificationStatus || ship.upiVerification?.verificationStatus || '').toUpperCase();
                          const isVerified = rawPay === 'paid' || rawPay === 'completed' || verifStatus === 'VERIFIED';
                          const isPendingVerif = !isVerified && (rawPay === 'pending_verification' || verifStatus === 'PENDING_VERIFICATION' || verifStatus === 'PENDING');
                          const isCashCollected = !isVerified && (rawPay === 'collected' || rawPay === 'cash_collected');
                          const isFailed = !isVerified && (rawPay === 'failed' || verifStatus === 'REJECTED');

                          return (
                            <div className="flex flex-col gap-1.5 min-w-[170px]">
                              {/* Status Badge */}
                              {isVerified && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[11px] shadow-2xs">
                                  <Check size={13} className="text-emerald-700" />
                                  <span>Verified & Paid</span>
                                </div>
                              )}

                              {isPendingVerif && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 font-bold text-[11px] shadow-2xs">
                                  <Clock size={12} className="text-purple-600 animate-pulse" />
                                  <span>Verification Pending</span>
                                </div>
                              )}

                              {isCashCollected && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px] shadow-2xs">
                                  <CheckCircle2 size={12} className="text-blue-600" />
                                  <span>Cash Collected</span>
                                </div>
                              )}

                              {!isVerified && !isPendingVerif && !isCashCollected && !isFailed && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px] shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>COD Pending</span>
                                </div>
                              )}

                              {isFailed && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[11px] shadow-2xs">
                                  <AlertCircle size={12} className="text-rose-600" />
                                  <span>Failed / Rejected</span>
                                </div>
                              )}

                              {/* Admin Verification Actions */}
                              {isPendingVerif && (
                                <div className="flex items-center gap-1 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof verifyUpiPayment === 'function') {
                                        verifyUpiPayment(o.id, true);
                                      } else if (typeof updateOrderPaymentStatus === 'function') {
                                        updateOrderPaymentStatus(o.id, 'paid', 'upi', 'UPI Payment verified by Administrator');
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-extrabold shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                                    title="Approve and verify payment"
                                  >
                                    <Check size={12} strokeWidth={3} /> Verify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reason = window.prompt('Enter rejection reason for this UPI payment:', 'Payment receipt mismatch or missing UTR');
                                      if (reason !== null) {
                                        if (typeof verifyUpiPayment === 'function') {
                                          verifyUpiPayment(o.id, false, reason);
                                        } else if (typeof updateOrderPaymentStatus === 'function') {
                                          updateOrderPaymentStatus(o.id, 'failed', 'upi', reason);
                                        }
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all"
                                    title="Reject invalid payment"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* Cash Collected Confirmation Action */}
                              {isCashCollected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof updateOrderPaymentStatus === 'function') {
                                      updateOrderPaymentStatus(o.id, 'paid', 'cash', 'Cash deposit reconciled and confirmed by Administrator');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10.5px] font-bold shadow-2xs cursor-pointer transition-all text-center"
                                >
                                  Confirm Deposit
                                </button>
                              )}

                              {/* Manual settlement fallback for pending COD */}
                              {!isVerified && !isPendingVerif && !isCashCollected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCashModalOrder(o);
                                    setCashNote('');
                                  }}
                                  className="text-[10px] font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors text-center shadow-2xs"
                                >
                                  Record Settlement
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 10. TOTAL AMOUNT */}
                      <td className="py-4 px-4 align-top text-right font-black text-[#1E1118] text-sm whitespace-nowrap">
                        ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 11. ACTIONS */}
                      <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Invoice / Eye Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewInvoice) onViewInvoice(o);
                            }}
                            className="w-8 h-8 rounded-lg border border-pink-100 bg-white hover:bg-pink-50 text-[#D81B60] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
                            title="View Invoice & Order Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Quick Delete Single Order Button */}
                          <button
                            type="button"
                            onClick={() => openDeleteModalForSingle(o)}
                            className="w-8 h-8 rounded-lg border border-pink-100 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
                            title="Delete this order record"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* 3-dots Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenActionMenuId(openActionMenuId === o.id ? null : o.id)}
                              className="w-8 h-8 rounded-lg border border-pink-100 bg-white hover:bg-pink-50 text-gray-600 flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
                              title="More Options"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openActionMenuId === o.id && (
                              <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-pink-100 py-1 z-50 animate-fade-in text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    if (onViewInvoice) onViewInvoice(o);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#FFF5F8] hover:text-[#D81B60] flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye size={13} /> View Invoice
                                </button>
                                {!isPaid && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setCashModalOrder(o);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Banknote size={13} /> Record Cash
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    openDeleteModalForSingle(o);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={13} /> Delete Order
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAYMENT PROOF VIEWER MODAL ────────────────────────────────────── */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-900">UPI Payment Confirmation Proof</h3>
                  <p className="text-[10.5px] text-gray-500 font-medium">Order #{viewingProof.orderId} • {viewingProof.customerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Proof Details Pill */}
            <div className="px-5 py-3 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Payable Amount</span>
                <span className="text-sm font-black text-gray-900">₹{Number(viewingProof.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              {viewingProof.utr && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Transaction / UTR</span>
                  <span className="font-mono font-black text-purple-700">{viewingProof.utr}</span>
                </div>
              )}
            </div>

            {/* Image Preview */}
            <div className="p-4 bg-gray-950 flex-1 flex items-center justify-center overflow-auto min-h-[300px]">
              <img
                src={viewingProof.url}
                alt="Payment Proof Confirmation"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Footer Action Buttons */}
            <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
              <a
                href={viewingProof.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ExternalLink size={13} /> Open Full Size
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof verifyUpiPayment === 'function') {
                      verifyUpiPayment(viewingProof.orderId, true);
                    } else if (typeof updateOrderPaymentStatus === 'function') {
                      updateOrderPaymentStatus(viewingProof.orderId, 'paid', 'upi', 'UPI Payment verified by Administrator');
                    }
                    setViewingProof(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} /> Approve & Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = window.prompt('Enter rejection reason for this UPI payment:', 'Payment receipt mismatch');
                    if (reason !== null) {
                      if (typeof verifyUpiPayment === 'function') {
                        verifyUpiPayment(viewingProof.orderId, false, reason);
                      } else if (typeof updateOrderPaymentStatus === 'function') {
                        updateOrderPaymentStatus(viewingProof.orderId, 'failed', 'upi', reason);
                      }
                      setViewingProof(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CASH PAYMENT MODAL ────────────────────────────────────────────── */}
      {cashModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-pink-100 p-6 max-w-md w-full shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              onClick={() => setCashModalOrder(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Banknote size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900">Confirm Cash Collection</h3>
            <p className="text-xs text-gray-500 mt-1">
              Record physical cash received by delivery partner or store staff
            </p>

            {/* Amount Box */}
            <div className="my-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Cash Amount to Collect
              </span>
              <span className="text-2xl font-black text-emerald-700">
                ₹{Number(cashModalOrder.totalAmount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-gray-400 block mt-1">
                Order #{cashModalOrder.id} • {cashModalOrder.userName}
              </span>
            </div>

            {/* Collection Note */}
            <div className="text-left mb-4">
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Collection Note / Receipt No (Optional):
              </label>
              <input
                type="text"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
                placeholder="e.g. Received full cash at doorstep"
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-pink-100 outline-none focus:border-[#D81B60]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCashModalOrder(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 font-bold text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmingCash}
                onClick={handleConfirmCashPayment}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                <span>{isConfirmingCash ? 'Saving...' : 'Confirm Paid'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DELETION CONFIRMATION MODAL (ADMIN ONLY) ─────────────── */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 max-w-lg w-full shadow-2xl relative text-left">
            <button
              onClick={() => setDeleteConfirmModal({ isOpen: false, orderIds: [], orders: [], isTestClear: false })}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {deleteConfirmModal.isTestClear
                    ? `Clear Test & Demo Orders (${deleteConfirmModal.orderIds.length})`
                    : `Confirm Order Deletion (${deleteConfirmModal.orderIds.length} Record${deleteConfirmModal.orderIds.length > 1 ? 's' : ''})`}
                </h3>
                <p className="text-xs text-gray-500">
                  {deleteConfirmModal.isTestClear
                    ? 'Permanent cleanup of mock & demo orders placed during system testing'
                    : 'Authorized Admin deletion control'}
                </p>
              </div>
            </div>

            {/* Financial & Accounting Safeguard Warning */}
            {deleteConfirmModal.orders.some(o => ['completed', 'delivered'].includes((o.status || '').toLowerCase()) || o.paymentStatus === 'paid') && (
              <div className="my-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-amber-950">Financial Audit & Accounting Notice</strong>
                  One or more selected orders are marked as <strong>Completed/Delivered</strong> or <strong>Paid</strong>. In compliance with commercial accounting standards, financial transactions should generally be retained for tax audit logs. Deletion will permanently remove these records from database reports.
                </div>
              </div>
            )}

            {/* Selected Orders List preview */}
            <div className="my-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto space-y-2 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Selected Orders for Deletion:
              </span>
              {deleteConfirmModal.orders.slice(0, 10).map((ord) => (
                <div key={ord.id} className="flex items-center justify-between py-1 border-b border-gray-200/60 last:border-none">
                  <div>
                    <span className="font-mono font-bold text-[#D81B60]">{ord.id}</span>
                    <span className="text-gray-600 ml-2 font-medium">{ord.userName || 'Customer'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-gray-900">₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-gray-400 block uppercase">{ord.status}</span>
                  </div>
                </div>
              ))}
              {deleteConfirmModal.orders.length > 10 && (
                <p className="text-[11px] font-semibold text-gray-500 text-center pt-1">
                  + {deleteConfirmModal.orders.length - 10} more orders selected
                </p>
              )}
            </div>

            <p className="text-[11px] text-gray-500 mb-4">
              An audit entry will be recorded in the Admin Governance Log with timestamp and administrator details.
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, orderIds: [], orders: [], isTestClear: false })}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDeletion}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : `Confirm Delete (${deleteConfirmModal.orderIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE RIDER STORE UPI CREDENTIALS MANAGEMENT MODAL ───────────── */}
      {isUpiQrModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-purple-200 max-w-xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-pink-50/30 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <CreditCardIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">
                    Rider Store UPI Credentials
                  </h3>
                  <p className="text-[11px] text-purple-700 font-medium">
                    Changes reflect immediately in the Delivery Partner (Rider) App
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpiQrModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {upiQrSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>✓ Successfully updated! Official Store UPI ID is now live in the Rider App.</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Official UPI Payee / Merchant Name *
                  </label>
                  <input
                    type="text"
                    value={upiForm.upiName}
                    onChange={(e) => setUpiForm(prev => ({ ...prev, upiName: e.target.value }))}
                    placeholder="e.g. Salbeau MakeUpStore or SALBEAU ENTERPRISES"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-900 outline-none focus:border-purple-600 shadow-2xs"
                  />
                  <span className="text-[10.5px] text-gray-500 font-medium mt-1 block">
                    Payee name displayed to customers in Google Pay, PhonePe, Paytm, and shown to delivery riders.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Official Store UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    value={upiForm.upiId}
                    onChange={(e) => setUpiForm(prev => ({ ...prev, upiId: e.target.value.trim() }))}
                    placeholder="Enter store UPI ID (e.g. merchant@upi)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600 shadow-2xs"
                  />
                  <span className="text-[10.5px] text-gray-500 font-medium mt-1 block">
                    VPA address where customer payments are deposited directly via UPI transfer.
                  </span>
                </div>

                {/* Rider App Preview Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50/40 border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Rider App Display Preview
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Direct VPA Active
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10.5px] font-bold text-gray-500">STORE UPI ID (VPA)</div>
                      <div className="text-sm font-black font-mono text-purple-950 mt-0.5">
                        {upiForm.upiId || 'Not Configured'}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-600 mt-0.5">
                        {upiForm.upiName || 'Salbeau MakeUpStore'}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">
                      Copy Button
                    </div>
                  </div>

                  <p className="text-[10.5px] text-purple-800/80 leading-relaxed font-medium">
                    💡 Customers can copy or enter this UPI ID in any payment app (GPay, PhonePe, Paytm) to make payment, and the delivery rider captures the 12-digit bank UTR reference number.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-purple-100 bg-gray-50/80 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-500 font-medium">
                Instant database upsert to <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-mono">salbeau_store_settings</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpiQrModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSavingUpiQr}
                  onClick={handleSaveUpiQr}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Check size={14} strokeWidth={3} />
                  <span>{isSavingUpiQr ? 'Saving & Syncing...' : 'Save & Push to Rider App'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementTable;

