import React, { useState, useMemo } from 'react';
import {
  Truck,
  Bike,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Key,
  Lock,
  UserX,
  ExternalLink,
  ChevronDown,
  Building,
  Calendar,
  X,
  Sparkles,
  ArrowRight,
  QrCode,
  Upload,
  CreditCard,
  Check
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { supabase, supabaseAdmin } from '../../config/supabase';

export default function DeliveryPartnerManagementPage() {
  const {
    orders = [],
    employees = [],
    branches = [],
    setOrders,
    setEmployees,
    assignOrderToEmployee,
    currentAuthUser,
    generalSettings,
    updateGeneralSettings,
    quickUpdateUpiQr,
    uploadImage
  } = useAdmin();

  const [activeSubTab, setActiveSubTab] = useState('live_deliveries'); // 'live_deliveries' | 'partners_roster'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ongoing' | 'delivered' | 'pending'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi'
  const [selectedBranch, setSelectedBranch] = useState('all');

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

  // Add Partner Modal
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    employeeCode: `EMP-DEL-${String(Math.floor(Math.random() * 900) + 100)}`,
    phone: '',
    email: '',
    password: 'salbeau123',
    branch: '',
    status: 'active'
  });
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerSaveError, setPartnerSaveError] = useState('');

  // Reconcile / Confirm Payment with Admin state
  const [isReconciling, setIsReconciling] = useState(false);

  // Filter Delivery Personnel from Employees
  const deliveryPartners = useMemo(() => {
    return (employees || []).filter(e => {
      const role = String(e.role || '').toLowerCase();
      const desig = String(e.designation || '').toLowerCase();
      const dept = String(e.department || '').toLowerCase();
      return role.includes('delivery') || desig.includes('delivery') || dept.includes('dispatch') || dept.includes('logistics') || role.includes('rider') || desig.includes('courier');
    });
  }, [employees]);

  // Delivery Orders List with Staff Tracking details
  const deliveryOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!o) return false;
      const ft = String(o.deliveryType || o.delivery_type || 'delivery').toLowerCase();
      return ft === 'delivery' || ft === 'home_delivery';
    });
  }, [orders]);

  // Key Metrics
  const metrics = useMemo(() => {
    const ongoing = deliveryOrders.filter(o => {
      const s = String(o.status || '').toLowerCase();
      return s === 'out_for_delivery' || s === 'shipped' || s === 'in_transit';
    });

    const delivered = deliveryOrders.filter(o => {
      const s = String(o.status || '').toLowerCase();
      return s === 'delivered' || s === 'completed';
    });

    let totalCashCollected = 0;
    let totalUpiCollected = 0;

    delivered.forEach(o => {
      const ship = o.shipments || {};
      const amt = Number(o.totalAmount || o.total_amount || 0);
      const method = (ship.paymentMethod || o.paymentMethod || o.payment_method || 'cash').toLowerCase();
      if (method === 'upi') {
        totalUpiCollected += amt;
      } else {
        totalCashCollected += amt;
      }
    });

    return {
      activePartnersCount: deliveryPartners.filter(p => p.status === 'active').length,
      totalPartnersCount: deliveryPartners.length,
      ongoingCount: ongoing.length,
      deliveredCount: delivered.length,
      totalCashCollected,
      totalUpiCollected
    };
  }, [deliveryOrders, deliveryPartners]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveryOrders.filter(o => {
      const ship = o.shipments || {};
      const status = String(o.status || '').toLowerCase();
      const customer = String(o.userName || o.user_name || '').toLowerCase();
      const orderId = String(o.id || '').toLowerCase();
      const riderName = String(o.assignedEmployeeName || ship.assignedEmployeeName || '').toLowerCase();
      const method = String(ship.paymentMethod || o.paymentMethod || o.payment_method || '').toLowerCase();
      const branch = String(o.branch || '').toLowerCase();

      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = orderId.includes(term) || customer.includes(term) || riderName.includes(term);
        if (!matches) return false;
      }

      // Status
      if (statusFilter === 'ongoing' && status !== 'out_for_delivery' && status !== 'in_transit') return false;
      if (statusFilter === 'delivered' && status !== 'delivered' && status !== 'completed') return false;
      if (statusFilter === 'pending' && (status === 'out_for_delivery' || status === 'delivered' || status === 'completed')) return false;

      // Payment
      if (paymentFilter === 'cash' && method !== 'cash') return false;
      if (paymentFilter === 'upi' && method !== 'upi') return false;

      // Branch
      if (selectedBranch !== 'all' && !branch.includes(selectedBranch.toLowerCase())) return false;

      return true;
    });
  }, [deliveryOrders, searchTerm, statusFilter, paymentFilter, selectedBranch]);

  // Toggle Delivery Partner Active/Deactivated Status
  const handleTogglePartnerStatus = async (partner) => {
    const newStatus = partner.status === 'active' ? 'deactivated' : 'active';
    try {
      const client = supabaseAdmin || supabase;
      let { error } = await client
        .from('employees')
        .update({ status: newStatus, account_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', partner.id);

      if (error && (error.message?.includes('account_status') || error.code === 'PGRST204')) {
        const { error: retryErr } = await client
          .from('employees')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', partner.id);
        error = retryErr;
      }

      if (!error) {
        setEmployees(prev => prev.map(e => e.id === partner.id ? { ...e, status: newStatus, account_status: newStatus } : e));
      }
    } catch (e) {
      console.warn('Error toggling partner status:', e);
    }
  };

  // Confirm / Reconcile Payment with Admin
  const handleConfirmAdminPayment = async (orderId) => {
    setIsReconciling(true);
    try {
      const nowIso = new Date().toISOString();
      const client = supabaseAdmin || supabase;

      const targetOrder = orders.find(o => o.id === orderId);
      const ship = targetOrder?.shipments || {};
      const updatedShip = {
        ...ship,
        confirmedWithAdmin: true,
        adminConfirmedAt: nowIso,
        adminConfirmedBy: currentAuthUser?.name || 'Store Administrator'
      };

      const { error } = await client
        .from('orders')
        .update({
          shipments: updatedShip,
          updated_at: nowIso
        })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, shipments: updatedShip } : o));
      }
    } catch (e) {
      console.warn('Error confirming payment with admin:', e);
    } finally {
      setIsReconciling(false);
    }
  };

  // Save New Delivery Partner
  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!newPartner.name.trim() || !newPartner.phone.trim() || !newPartner.password.trim()) {
      setPartnerSaveError('Please fill in Name, Phone, and Password.');
      return;
    }

    setIsSavingPartner(true);
    setPartnerSaveError('');

    try {
      const client = supabaseAdmin || supabase;
      const cleanDigits = newPartner.phone.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
      const empId = `emp_del_${cleanDigits || Date.now()}`;

      const resolvedBranch = newPartner.branch || (branches && branches.length > 0 ? branches[0].name : '');
      const payload = {
        id: empId,
        employee_code: newPartner.employeeCode.trim() || `EMP-DEL-${cleanDigits.slice(-4)}`,
        name: newPartner.name.trim(),
        full_name: newPartner.name.trim(),
        email: newPartner.email.trim() || `del.${cleanDigits}@salbeau.com`,
        phone: formattedPhone,
        password_hash: newPartner.password.trim(),
        role: 'Delivery Partner',
        designation: 'Delivery Partner',
        department: 'Logistics & Dispatch',
        work_location: resolvedBranch,
        branch: resolvedBranch,
        status: newPartner.status || 'active',
        account_status: newPartner.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let saveError = null;
      try {
        const { error: fullError } = await client.from('employees').upsert(payload);
        if (fullError) {
          // Fallback to core schema columns if extended columns are not cached
          const baseRow = {
            id: empId,
            name: newPartner.name.trim(),
            email: newPartner.email.trim() || `del.${cleanDigits}@salbeau.com`,
            phone: formattedPhone,
            password_hash: newPartner.password.trim(),
            role: 'Delivery Partner',
            status: newPartner.status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const { error: baseError } = await client.from('employees').upsert(baseRow);
          if (baseError) saveError = baseError;
        }
      } catch (upsertErr) {
        saveError = upsertErr;
      }

      // Always persist permissions and complete metadata
      try {
        await client.from('employee_permissions').upsert({
          id: `perm_${empId}`,
          employee_id: empId,
          permissions: {
            _metadata: payload,
            orders: { enabled: true, actions: { view: true, process: true, dispatch: true } }
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) { }

      if (saveError) {
        console.warn('Supabase employees direct table save note:', saveError);
      }

      // Always update local roster & cache so admin is never blocked
      const nextList = [payload, ...(employees || []).filter(p => p.id !== empId)];
      if (typeof setEmployees === 'function') {
        setEmployees(nextList);
      }
      try {
        localStorage.setItem('salbeau_admin_cache_employees', JSON.stringify(nextList));
        await client.from('brands').upsert({
          id: 'salbeau_employees_backup',
          name: 'Employees System Backup',
          category: 'SystemConfig',
          enabled: true,
          logo: JSON.stringify(nextList)
        });
      } catch (_) { }

      setShowAddPartnerModal(false);
      setNewPartner({
        name: '',
        employeeCode: `EMP-DEL-${String(Math.floor(Math.random() * 900) + 100)}`,
        phone: '',
        email: '',
        password: 'salbeau123',
        branch: '',
        status: 'active'
      });
    } catch (err) {
      console.warn('Error creating delivery partner:', err);
      setPartnerSaveError(err.message || 'Failed to create partner account.');
    } finally {
      setIsSavingPartner(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D81B60] to-[#E89CBF] flex items-center justify-center text-white shadow-md shadow-pink-200">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Delivery Partners & Live Tracking
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Dispatch
                </span>
              </h1>
              <p className="text-xs font-semibold text-gray-500">
                Manage assigned riders, track started & delivered timings, verify Cash COD & UPI payments, and reconcile staff accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Add Delivery Partner & Rider UPI QR */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openUpiQrModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors shadow-2xs cursor-pointer font-bold text-xs"
            title="Configure Rider UPI ID & Live Merchant QR Code (Instant Real-time Sync to Rider App)"
          >
            <CreditCard size={15} className="text-purple-700" />
            <span>Rider Store UPI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setShowAddPartnerModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D81B60] hover:bg-[#a63965] text-white rounded-xl font-bold text-xs shadow-md shadow-pink-200 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Delivery Partner</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Active Riders</span>
            <Bike size={18} className="text-[#D81B60]" />
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics.activePartnersCount}</div>
          <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{metrics.totalPartnersCount} Total Registered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">Out for Delivery</span>
            <Truck size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{metrics.ongoingCount}</div>
          <div className="text-[11px] text-gray-400 font-semibold mt-0.5">Live ongoing orders</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Delivered Total</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.deliveredCount}</div>
          <div className="text-[11px] text-gray-400 font-semibold mt-0.5">Completed successfully</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Cash COD Collected</span>
            <DollarSign size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">₹{metrics.totalCashCollected.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Cash received by staff</div>
        </div>

        <div
          onClick={openUpiQrModal}
          className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs cursor-pointer hover:border-purple-400 transition-all group"
          title="Click to view & edit Store UPI ID"
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">Store UPI Payments</span>
            <CreditCard size={18} className="text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-900">₹{metrics.totalUpiCollected.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-purple-700 font-semibold mt-0.5 flex items-center justify-between">
            <span>Direct UPI payments</span>
            <span className="text-[10px] text-purple-600 font-bold underline">Edit UPI →</span>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS (LIVE DELIVERIES vs PARTNERS ROSTER) ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-5">
        <button
          onClick={() => setActiveSubTab('live_deliveries')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeSubTab === 'live_deliveries'
            ? 'border-[#D81B60] text-[#D81B60]'
            : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
        >
          <Truck size={15} />
          <span>Live Deliveries Tracking ({filteredDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('partners_roster')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeSubTab === 'partners_roster'
            ? 'border-[#D81B60] text-[#D81B60]'
            : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
        >
          <Bike size={15} />
          <span>Delivery Partners Roster & Credentials ({deliveryPartners.length})</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: LIVE DELIVERIES TRACKING TABLE ──────────────── */}
      {activeSubTab === 'live_deliveries' && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          {/* Table Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID, Customer, or Rider Name..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#D81B60]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#D81B60]"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="ongoing">Out for Delivery (Live)</option>
                <option value="delivered">Delivered / Completed</option>
                <option value="pending">Pending Dispatch</option>
              </select>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#D81B60]"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash on Delivery (COD)</option>
                <option value="upi">UPI / QR Code</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 text-gray-500 font-extrabold uppercase text-[10.5px] border-b border-gray-200 tracking-wider">
                  <th className="py-3.5 px-4">Order ID & Type</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Delivery Partner (Rider)</th>
                  <th className="py-3.5 px-4">Started Time</th>
                  <th className="py-3.5 px-4">Delivery Time</th>
                  <th className="py-3.5 px-4">Payment Method & Amount</th>
                  <th className="py-3.5 px-4">Admin Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-semibold">
                      No deliveries found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map(order => {
                    const ship = order.shipments || {};
                    const isB2B = (order.userRole && order.userRole !== 'general') || (order.user_role && order.user_role !== 'general');
                    const riderName = order.assignedEmployeeName || ship.assignedEmployeeName || 'Unassigned';
                    const riderId = order.assignedEmployeeId || ship.assignedEmployeeId || '';
                    const riderPhone = ship.deliveryPartnerPhone || '';
                    const startedAt = ship.startedAt || ship.deliveryStartedAt;
                    const deliveredAt = ship.deliveredAt || ship.deliveryTime;
                    const payMethod = (ship.paymentMethod || order.paymentMethod || order.payment_method || 'cash').toLowerCase();
                    const amount = Number(order.totalAmount || order.total_amount || 0);
                    const isDelivered = String(order.status || '').toLowerCase() === 'delivered' || String(order.status || '').toLowerCase() === 'completed';
                    const isOngoing = String(order.status || '').toLowerCase() === 'out_for_delivery';
                    const isConfirmedWithAdmin = Boolean(ship.confirmedWithAdmin);

                    return (
                      <tr key={order.id} className="hover:bg-pink-50/30 transition-colors">
                        {/* 1. Order ID & Customer Type */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-extrabold text-[#D81B60]">#{order.id}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${isB2B ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-pink-100 text-[#D81B60] border border-pink-200'
                              }`}>
                              {isB2B ? (order.userRole || 'B2B Trade') : 'B2C Retail'}
                            </span>
                          </div>
                        </td>

                        {/* 2. Customer Details */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-gray-900">{order.userName || order.user_name || 'Customer'}</div>
                          <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {order.phone || 'No phone'}
                          </div>
                          <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5 max-w-[220px] truncate" title={order.deliveryAddress}>
                            <MapPin size={11} className="text-[#D81B60] shrink-0" /> {order.deliveryAddress || 'Store Pickup'}
                          </div>
                        </td>

                        {/* 3. Delivery Partner */}
                        <td className="py-3.5 px-4 align-top">
                          {riderName !== 'Unassigned' ? (
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                <Bike size={13} className="text-[#D81B60]" />
                                <span>{riderName}</span>
                              </div>
                              {riderPhone && (
                                <div className="text-[11px] text-gray-400 mt-0.5">{riderPhone}</div>
                              )}
                              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                Assigned Rider
                              </div>
                            </div>
                          ) : (
                            <div>
                              <select
                                value=""
                                onChange={e => {
                                  if (e.target.value) assignOrderToEmployee(order.id, e.target.value);
                                }}
                                className="px-2.5 py-1 text-xs rounded-xl border border-pink-200 bg-white font-semibold text-gray-700 outline-none hover:border-[#D81B60] cursor-pointer"
                              >
                                <option value="">Assign Rider...</option>
                                {deliveryPartners.filter(p => p.status === 'active').map(p => (
                                  <option key={p.id} value={p.id}>{p.name || p.full_name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>

                        {/* 4. Started Time */}
                        <td className="py-3.5 px-4 align-top">
                          {startedAt ? (
                            <div>
                              <div className="font-bold text-blue-700 flex items-center gap-1">
                                <Clock size={12} className="text-blue-600" />
                                <span>{new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(startedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not started yet</span>
                          )}
                        </td>

                        {/* 5. Delivery Time */}
                        <td className="py-3.5 px-4 align-top">
                          {deliveredAt ? (
                            <div>
                              <div className="font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>{new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {ship.deliveryDurationMinutes && (
                                <div className="text-[10.5px] text-emerald-600 font-bold mt-0.5">
                                  ⏱️ {ship.deliveryDurationMinutes} mins taken
                                </div>
                              )}
                            </div>
                          ) : isOngoing ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold animate-pulse">
                              In Transit
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending</span>
                          )}
                        </td>

                        {/* 6. Payment Method & Amount */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-black text-gray-900 text-sm">₹{amount.toLocaleString('en-IN')}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${payMethod === 'upi' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {payMethod === 'upi' ? 'UPI / QR Code' : 'Cash (COD)'}
                            </span>
                          </div>
                          {ship.upiUtr && (
                            <div className="text-[10.5px] font-bold text-purple-800 mt-1">
                              UTR: {ship.upiUtr}
                            </div>
                          )}
                        </td>

                        {/* 7. Admin Confirmation / Reconciliation */}
                        <td className="py-3.5 px-4 align-top">
                          {isConfirmedWithAdmin ? (
                            <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span>Reconciled</span>
                            </div>
                          ) : isDelivered ? (
                            <button
                              disabled={isReconciling}
                              onClick={() => handleConfirmAdminPayment(order.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                            >
                              <CheckCircle2 size={12} />
                              <span>Confirm Payment</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Awaiting delivery</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: DELIVERY PARTNERS ROSTER ──────────────── */}
      {activeSubTab === 'partners_roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryPartners.map(partner => {
            const isActive = partner.status === 'active';
            const assignedOrders = deliveryOrders.filter(o => o.assignedEmployeeId === partner.id);
            const activeDeliveries = assignedOrders.filter(o => String(o.status || '').toLowerCase() === 'out_for_delivery');

            return (
              <div key={partner.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D81B60] to-pink-300 flex items-center justify-center text-white font-black text-lg shadow-xs">
                      {partner.name ? partner.name[0].toUpperCase() : 'D'}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">{partner.name || partner.full_name}</h3>
                      <div className="text-xs font-semibold text-gray-400">{partner.employee_code || partner.id}</div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#D81B60] mt-0.5">
                        <Phone size={11} /> {partner.phone || 'No phone'}
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}>
                    {isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {/* Assigned Store Branch */}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 font-bold">
                    <Building size={13} className="text-[#D81B60]" />
                    <span>Store: {partner.work_location || partner.branch || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Assigned Password Note */}
                <div className="bg-pink-50/60 p-2.5 rounded-xl border border-pink-100 mb-3 text-xs">
                  <div className="flex items-center justify-between text-[#D81B60]">
                    <span className="font-bold flex items-center gap-1">
                      <Lock size={12} /> Mobile App Password:
                    </span>
                    <span className="font-black text-gray-900 bg-white px-2 py-0.5 rounded border border-pink-200">
                      {partner.password || partner.password_hash || 'salbeau123'}
                    </span>
                  </div>
                </div>

                {/* Active Deliveries Summary */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-semibold">Active Orders on Route:</span>
                  <span className="font-black text-blue-600">{activeDeliveries.length}</span>
                </div>

                {/* Toggle Status Button */}
                <button
                  onClick={() => handleTogglePartnerStatus(partner)}
                  className={`w-full mt-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${isActive
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                >
                  {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                  <span>{isActive ? 'Deactivate Partner Account' : 'Reactivate Partner Account'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: ADD DELIVERY PARTNER ── */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-[#D81B60] flex items-center justify-center">
                  <Truck size={17} />
                </div>
                <h3 className="font-black text-gray-900 text-base">Add New Delivery Partner</h3>
              </div>
              <button onClick={() => setShowAddPartnerModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-3.5">
              {partnerSaveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                  {partnerSaveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="e.g. Anand Varma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">User ID / Employee Code *</label>
                <input
                  type="text"
                  required
                  value={newPartner.employeeCode}
                  onChange={e => setNewPartner({ ...newPartner, employeeCode: e.target.value })}
                  placeholder="e.g. EMP-DEL-03"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  value={newPartner.phone}
                  onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">App Login Password *</label>
                <input
                  type="text"
                  required
                  value={newPartner.password}
                  onChange={e => setNewPartner({ ...newPartner, password: e.target.value })}
                  placeholder="Set password for mobile app login"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store / Branch Assignment</label>
                <select
                  value={newPartner.branch}
                  onChange={e => setNewPartner({ ...newPartner, branch: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#D81B60]"
                >
                  {branches && branches.length > 0 ? (
                    branches.filter(b => b.is_active !== false).map(b => (
                      <option key={b.id || b.code} value={b.name}>{b.name} ({b.code})</option>
                    ))
                  ) : (
                    <option value="">No branches configured — Add in Settings → Branch Management</option>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPartner}
                  className="w-full py-3 bg-[#D81B60] hover:bg-[#a63965] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingPartner ? 'Saving...' : 'Register Delivery Partner'}
                </button>
              </div>
            </form>
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
                  <CreditCard size={18} />
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
}

