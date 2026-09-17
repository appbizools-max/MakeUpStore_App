import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import salbeauLogo from './Assets/Logo.png';
import {
  LayoutGrid,
  ShoppingBag,
  Eye,
  PlusCircle,
  Package,
  User,
  DollarSign,
  Star,
  TrendingUp,
  ChevronDown,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  Edit,
  Save,
  Store,
  Clock,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  LogOut,
  FileText,
  MapPin,
  Truck,
  Ban,
  Printer,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const {
    brands,
    products,
    orders,
    users,
    cancelFeeSettings,
    cancelledOrdersLog,
    toggleBrandStatus,
    addBrand,
    addProduct,
    updateOrderStatus,
    updateOrderItemStatus,
    decrementProductStock,
    updateProductRolePrices,
    toggleUserVerification,
    updateCancelFeeSettings,
    toggleFeeWaived
  } = useAdmin();

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ email: 'admin@salbeau.com', password: '••••••••' });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  // Form states for Add Brand
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
    category: 'Makeup',
    enabled: true
  });
  const [showBrandSuccess, setShowBrandSuccess] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  // Form states for Products
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brandName: 'Lakmé',
    category: 'Lipstick & Gloss',
    mrp: '',
    salonPrice: '',
    artistPrice: '',
    beauticianPrice: '',
    stock: ''
  });
  const [showProductSuccess, setShowProductSuccess] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrices, setEditPrices] = useState({ mrp: 0, salonPrice: 0, artistPrice: 0, beauticianPrice: 0 });

  // Rejection Modal states
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionTargetOrderId, setRejectionTargetOrderId] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Out of stock');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // Invoice Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form states for Cancel Fee Settings
  const [feeForm, setFeeForm] = useState({ ...cancelFeeSettings });
  const [showFeeSuccess, setShowFeeSuccess] = useState(false);

  const totalOrdersCount = '1,482';
  const totalRevenueAmount = '₹4,89,250.00';
  const activeBrandsRatio = '94.2%';

  const handleLogoFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBrand((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBrandSubmit = (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    addBrand(newBrand);
    setNewBrand({
      name: '',
      logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
      category: 'Makeup',
      enabled: true
    });
    setShowBrandSuccess(true);
    setIsAddBrandModalOpen(false);
    setTimeout(() => setShowBrandSuccess(false), 3000);
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.mrp) return;
    const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80';
    const mrpNum = Number(newProduct.mrp);
    addProduct({
      ...newProduct,
      image: newProduct.image || defaultImg,
      mrp: mrpNum,
      generalPrice: Number(newProduct.generalPrice || mrpNum),
      salonPrice: Number(newProduct.salonPrice || Math.round(mrpNum * 0.7)),
      artistPrice: Number(newProduct.artistPrice || Math.round(mrpNum * 0.65)),
      beauticianPrice: Number(newProduct.beauticianPrice || Math.round(mrpNum * 0.68)),
      stock: Number(newProduct.stock || 20)
    });
    setNewProduct({
      name: '',
      brandName: 'Lakmé',
      category: 'Lipstick & Gloss',
      mrp: '',
      generalPrice: '',
      salonPrice: '',
      artistPrice: '',
      beauticianPrice: '',
      stock: '',
      image: ''
    });
    setShowProductSuccess(true);
    setIsAddProductModalOpen(false);
    setTimeout(() => setShowProductSuccess(false), 3000);
  };

  const handleStartEditProduct = (product) => {
    setEditingProductId(product.id);
    setEditPrices({
      mrp: product.mrp,
      salonPrice: product.salonPrice,
      artistPrice: product.artistPrice,
      beauticianPrice: product.beauticianPrice
    });
  };

  const handleSavePrices = (productId) => {
    updateProductRolePrices(productId, editPrices);
    setEditingProductId(null);
  };

  const handleSaveCancelFeeSettings = (e) => {
    e.preventDefault();
    updateCancelFeeSettings(feeForm);
    setShowFeeSuccess(true);
    setTimeout(() => setShowFeeSuccess(false), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.phone.includes(userSearchTerm) ||
      u.businessName.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesBranch = selectedBranch === 'All Branches' || o.branch.toLowerCase().includes(selectedBranch.toLowerCase());
    return matchesStatus && matchesBranch;
  });

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF2F4] via-[#F8FAFC] to-[#FFF2F5] flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md animate-fade-in text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#CE4270] to-[#E25586] text-white flex items-center justify-center font-bold mx-auto mb-4 shadow-md">
            <Sparkles size={32} />
          </div>

          <h1
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-4xl text-[#CE4270] font-normal tracking-wide leading-none mb-1"
          >
            Salbeau
          </h1>
          <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-6">
            Admin Executive Portal
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsAuthenticated(true);
            }}
            className="space-y-4 text-left text-xs"
          >
            <div>
              <label className="block text-gray-800 font-bold mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={loginCredentials.email}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, email: e.target.value })}
                className="w-full p-3 rounded-xl border border-pink-100/90 outline-none focus:border-[#CE4270] bg-white font-medium shadow-2xs text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-800 font-bold mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                className="w-full p-3 rounded-xl border border-pink-100/90 outline-none focus:border-[#CE4270] bg-white font-medium shadow-2xs text-gray-900 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2"
            >
              Sign In to Admin Console
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-pink-100/60 text-[11px] text-gray-400 font-medium">
            Protected Store Operations • Salbeau Beauty Ltd.
          </div>
        </div>
      </div>
    );
  }

  const handleStatusSelectChange = (orderId, newStatus) => {
    if (newStatus === 'rejected') {
      setRejectionTargetOrderId(orderId);
      setIsRejectionModalOpen(true);
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  };

  const handleConfirmRejection = (e) => {
    e.preventDefault();
    const finalReason = rejectionReasonText === 'Other' ? customRejectionReason : rejectionReasonText;
    if (rejectionTargetOrderId) {
      updateOrderStatus(rejectionTargetOrderId, 'rejected', finalReason || 'Store rejected order');
    }
    setIsRejectionModalOpen(false);
    setRejectionTargetOrderId(null);
    setCustomRejectionReason('');
  };

  const getFulfillmentBadge = (status, orderId) => {
    let colorClass = 'bg-[#FDF2F4] text-[#CE4270] border-pink-100';
    if (status === 'delivered') colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (status === 'processing') colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
    if (status === 'placed') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'partially_delivered') colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    if (status === 'partially_delivered_rejected') colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
    if (status === 'partially_delivered_cancelled') colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    if (status === 'cancelled') colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
    if (status === 'rejected') colorClass = 'bg-rose-100 text-rose-700 border-rose-200';

    return (
      <div className="relative inline-block">
        <select
          value={status}
          onChange={(e) => handleStatusSelectChange(orderId, e.target.value)}
          className={`appearance-none text-xs font-bold px-3 py-1 pr-7 rounded-lg outline-none cursor-pointer border ${colorClass}`}
        >
          <option value="placed">Placed</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="partially_delivered">Partially Delivered</option>
          <option value="partially_delivered_rejected">Partially Delivered — Item Rejected</option>
          <option value="partially_delivered_cancelled">Partially Delivered — Remaining Cancelled</option>
          <option value="cancelled">Cancelled by Customer</option>
          <option value="rejected">Rejected by Store</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] flex flex-col md:flex-row font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-pink-100/60 p-6 flex flex-col justify-between flex-shrink-0 min-h-screen shadow-2xs">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-8 pl-1">
            <div className="w-9 h-9 rounded-full bg-[#CE4270] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Sparkles size={18} />
            </div>
            <h1
              style={{ fontFamily: "'Great Vibes', cursive" }}
              className="text-3xl text-[#CE4270] font-normal tracking-wide leading-none"
            >
              Salbeau
            </h1>
          </div>

          <nav className="space-y-1">
            {/* 1. Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center gap-3 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <LayoutGrid size={18} />
              <span>Dashboard</span>
            </button>

            {/* 2. Order Updated */}
            <button
              onClick={() => setActiveTab('order_updated')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'order_updated'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} />
                <span>Order Updated</span>
              </div>
            </button>

            {/* 3. Brand Visibility */}
            <button
              onClick={() => setActiveTab('brands')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'brands'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Eye size={18} />
                <span>Brand Visibility</span>
              </div>
            </button>

            {/* 4. Add Brand */}
            <button
              onClick={() => setActiveTab('add_brand')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'add_brand'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle size={18} />
                <span>Add Brand</span>
              </div>
            </button>

            {/* 5. Products */}
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'products'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span>Products</span>
              </div>
            </button>

            {/* 6. User */}
            <button
              onClick={() => setActiveTab('user')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'user'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={18} />
                <span>User</span>
              </div>
              <span className="w-5 h-5 bg-[#CE4270] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </button>

            {/* 7. Cancel Fee */}
            <button
              onClick={() => setActiveTab('cancel_fee')}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                activeTab === 'cancel_fee'
                  ? 'bg-[#FDF2F4] text-[#CE4270]'
                  : 'text-gray-500 hover:bg-[#FDF2F4]/50 hover:text-[#CE4270]'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign size={18} />
                <span>Cancel Fee</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-pink-100/60 space-y-3">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full px-4 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer border border-rose-100/80 shadow-2xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <LogOut size={16} />
              <span>Log Out</span>
            </div>
            <span className="text-[10px] text-rose-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-rose-100">
              Active
            </span>
          </button>

          <div className="text-[11px] text-gray-400 font-medium flex items-center justify-between px-1">
            <span>Salbeau Admin v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC] min-h-screen">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'order_updated' && 'Order Updated'}
              {activeTab === 'brands' && 'Brand Visibility'}
              {activeTab === 'add_brand' && 'Add Brand'}
              {activeTab === 'products' && 'Products'}
              {activeTab === 'user' && 'User Management'}
              {activeTab === 'cancel_fee' && 'Cancel Fee Policy'}
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Overview of today's store performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('products');
                setIsAddProductModalOpen(true);
              }}
              className="bg-[#CE4270] hover:bg-[#b83760] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>New Product</span>
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              title="Log Out"
              className="bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-xs font-semibold p-2.5 rounded-xl border border-pink-100 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* 1. EXECUTIVE DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Total Store Orders */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Total Store Orders
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FDF2F4] text-[#CE4270] flex items-center justify-center shadow-2xs">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {totalOrdersCount}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CE4270] text-xs font-semibold mt-2">
                    <TrendingUp size={14} />
                    <span>+12% vs yesterday</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Total Revenue
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FDF2F4] text-[#CE4270] flex items-center justify-center shadow-2xs">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {totalRevenueAmount}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CE4270] text-xs font-semibold mt-2">
                    <TrendingUp size={14} />
                    <span>+8.4% vs yesterday</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Active Brands Ratio */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Active Brands Ratio
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FDF2F4] text-[#CE4270] flex items-center justify-center shadow-2xs">
                    <Star size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {activeBrandsRatio}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CE4270] text-xs font-semibold mt-2">
                    <TrendingUp size={14} />
                    <span>+2.1% this week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Orders Queue Table Card */}
            <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Live Orders Queue</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Real-time processing and fulfillment metrics
                  </p>
                </div>

                <div className="relative inline-block">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="appearance-none bg-[#FDF2F4] text-[#CE4270] border border-pink-100 text-xs font-semibold px-4 py-1.5 pr-8 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="All Branches">All Branches</option>
                    <option value="Paris Boulevard">Paris Boulevard</option>
                    <option value="Milan Avenue">Milan Avenue</option>
                    <option value="London Chelsea">London Chelsea</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CE4270] pointer-events-none" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-pink-100/80 text-xs font-black text-gray-900 uppercase tracking-wider bg-[#FFF2F5]">
                      <th className="py-4 px-4 text-left rounded-l-xl">CUSTOMER & ADDRESS</th>
                      <th className="py-4 px-4 text-left">TYPE & ROLE</th>
                      <th className="py-4 px-4 text-left">BRANCH</th>
                      <th className="py-4 px-4 text-left">FULFILLMENT STATUS</th>
                      <th className="py-4 px-4 text-right">AMOUNT</th>
                      <th className="py-4 px-4 text-center rounded-r-xl">INVOICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/60 text-xs">
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          index % 2 === 1 ? 'bg-[#FFF2F5]/80 hover:bg-[#FDF2F4]' : 'bg-white hover:bg-[#FFF2F5]/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 rounded-l-xl">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                order.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={order.userName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-2xs"
                            />
                            <div>
                              <div className="font-bold text-sm text-gray-900">{order.userName}</div>
                              <div className="text-xs text-gray-400 font-medium mt-0.5 max-w-xs truncate">
                                {order.itemDescription || (order.items && order.items[0]?.product?.name) || 'Cosmetics Set'}
                              </div>
                              {order.deliveryType === 'delivery' && order.deliveryAddress && (
                                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1 max-w-xs truncate">
                                  <MapPin size={10} className="text-[#CE4270] flex-shrink-0" />
                                  <span className="truncate">{order.deliveryAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F4] text-[#CE4270] whitespace-nowrap inline-block">
                              {order.userRole}
                            </span>
                            <div className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                              {order.deliveryType === 'delivery' ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">🚚 Delivery</span>
                              ) : (
                                <span className="text-amber-700 font-bold flex items-center gap-1">🛍️ Pickup</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-800 whitespace-nowrap">
                          {order.branch}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getFulfillmentBadge(order.status, order.id)}
                            {order.status === 'rejected' && order.rejectionReason && (
                              <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 max-w-xs truncate">
                                Reason: {order.rejectionReason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-sm text-[#CE4270] whitespace-nowrap">
                          ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toLocaleString('en-IN') : order.totalAmount}
                        </td>
                        <td className="py-3.5 px-4 rounded-r-xl text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInvoiceOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="bg-white hover:bg-[#FDF2F4] text-[#CE4270] border border-pink-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-2xs"
                          >
                            <FileText size={13} /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. ORDER UPDATED PAGE */}
        {activeTab === 'order_updated' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100/70 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#CE4270]" />
                <span className="text-xs font-semibold text-gray-700">Status Filter:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FDF2F4] border border-pink-100 text-[#CE4270] outline-none cursor-pointer"
                >
                  <option value="all">All Orders ({orders.length})</option>
                  <option value="placed">Placed</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected by Store</option>
                </select>
              </div>

              <div className="text-xs text-gray-500 font-medium">
                Total Queue: <span className="text-[#CE4270] font-bold text-sm">{orders.length} Orders</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-pink-100/70 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                  <tr>
                    <th className="py-4 px-4 text-left rounded-l-xl">Order ID</th>
                    <th className="py-4 px-4 text-left">Customer & Address</th>
                    <th className="py-4 px-4 text-left">Fulfillment Type</th>
                    <th className="py-4 px-4 text-left">Branch</th>
                    <th className="py-4 px-4 text-left">Fulfillment Status</th>
                    <th className="py-4 px-4 text-right">Amount</th>
                    <th className="py-4 px-4 text-center rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o, index) => (
                    <tr
                      key={o.id}
                      className={`transition-colors ${
                        index % 2 === 1 ? 'bg-[#FFF2F5]/80 hover:bg-[#FDF2F4]' : 'bg-white hover:bg-[#FFF2F5]/40'
                      }`}
                    >
                      <td className="p-4 font-extrabold text-[#CE4270] text-xs">{o.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{o.userName}</div>
                        {o.items && o.items.length > 0 ? (
                          <div className="space-y-1 mt-1.5">
                            {o.items.map((item, itemIdx) => {
                              const itemSt = item.status || o.status || 'placed';
                              let tagBg = 'bg-amber-50 text-amber-700 border-amber-200';
                              let tagLabel = '⏳ Processing';
                              if (itemSt === 'delivered') {
                                tagBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                tagLabel = '✅ Delivered';
                              } else if (itemSt === 'rejected') {
                                tagBg = 'bg-rose-50 text-rose-700 border-rose-200';
                                tagLabel = '❌ Rejected';
                              } else if (itemSt === 'cancelled') {
                                tagBg = 'bg-gray-100 text-gray-600 border-gray-200';
                                tagLabel = '🚫 Cancelled';
                              } else if (itemSt === 'placed' || itemSt === 'processing') {
                                tagBg = 'bg-amber-50 text-amber-700 border-amber-200';
                                tagLabel = '⏳ Processing';
                              }

                              return (
                                <div key={itemIdx} className="flex items-center gap-1.5 text-[11px]">
                                  <span className="font-semibold text-gray-800">
                                    {item.product?.name || 'Cosmetics Item'} (x{item.quantity})
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${tagBg}`}>
                                    {tagLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400 font-medium">{o.itemDescription || 'Beauty Items'}</div>
                        )}
                        {o.deliveryType === 'delivery' && o.deliveryAddress && (
                          <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1.5">
                            <MapPin size={10} className="text-[#CE4270] flex-shrink-0" />
                            <span>{o.deliveryAddress}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {o.deliveryType === 'delivery' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            🚚 Delivery
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            🛍️ Store Pickup
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-700 font-medium whitespace-nowrap">{o.branch}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getFulfillmentBadge(o.status, o.id)}
                          {o.status === 'rejected' && o.rejectionReason && (
                            <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              Reason: {o.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right font-extrabold text-[#CE4270] text-sm whitespace-nowrap">
                        ₹{typeof o.totalAmount === 'number' ? o.totalAmount.toLocaleString('en-IN') : o.totalAmount}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedInvoiceOrder(o);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="bg-white hover:bg-[#FDF2F4] text-[#CE4270] border border-pink-200 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-2xs"
                        >
                          <FileText size={13} /> View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. BRAND VISIBILITY PAGE */}
        {activeTab === 'brands' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-pink-100/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Brand Visibility Directory</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Toggle brand status to show/hide products across customer apps instantly.</p>
              </div>
              <span className="text-xs font-bold text-[#CE4270] bg-[#FDF2F4] px-3.5 py-1.5 rounded-xl border border-pink-100">
                {brands.filter(b => b.enabled).length} / {brands.length} Active Brands
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`p-5 bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between group ${
                    brand.enabled ? 'border-pink-100/80' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-pink-100 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0 bg-gray-50">
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#CE4270] transition-colors">{brand.name}</h4>
                      <span className="text-[10px] font-semibold text-[#8C7078] bg-[#FDF2F4] px-2 py-0.5 rounded-md mt-1 inline-block border border-pink-100/50">{brand.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBrandStatus(brand.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      brand.enabled ? 'bg-[#CE4270]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        brand.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ADD BRAND PAGE - Full Width Partner Brand Directory with Popup Modal */}
        {activeTab === 'add_brand' && (
          <div className="space-y-6 animate-fade-in">
            {showBrandSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold flex items-center justify-between border border-emerald-100 shadow-2xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Partner Brand registered successfully to directory!</span>
                </div>
                <button onClick={() => setShowBrandSuccess(false)} className="text-emerald-500 hover:text-emerald-700">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Partner Brand Directory Table Container */}
            <div className="bg-white p-6 rounded-2xl border border-pink-100/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pink-100/60">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase flex items-center gap-2">
                    <Store size={20} className="text-[#CE4270]" /> Partner Brand Directory
                  </h3>
                  <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                    {filteredBrands.length} partner brands active in store catalog
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#FDF2F4] px-3.5 py-2 rounded-xl border border-pink-100 w-full sm:w-64 focus-within:ring-2 focus-within:ring-[#CE4270]/20 transition-all">
                    <Search size={14} className="text-[#CE4270]" />
                    <input
                      type="text"
                      placeholder="Search brand name..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="bg-transparent text-xs outline-none text-gray-900 w-full font-medium placeholder:text-gray-400"
                    />
                  </div>

                  <button
                    onClick={() => setIsAddBrandModalOpen(true)}
                    className="bg-[#CE4270] hover:bg-[#b83760] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <PlusCircle size={16} />
                    <span>Add New Brand</span>
                  </button>
                </div>
              </div>

              {/* Brand Directory Table Format */}
              <div className="overflow-x-auto rounded-xl border border-pink-100/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                      <th className="py-4 px-4 text-left">BRAND & LOGO</th>
                      <th className="py-4 px-4 text-left">CATEGORY</th>
                      <th className="py-4 px-4 text-left">PRODUCTS CATALOG</th>
                      <th className="py-4 px-4 text-center">STATUS</th>
                      <th className="py-4 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/70">
                    {filteredBrands.map((brand, index) => {
                      const brandProductsCount = products.filter(p => p.brandName === brand.name).length;
                      return (
                        <tr
                          key={brand.id}
                          className={`transition-colors ${
                            index % 2 === 1 ? 'bg-[#FFF2F5]/60 hover:bg-[#FDF2F4]' : 'bg-white hover:bg-[#FFF2F5]/30'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden border border-pink-100/80 shadow-2xs flex-shrink-0 bg-gray-50">
                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-gray-900">{brand.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium">ID: {brand.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] font-semibold text-[#8C7078] bg-[#FDF2F4] px-2.5 py-1 rounded-full border border-pink-100/60">
                              {brand.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-700 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Package size={13} className="text-[#CE4270]" />
                              <span>{brandProductsCount > 0 ? `${brandProductsCount} Items` : 'Catalog Active'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                                brand.enabled
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                              }`}
                            >
                              {brand.enabled ? '✓ Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => toggleBrandStatus(brand.id)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                                brand.enabled
                                  ? 'bg-[#FDF2F4] hover:bg-[#FCE4EC] text-[#CE4270] border-pink-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}
                            >
                              {brand.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. PRODUCTS PAGE */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {showProductSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold flex items-center justify-between border border-emerald-100 shadow-2xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Product added successfully to store catalog!</span>
                </div>
                <button onClick={() => setShowProductSuccess(false)} className="text-emerald-500 hover:text-emerald-700">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Product Directory Table Container */}
            <div className="bg-white p-6 rounded-2xl border border-pink-100/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pink-100/60">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase flex items-center gap-2">
                    <Package size={20} className="text-[#CE4270]" /> Products Catalog Matrix
                  </h3>
                  <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                    {products.length} products listed with role-based multi-tier pricing
                  </span>
                </div>

                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="bg-[#CE4270] hover:bg-[#b83760] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto"
                >
                  <PlusCircle size={16} />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products Table Format */}
              <div className="overflow-x-auto rounded-xl border border-pink-100/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                      <th className="py-4 px-4 text-left">PRODUCT & BRAND</th>
                      <th className="py-4 px-4 text-left">GENERAL / MRP (₹)</th>
                      <th className="py-4 px-4 text-left">SALON PRICE (₹)</th>
                      <th className="py-4 px-4 text-left">ARTIST PRICE (₹)</th>
                      <th className="py-4 px-4 text-left">BEAUTICIAN PRICE (₹)</th>
                      <th className="py-4 px-4 text-center">STOCK</th>
                      <th className="py-4 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/70">
                    {products.map((p, index) => {
                      const isEditing = editingProductId === p.id;
                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            index % 2 === 1 ? 'bg-[#FFF2F5]/60 hover:bg-[#FDF2F4]' : 'bg-white hover:bg-[#FFF2F5]/30'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-bold text-xs text-gray-900">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                <span className="text-[#CE4270] font-semibold">{p.brandName}</span> • {p.category}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrices.mrp}
                                onChange={(e) => setEditPrices({ ...editPrices, mrp: Number(e.target.value) })}
                                className="w-20 p-1.5 border border-[#CE4270] rounded-lg font-bold text-gray-900 outline-none"
                              />
                            ) : (
                              <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                ₹{p.mrp}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrices.salonPrice}
                                onChange={(e) => setEditPrices({ ...editPrices, salonPrice: Number(e.target.value) })}
                                className="w-20 p-1.5 border border-[#CE4270] rounded-lg font-bold text-[#CE4270] outline-none"
                              />
                            ) : (
                              <span className="font-bold text-[#CE4270] bg-[#FDF2F4] px-2.5 py-1 rounded-lg border border-pink-100/60">
                                ₹{p.salonPrice}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrices.artistPrice}
                                onChange={(e) => setEditPrices({ ...editPrices, artistPrice: Number(e.target.value) })}
                                className="w-20 p-1.5 border border-[#CE4270] rounded-lg font-bold text-[#CE4270] outline-none"
                              />
                            ) : (
                              <span className="font-bold text-[#CE4270] bg-[#FDF2F4] px-2.5 py-1 rounded-lg border border-pink-100/60">
                                ₹{p.artistPrice}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrices.beauticianPrice}
                                onChange={(e) => setEditPrices({ ...editPrices, beauticianPrice: Number(e.target.value) })}
                                className="w-20 p-1.5 border border-[#CE4270] rounded-lg font-bold text-[#CE4270] outline-none"
                              />
                            ) : (
                              <span className="font-bold text-[#CE4270] bg-[#FDF2F4] px-2.5 py-1 rounded-lg border border-pink-100/60">
                                ₹{p.beauticianPrice}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full text-[10px]">
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <button
                                onClick={() => handleSavePrices(p.id)}
                                className="bg-[#CE4270] text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-2xs text-[11px] ml-auto cursor-pointer"
                              >
                                <Save size={14} /> Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEditProduct(p)}
                                className="bg-[#FDF2F4] text-[#CE4270] px-3 py-1 rounded-xl font-bold flex items-center gap-1 border border-pink-200 hover:bg-[#CE4270] hover:text-white transition-all text-[11px] ml-auto cursor-pointer shadow-2xs"
                              >
                                <Edit size={13} /> Edit Prices
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. USER PAGE */}
        {activeTab === 'user' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100/70 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#FDF2F4] px-3.5 py-2 rounded-xl border border-pink-100">
                  <Search size={14} className="text-[#CE4270]" />
                  <input
                    type="text"
                    placeholder="Search name, phone..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-[#CE4270]" />
                  <span className="text-xs font-semibold text-gray-700">Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FDF2F4] border border-pink-100 text-[#CE4270] outline-none cursor-pointer"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="salon">Salon Owner</option>
                    <option value="artist">Makeup Artist</option>
                    <option value="beautician">Beautician</option>
                    <option value="general">General Retail</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[#CE4270] bg-[#FDF2F4] px-4 py-2 rounded-xl border border-pink-100">
                <ShieldAlert size={16} />
                <span>Continuous Cancellation Limit: 3 Orders</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-pink-100/70 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                  <tr>
                    <th className="py-4 px-4">User Details</th>
                    <th className="py-4 px-4">Role & Business</th>
                    <th className="py-4 px-4">Branch</th>
                    <th className="py-4 px-4">Role Verification</th>
                    <th className="py-4 px-4">Cancellation Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isFlagged = u.cancellationCount >= 3;
                    return (
                      <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${isFlagged ? 'bg-[#FDF2F4]/40' : ''}`}>
                        <td className="p-4 font-bold text-gray-900">
                          {u.name}
                          <div className="text-[10px] text-gray-400 font-medium">{u.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#CE4270] uppercase text-[10px] bg-[#FDF2F4] px-2 py-0.5 rounded-md">
                            {u.role}
                          </span>
                          <div className="text-[11px] text-gray-500 font-medium mt-1">{u.businessName}</div>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">{u.branch}</td>
                        <td className="p-4">
                          {u.role === 'general' ? (
                            <span className="text-gray-400 text-[10px] font-semibold">Instant Retail</span>
                          ) : (
                            <button
                              onClick={() => toggleUserVerification(u.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                u.verificationStatus === 'verified'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <UserCheck size={14} />
                              {u.verificationStatus === 'verified' ? 'Verified Partner' : 'Pending Verification'}
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs ${isFlagged ? 'text-[#CE4270]' : 'text-gray-800'}`}>
                              {u.cancellationCount} cancels
                            </span>
                            {isFlagged && (
                              <span className="bg-[#CE4270] text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                <ShieldAlert size={12} /> FLAGGED
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. CANCEL FEE PAGE */}
        {activeTab === 'cancel_fee' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-pink-100/70 shadow-xs h-fit">
              <h3 className="font-bold text-sm text-gray-900 uppercase mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-[#CE4270]" /> Cancellation Rules
              </h3>

              {showFeeSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-100">
                  <CheckCircle size={16} /> Rules updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveCancelFeeSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Late Cancel Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={feeForm.feeAmount}
                    onChange={(e) => setFeeForm({ ...feeForm, feeAmount: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] font-extrabold text-[#CE4270] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Deducted or billed after grace period.</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Free Cancellation Window (Minutes)</label>
                  <input
                    type="number"
                    value={feeForm.graceWindowMinutes}
                    onChange={(e) => setFeeForm({ ...feeForm, graceWindowMinutes: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] font-extrabold text-[#CE4270] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Customer can edit/cancel free within this window.</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Max Consecutive Cancels Threshold</label>
                  <input
                    type="number"
                    value={feeForm.maxAllowedCancels}
                    onChange={(e) => setFeeForm({ ...feeForm, maxAllowedCancels: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] font-extrabold text-[#CE4270] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Triggers Cancellation Warning Modal on customer app.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#CE4270] text-white py-3 rounded-xl font-bold shadow-xs hover:bg-[#b83760] transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <Save size={16} /> Save Cancellation Rules
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-pink-100/70 shadow-xs">
              <h3 className="font-bold text-sm text-gray-900 uppercase mb-4 flex items-center justify-between">
                <span>Cancelled Orders Fee Ledger</span>
                <span className="text-xs text-gray-400 font-normal">Late Charges Tracker</span>
              </h3>

              <div className="bg-white rounded-xl border border-pink-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                    <tr>
                      <th className="py-4 px-4">Order ID</th>
                      <th className="py-4 px-4">Customer & Role</th>
                      <th className="py-4 px-4">Cancelled At</th>
                      <th className="py-4 px-4">Fee Amount (₹)</th>
                      <th className="py-4 px-4">Fee Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cancelledOrdersLog.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#CE4270]">{item.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{item.userName}</div>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">{item.userRole}</span>
                        </td>
                        <td className="p-3.5 text-gray-500 font-medium">{item.cancelledAt}</td>
                        <td className="p-3.5 font-extrabold text-[#CE4270] text-sm">₹{item.feeCharged}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleFeeWaived(item.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                              item.feeWaived
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-[#FDF2F4] text-[#CE4270] border-pink-200 hover:bg-[#FDF2F4]'
                            }`}
                          >
                            {item.feeWaived ? '✓ Fee Waived' : 'Waive Fee'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Partner Brand Popup Modal */}
        {isAddBrandModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FDF2F4] text-[#CE4270] flex items-center justify-center font-bold shadow-2xs">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Add Partner Brand
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Upload brand details and logo image
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddBrandSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <span>Brand Name</span>
                    <span className="text-[#CE4270]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nykaa Cosmetics"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Brand Logo Image</span>
                      <span className="text-[#CE4270]">*</span>
                    </span>
                    <span className="text-[10px] text-[#CE4270] font-semibold bg-[#FDF2F4] px-2 py-0.5 rounded-md border border-pink-100">
                      File Upload Only
                    </span>
                  </label>

                  <input
                    type="file"
                    id="brandLogoFileInputModal"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => document.getElementById('brandLogoFileInputModal')?.click()}
                    className="w-full p-3.5 rounded-2xl border-2 border-dashed border-pink-200 hover:border-[#CE4270] bg-[#FDF2F4]/40 hover:bg-[#FDF2F4] cursor-pointer flex items-center gap-3.5 transition-all group shadow-2xs"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-pink-100 bg-white flex-shrink-0 flex items-center justify-center shadow-2xs">
                      {newBrand.logo ? (
                        <img src={newBrand.logo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-[#CE4270]" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#CE4270] group-hover:underline">
                        <Upload size={14} /> Click to Upload Logo File
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        PNG, JPG, SVG, WebP supported
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0">Sample Logos:</span>
                    {[
                      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=200&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&auto=format&fit=crop&q=80'
                    ].map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewBrand({ ...newBrand, logo: imgUrl })}
                        className={`w-7 h-7 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                          newBrand.logo === imgUrl ? 'ring-2 ring-[#CE4270] border-transparent scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Category</label>
                  <select
                    value={newBrand.category}
                    onChange={(e) => setNewBrand({ ...newBrand, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium cursor-pointer shadow-2xs text-gray-900 transition-all text-xs"
                  >
                    <option value="Makeup">Makeup</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Lips & Eyes">Lips & Eyes</option>
                    <option value="Premium">Premium</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 rounded-xl bg-[#FDF2F4]/50 border border-pink-100/60">
                  <input
                    type="checkbox"
                    id="enabledCheckBrandModal"
                    checked={newBrand.enabled}
                    onChange={(e) => setNewBrand({ ...newBrand, enabled: e.target.checked })}
                    className="w-4 h-4 text-[#CE4270] accent-[#CE4270] rounded-md cursor-pointer"
                  />
                  <label htmlFor="enabledCheckBrandModal" className="text-gray-800 font-semibold text-xs cursor-pointer select-none">
                    Enable Visibility Immediately in App
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBrandModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <PlusCircle size={16} /> Save Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Product Popup Modal */}
        {isAddProductModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-xl p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FDF2F4] text-[#CE4270] flex items-center justify-center font-bold shadow-2xs">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Add New Product to Catalog
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Configure multi-tiered pricing across professional roles
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                      <span>Product Name</span>
                      <span className="text-[#CE4270]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lakmé Absolute Matte Lipstick"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                    />
                  </div>

                  {/* Product Image Upload Field */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-gray-800 font-bold flex items-center gap-1.5">
                      <Upload size={14} className="text-[#CE4270]" />
                      <span>Product Image</span>
                    </label>

                    {newProduct.image ? (
                      <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-pink-200 bg-[#FFF2F5]/30 flex items-center justify-center">
                        <img src={newProduct.image} alt="Product Preview" className="h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, image: '' })}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-rose-600 text-white py-1 px-2.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X size={12} /> Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-pink-200 hover:border-[#CE4270] bg-[#FFF2F5]/40 hover:bg-[#FFF2F5] rounded-2xl cursor-pointer transition-all text-center group">
                        <Upload size={22} className="text-[#CE4270] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-gray-800">Upload Image File</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Click to select product image from your device</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewProduct({ ...newProduct, image: reader.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Brand Partner</label>
                    <select
                      value={newProduct.brandName}
                      onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium cursor-pointer shadow-2xs text-gray-900 transition-all text-xs"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Lipstick & Gloss"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                      <span>Retail MRP (₹)</span>
                      <span className="text-[#CE4270]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 799"
                      value={newProduct.mrp}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setNewProduct({
                          ...newProduct,
                          mrp: val,
                          generalPrice: num ? num : '',
                          salonPrice: num ? Math.round(num * 0.70) : '',
                          artistPrice: num ? Math.round(num * 0.65) : '',
                          beauticianPrice: num ? Math.round(num * 0.68) : ''
                        });
                      }}
                      className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Initial Stock Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 30 units"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Role Pricing Section */}
                <div className="p-4 rounded-2xl bg-[#FDF2F4]/60 border border-pink-100/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#CE4270] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} /> Role-Based Discount Pricing Matrix
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Auto-suggested from MRP</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-gray-700 font-bold text-[11px] mb-1">
                        General User (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Retail MRP"
                        value={newProduct.generalPrice || newProduct.mrp}
                        onChange={(e) => setNewProduct({ ...newProduct, generalPrice: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-extrabold text-[#CE4270] text-xs shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold text-[11px] mb-1">
                        Salon Owner (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="30% off MRP"
                        value={newProduct.salonPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, salonPrice: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-extrabold text-[#CE4270] text-xs shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold text-[11px] mb-1">
                        Makeup Artist (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="35% off MRP"
                        value={newProduct.artistPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, artistPrice: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-extrabold text-[#CE4270] text-xs shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold text-[11px] mb-1">
                        Beautician (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="32% off MRP"
                        value={newProduct.beauticianPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, beauticianPrice: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-extrabold text-[#CE4270] text-xs shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#CE4270] to-[#E25586] hover:from-[#b83760] hover:to-[#ce4270] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <PlusCircle size={16} /> Save Product to Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Logout Confirmation Popup Modal */}
        {isLogoutModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-sm p-6 relative overflow-hidden animate-fade-in text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto mb-3 shadow-2xs border border-rose-100">
                <LogOut size={22} />
              </div>

              <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                Confirm Logout
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1 mb-6">
                Are you sure you want to log out of the Salbeau Admin Console?
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoutModalOpen(false);
                    setIsAuthenticated(false);
                  }}
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <LogOut size={14} /> Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Store Rejection Modal */}
        {isRejectionModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs border border-rose-100">
                    <Ban size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Reject Order #{rejectionTargetOrderId}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Specify store rejection reason
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRejectionModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Rejection Reason</label>
                  <select
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-medium text-xs text-gray-900 cursor-pointer shadow-2xs"
                  >
                    <option value="Out of stock">Out of stock</option>
                    <option value="Store closed for day">Store closed for day</option>
                    <option value="Address non-serviceable">Address non-serviceable</option>
                    <option value="Item price mismatch">Item price mismatch</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                {rejectionReasonText === 'Other' && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Custom Reason</label>
                    <input
                      type="text"
                      required
                      placeholder="State custom reason..."
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#CE4270] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectionModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Ban size={15} /> Confirm Store Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Invoice Modal */}
        {isInvoiceModalOpen && selectedInvoiceOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CE4270] text-white flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Great Vibes', cursive" }} className="text-2xl text-[#CE4270] font-normal leading-none">
                      Salbeau Executive Receipt
                    </h2>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Official Tax Invoice • {selectedInvoiceOrder.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-[#FFF2F5]/60 p-4 rounded-2xl border border-pink-100/70 mb-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Customer Name:</span>
                  <span className="font-extrabold text-gray-900">{selectedInvoiceOrder.userName} ({selectedInvoiceOrder.userRole})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Contact Phone:</span>
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.phone || '+91 98765 43210'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Boulevard Branch:</span>
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.branch}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Order Date & Time:</span>
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.placedAt || '2026-09-16 10:30 AM'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Fulfillment Type:</span>
                  <span className="font-extrabold text-[#CE4270]">
                    {selectedInvoiceOrder.deliveryType === 'delivery' ? '🚚 Home Delivery' : '🛍️ Store Pickup'}
                  </span>
                </div>
                {selectedInvoiceOrder.deliveryType === 'delivery' && selectedInvoiceOrder.deliveryAddress && (
                  <div className="pt-1 border-t border-pink-100/60">
                    <span className="text-gray-500 font-semibold block mb-0.5">Delivery Address:</span>
                    <span className="font-bold text-gray-800 text-[11px]">{selectedInvoiceOrder.deliveryAddress}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-pink-100 overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoiceOrder.items ? (
                      selectedInvoiceOrder.items.map((item, idx) => {
                        const itemStatus = item.status || selectedInvoiceOrder.status || 'placed';
                        let itemBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        if (itemStatus === 'delivered') itemBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        if (itemStatus === 'processing') itemBadgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                        if (itemStatus === 'rejected') itemBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                        if (itemStatus === 'cancelled') itemBadgeColor = 'bg-gray-100 text-gray-500 border-gray-200';

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900">
                              {item.product?.name || 'Cosmetics Item'}
                              {item.rejectionReason && (
                                <div className="text-[10px] text-rose-600 font-normal">Reason: {item.rejectionReason}</div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={itemStatus}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let reason = '';
                                  if (val === 'rejected') {
                                    reason = prompt('Enter rejection reason for item:', 'Out of stock') || 'Out of stock';
                                  }
                                  updateOrderItemStatus(selectedInvoiceOrder.id, idx, val, reason);
                                  setSelectedInvoiceOrder(prev => {
                                    const copyItems = [...(prev.items || [])];
                                    copyItems[idx] = { ...copyItems[idx], status: val, rejectionReason: reason };
                                    return { ...prev, items: copyItems };
                                  });
                                }}
                                className={`text-[10px] font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${itemBadgeColor}`}
                              >
                                <option value="placed">Placed</option>
                                <option value="processing">Processing</option>
                                <option value="delivered">Delivered</option>
                                <option value="rejected">Rejected by Store</option>
                                <option value="cancelled">Cancelled by Customer</option>
                              </select>
                            </td>
                            <td className="p-3 text-center font-bold text-gray-700">{item.quantity}</td>
                            <td className="p-3 text-right font-medium text-gray-700">₹{item.unitPrice}</td>
                            <td className="p-3 text-right font-extrabold text-[#CE4270]">₹{item.quantity * item.unitPrice}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="p-3 font-bold text-gray-900">{selectedInvoiceOrder.itemDescription || 'Cosmetics Package'}</td>
                        <td className="p-3 text-center font-bold text-gray-700">{selectedInvoiceOrder.status}</td>
                        <td className="p-3 text-center font-bold text-gray-700">1</td>
                        <td className="p-3 text-right font-medium text-gray-700">₹{selectedInvoiceOrder.totalAmount}</td>
                        <td className="p-3 text-right font-extrabold text-[#CE4270]">₹{selectedInvoiceOrder.totalAmount}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs mb-4">
                <div className="flex justify-between text-gray-600 font-semibold">
                  <span>Subtotal</span>
                  <span>₹{selectedInvoiceOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-semibold">
                  <span>GST / Tax (Included)</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-gray-600 font-semibold">
                  <span>Delivery / Handling Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-200">
                  <span>Total Paid / Payable</span>
                  <span className="text-[#CE4270]">₹{selectedInvoiceOrder.totalAmount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-2/3 bg-gradient-to-r from-[#CE4270] to-[#E25586] text-white py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Printer size={15} /> Print Official Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
